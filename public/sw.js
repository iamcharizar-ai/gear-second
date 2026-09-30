// Offline app shell: hashed /assets/ are immutable → cache-first; the page is
// network-first with a short timeout and a cached fallback, so the gym's bad
// signal never blocks opening a workout. Bump CACHE when the strategy changes.
const CACHE = 'strong-shell-v2'
const PAGE_TIMEOUT_MS = 2500

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['/'])).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

const store = (req, res) => {
  if (res.ok) {
    const copy = res.clone()
    caches.open(CACHE).then((c) => c.put(req, copy))
  }
  return res
}

self.addEventListener('fetch', (e) => {
  const req = e.request
  const url = new URL(req.url)
  if (req.method !== 'GET' || url.origin !== self.location.origin) return

  if (url.pathname.startsWith('/assets/')) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => store(req, res))))
    return
  }
  const key = req.mode === 'navigate' ? '/' : req
  e.respondWith(
    Promise.race([
      fetch(req).then((res) => store(key, res)),
      new Promise((_, reject) => setTimeout(reject, PAGE_TIMEOUT_MS)),
    ]).catch(() => caches.match(key, { ignoreSearch: true }).then((m) => m || caches.match('/'))),
  )
})
