import { createAuthClient } from "better-auth/react";
import { convexClient, crossDomainClient } from "@convex-dev/better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_CONVEX_SITE_URL,
  plugins: [convexClient(), crossDomainClient()],
});

export const { signIn, signOut, signUp, useSession } = authClient;

// Helper to get the auth cookie for API requests in cross-domain setup
export const getAuthCookie = () => {
  return authClient.getCookie();
};

// Social sign-in helper
export const signInWithGoogle = () => {
  return signIn.social({
    provider: "google",
    callbackURL: "/",
  });
};

// Sign out helper that handles cross-domain cleanup
export const handleSignOut = async () => {
  await signOut({
    fetchOptions: {
      onSuccess: () => {
        // Clear any local storage used by cross-domain client
        if (typeof window !== "undefined") {
          localStorage.removeItem("better-auth-cookie");
          localStorage.removeItem("better-auth-session");
        }
        // Force reload to clear any cached state
        window.location.href = "/";
      },
    },
  });
};
