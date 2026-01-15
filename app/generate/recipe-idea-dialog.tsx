"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Clock,
  Users,
  ChefHat,
  ShoppingCart,
  ListChecks,
  Lightbulb,
  Loader2,
  Save,
  ExternalLink,
  X,
  AlertTriangle,
} from "lucide-react";
import type { RecipeIdea } from "./recipe-idea-card";
import type { IdeasFormData } from "./recipe-ideas-form";
import type { Id } from "@/convex/_generated/dataModel";
import { track, ANALYTICS_EVENTS } from "@/lib/analytics";
import { getAuthCookie } from "@/lib/auth-client";

interface FullRecipe {
  shopping: {
    have: string[];
    need: string[];
    optional: string[];
  };
  prepGroup: string[];
  steps: {
    title: string;
    detail: string;
    time_minutes: number;
  }[];
  substitutions: {
    ingredient: string;
    swap_options: string[];
  }[];
  tips: string[];
}

interface RecipeIdeaDialogProps {
  idea: RecipeIdea | null;
  sessionId: Id<"recipeIdeaSessions"> | null;
  sessionInputs: IdeasFormData | null;
  onClose: () => void;
  onRecipeGenerated: (ideaId: Id<"recipeIdeas">, fullRecipe: FullRecipe, newCount: number) => void;
  fullRecipesGenerated: number;
}

