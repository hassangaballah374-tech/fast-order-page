/* كاش قصير في ذاكرة السيرفر (لكل نسخة تعمل على Vercel): يقلل رحلات قاعدة البيانات لصفحات المتجر.
   - الطلبات المتزامنة على نفس المفتاح تشارك استعلاماً واحداً.
   - لا يخزّن null ولا الأخطاء.
   - يرجّع نسخة مستقلة في كل مرة فلا يتأثر أحد بتعديل غيره. */
const mem = globalThis.__spikeTtl || (globalThis.__spikeTtl = new Map());
const MAX = 800;

function sweep(now) {
  if (mem.size < MAX) return;
  for (const [k, e] of mem) if (e.exp <= now) mem.delete(k);
  if (mem.size >= MAX) { const n = mem.size - MAX + 100; let i = 0; for (const k of mem.keys()) { mem.delete(k); if (++i >= n) break; } }
}

export async function ttl(key, ms, fn) {
  const now = Date.now();
  const hit = mem.get(key);
  if (hit && hit.exp > now) return clone(await hit.p);
  sweep(now);
  const p = Promise.resolve().then(fn);
  const entry = { p, exp: now + ms };
  mem.set(key, entry);
  try {
    const v = await p;
    if (v === null || v === undefined) { if (mem.get(key) === entry) mem.delete(key); return v; }
    return clone(v);
  } catch (e) {
    if (mem.get(key) === entry) mem.delete(key);
    throw e;
  }
}

function clone(v) {
  if (v === null || typeof v !== 'object') return v;
  try { return structuredClone(v); } catch { return JSON.parse(JSON.stringify(v)); }
}

export function ttlClear(prefix = '') {
  for (const k of mem.keys()) if (!prefix || k.startsWith(prefix)) mem.delete(k);
}
