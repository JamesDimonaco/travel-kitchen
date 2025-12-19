"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Users,
  ChefHat,
  Globe,
  Lock,
  Trash2,
  Loader2,
  Plus,
} from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";
import { track, ANALYTICS_EVENTS } from "@/lib/analytics";
import { Header } from "@/components/header";

export default function MyRecipesPage() {
  const { data: session, isPending: isSessionPending } = useSession();
  const router = useRouter();
  const recipes = useQuery(api.recipes.listMyRecipes);
  const togglePublish = useMutation(api.recipes.togglePublish);
  const deleteRecipe = useMutation(api.recipes.deleteRecipe);

  const [togglingId, setTogglingId] = useState<Id<"recipes"> | null>(null);
  const [deletingId, setDeletingId] = useState<Id<"recipes"> | null>(null);

  // Redirect to home if not authenticated
  if (!isSessionPending && !session?.user) {
    router.push("/");
    return null;
  }

  const handleTogglePublish = async (id: Id<"recipes">, isPublished: boolean) => {
    setTogglingId(id);
    try {
      await togglePublish({ id });
      track(
        isPublished
          ? ANALYTICS_EVENTS.RECIPE_UNPUBLISHED
          : ANALYTICS_EVENTS.RECIPE_PUBLISHED
      );
      toast.success(isPublished ? "Recipe unpublished" : "Recipe published!");
    } catch (error) {
      toast.error("Failed to update recipe");
      console.error(error);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: Id<"recipes">, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    setDeletingId(id);
    try {
      await deleteRecipe({ id });
      track(ANALYTICS_EVENTS.RECIPE_DELETED);
      toast.success("Recipe deleted");
    } catch (error) {
      toast.error("Failed to delete recipe");
      console.error(error);
    } finally {
      setDeletingId(null);
    }
  };

  if (isSessionPending || recipes === undefined) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Header
        title="My Recipes"
        rightContent={
          <Link href="/generate">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Recipe
            </Button>
          </Link>
        }
      />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {recipes.length === 0 ? (
          <div className="text-center py-16">
            <ChefHat className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No recipes yet</h2>
            <p className="text-muted-foreground mb-6">
              Generate your first recipe to get started!
            </p>
            <Link href="/generate">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Generate Recipe
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {recipes.map((recipe) => (
              <div
                key={recipe._id}
                className="bg-background rounded-lg border p-6 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        href={`/recipe/${recipe._id}`}
                        className="font-semibold text-lg hover:underline truncate"
                      >
                        {recipe.title}
                      </Link>
                      {recipe.isPublished ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                          <Globe className="h-3 w-3" />
                          Public
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
                          <Lock className="h-3 w-3" />
                          Private
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {recipe.description}
                    </p>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{recipe.cookTime} min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{recipe.servings} servings</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ChefHat className="h-4 w-4" />
                        <span>{recipe.equipmentUsed.slice(0, 2).join(", ")}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTogglePublish(recipe._id, recipe.isPublished)}
                      disabled={togglingId === recipe._id}
                    >
                      {togglingId === recipe._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : recipe.isPublished ? (
                        <>
                          <Lock className="h-4 w-4 mr-1" />
                          Unpublish
                        </>
                      ) : (
                        <>
                          <Globe className="h-4 w-4 mr-1" />
                          Publish
                        </>
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(recipe._id, recipe.title)}
                      disabled={deletingId === recipe._id}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      {deletingId === recipe._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
