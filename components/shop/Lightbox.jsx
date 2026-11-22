'use client';
import React, { useEffect, useRef, useState } from 'react';
import { lockScroll } from './scrollLock';

/* عرض الصورة بملء الشاشة: أسهم/كيبورد/سحب للتنقل، وضغطة للتكبير مع تحريك الصورة بالماوس أو الإصبع. */
export default function Lightbox({ list = [], start = 0, alt = '', onClose }) {
  const [i, setI] = useState(start);
  const [zoom, setZoom] = useState(false);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const t0 = useRef(null);
  const n = list.length;
  const go = (d) => { setZoom(false); setI((v) => (v + d + n) % n); };
  useEffect(() => lockScroll(), []);
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); else if (e.key === 'ArrowLeft') go(1); else if (e.key === 'ArrowRight') go(-1); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }); // eslint-disable-line react-hooks/exhaustive-deps
  const move = (e) => {
    if (!zoom) return;
    const r = e.currentTarget.getBoundingClientRect();
    setPos({ x: Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)), y: Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100)) });
  };
  return (
    <div className="lb" role="dialog" aria-modal="true" aria-label={alt} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <button type="button" className="lb-x" onClick={onClose} aria-label="إغلاق">✕</button>
      {n > 1 ? <button type="button" className="lb-n lb-p" onClick={() => go(-1)} aria-label="السابق">›</button> : null}
      {n > 1 ? <button type="button" className="lb-n lb-nx" onClick={() => go(1)} aria-label="التالي">‹</button> : null}
      <div className={'lb-st' + (zoom ? ' z' : '')} onPointerMove={move}
        onClick={() => setZoom((v) => !v)}
        onTouchStart={(e) => { t0.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => { if (t0.current == null || zoom) return; const d = e.changedTouches[0].clientX - t0.current; t0.current = null; if (Math.abs(d) > 50) go(d < 0 ? 1 : -1); }}>
        <img src={list[i]} alt={`${alt} ${i + 1}`} style={zoom ? { transformOrigin: `${pos.x}% ${pos.y}%` } : undefined} draggable={false} />
      </div>
      <div className="lb-c num" dir="ltr">{i + 1} / {n}{zoom ? '' : ' · اضغط للتكبير'}</div>
    </div>
  );
}
