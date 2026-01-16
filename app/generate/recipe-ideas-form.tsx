"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Field,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import {
  Loader2,
  Plus,
  X,
  Sparkles,
} from "lucide-react";
import {
  EQUIPMENT_OPTIONS,
  DIET_OPTIONS,
  ALLERGY_OPTIONS,
} from "@/lib/recipe-schema";

// Common base ingredients for quick selection
const BASE_INGREDIENTS = [
  "pasta",
  "rice",
  "noodles",
  "bread",
  "eggs",
  "chicken",
  "tofu",
  "beans",
  "potatoes",
] as const;

// Zod schema for form validation
const ideasFormSchema = z.object({
  equipment: z
    .array(z.string())
    .min(1, "Please select at least one piece of equipment"),
  diet: z.array(z.string()),
  allergies: z.array(z.string()),
  country: z.string(),
  baseIngredient: z.string(),
  additionalIngredients: z.array(z.string()),
  timeLimit: z.number().min(10).max(120),
});

type IdeasFormValues = z.infer<typeof ideasFormSchema>;

export interface IdeasFormData {
  equipment: string[];
  dietaryPreferences?: string[];
  allergens?: string[];
  country?: string;
  baseIngredient?: string;
  additionalIngredients?: string[];
  timeLimit?: number;
}

interface RecipeIdeasFormProps {
  onGenerate: (data: IdeasFormData) => Promise<void>;
  isGenerating: boolean;
}

export default function RecipeIdeasForm({
  onGenerate,
  isGenerating,
}: RecipeIdeasFormProps) {
  const [ingredientInput, setIngredientInput] = useState("");

  const form = useForm({
    defaultValues: {
      equipment: [] as string[],
      diet: [] as string[],
      allergies: [] as string[],
      country: "",
      baseIngredient: "",
      additionalIngredients: [] as string[],
      timeLimit: 30,
    } satisfies IdeasFormValues,
    validators: {
      onSubmit: ideasFormSchema,
    },
    onSubmit: async ({ value }) => {
      const data: IdeasFormData = {
        equipment: value.equipment,
        dietaryPreferences: value.diet.length > 0 ? value.diet : undefined,
        allergens: value.allergies.length > 0 ? value.allergies : undefined,
        country: value.country || undefined,
        baseIngredient: value.baseIngredient || undefined,
        additionalIngredients:
          value.additionalIngredients.length > 0 ? value.additionalIngredients : undefined,
        timeLimit: value.timeLimit,
      };
      await onGenerate(data);
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
  const toggleArrayItem = (fieldName: keyof IdeasFormValues, item: string) => {
    const current = form.getFieldValue(fieldName) as string[];
    const updated = current.includes(item)
      ? current.filter((i) => i !== item)
      : [...current, item];
    form.setFieldValue(fieldName, updated);
  };

  const addIngredient = (ingredient: string) => {
    const trimmed = ingredient.trim().toLowerCase();
    const current = form.getFieldValue("additionalIngredients");
    if (trimmed && !current.includes(trimmed)) {
      form.setFieldValue("additionalIngredients", [...current, trimmed]);
    }
    setIngredientInput("");
  };

  const removeIngredient = (ingredient: string) => {
    const current = form.getFieldValue("additionalIngredients");
    form.setFieldValue(
      "additionalIngredients",
      current.filter((i) => i !== ingredient)
    );
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-6"
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
              </Field>
            </section>
          );
        }}
      />

      {/* Base Ingredient */}
      <section className="bg-background rounded-lg border p-6">
        <h2 className="font-semibold text-lg mb-2">
          What do you want to cook with?
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Pick a base ingredient or type your own
        </p>

        <form.Subscribe
          selector={(state) => state.values.baseIngredient}
          children={(baseIngredient) => (
            <>
              <div className="flex flex-wrap gap-2 mb-4">
                {BASE_INGREDIENTS.map((ing) => (
                  <Button
                    key={ing}
                    type="button"
                    variant={baseIngredient === ing ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      form.setFieldValue("baseIngredient", baseIngredient === ing ? "" : ing)
                    }
                  >
                    {ing}
                  </Button>
                ))}
              </div>

              <form.Field
                name="baseIngredient"
                children={(field) => (
                  <Input
                    placeholder="Or type something else..."
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                      }
                    }}
                  />
                )}
              />
            </>
          )}
        />
      </section>

      {/* Additional Ingredients */}
      <section className="bg-background rounded-lg border p-6">
        <h2 className="font-semibold text-lg mb-2">
          Any other ingredients? (optional)
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Add ingredients you have or plan to buy
        </p>

        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Add an ingredient..."
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

        <form.Subscribe
          selector={(state) => state.values.additionalIngredients}
          children={(additionalIngredients) =>
            additionalIngredients.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {additionalIngredients.map((ing) => (
                  <Badge key={ing} variant="secondary" className="gap-1 pr-1">
                    {ing}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => removeIngredient(ing)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )
          }
        />
      </section>

      {/* Diet & Allergies */}
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
                      variant={
                        allergies.includes(option.id) ? "destructive" : "outline"
                      }
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

      {/* Location & Time */}
      <section className="bg-background rounded-lg border p-6">
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <form.Field
              name="country"
              children={(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name} className="text-sm font-medium">
                    Where are you? (optional)
                  </FieldLabel>
                  <Input
                    id={field.name}
                    placeholder="e.g., Thailand, Spain..."
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                      }
                    }}
                    className="mt-2"
                  />
                </Field>
              )}
            />
          </div>

          <div>
            <FieldLabel className="text-sm font-medium">Max cooking time</FieldLabel>
            <div className="flex gap-2 mt-2">
              <form.Subscribe
                selector={(state) => state.values.timeLimit}
                children={(timeLimit) =>
                  [15, 30, 45, 60].map((time) => (
                    <Button
                      key={time}
                      type="button"
                      variant={timeLimit === time ? "default" : "outline"}
                      size="sm"
                      onClick={() => form.setFieldValue("timeLimit", time)}
                    >
                      {time}m
                    </Button>
                  ))
                }
              />
            </div>
          </div>
        </div>
      </section>

      {/* Generate Button */}
      <div className="sticky bottom-4 bg-background/95 backdrop-blur rounded-lg border p-4 shadow-lg">
        <Button
          type="submit"
          disabled={isGenerating}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Generating ideas...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 mr-2" />
              Generate Recipe Ideas
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
