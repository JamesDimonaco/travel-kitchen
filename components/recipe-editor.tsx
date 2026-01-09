"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Trash2,
  GripVertical,
  Save,
  ChefHat,
  Clock,
  Users,
  ShoppingCart,
  ListChecks,
  Lightbulb,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { EQUIPMENT_OPTIONS } from "@/lib/recipe-schema";
import { toast } from "sonner";

// Types for recipe data
export interface RecipeEditorData {
  title: string;
  description: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  equipmentUsed: string[];
  shoppingList: {
    have: string[];
    need: string[];
    optional: string[];
  };
  prepGroup: Array<{
    task: string;
    ingredients: string[];
  }>;
  steps: Array<{
    number: number;
    instruction: string;
    duration?: number;
    equipment?: string;
  }>;
  substitutions: Array<{
    original: string;
    substitute: string;
    note?: string;
  }>;
  tips: string[];
}

interface RecipeEditorProps {
  initialData?: RecipeEditorData;
  onSave: (data: RecipeEditorData) => Promise<void>;
  onCancel?: () => void;
  isEditing?: boolean;
  isSaving?: boolean;
}

const defaultRecipeData: RecipeEditorData = {
  title: "",
  description: "",
  prepTime: 10,
  cookTime: 20,
  servings: 2,
  equipmentUsed: [],
  shoppingList: {
    have: [],
    need: [],
    optional: [],
  },
  prepGroup: [],
  steps: [{ number: 1, instruction: "", duration: 5 }],
  substitutions: [],
  tips: [],
};

