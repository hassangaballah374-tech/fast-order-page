'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useDash } from './ui';
import { storeState } from './screens/Billing';

const n = (v) => Number(v) || 0;

/* جرس إشعارات التاجر: يحدّث لحظياً ويصدر صوت + إشعار متصفح لو مفعّل */
export function MerchantBell() {
  const { uid, go } = useDash();
  const [unread, setUnread] = useState(0);
  const seen = useRef(null);

  const load = useCallback(async () => {
    if (!uid) return;
    const { data } = await supabase.from('platform_notifications').select('id, title, body, read').eq('audience', String(uid)).order('created_at', { ascending: false }).limit(30);
    const rows = data || [];
    setUnread(rows.filter((r) => !r.read).length);
    if (seen.current) {
      const fresh = rows.filter((r) => !seen.current.has(r.id) && !r.read);
      if (fresh.length) {
        try {
          const C = window.AudioContext || window.webkitAudioContext;
          const c = new C(); const o = c.createOscillator(); const g = c.createGain();
          o.connect(g); g.connect(c.destination); o.frequency.value = 880; g.gain.value = 0.08;
          o.start(); setTimeout(() => { o.stop(); c.close(); }, 180);
        } catch { /* تجاهل */ }
        fresh.forEach((r) => { try { if (typeof Notification !== 'undefined' && Notification.permission === 'granted') new Notification(r.title, { body: r.body || '' }); } catch { /* تجاهل */ } });
      }
    }
    seen.current = new Set(rows.map((r) => r.id));
  }, [uid]);

  useEffect(() => {
    seen.current = null;
    load();
    const t = setInterval(load, 30000);
    const ch = supabase.channel(`mbell-${uid}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'platform_notifications', filter: `audience=eq.${uid}` }, load).subscribe();
    return () => { clearInterval(t); supabase.removeChannel(ch); };
  }, [load, uid]);

  return (
    <button type="button" className="btn" onClick={() => go('notifs')} title="الإشعارات" style={{ position: 'relative' }}>
      🔔
      {unread > 0 && <span style={{ position: 'absolute', top: -6, insetInlineStart: -6, background: '#dc2626', color: '#fff', borderRadius: 999, fontSize: 10, fontWeight: 800, minWidth: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{unread > 99 ? '99+' : unread}</span>}
    </button>
  );
}

/* شريط تنبيه أعلى كل شاشة: غير مفعّل / انتهت الطلبات / انتهى الاشتراك / قرب النفاد */
export function UsageBanner() {
  const { store, go } = useDash();
  if (!store) return null;
  const st = storeState(store);
  const rem = store.orders_quota == null ? null : Math.max(0, n(store.orders_quota) - n(store.orders_used));
  let msg = '';
  let color = '#d97706';
  if (st === 'inactive') msg = 'متجرك لم يُفعَّل بعد من الإدارة. تقدر تبني متجرك وبياناتك، لكن البيع والبكسل متوقفان لحين التفعيل.';
  else if (st === 'quota') { msg = 'انتهت طلبات باقتك، المتجر متوقف عن البيع. جدّد اشتراكك لتشغيله.'; color = '#dc2626'; }
  else if (st === 'expired') { msg = 'انتهى اشتراكك، المتجر متوقف عن البيع. جدّد اشتراكك لتشغيله.'; color = '#dc2626'; }
  else if (rem != null && rem <= 10) msg = `باقي ${rem} طلب فقط في باقتك. جدّد قبل ما المتجر يقف.`;
  if (!msg) return null;
  return (
    <div className="card" style={{ marginBottom: 14, borderColor: color, background: `${color}12` }}>
      <div className="row" style={{ marginBottom: 0 }}>
        <b style={{ color }}>⚠️ {msg}</b>
        <button type="button" className="btn p sm" onClick={() => go('plans')}>الباقات والاشتراك</button>
      </div>
    </div>
  );
}
