'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { MENU } from './menu';

/* شريط التبويبات السفلي للتاجر على الموبايل + شاشة «المزيد» بكل الأقسام */
const IC = {
  home: <><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10v9.5h13V10" /><path d="M10 19.5v-5h4v5" /></>,
  box: <><path d="M12 3 4 7v10l8 4 8-4V7l-8-4Z" /><path d="m4 7 8 4 8-4" /><path d="M12 11v10" /></>,
  tag: <><path d="M3.5 12.5V4.5h8l9 9-8 8-9-9Z" /><circle cx="8" cy="9" r="1.3" /></>,
  bell: <><path d="M6 17.5V11a6 6 0 0 1 12 0v6.5l1.5 1.5h-15L6 17.5Z" /><path d="M10 21h4" /></>,
  more: <><circle cx="5.5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="18.5" cy="12" r="1.6" /></>,
};
const Ico = ({ n }) => <svg viewBox="0 0 24 24" aria-hidden="true">{IC[n]}</svg>;
const TABS = [['stats', 'الرئيسية', 'home'], ['orders', 'الطلبات', 'box'], ['products', 'المنتجات', 'tag'], ['notifs', 'الإشعارات', 'bell']];

const sections = () => MENU.map((m) => {
  if (m.id) return { key: m.id, title: '', items: [{ id: m.id, t: m.t, i: m.i, badge: m.badge }] };
  return { key: m.g || m.h, title: `${m.i ? m.i + ' ' : ''}${m.t || m.h}`, items: (m.items || []).map((x) => ({ id: x.id, t: x.t, i: x.i, badge: x.badge, spike: x.spike })) };
});

export default function DashTabs({ tab, go, uid, lockedId, storeName, logo, storeUrl, dark, toggleDark, onSearch, onLogout, isAdmin, onAdmin }) {
  const [more, setMore] = useState(false);
  const [q, setQ] = useState('');
  const [pending, setPending] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)');
    const apply = () => document.documentElement.style.setProperty('--spk-bar-h', mq.matches ? 'calc(64px + env(safe-area-inset-bottom, 0px))' : '0px');
    apply();
    mq.addEventListener ? mq.addEventListener('change', apply) : mq.addListener(apply);
    return () => { document.documentElement.style.removeProperty('--spk-bar-h'); mq.removeEventListener ? mq.removeEventListener('change', apply) : mq.removeListener(apply); };
  }, []);

  /* عدّاد الطلبات الجديدة (في الانتظار) على أيقونة الطلبات */
  useEffect(() => {
    if (!uid) return undefined;
    let off = false;
    const load = async () => {
      if (document.hidden) return;
      try {
        const { count } = await supabase.from('orders').select('id', { count: 'exact', head: true }).eq('store_id', uid).eq('status', 'pending');
        if (!off && typeof count === 'number') setPending(count);
      } catch { /* بدون عدّاد */ }
    };
    load();
    const t = setInterval(load, 60000);
    document.addEventListener('visibilitychange', load);
    return () => { off = true; clearInterval(t); document.removeEventListener('visibilitychange', load); };
  }, [uid, tab]);

  useEffect(() => {
    if (!more) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const k = (e) => { if (e.key === 'Escape') setMore(false); };
    window.addEventListener('keydown', k);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', k); };
  }, [more]);

  const secs = sections().map((s) => ({ ...s, items: s.items.filter((it) => !lockedId(it.id)) })).filter((s) => s.items.length);
  const term = q.trim();
  const flat = term ? secs.flatMap((s) => s.items.map((it) => ({ ...it, g: s.title }))).filter((it) => it.t.includes(term) || it.g.includes(term) || it.id.includes(term.toLowerCase())) : [];
  const tap = () => { try { navigator.vibrate && navigator.vibrate(6); } catch { /* */ } };
  const inMain = TABS.some(([id]) => id === tab);
  const pick = (id) => { tap(); setMore(false); setQ(''); go(id); };

  const Tile = ({ it }) => (
    <button type="button" className={'dsh-t' + (tab === it.id ? ' act' : '') + ''} onClick={() => pick(it.id)}>
      {it.i ? <span className="dsh-i">{it.i}</span> : null}
      <span className="dsh-x">{it.t}</span>
      {it.badge ? <em>{it.badge}</em> : null}
    </button>
  );

  return (
    <>
      <nav className="dtab" aria-label="التنقل السريع">
        {TABS.filter(([id]) => !lockedId(id)).map(([id, label, ic]) => (
          <button key={id} type="button" className={'dtab-i' + (tab === id ? ' on' : '')} onClick={() => { tap(); go(id); }} aria-current={tab === id ? 'page' : undefined}>
            <Ico n={ic} /><span>{label}</span>
            {id === 'orders' && pending > 0 ? <em className="dtab-b">{pending > 99 ? '99+' : pending}</em> : null}
          </button>
        ))}
        <button type="button" className={'dtab-i' + (more || (!inMain) ? ' on' : '')} onClick={() => { tap(); setMore(true); }} aria-haspopup="dialog"><Ico n="more" /><span>المزيد</span></button>
      </nav>

      {more ? (
        <div className="dsh" role="dialog" aria-modal="true" aria-label="كل الأقسام">
          <div className="dsh-sc" onClick={() => setMore(false)} />
          <div className="dsh-pn">
            <div className="dsh-gr" aria-hidden="true" />
            <div className="dsh-hd">
              <div className="dsh-lg">{logo ? <img src={logo} alt="" /> : (storeName || 'S').trim().charAt(0).toUpperCase()}</div>
              <div className="dsh-nm"><b>{storeName || 'متجري'}</b><small>كل أقسام لوحة التحكم</small></div>
              <button type="button" className="dsh-x2" onClick={() => setMore(false)} aria-label="إغلاق">✕</button>
            </div>
            <div className="dsh-qa">
              {storeUrl ? <a href={storeUrl} target="_blank" rel="noreferrer">🛍️ متجري</a> : null}
              <button type="button" onClick={() => { setMore(false); onSearch(); }}>🔎 بحث</button>
              <button type="button" onClick={toggleDark}>{dark ? '☀️ نهاري' : '🌙 داكن'}</button>
              {isAdmin ? <button type="button" onClick={onAdmin}>🛡️ الإدارة</button> : null}
              <button type="button" className="out" onClick={onLogout}>🚪 خروج</button>
            </div>
            <input className="dsh-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث عن قسم أو إعداد…" aria-label="بحث في الأقسام" />
            {term ? (
              <div className="dsh-gd">{flat.length ? flat.map((it) => <Tile key={it.id} it={it} />) : <p className="dsh-em">لا توجد نتائج</p>}</div>
            ) : (
              secs.filter((s) => s.title).map((s) => (
                <div key={s.key} className="dsh-sec">
                  <h4>{s.title}</h4>
                  <div className="dsh-gd">{s.items.map((it) => <Tile key={it.id} it={{ ...it, i: '' }} />)}</div>
                </div>
              )).concat([
                <div key="single" className="dsh-sec">
                  <h4>عام</h4>
                  <div className="dsh-gd">{secs.filter((s) => !s.title).flatMap((s) => s.items).map((it) => <Tile key={it.id} it={it} />)}</div>
                </div>,
              ])
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
