"use client";

import { useState } from "react";
import { useSession } from "@/lib/auth-client";
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
  ArrowLeft,
  Clock,
  Users,
} from "lucide-react";
import {
  EQUIPMENT_OPTIONS,
  LIMITATION_OPTIONS,
  DIET_OPTIONS,
  ALLERGY_OPTIONS,
  QUICK_STAPLES,
  TIME_OPTIONS,
  PREFERENCE_OPTIONS,
  type RecipeFormData,
  type RecipeResponse,
} from "@/lib/recipe-schema";
import RecipeResult from "./recipe-result";

export default function GeneratePage() {
  const { data: session, isPending: sessionPending } = useSession();

  // Form state
  const [equipment, setEquipment] = useState<string[]>([]);
  const [limitations, setLimitations] = useState<string[]>([]);
  const [country, setCountry] = useState("");
  const [diet, setDiet] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [servings, setServings] = useState(2);
  const [timeLimit, setTimeLimit] = useState(30);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [ingredientInput, setIngredientInput] = useState("");
  const [preferences, setPreferences] = useState<string[]>([]);

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

  const addIngredient = (ingredient: string) => {
    const trimmed = ingredient.trim().toLowerCase();
    if (trimmed && !ingredients.includes(trimmed)) {
      setIngredients([...ingredients, trimmed]);
    }
    setIngredientInput("");
  };

  const removeIngredient = (ingredient: string) => {
    setIngredients(ingredients.filter((i) => i !== ingredient));
  };

  const handleGenerate = async () => {
    if (!session) {
      toast.error("Please sign in to generate recipes");
      return;
    }

    if (equipment.length === 0) {
      toast.error("Please select at least one piece of equipment");
      return;
    }

    if (ingredients.length === 0) {
      toast.error("Please add at least one ingredient");
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
      ingredients,
      preferences: preferences.length > 0 ? preferences : undefined,
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
      toast.success("Recipe generated!");
    } catch (error) {
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

  // Show recipe result if we have one
  if (recipe && formInputs) {
    return (
      <RecipeResult
        recipe={recipe}
        inputs={formInputs}
        onBack={resetForm}
        isAuthenticated={!!session}
      />
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="container mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            <span className="font-semibold">Generate Recipe</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
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
                  <button
                    key={option.id}
                    type="button"
                    onClick={() =>
                      toggleArrayItem(limitations, setLimitations, option.id)
                    }
                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                      limitations.includes(option.id)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "hover:bg-muted"
                    }`}
                  >
                    {option.label}
                  </button>
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
            <h2 className="font-semibold text-lg mb-4">
              Diet & Allergies
            </h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-3">
                  Dietary preferences
                </p>
                <div className="flex flex-wrap gap-2">
                  {DIET_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggleArrayItem(diet, setDiet, option.id)}
                      className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                        diet.includes(option.id)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "hover:bg-muted"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-3">Allergies</p>
                <div className="flex flex-wrap gap-2">
                  {ALLERGY_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() =>
                        toggleArrayItem(allergies, setAllergies, option.id)
                      }
                      className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                        allergies.includes(option.id)
                          ? "bg-destructive text-destructive-foreground border-destructive"
                          : "hover:bg-muted"
                      }`}
                    >
                      {option.label}
                    </button>
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
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTimeLimit(option.value)}
                      className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                        timeLimit === option.value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "hover:bg-muted"
                      }`}
                    >
                      {option.label}
                    </button>
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

          {/* Ingredients Section */}
          <section className="bg-background rounded-lg border p-6">
            <h2 className="font-semibold text-lg mb-4">
              What ingredients do you have?
            </h2>

            {/* Input */}
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Type an ingredient..."
                value={ingredientInput}
                onChange={(e) => setIngredientInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addIngredient(ingredientInput);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => addIngredient(ingredientInput)}
                disabled={!ingredientInput.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Quick staples */}
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">Quick add:</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_STAPLES.map((staple) => (
                  <button
                    key={staple}
                    type="button"
                    onClick={() => addIngredient(staple)}
                    disabled={ingredients.includes(staple)}
                    className={`px-2 py-1 text-xs rounded border transition-colors ${
                      ingredients.includes(staple)
                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                        : "hover:bg-muted"
                    }`}
                  >
                    + {staple}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected ingredients */}
            {ingredients.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Your ingredients:
                </p>
                <div className="flex flex-wrap gap-2">
                  {ingredients.map((ing) => (
                    <span
                      key={ing}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                    >
                      {ing}
                      <button
                        type="button"
                        onClick={() => removeIngredient(ing)}
                        className="hover:bg-primary/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
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
                <button
                  key={option.id}
                  type="button"
                  onClick={() =>
                    toggleArrayItem(preferences, setPreferences, option.id)
                  }
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                    preferences.includes(option.id)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "hover:bg-muted"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>

          {/* Generate Button */}
          <div className="sticky bottom-4 bg-background/95 backdrop-blur rounded-lg border p-4 shadow-lg">
            {!session && !sessionPending && (
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
                !session ||
                equipment.length === 0 ||
                ingredients.length === 0
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
      </main>
    </div>
  );
}
