/* Tajma Web Push service worker.
 *
 * Handles two events:
 *   - push:              an incoming notification from the server.
 *   - notificationclick: user tapped the OS notification — focus or open the app.
 *
 * Foreground suppression: if any window of this origin is currently visible,
 * we don't show the OS-level notification. Instead we postMessage the payload
 * to the visible client so it can render an in-app banner. This matches the
 * WhatsApp/Telegram pattern: never both at once.
 */

self.addEventListener("install", (event) => {
  // Activate immediately on first install / update.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  event.waitUntil(handlePush(event));
});

async function handlePush(event) {
  let payload = {};
  try {
    if (event.data) payload = event.data.json();
  } catch {
    payload = { title: "Tajma", body: event.data?.text() ?? "" };
  }

  const title = payload.title || "Tajma";
  const body = payload.body || "";
  const data = payload.data || {};

  // If a visible client exists, hand the payload to it and skip the OS toast.
  const visibleClients = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });
  const isVisible = visibleClients.some((c) => c.visibilityState === "visible");

  if (isVisible) {
    for (const client of visibleClients) {
      client.postMessage({ type: "push:notification", title, body, data });
    }
    return;
  }

  await self.registration.showNotification(title, {
    body,
    icon: "/logo.png",
    badge: "/logo.png",
    tag: data.notification_id || undefined,
    data,
    requireInteraction: false,
  });
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(focusOrOpen(event.notification.data));
});

async function focusOrOpen(data) {
  const deepLink = (data && (data.deep_link || data.url)) || "/";
  const allClients = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });
  for (const client of allClients) {
    if ("focus" in client) {
      await client.focus();
      client.postMessage({ type: "push:notificationclick", data });
      return;
    }
  }
  if (self.clients.openWindow) {
    await self.clients.openWindow(deepLink);
  }
}
