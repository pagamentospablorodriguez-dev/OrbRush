// src/lib/mysteryBox.ts

export interface MysteryBoxState {
  isUnlocking: boolean;
  unlockStartTime: number | null;
  duration: number; // em milissegundos (ex: 2 horas = 7200000)
}

export const MYSTERY_BOX_COST = 50;
export const MYSTERY_BOX_DURATION = 2 * 60 * 60 * 1000; // 2 horas

export function getRemainingTime(state: MysteryBoxState): number {
  if (!state.unlockStartTime) return 0;
  const elapsed = Date.now() - state.unlockStartTime;
  return Math.max(0, state.duration - elapsed);
}

export function canOpen(state: MysteryBoxState): boolean {
  return state.isUnlocking && getRemainingTime(state) === 0;
}
