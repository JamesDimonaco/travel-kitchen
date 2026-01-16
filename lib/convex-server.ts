// Server-side Convex query helper for metadata generation
// This allows fetching Convex data in generateMetadata and other server contexts

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

interface ConvexQueryOptions {
  revalidate?: number; // Cache duration in seconds
}

export async function convexQuery<T>(
  path: string,
  args: Record<string, unknown> = {},
  options: ConvexQueryOptions = {}
): Promise<T | null> {
  if (!CONVEX_URL) {
    console.error("CONVEX_URL not configured");
    return null;
  }

  try {
    const response = await fetch(`${CONVEX_URL}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, args }),
      next: { revalidate: options.revalidate ?? 60 }, // Default 1 minute cache
    });

    if (!response.ok) {
      console.error(`Convex query failed: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.value as T;
  } catch (error) {
    console.error("Convex query error:", error);
    return null;
  }
}

// Type for recipe data from Convex
export interface PublicRecipe {
  _id: string;
  _creationTime: number;
  title: string;
  description: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  equipmentUsed: string[];
  shoppingList: {
    have: string[];
    need: string[];
    optional: string[];
  };
  steps: Array<{
    number: number;
    instruction: string;
    duration?: number;
  }>;
  isPublished: boolean;
  publishedAt?: number;
  inputs?: {
    country?: string;
    dietaryPreferences?: string[];
  };
}

// Fetch a public recipe by ID
export async function getPublicRecipe(
  id: string
): Promise<PublicRecipe | null> {
  return convexQuery<PublicRecipe>("recipes:getPublicRecipe", { id });
}

// Fetch all published recipes (for sitemap)
export async function listPublishedRecipes(
  options: ConvexQueryOptions = {}
): Promise<PublicRecipe[]> {
  const recipes = await convexQuery<PublicRecipe[]>(
    "recipes:listPublishedRecipes",
    {},
    options
  );
  return recipes || [];
}

// Server-side mutation helper for API routes
export async function convexMutation<T>(
  path: string,
  args: Record<string, unknown> = {}
): Promise<T | null> {
  if (!CONVEX_URL) {
    console.error("CONVEX_URL not configured");
    return null;
  }

  try {
    const response = await fetch(`${CONVEX_URL}/api/mutation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, args }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Convex mutation failed: ${response.status}`, errorText);
      return null;
    }

    const data = await response.json();
    return data.value as T;
  } catch (error) {
    console.error("Convex mutation error:", error);
    return null;
  }
}

// Usage check types
export interface CanGenerateResult {
  canGenerate: boolean;
  reason: string | null;
  remaining: number;
  isAuthenticated: boolean;
}

// Check if a user/session can generate
export async function checkCanGenerate(
  sessionId?: string
): Promise<CanGenerateResult> {
  const result = await convexQuery<CanGenerateResult>(
    "usage:canGenerate",
    { sessionId },
    { revalidate: 0 } // Don't cache usage checks
  );
  return result || { canGenerate: false, reason: "Unable to check usage", remaining: 0, isAuthenticated: false };
}
