const CACHE_NAME = 'encuentroiq-v6';
const PUSH_ICON = 'assets/icon-192.png';

importScripts('js/config.js');

// Web Push: notificación llegó al dispositivo (aunque esté bloqueado)
self.addEventListener('push', (event) => {
    event.waitUntil(handlePush(event));
});

async function handlePush(event) {
    let count = 1;
    let body = 'Un evaluador solicitó ayuda.';
    let evaluatorName = '';
    try {
        const res = await fetch(`${GOOGLE_SCRIPT_URL}?action=getPendingHelpSummary`);
        const json = await res.json();
        if (json.success && json.data) {
            count = json.data.count || 1;
            evaluatorName = json.data.evaluators || '';
            if (json.data.lastMessage) body = `"${json.data.lastMessage}"`;
        }
    } catch (e) { /* sin red, mostramos el aviso genérico */ }

    const title = count > 1 ? `${count} evaluadores esperan ayuda` : 'Solicitud de ayuda';
    const message = count > 1
        ? 'Revisa el panel de administración para atender las solicitudes.'
        : (evaluatorName ? `${evaluatorName}: ` : '') + body;

    return self.registration.showNotification(title, {
        body: message,
        icon: PUSH_ICON,
        badge: PUSH_ICON,
        tag: 'help-request',
        vibrate: [280, 100, 280],
        data: { url: 'admin-dashboard.html' }
    });
}

// Tocar la notificación abre el panel de administración
self.addEventListener('notificationclick', (event) => {
    const url = (event.notification.data && event.notification.data.url) || 'admin-dashboard.html';
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
            for (const client of list) {
                if ('focus' in client) { client.focus(); return; }
            }
            if (clients.openWindow) clients.openWindow(url);
        })
    );
});

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

    // JS/CSS/manifest propios: network-first para nunca servir código viejo en caché
    if (url.origin === self.location.origin && (url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname === '/manifest.json')) {
        e.respondWith(
            fetch(e.request).then(res => {
                if (res && res.ok) {
                    const clone = res.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
                }
                return res;
            }).catch(() => caches.match(e.request).then(cached => cached || Response.error()))
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