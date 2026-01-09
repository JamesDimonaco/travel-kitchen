import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run daily at 3am UTC to clean up expired anonymous recipes
crons.daily(
  "cleanup-expired-recipes",
  { hourUTC: 3, minuteUTC: 0 },
  internal.cleanup.deleteExpiredRecipes
);

export default crons;
