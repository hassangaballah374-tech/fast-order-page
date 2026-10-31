'use client';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const Ctx = createContext(null);
export const useShop = () => useContext(Ctx);

const read = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* تجاهل */ } };

export const lineKey = (pid, options) => `${pid}|${Object.keys(options || {}).sort().map((k) => `${k}=${options[k]}`).join(';')}`;

/* ---------- UTM والإحالة: آخر مصدر خلال 30 يوم ---------- */
export function captureUtm(slug) {
  try {
    const p = new URLSearchParams(window.location.search);
    const got = {};
    for (const [k, q] of [['source', 'utm_source'], ['medium', 'utm_medium'], ['campaign', 'utm_campaign'], ['content', 'utm_content'], ['ref', 'ref']]) {
      const v = p.get(q);
      if (v) got[k] = String(v).slice(0, 80);
    }
    if (Object.keys(got).length) write(`spike_utm_${slug}`, { ...got, at: Date.now() });
  } catch { /* تجاهل */ }
}

export function getUtm(slug) {
  const u = read(`spike_utm_${slug}`, null);
  if (!u || Date.now() - (u.at || 0) > 30 * 86400000) return {};
  const { at, ...rest } = u;
  return rest;
}

export function StoreProvider({ slug, name, cfg, pages, categories, zones, live = true, reason = 'ok', children }) {
  const base = `/shop/${slug}`;
  const ckey = `spike_cart_${slug}`;
  const bkey = `spike_bump_${slug}`;
  const [cart, setCartState] = useState([]);
  const [bump, setBumpState] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setCartState(read(ckey, []));
    setBumpState(read(bkey, null));
    setReady(true);
  }, [ckey, bkey]);

  useEffect(() => {
    const f = (e) => {
      if (e.key === ckey) setCartState(read(ckey, []));
      if (e.key === bkey) setBumpState(read(bkey, null));
    };
    window.addEventListener('storage', f);
    return () => window.removeEventListener('storage', f);
  }, [ckey, bkey]);

  const commit = useCallback((next) => { setCartState(next); write(ckey, next); }, [ckey]);

  const add = useCallback((item) => {
    const list = read(ckey, []);
    const key = lineKey(item.product_id, item.options);
    const i = list.findIndex((x) => x.key === key);
    const qty = Math.max(1, Math.min(50, parseInt(item.qty, 10) || 1));
    if (i >= 0) list[i] = { ...list[i], qty: Math.min(50, list[i].qty + qty), price: item.price };
    else list.push({ key, product_id: String(item.product_id), title: item.title, image: item.image || '', price: Number(item.price) || 0, qty, options: item.options || {} });
    commit(list);
  }, [ckey, commit]);

  const setQty = useCallback((key, qty) => {
    const q = Math.max(1, Math.min(50, parseInt(qty, 10) || 1));
    commit(read(ckey, []).map((x) => (x.key === key ? { ...x, qty: q } : x)));
  }, [ckey, commit]);

  const remove = useCallback((key) => commit(read(ckey, []).filter((x) => x.key !== key)), [ckey, commit]);
  const clear = useCallback(() => { commit([]); setBumpState(null); write(bkey, null); }, [commit, bkey]);
  const setBump = useCallback((b) => { setBumpState(b); write(bkey, b); }, [bkey]);

  const count = cart.reduce((a, x) => a + (Number(x.qty) || 0), 0);
  const value = useMemo(() => ({
    slug, name, cfg, base, cur: cfg.currency || 'ج.م', pages, categories, zones,
    cart, count, add, setQty, remove, clear, bump, setBump, ready, live, reason,
  }), [slug, name, cfg, base, pages, categories, zones, live, reason, cart, count, add, setQty, remove, clear, bump, setBump, ready]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/* نداءات خفيفة للـ API العام (لا تُظهر أخطاء للعميل).
   الأحداث اللي بتحصل في نفس اللحظة (زيارة + مشاهدة منتج مثلاً) بتتجمع في طلب واحد */
const hq = { list: [], slug: '', t: null };
function flushHits() {
  const { list, slug } = hq;
  hq.list = []; hq.t = null;
  if (!list.length) return;
  try {
    fetch('/api/store/hit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(list.length === 1 ? { slug, ...list[0] } : { slug, events: list }), keepalive: true });
  } catch { /* تجاهل */ }
}
export function hit(slug, event, extra = {}) {
  try {
    if (hq.slug && hq.slug !== slug) flushHits();
    hq.slug = slug;
    hq.list.push({ event, ...extra });
    if (hq.list.length >= 6) { clearTimeout(hq.t); flushHits(); return; }
    if (!hq.t) hq.t = setTimeout(flushHits, 80);
    if (typeof document !== 'undefined' && !hq.bound) {
      hq.bound = true;
      const now = () => { clearTimeout(hq.t); flushHits(); };
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') now(); });
      window.addEventListener('pagehide', now);
    }
  } catch { /* تجاهل */ }
}
