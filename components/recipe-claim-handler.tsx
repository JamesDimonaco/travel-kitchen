"use client";

import { useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSession } from "@/lib/auth-client";
import { getSessionId, clearSessionId } from "@/lib/session-id";
import { toast } from "sonner";

/**
 * Component that handles claiming anonymous recipes after OAuth redirect.
 * This runs once when a user is authenticated and has a sessionId.
 */
export function RecipeClaimHandler() {
  const { data: session } = useSession();
  const claimAnonymousRecipes = useMutation(api.usage.claimAnonymousRecipes);
  const hasClaimedRef = useRef(false);

  useEffect(() => {
    // Only run once per session, when user is authenticated
    if (!session || hasClaimedRef.current) return;

    const sessionId = getSessionId();
    if (!sessionId) return;

    // Mark as claimed to prevent multiple attempts
    hasClaimedRef.current = true;

    // Attempt to claim recipes with retry logic
    // Convex auth may take time to sync after OAuth redirect
    const attemptClaim = async (retries = 3, delay = 1500) => {
      // Initial delay to let Convex auth sync
      await new Promise((resolve) => setTimeout(resolve, delay));

      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          if (attempt > 0) {
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
          const result = await claimAnonymousRecipes({ sessionId });
          if (result.claimed > 0) {
            toast.success(
              `${result.claimed} recipe${result.claimed > 1 ? "s" : ""} added to your account!`
            );
          }
          clearSessionId();
          return; // Success
        } catch {
          if (attempt === retries - 1) {
            // Silent failure - allow retry on next page load
            hasClaimedRef.current = false;
          }
        }
      }
    };

    attemptClaim();
  }, [session, claimAnonymousRecipes]);

  // This component doesn't render anything
  return null;
}
