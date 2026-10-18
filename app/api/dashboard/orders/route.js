import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminClient, userFromRequest, isAdminUser } from '../../../../lib/supabaseAdmin';
import { getConfig, priceCart, takeStockForLines, restoreStockForLines, orderRowItems } from '../../../../lib/storeServer';
import { STATUS, normalizePhone, isValidEgPhone } from '../../../../lib/storeKit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEAD = ['cancelled', 'returned'];
const bad = (error, status = 400) => NextResponse.json({ ok: false, error }, { status });

export async function POST(req) {
  let sb;
  try { sb = adminClient(); } catch { return bad('السيرفر غير مهيأ', 500); }
  const user = await userFromRequest(req, sb);
  if (!user) return bad('غير مصرح', 401);

  let body;
  try { body = await req.json(); } catch { return bad('بيانات غير صالحة'); }
  const admin = isAdminUser(user);

  if (body.action === 'status') {
    const status = String(body.status || '');
    if (!STATUS[status]) return bad('حالة غير صحيحة');
    const ids = (Array.isArray(body.ids) ? body.ids : []).slice(0, 200);
    if (!ids.length) return bad('لا توجد طلبات');

    const { data: orders } = await sb.from('orders').select('id, store_id, status, items').in('id', ids);
    const productIds = new Set();
    (orders || []).forEach((o) => (Array.isArray(o.items) ? o.items : []).forEach((i) => productIds.add(String(i.product_id))));
    const trackedSet = new Set();
    if (productIds.size) {
      const { data: prods } = await sb.from('products').select('id, track_stock').in('id', [...productIds]);
      (prods || []).forEach((p) => { if (p.track_stock !== false) trackedSet.add(String(p.id)); });
    }

    const results = [];
    for (const o of orders || []) {
      if (!(admin || String(o.store_id) === user.id)) { results.push({ id: o.id, ok: false, error: 'غير مصرح' }); continue; }
      const prev = o.status || 'pending';
      if (prev === status) { results.push({ id: o.id, ok: true }); continue; }
      const lines = (Array.isArray(o.items) ? o.items : []).map((i) => ({
        product_id: String(i.product_id), qty: Number(i.qty) || 1, title: i.title, track: trackedSet.has(String(i.product_id)),
      }));
      if (!DEAD.includes(prev) && DEAD.includes(status)) {
        await restoreStockForLines(sb, lines);
      } else if (DEAD.includes(prev) && !DEAD.includes(status)) {
        const t = await takeStockForLines(sb, lines);
        if (!t.ok) { results.push({ id: o.id, ok: false, error: `المخزون غير كافٍ لـ «${t.failed}»` }); continue; }
      }
      const { error } = await sb.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', o.id);
      results.push({ id: o.id, ok: !error, error: error?.message });
    }
    return NextResponse.json({ ok: results.some((r) => r.ok), results });
  }

  if (body.action === 'create') {
    const sid = admin && body.store_id ? String(body.store_id) : user.id;
    const { data: store } = await sb.from('store_profiles').select('*').eq('user_id', sid).maybeSingle();
    if (!store) return bad('المتجر غير موجود');
    const cfg = await getConfig(sb, sid);

    const c = body.customer || {};
    const name = String(c.name || '').trim().slice(0, 120);
    const phone = normalizePhone(c.phone);
    const governorate = String(c.governorate || '').trim();
    const address = String(c.address || '').trim().slice(0, 400);
    if (name.length < 2) return bad('اكتب اسم العميل');
    if (!isValidEgPhone(phone)) return bad('رقم الموبايل غير صحيح');
    if (!governorate) return bad('اختر المحافظة');
    if (address.length < 4) return bad('اكتب العنوان');

    const priced = await priceCart(sb, store, cfg, { items: body.items, governorate, coupon: body.coupon });
    if (priced.errors?.length) return bad(priced.errors[0]);
    const stock = await takeStockForLines(sb, priced.lines);
    if (!stock.ok) return bad(`نفدت كمية «${stock.failed}»`);

    const row = {
      store_id: sid, customer_name: name, customer_phone: phone, governorate, address,
      notes: String(c.notes || '').slice(0, 500) || null,
      items: orderRowItems(priced.lines),
      subtotal: priced.subtotal, discount: priced.discount, shipping_cost: priced.shipping, cod_fee: priced.codFee, total_price: priced.total, cost_total: priced.cost,
      coupon_code: priced.coupon?.code || null, status: 'confirmed', source: 'manual', public_token: crypto.randomBytes(16).toString('hex'),
    };
    const { data: created, error } = await sb.from('orders').insert([row]).select('id, order_no').single();
    if (error) {
      for (const l of stock.taken) await sb.rpc('take_stock', { p_product: l.product_id, p_qty: -l.qty });
      return bad('تعذر حفظ الطلب', 500);
    }
    if (priced.coupon?.code) await sb.rpc('claim_coupon', { p_store: sid, p_code: priced.coupon.code });
    return NextResponse.json({ ok: true, order_no: created.order_no, id: created.id, total: priced.total });
  }

  return bad('إجراء غير معروف');
}
