'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useShop } from './StoreContext';
import { useFavs } from './favs';
import { lockScroll } from './scrollLock';

/* شريط التنقل السفلي للموبايل (زي التطبيقات): الرئيسية · الأقسام · البحث · المفضلة · السلة */
const IC = {
  home: <><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10v9.5h13V10" /><path d="M10 19.5v-5h4v5" /></>,
  grid: <><rect x="4" y="4" width="6.5" height="6.5" rx="1.6" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.2 4.2" /></>,
  heart: <path d="M12 20.2s-7.5-4.6-7.5-10.1A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.5c0 5.5-7.5 10.1-7.5 10.1Z" />,
  bag: <><path d="M5.5 8h13l-1 11.5h-11L5.5 8Z" /><path d="M9 8V6.8a3 3 0 0 1 6 0V8" /></>,
};
const Ico = ({ n }) => <svg viewBox="0 0 24 24" aria-hidden="true">{IC[n]}</svg>;
const HIDE = /\/shop\/[^/]+\/(f|flow|ab|thank-you)(\/|$)/;

export default function BottomNav() {
  const { slug, base, cfg, count, categories } = useShop();
  const path = usePathname() || '';
  const favs = useFavs(slug);
  const [sheet, setSheet] = useState(false);
  const hidden = HIDE.test(path);

  /* ارتفاع الشريط كمتغير عام عشان باقي العناصر (واتساب، شريط الشراء) تتزاح فوقه */
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 699px)');
    const apply = () => document.documentElement.style.setProperty('--spk-bar-h', mq.matches && !hidden ? 'calc(62px + env(safe-area-inset-bottom, 0px))' : '0px');
    apply();
    mq.addEventListener ? mq.addEventListener('change', apply) : mq.addListener(apply);
    return () => { document.documentElement.style.removeProperty('--spk-bar-h'); mq.removeEventListener ? mq.removeEventListener('change', apply) : mq.removeListener(apply); };
  }, [hidden]);

  useEffect(() => { setSheet(false); }, [path]);
  useEffect(() => {
    if (!sheet) return undefined;
    const un = lockScroll();
    const k = (e) => { if (e.key === 'Escape') setSheet(false); };
    window.addEventListener('keydown', k);
    return () => { un(); window.removeEventListener('keydown', k); };
  }, [sheet]);

  if (hidden) return null;

  const tap = () => { try { navigator.vibrate && navigator.vibrate(6); } catch { /* */ } };
  const isHome = path === base || path === `${base}/`;
  const isProducts = path.startsWith(`${base}/products`) || path.startsWith(`${base}/s/`);
  const isFav = path.startsWith(`${base}/favorites`);
  const onCartPage = /\/(cart|checkout)/.test(path);
  const cats = (categories || []).filter((x) => x && x.enabled !== false && x.name);
  const showLooks = cfg.looks?.enabled !== false && (cfg.looks?.items || []).length;
  const showFit = cfg.fitting?.enabled && (cfg.fitting?.models || []).length && Object.keys(cfg.fitting?.items || {}).length;

  const openSearch = () => {
    tap();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.dispatchEvent(new Event('spike:search-open'));
  };
  const openCart = (e) => {
    tap();
    if (cfg.cart?.drawer === false || onCartPage) return;
    e.preventDefault();
    window.dispatchEvent(new Event('spike:cart-open'));
  };

  return (
    <>
      <nav className="bn" aria-label="التنقل السريع">
        <Link href={base} className={'bn-i' + (isHome ? ' on' : '')} onClick={tap} aria-current={isHome ? 'page' : undefined}><Ico n="home" /><span>الرئيسية</span></Link>
        <button type="button" className={'bn-i' + (isProducts || sheet ? ' on' : '')} onClick={() => { tap(); setSheet(true); }} aria-haspopup="dialog"><Ico n="grid" /><span>الأقسام</span></button>
        <button type="button" className="bn-i" onClick={openSearch}><Ico n="search" /><span>بحث</span></button>
        <Link href={`${base}/favorites`} className={'bn-i' + (isFav ? ' on' : '')} onClick={tap}><Ico n="heart" /><span>المفضلة</span>{favs.ids.length > 0 ? <em className="bn-b num">{favs.ids.length > 99 ? '99+' : favs.ids.length}</em> : null}</Link>
        <Link href={`${base}/cart`} className={'bn-i' + (onCartPage ? ' on' : '')} onClick={openCart} aria-label={`السلة${count ? ` (${count})` : ''}`}><Ico n="bag" /><span>السلة</span>{count > 0 ? <em className="bn-b num">{count > 99 ? '99+' : count}</em> : null}</Link>
      </nav>

      {sheet ? (
        <div className="bn-sh" role="dialog" aria-modal="true" aria-label="الأقسام">
          <div className="bn-sc" onClick={() => setSheet(false)} />
          <div className="bn-pn">
            <div className="bn-gr" aria-hidden="true" />
            <div className="bn-hd"><b>تسوّق حسب القسم</b><button type="button" onClick={() => setSheet(false)} aria-label="إغلاق">✕</button></div>
            <div className="bn-cg">
              <Link href={`${base}/products`} className="bn-ct all">كل المنتجات</Link>
              {cats.map((c) => <Link key={c.id} href={`${base}/products?cat=${c.id}`} className="bn-ct">{c.name}</Link>)}
            </div>
            <div className="bn-lk">
              {showLooks ? <Link href={`${base}/looks`}>👗 الإطلالات</Link> : null}
              {showFit ? <Link href={`${base}/fitting`}>🪞 غرفة القياس</Link> : null}
              <Link href={`${base}/track`}>📦 تتبع طلبك</Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