export function RecipeEditor({
  initialData,
  onSave,
  onCancel,
  isEditing = false,
  isSaving = false,
}: RecipeEditorProps) {
  const [recipe, setRecipe] = useState<RecipeEditorData>(
    initialData || defaultRecipeData
  );

  // Input states for adding items
  const [newIngredientHave, setNewIngredientHave] = useState("");
  const [newIngredientNeed, setNewIngredientNeed] = useState("");
  const [newIngredientOptional, setNewIngredientOptional] = useState("");
  const [newPrepTask, setNewPrepTask] = useState("");
  const [newTip, setNewTip] = useState("");

  useEffect(() => {
    if (initialData) {
      setRecipe(initialData);
    }
  }, [initialData]);

  // Helper to update recipe state
  const updateRecipe = (updates: Partial<RecipeEditorData>) => {
    setRecipe((prev) => ({ ...prev, ...updates }));
  };

  // Equipment toggle
  const toggleEquipment = (equipmentId: string) => {
    const current = recipe.equipmentUsed;
    const updated = current.includes(equipmentId)
      ? current.filter((e) => e !== equipmentId)
      : [...current, equipmentId];
    updateRecipe({ equipmentUsed: updated });
  };

  // Shopping list helpers
  const addIngredient = (
    type: "have" | "need" | "optional",
    value: string,
    setValue: (v: string) => void
  ) => {
    if (!value.trim()) return;
    const current = recipe.shoppingList[type];
    if (!current.includes(value.trim())) {
      updateRecipe({
        shoppingList: {
          ...recipe.shoppingList,
          [type]: [...current, value.trim()],
        },
      });
    }
    setValue("");
  };

  const removeIngredient = (type: "have" | "need" | "optional", index: number) => {
    const current = recipe.shoppingList[type];
    updateRecipe({
      shoppingList: {
        ...recipe.shoppingList,
        [type]: current.filter((_, i) => i !== index),
      },
    });
  };

  // Prep group helpers
  const addPrepTask = () => {
    if (!newPrepTask.trim()) return;
    updateRecipe({
      prepGroup: [...recipe.prepGroup, { task: newPrepTask.trim(), ingredients: [] }],
    });
    setNewPrepTask("");
  };

  const removePrepTask = (index: number) => {
    updateRecipe({
      prepGroup: recipe.prepGroup.filter((_, i) => i !== index),
    });
  };

  const updatePrepTask = (index: number, task: string) => {
    const updated = [...recipe.prepGroup];
    updated[index] = { ...updated[index], task };
    updateRecipe({ prepGroup: updated });
  };

  // Steps helpers
  const addStep = () => {
    const newNumber = recipe.steps.length + 1;
    updateRecipe({
      steps: [...recipe.steps, { number: newNumber, instruction: "", duration: 5 }],
    });
  };

  const removeStep = (index: number) => {
    const updated = recipe.steps
      .filter((_, i) => i !== index)
      .map((step, i) => ({ ...step, number: i + 1 }));
    updateRecipe({ steps: updated });
  };

  const updateStep = (
    index: number,
    updates: Partial<RecipeEditorData["steps"][0]>
  ) => {
    const updated = [...recipe.steps];
    updated[index] = { ...updated[index], ...updates };
    updateRecipe({ steps: updated });
  };

  const moveStep = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= recipe.steps.length) return;

    const updated = [...recipe.steps];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    // Renumber
    updated.forEach((step, i) => {
      step.number = i + 1;
    });
    updateRecipe({ steps: updated });
  };

  // Substitutions helpers
  const addSubstitution = () => {
    updateRecipe({
      substitutions: [
        ...recipe.substitutions,
        { original: "", substitute: "", note: "" },
      ],
    });
  };

  const removeSubstitution = (index: number) => {
    updateRecipe({
      substitutions: recipe.substitutions.filter((_, i) => i !== index),
    });
  };

  const updateSubstitution = (
    index: number,
    updates: Partial<RecipeEditorData["substitutions"][0]>
  ) => {
    const updated = [...recipe.substitutions];
    updated[index] = { ...updated[index], ...updates };
    updateRecipe({ substitutions: updated });
  };

  // Tips helpers
  const addTip = () => {
    if (!newTip.trim()) return;
    updateRecipe({ tips: [...recipe.tips, newTip.trim()] });
    setNewTip("");
  };

  const removeTip = (index: number) => {
    updateRecipe({ tips: recipe.tips.filter((_, i) => i !== index) });
  };

  // Validation
  const validateRecipe = (): boolean => {
    if (!recipe.title.trim()) {
      toast.error("Please enter a recipe title");
      return false;
    }
    if (!recipe.description.trim()) {
      toast.error("Please enter a recipe description");
      return false;
    }
    if (recipe.equipmentUsed.length === 0) {
      toast.error("Please select at least one piece of equipment");
      return false;
    }
    if (recipe.steps.length === 0 || !recipe.steps.some((s) => s.instruction.trim())) {
      toast.error("Please add at least one step with instructions");
      return false;
    }
    const totalIngredients =
      recipe.shoppingList.have.length +
      recipe.shoppingList.need.length +
      recipe.shoppingList.optional.length;
    if (totalIngredients === 0) {
      toast.error("Please add at least one ingredient");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateRecipe()) return;
    await onSave(recipe);
  };

  return (
    <div className="space-y-6">
      {/* Title & Description */}
      <div className="bg-background rounded-lg border p-6">
        <div className="flex items-center gap-2 mb-4">
          <ChefHat className="h-5 w-5" />
          <h2 className="font-semibold text-lg">Basic Info</h2>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Recipe Title *</Label>
            <Input
              id="title"
              value={recipe.title}
              onChange={(e) => updateRecipe({ title: e.target.value })}
              placeholder="e.g., Quick Thai Peanut Noodles"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={recipe.description}
              onChange={(e) => updateRecipe({ description: e.target.value })}
              placeholder="A brief description of the dish..."
              className="mt-1"
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Time & Servings */}
      <div className="bg-background rounded-lg border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5" />
          <h2 className="font-semibold text-lg">Time & Servings</h2>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="prepTime">Prep Time (min)</Label>
            <Input
              id="prepTime"
              type="number"
              min={0}
              value={recipe.prepTime}
              onChange={(e) => updateRecipe({ prepTime: parseInt(e.target.value) || 0 })}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="cookTime">Cook Time (min)</Label>
            <Input
              id="cookTime"
              type="number"
              min={0}
              value={recipe.cookTime}
              onChange={(e) => updateRecipe({ cookTime: parseInt(e.target.value) || 0 })}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="servings">Servings</Label>
            <div className="flex items-center gap-2 mt-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() =>
                  updateRecipe({ servings: Math.max(1, recipe.servings - 1) })
                }
              >
                -
              </Button>
              <div className="flex items-center gap-1 px-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{recipe.servings}</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() =>
                  updateRecipe({ servings: Math.min(10, recipe.servings + 1) })
                }
              >
                +
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Equipment */}
      <div className="bg-background rounded-lg border p-6">
        <div className="flex items-center gap-2 mb-4">
          <ChefHat className="h-5 w-5" />
          <h2 className="font-semibold text-lg">Equipment Used *</h2>
        </div>

        <div className="flex flex-wrap gap-2">
          {EQUIPMENT_OPTIONS.map((eq) => (
            <Button
              key={eq.id}
              type="button"
              variant={recipe.equipmentUsed.includes(eq.id) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleEquipment(eq.id)}
            >
              {eq.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Shopping List */}
      <div className="bg-background rounded-lg border p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingCart className="h-5 w-5" />
          <h2 className="font-semibold text-lg">Ingredients *</h2>
        </div>

        <div className="space-y-6">
          {/* Ingredients You Have */}
          <div>
            <Label className="text-green-600">Ingredients You Have</Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={newIngredientHave}
                onChange={(e) => setNewIngredientHave(e.target.value)}
                placeholder="Add ingredient..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addIngredient("have", newIngredientHave, setNewIngredientHave);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  addIngredient("have", newIngredientHave, setNewIngredientHave)
                }
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {recipe.shoppingList.have.map((item, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm bg-green-100 text-green-700"
                >
                  {item}
                  <button
                    type="button"
                    onClick={() => removeIngredient("have", index)}
                    className="hover:text-green-900"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Ingredients To Buy */}
          <div>
            <Label className="text-orange-600">Ingredients To Buy</Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={newIngredientNeed}
                onChange={(e) => setNewIngredientNeed(e.target.value)}
                placeholder="Add ingredient..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addIngredient("need", newIngredientNeed, setNewIngredientNeed);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  addIngredient("need", newIngredientNeed, setNewIngredientNeed)
                }
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {recipe.shoppingList.need.map((item, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm bg-orange-100 text-orange-700"
                >
                  {item}
                  <button
                    type="button"
                    onClick={() => removeIngredient("need", index)}
                    className="hover:text-orange-900"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Optional Ingredients */}
          <div>
            <Label className="text-muted-foreground">Optional Ingredients</Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={newIngredientOptional}
                onChange={(e) => setNewIngredientOptional(e.target.value)}
                placeholder="Add ingredient..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addIngredient(
                      "optional",
                      newIngredientOptional,
                      setNewIngredientOptional
                    );
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  addIngredient(
                    "optional",
                    newIngredientOptional,
                    setNewIngredientOptional
                  )
                }
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {recipe.shoppingList.optional.map((item, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm bg-muted text-muted-foreground"
                >
                  {item}
                  <button
                    type="button"
                    onClick={() => removeIngredient("optional", index)}
                    className="hover:text-foreground"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Prep Group */}
      <div className="bg-background rounded-lg border p-6">
        <div className="flex items-center gap-2 mb-4">
          <ListChecks className="h-5 w-5" />
          <h2 className="font-semibold text-lg">Prep Tasks</h2>
          <span className="text-sm text-muted-foreground">(optional)</span>
        </div>

        <div className="space-y-3">
          {recipe.prepGroup.map((prep, index) => (
            <div key={index} className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <Input
                value={prep.task}
                onChange={(e) => updatePrepTask(index, e.target.value)}
                placeholder="e.g., Dice the onion"
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removePrepTask(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <div className="flex gap-2">
            <Input
              value={newPrepTask}
              onChange={(e) => setNewPrepTask(e.target.value)}
              placeholder="Add prep task..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addPrepTask();
                }
              }}
            />
            <Button type="button" variant="outline" onClick={addPrepTask}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="bg-background rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ListChecks className="h-5 w-5" />
            <h2 className="font-semibold text-lg">Instructions *</h2>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addStep}>
            <Plus className="h-4 w-4 mr-1" /> Add Step
          </Button>
        </div>

        <div className="space-y-4">
          {recipe.steps.map((step, index) => (
            <div key={index} className="flex gap-3 p-4 bg-muted/50 rounded-lg">
              <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  {step.number}
                </div>
                <div className="flex flex-col gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => moveStep(index, "up")}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => moveStep(index, "down")}
                    disabled={index === recipe.steps.length - 1}
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 space-y-3">
                <Textarea
                  value={step.instruction}
                  onChange={(e) =>
                    updateStep(index, { instruction: e.target.value })
                  }
                  placeholder="Describe this step..."
                  rows={2}
                />

                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`duration-${index}`} className="text-sm">
                      Duration (min):
                    </Label>
                    <Input
                      id={`duration-${index}`}
                      type="number"
                      min={0}
                      value={step.duration || ""}
                      onChange={(e) =>
                        updateStep(index, {
                          duration: parseInt(e.target.value) || undefined,
                        })
                      }
                      className="w-20"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Label htmlFor={`equipment-${index}`} className="text-sm">
                      Equipment:
                    </Label>
                    <select
                      id={`equipment-${index}`}
                      value={step.equipment || ""}
                      onChange={(e) =>
                        updateStep(index, { equipment: e.target.value || undefined })
                      }
                      className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                    >
                      <option value="">None</option>
                      {EQUIPMENT_OPTIONS.map((eq) => (
                        <option key={eq.id} value={eq.label}>
                          {eq.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeStep(index)}
                disabled={recipe.steps.length <= 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Substitutions */}
      <div className="bg-background rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            <h2 className="font-semibold text-lg">Substitutions</h2>
            <span className="text-sm text-muted-foreground">(optional)</span>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addSubstitution}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>

        <div className="space-y-3">
          {recipe.substitutions.map((sub, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="flex-1 grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm">Original</Label>
                  <Input
                    value={sub.original}
                    onChange={(e) =>
                      updateSubstitution(index, { original: e.target.value })
                    }
                    placeholder="e.g., Soy sauce"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">Substitute</Label>
                  <Input
                    value={sub.substitute}
                    onChange={(e) =>
                      updateSubstitution(index, { substitute: e.target.value })
                    }
                    placeholder="e.g., Tamari, coconut aminos"
                    className="mt-1"
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeSubstitution(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {recipe.substitutions.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No substitutions added. Click &quot;Add&quot; to suggest ingredient
              alternatives.
            </p>
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="bg-background rounded-lg border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="h-5 w-5" />
          <h2 className="font-semibold text-lg">Tips & Notes</h2>
          <span className="text-sm text-muted-foreground">(optional)</span>
        </div>

        <div className="space-y-3">
          {recipe.tips.map((tip, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-muted-foreground">-</span>
              <span className="flex-1 text-sm">{tip}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => removeTip(index)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}

          <div className="flex gap-2">
            <Input
              value={newTip}
              onChange={(e) => setNewTip(e.target.value)}
              placeholder="Add a tip or note..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTip();
                }
              }}
            />
            <Button type="button" variant="outline" onClick={addTip}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t p-4 -mx-4 flex gap-3 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>Saving...</>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {isEditing ? "Save Changes" : "Create Recipe"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
