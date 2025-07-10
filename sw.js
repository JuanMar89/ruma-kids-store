const CACHE_NAME = "ruma-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/estilos.css",
  "/script.js",
  "/img/lgo_rk.png",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
];

// Instalación: cacheo inicial
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Activación: limpiar cachés viejos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) return caches.delete(name);
        })
      );
    })
  );
});

// Intercepción de peticiones
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Si está en caché, devolverlo
      if (response) return response;

      // Si no está en caché, intentar traerlo y guardarlo
      return fetch(event.request)
        .then((res) => {
          // Opcional: guardar en caché dinámico
          return caches.open(CACHE_NAME).then((cache) => {
            if (event.request.method === "GET") {
              cache.put(event.request, res.clone());
            }
            return res;
          });
        })
        .catch(() => {
          // Si falla (modo offline), devolver un fallback opcional
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
    })
  );
});
