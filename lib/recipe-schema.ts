import { z } from "zod";

// Equipment options
export const EQUIPMENT_OPTIONS = [
  { id: "hob", label: "Hob / Stovetop" },
  { id: "microwave", label: "Microwave" },
  { id: "oven", label: "Oven" },
  { id: "kettle", label: "Kettle" },
  { id: "rice_cooker", label: "Rice Cooker" },
  { id: "toaster", label: "Toaster" },
] as const;

// Kitchen limitations
export const LIMITATION_OPTIONS = [
  { id: "one_pot", label: "Only one pot/pan" },
  { id: "limited_knife", label: "Limited knife/cutting" },
  { id: "no_fridge", label: "No fridge access" },
] as const;

// Diet options
export const DIET_OPTIONS = [
  { id: "vegetarian", label: "Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "halal", label: "Halal" },
  { id: "kosher", label: "Kosher" },
] as const;

// Allergy options
export const ALLERGY_OPTIONS = [
  { id: "nuts", label: "Nuts" },
  { id: "dairy", label: "Dairy" },
  { id: "gluten", label: "Gluten" },
  { id: "seafood", label: "Seafood" },
  { id: "eggs", label: "Eggs" },
  { id: "soy", label: "Soy" },
] as const;

// Quick staples for easy adding
export const QUICK_STAPLES = [
  "rice",
  "pasta",
  "eggs",
  "onion",
  "garlic",
  "canned beans",
  "olive oil",
  "salt",
  "pepper",
] as const;

// Time options
export const TIME_OPTIONS = [
  { value: 10, label: "10 min" },
  { value: 20, label: "20 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
] as const;

// Preference options
export const PREFERENCE_OPTIONS = [
  { id: "spicy", label: "Spicy" },
  { id: "mild", label: "Mild" },
  { id: "high_protein", label: "High Protein" },
  { id: "comfort", label: "Comfort Food" },
  { id: "fresh", label: "Fresh & Light" },
] as const;

// Form input schema
export const recipeFormSchema = z.object({
  equipment: z.array(z.string()).min(1, "Select at least one equipment"),
  limitations: z.array(z.string()).optional(),
  country: z.string().optional(),
  diet: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  servings: z.number().min(1).max(6).default(2),
  timeLimit: z.number().min(10).max(60).default(30),
  ingredients: z.array(z.string()).min(1, "Add at least one ingredient"),
  preferences: z.array(z.string()).optional(),
});

export type RecipeFormData = z.infer<typeof recipeFormSchema>;

// AI response schema
export const recipeResponseSchema = z.object({
  title: z.string(),
  summary: z.string(),
  assumptions: z.array(z.string()),
  servings: z.number(),
  time_minutes: z.number(),
  equipment_used: z.array(z.string()),
  shopping: z.object({
    have: z.array(z.string()),
    need: z.array(z.string()),
    optional: z.array(z.string()),
  }),
  prep_group: z.array(z.string()),
  steps: z.array(
    z.object({
      title: z.string(),
      detail: z.string(),
      time_minutes: z.number(),
    })
  ),
  substitutions: z.array(
    z.object({
      ingredient: z.string(),
      swap_options: z.array(z.string()),
    })
  ),
  diet_notes: z.array(z.string()),
});

export type RecipeResponse = z.infer<typeof recipeResponseSchema>;
