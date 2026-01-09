import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

// Constants
const FREE_TIER_LIMIT = 3; // Total AI generations for free users (includes anonymous)
const ANONYMOUS_LIMIT = 1; // AI generations allowed before sign-up
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// ==================== QUERIES ====================

/**
 * Get usage stats for the current authenticated user
 */
export const getMyUsage = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) return null;

    const usage = await ctx.db
      .query("usageCredits")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!usage) {
      // New user - return default values
      return {
        aiGenerationsUsed: 0,
        aiGenerationsLimit: FREE_TIER_LIMIT,
        aiGenerationsRemaining: FREE_TIER_LIMIT,
        manualRecipesCount: 0,
        canGenerate: true,
      };
    }

    return {
      aiGenerationsUsed: usage.aiGenerationsUsed,
      aiGenerationsLimit: usage.aiGenerationsLimit,
      aiGenerationsRemaining: Math.max(0, usage.aiGenerationsLimit - usage.aiGenerationsUsed),
      manualRecipesCount: usage.manualRecipesCount,
      canGenerate: usage.aiGenerationsUsed < usage.aiGenerationsLimit,
    };
  },
});

/**
 * Get usage stats for an anonymous session
 */
export const getAnonymousUsage = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const usage = await ctx.db
      .query("anonymousUsage")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (!usage) {
      return {
        aiGenerationsUsed: 0,
        aiGenerationsLimit: ANONYMOUS_LIMIT,
        aiGenerationsRemaining: ANONYMOUS_LIMIT,
        canGenerate: true,
      };
    }

    return {
      aiGenerationsUsed: usage.aiGenerationsUsed,
      aiGenerationsLimit: ANONYMOUS_LIMIT,
      aiGenerationsRemaining: Math.max(0, ANONYMOUS_LIMIT - usage.aiGenerationsUsed),
      canGenerate: usage.aiGenerationsUsed < ANONYMOUS_LIMIT,
    };
  },
});

/**
 * Check if user/session can generate a recipe
 * Returns { canGenerate, reason, remaining }
 */
export const canGenerate = query({
  args: { sessionId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);

    if (user) {
      // Authenticated user
      const usage = await ctx.db
        .query("usageCredits")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first();

      const used = usage?.aiGenerationsUsed ?? 0;
      const limit = usage?.aiGenerationsLimit ?? FREE_TIER_LIMIT;
      const remaining = Math.max(0, limit - used);

      return {
        canGenerate: used < limit,
        reason: used >= limit ? "You've used all your AI generations. Purchase more credits to continue." : null,
        remaining,
        isAuthenticated: true,
      };
    }

    // Anonymous user
    const { sessionId } = args;
    if (!sessionId) {
      return {
        canGenerate: true,
        reason: null,
        remaining: ANONYMOUS_LIMIT,
        isAuthenticated: false,
      };
    }

    const usage = await ctx.db
      .query("anonymousUsage")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .first();

    const used = usage?.aiGenerationsUsed ?? 0;
    const remaining = Math.max(0, ANONYMOUS_LIMIT - used);

    return {
      canGenerate: used < ANONYMOUS_LIMIT,
      reason: used >= ANONYMOUS_LIMIT
        ? `Sign up to create more recipes! You'll get ${FREE_TIER_LIMIT - used} more free AI generations.`
        : null,
      remaining,
      isAuthenticated: false,
    };
  },
});

// ==================== MUTATIONS ====================

/**
 * Record an AI generation for an authenticated user
 */
export const recordGeneration = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const usage = await ctx.db
      .query("usageCredits")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (usage) {
      // Check limit before recording
      if (usage.aiGenerationsUsed >= usage.aiGenerationsLimit) {
        throw new Error("Generation limit reached");
      }

      await ctx.db.patch(usage._id, {
        aiGenerationsUsed: usage.aiGenerationsUsed + 1,
        lastGenerationAt: Date.now(),
      });
    } else {
      // Create new usage record
      await ctx.db.insert("usageCredits", {
        userId: user._id,
        aiGenerationsUsed: 1,
        aiGenerationsLimit: FREE_TIER_LIMIT,
        manualRecipesCount: 0,
        lastGenerationAt: Date.now(),
      });
    }
  },
});

