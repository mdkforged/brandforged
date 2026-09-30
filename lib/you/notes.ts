/**
 * Notes on This is You: one free-text pocket kept on this device.
 * Shared by the Notes page and Make this (read at click time).
 */
export const NOTES_STORAGE_KEY = "bf-you-notes-v1";

export function loadNotes(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(NOTES_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}
