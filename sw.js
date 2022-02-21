const BASE = location.protocol + "//" + location.host;
const VERSION = 'V2';
const CACHED_FILES = [
    `${BASE}/app.css`,
    `${BASE}/app.js`,
    `${BASE}/assets/fonts/Poppins/Poppins-Regular.ttf`,
    `${BASE}/assets/icons/512x512.png`
]

self.addEventListener("install", (event) => {
    self.skipWaiting();
    event.waitUntil(
        (async () => {
            const cache = await caches.open(VERSION);
            await Promise.all([...CACHED_FILES, '/index.html'].map((path) => {
                return cache.add(new Request(path));
            }))
        })()
    );
    console.log(`${VERSION} Install`);
});

self.addEventListener("activate", (event) => {
    clients.claim();
    event.waitUntil(
        (async () => {
            const keys = await caches.keys();
            await Promise.all(
                keys.map(key => {
                    if (!key.includes(VERSION)) {
                        return caches.delete(key);
                    }
                })
            );
        }
    )())
    console.log(`${VERSION} Active`);
});

self.addEventListener("fetch", (event) => {
    console.log(
        `${VERSION} Fetching : ${event.request.url}, Mode : ${event.request.mode}`);
    if (event.request.mode === 'navigate') {
        event.respondWith(
            (async () => {
                try {
                    const preloadResponse = await event.preventResponse;
                    if (preloadResponse) {
                        return preloadResponse;
                    }
                    return await fetch(event.request);
                } catch (error) {
                    const cache = await caches.open(VERSION);
                    return await cache.match('/index.html');
                }
            })()
        )
    } else if (CACHED_FILES.includes(event.request.url)) {
        event.respondWith(caches.match(event.request));
    }
});