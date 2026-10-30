/* ثيمات صفحات الهبوط: نفس الـ 100 ثيم (ألوان + خط + شخصية + نقش) مترجمة لعناصر صفحة الهبوط .lp-* */
import { patternCss } from './themes100';
import { LP_BASE } from './themeModern';
import { LP_MODERN, LP_MOTION } from './lpMotion';
import { LP_BLOCKS_CSS } from './lpBlocksCss';

const CARD = '& .lp-card,& .lp-bi,& .lp-tc,& .lp-fq,& .lp-guar,& .lp-order .card,& .lp-order .frm';
const IMG = '& .lp-img,& .lp-frame,& .lp-gi';
const BTN = '& .lp-btn';
const H2 = '& .lp-h2,& .lp-cta h2';
const H1 = '& .lp-hero h1';
const BADGE = '& .lp-badge,& .lp-ribbon';

/* يضيف pseudo/hover لكل محدد في قائمة */
const ps = (list, x) => list.split(',').map((q) => q + x).join(',');

const PACKS = {
  clean: '',
  glass: `& .lp-card,& .lp-bi,& .lp-tc,& .lp-fq,& .lp-guar,& .lp-order .card,& .lp-order .frm{background:color-mix(in srgb,var(--lp-bg) 45%,transparent)!important;-webkit-backdrop-filter:blur(16px) saturate(1.5);backdrop-filter:blur(16px) saturate(1.5);border:1px solid color-mix(in srgb,#fff 42%,transparent)!important;box-shadow:0 22px 50px -26px rgba(0,0,0,.4)}
${BTN}{background:linear-gradient(135deg,var(--lp-primary),color-mix(in srgb,var(--lp-primary) 55%,#fff))}
&::before{height:1400px}`,
  luxe: `${H2}{font-weight:600;letter-spacing:1px}${ps(H2,'::after')}{content:'◆';display:block;color:var(--lp-primary);font-size:10px;margin-top:8px}
${CARD},${IMG}{border-radius:2px!important;border:1px solid color-mix(in srgb,var(--lp-primary) 50%,transparent)!important;box-shadow:none!important}
${BTN}{border-radius:0!important;background:transparent;color:var(--lp-primary);border:1px solid var(--lp-primary);box-shadow:none;letter-spacing:1px;animation:none!important}
${ps(BTN,':hover')}{background:var(--lp-primary);color:var(--lp-btn-text)}${ps(BTN,'::after')}{display:none}
${H1}{font-weight:600;letter-spacing:1px}`,
  neon: `${H1},${H2}{text-shadow:0 0 16px color-mix(in srgb,var(--lp-primary) 70%,transparent)}
${CARD},${IMG}{border:1px solid color-mix(in srgb,var(--lp-primary) 65%,transparent)!important;box-shadow:0 0 28px -10px var(--lp-primary)!important}
${BTN}{background:transparent;color:var(--lp-primary);border:1.5px solid var(--lp-primary);box-shadow:0 0 22px -4px var(--lp-primary),inset 0 0 16px -8px var(--lp-primary);text-shadow:0 0 8px var(--lp-primary)}
${ps(BTN,':hover')}{background:var(--lp-primary);color:var(--lp-btn-text);text-shadow:none}${ps(BTN,'::after')}{display:none}`,
  editorial: `${H2}{border-top:3px solid var(--lp-text);border-bottom:1px solid var(--lp-text);padding:10px 0;text-align:start}
${CARD},${IMG}{border-radius:0!important;box-shadow:none!important;border:1px solid var(--lp-text)!important}
${BTN}{border-radius:0!important;box-shadow:none}${H1}{letter-spacing:-1px}`,
  mono: `${CARD}{border:0!important;border-radius:0!important;box-shadow:none!important;background:transparent!important;border-bottom:1px solid var(--lp-line)!important}
${IMG}{border-radius:0!important;box-shadow:none}
${BTN}{border-radius:0!important;background:var(--lp-text);color:var(--lp-bg);box-shadow:none;letter-spacing:1px;font-weight:500;animation:none!important}${ps(BTN,'::after')}{display:none}
${H2}{font-size:15px;letter-spacing:4px;font-weight:500}${H1}{font-weight:500;letter-spacing:-1px}`,
  aurora: `&::before{height:1600px;background:radial-gradient(45% 35% at 10% 0%,color-mix(in srgb,var(--lp-primary) 36%,transparent),transparent 70%),radial-gradient(40% 30% at 100% 20%,color-mix(in srgb,#ff6ad5 26%,transparent),transparent 70%),radial-gradient(50% 40% at 50% 60%,color-mix(in srgb,#35e0ff 20%,transparent),transparent 70%)}
${H1},${H2}{background:linear-gradient(90deg,var(--lp-primary),#ff6ad5);-webkit-background-clip:text;background-clip:text;color:transparent}
${BTN}{background:linear-gradient(135deg,var(--lp-primary),#ff6ad5)}${CARD},${IMG}{border-radius:22px!important}`,
  softui: `${CARD}{background:var(--lp-bg)!important;border:0!important;border-radius:26px!important;box-shadow:9px 9px 18px color-mix(in srgb,var(--lp-text) 16%,transparent),-9px -9px 18px color-mix(in srgb,#fff 80%,transparent)!important}
${IMG}{border-radius:26px!important}
${BTN}{background:var(--lp-bg);color:var(--lp-primary);border:0;border-radius:18px!important;animation:none!important;box-shadow:7px 7px 14px color-mix(in srgb,var(--lp-text) 16%,transparent),-7px -7px 14px color-mix(in srgb,#fff 80%,transparent)}${ps(BTN,'::after')}{display:none}`,
  noir: `& .lp-img img,${IMG}{filter:grayscale(1) contrast(1.1);transition:filter .5s}${ps(IMG,':hover')}{filter:none}
${CARD},${IMG}{border:1px solid var(--lp-line)!important;border-radius:0!important;box-shadow:none!important}
${BTN}{border-radius:0!important;letter-spacing:2px;animation:none!important}${H2}{display:table;margin-inline:auto;font-weight:400;letter-spacing:4px;border-bottom:1px solid var(--lp-primary);padding-bottom:6px}`,
  sunset: `${BTN}{background:linear-gradient(135deg,#ff7a59,var(--lp-primary));border-radius:999px!important}
& .lp-hero{background:linear-gradient(135deg,color-mix(in srgb,#ff7a59 16%,transparent),transparent 60%)}
${CARD},${IMG}{border-radius:24px!important;box-shadow:0 22px 40px -26px var(--lp-primary)!important}
${ps(H2,'::after')}{content:'';display:block;width:56px;height:5px;border-radius:9px;background:linear-gradient(90deg,#ff7a59,var(--lp-primary));margin:8px auto 0}`,
  boutique: `${IMG}{border-radius:999px 999px 14px 14px!important}${CARD}{border-radius:20px!important;box-shadow:none!important;text-align:center}
${BTN}{border-radius:999px!important}${H1},${H2}{font-weight:700}`,
};

