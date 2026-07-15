/* global clients */

const readPushPayload = (event) => {
  try {
    return event.data ? event.data.json() : {};
  } catch {
    return {};
  }
};

self.addEventListener("push", (event) => {
  const payload = readPushPayload(event);
  const notification = payload.notification || {};
  const data = payload.data || {};
  const title = notification.title || data.title || "Academent notification";
  const options = {
    body: notification.body || data.body || data.message || "",
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    data: {
      url: notification.click_action || data.click_action || data.actionUrl || payload.fcmOptions?.link || "/notifications",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || "/notifications", self.location.origin).href;

  event.waitUntil((async () => {
    const windows = await clients.matchAll({ type: "window", includeUncontrolled: true });
    const existing = windows.find((client) => client.url.startsWith(self.location.origin));
    if (existing) {
      await existing.focus();
      existing.navigate(targetUrl);
      return;
    }
    await clients.openWindow(targetUrl);
  })());
});