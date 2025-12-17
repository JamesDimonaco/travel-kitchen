import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Recipes table - stores generated recipes
  recipes: defineTable({
    userId: v.string(),
    title: v.string(),
    description: v.string(),

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
    .index("by_published", ["isPublished"]),
});
