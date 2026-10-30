/* ===== CSS الأقسام الجديدة + غلاف القسم (خلفية/مسافات/محاذاة/عرض/حركة/إخفاء) + وضع المحرر ===== */
export const LP_BLOCKS_CSS = `
/* غلاف القسم */
.lp .lp-s{position:relative}
.lp .lp-s[data-bg]{isolation:isolate}
.lp .lp-s[data-bg]::before{content:'';position:absolute;inset:0 -50vw;z-index:-1;background:var(--lp-sbgv)}
.lp .lp-s[data-bg="soft"]{--lp-sbgv:var(--lp-soft)}
.lp .lp-s[data-bg="card"]{--lp-sbgv:color-mix(in srgb,var(--lp-text) 5%,var(--lp-bg))}
.lp .lp-s[data-bg="custom"]{--lp-sbgv:var(--lp-sbg,transparent)}
.lp .lp-s[data-bg="primary"],.lp .lp-s[data-bg="grad"]{--lp-text:var(--lp-btn-text);--lp-line:color-mix(in srgb,var(--lp-btn-text) 26%,transparent);--lp-card:color-mix(in srgb,var(--lp-btn-text) 12%,transparent);--lp-soft:color-mix(in srgb,var(--lp-btn-text) 14%,transparent);color:var(--lp-btn-text)}
.lp .lp-s[data-bg="primary"]{--lp-sbgv:var(--lp-primary)}
.lp .lp-s[data-bg="grad"]{--lp-sbgv:linear-gradient(135deg,var(--lp-primary),var(--lp-dark))}
.lp .lp-s[data-bg="dark"]{--lp-sbgv:#0e1014;--lp-text:#f5f5f6;--lp-line:rgba(255,255,255,.16);--lp-card:rgba(255,255,255,.07);--lp-soft:rgba(255,255,255,.1);color:#f5f5f6}
.lp .lp-s[data-bg="primary"] .lp-btn,.lp .lp-s[data-bg="grad"] .lp-btn{background:var(--lp-btn-text);color:var(--lp-primary);box-shadow:0 14px 28px -14px rgba(0,0,0,.5);animation:none}
.lp .lp-s[data-bg="primary"] .lp-stat b,.lp .lp-s[data-bg="grad"] .lp-stat b{background:none;color:var(--lp-btn-text)}
.lp .lp-s[data-pad="none"] .lp-sec,.lp .lp-s[data-pad="none"] .lp-hero{padding-block:0}
.lp .lp-s[data-pad="sm"] .lp-sec,.lp .lp-s[data-pad="sm"] .lp-hero{padding-block:10px}
.lp .lp-s[data-pad="lg"] .lp-sec,.lp .lp-s[data-pad="lg"] .lp-hero{padding-block:58px}
.lp .lp-s[data-pad="xl"] .lp-sec,.lp .lp-s[data-pad="xl"] .lp-hero{padding-block:100px}
.lp .lp-s[data-align="right"]{text-align:right}.lp .lp-s[data-align="center"]{text-align:center}.lp .lp-s[data-align="left"]{text-align:left}
.lp .lp-s[data-align] .lp-h2{text-align:inherit}
.lp .lp-s[data-w="narrow"]{--lp-w:560px}.lp .lp-s[data-w="wide"]{--lp-w:900px}.lp .lp-s[data-w="full"]{--lp-w:1060px}
.lp .lp-s[data-anim="none"] .lp-rv{opacity:1!important;transform:none!important;filter:none!important;transition:none!important}
.lp .lp-s[data-anim="fade"] .lp-rv:not(.on){transform:none;filter:none}
.lp .lp-s[data-anim="zoom"] .lp-rv:not(.on){transform:scale(.86);filter:none}
.lp .lp-s[data-anim="slide"] .lp-rv:not(.on){transform:translateX(70px);filter:none}
@media(max-width:700px){.lp:not(.lp-builder) .lp-hide-m{display:none}.lp .lp-s[data-pad="lg"] .lp-sec{padding-block:40px}.lp .lp-s[data-pad="xl"] .lp-sec{padding-block:64px}}
@media(min-width:701px){.lp:not(.lp-builder) .lp-hide-d{display:none}}

/* وضع المحرر (داخل الـ iframe) */
.lp-builder .lp-rv{opacity:1!important;transform:none!important;filter:none!important}
.lp-builder .lp-s{cursor:pointer}
.lp-builder .lp-s:hover{outline:2px dashed color-mix(in srgb,var(--lp-primary) 75%,transparent);outline-offset:-2px}
.lp-builder .lp-s.lp-picked{outline:3px solid var(--lp-primary);outline-offset:-3px}
.lp-builder .lp-s.lp-picked::after{content:attr(data-label);position:absolute;top:0;inset-inline-start:0;z-index:9;background:var(--lp-primary);color:var(--lp-btn-text);font:800 12px/1 inherit;padding:6px 10px;border-radius:0 0 8px 0}
.lp-builder .lp-hide-m,.lp-builder .lp-hide-d{opacity:.45}
.lp-builder .lp-sticky,.lp-builder .lp-wa{display:none}

/* عنوان كبير */
.lp-hdg[data-align="right"]{text-align:right}.lp-hdg[data-align="left"]{text-align:left}.lp-hdg[data-align="center"]{text-align:center}
.lp-hdg .lp-h2{text-align:inherit;margin-bottom:8px}
.lp-hdg[data-size="md"] .lp-h2{font-size:clamp(22px,4vw,30px)}
.lp-hdg[data-size="lg"] .lp-h2{font-size:clamp(28px,6vw,46px)}
.lp-hdg[data-size="xl"] .lp-h2{font-size:clamp(34px,8.4vw,66px);letter-spacing:-1px;line-height:1.15}
.lp-hdg[data-align="center"] .lp-sub{margin-inline:auto}
.lp-hdg .lp-sub{max-width:640px}
/* زر مخصص */
.lp-brow{text-align:center}
.lp-brow .lp-btn{width:auto;min-width:min(100%,260px);text-decoration:none}
.lp-brow .lp-btn-md{font-size:16px;padding:13px 24px}
.lp-brow .lp-btn-outline{background:transparent;color:var(--lp-primary);box-shadow:inset 0 0 0 2px var(--lp-primary);animation:none}
.lp-brow .lp-btn-soft{background:var(--lp-soft);color:var(--lp-primary);box-shadow:none;animation:none}
.lp-brow .lp-btn-outline::after,.lp-brow .lp-btn-soft::after{display:none}
/* صورة + نص */
.lp-m{max-width:min(100%,max(var(--lp-w),940px));margin-inline:auto}
.lp-split{display:grid;gap:26px;align-items:center}
@media(min-width:760px){.lp-split{grid-template-columns:1fr 1fr;gap:46px}.lp-split[data-side="left"] .lp-split-i{order:2}}
.lp-split h2{text-align:start;font-size:clamp(24px,4.4vw,36px);font-weight:900;line-height:1.3;margin:0 0 12px}
.lp-pts{list-style:none;padding:0;margin:14px 0 18px;display:grid;gap:10px}
.lp-pts li{display:flex;gap:10px;align-items:flex-start;font-weight:700}
.lp-pts li::before{content:'✓';flex:none;width:22px;height:22px;border-radius:50%;background:var(--lp-primary);color:var(--lp-btn-text);display:grid;place-items:center;font-size:13px;margin-top:2px}
/* أرقام */
.lp-stats{display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(150px,1fr))}
.lp-stat{text-align:center;padding:10px}
.lp-stat b{display:block;font-size:clamp(34px,6.4vw,54px);font-weight:900;line-height:1.1;background:linear-gradient(135deg,var(--lp-primary),var(--lp-dark));-webkit-background-clip:text;background-clip:text;color:transparent}
.lp-stat span{opacity:.78;font-weight:700;font-size:14px}
/* خطوات */
.lp-steps{display:grid;gap:22px 14px;grid-template-columns:repeat(auto-fit,minmax(200px,1fr))}
.lp-step{position:relative;text-align:center}
.lp-step i{font-style:normal;width:56px;height:56px;border-radius:50%;display:grid;place-items:center;margin:0 auto 12px;font-weight:900;font-size:22px;background:linear-gradient(135deg,var(--lp-primary),var(--lp-dark));color:var(--lp-btn-text);box-shadow:0 14px 26px -12px var(--lp-primary);position:relative;z-index:1}
.lp-step p{opacity:.78;margin:6px 0 0;line-height:1.8;font-size:14.5px}
@media(min-width:760px){.lp-step:not(:last-child)::after{content:'';position:absolute;top:27px;inset-inline-start:calc(50% + 40px);width:calc(100% - 66px);height:2px;background:repeating-linear-gradient(90deg,var(--lp-line) 0 8px,transparent 8px 16px)}}
/* مقارنة */
.lp-cmp{border-radius:var(--lp-r);overflow:hidden;border:1px solid var(--lp-line);background:var(--lp-card)}
.lp-cmp-r{display:grid;grid-template-columns:1.5fr 1fr 1fr;align-items:center;border-top:1px solid var(--lp-line)}
.lp-cmp-r:first-child{border-top:0;background:var(--lp-soft);font-weight:900}
.lp-cmp-r>div{padding:13px 12px;text-align:center}
.lp-cmp-r>div:first-child{text-align:start;font-weight:700}
.lp-cmp-r>div:nth-child(2){background:color-mix(in srgb,var(--lp-primary) 9%,transparent);font-weight:900}
.lp-yes{color:#16a34a;font-size:20px;font-weight:900}.lp-no{color:#dc2626;font-size:20px;font-weight:900}
/* شريط ثقة */
.lp-logos{display:flex;flex-wrap:wrap;gap:10px;justify-content:center}
.lp-lg{display:inline-flex;align-items:center;gap:8px;padding:10px 16px;border-radius:99px;background:var(--lp-card);border:1px solid var(--lp-line);font-weight:800;font-size:14px;transition:transform .25s,border-color .25s}
.lp-lg:hover{transform:translateY(-3px);border-color:var(--lp-primary)}
.lp-lg img{height:26px;width:auto;display:block}
/* شريط متحرك */
.lp-mq{overflow:hidden;white-space:nowrap;background:var(--lp-primary);color:var(--lp-btn-text);font-weight:900;padding:14px 0;margin-inline:calc(50% - 50vw);font-size:15px}
.lp-mq-t{display:inline-flex;animation:lpmq var(--lp-mq,28s) linear infinite}
.lp-mq:hover .lp-mq-t{animation-play-state:paused}
.lp-mq-t span{padding-inline:18px}
@keyframes lpmq{to{transform:translateX(-50%)}}
/* اقتباس */
.lp-qt{text-align:center;max-width:760px;margin-inline:auto}
.lp-qt blockquote{font-size:clamp(20px,4vw,30px);font-weight:800;line-height:1.6;margin:0 0 14px}
.lp-qt blockquote::before{content:'\\201C';display:block;font-size:80px;line-height:.7;color:var(--lp-primary);opacity:.5;font-family:Georgia,serif}
.lp-qt figcaption{display:inline-flex;align-items:center;gap:10px;font-weight:800;opacity:.85}
.lp-qt figcaption img{width:42px;height:42px;border-radius:50%;object-fit:cover}
/* فاصل */
.lp-dv{display:flex;align-items:center;justify-content:center;gap:14px;color:var(--lp-primary);opacity:.8}
.lp-dv hr{flex:1;border:0;height:1px;background:var(--lp-line);margin:0}
.lp-dv-dots::before{content:'• • • • •';letter-spacing:6px}
.lp-dv-star::before{content:'✦ ✦ ✦'}
.lp-dv-wave{height:14px;background:radial-gradient(circle at 7px -2px,transparent 8px,var(--lp-line) 8.5px,var(--lp-line) 10px,transparent 10.5px) 0 0/14px 14px repeat-x}
/* مكان صورة المنتج في الغلاف */
@media(min-width:880px){.lp .lp-hero[data-layout="right"] .lp-hero-i{order:-1}}
.lp .lp-hero[data-layout="top"]{grid-template-columns:1fr;text-align:center}
.lp .lp-hero[data-layout="top"] .lp-hero-i{order:-1;max-width:600px;width:100%;margin-inline:auto}
.lp .lp-hero[data-layout="top"] .lp-price,.lp .lp-hero[data-layout="top"] .lp-rate,.lp .lp-hero[data-layout="top"] .lp-trust{justify-content:center}
.lp .lp-hero[data-layout="top"] .lp-sub{margin-inline:auto}
.lp .lp-hero[data-layout="top"] .lp-btn{margin-inline:auto}
.lp .lp-hero[data-layout="full"]{grid-template-columns:1fr;position:relative;isolation:isolate;min-height:min(88vh,720px);align-content:center;text-align:center;padding-block:70px;color:#fff;--lp-text:#fff;--lp-line:rgba(255,255,255,.3);--lp-card:rgba(255,255,255,.14)}
.lp .lp-hero[data-layout="full"]::before,.lp .lp-hero[data-layout="full"]::after{display:none}
.lp .lp-hero[data-layout="full"] .lp-hero-i{position:absolute;inset:0 -50vw;z-index:-1;margin:0;max-width:none}
.lp .lp-hero[data-layout="full"] .lp-hero-i::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.42),rgba(0,0,0,.72))}
.lp .lp-hero[data-layout="full"] .lp-frame{height:100%;width:100%;border-radius:0;box-shadow:none;border:0;aspect-ratio:auto;transform:none;padding:0;background:none;filter:none}
.lp .lp-hero[data-layout="full"] .lp-frame::before,.lp .lp-hero[data-layout="full"] .lp-frame::after{display:none}
.lp .lp-hero[data-layout="full"] .lp-price b{color:#fff;background:none;-webkit-text-fill-color:#fff}
.lp .lp-hero[data-layout="full"] .lp-price .old{color:rgba(255,255,255,.7)}
.lp .lp-hero[data-layout="full"] .lp-badge{background:rgba(255,255,255,.18);color:#fff;border-color:rgba(255,255,255,.4);-webkit-text-fill-color:#fff}
.lp .lp-hero[data-layout="full"] .lp-trust span{color:#fff}
.lp .lp-hero[data-layout="full"] .lp-frame{position:absolute;inset:0;overflow:hidden}
.lp .lp-hero[data-layout="full"] .lp-frame img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;animation:none;transform:none;aspect-ratio:auto;border-radius:0}
.lp .lp-hero[data-layout="full"] .lp-float{display:none}
.lp .lp-hero[data-layout="full"] .lp-hero-t{max-width:760px;margin-inline:auto}
.lp .lp-hero[data-layout="full"] .lp-price,.lp .lp-hero[data-layout="full"] .lp-rate,.lp .lp-hero[data-layout="full"] .lp-trust{justify-content:center}
.lp .lp-hero[data-layout="full"] .lp-sub{margin-inline:auto;opacity:.92}
.lp .lp-hero[data-layout="full"] .lp-btn{margin-inline:auto}
/* خانة نص */
.lp-box{display:flex;gap:14px;align-items:flex-start;padding:20px 22px;border-radius:var(--lp-r);line-height:1.9;max-width:760px;margin-inline:auto}
.lp-box[data-align="center"]{text-align:center;justify-content:center}.lp-box[data-align="left"]{text-align:left}.lp-box[data-align="right"]{text-align:right}
.lp-box-i{font-size:30px;line-height:1;flex:none;font-style:normal}
.lp-box-t{min-width:0;flex:0 1 auto}
.lp-box b{display:block;font-size:1.15em;font-weight:900;margin-bottom:4px}
.lp-box p{margin:0;white-space:pre-line}
.lp-box[data-size="sm"]{font-size:14px}.lp-box[data-size="md"]{font-size:16.5px}.lp-box[data-size="lg"]{font-size:21px}.lp-box[data-size="xl"]{font-size:clamp(24px,5vw,32px);line-height:1.6}
.lp-box[data-weight="bold"] p{font-weight:800}
.lp-box[data-v="soft"]{background:var(--lp-soft)}
.lp-box[data-v="card"]{background:var(--lp-card);border:1px solid var(--lp-line);box-shadow:0 18px 36px -24px rgba(0,0,0,.35)}
.lp-box[data-v="outline"]{border:2px solid var(--lp-primary)}
.lp-box[data-v="accent"]{background:linear-gradient(135deg,var(--lp-primary),var(--lp-dark));color:var(--lp-btn-text)}
.lp-box[data-v="quote"]{background:var(--lp-soft);border-start-start-radius:0;border-end-start-radius:0;border-inline-start:5px solid var(--lp-primary)}
.lp-box[data-v="plain"]{padding-inline:0}
@media(max-width:560px){.lp-cmp-r{grid-template-columns:1.2fr 1fr 1fr;font-size:13.5px}.lp-cmp-r>div{padding:11px 6px}}
`;
