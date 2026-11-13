// Service worker: lets the app install on phones and open quickly (and without signal).
// Your data is never stored here – it always comes from the Google Sheet.
const CACHE = "jobsheets-v2";
const SHELL = ["./", "index.html", "config.js", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png", "favicon.png"];
const LIBS = ["https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js", "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"];

self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(SHELL);
    await Promise.all(LIBS.map(u => fetch(u, {mode: "no-cors"}).then(r => c.put(u, r)).catch(() => {})));
    self.skipWaiting();
  })());
});
self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET") return;                                     // data calls go straight to Google
  if (/(^|\.)google\.com$|googleusercontent\.com$/.test(url.hostname)) return;
  const fresh = url.origin === location.origin && (req.mode === "navigate" || /\/(index\.html|config\.js)?$/.test(url.pathname));
  if (fresh) {                                                          // newest version when online, cached copy when not
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return r; })
      .catch(() => caches.match(req).then(r => r || caches.match("index.html"))));
  } else {                                                              // icons and PDF/Excel libraries: cache first
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(n => { const copy = n.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return n; })));
  }
});

// Timesheet reminders: Firebase delivers the push, this shows it.
self.addEventListener("push", e => {
  let j = {}; try { j = e.data ? e.data.json() : {}; } catch (err) { j = {body: e.data && e.data.text()}; }
  const d = Object.assign({}, j.notification || {}, j.data || {}, (!j.data && !j.notification) ? j : {});
  e.waitUntil(self.registration.showNotification(d.title || "Job Sheets", {
    body: d.body || "", icon: "icon-192.png", badge: "icon-192.png", tag: "timesheet-reminder", renotify: true,
    data: {url: d.url || "./"}
  }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || "./", self.registration.scope).href;
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({type: "window", includeUncontrolled: true});
    for (const c of all) if (c.url.startsWith(self.registration.scope)) { c.postMessage({go: "timesheet"}); return c.focus(); }
    return self.clients.openWindow(url);
  })());
});
