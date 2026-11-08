'use client';
import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

/* تسجيل الـ Service Worker + دعوة «ثبّت التطبيق» (أندرويد: زر تثبيت مباشر، آيفون: شرح بسيط) */
const KEY = 'spike_pwa_dismiss';
const safe = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* */ } } };

export default function PwaBoot() {
  const path = usePathname() || '';
  const [evt, setEvt] = useState(null);
  const [ios, setIos] = useState(false);
  const [show, setShow] = useState(false);
  const eligible = path.startsWith('/dashboard') || path.startsWith('/shop/');

  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    const standalone = window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (standalone) return undefined;
    const onPrompt = (e) => { e.preventDefault(); setEvt(e); };
    const onInstalled = () => { setShow(false); setEvt(null); safe.set(KEY, String(Date.now() + 365 * 864e5)); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    const ua = navigator.userAgent || '';
    const isIos = /iphone|ipad|ipod/i.test(ua) && /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
    setIos(isIos);
    return () => { window.removeEventListener('beforeinstallprompt', onPrompt); window.removeEventListener('appinstalled', onInstalled); };
  }, []);

  /* نظهر الدعوة بعد 12 ثانية استخدام، ومرة كل أسبوع لو اتقفلت */
  useEffect(() => {
    if (!eligible || (!evt && !ios)) return undefined;
    if (Number(safe.get(KEY) || 0) > Date.now()) return undefined;
    const t = setTimeout(() => setShow(true), 12000);
    return () => clearTimeout(t);
  }, [eligible, evt, ios]);

  if (!show || !eligible) return null;
  const isShop = path.startsWith('/shop/');
  const name = isShop ? (document.title.split('|').pop() || '').trim() || 'المتجر' : 'سبايك';
  const close = () => { safe.set(KEY, String(Date.now() + 7 * 864e5)); setShow(false); };
  const install = async () => {
    if (!evt) return;
    try { evt.prompt(); await evt.userChoice; } catch { /* */ }
    setEvt(null); close();
  };
  return (
    <div role="dialog" aria-label="تثبيت التطبيق" dir="rtl" style={{ position: 'fixed', insetInline: 12, bottom: 'calc(var(--spk-bar-h, 0px) + env(safe-area-inset-bottom, 0px) + 12px)', zIndex: 2147482000, maxWidth: 440, marginInline: 'auto', background: '#0F2A3D', color: '#fff', borderRadius: 18, padding: '14px 14px 14px 12px', boxShadow: '0 12px 40px rgba(0,0,0,.35)', display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'inherit' }}>
      <img src="/brand/icon-192.png?v=2" alt="" width={44} height={44} style={{ borderRadius: 12, background: '#fff', objectFit: 'contain', flex: 'none' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <b style={{ display: 'block', fontSize: 15 }}>ثبّت تطبيق {name}</b>
        <span style={{ fontSize: 12.5, opacity: .8, lineHeight: 1.6, display: 'block' }}>
          {evt ? 'يفتح بسرعة من الشاشة الرئيسية زي أي تطبيق.' : <>اضغط زر المشاركة <span aria-hidden="true">⬆️</span> ثم «إضافة إلى الشاشة الرئيسية».</>}
        </span>
      </div>
      {evt ? <button type="button" onClick={install} style={{ flex: 'none', border: 0, background: '#fff', color: '#0F2A3D', fontWeight: 800, fontSize: 14, borderRadius: 12, padding: '0 16px', minHeight: 44, cursor: 'pointer' }}>تثبيت</button> : null}
      <button type="button" onClick={close} aria-label="إغلاق" style={{ flex: 'none', border: 0, background: 'transparent', color: '#fff', fontSize: 20, width: 44, height: 44, cursor: 'pointer', opacity: .8 }}>✕</button>
    </div>
  );
}
