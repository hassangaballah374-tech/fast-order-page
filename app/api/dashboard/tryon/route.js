import { NextResponse } from 'next/server';
import { adminClient, userFromRequest } from '../../../../lib/supabaseAdmin';
import { rateLimit } from '../../../../lib/storeServer';
import { callGemini, safeModel } from '../../../../lib/tryon';
import { TRYON_MODEL_DEFAULT } from '../../../../lib/tryonModels';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const bad = (error, status = 400, extra = {}) => NextResponse.json({ ok: false, error, ...extra }, { status });
const MODEL_PROMPT = [
  'Full-body studio photograph of a faceless photorealistic fashion mannequin, standing straight and facing the camera, arms relaxed at the sides, feet slightly apart.',
  'The mannequin has a smooth neutral light-gray head with no facial features, and wears a plain, fitted, neutral gray basic top and trousers (simple base layer).',
  'Soft diffused studio lighting, plain warm light-gray seamless background, subtle floor shadow, the whole figure from head to shoes visible and centered with a little margin.',
  'Vertical 3:4 portrait photo. No text, no watermark, no logos, no other objects.',
].join(' ');

/* أدوات التاجر للتلبيس بالذكاء الاصطناعي (بالمفتاح المحفوظ في store_integrations، ومابيوصلش للمتصفح)
   test     → يتأكد إن المفتاح شغال ويعرض موديلات الصور المتاحة عليه
   genmodel → يولّد صورة موديل (مانيكان فوتوريالستيك) ويرفعها لتخزين المتجر ويرجّع رابطها */
export async function POST(req) {
  let sb;
  try { sb = adminClient(); } catch { return bad('السيرفر غير مهيأ', 500); }
  const user = await userFromRequest(req, sb);
  if (!user) return bad('غير مصرح', 401);
  if (!rateLimit(`dtryon:${user.id}`, 10, 10 * 60_000)) return bad('محاولات كثيرة، استنى شوية', 429);
  let body;
  try { body = await req.json(); } catch { return bad('بيانات غير صالحة'); }

  const { data: integ, error: readErr } = await sb.from('store_integrations').select('config').eq('store_id', user.id).eq('provider', 'gemini_tryon').maybeSingle();
  if (readErr) return bad('تعذر قراءة الإعدادات: ' + readErr.message, 500);
  const c = (integ && integ.config) || {};

  /* status: حالة المفتاح المحفوظ (بدون ما نرجّع المفتاح نفسه) */
  if (body.action === 'status') return NextResponse.json({ ok: true, has: !!String(c.api_key || '').trim(), model: safeModel(c.model || TRYON_MODEL_DEFAULT), cap: parseInt(c.daily_cap, 10) || 120 });

  /* save: حفظ المفتاح والإعدادات من السيرفر (بصلاحية السيرفر)، وبعدين نقرأه تاني للتأكد إنه اتحفظ فعلاً */
  if (body.action === 'save') {
    const next = { ...c, model: safeModel(body.model), daily_cap: Math.min(1000, Math.max(5, parseInt(body.cap, 10) || 120)) };
    const raw = String(body.key || '').replace(/[\s"'`]/g, '');
    if (raw) {
      if (!/^AIza[0-9A-Za-z_\-]{30,60}$/.test(raw)) return bad('شكل المفتاح غير صحيح. مفتاح Gemini بيبدأ بـ AIza وطوله حوالي 39 حرف. انسخه كامل من aistudio.google.com/apikey من غير مسافات');
      next.api_key = raw;
    }
    const { error } = await sb.from('store_integrations').upsert({ store_id: user.id, provider: 'gemini_tryon', enabled: true, config: next, updated_at: new Date().toISOString() }, { onConflict: 'store_id,provider' });
    if (error) return bad('تعذر الحفظ في قاعدة البيانات: ' + error.message, 500);
    const { data: chk } = await sb.from('store_integrations').select('config').eq('store_id', user.id).eq('provider', 'gemini_tryon').maybeSingle();
    const ok = !!(chk && chk.config && String(chk.config.api_key || '').trim());
    return NextResponse.json({ ok, has: ok, error: ok ? '' : 'الحفظ لم يكتمل (المفتاح لسه فاضي). ' + (raw ? '' : 'اكتب المفتاح في الخانة قبل الحفظ.') });
  }

  const key = String(c.api_key || '').trim();
  if (!key) return bad('مفيش مفتاح محفوظ لسه. اكتب المفتاح في الخانة واضغط "حفظ إعدادات المفتاح" الأول');

  if (body.action === 'test') {
    try {
      const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', { headers: { 'x-goog-api-key': key } });
      const j = await r.json().catch(() => null);
      if (!r.ok) {
        const m = String(j?.error?.message || '');
        return NextResponse.json({ ok: false, error: r.status === 400 || r.status === 403 ? 'المفتاح غير صحيح أو مش مفعّل' : `Google رجّع خطأ (${r.status})`, detail: m.slice(0, 200) });
      }
      const names = (j.models || []).map((m) => String(m.name || '').replace(/^models\//, ''));
      const images = names.filter((n) => /image/i.test(n) && /^gemini/i.test(n));
      const chosen = safeModel(c.model);
      return NextResponse.json({ ok: true, keyValid: true, imageModels: images.slice(0, 12), chosen, chosenAvailable: images.includes(chosen), note: 'المفتاح سليم. لو توليد الصورة فشل بعد كده، السبب غالباً الفوترة (Billing) مش مفعّلة على مشروع المفتاح.' });
    } catch { return bad('تعذر الاتصال بـ Google من السيرفر', 502); }
  }

  if (body.action === 'genmodel') {
    const r = await callGemini({ key, model: c.model, prompt: MODEL_PROMPT, images: [], aspect: '3:4' });
    if (!r.ok) return NextResponse.json({ ok: false, error: r.error, detail: r.detail || '' });
    const mime = /png|jpeg|webp/.test(r.image.mime) ? r.image.mime : 'image/png';
    const ext = mime === 'image/jpeg' ? 'jpg' : mime === 'image/webp' ? 'webp' : 'png';
    const path = `${user.id}/fitting/${Date.now()}-ai-model.${ext}`;
    const { error } = await sb.storage.from('store-assets').upload(path, Buffer.from(r.image.data, 'base64'), { contentType: mime, cacheControl: '31536000', upsert: false });
    if (error) return bad('اتولّدت الصورة لكن تعذر رفعها: ' + error.message, 500);
    const { data } = sb.storage.from('store-assets').getPublicUrl(path);
    return NextResponse.json({ ok: true, url: data.publicUrl, model: r.model });
  }
  return bad('طلب غير معروف');
}
