import { cache } from 'react';
import { adminClient } from './supabaseAdmin';
import { getStoreBySlug, storeKey, getConfig } from './storeServer';
import { ttl } from './ttl';

/* تحميل المتجر مرة واحدة لكل طلب (الـ layout والصفحة يشتركان فيه). يرجع null لو المتجر غير موجود. */
export const loadStore = cache(async (slug) => {
  let sb;
  try { sb = adminClient(); } catch { return null; }
  const base = await ttl(`store:${String(slug || '').toLowerCase().trim()}`, 20_000, async () => {
    const store = await getStoreBySlug(sb, slug);
    if (!store) return null;
    const sid = storeKey(store);
    const cfg = await getConfig(sb, sid);
    return { store, sid, cfg };
  });
  if (!base) return null;
  return { sb, ...base };
});

/* الإعدادات التي تُرسل للمتصفح: بدون قواعد الحماية والتوثيق وقوالب الواتساب الداخلية */
export function publicCfg(cfg) {
  const { protection, verify, wa_templates, feed, ...rest } = cfg;
  return rest;
}

/* المنتج كما يراه العميل: بدون سعر التكلفة */
export function publicProduct(p) {
  if (!p) return null;
  return {
    id: String(p.id), title: p.title || '', description: p.description || '', price: Number(p.price) || 0,
    compare_price: p.compare_price ? Number(p.compare_price) : null, category_id: p.category_id ? String(p.category_id) : '',
    featured: !!p.featured, track_stock: p.track_stock !== false, stock_quantity: Number(p.stock_quantity) || 0,
    images: Array.isArray(p.images) ? p.images.filter(Boolean) : [], variants: Array.isArray(p.variants) ? p.variants : [],
    offers: Array.isArray(p.offers) ? p.offers : [], upsell: p.upsell && p.upsell.product_id ? p.upsell : null,
    cross_sell: Array.isArray(p.cross_sell) ? p.cross_sell.map(String) : [], sale_ends_at: p.sale_ends_at || null,
    sku: p.sku || '', created_at: p.created_at || null,
  };
}

async function rawGetProducts(sb, sid, { ids, limit = 60, order = 'sort_order', asc = true, category, q } = {}) {
  let query = sb.from('products').select('*').eq('store_id', sid).eq('status', 'active');
  if (ids) {
    if (!ids.length) return [];
    query = query.in('id', ids.map(String));
  }
  if (category) query = query.eq('category_id', String(category));
  if (q) query = query.ilike('title', `%${String(q).replace(/[%,]/g, ' ').slice(0, 60)}%`);
  if (order) query = query.order(order, { ascending: asc });
  const { data } = await query.limit(limit);
  const list = (data || []).map(publicProduct);
  if (list.length) {
    /* متوسط التقييمات المعتمدة لكل منتج (استعلام واحد لكل القائمة) */
    const { data: rv } = await sb.from('store_reviews').select('product_id, rating').eq('store_id', sid).eq('status', 'approved').in('product_id', list.map((x) => x.id)).limit(5000);
    const agg = {};
    (rv || []).forEach((r) => { const a = agg[r.product_id] || (agg[r.product_id] = { n: 0, s: 0 }); a.n += 1; a.s += Number(r.rating) || 0; });
    list.forEach((x) => { const a = agg[x.id]; x.rating_count = a ? a.n : 0; x.rating_avg = a ? Math.round((a.s / a.n) * 10) / 10 : 0; });
  }
  return list;
}

async function rawGetProduct(sb, sid, id) {
  if (!/^[0-9a-zA-Z-]{1,40}$/.test(String(id))) return null;
  const { data } = await sb.from('products').select('*').eq('store_id', sid).eq('id', String(id)).maybeSingle();
  if (!data || (data.status && data.status !== 'active')) return null;
  return publicProduct(data);
}

async function rawGetCategories(sb, sid) {
  const { data } = await sb.from('store_categories').select('id, name, image, sort_order, enabled').eq('store_id', sid).order('sort_order').limit(100);
  return (data || []).filter((c) => c.enabled !== false).map((c) => ({ id: String(c.id), name: c.name, image: c.image || '' }));
}

async function rawGetReviews(sb, sid, { productId, limit = 20 } = {}) {
  let q = sb.from('store_reviews').select('id, product_id, customer_name, rating, comment, created_at').eq('store_id', sid).eq('status', 'approved').order('created_at', { ascending: false });
  if (productId) q = q.eq('product_id', String(productId));
  const { data } = await q.limit(limit);
  return data || [];
}

async function rawGetRatingStats(sb, sid, productId) {
  const { data } = await sb.from('store_reviews').select('rating').eq('store_id', sid).eq('product_id', String(productId)).eq('status', 'approved').limit(1000);
  const list = data || [];
  const count = list.length;
  const avg = count ? list.reduce((a, r) => a + (Number(r.rating) || 0), 0) / count : 0;
  return { count, avg: Math.round(avg * 10) / 10 };
}

