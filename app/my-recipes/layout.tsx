import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Recipes - Your Saved Travel Recipes",
  description:
    "Manage your saved recipes. View, edit, publish, and organize your travel-friendly recipes created with Traveler's Kitchen.",
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "My Recipes | Traveler's Kitchen",
    description: "Manage your saved travel-friendly recipes.",
    url: "https://www.travelkitchen.app/my-recipes",
    type: "website",
  },
};

export default function MyRecipesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
