const PREMIUM_KEY = "orbrush_premium";
const PLAY_COUNT_KEY = "orbrush_play_count";
const PAYWALL_SHOWN_KEY = "orbrush_paywall_shown";

export const STRIPE_CHECKOUT_URL = "https://buy.stripe.com/bJe6oH63f6bogfx8Inb7y09";

export function isPremium(): boolean {
  try {
    return localStorage.getItem(PREMIUM_KEY) === "true";
  } catch {
    return false;
  }
}

export function setPremium(value: boolean): void {
  try {
    localStorage.setItem(PREMIUM_KEY, value ? "true" : "false");
  } catch {}
}

export function getPlayCount(): number {
  try {
    return parseInt(localStorage.getItem(PLAY_COUNT_KEY) || "0", 10);
  } catch {
    return 0;
  }
}

export function incrementPlayCount(): number {
  const count = getPlayCount() + 1;
  try {
    localStorage.setItem(PLAY_COUNT_KEY, String(count));
  } catch {}
  return count;
}

export function hasPaywallBeenShown(): boolean {
  try {
    return localStorage.getItem(PAYWALL_SHOWN_KEY) === "true";
  } catch {
    return false;
  }
}

export function setPaywallShown(value: boolean): void {
  try {
    localStorage.setItem(PAYWALL_SHOWN_KEY, value ? "true" : "false");
  } catch {}
}

export function resetPaywallState(): void {
  try {
    localStorage.removeItem(PAYWALL_SHOWN_KEY);
  } catch {}
}

import { supabase } from "./supabase";

export async function activateWithCode(code: string): Promise<{ valid: boolean; message: string }> {
  const { data, error } = await supabase.rpc("activate_code", { input_code: code });

  if (error) {
    return { valid: false, message: "Connection error. Please try again." };
  }

  if (data && data.valid) {
    setPremium(true);
    return { valid: true, message: "Premium activated!" };
  }

  return { valid: false, message: data?.message ?? "Invalid activation code." };
}
