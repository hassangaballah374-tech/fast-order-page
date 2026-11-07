'use client';
import React, { useEffect, useRef, useState } from 'react';

/* سحب لتحديث الصفحة: بيشتغل على آيفون لما التطبيق يكون مثبّت (هناك مفيش سحب-تحديث من المتصفح).
   أندرويد في وضع التطبيق عنده سحب-تحديث جاهز، فمش بنكرره. */
const TRIGGER = 110;
export default function PullRefresh() {
  const [pull, setPull] = useState(0);
  const [busy, setBusy] = useState(false);
  const st = useRef({ y: 0, x: 0, on: false, max: 0 });

  useEffect(() => {
    if (window.navigator.standalone !== true) return undefined;
    const scrolled = (el) => { for (let n = el; n && n !== document.body; n = n.parentElement) { if (n.scrollTop > 0) return true; } return false; };
    const start = (e) => {
      const t = e.touches[0];
      const tag = (e.target.tagName || '').toLowerCase();
      const blocked = window.scrollY > 0 || document.body.style.overflow === 'hidden' || ['input', 'textarea', 'select'].includes(tag) || scrolled(e.target) || e.target.closest?.('[role="dialog"],[data-no-ptr]');
      st.current = { y: t.clientY, x: t.clientX, on: !blocked, max: 0 };
    };
    const move = (e) => {
      const s = st.current;
      if (!s.on) return;
      const t = e.touches[0];
      const dy = t.clientY - s.y; const dx = Math.abs(t.clientX - s.x);
      if (dy <= 0 || dx > dy) { if (dy <= 0) { s.on = dy === 0; setPull(0); } return; }
      s.max = dy;
      setPull(Math.min(dy * 0.5, 80));
    };
    const end = () => {
      const s = st.current;
      if (!s.on) { setPull(0); return; }
      s.on = false;
      if (s.max >= TRIGGER) { setBusy(true); setPull(56); setTimeout(() => window.location.reload(), 250); } else setPull(0);
    };
    window.addEventListener('touchstart', start, { passive: true });
    window.addEventListener('touchmove', move, { passive: true });
    window.addEventListener('touchend', end, { passive: true });
    window.addEventListener('touchcancel', end, { passive: true });
    return () => { window.removeEventListener('touchstart', start); window.removeEventListener('touchmove', move); window.removeEventListener('touchend', end); window.removeEventListener('touchcancel', end); };
  }, []);

  if (!pull && !busy) return null;
  const ready = pull >= TRIGGER * 0.5 * 0.99;
  return (
    <div aria-hidden="true" style={{ position: 'fixed', top: 'calc(env(safe-area-inset-top, 0px) + 6px)', insetInline: 0, display: 'flex', justifyContent: 'center', zIndex: 2147482500, pointerEvents: 'none', transform: `translateY(${pull - 40}px)`, transition: pull === 0 || busy ? 'transform .2s' : 'none' }}>
      <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#fff', boxShadow: '0 4px 16px rgba(0,0,0,.22)', display: 'grid', placeItems: 'center', color: '#014D6F', fontSize: 18, fontWeight: 800, transform: `rotate(${busy ? 0 : pull * 4}deg)`, opacity: Math.min(1, pull / 30 + (busy ? 1 : 0)) }}>
        {busy ? <span style={{ width: 18, height: 18, border: '3px solid #014D6F', borderTopColor: 'transparent', borderRadius: '50%', display: 'block', animation: 'spkptr .7s linear infinite' }} /> : (ready ? '↻' : '↓')}
      </div>
      <style>{'@keyframes spkptr{to{transform:rotate(360deg)}}'}</style>
    </div>
  );
}
