const PREMIUM_KEY = "orbrush_premium";
const PLAY_COUNT_KEY = "orbrush_play_count";
const PAYWALL_SHOWN_KEY = "orbrush_paywall_shown";
const LOCKOUT_UNTIL_KEY = "orbrush_lockout_until";

// Single universal activation code — same for everyone.
// Used in URL: orbrush.fun/activate?code=ORBRUSH-VIP-2024
export const UNIVERSAL_ACTIVATION_CODE = "ORBRUSH-VIP-2024";

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

export function resetPlayCount(): void {
  try {
    localStorage.setItem(PLAY_COUNT_KEY, "0");
  } catch {}
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

// 24h lockout — user cannot play until it expires or they subscribe
export function getLockoutUntil(): number {
  try {
    return parseInt(localStorage.getItem(LOCKOUT_UNTIL_KEY) || "0", 10);
  } catch {
    return 0;
  }
}

export function setLockout24h(): void {
  const until = Date.now() + 24 * 60 * 60 * 1000;
  try {
    localStorage.setItem(LOCKOUT_UNTIL_KEY, String(until));
  } catch {}
}

export function clearLockout(): void {
  try {
    localStorage.removeItem(LOCKOUT_UNTIL_KEY);
  } catch {}
}

export function isLockedOut(): boolean {
  const until = getLockoutUntil();
  return until > 0 && Date.now() < until;
}

export function getLockoutSecondsLeft(): number {
  const until = getLockoutUntil();
  const diff = Math.floor((until - Date.now()) / 1000);
  return Math.max(0, diff);
}

export function resetPaywallState(): void {
  try {
    localStorage.removeItem(PAYWALL_SHOWN_KEY);
  } catch {}
}

// Check URL for activation code on load. If present and valid, activate premium.
// Then strip it from the URL so nobody can copy it.
export function checkUrlActivation(): boolean {
  try {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const pathname = url.pathname;

    // Support both /activate?code=XXX and ?code=XXX
    if (code && code.toUpperCase() === UNIVERSAL_ACTIVATION_CODE) {
      setPremium(true);
      clearLockout();
      resetPlayCount();
      // Strip the code from the URL
      url.searchParams.delete("code");
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
    clearLockout();
    resetPlayCount();
    return { valid: true, message: "Premium activated!" };
  }
  return { valid: false, message: "Invalid activation code." };
}
