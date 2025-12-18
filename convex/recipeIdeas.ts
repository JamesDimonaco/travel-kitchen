import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

// Get or create the current user's active session
export const getActiveSession = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) return null;

    // Get the most recent session
    const sessions = await ctx.db
      .query("recipeIdeaSessions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(1);

    return sessions[0] || null;
  },
});

// Get ideas for a session
export const getSessionIdeas = query({
  args: { sessionId: v.id("recipeIdeaSessions") },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) return [];

    return await ctx.db
      .query("recipeIdeas")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("desc")
      .collect();
  },
});

// Create a new session
export const createSession = mutation({
  args: {
    inputs: v.object({
      equipment: v.array(v.string()),
      dietaryPreferences: v.optional(v.array(v.string())),
      allergens: v.optional(v.array(v.string())),
      country: v.optional(v.string()),
      baseIngredient: v.optional(v.string()),
      additionalIngredients: v.optional(v.array(v.string())),
      timeLimit: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const now = Date.now();
    return await ctx.db.insert("recipeIdeaSessions", {
      userId: user._id,
      inputs: args.inputs,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Add ideas to a session (called after AI generates them)
export const addIdeas = mutation({
  args: {
    sessionId: v.id("recipeIdeaSessions"),
    ideas: v.array(
      v.object({
        title: v.string(),
        description: v.string(),
        keyIngredients: v.array(v.string()),
        estimatedTime: v.number(),
        servings: v.number(),
        equipmentNeeded: v.array(v.string()),
        dietaryTags: v.array(v.string()),
        difficulty: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    // Verify session belongs to user
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== user._id) {
      throw new Error("Session not found");
    }

    const now = Date.now();
    const ideaIds = [];

    for (const idea of args.ideas) {
      const id = await ctx.db.insert("recipeIdeas", {
        sessionId: args.sessionId,
        userId: user._id,
        ...idea,
        createdAt: now,
      });
      ideaIds.push(id);
    }

    // Update session timestamp
    await ctx.db.patch(args.sessionId, { updatedAt: now });

    return ideaIds;
  },
});

// Get a single idea
export const getIdea = query({
  args: { ideaId: v.id("recipeIdeas") },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) return null;

    const idea = await ctx.db.get(args.ideaId);
    if (!idea || idea.userId !== user._id) return null;

    return idea;
  },
});

// Update idea with full recipe
export const updateIdeaWithFullRecipe = mutation({
  args: {
    ideaId: v.id("recipeIdeas"),
    fullRecipe: v.object({
      shopping: v.object({
        have: v.array(v.string()),
        need: v.array(v.string()),
        optional: v.array(v.string()),
      }),
      prepGroup: v.array(v.string()),
      steps: v.array(
        v.object({
          title: v.string(),
          detail: v.string(),
          time_minutes: v.number(),
        })
      ),
      substitutions: v.array(
        v.object({
          ingredient: v.string(),
          swap_options: v.array(v.string()),
        })
      ),
      tips: v.array(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const idea = await ctx.db.get(args.ideaId);
    if (!idea || idea.userId !== user._id) {
      throw new Error("Idea not found");
    }

    await ctx.db.patch(args.ideaId, {
      fullRecipe: args.fullRecipe,
    });

    return args.ideaId;
  },
});

// Delete a session and all its ideas
export const deleteSession = mutation({
  args: { sessionId: v.id("recipeIdeaSessions") },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== user._id) {
      throw new Error("Session not found");
    }

    // Delete all ideas in the session
    const ideas = await ctx.db
      .query("recipeIdeas")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    for (const idea of ideas) {
      await ctx.db.delete(idea._id);
    }

    // Delete the session
    await ctx.db.delete(args.sessionId);
  },
});

// Clear session and start fresh
export const clearSession = mutation({
  args: { sessionId: v.id("recipeIdeaSessions") },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== user._id) {
      throw new Error("Session not found");
    }

    // Delete all ideas in the session
    const ideas = await ctx.db
      .query("recipeIdeas")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    for (const idea of ideas) {
      await ctx.db.delete(idea._id);
    }

    // Update session timestamp
    await ctx.db.patch(args.sessionId, { updatedAt: Date.now() });
  },
});
