// Session ID utility for anonymous user tracking
// Generates and persists a UUID in localStorage to track anonymous recipe creation

const STORAGE_KEY = "tk_session_id";

/**
 * Get or create a session ID for anonymous user tracking.
 * Returns empty string on server-side.
 */
export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";

  let sessionId = localStorage.getItem(STORAGE_KEY);

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, sessionId);
  }

  return sessionId;
}

/**
 * Get the current session ID if it exists.
 * Returns null if not set or on server-side.
 */
export function getSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

/**
 * Clear the session ID (e.g., after recipes have been claimed).
 * This is optional - keeping the sessionId around doesn't hurt.
 */
export function clearSessionId(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Check if a session ID exists.
 */
export function hasSessionId(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) !== null;
}
