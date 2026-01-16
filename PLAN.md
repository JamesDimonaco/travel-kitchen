# Plan: Anonymous Recipe Creation + Credits System

## Overview

Allow unauthenticated users to try the app before signing up, with a path to convert them to paying customers.

### Business Rules

| User State | AI Generations | Manual Recipes | Can Publish? |
|------------|----------------|----------------|--------------|
| Anonymous | 1 free | Unlimited | No |
| Free (authenticated) | 3 total (includes anonymous) | Unlimited | Yes |
| Paid | Buy credits via Stripe | Unlimited | Yes |

### Key Behaviors
- Anonymous recipes saved to DB with session ID (not userId)
- When user signs up on same device, recipes are claimed automatically
- Unclaimed recipes deleted after 30 days
- Manual recipes always free, but anonymous ones can't be published
- Viewing/browsing marketplace always free

---

## Technical Approach

### Option A: Browser Session ID (Recommended)

**How it works:**
1. Generate a UUID when user first visits (stored in localStorage)
2. Save anonymous recipes with this `sessionId` instead of `userId`
3. On sign-up, migration mutation claims all recipes with matching sessionId
4. Convex scheduled function cleans up unclaimed recipes after 30 days

**Pros:**
- Simple implementation
- Works across page refreshes
- No fingerprinting concerns

