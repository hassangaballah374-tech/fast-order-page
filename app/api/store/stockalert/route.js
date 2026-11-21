import { NextResponse } from 'next/server';
import { adminClient } from '../../../../lib/supabaseAdmin';
import { getStoreBySlug, storeKey, rateLimitDb, clientIp, readJson } from '../../../../lib/storeServer';
import { normalizePhone, isValidEgPhone } from '../../../../lib/storeKit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* العميل بيسجّل رقمه على منتج نفد عشان التاجر يبلّغه لما يرجع */
export async function POST(req) {
  let body;
  try { body = await readJson(req); } catch { return NextResponse.json({ ok: false, error: 'بيانات غير صالحة' }, { status: 400 }); }
  if (body.hp) return NextResponse.json({ ok: true });
  const phone = normalizePhone(String(body.phone || '').slice(0, 30));
  if (!isValidEgPhone(phone)) return NextResponse.json({ ok: false, error: 'اكتب رقم موبايل مصري صحيح' });
  let sb;
  try { sb = adminClient(); } catch { return NextResponse.json({ ok: false, error: 'غير متاح' }, { status: 500 }); }
  if (!(await rateLimitDb(sb, `stockalert:${clientIp(req)}`, 8, 10 * 60_000))) return NextResponse.json({ ok: false, error: 'محاولات كثيرة، حاول بعد شوية' }, { status: 429 });
  const store = await getStoreBySlug(sb, body.slug);
  if (!store) return NextResponse.json({ ok: false, error: 'المتجر غير متاح' }, { status: 404 });
  const pid = String(body.product_id || '').slice(0, 60);
  const { data: prod } = await sb.from('products').select('id, title').eq('id', pid).eq('store_id', storeKey(store)).maybeSingle();
  if (!prod) return NextResponse.json({ ok: false, error: 'المنتج غير موجود' }, { status: 404 });
  /* حد أقصى لكل متجر عشان ما حدش يملّا الجدول */
  const { count } = await sb.from('stock_alerts').select('id', { count: 'exact', head: true }).eq('store_id', storeKey(store)).eq('notified', false);
  if ((count || 0) > 5000) return NextResponse.json({ ok: false, error: 'غير متاح حالياً' }, { status: 429 });
  const { error } = await sb.from('stock_alerts').upsert({ store_id: storeKey(store), product_id: String(prod.id), product_title: String(prod.title || '').slice(0, 200), phone, notified: false }, { onConflict: 'store_id,product_id,phone' });
  if (error) return NextResponse.json({ ok: false, error: 'تعذر الحفظ، حاول تاني' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
