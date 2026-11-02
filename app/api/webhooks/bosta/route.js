// app/api/webhooks/bosta/route.js
// يستقبل تحديثات حالة الشحنة من بوسطة ويحدّث حالة الطلب تلقائياً:
//   تم التسليم (45)  → delivered
//   رجعت للتاجر (46) → returned  (ويرجّع المخزون)
// الرابط بيتعمل لكل متجر من «التطبيقات ← بوسطة» وفيه معرّف المتجر + مفتاح سري.
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminClient } from '../../../../lib/supabaseAdmin';
import { restoreStockForLines, takeStockForLines, rateLimit } from '../../../../lib/storeServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEAD = ['cancelled', 'returned'];
const ok = (extra = {}) => NextResponse.json({ ok: true, ...extra });

function same(a, b) {
  const x = Buffer.from(String(a || '')), y = Buffer.from(String(b || ''));
  return x.length === y.length && x.length > 0 && crypto.timingSafeEqual(x, y);
}

// بوسطة ممكن تبعت state كرقم أو ككائن {code, value}
function readState(body) {
  const s = body?.state ?? body?.data?.state;
  const code = Number(typeof s === 'object' && s !== null ? s.code : s);
  const name = String((typeof s === 'object' && s !== null ? s.value : body?.stateValue || body?.state_value) || '').toLowerCase();
  if (code === 45 || name === 'delivered') return 'delivered';
  if (code === 46 || name === 'returned to business') return 'returned';
  return '';
}

export async function GET() { return ok({ service: 'spike-bosta-webhook' }); }

export async function POST(req) {
  let sb;
  try { sb = adminClient(); } catch { return NextResponse.json({ ok: false, error: 'server' }, { status: 500 }); }

  const url = new URL(req.url);
  const sid = String(url.searchParams.get('s') || '');
  const key = String(url.searchParams.get('k') || '');
  if (!sid || !key) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  if (!rateLimit(`bosta:${sid}`, 600, 60_000)) return NextResponse.json({ ok: false, error: 'rate' }, { status: 429 });

  const { data: integ } = await sb.from('store_integrations').select('enabled, config').eq('store_id', sid).eq('provider', 'bosta').maybeSingle();
  if (!integ?.enabled || !same(integ?.config?.webhook_secret, key)) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  let body;
  try { body = await req.json(); } catch { return ok({ ignored: 'bad body' }); }

  const target = readState(body);
  const tracking = String(body?.trackingNumber || body?.tracking_number || body?.data?.trackingNumber || '').trim();
  const ref = String(body?.businessReference || body?.business_reference || '').trim();
  if (!target || (!tracking && !ref)) return ok({ ignored: 'not tracked' });

  let q = sb.from('orders').select('id, store_id, status, items, tracking_number').eq('store_id', sid);
  q = tracking ? q.eq('tracking_number', tracking) : /^\d+$/.test(ref) ? q.eq('order_no', Number(ref)) : q.eq('id', ref);
  const { data: o } = await q.limit(1).maybeSingle();
  if (!o) return ok({ ignored: 'order not found' });

  const prev = o.status || 'pending';
  if (prev === target) return ok({ same: true });
  // التسليم ما يغيّرش طلب ملغي أو مرتجع. المرتجع مسموح بعد التسليم.
  if (target === 'delivered' && DEAD.includes(prev)) return ok({ ignored: `already ${prev}` });

  const items = Array.isArray(o.items) ? o.items : [];
  const ids = [...new Set(items.map((i) => String(i.product_id)))];
  const tracked = new Set();
  if (ids.length) {
    const { data: prods } = await sb.from('products').select('id, track_stock').in('id', ids);
    (prods || []).forEach((p) => { if (p.track_stock !== false) tracked.add(String(p.id)); });
  }
  const lines = items.map((i) => ({ product_id: String(i.product_id), qty: Number(i.qty) || 1, title: i.title, track: tracked.has(String(i.product_id)) }));

  if (!DEAD.includes(prev) && target === 'returned') await restoreStockForLines(sb, lines);
  if (DEAD.includes(prev) && !DEAD.includes(target)) { const t = await takeStockForLines(sb, lines); if (!t.ok) return ok({ ignored: 'stock' }); }

  const { error } = await sb.from('orders').update({ status: target, updated_at: new Date().toISOString() }).eq('id', o.id);
  if (error) return NextResponse.json({ ok: false, error: 'db' }, { status: 500 });
  return ok({ id: o.id, status: target });
}
