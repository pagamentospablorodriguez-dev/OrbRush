const RIVAL_SEED_KEY = "orbrush_rival_seed";
const RIVAL_BEATEN_KEY = "orbrush_rival_beaten_count";

export function getRivalSeed(): number {
  try {
    const raw = localStorage.getItem(RIVAL_SEED_KEY);
    if (raw) return parseInt(raw, 10);
  } catch {}
  const seed = Math.floor(Math.random() * 1000000) + 1;
  setRivalSeed(seed);
  return seed;
}

export function setRivalSeed(seed: number): void {
  try {
    localStorage.setItem(RIVAL_SEED_KEY, String(seed));
  } catch {}
}

export function getRivalBeatenCount(): number {
  try {
    return parseInt(localStorage.getItem(RIVAL_BEATEN_KEY) || "0", 10);
  } catch {
    return 0;
  }
}

export function incrementRivalBeaten(): number {
  const count = getRivalBeatenCount() + 1;
  try {
    localStorage.setItem(RIVAL_BEATEN_KEY, String(count));
  } catch {}
  return count;
}
