import { NextResponse } from 'next/server';
import { adminClient } from '../../../../lib/supabaseAdmin';
import { getStoreBySlug, storeKey, rateLimit, clientIp } from '../../../../lib/storeServer';
import { normalizePhone } from '../../../../lib/storeKit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* تتبع الطلب للعميل: رقم الطلب + رقم الموبايل (أو الرابط السري بعد الطلب) */
export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'بيانات غير صالحة' }, { status: 400 }); }
  if (!rateLimit(`track:${clientIp(req)}`, 15, 60_000)) return NextResponse.json({ ok: false, error: 'محاولات كثيرة' }, { status: 429 });

  let sb;
  try { sb = adminClient(); } catch { return NextResponse.json({ ok: false, error: 'غير متاح' }, { status: 500 }); }
  const store = await getStoreBySlug(sb, body.slug);
  if (!store) return NextResponse.json({ ok: false, error: 'المتجر غير متاح' }, { status: 404 });

  let q = sb.from('orders').select('order_no, status, items, total_price, courier, tracking_number, created_at, updated_at, governorate, customer_name').eq('store_id', storeKey(store));
  if (body.token) q = q.eq('public_token', String(body.token));
  else {
    const no = parseInt(String(body.order_no).replace(/\D/g, ''), 10);
    if (!no) return NextResponse.json({ ok: false, error: 'اكتب رقم الطلب' });
    q = q.eq('order_no', no).eq('customer_phone', normalizePhone(body.phone));
  }
  const { data } = await q.maybeSingle();
  if (!data) return NextResponse.json({ ok: false, error: 'لم نجد طلباً بهذه البيانات' });

  return NextResponse.json({
    ok: true,
    order: {
      order_no: data.order_no, status: data.status, total: data.total_price, courier: data.courier, tracking_number: data.tracking_number,
      created_at: data.created_at, updated_at: data.updated_at, governorate: data.governorate,
      first_name: String(data.customer_name || '').split(' ')[0],
      items: (Array.isArray(data.items) ? data.items : []).map((i) => ({ title: i.title, qty: i.qty, options: i.options })),
    },
  });
}
