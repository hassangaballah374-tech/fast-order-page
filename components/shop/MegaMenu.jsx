'use client';
import { useT } from '../I18n';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useShop } from './StoreContext';

/* قائمة «الأقسام» الكبيرة في الهيدر (ديسكتوب): بتفتح بالماوس أو الضغط أو الكيبورد، وفيها أقسام المتجر بصورها */
export default function MegaMenu() {
  const tx = useT();
  const { base, categories } = useShop();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const t = useRef(0);
  const root = useRef(null);
  const cats = (categories || []).filter((x) => x && x.enabled !== false && x.name);

  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => {
    if (!open) return undefined;
    const k = (e) => { if (e.key === 'Escape') setOpen(false); };
    const away = (e) => { if (root.current && !root.current.contains(e.target)) setOpen(false); };
    document.addEventListener('keydown', k);
    document.addEventListener('mousedown', away);
    return () => { document.removeEventListener('keydown', k); document.removeEventListener('mousedown', away); };
  }, [open]);
  useEffect(() => () => clearTimeout(t.current), []);

  if (!cats.length) return null;
  const enter = () => { clearTimeout(t.current); t.current = setTimeout(() => setOpen(true), 90); };
  const leave = () => { clearTimeout(t.current); t.current = setTimeout(() => setOpen(false), 160); };

  return (
    <span className="mg" ref={root} onMouseEnter={enter} onMouseLeave={leave}>
      <button type="button" className={'mg-b' + (open ? ' on' : '')} aria-expanded={open} aria-haspopup="true" onClick={() => setOpen((v) => !v)}>
        {tx('الأقسام')} <i aria-hidden="true">▾</i>
      </button>
      {open ? (
        <div className="mega" role="menu">
          <div className="mega-g">
            {cats.slice(0, 12).map((c) => (
              <Link key={c.id} href={`${base}/products?cat=${c.id}`} className="mega-c" role="menuitem" onClick={() => setOpen(false)}>
                <span className="mega-i">{c.image ? <img src={c.image} alt="" loading="lazy" /> : <b>{String(c.name).slice(0, 1)}</b>}</span>
                <span className="mega-n">{c.name}</span>
              </Link>
            ))}
          </div>
          <Link href={`${base}/products`} className="mega-all" onClick={() => setOpen(false)}>{tx('عرض كل المنتجات ←')}</Link>
        </div>
      ) : null}
    </span>
  );
}
