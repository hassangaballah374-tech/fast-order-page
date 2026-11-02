'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Badge } from './ui';
import { supabase } from '../../lib/supabase';
import { netLevel } from '../../lib/netRisk';

/* سمعة العميل عبر كل متاجر سبايك: يجيب أرقام مجمّعة فقط من دالة network_risk في Supabase.
   لو الدالة لسه ما اتشغلتش (sql/network_risk.sql) بيرجع فاضي من غير أخطاء. */
export function useNetRisk(phones) {
  const cache = useRef(new Map());
  const [, bump] = useState(0);
  const key = [...new Set(phones.filter(Boolean))].sort().join(',');
  useEffect(() => {
    const need = key ? key.split(',').filter((p) => !cache.current.has(p)) : [];
    if (!need.length) return undefined;
    let dead = false;
    (async () => {
      for (let i = 0; i < need.length; i += 300) {
        const part = need.slice(i, i + 300);
        const { data, error } = await supabase.rpc('network_risk', { p_phones: part });
        if (dead) return;
        if (error) { part.forEach((p) => cache.current.set(p, null)); continue; }
        part.forEach((p) => cache.current.set(p, null));
        (data || []).forEach((r) => cache.current.set(r.phone, r));
      }
      if (!dead) bump((n) => n + 1);
    })();
    return () => { dead = true; };
  }, [key]);
  return (phone) => cache.current.get(phone) || null;
}

export function NetBadge({ r }) {
  const lv = netLevel(r);
  if (lv === 'none') return null;
  const high = lv === 'high';
  const t = `${r.returned} مرتجع من ${r.total} طلب${r.bad_stores > 1 ? ` في ${r.bad_stores} متاجر` : ''}`;
  return <span title={t}><Badge c={high ? '#c53030' : '#b7791f'}>{high ? '🚨 خطر عالي عبر سبايك' : '⚠️ سبق له مرتجع'}</Badge></span>;
}
