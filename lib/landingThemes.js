/* ثيمات صفحات الهبوط: نفس الـ 100 ثيم (ألوان + خط + شخصية + نقش) مترجمة لعناصر صفحة الهبوط .lp-* */
import { patternCss } from './themes100';

const CARD = '& .lp-card,& .lp-bi,& .lp-tc,& .lp-fq,& .lp-guar,& .lp-order .card,& .lp-order .frm';
const IMG = '& .lp-img,& .lp-frame,& .lp-gi';
const BTN = '& .lp-btn';
const H2 = '& .lp-h2,& .lp-cta h2';
const H1 = '& .lp-hero h1';
const BADGE = '& .lp-badge,& .lp-ribbon';

const PACKS = {
  clean: '',
  brutal: `${CARD},${IMG},${BTN}{border:3px solid var(--lp-text)!important;border-radius:0!important;box-shadow:6px 6px 0 var(--lp-text)!important}
${BTN}{text-transform:uppercase;font-weight:900;animation:none!important}${BTN}::after{display:none}
${H2}{display:table;margin-inline:auto;background:var(--lp-primary);color:var(--lp-btn-text);padding:4px 18px;border:3px solid var(--lp-text);box-shadow:5px 5px 0 var(--lp-text)}
${BADGE}{border-radius:0;border:2px solid var(--lp-text)}`,
  glass: `& .lp-card,& .lp-bi,& .lp-tc,& .lp-fq,& .lp-guar,& .lp-order .card,& .lp-order .frm{background:color-mix(in srgb,var(--lp-bg) 45%,transparent)!important;-webkit-backdrop-filter:blur(16px) saturate(1.5);backdrop-filter:blur(16px) saturate(1.5);border:1px solid color-mix(in srgb,#fff 42%,transparent)!important;box-shadow:0 22px 50px -26px rgba(0,0,0,.4)}
${BTN}{background:linear-gradient(135deg,var(--lp-primary),color-mix(in srgb,var(--lp-primary) 55%,#fff))}
&::before{height:1400px}`,
  luxe: `${H2}{font-weight:600;letter-spacing:1px}${H2}::after{content:'◆';display:block;color:var(--lp-primary);font-size:10px;margin-top:8px}
${CARD},${IMG}{border-radius:2px!important;border:1px solid color-mix(in srgb,var(--lp-primary) 50%,transparent)!important;box-shadow:none!important}
${BTN}{border-radius:0!important;background:transparent;color:var(--lp-primary);border:1px solid var(--lp-primary);box-shadow:none;letter-spacing:1px;animation:none!important}
${BTN}:hover{background:var(--lp-primary);color:var(--lp-btn-text)}${BTN}::after{display:none}
${H1}{font-weight:600;letter-spacing:1px}`,
  neon: `${H1},${H2}{text-shadow:0 0 16px color-mix(in srgb,var(--lp-primary) 70%,transparent)}
${CARD},${IMG}{border:1px solid color-mix(in srgb,var(--lp-primary) 65%,transparent)!important;box-shadow:0 0 28px -10px var(--lp-primary)!important}
${BTN}{background:transparent;color:var(--lp-primary);border:1.5px solid var(--lp-primary);box-shadow:0 0 22px -4px var(--lp-primary),inset 0 0 16px -8px var(--lp-primary);text-shadow:0 0 8px var(--lp-primary)}
${BTN}:hover{background:var(--lp-primary);color:var(--lp-btn-text);text-shadow:none}${BTN}::after{display:none}`,
  editorial: `${H2}{border-top:3px solid var(--lp-text);border-bottom:1px solid var(--lp-text);padding:10px 0;text-align:start}
${CARD},${IMG}{border-radius:0!important;box-shadow:none!important;border:1px solid var(--lp-text)!important}
${BTN}{border-radius:0!important;box-shadow:none}${H1}{letter-spacing:-1px}`,
  pastel: `${CARD}{border-radius:28px!important;border:2px solid color-mix(in srgb,var(--lp-primary) 28%,transparent)!important;box-shadow:0 14px 0 -8px color-mix(in srgb,var(--lp-primary) 24%,transparent)}
${IMG}{border-radius:30px!important}
${BTN}{border-radius:999px!important;box-shadow:0 8px 0 -2px color-mix(in srgb,var(--lp-primary) 62%,#000);animation:none!important}${BTN}::after{display:none}
${H2}::before{content:'✿ ';color:var(--lp-primary)}${BADGE}{border-radius:999px}`,
  retro: `${CARD},${IMG}{border:2px solid var(--lp-text)!important;border-radius:14px!important;box-shadow:5px 5px 0 var(--lp-primary)!important}
${BTN}{border:2px solid var(--lp-text);border-radius:10px!important;box-shadow:3px 3px 0 var(--lp-text);animation:none!important}${BTN}::after{display:none}
${H2}{display:table;margin-inline:auto;transform:rotate(-1.5deg);background:var(--lp-primary);color:var(--lp-btn-text);padding:3px 20px;border-radius:6px}`,
  mono: `${CARD}{border:0!important;border-radius:0!important;box-shadow:none!important;background:transparent!important;border-bottom:1px solid var(--lp-line)!important}
${IMG}{border-radius:0!important;box-shadow:none}
${BTN}{border-radius:0!important;background:var(--lp-text);color:var(--lp-bg);box-shadow:none;letter-spacing:1px;font-weight:500;animation:none!important}${BTN}::after{display:none}
${H2}{font-size:15px;letter-spacing:4px;font-weight:500}${H1}{font-weight:500;letter-spacing:-1px}`,
  organic: `${CARD}{border-radius:38px 8px 38px 8px!important;box-shadow:0 18px 30px -22px color-mix(in srgb,var(--lp-primary) 70%,#000)}
${IMG}{border-radius:56px 10px 56px 10px!important}${BTN}{border-radius:999px 12px 999px 12px!important}
${H2}::after{content:' 🌿'}`,
  tech: `${CARD},${IMG}{border:1px solid var(--lp-line)!important;border-radius:4px!important;box-shadow:none!important;position:relative}
${BTN}{border-radius:3px!important;letter-spacing:1px;font-size:16px}
${H2}::before{content:'// ';color:var(--lp-primary);font-family:monospace}${H1}{font-family:'IBM Plex Sans Arabic',inherit,monospace}`,
  candy: `${BTN}{background:linear-gradient(135deg,var(--lp-primary),color-mix(in srgb,var(--lp-primary) 40%,#ff7ad9));border-radius:999px!important}
${CARD},${IMG}{border-radius:24px!important}& .lp-bi:hover,& .lp-tc:hover{transform:translateY(-6px) rotate(-1deg)}
${H2},${H1}{background:linear-gradient(90deg,var(--lp-primary),color-mix(in srgb,var(--lp-primary) 40%,#ff7ad9));-webkit-background-clip:text;background-clip:text;color:transparent}
${BADGE}{transform:rotate(-6deg)}`,
  royal: `${CARD},${IMG}{border:1px solid var(--lp-primary)!important;outline:1px solid color-mix(in srgb,var(--lp-primary) 30%,transparent);outline-offset:-6px;border-radius:6px!important;box-shadow:none!important}
${H2}::before,${H2}::after{content:'❖';color:#d4af37;margin:0 10px;font-size:14px}${H2}{color:var(--lp-primary)}
${BTN}{border-radius:4px!important;border:1px solid #d4af37}`,
  sport: `${H1},${H2}{font-style:italic;font-weight:900}
${CARD}{border-radius:0!important;clip-path:polygon(0 0,100% 0,100% calc(100% - 18px),calc(100% - 18px) 100%,0 100%);border:0!important;box-shadow:none!important;border-inline-start:6px solid var(--lp-primary)!important}
${BTN}{border-radius:0!important;transform:skewX(-10deg);font-style:italic}${IMG}{border-radius:0!important}
${H2}{border-inline-start:8px solid var(--lp-primary);padding-inline-start:12px;text-align:start}`,
  kids: `${CARD},${IMG}{border:3px solid var(--lp-text)!important;border-radius:26px!important;box-shadow:0 6px 0 var(--lp-text)!important}
${BTN}{border:3px solid var(--lp-text);border-radius:999px!important;box-shadow:0 5px 0 var(--lp-text);animation:none!important}${BTN}::after{display:none}
${H2}{display:table;margin-inline:auto;transform:rotate(-1deg)}${BADGE}{background:#ffb020;color:#111;transform:rotate(6deg);border-radius:999px}`,
  paper: `${CARD}{border:2px dashed color-mix(in srgb,var(--lp-text) 40%,transparent)!important;border-radius:6px!important;box-shadow:3px 4px 0 color-mix(in srgb,var(--lp-text) 12%,transparent)!important}
& .lp-bi:nth-child(odd){transform:rotate(-.6deg)}& .lp-bi:nth-child(even){transform:rotate(.7deg)}
${IMG}{border-radius:2px!important;border:8px solid #fff!important;box-shadow:0 2px 10px rgba(0,0,0,.2)}
${H2}{display:table;margin-inline:auto;background:linear-gradient(transparent 62%,color-mix(in srgb,var(--lp-primary) 35%,transparent) 62%)}${BTN}{border-radius:4px!important;border:2px dashed var(--lp-btn-text)}`,
  aurora: `&::before{height:1600px;background:radial-gradient(45% 35% at 10% 0%,color-mix(in srgb,var(--lp-primary) 36%,transparent),transparent 70%),radial-gradient(40% 30% at 100% 20%,color-mix(in srgb,#ff6ad5 26%,transparent),transparent 70%),radial-gradient(50% 40% at 50% 60%,color-mix(in srgb,#35e0ff 20%,transparent),transparent 70%)}
${H1},${H2}{background:linear-gradient(90deg,var(--lp-primary),#ff6ad5);-webkit-background-clip:text;background-clip:text;color:transparent}
${BTN}{background:linear-gradient(135deg,var(--lp-primary),#ff6ad5)}${CARD},${IMG}{border-radius:22px!important}`,
  industrial: `${H2}{display:table;margin-inline:auto;border-bottom:5px solid #f5c400;padding-bottom:4px}
${CARD},${IMG}{border:2px solid var(--lp-text)!important;border-radius:2px!important;box-shadow:inset 0 0 0 3px var(--lp-bg),inset 0 0 0 4px var(--lp-line)!important}
${BTN}{background:#f5c400;color:#111;border:2px solid #111;border-radius:2px!important;animation:none!important}${BTN}::after{display:none}
& .lp-cd{background:repeating-linear-gradient(-45deg,#111 0 14px,#f5c400 14px 28px)}`,
  softui: `${CARD}{background:var(--lp-bg)!important;border:0!important;border-radius:26px!important;box-shadow:9px 9px 18px color-mix(in srgb,var(--lp-text) 16%,transparent),-9px -9px 18px color-mix(in srgb,#fff 80%,transparent)!important}
${IMG}{border-radius:26px!important}
${BTN}{background:var(--lp-bg);color:var(--lp-primary);border:0;border-radius:18px!important;animation:none!important;box-shadow:7px 7px 14px color-mix(in srgb,var(--lp-text) 16%,transparent),-7px -7px 14px color-mix(in srgb,#fff 80%,transparent)}${BTN}::after{display:none}`,
  noir: `& .lp-img img,${IMG}{filter:grayscale(1) contrast(1.1);transition:filter .5s}${IMG}:hover{filter:none}
${CARD},${IMG}{border:1px solid var(--lp-line)!important;border-radius:0!important;box-shadow:none!important}
${BTN}{border-radius:0!important;letter-spacing:2px;animation:none!important}${H2}{display:table;margin-inline:auto;font-weight:400;letter-spacing:4px;border-bottom:1px solid var(--lp-primary);padding-bottom:6px}`,
  sunset: `${BTN}{background:linear-gradient(135deg,#ff7a59,var(--lp-primary));border-radius:999px!important}
& .lp-hero{background:linear-gradient(135deg,color-mix(in srgb,#ff7a59 16%,transparent),transparent 60%)}
${CARD},${IMG}{border-radius:24px!important;box-shadow:0 22px 40px -26px var(--lp-primary)!important}
${H2}::after{content:'';display:block;width:56px;height:5px;border-radius:9px;background:linear-gradient(90deg,#ff7a59,var(--lp-primary));margin:8px auto 0}`,
  boutique: `${IMG}{border-radius:999px 999px 14px 14px!important}${CARD}{border-radius:20px!important;box-shadow:none!important;text-align:center}
${BTN}{border-radius:999px!important}${H1},${H2}{font-weight:700}`,
  souk: `${CARD},${IMG}{border:2px solid var(--lp-primary)!important;border-radius:10px!important;box-shadow:none!important}
${H2}{display:table;margin-inline:auto;background:var(--lp-primary);color:var(--lp-btn-text);padding:3px 30px;clip-path:polygon(0 0,100% 0,95% 50%,100% 100%,0 100%,5% 50%)}
${BTN}{border-radius:6px!important}& .lp-cd{border-top:10px solid transparent;border-image:repeating-linear-gradient(90deg,var(--lp-primary) 0 20px,transparent 20px 40px) 1}`,
};

