import { NextResponse } from 'next/server';
import { adminClient } from '../../../../lib/supabaseAdmin';
import { getStoreBySlug, storeKey, rateLimit, clientIp } from '../../../../lib/storeServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* تقييم من عميل: يدخل بحالة "قيد المراجعة" ولا يظهر في المتجر إلا بعد موافقة التاجر */
export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'بيانات غير صالحة' }, { status: 400 }); }
  if (!rateLimit(`review:${clientIp(req)}`, 5, 10 * 60_000)) return NextResponse.json({ ok: false, error: 'محاولات كثيرة' }, { status: 429 });
  if (body.hp) return NextResponse.json({ ok: true });

  const rating = parseInt(body.rating, 10);
  if (!(rating >= 1 && rating <= 5)) return NextResponse.json({ ok: false, error: 'اختر تقييماً من 1 إلى 5' });
  const name = String(body.name || '').trim().slice(0, 60);
  const comment = String(body.comment || '').trim().slice(0, 600);
  if (name.length < 2) return NextResponse.json({ ok: false, error: 'اكتب اسمك' });

  let sb;
  try { sb = adminClient(); } catch { return NextResponse.json({ ok: false, error: 'غير متاح' }, { status: 500 }); }
  const store = await getStoreBySlug(sb, body.slug);
  if (!store) return NextResponse.json({ ok: false, error: 'المتجر غير متاح' }, { status: 404 });
  const sid = storeKey(store);

  const pid = String(body.product_id || '').slice(0, 40);
  if (pid) {
    const { data: p } = await sb.from('products').select('id').eq('store_id', sid).eq('id', pid).maybeSingle();
    if (!p) return NextResponse.json({ ok: false, error: 'منتج غير موجود' });
  }
  const { error } = await sb.from('store_reviews').insert([{ store_id: sid, product_id: pid || null, customer_name: name, rating, comment, status: 'pending', source: 'customer' }]);
  if (error) return NextResponse.json({ ok: false, error: 'تعذر الحفظ' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
