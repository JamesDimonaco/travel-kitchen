"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  ChefHat,
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
  const [equipment, setEquipment] = useState<string[]>([]);
  const [diet, setDiet] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [country, setCountry] = useState("");
  const [baseIngredient, setBaseIngredient] = useState("");
  const [additionalIngredients, setAdditionalIngredients] = useState<string[]>(
    []
  );
  const [ingredientInput, setIngredientInput] = useState("");
  const [timeLimit, setTimeLimit] = useState(30);

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
    if (trimmed && !additionalIngredients.includes(trimmed)) {
      setAdditionalIngredients([...additionalIngredients, trimmed]);
    }
    setIngredientInput("");
  };

  const removeIngredient = (ingredient: string) => {
    setAdditionalIngredients(
      additionalIngredients.filter((i) => i !== ingredient)
    );
  };

  const handleSubmit = async () => {
    const data: IdeasFormData = {
      equipment,
      dietaryPreferences: diet.length > 0 ? diet : undefined,
      allergens: allergies.length > 0 ? allergies : undefined,
      country: country || undefined,
      baseIngredient: baseIngredient || undefined,
      additionalIngredients:
        additionalIngredients.length > 0 ? additionalIngredients : undefined,
      timeLimit,
    };
    await onGenerate(data);
  };

  const canGenerate = equipment.length > 0;

  return (
    <div className="space-y-6">
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
      </section>

      {/* Base Ingredient */}
      <section className="bg-background rounded-lg border p-6">
        <h2 className="font-semibold text-lg mb-2">
          What do you want to cook with?
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Pick a base ingredient or type your own
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {BASE_INGREDIENTS.map((ing) => (
            <Button
              key={ing}
              type="button"
              variant={baseIngredient === ing ? "default" : "outline"}
              size="sm"
              onClick={() =>
                setBaseIngredient(baseIngredient === ing ? "" : ing)
              }
            >
              {ing}
            </Button>
          ))}
        </div>

        <Input
          placeholder="Or type something else..."
          value={baseIngredient}
          onChange={(e) => setBaseIngredient(e.target.value)}
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

        {additionalIngredients.length > 0 && (
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
        )}
      </section>

      {/* Diet & Allergies (collapsible) */}
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
                  variant={
                    allergies.includes(option.id) ? "destructive" : "outline"
                  }
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

      {/* Location & Time */}
      <section className="bg-background rounded-lg border p-6">
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="country" className="text-sm font-medium">
              Where are you? (optional)
            </Label>
            <Input
              id="country"
              placeholder="e.g., Thailand, Spain..."
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="mt-2"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Max cooking time</Label>
            <div className="flex gap-2 mt-2">
              {[15, 30, 45, 60].map((time) => (
                <Button
                  key={time}
                  type="button"
                  variant={timeLimit === time ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeLimit(time)}
                >
                  {time}m
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Generate Button */}
      <div className="sticky bottom-4 bg-background/95 backdrop-blur rounded-lg border p-4 shadow-lg">
        <Button
          onClick={handleSubmit}
          disabled={isGenerating || !canGenerate}
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
        {!canGenerate && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Select at least one piece of equipment
          </p>
        )}
      </div>
    </div>
  );
}
