import { NextResponse } from 'next/server';

/* دومين المتجر الخاص: لو الزيارة جاية على دومين مربوط بمتجر، نعرض المتجر مباشرة من غير /shop/slug.
   الدومينات بتتقرأ من جدول store_domains (مفتاح السيرفر)، ومتخزّنة في الذاكرة دقيقة عشان السرعة. */
const PLATFORM = (process.env.PLATFORM_HOST || 'fast-order-page.vercel.app').toLowerCase();
const cache = new Map(); // host -> { slug, until }
const TTL = 60_000;

const isPlatformHost = (h) => !h || h === PLATFORM || h.endsWith('.vercel.app') || h === 'localhost' || h.startsWith('localhost:') || h.startsWith('127.0.0.1');
const AUTH_PATHS = ['/dashboard', '/admin', '/register', '/login', '/api/dashboard', '/api/platform'];

async function lookup(host) {
  const hit = cache.get(host);
  if (hit && hit.until > Date.now()) return hit.slug;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return '';
  try {
    const r = await fetch(`${url}/rest/v1/store_domains?domain=eq.${encodeURIComponent(host)}&select=slug,status&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: 'no-store',
    });
    if (!r.ok) return '';
    const rows = await r.json();
    const row = rows && rows[0];
    /* أي دومين وصل لهنا فهو مضاف فعلاً على Vercel، فمفيش داعي نشترط حالة 'active' */
    const slug = row && row.slug ? String(row.slug) : '';
    cache.set(host, { slug, until: Date.now() + TTL });
    return slug;
  } catch { return ''; }
}

export async function middleware(req) {
  const host = (req.headers.get('host') || '').toLowerCase().replace(/:\d+$/, '').replace(/^www\./, '');
  if (isPlatformHost(host)) return NextResponse.next();
  const slug = await lookup(host);
  if (!slug) return NextResponse.next();

  const { pathname, search } = req.nextUrl;
  /* صفحات الدخول والإدارة ليها دومين المنصة بس */
  if (AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.redirect(`https://${PLATFORM}${pathname}${search}`);
  }
  if (pathname.startsWith('/api/') || pathname.startsWith('/shop/') || pathname === '/sw.js' || pathname === '/offline.html' || pathname.startsWith('/brand/')) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = `/shop/${slug}${pathname === '/' ? '' : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|robots.txt|sitemap.xml).*)'],
};
