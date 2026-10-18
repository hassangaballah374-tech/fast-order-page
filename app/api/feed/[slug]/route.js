import { NextResponse } from 'next/server';
import { adminClient } from '../../../../lib/supabaseAdmin';
import { getStoreBySlug, storeKey, getConfig } from '../../../../lib/storeServer';
import { effectivePrice, saleActive } from '../../../../lib/storeKit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const xml = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
const csv = (s) => { const v = String(s ?? ''); return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v; };
const fmt = (n) => `${(Math.round((Number(n) || 0) * 100) / 100).toFixed(2)} EGP`;

/* خلاصة المنتجات لـ Google Merchant / Meta Catalog / TikTok: ?format=google (افتراضي) أو csv */
export async function GET(req, { params }) {
  let sb;
  try { sb = adminClient(); } catch { return new NextResponse('not configured', { status: 500 }); }
  const store = await getStoreBySlug(sb, params.slug);
  if (!store) return new NextResponse('store not found', { status: 404 });
  const sid = storeKey(store);
  const cfg = await getConfig(sb, sid);
  const url = new URL(req.url);
  const format = url.searchParams.get('format') === 'csv' ? 'csv' : 'google';
  const origin = url.origin;

  const { data } = await sb.from('products').select('*').eq('store_id', sid).eq('status', 'active').order('sort_order').limit(5000);
  const list = (data || []).filter((p) => Array.isArray(p.images) && p.images[0]);

  const brand = cfg.feed.brand || store.store_name || 'SPIKE';
  const rows = list.map((p) => {
    const tracked = p.track_stock !== false;
    const inStock = !tracked || (Number(p.stock_quantity) || 0) > 0;
    const sale = saleActive(p);
    const current = effectivePrice(p);
    const regular = sale ? Number(p.compare_price) : current;
    return { p, inStock, sale, current, regular, link: `${origin}/shop/${store.store_slug}/p/${p.id}` };
  }).filter((r) => r.inStock || cfg.feed.include_out_of_stock);

  if (format === 'csv') {
    const head = 'id,title,description,availability,condition,price,sale_price,link,image_link,brand';
    const body = rows.map((r) => [
      r.p.id, r.p.title, (r.p.description || r.p.title).slice(0, 4900), r.inStock ? 'in stock' : 'out of stock', cfg.feed.condition,
      fmt(r.regular), r.sale ? fmt(r.current) : '', r.link, r.p.images[0], brand,
    ].map(csv).join(',')).join('\n');
    return new NextResponse(`${head}\n${body}`, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Cache-Control': 'public, s-maxage=300' } });
  }

  const items = rows.map((r) => `    <item>
      <g:id>${xml(r.p.id)}</g:id>
      <g:title>${xml(String(r.p.title).slice(0, 150))}</g:title>
      <g:description>${xml((r.p.description || r.p.title).slice(0, 4900))}</g:description>
      <g:link>${xml(r.link)}</g:link>
      <g:image_link>${xml(r.p.images[0])}</g:image_link>
${r.p.images.slice(1, 6).map((u) => `      <g:additional_image_link>${xml(u)}</g:additional_image_link>`).join('\n')}
      <g:availability>${r.inStock ? 'in_stock' : 'out_of_stock'}</g:availability>
      <g:price>${xml(fmt(r.regular))}</g:price>
${r.sale ? `      <g:sale_price>${xml(fmt(r.current))}</g:sale_price>\n` : ''}      <g:brand>${xml(brand)}</g:brand>
      <g:condition>${xml(cfg.feed.condition)}</g:condition>
${cfg.feed.google_category ? `      <g:google_product_category>${xml(cfg.feed.google_category)}</g:google_product_category>\n` : ''}      <g:identifier_exists>no</g:identifier_exists>
    </item>`).join('\n');

  const out = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${xml(store.store_name || 'SPIKE')}</title>
    <link>${xml(`${origin}/shop/${store.store_slug}`)}</link>
    <description>${xml(store.store_name || 'SPIKE')}</description>
${items}
  </channel>
</rss>`;
  return new NextResponse(out, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, s-maxage=300' } });
}
