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
.spk .pc-hg{position:absolute;top:50px;inset-inline-start:8px;z-index:3;width:34px;height:34px;border-radius:50%;border:0;background:rgba(255,255,255,.92);color:#64748b;display:grid;place-items:center;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.12);transition:transform .15s}
.spk .pc-hg:hover{transform:scale(1.08)}
.spk .pc-hg.on{background:#f97316;color:#fff}
.spk[data-ob] .pc-hg{inset-inline-start:auto;inset-inline-end:10px;background:color-mix(in srgb,var(--card) 90%,transparent);box-shadow:none}
.spk[data-ob] .pc-hg.on{background:#f97316;color:#fff}
.spk .td{position:fixed;z-index:900;inset-inline-start:16px;bottom:calc(var(--spk-bar-h,0px) + 16px);width:min(320px,calc(100vw - 24px));max-height:calc(100vh - var(--spk-bar-h,0px) - 32px);overflow:auto;background:var(--card);color:var(--ink);border:1px solid var(--ln);border-radius:20px;padding:14px;display:grid;gap:10px;box-shadow:0 18px 50px rgba(0,0,0,.28);animation:tdIn .25s ease}
@keyframes tdIn{from{opacity:0;transform:translateY(14px) scale(.97)}to{opacity:1;transform:none}}
.spk .td-h{display:flex;justify-content:space-between;align-items:center;font-size:16px}
.spk .td-x,.spk .td-t button,.spk .td-lb button{width:26px;height:26px;border-radius:50%;border:0;background:color-mix(in srgb,var(--ink) 10%,var(--card));color:var(--ink);cursor:pointer;font-size:12px;line-height:1}
.spk .td-s,.spk .td-n{font-size:12px;color:var(--mut)}
.spk .td-img{position:relative;aspect-ratio:3/4;border-radius:14px;overflow:hidden;background:#e9e6e0;display:grid;place-items:center}
.spk .td-img>img,.spk .td-img>svg{width:100%;height:100%;object-fit:cover;display:block}
.spk .td-img>svg{object-fit:contain}
.spk .td-base{opacity:.9}
.spk .td-load{position:absolute;inset:0;display:grid;place-content:center;justify-items:center;gap:6px;background:rgba(15,23,42,.62);color:#fff;text-align:center;padding:12px;backdrop-filter:blur(3px)}
.spk .td-load i{width:30px;height:30px;border-radius:50%;border:3px solid rgba(255,255,255,.35);border-top-color:#fff;animation:tdSp .8s linear infinite}
@keyframes tdSp{to{transform:rotate(360deg)}}
.spk .td-load small{opacity:.8;font-size:11px}
.spk .td-zm{position:absolute;bottom:8px;inset-inline-end:8px;width:32px;height:32px;border-radius:50%;border:0;background:rgba(15,23,42,.7);color:#fff;font-size:16px;cursor:pointer}
.spk .td-er{font-size:12.5px;color:#dc2626;background:rgba(220,38,38,.08);padding:9px 11px;border-radius:10px}
.spk .td-er button{border:0;background:none;color:inherit;font:inherit;font-weight:800;text-decoration:underline;cursor:pointer}
.spk .td-pk{display:flex;justify-content:space-between;font-size:12.5px;font-weight:700;color:var(--mut)}
.spk .td-th{display:flex;gap:8px;flex-wrap:wrap}
.spk .td-t{position:relative;width:50px;height:50px;border-radius:12px;background:color-mix(in srgb,var(--ink) 6%,var(--card));border:1px solid var(--ln)}
.spk .td-t a{display:block;width:100%;height:100%}
.spk .td-t img{width:100%;height:100%;object-fit:contain;border-radius:12px}
.spk .td-t button{position:absolute;top:-6px;inset-inline-end:-6px;width:20px;height:20px;font-size:10px}
.spk .td-em{font-size:12px;color:var(--mut)}
.spk .td-ms{display:flex;gap:6px}
.spk .td-ms button{width:38px;height:38px;border-radius:10px;border:2px solid transparent;padding:0;overflow:hidden;cursor:pointer;background:var(--card)}
.spk .td-ms button.on{border-color:var(--ink)}
.spk .td-ms img{width:100%;height:100%;object-fit:cover}
.spk .td-f{display:flex;justify-content:space-between;align-items:center;gap:8px}
.spk .td-rs{border:0;background:none;color:var(--mut);font:inherit;font-weight:700;font-size:13px;cursor:pointer}
.spk .td-pill{position:fixed;z-index:900;inset-inline-start:16px;bottom:calc(var(--spk-bar-h,0px) + 16px);display:flex;gap:8px;align-items:center;padding:11px 16px;border-radius:99px;border:0;background:var(--ink);color:var(--card);font:inherit;font-weight:800;cursor:pointer;box-shadow:0 10px 30px rgba(0,0,0,.3)}
.spk .td-lb{position:fixed;inset:0;z-index:2100;background:rgba(0,0,0,.85);display:grid;place-items:center;padding:16px}
.spk .td-lb img{max-width:100%;max-height:100%;border-radius:12px}
.spk .td-lb button{position:absolute;top:14px;inset-inline-end:14px;width:36px;height:36px;font-size:16px}

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
.spk .cpn{display:flex;gap:8px;min-width:0}
.spk .cpn .in{flex:1 1 0;min-width:0;width:auto}
.spk .cpn .b{flex:none}
.spk .sum{background:var(--bg);border:1px solid var(--ln);border-radius:14px;padding:12px 14px;display:grid;gap:6px;font-size:14px}
.spk .sum div{display:flex;justify-content:space-between}
.spk .sum .tot{font-size:18px;font-weight:900;border-top:1px dashed var(--ln);padding-top:8px;margin-top:2px}
.spk .prog{height:8px;border-radius:8px;background:var(--ln);overflow:hidden}
.spk .prog i{display:block;height:100%;background:var(--c)}
.spk .hp{position:absolute;left:0;top:0;opacity:0;height:1px;width:1px;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);pointer-events:none;border:0;padding:0;margin:0;z-index:-1}

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
.spk .pwl img{height:104px;width:auto;opacity:.97;display:block}

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

.spk .ob-stage{position:relative;overflow:hidden;isolation:isolate;background:var(--stage);touch-action:none;user-select:none;-webkit-user-select:none;outline:none;color:var(--obk)}
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
.spk .ob-sz{display:flex;flex-wrap:wrap;gap:8px}
.spk .ob-sz button{flex:1 1 56px;min-width:56px}
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
.spk:has(.ob-focus) .ob-stage{visibility:hidden}
.spk .ob-focus{isolation:isolate;position:fixed;inset:0;height:100vh;height:100dvh;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;scroll-padding-bottom:96px;z-index:1000;background:var(--stage);color:var(--ink);display:flex;flex-direction:column;animation:obFade .25s ease both;overflow:auto}
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
.spk .ob-fbar{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:10px max(16px,5vw) calc(40px + env(safe-area-inset-bottom));flex-wrap:wrap}
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
.spk .st{position:relative;margin:0 8px;border-radius:22px;overflow:hidden;color:#fff;min-height:760px;display:grid;grid-template-columns:minmax(0,1fr) 380px;grid-template-rows:auto 1fr auto;gap:14px;padding:16px;isolation:isolate}
.spk .glass-d{background:rgba(38,36,40,.34);border:1px solid rgba(255,255,255,.3);border-radius:22px;backdrop-filter:blur(22px) saturate(140%);-webkit-backdrop-filter:blur(22px) saturate(140%);box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 18px 40px -18px rgba(0,0,0,.35)}
.spk .st-scene{position:absolute;inset:0;z-index:-1;overflow:hidden;background:#cfd2d4}
.spk .st-grade{position:absolute;inset:-3%;transition:filter .9s ease}
.spk .st-bg{position:absolute;inset:0;background:linear-gradient(90deg,#9aa4ad 0,#c7cbcd 24%,#dcdcda 60%,#c9c5be 100%);filter:var(--st-bg);transform:scale(1.04)}
.spk .st-bg:before{content:"";position:absolute;left:4%;top:8%;width:22%;height:70%;border:6px solid #2b2d30;background:linear-gradient(180deg,#b9c6d3,#e4e9ee);opacity:.85}
.spk .st-bg:after{content:"";position:absolute;inset:auto 0 0 0;height:26%;background:linear-gradient(180deg,#d8d8d6,#c4c3bf)}
.spk .st-tint{position:absolute;inset:0;mix-blend-mode:soft-light;transition:background .9s}
.spk .st-vig{position:absolute;inset:0;background:radial-gradient(120% 90% at 50% 45%,transparent 55%,rgba(20,18,22,.38) 100%),linear-gradient(180deg,rgba(20,20,24,.22),transparent 18%,transparent 70%,rgba(20,20,24,.35))}
.spk .st-tabs{grid-column:1/-1;justify-self:center;display:flex;gap:4px;padding:4px;border-radius:30px}
.spk .st-tabs button{height:40px;padding:0 26px;border-radius:24px;border:0;background:none;color:rgba(255,255,255,.72);font:inherit;font-size:14px;letter-spacing:.05em;cursor:pointer;transition:background .4s,color .3s}
.spk .st-tabs button.on{color:#fff;background:rgba(255,255,255,.14);box-shadow:0 0 0 1px rgba(255,255,255,.85),0 0 18px rgba(255,255,255,.35)}
.spk .st-model{grid-column:1;grid-row:2;position:relative;display:grid;place-items:end center;min-height:520px;overflow:hidden}
.spk .st-inner{position:relative;height:min(560px,100%);aspect-ratio:2/3;transform-origin:50% 100%;transform:scaleX(var(--st-b)) scaleY(var(--st-h));transition:transform .7s cubic-bezier(.2,.7,.2,1)}
.spk .st-breath{position:absolute;inset:0;transform-origin:50% 100%;animation:stBr 5.5s ease-in-out infinite}
@keyframes stBr{0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.006)}}
.spk .st[data-frame="mid"] .st-inner{transform:translateY(24%) scaleX(var(--st-b)) scale(calc(var(--st-h)*1.4))}
.spk .st[data-frame="portrait"] .st-inner{transform:translateY(60%) scaleX(var(--st-b)) scale(calc(var(--st-h)*2.2))}
.spk .st-model{transition:none}
.spk .st-inner{transition:transform 1s cubic-bezier(.65,0,.2,1)}
.spk .st-shadow{position:absolute;bottom:0;left:50%;width:300px;height:34px;transform:translateX(-50%);background:radial-gradient(closest-side,rgba(30,28,26,.55),rgba(30,28,26,0));filter:blur(4px)}
.spk .st-figs,.spk .st-base{position:absolute;inset:0;width:100%;height:100%}
.spk .st-base{object-fit:contain;object-position:bottom}
.spk .st-fig{position:absolute;inset:0;filter:var(--st-real)}
.spk .st-fig img,.spk .st-fig svg{width:100%;height:100%;object-fit:contain;object-position:50% 100%;display:block}
.spk .st-fig.in{clip-path:inset(0 0 100% 0);animation:stWipe 1.05s cubic-bezier(.7,0,.25,1) forwards}
@keyframes stWipe{to{clip-path:inset(0 0 0 0)}}
.spk .st-scan{position:absolute;left:-10%;right:-10%;top:0;height:2px;opacity:0;pointer-events:none;background:linear-gradient(90deg,transparent,#fff 25%,#fff 75%,transparent);box-shadow:0 0 22px 6px rgba(255,255,255,.55),0 0 60px 18px rgba(214,226,255,.35)}
.spk .st-scan[data-go="1"]{animation:stScan 1.05s cubic-bezier(.7,0,.25,1)}
@keyframes stScan{0%{top:0;opacity:1}92%{top:92%;opacity:1}100%{top:100%;opacity:0}}
.spk .st-card{grid-column:1;grid-row:2;align-self:start;justify-self:start;width:210px;padding:14px;display:grid;gap:6px}
.spk .st-card .pr,.spk .st-card .price{color:#fff}
.spk .st-nm{font-size:15px}.spk .st-act{display:flex;flex-wrap:wrap;gap:10px;font-size:12.5px}
.spk .st-act button{border:0;background:rgba(255,255,255,.14);color:#fff;border-radius:99px;padding:5px 12px;font:inherit;cursor:pointer}.spk .st-act a{color:rgba(255,255,255,.85);text-decoration:underline}
.spk .st-panel{grid-column:2;grid-row:2;padding:18px;display:flex;flex-direction:column;gap:12px;overflow:auto;max-height:640px}
.spk .st-ph{display:flex;justify-content:space-between;align-items:baseline}.spk .st-ph h3{margin:0;font-size:17px;font-weight:400;letter-spacing:.06em;color:#fff}.spk .st-ph span{font-size:12px;color:rgba(255,255,255,.55)}
.spk .st-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.spk .st-c{position:relative;height:112px;border-radius:14px;border:1px solid rgba(255,255,255,.3);background:linear-gradient(180deg,rgba(255,255,255,.22),rgba(255,255,255,.06));padding:0;overflow:hidden;cursor:pointer;transition:transform .3s,box-shadow .3s;color:#fff}
.spk .st-c:hover{transform:translateY(-3px)}.spk .st-c.on,.spk .st-c.hl{box-shadow:0 0 0 1px rgba(255,255,255,.85),0 0 18px rgba(255,255,255,.35),0 0 0 4px rgba(255,255,255,.25)}
.spk .st-im{position:absolute;inset:6px 6px 22px;display:grid;place-items:center}.spk .st-im img{width:100%;height:100%;object-fit:contain;transition:transform .4s}.spk .st-c:hover .st-im img{transform:scale(1.06)}
.spk .st-tg{position:absolute;inset-inline:5px;bottom:4px;font-size:10.5px;text-align:center;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;color:rgba(255,255,255,.9)}
.spk .st-hr{position:absolute;top:4px;inset-inline-end:4px;width:20px;height:20px;border-radius:50%;background:#fff;color:#e11d48;font-size:11px;display:grid;place-items:center}
.spk .st-det{display:grid;gap:9px;margin-top:auto;padding:12px;border-radius:14px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.3)}
.spk .st-dh{display:flex;justify-content:space-between;align-items:baseline;gap:8px}.spk .st-dh b{font-size:14px;color:#fff}
.spk .st-dh .pr,.spk .st-dh .price{color:#fff}
.spk .st-sz{display:flex;flex-wrap:wrap;gap:6px;align-items:center;font-size:12px;color:rgba(255,255,255,.75)}
.spk .st-sz button,.spk .st-chips button{min-width:34px;height:30px;padding:0 10px;border-radius:9px;border:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.1);color:#fff;font:inherit;font-size:13px;cursor:pointer}
.spk .st-sz button.on,.spk .st-chips button.on{background:#fff;color:#14110f;box-shadow:0 0 14px rgba(255,255,255,.35)}
.spk .st-add{height:44px;border-radius:14px;border:1.5px solid #fff;background:transparent;color:#fff;font:inherit;font-weight:700;letter-spacing:.04em;cursor:pointer;transition:background .3s,color .3s}.spk .st-add:hover:not(:disabled),.spk .st-add.ok{background:#fff;color:#14110f}.spk .st-add:disabled{opacity:.4}
.spk .st-so{color:#fca5a5}
.spk .st-sl{display:grid;grid-template-columns:1fr auto;gap:8px 10px;font-size:14px;color:#fff}.spk .st-sl input{grid-column:1/-1;-webkit-appearance:auto;appearance:auto;width:100%;accent-color:#fff}
.spk .st-lb{font-size:13px;color:rgba(255,255,255,.7)}.spk .st-chips{display:flex;gap:8px;flex-wrap:wrap}
.spk .st-flt{position:relative}.spk .st-fd{height:38px;min-width:160px;padding:0 14px;border-radius:12px;border:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.1);color:#fff;font:inherit;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:8px}
.spk .st-fl{position:absolute;top:44px;inset-inline-start:0;z-index:5;min-width:190px;padding:6px;border-radius:14px;display:grid;gap:2px}.spk .st-fl button{border:0;background:none;color:#fff;padding:8px 10px;border-radius:9px;text-align:start;font:inherit;cursor:pointer}.spk .st-fl button.on,.spk .st-fl button:hover{background:rgba(255,255,255,.16)}
.spk .st-th{display:flex;gap:8px;flex-wrap:wrap}.spk .st-th button{position:relative;width:58px;height:58px;border-radius:12px;border:1px solid rgba(255,255,255,.3);overflow:hidden;padding:0;background:rgba(255,255,255,.12);cursor:pointer;transition:transform .3s}.spk .st-th button:hover{transform:translateY(-3px)}.spk .st-th button.on{box-shadow:0 0 0 1px rgba(255,255,255,.85),0 0 18px rgba(255,255,255,.35)}
.spk .st-th span,.spk .st-th img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.spk .st-th i{position:absolute;inset:0;mix-blend-mode:soft-light}
.spk .st-bar{grid-column:1;grid-row:3;justify-self:center;display:flex;gap:2px;padding:5px;border-radius:18px;flex-wrap:wrap;justify-content:center}
.spk .st-bar button{height:42px;padding:0 16px;border:0;border-radius:13px;background:none;color:#fff;font:inherit;font-size:14px;cursor:pointer}.spk .st-bar button:disabled{opacity:.4;cursor:default}.spk .st-bar button.on{box-shadow:0 0 0 1px rgba(255,255,255,.85),0 0 18px rgba(255,255,255,.35)}
.spk .st-save{grid-column:2;grid-row:3;height:56px;border-radius:16px;border:1.5px solid #fff;background:rgba(38,36,40,.34);color:#fff;font:inherit;font-weight:700;font-size:16px;letter-spacing:.05em;box-shadow:0 0 18px rgba(255,255,255,.35),inset 0 0 14px rgba(255,255,255,.15);cursor:pointer;backdrop-filter:blur(18px);transition:background .3s,color .3s}.spk .st-save:hover{background:#fff;color:#14110f}
.spk .st-lib{position:absolute;z-index:20;inset-inline:0;bottom:84px;margin:auto;width:min(560px,calc(100% - 24px));padding:14px 16px;animation:arcBuy .4s cubic-bezier(.2,.8,.2,1)}
.spk .st-lib p{margin:8px 0 0;font-size:13px;color:rgba(255,255,255,.7)}.spk .st-lr{display:flex;gap:10px;overflow-x:auto;padding:10px 0 2px}
.spk .st-lr button{flex:0 0 72px;height:104px;border-radius:12px;border:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.1);padding:4px;cursor:pointer}.spk .st-lr img{width:100%;height:100%;object-fit:contain}
.spk .st-x{width:28px;height:28px;border-radius:50%;border:0;background:rgba(255,255,255,.16);color:#fff;cursor:pointer}
.spk .st-toast{position:absolute;z-index:30;top:70px;left:50%;transform:translateX(-50%);padding:10px 18px;border-radius:99px;background:rgba(30,30,34,.7);backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.3);color:#fff;font-size:14px;animation:stT .35s cubic-bezier(.3,1.4,.5,1)}
@keyframes stT{from{opacity:0;transform:translate(-50%,-20px)}to{opacity:1;transform:translate(-50%,0)}}
@media(max-width:999px){.spk .st{grid-template-columns:1fr;margin:0;padding:12px}.spk .st-model{grid-row:2;min-height:440px}.spk .st-card{display:none}.spk .st-panel{grid-column:1;grid-row:3;max-height:none}.spk .st-bar{grid-row:4}.spk .st-save{grid-column:1;grid-row:5}.spk .st-grid{grid-template-columns:repeat(3,1fr)}.spk .st-lib{bottom:150px}}
@media(prefers-reduced-motion:reduce){.spk .st-breath,.spk .st-fig.in,.spk .st-scan{animation:none}.spk .st-fig.in{clip-path:none}}
.spk .rw{display:grid;grid-template-columns:minmax(0,1fr) 380px;background:var(--card);border:1px solid var(--ln);border-radius:22px;margin:0 8px;overflow:hidden;min-height:640px}
.spk .rw-l{position:relative;display:flex;flex-direction:column;min-width:0}
.spk .rw-head{padding:34px 40px 0}
.spk .rw-head h2{margin:0;font-size:40px;line-height:1;letter-spacing:-.02em;font-weight:400}
.spk .rw-head p{margin:10px 0 0;font-size:12.5px;color:var(--mut);max-width:46ch;line-height:1.55}
.spk .rw-stage{position:relative;flex:1 1 auto;min-height:400px;overflow:hidden;outline:none;touch-action:pan-y;user-select:none;cursor:grab;perspective:1400px}
.spk .rw-stage:focus-visible{box-shadow:inset 0 0 0 2px var(--ink)}
.spk .rw-it{position:absolute;left:50%;bottom:26px;width:min(34%,230px);aspect-ratio:3/4;margin-left:calc(min(34%,230px)/-2);padding:0;border:0;background:none;cursor:pointer;
  --s:calc(1 - var(--a)*.2);transform:translateX(calc(var(--d)*46%)) translateZ(calc(var(--a)*-90px)) scale(var(--s));transform-origin:50% 100%;
  filter:blur(calc(max(0,var(--a) - 1)*2.2px));opacity:calc(1 - max(0,var(--a) - 2.4)*.9);z-index:calc(100 - var(--a)*10);
  transition:transform .8s cubic-bezier(.2,.8,.2,1),filter .6s,opacity .6s}
.spk .rw-it[data-hide="1"]{visibility:hidden;pointer-events:none}
.spk .rw-it.cur{transform:translateX(var(--rw-dx,0)) scale(1.18);z-index:200}
.spk .rw-pic{position:absolute;inset:0;display:grid;place-items:end center}
.spk .rw-pic img{width:100%;height:100%;object-fit:contain;object-position:50% 100%;filter:drop-shadow(0 18px 22px rgba(20,16,12,.25));pointer-events:none}
.spk .rw-sh{position:absolute;left:50%;bottom:0;width:130%;height:9%;transform:translate(-50%,50%);background:radial-gradient(closest-side,rgba(20,16,12,.3),rgba(20,16,12,.12) 45%,rgba(20,16,12,0));filter:blur(2px)}
.spk .rw-cursor{position:absolute;left:0;top:0;width:0;height:0;z-index:300;pointer-events:none;display:none}
@media(pointer:fine){.spk .rw-cursor{display:block}.spk .rw-cursor b{position:absolute;left:-30px;top:-30px;width:60px;height:60px;border-radius:50%;display:grid;place-items:center;font-size:11px;font-weight:700;letter-spacing:.08em;background:rgba(255,255,255,.85);color:#111;backdrop-filter:blur(6px);box-shadow:0 6px 20px -8px rgba(0,0,0,.4);transition:opacity .25s,transform .35s cubic-bezier(.2,.8,.2,1)}
.spk .rw-cursor[data-over="drag"] .rw-cv,.spk .rw-cursor[data-over="view"] .rw-cd{opacity:0;transform:scale(.5)}.spk .rw-stage:not(:hover) .rw-cursor{display:none}}
.spk .rw-ctl{display:flex;align-items:center;gap:14px;padding:6px 28px 24px}
.spk .rw-ic{width:44px;height:44px;border-radius:50%;border:0;background:none;font-size:20px;color:var(--ink);cursor:pointer;transition:background .3s,transform .3s}
.spk .rw-ic:hover{background:color-mix(in srgb,var(--ink) 8%,transparent)}.spk .rw-ic:active{transform:scale(.88)}
.spk .rw-ticks{flex:1;display:flex;gap:6px;min-width:0}
.spk .rw-tk{flex:0 1 44px;min-width:14px;height:44px;display:flex;flex-direction:column;justify-content:center;gap:9px;border:0;background:none;padding:0;text-align:start;color:var(--mut);cursor:pointer;transition:flex-basis .8s cubic-bezier(.2,1.25,.3,1),color .3s}
.spk .rw-tk.on{flex:0 0 190px;color:var(--ink)}
.spk .rw-bar{display:block;height:2px;background:color-mix(in srgb,var(--ink) 14%,transparent);overflow:hidden}
.spk .rw-bar i{display:block;height:100%;background:var(--ink);transform:scaleX(0);transform-origin:left}
.spk .rw-tk.past .rw-bar i{transform:scaleX(1);opacity:.35}.spk .rw-tk.on .rw-bar i{transform:scaleX(1)}
.spk .rw-bar i.go{animation:rwBar linear forwards}
@keyframes rwBar{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.spk .rw-tl{font-size:10px;letter-spacing:.12em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.spk .rw-tl em{font-style:normal}
.spk .rw-p{border-inline-start:1px solid var(--ln);display:flex;flex-direction:column;min-width:0;background:var(--card)}
.spk .rw-ph{display:flex;justify-content:space-between;align-items:baseline;padding:34px 24px 14px}
.spk .rw-ph h3{margin:0;font-size:18px;font-weight:400}.spk .rw-ph span{font-size:10px;letter-spacing:.14em;color:var(--mut)}
.spk .rw-li{list-style:none;margin:0;padding:0 24px;flex:1 1 auto;overflow-y:auto}
.spk .rw-row{display:grid;grid-template-columns:78px minmax(0,1fr) 44px;gap:14px;align-items:center;padding:14px 0;border-top:1px solid var(--ln);animation:rwIn .6s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i)*90ms)}
@keyframes rwIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.spk .rw-m{position:relative;display:block;aspect-ratio:4/5;background:color-mix(in srgb,var(--ink) 5%,var(--card));overflow:hidden}
.spk .rw-m img{width:100%;height:100%;object-fit:cover;transition:transform 1.2s cubic-bezier(.2,.8,.2,1)}.spk .rw-row:hover .rw-m img{transform:scale(1.07)}
.spk .rw-m span{position:absolute;top:5px;inset-inline-end:5px;width:20px;height:20px;border-radius:50%;background:rgba(255,255,255,.9);color:#151413;font-size:10px;font-weight:600;display:grid;place-items:center}
.spk .rw-in{display:flex;flex-direction:column;gap:5px;min-width:0}
.spk .rw-nm{font-size:13px;font-weight:500;line-height:1.3}
.spk .rw-sz{display:flex;flex-wrap:wrap;gap:5px}
.spk .rw-sz button{min-width:30px;height:26px;padding:0 7px;border-radius:7px;border:1px solid var(--ln);background:none;font-size:11.5px;cursor:pointer;color:var(--ink)}
.spk .rw-sz button.on{background:var(--ink);color:var(--card);border-color:var(--ink)}
.spk .rw-so{color:#dc2626;font-size:11px}
.spk .rw-add{width:44px;height:44px;border-radius:50%;border:1px solid var(--ln);background:none;font-size:22px;color:var(--ink);cursor:pointer;transition:background .3s,color .3s,transform .4s cubic-bezier(.2,1.6,.4,1)}
.spk .rw-add:hover:not(:disabled){transform:scale(1.1)}.spk .rw-add.ok{border-color:var(--ink)}.spk .rw-add:disabled{opacity:.35;cursor:not-allowed}
.spk .rw-bd{border-top:1px solid var(--ln);padding:16px 24px 22px;display:grid;gap:10px}
.spk .rw-bt{display:flex;justify-content:space-between;align-items:baseline;font-size:13px}.spk .rw-bt b{font-size:18px}
.spk .rw-all{height:48px;border:0;border-radius:0;background:var(--ink);color:var(--card);font:inherit;font-weight:700;letter-spacing:.04em;cursor:pointer;transition:opacity .3s}.spk .rw-all:disabled{opacity:.4}
.spk .rw-ok{font-size:12.5px;color:var(--ink);display:flex;justify-content:space-between;gap:8px}.spk .rw-ok button{border:0;background:none;font:inherit;font-weight:700;text-decoration:underline;cursor:pointer;color:inherit}
@media(max-width:1099px){.spk .rw{grid-template-columns:1fr;margin:0}.spk .rw-stage{min-height:420px}.spk .rw-head{padding:24px 18px 0}.spk .rw-head h2{font-size:30px}.spk .rw-it{width:46%;margin-left:-23%}.spk .rw-ctl{padding:6px 10px 18px}.spk .rw-tk.on{flex-basis:110px}.spk .rw-tk:not(.on) .rw-tl{display:none}.spk .rw-p{border-inline-start:0;border-top:1px solid var(--ln)}.spk .rw-ph{padding:20px 18px 10px}.spk .rw-li{padding:0 18px}.spk .rw-bd{padding:14px 18px 20px}}
@media(prefers-reduced-motion:reduce){.spk .rw-it,.spk .rw-row{transition:none;animation:none}.spk .rw-bar i.go{animation:none;transform:scaleX(1)}}
.spk .rl2{position:relative;margin:0 8px;border-radius:22px;background:#FAF7F2;color:#1A1716;overflow:hidden;padding-bottom:18px;border:1px solid #DDD5C9}
.spk .rl2-zone{position:relative;height:clamp(300px,36vw,400px);overflow:hidden;outline:none;touch-action:pan-y;cursor:grab;user-select:none}
.spk .rl2-zone.drg{cursor:grabbing}
.spk .rl2-zone:focus-visible{box-shadow:inset 0 0 0 2px #1A1716}
.spk .rl2-svg{position:absolute;inset:0;pointer-events:none;overflow:visible}
.spk .rl2-g{position:absolute;left:0;top:0;width:var(--rl-bw,120px);will-change:transform}
.spk .rl2-sw{transform-origin:50% 0;width:100%}
.spk .rl2-lift{position:relative;width:100%;height:var(--rl-bh,160px);transform-origin:50% 0;transition:transform .42s cubic-bezier(.22,1,.36,1);perspective:700px;margin-top:2px}
.spk .rl2-hk{position:absolute;left:50%;top:-4px;width:34%;transform:translateX(-50%);z-index:3;pointer-events:none}
.spk .rl2-in{position:absolute;inset:14% 6% 0;transform-style:preserve-3d;transition:transform .5s cubic-bezier(.22,1,.36,1);transform-origin:50% 0}
.spk .rl2-f,.spk .rl2-b{position:absolute;inset:0;display:grid;place-items:start center;backface-visibility:hidden;-webkit-backface-visibility:hidden}
.spk .rl2-b{transform:rotateY(180deg)}
.spk .rl2-f img,.spk .rl2-b img{width:100%;height:100%;object-fit:contain;object-position:50% 0;filter:drop-shadow(0 10px 12px rgba(60,40,25,.18));pointer-events:none}
.spk .rl2-tg{position:absolute;left:-6%;top:62%;z-index:4;min-width:30px;height:18px;padding:0 5px;border-radius:2px;background:#F6F1E7;box-shadow:0 1px 3px rgba(60,45,30,.18);font-size:9.6px;font-weight:600;display:grid;place-items:center;color:#2A2420;pointer-events:none}
.spk .rl2-hit{position:absolute;left:-10%;right:-10%;top:0;height:var(--rl-bh,160px);border:0;background:none;padding:0;cursor:inherit;z-index:6}
.spk .rl2-hit:focus-visible{outline:2px solid #1A1716;outline-offset:-2px}
.spk .rl2-bar{display:flex;justify-content:center;padding:4px 0 8px}
.spk .rl2-pt{position:relative;width:140px;height:2px;background:#DCD4C8}.spk .rl2-pt i{position:absolute;top:0;height:100%;width:58%;background:#1A1716}
.spk .rl2-info{display:grid;gap:8px;max-width:560px;margin:0 auto;padding:6px 18px 0;text-align:center;justify-items:center}
.spk .rl2-info h3{margin:0;font-size:19px;font-weight:600;color:#1A1716}
.spk .rl2-info .ob-cnt{color:#8A7F72;font-size:12px;letter-spacing:.12em}
.spk .rl2-info .rl-act{justify-content:center}
@media(prefers-reduced-motion:reduce){.spk .rl2-lift,.spk .rl2-in{transition:none}}
.spk .arc{position:relative;height:clamp(720px,94vh,880px);overflow:hidden;outline:none;touch-action:pan-y;user-select:none;background:radial-gradient(70% 60% at 50% 45%,color-mix(in srgb,var(--card) 70%,var(--bg)),var(--bg));border-radius:22px;margin:0 8px}
.spk .arc-ghost{position:absolute;inset-inline:0;top:6%;text-align:center;font-weight:900;font-size:min(34vw,300px);line-height:.8;letter-spacing:-.04em;color:color-mix(in srgb,var(--ink) 9%,transparent);pointer-events:none;z-index:2;font-family:inherit}
.spk .arc-model{position:absolute;bottom:236px;left:50%;transform:translateX(-50%);height:calc(100% - 290px);aspect-ratio:2/3;z-index:50;pointer-events:none}
.spk .arc-model img,.spk .arc-model svg{width:100%;height:100%;object-fit:contain;object-position:bottom;display:block}
.spk .arc-scan{position:absolute;left:-14%;right:-14%;top:0;height:2px;background:linear-gradient(90deg,transparent,#fff 18%,#fff 82%,transparent);box-shadow:0 0 18px 4px rgba(255,255,255,.75),0 0 60px 10px rgba(190,225,255,.45);opacity:0;animation:arcScan .95s cubic-bezier(.65,0,.35,1)}
@keyframes arcScan{0%{top:0;opacity:0;transform:scaleX(.2)}8%{top:6%;opacity:1;transform:scaleX(1)}92%{top:94%;opacity:1}100%{top:100%;opacity:0;transform:scaleX(.2)}}
.spk .arc-stage{position:absolute;inset:0;z-index:10}
.spk .arc-card{position:absolute;left:50%;top:30%;width:var(--arc-cw,150px);height:calc(var(--arc-cw,150px)*1.42);margin:calc(var(--arc-cw,150px)*-.71) 0 0 calc(var(--arc-cw,150px)*-.5);border-radius:22px;border:1px solid rgba(255,255,255,.5);background:linear-gradient(155deg,rgba(250,248,245,.55),rgba(150,144,136,.2) 48%,rgba(205,200,192,.3));backdrop-filter:blur(18px) saturate(1.4);-webkit-backdrop-filter:blur(18px) saturate(1.4);box-shadow:inset 0 1px 0 rgba(255,255,255,.7),0 20px 50px -24px rgba(40,30,20,.45);overflow:hidden;padding:0;cursor:pointer;color:var(--ink);will-change:transform,opacity}
.spk .arc-g{position:absolute;left:8%;right:8%;top:6%;height:70%;display:grid;place-items:center}
.spk .arc-g img{width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 14px 14px rgba(40,30,20,.22));pointer-events:none}
.spk .arc-n{position:absolute;inset-inline:6%;bottom:7%;font-size:calc(var(--arc-cw,150px)*.085);font-weight:700;text-align:center;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.spk .arc-nav{position:absolute;top:30%;z-index:60;width:46px;height:46px;border-radius:50%;border:1px solid rgba(255,255,255,.6);background:rgba(255,255,255,.55);backdrop-filter:blur(14px);font-size:24px;line-height:1;color:#222;cursor:pointer}
.spk .arc-pv{left:14px}.spk .arc-nx{right:14px}
.spk .arc-buy{position:absolute;z-index:70;bottom:14px;left:50%;transform:translateX(-50%);width:min(560px,calc(100% - 24px));display:grid;gap:8px;padding:14px 16px;border-radius:22px;border:1px solid rgba(255,255,255,.5);background:linear-gradient(155deg,rgba(40,38,36,.55),rgba(40,38,36,.4));backdrop-filter:blur(20px) saturate(1.4);-webkit-backdrop-filter:blur(20px) saturate(1.4);color:#fff;box-shadow:0 20px 50px -24px rgba(0,0,0,.55);animation:arcBuy .5s cubic-bezier(.2,.8,.2,1)}
@keyframes arcBuy{from{opacity:.3;transform:translateX(-50%) translateY(14px)}to{opacity:1;transform:translateX(-50%)}}
.spk .arc-buy h3{margin:2px 0;font-size:16px;color:#fff}
.spk .arc-buy .ob-cnt,.spk .arc-buy .ob-lbl{color:rgba(255,255,255,.8)}
@media(max-width:767px){.spk .arc{height:780px;margin:0}.spk .arc-model{bottom:250px;height:calc(100% - 330px)}.spk .arc-nav{display:none}.spk .arc-ghost{font-size:44vw}}
@media(prefers-reduced-motion:reduce){.spk .arc-scan{animation:none}.spk .arc-buy{animation:none}}
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
.spk .lk-chips button{flex:1 1 44px;min-width:44px;height:34px;padding:0 10px;border-radius:10px;border:1.5px solid var(--ln);background:var(--bg);color:var(--ink);font:inherit;font-weight:700;font-size:13px;cursor:pointer}
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
.spk .fr-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.05fr);gap:clamp(16px,3vw,36px);align-items:start}
.spk .fr-stage{position:sticky;top:84px;display:grid;gap:10px}
.spk .fr-models{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none}
.spk .fr-models button{flex:none;width:52px;height:68px;border-radius:10px;overflow:hidden;border:2px solid transparent;padding:0;background:var(--card);cursor:pointer;opacity:.6}
.spk .fr-models button.on{border-color:var(--ink);opacity:1}
.spk .fr-models img{width:100%;height:100%;object-fit:cover;display:block}
.spk .fr-canvas{position:relative;aspect-ratio:3/4;border-radius:18px;overflow:hidden;background:var(--card);touch-action:none;user-select:none;-webkit-user-select:none}
.spk .fr-model{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none}
.spk .fr-layer{position:absolute;transform:translate(-50%,-50%);height:auto;cursor:grab;touch-action:none;filter:drop-shadow(0 6px 8px rgba(0,0,0,.25))}
.spk .fr-layer.on{outline:2px dashed color-mix(in srgb,var(--ink) 55%,transparent);outline-offset:3px;border-radius:6px}
.spk .fr-layer:active{cursor:grabbing}
.spk .fr-hint{position:absolute;inset-inline:12px;bottom:12px;background:color-mix(in srgb,var(--bg) 88%,transparent);color:var(--ink);border-radius:12px;padding:8px 12px;font-size:13px;font-weight:700;text-align:center}
.spk .fr-built{background:linear-gradient(180deg,var(--card),color-mix(in srgb,var(--card) 82%,var(--ink)))}
.spk .fr-man{position:absolute;inset:0;width:100%;height:100%;display:block}
.spk .fr-mtab{display:grid;place-items:center;font-size:22px;line-height:1;gap:2px}
.spk .fr-mtab small{font-size:10px;font-weight:700}
.spk .fr-body{display:grid;gap:8px}
.spk .bf{display:grid;gap:10px;padding:14px;border-radius:16px;background:var(--card);border:1px solid var(--ln)}
.spk .bf-t{display:flex;justify-content:space-between;align-items:center;gap:8px}
.spk .bf-rs{border:0;background:none;color:var(--mut);font:inherit;font-size:12px;font-weight:700;cursor:pointer;text-decoration:underline}
.spk .bf-sl{display:grid;gap:4px}
.spk .bf-slh{display:flex;justify-content:space-between;font-size:13px;font-weight:700}
.spk .bf-slr{display:flex;align-items:center;gap:8px}
.spk .bf-slr input,.spk .fr-size input,.spk .sf-st input[type=range]{-webkit-appearance:auto;appearance:auto}
.spk .bf-slr input{flex:1;min-width:0;width:100%;height:26px;padding:0;border:0;background:transparent;accent-color:var(--ink);cursor:pointer}
.spk .bf-slr button{width:30px;height:30px;border-radius:50%;border:1.5px solid var(--ln);background:var(--card);color:var(--ink);font-size:18px;line-height:1;cursor:pointer}
.spk .bf-k{font-size:12.5px;font-weight:700;color:var(--mut)}
.spk .bf-zs{display:flex;flex-wrap:wrap;gap:6px}
.spk .bf-zs button{padding:8px 12px;border-radius:99px;border:1.5px solid var(--ln);background:var(--card);color:var(--ink);font:inherit;font-weight:700;font-size:13px;cursor:pointer}
.spk .bf-zs button.on{background:var(--ink);color:var(--card);border-color:var(--ink)}
.spk .bf-rec{display:grid;gap:6px;padding:12px;border-radius:14px;background:color-mix(in srgb,var(--ink) 6%,var(--card))}
.spk .bf-rec>div:first-child{display:flex;justify-content:space-between;align-items:center;font-weight:800}
.spk .bf-rec b{font-size:26px}
.spk .bf-rf{display:grid;gap:4px;font-size:12.5px;font-weight:700}
.spk .bf-rf i{display:block;height:6px;border-radius:9px;background:var(--ink)}
.spk .bf-rec small{color:var(--mut);font-size:12px}
.spk .bf-ap{padding:11px;border-radius:12px;border:0;background:var(--ink);color:var(--card);font:inherit;font-weight:800;cursor:pointer}
.spk .fr-zone{transition:fill .15s;outline:none}
.spk .fr-zone:focus-visible{stroke:#0E8FC0;stroke-width:3}
.spk .fr-sizes{display:flex;flex-wrap:wrap;gap:6px}
.spk .fr-sizes button{min-width:44px;padding:8px 10px;border-radius:10px;border:1.5px solid var(--ln);background:var(--card);color:var(--ink);font:inherit;font-weight:800;font-size:13px;cursor:pointer}
.spk .fr-sizes button.on{background:var(--ink);color:var(--card);border-color:var(--ink)}
.spk .fr-tones{display:flex;gap:8px}
.spk .fr-tones button{width:26px;height:26px;border-radius:50%;border:2px solid transparent;box-shadow:0 0 0 1px var(--ln);cursor:pointer;padding:0}
.spk .fr-tones button.on{border-color:var(--ink)}
.spk .fr-size{display:grid;gap:4px;font-size:12.5px;font-weight:700;color:var(--mut)}
.spk .fr-size input{width:100%;accent-color:var(--ink)}
.spk .fr-pick{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:8px;margin:10px 0}
.spk .fr-pick button{position:relative;border:1.5px solid var(--ln);background:var(--card);border-radius:12px;padding:6px;cursor:pointer;color:var(--ink);font:inherit;font-size:11.5px;font-weight:700;display:flex;flex-direction:column;gap:4px;align-items:center;line-height:1.25}
.spk .fr-pick button.on{border-color:var(--ink);box-shadow:0 0 0 1px var(--ink)}
.spk .fr-pick img{width:100%;aspect-ratio:1;object-fit:contain;border-radius:8px;background:var(--bg)}
.spk .fr-pick i{position:absolute;top:4px;inset-inline-end:4px;width:18px;height:18px;border-radius:50%;background:var(--ink);color:var(--bg);font-size:11px;display:grid;place-items:center;font-style:normal}
.spk .fr-rm{border:0;background:none;color:var(--mut);cursor:pointer;font-size:16px;align-self:flex-start;padding:4px}
@media(max-width:760px){.spk .fr-grid{grid-template-columns:1fr}.spk .fr-stage{position:static}}

/* ===== قائمة الموبايل (☰) + هيدر الموبايل ===== */
.spk .mm-btn{display:none;width:42px;height:42px;border-radius:12px;border:1.5px solid var(--ln);background:transparent;cursor:pointer;flex:none;padding:0;flex-direction:column;align-items:center;justify-content:center;gap:5px}
.spk .mm-btn i{display:block;width:20px;height:2px;border-radius:2px;background:var(--ink)}
.spk .mm-btn i:nth-child(2){width:14px;align-self:center}
.spk .mm-root{position:fixed;inset:0;z-index:2147483000}
.spk .mm-scrim{position:absolute;inset:0;background:rgba(3,15,24,.55);-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px);animation:mmf .2s ease}
.spk .mm-pn{position:absolute;top:0;bottom:0;inset-inline-start:0;width:min(74vw,320px);background:var(--card);color:var(--ink);display:flex;flex-direction:column;box-shadow:0 0 50px rgba(0,0,0,.35);animation:mms .26s cubic-bezier(.2,.8,.2,1);height:100%;max-height:100dvh}
.spk .mm-top{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid var(--ln);padding-top:max(14px,env(safe-area-inset-top))}
.spk .mm-logo{display:flex;align-items:center;gap:10px;flex:1;min-width:0;font-weight:900;font-size:17px;color:var(--ink)}
.spk .mm-logo img{height:34px;width:auto;max-width:90px;object-fit:contain}
.spk .mm-logo span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.spk .mm-x{width:38px;height:38px;border-radius:50%;border:1.5px solid var(--ln);background:transparent;color:var(--ink);font-size:15px;cursor:pointer;flex:none}
.spk .mm-body{flex:1;overflow-y:auto;overscroll-behavior:contain;padding:14px 14px 8px;-webkit-overflow-scrolling:touch}
.spk .mm-search{display:flex;align-items:center;border:1.5px solid var(--ln);border-radius:14px;background:var(--bg);margin-bottom:12px;overflow:hidden}
.spk .mm-search input{flex:1;min-width:0;border:0;background:transparent;color:var(--ink);font:inherit;font-size:15px;padding:12px 14px;outline:none}
.spk .mm-search button{border:0;background:transparent;font-size:17px;padding:0 14px;cursor:pointer;height:46px}
.spk .mm-links{display:flex;flex-direction:column;gap:2px}
.spk .mm-links a{display:flex;align-items:center;gap:12px;padding:13px 12px;border-radius:12px;color:var(--ink);font-weight:800;font-size:15px}
.spk .mm-links a:active,.spk .mm-links a.on{background:var(--tint,rgba(0,0,0,.05))}
.spk .mm-links a.on{color:var(--c)}
.spk .mm-links.sm a{font-weight:700;font-size:14px;color:var(--mut);padding:10px 12px}
.spk .mm-ic{width:28px;height:28px;border-radius:9px;background:var(--tint,rgba(0,0,0,.05));display:inline-flex;align-items:center;justify-content:center;font-size:15px;flex:none}
.spk .mm-t{flex:1;min-width:0}
.spk .mm-n{background:var(--c);color:var(--onc);border-radius:999px;font-size:11px;min-width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;padding:0 6px}
.spk .mm-h{font-size:11.5px;font-weight:900;letter-spacing:.08em;color:var(--mut);margin:18px 6px 8px}
.spk .mm-cats{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.spk .mm-cats a{display:flex;align-items:center;gap:8px;padding:8px;border:1px solid var(--ln);border-radius:12px;color:var(--ink);font-weight:700;font-size:13px;min-width:0;background:var(--bg)}
.spk .mm-cats a span:last-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.spk .mm-cats img,.spk .mm-ph{width:34px;height:34px;border-radius:9px;object-fit:cover;flex:none;background:var(--tint,var(--ln))}
.spk .mm-ph{display:inline-flex;align-items:center;justify-content:center;font-weight:900;color:var(--c)}
.spk .mm-ft{padding:12px 14px;border-top:1px solid var(--ln);display:grid;gap:8px;padding-bottom:max(12px,env(safe-area-inset-bottom))}
.spk .mm-row{display:flex;gap:8px;align-items:stretch}
.spk .mm-mode,.spk .mm-call{width:48px;flex:none;display:inline-flex;align-items:center;justify-content:center;border:1.5px solid var(--ln);border-radius:12px;background:transparent;color:var(--ink);font-size:18px;cursor:pointer;height:48px;text-decoration:none}
.spk .mm-wa{flex:1;height:48px;padding:0 12px;font-size:14px;border-radius:12px}
.spk .mm-soc{display:flex;gap:6px;flex-wrap:wrap;justify-content:center}
.spk .mm-soc a{border:1px solid var(--ln);border-radius:999px;padding:5px 14px;font-size:12.5px;font-weight:700;color:var(--mut)}
@keyframes mms{from{transform:translateX(100%)}to{transform:none}}
@keyframes mmf{from{opacity:0}to{opacity:1}}
html[dir="ltr"] .spk .mm-pn,[dir="ltr"] .spk .mm-pn{animation-name:mms-l}
@keyframes mms-l{from{transform:translateX(-100%)}to{transform:none}}
@media(prefers-reduced-motion:reduce){.spk .mm-pn,.spk .mm-scrim{animation:none}}
@media(max-width:699px){
.spk .mm-btn{display:inline-flex}
.spk .nav{display:none}
.spk .hd-in,.spk[data-ob] .hd-in{height:60px;flex-wrap:nowrap;padding-top:0;padding-bottom:0;gap:8px}
.spk .hd .logo{min-width:0;flex:1 1 auto}
.spk .hd .logo img{max-height:32px;width:auto;max-width:80px}
.spk .hd .logo span,.spk[data-ob] .logo span{max-width:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:16px}
.spk .hd-sp{display:none}
.spk .cartb{padding:0;width:42px;height:42px;justify-content:center;border-radius:12px;flex:none}
.spk .cartb .cb-t{display:none}
.spk .cartb .cnt{position:absolute;top:-6px;inset-inline-end:-6px;min-width:19px;height:19px;font-size:10.5px}
.spk .mode{width:42px;height:42px;border-radius:12px}
.spk .sbx-ic{width:42px;height:42px;padding:0;border:1.5px solid var(--ln);border-radius:12px}
.spk .hd .mode{display:none}
}

/* ===== منع تمدد الصفحة أفقياً (عنوان/كلمة طويلة بدون مسافات كانت بتوسّع الشاشة على الموبايل) ===== */
.spk{overflow-x:clip}
.spk .pv,.spk .cl,.spk .ob-fgrid,.spk .lk-grid,.spk .fr-grid{min-width:0}
.spk .pv>*,.spk .cl>*,.spk .info,.spk .gal,.spk .wrap,.spk .ob-fgrid>*,.spk .lk-grid>*,.spk .fr-grid>*{min-width:0;max-width:100%}
.spk .pv{grid-template-columns:minmax(0,1fr)}
@media(min-width:900px){.spk .pv{grid-template-columns:minmax(0,1.05fr) minmax(0,1fr)}}
.spk h1,.spk h2,.spk h3,.spk .pc-t,.spk .pc-name,.spk .price,.spk .desc,.spk .info p,.spk .ci,.spk .ob-finfo h2{overflow-wrap:anywhere;word-break:normal}
.spk .chips{min-width:0}

/* ===== توافق الآيفون (Safari/iOS) والأندرويد ===== */
.spk{-webkit-text-size-adjust:100%;text-size-adjust:100%;-webkit-tap-highlight-color:transparent;min-height:100vh;min-height:100svh}
.spk button,.spk a,.spk label,.spk select,.spk summary{touch-action:manipulation}
.spk input,.spk select,.spk textarea,.spk button{-webkit-appearance:none;appearance:none;font-family:inherit}
.spk select{background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path d='M1 1.5l5 5 5-5' fill='none' stroke='%23888' stroke-width='1.8' stroke-linecap='round'/></svg>");background-repeat:no-repeat;background-position:left 12px center;padding-inline-end:12px;padding-inline-start:32px}
.spk input[type=checkbox],.spk input[type=radio]{-webkit-appearance:auto;appearance:auto}
.spk img{-webkit-touch-callout:none}
@supports not (overflow:clip){html,body{overflow-x:hidden}}
/* الآيفون بيعمل زووم تلقائي لما حقل خطه أصغر من 16px — بنثبّته 16px على الموبايل */
@media(max-width:899px){
.spk input,.spk select,.spk textarea,.spk .in,.spk .sbx-in,.spk .mm-search input{font-size:16px!important}
}
.spk .sf-box{max-height:90vh;max-height:90dvh}
.spk .mm-pn{max-height:100vh;max-height:100dvh}
.spk .stk{background:var(--card)}
@supports (background:color-mix(in srgb,red 50%,blue)){.spk .stk{background:color-mix(in srgb,var(--card) 84%,transparent)}}
.spk .chip.act{background:var(--tint,var(--card))}
@supports (background:color-mix(in srgb,red 50%,blue)){.spk .chip.act{background:color-mix(in srgb,var(--c) 12%,var(--card))}}
.spk .offer.act{background:var(--tint,var(--card))}
@supports (background:color-mix(in srgb,red 50%,blue)){.spk .offer.act{background:color-mix(in srgb,var(--c) 16%,var(--card))}}
.spk .ob-x,.spk .ob-cartp{background:var(--card)}
@supports (background:color-mix(in srgb,red 50%,blue)){.spk .ob-x,.spk .ob-cartp{background:color-mix(in srgb,var(--card) 80%,transparent)}}

/* حقول النماذج ما تتعداش عرض الشاشة (input له عرض افتراضي كان بيوسّع الجريد) */
.spk .r2{grid-template-columns:minmax(0,1fr)}
@media(min-width:560px){.spk .r2{grid-template-columns:repeat(2,minmax(0,1fr))}}
.spk .r2>*,.spk .fld,.spk .frm,.spk .card,.spk form{min-width:0}
.spk .in,.spk input,.spk select,.spk textarea{max-width:100%;min-width:0}

/* الحواف: .sec كان بيصفّر الحشو الأفقي بتاع .wrap فالأقسام كانت لازقة في حرف الشاشة */
.spk div.wrap,.spk section.wrap,.spk header .wrap,.spk footer .wrap{padding-left:16px;padding-right:16px}
.spk .ft .pwl,.spk .ft .pw{padding-left:16px;padding-right:16px}
.spk .pwl img{max-width:78%;height:104px;width:auto;object-fit:contain}
@media(min-width:700px){.spk div.wrap,.spk section.wrap{padding-left:24px;padding-right:24px}}

/* ===== قلب كارت المنتج: وجه/ظهر ===== */
.spk .pc-flip{position:relative;cursor:pointer;perspective:1000px;-webkit-tap-highlight-color:transparent;outline:none}
.spk .pc-flip .pc-face{position:absolute;inset:0;display:block;backface-visibility:hidden;-webkit-backface-visibility:hidden;transition:transform .6s cubic-bezier(.4,.2,.2,1);will-change:transform;background:inherit}
.spk .pc-flip .pc-face img{width:100%;height:100%;object-fit:cover;display:block}
.spk[data-ob] .pc-flip .pc-face img{object-fit:contain;padding:6%}
.spk .pc-flip .pc-face:first-of-type{transform:rotateY(0deg)}
.spk .pc-flip .pc-back{transform:rotateY(-180deg)}
.spk .pc-flip.on .pc-face:first-of-type{transform:rotateY(180deg)}
.spk .pc-flip.on .pc-back{transform:rotateY(0deg)}
.spk .pc-flip:focus-visible{box-shadow:0 0 0 3px var(--c)}
.spk .pc-hint{position:absolute;bottom:8px;inset-inline-end:8px;z-index:2;background:rgba(0,0,0,.62);color:#fff;font-style:normal;font-size:11px;font-weight:800;padding:4px 10px;border-radius:999px;pointer-events:none;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px)}
.spk .pc:hover .pc-flip img{transform:none}
@media(prefers-reduced-motion:reduce){.spk .pc-flip .pc-face{transition:none}}

/* ===== ألوان المنتج بصورها ===== */
.spk .chip.sw{display:inline-flex;align-items:center;gap:8px;padding:5px 12px 5px 5px}
.spk .chip.sw img{width:34px;height:34px;border-radius:8px;object-fit:cover;flex:none;border:1px solid var(--ln)}
.spk .sp-tg{display:inline-flex;gap:2px;padding:3px;border-radius:99px;background:rgba(0,0,0,.06);margin-bottom:10px}
.spk .sp-tg button{border:0;background:none;padding:6px 16px;border-radius:99px;font:inherit;font-size:13px;font-weight:700;cursor:pointer;color:inherit;opacity:.7}
.spk .sp-tg button.on{background:#111;color:#fff;opacity:1}
.spk .sp-st{position:relative;width:100%;max-height:78vh;border-radius:14px;overflow:hidden;background:#f1f1f1;cursor:grab;touch-action:pan-y;user-select:none;outline-offset:3px}
.spk .sp-st:active{cursor:grabbing}
.spk .sp-t{position:absolute;inset:0;transform-origin:50% 55%;will-change:transform}
.spk .sp-v,.spk .sp-c{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;pointer-events:none}
.spk .sp-ld{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;font-size:13px;font-weight:700;background:rgba(255,255,255,.7)}
.spk .sp-ld i{width:26px;height:26px;border-radius:50%;border:3px solid rgba(0,0,0,.15);border-top-color:#111;animation:spr .8s linear infinite}
@keyframes spr{to{transform:rotate(360deg)}}
.spk .sp-rd{display:flex;align-items:center;gap:10px;margin-top:10px;font-size:12px;opacity:.8}
.spk .sp-bar{flex:1;height:2px;background:rgba(0,0,0,.15);position:relative;direction:ltr}
.spk .sp-bar b{position:absolute;top:-4px;width:10px;height:10px;border-radius:50%;background:#111;margin-left:-5px}
.spk .sp-lk{display:flex;gap:8px;margin-top:10px}
.spk .sp-lk button{display:flex;align-items:center;gap:8px;padding:4px 12px 4px 4px;border:1px solid rgba(0,0,0,.15);border-radius:99px;background:none;cursor:pointer;font:inherit;font-size:12px;font-weight:700;color:inherit}
.spk .sp-lk button.on{border-color:#111;background:#111;color:#fff}
.spk .sp-sep{width:1px;background:var(--ln);margin:2px 2px}
.spk .sp-lk{flex-wrap:wrap}
.spk .sp-lk .sp-el{padding:8px 14px}
.spk .sp-lk img{width:34px;height:34px;border-radius:50%;object-fit:cover}
@media(prefers-reduced-motion:reduce){.spk .sp-ld i{animation:none}}
.spk .fb-bar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:12px}
.spk .fb-btn{display:inline-flex;gap:8px;align-items:center;font-weight:800}
.spk .fb-n{background:var(--c);color:var(--onc);border-radius:99px;min-width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;font-size:12px;padding:0 5px}
.spk .fb-c{font-size:13px;margin-inline-start:auto}
.spk .fb-empty{text-align:center;display:grid;gap:12px;justify-items:center;padding:30px}
.spk .fb-ov{position:fixed;inset:0;z-index:2000;background:rgba(0,0,0,.5);display:flex;align-items:flex-end;justify-content:center}
.spk .fb-sh{background:var(--card);color:var(--ink);width:min(520px,100%);max-height:88vh;display:flex;flex-direction:column;border-radius:20px 20px 0 0;animation:fbUp .25s ease}
@media(min-width:700px){.spk .fb-ov{align-items:center}.spk .fb-sh{border-radius:20px}}
@keyframes fbUp{from{transform:translateY(30px);opacity:0}}
.spk .fb-hd{display:flex;justify-content:space-between;align-items:center;padding:16px 18px;border-bottom:1px solid var(--ln)}
.spk .fb-cl{border:0;background:none;font-size:18px;cursor:pointer;color:inherit}
.spk .fb-bd{overflow:auto;padding:6px 18px 12px}
.spk .fb-g{border:0;border-bottom:1px solid var(--ln);padding:14px 0;margin:0}
.spk .fb-g legend{font-weight:800;padding:0 0 8px;float:inline-start;width:100%}
.spk .fb-g .chips,.spk .fb-pr,.spk .fb-ck{clear:both}
.spk .fb-pr{display:flex;gap:10px;align-items:center}
.spk .fb-pr .in{min-width:0;flex:1}
.spk .fb-ck{display:flex;gap:10px;align-items:center;padding:6px 0;font-weight:700}
.spk .fb-g .chip:disabled{opacity:.35;cursor:not-allowed;text-decoration:line-through}
.spk .fb-ft{display:flex;gap:10px;padding:14px 18px;border-top:1px solid var(--ln)}
.spk .fb-ft .b{flex:1}
@media(prefers-reduced-motion:reduce){.spk .fb-sh{animation:none}}
.spk .sa{display:grid;gap:8px;margin:12px 0;padding:14px;border:1px dashed var(--ln);border-radius:14px}
.spk .sa.ok{color:#15803d;font-weight:700;border-style:solid}
.spk .sa-r{display:flex;gap:8px}.spk .sa-r .in{flex:1;min-width:0}
/* شبكة المتجر */
.spk .sg-bar{display:flex;justify-content:space-between;align-items:center;padding-block:8px}
.spk .sg-den{display:none;gap:4px}
@media(min-width:700px){.spk .sg-den{display:inline-flex}}
.spk .sg-d{border:1px solid var(--ln);background:var(--card);color:var(--ink);border-radius:8px;padding:2px 8px;font-size:11px;letter-spacing:-2px;cursor:pointer;line-height:1.6}
.spk .sg-d.on{background:var(--ink);color:var(--bg);border-color:var(--ink)}
.spk .sg-g{display:grid;grid-template-columns:repeat(2,1fr);gap:3px;padding-inline:0}
@media(min-width:760px){.spk .sg-g{grid-template-columns:repeat(3,1fr);padding-inline:12px}}
@media(min-width:1180px){.spk .sg-g{grid-template-columns:repeat(4,1fr)}}
@media(min-width:760px){.spk .sg-g.c2{grid-template-columns:repeat(2,1fr)}.spk .sg-g.c3{grid-template-columns:repeat(3,1fr)}.spk .sg-g.c4{grid-template-columns:repeat(4,1fr)}}
.spk .sg-t{position:relative;opacity:0;transform:translateY(16px);transition:opacity .5s ease var(--d,0ms),transform .5s ease var(--d,0ms)}
.spk .sg-t.in{opacity:1;transform:none}
.spk .sg-i{position:relative;aspect-ratio:4/5;overflow:hidden;background:color-mix(in srgb,var(--ink) 6%,var(--bg))}
.spk .sg-l{display:block;width:100%;height:100%}
.spk .sg-l img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:opacity .35s ease,transform .6s ease}
.spk .sg-h{opacity:0}
@media(hover:hover){.spk .sg-t:hover .sg-h{opacity:1}.spk .sg-t:hover .sg-l img:first-child{transform:scale(1.02)}}
.spk .sg-ph{display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:44px;opacity:.3}
.spk .sg-bd{position:absolute;top:10px;inset-inline-start:10px;display:flex;gap:6px;pointer-events:none}
.spk .sg-bd span{background:var(--bg);color:var(--ink);font-size:12px;font-weight:800;padding:3px 10px;border-radius:999px}
.spk .sg-bd .sale{background:#c0262d;color:#fff}.spk .sg-bd .so{background:var(--ink);color:var(--bg)}
.spk .sg-fav{position:absolute;top:8px;inset-inline-end:8px;width:34px;height:34px;border:0;border-radius:50%;background:var(--bg);color:var(--ink);font-size:18px;cursor:pointer;opacity:.95;display:grid;place-items:center}
.spk .sg-fav.on{color:#e11d48}
.spk .sg-plus{position:absolute;bottom:10px;inset-inline-end:10px;width:40px;height:40px;border:0;border-radius:50%;background:var(--bg);color:var(--ink);font-size:24px;line-height:1;cursor:pointer;display:grid;place-items:center;box-shadow:0 2px 10px rgba(0,0,0,.18);transition:transform .2s,background .2s}
.spk .sg-plus:hover{transform:scale(1.08)}.spk .sg-plus.on{background:var(--ink);color:var(--bg)}.spk .sg-plus.ok{background:#15803d;color:#fff}
@media(hover:hover){.spk .sg-plus{opacity:0}.spk .sg-t:hover .sg-plus,.spk .sg-plus:focus-visible,.spk .sg-plus.on{opacity:1}}
.spk .sg-q{position:absolute;inset-inline:0;bottom:0;background:var(--bg);padding:12px 12px 62px;display:grid;gap:8px;animation:sgUp .22s ease;max-height:75%;overflow:auto}
@keyframes sgUp{from{transform:translateY(20px);opacity:0}}
.spk .sg-q b{font-size:13px}
.spk .sg-sz{display:flex;flex-wrap:wrap;gap:6px}
.spk .sg-sz button{min-width:44px;padding:8px 10px;border:1px solid var(--ln);background:var(--card);color:var(--ink);border-radius:8px;font:inherit;font-weight:700;font-size:13px;cursor:pointer}
.spk .sg-sz button:hover{border-color:var(--ink)}
.spk .sg-more{font-weight:800;color:var(--ink);text-decoration:underline}
.spk .sg-b{display:grid;gap:2px;padding:10px 10px 18px;color:var(--ink)}
.spk .sg-n{font-size:14px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.spk .sg-c{font-size:12px;color:var(--mut)}
.spk .sg-p{font-size:14px;font-weight:700}.spk .sg-p s{margin-inline-start:8px;color:var(--mut);font-weight:500}
.spk .sg-mr{display:flex;justify-content:center;padding:18px}
@media(prefers-reduced-motion:reduce){.spk .sg-t{opacity:1;transform:none;transition:none}.spk .sg-q{animation:none}.spk .sg-l img{transition:none}}
.spk .gal-sw{animation:swIn .35s ease}
@keyframes swIn{from{opacity:.2;transform:scale(.97)}to{opacity:1;transform:none}}
.spk .pc-sws{display:flex;gap:6px;padding:8px 12px 0;flex-wrap:wrap}
.spk .pc-sw{width:26px;height:26px;border-radius:50%;border:2px solid var(--ln);padding:0;overflow:hidden;background:var(--card);cursor:pointer;flex:none}
.spk .pc-sw img{width:100%;height:100%;object-fit:cover;display:block}
.spk .pc-sw.on{border-color:var(--c);box-shadow:0 0 0 2px var(--tint,rgba(0,0,0,.08))}
@media(prefers-reduced-motion:reduce){.spk .gal-sw{animation:none}}

.spk .gal-main.pc-flip{position:relative}
.spk .gal-main.pc-flip:hover img{transform:none}
.spk .ob-fpic.pc-flip{position:relative}
.spk .ob-fpic .pc-face img{width:100%;height:100%;object-fit:contain}
/* شعار التاجر في منتصف الهيدر على الشاشات الكبيرة */
@media(min-width:1180px){
.spk .hd-in{position:relative;height:72px}
.spk .hd .logo{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);flex:none;z-index:1;max-width:260px}
.spk .hd .logo img{max-height:52px;max-width:200px;width:auto;height:auto;object-fit:contain;border-radius:10px}
.spk .hd .logo span{font-size:18px}
}
/* شريط التنقل السفلي (موبايل) */
.spk .bn,.spk .bn-sh{display:none}
@media(max-width:699px){
.spk{padding-bottom:var(--spk-bar-h,0px)}
.spk .bn{display:flex;position:fixed;inset-inline:0;bottom:0;z-index:42;background:var(--card);border-top:1px solid var(--ln);padding:6px 4px calc(6px + env(safe-area-inset-bottom,0px))}
@supports (background:color-mix(in srgb,red 50%,blue)){.spk .bn{background:color-mix(in srgb,var(--card) 97%,transparent)}}
.spk .bn-i{flex:1;min-width:0;min-height:48px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;position:relative;color:var(--mut);font:inherit;font-size:11px;font-weight:700;background:none;border:0;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent;text-decoration:none}
.spk .bn-i svg{width:24px;height:24px;stroke:currentColor;fill:none;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;transition:transform .18s}
.spk .bn-i:active svg{transform:scale(.88)}
.spk .bn-i.on{color:var(--c)}
.spk .bn-i.on svg{fill:color-mix(in srgb,var(--c) 14%,transparent)}
.spk .bn-i.on::before{content:'';position:absolute;top:-7px;width:26px;height:3px;border-radius:0 0 4px 4px;background:var(--c)}
.spk .bn-b{position:absolute;top:3px;inset-inline-start:calc(50% + 4px);min-width:17px;height:17px;padding:0 4px;border-radius:9px;background:var(--c);color:var(--onc,#fff);font-size:10px;font-style:normal;font-weight:800;display:flex;align-items:center;justify-content:center}
.spk .stk{bottom:var(--spk-bar-h,0px);padding-bottom:10px}
.spk .waf{bottom:calc(var(--spk-bar-h,0px) + 18px)}
.spk .pop{bottom:calc(var(--spk-bar-h,0px) + 84px)}
.spk .bn-sh{display:block;position:fixed;inset:0;z-index:80}
.spk .bn-sc{position:absolute;inset:0;background:rgba(0,0,0,.5);animation:spkfade .2s}
.spk .bn-pn{position:absolute;inset-inline:0;bottom:0;max-height:78vh;max-height:78dvh;overflow:auto;background:var(--card);color:var(--ink);border-radius:22px 22px 0 0;padding:8px 16px calc(18px + env(safe-area-inset-bottom,0px));animation:bnup .26s ease-out}
.spk .bn-gr{width:42px;height:4px;border-radius:4px;background:var(--ln);margin:2px auto 10px}
.spk .bn-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;font-size:17px}
.spk .bn-hd button{border:0;background:var(--bg);color:var(--ink);width:36px;height:36px;border-radius:50%;font-size:15px;cursor:pointer}
.spk .bn-cg{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.spk .bn-ct{display:flex;align-items:center;justify-content:center;text-align:center;min-height:56px;padding:10px;border:1px solid var(--ln);border-radius:14px;background:var(--bg);color:var(--ink);font-weight:700;font-size:14px;overflow-wrap:anywhere;text-decoration:none}
.spk .bn-ct.all{grid-column:1/-1;background:var(--c);border-color:var(--c);color:var(--onc,#fff)}
.spk .bn-lk{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
.spk .bn-lk a{flex:1 1 auto;text-align:center;padding:12px 14px;border-radius:12px;border:1px dashed var(--ln);color:var(--ink);font-weight:700;font-size:13.5px;text-decoration:none}
}
@keyframes bnup{from{transform:translateY(100%)}to{transform:none}}
@media(prefers-reduced-motion:reduce){.spk .bn-pn{animation:none}.spk .bn-i svg{transition:none}}
/* تلميع الموبايل: أهداف لمس مريحة */
@media(max-width:699px){
.spk button,.spk a,.spk .chip,.spk .b{touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.spk .b{min-height:46px}
.spk .chip{min-height:44px;display:inline-flex;align-items:center}
.spk .qty button{width:46px;height:46px}
}
.spk .chip.off,.spk .chip:disabled{opacity:.45;text-decoration:line-through;cursor:not-allowed}
/* قلب منتج المدار: بالضغط على زرار «الخلف» بس (مفيش قلب بالتمرير) */
.spk .ob-fl{perspective:900px}
.spk .ob-3d{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;transform-style:preserve-3d;transition:transform .6s cubic-bezier(.4,.2,.2,1)}
.spk .ob-it.flp .ob-3d{transform:rotateY(180deg)}
.spk .ob-3d .ob-fr,.spk .ob-3d .ob-bk{backface-visibility:hidden;-webkit-backface-visibility:hidden}
.spk .ob-3d .ob-bk{position:absolute;inset:0;margin:auto;max-width:100%;max-height:100%;object-fit:contain;transform:rotateY(180deg);pointer-events:none}
.spk .ob-flipbtn{position:absolute;left:0;top:0;z-index:300;display:inline-flex;align-items:center;gap:6px;height:36px;padding:0 12px;border-radius:999px;border:1px solid color-mix(in srgb,var(--ink) 14%,transparent);background:var(--card,#fff);color:var(--ink);font:inherit;font-size:12.5px;font-weight:800;cursor:pointer;box-shadow:0 4px 14px rgba(15,23,42,.12);white-space:nowrap;transition:background .2s,color .2s}
.spk .ob-flipbtn:hover,.spk .ob-flipbtn.on{background:var(--c);color:#fff;border-color:var(--c)}
.spk .ob-flipbtn:focus-visible{outline:2px solid var(--c);outline-offset:3px}
@media(prefers-reduced-motion:reduce){.spk .ob-3d{transition:none}}
`;
