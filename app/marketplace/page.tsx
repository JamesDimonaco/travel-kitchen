"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import {
  Clock,
  Users,
  ChefHat,
  Loader2,
} from "lucide-react";
import { CollectionPageSchema } from "@/components/seo/structured-data";
import { Header } from "@/components/header";

export default function MarketplacePage() {
  const recipes = useQuery(api.recipes.listPublishedRecipes);

  if (recipes === undefined) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <CollectionPageSchema
        name="Recipe Marketplace - Community Recipes"
        description="Browse and discover travel-friendly recipes shared by the community. Find simple, practical recipes for cooking in hostels, Airbnbs, and limited kitchens."
        url="https://www.travelkitchen.app/marketplace"
        itemCount={recipes?.length || 0}
      />
      <div className="min-h-screen bg-muted/30">
        <Header
          centerContent={
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Marketplace</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          }
        />

        <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Community Recipes</h2>
          <p className="text-muted-foreground">
            Discover recipes shared by fellow travelers
          </p>
        </div>

        {recipes.length === 0 ? (
          <div className="text-center py-16">
            <ChefHat className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No recipes yet</h2>
            <p className="text-muted-foreground mb-6">
              Be the first to share a recipe with the community!
            </p>
            <Link href="/generate">
              <Button>Generate & Share a Recipe</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {recipes.map((recipe) => (
              <Link
                key={recipe._id}
                href={`/recipe/${recipe._id}`}
                className="bg-background rounded-lg border p-6 hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-lg mb-2 line-clamp-1">
                  {recipe.title}
                </h3>

                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {recipe.description}
                </p>

                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{recipe.cookTime} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{recipe.servings}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ChefHat className="h-4 w-4" />
                    <span>{recipe.equipmentUsed.slice(0, 2).join(", ")}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      </div>
    </>
  );
}
