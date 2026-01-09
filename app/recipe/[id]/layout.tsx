import type { Metadata } from "next";
import { getPublicRecipe } from "@/lib/convex-server";

const SITE_URL = "https://www.travelkitchen.app";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const recipe = await getPublicRecipe(id);

  // Fallback metadata for private/not found recipes
  if (!recipe) {
    return {
      title: "Recipe Details",
      description:
        "View the full recipe with ingredients, step-by-step instructions, and helpful tips for cooking with limited equipment.",
      robots: { index: false, follow: false },
    };
  }

  // Build rich description
  const totalTime = (recipe.prepTime || 0) + recipe.cookTime;
  const ingredientCount =
    recipe.shoppingList.have.length +
    recipe.shoppingList.need.length +
    recipe.shoppingList.optional.length;

  const description = `${recipe.description} Ready in ${totalTime} minutes with ${ingredientCount} ingredients. Perfect for travelers cooking with ${recipe.equipmentUsed.join(", ")}.`;

  // Build keywords from recipe data
  const keywords = [
    recipe.title,
    "travel recipe",
    "hostel cooking",
    "easy recipe",
    "limited kitchen",
    ...recipe.equipmentUsed,
    ...(recipe.inputs?.dietaryPreferences || []),
    recipe.inputs?.country,
    `${recipe.servings} servings`,
    `${totalTime} minute recipe`,
  ].filter(Boolean);

  const recipeUrl = `${SITE_URL}/recipe/${id}`;

  return {
    title: recipe.title,
    description: description.slice(0, 160), // Optimal meta description length
    keywords: keywords.join(", "),
    authors: [{ name: "Traveler's Kitchen" }],
    creator: "Traveler's Kitchen",
    publisher: "Traveler's Kitchen",
    alternates: {
      canonical: recipeUrl,
    },
    openGraph: {
      type: "article",
      title: recipe.title,
      description: description.slice(0, 200),
      url: recipeUrl,
      siteName: "Traveler's Kitchen",
      locale: "en_US",
      publishedTime: recipe.publishedAt
        ? new Date(recipe.publishedAt).toISOString()
        : new Date(recipe._creationTime).toISOString(),
      modifiedTime: new Date(recipe._creationTime).toISOString(),
      section: "Recipe",
      tags: keywords.filter((k): k is string => typeof k === "string"),
      images: [
        {
          url: "/travelers-kitchen-hostel-cooking.jpg",
          width: 1200,
          height: 800,
          alt: `${recipe.title} - Travel cooking recipe`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: recipe.title,
      description: description.slice(0, 200),
      images: ["/travelers-kitchen-hostel-cooking.jpg"],
      creator: "@travelkitchen",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    other: {
      // Recipe-specific meta tags for enhanced search results
      "recipe:prep_time": `${recipe.prepTime || 0}`,
      "recipe:cook_time": `${recipe.cookTime}`,
      "recipe:total_time": `${totalTime}`,
      "recipe:servings": `${recipe.servings}`,
    },
  };
}

export default function RecipeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
