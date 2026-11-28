/* =========================================================
   Service worker: rende l'app utilizzabile offline.
   Mette in cache SOLO i file dell'app (cache-first).
   Non tocca mai i file audio: arrivano come URL blob:, che non
   passano dal service worker, e in ogni caso audio/video e le
   richieste con intervallo (Range) vengono lasciati alla rete.
   ========================================================= */
const PREFISSO = 'baseline-';
const CACHE = `${PREFISSO}v2`; // ⚠ aumenta la versione a ogni modifica dei file dell'app
const FILE_APP = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './icons/favicon.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      // cache: 'reload' salta la cache HTTP, così si salvano sempre i file appena pubblicati
      .then(cache => cache.addAll(FILE_APP.map(url => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      // solo le NOSTRE cache vecchie: su username.github.io l'origine è condivisa con gli altri tuoi siti
      .then(nomi => Promise.all(nomi.filter(n => n.startsWith(PREFISSO) && n !== CACHE).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const richiesta = event.request;
  if (richiesta.method !== 'GET'
    || new URL(richiesta.url).origin !== self.location.origin
    || richiesta.destination === 'audio'
    || richiesta.destination === 'video'
    || richiesta.headers.has('range')) {
    return; // nessuna intercettazione
  }
  event.respondWith(
    // solo dalla NOSTRA cache: caches.match() cercherebbe anche in quelle di altre versioni o di altri siti
    caches.open(CACHE)
      .then(cache => cache.match(richiesta, { ignoreSearch: true }))
      .then(risposta => risposta || fetch(richiesta))
  );
});
