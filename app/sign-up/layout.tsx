import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up - Join Traveler's Kitchen",
  description:
    "Create a free account to generate unlimited recipes, save your favorites, and share with the travel cooking community.",
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: "Sign Up | Traveler's Kitchen",
    description:
      "Join Traveler's Kitchen to generate and save travel-friendly recipes.",
    url: "https://www.travelkitchen.app/sign-up",
    type: "website",
  },
};

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
