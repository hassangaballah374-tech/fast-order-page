/* التلبيس بالذكاء الاصطناعي (Gemini image): دوال السيرفر. المفتاح بتاع التاجر وبيتخزن في store_integrations (provider = 'gemini_tryon')
   ومابيتبعتش للمتصفح أبداً. الصور بتتجيب من السيرفر من روابط المتجر نفسه فقط (حماية SSRF). */

import { TRYON_MODELS, TRYON_MODEL_DEFAULT } from './tryonModels';
export { TRYON_MODELS, TRYON_MODEL_DEFAULT };
const API_BASES = ['https://generativelanguage.googleapis.com/v1beta', 'https://generativelanguage.googleapis.com/v1'];
const IMG_OK = /^image\/(png|jpe?g|webp)$/i;

export function safeModel(m) { return TRYON_MODELS.includes(m) ? m : TRYON_MODEL_DEFAULT; }

/* نص الطلب: صورة 1 = الموديل، وبعدها القطع بالترتيب (اللي بعد بتتلبس فوق) */
export function buildPrompt({ count, body, fit }) {
  const lines = [
    'Virtual try-on. Image 1 is the model photo. The following ' + count + ' image(s) are clothing / accessory products, in order.',
    'Dress the model in ALL of these products, layered naturally (later items go on top of earlier ones).',
    'Keep the model\'s pose, face area, body shape, background, lighting and camera framing exactly the same as image 1.',
    'Keep anything the model already wears unless a product replaces it.',
    'Reproduce each product faithfully: exact color, fabric, pattern, print, logo and cut. Do not invent details or text.',
    'Output ONE photorealistic full-body image with the same aspect ratio as image 1. No watermark, no captions.',
  ];
  if (body && (body.h || body.w)) {
    lines.push(`Body type to show: height ${Math.round(body.h || 170)} cm, weight ${Math.round(body.w || 70)} kg${body.stomach ? ', fuller belly' : ''}${body.hips ? ', fuller hips' : ''}${body.chest ? ', broader chest and shoulders' : ''}.`);
  }
  if (body && body.size) lines.push(`The garments are size ${String(body.size).slice(0, 6)}: show how that size really fits this body (tight, true-to-size or loose).`);
  if (fit === -1) lines.push('Prefer a slim, close fit.'); else if (fit === 1) lines.push('Prefer a relaxed, loose fit.');
  return lines.join('\n');
}

export function buildRequest(prompt, images) {
  return {
    contents: [{ parts: [{ text: prompt }, ...images.map((im) => ({ inline_data: { mime_type: im.mime, data: im.data } }))] }],
    generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
  };
}

/* أول صورة مش «thought» في الرد، أو null */
export function parseResponse(json) {
  const parts = json?.candidates?.[0]?.content?.parts || [];
  for (const p of parts) {
    if (p.thought) continue;
    const d = p.inlineData || p.inline_data;
    if (d && d.data) return { mime: d.mimeType || d.mime_type || 'image/png', data: d.data };
  }
  return null;
}

export function errorText(json, status) {
  const m = String(json?.error?.message || '').toLowerCase();
  if (status === 400 && /api key/.test(m)) return 'مفتاح Gemini غير صحيح';
  if (status === 401 || status === 403) return 'مفتاح Gemini غير مسموح له بتوليد الصور (راجع الفوترة أو الصلاحيات)';
  if (status === 429) return 'تم تجاوز حد الاستخدام عند Gemini، جرّب بعد شوية';
  const blocked = json?.promptFeedback?.blockReason || json?.candidates?.[0]?.finishReason;
  if (blocked && /SAFETY|BLOCK|PROHIB|IMAGE_OTHER/i.test(String(blocked))) return 'الصورة اترفضت من فلتر الأمان، جرّب قطعة أو صورة تانية';
  return 'تعذر التلبيس حالياً';
}

export async function callGemini({ key, model, prompt, images, timeoutMs = 55000, fetchImpl = fetch, bases = API_BASES }) {
  const body = JSON.stringify(buildRequest(prompt, images));
  let last = { status: 0, json: null };
  for (const base of bases) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const r = await fetchImpl(`${base}/models/${safeModel(model)}:generateContent`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body, signal: ctrl.signal });
      const json = await r.json().catch(() => null);
      last = { status: r.status, json };
      if (r.ok) {
        const img = parseResponse(json);
        if (img) return { ok: true, image: img };
        return { ok: false, error: errorText(json, 200) };
      }
      if (r.status !== 404) break;          /* 404 = المسار/الموديل مش موجود على النسخة دي، نجرّب اللي بعدها */
    } catch (e) {
      if (e && e.name === 'AbortError') return { ok: false, error: 'التلبيس أخد وقت طويل، جرّب تاني' };
      last = { status: 0, json: null };
    } finally { clearTimeout(t); }
  }
  return { ok: false, error: errorText(last.json, last.status) };
}

/* هوست مسموح: نفس هوست Supabase بتاع المشروع فقط (الصور المرفوعة من التاجر) */
export function allowedImageUrl(url) {
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:') return false;
    const sb = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : '';
    return !!sb && u.hostname === sb;
  } catch { return false; }
}

export async function fetchImage(url, { max = 4 * 1024 * 1024, fetchImpl = fetch } = {}) {
  if (!allowedImageUrl(url)) return null;
  const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await fetchImpl(url, { signal: ctrl.signal, redirect: 'error' });
    if (!r.ok) return null;
    const mime = String(r.headers.get('content-type') || '').split(';')[0].trim();
    if (!IMG_OK.test(mime)) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    if (!buf.length || buf.length > max) return null;
    return { mime, data: buf.toString('base64') };
  } catch { return null; } finally { clearTimeout(t); }
}

/* data URL من المتصفح (صورة المانيكان المدمج) → { mime, data } أو null */
export function parseDataUrl(s, max = 1.6 * 1024 * 1024) {
  const m = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(s || ''));
  if (!m) return null;
  if (m[2].length * 0.75 > max) return null;
  return { mime: m[1], data: m[2] };
}
