import { NextResponse } from 'next/server';
import { adminClient } from '../../../../lib/supabaseAdmin';
import { getStoreBySlug, storeKey, getConfig, takeStockForLines, restoreStockForLines, rateLimit, clientIp } from '../../../../lib/storeServer';
import { getFlow } from '../../../../lib/storeData';
import { effectivePrice } from '../../../../lib/storeKit';
import { OFFER_TYPES } from '../../../../lib/flowKit';
import { sendCapiPurchase } from '../../../../lib/capi';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const fail = (error, status = 400, reason = '') => NextResponse.json({ ok: false, error, reason }, { status });
const r2 = (n) => Math.round(n * 100) / 100;

/* قبول عرض Upsell/Downsell بضغطة واحدة: بيتضاف لنفس الطلب (بنفس بيانات العميل) بسعر العرض المحسوب هنا من السيرفر */
export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return fail('بيانات غير صالحة'); }
  const ip = clientIp(req);
  if (!rateLimit(`upsell:${ip}`, 12, 60_000)) return fail('محاولات كثيرة، حاول بعد دقيقة', 429);

  const token = String(body.token || '');
  if (!/^[0-9a-f]{32}$/.test(token)) return fail('الطلب غير موجود', 404, 'not_found');

  let sb;
  try { sb = adminClient(); } catch { return fail('المتجر غير مهيأ بعد', 500); }
  const store = await getStoreBySlug(sb, body.slug);
  if (!store || !store.live) return fail('المتجر غير متاح', 404);
  const sid = storeKey(store);

  const flow = await getFlow(sb, sid, body.flow);
  const step = flow?.steps.find((s) => s.id === body.step);
  if (!flow || !step || !OFFER_TYPES.includes(step.type)) return fail('العرض غير متاح', 404);

  const { data: p } = await sb.from('products').select('*').eq('store_id', sid).eq('id', String(step.product_id)).maybeSingle();
  if (!p || (p.status && p.status !== 'active')) return fail('المنتج غير متاح حالياً', 400, 'product');
  if (Array.isArray(p.variants) && p.variants.length) return fail('المنتج له خيارات ولا يصلح لعرض بضغطة واحدة', 400, 'product');

  const qty = step.qty;
  const tracked = p.track_stock !== false;
  if (tracked && (Number(p.stock_quantity) || 0) < qty) return fail('نفدت الكمية للتو', 400, 'stock');

  const unit = effectivePrice(p);
  const lineTotal = r2(unit * qty * (1 - step.percent / 100));
  const unitCost = Number(p.cost_price) || 0;
  const line = { product_id: String(p.id), title: p.title, track: tracked, qty };
  const item = {
    product_id: String(p.id), title: p.title, image: Array.isArray(p.images) ? p.images[0] || '' : '', price: unit, qty, options: {},
    line_total: lineTotal, offer: step.percent ? `عرض خاص ${step.percent}%` : '', bump: false, upsell: true, unit_cost: unitCost, flow_step: step.id,
  };

  const stock = await takeStockForLines(sb, [line]);
  if (!stock.ok) return fail('نفدت الكمية للتو', 400, 'stock');

  const cfg = await getConfig(sb, sid);
  const { data: res, error } = await sb.rpc('append_order_item', {
    p_store: String(sid), p_token: token, p_step: step.id, p_item: item, p_add: lineTotal, p_cost: r2(unitCost * qty), p_free_over: Number(cfg.shipping?.free_over) || 0,
  });
  if (error || !res || !res.ok || res.already) {
    await restoreStockForLines(sb, [line]);
    if (res?.already) return NextResponse.json({ ok: true, already: true, order_no: res.order_no, total: res.total });
    const reason = res?.reason || 'error';
    const msg = reason === 'not_found' ? 'الطلب غير موجود' : (reason === 'status' || reason === 'expired') ? 'انتهت مهلة إضافة منتجات لطلبك' : 'تعذر إضافة العرض، حاول مرة أخرى';
    if (error) console.error('UPSELL_RPC_ERROR', error.message);
    return fail(msg, reason === 'error' ? 500 : 400, reason);
  }

  const eventId = `order-${res.order_no}-${step.id}`;
  await sb.rpc('bump_flow_step', { p_store: String(sid), p_flow: flow.id, p_step: step.id, p_view: 0, p_pass: 1, p_decline: 0, p_revenue: lineTotal });
  try {
    const { data: o } = await sb.from('orders').select('customer_name, customer_phone').eq('store_id', sid).eq('public_token', token).maybeSingle();
    if (o) await sendCapiPurchase(sb, sid, { order: { ...o, total_price: lineTotal, items: [item] }, ip, ua: req.headers.get('user-agent') || '', url: `${new URL(req.url).origin}/shop/${store.store_slug}/thank-you`, eventId });
  } catch { /* لا نوقف الإضافة */ }

  return NextResponse.json({ ok: true, order_no: res.order_no, total: res.total, added: lineTotal, event_id: eventId, item: { id: item.product_id, title: item.title, price: unit, qty, line_total: lineTotal } });
}
