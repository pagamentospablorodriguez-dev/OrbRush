// Squeeze system — alternates between dry spells and giant unexpected rewards.
// After a big reward, the player enters a "dry" period (fewer bonus orbs, lower treasure payouts).
// After enough games in dry mode, a "ready" state triggers and the next game gets boosted treasure odds.

export type SqueezeState = "dry" | "ready";

export interface SqueezeStatus {
  state: SqueezeState;
  gamesUntilBig: number;
  gamesInDry: number;
  threshold: number;
  isBigRewardReady: boolean;
}

// After a big squeeze reward, how many games stay "dry" before the next one
const DRY_THRESHOLD_MIN = 3;
const DRY_THRESHOLD_MAX = 6;

export function getInitialThreshold(): number {
  return DRY_THRESHOLD_MIN + Math.floor(Math.random() * (DRY_THRESHOLD_MAX - DRY_THRESHOLD_MIN + 1));
}

export function getSqueezeStatus(
  state: SqueezeState,
  gamesCounter: number,
  threshold: number,
): SqueezeStatus {
  return {
    state,
    gamesUntilBig: Math.max(0, threshold - gamesCounter),
    gamesInDry: gamesCounter,
    threshold,
    isBigRewardReady: state === "ready",
  };
}

// During dry state, treasure orb payout is reduced
export function getDryMultiplier(): number {
  return 0.4;
}

// During ready state, treasure orb payout is boosted and odds increase
export function getReadyMultiplier(): number {
  return 3.0;
}

// During ready state, treasure orb spawn chance is boosted
export function getReadyTreasureChanceBoost(): number {
  return 0.03; // adds 3% to base treasure chance
}

// Roll for a "giant" treasure payout during ready state
export function rollSqueezeTreasure(): { points: number; isGiant: boolean } {
  const r = Math.random();
  if (r < 0.15) {
    // 15% chance for the truly giant 5000-point treasure
    return { points: 5000, isGiant: true };
  } else if (r < 0.5) {
    return { points: 2000, isGiant: true };
  }
  return { points: 1000, isGiant: false };
}
