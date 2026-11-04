// Helpers for the data this site keeps inside the browser. Problems that show up
// in one browser only (and not in private browsing or on another PC) come from
// this data: an old service worker, its caches, or damaged saved values.

const deleteCaches = async () => {
  if (!("caches" in window)) return;
  const keys = await caches.keys();
  await Promise.all(keys.map((key) => caches.delete(key)));
};

const unregisterServiceWorkers = async () => {
  if (!("serviceWorker" in navigator)) return 0;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));
  return registrations.length;
};

/**
 * The app does not use a service worker. If one is installed for this domain
 * (left over from an older site or build), remove it and its caches so it can
 * no longer answer requests with stale files, then reload once from the server.
 */
export const removeLeftoverServiceWorkers = async () => {
  try {
    const removed = await unregisterServiceWorkers();
    if (removed === 0) return;
    await deleteCaches();

    const reloadFlag = "sw-cleanup-reloaded";
    if (navigator.serviceWorker.controller && !sessionStorage.getItem(reloadFlag)) {
      sessionStorage.setItem(reloadFlag, "1");
      window.location.reload();
    }
  } catch (error) {
    console.warn("Service worker cleanup failed:", error);
  }
};

/**
 * Wipes everything this site saved in the browser (session, settings, caches,
 * service workers). Same effect as "Clear site data" in the browser settings.
 */
export const clearSiteData = async () => {
  try {
    sessionStorage.clear();
    localStorage.clear();
  } catch (error) {
    console.warn("Could not clear storage:", error);
  }
  try {
    await unregisterServiceWorkers();
    await deleteCaches();
  } catch (error) {
    console.warn("Could not clear caches:", error);
  }
};
