import { NextResponse } from 'next/server';
import { adminClient } from '../../../../lib/supabaseAdmin';
import { getStoreBySlug, storeKey, rateLimit, clientIp } from '../../../../lib/storeServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EVENTS = { visit: [1, 0, 0, 0], cart: [0, 1, 0, 0], checkout: [0, 0, 1, 0], cross: [0, 0, 0, 1] };

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
  const sid = storeKey(store);
  await sb.rpc('bump_store_stat', { p_store: sid, p_visits: e[0], p_carts: e[1], p_checkouts: e[2], p_cross: e[3] });
  if (body.event === 'visit' && body.ref && /^[A-Za-z0-9_-]{2,40}$/.test(String(body.ref))) {
    await sb.rpc('bump_referral', { p_store: sid, p_code: String(body.ref) });
  }
  if (body.event === 'visit' && body.funnel && /^[a-z0-9-]{1,60}$/.test(String(body.funnel))) {
    await sb.rpc('bump_funnel', { p_store: sid, p_slug: String(body.funnel) });
  }
  return NextResponse.json({ ok: true });
}
