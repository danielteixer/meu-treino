// Service Worker do app "Treino" — permite abrir e usar o app sem internet
// depois do primeiro carregamento (registro de cargas, volume e histórico
// continuam funcionando 100% offline, pois tudo é salvo no localStorage).
//
// Sempre que publicar uma nova versão do index.html, aumente o número
// abaixo (ex.: "treino-cache-v2") para que os aparelhos baixem a atualização.
var CACHE_NAME = "treino-cache-v1";

var CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-180.png",
  "./icon-120.png",
  "./favicon.png",
  "https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"
];

self.addEventListener("install", function(event){
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return Promise.all(
        CORE_ASSETS.map(function(url){
          var req = url.indexOf("http") === 0 ? new Request(url, {mode:"no-cors"}) : url;
          return fetch(req).then(function(res){ return cache.put(url, res); }).catch(function(){});
        })
      );
    })
  );
});

self.addEventListener("activate", function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE_NAME; }).map(function(k){ return caches.delete(k); })
      );
    }).then(function(){ return self.clients.claim(); })
  );
});

// Estratégia "stale-while-revalidate": responde imediatamente com o que já
// está em cache (rápido e funciona offline) e, em paralelo, busca uma versão
// nova na rede para atualizar o cache silenciosamente.
self.addEventListener("fetch", function(event){
  var req = event.request;
  if (req.method !== "GET") return;

  event.respondWith(
    caches.match(req).then(function(cached){
      var networkFetch = fetch(req).then(function(networkRes){
        if (networkRes && (networkRes.status === 200 || networkRes.type === "opaque")) {
          var copy = networkRes.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(req, copy); });
        }
        return networkRes;
      }).catch(function(){ return cached; });

      return cached || networkFetch;
    })
  );
});
