import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { isAuthenticated } from "@/lib/auth-server";
import type { RecipeResponse } from "@/lib/recipe-schema";
import { trackLLMEvent, trackServerError } from "@/lib/posthog-server";

const MODEL = "gpt-4o-mini";
const ENDPOINT = "/api/ai/recipe-chat";

export async function POST(req: Request) {
  const startTime = Date.now();

  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return Response.json(
        { error: "You must be signed in" },
        { status: 401 }
      );
    }

    const { messages, recipe } = (await req.json()) as {
      messages: { role: "user" | "assistant"; content: string }[];
      recipe: RecipeResponse;
    };

    // Track chat message
    await trackLLMEvent(undefined, "llm_chat_message", {
      model: MODEL,
      endpoint: ENDPOINT,
      inputType: "chat",
      isStreaming: true,
    });

    const systemPrompt = `You are a helpful cooking assistant. The user has generated a recipe and wants to ask questions or make modifications.

CURRENT RECIPE:
Title: ${recipe.title}
Summary: ${recipe.summary}
Time: ${recipe.time_minutes} minutes
Servings: ${recipe.servings}
Equipment: ${recipe.equipment_used.join(", ")}

Ingredients they have: ${recipe.shopping.have.join(", ")}
Ingredients to buy: ${recipe.shopping.need.join(", ")}
Optional: ${recipe.shopping.optional.join(", ")}

Steps:
${recipe.steps.map((s, i) => `${i + 1}. ${s.title}: ${s.detail}`).join("\n")}

INSTRUCTIONS:
- Answer questions about the recipe helpfully and concisely
- If the user asks to modify the recipe (add/remove ingredients, change cooking method, adjust servings, etc.), explain how it would work
- When you suggest a modification that would change the recipe, end your message with:
  "[RECIPE_UPDATE_AVAILABLE]"
  This signals that the user can click a button to regenerate the recipe with your suggested changes.
- Keep responses friendly and practical
- Remember this is for travelers with limited kitchen equipment`;

    const result = streamText({
      model: openai(MODEL),
      system: systemPrompt,
      messages,
      onFinish: async ({ usage }) => {
        // Track completion after streaming finishes
        await trackLLMEvent(undefined, "llm_generation_completed", {
          model: MODEL,
          endpoint: ENDPOINT,
          inputType: "chat",
          durationMs: Date.now() - startTime,
          inputTokens: usage?.inputTokens,
          outputTokens: usage?.outputTokens,
          totalTokens: usage?.totalTokens,
          isStreaming: true,
          success: true,
        });
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Recipe chat error:", error);
    await trackServerError(undefined, error as Error, {
      endpoint: ENDPOINT,
      inputType: "chat",
    });
    await trackLLMEvent(undefined, "llm_generation_failed", {
      model: MODEL,
      endpoint: ENDPOINT,
      inputType: "chat",
      durationMs: Date.now() - startTime,
      errorType: "unexpected_error",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      success: false,
    });
    return Response.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
