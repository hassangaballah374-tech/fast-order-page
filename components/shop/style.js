/* ستايل المتجر العام. الألوان والخط والاستدارة تأتي من متغيرات CSS يضعها الـ layout حسب ثيم التاجر. */
export const SHOP_CSS = `
.spk{background:var(--bg);color:var(--ink);font-family:var(--font),'Cairo',system-ui,sans-serif;min-height:100vh;line-height:1.7;-webkit-text-size-adjust:100%}
.spk *{box-sizing:border-box}
.spk a{color:inherit;text-decoration:none}
.spk img{max-width:100%;display:block}
.spk h1,.spk h2,.spk h3{margin:0;line-height:1.35}
.spk p{margin:0}
.spk .wrap{max-width:1180px;margin:0 auto;padding:0 16px}
.spk .mut{color:var(--mut)}
.spk .num{font-variant-numeric:tabular-nums}
.spk .sec{padding:28px 0}
.spk .sh{margin-bottom:16px}
.spk .sh h2{font-size:22px;font-weight:800}
.spk .sh p{color:var(--mut);font-size:14px}

.spk .ann{background:var(--c);color:var(--onc);text-align:center;font-size:13px;font-weight:700;padding:7px 12px}
.spk .ann a{text-decoration:underline}
.spk .hd{position:sticky;top:0;z-index:40;background:var(--card);border-bottom:1px solid var(--ln)}
.spk .hd-in{display:flex;align-items:center;gap:14px;height:62px}
.spk .logo{display:flex;align-items:center;gap:9px;font-weight:800;font-size:18px}
.spk .logo img{width:46px;height:46px;border-radius:12px;object-fit:cover}
.spk .nav{display:flex;gap:18px;margin-inline-start:18px;font-weight:700;font-size:14px}
.spk .nav a{color:var(--mut)}.spk .nav a:hover{color:var(--ink)}
.spk .hd-sp{flex:1}
.spk .sbx{position:relative;display:flex;align-items:center}
.spk .sbx-ic{display:none;background:none;border:0;font-size:18px;cursor:pointer;padding:6px}
.spk .sbx-in{width:210px;max-width:100%;border:1px solid var(--ln);background:var(--bg);color:var(--ink);border-radius:999px;padding:8px 14px;font:inherit;font-size:14px}
.spk .sbx-dd{position:absolute;top:calc(100% + 8px);inset-inline-start:0;width:min(360px,92vw);background:var(--card);border:1px solid var(--ln);border-radius:14px;box-shadow:0 12px 30px rgba(0,0,0,.14);z-index:60;overflow:hidden}
.spk .sbx-it{display:flex;align-items:center;gap:10px;padding:8px 12px;color:var(--ink);font-size:13px}
.spk .sbx-it:hover{background:rgba(0,0,0,.04)}
.spk .sbx-it img,.spk .sbx-ph{width:40px;height:40px;border-radius:8px;object-fit:cover;background:var(--ln);flex:none}
.spk .sbx-tt{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.spk .sbx-em{padding:12px;color:var(--mut);font-size:13px;text-align:center}
.spk .sbx-all{display:block;text-align:center;padding:10px;font-weight:800;font-size:13px;border-top:1px solid var(--ln);color:var(--c)}
@media(max-width:699px){.spk .sbx{position:static}.spk .sbx-ic{display:block}.spk .sbx-f{display:none}.spk .sbx.mob .sbx-f{display:block;position:absolute;top:100%;left:0;right:0;padding:10px 14px;background:var(--card);border-bottom:1px solid var(--ln)}.spk .sbx.mob .sbx-in{width:100%;border-radius:12px}.spk .sbx-dd{top:calc(100% + 58px);left:8px;right:8px;width:auto;inset-inline-start:auto}}
.spk .cartb{position:relative;display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border:1px solid var(--ln);border-radius:999px;font-weight:800;font-size:14px;background:var(--bg)}
.spk .cnt{background:var(--c);color:var(--onc);border-radius:999px;font-size:11px;min-width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;padding:0 5px}

.spk .b{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:1px solid var(--ln);background:var(--card);color:var(--ink);padding:11px 20px;border-radius:calc(var(--r) - 4px);font:inherit;font-weight:800;font-size:15px;cursor:pointer;transition:transform .12s,opacity .12s;text-align:center}
.spk .b:active{transform:scale(.98)}
.spk .b.p{background:var(--c);color:var(--onc);border-color:var(--c)}
.spk .b.wa{background:#25d366;border-color:#25d366;color:#fff}
.spk .b.sm{padding:7px 14px;font-size:13px}
.spk .b.blk{width:100%}
.spk .b[disabled]{opacity:.55;cursor:not-allowed}

.spk .hero{position:relative;border-radius:var(--r);overflow:hidden;background:linear-gradient(135deg,var(--c),color-mix(in srgb,var(--c) 55%,#000));color:var(--onc);margin-top:18px}
.spk .hero.img{background-size:cover;background-position:center}
.spk .hero.img::before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.62),rgba(0,0,0,.18))}
.spk .hero-in{position:relative;padding:56px 28px;max-width:640px}
.spk .hero.img .hero-in{color:#fff}
.spk .hero h1{font-size:clamp(26px,5vw,42px);font-weight:900}
.spk .hero p{margin:10px 0 22px;font-size:16px;opacity:.92}
.spk .hero .b{background:#fff;color:#111;border-color:#fff}

.spk .trust{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}
.spk .ti{display:flex;gap:12px;align-items:center;background:var(--card);border:1px solid var(--ln);border-radius:var(--r);padding:14px}
.spk .ti i{font-style:normal;font-size:26px}
.spk .ti b{display:block;font-size:14px}.spk .ti small{color:var(--mut);font-size:12px}

.spk .cats{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:12px}
.spk .cat{background:var(--card);border:1px solid var(--ln);border-radius:var(--r);padding:12px;text-align:center;font-weight:800;font-size:14px}
.spk .cat img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:calc(var(--r) - 6px);margin-bottom:8px}
.spk .cat .ph{width:100%;aspect-ratio:1;border-radius:calc(var(--r) - 6px);margin-bottom:8px;background:var(--ln);display:flex;align-items:center;justify-content:center;font-size:32px}
.spk .cat.act{border-color:var(--c);box-shadow:0 0 0 2px var(--c) inset}

.spk .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
@media(min-width:700px){.spk .grid{grid-template-columns:repeat(3,1fr);gap:16px}}
@media(min-width:1000px){.spk .grid{grid-template-columns:repeat(var(--cols),1fr)}}
.spk .pc{background:var(--card);border:1px solid var(--ln);border-radius:var(--r);overflow:hidden;display:flex;flex-direction:column;position:relative}
.spk.soft .pc{box-shadow:0 10px 24px -16px rgba(0,0,0,.35);border-color:transparent}
.spk.outline .pc{border-width:2px}
.spk .pc-img{aspect-ratio:1;background:var(--ln);overflow:hidden}
.spk .pc-img img{width:100%;height:100%;object-fit:cover}
.spk .pc-b{padding:11px 12px 13px;display:flex;flex-direction:column;gap:4px;flex:1}
.spk .pc-t{font-size:14px;font-weight:700;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:2.7em}
.spk .pc-p{display:flex;gap:8px;align-items:baseline;flex-wrap:wrap}
.spk .pc-fav{position:absolute;top:8px;inset-inline-start:8px;z-index:3;width:34px;height:34px;border-radius:50%;border:0;background:rgba(255,255,255,.92);color:#64748b;font-size:19px;line-height:1;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.15)}
.spk .pc-fav.on{color:#e11d48}
.spk .pc-fav.big{position:static;display:inline-grid;place-items:center;margin-inline-start:8px;vertical-align:middle}
.spk .pc-r{display:flex;gap:6px;align-items:center;font-size:12px;margin:2px 0 4px}
.spk .pc-p b{font-size:16px;color:var(--c)}
.spk .old{color:var(--mut);text-decoration:line-through;font-size:13px}
.spk .bdg{position:absolute;top:10px;inset-inline-start:10px;background:#dc2626;color:#fff;font-size:11px;font-weight:800;padding:3px 9px;border-radius:999px}
.spk .bdg.so{background:#111}
.spk .pc .b{margin-top:auto}

.spk .banner{position:relative;border-radius:var(--r);overflow:hidden;background:var(--card);border:1px solid var(--ln)}
.spk .banner img{width:100%;height:auto}
.spk .banner .bt{padding:20px;text-align:center}

.spk .pv{display:grid;gap:22px;padding:22px 0}
@media(min-width:900px){.spk .pv{grid-template-columns:1.05fr 1fr;gap:34px}}
.spk .gal-main{aspect-ratio:1;border-radius:var(--r);overflow:hidden;background:var(--ln);border:1px solid var(--ln)}
.spk .gal-main img{width:100%;height:100%;object-fit:cover}
.spk .gal-th{display:flex;gap:8px;margin-top:10px;overflow-x:auto}
.spk .gal-th button{border:2px solid transparent;border-radius:12px;padding:0;background:none;cursor:pointer;flex:0 0 66px;height:66px;overflow:hidden}
.spk .gal-th button.act{border-color:var(--c)}
.spk .gal-th img{width:100%;height:100%;object-fit:cover}
.spk .info h1{font-size:24px;font-weight:900}
.spk .price{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap;margin:10px 0}
.spk .price b{font-size:28px;color:var(--c)}
.spk .save{background:#16a34a;color:#fff;font-size:12px;font-weight:800;padding:2px 10px;border-radius:999px}
.spk .stars{color:#f59e0b;letter-spacing:1px}
.spk .scar{display:inline-block;background:#fee2e2;color:#b91c1c;font-weight:800;font-size:13px;padding:4px 12px;border-radius:999px;margin:6px 0}
.spk .opt{margin:14px 0}
.spk .opt>b{display:block;font-size:14px;margin-bottom:7px}
.spk .chips{display:flex;gap:8px;flex-wrap:wrap}
.spk .chip{border:1.5px solid var(--ln);background:var(--card);border-radius:10px;padding:7px 15px;font:inherit;font-weight:700;font-size:14px;cursor:pointer;color:var(--ink)}
.spk .chip.act{border-color:var(--c);background:color-mix(in srgb,var(--c) 12%,var(--card));color:var(--c)}
.spk .qty{display:inline-flex;align-items:center;border:1.5px solid var(--ln);border-radius:12px;overflow:hidden;background:var(--card)}
.spk .qty button{border:0;background:none;width:40px;height:42px;font-size:20px;cursor:pointer;color:var(--ink)}
.spk .qty span{min-width:38px;text-align:center;font-weight:800}
.spk .offers{display:grid;gap:8px;margin:12px 0}
.spk .offer{display:flex;justify-content:space-between;align-items:center;gap:10px;border:1.5px dashed var(--c);border-radius:12px;padding:10px 14px;background:color-mix(in srgb,var(--c) 7%,var(--card));cursor:pointer;font:inherit;color:inherit;text-align:start;width:100%}
.spk .offer.act{border-style:solid;background:color-mix(in srgb,var(--c) 16%,var(--card))}
.spk .offer small{color:var(--mut);display:block}
.spk .bump{border:2px dashed #f59e0b;background:#fffbeb;color:#422006;border-radius:14px;padding:12px;display:flex;gap:12px;align-items:center;margin:14px 0;cursor:pointer}
.spk .bump img{width:58px;height:58px;border-radius:10px;object-fit:cover}
.spk .bump b{display:block;font-size:14px}
.spk .bump input{width:20px;height:20px;accent-color:var(--c)}
.spk .desc{white-space:pre-line;color:var(--ink);opacity:.9;font-size:15px}
.spk .stk{position:fixed;bottom:0;inset-inline:0;z-index:35;background:var(--card);border-top:1px solid var(--ln);padding:10px 16px;display:flex;gap:12px;align-items:center;justify-content:space-between}
.spk .stk b{font-size:18px;color:var(--c)}
@media(min-width:900px){.spk .stk{display:none}}

.spk .frm{background:var(--card);border:1px solid var(--ln);border-radius:var(--r);padding:18px;display:grid;gap:12px}
.spk .frm h3{font-size:17px}
.spk .fld label{display:block;font-size:13px;font-weight:800;margin-bottom:5px}
.spk .in{width:100%;border:1.5px solid var(--ln);background:var(--bg);color:var(--ink);border-radius:calc(var(--r) - 5px);padding:11px 13px;font:inherit;font-size:15px}
.spk .in:focus{outline:none;border-color:var(--c)}
.spk textarea.in{resize:vertical;min-height:72px}
.spk .r2{display:grid;gap:12px}
@media(min-width:560px){.spk .r2{grid-template-columns:1fr 1fr}}
.spk .err{background:#fee2e2;color:#991b1b;border-radius:12px;padding:10px 14px;font-size:14px;font-weight:700}
.spk .okm{color:#166534;font-size:13px;font-weight:700}
.spk .cpn{display:flex;gap:8px}
.spk .sum{background:var(--bg);border:1px solid var(--ln);border-radius:14px;padding:12px 14px;display:grid;gap:6px;font-size:14px}
.spk .sum div{display:flex;justify-content:space-between}
.spk .sum .tot{font-size:18px;font-weight:900;border-top:1px dashed var(--ln);padding-top:8px;margin-top:2px}
.spk .prog{height:8px;border-radius:8px;background:var(--ln);overflow:hidden}
.spk .prog i{display:block;height:100%;background:var(--c)}
.spk .hp{position:absolute;inset-inline-start:-9999px;opacity:0;height:0;width:0}

.spk .ci{display:flex;gap:12px;align-items:center;background:var(--card);border:1px solid var(--ln);border-radius:var(--r);padding:10px;margin-bottom:10px}
.spk .ci img{width:70px;height:70px;border-radius:12px;object-fit:cover;background:var(--ln)}
.spk .ci .ci-b{flex:1;min-width:0}
.spk .ci .ci-b b{display:block;font-size:14px}
.spk .cl{display:grid;gap:22px;padding:22px 0}
@media(min-width:900px){.spk .cl{grid-template-columns:1.1fr 1fr}}

.spk .rev{border-top:1px solid var(--ln);padding:12px 0}
.spk .rev b{font-size:14px}
.spk .tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px}

.spk .ft{background:var(--card);border-top:1px solid var(--ln);margin-top:36px;padding:28px 0 90px;font-size:14px}
.spk .ft-in{display:grid;gap:22px}
@media(min-width:800px){.spk .ft-in{grid-template-columns:1.4fr 1fr 1fr}}
.spk .ft h4{margin:0 0 8px;font-size:15px}
.spk .ft a{display:block;color:var(--mut);padding:2px 0}
.spk .ft a:hover{color:var(--ink)}
.spk .soc{display:flex;gap:10px;flex-wrap:wrap}
.spk .soc a{display:inline-block;border:1px solid var(--ln);border-radius:999px;padding:3px 14px}
.spk .pw{text-align:center;color:var(--mut);font-size:12px;margin-top:18px}
.spk .pwl{display:flex;justify-content:center;margin-top:18px}
.spk .pwl img{height:40px;width:auto;opacity:.95;display:block}

.spk .waf{position:fixed;bottom:18px;inset-inline-end:16px;z-index:45;width:54px;height:54px;border-radius:50%;background:#25d366;color:#fff;display:flex;align-items:center;justify-content:center;font-size:28px;box-shadow:0 8px 22px rgba(0,0,0,.28)}
.spk .pop{position:fixed;bottom:84px;z-index:46;max-width:min(340px,calc(100vw - 32px));background:var(--card);color:var(--ink);border:1px solid var(--ln);border-radius:16px;padding:12px 38px 12px 14px;box-shadow:0 14px 30px -10px rgba(0,0,0,.35);font-size:13px;animation:spkin .35s ease}
.spk .pop.bottom-start{inset-inline-start:16px}.spk .pop.bottom-end{inset-inline-end:84px}
.spk .pop button{position:absolute;top:6px;inset-inline-end:8px;border:0;background:none;color:var(--mut);cursor:pointer;font-size:16px}
.spk .welc{position:fixed;top:76px;inset-inline:16px;z-index:47;margin:0 auto;max-width:420px;background:var(--c);color:var(--onc);border-radius:14px;padding:12px 40px 12px 16px;font-weight:700;font-size:14px;box-shadow:0 14px 30px -10px rgba(0,0,0,.4);animation:spkin .35s ease}
.spk .welc button{position:absolute;top:8px;inset-inline-end:10px;border:0;background:none;color:inherit;cursor:pointer;font-size:16px}
.spk .welc a{text-decoration:underline}
.spk .mdl{position:fixed;inset:0;z-index:60;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:16px}
.spk .mdl-b{background:var(--card);border-radius:20px;padding:24px;max-width:400px;width:100%;text-align:center;display:grid;gap:12px}
.spk .code{font-size:22px;font-weight:900;letter-spacing:3px;border:2px dashed var(--c);border-radius:12px;padding:10px;color:var(--c)}
@keyframes spkin{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}

.spk .bl-ann{text-align:center;padding:10px 14px;border-radius:12px;font-weight:800;font-size:14px;margin:12px 0}
.spk .bl-cd{background:var(--card);border:1px solid var(--ln);border-radius:var(--r);padding:18px;text-align:center;margin:14px 0}
.spk .cd{display:flex;gap:10px;justify-content:center;margin:10px 0}
.spk .cd div{background:var(--c);color:var(--onc);border-radius:12px;min-width:62px;padding:8px 6px;font-weight:900;font-size:22px}
.spk .cd small{display:block;font-size:11px;font-weight:600;opacity:.85}
.spk .bl-faq details{background:var(--card);border:1px solid var(--ln);border-radius:12px;padding:12px 14px;margin-bottom:8px}
.spk .bl-faq summary{cursor:pointer;font-weight:800}
.spk .bl-faq p{margin-top:8px;color:var(--mut)}
.spk .vid{position:relative;aspect-ratio:16/9;border-radius:var(--r);overflow:hidden;background:#000;margin:14px 0}
.spk .vid iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.spk .bl{margin:14px 0}
.spk .bl h3{margin-bottom:6px}

.spk .tl{display:grid;gap:0;margin:16px 0}
.spk .tl div{display:flex;gap:12px;align-items:center;padding:8px 0;color:var(--mut)}
.spk .tl div i{width:22px;height:22px;border-radius:50%;border:2px solid var(--ln);display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-style:normal}
.spk .tl div.done{color:var(--ink);font-weight:800}
.spk .tl div.done i{background:var(--c);border-color:var(--c);color:var(--onc)}
.spk .ty{text-align:center;padding:40px 0}
.spk .ty .ic{font-size:60px}
.spk .card{background:var(--card);border:1px solid var(--ln);border-radius:var(--r);padding:18px}
.spk .center{text-align:center}
.spk .empty{text-align:center;padding:48px 16px;color:var(--mut)}
.spk .cd2{background:#dc2626;color:#fff;border-radius:12px;padding:8px 14px;font-weight:800;display:inline-block;margin-top:8px}

/* ===== Premium layer v1 ===== */
.spk .gal-main{position:relative;box-shadow:0 18px 40px -24px rgba(0,0,0,.45)}
.spk .gal-main img{transition:transform .6s cubic-bezier(.2,.7,.2,1)}
.spk .gal-th button{transition:border-color .2s,transform .2s}
.spk .pc{transition:transform .25s,box-shadow .25s}
.spk .pc-img img{transition:transform .5s}
@media(hover:hover){.spk .gal-main:hover img{transform:scale(1.07)}.spk .gal-th button:hover{transform:translateY(-2px)}.spk .pc:hover{transform:translateY(-4px);box-shadow:0 22px 38px -22px rgba(0,0,0,.45)}.spk .pc:hover .pc-img img{transform:scale(1.06)}}
.spk .b.p{position:relative;overflow:hidden;box-shadow:0 10px 22px -12px var(--c)}
.spk .b.p::after{content:'';position:absolute;top:0;left:0;width:36%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.38),transparent);transform:translateX(-160%) skewX(-20deg);animation:spkshine 3.6s ease-in-out infinite;pointer-events:none}
@keyframes spkshine{0%,55%{transform:translateX(-160%) skewX(-20deg)}100%{transform:translateX(420%) skewX(-20deg)}}
.spk .stk{background:color-mix(in srgb,var(--card) 84%,transparent);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);padding-bottom:calc(10px + env(safe-area-inset-bottom))}
.spk .price b{font-size:32px;letter-spacing:-.5px}
.spk .assure{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin:14px 0 0}
.spk .assure div{display:flex;align-items:center;gap:8px;padding:10px 12px;border:1px solid var(--ln);border-radius:12px;background:var(--card);font-size:12.5px;font-weight:700}
.spk .assure i{font-style:normal;font-size:18px}
.spk .sec{animation:spkup .6s both}
@keyframes spkup{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@media(prefers-reduced-motion:reduce){.spk .sec,.spk .b.p::after{animation:none}.spk .gal-main img,.spk .pc,.spk .pc-img img{transition:none}}

/* ===== Premium layer v2: tracking + thank-you ===== */
.spk .tl{position:relative}
.spk .tl div{position:relative;padding:11px 0}
.spk .tl div i{position:relative;z-index:1;background:var(--card)}
.spk .tl div:not(:last-child)::after{content:'';position:absolute;inset-inline-start:10px;top:33px;bottom:-11px;width:2px;background:var(--ln)}
.spk .tl div.done:not(:last-child)::after{background:var(--c)}
.spk .tl div.cur i{box-shadow:0 0 0 6px color-mix(in srgb,var(--c) 22%,transparent);animation:spkpulse 1.8s ease-in-out infinite}
@keyframes spkpulse{50%{box-shadow:0 0 0 10px color-mix(in srgb,var(--c) 6%,transparent)}}
.spk .ty{position:relative;overflow:hidden}
.spk .ty-ok{width:88px;height:88px;margin:0 auto}
.spk .ty-ok svg{width:100%;height:100%}
.spk .ty-ok circle{fill:none;stroke:var(--c);stroke-width:3;stroke-dasharray:152;stroke-dashoffset:152;animation:spkdraw .7s .1s forwards}
.spk .ty-ok path{fill:none;stroke:var(--c);stroke-width:4;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:44;stroke-dashoffset:44;animation:spkdraw .5s .7s forwards}
@keyframes spkdraw{to{stroke-dashoffset:0}}
.spk .confetti{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.spk .confetti i{position:absolute;top:-16px;width:8px;height:14px;border-radius:2px;opacity:0;animation:spkfall 2.8s ease-in forwards}
@keyframes spkfall{0%{opacity:1;transform:translateY(0) rotate(0)}100%{opacity:0;transform:translateY(440px) rotate(560deg)}}
.spk .ty-sum{max-width:440px;margin:0 auto 16px;text-align:start}
.spk .ty-sum .rw{display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px dashed var(--ln);font-size:14px}
.spk .ty-sum .rw:last-child{border:0}
.spk .ty-no{display:inline-flex;align-items:center;gap:8px}
.spk .ty-no button{border:1px solid var(--ln);background:var(--bg);color:var(--ink);border-radius:8px;padding:2px 9px;font:inherit;font-size:12px;cursor:pointer}
.spk .nxt{max-width:440px;margin:0 auto 18px;display:grid;gap:8px;text-align:start}
.spk .nxt div{display:flex;gap:12px;align-items:center;background:var(--card);border:1px solid var(--ln);border-radius:14px;padding:11px 14px;font-size:13.5px;font-weight:700}
.spk .nxt i{font-style:normal;font-size:20px}
.spk .nxt small{display:block;color:var(--mut);font-weight:500;font-size:12px}
@media(prefers-reduced-motion:reduce){.spk .tl div.cur i,.spk .confetti i{animation:none}.spk .ty-ok circle,.spk .ty-ok path{animation:none;stroke-dashoffset:0}}

/* ===== Mini cart ===== */
.spk .mc-wrap{position:fixed;inset:0;z-index:90}
.spk .mc-scrim{position:absolute;inset:0;background:rgba(0,0,0,.5);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);animation:spkfade .2s}
.spk .mc{position:absolute;top:0;bottom:0;inset-inline-end:0;width:min(420px,92vw);background:var(--card);color:var(--ink);display:flex;flex-direction:column;box-shadow:0 0 50px rgba(0,0,0,.35);animation:spkslide .28s cubic-bezier(.2,.8,.2,1)}
@keyframes spkfade{from{opacity:0}}
@keyframes spkslide{from{transform:translateX(-100%)}}
[dir=ltr] .spk .mc,.spk[dir=ltr] .mc{animation-name:spkslide2}
@keyframes spkslide2{from{transform:translateX(100%)}}
.spk .mc-hd{display:flex;justify-content:space-between;align-items:center;padding:16px 18px;border-bottom:1px solid var(--ln);font-size:17px}
.spk .mc-hd button{border:0;background:var(--bg);color:var(--ink);width:34px;height:34px;border-radius:50%;cursor:pointer;font-size:15px}
.spk .mc-ship{padding:12px 18px;background:color-mix(in srgb,var(--c) 10%,transparent);font-size:13px;font-weight:700}
.spk .mc-bar{height:7px;border-radius:99px;background:var(--ln);margin-top:8px;overflow:hidden}
.spk .mc-bar i{display:block;height:100%;background:var(--c);border-radius:99px;transition:width .4s}
.spk .mc-list{flex:1;overflow-y:auto;padding:6px 18px}
.spk .mc-it{display:flex;gap:12px;align-items:flex-start;padding:14px 0;border-bottom:1px solid var(--ln)}
.spk .mc-it img,.spk .mc-ph{width:64px;height:64px;border-radius:12px;object-fit:cover;background:var(--ln);flex:none}
.spk .mc-b{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px;font-size:13.5px}
.spk .mc-q{display:flex;align-items:center;gap:10px;margin-top:4px}
.spk .mc-rm{border:0;background:none;color:var(--mut);font:inherit;font-size:12px;cursor:pointer;text-decoration:underline}
.spk .mc-ft{padding:14px 18px calc(14px + env(safe-area-inset-bottom));border-top:1px solid var(--ln);display:grid;gap:8px}
.spk .mc-sub{display:flex;justify-content:space-between;font-size:15px;margin-bottom:4px}
@media(prefers-reduced-motion:reduce){.spk .mc,.spk .mc-scrim{animation:none}}

/* ===== عرض المدار (المنتجات / الأقسام) ===== */
.spk{--stage:radial-gradient(900px 520px at 50% 35%,var(--card),color-mix(in srgb,var(--bg) 90%,var(--ink)))}
.spk .ob{--obk:var(--ink);color:var(--obk)}
.spk .ob-bar{display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap;padding:12px 0}
.spk .ob-bar .tabs{margin:0}

.spk .ob-stage{position:relative;overflow:hidden;isolation:isolate;background:var(--stage);touch-action:pan-y;user-select:none;-webkit-user-select:none;outline:none;color:var(--obk)}
.spk .ob-txt{position:absolute;inset-inline-start:max(16px,4vw);top:clamp(18px,4vh,40px);z-index:200;max-width:min(560px,62%);pointer-events:none;animation:obIn .45s ease both}
.spk .ob-txt>*{pointer-events:auto}
.spk .ob-cnt{font-size:11px;letter-spacing:.14em;color:color-mix(in srgb,var(--ink) 55%,transparent);margin-bottom:8px}
.spk .ob-txt h2{font-size:clamp(28px,5.6vw,72px);font-weight:900;line-height:1.08;letter-spacing:0;color:var(--obk);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;padding-bottom:4px}
.spk .ob-price{font-size:clamp(16px,2vw,22px);font-weight:700;margin-top:6px;display:flex;gap:10px;align-items:baseline}
.spk .ob-price s{font-size:.7em;opacity:.5;font-weight:500}
.spk .ob-lnk{display:inline-block;margin-top:10px;font-size:13px;font-weight:700;color:var(--obk);border-bottom:1.5px solid var(--obk);padding-bottom:2px}
.spk .ob-curve{position:absolute;inset:0;pointer-events:none}
.spk .ob-it{position:absolute;left:0;top:0;border:0;background:none;padding:0;cursor:grab;will-change:transform,opacity;transition:none;mix-blend-mode:multiply;-webkit-tap-highlight-color:transparent}
.spk .ob-it:active{cursor:grabbing}
.spk .ob-it:focus-visible{outline:2px solid var(--c);outline-offset:4px;border-radius:18px}
.spk .ob-fl{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}
.spk .ob-it.on .ob-fl{animation:obFloat 5s ease-in-out infinite}
.spk .ob-it img,.spk .ob-fpic img{width:100%;height:100%;object-fit:contain;border-radius:14px;pointer-events:none}
.spk .ob-ph{width:70%;height:70%;border-radius:22px;background:var(--ln);display:flex;align-items:center;justify-content:center;font-size:56px;font-weight:900;color:var(--mut)}
.spk .ob-sh{position:absolute;left:14%;right:14%;bottom:2%;height:11%;border-radius:50%;background:radial-gradient(closest-side,color-mix(in srgb,var(--ink) 30%,transparent),transparent);filter:blur(5px);z-index:-1}
.spk .ob-sh.big{bottom:-2%}
.spk .ob-whl{position:absolute;inset-inline:0;bottom:clamp(14px,3vh,28px);z-index:200;display:flex;flex-direction:column;align-items:center;gap:7px}
.spk .ob-ends{width:min(520px,70vw);display:flex;justify-content:space-between;font-size:10px;letter-spacing:.12em;color:color-mix(in srgb,var(--ink) 50%,transparent)}
.spk .ob-trk{position:relative;height:30px;border-radius:99px;background-color:color-mix(in srgb,var(--ink) 12%,var(--bg));background-image:repeating-linear-gradient(90deg,color-mix(in srgb,var(--ink) 30%,transparent) 0 1px,transparent 1px 8px);box-shadow:inset 0 2px 5px color-mix(in srgb,var(--ink) 22%,transparent);cursor:grab;touch-action:none;overflow:hidden}
.spk .ob-trk:active{cursor:grabbing}
.spk .ob-th{position:absolute;top:3px;bottom:3px;border-radius:99px;background:linear-gradient(var(--card),color-mix(in srgb,var(--ink) 8%,var(--card)));box-shadow:0 2px 6px color-mix(in srgb,var(--ink) 35%,transparent),inset 0 0 0 1px color-mix(in srgb,var(--ink) 8%,transparent)}
.spk .ob-pick{max-width:560px;margin:14px auto 0;padding:0 16px;text-align:center;color:var(--ink)}
.spk .ob-lbl{font-size:11px;letter-spacing:.06em;color:var(--mut);margin-bottom:10px;font-weight:700}
.spk .ob-sz{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.spk .ob-sz button{border:1.5px solid var(--ln);background:var(--card);color:var(--ink);border-radius:10px;padding:11px 6px;font:inherit;font-weight:800;font-size:14px;cursor:pointer;min-height:44px;display:flex;align-items:center;justify-content:center;transition:background .15s,color .15s,border-color .15s}
.spk .ob-sz button:hover:not(:disabled){border-color:var(--ink)}
.spk .ob-sz button.ld,.spk .ob-sz button.sel{background:var(--ink);color:var(--bg);border-color:var(--ink)}
.spk .ob-sz button.ok{background:var(--c);color:var(--onc);border-color:var(--c)}
.spk .ob-sz button:disabled{opacity:.45;cursor:not-allowed}
.spk .ob-add{width:100%;border:0;border-radius:99px;background:var(--ink);color:var(--bg);padding:15px 18px;font:inherit;font-weight:800;font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;min-height:50px;transition:background .2s}
.spk .ob-add.dis{background:color-mix(in srgb,var(--ink) 38%,var(--bg))}
.spk .ob-add.ok{background:var(--c);color:var(--onc)}
.spk .ob-add:disabled{cursor:not-allowed}
.spk .ob-spin{width:18px;height:18px;border-radius:50%;border:2.5px solid color-mix(in srgb,var(--bg) 35%,transparent);border-top-color:var(--bg);animation:obSpin .7s linear infinite;display:inline-block}
.spk .ob-sold{color:#dc2626;font-weight:800;font-size:14px;margin:8px 0}
.spk .ob-added{margin-top:12px;display:flex;gap:10px;justify-content:center;align-items:center;flex-wrap:wrap;font-size:13px;font-weight:700;color:var(--ink);animation:obIn .3s ease both}
.spk .ob-added button,.spk .ob-fl2 button{border:0;background:none;color:var(--c);font:inherit;font-weight:800;cursor:pointer;text-decoration:underline;padding:0}
.spk .ob-focus{position:fixed;inset:0;z-index:1000;background:var(--stage);color:var(--ink);display:flex;flex-direction:column;animation:obFade .25s ease both;overflow:auto}
.spk .ob-x{position:absolute;inset-inline-end:18px;top:14px;z-index:5;border:0;background:color-mix(in srgb,var(--card) 80%,transparent);border-radius:99px;padding:8px 16px;font:inherit;font-weight:800;font-size:13px;cursor:pointer;color:var(--ink)}
.spk .ob-fgrid{flex:1 0 auto;display:grid;grid-template-columns:1.15fr 1fr;gap:clamp(16px,4vw,56px);align-items:center;padding:56px max(16px,5vw) 12px}
.spk .ob-fimg{display:flex;flex-direction:column;align-items:center;gap:12px;min-width:0}
.spk .ob-fpic{mix-blend-mode:multiply;position:relative;width:min(100%,560px,52vh);aspect-ratio:1;animation:obBlur .55s ease both}
.spk .ob-dots{display:flex;gap:7px}
.spk .ob-dots button{width:8px;height:8px;border-radius:50%;border:0;background:color-mix(in srgb,var(--ink) 25%,transparent);cursor:pointer;padding:0}
.spk .ob-dots button.on{background:var(--ink)}
.spk .ob-finfo{max-width:480px;width:100%;animation:obIn .45s ease both}
.spk .ob-finfo h2{font-size:clamp(28px,4.4vw,56px);font-weight:900;line-height:1.1;margin-bottom:6px}
.spk .ob-grp{margin:16px 0 14px}
.spk .ob-gh{display:flex;justify-content:space-between;font-size:11px;letter-spacing:.08em;color:color-mix(in srgb,var(--ink) 60%,transparent);font-weight:700;margin-bottom:8px}
.spk .ob-fl2{display:flex;flex-direction:column;gap:8px;margin-top:14px;font-size:13px;font-weight:700;align-items:flex-start}
.spk .ob-fbar{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:10px max(16px,5vw) calc(14px + env(safe-area-inset-bottom));flex-wrap:wrap}
.spk .ob-ths{display:flex;gap:8px;overflow-x:auto;max-width:min(100%,640px);padding:4px 2px;scrollbar-width:none}
.spk .ob-ths::-webkit-scrollbar{display:none}
.spk .ob-ths button{flex:none;width:54px;height:54px;border-radius:12px;border:1.5px solid color-mix(in srgb,var(--ink) 12%,transparent);background:color-mix(in srgb,var(--card) 80%,transparent);padding:4px;cursor:pointer;opacity:.7}
.spk .ob-ths button.on{opacity:1;border-color:var(--ink)}
.spk .ob-ths img{width:100%;height:100%;object-fit:contain;mix-blend-mode:multiply}
.spk .ob-ths button{isolation:auto}
.spk .ob-nav{display:flex;align-items:center;gap:12px;font-size:12px;letter-spacing:.1em}
.spk .ob-nav button{width:40px;height:40px;border-radius:50%;border:1.5px solid color-mix(in srgb,var(--ink) 25%,transparent);background:transparent;color:var(--ink);font-size:18px;cursor:pointer}
.spk .ob-nav button.dk{background:var(--ink);color:var(--bg);border-color:var(--ink)}
.spk .ob-nav button:disabled{opacity:.3;cursor:not-allowed}
@keyframes obFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
@keyframes obSpin{to{transform:rotate(360deg)}}
@keyframes obIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes obFade{from{opacity:0}to{opacity:1}}
@keyframes obBlur{from{opacity:0;filter:blur(18px);transform:scale(.96)}to{opacity:1;filter:blur(0);transform:none}}
@media(max-width:760px){
  .spk .ob-fgrid{grid-template-columns:1fr;align-content:start;padding-top:52px;gap:10px}
  .spk .ob-fpic{width:min(78vw,42vh)}
  .spk .ob-txt{max-width:78%}
  .spk .ob-fbar{justify-content:center}
}
@media(prefers-reduced-motion:reduce){.spk .ob-it.on .ob-fl,.spk .ob-fpic,.spk .ob-txt,.spk .ob-finfo,.spk .ob-focus{animation:none}}
.spk[data-dk="1"] .ob-it,.spk[data-dk="1"] .ob-fpic,.spk[data-dk="1"] .ob-ths img{mix-blend-mode:normal}
.spk .ob-cartp{position:absolute;inset-inline-start:18px;top:14px;z-index:5;border:0;background:color-mix(in srgb,var(--card) 80%,transparent);border-radius:99px;padding:8px 16px;font:inherit;font-weight:800;font-size:13px;cursor:pointer;color:var(--ink)}

/* ===== باحث المقاس ===== */
.spk .sf-link{border:0;background:none;color:var(--ink);font:inherit;font-weight:800;font-size:12.5px;text-decoration:underline;cursor:pointer;padding:0;margin-top:10px;display:inline-block}
.spk .sf{position:fixed;inset:0;z-index:1100;background:color-mix(in srgb,var(--ink) 38%,transparent);display:flex;align-items:flex-end;justify-content:center;animation:obFade .2s both}
.spk .sf-x{position:absolute;top:14px;inset-inline-end:16px;z-index:2;background:var(--card);color:var(--ink);border:0;border-radius:99px;padding:8px 16px;font:inherit;font-weight:800;font-size:13px;cursor:pointer}
.spk .sf-box{width:min(480px,100%);max-height:90vh;overflow:auto;background:var(--stage);color:var(--ink);border-radius:26px 26px 0 0;padding:20px 22px calc(22px + env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:14px;animation:obIn .3s both}
@media(min-width:700px){.spk .sf{align-items:center}.spk .sf-box{border-radius:26px}}
.spk .sf-top{display:flex;justify-content:space-between;align-items:center;font-size:11px;letter-spacing:.14em;color:var(--mut);font-weight:800}
.spk .sf-bar{height:3px;border-radius:9px;background:color-mix(in srgb,var(--ink) 12%,transparent);overflow:hidden}
.spk .sf-bar i{display:block;height:100%;background:var(--ink);transition:width .3s}
.spk .sf-p{display:flex;flex-direction:column;gap:14px;animation:obIn .3s both}
.spk .sf-p h2{font-size:clamp(24px,6vw,32px);font-weight:900;line-height:1.1}
.spk .sf-d{font-size:13px;color:var(--mut);margin:0}
.spk .sf-st{display:grid;grid-template-columns:1fr auto;gap:6px 14px;align-items:center;padding:12px 0;border-top:1px solid color-mix(in srgb,var(--ink) 10%,transparent)}
.spk .sf-stl{display:flex;flex-direction:column;font-weight:800;font-size:13px}
.spk .sf-stl small{font-size:11px;color:var(--mut);font-weight:700;letter-spacing:.08em}
.spk .sf-str{display:flex;align-items:center;gap:12px}
.spk .sf-str b{font-size:34px;font-weight:900;min-width:70px;text-align:center}
.spk .sf-str button{width:38px;height:38px;border-radius:50%;border:1.5px solid color-mix(in srgb,var(--ink) 25%,transparent);background:transparent;color:var(--ink);font-size:20px;cursor:pointer}
.spk .sf-st input[type=range]{grid-column:1/-1;width:100%;accent-color:var(--ink);height:28px}
.spk .sf-live{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-radius:14px;background:color-mix(in srgb,var(--ink) 6%,transparent);font-size:12px;font-weight:800;letter-spacing:.04em}
.spk .sf-live b{font-size:22px;font-weight:900}
.spk .sf-row{display:flex;flex-direction:column;gap:8px}
.spk .sf-rt{font-size:12px;font-weight:800;color:var(--mut);letter-spacing:.06em}
.spk .sf-3{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.spk .sf-3 button,.spk .sf-opts button{border:1.5px solid color-mix(in srgb,var(--ink) 16%,transparent);background:var(--card);color:var(--ink);border-radius:12px;padding:14px 8px;font:inherit;font-weight:800;font-size:14px;cursor:pointer;transition:background .15s,color .15s,border-color .15s}
.spk .sf-3 button.on,.spk .sf-opts button.on{background:var(--ink);color:var(--bg);border-color:var(--ink)}
.spk .sf-opts{display:flex;flex-direction:column;gap:10px}
.spk .sf-opts button{display:flex;flex-direction:column;align-items:flex-start;gap:3px;text-align:start;padding:16px}
.spk .sf-opts small{font-weight:600;font-size:12px;opacity:.7}
.spk .sf-res{align-items:center;text-align:center}
.spk .sf-k2{font-size:11px;letter-spacing:.14em;color:var(--mut);font-weight:800}
.spk .sf-ring{width:132px;height:132px;border-radius:50%;border:3px solid var(--ink);display:flex;align-items:center;justify-content:center;background:var(--card);animation:obIn .4s both}
.spk .sf-ring b{font-size:46px;font-weight:900}
.spk .sf-conf{font-size:13px;font-weight:700;color:var(--mut)}
.spk .sf-conf b{color:var(--ink)}
.spk .sf-scale{width:100%;padding:6px 8px 0}
.spk .sf-line{position:relative;height:2px;background:color-mix(in srgb,var(--ink) 18%,transparent);margin:10px 4px}
.spk .sf-line i{position:absolute;top:50%;width:14px;height:14px;border-radius:50%;background:var(--ink);transform:translate(-50%,-50%);box-shadow:0 0 0 4px color-mix(in srgb,var(--ink) 15%,transparent)}
.spk .sf-lbls{display:flex;justify-content:space-between;font-size:11px;font-weight:700;color:var(--mut)}
.spk .sf-lbls .on{color:var(--ink);font-weight:900}
.spk .sf-note{font-size:12.5px;color:var(--mut);margin:0}
.spk .sf-go{width:100%;border:0;border-radius:99px;background:var(--ink);color:var(--bg);padding:15px;font:inherit;font-weight:800;font-size:15px;cursor:pointer;min-height:50px}
.spk .sf-alt,.spk .sf-tb{border:0;background:none;color:var(--ink);font:inherit;font-weight:800;font-size:13px;text-decoration:underline;cursor:pointer}
.spk .sf-tbl{width:100%;overflow:auto}
.spk .sf-tbl table{width:100%;border-collapse:collapse;font-size:13px}
.spk .sf-tbl th,.spk .sf-tbl td{padding:8px 6px;border-bottom:1px solid color-mix(in srgb,var(--ink) 10%,transparent);text-align:center}
.spk .sf-tbl th{font-size:11px;color:var(--mut);letter-spacing:.06em}
.spk .sf-tbl tr.on{background:color-mix(in srgb,var(--ink) 7%,transparent)}
.spk .sf-ft{display:flex;gap:10px;margin-top:4px}
.spk .sf-nx{flex:1;border:0;border-radius:99px;background:var(--ink);color:var(--bg);padding:14px;font:inherit;font-weight:800;font-size:15px;cursor:pointer;min-height:50px}
.spk .sf-bk{border:1.5px solid color-mix(in srgb,var(--ink) 22%,transparent);border-radius:99px;background:transparent;color:var(--ink);padding:14px 22px;font:inherit;font-weight:800;cursor:pointer}
.spk .rl{position:relative;padding:8px 0 24px;overflow:hidden}
.spk .rl-rail{position:absolute;inset-inline:0;top:30px;height:6px;border-radius:99px;background:linear-gradient(color-mix(in srgb,var(--ink) 55%,var(--bg)),color-mix(in srgb,var(--ink) 25%,var(--bg)));box-shadow:0 3px 8px color-mix(in srgb,var(--ink) 22%,transparent);z-index:1}
.spk .rl-sc{display:flex;align-items:flex-start;gap:6px;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;padding:0 0 10px;scrollbar-width:none;perspective:1000px;outline:none;position:relative;z-index:2;overscroll-behavior-x:contain}
.spk .rl-sc::-webkit-scrollbar{display:none}
.spk .rl-sc.drg{scroll-snap-type:none;cursor:grabbing}
.spk .rl-sp{flex:0 0 calc(50% - 90px)}
.spk .rl-it{flex:0 0 clamp(150px,22vw,210px);scroll-snap-align:center;border:0;background:none;padding:0;cursor:pointer;color:var(--ink);display:flex;flex-direction:column;align-items:center;transform-origin:50% 0;transition:transform .35s cubic-bezier(.2,.8,.2,1),opacity .3s;opacity:.55;-webkit-tap-highlight-color:transparent;position:relative}
.spk .rl-it.d1{transform:scale(.88) rotateY(0)}
.spk .rl-it.d1.l{transform:scale(.88) rotateY(24deg)}
.spk .rl-it.d1.r{transform:scale(.88) rotateY(-24deg)}
.spk .rl-it.d2,.spk .rl-it.d3{opacity:.4;transform:scale(.76)}
.spk .rl-it.d2.l,.spk .rl-it.d3.l{transform:scale(.76) rotateY(34deg)}
.spk .rl-it.d2.r,.spk .rl-it.d3.r{transform:scale(.76) rotateY(-34deg)}
.spk .rl-it.on{opacity:1;transform:scale(1.06);z-index:3}
.spk .rl-it:focus-visible{outline:2px solid var(--c);outline-offset:4px;border-radius:14px}
.spk .rl-hg{width:46px;height:26px;color:color-mix(in srgb,var(--ink) 70%,var(--bg));margin-bottom:-4px;position:relative;z-index:2}
.spk .rl-pic{display:block;width:100%;aspect-ratio:3/4;border-radius:12px;background:color-mix(in srgb,var(--ink) 5%,var(--card));overflow:hidden;box-shadow:0 10px 22px -12px color-mix(in srgb,var(--ink) 45%,transparent);animation:rlSway 5.5s ease-in-out infinite;transform-origin:50% 0}
.spk .rl-it.on .rl-pic{box-shadow:0 18px 30px -14px color-mix(in srgb,var(--ink) 55%,transparent)}
.spk .rl-pic img{width:100%;height:100%;object-fit:cover;pointer-events:none;display:block}
.spk .rl-pic .ob-ph{margin:15% auto 0;display:flex}
.spk .rl-tag{margin-top:8px;font-size:10px;letter-spacing:.14em;color:color-mix(in srgb,var(--ink) 55%,transparent)}
.spk .rl-info{max-width:560px;margin:6px auto 0;padding:0 16px;text-align:center;animation:obIn .35s ease both}
.spk .rl-info h3{font-size:clamp(20px,3.2vw,30px);font-weight:900;line-height:1.2;margin:2px 0}
.spk .rl-info .ob-price{justify-content:center}
.spk .rl-act{display:flex;gap:16px;justify-content:center;align-items:center;margin-top:6px}
.spk .rl-more{border:1.5px solid color-mix(in srgb,var(--ink) 25%,transparent);background:transparent;color:var(--ink);border-radius:99px;padding:7px 16px;font:inherit;font-weight:800;font-size:13px;cursor:pointer}
@keyframes rlSway{0%,100%{transform:rotate(-1.2deg)}50%{transform:rotate(1.2deg)}}
.spk .sh2-bar{display:flex;gap:12px;align-items:center;margin:4px 0 14px}
.spk .sh2-btn{border:0;background:var(--ink);color:var(--bg);border-radius:99px;padding:11px 20px;font:inherit;font-weight:800;font-size:14px;cursor:pointer;min-height:44px}
.spk .sh2-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:clamp(10px,2.4vw,22px)}
.spk .sh2-it{border:0;background:none;padding:0;cursor:pointer;color:var(--ink);text-align:center;display:flex;flex-direction:column;align-items:center;gap:6px;-webkit-tap-highlight-color:transparent}
.spk .sh2-pic{display:block;width:100%;aspect-ratio:1;border-radius:16px;background:color-mix(in srgb,var(--ink) 5%,var(--card));padding:10px;animation:sh2Float var(--du,5s) ease-in-out var(--dl,0s) infinite;transition:box-shadow .2s}
.spk .sh2-it:hover .sh2-pic{box-shadow:0 14px 26px -14px color-mix(in srgb,var(--ink) 50%,transparent)}
.spk .sh2-pic img{width:100%;height:100%;object-fit:contain;pointer-events:none;display:block}
.spk .sh2-nm{font-size:13px;font-weight:700;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.spk .sh2-it .ob-price{font-size:13px;margin-top:0;justify-content:center}
@keyframes sh2Float{0%,100%{transform:translateY(0) rotate(-1deg)}50%{transform:translateY(-8px) rotate(1deg)}}
@media(max-width:699px){.spk .sh2-grid{grid-template-columns:repeat(2,1fr)}.spk .rl-sp{flex-basis:calc(50% - 75px)}}
@media(prefers-reduced-motion:reduce){.spk .rl-pic,.spk .sh2-pic,.spk .rl-info{animation:none}.spk .rl-it{transition:none}}
.spk .lk-top{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px}
.spk .lk-top h2{margin:0;font-size:clamp(20px,3vw,28px);font-weight:900}
.spk .lk-cart{border:1.5px solid var(--ln);background:var(--card);color:var(--ink);border-radius:99px;padding:8px 14px;font:inherit;font-weight:800;cursor:pointer;min-height:40px}
.spk .lk-line{display:flex;gap:10px;overflow-x:auto;padding:4px 2px 12px;scrollbar-width:none;scroll-snap-type:x proximity}
.spk .lk-line::-webkit-scrollbar{display:none}
.spk .lk-line button{flex:none;width:88px;border:0;background:none;padding:0;cursor:pointer;color:var(--ink);font:inherit;font-size:12px;font-weight:700;display:flex;flex-direction:column;gap:6px;align-items:center;opacity:.6;scroll-snap-align:start}
.spk .lk-line button.on{opacity:1}
.spk .lk-line img,.spk .lk-line .ph{width:88px;height:116px;object-fit:cover;border-radius:12px;background:var(--card);border:2px solid transparent;display:block}
.spk .lk-line button.on img,.spk .lk-line button.on .ph{border-color:var(--ink)}
.spk .lk-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);gap:clamp(16px,3vw,36px);align-items:start}
.spk .lk-main{border-radius:18px;overflow:hidden;background:var(--card);aspect-ratio:3/4;position:sticky;top:84px;animation:obIn .35s ease both}
.spk .lk-main>img{width:100%;height:100%;object-fit:cover;display:block}
.spk .lk-collage{display:grid;grid-template-columns:1fr 1fr;gap:4px;height:100%}
.spk .lk-collage img,.spk .lk-collage .ph{width:100%;height:100%;object-fit:cover}
.spk .lk-k{font-size:12px;letter-spacing:.06em;color:var(--mut);font-weight:700}
.spk .lk-side h3{margin:4px 0 4px;font-size:clamp(20px,2.6vw,28px);font-weight:900;line-height:1.25}
.spk .lk-note{margin:0 0 10px;color:var(--mut);font-size:14px}
.spk .lk-list{display:grid;gap:10px;margin:12px 0}
.spk .lk-it{display:flex;gap:12px;align-items:flex-start;padding:10px;border:1px solid var(--ln);border-radius:var(--r);background:var(--card);transition:opacity .2s}
.spk .lk-it.off{opacity:.5}
.spk .lk-it.so{opacity:.65}
.spk .lk-th{flex:none;width:72px;height:90px;border-radius:10px;overflow:hidden;background:var(--bg);display:block}
.spk .lk-th img,.spk .lk-th .ph{width:100%;height:100%;object-fit:cover;display:block}
.spk .ph{display:grid;place-items:center;font-weight:900;color:var(--mut)}
.spk .lk-bd{flex:1;min-width:0}
.spk .lk-nm{font-weight:800;font-size:14.5px;line-height:1.35}
.spk .lk-pr{font-weight:800;font-size:14px;margin:2px 0 6px}
.spk .lk-sold{color:#c53030;font-size:12.5px;font-weight:700}
.spk .lk-chips{display:flex;flex-wrap:wrap;gap:6px}
.spk .lk-chips button{min-width:38px;height:34px;padding:0 10px;border-radius:10px;border:1.5px solid var(--ln);background:var(--bg);color:var(--ink);font:inherit;font-weight:700;font-size:13px;cursor:pointer}
.spk .lk-chips button.sel{background:var(--ink);color:var(--bg);border-color:var(--ink)}
.spk .lk-opt{margin-top:6px}
.spk .lk-ac{display:flex;flex-direction:column;gap:8px;align-items:center;flex:none}
.spk .lk-add{width:38px;height:38px;border-radius:50%;border:0;background:var(--ink);color:var(--bg);font-size:22px;line-height:1;cursor:pointer;font-weight:700}
.spk .lk-add:disabled{opacity:.3;cursor:not-allowed}
.spk .lk-in{display:flex;gap:4px;align-items:center;font-size:11px;color:var(--mut);cursor:pointer}
.spk .lk-ft{position:sticky;bottom:0;background:var(--bg);padding:12px 0 4px;border-top:1px solid var(--ln);display:grid;gap:10px}
.spk .lk-tot{display:flex;justify-content:space-between;align-items:baseline;font-size:15px;font-weight:700}
.spk .lk-tot b{font-size:22px;font-weight:900}
.spk .lk-all{border:0;border-radius:99px;background:var(--ink);color:var(--bg);font:inherit;font-weight:800;font-size:15px;min-height:50px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;padding:0 18px}
.spk .lk-all:disabled{opacity:.45;cursor:not-allowed}
.spk .lk-all.ok{background:var(--c);color:var(--onc)}
@media(max-width:760px){.spk .lk-grid{grid-template-columns:1fr}.spk .lk-main{position:static;aspect-ratio:4/5}.spk .lk-ft{bottom:0}}
@media(prefers-reduced-motion:reduce){.spk .lk-main{animation:none}}
`;
