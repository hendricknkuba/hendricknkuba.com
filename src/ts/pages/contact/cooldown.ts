const ATTEMPT_COOLDOWN_MS = 15_000;
const SUCCESS_COOLDOWN_MS = 120_000;
const LAST_ATTEMPT_KEY = 'contact-last-attempt-at';
const LAST_SUCCESS_KEY = 'contact-last-success-at';

function getStoredTimestamp(key: string): number {
  const value = window.localStorage.getItem(key);
  const parsed = value ? Number.parseInt(value, 10) : 0;

  return Number.isFinite(parsed) ? parsed : 0;
}

function setStoredTimestamp(key: string): void {
  window.localStorage.setItem(key, String(Date.now()));
}

export function getRemainingCooldownMs(): number {
  const now = Date.now();
  const lastSuccess = getStoredTimestamp(LAST_SUCCESS_KEY);
  const lastAttempt = getStoredTimestamp(LAST_ATTEMPT_KEY);
  const successRemaining = Math.max(0, SUCCESS_COOLDOWN_MS - (now - lastSuccess));
  const attemptRemaining = Math.max(0, ATTEMPT_COOLDOWN_MS - (now - lastAttempt));

  return Math.max(successRemaining, attemptRemaining);
}

export function formatRemainingCooldown(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);

  if (totalSeconds >= 60) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (seconds === 0) {
      return `${minutes} min`;
    }

    return `${minutes}m ${seconds}s`;
  }

  return `${totalSeconds}s`;
}

export function markContactAttempt(): void {
  setStoredTimestamp(LAST_ATTEMPT_KEY);
}

export function markContactSuccess(): void {
  setStoredTimestamp(LAST_SUCCESS_KEY);
}
