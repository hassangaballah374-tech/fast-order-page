/* تسجيل أحداث المنصة (للأدمن). best-effort: عمره ما بيرمي خطأ ولا بيعطّل الطلب.
   بنقصّ النصوص ونشيل أي حاجة تشبه مفتاح/توكن قبل الحفظ. */
const clip = (v, n) => String(v ?? '').slice(0, n);
const scrub = (s) => s
  .replace(/AIza[0-9A-Za-z_\-]{20,}/g, '[key]')
  .replace(/(bearer\s+)[A-Za-z0-9._\-]{10,}/gi, '$1[token]')
  .replace(/(token|secret|key|password)(["'\s:=]+)[A-Za-z0-9._\-]{12,}/gi, '$1$2[hidden]');

export async function logEvent(sb, { level = 'error', source, message, store_id = null, meta = {} }) {
  try {
    const m = {};
    for (const [k, v] of Object.entries(meta || {}).slice(0, 12)) m[clip(k, 40)] = typeof v === 'object' ? clip(scrub(JSON.stringify(v)), 300) : clip(scrub(v), 300);
    await sb.from('platform_events').insert([{ level, source: clip(source, 40), message: clip(scrub(message), 400), store_id: store_id ? clip(store_id, 60) : null, meta: m }]);
  } catch { /* تجاهل */ }
}
