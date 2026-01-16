import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run daily at 3am UTC to clean up expired anonymous recipes
crons.cron(
  "cleanup-expired-recipes",
  "0 3 * * *", // 3am UTC daily
  internal.cleanup.deleteExpiredRecipes
);

export default crons;
