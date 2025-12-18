import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Generate Recipe - Create Travel-Friendly Meals",
  description:
    "Generate custom recipes based on your available kitchen equipment. Perfect for travelers cooking in hostels, Airbnbs, and limited kitchens. Tell us what you have, we'll create the recipe.",
  keywords: [
    "recipe generator",
    "AI recipes",
    "custom recipes",
    "travel cooking",
    "hostel meal ideas",
    "limited kitchen recipes",
    "easy meal generator",
    "cooking with limited equipment",
  ],
  openGraph: {
    title: "Generate Recipe | Traveler's Kitchen",
    description:
      "Create custom recipes based on your available equipment. Perfect for cooking anywhere with whatever you've got.",
    url: "https://www.travelkitchen.app/generate",
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
    canonical: "https://www.travelkitchen.app/generate",
  },
};

export default function GenerateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
