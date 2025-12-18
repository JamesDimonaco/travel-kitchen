import { createAuthClient } from "better-auth/react";
import { convexClient } from "@convex-dev/better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [convexClient()],
});

export const { signIn, signOut, signUp, useSession } = authClient;

// Social sign-in helper
export const signInWithGoogle = () => {
  return signIn.social({
    provider: "google",
    callbackURL: "/",
  });
};
