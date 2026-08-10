import type { OrbType } from "./useGame";

export interface CollectionEntry {
  type: OrbType;
  label: string;
  icon: string;
  color: string;
  discovered: boolean;
  count: number;
}

export const COLLECTION_DEFS: { type: OrbType; label: string; icon: string; color: string }[] = [
  { type: "normal", label: "Normal Orb", icon: "🔵", color: "#22d3ee" },
  { type: "golden", label: "Golden Orb", icon: "🌟", color: "#fbbf24" },
  { type: "bonus", label: "Bonus Orb", icon: "✨", color: "#a855f7" },
  { type: "frenzy", label: "Frenzy Orb", icon: "⚡", color: "#f97316" },
  { type: "mystery", label: "Mystery Orb", icon: "❓", color: "#e879f9" },
  { type: "shield", label: "Shield Orb", icon: "🛡️", color: "#3b82f6" },
  { type: "comeback", label: "Comeback Orb", icon: "📈", color: "#22c55e" },
  { type: "rainbow", label: "Rainbow Orb", icon: "🌈", color: "#e879f9" },
  { type: "boss", label: "Boss Orb", icon: "⚔️", color: "#ef4444" },
  { type: "timefreeze", label: "Freeze Orb", icon: "❄️", color: "#7dd3fc" },
  { type: "chain", label: "Chain Orb", icon: "🔗", color: "#fbbf24" },
  { type: "ghost", label: "Ghost Orb", icon: "👻", color: "#cbd5e1" },
  { type: "treasure", label: "Treasure Orb", icon: "💎", color: "#fbbf24" },
];

const STORAGE_KEY = "orbrush_collection";

export function loadCollection(): Record<string, { discovered: boolean; count: number }> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

export function recordDiscovery(type: OrbType): { isNew: boolean; collection: Record<string, { discovered: boolean; count: number }> } {
  const collection = loadCollection();
  const isNew = !collection[type]?.discovered;
  collection[type] = {
    discovered: true,
    count: (collection[type]?.count ?? 0) + 1,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collection));
  } catch {}
  return { isNew, collection };
}

export function getCollectionStats(): { discovered: number; total: number } {
  const collection = loadCollection();
  const discovered = Object.keys(collection).filter((k) => collection[k].discovered).length;
  return { discovered, total: COLLECTION_DEFS.length };
}

export function getCollectionEntries(): CollectionEntry[] {
  const collection = loadCollection();
  return COLLECTION_DEFS.map((def) => ({
    ...def,
    discovered: collection[def.type]?.discovered ?? false,
    count: collection[def.type]?.count ?? 0,
  }));
}
