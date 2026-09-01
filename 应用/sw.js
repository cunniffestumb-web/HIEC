// Service Worker for 全息智能教育云
const CACHE_NAME = 'hiec-technical-optimized-v4';
const APP_SCOPE = new URL('.', self.registration.scope).href;
const appAsset = path => new URL(String(path).replace(/^\/+/, ''), APP_SCOPE).href;
const urlsToCache = [
    '',
    'index.html',
    'features.html',
    'scenarios.html',
    'architecture.html',
    'resources.html',
    'roadmap.html',
    'team.html',
    'contact.html',
    'demo.html',
    'overview.html',
    'low-latency-rendering.html',
    'natural-interaction.html',
    'multi-user-collaboration.html',
    'spatial-positioning.html',
    'real-time-chat.html',
    'screen-share.html',
    'voice-chat.html',
    'whiteboard.html',
    'doc-collaboration.html',
    'anatomy.html',
    'chemistry.html',
    'astronomy.html',
    'history.html',
    '3d-collaboration.html',
    'styles.css',
    'styles/main.css',
    'styles/components.css',
    'script.js',
    'scripts/lesson-flow.js',
    'scripts/astronomy-3d.js',
    'scripts/chemistry-3d.js',
    'scripts/realtime-collaboration.js',
    'vendor/three/three.min.js',
    'vendor/fontawesome/css/all.min.css',
    'vendor/fontawesome/webfonts/fa-solid-900.woff2',
    'images/favicon.svg',
    'images/icon-192x192.svg',
    'images/icon-512x512.svg',
    'docs/architecture.md',
    'docs/api.md',
    'docs/deployment.md',
    'manifest.json'
].map(appAsset);

// 安装事件 - 缓存资源
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
    );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// 拦截网络请求
self.addEventListener('fetch', event => {
    const requestUrl = new URL(event.request.url);
    if (event.request.method !== 'GET' || requestUrl.origin !== self.location.origin || requestUrl.pathname.startsWith('/api/')) {
        // API 状态和 AI 响应不能被离线缓存，否则部署环境变化后会读取旧状态。
        return;
    }
    const networkFirst = ['document', 'style', 'script', 'font'].includes(event.request.destination);
    event.respondWith(networkFirst ? fetchWithCacheFallback(event.request) : cacheFirst(event.request));
});

function fetchWithCacheFallback(request) {
    return fetch(request)
        .then(response => {
            if (response && response.ok && response.type === 'basic') {
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(request, responseToCache));
            }
            return response;
        })
        .catch(() => caches.match(request).then(response => {
            if (response) return response;
            if (request.destination === 'document') return caches.match(appAsset('index.html'));
            return new Response('', { status: 504, statusText: 'Offline' });
        }));
}

// 后台同步
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

// 推送通知
self.addEventListener('push', event => {
    const options = {
        body: event.data ? event.data.text() : '您有新的消息',
        icon: appAsset('images/icon-192x192.svg'),
        badge: appAsset('images/badge-72x72.svg'),
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: '查看详情',
                icon: appAsset('images/checkmark.svg')
            },
            {
                action: 'close',
                title: '关闭',
                icon: appAsset('images/xmark.svg')
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('全息智能教育云', options)
    );
});

// 通知点击事件
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow(appAsset(''))
        );
    }
});

// 后台同步函数
function doBackgroundSync() {
    return new Promise((resolve, reject) => {
        // 这里可以执行后台数据同步
        console.log('Background sync executed');
        resolve();
    });
}

// 缓存策略：网络优先，缓存降级
function networkFirst(request) {
    return fetch(request)
        .then(response => {
            const responseClone = response.clone();
            caches.open(CACHE_NAME)
                .then(cache => {
                    cache.put(request, responseClone);
                });
            return response;
        })
        .catch(() => {
            return caches.match(request);
        });
}

// 缓存策略：缓存优先，网络降级
function cacheFirst(request) {
    return caches.match(request)
        .then(response => {
            if (response) {
                return response;
            }
            return fetch(request)
                .then(response => {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(request, responseClone);
                        });
                    return response;
                });
        });
}
