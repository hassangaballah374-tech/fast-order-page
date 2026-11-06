'use client';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useShop } from './StoreContext';
import { useFavs } from './favs';
import { lockScroll } from './scrollLock';
import WaIcon from './WaIcon';
import { safeUrl, waLink, normalizePhone, isValidEgPhone } from '../../lib/storeKit';

/* قائمة الموبايل: زر ☰ أعلى اليمين يفتح شريط جانبي فيه كل التنقل والأقسام والمفضلة والتواصل */
export function useNightMode(slug) {
  const [night, setNight] = useState(false);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const r = document.querySelector('.spk[data-ob]');
    if (!r || r.getAttribute('data-dk0') === '1') return;
    setShow(true);
    setNight(r.getAttribute('data-mode') === 'night');
  }, []);
  const flip = () => {
    const r = document.querySelector('.spk[data-ob]');
    if (!r) return;
    const nx = !night;
    if (nx) { r.setAttribute('data-mode', 'night'); r.setAttribute('data-dk', '1'); } else { r.removeAttribute('data-mode'); r.setAttribute('data-dk', '0'); }
    try { if (nx) localStorage.setItem(`spike_mode_${slug}`, 'night'); else localStorage.removeItem(`spike_mode_${slug}`); } catch { /* تجاهل */ }
    setNight(nx);
  };
  return { show, night, flip };
}

export default function MobileMenu({ nightToggle = true }) {
  const { slug, name, cfg, base, count, pages, categories } = useShop();
  const path = usePathname();
  const favs = useFavs(slug);
  const mode = useNightMode(slug);
  const [open, setOpen] = useState(false);
  const [host, setHost] = useState(null);
  const [q, setQ] = useState('');
  const b = cfg.brand || {};
  const c = cfg.contact || {};
  const social = cfg.social || {};
  const wa = normalizePhone(c.whatsapp);
  const waOk = cfg.whatsapp?.enabled && isValidEgPhone(wa);

  useEffect(() => { setOpen(false); }, [path]);
  /* الشريط بيتعرض داخل جذر المتجر (مش داخل الهيدر) عشان يغطي كل حاجة ويحافظ على ألوان الثيم */
  useEffect(() => { setHost(document.querySelector('.spk[data-ob]') || document.body); }, []);
  useEffect(() => {
    if (!open) return undefined;
    const un = lockScroll();
    const k = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', k);
    return () => { un(); window.removeEventListener('keydown', k); };
  }, [open]);

  const cats = (categories || []).filter((x) => x && x.enabled !== false && x.name);
  const showLooks = cfg.looks?.enabled !== false && (cfg.looks?.items || []).length;
  const showFit = cfg.fitting?.enabled && (cfg.fitting?.models || []).length && Object.keys(cfg.fitting?.items || {}).length;
  const links = [
    [base, '🏠', 'الرئيسية'],
    [`${base}/products`, '🛍️', 'كل المنتجات'],
    [`${base}/favorites`, '♥', 'المفضلة', favs.ids.length],
    [`${base}/cart`, '🛒', 'السلة', count],
    ...(showLooks ? [[`${base}/looks`, '✨', 'الإطلالات']] : []),
    ...(showFit ? [[`${base}/fitting`, '👕', 'غرفة القياس']] : []),
    [`${base}/track`, '📦', 'تتبع طلبك'],
  ];
  const isOn = (h) => (h === base ? path === base : (path || '').startsWith(h));
  const socials = [['instagram', 'إنستجرام'], ['facebook', 'فيسبوك'], ['tiktok', 'تيك توك'], ['youtube', 'يوتيوب']].filter(([k]) => safeUrl(social[k]));
  const go = (e) => {
    e.preventDefault();
    const t = q.trim();
    if (!t) return;
    window.location.href = `${base}/products?q=${encodeURIComponent(t)}`;
  };

  return (
    <>
      <button type="button" className="mm-btn" onClick={() => setOpen(true)} aria-label="القائمة" aria-expanded={open}>
        <i /><i /><i />
      </button>
      {open && host ? createPortal(
        <div className="mm-root">
          <div className="mm-scrim" onClick={() => setOpen(false)} />
          <aside className="mm-pn" role="dialog" aria-modal="true" aria-label="القائمة">
            <div className="mm-top">
              <Link href={base} className="mm-logo">{b.logo ? <img src={b.logo} alt={name} /> : null}<span>{name}</span></Link>
              <button type="button" className="mm-x" onClick={() => setOpen(false)} aria-label="إغلاق">✕</button>
            </div>
            <div className="mm-body">
              <form className="mm-search" onSubmit={go} role="search">
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث عن منتج..." aria-label="بحث" enterKeyHint="search" />
                <button type="submit" aria-label="بحث">🔍</button>
              </form>
              <nav className="mm-links" aria-label="التنقل">
                {links.map(([h, ic, t, n]) => (
                  <Link key={h} href={h} className={isOn(h) ? 'on' : ''}>
                    <span className="mm-ic">{ic}</span><span className="mm-t">{t}</span>
                    {n > 0 ? <span className="mm-n num">{n}</span> : null}
                  </Link>
                ))}
              </nav>
              {cats.length ? (
                <>
                  <div className="mm-h">الأقسام</div>
                  <div className="mm-cats">
                    {cats.map((x) => (
                      <Link key={x.id} href={`${base}/products?cat=${x.id}`}>
                        {x.image ? <img src={x.image} alt="" loading="lazy" /> : <span className="mm-ph">{String(x.name).trim().charAt(0)}</span>}
                        <span>{x.name}</span>
                      </Link>
                    ))}
                  </div>
                </>
              ) : null}
              {(pages || []).length ? (
                <>
                  <div className="mm-h">معلومات</div>
                  <nav className="mm-links sm">
                    {pages.map((p) => <Link key={p.slug} href={`${base}/page/${p.slug}`}><span className="mm-t">{p.title}</span></Link>)}
                  </nav>
                </>
              ) : null}
            </div>
            <div className="mm-ft">
              <div className="mm-row">
                {nightToggle && mode.show ? (
                  <button type="button" className="mm-mode" onClick={mode.flip} aria-label={mode.night ? 'الوضع النهاري' : 'الوضع الليلي'} title={mode.night ? 'الوضع النهاري' : 'الوضع الليلي'}>
                    <span>{mode.night ? '☀️' : '🌙'}</span>
                  </button>
                ) : null}
                {waOk ? <a className="b wa blk mm-wa" href={waLink(wa, cfg.whatsapp.message)} target="_blank" rel="noopener noreferrer"><WaIcon size={18} /> واتساب</a> : null}
                {c.phone ? <a className="mm-call" dir="ltr" href={`tel:${String(c.phone).replace(/[^0-9+]/g, '')}`} aria-label="اتصل بنا" title={c.phone}>📞</a> : null}
              </div>
              {socials.length ? <div className="mm-soc">{socials.map(([k, l]) => <a key={k} href={safeUrl(social[k])} target="_blank" rel="noopener noreferrer">{l}</a>)}</div> : null}
            </div>
          </aside>
        </div>,
        host,
      ) : null}
    </>
  );
}
