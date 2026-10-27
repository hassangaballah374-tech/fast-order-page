/* ===== محرك الثيمات: 100 ثيم، لكل ثيم "شخصية" تصميمية (شكل الكروت والأزرار والعناوين والخلفية) وليس مجرد ألوان =====
   الثيم = ألوان + خط + استدارة + شخصية (p) + نقش خلفية (pat). الـ CSS الخاص بالشخصية يُحقن في المتجر بنطاق .spk[data-p="..."] */

/* الأوزان المتاحة فعلاً في Google Fonts (طلب وزن غير موجود يكسر تحميل الخط) */
const FONT_W = {
  Cairo: '400;600;700;800;900', Tajawal: '400;700;900', Almarai: '400;700;800', Changa: '400;600;700;800', 'El Messiri': '400;600;700',
  'Readex Pro': '400;600;700', 'Noto Kufi Arabic': '400;600;700;800;900', Amiri: '400;700', Lalezar: '400', 'Reem Kufi': '400;600;700',
  'IBM Plex Sans Arabic': '400;600;700', 'Aref Ruqaa': '400;700', Rubik: '400;600;700;800;900', Mada: '400;600;700;900',
  'Markazi Text': '400;600;700', Lemonada: '400;600;700', 'Baloo Bhaijaan 2': '400;600;700;800', 'Noto Naskh Arabic': '400;600;700',
  Rakkas: '400', Harmattan: '400;700',
};
import { SHOP_BASE, MODERN_PACKS } from './themeModern';
export const FONTS_ALL = Object.keys(FONT_W);
export const fontHref = (font) => {
  const f = FONT_W[font] ? font : 'Cairo';
  return `https://fonts.googleapis.com/css2?family=${f.replace(/ /g, '+')}:wght@${FONT_W[f]}&display=swap`;
};

