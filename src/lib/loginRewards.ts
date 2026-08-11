// Escalating login reward curve — grows exponentially so players feel real loss if they break the streak.
// Day 1: 10, Day 2: 20, Day 3: 40, Day 4: 80, Day 5: 160, Day 6: 300, Day 7: 500 + legendary chest,
// Day 14: 1000, Day 30: 5000. Break the streak → back to Day 1 (10 gems).

export interface LoginReward {
  day: number;
  gems: number;
  bonus?: string;
  isLegendary?: boolean;
}

const REWARD_CURVE: Record<number, LoginReward> = {
  1: { day: 1, gems: 10 },
  2: { day: 2, gems: 20 },
  3: { day: 3, gems: 40 },
  4: { day: 4, gems: 80 },
  5: { day: 5, gems: 160 },
  6: { day: 6, gems: 300 },
  7: { day: 7, gems: 500, bonus: "Legendary Chest!", isLegendary: true },
  8: { day: 8, gems: 350 },
  9: { day: 9, gems: 400 },
  10: { day: 10, gems: 450 },
  11: { day: 11, gems: 500 },
  12: { day: 12, gems: 600 },
  13: { day: 13, gems: 750 },
  14: { day: 14, gems: 1000, bonus: "Big Reward!" },
  15: { day: 15, gems: 800 },
  16: { day: 16, gems: 850 },
  17: { day: 17, gems: 900 },
  18: { day: 18, gems: 1000 },
  19: { day: 19, gems: 1100 },
  20: { day: 20, gems: 1200 },
  21: { day: 21, gems: 1500 },
  22: { day: 22, gems: 1600 },
  23: { day: 23, gems: 1700 },
  24: { day: 24, gems: 1800 },
  25: { day: 25, gems: 2000 },
  26: { day: 26, gems: 2200 },
  27: { day: 27, gems: 2500 },
  28: { day: 28, gems: 3000 },
  29: { day: 29, gems: 4000 },
  30: { day: 30, gems: 5000, bonus: "MEGA REWARD!" },
};

export function getLoginReward(day: number): LoginReward {
  if (day >= 31) {
    return { day, gems: 5000 + (day - 30) * 200 };
  }
  return REWARD_CURVE[day] ?? { day, gems: 10 };
}

export function getNextReward(day: number): LoginReward {
  return getLoginReward(day + 1);
}

// Total accumulated gems if you maintain streak from day 1 to current day
export function getAccumulatedGems(day: number): number {
  let total = 0;
  for (let d = 1; d <= day; d++) {
    total += getLoginReward(d).gems;
  }
  return total;
}

// What you'd lose by breaking the streak today
export function getLossIfBreak(currentDay: number): number {
  if (currentDay < 2) return 0;
  const currentReward = getLoginReward(currentDay).gems;
  const day1Reward = getLoginReward(1).gems;
  return currentReward - day1Reward;
}
