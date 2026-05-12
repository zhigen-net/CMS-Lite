import fs from 'fs'
import path from 'path'

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name)
    const d = path.join(dest, entry.name)
    entry.isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d)
  }
}

// Clean
fs.rmSync('dist', { recursive: true, force: true })
fs.mkdirSync('dist', { recursive: true })

// 1. Static assets go to root of dist (e.g. _next/static/..., BUILD_ID)
copyDir('.open-next/assets', 'dist')

// 2. Worker runtime dependencies (imported via relative paths in _worker.js)
copyDir('.open-next/cloudflare', 'dist/cloudflare')
copyDir('.open-next/middleware', 'dist/middleware')
copyDir('.open-next/server-functions', 'dist/server-functions')
copyDir('.open-next/.build', 'dist/.build')

// 3. Entry point → _worker.js, patched to serve static assets via env.ASSETS
const workerSrc = fs.readFileSync('.open-next/worker.js', 'utf8')

// Patch: add ASSETS fallback + R2 uploads serving before Next.js handler
const staticAssetPatch = `
// Serve static assets (CSS, JS chunks, images) via Cloudflare Pages ASSETS binding
if (env.ASSETS) {
  const { pathname } = url;
  const isStaticAsset =
    pathname.startsWith('/_next/static/') ||
    pathname.startsWith('/_next/image') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml';
  if (isStaticAsset) {
    const assetResp = await env.ASSETS.fetch(request);
    if (assetResp.status !== 404) return assetResp;
  }
}

// Serve R2 media files at /uploads/*
if (env.R2 && url.pathname.startsWith('/uploads/')) {
  const key = url.pathname.slice('/uploads/'.length);
  const object = await env.R2.get(key);
  if (object) {
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('cache-control', 'public, max-age=31536000, immutable');
    return new Response(object.body, { headers });
  }
  return new Response('Not Found', { status: 404 });
}
`

// Insert patch after URL parsing in the fetch handler
const patchTarget = `// Serve images in development.`
const patched = workerSrc.replace(patchTarget, staticAssetPatch + patchTarget)

if (patched === workerSrc) {
  console.warn('⚠ Could not patch _worker.js - static asset serving may not work')
}

fs.writeFileSync('dist/_worker.js', patched)

const count = fs.readdirSync('dist').length
console.log(`✓ Pages bundle ready in dist/  (${count} entries)`)
