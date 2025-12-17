import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

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
