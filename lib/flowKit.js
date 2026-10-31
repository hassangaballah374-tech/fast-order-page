/* منطق الفانل المشترك (المتصفح + السيرفر + لوحة التاجر) */

export const STEP_TYPES = {
  landing: { n: 'صفحة هبوط + نموذج الطلب', i: '🚀', d: 'صفحة هبوط فيها نموذج الطلب. بعد الطلب بينتقل العميل للخطوة اللي بعدها.' },
  page: { n: 'صفحة مخصصة', i: '📄', d: 'أي صفحة هبوط كخطوة وسيطة (قصة، فيديو، إثبات اجتماعي...). أزرارها بتوصّل للخطوة اللي بعدها.' },
  upsell: { n: 'عرض Upsell', i: '⬆️', d: 'بعد الطلب: عرض منتج إضافي بضغطة واحدة بيتضاف لنفس الطلب بدون إعادة إدخال البيانات.' },
  downsell: { n: 'عرض Downsell', i: '⬇️', d: 'بيظهر بس لو العميل رفض الـ Upsell اللي قبله (عرض أرخص أو منتج بديل).' },
  thanks: { n: 'صفحة الشكر', i: '🎉', d: 'آخر خطوة: تأكيد الطلب وتتبع الشراء.' },
};
export const OFFER_TYPES = ['upsell', 'downsell'];

const rid = () => Math.random().toString(36).slice(2, 8);
const str = (v, n) => String(v ?? '').trim().slice(0, n);
const num = (v, lo, hi, d) => { const x = Number(v); return Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : d; };

export const OFFER_DEFAULTS = {
  product_id: '', percent: 20, qty: 1, headline: 'استنى! عرض خاص قبل ما تخلّص',
  subheadline: 'ضيف المنتج ده لطلبك بخصم خاص، من غير ما تكتب بياناتك تاني.',
  points: [], accept_text: 'نعم، أضفه لطلبي', decline_text: 'لا شكراً، أكمل بدون', minutes: 10, image: '',
};

export const mkStep = (type) => {
  const base = { id: `s${rid()}`, type, name: '' };
  if (type === 'landing' || type === 'page') return { ...base, page: '' };
  if (type === 'upsell') return { ...base, ...OFFER_DEFAULTS };
  if (type === 'downsell') return { ...base, ...OFFER_DEFAULTS, percent: 40, headline: 'عرض أخير ليك بس!', subheadline: 'خصم أكبر على نفس المنتج لو ضفته دلوقتي.' };
  return base;
};

/* تنظيف الخطوات (نفس القواعد في السيرفر واللوحة) */
export function cleanSteps(input) {
  const out = []; const seen = new Set();
  for (const s of Array.isArray(input) ? input.slice(0, 20) : []) {
    if (!s || !STEP_TYPES[s.type]) continue;
    let id = str(s.id, 24).replace(/[^a-zA-Z0-9_-]/g, '');
    if (!id || seen.has(id)) id = `s${rid()}`;
    seen.add(id);
    const o = { id, type: s.type, name: str(s.name, 60) };
    if (s.type === 'landing' || s.type === 'page') o.page = str(s.page, 80).replace(/[^a-zA-Z0-9%_؀-ۿ-]/g, '');
    if (OFFER_TYPES.includes(s.type)) {
      o.product_id = str(s.product_id, 40).replace(/[^0-9a-zA-Z-]/g, '');
      o.percent = num(s.percent, 0, 90, 20);
      o.qty = Math.round(num(s.qty, 1, 10, 1));
      o.headline = str(s.headline, 120); o.subheadline = str(s.subheadline, 240);
      o.points = (Array.isArray(s.points) ? s.points : []).map((x) => str(typeof x === 'string' ? x : x?.t, 90)).filter(Boolean).slice(0, 6);
      o.accept_text = str(s.accept_text, 60) || OFFER_DEFAULTS.accept_text;
      o.decline_text = str(s.decline_text, 60) || OFFER_DEFAULTS.decline_text;
      o.minutes = Math.round(num(s.minutes, 0, 120, 0));
      o.image = /^https?:\/\//i.test(String(s.image || '')) ? str(s.image, 500) : '';
    }
    out.push(o);
  }
  return out;
}

/* الخطوة التالية: outcome = 'continue' (طلب/زر)، 'accept' (قبل العرض)، 'decline' (رفض العرض)
   - الرفض يروح للخطوة اللي بعدها مباشرة (ممكن تكون Downsell)
   - غير كده بنتخطى أي Downsell لأنه بيظهر بس بعد الرفض */
export function nextStep(steps, id, outcome = 'continue') {
  const i = steps.findIndex((s) => s.id === id);
  if (i < 0) return null;
  if (outcome === 'decline') return steps[i + 1] || null;
  for (let j = i + 1; j < steps.length; j += 1) if (steps[j].type !== 'downsell') return steps[j];
  return null;
}

export const stepHref = (base, flowSlug, stepId) => `${base}/flow/${encodeURIComponent(flowSlug)}/${stepId}`;
export const nextHref = (base, flow, id, outcome) => {
  const n = nextStep(flow.steps, id, outcome);
  return n ? stepHref(base, flow.slug, n.id) : `${base}/thank-you`;
};

/* مشاكل بتمنع الفانل يشتغل صح (لعرضها للتاجر) */
export function checkFlow(steps, { pages = [], products = [] } = {}) {
  const w = [];
  if (!steps.length) return ['أضف خطوة واحدة على الأقل'];
  if (!steps.some((s) => s.type === 'landing')) w.push('محتاج خطوة «صفحة هبوط + نموذج الطلب» عشان الطلب يتسجل');
  const firstLanding = steps.findIndex((s) => s.type === 'landing');
  steps.forEach((s, i) => {
    const nm = STEP_TYPES[s.type].n;
    if ((s.type === 'landing' || s.type === 'page') && !s.page) w.push(`خطوة ${i + 1} (${nm}): اختر صفحة الهبوط`);
    if ((s.type === 'landing' || s.type === 'page') && s.page && pages.length && !pages.some((p) => p.slug === s.page && p.enabled !== false)) w.push(`خطوة ${i + 1}: الصفحة «${s.page}» مخفية أو محذوفة`);
    if (OFFER_TYPES.includes(s.type)) {
      if (!s.product_id) w.push(`خطوة ${i + 1} (${nm}): اختر المنتج`);
      const p = products.find((x) => String(x.id) === String(s.product_id));
      if (s.product_id && products.length && !p) w.push(`خطوة ${i + 1}: المنتج غير موجود`);
      if (p && Array.isArray(p.variants) && p.variants.length) w.push(`خطوة ${i + 1}: «${p.title}» له خيارات (مقاس/لون)، والـ Upsell بضغطة واحدة بيحتاج منتج بدون خيارات`);
      if (firstLanding < 0 || i < firstLanding) w.push(`خطوة ${i + 1}: العرض لازم يكون بعد خطوة الطلب`);
    }
    if (s.type === 'downsell' && !(i > 0 && OFFER_TYPES.includes(steps[i - 1].type))) w.push(`خطوة ${i + 1}: الـ Downsell لازم ييجي مباشرة بعد Upsell`);
  });
  return w;
}
