import { NextResponse } from 'next/server';
import { adminClient } from '../../../../lib/supabaseAdmin';
import { getStoreBySlug, storeKey, getConfig, rateLimit, clientIp } from '../../../../lib/storeServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* بيانات النافذة الاجتماعية (Sales Popup): آخر طلبات حقيقية فقط، بالاسم الأول والمحافظة بدون أي رقم أو عنوان */
export async function GET(req) {
  if (!rateLimit(`popup:${clientIp(req)}`, 30, 60_000)) return NextResponse.json({ ok: false }, { status: 429 });
  const slug = new URL(req.url).searchParams.get('slug');
  let sb;
  try { sb = adminClient(); } catch { return NextResponse.json({ ok: false }, { status: 500 }); }
  const store = await getStoreBySlug(sb, slug);
  if (!store) return NextResponse.json({ ok: false }, { status: 404 });
  const sid = storeKey(store);
  const cfg = await getConfig(sb, sid);
  if (!cfg.popup.enabled) return NextResponse.json({ ok: true, items: [] });

  const since = new Date(Date.now() - 3 * 86400 * 1000).toISOString();
  const { data } = await sb.from('orders').select('customer_name, governorate, items, created_at, status')
    .eq('store_id', sid).neq('status', 'cancelled').gte('created_at', since).order('created_at', { ascending: false }).limit(12);

  const items = (data || []).map((o) => {
    const first = (Array.isArray(o.items) ? o.items : []).find((i) => !i.bump) || (o.items || [])[0];
    return {
      name: String(o.customer_name || '').trim().split(/\s+/)[0] || 'عميل',
      gov: o.governorate || '',
      product: first?.title || '',
      at: o.created_at,
    };
  }).filter((x) => x.product);

  return NextResponse.json({ ok: true, items }, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' } });
}