/* ---------- ألوان مشتقة ---------- */
const rgb = (h) => { const m = String(h).replace('#', ''); const f = m.length === 3 ? m.split('').map((c) => c + c).join('') : m; return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16)); };
const toHex = (a) => `#${a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`;
const mix = (a, b, t) => { const x = rgb(a); const y = rgb(b); return toHex(x.map((v, i) => v + (y[i] - v) * t)); };
const lum = (h) => { const [r, g, b] = rgb(h).map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
export const isDark = (h) => lum(h) < 0.25;

/* ---------- نقوش الخلفية ---------- */
const PC = 'color-mix(in srgb,var(--ink) 7%,transparent)';
const PATTERNS = {
  dots: `radial-gradient(${PC} 1.3px,transparent 1.6px) 0 0/18px 18px`,
  grid: `linear-gradient(${PC} 1px,transparent 1px) 0 0/30px 30px,linear-gradient(90deg,${PC} 1px,transparent 1px) 0 0/30px 30px`,
  lines: `repeating-linear-gradient(0deg,${PC} 0 1px,transparent 1px 28px)`,
  diag: `repeating-linear-gradient(45deg,${PC} 0 2px,transparent 2px 16px)`,
  checker: `conic-gradient(${PC} 25%,transparent 0 50%,${PC} 0 75%,transparent 0) 0 0/44px 44px`,
  zig: `linear-gradient(135deg,${PC} 25%,transparent 25%) -20px 0/40px 40px,linear-gradient(225deg,${PC} 25%,transparent 25%) -20px 0/40px 40px,linear-gradient(315deg,${PC} 25%,transparent 25%) 0 0/40px 40px,linear-gradient(45deg,${PC} 25%,transparent 25%) 0 0/40px 40px`,
  waves: `radial-gradient(circle at 50% 0,transparent 12px,${PC} 13px,${PC} 14px,transparent 15px) 0 0/28px 14px`,
  lattice: `radial-gradient(circle at 100% 50%,transparent 20%,${PC} 21%,${PC} 34%,transparent 35%) 0 0/40px 40px,radial-gradient(circle at 0 50%,transparent 20%,${PC} 21%,${PC} 34%,transparent 35%) 0 -20px/40px 40px`,
  stars: 'radial-gradient(1.6px 1.6px at 20px 30px,color-mix(in srgb,var(--ink) 55%,transparent),transparent),radial-gradient(1px 1px at 90px 70px,color-mix(in srgb,var(--ink) 40%,transparent),transparent),radial-gradient(1.2px 1.2px at 140px 120px,color-mix(in srgb,var(--c) 70%,transparent),transparent) 0 0/160px 160px',
  noise: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'160\' height=\'160\'><filter id=\'n\'><feTurbulence type=\'fractalNoise\' baseFrequency=\'.85\' numOctaves=\'2\'/><feColorMatrix values=\'0 0 0 0 .5 0 0 0 0 .5 0 0 0 0 .5 0 0 0 .55 0\'/></filter><rect width=\'100%\' height=\'100%\' filter=\'url(%23n)\' opacity=\'.5\'/></svg>") 0 0/160px 160px',
};
export const patternCss = (id) => (PATTERNS[id] ? `.spk[data-pat="${id}"]{background:${PATTERNS[id]},var(--bg)}` : '');

/* ---------- الشخصيات: & = .spk[data-p="id"] ---------- */
const PACKS = {
  clean: '',
  brutal: `
& .hd{background:var(--bg);border-bottom:3px solid var(--ink)}
& .pc,& .ti,& .cat,& .card,& .cartb,& .b{border:3px solid var(--ink)!important;border-radius:0!important;box-shadow:6px 6px 0 var(--ink)!important}
& .b{box-shadow:4px 4px 0 var(--ink)!important;text-transform:uppercase;letter-spacing:.4px;font-weight:900}
& .b:hover{transform:translate(2px,2px);box-shadow:2px 2px 0 var(--ink)!important}
& .b.p::after{display:none}
& .sh h2{display:inline-block;background:var(--c);color:var(--onc);padding:2px 14px;border:3px solid var(--ink);box-shadow:4px 4px 0 var(--ink);font-weight:900}
& .hero{border:3px solid var(--ink);box-shadow:8px 8px 0 var(--ink);border-radius:0}
& .pc-img{border-bottom:3px solid var(--ink)}
& .bdg{border-radius:0;border:2px solid var(--ink)}
& .ann{border-bottom:3px solid var(--ink);font-weight:900;text-transform:uppercase}`,
  glass: `
& {background-image:radial-gradient(40% 32% at 12% 8%,color-mix(in srgb,var(--c) 38%,transparent),transparent 70%),radial-gradient(35% 30% at 92% 28%,color-mix(in srgb,var(--c) 22%,#a855f7 30%),transparent 70%),radial-gradient(45% 40% at 50% 100%,color-mix(in srgb,var(--c) 26%,#22d3ee 30%),transparent 70%);background-attachment:fixed}
& .pc,& .ti,& .cat,& .hd,& .card,& .stk,& .ft{background:color-mix(in srgb,var(--card) 52%,transparent)!important;-webkit-backdrop-filter:blur(16px) saturate(1.5);backdrop-filter:blur(16px) saturate(1.5);border:1px solid color-mix(in srgb,#fff 42%,transparent)!important;box-shadow:0 22px 50px -26px rgba(0,0,0,.4)!important}
& .hero{box-shadow:0 30px 70px -30px var(--c)}
& .b.p{background:linear-gradient(135deg,var(--c),color-mix(in srgb,var(--c) 55%,#fff))}`,
  luxe: `
& h1,& h2,& h3,& .logo{font-weight:600;letter-spacing:.5px}
& .hd{background:var(--bg);border-bottom:1px solid var(--c)}
& .hd-in{height:78px}
& .logo{font-size:22px;letter-spacing:2px}
& .sh{text-align:center;margin-bottom:26px}
& .sh h2{font-size:30px;font-weight:600}
& .sh h2::after{content:'◆';display:block;color:var(--c);font-size:10px;margin-top:8px}
& .pc{border:1px solid color-mix(in srgb,var(--c) 50%,transparent)!important;border-radius:2px!important;box-shadow:none!important}
& .pc-img{margin:8px 8px 0;border:1px solid color-mix(in srgb,var(--c) 30%,transparent)}
& .pc-t{font-weight:500;text-align:center}
& .pc-p{justify-content:center}
& .ti,& .cat,& .card{border:1px solid color-mix(in srgb,var(--c) 40%,transparent)!important;border-radius:2px!important;box-shadow:none!important}
& .b{border-radius:0!important;letter-spacing:1px;font-weight:600}
& .b.p{background:transparent;color:var(--c);border:1px solid var(--c)}
& .b.p:hover{background:var(--c);color:var(--onc)}
& .b.p::after{display:none}
& .hero{border-radius:0;border:1px solid var(--c)}
& .ann{background:var(--ink);color:var(--c);letter-spacing:2px;font-weight:600}`,
  neon: `
& h1,& h2,& h3{text-shadow:0 0 14px color-mix(in srgb,var(--c) 70%,transparent)}
& .hd{background:color-mix(in srgb,var(--bg) 86%,transparent);border-bottom:1px solid var(--c);box-shadow:0 0 22px -6px var(--c)}
& .pc,& .ti,& .cat,& .card{border:1px solid color-mix(in srgb,var(--c) 65%,transparent)!important;box-shadow:0 0 0 1px color-mix(in srgb,var(--c) 14%,transparent),0 0 26px -10px var(--c)!important}
& .pc:hover{box-shadow:0 0 36px -4px var(--c)!important}
& .b.p{background:transparent;color:var(--c);border:1.5px solid var(--c);box-shadow:0 0 18px -4px var(--c),inset 0 0 14px -8px var(--c);text-shadow:0 0 8px var(--c)}
& .b.p::after{display:none}
& .b.p:hover{background:var(--c);color:var(--onc);text-shadow:none}
& .pc-p b,& .price b{text-shadow:0 0 12px var(--c)}
& .hero{box-shadow:0 0 40px -12px var(--c);border:1px solid var(--c)}`,
  editorial: `
& h1,& h2,& h3{font-weight:700}
& .hd{background:var(--bg);border-bottom:3px double var(--ink)}
& .logo{font-size:26px;font-weight:700}
& .sh{border-top:3px solid var(--ink);border-bottom:1px solid var(--ink);padding:10px 0;margin-bottom:20px}
& .sh h2{font-size:27px;font-weight:700}
& .pc{border:0!important;border-bottom:1px solid var(--ink)!important;border-radius:0!important;background:transparent;box-shadow:none!important}
& .pc-img{border-radius:0;aspect-ratio:4/5}
& .pc-t{font-size:17px}
& .ti,& .cat,& .card{border-radius:0!important;box-shadow:none!important;border:1px solid var(--ink)!important}
& .b{border-radius:0!important}
& .hero{border-radius:0}`,
  pastel: `
& .pc,& .ti,& .cat,& .card{border-radius:28px!important;border:2px solid color-mix(in srgb,var(--c) 28%,transparent)!important;box-shadow:0 14px 0 -8px color-mix(in srgb,var(--c) 24%,transparent)!important}
& .pc-img{border-radius:22px;margin:8px 8px 0}
& .b{border-radius:999px!important;font-weight:900}
& .b.p{box-shadow:0 8px 0 -2px color-mix(in srgb,var(--c) 62%,#000)}
& .b.p:active{transform:translateY(4px);box-shadow:none}
& .b.p::after{display:none}
& .hero{border-radius:38px}
& .sh h2{font-weight:900}
& .sh h2::before{content:'✿ ';color:var(--c)}
& .bdg{border-radius:999px}`,
    retro: `
& h1,& h2,& h3,& .logo{letter-spacing:.4px}
& .hd{border-bottom:4px double var(--ink);background:var(--card)}
& .pc,& .ti,& .cat,& .card{border:2px solid var(--ink)!important;border-radius:14px!important;box-shadow:5px 5px 0 var(--c)!important}
& .b{border:2px solid var(--ink);border-radius:10px!important;box-shadow:3px 3px 0 var(--ink)}
& .b:active{transform:translate(2px,2px);box-shadow:1px 1px 0 var(--ink)}
& .b.p::after{display:none}
& .sh h2{display:inline-block;transform:rotate(-1.5deg);background:var(--c);color:var(--onc);padding:2px 18px;border-radius:6px}
& .hero{border:3px solid var(--ink);box-shadow:8px 8px 0 var(--ink)}
& .ann{border-bottom:2px solid var(--ink)}`,
  mono: `
& *{letter-spacing:.2px}
& .hd{background:var(--bg);border-bottom:1px solid var(--ln)}
& .pc,& .ti,& .cat,& .card{border:0!important;border-radius:0!important;box-shadow:none!important;background:transparent}
& .pc-img{border-radius:0}
& .pc-t{font-weight:500;font-size:13px}
& .pc-p b{color:var(--ink);font-weight:500;font-size:14px}
& .b,& .b.p{border-radius:0!important;background:var(--ink);color:var(--bg);border-color:var(--ink);font-weight:500;letter-spacing:1px}
& .b::after{display:none}
& .sh h2{font-size:15px;font-weight:500;letter-spacing:3px}
& .hero{border-radius:0;background:var(--ink);color:var(--bg)}
& .hero .b{background:var(--bg);color:var(--ink)}`,
  organic: `
& .pc,& .ti,& .cat,& .card{border-radius:38px 8px 38px 8px!important;border:1px solid var(--ln)!important;box-shadow:0 18px 30px -22px color-mix(in srgb,var(--c) 70%,#000)!important}
& .pc-img{border-radius:0}
& .b{border-radius:999px 12px 999px 12px!important}
& .hero{border-radius:64px 12px 64px 12px}
& .sh h2::after{content:'🌿';margin-inline-start:8px}`,
  tech: `
& h1,& h2,& h3,& .logo,& .num{font-family:'IBM Plex Sans Arabic',var(--font),monospace}
& .hd{background:var(--card);border-bottom:1px solid var(--c)}
& .pc,& .ti,& .cat,& .card{border:1px solid var(--ln)!important;border-radius:4px!important;box-shadow:none!important;position:relative}
& .pc::before,& .pc::after{content:'';position:absolute;width:10px;height:10px;border:2px solid var(--c);z-index:2}
& .pc::before{top:-1px;left:-1px;border-width:2px 0 0 2px}
& .pc::after{bottom:-1px;right:-1px;border-width:0 2px 2px 0}
& .b{border-radius:3px!important;font-size:13px;letter-spacing:1px}
& .sh h2::before{content:'// ';color:var(--c);font-family:monospace}
& .hero{border-radius:4px}`,
  candy: `
& .b.p{background:linear-gradient(135deg,var(--c),color-mix(in srgb,var(--c) 40%,#ff7ad9));border-radius:999px!important;box-shadow:0 12px 24px -10px var(--c)}
& .pc{border-radius:24px!important;transition:transform .25s cubic-bezier(.3,1.6,.5,1)}
& .pc:hover{transform:translateY(-6px) rotate(-1deg) scale(1.02)}
& .ti,& .cat,& .card{border-radius:22px!important}
& .bdg{transform:rotate(-8deg);border-radius:10px;box-shadow:0 6px 0 rgba(0,0,0,.15)}
& .sh h2{background:linear-gradient(90deg,var(--c),color-mix(in srgb,var(--c) 40%,#ff7ad9));-webkit-background-clip:text;background-clip:text;color:transparent;font-weight:900}
& .hero{border-radius:34px}`,
  royal: `
& .hd{background:linear-gradient(90deg,color-mix(in srgb,var(--c) 88%,#000),var(--c));border:0;border-bottom:3px solid #d4af37}
& .hd,& .hd a,& .hd .logo,& .hd .nav a{color:var(--onc)}
& .cartb{background:rgba(255,255,255,.16);color:var(--onc);border-color:rgba(255,255,255,.35)}
& .pc,& .ti,& .cat,& .card{border:1px solid var(--c)!important;outline:1px solid color-mix(in srgb,var(--c) 30%,transparent);outline-offset:-6px;border-radius:6px!important;box-shadow:none!important}
& .hero{border-radius:6px;border:2px solid #d4af37;box-shadow:0 0 0 4px color-mix(in srgb,var(--c) 35%,transparent)}
& .sh{text-align:center}
& .sh h2{color:var(--c)}
& .sh h2::before,& .sh h2::after{content:'❖';color:#d4af37;margin:0 10px;font-size:14px}
& .b.p{border-radius:4px!important;border:1px solid #d4af37;background:linear-gradient(135deg,var(--c),color-mix(in srgb,var(--c) 70%,#000))}`,
  sport: `
& h1,& h2,& h3,& .logo{font-weight:900;font-style:italic;letter-spacing:-.3px}
& .pc,& .ti,& .cat{border-radius:0!important;clip-path:polygon(0 0,100% 0,100% calc(100% - 18px),calc(100% - 18px) 100%,0 100%);border:0!important;box-shadow:none!important;background:var(--card)}
& .pc::before{content:'';position:absolute;top:0;inset-inline-start:0;width:6px;height:100%;background:var(--c);z-index:2}
& .b{border-radius:0!important;transform:skewX(-10deg);font-style:italic;font-weight:900}
& .hero{border-radius:0;clip-path:polygon(0 0,100% 0,100% 86%,92% 100%,0 100%)}
& .sh h2{border-inline-start:8px solid var(--c);padding-inline-start:12px}`,
  kids: `
& .hd{border-bottom:6px solid transparent;border-image:linear-gradient(90deg,#ff5d5d,#ffb020,#3ddc84,#3aa0ff,#a24bff) 1}
& .pc,& .ti,& .cat,& .card{border:3px solid var(--ink)!important;border-radius:26px!important;box-shadow:0 6px 0 var(--ink)!important}
& .b{border:3px solid var(--ink);border-radius:999px!important;box-shadow:0 5px 0 var(--ink);font-weight:900}
& .b:active{transform:translateY(4px);box-shadow:0 1px 0 var(--ink)}
& .b.p::after{display:none}
& .sh h2{font-size:28px;font-weight:900;display:inline-block;transform:rotate(-1deg)}
& .bdg{border-radius:999px;background:#ffb020;color:#111;transform:rotate(6deg)}
& .hero{border:3px solid var(--ink);border-radius:30px;box-shadow:0 8px 0 var(--ink)}`,
  paper: `
& .pc,& .ti,& .cat,& .card{border:2px dashed color-mix(in srgb,var(--ink) 40%,transparent)!important;border-radius:6px!important;box-shadow:3px 4px 0 color-mix(in srgb,var(--ink) 12%,transparent)!important}
& .pc{transition:transform .25s}  
& .pc:nth-child(odd){transform:rotate(-.6deg)}
& .pc:nth-child(even){transform:rotate(.7deg)}
& .pc:hover{transform:rotate(0) scale(1.02)}
& .pc-img{border-radius:2px;margin:10px 10px 0;border:6px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.18)}
& .sh h2{display:inline-block;background:linear-gradient(transparent 62%,color-mix(in srgb,var(--c) 35%,transparent) 62%)}
& .b{border-radius:4px!important;border-style:dashed}
& .hero{border-radius:6px}`,
  aurora: `
& {background-image:radial-gradient(45% 35% at 10% 0%,color-mix(in srgb,var(--c) 32%,transparent),transparent 70%),radial-gradient(40% 30% at 100% 20%,color-mix(in srgb,#ff6ad5 24%,transparent),transparent 70%),radial-gradient(50% 40% at 50% 100%,color-mix(in srgb,#35e0ff 20%,transparent),transparent 70%);background-attachment:fixed}
& h1,& .sh h2{background:linear-gradient(90deg,var(--c),#ff6ad5);-webkit-background-clip:text;background-clip:text;color:transparent}
& .b.p{background:linear-gradient(135deg,var(--c),#ff6ad5)}
& .hero{background:linear-gradient(135deg,var(--c),#ff6ad5 70%,#35e0ff)}
& .pc,& .ti,& .cat,& .card{border-radius:22px!important}`,
  industrial: `
& h1,& h2,& h3{font-weight:800}
& .ann{background:repeating-linear-gradient(-45deg,#111 0 14px,#f5c400 14px 28px);color:#fff;text-shadow:0 1px 2px #000}
& .hd{border-bottom:4px solid var(--ink);background:var(--card)}
& .pc,& .ti,& .cat,& .card{border:2px solid var(--ink)!important;border-radius:2px!important;box-shadow:inset 0 0 0 3px var(--card),inset 0 0 0 4px var(--ln)!important}
& .b{border-radius:2px!important;border-width:2px;border-color:var(--ink)}
& .b.p{background:#f5c400;color:#111;border-color:#111}
& .sh h2{display:inline-block;border-bottom:5px solid #f5c400;padding-bottom:4px}
& .hero{border-radius:2px;border:3px solid var(--ink)}`,
  softui: `
& .pc,& .ti,& .cat,& .card,& .hd{background:var(--bg)!important;border:0!important;box-shadow:9px 9px 18px color-mix(in srgb,var(--ink) 16%,transparent),-9px -9px 18px color-mix(in srgb,#fff 80%,transparent)!important;border-radius:26px!important}
& .hd{border-radius:0!important}
& .b{background:var(--bg);border:0;box-shadow:6px 6px 12px color-mix(in srgb,var(--ink) 16%,transparent),-6px -6px 12px color-mix(in srgb,#fff 80%,transparent);border-radius:16px!important}
& .b.p{color:var(--c);background:var(--bg)}
& .b.p::after{display:none}
& .b:active{box-shadow:inset 4px 4px 8px color-mix(in srgb,var(--ink) 18%,transparent),inset -4px -4px 8px color-mix(in srgb,#fff 80%,transparent)}
& .pc-img{border-radius:18px;margin:10px 10px 0}
& .hero{border-radius:30px;box-shadow:12px 12px 24px color-mix(in srgb,var(--ink) 18%,transparent),-10px -10px 22px color-mix(in srgb,#fff 80%,transparent)}`,
  noir: `
& h1,& h2,& h3{letter-spacing:1px}
& .hd{background:color-mix(in srgb,var(--bg) 92%,#000);border-bottom:1px solid var(--ln)}
& .pc,& .ti,& .cat,& .card{border:1px solid var(--ln)!important;border-radius:0!important;box-shadow:none!important}
& .pc-img img{filter:grayscale(1) contrast(1.1);transition:filter .5s}
& .pc:hover .pc-img img{filter:none}
& .b.p{border-radius:0!important;letter-spacing:2px}
& .b{border-radius:0!important}
& .sh h2{display:inline-block;font-weight:400;letter-spacing:4px;border-bottom:1px solid var(--c);padding-bottom:6px}
& .hero{border-radius:0}`,
  sunset: `
& .hero{background:linear-gradient(135deg,#ff7a59,#ffb36b 45%,var(--c));box-shadow:0 30px 60px -28px var(--c)}
& .b.p{background:linear-gradient(135deg,#ff7a59,var(--c));border-radius:999px!important;box-shadow:0 14px 28px -10px var(--c)}
& .pc{border-radius:24px!important;box-shadow:0 22px 40px -26px var(--c)!important}
& .pc:hover{box-shadow:0 30px 50px -22px var(--c)!important}
& .ti,& .cat,& .card{border-radius:22px!important}
& .sh h2::after{content:'';display:block;width:56px;height:5px;border-radius:9px;background:linear-gradient(90deg,#ff7a59,var(--c));margin-top:6px}`,
  boutique: `
& h1,& h2,& h3,& .logo{font-weight:700}
& .pc-img{border-radius:999px 999px 14px 14px;margin:10px 10px 0;aspect-ratio:3/4}
& .pc{border-radius:20px!important;border:1px solid var(--ln)!important;box-shadow:none!important;text-align:center}
& .pc-p{justify-content:center}
& .ti,& .cat,& .card{border-radius:20px!important}
& .b{border-radius:999px!important}
& .hero{border-radius:220px 220px 24px 24px}
& .sh{text-align:center}`,
  souk: `
& .hd{border-bottom:0;background:var(--card)}
& .hd::after{content:'';display:block;height:10px;background:repeating-linear-gradient(90deg,var(--c) 0 20px,var(--card) 20px 40px)}
& .bdg{border-radius:0;clip-path:polygon(0 0,100% 0,88% 50%,100% 100%,0 100%);padding-inline-end:18px}
& .pc,& .ti,& .cat,& .card{border:2px solid var(--c)!important;border-radius:10px!important;box-shadow:none!important}
& .pc-p b{font-size:19px}
& .b{border-radius:6px!important}
& .sh h2{display:inline-block;background:var(--c);color:var(--onc);padding:2px 26px;clip-path:polygon(0 0,100% 0,95% 50%,100% 100%,0 100%,5% 50%)}
& .hero{border-radius:10px;border:2px solid var(--c)}`,
};
export const PERSONALITIES = Object.keys(PACKS);
const packSrc = (id) => (MODERN_PACKS[id] !== undefined ? MODERN_PACKS[id] : PACKS[id]);
export const packCss = (id) => (packSrc(id) ? packSrc(id).replace(/&\s?/g, `.spk[data-p="${id}"] `).replace(/\.spk\[data-p="[a-z]+"\]\s+\{/g, (m) => m.replace(/\s+\{/, '{')) : '');

/* ---------- الثيمات المئة: [id, الاسم, الوصف, التصنيف, الشخصية, النقش, الخط, الاستدارة, اللون, الخلفية, الحبر] ---------- */
const RAW = [
  ['daylight', 'نهار', 'نظيف وهادئ وسريع القراءة', 'بسيط', 'clean', 'none', 'Cairo', 14, '#2563eb', '#f8fafc', '#0f172a'],
  ['espresso', 'إسبرسو', 'قهوة دافئة هادئة', 'كلاسيكي', 'clean', 'dots', 'Almarai', 16, '#8b5a2b', '#f7f1ea', '#2b1d12'],
  ['mintcream', 'نعناع بالكريمة', 'منعش وخفيف', 'طبيعي', 'clean', 'none', 'Tajawal', 18, '#14b8a6', '#f0fdfa', '#0f2f2b'],
  ['cobalt', 'كوبالت', 'أزرق عميق رسمي', 'بسيط', 'clean', 'lines', 'IBM Plex Sans Arabic', 8, '#1e40af', '#f5f7fb', '#0b1530'],
  ['peach', 'خوخ', 'دافئ وناعم', 'أنثوي', 'clean', 'none', 'Readex Pro', 22, '#fb7185', '#fff5f1', '#3b1a1f'],
  ['graphite', 'جرافيت', 'رمادي أنيق للإلكترونيات', 'تقني', 'clean', 'grid', 'Rubik', 10, '#475569', '#f1f5f9', '#0f172a'],
  ['brutal-yellow', 'بروتال أصفر', 'حدود سميكة وظلال قاسية', 'جريء', 'brutal', 'none', 'Rubik', 0, '#ffd400', '#fffbe6', '#111111'],
  ['brutal-pink', 'بروتال وردي', 'جريء للشباب', 'جريء', 'brutal', 'dots', 'Changa', 0, '#ff4fa3', '#fff0f7', '#111111'],
  ['brutal-blue', 'بروتال أزرق', 'تقني جريء', 'جريء', 'brutal', 'grid', 'Cairo', 0, '#3b82f6', '#eef5ff', '#0a0a0a'],
  ['brutal-green', 'بروتال أخضر', 'حيوي للمنتجات الصحية', 'جريء', 'brutal', 'checker', 'Noto Kufi Arabic', 0, '#22c55e', '#f0fff4', '#0a0a0a'],
  ['glass-ice', 'زجاج جليدي', 'شفافية وضبابية', 'أنيق', 'glass', 'none', 'Readex Pro', 22, '#38bdf8', '#eef6ff', '#0b1e33'],
  ['glass-rose', 'زجاج وردي', 'ناعم وراقي', 'أنثوي', 'glass', 'none', 'Tajawal', 24, '#f472b6', '#fff1f7', '#3a1530'],
  ['glass-night', 'زجاج ليلي', 'داكن مع توهج', 'ليلي', 'glass', 'none', 'Cairo', 22, '#818cf8', '#0b1020', '#e8ecff'],
  ['glass-lime', 'زجاج ليموني', 'منعش وحديث', 'طبيعي', 'glass', 'none', 'Almarai', 20, '#84cc16', '#f4fbe8', '#1a2a08'],
  ['gold-noir', 'ذهب وأسود', 'فخامة داكنة', 'أنيق', 'luxe', 'none', 'El Messiri', 2, '#d4af37', '#0e0e0e', '#f3ead2'],
  ['ivory-gold', 'عاجي وذهبي', 'فخامة فاتحة', 'أنيق', 'luxe', 'none', 'Amiri', 2, '#b8902c', '#fbf8f1', '#2a2214'],
  ['emerald-lux', 'زمرد فاخر', 'أخضر ملكي وذهب', 'أنيق', 'luxe', 'none', 'El Messiri', 2, '#c9a24a', '#0b2a22', '#efe6cf'],
  ['rose-gold', 'روز جولد', 'ذهبي وردي أنثوي', 'أنثوي', 'luxe', 'none', 'Markazi Text', 2, '#c98b7b', '#fbf3f0', '#3a2420'],
  ['neon-tokyo', 'طوكيو نيون', 'وردي وسماوي متوهج', 'تقني', 'neon', 'grid', 'Rubik', 6, '#ff2fd6', '#0a0714', '#f4eaff'],
  ['neon-matrix', 'ماتريكس', 'أخضر متوهج', 'تقني', 'neon', 'lines', 'IBM Plex Sans Arabic', 4, '#22ff88', '#050c08', '#d8ffe9'],
  ['neon-ice', 'جليد نيون', 'أزرق كهربي', 'تقني', 'neon', 'stars', 'Cairo', 8, '#22d3ee', '#040b14', '#dff7ff'],
  ['neon-sun', 'غروب نيون', 'برتقالي متوهج', 'ليلي', 'neon', 'dots', 'Changa', 8, '#ff8a1f', '#110805', '#fff0e0'],
  ['daily-news', 'الجريدة', 'طابع مجلة صحفية', 'كلاسيكي', 'editorial', 'lines', 'Amiri', 0, '#b91c1c', '#fbfaf7', '#151515'],
  ['vogue-ar', 'أزياء المجلات', 'عناوين كبيرة وأناقة', 'أنيق', 'editorial', 'none', 'Noto Naskh Arabic', 0, '#111111', '#ffffff', '#111111'],
  ['journal-blue', 'يوميات', 'مجلة بأزرق نيلي', 'كلاسيكي', 'editorial', 'none', 'Markazi Text', 0, '#1e3a8a', '#f6f4ee', '#14213d'],
  ['gallery', 'معرض', 'مساحة بيضاء لعرض المنتجات', 'بسيط', 'editorial', 'none', 'Harmattan', 0, '#374151', '#fafafa', '#111827'],
  ['bubble-pink', 'فقاعات', 'بيبي وردي لطيف', 'مرح', 'pastel', 'dots', 'Baloo Bhaijaan 2', 28, '#f472b6', '#fff0f6', '#4a1d3a'],
  ['bubble-mint', 'نعناع حلو', 'باستيل أخضر', 'مرح', 'pastel', 'dots', 'Lemonada', 28, '#34d399', '#effcf6', '#123c2e'],
  ['bubble-lilac', 'ليلك', 'باستيل بنفسجي', 'أنثوي', 'pastel', 'waves', 'Tajawal', 28, '#a78bfa', '#f6f2ff', '#2a1f4d'],
  ['bubble-sky', 'سماء', 'باستيل أزرق', 'مرح', 'pastel', 'dots', 'Readex Pro', 28, '#60a5fa', '#eff7ff', '#12304f'],
  ['retro-70s', 'السبعينات', 'برتقالي وبني دافئ', 'مرح', 'retro', 'diag', 'Lalezar', 14, '#e2711d', '#fdf1d8', '#3d2008'],
  ['retro-diner', 'مطعم أمريكي', 'أحمر وكريمي', 'مرح', 'retro', 'checker', 'Changa', 12, '#d62828', '#fff8e8', '#1b1b1b'],
  ['retro-arcade', 'أركيد', 'بنفسجي ألعاب فيديو', 'مرح', 'retro', 'grid', 'Rakkas', 10, '#7c3aed', '#f3ecff', '#1d0f3d'],
  ['retro-sea', 'بحري كلاسيكي', 'أزرق وكريمي', 'كلاسيكي', 'retro', 'zig', 'Lemonada', 12, '#0e7490', '#f7f3e8', '#0b2b36'],
  ['mono-white', 'أبيض خالص', 'مينيمال حاد', 'بسيط', 'mono', 'none', 'Rubik', 0, '#111111', '#ffffff', '#111111'],
  ['mono-ink', 'حبر', 'أسود أنيق', 'بسيط', 'mono', 'none', 'IBM Plex Sans Arabic', 0, '#0a0a0a', '#f4f4f2', '#0a0a0a'],
  ['mono-sand', 'رمل', 'مينيمال بيج', 'بسيط', 'mono', 'none', 'Tajawal', 0, '#7a6a53', '#f6f1e8', '#2a241b'],
  ['mono-night', 'ليل مينيمال', 'داكن هادئ', 'ليلي', 'mono', 'none', 'Almarai', 0, '#e5e7eb', '#0c0c0c', '#f5f5f5'],
  ['olive-grove', 'بستان زيتون', 'أخضر زيتوني', 'طبيعي', 'organic', 'none', 'Almarai', 24, '#6b8e23', '#f6f7ec', '#26301a'],
  ['terracotta', 'تيراكوتا', 'طين وأرض', 'طبيعي', 'organic', 'noise', 'Cairo', 24, '#c2410c', '#fbf0e8', '#3a1c0e'],
  ['sage', 'ميرامية', 'أخضر رمادي هادئ', 'طبيعي', 'organic', 'none', 'Tajawal', 26, '#7c9a82', '#f3f6f2', '#1f2d24'],
  ['desert-dune', 'كثبان', 'رمال صحراوية', 'طبيعي', 'organic', 'waves', 'El Messiri', 24, '#d97706', '#fbf1dd', '#3b2a10'],
  ['tech-slate', 'ستيل', 'لوحة تحكم احترافية', 'تقني', 'tech', 'grid', 'IBM Plex Sans Arabic', 4, '#38bdf8', '#0f172a', '#e2e8f0'],
  ['tech-mint', 'سيرفر', 'أخضر تقني', 'تقني', 'tech', 'lines', 'Rubik', 4, '#10b981', '#0b1512', '#d1fae5'],
  ['tech-light', 'مختبر', 'تقني فاتح', 'تقني', 'tech', 'grid', 'Readex Pro', 4, '#2563eb', '#f7f9fc', '#0f1b2d'],
  ['tech-amber', 'كونسول', 'كهرماني على داكن', 'تقني', 'tech', 'dots', 'Mada', 4, '#f59e0b', '#14110a', '#fdf3dc'],
  ['candy-pop', 'بوب', 'ألوان حلوى', 'مرح', 'candy', 'dots', 'Baloo Bhaijaan 2', 24, '#ec4899', '#fff5fb', '#3a0d2b'],
  ['candy-grape', 'عنب', 'بنفسجي لامع', 'مرح', 'candy', 'none', 'Lemonada', 24, '#8b5cf6', '#f8f4ff', '#2b1559'],
  ['candy-citrus', 'حمضيات', 'برتقال وليمون', 'مرح', 'candy', 'dots', 'Changa', 24, '#fb923c', '#fffaf0', '#3a1d05'],
  ['candy-berry', 'توت', 'أحمر توتي', 'مرح', 'candy', 'none', 'Cairo', 24, '#e11d48', '#fff3f6', '#3a0a16'],
  ['royal-purple', 'بنفسجي ملكي', 'قصور وتيجان', 'كلاسيكي', 'royal', 'lattice', 'El Messiri', 6, '#5b21b6', '#f7f3ff', '#24104a'],
  ['royal-navy', 'كحلي ملكي', 'رسمي وفخم', 'كلاسيكي', 'royal', 'none', 'Amiri', 6, '#1e3a8a', '#f4f6fb', '#0c1a3d'],
  ['royal-burgundy', 'بورجندي', 'أحمر نبيذي', 'كلاسيكي', 'royal', 'none', 'Markazi Text', 6, '#7f1d1d', '#fbf3f1', '#2d0d0d'],
  ['royal-teal', 'تركواز ملكي', 'هوية سبايك الفخمة', 'كلاسيكي', 'royal', 'lattice', 'Noto Kufi Arabic', 6, '#0f766e', '#f2f8f6', '#0b2a27'],
  ['sport-red', 'رياضي أحمر', 'طاقة وسرعة', 'رياضي', 'sport', 'diag', 'Changa', 0, '#ef4444', '#0f0f10', '#f5f5f5'],
  ['sport-blue', 'رياضي أزرق', 'ملاعب', 'رياضي', 'sport', 'none', 'Rubik', 0, '#2563eb', '#f4f7fd', '#0b1220'],
  ['sport-lime', 'ليموني رياضي', 'طاقة صفراء خضراء', 'رياضي', 'sport', 'diag', 'Cairo', 0, '#a3e635', '#0c0f06', '#f3ffd0'],
  ['sport-orange', 'برتقالي رياضي', 'حماس', 'رياضي', 'sport', 'none', 'Lalezar', 0, '#f97316', '#fff7ed', '#1a0e05'],
    ['kids-rainbow', 'قوس قزح', 'ألوان للأطفال', 'مرح', 'kids', 'dots', 'Baloo Bhaijaan 2', 26, '#3b82f6', '#fffbea', '#1f2937'],
  ['kids-toy', 'ألعاب', 'أصفر وأحمر', 'مرح', 'kids', 'checker', 'Lemonada', 26, '#f59e0b', '#fff8e1', '#2b1b00'],
  ['kids-ocean', 'مغامرة بحرية', 'أزرق مرح', 'مرح', 'kids', 'waves', 'Readex Pro', 26, '#0ea5e9', '#eefaff', '#0b2a3a'],
  ['kids-garden', 'الحديقة', 'أخضر وأصفر', 'مرح', 'kids', 'dots', 'Tajawal', 26, '#22c55e', '#f5fff0', '#123015'],
  ['paper-notebook', 'كراسة', 'ورق بخطوط', 'كلاسيكي', 'paper', 'lines', 'Aref Ruqaa', 6, '#2563eb', '#fffef5', '#1e293b'],
  ['paper-kraft', 'كرافت', 'ورق بني', 'طبيعي', 'paper', 'noise', 'Markazi Text', 6, '#92400e', '#efe3cf', '#2e1d0e'],
  ['paper-sketch', 'اسكتش', 'رسم بالقلم', 'كلاسيكي', 'paper', 'dots', 'Harmattan', 6, '#374151', '#fbfaf6', '#1f2937'],
  ['paper-love', 'رسائل حب', 'وردي ورقي', 'أنثوي', 'paper', 'lines', 'Aref Ruqaa', 6, '#e11d48', '#fff4f4', '#4a0f1c'],
  ['aurora-borealis', 'شفق قطبي', 'تدرجات حيّة', 'أنيق', 'aurora', 'none', 'Cairo', 22, '#22d3ee', '#0a1020', '#ecfeff'],
  ['aurora-dawn', 'فجر', 'تدرجات دافئة', 'أنيق', 'aurora', 'none', 'Almarai', 22, '#f97316', '#fffaf5', '#2d1706'],
  ['aurora-orchid', 'أوركيد', 'بنفسجي وردي', 'أنثوي', 'aurora', 'none', 'Readex Pro', 22, '#c026d3', '#fdf4ff', '#2e0a35'],
  ['aurora-lagoon', 'لاجون', 'أخضر وأزرق', 'طبيعي', 'aurora', 'none', 'Tajawal', 22, '#14b8a6', '#f0fffe', '#052e2b'],
  ['factory', 'مصنع', 'رمادي وأصفر تحذير', 'جريء', 'industrial', 'diag', 'Changa', 2, '#f5c400', '#e7e7e4', '#141414'],
  ['concrete', 'خرسانة', 'رمادي صلب', 'جريء', 'industrial', 'noise', 'Cairo', 2, '#ea580c', '#dcdcd8', '#171717'],
  ['steel-blue', 'فولاذ', 'أزرق معدني', 'تقني', 'industrial', 'grid', 'Rubik', 2, '#0369a1', '#e5eaef', '#0b1722'],
  ['garage', 'جراج', 'أسود وأحمر', 'جريء', 'industrial', 'diag', 'Lalezar', 2, '#dc2626', '#181818', '#f1f1f1'],
  ['soft-ivory', 'ناعم عاجي', 'ظلال بارزة', 'بسيط', 'softui', 'none', 'Tajawal', 26, '#6d7bd6', '#e8ebf2', '#2b3350'],
  ['soft-sand', 'ناعم رملي', 'نيومورفيزم دافئ', 'بسيط', 'softui', 'none', 'Almarai', 26, '#b7791f', '#efe8dc', '#3a2d18'],
  ['soft-mint', 'ناعم نعناعي', 'منعش', 'بسيط', 'softui', 'none', 'Readex Pro', 26, '#10b981', '#e3f1ec', '#153a2e'],
  ['soft-rose', 'ناعم وردي', 'رقيق', 'أنثوي', 'softui', 'none', 'Cairo', 26, '#ec4899', '#f5e6ec', '#4a1a32'],
  ['film-noir', 'فيلم نوار', 'أبيض وأسود سينمائي', 'ليلي', 'noir', 'noise', 'Reem Kufi', 0, '#e11d48', '#0b0b0b', '#f2f2f2'],
  ['noir-gold', 'نوار ذهبي', 'داكن مع لمعة', 'ليلي', 'noir', 'noise', 'El Messiri', 0, '#c9a227', '#0d0d0d', '#f3eedd'],
  ['noir-white', 'نوار فاتح', 'تباين عالٍ', 'بسيط', 'noir', 'none', 'Amiri', 0, '#111111', '#f7f7f7', '#111111'],
  ['noir-blue', 'نوار أزرق', 'غموض وأناقة', 'ليلي', 'noir', 'stars', 'Cairo', 0, '#60a5fa', '#070b14', '#e8f0ff'],
  ['sunset-beach', 'شاطئ', 'غروب دافئ', 'مرح', 'sunset', 'none', 'Cairo', 22, '#f97316', '#fff6ec', '#3a1c0a'],
  ['sunset-coral', 'مرجان', 'وردي برتقالي', 'أنثوي', 'sunset', 'none', 'Readex Pro', 22, '#fb5a7a', '#fff3f0', '#3d1320'],
  ['sunset-plum', 'برقوق', 'بنفسجي غروب', 'أنيق', 'sunset', 'none', 'Tajawal', 22, '#be4bdb', '#fbf2ff', '#321046'],
  ['sunset-gold', 'ساعة ذهبية', 'ذهبي دافئ', 'أنيق', 'sunset', 'none', 'Almarai', 22, '#f59e0b', '#fffbea', '#3b2800'],
  ['boutique-blush', 'بوتيك', 'وردي بودرة', 'أنثوي', 'boutique', 'none', 'Aref Ruqaa', 18, '#d97a8e', '#fdf3f2', '#4a2a30'],
  ['boutique-lavender', 'لافندر', 'هادئ وأنثوي', 'أنثوي', 'boutique', 'none', 'Markazi Text', 18, '#8b7bd8', '#f7f5fd', '#2c2548'],
  ['boutique-sage', 'بوتيك ميرامية', 'أخضر باهت', 'أنثوي', 'boutique', 'none', 'Harmattan', 18, '#7a9e87', '#f4f8f4', '#243329'],
  ['boutique-noir', 'بوتيك أسود', 'أنيق ومحايد', 'أنيق', 'boutique', 'none', 'Amiri', 18, '#1f1f1f', '#faf8f5', '#1f1f1f'],
  ['khan-khalili', 'خان الخليلي', 'ألوان السوق الشرقي', 'كلاسيكي', 'souk', 'lattice', 'Rakkas', 8, '#b45309', '#fdf3e1', '#3a1f06'],
  ['souk-spice', 'بهارات', 'أحمر وبرتقالي حار', 'جريء', 'souk', 'zig', 'Changa', 8, '#c2410c', '#fff4e6', '#3b1405'],
  ['souk-oasis', 'واحة', 'أخضر وذهبي', 'طبيعي', 'souk', 'lattice', 'El Messiri', 8, '#15803d', '#fbf6e4', '#12301c'],
  ['souk-nile', 'النيل', 'أزرق وذهبي مصري', 'كلاسيكي', 'souk', 'waves', 'Noto Kufi Arabic', 8, '#1d4ed8', '#f8f3e3', '#10224d'],
  ['pearl', 'لؤلؤ', 'أبيض لؤلؤي بلمعة', 'أنيق', 'glass', 'none', 'Tajawal', 24, '#94a3b8', '#f8fafc', '#1e293b'],
  ['cherry-blossom', 'أزهار الكرز', 'وردي ياباني', 'أنثوي', 'pastel', 'waves', 'Readex Pro', 28, '#f9a8d4', '#fff7fb', '#4a2236'],
  ['cyber-violet', 'سايبر بنفسجي', 'مستقبلي', 'تقني', 'neon', 'grid', 'Cairo', 6, '#a855f7', '#0b0612', '#f3e8ff'],
  ['coffee-house', 'مقهى', 'بني ودافئ كلاسيكي', 'كلاسيكي', 'retro', 'noise', 'Amiri', 12, '#7c4a21', '#f4ebdd', '#2a1a0c'],
  ['arctic', 'قطبي', 'أبيض وأزرق جليدي', 'بسيط', 'clean', 'none', 'Tajawal', 12, '#0ea5e9', '#f4fbff', '#0c2433'],
  ['matte-black', 'أسود مطفي', 'بسيط وجريء', 'ليلي', 'tech', 'none', 'Rubik', 6, '#fafafa', '#09090b', '#fafafa'],
];

export const THEMES_100 = RAW.map(([id, name, desc, cat, p, pat, font, radius, color, bg, ink]) => {
  const dark = lum(bg) < 0.25;
  return {
    id, name, desc, cat, p, pat, font, radius, color, bg, ink, dark,
    card: p === 'softui' ? bg : dark ? mix(bg, '#ffffff', 0.07) : mix(bg, '#ffffff', 0.65),
    ln: mix(bg, ink, dark ? 0.22 : 0.13),
    mut: mix(ink, bg, 0.42),
  };
});
export const THEME_CATS = ['الكل', ...Array.from(new Set(RAW.map((r) => r[3])))];

/* CSS الثيم المحقون في المتجر: الشخصية + النقش (يُحقن مرة واحدة فقط للثيم النشط) */
export const themeCss = (th) => (th && th.p ? `${SHOP_BASE}\n${packCss(th.p)}\n${patternCss(th.pat)}` : '');
/* كل الشخصيات والنقوش دفعة واحدة (للمعاينة داخل لوحة التاجر) */
export const allThemeCss = () => `${SHOP_BASE}\n${PERSONALITIES.map(packCss).join('\n')}\n${Object.keys(PATTERNS).map(patternCss).join('\n')}`;
