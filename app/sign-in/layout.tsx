import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description:
    "Sign in to Traveler's Kitchen to save your recipes, share with the community, and access your cooking history.",
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: "Sign In | Traveler's Kitchen",
    description: "Sign in to access your travel recipes.",
    url: "https://www.travelkitchen.app/sign-in",
    type: "website",
  },
};

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
