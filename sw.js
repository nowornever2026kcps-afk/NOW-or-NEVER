const CACHE_NAME = "now-or-never-v3";

self.addEventListener("install", event => self.skipWaiting());
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));

/* Inject the optional reminder module into HTML without changing index.html. */
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  const accept = event.request.headers.get("accept") || "";
  if (url.origin !== self.location.origin || !accept.includes("text/html")) return;
  event.respondWith((async () => {
    try {
      const response = await fetch(event.request);
      const type = response.headers.get("content-type") || "";
      if (!type.includes("text/html")) return response;
      const text = await response.text();
      if (text.includes("js/daily-reminder.js")) return new Response(text, {status:response.status, statusText:response.statusText, headers:response.headers});
      const injected = text.replace(/<\/body>/i, '<script src="js/daily-reminder.js"></script></body>');
      return new Response(injected, {status:response.status, statusText:response.statusText, headers:response.headers});
    } catch (error) {
      console.error("Reminder HTML injection failed:", error);
      return fetch(event.request);
    }
  })());
});

/* =========================================================
   PUSH NOTIFICATION
   ========================================================= */
self.addEventListener("push", event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; }
  catch (error) { console.error("Push data error", error); }
  const title = data.title || "NOW-or-NEVER";
  const options = {
    body: data.body || "You have a new notification.",
    icon: data.icon || "/NOW-or-NEVER/logo.png",
    badge: data.badge || "/NOW-or-NEVER/logo.png",
    tag: data.tag || `now-or-never-${Date.now()}`,
    renotify: true,
    requireInteraction: false,
    vibrate: [200,100,200,100,400],
    timestamp: Date.now(),
    data: {url: data.url || "/NOW-or-NEVER/"}
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/NOW-or-NEVER/";
  event.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(clientList => {
    for (const client of clientList) {
      if ("focus" in client) {
        client.navigate(targetUrl);
        return client.focus();
      }
    }
    if (clients.openWindow) return clients.openWindow(targetUrl);
  }));
});
