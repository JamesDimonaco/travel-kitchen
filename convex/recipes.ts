import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

// Save a new recipe
export const saveRecipe = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    inputs: v.object({
      equipment: v.array(v.string()),
      dietaryPreferences: v.optional(v.array(v.string())),
      allergens: v.optional(v.array(v.string())),
      country: v.optional(v.string()),
      ingredients: v.array(v.string()),
      servings: v.optional(v.number()),
      maxTime: v.optional(v.number()),
    }),
    prepTime: v.number(),
    cookTime: v.number(),
    servings: v.number(),
    equipmentUsed: v.array(v.string()),
    shoppingList: v.object({
      have: v.array(v.string()),
      need: v.array(v.string()),
      optional: v.array(v.string()),
    }),
    prepGroup: v.array(
      v.object({
        task: v.string(),
        ingredients: v.array(v.string()),
      })
    ),
    steps: v.array(
      v.object({
        number: v.number(),
        instruction: v.string(),
        duration: v.optional(v.number()),
        equipment: v.optional(v.string()),
      })
    ),
    substitutions: v.array(
      v.object({
        original: v.string(),
        substitute: v.string(),
        note: v.optional(v.string()),
      })
    ),
    tips: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    return await ctx.db.insert("recipes", {
      userId: user._id,
      title: args.title,
      description: args.description,
      inputs: args.inputs,
      prepTime: args.prepTime,
      cookTime: args.cookTime,
      servings: args.servings,
      equipmentUsed: args.equipmentUsed,
      shoppingList: args.shoppingList,
      prepGroup: args.prepGroup,
      steps: args.steps,
      substitutions: args.substitutions,
      tips: args.tips,
      isPublished: false,
    });
  },
});

// Get all recipes for the current user
export const listMyRecipes = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) return [];

    return await ctx.db
      .query("recipes")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

// Get a single recipe by ID
export const getRecipe = query({
  args: { id: v.id("recipes") },
  handler: async (ctx, args) => {
    const recipe = await ctx.db.get(args.id);
    if (!recipe) return null;

    // If published, anyone can view
    if (recipe.isPublished) return recipe;

    // Otherwise, only owner can view
    const user = await authComponent.getAuthUser(ctx);
    if (!user || user._id !== recipe.userId) return null;

    return recipe;
  },
});

// Get all published recipes (marketplace)
export const listPublishedRecipes = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("recipes")
      .withIndex("by_published", (q) => q.eq("isPublished", true))
      .order("desc")
      .collect();
  },
});

// Toggle publish status
export const togglePublish = mutation({
  args: { id: v.id("recipes") },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const recipe = await ctx.db.get(args.id);
    if (!recipe) throw new Error("Recipe not found");
    if (recipe.userId !== user._id) throw new Error("Not authorized");

    await ctx.db.patch(args.id, {
      isPublished: !recipe.isPublished,
      publishedAt: !recipe.isPublished ? Date.now() : undefined,
    });
  },
});

// Delete a recipe
export const deleteRecipe = mutation({
  args: { id: v.id("recipes") },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const recipe = await ctx.db.get(args.id);
    if (!recipe) throw new Error("Recipe not found");
    if (recipe.userId !== user._id) throw new Error("Not authorized");

    await ctx.db.delete(args.id);
  },
});
