import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recipe Details",
  description:
    "View the full recipe with ingredients, step-by-step instructions, and helpful tips for cooking with limited equipment.",
  openGraph: {
    type: "article",
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
};

export default function RecipeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
