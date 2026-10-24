'use client';
import { useCallback, useEffect, useState } from 'react';

const read = (k) => { try { const v = JSON.parse(localStorage.getItem(k)); return Array.isArray(v) ? v.map(String) : []; } catch { return []; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* تجاهل */ } };

/* المفضلة: محفوظة في متصفح العميل لكل متجر (بدون تسجيل دخول) */
export function useFavs(slug) {
  const key = `spike_fav_${slug}`;
  const [ids, setIds] = useState([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const sync = () => setIds(read(key));
    sync();
    setReady(true);
    window.addEventListener('spike-fav', sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('spike-fav', sync); window.removeEventListener('storage', sync); };
  }, [key]);
  const toggle = useCallback((id) => {
    const cur = read(key);
    const s = String(id);
    const next = cur.includes(s) ? cur.filter((x) => x !== s) : [s, ...cur].slice(0, 100);
    write(key, next);
    setIds(next);
    window.dispatchEvent(new Event('spike-fav'));
  }, [key]);
  return { ids, ready, has: (id) => ids.includes(String(id)), toggle };
}

/* آخر المنتجات التي شاهدها العميل */
export function readViewed(slug) { return read(`spike_viewed_${slug}`); }
export function pushViewed(slug, id) {
  const key = `spike_viewed_${slug}`;
  const s = String(id);
  write(key, [s, ...read(key).filter((x) => x !== s)].slice(0, 12));
}
