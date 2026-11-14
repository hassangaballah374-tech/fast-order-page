import { headers } from 'next/headers';
import { adminClient } from '../lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const PLATFORM = (process.env.PLATFORM_HOST || 'fast-order-page.vercel.app').toLowerCase();
const MAX_STORES = 2000;
const MAX_PRODUCTS = 5000;

/* sitemap حسب الدومين: على المنصة = صفحاتها + المتاجر المفعّلة، وعلى دومين متجر = المتجر ومنتجاته فقط */
export default async function sitemap() {
  const h = headers();
  const host = (h.get('x-forwarded-host') || h.get('host') || PLATFORM).split(',')[0].trim().toLowerCase();
  const origin = `https://${host}`;
  const now = new Date();
  let sb;
  try { sb = adminClient(); } catch { sb = null; }

  const onPlatform = host === PLATFORM || host.endsWith('.vercel.app') || host.startsWith('localhost');
  if (onPlatform) {
    const out = [{ url: origin, lastModified: now }, { url: `${origin}/terms`, lastModified: now }];
    if (!sb) return out;
    const { data } = await sb.from('store_profiles').select('store_slug').eq('is_active', true).limit(MAX_STORES);
    for (const s of data || []) if (s.store_slug) out.push({ url: `${origin}/shop/${encodeURIComponent(s.store_slug)}`, lastModified: now });
    return out;
  }

  if (!sb) return [];
  const { data: dom } = await sb.from('store_domains').select('store_id, slug').eq('domain', host).maybeSingle();
  if (!dom) return [];
  const { data: sp } = await sb.from('store_profiles').select('is_active').eq('user_id', dom.store_id).maybeSingle();
  if (!sp?.is_active) return [];
  const base = `${origin}/shop/${encodeURIComponent(dom.slug)}`;
  const out = [{ url: base, lastModified: now }, { url: `${base}/products`, lastModified: now }];
  const { data: prods } = await sb.from('products').select('id, created_at').eq('store_id', dom.store_id).eq('status', 'active').limit(MAX_PRODUCTS);
  for (const p of prods || []) out.push({ url: `${base}/p/${p.id}`, lastModified: new Date(p.created_at || now) });
  return out;
}
