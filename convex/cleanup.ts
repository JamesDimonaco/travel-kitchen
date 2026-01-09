import { internalMutation } from "./_generated/server";

/**
 * Delete expired anonymous recipes and usage records.
 * Runs daily via cron job.
 */
export const deleteExpiredRecipes = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Find expired anonymous recipes (those with expiresAt in the past)
    const expiredRecipes = await ctx.db
      .query("recipes")
      .withIndex("by_expires")
      .filter((q) =>
        q.and(
          q.neq(q.field("expiresAt"), undefined),
          q.lt(q.field("expiresAt"), now)
        )
      )
      .collect();

    // Delete expired recipes
    for (const recipe of expiredRecipes) {
      await ctx.db.delete(recipe._id);
    }

    // Find expired anonymous usage records
    const expiredUsage = await ctx.db
      .query("anonymousUsage")
      .withIndex("by_expires")
      .filter((q) =>
        q.and(
          q.neq(q.field("expiresAt"), undefined),
          q.lt(q.field("expiresAt"), now)
        )
      )
      .collect();

    // Delete expired usage records
    for (const usage of expiredUsage) {
      await ctx.db.delete(usage._id);
    }

    return {
      deletedRecipes: expiredRecipes.length,
      deletedUsage: expiredUsage.length,
    };
  },
});
