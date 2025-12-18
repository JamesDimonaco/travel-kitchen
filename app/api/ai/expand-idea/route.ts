import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { isAuthenticated } from "@/lib/auth-server";
import { z } from "zod";
import { EQUIPMENT_OPTIONS } from "@/lib/recipe-schema";

const expandInputSchema = z.object({
  idea: z.object({
    title: z.string(),
    description: z.string(),
    keyIngredients: z.array(z.string()),
    estimatedTime: z.number(),
    servings: z.number(),
    equipmentNeeded: z.array(z.string()),
    dietaryTags: z.array(z.string()),
    difficulty: z.string(),
  }),
  sessionInputs: z.object({
    equipment: z.array(z.string()),
    dietaryPreferences: z.array(z.string()).optional(),
    allergens: z.array(z.string()).optional(),
    country: z.string().optional(),
    baseIngredient: z.string().optional(),
    additionalIngredients: z.array(z.string()).optional(),
    timeLimit: z.number().optional(),
  }),
});

const fullRecipeSchema = z.object({
  shopping: z.object({
    have: z.array(z.string()),
    need: z.array(z.string()),
    optional: z.array(z.string()),
  }),
  prepGroup: z.array(z.string()),
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
  tips: z.array(z.string()),
});

export async function POST(req: Request) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return Response.json(
        { error: "You must be signed in" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parseResult = expandInputSchema.safeParse(body);

    if (!parseResult.success) {
      return Response.json(
        { error: "Invalid input data", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { idea, sessionInputs } = parseResult.data;

    // Build equipment context
    const equipmentList = sessionInputs.equipment
      .map((eq) => {
        const option = EQUIPMENT_OPTIONS.find((o) => o.id === eq);
        return option ? option.label : eq;
      })
      .join(", ");

    const dietReqs = [
      ...(sessionInputs.dietaryPreferences || []),
      ...(sessionInputs.allergens?.map((a) => `${a} allergy`) || []),
    ];

    const availableIngredients = [
      ...(sessionInputs.baseIngredient ? [sessionInputs.baseIngredient] : []),
      ...(sessionInputs.additionalIngredients || []),
    ];

    const prompt = `Generate the full recipe details for this recipe idea:

RECIPE TO EXPAND:
Title: ${idea.title}
Description: ${idea.description}
Key Ingredients: ${idea.keyIngredients.join(", ")}
Estimated Time: ${idea.estimatedTime} minutes
Servings: ${idea.servings}
Equipment Needed: ${idea.equipmentNeeded.join(", ")}
Difficulty: ${idea.difficulty}

CONSTRAINTS:
- Available equipment: ${equipmentList}
- Country/region: ${sessionInputs.country || "not specified"}
- Dietary requirements: ${dietReqs.length > 0 ? dietReqs.join(", ") : "none"}
- Ingredients user mentioned having: ${availableIngredients.length > 0 ? availableIngredients.join(", ") : "none specified"}

REQUIREMENTS:
- Categorize ingredients into "have" (from user's list), "need" (must buy), and "optional" (nice to have)
- Keep steps clear and simple (3-7 steps max)
- Include practical substitutions for harder-to-find ingredients
- Add helpful tips for travelers cooking in basic kitchens

Return ONLY valid JSON (no markdown, no code blocks) with this structure:
{
  "shopping": {
    "have": ["ingredients user likely has"],
    "need": ["ingredients to buy"],
    "optional": ["nice to have but not essential"]
  },
  "prepGroup": ["prep task 1", "prep task 2"],
  "steps": [
    { "title": "Step Title", "detail": "Detailed instructions", "time_minutes": 5 }
  ],
  "substitutions": [
    { "ingredient": "hard to find item", "swap_options": ["option 1", "option 2"] }
  ],
  "tips": ["helpful tip 1", "helpful tip 2"]
}`;

    const result = await generateText({
      model: openai("gpt-4o-mini"),
      system: `You are Traveler's Kitchen, a recipe assistant for travelers. Generate detailed, practical recipes that can be made in basic kitchens like hostels and guesthouses.`,
      prompt,
    });

    // Parse and validate AI response
    let recipeData;
    try {
      let cleanedText = result.text.trim();
      if (cleanedText.startsWith("```json")) {
        cleanedText = cleanedText.slice(7);
      }
      if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.slice(3);
      }
      if (cleanedText.endsWith("```")) {
        cleanedText = cleanedText.slice(0, -3);
      }
      cleanedText = cleanedText.trim();

      recipeData = JSON.parse(cleanedText);
    } catch {
      console.error("Failed to parse AI response:", result.text);
      return Response.json(
        { error: "Failed to parse response. Please try again." },
        { status: 500 }
      );
    }

    const recipeResult = fullRecipeSchema.safeParse(recipeData);
    if (!recipeResult.success) {
      console.error("Invalid recipe structure:", recipeResult.error);
      return Response.json(
        { error: "Generated recipe has invalid structure. Please try again." },
        { status: 500 }
      );
    }

    return Response.json({ fullRecipe: recipeResult.data });
  } catch (error) {
    console.error("Recipe expansion error:", error);
    return Response.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
