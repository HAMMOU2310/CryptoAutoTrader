// ============================================
// Service Worker للتداول 24/7
// ============================================

const CACHE_NAME = 'trading-system-v1';
const CACHE_FILES = [
    '/',
    '/index.html',
    '/app.js',
    '/background-worker.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

// تثبيت Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(CACHE_FILES))
            .then(() => self.skipWaiting())
    );
});

// تفعيل Service Worker
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// اعتراض الطلبات
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});

// Background Sync للتداول المستمر
self.addEventListener('sync', (event) => {
    if (event.tag === 'trading-sync') {
        event.waitUntil(syncTradingData());
    }
});

// Periodic Sync (كل ساعة)
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'trading-periodic-sync') {
        event.waitUntil(periodicTradingSync());
    }
});

// مزامنة بيانات التداول
async function syncTradingData() {
    const clients = await self.clients.matchAll();
    
    clients.forEach(client => {
        client.postMessage({
            type: 'BACKGROUND_SYNC',
            data: { time: new Date() }
        });
    });
    
    // محاكاة تحديث البيانات
    await simulateTradingUpdates();
    
    return Promise.resolve();
}

async function periodicTradingSync() {
    // مهمة مزامنة دورية
    const tradingData = {
        lastSync: new Date(),
        status: 'active',
        trades: []
    };
    
    // حفظ البيانات في IndexedDB
    await saveToIndexedDB(tradingData);
    
    return Promise.resolve();
}

async function simulateTradingUpdates() {
    // محاكاة تحديثات التداول
    console.log('[Service Worker] جاري تحديث بيانات التداول...');
    
    // انتظر 2 ثانية (محاكاة)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('[Service Worker] تم تحديث بيانات التداول');
}

async function saveToIndexedDB(data) {
    // محاكاة حفظ في IndexedDB
    return new Promise((resolve) => {
        const request = indexedDB.open('TradingSystemDB', 1);
        
        request.onsuccess = (event) => {
            const db = event.target.result;
            const tx = db.transaction(['background'], 'readwrite');
            const store = tx.objectStore('background');
            store.put(data, 'sync_data');
            tx.oncomplete = () => resolve();
        };
    });
}

// Push Notifications
self.addEventListener('push', (event) => {
    const data = event.data.json();
    
    const options = {
        body: data.body || 'تحديث جديد من نظام التداول',
        icon: '/icon.png',
        badge: '/badge.png',
        vibrate: [200, 100, 200],
        data: {
            url: data.url || '/'
        }
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title || 'نظام التداول', options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});

// Keep Alive - منع توقف Service Worker
setInterval(() => {
    self.registration.update();
}, 60000); // كل دقيقة
