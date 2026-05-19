import apiClient from "@/api/apiClient";

const SW_URL = "/sw.js";

/** VAPID public key — set in Next env. If absent we fall back to the API
 *  endpoint so the key can rotate without a frontend deploy. */
const STATIC_VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

let cachedVapidKey: string | null = STATIC_VAPID_KEY || null;

async function getVapidPublicKey(): Promise<string | null> {
  if (cachedVapidKey) return cachedVapidKey;
  try {
    const { data } = await apiClient.get<{ public_key: string }>(
      "/push/vapid-key/",
    );
    cachedVapidKey = data.public_key || null;
    return cachedVapidKey;
  } catch {
    return null;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

function isSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!isSupported()) return null;
  const existing = await navigator.serviceWorker.getRegistration(SW_URL);
  if (existing) return existing;
  return navigator.serviceWorker.register(SW_URL, { scope: "/" });
}

/**
 * Idempotent: registers the service worker, prompts for permission if needed,
 * subscribes to push, and hands the subscription to the backend. Safe to call
 * on every authenticated app load — duplicate registrations are no-ops on the
 * backend (update_or_create on (user, token)).
 */
export async function subscribeToWebPush(): Promise<boolean> {
  if (!isSupported()) return false;

  const vapidKey = await getVapidPublicKey();
  if (!vapidKey) {
    console.warn("Web push: VAPID public key unavailable; skipping subscription.");
    return false;
  }

  const permission =
    Notification.permission === "default"
      ? await Notification.requestPermission()
      : Notification.permission;
  if (permission !== "granted") return false;

  const registration = await getRegistration();
  if (!registration) return false;

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    try {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      });
    } catch (err) {
      console.warn("Web push subscribe failed:", err);
      return false;
    }
  }

  try {
    await apiClient.post("/device-tokens/", {
      token: JSON.stringify(subscription.toJSON()),
      platform: "web",
      user_agent: navigator.userAgent.slice(0, 255),
    });
    return true;
  } catch (err) {
    console.warn("Web push registration to backend failed:", err);
    return false;
  }
}

/** Call on logout to detach the browser from the user's push fan-out. */
export async function unsubscribeFromWebPush(): Promise<void> {
  if (!isSupported()) return;
  const registration = await navigator.serviceWorker.getRegistration(SW_URL);
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;

  try {
    await apiClient.delete("/device-tokens/", {
      data: { token: JSON.stringify(subscription.toJSON()) },
    });
  } catch {
    // Best-effort — local unsubscribe still matters even if server call fails.
  }
  await subscription.unsubscribe();
}
