import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { isAuthenticated } from "@/lib/auth-server";
import { recipeFormSchema, recipeResponseSchema } from "@/lib/recipe-schema";
import { RECIPE_SYSTEM_PROMPT, buildUserPrompt } from "@/lib/recipe-prompt";

export async function POST(req: Request) {
  try {
    // Check authentication
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return Response.json(
        { error: "You must be signed in to generate recipes" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const parseResult = recipeFormSchema.safeParse(body);

    if (!parseResult.success) {
      return Response.json(
        { error: "Invalid form data", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const formData = parseResult.data;

    // Build the user prompt from form data
    const userPrompt = buildUserPrompt(formData);

    // Generate recipe using AI
    const result = await generateText({
      model: openai("gpt-4o-mini"),
      system: RECIPE_SYSTEM_PROMPT,
      prompt: userPrompt,
    });

    // Parse and validate AI response
    let recipeData;
    try {
      // Clean up response - remove any markdown code blocks if present
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

    // Validate the recipe structure
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
      inputs: formData,
    });
  } catch (error) {
    console.error("Recipe generation error:", error);
    return Response.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
