"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { RecipeEditor, type RecipeEditorData } from "@/components/recipe-editor";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import { track, ANALYTICS_EVENTS } from "@/lib/analytics";
import { getOrCreateSessionId } from "@/lib/session-id";
import Link from "next/link";

export default function ManualRecipe() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();
  const [isSaving, setIsSaving] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");

  const createRecipe = useMutation(api.recipes.createRecipe);
  const createAnonymousRecipe = useMutation(api.recipes.createAnonymousRecipe);

  useEffect(() => {
    setSessionId(getOrCreateSessionId());
  }, []);

  const isAuthenticated = !!session;

  const handleSave = async (data: RecipeEditorData) => {
    if (!isAuthenticated && !sessionId) {
      toast.error("Unable to save recipe");
      return;
    }

    setIsSaving(true);

    try {
      const recipeData = {
        title: data.title,
        description: data.description,
        prepTime: data.prepTime,
        cookTime: data.cookTime,
        servings: data.servings,
        equipmentUsed: data.equipmentUsed,
        shoppingList: data.shoppingList,
        prepGroup: data.prepGroup,
        steps: data.steps,
        substitutions: data.substitutions,
        tips: data.tips.length > 0 ? data.tips : undefined,
      };

      let recipeId: string;
      if (isAuthenticated) {
        recipeId = await createRecipe(recipeData);
      } else {
        recipeId = await createAnonymousRecipe({ ...recipeData, sessionId });
      }

      track(ANALYTICS_EVENTS.RECIPE_SAVED, {
        source: "manual_creation",
        title: data.title,
        equipment_count: data.equipmentUsed.length,
        step_count: data.steps.length,
        isAuthenticated,
      });

      if (isAuthenticated) {
        toast.success("Recipe created successfully!");
      } else {
        toast.success("Recipe saved! Sign up to keep it forever.", {
          action: {
            label: "Sign up",
            onClick: () => router.push("/sign-up"),
          },
        });
      }
      router.push(`/recipe/${recipeId}`);
    } catch (error) {
      console.error("Failed to create recipe:", error);
      toast.error("Failed to create recipe. Please try again.");
      track(ANALYTICS_EVENTS.RECIPE_SAVE_FAILED, {
        source: "manual_creation",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading state while checking session
  if (sessionPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-xl font-semibold mb-2">Create Your Recipe</h2>
        <p className="text-muted-foreground">
          Manually add your recipe details. Great for documenting your own
          creations or favorite dishes you&apos;ve made while traveling.
        </p>
        {!isAuthenticated && (
          <p className="text-sm text-muted-foreground mt-2">
            <Link href="/sign-up" className="text-primary underline">Sign up</Link> to save your recipes permanently and publish to the marketplace.
          </p>
        )}
      </div>

      <RecipeEditor onSave={handleSave} isSaving={isSaving} />
    </div>
  );
}
