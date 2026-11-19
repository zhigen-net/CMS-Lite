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

// 4. 外面再包一层公开页面 HTML 缓存（Cloudflare 机房缓存 caches.default）。
// 整站是 force-dynamic、OpenNext 的 incrementalCache 为 dummy，每次访问都完整渲染（CPU 中位数 200ms 以上），
// 爬虫批量抓取时容易超出 Worker 资源限制。缓存只针对：GET、公开页面、200、HTML / XML，且请求不带登录 cookie。
// 缓存 key 带 BUILD_ID，每次部署自动失效；后台改了内容，前台最长 PAGE_TTL 秒后更新。
fs.writeFileSync('dist/_open-next-worker.js', patched)
const buildId = fs.existsSync('.next/BUILD_ID') ? fs.readFileSync('.next/BUILD_ID', 'utf8').trim() : String(Date.now())
const cacheWrapper = `import worker from './_open-next-worker.js'
export * from './_open-next-worker.js'

const BUILD_ID = ${JSON.stringify(buildId)}
const PAGE_TTL = 600    // 页面 10 分钟
const FEED_TTL = 3600   // sitemap / RSS / robots 1 小时
const SKIP_PREFIX = ['/admin', '/api', '/_next', '/uploads', '/cdn-cgi', '/search', '/form']

function cacheable(request, url) {
  if (request.method !== 'GET') return false
  if (SKIP_PREFIX.some(p => url.pathname === p || url.pathname.startsWith(p + '/'))) return false
  // Next 客户端导航请求的是 RSC 数据，不是 HTML，内容随请求头变化，不缓存
  if (request.headers.get('rsc') || request.headers.get('next-router-prefetch') || url.searchParams.has('_rsc')) return false
  // 登录后台的人看前台页面不走缓存（可能看到预览或管理入口）
  const cookie = request.headers.get('cookie') || ''
  if (/(^|;\\s*)cms_token=/.test(cookie)) return false
  // 只允许分页参数，带其它参数的请求不缓存（避免随机参数绕过 / 撑爆缓存）
  for (const k of url.searchParams.keys()) if (k !== 'page') return false
  return true
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    if (!cacheable(request, url) || typeof caches === 'undefined') return worker.fetch(request, env, ctx)

    const cache = caches.default
    const key = new Request(url.origin + '/__html-cache/' + BUILD_ID + url.pathname + url.search)
    try {
      const hit = await cache.match(key)
      if (hit) {
        const res = new Response(hit.body, hit)
        res.headers.set('cache-control', 'no-cache')  // 浏览器每次回来确认，缓存只放在机房
        res.headers.set('x-html-cache', 'HIT')
        return res
      }
    } catch { /* 缓存读失败就当未命中 */ }

    const res = await worker.fetch(request, env, ctx)
    const type = res.headers.get('content-type') || ''
    if (res.status !== 200 || res.headers.has('set-cookie') || !/text\\/html|xml|text\\/plain/.test(type)) return res

    const ttl = /xml|text\\/plain/.test(type) ? FEED_TTL : PAGE_TTL
    const toCache = new Response(res.clone().body, res)
    toCache.headers.set('cache-control', 'public, max-age=' + ttl)
    toCache.headers.delete('vary')  // Next 的 Vary（RSC 等请求头）对缓存 API 无意义，RSC 请求前面已排除
    ctx.waitUntil(cache.put(key, toCache).catch(() => {}))
    const out = new Response(res.body, res)
    out.headers.set('x-html-cache', 'MISS')
    return out
  },
}
`
fs.writeFileSync('dist/_worker.js', cacheWrapper)

const count = fs.readdirSync('dist').length
console.log(`✓ Pages bundle ready in dist/  (${count} entries)`)
