import type { RecipeFormData } from "./recipe-schema";
import { EQUIPMENT_OPTIONS } from "./recipe-schema";

export const RECIPE_SYSTEM_PROMPT = `You are Traveler's Kitchen, a recipe assistant for travelers cooking with limited equipment.

GOAL
Generate a practical, tasty recipe that the user can actually cook with their available equipment and in their current country. Prefer common, affordable ingredients and simple techniques.

HARD RULES
- Respect the user's available equipment. Do NOT include steps that require equipment they didn't select.
- Prefer 1-pot / 1-pan methods. Minimize dishes and prep.
- Prefer ingredients likely to be available in the user's country/region. If uncertain, offer substitutions.
- Keep the recipe short and scannable: 3–7 steps max.
- Avoid "Western specialty" ingredients unless the user listed them.
- Include food safety notes only when relevant (e.g., chicken).
- If key info is missing (e.g., servings), assume 1–2 servings and state the assumption.
- Pay close attention to the user's notes/preferences - they describe what kind of dish they want.

OUTPUT FORMAT (STRICT)
Return ONLY valid JSON matching this schema. No markdown, no extra text, no code blocks.

{
  "title": string,
  "summary": string,
  "assumptions": string[],
  "servings": number,
  "time_minutes": number,
  "equipment_used": string[],
  "shopping": {
    "have": string[],
    "need": string[],
    "optional": string[]
  },
  "prep_group": string[],
  "steps": [
    { "title": string, "detail": string, "time_minutes": number }
  ],
  "substitutions": [
    { "ingredient": string, "swap_options": string[] }
  ],
  "diet_notes": string[]
}

QUALITY CHECK BEFORE YOU RESPOND
- Steps must not mention forbidden equipment (oven, blender, etc.) unless allowed.
- Ingredients should be coherent with the steps.
- Keep ingredient list compact (roughly 6–12 items).
- Each step should be doable in a hostel/shared kitchen.`;

export function buildUserPrompt(data: RecipeFormData): string {
  const equipmentList = data.equipment
    .map((eq) => {
      const option = EQUIPMENT_OPTIONS.find((o) => o.id === eq);
      return option ? `${option.label}=true` : `${eq}=true`;
    })
    .join(", ");

  const unavailableEquipment = EQUIPMENT_OPTIONS.filter(
    (o) => !data.equipment.includes(o.id)
  )
    .map((o) => `${o.label}=false`)
    .join(", ");

  const limitations =
    data.limitations && data.limitations.length > 0
      ? data.limitations.join(", ")
      : "none specified";

  const dietReqs = [
    ...(data.diet || []),
    ...(data.allergies?.map((a) => `${a} allergy`) || []),
  ];

  const preferences =
    data.preferences && data.preferences.length > 0
      ? data.preferences.join(", ")
      : "none specified";

  const ingredientsHave =
    data.ingredientsHave.length > 0
      ? data.ingredientsHave.join(", ")
      : "nothing specific";

  const ingredientsToBuy =
    data.ingredientsToBuy && data.ingredientsToBuy.length > 0
      ? data.ingredientsToBuy.join(", ")
      : "open to suggestions";

  let prompt = `Create one recipe with these constraints:

Equipment available: [${equipmentList}, ${unavailableEquipment}]
Kitchen limitations: [${limitations}]
Country/region: [${data.country || "not specified"}]
Dietary requirements/allergies: [${dietReqs.length > 0 ? dietReqs.join(", ") : "none"}]
Time limit: [${data.timeLimit} minutes]
Servings: [${data.servings}]
Ingredients I already have: [${ingredientsHave}]
Ingredients I'm willing to buy: [${ingredientsToBuy}]
Taste preferences: [${preferences}]`;

  if (data.notes && data.notes.trim()) {
    prompt += `

User notes/special requests: "${data.notes.trim()}"
Please pay special attention to these notes when designing the recipe.`;
  }

  prompt += `

Make it realistic to shop locally. If an ingredient might be hard to find, add substitutions.`;

  return prompt;
}
