/* ===== لمسة مودرن: حقول بيانات أنيقة + ألوان نصوص صحيحة + نسخ هادئة لشخصيات الثيمات (بدون دوران/قص/حدود ثقيلة) =====
   & = .spk[data-p="id"] في المتجر، و = .lp[data-p="id"] في صفحة الهبوط */

/* قاعدة المتجر: حقول وأزرار وكروت بلمسة حديثة لكل الثيمات */
export const SHOP_BASE = `
.spk h1,.spk h2,.spk h3{letter-spacing:-.2px}
.spk .in{min-height:48px;background:color-mix(in srgb,var(--ink) 4%,var(--card));color:var(--ink);border:1.5px solid color-mix(in srgb,var(--ink) 12%,transparent);border-radius:calc(var(--r) - 4px);padding:12px 15px;font-size:15px;font-weight:500;transition:border-color .2s,box-shadow .2s,background .2s}
.spk .in::placeholder{color:var(--mut);opacity:.65;font-weight:400}
.spk .in:hover{border-color:color-mix(in srgb,var(--ink) 24%,transparent)}
.spk .in:focus{outline:none;border-color:var(--c);background:var(--card);box-shadow:0 0 0 4px color-mix(in srgb,var(--c) 18%,transparent)}
.spk select.in{appearance:none;-webkit-appearance:none;padding-inline-end:40px;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='9' viewBox='0 0 14 9'><path d='M1 1.5l6 6 6-6' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>");background-repeat:no-repeat;background-position:left 15px center;background-size:14px}
.spk select.in option{background:var(--card);color:var(--ink)}
.spk .fld label{color:var(--ink);opacity:.82;font-weight:700;font-size:13px;letter-spacing:0}
.spk .b.p{box-shadow:0 12px 26px -14px var(--c)}
.spk .pc{transition:transform .25s,box-shadow .25s}
.spk .pc:hover{transform:translateY(-3px)}
`;

/* قاعدة صفحة الهبوط: ربط متغيرات المتجر بألوان الصفحة (يحل مشكلة ألوان الحقول والنصوص) */
export const LP_BASE = `
.lp{--bg:var(--lp-bg);--card:var(--lp-card);--ink:var(--lp-text);--mut:color-mix(in srgb,var(--lp-text) 62%,var(--lp-bg));--ln:var(--lp-line);--c:var(--lp-primary);--onc:var(--lp-btn-text);--r:var(--lp-r)}
.lp .in{min-height:50px;background:color-mix(in srgb,var(--lp-text) 5%,var(--lp-bg));color:var(--lp-text);border:1.5px solid color-mix(in srgb,var(--lp-text) 14%,transparent);border-radius:calc(var(--lp-r) - 2px);padding:13px 16px;font-size:15px;font-weight:500;transition:border-color .2s,box-shadow .2s,background .2s}
.lp .in::placeholder{color:var(--lp-text);opacity:.45;font-weight:400}
.lp .in:hover{border-color:color-mix(in srgb,var(--lp-text) 28%,transparent)}
.lp .in:focus{outline:none;border-color:var(--lp-primary);background:var(--lp-bg);box-shadow:0 0 0 4px color-mix(in srgb,var(--lp-primary) 20%,transparent)}
.lp select.in{appearance:none;-webkit-appearance:none;padding-inline-end:40px;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='9' viewBox='0 0 14 9'><path d='M1 1.5l6 6 6-6' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>");background-repeat:no-repeat;background-position:left 15px center;background-size:14px}
.lp select.in option{background:var(--lp-bg);color:var(--lp-text)}
.lp .fld label{color:var(--lp-text);opacity:.85;font-weight:700}
.lp-order .card,.lp-order .frm,.lp-order{color:var(--lp-text)}
`;

const HL = 'background:linear-gradient(transparent 64%,color-mix(in srgb,var(--c) 38%,transparent) 64%)';

