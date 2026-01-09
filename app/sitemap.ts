import { MetadataRoute } from "next";
import { listPublishedRecipes } from "@/lib/convex-server";

const SITE_URL = "https://www.travelkitchen.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/generate`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/marketplace`,
      lastModified: new Date(),
      changeFrequency: "hourly", // Updates frequently as recipes are published
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/sign-in`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/sign-up`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  // Fetch published recipes from Convex
  // Short cache (5 minutes) ensures new recipes appear quickly in sitemap
  const recipes = await listPublishedRecipes({ revalidate: 300 });

  const recipePages: MetadataRoute.Sitemap = recipes.map((recipe) => ({
    url: `${SITE_URL}/recipe/${recipe._id}`,
    // Use publishedAt if available, otherwise fall back to creation time
    lastModified: new Date(recipe.publishedAt || recipe._creationTime),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...recipePages];
}

// Revalidate sitemap every 5 minutes to pick up new published recipes
export const revalidate = 300;
