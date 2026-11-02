/* أدوات الفانل في المتصفح */
export function flowHit(slug, flowSlug, step, event) {
  try {
    fetch('/api/store/flow', { method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true, body: JSON.stringify({ slug, flow: flowSlug, step, event }) });
  } catch { /* تجاهل */ }
}

/* الانتقال لخطوة تانية بعد ما نسجّل الإحصائية */
export function goTo(url) {
  try { window.location.assign(url); } catch { /* تجاهل */ }
}

/* آخر طلب متخزن في الجلسة */
export const readLast = (slug) => { try { return JSON.parse(sessionStorage.getItem(`spike_last_${slug}`)); } catch { return null; } };
export const writeLast = (slug, v) => { try { sessionStorage.setItem(`spike_last_${slug}`, JSON.stringify(v)); } catch { /* تجاهل */ } };
