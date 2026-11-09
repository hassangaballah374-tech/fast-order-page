import { NextResponse } from 'next/server';
import { adminClient, userFromRequest, isAdminUser } from '../../../../lib/supabaseAdmin';
import { sendToBosta } from '../../../../lib/bostaShip';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
