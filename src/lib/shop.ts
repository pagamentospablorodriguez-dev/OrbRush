export interface PowerUpDef {
  key: "shield" | "extra_life" | "frenzy" | "double" | "freeze";
  name: string;
  desc: string;
  cost: number;
  icon: string;
  color: string;
}

export const POWER_UPS: PowerUpDef[] = [
  { key: "shield", name: "Shield", desc: "Start with shield active", cost: 30, icon: "🛡️", color: "from-blue-500 to-cyan-600" },
  { key: "extra_life", name: "Extra Life", desc: "Start with 4 lives", cost: 50, icon: "❤️", color: "from-rose-500 to-red-600" },
  { key: "frenzy", name: "Frenzy", desc: "Start in frenzy mode", cost: 40, icon: "⚡", color: "from-orange-500 to-red-500" },
  { key: "double", name: "Double", desc: "2x points for 10 seconds", cost: 60, icon: "✨", color: "from-fuchsia-500 to-purple-600" },
  { key: "freeze", name: "Freeze", desc: "Start with time frozen", cost: 35, icon: "❄️", color: "from-sky-400 to-cyan-500" },
];
