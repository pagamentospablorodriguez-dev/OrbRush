const FAKE_NAMES = [
  "Jake", "Emma", "Lucas", "Mia", "Noah", "Sophia", "Liam", "Ava",
  "Ethan", "Olivia", "Mason", "Isabella", "Logan", "Zoe", "Caleb", "Lily",
  "Henry", "Nora", "Leo", "Ruby", "Owen", "Ella", "Max", "Chloe",
  "Alex", "Maya", "Ryan", "Grace", "Sam", "Hazel",
];

const FAKE_EVENTS = [
  (name: string) => ({ text: `${name} just scored 2,500 points!`, color: "#22d3ee", icon: "🎯" }),
  (name: string) => ({ text: `${name} got a MYTHIC treasure!`, color: "#f43f5e", icon: "💎" }),
  (name: string) => ({ text: `${name} hit a x50 combo!`, color: "#fbbf24", icon: "🔥" }),
  (name: string) => ({ text: `${name} reached level 15!`, color: "#a855f7", icon: "🚀" }),
  (name: string) => ({ text: `${name} won 150 gems on the wheel!`, color: "#06b6d4", icon: "🎡" }),
  (name: string) => ({ text: `${name} broke the record with 8,000!`, color: "#f59e0b", icon: "🏆" }),
  (name: string) => ({ text: `${name} opened a LEGENDARY chest!`, color: "#fbbf24", icon: "🪙" }),
  (name: string) => ({ text: `${name} defeated 3 bosses in a row!`, color: "#ef4444", icon: "⚔️" }),
  (name: string) => ({ text: `${name} is on a 12-day streak!`, color: "#f97316", icon: "🔥" }),
  (name: string) => ({ text: `${name} caught a rare rainbow!`, color: "#e879f9", icon: "🌈" }),
  (name: string) => ({ text: `${name} completed all quests!`, color: "#22c55e", icon: "✅" }),
  (name: string) => ({ text: `${name} reached 10,000 points!`, color: "#fbbf24", icon: "💯" }),
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
