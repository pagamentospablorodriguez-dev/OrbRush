import { checkMonetizationActivation } from "./monetization";

const PREMIUM_KEY = "orbrush_premium";
const DOUBLE_POINTS_KEY = "orbrush_2x_points";

export const UNIVERSAL_ACTIVATION_CODE = "ORBRUSH-VIP-2024";

// Stripe checkout URL — $4.99 one-time purchase
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

export function hasDoublePoints(): boolean {
  try {
    return localStorage.getItem(DOUBLE_POINTS_KEY) === "true";
  } catch {
    return false;
  }
}

export function setDoublePoints(value: boolean): void {
  try {
    localStorage.setItem(DOUBLE_POINTS_KEY, value ? "true" : "false");
  } catch {}
}

export function checkUrlActivation(): boolean {
  try {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const activate = url.searchParams.get("activate");
    const pathname = url.pathname;

    let activated = false;

    if (code && code.toUpperCase() === UNIVERSAL_ACTIVATION_CODE) {
      setPremium(true);
      url.searchParams.delete("code");
      activated = true;
    }

    if (activate === "2x_points") {
      setDoublePoints(true);
      url.searchParams.delete("activate");
      activated = true;
    }

    const monetizationResult = checkMonetizationActivation();
    if (monetizationResult) {
      url.searchParams.delete("activate");
      activated = true;
    }

    if (activated) {
      const cleanPath = pathname === "/activate" ? "/" : pathname;
      window.history.replaceState({}, "", url.origin + cleanPath + (url.searchParams.toString() ? "?" + url.searchParams.toString() : ""));
      return true;
    }
  } catch {}
  return false;
}

export async function activateWithCode(code: string): Promise<{ valid: boolean; message: string }> {
  if (code.toUpperCase() === UNIVERSAL_ACTIVATION_CODE) {
    setPremium(true);
    return { valid: true, message: "Premium activated!" };
  }
  return { valid: false, message: "Invalid activation code." };
}
