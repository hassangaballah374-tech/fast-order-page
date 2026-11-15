'use client';
import { useEffect, useState } from 'react';

/* ناقل بسيط بين زر الشماعة على الكروت ونافذة التلبيس (TryOnDock): الاختيارات محفوظة في sessionStorage لكل متجر */
export const tryKey = (slug) => `spk_tryon_${slug}`;
export function readTry(slug) {
  try { const v = JSON.parse(sessionStorage.getItem(tryKey(slug)) || 'null'); return v && Array.isArray(v.picks) ? v : { picks: [], img: '', key: '' }; } catch { return { picks: [], img: '', key: '' }; }
}
export function writeTry(slug, v) {
  try { sessionStorage.setItem(tryKey(slug), JSON.stringify(v)); } catch { /* الصورة كبيرة؟ نحفظ الاختيارات بس */
    try { sessionStorage.setItem(tryKey(slug), JSON.stringify({ picks: v.picks, img: '', key: '' })); } catch { /* تجاهل */ }
  }
  try { window.dispatchEvent(new CustomEvent('spike:tryon-state')); } catch { /* تجاهل */ }
}
/* detail: { id, title, img, rect? } */
export function toggleTry(detail) { try { window.dispatchEvent(new CustomEvent('spike:tryon', { detail })); } catch { /* تجاهل */ } }

export function useTryIds(slug) {
  const [ids, setIds] = useState([]);
  useEffect(() => {
    const sync = () => setIds(readTry(slug).picks.map((p) => String(p.id)));
    sync();
    window.addEventListener('spike:tryon-state', sync);
    return () => window.removeEventListener('spike:tryon-state', sync);
  }, [slug]);
  return ids;
}
