// Session ID utility for anonymous user tracking
// Generates and persists a UUID in localStorage to track anonymous recipe creation

const STORAGE_KEY = "tk_session_id";

/**
 * Fallback UUID generator for older browsers without crypto.randomUUID()
 */
function generateFallbackUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get or create a session ID for anonymous user tracking.
 * Returns empty string on server-side or if localStorage is inaccessible.
 */
export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";

  try {
    let sessionId = localStorage.getItem(STORAGE_KEY);

    if (!sessionId) {
      sessionId = crypto?.randomUUID?.() || generateFallbackUUID();
      localStorage.setItem(STORAGE_KEY, sessionId);
    }

    return sessionId;
  } catch (error) {
    // localStorage may be inaccessible in incognito mode or when storage is disabled
    console.warn("Failed to access localStorage for session ID:", error);
    return "";
  }
}

/**
 * Get the current session ID if it exists.
 * Returns null if not set, on server-side, or if localStorage is inaccessible.
 */
export function getSessionId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    console.warn("Failed to access localStorage for session ID:", error);
    return null;
  }
}

/**
 * Clear the session ID (e.g., after recipes have been claimed).
 * This is optional - keeping the sessionId around doesn't hurt.
 */
export function clearSessionId(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn("Failed to clear session ID from localStorage:", error);
  }
}

/**
 * Check if a session ID exists.
 */
export function hasSessionId(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch (error) {
    console.warn("Failed to check session ID in localStorage:", error);
    return false;
  }
}
