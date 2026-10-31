import { NextResponse } from 'next/server';
import { adminClient } from '../../../../lib/supabaseAdmin';
import { getStoreFast, storeKey, rateLimit, clientIp } from '../../../../lib/storeServer';
import { normalizePhone, isValidEgPhone } from '../../../../lib/storeKit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* حفظ السلة المتروكة: يُستدعى لما العميل يكتب رقمه ولم يكمل الطلب */
export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  if (!rateLimit(`cart:${clientIp(req)}`, 20, 60_000)) return NextResponse.json({ ok: false }, { status: 429 });

  let sb;
  try { sb = adminClient(); } catch { return NextResponse.json({ ok: false }, { status: 500 }); }
  const store = await getStoreFast(sb, body.slug);
  if (!store) return NextResponse.json({ ok: false }, { status: 404 });
  if (!store.live) return NextResponse.json({ ok: true, skipped: true });
  const sid = storeKey(store);

  const phone = normalizePhone(body.phone);
  if (!isValidEgPhone(phone)) return NextResponse.json({ ok: false });

  const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { data: just } = await sb.from('orders').select('id').eq('store_id', sid).eq('customer_phone', phone).gte('created_at', since).limit(1);
  if (just && just.length) return NextResponse.json({ ok: true, skipped: true });

  const items = (Array.isArray(body.items) ? body.items : []).slice(0, 10).map((i) => ({
    product_id: String(i.product_id || ''), title: String(i.title || '').slice(0, 120), qty: Math.max(1, parseInt(i.qty, 10) || 1), price: Number(i.price) || 0,
  }));
  const utm = {};
  for (const k of ['source', 'medium', 'campaign']) if (body.utm?.[k]) utm[k] = String(body.utm[k]).slice(0, 80);

  const { error } = await sb.from('abandoned_carts').upsert({
    store_id: sid, phone, customer_name: String(body.name || '').slice(0, 120) || null, items,
    total: Number(body.total) || 0, utm, recovered: false, updated_at: new Date().toISOString(),
  }, { onConflict: 'store_id,phone' });
  return NextResponse.json({ ok: !error });
}
