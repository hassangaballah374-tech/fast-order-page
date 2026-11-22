'use client';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

/* أعداد الأدمن اللي محتاجة تدخل: طلبات الاشتراك/الشحن، طلبات الخدمات، الإشعارات غير المقروءة. */
const cnt = async (q) => { try { const { count } = await q; return count || 0; } catch { return 0; } };

export function useAdminPending() {
  const [c, setC] = useState({});
  const load = useCallback(async () => {
    const [billing, services, notifs] = await Promise.all([
      cnt(supabase.from('plan_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending')),
      cnt(supabase.from('store_service_requests').select('id', { count: 'exact', head: true }).or('status.eq.new,status.is.null')),
      cnt(supabase.from('platform_notifications').select('id', { count: 'exact', head: true }).eq('audience', 'admin').eq('read', false)),
    ]);
    setC({ billing, services, notifs });
  }, []);
  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    let ch = null;
    try {
      ch = supabase.channel(`admin-pending-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'plan_requests' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'store_service_requests' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'platform_notifications' }, load)
      .subscribe();
    } catch { /* التحديث اللحظي اختياري؛ الـ polling كفاية */ }
    return () => { clearInterval(t); try { if (ch) supabase.removeChannel(ch); } catch { /* تجاهل */ } };
  }, [load]);
  return c;
}
