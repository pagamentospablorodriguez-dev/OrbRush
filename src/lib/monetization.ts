import { addGems } from "./supabase";

// === STRIPE PAYMENT LINKS ===
// Substitua cada placeholder pelo seu link de pagamento do Stripe.

export const STRIPE_LINKS = {
  TEMPTATION_OFFER: "https://buy.stripe.com/00w7sLfDP6bo8N58Inb7y0a",
  FIRST_GAME_OVER: "https://buy.stripe.com/6oU3cv9fr0R4fbtcYDb7y0b",
  GEMS_100: "https://buy.stripe.com/cNi14n3V743g4wP8Inb7y0c",
  GEMS_600: "https://buy.stripe.com/28E4gz8bneHU1kD6Afb7y0d",
  GEMS_1500: "https://buy.stripe.com/dRm4gz9frdDQ8N56Afb7y0e",
  GEMS_5000: "https://buy.stripe.com/28E8wP9fr6bo6EX1fVb7y0f",
  SHIELD_PERM: "https://buy.stripe.com/fZu28r2R36bo4wP9Mrb7y0g",
  MYSTERY_BOX_UNLOCK: "https://buy.stripe.com/dRm7sL77jfLY1kDe2Hb7y0h",

};

// === ACTIVATION CODES ===
// Estes códigos vão na URL: https://orbrush.fun/?activate=CODIGO
export const ACTIVATION_CODES = {
  TEMPTATION: "temptation_2x",
  FIRST_OFFER: "first_offer_2x",
  SHIELD_PERM: "perm_shield",
  ADD_100: "add_gems_100",
  ADD_600: "add_gems_600",
  ADD_1500: "add_gems_1500",
  ADD_5000: "add_gems_5000",
  GEMS_600_CHEST: "gems_600_chest",
  GEMS_1500_CHEST_SHIELD: "gems_1500_chest_shield",
  GEMS_5000_MYTHIC: "gems_5000_mythic",
  SKIP_TIMER: "skip_timer",
};

export function checkMonetizationActivation(): string | null {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("activate");
  if (!code) return null;

  if (code === ACTIVATION_CODES.TEMPTATION || code === ACTIVATION_CODES.FIRST_OFFER) {
    localStorage.setItem("orbrush_2x_points", "true");
    return "2x_points";
  }

  if (code === ACTIVATION_CODES.SHIELD_PERM) {
    localStorage.setItem("orbrush_perm_shield", "true");
    return "perm_shield";
  }

  if (code === ACTIVATION_CODES.ADD_100) { addGems(100); return "gems_100"; }
  if (code === ACTIVATION_CODES.ADD_600) { addGems(600); return "gems_600"; }
  if (code === ACTIVATION_CODES.ADD_1500) { addGems(1500); return "gems_1500"; }
  if (code === ACTIVATION_CODES.ADD_5000) { addGems(5000); return "gems_5000"; }

  if (code === ACTIVATION_CODES.GEMS_600_CHEST) {
    addGems(600);
    addPendingChest("legendary", 1);
    return "gems_600_chest";
  }
  if (code === ACTIVATION_CODES.GEMS_1500_CHEST_SHIELD) {
    addGems(1500);
    addPendingChest("legendary", 3);
    localStorage.setItem("orbrush_perm_shield", "true");
    return "gems_1500_chest_shield";
  }
  if (code === ACTIVATION_CODES.GEMS_5000_MYTHIC) {
    addGems(5000);
    addPendingChest("mythic", 1);
    return "gems_5000_mythic";
  }

  if (code === ACTIVATION_CODES.SKIP_TIMER) {
    localStorage.setItem("orbrush_skip_timer", "true");
    return "skip_timer";
  }

  return null;
}

function addPendingChest(rarity: "legendary" | "mythic", count: number) {
  const key = `orbrush_pending_${rarity}_chests`;
  const current = parseInt(localStorage.getItem(key) || "0", 10);
  localStorage.setItem(key, String(current + count));
}

export function getPendingChests(): { legendary: number; mythic: number } {
  return {
    legendary: parseInt(localStorage.getItem("orbrush_pending_legendary_chests") || "0", 10),
    mythic: parseInt(localStorage.getItem("orbrush_pending_mythic_chests") || "0", 10),
  };
}

export function consumePendingChest(rarity: "legendary" | "mythic"): boolean {
  const key = `orbrush_pending_${rarity}_chests`;
  const current = parseInt(localStorage.getItem(key) || "0", 10);
  if (current <= 0) return false;
  localStorage.setItem(key, String(current - 1));
  return true;
}

export function consumeSkipTimer(): boolean {
  if (localStorage.getItem("orbrush_skip_timer") === "true") {
    localStorage.removeItem("orbrush_skip_timer");
    return true;
  }
  return false;
}

export function hasDoublePoints(): boolean {
  return localStorage.getItem("orbrush_2x_points") === "true";
}

export function hasPermanentShield(): boolean {
  return localStorage.getItem("orbrush_perm_shield") === "true";
}
