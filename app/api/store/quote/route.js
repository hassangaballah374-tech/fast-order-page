import { NextResponse } from 'next/server';
import { adminClient } from '../../../../lib/supabaseAdmin';
import { getStoreBySlug, getConfig, storeKey, priceCart, rateLimit, clientIp } from '../../../../lib/storeServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* معاينة السعر النهائي (منتجات + عرض + كوبون + شحن + رسوم) من السيرفر */
export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'بيانات غير صالحة' }, { status: 400 }); }
  if (!rateLimit(`quote:${clientIp(req)}`, 90, 60_000)) return NextResponse.json({ ok: false, error: 'محاولات كثيرة' }, { status: 429 });

  let sb;
  try { sb = adminClient(); } catch { return NextResponse.json({ ok: false, error: 'المتجر غير مهيأ' }, { status: 500 }); }
  const store = await getStoreBySlug(sb, body.slug);
  if (!store) return NextResponse.json({ ok: false, error: 'المتجر غير متاح' }, { status: 404 });
  const cfg = await getConfig(sb, storeKey(store));

  const priced = await priceCart(sb, store, cfg, { items: body.items, bump: body.bump, governorate: body.governorate, coupon: body.coupon });
  if (priced.errors?.length) return NextResponse.json({ ok: false, error: priced.errors[0] });

  let couponMsg = '';
  if (body.coupon) couponMsg = priced.coupon ? 'تم تطبيق الكود ✓' : 'كود الخصم غير صالح أو لا ينطبق على طلبك';
  const after = priced.subtotal - priced.discount;
  const remainingFree = priced.freeOver > 0 ? Math.max(0, Math.round((priced.freeOver - after) * 100) / 100) : null;

  return NextResponse.json({
    ok: true, subtotal: priced.subtotal, discount: priced.discount, shipping: priced.shipping, cod_fee: priced.codFee, total: priced.total,
    free_over: priced.freeOver || 0, remaining_free: remainingFree,
    lines: priced.lines.map((l) => ({ product_id: l.product_id, title: l.title, qty: l.qty, line_total: l.line_total, saved: l.saved, offer: l.offer, bump: !!l.bump })),
    coupon: priced.coupon ? { code: priced.coupon.code, freeShip: priced.coupon.freeShip } : null, couponMsg,
  });
}