export const MODERN_PACKS = {
  brutal: `
& .hd{border-bottom:2px solid var(--ink)}
& .pc,& .ti,& .cat,& .card{border:2px solid var(--ink)!important;border-radius:16px!important;box-shadow:4px 4px 0 var(--ink)!important}
& .b{border:2px solid var(--ink)!important;border-radius:12px!important;box-shadow:3px 3px 0 var(--ink)!important;font-weight:800}
& .b:hover{transform:translate(1px,1px);box-shadow:2px 2px 0 var(--ink)!important}
& .b.p::after{display:none}
& .sh h2{display:inline;${HL};padding:0 4px}
& .hero{border:2px solid var(--ink);box-shadow:6px 6px 0 var(--ink);border-radius:22px}
& .pc-img{border-bottom:2px solid var(--ink)}
& .bdg{border-radius:999px;border:2px solid var(--ink)}
& .ann{border-bottom:2px solid var(--ink);font-weight:800}`,
  retro: `
& .hd{background:var(--card);border-bottom:1px solid var(--ln)}
& .pc,& .ti,& .cat,& .card{border:1px solid var(--ln)!important;border-radius:18px!important;box-shadow:0 1px 0 var(--ln),0 16px 30px -20px color-mix(in srgb,var(--c) 55%,#000)!important}
& .b{border-radius:12px!important}
& .b.p{box-shadow:0 4px 0 color-mix(in srgb,var(--c) 60%,#000)}
& .b.p:active{transform:translateY(3px);box-shadow:none}
& .b.p::after{display:none}
& .sh h2::before{content:'';display:inline-block;width:10px;height:10px;border-radius:50%;background:var(--c);margin-inline-end:10px}
& .hero{border-radius:26px}`,
  kids: `
& .hd{border-bottom:4px solid transparent;border-image:linear-gradient(90deg,#ff5d5d,#ffb020,#3ddc84,#3aa0ff,#a24bff) 1}
& .pc,& .ti,& .cat,& .card{border:2px solid color-mix(in srgb,var(--ink) 14%,transparent)!important;border-radius:26px!important;box-shadow:0 8px 0 -3px color-mix(in srgb,var(--c) 32%,transparent)!important}
& .b{border-radius:999px!important;font-weight:900}
& .b.p{box-shadow:0 5px 0 color-mix(in srgb,var(--c) 60%,#000)}
& .b.p:active{transform:translateY(4px);box-shadow:none}
& .b.p::after{display:none}
& .bdg{border-radius:999px;background:#ffb020;color:#111}
& .hero{border-radius:32px}`,
  paper: `
& .pc,& .ti,& .cat,& .card{border:1px solid var(--ln)!important;border-radius:12px!important;box-shadow:0 2px 0 var(--ln),0 18px 28px -22px rgba(0,0,0,.35)!important}
& .pc-img{border-radius:6px;margin:8px 8px 0;border:5px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,.14)}
& .sh h2{display:inline;${HL}}
& .b{border-radius:8px!important}
& .hero{border-radius:14px}`,
  sport: `
& h1,& h2,& h3,& .logo{font-weight:900;font-style:italic;letter-spacing:-.4px}
& .pc,& .ti,& .cat,& .card{border:1px solid var(--ln)!important;border-inline-start:4px solid var(--c)!important;border-radius:14px!important;box-shadow:none!important}
& .b{border-radius:10px!important;font-weight:900;letter-spacing:.3px}
& .hero{border-radius:20px}
& .sh h2{border-inline-start:6px solid var(--c);padding-inline-start:12px}`,
  souk: `
& .hd{background:var(--card);border-bottom:3px solid var(--c)}
& .pc,& .ti,& .cat,& .card{border:1px solid color-mix(in srgb,var(--c) 45%,transparent)!important;outline:1px solid color-mix(in srgb,var(--c) 22%,transparent);outline-offset:-6px;border-radius:14px!important;box-shadow:none!important}
& .bdg{border-radius:6px}
& .b{border-radius:10px!important}
& .sh h2::after{content:'';display:block;width:54px;height:3px;border-radius:4px;background:var(--c);margin-top:7px}
& .hero{border-radius:16px;border:1px solid color-mix(in srgb,var(--c) 45%,transparent)}`,
  royal: `
& .hd{background:linear-gradient(90deg,color-mix(in srgb,var(--c) 88%,#000),var(--c));border:0;border-bottom:2px solid #d4af37}
& .hd,& .hd a,& .hd .logo,& .hd .nav a{color:var(--onc)}
& .cartb{background:rgba(255,255,255,.16);color:var(--onc);border-color:rgba(255,255,255,.35)}
& .pc,& .ti,& .cat,& .card{border:1px solid color-mix(in srgb,var(--c) 38%,transparent)!important;border-radius:14px!important;box-shadow:0 18px 34px -24px color-mix(in srgb,var(--c) 70%,#000)!important}
& .hero{border-radius:16px;box-shadow:0 0 0 1px #d4af37,0 24px 50px -28px var(--c)}
& .sh{text-align:center}
& .sh h2::after{content:'';display:block;width:60px;height:2px;background:#d4af37;margin:8px auto 0}
& .b.p{border-radius:12px!important;background:linear-gradient(135deg,var(--c),color-mix(in srgb,var(--c) 70%,#000))}`,
  pastel: `
& .pc,& .ti,& .cat,& .card{border:0!important;border-radius:26px!important;box-shadow:0 18px 36px -22px color-mix(in srgb,var(--c) 50%,transparent)!important}
& .pc-img{border-radius:20px;margin:8px 8px 0}
& .b{border-radius:999px!important;font-weight:800}
& .b.p::after{display:none}
& .hero{border-radius:34px}
& .bdg{border-radius:999px}`,
  organic: `
& .pc,& .ti,& .cat,& .card{border:1px solid var(--ln)!important;border-radius:28px!important;box-shadow:0 20px 34px -24px color-mix(in srgb,var(--c) 60%,#000)!important}
& .pc-img{border-radius:22px;margin:8px 8px 0}
& .b{border-radius:999px!important}
& .hero{border-radius:44px 14px 44px 14px}`,
  candy: `
& .b.p{background:linear-gradient(135deg,var(--c),color-mix(in srgb,var(--c) 45%,#ff7ad9));border-radius:999px!important;box-shadow:0 14px 26px -12px var(--c)}
& .pc{border-radius:24px!important;border:0!important;box-shadow:0 18px 32px -22px var(--c)!important}
& .pc:hover{transform:translateY(-5px) scale(1.01)}
& .ti,& .cat,& .card{border-radius:22px!important}
& .bdg{border-radius:999px}
& .hero{border-radius:32px}`,
  tech: `
& .hd{background:color-mix(in srgb,var(--card) 90%,transparent);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);border-bottom:1px solid var(--ln)}
& .pc,& .ti,& .cat,& .card{border:1px solid var(--ln)!important;border-radius:12px!important;background:linear-gradient(180deg,color-mix(in srgb,var(--ink) 4%,var(--card)),var(--card));box-shadow:0 0 0 1px color-mix(in srgb,var(--c) 6%,transparent)!important}
& .pc:hover{border-color:var(--c)!important}
& .b{border-radius:9px!important;font-size:13.5px;font-weight:700}
& .sh h2{border-inline-start:3px solid var(--c);padding-inline-start:12px}
& .hero{border-radius:14px}`,
  industrial: `
& .ann{background:var(--ink);color:var(--c);font-weight:800;letter-spacing:.5px}
& .hd{background:var(--card);border-bottom:1px solid var(--ink)}
& .pc,& .ti,& .cat,& .card{border:1px solid color-mix(in srgb,var(--ink) 35%,transparent)!important;border-radius:8px!important;box-shadow:none!important}
& .b{border-radius:6px!important;font-weight:800}
& .sh h2{display:inline-block;border-bottom:4px solid var(--c);padding-bottom:4px}
& .hero{border-radius:10px}`,
};

