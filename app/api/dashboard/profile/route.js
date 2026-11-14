import { NextResponse } from 'next/server';
import { adminClient, userFromRequest, isAdminUser } from '../../../../lib/supabaseAdmin';
import { rateLimit } from '../../../../lib/storeServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bad = (error, status = 400) => NextResponse.json({ ok: false, error }, { status });
const AR = '٠١٢٣٤٥٦٧٨٩';
const digits = (v) => String(v || '').replace(/[٠-٩]/g, (d) => String(AR.indexOf(d))).replace(/[^\d]/g, '');
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* صفحة التاجر الشخصية: التاجر بيقرأ ويعدّل بياناته هو، والأدمن يقدر يعدّل بيانات أي تاجر (uid).
   get  → الاسم، الموبايل، الإيميل، الصورة، بيانات المتجر
   save → owner_name, phone, (photo للأدمن فقط هنا؛ التاجر بيحفظها من اللوحة)، (email للأدمن فقط؛ التاجر بيغيّره عن طريق رابط تأكيد من سوبابيز) */
export async function POST(req) {
  let sb;
  try { sb = adminClient(); } catch { return bad('السيرفر غير مهيأ', 500); }
  const user = await userFromRequest(req, sb);
  if (!user) return bad('غير مصرح', 401);
  if (!rateLimit(`prof:${user.id}`, 30, 60_000)) return bad('محاولات كثيرة، استنى شوية', 429);
  let body;
  try { body = await req.json(); } catch { return bad('بيانات غير صالحة'); }
  if (!body || typeof body !== 'object') return bad('بيانات غير صالحة');

  const admin = isAdminUser(user);
  const target = admin && body.uid ? String(body.uid) : user.id;
  const asAdmin = admin && target !== user.id;

  const { data: sp } = await sb.from('store_profiles').select('user_id, store_name, store_slug, owner_name, phone, plan_type, created_at').eq('user_id', target).maybeSingle();
  if (!sp) return bad('التاجر غير موجود', 404);

  if (body.action === 'get') {
    const { data: au } = await sb.auth.admin.getUserById(target);
    const { data: c } = await sb.from('store_config').select('config').eq('store_id', target).maybeSingle();
    return NextResponse.json({
      ok: true, asAdmin,
      profile: { owner_name: sp.owner_name || '', phone: sp.phone || '', store_name: sp.store_name || '', store_slug: sp.store_slug || '', plan_type: sp.plan_type || 'starter', created_at: sp.created_at || null },
      email: au?.user?.email || '', last_sign_in_at: au?.user?.last_sign_in_at || null,
      photo: String(c?.config?.contact?.owner_photo || ''),
    });
  }

  if (body.action !== 'save') return bad('طلب غير معروف');

  const name = String(body.owner_name ?? '').trim().slice(0, 80);
  const phone = digits(body.phone);
  if (name.length < 2) return bad('اكتب اسم صحيح');
  if (!/^01[0125]\d{8}$/.test(phone)) return bad('رقم الموبايل لازم يكون مصري صحيح (01xxxxxxxxx)');

  const { error } = await sb.from('store_profiles').update({ owner_name: name, phone }).eq('user_id', target);
  if (error) { console.error('PROFILE_SAVE', error.message); return bad('تعذر الحفظ', 500); }
  await sb.auth.admin.updateUserById(target, { user_metadata: { ...(user.id === target ? user.user_metadata : {}), full_name: name, phone } }).catch(() => {});

  /* الصورة: بتتحفظ في إعدادات المتجر (الصفحة الشخصية مستقلة عن اللوحة فمفيش نسخة في الذاكرة بتتخرّب) */
  if (typeof body.photo === 'string') {
    const url = body.photo.trim();
    if (url && !/^https:\/\/\S{3,490}$/.test(url)) return bad('رابط الصورة غير صالح');
    const { data: c } = await sb.from('store_config').select('config').eq('store_id', target).maybeSingle();
    const cfg = c?.config && typeof c.config === 'object' ? c.config : {};
    const next = { ...cfg, contact: { ...(cfg.contact || {}), owner_photo: url } };
    const { error: e2 } = await sb.from('store_config').upsert({ store_id: target, config: next, updated_at: new Date().toISOString() }, { onConflict: 'store_id' });
    if (e2) return bad('تعذر حفظ الصورة', 500);
  }

  /* الإيميل: الأدمن يغيّره مباشرة. التاجر لازم يمر على تأكيد الإيميل الجديد (بيتعمل من المتصفح) */
  let emailChanged = false;
  if (asAdmin && typeof body.email === 'string') {
    const email = body.email.trim().toLowerCase();
    const { data: au } = await sb.auth.admin.getUserById(target);
    if (email && email !== (au?.user?.email || '').toLowerCase()) {
      if (!EMAIL.test(email)) return bad('إيميل غير صالح');
      const { error: e3 } = await sb.auth.admin.updateUserById(target, { email, email_confirm: true });
      if (e3) return bad(/already|registered|exists/i.test(e3.message) ? 'الإيميل ده مستخدم في حساب تاني' : 'تعذر تغيير الإيميل', 400);
      emailChanged = true;
    }
  }
  return NextResponse.json({ ok: true, emailChanged });
}
