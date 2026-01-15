"use client";

import { useState, useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { toast } from "sonner";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@/components/ui/field";
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
import { getAuthCookie } from "@/lib/auth-client";
import { getOrCreateSessionId } from "@/lib/session-id";

// Zod schema for form validation
const generateRecipeSchema = z.object({
  equipment: z
    .array(z.string())
    .min(1, "Please select at least one piece of equipment"),
  limitations: z.array(z.string()),
  country: z.string(),
  diet: z.array(z.string()),
  allergies: z.array(z.string()),
  servings: z.number().min(1).max(6),
  timeLimit: z.number().min(10).max(120),
  ingredientsHave: z.array(z.string()),
  ingredientsToBuy: z.array(z.string()),
  preferences: z.array(z.string()),
  notes: z.string(),
}).refine(
  (data) => data.ingredientsHave.length > 0 || data.ingredientsToBuy.length > 0,
  {
    message: "Please add at least one ingredient you have or plan to buy",
    path: ["ingredientsHave"], // Show error on the "have" field section
  }
);

type GenerateRecipeFormData = z.infer<typeof generateRecipeSchema>;

interface SingleRecipeFormProps {
  isAuthenticated: boolean;
  sessionPending: boolean;
}

export default function SingleRecipeForm({
  isAuthenticated,
  sessionPending,
}: SingleRecipeFormProps) {
  // Session ID for anonymous users
  const [sessionId, setSessionId] = useState<string>("");

  useEffect(() => {
    // Get or create session ID on mount (client-side only)
    setSessionId(getOrCreateSessionId());
  }, []);

  // Usage tracking - check if user can generate
  const usageCheck = useQuery(
    api.usage.canGenerate,
    sessionId ? { sessionId } : "skip"
  );
  const recordGeneration = useMutation(api.usage.recordGeneration);
  const recordAnonymousGeneration = useMutation(api.usage.recordAnonymousGeneration);

  // Input states for adding items
  const [ingredientHaveInput, setIngredientHaveInput] = useState("");
  const [ingredientToBuyInput, setIngredientToBuyInput] = useState("");

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [recipe, setRecipe] = useState<RecipeResponse | null>(null);
  const [formInputs, setFormInputs] = useState<RecipeFormData | null>(null);

  const form = useForm({
    defaultValues: {
      equipment: [] as string[],
      limitations: [] as string[],
      country: "",
      diet: [] as string[],
      allergies: [] as string[],
      servings: 2,
      timeLimit: 30,
      ingredientsHave: [] as string[],
      ingredientsToBuy: [] as string[],
      preferences: [] as string[],
      notes: "",
    } satisfies GenerateRecipeFormData,
    validators: {
      onSubmit: generateRecipeSchema,
    },
    onSubmit: async ({ value }) => {
      await handleGenerate(value);
    },
    onSubmitInvalid: () => {
      toast.error("Please complete required fields");
      // Scroll to first error field
      setTimeout(() => {
        const firstError = document.querySelector('[data-invalid="true"]');
        if (firstError) {
          firstError.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 50);
    },
  });

  // Helper to toggle items in an array field
  const toggleArrayItem = (fieldName: keyof GenerateRecipeFormData, item: string) => {
    const current = form.getFieldValue(fieldName) as string[];
    const updated = current.includes(item)
      ? current.filter((i) => i !== item)
      : [...current, item];
    form.setFieldValue(fieldName, updated);
  };

  const addIngredientHave = (ingredient: string) => {
    const trimmed = ingredient.trim().toLowerCase();
    const current = form.getFieldValue("ingredientsHave");
    if (trimmed && !current.includes(trimmed)) {
      form.setFieldValue("ingredientsHave", [...current, trimmed]);
    }
    setIngredientHaveInput("");
  };

  const removeIngredientHave = (ingredient: string) => {
    const current = form.getFieldValue("ingredientsHave");
    form.setFieldValue(
      "ingredientsHave",
      current.filter((i) => i !== ingredient)
    );
  };

  const addIngredientToBuy = (ingredient: string) => {
    const trimmed = ingredient.trim().toLowerCase();
    const current = form.getFieldValue("ingredientsToBuy");
    if (trimmed && !current.includes(trimmed)) {
      form.setFieldValue("ingredientsToBuy", [...current, trimmed]);
    }
    setIngredientToBuyInput("");
  };

  const removeIngredientToBuy = (ingredient: string) => {
    const current = form.getFieldValue("ingredientsToBuy");
    form.setFieldValue(
      "ingredientsToBuy",
      current.filter((i) => i !== ingredient)
    );
  };

  // Check usage-related validation
  const getUsageError = () => {
    if (!isAuthenticated && !sessionId) {
      return "Please sign in to generate recipes";
    }
    if (usageCheck && !usageCheck.canGenerate) {
      return usageCheck.isAuthenticated
        ? "You've used all your AI generations. Purchase more credits to continue."
        : "Sign up to create more recipes!";
    }
    return null;
  };

  const handleGenerate = async (value: GenerateRecipeFormData) => {
    // Check usage limits
    const usageError = getUsageError();
    if (usageError) {
      toast.error(usageError);
      return;
    }

    const formData: RecipeFormData = {
      equipment: value.equipment,
      limitations: value.limitations.length > 0 ? value.limitations : undefined,
      country: value.country || undefined,
      diet: value.diet.length > 0 ? value.diet : undefined,
      allergies: value.allergies.length > 0 ? value.allergies : undefined,
      servings: value.servings,
      timeLimit: value.timeLimit,
      ingredientsHave: value.ingredientsHave,
      ingredientsToBuy: value.ingredientsToBuy.length > 0 ? value.ingredientsToBuy : undefined,
      preferences: value.preferences.length > 0 ? value.preferences : undefined,
      notes: value.notes.trim() || undefined,
    };

    setIsGenerating(true);
    setRecipe(null);

    try {
      const response = await fetch("/api/ai/new-receipe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Better-Auth-Cookie": getAuthCookie(),
        },
        body: JSON.stringify({
          ...formData,
          // Include sessionId for anonymous users
          sessionId: !isAuthenticated ? sessionId : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate recipe");
      }

      // Record usage after successful generation
      try {
        if (isAuthenticated) {
          await recordGeneration();
        } else if (sessionId) {
          await recordAnonymousGeneration({ sessionId });
        }
      } catch (usageError) {
        console.error("Failed to record usage:", usageError);
        // Don't fail the generation if usage recording fails
      }

      setRecipe(data.recipe);
      setFormInputs(data.inputs);
      track(ANALYTICS_EVENTS.RECIPE_GENERATED, {
        equipment: value.equipment.length,
        hasCountry: !!value.country,
        hasDiet: value.diet.length > 0,
        timeLimit: value.timeLimit,
        servings: value.servings,
        isAuthenticated,
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
        sessionId={!isAuthenticated ? sessionId : undefined}
        onRecipeUpdate={handleRecipeUpdate}
      />
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        // Check usage before form submission
        const usageError = getUsageError();
        if (usageError) {
          toast.error(usageError);
          return;
        }
        form.handleSubmit();
      }}
      className="space-y-8"
    >
      {/* Equipment Section */}
      <form.Field
        name="equipment"
        children={(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
          return (
            <section className="bg-background rounded-lg border p-6">
              <Field data-invalid={isInvalid}>
                <h2 className="font-semibold text-lg mb-1">
                  What equipment do you have? <span className="text-destructive">*</span>
                </h2>
                {isInvalid && (
                  <FieldError errors={field.state.meta.errors} className="mb-3" />
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                  {EQUIPMENT_OPTIONS.map((option) => (
                    <label
                      key={option.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        field.state.value.includes(option.id)
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-muted"
                      }`}
                    >
                      <Checkbox
                        checked={field.state.value.includes(option.id)}
                        onCheckedChange={() => {
                          toggleArrayItem("equipment", option.id);
                          field.handleBlur();
                        }}
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
                    <form.Subscribe
                      selector={(state) => state.values.limitations}
                      children={(limitations) =>
                        LIMITATION_OPTIONS.map((option) => (
                          <Button
                            key={option.id}
                            type="button"
                            variant={limitations.includes(option.id) ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleArrayItem("limitations", option.id)}
                          >
                            {option.label}
                          </Button>
                        ))
                      }
                    />
                  </div>
                </div>
              </Field>
            </section>
          );
        }}
      />

      {/* Location Section */}
      <section className="bg-background rounded-lg border p-6">
        <h2 className="font-semibold text-lg mb-4">Where are you?</h2>
        <form.Field
          name="country"
          children={(field) => (
            <Field>
              <FieldLabel htmlFor={field.name} className="text-sm text-muted-foreground">
                Country or region (helps with local ingredients)
              </FieldLabel>
              <Input
                id={field.name}
                placeholder="e.g., Thailand, Spain, Japan..."
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                className="mt-2"
              />
            </Field>
          )}
        />
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
              <form.Subscribe
                selector={(state) => state.values.diet}
                children={(diet) =>
                  DIET_OPTIONS.map((option) => (
                    <Button
                      key={option.id}
                      type="button"
                      variant={diet.includes(option.id) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleArrayItem("diet", option.id)}
                    >
                      {option.label}
                    </Button>
                  ))
                }
              />
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-3">Allergies</p>
            <div className="flex flex-wrap gap-2">
              <form.Subscribe
                selector={(state) => state.values.allergies}
                children={(allergies) =>
                  ALLERGY_OPTIONS.map((option) => (
                    <Button
                      key={option.id}
                      type="button"
                      variant={allergies.includes(option.id) ? "destructive" : "outline"}
                      size="sm"
                      onClick={() => toggleArrayItem("allergies", option.id)}
                    >
                      {option.label}
                    </Button>
                  ))
                }
              />
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
              <form.Subscribe
                selector={(state) => state.values.timeLimit}
                children={(timeLimit) =>
                  TIME_OPTIONS.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={timeLimit === option.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => form.setFieldValue("timeLimit", option.value)}
                    >
                      {option.label}
                    </Button>
                  ))
                }
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <Users className="h-4 w-4" />
              <span>Servings</span>
            </div>
            <form.Subscribe
              selector={(state) => state.values.servings}
              children={(servings) => (
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => form.setFieldValue("servings", Math.max(1, servings - 1))}
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
                    onClick={() => form.setFieldValue("servings", Math.min(6, servings + 1))}
                    disabled={servings >= 6}
                  >
                    +
                  </Button>
                </div>
              )}
            />
          </div>
        </div>
      </section>

      {/* Ingredients I Have Section */}
      <form.Field
        name="ingredientsHave"
        children={(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
          return (
            <section className="bg-background rounded-lg border p-6">
              <Field data-invalid={isInvalid}>
                <h2 className="font-semibold text-lg mb-1">
                  What ingredients do you have? <span className="text-destructive">*</span>
                </h2>
                <FieldDescription>
                  Add ingredients you already have, or add items to buy below
                </FieldDescription>
                {isInvalid && (
                  <FieldError errors={field.state.meta.errors} className="mt-2" />
                )}

                {/* Input */}
                <div className="flex gap-2 mt-4 mb-4">
                  <Input
                    placeholder="Type an ingredient..."
                    value={ingredientHaveInput}
                    onChange={(e) => setIngredientHaveInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addIngredientHave(ingredientHaveInput);
                        field.handleBlur();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      addIngredientHave(ingredientHaveInput);
                      field.handleBlur();
                    }}
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
                        onClick={() => {
                          addIngredientHave(staple);
                          field.handleBlur();
                        }}
                        disabled={field.state.value.includes(staple)}
                      >
                        + {staple}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Selected ingredients */}
                {field.state.value.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Your ingredients:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {field.state.value.map((ing) => (
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
              </Field>
            </section>
          );
        }}
      />

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
            <form.Subscribe
              selector={(state) => state.values.ingredientsToBuy}
              children={(ingredientsToBuy) =>
                QUICK_TO_BUY.map((item) => (
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
                ))
              }
            />
          </div>
        </div>

        {/* Selected ingredients to buy */}
        <form.Subscribe
          selector={(state) => state.values.ingredientsToBuy}
          children={(ingredientsToBuy) =>
            ingredientsToBuy.length > 0 && (
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
            )
          }
        />
      </section>

      {/* Preferences Section */}
      <section className="bg-background rounded-lg border p-6">
        <h2 className="font-semibold text-lg mb-4">
          Taste preferences (optional)
        </h2>
        <div className="flex flex-wrap gap-2">
          <form.Subscribe
            selector={(state) => state.values.preferences}
            children={(preferences) =>
              PREFERENCE_OPTIONS.map((option) => (
                <Button
                  key={option.id}
                  type="button"
                  variant={preferences.includes(option.id) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleArrayItem("preferences", option.id)}
                >
                  {option.label}
                </Button>
              ))
            }
          />
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
        <form.Field
          name="notes"
          children={(field) => (
            <textarea
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="e.g., I want something like a stir fry with a spicy sauce, or a creamy pasta dish..."
              className="w-full min-h-[100px] px-3 py-2 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
            />
          )}
        />
      </section>

      {/* Generate Button */}
      <div className="sticky bottom-4 bg-background/95 backdrop-blur rounded-lg border p-4 shadow-lg">
        {/* Usage info for authenticated users */}
        {isAuthenticated && usageCheck && (
          <p className="text-sm text-muted-foreground text-center mb-3">
            {usageCheck.remaining > 0 ? (
              <>You have {usageCheck.remaining} AI generation{usageCheck.remaining !== 1 ? "s" : ""} remaining</>
            ) : (
              <>You&apos;ve used all your AI generations. <Link href="/pricing" className="text-primary underline">Get more credits</Link></>
            )}
          </p>
        )}

        {/* Prompt for anonymous users */}
        {!isAuthenticated && !sessionPending && usageCheck && (
          <p className="text-sm text-muted-foreground text-center mb-3">
            {usageCheck.canGenerate ? (
              <>Create your first recipe free! <Link href="/sign-up" className="text-primary underline">Sign up</Link> to keep it and unlock 2 more.</>
            ) : (
              <>You&apos;ve used your free recipe. <Link href="/sign-up" className="text-primary underline">Sign up</Link> to unlock 2 more!</>
            )}
          </p>
        )}

        <Button
          type="submit"
          disabled={isGenerating}
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
    </form>
  );
}
