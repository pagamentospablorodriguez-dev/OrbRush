// src/lib/tieredChests.ts
import { type ChestRarity } from "./chest";

export interface TieredChest {
  id: ChestRarity;
  name: string;
  cost: number;
  icon: string;
  color: string;
}

export const TIERED_CHESTS: TieredChest[] = [
  { id: "rare", name: "Rare Chest", cost: 100, icon: "📦", color: "text-blue-400" },
  { id: "epic", name: "Epic Chest", cost: 500, icon: "💎", color: "text-purple-400" },
  { id: "legendary", name: "Legendary Chest", cost: 2000, icon: "👑", color: "text-amber-400" },
];
