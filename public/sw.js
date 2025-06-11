const CACHE_NAME = 'modern-bazaar-v1.0.0';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';
const IMAGE_CACHE = 'images-v1';
const API_CACHE = 'api-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/placeholder.svg',
  // Add critical CSS and JS files here
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/products',
  '/api/categories',
  '/api/banners'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Error caching static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== IMAGE_CACHE && 
                cacheName !== API_CACHE) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    // API requests - Network Only (no cache)
    event.respondWith(handleApiRequest(request));
  } else if (request.destination === 'image') {
    // Images - Cache First with network fallback
    event.respondWith(handleImageRequest(request));
  } else if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
    // Static assets - Cache First
    event.respondWith(handleStaticAssets(request));
  } else {
    // HTML pages - Network First with cache fallback
    event.respondWith(handlePageRequest(request));
  }
});

// Handle API requests with Network Only strategy (no cache)
async function handleApiRequest(request) {
  try {
    // Always fetch from network, never cache
    return await fetch(request);
  } catch (error) {
    console.log('Service Worker: Network failed for API request');
    return new Response('API unavailable', { status: 503 });
  }
}

// Handle image requests with Cache First strategy
async function handleImageRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await getCachedResponse(request, IMAGE_CACHE);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If not in cache, fetch from network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache the image
      const cache = await caches.open(IMAGE_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Failed to load image:', error);
    // Return placeholder image or error response
    return new Response('Image not available', { status: 404 });
  }
}

// Handle static assets with Cache First strategy
async function handleStaticAssets(request) {
  try {
    // Try cache first
    const cachedResponse = await getCachedResponse(request, STATIC_CACHE);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If not in cache, fetch from network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache the asset
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Failed to load static asset:', error);
    return new Response('Asset not available', { status: 404 });
  }
}

// Handle page requests with Network First strategy
async function handlePageRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    // If network fails, try cache
    return await getCachedResponse(request, DYNAMIC_CACHE) || 
           await getCachedResponse(new Request('/'), STATIC_CACHE);
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache for page request');
    // Try to return cached version or fallback to index.html
    return await getCachedResponse(request, DYNAMIC_CACHE) || 
           await getCachedResponse(new Request('/'), STATIC_CACHE) ||
           new Response('Offline - Page not available', { 
             status: 503,
             headers: { 'Content-Type': 'text/html' }
           });
  }
}

// Helper function to get cached response
async function getCachedResponse(request, cacheName) {
  const cache = await caches.open(cacheName);
  return await cache.match(request);
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered');
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Handle background sync
async function doBackgroundSync() {
  try {
    // Implement background sync logic here
    // For example, sync offline cart actions, favorites, etc.
    console.log('Service Worker: Performing background sync');
  } catch (error) {
    console.error('Service Worker: Background sync failed:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New notification from Modern Bazaar',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Explore',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Modern Bazaar', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Cache size management
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE)
        .then((cache) => {
          return cache.addAll(event.data.payload);
        })
    );
  }
});

// Periodic cache cleanup
setInterval(async () => {
  try {
    await cleanupCaches();
  } catch (error) {
    console.error('Service Worker: Cache cleanup failed:', error);
  }
}, 24 * 60 * 60 * 1000); // Run daily

// Clean up old cache entries
async function cleanupCaches() {
  const cacheNames = [IMAGE_CACHE, API_CACHE, DYNAMIC_CACHE];
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
  const now = Date.now();
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      const dateHeader = response?.headers.get('date');
      
      if (dateHeader) {
        const cacheDate = new Date(dateHeader).getTime();
        if (now - cacheDate > maxAge) {
          await cache.delete(request);
          console.log('Service Worker: Deleted old cache entry:', request.url);
        }
      }
    }
  }
}

console.log('Service Worker: Loaded and ready');