import { NextResponse } from 'next/server';
import { adminClient, userFromRequest, isAdminUser } from '../../../../lib/supabaseAdmin';
import { BOSTA_CITY } from '../../../../lib/storeKit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BOSTA_URL = 'https://app.bosta.co/api/v2/deliveries';

async function sendToBosta(apiKey, order) {
  const full = String(order.customer_name || '').trim().split(/\s+/);
  const items = Array.isArray(order.items) ? order.items : [];
  const desc = items.map((i) => `${i.title} x${i.qty}`).join(', ').slice(0, 200) || 'Order';
  const body = {
    type: 10,
    specs: { packageType: 'Parcel', size: 'SMALL', packageDetails: { itemsCount: items.reduce((a, i) => a + (Number(i.qty) || 1), 0) || 1, description: desc } },
    cod: Math.round(Number(order.total_price) || 0),
    dropOffAddress: { city: BOSTA_CITY[order.governorate] || order.governorate, firstLine: String(order.address || '').slice(0, 250) },
    receiver: { firstName: full[0] || 'Customer', lastName: full.slice(1).join(' ') || '-', phone: order.customer_phone, ...(order.email ? { email: order.email } : {}) },
    businessReference: String(order.order_no || order.id),
    ...(order.notes ? { notes: String(order.notes).slice(0, 200) } : {}),
  };
  const res = await fetch(BOSTA_URL, { method: 'POST', headers: { Authorization: apiKey, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  let data = {};
  try { data = await res.json(); } catch { /* ignore */ }
  if (!res.ok) return { ok: false, error: data?.message || data?.error || `Bosta HTTP ${res.status}` };
  const d = data?.data || data;
  const tracking = d?.trackingNumber || d?.tracking_number;
  if (!tracking) return { ok: false, error: 'لم يرجع رقم تتبع من بوسطة' };
  return { ok: true, tracking: String(tracking), ref: d?._id || d?.id || '' };
}

export async function POST(req) {
  let sb;
  try { sb = adminClient(); } catch { return NextResponse.json({ ok: false, error: 'السيرفر غير مهيأ' }, { status: 500 }); }
  const user = await userFromRequest(req, sb);
  if (!user) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 });

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'بيانات غير صالحة' }, { status: 400 }); }
  const ids = (Array.isArray(body.order_ids) ? body.order_ids : [body.order_id]).filter((x) => x !== undefined && x !== null).slice(0, 50);
  if (!ids.length) return NextResponse.json({ ok: false, error: 'لا توجد طلبات' }, { status: 400 });

  const { data: orders } = await sb.from('orders').select('*').in('id', ids);
  const results = [];
  const keyCache = new Map();

  for (const o of orders || []) {
    const allowed = isAdminUser(user) || String(o.store_id) === user.id;
    if (!allowed) { results.push({ id: o.id, ok: false, error: 'غير مصرح' }); continue; }
    if (o.tracking_number) { results.push({ id: o.id, ok: false, error: 'تم إرسال هذا الطلب للشحن من قبل' }); continue; }
    if (!['pending', 'confirmed'].includes(o.status || 'pending')) { results.push({ id: o.id, ok: false, error: 'حالة الطلب لا تسمح بالشحن' }); continue; }

    if (!keyCache.has(o.store_id)) {
      const { data: integ } = await sb.from('store_integrations').select('enabled, config').eq('store_id', o.store_id).eq('provider', 'bosta').maybeSingle();
      keyCache.set(o.store_id, integ?.enabled && integ?.config?.api_key ? String(integ.config.api_key) : '');
    }
    const apiKey = keyCache.get(o.store_id);
    if (!apiKey) { results.push({ id: o.id, ok: false, error: 'فعّل بوسطة وأدخل مفتاح الـ API من صفحة التطبيقات' }); continue; }

    const r = await sendToBosta(apiKey, o);
    if (!r.ok) { results.push({ id: o.id, ok: false, error: r.error }); continue; }
    await sb.from('orders').update({ courier: 'bosta', tracking_number: r.tracking, courier_ref: r.ref, status: 'shipped', updated_at: new Date().toISOString() }).eq('id', o.id);
    results.push({ id: o.id, ok: true, tracking: r.tracking });
  }
  return NextResponse.json({ ok: results.some((r) => r.ok), results });
}
