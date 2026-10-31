import { NextResponse } from 'next/server';
import { adminClient } from '../../../../lib/supabaseAdmin';
import { getStoreBySlug, storeKey, rateLimit, clientIp } from '../../../../lib/storeServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EVENTS = { visit: [1, 0, 0, 0], cart: [0, 1, 0, 0], checkout: [0, 0, 1, 0], cross: [0, 0, 0, 1], pview: [0, 0, 0, 0] };

/* عدّادات الزيارات والسلة وبدء الطلب والكروس سيل (لحساب نسب التحويل في لوحة التاجر) */
export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  if (!rateLimit(`hit:${clientIp(req)}`, 120, 60_000)) return NextResponse.json({ ok: false }, { status: 429 });
  const e = EVENTS[body.event || 'visit'];
  if (!e) return NextResponse.json({ ok: false }, { status: 400 });
  let sb;
  try { sb = adminClient(); } catch { return NextResponse.json({ ok: false }, { status: 500 }); }
  const store = await getStoreBySlug(sb, body.slug);
  if (!store) return NextResponse.json({ ok: false }, { status: 404 });
  if (!store.live) return NextResponse.json({ ok: true, skipped: true });
  const sid = storeKey(store);
  if (body.event !== 'pview') await sb.rpc('bump_store_stat', { p_store: sid, p_visits: e[0], p_carts: e[1], p_checkouts: e[2], p_cross: e[3] });
  /* إحصائيات كل منتج على حدة */
  const pids = (Array.isArray(body.products) ? body.products : [body.product]).filter((x) => /^[A-Za-z0-9_-]{1,64}$/.test(String(x || ''))).slice(0, 10);
  const pe = { pview: [1, 0, 0], cart: [0, 1, 0], checkout: [0, 0, 1] }[body.event];
  if (pe) for (const pid of pids) await sb.rpc('bump_product_stat', { p_store: sid, p_product: String(pid), p_views: pe[0], p_carts: pe[1], p_checkouts: pe[2], p_purchases: 0, p_units: 0, p_revenue: 0 });
  if (body.event === 'visit' && body.ref && /^[A-Za-z0-9_-]{2,40}$/.test(String(body.ref))) {
    await sb.rpc('bump_referral', { p_store: sid, p_code: String(body.ref) });
  }
  if (body.event === 'visit' && body.funnel && /^[a-z0-9-]{1,60}$/.test(String(body.funnel))) {
    await sb.rpc('bump_funnel', { p_store: sid, p_slug: String(body.funnel) });
  }
  return NextResponse.json({ ok: true });
}