const wrap = (id, css) => css.split('&').join(`.lp[data-p="${id}"] `).replace(/(\.lp\[data-p="[a-z]+"\])\s+(\{|::before)/g, '$1$2');
export const lpPackCss = (id) => { const src = LP_MODERN[id] !== undefined ? LP_MODERN[id] : PACKS[id]; return src ? wrap(id, src) : ''; };
export const lpPatternCss = (pat) => {
  const c = patternCss(pat);
  if (!c) return '';
  return c.replace('.spk[data-pat=', '.lp[data-pat=').replace('{background:', '{--ink:var(--lp-text);--c:var(--lp-primary);background:').replace('var(--bg)', 'var(--lp-bg)');
};
export const lpThemeCss = (th) => `${LP_BASE}\n${LP_MOTION}\n${LP_BLOCKS_CSS}\n${lpPackCss(th?.p)}\n${lpPatternCss(th?.pat)}`;

const onColor = (hex) => {
  const m = String(hex).replace('#', ''); const f = m.length === 3 ? m.split('').map((x) => x + x).join('') : m;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16));
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#111111' : '#ffffff';
};
/* من ثيم المتجر إلى إعدادات صفحة الهبوط (تتخزن في page.theme) */
export const lpFromTheme = (t) => ({
  tid: t.id, p: t.p || 'clean', pat: t.pat || 'none', primary: t.color, bg: t.bg, text: t.ink, btn_text: onColor(t.color),
  card: t.dark ? t.card : t.card, radius: Math.min(40, t.radius + 4), font: t.font,
});