const wrap = (id, css) => css.split('&').join(`.lp[data-p="${id}"] `).replace(/(\.lp\[data-p="[a-z]+"\])\s+(\{|::before)/g, '$1$2');
export const lpPackCss = (id) => (PACKS[id] ? wrap(id, PACKS[id]) : '');
export const lpPatternCss = (pat) => {
  const c = patternCss(pat);
  if (!c) return '';
  return c.replace('.spk[data-pat=', '.lp[data-pat=').replace('{background:', '{--ink:var(--lp-text);--c:var(--lp-primary);background:').replace('var(--bg)', 'var(--lp-bg)');
};
export const lpThemeCss = (th) => `${lpPackCss(th?.p)}\n${lpPatternCss(th?.pat)}`;

const onColor = (hex) => {
  const m = String(hex).replace('#', ''); const f = m.length === 3 ? m.split('').map((x) => x + x).join('') : m;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16));
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#111111' : '#ffffff';
};
/* من ثيم المتجر إلى إعدادات صفحة الهبوط (تتخزن في page.theme) */
export const lpFromTheme = (t) => ({
  tid: t.id, p: t.p || 'clean', pat: t.pat || 'none', primary: t.color, bg: t.bg, text: t.ink, btn_text: onColor(t.color),
  card: t.card, radius: Math.min(40, t.radius + 4), font: t.font,
});
