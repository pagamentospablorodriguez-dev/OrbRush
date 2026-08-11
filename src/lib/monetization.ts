// src/lib/monetization.ts

export const STRIPE_LINKS = {
  TEMPTATION_OFFER: "https://buy.stripe.com/test_temptation_299", // Substitua pelo seu link real
  FIRST_GAME_OVER: "https://buy.stripe.com/test_first_gameover_099",
  GEMS_100: "https://buy.stripe.com/test_gems_100_099",
  GEMS_600: "https://buy.stripe.com/test_gems_600_499",
  GEMS_1500: "https://buy.stripe.com/test_gems_1500_999",
  GEMS_5000: "https://buy.stripe.com/test_gems_5000_1999",
  MYSTERY_BOX_UNLOCK: "https://buy.stripe.com/test_mystery_box_instant",
};

// Códigos de ativação via URL (ex: ?activate=temptation )
export const ACTIVATION_CODES = {
  TEMPTATION: "temptation_2x",
  FIRST_OFFER: "first_offer_2x",
  SHIELD_PERM: "perm_shield",
};

export function checkMonetizationActivation() {
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

  return null;
}

export function hasDoublePoints() {
  return localStorage.getItem("orbrush_2x_points") === "true";
}

export function hasPermanentShield() {
  return localStorage.getItem("orbrush_perm_shield") === "true";
}
