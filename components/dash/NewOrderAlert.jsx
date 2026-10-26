'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useDash } from './ui';
import { money } from '../../lib/storeKit';

const LS = 'spike_order_sound';
const getPref = () => { try { return localStorage.getItem(LS) !== '0'; } catch { return true; } };

/* تنبيه لحظي بالطلبات الجديدة: صوت + كارت منبثق + عنوان التبويب. يعمل بالـ Realtime مع فحص احتياطي كل 30 ثانية. */
export default function NewOrderAlert() {
  const { uid, go, cur } = useDash();
  const [on, setOn] = useState(true);
  const [items, setItems] = useState([]);
  const seen = useRef(new Set());
  const last = useRef(new Date().toISOString());
  const onRef = useRef(true);
  const ctx = useRef(null);
  const title0 = useRef('');

  useEffect(() => { const p = getPref(); setOn(p); onRef.current = p; title0.current = document.title; }, []);

  const chime = useCallback(() => {
    if (!onRef.current) return;
    try {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!ctx.current) ctx.current = new C();
      const c = ctx.current;
      if (c.state === 'suspended') c.resume();
      [[784, 0], [1047, 0.16]].forEach(([f, t]) => {
        const o = c.createOscillator(); const g = c.createGain();
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, c.currentTime + t);
        g.gain.exponentialRampToValueAtTime(0.12, c.currentTime + t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + t + 0.3);
        o.connect(g); g.connect(c.destination);
        o.start(c.currentTime + t); o.stop(c.currentTime + t + 0.32);
      });
    } catch { /* تجاهل */ }
  }, []);

  const push = useCallback((o) => {
    if (!o || seen.current.has(o.id)) return;
    seen.current.add(o.id);
    if (o.created_at && o.created_at > last.current) last.current = o.created_at;
    chime();
    setItems((l) => [{ id: o.id, no: o.order_no || o.id, name: o.customer_name || 'عميل', gov: o.governorate || '', total: Number(o.total_price) || 0 }, ...l].slice(0, 4));
    setTimeout(() => setItems((l) => l.filter((x) => x.id !== o.id)), 10000);
    try {
      if (document.hidden) {
        document.title = `🔔 طلب جديد · ${title0.current}`;
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && onRef.current) new Notification('طلب جديد 🛍️', { body: `${o.customer_name || 'عميل'} · ${Math.round(Number(o.total_price) || 0)}` });
      }
    } catch { /* تجاهل */ }
  }, [chime]);

  useEffect(() => {
    const f = () => { if (!document.hidden && title0.current) document.title = title0.current; };
    document.addEventListener('visibilitychange', f);
    return () => document.removeEventListener('visibilitychange', f);
  }, []);

  useEffect(() => {
    if (!uid) return undefined;
    const poll = async () => {
      const { data } = await supabase.from('orders').select('id, order_no, customer_name, governorate, total_price, created_at').eq('store_id', uid).gt('created_at', last.current).order('created_at', { ascending: true }).limit(10);
      (data || []).forEach(push);
    };
    const t = setInterval(poll, 30000);
    const ch = supabase.channel(`neworder-${uid}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders', filter: `store_id=eq.${uid}` }, (p) => push(p.new)).subscribe();
    return () => { clearInterval(t); supabase.removeChannel(ch); };
  }, [uid, push]);

  const toggle = () => {
    const nx = !on;
    setOn(nx); onRef.current = nx;
    try { localStorage.setItem(LS, nx ? '1' : '0'); } catch { /* تجاهل */ }
    if (nx) {
      chime();
      try { if (typeof Notification !== 'undefined' && Notification.permission === 'default') Notification.requestPermission(); } catch { /* تجاهل */ }
    }
  };

  return (
    <>
      <button type="button" className="btn" onClick={toggle} title={on ? 'إيقاف صوت الطلبات الجديدة' : 'تشغيل صوت الطلبات الجديدة'} aria-label="صوت الطلبات الجديدة">{on ? '🔊' : '🔇'}</button>
      <div className="noa-stack" aria-live="polite">
        {items.map((x) => (
          <div className="noa" key={x.id}>
            <i>🛍️</i>
            <div className="noa-b"><b>طلب جديد #{x.no}</b><span>{x.name}{x.gov ? ` · ${x.gov}` : ''}</span><em className="num">{money(x.total, cur)}</em></div>
            <button type="button" className="btn p sm" onClick={() => { setItems((l) => l.filter((y) => y.id !== x.id)); go('orders'); }}>فتح</button>
          </div>
        ))}
      </div>
      <style>{`
        .noa-stack{position:fixed;top:70px;inset-inline-start:16px;z-index:80;display:grid;gap:8px;width:min(340px,calc(100vw - 32px));pointer-events:none}
        .noa{pointer-events:auto;display:flex;align-items:center;gap:10px;background:var(--s);color:var(--ink);border:1px solid var(--b);border-radius:16px;padding:10px 12px;box-shadow:0 18px 40px -18px rgba(6,73,78,.55);animation:noain .35s cubic-bezier(.2,.8,.2,1)}
        .noa i{font-style:normal;font-size:24px}
        .noa-b{flex:1;min-width:0;display:flex;flex-direction:column;font-size:13px;line-height:1.35}
        .noa-b span{color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .noa-b em{font-style:normal;font-weight:800;color:var(--b)}
        @keyframes noain{from{opacity:0;transform:translateY(-12px) scale(.96)}}
        @media(prefers-reduced-motion:reduce){.noa{animation:none}}
      `}</style>
    </>
  );
}
