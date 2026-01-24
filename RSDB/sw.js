// sw.js - 简单高效的缓存策略（2025-2026 推荐 Cache-First + Network-Fallback）

const CACHE_NAME = 'roundbar-app-v1.0';  // 改版本号会强制更新缓存
const urlsToCache = [
    './',
    './index.html',
    'https://unpkg.com/mdui@2/mdui.css',
    'https://unpkg.com/mdui@2.0.3/mdui.global.js',
    'https://unpkg.com/xlsx/dist/xlsx.full.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js',
    ];

// 安装时预缓存核心资源
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('缓存核心文件...');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())  // 立即激活新 SW
    );
});

// 激活时清理旧缓存
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// 拦截请求 - 优先使用缓存（Cache First），失败再走网络
self.addEventListener('fetch', event => {
    // 可选：只处理同源请求，避免 CDN 资源被 SW 拦截导致问题
    if (!event.request.url.startsWith(self.location.origin)) {
        return; // 直接走网络
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // 有缓存 → 直接返回（离线可用）
                if (response) {
                    return response;
                }

                // 无缓存 → 请求网络，并缓存响应
                return fetch(event.request).then(networkResponse => {
                    // 只缓存成功的 GET 请求
                    if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                        return networkResponse;
                    }

                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });

                    return networkResponse;
                }).catch(() => {
                    // 网络彻底失败 → 可选：返回离线页面或提示
                    // return caches.match('./offline.html'); // 如果你做了离线页
                });
            })
    );
});