import { NextResponse } from 'next/server';
import { adminClient, userFromRequest } from '../../../../lib/supabaseAdmin';
import { rateLimit } from '../../../../lib/storeServer';
import { callGemini, safeModel } from '../../../../lib/tryon';

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

  const { data: integ } = await sb.from('store_integrations').select('config').eq('store_id', user.id).eq('provider', 'gemini_tryon').maybeSingle();
  const c = (integ && integ.config) || {};
  const key = String(c.api_key || '').trim();
  if (!key) return bad('مفيش مفتاح Gemini محفوظ. حط المفتاح واضغط "حفظ إعدادات المفتاح" الأول');

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