const C = '& .lp-card,& .lp-bi,& .lp-tc,& .lp-fq,& .lp-guar,& .lp-order .card,& .lp-order .frm';
const I = '& .lp-img,& .lp-frame,& .lp-gi';
const B = '& .lp-btn';
const T2 = '& .lp-h2,& .lp-cta h2';
const LHL = 'background:linear-gradient(transparent 64%,color-mix(in srgb,var(--lp-primary) 36%,transparent) 64%)';

export const LP_MODERN = {
  brutal: `${C},${I}{border:2px solid var(--lp-text)!important;border-radius:16px!important;box-shadow:4px 4px 0 var(--lp-text)!important}
${B}{border:2px solid var(--lp-text);border-radius:14px!important;box-shadow:4px 4px 0 var(--lp-text)!important;animation:none!important}${B}::after{display:none}
${T2}{display:table;margin-inline:auto;${LHL};padding:0 6px}`,
  retro: `${C},${I}{border:1px solid var(--lp-line)!important;border-radius:18px!important;box-shadow:0 1px 0 var(--lp-line),0 18px 32px -22px var(--lp-primary)!important}
${B}{border-radius:14px!important;box-shadow:0 5px 0 var(--lp-dark);animation:none!important}${B}::after{display:none}
${T2}::before{content:'';display:inline-block;width:10px;height:10px;border-radius:50%;background:var(--lp-primary);margin-inline-end:10px}`,
  kids: `${C},${I}{border:2px solid color-mix(in srgb,var(--lp-text) 14%,transparent)!important;border-radius:26px!important;box-shadow:0 8px 0 -3px color-mix(in srgb,var(--lp-primary) 32%,transparent)!important}
${B}{border-radius:999px!important;box-shadow:0 5px 0 var(--lp-dark);animation:none!important}${B}::after{display:none}
& .lp-badge,& .lp-ribbon{background:#ffb020;color:#111;border-radius:999px}`,
  paper: `${C}{border:1px solid var(--lp-line)!important;border-radius:12px!important;box-shadow:0 2px 0 var(--lp-line),0 18px 28px -22px rgba(0,0,0,.35)!important}
${I}{border-radius:8px!important;border:6px solid #fff!important;box-shadow:0 2px 12px rgba(0,0,0,.16)}
${T2}{display:table;margin-inline:auto;${LHL}}${B}{border-radius:10px!important}`,
  sport: `& .lp-hero h1,${T2}{font-style:italic;font-weight:900;letter-spacing:-.5px}
${C}{border:1px solid var(--lp-line)!important;border-inline-start:4px solid var(--lp-primary)!important;border-radius:14px!important;box-shadow:none!important}
${B}{border-radius:10px!important;letter-spacing:.3px}${I}{border-radius:16px!important}`,
  souk: `${C},${I}{border:1px solid color-mix(in srgb,var(--lp-primary) 45%,transparent)!important;border-radius:14px!important;box-shadow:none!important}
${T2}::after{content:'';display:block;width:54px;height:3px;border-radius:4px;background:var(--lp-primary);margin:8px auto 0}${B}{border-radius:10px!important}`,
  royal: `${C},${I}{border:1px solid color-mix(in srgb,var(--lp-primary) 40%,transparent)!important;border-radius:14px!important;box-shadow:0 18px 34px -24px var(--lp-primary)!important}
${T2}::after{content:'';display:block;width:60px;height:2px;background:#d4af37;margin:8px auto 0}${T2}{color:var(--lp-primary)}
${B}{border-radius:12px!important;box-shadow:0 0 0 1px #d4af37 inset,0 18px 34px -14px var(--lp-primary)}`,
  pastel: `${C}{border:0!important;border-radius:26px!important;box-shadow:0 18px 36px -22px color-mix(in srgb,var(--lp-primary) 50%,transparent)!important}
${I}{border-radius:28px!important}${B}{border-radius:999px!important;animation:none!important}${B}::after{display:none}
& .lp-badge,& .lp-ribbon{border-radius:999px}`,
  organic: `${C}{border-radius:28px!important;box-shadow:0 20px 34px -24px color-mix(in srgb,var(--lp-primary) 60%,#000)}
${I}{border-radius:44px 14px 44px 14px!important}${B}{border-radius:999px!important}`,
  candy: `${B}{background:linear-gradient(135deg,var(--lp-primary),color-mix(in srgb,var(--lp-primary) 45%,#ff7ad9));border-radius:999px!important}
${C},${I}{border-radius:24px!important}& .lp-bi:hover,& .lp-tc:hover{transform:translateY(-5px)}`,
  tech: `${C},${I}{border:1px solid var(--lp-line)!important;border-radius:12px!important;box-shadow:none!important}
${B}{border-radius:10px!important;letter-spacing:.3px}${T2}{border-inline-start:3px solid var(--lp-primary);padding-inline-start:12px;text-align:start}`,
  industrial: `${T2}{display:table;margin-inline:auto;border-bottom:4px solid var(--lp-primary);padding-bottom:4px}
${C},${I}{border:1px solid color-mix(in srgb,var(--lp-text) 35%,transparent)!important;border-radius:8px!important;box-shadow:none!important}
${B}{border-radius:6px!important;animation:none!important}${B}::after{display:none}`,
};