export default function RecipeIdeaDialog({
  idea,
  sessionId,
  sessionInputs,
  onClose,
  onRecipeGenerated,
  fullRecipesGenerated,
}: RecipeIdeaDialogProps) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedRecipeId, setSavedRecipeId] = useState<string | null>(null);
  const [fullRecipe, setFullRecipe] = useState<FullRecipe | null>(
    (idea?.fullRecipe as FullRecipe) || null
  );
  const [showCreditWarning, setShowCreditWarning] = useState(false);

  const updateIdeaWithFullRecipe = useMutation(
    api.recipeIdeas.updateIdeaWithFullRecipe
  );
  const recordFullRecipeGenerated = useMutation(
    api.recipeIdeas.recordFullRecipeGenerated
  );
  const recordGeneration = useMutation(api.usage.recordGeneration);
  const saveRecipe = useMutation(api.recipes.saveRecipe);
  const usageCheck = useQuery(api.usage.getMyUsage);

  // Check if this idea already has a full recipe (from DB)
  const hasExistingFullRecipe = !!(idea?.fullRecipe);

  // Check if this will use a credit (not the first generation AND idea doesn't have recipe)
  const willUseCredit = fullRecipesGenerated >= 1 && !hasExistingFullRecipe;

  const handleGenerateFullRecipe = async () => {
    if (!idea || !sessionInputs || !sessionId) return;

    // If this will use a credit, check if user has credits available first
    if (willUseCredit) {
      // Verify user has credits before showing warning dialog
      if (!usageCheck || usageCheck.aiGenerationsRemaining <= 0) {
        toast.error("You've used all your AI generations. Purchase more credits to continue.");
        return;
      }
      setShowCreditWarning(true);
      return;
    }

    await doGenerateFullRecipe();
  };

  const doGenerateFullRecipe = async () => {
    if (!idea || !sessionInputs || !sessionId) return;

    setIsGenerating(true);
    setShowCreditWarning(false);

    try {
      const response = await fetch("/api/ai/expand-idea", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Better-Auth-Cookie": getAuthCookie(),
        },
        body: JSON.stringify({
          idea: {
            title: idea.title,
            description: idea.description,
            keyIngredients: idea.keyIngredients,
            estimatedTime: idea.estimatedTime,
            servings: idea.servings,
            equipmentNeeded: idea.equipmentNeeded,
            dietaryTags: idea.dietaryTags,
            difficulty: idea.difficulty,
          },
          sessionInputs,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate recipe");
      }

      const data = await response.json();
      setFullRecipe(data.fullRecipe);

      // Save full recipe to the idea
      await updateIdeaWithFullRecipe({
        ideaId: idea._id,
        fullRecipe: data.fullRecipe,
      });

      // Record that we generated a full recipe and check if credit was used
      const result = await recordFullRecipeGenerated({ sessionId });

      // If this used a credit (not the first one), record it
      if (result.usedCredit) {
        try {
          await recordGeneration();
        } catch (usageError) {
          console.error("Failed to record usage:", usageError);
        }
      }

      onRecipeGenerated(idea._id, data.fullRecipe, result.totalGenerated);
      track(ANALYTICS_EVENTS.IDEA_EXPANDED, { title: idea.title, usedCredit: result.usedCredit });
      toast.success("Recipe generated!");
    } catch (error) {
      toast.error("Failed to generate recipe");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToMyRecipes = async () => {
    if (!idea || !fullRecipe || !sessionInputs) return;

    setIsSaving(true);
    try {
      const recipeId = await saveRecipe({
        title: idea.title,
        description: idea.description,
        inputs: {
          equipment: sessionInputs.equipment,
          dietaryPreferences: sessionInputs.dietaryPreferences,
          allergens: sessionInputs.allergens,
          country: sessionInputs.country,
          ingredients: idea.keyIngredients,
          servings: idea.servings,
          maxTime: idea.estimatedTime,
        },
        prepTime: 0,
        cookTime: idea.estimatedTime,
        servings: idea.servings,
        equipmentUsed: idea.equipmentNeeded,
        shoppingList: fullRecipe.shopping,
        prepGroup: fullRecipe.prepGroup.map((task) => ({
          task,
          ingredients: [],
        })),
        steps: fullRecipe.steps.map((step, index) => ({
          number: index + 1,
          instruction: `${step.title}: ${step.detail}`,
          duration: step.time_minutes,
        })),
        substitutions: fullRecipe.substitutions.map((sub) => ({
          original: sub.ingredient,
          substitute: sub.swap_options.join(", "),
        })),
        tips: fullRecipe.tips,
      });

      setSavedRecipeId(recipeId);
      toast.success("Recipe saved to My Recipes!");
    } catch (error) {
      toast.error("Failed to save recipe");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoToRecipe = () => {
    if (savedRecipeId) {
      router.push(`/recipe/${savedRecipeId}`);
    }
  };

  const handleClose = () => {
    setSavedRecipeId(null);
    setFullRecipe(null);
    onClose();
  };

  if (!idea) return null;

  const recipe = fullRecipe || (idea.fullRecipe as FullRecipe);

  return (
    <>
      <Dialog open={!!idea} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="text-xl">{idea.title}</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {idea.description}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <div className="flex items-center gap-1 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{idea.estimatedTime} min</span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{idea.servings} servings</span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <ChefHat className="h-4 w-4 text-muted-foreground" />
                <span>{idea.equipmentNeeded.join(", ")}</span>
              </div>
            </div>

            {idea.dietaryTags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {idea.dietaryTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </DialogHeader>

          {!recipe ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                Generate the full recipe to see ingredients and instructions
              </p>
              <Button onClick={handleGenerateFullRecipe} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Generating recipe...
                  </>
                ) : (
                  "Generate Full Recipe"
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              {/* Shopping List */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <ShoppingCart className="h-5 w-5" />
                  <h3 className="font-semibold">Shopping List</h3>
                </div>
                <div className="space-y-3">
                  {recipe.shopping.have.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-green-600 mb-1">
                        You have:
                      </p>
                      <p className="text-sm">{recipe.shopping.have.join(", ")}</p>
                    </div>
                  )}
                  {recipe.shopping.need.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-orange-600 mb-1">
                        You need:
                      </p>
                      <p className="text-sm">{recipe.shopping.need.join(", ")}</p>
                    </div>
                  )}
                  {recipe.shopping.optional.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Optional:
                      </p>
                      <p className="text-sm">
                        {recipe.shopping.optional.join(", ")}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Prep */}
              {recipe.prepGroup.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <ListChecks className="h-5 w-5" />
                    <h3 className="font-semibold">Prep First</h3>
                  </div>
                  <ul className="space-y-1 text-sm">
                    {recipe.prepGroup.map((task, i) => (
                      <li key={i}>• {task}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Steps */}
              <div>
                <h3 className="font-semibold mb-3">Instructions</h3>
                <ol className="space-y-4">
                  {recipe.steps.map((step, index) => (
                    <li key={index} className="flex gap-3">
                      <div className="shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{step.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {step.detail}
                        </p>
                        {step.time_minutes > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            ~{step.time_minutes} min
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Substitutions */}
              {recipe.substitutions.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="h-5 w-5" />
                    <h3 className="font-semibold">Substitutions</h3>
                  </div>
                  <ul className="space-y-2 text-sm">
                    {recipe.substitutions.map((sub, i) => (
                      <li key={i}>
                        <span className="font-medium">{sub.ingredient}:</span>{" "}
                        <span className="text-muted-foreground">
                          {sub.swap_options.join(" or ")}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tips */}
              {recipe.tips.length > 0 && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Tips</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {recipe.tips.map((tip, i) => (
                      <li key={i}>• {tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t">
                {savedRecipeId ? (
                  <div className="flex gap-3">
                    <Button
                      onClick={handleGoToRecipe}
                      className="flex-1"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Go to Recipe
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleClose}
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Close
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={handleSaveToMyRecipes}
                    disabled={isSaving}
                    className="w-full"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save to My Recipes
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Warning dialog for generating another full recipe */}
      <AlertDialog open={showCreditWarning} onOpenChange={setShowCreditWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Use Another Credit?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You&apos;ve already generated a full recipe in this session. Generating
              another full recipe will use one of your AI credits.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doGenerateFullRecipe}>
              Use Credit & Generate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
