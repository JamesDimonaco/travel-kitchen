import posthog from "posthog-js";

// Event names - keep these consistent
export const ANALYTICS_EVENTS = {
  // Auth
  USER_SIGNED_UP: "user_signed_up",
  USER_SIGNED_IN: "user_signed_in",
  USER_SIGNED_OUT: "user_signed_out",

  // Recipe Generation
  RECIPE_GENERATED: "recipe_generated",
  RECIPE_GENERATION_FAILED: "recipe_generation_failed",
  RECIPE_CHAT_MESSAGE_SENT: "recipe_chat_message_sent",
  RECIPE_UPDATED_VIA_CHAT: "recipe_updated_via_chat",

  // Recipe Ideas (Multiple Options)
  IDEAS_GENERATED: "ideas_generated",
  IDEAS_GENERATION_FAILED: "ideas_generation_failed",
  MORE_IDEAS_REQUESTED: "more_ideas_requested",
  IDEA_EXPANDED: "idea_expanded",
  IDEA_SESSION_CLEARED: "idea_session_cleared",

  // Recipe Actions
  RECIPE_SAVED: "recipe_saved",
  RECIPE_SAVE_FAILED: "recipe_save_failed",
  RECIPE_PUBLISHED: "recipe_published",
  RECIPE_UNPUBLISHED: "recipe_unpublished",
  RECIPE_DELETED: "recipe_deleted",

  // Navigation
  PAGE_VIEWED: "page_viewed",
  TAB_SWITCHED: "tab_switched",
} as const;

type EventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

// Track an event with optional properties
export function track(event: EventName, properties?: Record<string, unknown>) {
  if (typeof window !== "undefined" && posthog) {
    posthog.capture(event, properties);
  }
}

// Identify a user (call after sign in/sign up)
export function identifyUser(userId: string, properties?: Record<string, unknown>) {
  if (typeof window !== "undefined" && posthog) {
    posthog.identify(userId, properties);
  }
}

// Reset user identity (call on sign out)
export function resetUser() {
  if (typeof window !== "undefined" && posthog) {
    posthog.reset();
  }
}
