export type ChestRarity = "common" | "rare" | "epic" | "legendary" | "mythic";

export interface ChestReward {
  rarity: ChestRarity;
  gems: number;
  label: string;
  color: string;
  glow: string;
}

const RARITY_CONFIG: Record<ChestRarity, { weight: number; gems: [number, number]; color: string; glow: string; label: string }> = {
  common: { weight: 50, gems: [5, 15], color: "from-slate-400 to-slate-600", glow: "shadow-slate-400/40", label: "Comum" },
  rare: { weight: 28, gems: [20, 40], color: "from-blue-400 to-blue-600", glow: "shadow-blue-400/50", label: "Raro" },
  epic: { weight: 14, gems: [50, 100], color: "from-fuchsia-400 to-purple-600", glow: "shadow-fuchsia-400/60", label: "Épico" },
  legendary: { weight: 6, gems: [150, 300], color: "from-amber-300 to-yellow-500", glow: "shadow-amber-400/70", label: "Lendário" },
  mythic: { weight: 2, gems: [500, 1000], color: "from-rose-400 via-amber-300 to-cyan-400", glow: "shadow-rose-400/80", label: "MÍTICO" },
};

export const RARITY_ORDER: ChestRarity[] = ["common", "rare", "epic", "legendary", "mythic"];

export function rollChest(): ChestReward {
  const totalWeight = Object.values(RARITY_CONFIG).reduce((s, r) => s + r.weight, 0);
  let roll = Math.random() * totalWeight;
  let chosen: ChestRarity = "common";
  for (const rarity of RARITY_ORDER) {
    roll -= RARITY_CONFIG[rarity].weight;
    if (roll <= 0) { chosen = rarity; break; }
  }
  const cfg = RARITY_CONFIG[chosen];
  const gems = cfg.gems[0] + Math.floor(Math.random() * (cfg.gems[1] - cfg.gems[0] + 1));
  return { rarity: chosen, gems, label: cfg.label, color: cfg.color, glow: cfg.glow };
}

export function rarityIndex(r: ChestRarity): number {
  return RARITY_ORDER.indexOf(r);
}
