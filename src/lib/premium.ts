const PREMIUM_KEY = "orbrush_premium";

// Single universal activation code — same for everyone.
// Used in URL: orbrush.fun/activate?code=ORBRUSH-VIP-2024
export const UNIVERSAL_ACTIVATION_CODE = "ORBRUSH-VIP-2024";

// Stripe checkout URL — update this with your $4.99 one-time purchase product URL
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
    return { valid: true, message: "Premium activated!" };
  }
  return { valid: false, message: "Invalid activation code." };
}
