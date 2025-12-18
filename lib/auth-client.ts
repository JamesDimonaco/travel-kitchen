import { createAuthClient } from "better-auth/react";
import { convexClient } from "@convex-dev/better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_CONVEX_SITE_URL,
  plugins: [convexClient()],
});

export const { signIn, signOut, signUp, useSession } = authClient;

// Social sign-in helper
export const signInWithGoogle = () => {
  return signIn.social({
    provider: "google",
    callbackURL: window.location.origin,
  });
};
