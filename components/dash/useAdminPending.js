'use client';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

/* أعداد «اللي محتاج تدخل» للتاجر: بتظهر كأرقام حمرا في القائمة الجانبية. بتتحدّث كل 30 ثانية ولحظياً مع الطلبات والإشعارات. */
const cnt = async (q) => { try { const { count } = await q; return count || 0; } catch { return 0; } };

export function usePending(uid) {
  const [c, setC] = useState({});
  const load = useCallback(async () => {
    if (!uid) return;
    const id = String(uid);
    const [notifs, orders, stockalerts] = await Promise.all([
      cnt(supabase.from('platform_notifications').select('id', { count: 'exact', head: true }).eq('audience', id).eq('read', false)),
      cnt(supabase.from('orders').select('id', { count: 'exact', head: true }).eq('store_id', id).or('status.eq.pending,status.is.null').is('archived_at', null)),
      cnt(supabase.from('stock_alerts').select('id', { count: 'exact', head: true }).eq('store_id', id).eq('notified', false)),
    ]);
    setC({ notifs, orders, stockalerts });
  }, [uid]);
  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    let ch = null;
    try {
      ch = supabase.channel(`pend-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'platform_notifications', filter: `audience=eq.${uid}` }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `store_id=eq.${uid}` }, load)
      .subscribe();
    } catch { /* التحديث اللحظي اختياري؛ الـ polling كفاية */ }
    return () => { clearInterval(t); try { if (ch) supabase.removeChannel(ch); } catch { /* تجاهل */ } };
  }, [load, uid]);
  return c;
}
