import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { isAuthenticated } from "@/lib/auth-server";
import { recipeResponseSchema } from "@/lib/recipe-schema";
import type { RecipeResponse, RecipeFormData } from "@/lib/recipe-schema";

export async function POST(req: Request) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return Response.json(
        { error: "You must be signed in" },
        { status: 401 }
      );
    }

    const { messages, recipe, inputs } = (await req.json()) as {
      messages: { role: "user" | "assistant"; content: string }[];
      recipe: RecipeResponse;
      inputs: RecipeFormData;
    };

    // Build conversation summary for context
    const conversationSummary = messages
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n");

    const systemPrompt = `You are Traveler's Kitchen, a recipe assistant for travelers cooking with limited equipment.

You previously generated a recipe, and the user has been chatting with you about modifications. Now regenerate the recipe incorporating the discussed changes.

ORIGINAL RECIPE:
Title: ${recipe.title}
Summary: ${recipe.summary}
Time: ${recipe.time_minutes} minutes
Servings: ${recipe.servings}
Equipment used: ${recipe.equipment_used.join(", ")}
Ingredients (have): ${recipe.shopping.have.join(", ")}
Ingredients (need): ${recipe.shopping.need.join(", ")}
Optional: ${recipe.shopping.optional.join(", ")}
Steps:
${recipe.steps.map((s, i) => `${i + 1}. ${s.title}: ${s.detail}`).join("\n")}

CONVERSATION WITH USER:
${conversationSummary}

ORIGINAL CONSTRAINTS:
- Equipment available: ${inputs.equipment.join(", ")}
- Country/region: ${inputs.country || "not specified"}
- Dietary requirements: ${[...(inputs.diet || []), ...(inputs.allergies?.map((a) => `${a} allergy`) || [])].join(", ") || "none"}
- Time limit: ${inputs.timeLimit} minutes
- Servings: ${inputs.servings}

INSTRUCTIONS:
- Regenerate the recipe incorporating the modifications discussed in the conversation
- Keep the same format and constraints
- Still respect equipment limitations and dietary requirements
- Update ingredients, steps, and any other relevant sections based on the discussion

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
}`;

    const result = await generateText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      prompt:
        "Please regenerate the recipe with the modifications we discussed.",
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
        { error: "Failed to parse recipe response. Please try again." },
        { status: 500 }
      );
    }

    const recipeResult = recipeResponseSchema.safeParse(recipeData);
    if (!recipeResult.success) {
      console.error("Invalid recipe structure:", recipeResult.error);
      return Response.json(
        { error: "Generated recipe has invalid structure. Please try again." },
        { status: 500 }
      );
    }

    return Response.json({
      recipe: recipeResult.data,
    });
  } catch (error) {
    console.error("Recipe update error:", error);
    return Response.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
