const LIVES_KEY = "orbrush_lives";
const LIVES_TIMESTAMP_KEY = "orbrush_lives_ts";

export const MAX_LIVES = 5;
export const RECHARGE_MS = 20 * 60 * 1000; // 20 minutes per life

function isPremium(): boolean {
  try {
    return localStorage.getItem("orbrush_premium") === "true";
  } catch {
    return false;
  }
}

export function getLives(): number {
  if (isPremium()) return MAX_LIVES;

  try {
    const stored = parseInt(localStorage.getItem(LIVES_KEY) || String(MAX_LIVES), 10);
    const ts = parseInt(localStorage.getItem(LIVES_TIMESTAMP_KEY) || "0", 10);

    if (stored >= MAX_LIVES) return MAX_LIVES;
    if (ts === 0) return stored;

    const elapsed = Date.now() - ts;
    const livesGained = Math.floor(elapsed / RECHARGE_MS);
    const newLives = Math.min(MAX_LIVES, stored + livesGained);

    if (newLives >= MAX_LIVES) {
      localStorage.setItem(LIVES_KEY, String(MAX_LIVES));
      localStorage.removeItem(LIVES_TIMESTAMP_KEY);
    } else if (newLives > stored) {
      const remainingMs = elapsed - livesGained * RECHARGE_MS;
      localStorage.setItem(LIVES_KEY, String(newLives));
      localStorage.setItem(LIVES_TIMESTAMP_KEY, String(Date.now() - remainingMs));
    }

    return newLives;
  } catch {
    return MAX_LIVES;
  }
}

export function getMsToNextLife(): number {
  if (isPremium()) return 0;
  const lives = getLives();
  if (lives >= MAX_LIVES) return 0;

  try {
    const ts = parseInt(localStorage.getItem(LIVES_TIMESTAMP_KEY) || "0", 10);
    if (ts === 0) return 0;

    const elapsed = Date.now() - ts;
    const remaining = RECHARGE_MS - (elapsed % RECHARGE_MS);
    return remaining;
  } catch {
    return 0;
  }
}

export function getSecondsToNextLife(): number {
  return Math.ceil(getMsToNextLife() / 1000);
}

export function consumeLife(): number {
  if (isPremium()) return MAX_LIVES;

  const lives = getLives();
  if (lives <= 0) return 0;

  const newLives = lives - 1;
  try {
    localStorage.setItem(LIVES_KEY, String(newLives));
    if (!localStorage.getItem(LIVES_TIMESTAMP_KEY)) {
      localStorage.setItem(LIVES_TIMESTAMP_KEY, String(Date.now()));
    }
  } catch {}

  return newLives;
}

export function addLives(count: number): number {
  if (isPremium()) return MAX_LIVES;

  const lives = getLives();
  const newLives = Math.min(MAX_LIVES, lives + count);
  try {
    localStorage.setItem(LIVES_KEY, String(newLives));
    if (newLives >= MAX_LIVES) {
      localStorage.removeItem(LIVES_TIMESTAMP_KEY);
    }
  } catch {}
  return newLives;
}

export function refillLives(): void {
  try {
    localStorage.setItem(LIVES_KEY, String(MAX_LIVES));
    localStorage.removeItem(LIVES_TIMESTAMP_KEY);
  } catch {}
}

export function hasLives(): boolean {
  return getLives() > 0;
}
