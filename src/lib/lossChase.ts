export interface LossChaseBonus {
  active: boolean;
  multiplier: number;
  secondsLeft: number;
  reason: string;
}

export function getLossChaseBonus(streak: number, nearRecord: boolean, newRecord: boolean): LossChaseBonus {
  if (newRecord) {
    return { active: true, multiplier: 2.0, secondsLeft: 30, reason: "RECORD BONUS 2x" };
  }
  if (nearRecord) {
    return { active: true, multiplier: 1.5, secondsLeft: 30, reason: "REVENGE BONUS 1.5x" };
  }
  if (streak >= 3) {
    return { active: true, multiplier: 1.5, secondsLeft: 30, reason: "STREAK BONUS 1.5x" };
  }
  return { active: false, multiplier: 1, secondsLeft: 0, reason: "" };
}
