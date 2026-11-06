/* قفل الميزات من الأدمن: تتخزن في platform_kv تحت المفتاح feature_locks:
   { global:[ids المقفولة لكل التجار], stores:{ [userId]: { lock:[ids مقفولة لهذا التاجر], allow:[ids مفتوحة له رغم قفلها عند الجميع] } } }
   «الرئيسية» و«الإعدادات» ما تتقفلش أبداً. */
export const LOCKS_KEY = 'feature_locks';
export const NEVER_LOCK = ['stats', 'settings'];
export const EMPTY_LOCKS = { global: [], stores: {} };

const arr = (v) => (Array.isArray(v) ? v.map(String) : []);

export function parseLocks(value) {
  try {
    const j = typeof value === 'string' ? JSON.parse(value) : value;
    if (!j || typeof j !== 'object') return EMPTY_LOCKS;
    const stores = {};
    for (const [k, v] of Object.entries(j.stores || {})) {
      const lock = arr(v && v.lock); const allow = arr(v && v.allow);
      if (lock.length || allow.length) stores[String(k)] = { lock, allow };
    }
    return { global: arr(j.global), stores };
  } catch { return EMPTY_LOCKS; }
}

/* هل الشاشة مقفولة لهذا التاجر؟ (استثناء التاجر بيغلب الإعداد العام) */
export function isLocked(locks, id, uid) {
  if (!id || NEVER_LOCK.includes(id) || !locks) return false;
  const s = (locks.stores || {})[String(uid)];
  if (s) {
    if ((s.allow || []).includes(id)) return false;
    if ((s.lock || []).includes(id)) return true;
  }
  return (locks.global || []).includes(id);
}

/* حالة الشاشة لتاجر معين للعرض في الأدمن: 'default' | 'open' | 'locked' */
export function storeState(locks, id, uid) {
  const s = (locks.stores || {})[String(uid)] || {};
  if ((s.allow || []).includes(id)) return 'open';
  if ((s.lock || []).includes(id)) return 'locked';
  return 'default';
}

export function cleanLocks(l) {
  const out = parseLocks(l);
  out.global = [...new Set(out.global.filter((x) => !NEVER_LOCK.includes(x)))];
  for (const k of Object.keys(out.stores)) {
    out.stores[k] = { lock: [...new Set(out.stores[k].lock.filter((x) => !NEVER_LOCK.includes(x)))], allow: [...new Set(out.stores[k].allow)] };
    if (!out.stores[k].lock.length && !out.stores[k].allow.length) delete out.stores[k];
  }
  return out;
}
