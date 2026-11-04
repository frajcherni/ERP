// This site does not use a service worker.
//
// If a browser still has one installed for this domain (from an older site or
// build), it downloads this file when it checks for updates. This version
// deletes the old caches, removes itself and reloads the open tabs so they load
// fresh from the server. Without this file the update check gets index.html
// back and the old worker stays installed forever.
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.registration.unregister();
      const tabs = await self.clients.matchAll({ type: "window" });
      tabs.forEach((tab) => tab.navigate(tab.url));
    })()
  );
});
