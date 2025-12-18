"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  Clock,
  Users,
  Save,
  Loader2,
  ChefHat,
  ShoppingCart,
  ListChecks,
  Lightbulb,
} from "lucide-react";
import type { RecipeResponse, RecipeFormData } from "@/lib/recipe-schema";
import RecipeChat from "./recipe-chat";

interface RecipeResultProps {
  recipe: RecipeResponse;
  inputs: RecipeFormData;
  onBack: () => void;
  isAuthenticated: boolean;
  onRecipeUpdate?: (newRecipe: RecipeResponse) => void;
}

export default function RecipeResult({
  recipe,
  inputs,
  onBack,
  isAuthenticated,
  onRecipeUpdate,
}: RecipeResultProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isUpdatingRecipe, setIsUpdatingRecipe] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const saveRecipe = useMutation(api.recipes.saveRecipe);

  const toggleChecked = (item: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(item)) {
      newChecked.delete(item);
    } else {
      newChecked.add(item);
    }
    setCheckedItems(newChecked);
  };

  const handleSave = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to save recipes");
      return;
    }

    setIsSaving(true);
    try {
      // Combine ingredients from both "have" and "to buy" lists
      const allIngredients = [
        ...inputs.ingredientsHave,
        ...(inputs.ingredientsToBuy || []),
      ];

      await saveRecipe({
        title: recipe.title,
        description: recipe.summary,
        inputs: {
          equipment: inputs.equipment,
          dietaryPreferences: inputs.diet,
          allergens: inputs.allergies,
          country: inputs.country,
          ingredients: allIngredients,
          servings: inputs.servings,
          maxTime: inputs.timeLimit,
        },
        prepTime: 0,
        cookTime: recipe.time_minutes,
        servings: recipe.servings,
        equipmentUsed: recipe.equipment_used,
        shoppingList: recipe.shopping,
        prepGroup: recipe.prep_group.map((task) => ({
          task,
          ingredients: [],
        })),
        steps: recipe.steps.map((step, index) => ({
          number: index + 1,
          instruction: `${step.title}: ${step.detail}`,
          duration: step.time_minutes,
        })),
        substitutions: recipe.substitutions.map((sub) => ({
          original: sub.ingredient,
          substitute: sub.swap_options.join(", "),
        })),
        tips: recipe.diet_notes,
      });

      setIsSaved(true);
      toast.success("Recipe saved!");
    } catch (error) {
      toast.error("Failed to save recipe");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  // Wrapper for onRecipeUpdate that tracks loading state
  const handleRecipeUpdate = (newRecipe: RecipeResponse) => {
    setIsUpdatingRecipe(false);
    onRecipeUpdate?.(newRecipe);
  };

  const handleUpdatingStart = () => {
    setIsUpdatingRecipe(true);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Updating overlay */}
      {isUpdatingRecipe && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 flex items-center justify-center">
          <div className="bg-background rounded-lg border p-6 shadow-lg flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="font-medium">Updating recipe...</p>
            <p className="text-sm text-muted-foreground">Applying your changes</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">New Recipe</span>
          </button>

          <Button
            onClick={handleSave}
            disabled={isSaving || isSaved || !isAuthenticated}
            size="sm"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isSaved ? "Saved" : "Save Recipe"}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Title Section */}
        <div className="bg-background rounded-lg border p-6 mb-6">
          <h1 className="text-2xl font-bold mb-2">{recipe.title}</h1>
          <p className="text-muted-foreground mb-4">{recipe.summary}</p>

          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{recipe.time_minutes} min</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{recipe.servings} servings</span>
            </div>
            <div className="flex items-center gap-2">
              <ChefHat className="h-4 w-4 text-muted-foreground" />
              <span>{recipe.equipment_used.join(", ")}</span>
            </div>
          </div>

          {recipe.assumptions.length > 0 && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Assumptions:</strong> {recipe.assumptions.join(". ")}
              </p>
            </div>
          )}
        </div>

        {/* Shopping List */}
        <div className="bg-background rounded-lg border p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart className="h-5 w-5" />
            <h2 className="font-semibold text-lg">Shopping List</h2>
          </div>

          <div className="space-y-4">
            {recipe.shopping.have.length > 0 && (
              <div>
                <p className="text-sm font-medium text-green-600 mb-2">
                  You have:
                </p>
                <ul className="space-y-2">
                  {recipe.shopping.have.map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <Checkbox
                        checked={checkedItems.has(`have-${item}`)}
                        onCheckedChange={() => toggleChecked(`have-${item}`)}
                      />
                      <span
                        className={
                          checkedItems.has(`have-${item}`)
                            ? "line-through text-muted-foreground"
                            : ""
                        }
                      >
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {recipe.shopping.need.length > 0 && (
              <div>
                <p className="text-sm font-medium text-orange-600 mb-2">
                  You need to buy:
                </p>
                <ul className="space-y-2">
                  {recipe.shopping.need.map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <Checkbox
                        checked={checkedItems.has(`need-${item}`)}
                        onCheckedChange={() => toggleChecked(`need-${item}`)}
                      />
                      <span
                        className={
                          checkedItems.has(`need-${item}`)
                            ? "line-through text-muted-foreground"
                            : ""
                        }
                      >
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {recipe.shopping.optional.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Optional:
                </p>
                <ul className="space-y-2">
                  {recipe.shopping.optional.map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <Checkbox
                        checked={checkedItems.has(`optional-${item}`)}
                        onCheckedChange={() =>
                          toggleChecked(`optional-${item}`)
                        }
                      />
                      <span
                        className={
                          checkedItems.has(`optional-${item}`)
                            ? "line-through text-muted-foreground"
                            : ""
                        }
                      >
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Prep Group */}
        {recipe.prep_group.length > 0 && (
          <div className="bg-background rounded-lg border p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <ListChecks className="h-5 w-5" />
              <h2 className="font-semibold text-lg">Prep First</h2>
            </div>
            <ul className="space-y-2">
              {recipe.prep_group.map((task, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Checkbox
                    checked={checkedItems.has(`prep-${index}`)}
                    onCheckedChange={() => toggleChecked(`prep-${index}`)}
                  />
                  <span
                    className={
                      checkedItems.has(`prep-${index}`)
                        ? "line-through text-muted-foreground"
                        : ""
                    }
                  >
                    {task}
                  </span>
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
                <div className="shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="font-medium mb-1">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">{step.detail}</p>
                  {step.time_minutes > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
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
          <div className="bg-background rounded-lg border p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="h-5 w-5" />
              <h2 className="font-semibold text-lg">Substitutions</h2>
            </div>
            <ul className="space-y-3">
              {recipe.substitutions.map((sub, index) => (
                <li key={index} className="text-sm">
                  <span className="font-medium">{sub.ingredient}:</span>{" "}
                  <span className="text-muted-foreground">
                    {sub.swap_options.join(" or ")}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Diet Notes */}
        {recipe.diet_notes.length > 0 && (
          <div className="bg-muted/50 rounded-lg border p-6">
            <h2 className="font-semibold text-lg mb-3">Notes</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {recipe.diet_notes.map((note, index) => (
                <li key={index}>• {note}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Recipe Chat - only show if not saved yet */}
        {!isSaved && isAuthenticated && onRecipeUpdate && (
          <div className="mt-6">
            <RecipeChat
              recipe={recipe}
              inputs={inputs}
              onRecipeUpdate={handleRecipeUpdate}
              onUpdatingStart={handleUpdatingStart}
            />
          </div>
        )}

        {/* Bottom Save Button */}
        {!isSaved && isAuthenticated && (
          <div className="sticky bottom-4 mt-6">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full"
              size="lg"
            >
              {isSaving ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <Save className="h-5 w-5 mr-2" />
              )}
              Save to My Recipes
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
