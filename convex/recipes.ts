import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

/**
 * Authentication Pattern:
 * - Queries: Use try/catch around getAuthUser and return null/empty for unauthenticated users.
 *   This allows graceful handling of unauthenticated state without throwing errors.
 * - Mutations: Call getAuthUser directly and throw if null. Mutations require authentication
 *   and should fail loudly if the user is not authenticated.
 */

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
    let user;
    try {
      user = await authComponent.getAuthUser(ctx);
    } catch {
      return []; // Not authenticated
    }
    if (!user) return [];

    return await ctx.db
      .query("recipes")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

// Get anonymous recipes by session ID (for display before claiming)
export const listAnonymousRecipes = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("recipes")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("desc")
      .collect();
  },
});

// Get a single recipe by ID
export const getRecipe = query({
  args: { id: v.id("recipes"), sessionId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const recipe = await ctx.db.get(args.id);
    if (!recipe) return null;

    // If published, anyone can view
    if (recipe.isPublished) return recipe;

    // Check if authenticated user owns it
    let user;
    try {
      user = await authComponent.getAuthUser(ctx);
    } catch {
      // Not authenticated, continue to check sessionId
    }
    if (user && user._id === recipe.userId) return recipe;

    // Check if anonymous user owns it (via sessionId)
    if (args.sessionId && recipe.sessionId === args.sessionId) {
      // Check if anonymous recipe has expired
      if (recipe.expiresAt && recipe.expiresAt < Date.now()) {
        return null;
      }
      return recipe;
    }

    return null;
  },
});

// Get a published recipe by ID (public, no auth required - for SEO/metadata)
export const getPublicRecipe = query({
  args: { id: v.id("recipes") },
  handler: async (ctx, args) => {
    const recipe = await ctx.db.get(args.id);
    if (!recipe) return null;

    // Only return if published
    if (!recipe.isPublished) return null;

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

// Update an existing recipe (owner only)
export const updateRecipe = mutation({
  args: {
    id: v.id("recipes"),
    title: v.string(),
    description: v.string(),
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

    const recipe = await ctx.db.get(args.id);
    if (!recipe) throw new Error("Recipe not found");
    if (recipe.userId !== user._id) throw new Error("Not authorized");

    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);

    return id;
  },
});

// Constants
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// Save a recipe for anonymous users (with sessionId)
export const saveAnonymousRecipe = mutation({
  args: {
    sessionId: v.string(),
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
    const { sessionId, ...recipeData } = args;

    return await ctx.db.insert("recipes", {
      userId: "", // Empty for anonymous
      sessionId,
      expiresAt: Date.now() + THIRTY_DAYS_MS,
      title: recipeData.title,
      description: recipeData.description,
      inputs: recipeData.inputs,
      prepTime: recipeData.prepTime,
      cookTime: recipeData.cookTime,
      servings: recipeData.servings,
      equipmentUsed: recipeData.equipmentUsed,
      shoppingList: recipeData.shoppingList,
      prepGroup: recipeData.prepGroup,
      steps: recipeData.steps,
      substitutions: recipeData.substitutions,
      tips: recipeData.tips,
      isPublished: false, // Anonymous recipes can't be published
    });
  },
});

// Create a new recipe manually (not AI-generated) - authenticated users
export const createRecipe = mutation({
  args: {
    title: v.string(),
    description: v.string(),
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

    // Build inputs from the recipe data (for consistency with AI-generated recipes)
    const inputs = {
      equipment: args.equipmentUsed,
      ingredients: [
        ...args.shoppingList.have,
        ...args.shoppingList.need,
      ],
      servings: args.servings,
      maxTime: args.prepTime + args.cookTime,
    };

    return await ctx.db.insert("recipes", {
      userId: user._id,
      title: args.title,
      description: args.description,
      inputs,
      prepTime: args.prepTime,
      cookTime: args.cookTime,
      servings: args.servings,
      equipmentUsed: args.equipmentUsed,
      shoppingList: args.shoppingList,
      prepGroup: args.prepGroup,
      steps: args.steps,
      substitutions: args.substitutions,
      tips: args.tips,
      isManual: true,
      isPublished: false,
    });
  },
});

// Create a new recipe manually for anonymous users
export const createAnonymousRecipe = mutation({
  args: {
    sessionId: v.string(),
    title: v.string(),
    description: v.string(),
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
    const { sessionId, ...recipeData } = args;

    // Build inputs from the recipe data
    const inputs = {
      equipment: recipeData.equipmentUsed,
      ingredients: [
        ...recipeData.shoppingList.have,
        ...recipeData.shoppingList.need,
      ],
      servings: recipeData.servings,
      maxTime: recipeData.prepTime + recipeData.cookTime,
    };

    return await ctx.db.insert("recipes", {
      userId: "", // Empty for anonymous
      sessionId,
      expiresAt: Date.now() + THIRTY_DAYS_MS,
      title: recipeData.title,
      description: recipeData.description,
      inputs,
      prepTime: recipeData.prepTime,
      cookTime: recipeData.cookTime,
      servings: recipeData.servings,
      equipmentUsed: recipeData.equipmentUsed,
      shoppingList: recipeData.shoppingList,
      prepGroup: recipeData.prepGroup,
      steps: recipeData.steps,
      substitutions: recipeData.substitutions,
      tips: recipeData.tips,
      isManual: true,
      isPublished: false, // Anonymous recipes can't be published
    });
  },
});
