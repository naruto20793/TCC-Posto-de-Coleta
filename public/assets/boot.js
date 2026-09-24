window.appReady = (async () => {
  if ("serviceWorker" in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations
          .filter((r) => r.scope === location.origin + "/")
          .map((r) => r.unregister()),
      );
      if ("caches" in window)
        await Promise.all(
          (await caches.keys())
            .filter((k) => k.startsWith("posto-"))
            .map((k) => caches.delete(k)),
        );
      if (
        navigator.serviceWorker.controller &&
        !sessionStorage.getItem("posto.worker-upgrade")
      ) {
        sessionStorage.setItem("posto.worker-upgrade", "1");
        location.reload();
        await new Promise(() => {});
      }
    } catch {
      /* O app funciona sem cache offline. */
    }
  }
})();
