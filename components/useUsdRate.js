'use client';
import { useEffect, useState } from 'react';

/* سعر الدولار بالجنيه يتحدّث تلقائياً كل دقيقة */
export function useUsdRate() {
  const [r, setR] = useState({ rate: 0, source: '', at: '' });
  useEffect(() => {
    let off = false;
    const load = async () => {
      try {
        const res = await fetch('/api/rate', { cache: 'no-store' });
        const j = await res.json();
        if (!off && j.rate) setR(j);
      } catch { /* تجاهل */ }
    };
    load();
    const t = setInterval(load, 60000);
    return () => { off = true; clearInterval(t); };
  }, []);
  return r;
}