/**
 * Record an AI generation for an anonymous user
 */
export const recordAnonymousGeneration = mutation({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const usage = await ctx.db
      .query("anonymousUsage")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (usage) {
      // Check limit before recording
      if (usage.aiGenerationsUsed >= ANONYMOUS_LIMIT) {
        throw new Error("Anonymous generation limit reached. Please sign up to continue.");
      }

      await ctx.db.patch(usage._id, {
        aiGenerationsUsed: usage.aiGenerationsUsed + 1,
      });
    } else {
      // Create new anonymous usage record
      await ctx.db.insert("anonymousUsage", {
        sessionId: args.sessionId,
        aiGenerationsUsed: 1,
        createdAt: Date.now(),
        expiresAt: Date.now() + THIRTY_DAYS_MS,
      });
    }
  },
});

/**
 * Record a manual recipe creation (for stats only)
 */
export const recordManualRecipe = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) return; // Anonymous manual recipes don't need tracking

    const usage = await ctx.db
      .query("usageCredits")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (usage) {
      await ctx.db.patch(usage._id, {
        manualRecipesCount: usage.manualRecipesCount + 1,
      });
    } else {
      await ctx.db.insert("usageCredits", {
        userId: user._id,
        aiGenerationsUsed: 0,
        aiGenerationsLimit: FREE_TIER_LIMIT,
        manualRecipesCount: 1,
      });
    }
  },
});

/**
 * Claim anonymous recipes when user signs up/logs in
 * Transfers anonymous usage to authenticated usage
 */
export const claimAnonymousRecipes = mutation({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    // Find all recipes with this sessionId
    const recipes = await ctx.db
      .query("recipes")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    // Claim each recipe
    for (const recipe of recipes) {
      await ctx.db.patch(recipe._id, {
        userId: user._id,
        sessionId: undefined,
        claimedAt: Date.now(),
        expiresAt: undefined, // No longer expires
      });
    }

    // Transfer anonymous usage to user account
    const anonUsage = await ctx.db
      .query("anonymousUsage")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (anonUsage) {
      // Get or create user credits
      const userCredits = await ctx.db
        .query("usageCredits")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first();

      if (userCredits) {
        // Add anonymous usage to existing
        await ctx.db.patch(userCredits._id, {
          aiGenerationsUsed: userCredits.aiGenerationsUsed + anonUsage.aiGenerationsUsed,
        });
      } else {
        // Create new with anonymous usage included
        await ctx.db.insert("usageCredits", {
          userId: user._id,
          aiGenerationsUsed: anonUsage.aiGenerationsUsed,
          aiGenerationsLimit: FREE_TIER_LIMIT,
          manualRecipesCount: 0,
        });
      }

      // Delete anonymous usage record
      await ctx.db.delete(anonUsage._id);
    }

    return { claimed: recipes.length };
  },
});

/**
 * Add credits to a user (for Stripe integration)
 * INTERNAL ONLY - called by Stripe webhook handler, not exposed to clients
 */
export const addCredits = internalMutation({
  args: {
    userId: v.string(),
    credits: v.number(),
    stripeCustomerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const usage = await ctx.db
      .query("usageCredits")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (usage) {
      await ctx.db.patch(usage._id, {
        aiGenerationsLimit: usage.aiGenerationsLimit + args.credits,
        stripeCustomerId: args.stripeCustomerId || usage.stripeCustomerId,
        creditsLastPurchasedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("usageCredits", {
        userId: args.userId,
        aiGenerationsUsed: 0,
        aiGenerationsLimit: FREE_TIER_LIMIT + args.credits,
        manualRecipesCount: 0,
        stripeCustomerId: args.stripeCustomerId,
        creditsLastPurchasedAt: Date.now(),
      });
    }
  },
});
