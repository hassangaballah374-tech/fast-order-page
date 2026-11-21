import { NextResponse } from 'next/server';
import { adminClient, userFromRequest, isAdminUser } from '../../../../lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bad = (error, status = 400) => NextResponse.json({ ok: false, error }, { status });

/* سجل أحداث المنصة: للأدمن فقط. action: list (آخر الأحداث + ملخص آخر 24 ساعة) | clear (مسح) */
export async function POST(req) {
  let sb;
  try { sb = adminClient(); } catch { return bad('السيرفر غير مهيأ', 500); }
  const user = await userFromRequest(req, sb);
  if (!user || !isAdminUser(user)) return bad('غير مصرح', 403);
  let body; try { body = await req.json(); } catch { return bad('بيانات غير صالحة'); }

  if (body.action === 'clear') {
    const { error } = await sb.from('platform_events').delete().gte('id', 0);
    return error ? bad('تعذر المسح', 500) : NextResponse.json({ ok: true });
  }
  /* تنظيف تلقائي: أحداث أقدم من 30 يوم */
  await sb.from('platform_events').delete().lt('at', new Date(Date.now() - 30 * 86400_000).toISOString());

  const level = ['error', 'warn', 'info'].includes(body.level) ? body.level : null;
  const source = body.source ? String(body.source).slice(0, 40) : null;
  let q = sb.from('platform_events').select('*').order('at', { ascending: false }).limit(200);
  if (level) q = q.eq('level', level);
  if (source) q = q.eq('source', source);
  const { data, error } = await q;
  if (error) {
    const missing = /does not exist|relation|schema cache/i.test(error.message);
    return NextResponse.json({ ok: false, error: missing ? 'جدول platform_events مش متشغّل. شغّل sql/platform_events.sql في Supabase' : 'تعذر القراءة' });
  }
  const since = new Date(Date.now() - 86400_000).toISOString();
  const { data: recent } = await sb.from('platform_events').select('source, level').gte('at', since).limit(5000);
  const by = {};
  (recent || []).forEach((r) => { by[r.source] = by[r.source] || { error: 0, warn: 0, info: 0 }; by[r.source][r.level] = (by[r.source][r.level] || 0) + 1; });
  return NextResponse.json({ ok: true, rows: data || [], summary: by });
}
