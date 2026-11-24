// Service Worker para Sistema Fruver (PWA & Offline Shell)
const CACHE_NAME = "sistema-fruver-shell-v2";
const STATIC_ASSETS = [
  "/",
  "/favicon.svg",
  "/icon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/manifest.json"
];

// 1. Instalación
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        STATIC_ASSETS.map((asset) =>
          cache.add(asset).catch((err) => {
            console.warn("[SW] Advertencia al pre-cachear:", asset, err);
          })
        )
      );
    })
  );
});

// 2. Activación: Purgar cachés antiguas
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[SW] Purgando caché obsoleta:", key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Estrategia de Fetch (Network-First para actualizaciones en vivo)
self.addEventListener("fetch", (event) => {
  const requestUrl = event.request.url;

  if (!requestUrl.startsWith("http://") && !requestUrl.startsWith("https://")) {
    return;
  }

  // Omitir peticiones de API y streaming
  if (requestUrl.includes("/api/") || requestUrl.includes("/storage_data/")) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          networkResponse.type === "basic" &&
          (requestUrl.endsWith(".js") ||
            requestUrl.endsWith(".css") ||
            requestUrl.endsWith(".svg") ||
            requestUrl.endsWith(".png"))
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.mode === "navigate") {
            return caches.match("/");
          }
          return new Response("Sin conexión", {
            status: 503,
            statusText: "Offline",
            headers: { "Content-Type": "text/plain" }
          });
        });
      })
  );
});
