"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { RecipeEditor, type RecipeEditorData } from "@/components/recipe-editor";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LogIn, PenLine } from "lucide-react";
import Link from "next/link";
import { track, ANALYTICS_EVENTS } from "@/lib/analytics";

export default function ManualRecipe() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();
  const [isSaving, setIsSaving] = useState(false);

  const createRecipe = useMutation(api.recipes.createRecipe);

  const handleSave = async (data: RecipeEditorData) => {
    if (!session) {
      toast.error("Please sign in to create recipes");
      return;
    }

    setIsSaving(true);

    try {
      const recipeId = await createRecipe({
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
      });

      track(ANALYTICS_EVENTS.RECIPE_SAVED, {
        source: "manual_creation",
        title: data.title,
        equipment_count: data.equipmentUsed.length,
        step_count: data.steps.length,
      });

      toast.success("Recipe created successfully!");
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

  // Show sign-in prompt if not authenticated
  if (!session) {
    return (
      <div className="text-center py-12">
        <PenLine className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Create Your Own Recipe</h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Sign in to manually create and save your own recipes. Perfect for
          documenting your favorite travel cooking discoveries!
        </p>
        <Button asChild>
          <Link href="/sign-in">
            <LogIn className="h-4 w-4 mr-2" />
            Sign In to Continue
          </Link>
        </Button>
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
      </div>

      <RecipeEditor onSave={handleSave} isSaving={isSaving} />
    </div>
  );
}
