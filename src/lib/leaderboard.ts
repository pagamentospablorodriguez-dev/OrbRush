export interface LeaderboardEntry {
  name: string;
  score: number;
  avatar: string;
  isWhale: boolean;
  isYou: boolean;
  isRival: boolean;
  rank: number;
}

const FIRST_NAMES = [
  "Jake", "Emma", "Lucas", "Mia", "Noah", "Sophia", "Liam", "Ava",
  "Ethan", "Olivia", "Mason", "Isabella", "Logan", "Zoe", "Caleb", "Lily",
  "Henry", "Nora", "Leo", "Ruby", "Owen", "Ella", "Max", "Chloe",
  "Alex", "Maya", "Ryan", "Grace", "Sam", "Hazel", "Dylan", "Iris",
  "Theo", "Jade", "Finn", "Wren", "Cole", "Sage", "Reed", "Luna",
];

const AVATAR_EMOJIS = [
  "🦊", "🐼", "🦁", "🐸", "🦄", "🐯", "🐨", "🐵",
  "🦉", "🐺", "🦅", "🐲", "🦖", "🐙", "🦈", "🐬",
  "🐉", "🦂", "🐍", "🦓", "🦌", "🐗", "🦔", "🐾",
  "🌟", "⚡", "🔥", "💎", "🎯", "🎲", "🏆", "👑",
  "🎪", "🎨", "🎭", "🎰", "🎳", "🎮", "🥇", "🦅",
];

const WHALE_NAMES = [
  "DragonSlayer", "MythicKing", "ApexGamer", "VoidLord", "CosmicGod",
  "ShadowEmperor", "EternalBeast", "TitanRuler", "PhantomAce", "InfernoOmega",
];

const WHALE_AVATARS = ["👑", "🏆", "💎", "🔥", "⚡", "🌟", "🐉", "🐲"];

function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

function pickName(rng: () => number, used: Set<string>): string {
  for (let i = 0; i < 50; i++) {
    const name = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
    if (!used.has(name)) {
      used.add(name);
      return name;
    }
  }
  return FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)] + Math.floor(rng() * 99);
}

function pickAvatar(rng: () => number): string {
  return AVATAR_EMOJIS[Math.floor(rng() * AVATAR_EMOJIS.length)];
}

/**
 * Generates a fake but realistic-looking leaderboard around the player's high score.
 *
 * - 3 whales at the top with scores 10x+ the player's, with golden crown avatars.
 * - A "ghost rival" positioned 5-10% above the player's high score.
 *   The rival changes identity each time the player beats them.
 * - Other fake players filling in the ranks, with scores descending around the player.
 *
 * The leaderboard is deterministic per (highScore, rivalSeed) so it stays stable
 * during a session but reshuffles when the player progresses.
 */
export function generateLeaderboard(highScore: number, rivalSeed: number): LeaderboardEntry[] {
  const rng = seededRandom(rivalSeed);
  const usedNames = new Set<string>();
  const entries: LeaderboardEntry[] = [];

  // 3 whales at the top — scores 10x-15x the player's high score (min 50,000)
  const whaleBase = Math.max(highScore * 10, 50000);
  const whaleScores = [
    Math.floor(whaleBase * (2.5 + rng() * 0.5)),
    Math.floor(whaleBase * (1.8 + rng() * 0.3)),
    Math.floor(whaleBase * (1.2 + rng() * 0.2)),
  ];
  whaleScores.sort((a, b) => b - a);

  for (let i = 0; i < 3; i++) {
    entries.push({
      name: WHALE_NAMES[i],
      score: whaleScores[i],
      avatar: WHALE_AVATARS[i],
      isWhale: true,
      isYou: false,
      isRival: false,
      rank: i + 1,
    });
  }

  // Ghost rival — always 5-10% above the player's high score
  const rivalBoost = 1.05 + rng() * 0.05;
  const rivalScore = Math.max(Math.floor(highScore * rivalBoost), highScore + 50);
  const rivalName = pickName(rng, usedNames);
  const rivalAvatar = pickAvatar(rng);

  // Fill in fake players between whales and the rival
  const fakeCount = 5;
  const topRange = whaleScores[2];
  const bottomRange = rivalScore;
  for (let i = 0; i < fakeCount; i++) {
    const t = (i + 1) / (fakeCount + 1);
    const score = Math.floor(topRange - (topRange - bottomRange) * t * (0.8 + rng() * 0.3));
    entries.push({
      name: pickName(rng, usedNames),
      score: Math.max(score, rivalScore + 100),
      avatar: pickAvatar(rng),
      isWhale: false,
      isYou: false,
      isRival: false,
      rank: 0,
    });
  }

  // Add the rival
  entries.push({
    name: rivalName,
    score: rivalScore,
    avatar: rivalAvatar,
    isWhale: false,
    isYou: false,
    isRival: true,
    rank: 0,
  });

  // Add the player
  entries.push({
    name: "You",
    score: highScore,
    avatar: "🎮",
    isWhale: false,
    isYou: true,
    isRival: false,
    rank: 0,
  });

  // Add some players below the player
  const belowCount = 4;
  for (let i = 0; i < belowCount; i++) {
    const dropFactor = 0.4 + rng() * 0.5;
    const score = Math.floor(highScore * dropFactor);
    entries.push({
      name: pickName(rng, usedNames),
      score: Math.max(score, 0),
      avatar: pickAvatar(rng),
      isWhale: false,
      isYou: false,
      isRival: false,
      rank: 0,
    });
  }

  // Sort by score descending and assign ranks
  entries.sort((a, b) => b.score - a.score);
  entries.forEach((e, i) => { e.rank = i + 1; });

  return entries;
}

/**
 * Get the player's rival — the fake player just above them.
 * Returns null if the player somehow has no high score yet.
 */
export function getRival(highScore: number, rivalSeed: number): LeaderboardEntry | null {
  const board = generateLeaderboard(highScore, rivalSeed);
  return board.find((e) => e.isRival) ?? null;
}

/**
 * Generate a new rival seed when the player beats their current rival.
 */
export function newRivalSeed(): number {
  return Math.floor(Math.random() * 1000000) + 1;
}
