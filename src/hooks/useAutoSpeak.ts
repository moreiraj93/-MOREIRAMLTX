/**
 * useAutoSpeak — persists and exposes the global Auto-Speak preference.
 * Emits a custom DOM event `mockj:autospeak-change` when toggled so that
 * any component (e.g. ChatMessage) can react without prop drilling.
 */

const STORAGE_KEY = 'mockj_auto_speak';
export const AUTO_SPEAK_EVENT_NAME = 'mockj:autospeak-change';

export function getAutoSpeak(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setAutoSpeak(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(enabled));
  } catch { /* ignore */ }
  window.dispatchEvent(new CustomEvent(AUTO_SPEAK_EVENT_NAME, { detail: { enabled } }));
}

export function toggleAutoSpeak(): boolean {
  const next = !getAutoSpeak();
  setAutoSpeak(next);
  return next;
}
