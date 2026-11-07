import { loadStore } from '../../../../lib/storeData';
import { themeById } from '../../../../lib/storeKit';

export const dynamic = 'force-dynamic';

const isHttp = (u) => /^https?:\/\//i.test(String(u || ''));

/* تطبيق المتجر للعميل: اسم المتجر ولوجو التاجر ولونه، ويفتح على المتجر مباشرة */
export async function GET(_req, { params }) {
  const ctx = await loadStore(params.slug);
  if (!ctx) return new Response('not found', { status: 404 });
  const { store, cfg } = ctx;
  const b = cfg.brand || {};
  const th = themeById(b.theme);
  const color = /^#[0-9a-fA-F]{6}$/.test(b.color || '') ? b.color : (th && th.color) || '#014D6F';
  const slug = String(store.store_slug || params.slug);
  const name = String(store.store_name || 'المتجر');
  const logo = isHttp(b.logo) ? b.logo : '';
  const icons = logo
    ? [{ src: logo, sizes: '192x192', purpose: 'any' }, { src: logo, sizes: '512x512', purpose: 'any' }]
    : [{ src: '/brand/icon-192.png?v=2', sizes: '192x192', type: 'image/png', purpose: 'any' }, { src: '/brand/icon-512.png?v=2', sizes: '512x512', type: 'image/png', purpose: 'any' }];
  const body = {
    id: `/shop/${slug}`,
    name,
    short_name: name.length > 12 ? name.slice(0, 12) : name,
    description: String(cfg.brand?.tagline || cfg.seo?.description || '').slice(0, 200),
    start_url: `/shop/${slug}?source=pwa`,
    scope: `/shop/${slug}/`,
    display: 'standalone',
    orientation: 'portrait',
    dir: 'rtl',
    lang: 'ar',
    background_color: '#ffffff',
    theme_color: color,
    icons,
  };
  return new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/manifest+json; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
}