**Cons:**
- Lost if user clears localStorage
- Device-specific (won't sync across devices)

**Recommendation:** Go with Option A (localStorage session ID)

---

## Implementation Plan

### Phase 1: Schema & Infrastructure Changes

#### 1.1 Update Convex Schema

```typescript
// convex/schema.ts - Add new fields to recipes table
recipes: defineTable({
  // Existing fields...

  // NEW: For anonymous recipe ownership
  sessionId: v.optional(v.string()),  // UUID from localStorage
  claimedAt: v.optional(v.number()),  // When recipe was claimed by auth user
  expiresAt: v.optional(v.number()),  // 30 days from creation (for anon recipes)
})
  .index("by_user", ["userId"])
  .index("by_session", ["sessionId"])  // NEW
  .index("by_published", ["isPublished"])
  .index("by_expires", ["expiresAt"])  // NEW: for cleanup job

// NEW: Usage tracking table
usageCredits: defineTable({
  userId: v.string(),
  aiGenerationsUsed: v.number(),      // Count of AI generations
  aiGenerationsLimit: v.number(),     // Current limit (3 for free, more if paid)
  manualRecipesCount: v.number(),     // For stats only
  lastGenerationAt: v.optional(v.number()),
  stripeCustomerId: v.optional(v.string()),
  creditsLastPurchasedAt: v.optional(v.number()),
}).index("by_user", ["userId"])

// For anonymous users before sign-up
anonymousUsage: defineTable({
  sessionId: v.string(),
  aiGenerationsUsed: v.number(),
  createdAt: v.number(),
  expiresAt: v.number(),  // 30 days from creation
}).index("by_session", ["sessionId"])
```

#### 1.2 Create Session ID Utility

```typescript
// lib/session-id.ts
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';

  const STORAGE_KEY = 'tk_session_id';
  let sessionId = localStorage.getItem(STORAGE_KEY);

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, sessionId);
  }

  return sessionId;
}

export function getSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('tk_session_id');
}
```

### Phase 2: Convex Mutations

#### 2.1 New/Modified Mutations

```typescript
// convex/recipes.ts

// Modified: Allow anonymous recipe creation
export const createRecipeAnonymous = mutation({
  args: {
    sessionId: v.string(),
    // ... recipe fields
  },
  handler: async (ctx, args) => {
    // Check anonymous usage limit
    const usage = await ctx.db
      .query("anonymousUsage")
      .withIndex("by_session", q => q.eq("sessionId", args.sessionId))
      .first();

    if (usage && usage.aiGenerationsUsed >= 1) {
      throw new Error("Anonymous users can only generate 1 recipe. Sign up for more!");
    }

    // Create recipe with sessionId (not userId)
    const recipeId = await ctx.db.insert("recipes", {
      ...args,
      userId: "", // Empty for anonymous
      sessionId: args.sessionId,
      isPublished: false,
      expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
    });

    // Update/create usage tracking
    if (usage) {
      await ctx.db.patch(usage._id, { aiGenerationsUsed: 1 });
    } else {
      await ctx.db.insert("anonymousUsage", {
        sessionId: args.sessionId,
        aiGenerationsUsed: 1,
        createdAt: Date.now(),
        expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000),
      });
    }

    return recipeId;
  }
});

// Claim recipes when user signs up
export const claimAnonymousRecipes = mutation({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    // Find all recipes with this sessionId
    const recipes = await ctx.db
      .query("recipes")
      .withIndex("by_session", q => q.eq("sessionId", args.sessionId))
      .collect();

    // Claim them
    for (const recipe of recipes) {
      await ctx.db.patch(recipe._id, {
        userId: user._id,
        sessionId: undefined,
        claimedAt: Date.now(),
        expiresAt: undefined,
      });
    }

    // Transfer usage to user account
    const anonUsage = await ctx.db
      .query("anonymousUsage")
      .withIndex("by_session", q => q.eq("sessionId", args.sessionId))
      .first();

    if (anonUsage) {
      // Create or update user credits
      const userCredits = await ctx.db
        .query("usageCredits")
        .withIndex("by_user", q => q.eq("userId", user._id))
        .first();

      if (userCredits) {
        await ctx.db.patch(userCredits._id, {
          aiGenerationsUsed: userCredits.aiGenerationsUsed + anonUsage.aiGenerationsUsed,
        });
      } else {
        await ctx.db.insert("usageCredits", {
          userId: user._id,
          aiGenerationsUsed: anonUsage.aiGenerationsUsed,
          aiGenerationsLimit: 3, // Free tier
          manualRecipesCount: 0,
        });
      }

      // Delete anonymous usage record
      await ctx.db.delete(anonUsage._id);
    }

    return { claimed: recipes.length };
  }
});
```

#### 2.2 Cleanup Scheduled Function

```typescript
// convex/crons.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run daily at 3am UTC
crons.daily(
  "cleanup-expired-recipes",
  { hourUTC: 3, minuteUTC: 0 },
  internal.cleanup.deleteExpiredRecipes
);

export default crons;

// convex/cleanup.ts
export const deleteExpiredRecipes = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();

    // Find expired anonymous recipes
    const expiredRecipes = await ctx.db
      .query("recipes")
      .withIndex("by_expires")
      .filter(q => q.lt(q.field("expiresAt"), now))
      .collect();

    for (const recipe of expiredRecipes) {
      await ctx.db.delete(recipe._id);
    }

    // Clean up expired anonymous usage records
    const expiredUsage = await ctx.db
      .query("anonymousUsage")
      .filter(q => q.lt(q.field("expiresAt"), now))
      .collect();

    for (const usage of expiredUsage) {
      await ctx.db.delete(usage._id);
    }

    return { deletedRecipes: expiredRecipes.length, deletedUsage: expiredUsage.length };
  }
});
```

### Phase 3: API Route Changes

#### 3.1 Allow Anonymous Generation

```typescript
// app/api/ai/new-receipe/route.ts (modified)

export async function POST(req: Request) {
  const body = await req.json();
  const { sessionId, ...formData } = body;

  // Check if authenticated
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    // Anonymous user - check sessionId and limits
    if (!sessionId) {
      return Response.json({ error: "Session ID required" }, { status: 400 });
    }

    // Check anonymous limit via Convex query
    // ... limit checking logic
  } else {
    // Authenticated user - check their credits
    // ... credit checking logic
  }

  // Generate recipe...
}
```

### Phase 4: Frontend Changes

#### 4.1 Update Forms to Support Anonymous

- Remove auth requirement from generate page
- Show "Sign up to save more recipes" prompts
- Pass sessionId to API calls for anonymous users
- Call `claimAnonymousRecipes` mutation after sign-up

#### 4.2 UI Messaging

| State | Message |
|-------|---------|
| Anonymous, 0 recipes | "Create your first recipe free!" |
| Anonymous, 1 recipe | "Sign up to create more recipes and publish to marketplace" |
| Authenticated, < 3 | "You have X recipes remaining" |
| Authenticated, 3 used | "Buy credits to generate more recipes" |

### Phase 5: Stripe Integration (Future)

#### 5.1 Credit Packages
- 5 credits: $X
- 15 credits: $Y (better value)
- 50 credits: $Z (best value)

#### 5.2 Stripe Webhook
- Listen for `checkout.session.completed`
- Update `usageCredits.aiGenerationsLimit` in Convex

---

## Questions to Consider

1. **Should manual recipes count toward any limit?**
   - Current plan: No limits on manual, just can't publish if anonymous

2. **What happens if user signs in on different device?**
   - Anonymous recipes stay orphaned on original device
   - Could add email-based claiming as fallback?

3. **Should we show anonymous recipes in "my recipes" after sign-up?**
   - Yes, they get claimed automatically

4. **Rate limiting beyond credits?**
   - Consider per-minute/hour throttling to prevent abuse

5. **What about the "Multiple Ideas" feature?**
   - Should it cost 1 credit for 4 ideas, or 4 credits?

---

## Implementation Order

1. **Schema changes** - Add new fields and tables
2. **Session ID utility** - localStorage helper
3. **Convex mutations** - Anonymous creation, claiming, usage tracking
4. **Cleanup cron job** - Delete expired recipes
5. **API route changes** - Allow anonymous, check limits
6. **Frontend updates** - Remove auth requirement, add prompts
7. **Testing** - Full flow: anonymous → sign up → claimed
8. **Stripe integration** - Payment flow (separate phase)

---

## Estimated Scope

- Schema + mutations: Medium complexity
- Frontend changes: Medium complexity
- Stripe integration: Separate future phase

This plan enables a try-before-you-buy experience while creating a clear upgrade path.
