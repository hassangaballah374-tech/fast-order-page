/* تأثير «الطيران للسلة»: نسخة مصغّرة من صورة المنتج تخرج من مكانها وتطير في قوس لأيقونة السلة، والسلة تنبض عند الوصول.
   بترجع مدة الحركة بالمللي ثانية (0 لو التأثير مش متاح) عشان نأخّر فتح السلة الجانبية لحد ما يخلص. */
export function flyToCart(srcEl, src) {
  try {
    if (typeof document === 'undefined' || !src || !srcEl || !srcEl.getBoundingClientRect) return 0;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 0;
    const target = document.querySelector('.ob-focus [data-fly-target]') || document.querySelector('.spk .cartb');
    if (!target || !target.animate) return 0;
    const from = srcEl.getBoundingClientRect();
    const to = target.getBoundingClientRect();
    if (!from.width || !to.width) return 0;
    const size = Math.max(56, Math.min(120, Math.min(from.width, from.height) * 0.6));
    const sx = from.left + from.width / 2 - size / 2;
    const sy = from.top + from.height / 2 - size / 2;
    const ex = to.left + to.width / 2 - size / 2;
    const ey = to.top + to.height / 2 - size / 2;
    const mx = (sx + ex) / 2;
    const my = Math.min(sy, ey) - 90;
    const el = document.createElement('img');
    el.src = src; el.alt = ''; el.setAttribute('aria-hidden', 'true');
    el.style.cssText = `position:fixed;left:0;top:0;width:${size}px;height:${size}px;object-fit:contain;background:#fff;border-radius:16px;box-shadow:0 12px 30px rgba(0,0,0,.28);z-index:2147483000;pointer-events:none;will-change:transform,opacity;`;
    document.body.appendChild(el);
    const dur = 820;
    const a = el.animate([
      { transform: `translate(${sx}px,${sy}px) scale(1)`, opacity: 1 },
      { transform: `translate(${mx}px,${my}px) scale(.62)`, opacity: 1, offset: 0.45 },
      { transform: `translate(${ex}px,${ey}px) scale(.16)`, opacity: 0.92 },
    ], { duration: dur, easing: 'cubic-bezier(.55,0,.25,1)', fill: 'forwards' });
    const done = () => {
      try { el.remove(); } catch { /* تجاهل */ }
      try { target.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.2)' }, { transform: 'scale(1)' }], { duration: 400, easing: 'ease-out' }); } catch { /* تجاهل */ }
    };
    a.onfinish = done; a.oncancel = done;
    return dur;
  } catch { return 0; }
}
