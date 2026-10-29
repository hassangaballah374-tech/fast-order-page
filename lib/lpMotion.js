/* أنماط صفحات الهبوط الهادئة + الحركة */
/* يضيف pseudo/hover لكل محدد في قائمة */
const ps = (list, x) => list.split(',').map((q) => q + x).join(',');

const C = '& .lp-card,& .lp-bi,& .lp-tc,& .lp-fq,& .lp-guar,& .lp-order .card,& .lp-order .frm';
const I = '& .lp-img,& .lp-frame,& .lp-gi';
const B = '& .lp-btn';
const T2 = '& .lp-h2,& .lp-cta h2';
const LHL = 'background:linear-gradient(transparent 64%,color-mix(in srgb,var(--lp-primary) 36%,transparent) 64%)';

export const LP_MODERN = {
  brutal: `${C},${I}{border:2px solid var(--lp-text)!important;border-radius:16px!important;box-shadow:4px 4px 0 var(--lp-text)!important}
${B}{border:2px solid var(--lp-text);border-radius:14px!important;box-shadow:4px 4px 0 var(--lp-text)!important;animation:none!important}${ps(B,'::after')}{display:none}
${T2}{display:table;margin-inline:auto;${LHL};padding:0 6px}`,
  retro: `${C},${I}{border:1px solid var(--lp-line)!important;border-radius:18px!important;box-shadow:0 1px 0 var(--lp-line),0 18px 32px -22px var(--lp-primary)!important}
${B}{border-radius:14px!important;box-shadow:0 5px 0 var(--lp-dark);animation:none!important}${ps(B,'::after')}{display:none}
${ps(T2,'::before')}{content:'';display:inline-block;width:10px;height:10px;border-radius:50%;background:var(--lp-primary);margin-inline-end:10px}`,
  kids: `${C},${I}{border:2px solid color-mix(in srgb,var(--lp-text) 14%,transparent)!important;border-radius:26px!important;box-shadow:0 8px 0 -3px color-mix(in srgb,var(--lp-primary) 32%,transparent)!important}
${B}{border-radius:999px!important;box-shadow:0 5px 0 var(--lp-dark);animation:none!important}${ps(B,'::after')}{display:none}
& .lp-badge,& .lp-ribbon{background:#ffb020;color:#111;border-radius:999px}`,
  paper: `${C}{border:1px solid var(--lp-line)!important;border-radius:12px!important;box-shadow:0 2px 0 var(--lp-line),0 18px 28px -22px rgba(0,0,0,.35)!important}
${I}{border-radius:8px!important;border:6px solid #fff!important;box-shadow:0 2px 12px rgba(0,0,0,.16)}
${T2}{display:table;margin-inline:auto;${LHL}}${B}{border-radius:10px!important}`,
  sport: `& .lp-hero h1,${T2}{font-style:italic;font-weight:900;letter-spacing:-.5px}
${C}{border:1px solid var(--lp-line)!important;border-inline-start:4px solid var(--lp-primary)!important;border-radius:14px!important;box-shadow:none!important}
${B}{border-radius:10px!important;letter-spacing:.3px}${I}{border-radius:16px!important}`,
  souk: `${C},${I}{border:1px solid color-mix(in srgb,var(--lp-primary) 45%,transparent)!important;border-radius:14px!important;box-shadow:none!important}
${ps(T2,'::after')}{content:'';display:block;width:54px;height:3px;border-radius:4px;background:var(--lp-primary);margin:8px auto 0}${B}{border-radius:10px!important}`,
  royal: `${C},${I}{border:1px solid color-mix(in srgb,var(--lp-primary) 40%,transparent)!important;border-radius:14px!important;box-shadow:0 18px 34px -24px var(--lp-primary)!important}
${ps(T2,'::after')}{content:'';display:block;width:60px;height:2px;background:#d4af37;margin:8px auto 0}${T2}{color:var(--lp-primary)}
${B}{border-radius:12px!important;box-shadow:0 0 0 1px #d4af37 inset,0 18px 34px -14px var(--lp-primary)}`,
  pastel: `${C}{border:0!important;border-radius:26px!important;box-shadow:0 18px 36px -22px color-mix(in srgb,var(--lp-primary) 50%,transparent)!important}
${I}{border-radius:28px!important}${B}{border-radius:999px!important;animation:none!important}${ps(B,'::after')}{display:none}
& .lp-badge,& .lp-ribbon{border-radius:999px}`,
  organic: `${C}{border-radius:28px!important;box-shadow:0 20px 34px -24px color-mix(in srgb,var(--lp-primary) 60%,#000)}
${I}{border-radius:44px 14px 44px 14px!important}${B}{border-radius:999px!important}`,
  candy: `${B}{background:linear-gradient(135deg,var(--lp-primary),color-mix(in srgb,var(--lp-primary) 45%,#ff7ad9));border-radius:999px!important}
${C},${I}{border-radius:24px!important}& .lp-bi:hover,& .lp-tc:hover{transform:translateY(-5px)}`,
  tech: `${C},${I}{border:1px solid var(--lp-line)!important;border-radius:12px!important;box-shadow:none!important}
${B}{border-radius:10px!important;letter-spacing:.3px}${T2}{border-inline-start:3px solid var(--lp-primary);padding-inline-start:12px;text-align:start}`,
  industrial: `${T2}{display:table;margin-inline:auto;border-bottom:4px solid var(--lp-primary);padding-bottom:4px}
${C},${I}{border:1px solid color-mix(in srgb,var(--lp-text) 35%,transparent)!important;border-radius:8px!important;box-shadow:none!important}
${B}{border-radius:6px!important;animation:none!important}${ps(B,'::after')}{display:none}`,
};

