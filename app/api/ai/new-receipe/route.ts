import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { isAuthenticated } from "@/lib/auth-server";
import { recipeFormSchema, recipeResponseSchema } from "@/lib/recipe-schema";
import { RECIPE_SYSTEM_PROMPT, buildUserPrompt } from "@/lib/recipe-prompt";
import { trackLLMEvent, trackServerError } from "@/lib/posthog-server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

const MODEL = "gpt-4o-mini";
const ENDPOINT = "/api/ai/new-receipe";

export async function POST(req: Request) {
  const startTime = Date.now();

  try {
    // Parse request body first to get sessionId
    const body = await req.json();
    const { sessionId, ...formBody } = body;

    // Check authentication - allow anonymous if sessionId provided
    const authenticated = await isAuthenticated();
    if (!authenticated && !sessionId) {
      return Response.json(
        { error: "You must be signed in or provide a session ID to generate recipes" },
        { status: 401 }
      );
    }

    // Check usage limits BEFORE making expensive AI call
    const usageCheck = await fetchQuery(api.usage.canGenerate, {
      sessionId: !authenticated ? sessionId : undefined,
    });

    if (!usageCheck.canGenerate) {
      return Response.json(
        {
          error: usageCheck.reason || "You've reached your generation limit",
          code: "LIMIT_REACHED",
        },
        { status: 402 }
      );
    }

    // Validate form data (without sessionId)
    const parseResult = recipeFormSchema.safeParse(formBody);

    if (!parseResult.success) {
      return Response.json(
        { error: "Invalid form data", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const formData = parseResult.data;

    // Build the user prompt from form data
    const userPrompt = buildUserPrompt(formData);

    // Track LLM generation started
    await trackLLMEvent(undefined, "llm_generation_started", {
      model: MODEL,
      endpoint: ENDPOINT,
      inputType: "recipe_generation",
      equipment: formData.equipment,
      dietaryPreferences: formData.diet,
      ingredientCount: formData.ingredientsHave?.length || 0,
      isAuthenticated: authenticated,
      isAnonymous: !authenticated && !!sessionId,
    });

    // Generate recipe using AI
    const result = await generateText({
      model: openai(MODEL),
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
      await trackLLMEvent(undefined, "llm_generation_failed", {
        model: MODEL,
        endpoint: ENDPOINT,
        inputType: "recipe_generation",
        durationMs: Date.now() - startTime,
        errorType: "parse_error",
        errorMessage: "Failed to parse AI response",
        success: false,
      });
      return Response.json(
        { error: "Failed to parse recipe response. Please try again." },
        { status: 500 }
      );
    }

    // Validate the recipe structure
    const recipeResult = recipeResponseSchema.safeParse(recipeData);
    if (!recipeResult.success) {
      console.error("Invalid recipe structure:", recipeResult.error);
      await trackLLMEvent(undefined, "llm_generation_failed", {
        model: MODEL,
        endpoint: ENDPOINT,
        inputType: "recipe_generation",
        durationMs: Date.now() - startTime,
        errorType: "validation_error",
        errorMessage: "Invalid recipe structure",
        success: false,
      });
      return Response.json(
        { error: "Generated recipe has invalid structure. Please try again." },
        { status: 500 }
      );
    }

    // Track successful generation
    await trackLLMEvent(undefined, "llm_generation_completed", {
      model: MODEL,
      endpoint: ENDPOINT,
      inputType: "recipe_generation",
      durationMs: Date.now() - startTime,
      inputTokens: result.usage?.inputTokens,
      outputTokens: result.usage?.outputTokens,
      totalTokens: result.usage?.totalTokens,
      equipment: formData.equipment,
      dietaryPreferences: formData.diet,
      ingredientCount: formData.ingredientsHave?.length || 0,
      success: true,
    });

    return Response.json({
      recipe: recipeResult.data,
      inputs: formData,
      isAuthenticated: authenticated,
      sessionId: !authenticated ? sessionId : undefined,
    });
  } catch (error) {
    console.error("Recipe generation error:", error);
    await trackServerError(undefined, error as Error, {
      endpoint: ENDPOINT,
      inputType: "recipe_generation",
    });
    await trackLLMEvent(undefined, "llm_generation_failed", {
      model: MODEL,
      endpoint: ENDPOINT,
      inputType: "recipe_generation",
      durationMs: Date.now() - startTime,
      errorType: "unexpected_error",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      success: false,
    });
    return Response.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
