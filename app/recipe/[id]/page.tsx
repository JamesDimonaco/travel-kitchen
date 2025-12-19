"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Clock,
  Users,
  ChefHat,
  ShoppingCart,
  ListChecks,
  Lightbulb,
  Loader2,
  Globe,
  Lock,
} from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";
import { RecipeSchema, BreadcrumbSchema } from "@/components/seo/structured-data";
import { Header } from "@/components/header";

export default function RecipePage() {
  const params = useParams();
  const router = useRouter();
  const recipeId = params.id as Id<"recipes">;

  const recipe = useQuery(api.recipes.getRecipe, { id: recipeId });

  if (recipe === undefined) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (recipe === null) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Recipe not found</h1>
          <p className="text-muted-foreground mb-4">
            This recipe may have been deleted or is private.
          </p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Structured Data for SEO */}
      {recipe.isPublished && (
        <>
          <RecipeSchema recipe={recipe} recipeId={recipeId} />
          <BreadcrumbSchema
            items={[
              { name: "Home", url: "https://www.travelkitchen.app" },
              { name: "Marketplace", url: "https://www.travelkitchen.app/marketplace" },
              { name: recipe.title, url: `https://www.travelkitchen.app/recipe/${recipeId}` },
            ]}
          />
        </>
      )}

      <div className="min-h-screen bg-muted/30">
        <Header
          centerContent={
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/marketplace">Marketplace</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="truncate max-w-[200px]">
                    {recipe.title}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          }
        />

        <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Title Section */}
        <div className="bg-background rounded-lg border p-6 mb-6">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h1 className="text-2xl font-bold">{recipe.title}</h1>
            {recipe.isPublished ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 flex-shrink-0">
                <Globe className="h-3 w-3" />
                Public
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground flex-shrink-0">
                <Lock className="h-3 w-3" />
                Private
              </span>
            )}
          </div>
          <p className="text-muted-foreground mb-4">{recipe.description}</p>

          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{recipe.cookTime} min</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{recipe.servings} servings</span>
            </div>
            <div className="flex items-center gap-2">
              <ChefHat className="h-4 w-4 text-muted-foreground" />
              <span>{recipe.equipmentUsed.join(", ")}</span>
            </div>
          </div>
        </div>

        {/* Shopping List */}
        <div className="bg-background rounded-lg border p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart className="h-5 w-5" />
            <h2 className="font-semibold text-lg">Shopping List</h2>
          </div>

          <div className="space-y-4">
            {recipe.shoppingList.have.length > 0 && (
              <div>
                <p className="text-sm font-medium text-green-600 mb-2">
                  You have:
                </p>
                <ul className="space-y-1">
                  {recipe.shoppingList.have.map((item, index) => (
                    <li key={index} className="text-sm">
                      • {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {recipe.shoppingList.need.length > 0 && (
              <div>
                <p className="text-sm font-medium text-orange-600 mb-2">
                  You need to buy:
                </p>
                <ul className="space-y-1">
                  {recipe.shoppingList.need.map((item, index) => (
                    <li key={index} className="text-sm">
                      • {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {recipe.shoppingList.optional.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Optional:
                </p>
                <ul className="space-y-1">
                  {recipe.shoppingList.optional.map((item, index) => (
                    <li key={index} className="text-sm">
                      • {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Prep Group */}
        {recipe.prepGroup.length > 0 && (
          <div className="bg-background rounded-lg border p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <ListChecks className="h-5 w-5" />
              <h2 className="font-semibold text-lg">Prep First</h2>
            </div>
            <ul className="space-y-2">
              {recipe.prepGroup.map((prep, index) => (
                <li key={index} className="text-sm">
                  • {prep.task}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Steps */}
        <div className="bg-background rounded-lg border p-6 mb-6">
          <h2 className="font-semibold text-lg mb-4">Instructions</h2>
          <ol className="space-y-6">
            {recipe.steps.map((step, index) => (
              <li key={index} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  {step.number}
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-sm">{step.instruction}</p>
                  {step.duration && step.duration > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      ~{step.duration} min
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Substitutions */}
        {recipe.substitutions.length > 0 && (
          <div className="bg-background rounded-lg border p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="h-5 w-5" />
              <h2 className="font-semibold text-lg">Substitutions</h2>
            </div>
            <ul className="space-y-3">
              {recipe.substitutions.map((sub, index) => (
                <li key={index} className="text-sm">
                  <span className="font-medium">{sub.original}:</span>{" "}
                  <span className="text-muted-foreground">{sub.substitute}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tips */}
        {recipe.tips && recipe.tips.length > 0 && (
          <div className="bg-muted/50 rounded-lg border p-6">
            <h2 className="font-semibold text-lg mb-3">Notes</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {recipe.tips.map((tip, index) => (
                <li key={index}>• {tip}</li>
              ))}
            </ul>
          </div>
        )}
        </main>
      </div>
    </>
  );
}
