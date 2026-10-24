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
`;