async function rawGetBlocks(sb, sid) {
  const { data } = await sb.from('store_blocks').select('id, name, kind, placement, content, sort_order, enabled').eq('store_id', sid).order('sort_order').limit(200);
  return (data || []).filter((b) => b.enabled !== false);
}

async function rawGetPages(sb, sid) {
  const { data } = await sb.from('store_pages').select('id, title, slug, content, in_footer, sort_order, enabled').eq('store_id', sid).order('sort_order').limit(50);
  return (data || []).filter((p) => p.enabled !== false);
}

async function rawGetPixels(sb, sid) {
  const { data } = await sb.from('store_pixels').select('platform, pixel_id, events, enabled').eq('store_id', sid).limit(30);
  return (data || []).filter((p) => p.enabled !== false).map((p) => ({ platform: p.platform, pixel_id: p.pixel_id, events: p.events || {} }));
}

async function rawGetZonesPublic(sb, sid) {
  const { data } = await sb.from('store_shipping_zones').select('governorate, price, eta, enabled').eq('store_id', sid).order('governorate');
  return (data || []).filter((z) => z.enabled !== false).map((z) => ({ governorate: z.governorate, price: Number(z.price) || 0, eta: z.eta || '' }));
}

/* الأكثر مبيعاً: من الطلبات الفعلية (غير الملغي) في آخر 500 طلب */
async function rawGetBestsellerIds(sb, sid, limit = 12) {
  const { data } = await sb.from('orders').select('items, status').eq('store_id', sid).neq('status', 'cancelled').order('created_at', { ascending: false }).limit(500);
  const tally = {};
  (data || []).forEach((o) => (Array.isArray(o.items) ? o.items : []).forEach((i) => {
    if (i.bump) return;
    const k = String(i.product_id);
    tally[k] = (tally[k] || 0) + (Number(i.qty) || 1);
  }));
  return Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([id]) => id);
}

async function rawGetFunnel(sb, sid, slug) {
  const { data } = await sb.from('store_funnels').select('*').eq('store_id', sid).eq('slug', String(slug)).maybeSingle();
  if (!data || data.enabled === false) return null;
  return data;
}

/* ترتيب منتجات حسب قائمة معرّفات */
export const orderByIds = (list, ids) => {
  const m = new Map(list.map((p) => [p.id, p]));
  return ids.map((id) => m.get(String(id))).filter(Boolean);
};

/* لون نص مقروء فوق لون العلامة */
export function onColor(hex) {
  const m = String(hex || '').replace('#', '');
  const full = m.length === 3 ? m.split('').map((c) => c + c).join('') : m;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return '#ffffff';
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return L > 0.45 ? '#111111' : '#ffffff';
}

/* ===== نسخ مخزّنة مؤقتاً (كاش قصير) — الطلبات والتحقق من المخزون في الـ API لا تمر من هنا ===== */
const opt = (o) => JSON.stringify(o || {});
export const getProducts = (sb, sid, o) => ttl(`prods:${sid}:${opt(o)}`, 30_000, () => rawGetProducts(sb, sid, o));
export const getProduct = (sb, sid, id) => ttl(`prod:${sid}:${id}`, 30_000, () => rawGetProduct(sb, sid, id));
export const getCategories = (sb, sid) => ttl(`cats:${sid}`, 60_000, () => rawGetCategories(sb, sid));
export const getReviews = (sb, sid, o) => ttl(`revs:${sid}:${opt(o)}`, 60_000, () => rawGetReviews(sb, sid, o));
export const getRatingStats = (sb, sid, pid) => ttl(`rate:${sid}:${pid}`, 60_000, () => rawGetRatingStats(sb, sid, pid));
export const getBlocks = (sb, sid) => ttl(`blocks:${sid}`, 60_000, () => rawGetBlocks(sb, sid));
export const getPages = (sb, sid) => ttl(`pages:${sid}`, 60_000, () => rawGetPages(sb, sid));
export const getPixels = (sb, sid) => ttl(`pixels:${sid}`, 60_000, () => rawGetPixels(sb, sid));
export const getZonesPublic = (sb, sid) => ttl(`zones:${sid}`, 60_000, () => rawGetZonesPublic(sb, sid));
export const getBestsellerIds = (sb, sid, limit = 12) => ttl(`best:${sid}:${limit}`, 120_000, () => rawGetBestsellerIds(sb, sid, limit));
export const getFunnel = (sb, sid, slug) => ttl(`funnel:${sid}:${slug}`, 30_000, () => rawGetFunnel(sb, sid, slug));
