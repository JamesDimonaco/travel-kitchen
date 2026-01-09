import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Recipes table - stores generated recipes
  recipes: defineTable({
    // Owner - either authenticated userId or empty string for anonymous
    userId: v.string(),

    // Anonymous session tracking
    sessionId: v.optional(v.string()), // UUID from localStorage for anonymous users
    claimedAt: v.optional(v.number()), // When recipe was claimed by authenticated user
    expiresAt: v.optional(v.number()), // 30 days from creation (for anonymous recipes only)

    // Recipe metadata
    title: v.string(),
    description: v.string(),
    isManual: v.optional(v.boolean()), // true if manually created, false/undefined if AI-generated

    // Input constraints used to generate
    inputs: v.object({
      equipment: v.array(v.string()),
      dietaryPreferences: v.optional(v.array(v.string())),
      allergens: v.optional(v.array(v.string())),
      country: v.optional(v.string()),
      ingredients: v.array(v.string()),
      servings: v.optional(v.number()),
      maxTime: v.optional(v.number()),
    }),

    // Generated output
    prepTime: v.number(),
    cookTime: v.number(),
    servings: v.number(),
    equipmentUsed: v.array(v.string()),

    shoppingList: v.object({
      have: v.array(v.string()),
      need: v.array(v.string()),
      optional: v.array(v.string()),
    }),

    prepGroup: v.array(v.object({
      task: v.string(),
      ingredients: v.array(v.string()),
    })),

    steps: v.array(v.object({
      number: v.number(),
      instruction: v.string(),
      duration: v.optional(v.number()),
      equipment: v.optional(v.string()),
    })),

    substitutions: v.array(v.object({
      original: v.string(),
      substitute: v.string(),
      note: v.optional(v.string()),
    })),

    tips: v.optional(v.array(v.string())),

    // Publishing
    isPublished: v.boolean(),
    publishedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_session", ["sessionId"])
    .index("by_published", ["isPublished"])
    .index("by_expires", ["expiresAt"]),

  // Usage credits for authenticated users
  usageCredits: defineTable({
    userId: v.string(),
    aiGenerationsUsed: v.number(), // Count of AI generations used
    aiGenerationsLimit: v.number(), // Current limit (3 for free tier)
    manualRecipesCount: v.number(), // For stats only (no limit)
    lastGenerationAt: v.optional(v.number()),
    // Stripe integration (future)
    stripeCustomerId: v.optional(v.string()),
    creditsLastPurchasedAt: v.optional(v.number()),
  }).index("by_user", ["userId"]),

  // Usage tracking for anonymous users (before sign-up)
  anonymousUsage: defineTable({
    sessionId: v.string(), // UUID from localStorage
    aiGenerationsUsed: v.number(), // Max 1 for anonymous
    createdAt: v.number(),
    expiresAt: v.number(), // 30 days from creation
  }).index("by_session", ["sessionId"]),

  // Recipe idea sessions - stores exploration sessions with multiple ideas
  recipeIdeaSessions: defineTable({
    userId: v.string(),
    // Base inputs for the session
    inputs: v.object({
      equipment: v.array(v.string()),
      dietaryPreferences: v.optional(v.array(v.string())),
      allergens: v.optional(v.array(v.string())),
      country: v.optional(v.string()),
      baseIngredient: v.optional(v.string()), // e.g., "pasta", "rice", "chicken"
      additionalIngredients: v.optional(v.array(v.string())),
      timeLimit: v.optional(v.number()),
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // Individual recipe ideas within a session
  recipeIdeas: defineTable({
    sessionId: v.id("recipeIdeaSessions"),
    userId: v.string(),
    // Preview info (generated quickly)
    title: v.string(),
    description: v.string(),
    keyIngredients: v.array(v.string()),
    estimatedTime: v.number(),
    servings: v.number(),
    equipmentNeeded: v.array(v.string()),
    dietaryTags: v.array(v.string()),
    difficulty: v.string(), // "easy", "medium", "hard"
    // Full recipe (generated on demand)
    fullRecipe: v.optional(v.object({
      shopping: v.object({
        have: v.array(v.string()),
        need: v.array(v.string()),
        optional: v.array(v.string()),
      }),
      prepGroup: v.array(v.string()),
      steps: v.array(v.object({
        title: v.string(),
        detail: v.string(),
        time_minutes: v.number(),
      })),
      substitutions: v.array(v.object({
        ingredient: v.string(),
        swap_options: v.array(v.string()),
      })),
      tips: v.array(v.string()),
    })),
    createdAt: v.number(),
  })
    .index("by_session", ["sessionId"])
    .index("by_user", ["userId"]),
});
