import { NextResponse } from 'next/server';
import { adminClient } from '../../../../lib/supabaseAdmin';
import { getStoreFast, storeKey, rateLimit, clientIp } from '../../../../lib/storeServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EVENTS = { visit: [1, 0, 0, 0], cart: [0, 1, 0, 0], checkout: [0, 0, 1, 0], cross: [0, 0, 0, 1], pview: [0, 0, 0, 0] };
const PE = { pview: [1, 0, 0], cart: [0, 1, 0], checkout: [0, 0, 1] };
const PID = /^[A-Za-z0-9_-]{1,64}$/;

/* عدّادات الزيارات والسلة وبدء الطلب والكروس سيل + إحصائيات كل منتج.
   بيقبل حدث واحد {event,...} أو مجموعة {events:[...]} (أقصى 6) في طلب واحد لتقليل الضغط على القاعدة */
export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  const list = (Array.isArray(body.events) ? body.events : [body]).slice(0, 6).filter((x) => x && EVENTS[x.event || 'visit']);
  if (!list.length) return NextResponse.json({ ok: false }, { status: 400 });
  if (!rateLimit(`hit:${clientIp(req)}`, 120, 60_000)) return NextResponse.json({ ok: false }, { status: 429 });
  let sb;
  try { sb = adminClient(); } catch { return NextResponse.json({ ok: false }, { status: 500 }); }
  const store = await getStoreFast(sb, body.slug);
  if (!store) return NextResponse.json({ ok: false }, { status: 404 });
  if (!store.live) return NextResponse.json({ ok: true, skipped: true });
  const sid = storeKey(store);

  /* جمع كل الأحداث في نداء واحد لعدّاد المتجر */
  const tot = [0, 0, 0, 0];
  const prod = new Map();
  const jobs = [];
  for (const ev of list) {
    const name = ev.event || 'visit';
    EVENTS[name].forEach((v, i) => { tot[i] += v; });
    const pe = PE[name];
    if (pe) {
      const ids = (Array.isArray(ev.products) ? ev.products : [ev.product]).filter((x) => PID.test(String(x || ''))).slice(0, 10);
      for (const id of ids) {
        const c = prod.get(String(id)) || [0, 0, 0];
        pe.forEach((v, i) => { c[i] += v; });
        prod.set(String(id), c);
      }
    }
    if (name === 'visit' && ev.ref && /^[A-Za-z0-9_-]{2,40}$/.test(String(ev.ref))) jobs.push(sb.rpc('bump_referral', { p_store: sid, p_code: String(ev.ref) }));
    if (name === 'visit' && ev.funnel && /^[a-z0-9-]{1,60}$/.test(String(ev.funnel))) jobs.push(sb.rpc('bump_funnel', { p_store: sid, p_slug: String(ev.funnel) }));
  }
  if (tot.some(Boolean)) jobs.push(sb.rpc('bump_store_stat', { p_store: sid, p_visits: tot[0], p_carts: tot[1], p_checkouts: tot[2], p_cross: tot[3] }));
  for (const [pid, c] of prod) {
    jobs.push(sb.rpc('bump_product_stat', { p_store: sid, p_product: pid, p_views: c[0], p_carts: c[1], p_checkouts: c[2], p_purchases: 0, p_units: 0, p_revenue: 0 })
      .then(({ error }) => { if (error) console.error('PRODUCT_STAT_ERROR', error.message); }));
  }
  await Promise.all(jobs);
  return NextResponse.json({ ok: true });
}
