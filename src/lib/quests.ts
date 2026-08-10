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
    score_2000: "Faça 2000 pontos",
    score_5000: "Faça 5000 pontos",
    combo_20: "Combo x20",
    combo_40: "Combo x40",
    golden_10: "Pegue 10 dourados",
    golden_20: "Pegue 20 dourados",
    jackpot_1: "Ganhe 1 jackpot",
    jackpot_3: "Ganhe 3 jackpots",
    level_10: "Alcance o nível 10",
    boss_1: "Derrote 1 chefe",
    rainbow_1: "Pegue 1 arco-íris",
    treasure_1: "Abra 1 tesouro",
    games_3: "Jogue 3 partidas",
    games_5: "Jogue 5 partidas",
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
