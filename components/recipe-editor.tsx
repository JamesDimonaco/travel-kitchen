"use client";

import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
} from "@/components/ui/field";
import {
  Plus,
  Trash2,
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

// Zod schema for validation
const recipeSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be less than 100 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must be less than 500 characters"),
  prepTime: z.number().min(0, "Prep time cannot be negative"),
  cookTime: z.number().min(0, "Cook time cannot be negative"),
  servings: z.number().min(1, "Must have at least 1 serving").max(10, "Maximum 10 servings"),
  equipmentUsed: z
    .array(z.string())
    .min(1, "Select at least one piece of equipment"),
  shoppingList: z.object({
    have: z.array(z.string()),
    need: z.array(z.string()),
    optional: z.array(z.string()),
  }).refine(
    (data) => data.have.length + data.need.length + data.optional.length > 0,
    "Add at least one ingredient"
  ),
  prepGroup: z.array(
    z.object({
      task: z.string(),
      ingredients: z.array(z.string()),
    })
  ),
  steps: z
    .array(
      z.object({
        number: z.number(),
        instruction: z.string(),
        duration: z.number().optional(),
        equipment: z.string().optional(),
      })
    )
    .min(1, "Add at least one step")
    .refine(
      (steps) => steps.some((s) => s.instruction.trim().length > 0),
      "At least one step must have instructions"
    ),
  substitutions: z.array(
    z.object({
      original: z.string(),
      substitute: z.string(),
      note: z.string().optional(),
    })
  ),
  tips: z.array(z.string()),
});

