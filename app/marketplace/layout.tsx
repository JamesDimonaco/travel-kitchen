import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recipe Marketplace - Browse Community Recipes",
  description:
    "Discover travel-friendly recipes shared by the community. Browse simple, practical recipes for cooking in hostels, Airbnbs, and basic rental kitchens around the world.",
  keywords: [
    "community recipes",
    "shared recipes",
    "travel recipes",
    "hostel recipes",
    "backpacker cooking",
    "recipe sharing",
    "food community",
  ],
  openGraph: {
    title: "Recipe Marketplace | Traveler's Kitchen",
    description:
      "Discover travel-friendly recipes shared by the community. Browse simple, practical recipes for cooking anywhere.",
    url: "https://www.travelkitchen.app/marketplace",
    type: "website",
    images: [
      {
        url: "/travelers-kitchen-hostel-cooking.jpg",
        width: 1200,
        height: 800,
        alt: "Travelers cooking together in a hostel kitchen",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/travelers-kitchen-hostel-cooking.jpg"],
  },
  alternates: {
    canonical: "https://www.travelkitchen.app/marketplace",
  },
};

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
