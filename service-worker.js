const CACHE_NAME = 'encuentroiq-v4';
const ASSETS = [
    '/',
    'index.html',
    'login.html',
    'register.html',
    'student-dashboard.html',
    'evaluator-dashboard.html',
    'admin-dashboard.html',
    'submit-work.html',
    'encuesta-satisfaccion.html',
    'download.html',
    'reset-password.html',
    'set-new-password.html',
    'tutorial-estudiante.html',
    'tutorial-evaluador.html',
    '404.html',
    'css/style.css',
    'js/config.js',
    'js/api-client.js',
    'js/app.js',
    'js/evaluation-assignment.js',
    'manifest.json',
    'favicon.ico',
    'favicon.jpg',
    'favicon.png',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js',
    'https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@400;600;700;800&family=Roboto:wght@300;400;500;600;700&display=swap'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return Promise.allSettled(ASSETS.map(a => cache.add(a)));
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);

    // Google Apps Script: NUNCA interceptar. El API se consume directo a la red.
    if (url.hostname === 'script.google.com' || url.hostname === 'script.googleusercontent.com') {
        return;
    }

    // Navegación: stale-while-revalidate con respaldo seguro a index.html
    if (e.request.mode === 'navigate') {
        e.respondWith(
            caches.match(e.request).then(cached => {
                const fetchPromise = fetch(e.request).then(res => {
                    if (res && res.ok) {
                        const clone = res.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
                    }
                    return res;
                }).catch(() => null);
                // nunca resolver undefined: respaldo determinista a index.html
                return fetchPromise.then(res => {
                    if (res) return res;
                    return cached || caches.match('index.html');
                });
            })
        );
        return;
    }

    // Assets estáticos: cache-first
    e.respondWith(
        caches.match(e.request).then(cached => {
            if (cached) return cached;
            return fetch(e.request).then(res => {
                if (res && res.ok) {
                    const clone = res.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
                }
                return res;
            }).catch(() => Response.error());
        })
    );
});