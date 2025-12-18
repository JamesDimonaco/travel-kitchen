"use client";

import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ChefHat,
  Loader2,
  Plus,
  X,
  Clock,
  Users,
  ShoppingCart,
  MessageSquare,
} from "lucide-react";
import {
  EQUIPMENT_OPTIONS,
  LIMITATION_OPTIONS,
  DIET_OPTIONS,
  ALLERGY_OPTIONS,
  QUICK_STAPLES,
  QUICK_TO_BUY,
  TIME_OPTIONS,
  PREFERENCE_OPTIONS,
  type RecipeFormData,
  type RecipeResponse,
} from "@/lib/recipe-schema";
import RecipeResult from "./recipe-result";
import { track, ANALYTICS_EVENTS } from "@/lib/analytics";

interface SingleRecipeFormProps {
  isAuthenticated: boolean;
  sessionPending: boolean;
}

export default function SingleRecipeForm({
  isAuthenticated,
  sessionPending,
}: SingleRecipeFormProps) {
  // Form state
  const [equipment, setEquipment] = useState<string[]>([]);
  const [limitations, setLimitations] = useState<string[]>([]);
  const [country, setCountry] = useState("");
  const [diet, setDiet] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [servings, setServings] = useState(2);
  const [timeLimit, setTimeLimit] = useState(30);
  const [ingredientsHave, setIngredientsHave] = useState<string[]>([]);
  const [ingredientHaveInput, setIngredientHaveInput] = useState("");
  const [ingredientsToBuy, setIngredientsToBuy] = useState<string[]>([]);
  const [ingredientToBuyInput, setIngredientToBuyInput] = useState("");
  const [preferences, setPreferences] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [recipe, setRecipe] = useState<RecipeResponse | null>(null);
  const [formInputs, setFormInputs] = useState<RecipeFormData | null>(null);

  const toggleArrayItem = (
    arr: string[],
    setArr: (arr: string[]) => void,
    item: string
  ) => {
    if (arr.includes(item)) {
      setArr(arr.filter((i) => i !== item));
    } else {
      setArr([...arr, item]);
    }
  };

  const addIngredientHave = (ingredient: string) => {
    const trimmed = ingredient.trim().toLowerCase();
    if (trimmed && !ingredientsHave.includes(trimmed)) {
      setIngredientsHave([...ingredientsHave, trimmed]);
    }
    setIngredientHaveInput("");
  };

  const removeIngredientHave = (ingredient: string) => {
    setIngredientsHave(ingredientsHave.filter((i) => i !== ingredient));
  };

  const addIngredientToBuy = (ingredient: string) => {
    const trimmed = ingredient.trim().toLowerCase();
    if (trimmed && !ingredientsToBuy.includes(trimmed)) {
      setIngredientsToBuy([...ingredientsToBuy, trimmed]);
    }
    setIngredientToBuyInput("");
  };

  const removeIngredientToBuy = (ingredient: string) => {
    setIngredientsToBuy(ingredientsToBuy.filter((i) => i !== ingredient));
  };

  const handleGenerate = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to generate recipes");
      return;
    }

    if (equipment.length === 0) {
      toast.error("Please select at least one piece of equipment");
      return;
    }

    if (ingredientsHave.length === 0 && ingredientsToBuy.length === 0) {
      toast.error("Please add at least one ingredient you have or plan to buy");
      return;
    }

    const formData: RecipeFormData = {
      equipment,
      limitations: limitations.length > 0 ? limitations : undefined,
      country: country || undefined,
      diet: diet.length > 0 ? diet : undefined,
      allergies: allergies.length > 0 ? allergies : undefined,
      servings,
      timeLimit,
      ingredientsHave,
      ingredientsToBuy: ingredientsToBuy.length > 0 ? ingredientsToBuy : undefined,
      preferences: preferences.length > 0 ? preferences : undefined,
      notes: notes.trim() || undefined,
    };

    setIsGenerating(true);
    setRecipe(null);

    try {
      const response = await fetch("/api/ai/new-receipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate recipe");
      }

      setRecipe(data.recipe);
      setFormInputs(data.inputs);
      track(ANALYTICS_EVENTS.RECIPE_GENERATED, {
        equipment: equipment.length,
        hasCountry: !!country,
        hasDiet: diet.length > 0,
        timeLimit,
        servings,
      });
      toast.success("Recipe generated!");
    } catch (error) {
      track(ANALYTICS_EVENTS.RECIPE_GENERATION_FAILED);
      toast.error(
        error instanceof Error ? error.message : "Failed to generate recipe"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const resetForm = () => {
    setRecipe(null);
    setFormInputs(null);
  };

  const handleRecipeUpdate = (newRecipe: RecipeResponse) => {
    setRecipe(newRecipe);
  };

  // Show recipe result if we have one
  if (recipe && formInputs) {
    return (
      <RecipeResult
        recipe={recipe}
        inputs={formInputs}
        onBack={resetForm}
        isAuthenticated={isAuthenticated}
        onRecipeUpdate={handleRecipeUpdate}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Equipment Section */}
      <section className="bg-background rounded-lg border p-6">
        <h2 className="font-semibold text-lg mb-4">
          What equipment do you have?
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {EQUIPMENT_OPTIONS.map((option) => (
            <label
              key={option.id}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                equipment.includes(option.id)
                  ? "bg-primary/10 border-primary"
                  : "hover:bg-muted"
              }`}
            >
              <Checkbox
                checked={equipment.includes(option.id)}
                onCheckedChange={() =>
                  toggleArrayItem(equipment, setEquipment, option.id)
                }
              />
              <span className="text-sm">{option.label}</span>
            </label>
          ))}
        </div>

        {/* Limitations */}
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-muted-foreground mb-3">
            Kitchen limitations (optional)
          </p>
          <div className="flex flex-wrap gap-2">
            {LIMITATION_OPTIONS.map((option) => (
              <Button
                key={option.id}
                type="button"
                variant={limitations.includes(option.id) ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  toggleArrayItem(limitations, setLimitations, option.id)
                }
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Location Section */}
      <section className="bg-background rounded-lg border p-6">
        <h2 className="font-semibold text-lg mb-4">Where are you?</h2>
        <div>
          <Label htmlFor="country" className="text-sm text-muted-foreground">
            Country or region (helps with local ingredients)
          </Label>
          <Input
            id="country"
            placeholder="e.g., Thailand, Spain, Japan..."
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="mt-2"
          />
        </div>
      </section>

      {/* Diet & Allergies Section */}
      <section className="bg-background rounded-lg border p-6">
        <h2 className="font-semibold text-lg mb-4">Diet & Allergies</h2>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-3">
              Dietary preferences
            </p>
            <div className="flex flex-wrap gap-2">
              {DIET_OPTIONS.map((option) => (
                <Button
                  key={option.id}
                  type="button"
                  variant={diet.includes(option.id) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleArrayItem(diet, setDiet, option.id)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-3">Allergies</p>
            <div className="flex flex-wrap gap-2">
              {ALLERGY_OPTIONS.map((option) => (
                <Button
                  key={option.id}
                  type="button"
                  variant={allergies.includes(option.id) ? "destructive" : "outline"}
                  size="sm"
                  onClick={() =>
                    toggleArrayItem(allergies, setAllergies, option.id)
                  }
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Time & Servings Section */}
      <section className="bg-background rounded-lg border p-6">
        <h2 className="font-semibold text-lg mb-4">Time & Servings</h2>

        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <Clock className="h-4 w-4" />
              <span>Max cooking time</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {TIME_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={timeLimit === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeLimit(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <Users className="h-4 w-4" />
              <span>Servings</span>
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setServings(Math.max(1, servings - 1))}
                disabled={servings <= 1}
              >
                -
              </Button>
              <span className="text-lg font-medium w-8 text-center">
                {servings}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setServings(Math.min(6, servings + 1))}
                disabled={servings >= 6}
              >
                +
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Ingredients I Have Section */}
      <section className="bg-background rounded-lg border p-6">
        <h2 className="font-semibold text-lg mb-4">
          What ingredients do you have?
        </h2>

        {/* Input */}
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Type an ingredient..."
            value={ingredientHaveInput}
            onChange={(e) => setIngredientHaveInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addIngredientHave(ingredientHaveInput);
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => addIngredientHave(ingredientHaveInput)}
            disabled={!ingredientHaveInput.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick staples */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-2">Quick add:</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_STAPLES.map((staple) => (
              <Button
                key={staple}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addIngredientHave(staple)}
                disabled={ingredientsHave.includes(staple)}
              >
                + {staple}
              </Button>
            ))}
          </div>
        </div>

        {/* Selected ingredients */}
        {ingredientsHave.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Your ingredients:
            </p>
            <div className="flex flex-wrap gap-2">
              {ingredientsHave.map((ing) => (
                <span
                  key={ing}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                >
                  {ing}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => removeIngredientHave(ing)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Ingredients To Buy Section */}
      <section className="bg-background rounded-lg border p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingCart className="h-5 w-5" />
          <h2 className="font-semibold text-lg">What do you plan to buy?</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Add ingredients you&apos;re willing to shop for
        </p>

        {/* Input */}
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Type an ingredient..."
            value={ingredientToBuyInput}
            onChange={(e) => setIngredientToBuyInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addIngredientToBuy(ingredientToBuyInput);
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => addIngredientToBuy(ingredientToBuyInput)}
            disabled={!ingredientToBuyInput.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick suggestions */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-2">Suggestions:</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_TO_BUY.map((item) => (
              <Button
                key={item}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addIngredientToBuy(item)}
                disabled={ingredientsToBuy.includes(item)}
              >
                + {item}
              </Button>
            ))}
          </div>
        </div>

        {/* Selected ingredients to buy */}
        {ingredientsToBuy.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Shopping list:</p>
            <div className="flex flex-wrap gap-2">
              {ingredientsToBuy.map((ing) => (
                <span
                  key={ing}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 rounded-full text-sm"
                >
                  {ing}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => removeIngredientToBuy(ing)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Preferences Section */}
      <section className="bg-background rounded-lg border p-6">
        <h2 className="font-semibold text-lg mb-4">
          Taste preferences (optional)
        </h2>
        <div className="flex flex-wrap gap-2">
          {PREFERENCE_OPTIONS.map((option) => (
            <Button
              key={option.id}
              type="button"
              variant={preferences.includes(option.id) ? "default" : "outline"}
              size="sm"
              onClick={() =>
                toggleArrayItem(preferences, setPreferences, option.id)
              }
            >
              {option.label}
            </Button>
          ))}
        </div>
      </section>

      {/* Notes Section */}
      <section className="bg-background rounded-lg border p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="h-5 w-5" />
          <h2 className="font-semibold text-lg">
            Any special requests? (optional)
          </h2>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Describe what you&apos;re craving or any specific dish ideas
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g., I want something like a stir fry with a spicy sauce, or a creamy pasta dish..."
          className="w-full min-h-[100px] px-3 py-2 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
        />
      </section>

      {/* Generate Button */}
      <div className="sticky bottom-4 bg-background/95 backdrop-blur rounded-lg border p-4 shadow-lg">
        {!isAuthenticated && !sessionPending && (
          <p className="text-sm text-muted-foreground text-center mb-3">
            <Link href="/sign-in" className="text-primary underline">
              Sign in
            </Link>{" "}
            to generate recipes
          </p>
        )}
        <Button
          onClick={handleGenerate}
          disabled={
            isGenerating ||
            !isAuthenticated ||
            equipment.length === 0 ||
            (ingredientsHave.length === 0 && ingredientsToBuy.length === 0)
          }
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Generating recipe...
            </>
          ) : (
            <>
              <ChefHat className="h-5 w-5 mr-2" />
              Generate Recipe
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
