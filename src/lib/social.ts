const FAKE_NAMES = [
  "Pedro", "Ana", "Lucas", "Maria", "João", "Beatriz", "Gabriel", "Sofia",
  "Rafael", "Júlia", "Bruno", "Lara", "Diego", "Yasmim", "Thiago", "Isabela",
  "Felipe", "Camila", "Vinícius", "Marina", "Gustavo", "Larissa", "Rodrigo", "Fernanda",
  "Matheus", "Amanda", "Leandro", "Patrícia", "Eduardo", "Carolina",
];

const FAKE_EVENTS = [
  (name: string) => ({ text: `${name} acabou de ganhar 2.500 pontos!`, color: "#22d3ee", icon: "🎯" }),
  (name: string) => ({ text: `${name} pegou um tesouro MÍTICO!`, color: "#f43f5e", icon: "💎" }),
  (name: string) => ({ text: `${name} alcançou combo x50!`, color: "#fbbf24", icon: "🔥" }),
  (name: string) => ({ text: `${name} subiu para o nível 15!`, color: "#a855f7", icon: "🚀" }),
  (name: string) => ({ text: `${name} ganhou 150 gemas na roleta!`, color: "#06b6d4", icon: "🎡" }),
  (name: string) => ({ text: `${name} quebrou o recorde com 8.000!`, color: "#f59e0b", icon: "🏆" }),
  (name: string) => ({ text: `${name} abriu um baú LENDÁRIO!`, color: "#fbbf24", icon: "🪙" }),
  (name: string) => ({ text: `${name} derrotou 3 chefes seguidos!`, color: "#ef4444", icon: "⚔️" }),
  (name: string) => ({ text: `${name} mantém 12 dias de sequência!`, color: "#f97316", icon: "🔥" }),
  (name: string) => ({ text: `${name} pegou um arco-íris raro!`, color: "#e879f9", icon: "🌈" }),
  (name: string) => ({ text: `${name} completou todas as missões!`, color: "#22c55e", icon: "✅" }),
  (name: string) => ({ text: `${name} chegou a 10.000 pontos!`, color: "#fbbf24", icon: "💯" }),
];

export interface SocialNotification {
  id: number;
  text: string;
  color: string;
  icon: string;
}

let notifId = 0;

export function rollSocialNotification(): SocialNotification {
  const name = FAKE_NAMES[Math.floor(Math.random() * FAKE_NAMES.length)];
  const eventFn = FAKE_EVENTS[Math.floor(Math.random() * FAKE_EVENTS.length)];
  const event = eventFn(name);
  return { id: notifId++, ...event };
}

export function randomSocialDelay(): number {
  return 8000 + Math.random() * 12000;
}
