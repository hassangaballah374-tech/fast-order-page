import { NextResponse } from 'next/server';
import { adminClient, userFromRequest, isAdminUser } from '../../../../lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RESERVED = new Set(['admin', 'api', 'dashboard', 'register', 'login', 'shop', 'store', 'www', 'app', 'spike', 'p', 'static', '_next']);
const bad = (error, status = 400) => NextResponse.json({ ok: false, error }, { status });

/* إنشاء/تعديل اسم ورابط المتجر مع التحقق من عدم تكرار الرابط (العميل لا يستطيع رؤية متاجر غيره) */
export async function POST(req) {
  let sb;
  try { sb = adminClient(); } catch { return bad('السيرفر غير مهيأ', 500); }
  const user = await userFromRequest(req, sb);
  if (!user) return bad('غير مصرح', 401);

  let body;
  try { body = await req.json(); } catch { return bad('بيانات غير صالحة'); }
  const admin = isAdminUser(user);
  const sid = admin && body.store_id ? String(body.store_id) : user.id;
  const slug = String(body.slug || '').toLowerCase().trim();

  if (!/^[a-z0-9](?:[a-z0-9-]{1,38})[a-z0-9]$/.test(slug)) return bad('الرابط لازم يكون من 3 إلى 40 حرفاً إنجليزياً أو أرقاماً أو شرطة');
  if (RESERVED.has(slug)) return bad('هذا الرابط محجوز، اختر رابطاً آخر');

  const { data: clash } = await sb.from('store_profiles').select('user_id').eq('store_slug', slug).limit(1);
  const taken = (clash || []).some((r) => String(r.user_id) !== sid);
  if (body.action === 'check') return NextResponse.json({ ok: true, available: !taken });
  if (taken) return bad('هذا الرابط مستخدم بالفعل، اختر رابطاً آخر');

  const name = String(body.name || '').trim().slice(0, 80);
  if (name.length < 2) return bad('اكتب اسم المتجر');

  const { data: existing } = await sb.from('store_profiles').select('id').eq('user_id', sid).maybeSingle();
  if (existing) {
    const { error } = await sb.from('store_profiles').update({ store_name: name, store_slug: slug }).eq('user_id', sid);
    if (error) return bad('تعذر الحفظ', 500);
    return NextResponse.json({ ok: true });
  }

  const meta = user.user_metadata || {};
  const row = {
    user_id: sid, store_name: name, store_slug: slug, owner_name: String(meta.full_name || '').slice(0, 80),
    phone: String(meta.phone || ''), wallet_balance_usd: 0, is_active: true, subscription_status: 'active', plan_type: 'starter',
  };
  const { error } = await sb.from('store_profiles').insert([row]);
  if (error) return bad(`تعذر إنشاء المتجر: ${error.message}`, 500);
  return NextResponse.json({ ok: true, created: true });
}
