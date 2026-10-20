'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';

/* جرس إشعارات الأدمن: طلبات جديدة وطلبات اشتراك. لحظي (Realtime) مع تحديث دوري احتياطي. */
export default function AdminBell({ isDark, onNewOrder, onOpenTab }) {
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [perm, setPerm] = useState('default');
  const seen = useRef(new Set());
  const first = useRef(true);
  const cbNew = useRef(onNewOrder);
  cbNew.current = onNewOrder;

  const load = useCallback(async () => {
    const { data } = await supabase.from('platform_notifications').select('*').eq('audience', 'admin').order('created_at', { ascending: false }).limit(40);
    const rows = data || [];
    if (!first.current) {
      const fresh = rows.filter((r) => !seen.current.has(r.id) && !r.read);
      if (fresh.length) {
        beep();
        fresh.forEach((r) => { try { if (typeof Notification !== 'undefined' && Notification.permission === 'granted') new Notification(r.title, { body: r.body || '' }); } catch { /* تجاهل */ } });
        if (fresh.some((r) => r.kind === 'new_order') && cbNew.current) cbNew.current();
      }
    }
    rows.forEach((r) => seen.current.add(r.id));
    first.current = false;
    setList(rows);
  }, []);

  const beep = () => {
    try {
      const C = window.AudioContext || window.webkitAudioContext;
      const c = new C(); const o = c.createOscillator(); const g = c.createGain();
      o.connect(g); g.connect(c.destination); o.frequency.value = 880; g.gain.value = 0.08;
      o.start(); setTimeout(() => { o.stop(); c.close(); }, 180);
    } catch { /* تجاهل */ }
  };

  useEffect(() => {
    try { if (typeof Notification !== 'undefined') setPerm(Notification.permission); } catch { /* تجاهل */ }
    load();
    const t = setInterval(load, 30000);
    const ch = supabase.channel('admin-bell').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'platform_notifications', filter: 'audience=eq.admin' }, load).subscribe();
    return () => { clearInterval(t); supabase.removeChannel(ch); };
  }, [load]);

  const unread = list.filter((r) => !r.read).length;
  const markAll = async () => {
    await supabase.from('platform_notifications').update({ read: true }).eq('audience', 'admin').eq('read', false);
    load();
  };
  const enable = async () => {
    try { const p = await Notification.requestPermission(); setPerm(p); } catch { /* تجاهل */ }
  };
  const click = async (r) => {
    if (!r.read) { await supabase.from('platform_notifications').update({ read: true }).eq('id', r.id); load(); }
    if (onOpenTab) onOpenTab(r.kind === 'new_order' ? 'orders' : 'billing');
    setOpen(false);
  };

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(!open)} className={`relative w-9 h-9 rounded-xl border flex items-center justify-center text-sm cursor-pointer ${isDark ? 'border-slate-700 bg-slate-800 text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-700'}`} title="الإشعارات">
        🔔
        {unread > 0 && <span className="absolute -top-1.5 -left-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">{unread > 99 ? '99+' : unread}</span>}
      </button>
      {open && (
        <div className={`absolute top-11 left-0 z-50 w-80 max-w-[90vw] rounded-2xl border shadow-2xl p-3 ${isDark ? 'bg-[#0E1E38] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
          <div className="flex justify-between items-center mb-2">
            <b className="text-sm">الإشعارات</b>
            <button className="text-[11px] text-[#00B050] font-bold cursor-pointer" onClick={markAll}>تعليم الكل كمقروء</button>
          </div>
          {perm !== 'granted' && typeof Notification !== 'undefined' && perm !== 'denied' && (
            <button className="w-full mb-2 py-2 rounded-lg bg-[#00B050] text-white text-xs font-bold cursor-pointer" onClick={enable}>تفعيل إشعارات المتصفح</button>
          )}
          {perm === 'denied' && <p className="text-[10px] text-amber-600 mb-2">إشعارات المتصفح مرفوضة، فعّلها من إعدادات الموقع في المتصفح.</p>}
          <div className="max-h-80 overflow-y-auto space-y-1.5">
            {list.length === 0 && <div className="text-center text-xs text-slate-400 py-6">لا توجد إشعارات</div>}
            {list.map((r) => (
              <button key={r.id} onClick={() => click(r)} className={`w-full text-right p-2.5 rounded-xl border text-xs cursor-pointer ${r.read ? 'border-slate-200/60 dark:border-slate-800 opacity-70' : 'border-[#00B050]/40 bg-[#00B050]/5'}`}>
                <div className="font-bold">{r.kind === 'new_order' ? '📦 ' : '💳 '}{r.title}</div>
                {r.body ? <div className="text-slate-500 dark:text-slate-400 truncate">{r.body}</div> : null}
                <div className="text-[10px] text-slate-400 mt-0.5" dir="ltr">{new Date(r.created_at).toLocaleString()}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
