import { MetadataRoute } from "next";

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
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/sign-in`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/sign-up`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // Fetch published recipes from Convex for dynamic sitemap entries
  // Note: This requires a public API endpoint or direct Convex query
  let recipePages: MetadataRoute.Sitemap = [];

  try {
    // Fetch published recipes via Convex HTTP endpoint
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (convexUrl) {
      const response = await fetch(`${convexUrl}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "recipes:listPublishedRecipes",
          args: {},
        }),
        next: { revalidate: 3600 }, // Cache for 1 hour
      });

      if (response.ok) {
        const data = await response.json();
        const recipes = data.value || [];

        recipePages = recipes.map(
          (recipe: { _id: string; _creationTime: number }) => ({
            url: `${SITE_URL}/recipe/${recipe._id}`,
            lastModified: new Date(recipe._creationTime),
            changeFrequency: "weekly" as const,
            priority: 0.7,
          })
        );
      }
    }
  } catch (error) {
    console.error("Error fetching recipes for sitemap:", error);
  }

  return [...staticPages, ...recipePages];
}
