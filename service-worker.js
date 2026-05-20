const CACHE_NAME = "masseira-cache-v1";

// Lista de arquivos essenciais que serão guardados na memória do dispositivo
const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./tv.html",
  "./style.css",
  "./script.js",
  "./manifest.json",
  "./img/background.jfif",
  "./img/bimbo2.png",
  "./img/favicon.ico"
];

// Instala o Service Worker e guarda os arquivos no cache offline
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("Masseira PWA: Arquivos cacheados com sucesso!");
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Ativa o Service Worker e limpa caches antigos de outras versões
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log("Masseira PWA: Limpando cache antigo", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Gerencia as requisições: tenta puxar do cache offline primeiro, se não conseguir busca na rede
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});