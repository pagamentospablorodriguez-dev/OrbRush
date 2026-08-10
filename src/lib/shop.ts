export interface PowerUpDef {
  key: "shield" | "extra_life" | "frenzy" | "double" | "freeze";
  name: string;
  desc: string;
  cost: number;
  icon: string;
  color: string;
}

export const POWER_UPS: PowerUpDef[] = [
  { key: "shield", name: "Escudo", desc: "Começa com escudo ativo", cost: 30, icon: "🛡️", color: "from-blue-500 to-cyan-600" },
  { key: "extra_life", name: "Vida Extra", desc: "Começa com 4 vidas", cost: 50, icon: "❤️", color: "from-rose-500 to-red-600" },
  { key: "frenzy", name: "Frenesi", desc: "Começa em modo frenesi", cost: 40, icon: "⚡", color: "from-orange-500 to-red-500" },
  { key: "double", name: "Dobro", desc: "2x pontos por 10 segundos", cost: 60, icon: "✨", color: "from-fuchsia-500 to-purple-600" },
  { key: "freeze", name: "Congelamento", desc: "Começa com tempo congelado", cost: 35, icon: "❄️", color: "from-sky-400 to-cyan-500" },
];