// Types for recipe data
export type RecipeEditorData = z.infer<typeof recipeSchema>;

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
  // Input states for adding items
  const [newIngredientHave, setNewIngredientHave] = useState("");
  const [newIngredientNeed, setNewIngredientNeed] = useState("");
  const [newIngredientOptional, setNewIngredientOptional] = useState("");
  const [newPrepTask, setNewPrepTask] = useState("");
  const [newTip, setNewTip] = useState("");

  const form = useForm({
    defaultValues: initialData || defaultRecipeData,
    validators: {
      onSubmit: recipeSchema,
    },
    onSubmit: async ({ value }) => {
      await onSave(value);
    },
  });

  // Equipment toggle helper
  const toggleEquipment = (equipmentId: string) => {
    const current = form.getFieldValue("equipmentUsed");
    const updated = current.includes(equipmentId)
      ? current.filter((e) => e !== equipmentId)
      : [...current, equipmentId];
    form.setFieldValue("equipmentUsed", updated);
  };

  // Shopping list helpers
  const addIngredient = (
    type: "have" | "need" | "optional",
    value: string,
    setValue: (v: string) => void
  ) => {
    if (!value.trim()) return;
    const current = form.getFieldValue("shoppingList");
    if (!current[type].includes(value.trim())) {
      form.setFieldValue("shoppingList", {
        ...current,
        [type]: [...current[type], value.trim()],
      });
    }
    setValue("");
  };

  const removeIngredient = (type: "have" | "need" | "optional", index: number) => {
    const current = form.getFieldValue("shoppingList");
    form.setFieldValue("shoppingList", {
      ...current,
      [type]: current[type].filter((_, i) => i !== index),
    });
  };

  // Prep group helpers
  const addPrepTask = () => {
    if (!newPrepTask.trim()) return;
    const current = form.getFieldValue("prepGroup");
    form.setFieldValue("prepGroup", [
      ...current,
      { task: newPrepTask.trim(), ingredients: [] },
    ]);
    setNewPrepTask("");
  };

  const removePrepTask = (index: number) => {
    const current = form.getFieldValue("prepGroup");
    form.setFieldValue(
      "prepGroup",
      current.filter((_, i) => i !== index)
    );
  };

  const updatePrepTask = (index: number, task: string) => {
    const current = form.getFieldValue("prepGroup");
    const updated = [...current];
    updated[index] = { ...updated[index], task };
    form.setFieldValue("prepGroup", updated);
  };

  // Steps helpers
  const addStep = () => {
    const current = form.getFieldValue("steps");
    const newNumber = current.length + 1;
    form.setFieldValue("steps", [
      ...current,
      { number: newNumber, instruction: "", duration: 5 },
    ]);
  };

  const removeStep = (index: number) => {
    const current = form.getFieldValue("steps");
    const updated = current
      .filter((_, i) => i !== index)
      .map((step, i) => ({ ...step, number: i + 1 }));
    form.setFieldValue("steps", updated);
  };

  const updateStep = (
    index: number,
    updates: Partial<RecipeEditorData["steps"][0]>
  ) => {
    const current = form.getFieldValue("steps");
    const updated = [...current];
    updated[index] = { ...updated[index], ...updates };
    form.setFieldValue("steps", updated);
  };

  const moveStep = (index: number, direction: "up" | "down") => {
    const current = form.getFieldValue("steps");
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= current.length) return;

    const updated = [...current];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    updated.forEach((step, i) => {
      step.number = i + 1;
    });
    form.setFieldValue("steps", updated);
  };

  // Substitutions helpers
  const addSubstitution = () => {
    const current = form.getFieldValue("substitutions");
    form.setFieldValue("substitutions", [
      ...current,
      { original: "", substitute: "", note: "" },
    ]);
  };

  const removeSubstitution = (index: number) => {
    const current = form.getFieldValue("substitutions");
    form.setFieldValue(
      "substitutions",
      current.filter((_, i) => i !== index)
    );
  };

  const updateSubstitution = (
    index: number,
    updates: Partial<RecipeEditorData["substitutions"][0]>
  ) => {
    const current = form.getFieldValue("substitutions");
    const updated = [...current];
    updated[index] = { ...updated[index], ...updates };
    form.setFieldValue("substitutions", updated);
  };

  // Tips helpers
  const addTip = () => {
    if (!newTip.trim()) return;
    const current = form.getFieldValue("tips");
    form.setFieldValue("tips", [...current, newTip.trim()]);
    setNewTip("");
  };

  const removeTip = (index: number) => {
    const current = form.getFieldValue("tips");
    form.setFieldValue(
      "tips",
      current.filter((_, i) => i !== index)
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
      {/* Title & Description */}
      <div className="bg-background rounded-lg border p-6">
        <div className="flex items-center gap-2 mb-4">
          <ChefHat className="h-5 w-5" />
          <h2 className="font-semibold text-lg">Basic Info</h2>
        </div>

        <FieldGroup>
          <form.Field
            name="title"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Recipe Title *</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="e.g., Quick Thai Peanut Noodles"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />

          <form.Field
            name="description"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Description *</FieldLabel>
                  <Textarea
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="A brief description of the dish..."
                    rows={3}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />
        </FieldGroup>
      </div>

      {/* Time & Servings */}
      <div className="bg-background rounded-lg border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5" />
          <h2 className="font-semibold text-lg">Time & Servings</h2>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <form.Field
            name="prepTime"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Prep Time (min)</FieldLabel>
                  <Input
                    id={field.name}
                    type="number"
                    min={0}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) =>
                      field.handleChange(parseInt(e.target.value) || 0)
                    }
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />

          <form.Field
            name="cookTime"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Cook Time (min)</FieldLabel>
                  <Input
                    id={field.name}
                    type="number"
                    min={0}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) =>
                      field.handleChange(parseInt(e.target.value) || 0)
                    }
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />

          <form.Field
            name="servings"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Servings</FieldLabel>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        field.handleChange(Math.max(1, field.state.value - 1))
                      }
                    >
                      -
                    </Button>
                    <div className="flex items-center gap-1 px-3">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{field.state.value}</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        field.handleChange(Math.min(10, field.state.value + 1))
                      }
                    >
                      +
                    </Button>
                  </div>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />
        </div>
      </div>

      {/* Equipment */}
      <form.Field
        name="equipmentUsed"
        children={(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid;
          return (
            <div className="bg-background rounded-lg border p-6">
              <Field data-invalid={isInvalid}>
                <div className="flex items-center gap-2 mb-4">
                  <ChefHat className="h-5 w-5" />
                  <FieldLabel className="font-semibold text-lg m-0">
                    Equipment Used *
                  </FieldLabel>
                </div>

                <div className="flex flex-wrap gap-2">
                  {EQUIPMENT_OPTIONS.map((eq) => (
                    <Button
                      key={eq.id}
                      type="button"
                      variant={
                        field.state.value.includes(eq.id) ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => {
                        toggleEquipment(eq.id);
                        field.handleBlur();
                      }}
                    >
                      {eq.label}
                    </Button>
                  ))}
                </div>
                {isInvalid && (
                  <FieldError errors={field.state.meta.errors} className="mt-2" />
                )}
              </Field>
            </div>
          );
        }}
      />

      {/* Shopping List */}
      <form.Field
        name="shoppingList"
        children={(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid;
          const shoppingList = field.state.value;

          return (
            <div className="bg-background rounded-lg border p-6">
              <Field data-invalid={isInvalid}>
                <div className="flex items-center gap-2 mb-4">
                  <ShoppingCart className="h-5 w-5" />
                  <FieldLabel className="font-semibold text-lg m-0">
                    Ingredients *
                  </FieldLabel>
                </div>

                <div className="space-y-6">
                  {/* Ingredients You Have */}
                  <div>
                    <FieldLabel className="text-green-600">
                      Ingredients You Have
                    </FieldLabel>
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={newIngredientHave}
                        onChange={(e) => setNewIngredientHave(e.target.value)}
                        placeholder="Add ingredient..."
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addIngredient(
                              "have",
                              newIngredientHave,
                              setNewIngredientHave
                            );
                            field.handleBlur();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          addIngredient(
                            "have",
                            newIngredientHave,
                            setNewIngredientHave
                          );
                          field.handleBlur();
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {shoppingList.have.map((item, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                        >
                          {item}
                          <button
                            type="button"
                            onClick={() => removeIngredient("have", index)}
                            className="hover:text-green-900 dark:hover:text-green-100"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Ingredients To Buy */}
                  <div>
                    <FieldLabel className="text-orange-600">
                      Ingredients To Buy
                    </FieldLabel>
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={newIngredientNeed}
                        onChange={(e) => setNewIngredientNeed(e.target.value)}
                        placeholder="Add ingredient..."
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addIngredient(
                              "need",
                              newIngredientNeed,
                              setNewIngredientNeed
                            );
                            field.handleBlur();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          addIngredient(
                            "need",
                            newIngredientNeed,
                            setNewIngredientNeed
                          );
                          field.handleBlur();
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {shoppingList.need.map((item, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                        >
                          {item}
                          <button
                            type="button"
                            onClick={() => removeIngredient("need", index)}
                            className="hover:text-orange-900 dark:hover:text-orange-100"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Optional Ingredients */}
                  <div>
                    <FieldLabel className="text-muted-foreground">
                      Optional Ingredients
                    </FieldLabel>
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
                            field.handleBlur();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          addIngredient(
                            "optional",
                            newIngredientOptional,
                            setNewIngredientOptional
                          );
                          field.handleBlur();
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {shoppingList.optional.map((item, index) => (
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

                {isInvalid && (
                  <FieldError errors={field.state.meta.errors} className="mt-2" />
                )}
              </Field>
            </div>
          );
        }}
      />

      {/* Prep Group */}
      <div className="bg-background rounded-lg border p-6">
        <div className="flex items-center gap-2 mb-4">
          <ListChecks className="h-5 w-5" />
          <h2 className="font-semibold text-lg">Prep Tasks</h2>
          <span className="text-sm text-muted-foreground">(optional)</span>
        </div>

        <div className="space-y-3">
          <form.Subscribe
            selector={(state) => state.values.prepGroup}
            children={(prepGroup) =>
              prepGroup.map((prep, index) => (
                <div key={index} className="flex items-center gap-2">
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
              ))
            }
          />

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
      <form.Field
        name="steps"
        children={(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid;
          const steps = field.state.value;

          return (
            <div className="bg-background rounded-lg border p-6">
              <Field data-invalid={isInvalid}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ListChecks className="h-5 w-5" />
                    <FieldLabel className="font-semibold text-lg m-0">
                      Instructions *
                    </FieldLabel>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addStep}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Step
                  </Button>
                </div>

                <div className="space-y-4">
                  {steps.map((step, index) => (
                    <div
                      key={index}
                      className="flex gap-3 p-4 bg-muted/50 rounded-lg"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                          {step.number}
                        </div>
                        <div className="flex flex-col gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => moveStep(index, "up")}
                            disabled={index === 0}
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => moveStep(index, "down")}
                            disabled={index === steps.length - 1}
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
                          onBlur={field.handleBlur}
                          placeholder="Describe this step..."
                          rows={2}
                        />

                        <div className="flex gap-4">
                          <div className="flex items-center gap-2">
                            <FieldLabel
                              htmlFor={`duration-${index}`}
                              className="text-sm"
                            >
                              Duration (min):
                            </FieldLabel>
                            <Input
                              id={`duration-${index}`}
                              type="number"
                              min={0}
                              value={step.duration || ""}
                              onChange={(e) =>
                                updateStep(index, {
                                  duration:
                                    parseInt(e.target.value) || undefined,
                                })
                              }
                              className="w-20"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <FieldLabel
                              htmlFor={`equipment-${index}`}
                              className="text-sm"
                            >
                              Equipment:
                            </FieldLabel>
                            <select
                              id={`equipment-${index}`}
                              value={step.equipment || ""}
                              onChange={(e) =>
                                updateStep(index, {
                                  equipment: e.target.value || undefined,
                                })
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
                        disabled={steps.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {isInvalid && (
                  <FieldError errors={field.state.meta.errors} className="mt-2" />
                )}
              </Field>
            </div>
          );
        }}
      />

      {/* Substitutions */}
      <div className="bg-background rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            <h2 className="font-semibold text-lg">Substitutions</h2>
            <span className="text-sm text-muted-foreground">(optional)</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addSubstitution}
          >
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>

        <div className="space-y-3">
          <form.Subscribe
            selector={(state) => state.values.substitutions}
            children={(substitutions) =>
              substitutions.map((sub, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div>
                      <FieldLabel className="text-sm">Original</FieldLabel>
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
                      <FieldLabel className="text-sm">Substitute</FieldLabel>
                      <Input
                        value={sub.substitute}
                        onChange={(e) =>
                          updateSubstitution(index, {
                            substitute: e.target.value,
                          })
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
              ))
            }
          />

          <form.Subscribe
            selector={(state) => state.values.substitutions}
            children={(substitutions) =>
              substitutions.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No substitutions added. Click &quot;Add&quot; to suggest
                  ingredient alternatives.
                </p>
              )
            }
          />
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
          <form.Subscribe
            selector={(state) => state.values.tips}
            children={(tips) =>
              tips.map((tip, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-muted-foreground">-</span>
                  <span className="flex-1 text-sm">{tip}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => removeTip(index)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))
            }
          />

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
        <Button type="submit" disabled={isSaving}>
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
    </form>
  );
}
