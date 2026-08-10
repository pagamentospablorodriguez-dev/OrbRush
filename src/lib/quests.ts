export interface QuestDef {
  type: string;
  target: number;
  label: string;
  icon: string;
}

export const QUEST_ICONS: Record<string, string> = {
  score_2000: "🎯",
  score_5000: "🎯",
  combo_20: "🔥",
  combo_40: "🔥",
  golden_10: "🌟",
  golden_20: "🌟",
  jackpot_1: "🎰",
  jackpot_3: "🎰",
  level_10: "🚀",
  boss_1: "👹",
  rainbow_1: "🌈",
  treasure_1: "💎",
  games_3: "🎮",
  games_5: "🎮",
};

export function questLabel(type: string): string {
  const map: Record<string, string> = {
    score_2000: "Score 2000 points",
    score_5000: "Score 5000 points",
    combo_20: "Combo x20",
    combo_40: "Combo x40",
    golden_10: "Collect 10 golden orbs",
    golden_20: "Collect 20 golden orbs",
    jackpot_1: "Win 1 jackpot",
    jackpot_3: "Win 3 jackpots",
    level_10: "Reach level 10",
    boss_1: "Defeat 1 boss",
    rainbow_1: "Collect 1 rainbow",
    treasure_1: "Open 1 treasure",
    games_3: "Play 3 games",
    games_5: "Play 5 games",
  };
  return map[type] ?? type;
}

export function questIcon(type: string): string {
  return QUEST_ICONS[type] ?? "❓";
}

export interface QuestState {
  type: string;
  progress: number;
  target: number;
  done: boolean;
  claimed: boolean;
}

export function parseQuests(stats: any): QuestState[] {
  const quests: QuestState[] = [];
  for (const i of [1, 2, 3] as const) {
    const type = stats[`quest${i}_type` as string] as string;
    if (!type) continue;
    quests.push({
      type: type.startsWith("claimed_") ? type.replace("claimed_", "") : type,
      progress: stats[`quest${i}_progress` as string] as number,
      target: stats[`quest${i}_target` as string] as number,
      done: stats[`quest${i}_done` as string] as boolean,
      claimed: type.startsWith("claimed_"),
    });
  }
  return quests;
}
