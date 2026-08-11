// src/lib/gacha.ts
import { playChestTease } from "./sound";

export type OrbRarity = "common" | "rare" | "epic" | "legendary";

export interface GachaOrb {
  id: string;
  name: string;
  rarity: OrbRarity;
  bonus: number; // Porcentagem de bônus passivo
  icon: string;
}

export const GACHA_ORBS: GachaOrb[] = [
  { id: "c1", name: "Bronze Orb", rarity: "common", bonus: 5, icon: "🟤" },
  { id: "r1", name: "Silver Orb", rarity: "rare", bonus: 15, icon: "⚪" },
  { id: "e1", name: "Gold Orb", rarity: "epic", bonus: 30, icon: "🟡" },
  { id: "l1", name: "Diamond Orb", rarity: "legendary", bonus: 100, icon: "💎" },
];

export function rollGacha(pityCount: number): { orb: GachaOrb; newPity: number } {
  const roll = Math.random() * 100;
  let rarity: OrbRarity = "common";
  let newPity = pityCount + 1;

  if (newPity >= 50) {
    rarity = "legendary";
    newPity = 0;
  } else if (roll < 0.1) {
    rarity = "legendary";
    newPity = 0;
  } else if (roll < 2.0) {
    rarity = "epic";
  } else if (roll < 10.0) {
    rarity = "rare";
  }

  const possibleOrbs = GACHA_ORBS.filter(o => o.rarity === rarity);
  const orb = possibleOrbs[Math.floor(Math.random() * possibleOrbs.length)];

  return { orb, newPity };
}
