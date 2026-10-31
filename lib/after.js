/* تشغيل شغل في الخلفية بعد ما الرد يوصل للعميل (على Vercel). لو مش متاح بنستنى زي الأول. */
export async function runAfter(promise) {
  const p = Promise.resolve(promise).catch(() => {});
  try {
    const ctx = globalThis[Symbol.for('@vercel/request-context')]?.get?.();
    if (ctx && typeof ctx.waitUntil === 'function') { ctx.waitUntil(p); return; }
  } catch { /* تجاهل */ }
  await p;
}
