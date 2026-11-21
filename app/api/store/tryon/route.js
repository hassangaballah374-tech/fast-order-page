import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { loadStore, getProducts } from '../../../../lib/storeData';
import { rateLimit, rateLimitDb, clientIp, readJson } from '../../../../lib/storeServer';
import { logEvent } from '../../../../lib/events';
import { buildPrompt, callGemini, fetchImage, parseDataUrl, safeModel } from '../../../../lib/tryon';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const cache = new Map();                       /* نتيجة نفس التركيبة لمدة ساعة (بتوفّر فلوس التاجر) */
const TTL = 3600_000;
const out = (o, status = 200) => NextResponse.json(o, { status });

/* تلبيس الموديل بالذكاء الاصطناعي. الجسم: { slug, products:[id…≤5], model: index | -1, baseData?: dataURL (صورة المانيكان المدمج), body?:{h,w,size,chest,stomach,hips}, fit? } */
export async function POST(req) {
  let body;
  try { body = await readJson(req, 2_300_000); } catch { return out({ ok: false, error: 'بيانات غير صالحة' }, 400); }
  const ip = clientIp(req);
  if (!rateLimit(`tryon:${ip}`, 8, 10 * 60_000) || !rateLimit(`tryon-h:${ip}`, 40, 3600_000)) return out({ ok: false, error: 'محاولات كثيرة، استنى شوية' }, 429);

  const ctx = await loadStore(String(body.slug || ''));
  if (!ctx) return out({ ok: false, error: 'المتجر غير متاح' }, 404);
  const { sb, sid, cfg } = ctx;
  const fit = cfg.fitting || {};
  if (!fit.enabled || !fit.ai || !fit.ai.enabled) return out({ ok: false, error: 'التلبيس بالذكاء الاصطناعي غير مفعّل' }, 403);

  const { data: integ } = await sb.from('store_integrations').select('enabled, config').eq('store_id', sid).eq('provider', 'gemini_tryon').maybeSingle();
  const c = (integ && integ.enabled !== false && integ.config) || {};
  const key = String(c.api_key || '').trim() || (c.use_platform ? String(process.env.GEMINI_API_KEY || '').trim() : '');
  if (!key) return out({ ok: false, error: 'التلبيس غير مجهّز في المتجر (المفتاح ناقص)' }, 503);
  const cap = Math.min(1000, Math.max(5, parseInt(c.daily_cap, 10) || 120));
  if (!(await rateLimitDb(sb, `tryon-s:${sid}`, cap, 24 * 3600_000))) return out({ ok: false, error: 'تم الوصول للحد اليومي للتلبيس في المتجر، جرّب بكرة' }, 429);

  const ids = [...new Set((Array.isArray(body.products) ? body.products : []).map(String))].slice(0, 5);
  if (!ids.length) return out({ ok: false, error: 'اختار قطعة الأول' });
  const prods = await getProducts(sb, sid, { ids, limit: 10, order: null });
  const byId = new Map(prods.map((p) => [String(p.id), p]));
  const picks = ids.map((id) => byId.get(id)).filter(Boolean);
  if (!picks.length) return out({ ok: false, error: 'القطع غير متاحة' });

  /* الموديل: صورة من اللي التاجر رفعها، أو صورة المانيكان المدمج المبعوتة من المتصفح */
  let base = null;
  const mi = Number.isInteger(body.model) ? body.model : -1;
  if (mi >= 0 && fit.models && fit.models[mi]) base = await fetchImage(fit.models[mi].image);
  else if (body.baseData) base = parseDataUrl(body.baseData);
  if (!base) return out({ ok: false, error: 'صورة الموديل غير متاحة' });

  const garments = [];
  for (const p of picks) {
    const src = (fit.items && fit.items[String(p.id)] && fit.items[String(p.id)].image) || (p.images || [])[0];
    const im = src ? await fetchImage(src) : null;
    if (im) garments.push(im);
  }
  if (!garments.length) return out({ ok: false, error: 'تعذر قراءة صور القطع' });

  const b = body.body && typeof body.body === 'object' ? body.body : null;
  const bodyInfo = b ? { h: Number(b.h) || 0, w: Number(b.w) || 0, size: String(b.size || '').slice(0, 6), chest: b.chest ? 1 : 0, stomach: b.stomach ? 1 : 0, hips: b.hips ? 1 : 0 } : null;
  const f = Number(body.fit) === -1 ? -1 : Number(body.fit) === 1 ? 1 : 0;
  const model = safeModel(c.model);

  const ck = createHash('sha1').update(JSON.stringify([sid, mi, mi < 0 ? base.data.length + base.data.slice(0, 64) : 0, picks.map((p) => String(p.id)), bodyInfo, f, model])).digest('hex');
  const hit = cache.get(ck);
  if (hit && Date.now() - hit.t < TTL) return out({ ok: true, image: hit.image, cached: true });

  const prompt = buildPrompt({ count: garments.length, body: bodyInfo, fit: f });
  const r = await callGemini({ key, model, prompt, images: [base, ...garments] });
  if (!r.ok) { await logEvent(sb, { level: 'warn', source: 'tryon', message: `فشل توليد صورة التلبيس: ${r.error}`, store_id: String(sid), meta: { model } }); return out({ ok: false, error: r.error }); }
  const image = `data:${r.image.mime};base64,${r.image.data}`;
  cache.set(ck, { t: Date.now(), image });
  if (cache.size > 40) for (const k of cache.keys()) { cache.delete(k); if (cache.size <= 30) break; }
  return out({ ok: true, image });
}
