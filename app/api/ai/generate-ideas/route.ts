import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { isAuthenticated } from "@/lib/auth-server";
import { z } from "zod";
import { EQUIPMENT_OPTIONS } from "@/lib/recipe-schema";

const ideasInputSchema = z.object({
  equipment: z.array(z.string()),
  dietaryPreferences: z.array(z.string()).optional(),
  allergens: z.array(z.string()).optional(),
  country: z.string().optional(),
  baseIngredient: z.string().optional(),
  additionalIngredients: z.array(z.string()).optional(),
  timeLimit: z.number().optional(),
  context: z.string().optional(), // Additional context for "generate more"
  existingTitles: z.array(z.string()).optional(), // To avoid duplicates
});

const recipeIdeaSchema = z.object({
  title: z.string(),
  description: z.string(),
  keyIngredients: z.array(z.string()),
  estimatedTime: z.number(),
  servings: z.number(),
  equipmentNeeded: z.array(z.string()),
  dietaryTags: z.array(z.string()),
  difficulty: z.enum(["easy", "medium", "hard"]),
});

const ideasResponseSchema = z.object({
  ideas: z.array(recipeIdeaSchema),
});

export async function POST(req: Request) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return Response.json(
        { error: "You must be signed in to generate recipe ideas" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parseResult = ideasInputSchema.safeParse(body);

    if (!parseResult.success) {
      return Response.json(
        { error: "Invalid input data", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const input = parseResult.data;

    // Build equipment context
    const equipmentList = input.equipment
      .map((eq) => {
        const option = EQUIPMENT_OPTIONS.find((o) => o.id === eq);
        return option ? option.label : eq;
      })
      .join(", ");

    const unavailableEquipment = EQUIPMENT_OPTIONS.filter(
      (o) => !input.equipment.includes(o.id)
    )
      .map((o) => o.label)
      .join(", ");

    const dietReqs = [
      ...(input.dietaryPreferences || []),
      ...(input.allergens?.map((a) => `${a} allergy`) || []),
    ];

    let prompt = `Generate 4 diverse recipe ideas for a traveler cooking with limited equipment.

CONSTRAINTS:
- Available equipment: ${equipmentList}
- NOT available: ${unavailableEquipment}
- Country/region: ${input.country || "not specified"}
- Dietary requirements: ${dietReqs.length > 0 ? dietReqs.join(", ") : "none"}
- Time limit: ${input.timeLimit || 30} minutes max
${input.baseIngredient ? `- Base ingredient to use: ${input.baseIngredient}` : ""}
${input.additionalIngredients?.length ? `- Additional ingredients available: ${input.additionalIngredients.join(", ")}` : ""}`;

    if (input.existingTitles?.length) {
      prompt += `\n\nAVOID these recipes (already generated): ${input.existingTitles.join(", ")}`;
    }

    if (input.context) {
      prompt += `\n\nUSER'S ADDITIONAL REQUEST: "${input.context}"
Please incorporate this feedback into your suggestions.`;
    }

    prompt += `

REQUIREMENTS:
- Each idea must be practical for a hostel/guesthouse kitchen
- Vary the cuisine styles and cooking methods
- Include a mix of difficulties
- Keep ingredient lists realistic (6-10 key ingredients each)
- All recipes must be achievable with the available equipment only

Return ONLY valid JSON (no markdown, no code blocks) with this structure:
{
  "ideas": [
    {
      "title": "Recipe Name",
      "description": "2-3 sentence description of the dish",
      "keyIngredients": ["ingredient1", "ingredient2", ...],
      "estimatedTime": 25,
      "servings": 2,
      "equipmentNeeded": ["Hob / Stovetop", "Kettle"],
      "dietaryTags": ["vegetarian", "gluten-free"],
      "difficulty": "easy"
    }
  ]
}`;

    const result = await generateText({
      model: openai("gpt-4o-mini"),
      system: `You are Traveler's Kitchen, a recipe assistant for travelers cooking with limited equipment. Generate creative but practical recipe ideas that can actually be made in basic kitchens like hostels and guesthouses.`,
      prompt,
    });

    // Parse and validate AI response
    let ideasData;
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

      ideasData = JSON.parse(cleanedText);
    } catch {
      console.error("Failed to parse AI response:", result.text);
      return Response.json(
        { error: "Failed to parse response. Please try again." },
        { status: 500 }
      );
    }

    const ideasResult = ideasResponseSchema.safeParse(ideasData);
    if (!ideasResult.success) {
      console.error("Invalid ideas structure:", ideasResult.error);
      return Response.json(
        { error: "Generated ideas have invalid structure. Please try again." },
        { status: 500 }
      );
    }

    return Response.json({ ideas: ideasResult.data.ideas });
  } catch (error) {
    console.error("Ideas generation error:", error);
    return Response.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
