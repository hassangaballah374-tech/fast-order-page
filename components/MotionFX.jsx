'use client';
import { useEffect } from 'react';

/* ===== حركة "الانسدال" على المنظومة كلها =====
   أي مربع/كارت/خانة/صف يظهر في أي صفحة (داشبورد، أدمن، متجر، صفحات عامة) ينزل من فوق بحركة زنبركية متتابعة،
   سواء عند فتح الصفحة أو أثناء السكرول. يوضع مرة واحدة في app/layout.js. */

const CSS = `
[data-fx="pre"]{opacity:0;transform:translateY(-32px) scaleY(.9);transform-origin:50% 0;filter:blur(6px)}
[data-fx="in"]{animation:fxdrop .85s cubic-bezier(.2,1,.3,1) var(--fxd,0ms) both}
@keyframes fxdrop{
0%{opacity:0;transform:translateY(-32px) scaleY(.9);filter:blur(6px)}
50%{opacity:1;filter:blur(0)}
72%{transform:translateY(5px) scaleY(1.012)}
100%{opacity:1;transform:none;filter:blur(0)}}
@media (prefers-reduced-motion:reduce){[data-fx]{opacity:1!important;transform:none!important;filter:none!important;animation:none!important}}
`;

/* المربعات والكروت (تُحرَّك كوحدة) */
const BOX = [
  '.card', '.kpi', '.stat', '.thm', '.dnt', '.tbl', '.srch', '.tabs', '.steps', '.errbox', '.warn', '.empty', '.hint', '.pls', '.gal',
  '.grid2>*', '.grid3>*', '.grid4>*', '.two>*', '.fgrid>*',
  '.pc', '.ti', '.cat', '.hero', '.sh', '.cartb', '.ft', '.bump',
].join(',');
/* عناصر داخلية (تنزل بعد الكارت الأب بتتابع) */
const INNER = '.fld,tbody tr,.chip,.tg,.sw,.row>*';
/* ما لا يُحرَّك: النوافذ والقوائم الثابتة والشريط الجانبي وصفحات الهبوط (لها نظامها) */
const SKIP = '.lp,.mod,.scrim,.toast,.ov,.side,.top,.stk,.sticky,[role="dialog"],[data-nofx],[class*="sticky"],[class*="fixed"],[class*="modal"],[class*="toast"],[class*="dropdown"]';
const TW_BAD = new Set(['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA', 'LABEL', 'SPAN', 'I', 'IMG', 'SVG', 'TH', 'TD', 'TR', 'LI', 'OPTION', 'B', 'SMALL']);

/* مربعات Tailwind في الأدمن: حواف مدوّرة + حدود/ظل/خلفية + padding */
const isTwBox = (el) => {
  const c = typeof el.className === 'string' ? el.className : '';
  return !!c && !TW_BAD.has(el.tagName) && /rounded-(lg|xl|2xl|3xl)/.test(c) && /(border|shadow|bg-)/.test(c) && /\bp[xy]?-\d/.test(c);
};
const isBox = (el) => el.matches(BOX) || isTwBox(el);

export default function MotionFX() {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return undefined;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    let pending = [];
    let raf = 0;
    const flush = () => {
      raf = 0;
      const list = pending.filter((el) => el.isConnected && el.dataset.fx === 'pre');
      pending = [];
      list.sort((a, b) => {
        const ra = a.getBoundingClientRect(); const rb = b.getBoundingClientRect();
        return Math.round(ra.top / 12) - Math.round(rb.top / 12) || rb.left - ra.left;
      });
      list.forEach((el, i) => {
        const parentBusy = el.parentElement && el.parentElement.closest('[data-fx="in"]');
        el.style.setProperty('--fxd', `${(parentBusy ? 170 : 0) + Math.min(i * 55, 650)}ms`);
        el.dataset.fx = 'in';
        io.unobserve(el);
      });
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) pending.push(e.target); });
      if (pending.length && !raf) raf = requestAnimationFrame(flush);
    }, { threshold: 0.06, rootMargin: '0px 0px -4% 0px' });

    const tag = (el) => {
      if (el.nodeType !== 1 || el.dataset.fx || el.closest(SKIP)) return;
      const box = isBox(el);
      const inner = !box && el.matches(INNER);
      if (!box && !inner) return;
      const anc = el.parentElement && el.parentElement.closest('[data-fx]');
      if (anc && box) return;            /* مربع داخل مربع: الأب يكفي */
      el.dataset.fx = 'pre';
      io.observe(el);
    };
    const scan = (node) => {
      if (node.nodeType !== 1) return;
      tag(node);
      if (node.querySelectorAll) node.querySelectorAll(`${BOX},${INNER},[class*="rounded-"]`).forEach(tag);
    };

    const mo = new MutationObserver((recs) => { recs.forEach((r) => r.addedNodes.forEach(scan)); });
    mo.observe(document.body, { childList: true, subtree: true });
    scan(document.body);

    const onEnd = (e) => {
      const t = e.target;
      if (t && t.dataset && t.dataset.fx === 'in' && e.animationName === 'fxdrop') {
        t.dataset.fx = 'done';
        t.style.removeProperty('--fxd');
      }
    };
    document.addEventListener('animationend', onEnd, true);

    return () => { mo.disconnect(); io.disconnect(); document.removeEventListener('animationend', onEnd, true); if (raf) cancelAnimationFrame(raf); };
  }, []);

  return <style dangerouslySetInnerHTML={{ __html: CSS }} />;
}
