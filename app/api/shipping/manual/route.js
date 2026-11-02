import { NextResponse } from 'next/server';
import { adminClient, userFromRequest, isAdminUser } from '../../../../lib/supabaseAdmin';
import { MANUAL_COURIERS } from '../../../../lib/couriers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* تسجيل شحنة يدوياً لأي شركة: body = { courier, items: [{ id, tracking }] }  → الطلب يتحول «في الشحن» */
export async function POST(req) {
  let sb;
  try { sb = adminClient(); } catch { return NextResponse.json({ ok: false, error: 'السيرفر غير مهيأ' }, { status: 500 }); }
  const user = await userFromRequest(req, sb);
  if (!user) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 });

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'بيانات غير صالحة' }, { status: 400 }); }
  const courier = String(body.courier || '');
  if (!MANUAL_COURIERS.some((c) => c.id === courier)) return NextResponse.json({ ok: false, error: 'اختر شركة الشحن' }, { status: 400 });
  const items = (Array.isArray(body.items) ? body.items : []).slice(0, 100)
    .map((x) => ({ id: x?.id, tracking: String(x?.tracking || '').trim().slice(0, 60) })).filter((x) => x.id !== undefined && x.id !== null);
  if (!items.length) return NextResponse.json({ ok: false, error: 'لا توجد طلبات' }, { status: 400 });

  const { data: orders } = await sb.from('orders').select('id, store_id, status, tracking_number').in('id', items.map((x) => x.id));
  const byId = new Map((orders || []).map((o) => [String(o.id), o]));
  const results = [];
  for (const it of items) {
    const o = byId.get(String(it.id));
    if (!o) { results.push({ id: it.id, ok: false, error: 'الطلب غير موجود' }); continue; }
    if (!(isAdminUser(user) || String(o.store_id) === user.id)) { results.push({ id: o.id, ok: false, error: 'غير مصرح' }); continue; }
    if (!it.tracking) { results.push({ id: o.id, ok: false, error: 'اكتب رقم التتبع' }); continue; }
    if (o.tracking_number) { results.push({ id: o.id, ok: false, error: 'تم تسجيل شحنة لهذا الطلب من قبل' }); continue; }
    if (!['pending', 'confirmed'].includes(o.status || 'pending')) { results.push({ id: o.id, ok: false, error: 'حالة الطلب لا تسمح بالشحن' }); continue; }
    const { error } = await sb.from('orders').update({ courier, tracking_number: it.tracking, status: 'shipped', updated_at: new Date().toISOString() }).eq('id', o.id);
    results.push({ id: o.id, ok: !error, error: error?.message });
  }
  return NextResponse.json({ ok: results.some((r) => r.ok), results });
}
