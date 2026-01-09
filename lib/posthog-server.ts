import { PostHog } from "posthog-node";

// Singleton PostHog client for server-side tracking
let posthogClient: PostHog | null = null;

export function getPostHogClient(): PostHog | null {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return null;
  }

  if (!posthogClient) {
    posthogClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      flushAt: 1, // Flush immediately in serverless
      flushInterval: 0,
    });
  }

  return posthogClient;
}

// LLM event types
export type LLMEventType =
  | "llm_generation_started"
  | "llm_generation_completed"
  | "llm_generation_failed"
  | "llm_chat_message";

export interface LLMEventProperties {
  // Required
  model: string;
  endpoint: string;

  // Timing
  durationMs?: number;
  startTime?: number;

  // Token usage (from AI SDK - uses inputTokens/outputTokens)
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;

  // Cost estimation (approximate)
  estimatedCostUsd?: number;

  // Request context
  inputType?: string; // 'recipe_generation', 'ideas_generation', 'expand_idea', 'chat', 'update'
  equipment?: string[];
  dietaryPreferences?: string[];
  ingredientCount?: number;

  // Response metadata
  success?: boolean;
  errorType?: string;
  errorMessage?: string;

  // Streaming
  isStreaming?: boolean;
}

// Cost estimates per 1M tokens (GPT-4o-mini pricing)
const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4-turbo": { input: 10, output: 30 },
};

export function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const costs = MODEL_COSTS[model] || MODEL_COSTS["gpt-4o-mini"];
  const inputCost = (inputTokens / 1_000_000) * costs.input;
  const outputCost = (outputTokens / 1_000_000) * costs.output;
  return inputCost + outputCost;
}

// Track LLM events
export async function trackLLMEvent(
  userId: string | undefined,
  event: LLMEventType,
  properties: LLMEventProperties
) {
  const client = getPostHogClient();
  if (!client) return;

  // Calculate cost if tokens are provided
  if (
    properties.inputTokens &&
    properties.outputTokens &&
    !properties.estimatedCostUsd
  ) {
    properties.estimatedCostUsd = estimateCost(
      properties.model,
      properties.inputTokens,
      properties.outputTokens
    );
  }

  const distinctId = userId || "anonymous";

  client.capture({
    distinctId,
    event,
    properties: {
      ...properties,
      $lib: "posthog-node",
      environment: process.env.NODE_ENV,
    },
  });
}

// Track server-side errors
export async function trackServerError(
  userId: string | undefined,
  error: Error,
  context: {
    endpoint: string;
    inputType?: string;
    additionalProperties?: Record<string, unknown>;
  }
) {
  const client = getPostHogClient();
  if (!client) return;

  const distinctId = userId || "anonymous";

  client.capture({
    distinctId,
    event: "server_error",
    properties: {
      error_name: error.name,
      error_message: error.message,
      error_stack: error.stack,
      endpoint: context.endpoint,
      input_type: context.inputType,
      ...context.additionalProperties,
      $lib: "posthog-node",
      environment: process.env.NODE_ENV,
    },
  });
}

// Shutdown hook for graceful termination
export async function shutdownPostHog() {
  if (posthogClient) {
    await posthogClient.shutdown();
  }
}
