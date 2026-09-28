"""Rigenera sw.js (service worker per giocare offline / app installata) con l'elenco dei file del gioco."""
import os, json
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VERSION = 'ps2-0.2'
files = ['./', 'index.html', 'style.css', 'manifest.json']
for d in ['js', 'vendor', 'assets/sprites', 'assets/bg', 'assets/ui', 'assets/fonts', 'assets/music']:
    p = os.path.join(ROOT, d)
    if not os.path.isdir(p): continue
    for f in sorted(os.listdir(p)):
        if f.lower().endswith(('.js', '.png', '.jpg', '.woff2', '.woff', '.ttf', '.mp3', '.ogg')): files.append(f'{d}/{f}')
sw = f"""/* Primal Sentinels — service worker (generato da tools/build_sw.py) */
const CACHE = '{VERSION}';
const FILES = {json.dumps(files, indent=0)};
self.addEventListener('install', (e) => {{
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(FILES.map((f) => c.add(f).catch(() => null)))).then(() => self.skipWaiting()));
}});
self.addEventListener('activate', (e) => {{
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
}});
self.addEventListener('fetch', (e) => {{
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;   // online play (PeerJS) goes straight to the network
  const fresh = /\.(html|js|css|json)$|\/$/.test(u.pathname);   // code: network first (updates arrive at once), art/audio: cache first
  const net = () => fetch(e.request).then((r) => {{ if (r.ok) {{ const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }} return r; }});
  e.respondWith(fresh ? net().catch(() => caches.match(e.request, {{ ignoreSearch: true }})) : caches.match(e.request, {{ ignoreSearch: true }}).then((hit) => hit || net()));
}});
"""
open(os.path.join(ROOT, 'sw.js'), 'w').write(sw)
print(len(files), 'file nella cache')
