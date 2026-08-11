// src/lib/monetization.ts
import { addGems } from "./supabase";

export const STRIPE_LINKS = {
  TEMPTATION_OFFER: "SEU_LINK_STRIPE_2.99",
  FIRST_GAME_OVER: "SEU_LINK_STRIPE_0.99",
  SHIELD_PERM: "SEU_LINK_STRIPE_4.99",
  GEMS_100: "SEU_LINK_STRIPE_GEMS_100",
  GEMS_600: "SEU_LINK_STRIPE_GEMS_600",
  GEMS_1500: "SEU_LINK_STRIPE_GEMS_1500",
  MYSTERY_BOX_UNLOCK: "SEU_LINK_STRIPE_SKIP_TIMER",
};

export const ACTIVATION_CODES = {
  TEMPTATION: "temptation_2x",
  FIRST_OFFER: "first_offer_2x",
  SHIELD_PERM: "perm_shield",
  ADD_100: "add_gems_100",
  ADD_600: "add_gems_600",
  ADD_1500: "add_gems_1500",
};

export function checkMonetizationActivation() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("activate");
  if (!code) return null;

  // Ativações Permanentes
  if (code === ACTIVATION_CODES.TEMPTATION || code === ACTIVATION_CODES.FIRST_OFFER) {
    localStorage.setItem("orbrush_2x_points", "true");
    cleanUrl();
    return "2x_points";
  }
  if (code === ACTIVATION_CODES.SHIELD_PERM) {
    localStorage.setItem("orbrush_perm_shield", "true");
    cleanUrl();
    return "perm_shield";
  }

  // Entrega de Gemas
  if (code === ACTIVATION_CODES.ADD_100) { addGems(100); cleanUrl(); return "gems_100"; }
  if (code === ACTIVATION_CODES.ADD_600) { addGems(600); cleanUrl(); return "gems_600"; }
  if (code === ACTIVATION_CODES.ADD_1500) { addGems(1500); cleanUrl(); return "gems_1500"; }

  return null;
}

function cleanUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete("activate");
  window.history.replaceState({}, "", url.toString());
}

export function hasDoublePoints() { return localStorage.getItem("orbrush_2x_points") === "true"; }
export function hasPermanentShield() { return localStorage.getItem("orbrush_perm_shield") === "true"; }
