import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminClient } from '../../../../lib/supabaseAdmin';
import { getStoreBySlug, storeKey, getConfig, priceCart, takeStockForLines, orderRowItems, rateLimit, clientIp } from '../../../../lib/storeServer';
import { normalizePhone, isValidEgPhone } from '../../../../lib/storeKit';
import { sendCapiPurchase } from '../../../../lib/capi';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const fail = (error, status = 400) => NextResponse.json({ ok: false, error }, { status });

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return fail('بيانات غير صالحة'); }

  const ip = clientIp(req);
  if (!rateLimit(`order:${ip}`, 8, 60_000)) return fail('محاولات كثيرة، حاول بعد دقيقة', 429);

  let sb;
  try { sb = adminClient(); } catch { return fail('المتجر غير مهيأ بعد', 500); }

  const store = await getStoreBySlug(sb, body.slug);
  if (!store) return fail('المتجر غير متاح', 404);
  const sid = storeKey(store);
  const cfg = await getConfig(sb, sid);
  const prot = cfg.protection;

  const c = body.customer || {};
  const name = String(c.name || '').trim().slice(0, 120);
  const phone = normalizePhone(c.phone);
  const governorate = String(c.governorate || '').trim();
  const address = [String(c.address || '').trim(), cfg.checkout.address2 ? String(c.address2 || '').trim() : ''].filter(Boolean).join(' - ').slice(0, 400);
  const notes = String(c.notes || '').trim().slice(0, 500);
  const phone2 = cfg.checkout.phone2 && c.phone2 ? normalizePhone(c.phone2) : '';
  const email = cfg.checkout.email ? String(c.email || '').trim().slice(0, 120) : '';

  if (body.hp) return NextResponse.json({ ok: true, order_no: 0, token: '', total: 0 });

  if (name.length < 2) return fail('اكتب اسمك بالكامل');
  if (prot.validate_phone && !isValidEgPhone(phone)) return fail('رقم الموبايل غير صحيح (مثال: 01012345678)');
  if (!governorate) return fail('اختر المحافظة');
  if (address.length < 6) return fail('اكتب العنوان بالتفصيل');

  const { data: blocked } = await sb.from('store_blocklist').select('id').eq('store_id', sid).eq('phone', phone).eq('kind', 'order').maybeSingle();
  if (blocked) return fail('تعذر إتمام الطلب حالياً. تواصل معنا عبر واتساب.', 403);

  const priced = await priceCart(sb, store, cfg, { items: body.items, bump: body.bump, governorate, coupon: body.coupon });
  if (priced.errors?.length) return fail(priced.errors[0]);

  const since = (h) => new Date(Date.now() - h * 3600 * 1000).toISOString();
  const { data: recent } = await sb.from('orders')
    .select('id, status, items, public_token, order_no, created_at')
    .eq('store_id', sid).eq('customer_phone', phone)
    .gte('created_at', since(Math.max(24, Number(prot.block_duplicate_hours) || 12)))
    .order('created_at', { ascending: false }).limit(30);

  const recentList = recent || [];
  const dupHours = Number(prot.block_duplicate_hours) || 0;
  const myIds = priced.lines.map((l) => l.product_id).sort().join(',');
  if (dupHours > 0) {
    const dup = recentList.find((o) => o.status !== 'cancelled' && new Date(o.created_at) > new Date(since(dupHours))
      && (Array.isArray(o.items) ? o.items.map((i) => String(i.product_id)).sort().join(',') : '') === myIds);
    if (dup) return NextResponse.json({ ok: true, duplicate: true, order_no: dup.order_no, token: dup.public_token, total: priced.total, event_id: `order-${dup.order_no}` });
  }

  const todayCount = recentList.filter((o) => new Date(o.created_at) > new Date(since(24))).length;
  const maxDay = Number(prot.max_orders_per_phone_day) || 0;
  if (maxDay > 0 && todayCount >= maxDay) return fail('وصلت للحد الأقصى من الطلبات اليوم. تواصل معنا عبر واتساب.', 429);

  let risk = 0;
  const flags = [];
  const fillMs = Number(body.t) || 0;
  if (fillMs > 0 && fillMs < (Number(prot.min_fill_seconds) || 0) * 1000) { risk += 30; flags.push('fast_submit'); }
  if (Number(prot.flag_high_value) > 0 && priced.total >= Number(prot.flag_high_value)) { risk += 20; flags.push('high_value'); }
  if (name.length < 4 || /\d/.test(name)) { risk += 15; flags.push('weird_name'); }
  if (address.length < 12) { risk += 15; flags.push('short_address'); }
  if (todayCount >= 1) { risk += 15; flags.push('repeat_today'); }
  const { data: history } = await sb.from('orders').select('status').eq('store_id', sid).eq('customer_phone', phone).in('status', ['returned', 'cancelled']).limit(5);
  if ((history || []).length >= 2) { risk += 40; flags.push('returns_history'); }
  const { data: otpHit } = await sb.from('store_blocklist').select('id').eq('store_id', sid).eq('phone', phone).eq('kind', 'otp').maybeSingle();
  if (otpHit) { risk += 40; flags.push('otp_blocked'); }
  risk = Math.min(100, risk);
  if ((cfg.verify.flag_risk && risk >= (Number(cfg.verify.threshold) || 40)) || otpHit) flags.push('needs_verify');

  const stock = await takeStockForLines(sb, priced.lines);
  if (!stock.ok) return fail(`نفدت كمية «${stock.failed}» للتو`);

  const token = crypto.randomBytes(16).toString('hex');
  const utm = body.utm && typeof body.utm === 'object' ? body.utm : {};
  const safeUtm = {};
  for (const k of ['source', 'medium', 'campaign', 'content', 'ref']) if (utm[k]) safeUtm[k] = String(utm[k]).slice(0, 80);

  const row = {
    store_id: sid, customer_name: name, customer_phone: phone, phone2: phone2 || null, email: email || null,
    governorate, address, notes: notes || null,
    items: orderRowItems(priced.lines),
    subtotal: priced.subtotal, discount: priced.discount, shipping_cost: priced.shipping, cod_fee: priced.codFee, total_price: priced.total, cost_total: priced.cost,
    coupon_code: priced.coupon?.code || null, utm: safeUtm, risk_score: risk, flags, status: 'pending', source: 'storefront', public_token: token,
  };

  const { data: created, error } = await sb.from('orders').insert([row]).select('order_no, public_token').single();
  if (error) {
    for (const l of stock.taken) await sb.rpc('take_stock', { p_product: l.product_id, p_qty: -l.qty });
    return fail('تعذر تسجيل الطلب، حاول مرة أخرى', 500);
  }

  if (priced.coupon?.code) await sb.rpc('claim_coupon', { p_store: sid, p_code: priced.coupon.code });
  await sb.from('abandoned_carts').update({ recovered: true, updated_at: new Date().toISOString() }).eq('store_id', sid).eq('phone', phone);
  await sb.rpc('bump_store_stat', { p_store: sid, p_visits: 0, p_carts: 0, p_checkouts: 0, p_cross: priced.lines.some((l) => l.bump) ? 1 : 0 });

  const eventId = `order-${created.order_no}`;
  try {
    await sendCapiPurchase(sb, sid, {
      order: { ...row },
      ip, ua: req.headers.get('user-agent') || '',
      url: `${new URL(req.url).origin}/shop/${store.store_slug}/thank-you`,
      eventId,
    });
  } catch { /* لا نوقف الطلب */ }

  return NextResponse.json({ ok: true, order_no: created.order_no, token: created.public_token, total: priced.total, event_id: eventId });
}
