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

    // Attempt to claim recipes
    claimAnonymousRecipes({ sessionId })
      .then((result) => {
        if (result.claimed > 0) {
          toast.success(
            `${result.claimed} recipe${result.claimed > 1 ? "s" : ""} added to your account!`
          );
          clearSessionId();
        }
      })
      .catch((error) => {
        console.error("Failed to claim recipes:", error);
        // Reset so user can try again on next page load
        hasClaimedRef.current = false;
      });
  }, [session, claimAnonymousRecipes]);

  // This component doesn't render anything
  return null;
}