/* ===== حركة صفحة الهبوط: ناعمة وهادفة (تتوقف تلقائياً لمن يفضّل تقليل الحركة) ===== */
export const LP_MOTION = `
@property --lp-a{syntax:'<angle>';inherits:false;initial-value:0deg}
@keyframes lpblob{to{transform:translate(40px,30px) scale(1.15)}}
@keyframes lpdrift{to{transform:translate3d(-3%,2%,0) scale(1.06)}}
@keyframes lpsweep{0%,55%{transform:translateX(-130%)}100%{transform:translateX(130%)}}
@keyframes lpspinA{to{--lp-a:360deg}}
@keyframes lpripple{0%{opacity:.55;transform:scale(1)}70%,100%{opacity:0;transform:scale(1.55)}}
@keyframes lptick{0%{transform:translateY(-7px);opacity:.25}35%,100%{transform:none;opacity:1}}
@keyframes lpblink{50%{opacity:.25}}
@keyframes lpin{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
@keyframes lpslide{from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:none}}
@keyframes lpbar{to{transform:scaleX(1)}}

.lp::before{animation:lpdrift 20s ease-in-out infinite alternate}

/* Hero: توهج متحرك خلف المنتج + دخول متتابع للعناصر */
.lp .lp-hero{position:relative;isolation:isolate}
.lp .lp-hero::before,.lp .lp-hero::after{content:'';position:absolute;z-index:-1;border-radius:50%;filter:blur(72px);pointer-events:none;opacity:.5}
.lp .lp-hero::before{width:340px;height:340px;top:-60px;inset-inline-end:-40px;background:color-mix(in srgb,var(--lp-primary) 42%,transparent);animation:lpblob 14s ease-in-out infinite alternate}
.lp .lp-hero::after{width:260px;height:260px;bottom:-40px;inset-inline-start:-30px;background:color-mix(in srgb,var(--lp-primary) 26%,#8b5cf6 28%);animation:lpblob 18s ease-in-out infinite alternate-reverse}
.lp .lp-hero-t.on>*:not(.lp-btn){animation:lpin .8s cubic-bezier(.2,.7,.2,1) both}
.lp .lp-hero-t.on>*:nth-child(2){animation-delay:.07s}.lp .lp-hero-t.on>*:nth-child(3){animation-delay:.14s}.lp .lp-hero-t.on>*:nth-child(4){animation-delay:.21s}
.lp .lp-hero-t.on>*:nth-child(5){animation-delay:.28s}.lp .lp-hero-t.on>*:nth-child(6){animation-delay:.35s}.lp .lp-hero-t.on>*:nth-child(7){animation-delay:.42s}.lp .lp-hero-t.on>*:nth-child(8){animation-delay:.49s}
.lp .lp-badge{position:relative;overflow:hidden}
.lp .lp-badge::after{content:'';position:absolute;inset:0;background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.55) 50%,transparent 70%);animation:lpsweep 3.8s ease-in-out infinite;pointer-events:none}

/* إطار المنتج: حلقة ضوء تدور + ميل ثلاثي الأبعاد خفيف */
.lp .lp-frame{isolation:isolate;transition:transform .55s cubic-bezier(.2,.7,.2,1)}
.lp .lp-frame::before{content:'';position:absolute;inset:-3px;border-radius:inherit;z-index:-1;background:conic-gradient(from var(--lp-a),transparent 0 50%,var(--lp-primary) 78%,transparent);filter:blur(16px);opacity:.5;animation:lpspinA 7s linear infinite}
.lp .lp-frame:hover{transform:perspective(900px) rotateY(-4deg) rotateX(2deg) translateY(-4px)}

/* المميزات: خط علوي يتمدد + أيقونة تتحرك + نبضة هادئة */
.lp .lp-bi{position:relative;overflow:hidden}
.lp .lp-bi::before{content:'';position:absolute;top:0;inset-inline:0;height:3px;background:linear-gradient(90deg,transparent,var(--lp-primary),transparent);transform:scaleX(0);transition:transform .5s cubic-bezier(.2,.7,.2,1)}
.lp .lp-bi:hover::before{transform:scaleX(1)}
.lp .lp-ic{position:relative;transition:transform .4s cubic-bezier(.3,1.6,.5,1)}
.lp .lp-bi:hover .lp-ic{transform:scale(1.12) rotate(-6deg)}
.lp .lp-ic::after{content:'';position:absolute;inset:-1px;border-radius:inherit;border:2px solid var(--lp-primary);opacity:0;animation:lpripple 3.2s ease-out infinite}
.lp .lp-ben>*:nth-child(2) .lp-ic::after{animation-delay:.5s}.lp .lp-ben>*:nth-child(3) .lp-ic::after{animation-delay:1s}
.lp .lp-ben>*:nth-child(4) .lp-ic::after{animation-delay:1.5s}.lp .lp-ben>*:nth-child(5) .lp-ic::after{animation-delay:2s}.lp .lp-ben>*:nth-child(6) .lp-ic::after{animation-delay:2.5s}

/* الأقسام: ظهور مع تلاشي ضبابي خفيف */
.lp .lp-sec .lp-rv{filter:blur(5px);transition:opacity .7s cubic-bezier(.2,.7,.2,1),transform .7s cubic-bezier(.2,.7,.2,1),filter .7s}
.lp .lp-sec .lp-rv.on{filter:none}

/* آراء العملاء + الأسئلة + الضمان */
.lp .lp-tc{transition:transform .3s,box-shadow .3s}
.lp .lp-tc:hover{transform:translateY(-4px);box-shadow:0 24px 40px -28px var(--lp-primary)}
.lp .lp-fq{transition:border-color .25s,background .25s}
.lp .lp-fq.open{border-color:color-mix(in srgb,var(--lp-primary) 55%,transparent)}
.lp .lp-shield{animation:lpfloat 4s ease-in-out infinite}

/* العدّاد: الثواني تنبض والنقطتان تومضان */
.lp .lp-cd-c{animation:lpblink 1s steps(2) infinite}
.lp .lp-cd-r>.lp-cd-b:last-child b{display:inline-block;animation:lptick 1s ease-out infinite}

/* الزر: السهم يتحرك + ضغطة */
.lp .lp-btn span{display:inline-block;transition:transform .25s}
.lp .lp-btn:hover span{transform:translateX(-7px)}
.lp .lp-btn:active{transform:scale(.97)}

/* صندوق الطلب: حدود متدرجة تدور ببطء */
.lp .lp-order{border:1.5px solid transparent;background:linear-gradient(var(--lp-card),var(--lp-card)) padding-box,linear-gradient(var(--lp-bg),var(--lp-bg)) padding-box,conic-gradient(from var(--lp-a),color-mix(in srgb,var(--lp-primary) 14%,transparent),var(--lp-primary),color-mix(in srgb,var(--lp-primary) 14%,transparent) 40%,color-mix(in srgb,var(--lp-primary) 14%,transparent)) border-box;animation:lpspinA 8s linear infinite}
.lp .lp-sticky{animation:lpslide .5s cubic-bezier(.2,.7,.2,1)}

/* شريط تقدّم التمرير (يظهر في المتصفحات الحديثة فقط) */
@supports (animation-timeline:scroll()){
.lp::after{content:'';position:fixed;top:0;inset-inline:0;height:3px;z-index:130;background:linear-gradient(90deg,var(--lp-primary),color-mix(in srgb,var(--lp-primary) 50%,#fff));transform:scaleX(0);transform-origin:100% 50%;animation:lpbar linear both;animation-timeline:scroll(root);pointer-events:none}
}

/* ثيمات هادئة بدون توهج خلف الهيرو */
.lp[data-p="mono"] .lp-hero::before,.lp[data-p="mono"] .lp-hero::after,.lp[data-p="editorial"] .lp-hero::before,.lp[data-p="editorial"] .lp-hero::after,
.lp[data-p="noir"] .lp-hero::before,.lp[data-p="noir"] .lp-hero::after,.lp[data-p="brutal"] .lp-hero::before,.lp[data-p="brutal"] .lp-hero::after,
.lp[data-p="industrial"] .lp-hero::before,.lp[data-p="industrial"] .lp-hero::after,.lp[data-p="paper"] .lp-hero::before,.lp[data-p="paper"] .lp-hero::after,
.lp[data-p="softui"] .lp-hero::before,.lp[data-p="softui"] .lp-hero::after{display:none}
.lp[data-p="brutal"] .lp-frame::before,.lp[data-p="mono"] .lp-frame::before,.lp[data-p="editorial"] .lp-frame::before,.lp[data-p="industrial"] .lp-frame::before{display:none}

@media (prefers-reduced-motion:reduce){
.lp *,.lp *::before,.lp *::after{animation:none!important;transition:none!important}
.lp .lp-rv,.lp .lp-sec .lp-rv{opacity:1!important;transform:none!important;filter:none!important}
}
`;
