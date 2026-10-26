'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';

const norm = (v) => String(v == null ? '' : v).toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').trim();
const digits = (v) => String(v || '').replace(/\D/g, '');

/* بحث موحد (Ctrl+K) + جرس تنبيهات الإدارة. كله من البيانات المحمّلة في صفحة الأدمن. */
export default function AdminCommandBar({ stores = [], orders = [], domains = [], tabs = [], isDark, onGo }) {
  const [open, setOpen] = useState(false);
  const [bell, setBell] = useState(false);
  const [q, setQ] = useState('');
  const [cur, setCur] = useState(0);
  const inp = useRef(null);

  useEffect(() => {
    const k = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen(true); }
      if (e.key === 'Escape') { setOpen(false); setBell(false); }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []);
  useEffect(() => { if (open) { setQ(''); setCur(0); setTimeout(() => inp.current?.focus(), 30); } }, [open]);

  const alerts = useMemo(() => {
    const out = [];
    const now = Date.now();
    const subActive = (s) => s.subscription_ends_at && new Date(s.subscription_ends_at).getTime() > now;
    const lowWallet = stores.filter((s) => s.is_active !== false && !subActive(s) && Number(s.free_orders_left || 0) <= 0 && Number(s.wallet_balance_usd || 0) <= 1);
    if (lowWallet.length) out.push({ ic: '💸', t: `${lowWallet.length} متجر رصيده منخفض أو خلص`, d: lowWallet.slice(0, 3).map((s) => s.store_name).join('، '), to: 'merchants' });
    const endSoon = stores.filter((s) => subActive(s) && new Date(s.subscription_ends_at).getTime() - now < 3 * 864e5);
    if (endSoon.length) out.push({ ic: '⏰', t: `${endSoon.length} اشتراك شهري ينتهي خلال 3 أيام`, d: endSoon.slice(0, 3).map((s) => s.store_name).join('، '), to: 'merchants' });
    const off = stores.filter((s) => s.is_active === false).length;
    if (off) out.push({ ic: '⛔', t: `${off} متجر معطّل`, d: 'راجع سبب التعطيل', to: 'merchants' });
    const pend = orders.filter((o) => (o.status || 'pending') === 'pending');
    const old = pend.filter((o) => o.created_at && now - new Date(o.created_at).getTime() > 24 * 36e5);
    if (old.length) out.push({ ic: '🐌', t: `${old.length} طلب معلّق من أكتر من 24 ساعة`, d: 'تأخر التأكيد بيقلل نسبة التسليم', to: 'orders' });
    const dn = domains.filter((d) => !['active', 'verified', 'connected'].includes(String(d.status || '').toLowerCase()));
    if (dn.length) out.push({ ic: '🌐', t: `${dn.length} دومين مخصص غير مفعّل`, d: dn.slice(0, 3).map((d) => d.domain_name).join('، '), to: 'domains' });
    return out;
  }, [stores, orders, domains]);

  const results = useMemo(() => {
    const n = norm(q); const dg = digits(q);
    if (!n) return tabs.slice(0, 8).map((t) => ({ k: 'tab' + t.id, ic: t.icon, t: t.title, s: 'انتقال سريع', to: t.id }));
    const r = [];
    tabs.forEach((t) => { if (norm(t.title).includes(n)) r.push({ k: 'tab' + t.id, ic: t.icon, t: t.title, s: 'تبويب', to: t.id }); });
    stores.forEach((s) => {
      const hay = norm([s.store_name, s.store_slug, s.owner_name, s.email, s.owner_email].join(' '));
      if (hay.includes(n) || (dg.length >= 4 && digits(s.phone || s.owner_phone).includes(dg))) r.push({ k: 's' + s.id, ic: '🏬', t: s.store_name || s.store_slug, s: `متجر · ${s.owner_name || ''} · ${s.store_slug || ''}`, to: 'merchants' });
    });
    orders.forEach((o) => {
      const hay = norm([o.order_no, o.id, o.customer_name].join(' '));
      if (hay.includes(n) || (dg.length >= 4 && digits(o.customer_phone).includes(dg))) r.push({ k: 'o' + o.id, ic: '📦', t: `#${o.order_no || o.id} · ${o.customer_name || ''}`, s: `طلب · ${o.governorate || ''} · ${o.total_price || 0} ج.م · ${o.status || 'pending'}`, to: 'orders' });
    });
    return r.slice(0, 30);
  }, [q, stores, orders, tabs]);

  const go = (to) => { setOpen(false); setBell(false); onGo && onGo(to); };
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCur((c) => Math.min(c + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setCur((c) => Math.max(c - 1, 0)); }
    if (e.key === 'Enter' && results[cur]) go(results[cur].to);
  };

  const btn = isDark ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700' : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100';
  const panel = isDark ? 'bg-[#0E1E38] border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900';
  const hov = isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100';

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition cursor-pointer ${btn}`} title="بحث سريع (Ctrl+K)">
        <span>🔍</span><span className="hidden md:inline">بحث سريع</span><kbd className="hidden md:inline text-[10px] opacity-60 font-mono">Ctrl K</kbd>
      </button>

      <div className="relative">
        <button type="button" onClick={() => setBell((b) => !b)} className={`relative px-3 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${btn}`} title="تنبيهات الإدارة" aria-label="تنبيهات الإدارة">
          <span>🔔</span>
          {alerts.length > 0 && <span className="absolute -top-1.5 -left-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">{alerts.length}</span>}
        </button>
        {bell && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setBell(false)} />
            <div className={`absolute z-50 mt-2 w-[min(340px,92vw)] left-0 rounded-2xl border shadow-2xl p-2 ${panel}`}>
              <div className="px-3 py-2 text-xs font-black">تنبيهات المنصة</div>
              {alerts.length === 0 ? <div className="px-3 py-6 text-center text-xs text-slate-400">✅ مفيش حاجة محتاجة تدخل دلوقتي</div> : alerts.map((a, i) => (
                <button key={i} type="button" onClick={() => go(a.to)} className={`w-full flex gap-3 items-start text-right px-3 py-2.5 rounded-xl transition cursor-pointer ${hov}`}>
                  <span className="text-lg">{a.ic}</span>
                  <span className="flex-1 min-w-0"><b className="block text-xs">{a.t}</b>{a.d ? <small className="block text-[11px] text-slate-400 truncate">{a.d}</small> : null}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-3 bg-black/55 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className={`w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden ${panel}`} onClick={(e) => e.stopPropagation()}>
            <input ref={inp} value={q} onChange={(e) => { setQ(e.target.value); setCur(0); }} onKeyDown={onKey} placeholder="ابحث عن متجر أو طلب أو رقم هاتف أو تبويب..." className={`w-full px-5 py-4 text-sm outline-none bg-transparent border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`} />
            <div className="max-h-[50vh] overflow-y-auto p-2">
              {results.length === 0 ? <div className="p-8 text-center text-xs text-slate-400">مفيش نتائج</div> : results.map((r, i) => (
                <button key={r.k} type="button" onMouseEnter={() => setCur(i)} onClick={() => go(r.to)} className={`w-full flex items-center gap-3 text-right px-3 py-2.5 rounded-xl cursor-pointer ${i === cur ? (isDark ? 'bg-slate-800' : 'bg-slate-100') : ''}`}>
                  <span className="text-lg">{r.ic}</span>
                  <span className="flex-1 min-w-0"><b className="block text-xs truncate">{r.t}</b><small className="block text-[11px] text-slate-400 truncate">{r.s}</small></span>
                </button>
              ))}
            </div>
            <div className="px-4 py-2 text-[10px] text-slate-400 border-t border-slate-200/10 flex gap-4"><span>↑↓ تنقّل</span><span>Enter فتح</span><span>Esc إغلاق</span></div>
          </div>
        </div>
      )}
    </>
  );
}
