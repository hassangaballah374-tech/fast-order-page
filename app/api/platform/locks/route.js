import { NextResponse } from 'next/server';
import { adminClient, userFromRequest, isAdminUser } from '../../../../lib/supabaseAdmin';
import { LOCKS_KEY, parseLocks, cleanLocks } from '../../../../lib/featureLocks';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bad = (error, status = 400) => NextResponse.json({ ok: false, error }, { status });

/* قفل الميزات بيتقرأ ويتكتب من السيرفر (بصلاحيات كاملة) — مش من المتصفح — عشان سياسات RLS على platform_kv ما تبوّظش الحفظ أو القراءة.
   action: 'get'  → التاجر يجيب الأقفال الخاصة بيه فقط (global + باقته + استثناءاته)
           'all'  → الأدمن يجيب كل الإعدادات
           'save' → الأدمن يحفظ */
export async function POST(req) {
  let sb;
  try { sb = adminClient(); } catch { return bad('السيرفر غير مهيأ', 500); }
  const user = await userFromRequest(req, sb);
  if (!user) return bad('غير مصرح', 401);
  let body;
  try { body = await req.json(); } catch { return bad('بيانات غير صالحة'); }
  const admin = isAdminUser(user);

  const { data: row, error: readErr } = await sb.from('platform_kv').select('value').eq('key', LOCKS_KEY).maybeSingle();
  if (readErr) { console.error('LOCKS_READ_ERROR', readErr.message); return bad('تعذر قراءة الإعدادات', 500); }
  const cur = parseLocks(row?.value);

  if (body.action === 'save') {
    if (!admin) return bad('للأدمن فقط', 403);
    const value = JSON.stringify(cleanLocks(parseLocks(body.value)));
    const { error } = await sb.from('platform_kv').upsert({ key: LOCKS_KEY, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    if (error) { console.error('LOCKS_SAVE_ERROR', error.message); return bad('تعذر الحفظ في قاعدة البيانات', 500); }
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'all') {
    if (!admin) return bad('للأدمن فقط', 403);
    return NextResponse.json({ ok: true, locks: cur });
  }

  /* التاجر: يشوف أقفاله هو بس. الأدمن (وهو بيعدّل متجر تاجر) يقدر يطلب uid آخر */
  const uid = admin && body.uid ? String(body.uid) : user.id;
  const mine = cur.stores[uid];
  return NextResponse.json({ ok: true, locks: { global: cur.global, plans: cur.plans, stores: mine ? { [uid]: mine } : {} } });
}
