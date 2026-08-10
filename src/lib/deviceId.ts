const DEVICE_ID_KEY = "orbrush_device_id";

export function getDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = generateDeviceId();
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return generateDeviceId();
  }
}

function generateDeviceId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "dev-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
}
