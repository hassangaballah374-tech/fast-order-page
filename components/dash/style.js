/* ستايل لوحة تاجر سبايك (هوية سبايك: تركواز + عاجي دافئ). الكلاسات هنا تغطي كل مكونات اللوحة والشاشات. */
export const DASH_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
.app{--b:#0a7f86;--b2:#06494e;--or:#e08f4f;--bg:#efece0;--s:#fcfbf7;--s2:#f3f0e4;--ln:#e2ddca;--ink:#1f2f33;--mut:#6f7f82;--ok:#2f855a;--bad:#c53030;--warn:#b7791f;
  display:flex;min-height:100vh;background:radial-gradient(1000px 420px at 100% -10%,rgba(10,127,134,.10),transparent 60%),radial-gradient(800px 380px at 0% 110%,rgba(224,143,79,.12),transparent 60%),var(--bg);
  color:var(--ink);font-family:'Cairo',sans-serif;font-size:14px;line-height:1.55}
.app *{box-sizing:border-box}
.app button{font-family:inherit}
.num{font-family:Inter,'Cairo',sans-serif;font-variant-numeric:tabular-nums}
.app h1,.app h2,.app h3{margin:0}
.app a{color:var(--b)}

/* ---------- الشريط الجانبي ---------- */
.side{width:268px;flex:none;background:var(--s);border-inline-start:1px solid var(--ln);position:sticky;top:0;height:100vh;display:flex;flex-direction:column;z-index:40}
.sidehd{padding:16px 14px 8px;display:flex;gap:10px;align-items:center}
.lg{width:40px;height:40px;border-radius:12px;background:var(--b);color:#fff;display:grid;place-items:center;font-weight:800;font-size:18px;overflow:hidden;flex:none}
.spkbrand{display:flex;justify-content:center;background:transparent;padding:10px 12px 4px;margin:0}
.spkbrand img{height:44px;width:auto;max-width:100%;object-fit:contain;display:block}
.lg img{width:100%;height:100%;object-fit:cover}
.sidehd b{display:block;font-size:15px;line-height:1.5;padding-top:2px}
.sidehd small{display:block;color:var(--mut);font-size:11.5px;line-height:1.5;margin-top:2px}
.nvs{flex:1;overflow:auto;padding:6px 10px 14px;display:flex;flex-direction:column;gap:2px;scrollbar-width:thin}
.nv{display:flex;align-items:center;gap:10px;width:100%;min-height:42px;padding:0 12px;border:0;border-radius:12px;background:none;color:var(--ink);font:600 13.5px 'Cairo',sans-serif;cursor:pointer;text-align:start;text-decoration:none}
.nv:hover{background:var(--s2)}
.nv.act{background:var(--b);color:#fff}
.nv .ic{width:22px;text-align:center;flex:none;font-size:16px}
.nv .tx{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.nv .chev{font-size:11px;opacity:.55;transition:transform .08s}
.nv.open .chev{transform:rotate(180deg)}
.nvsub{animation:nvIn .1s ease-out;display:flex;flex-direction:column;gap:1px;margin:2px 0 6px;margin-inline-start:22px;padding-inline-start:10px;border-inline-start:2px solid var(--ln)}
.nvsub .nv{min-height:36px;font-weight:600;font-size:13px;color:#3c4f53}
.nvsub .nv.act{color:#fff}
.nvh{margin:14px 12px 4px;color:var(--mut);font-size:11.5px;font-weight:800}
.bn{font-style:normal;font-size:10.5px;font-weight:800;border-radius:99px;padding:1px 8px;background:#d6f0e0;color:#1e6b43}
.bn.sp{background:#fde8d4;color:#a8581c}
.nv.act .bn{background:rgba(255,255,255,.25);color:#fff}
.spk{color:var(--or);font-size:11px;margin-inline-start:2px}
.nv.act .spk{color:#fff}
.sidefoot{padding:10px 14px 14px;border-top:1px solid var(--ln);display:grid;gap:8px}
.scrim{display:none}

/* ---------- المحتوى ---------- */
.main{flex:1;min-width:0}
.top{position:sticky;top:0;z-index:30;display:flex;gap:10px;align-items:center;padding:11px 26px;background:color-mix(in srgb,var(--s) 90%,transparent);backdrop-filter:blur(12px);border-bottom:1px solid var(--ln)}
.srch kbd{flex:none;font-size:11px;background:var(--s2);padding:2px 7px;border-radius:6px;font-family:Inter,sans-serif}
.srch kbd{float:left;font-size:11px;background:var(--s2);padding:2px 7px;border-radius:6px;font-family:Inter,sans-serif}
.menubtn{display:none}
.pg{padding:24px 26px 70px;max-width:1240px}
.phd{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:16px}
.phd h1{font-size:23px;font-weight:800}
.phd h1 small,.app h3 small{font-size:12.5px;color:var(--mut);font-weight:600;margin-inline-start:8px}
.phr{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.app h3{font-size:15.5px;font-weight:800;margin-bottom:12px}
.dsc{margin:-6px 0 14px;font-size:13px}
.card{background:var(--s);border:1px solid var(--ln);border-radius:20px;padding:20px;box-shadow:0 10px 30px -16px rgba(6,73,78,.22)}
.card+.card{margin-top:16px}
.grid4,.grid3,.grid2,.two{display:grid;gap:14px;margin-bottom:16px;align-items:start}
.grid4{grid-template-columns:repeat(4,1fr)}
.grid3{grid-template-columns:repeat(3,1fr)}
.grid2,.two{grid-template-columns:1fr 1fr}
.grid4>.card+.card,.grid3>.card+.card,.grid2>.card+.card,.two>.card+.card{margin-top:0}
.two>.card{margin-top:0}
.kpi small{color:var(--mut);font-weight:600}
.kpi b{display:block;font-size:25px;font-weight:800;margin:4px 0 4px;font-family:Inter,'Cairo',sans-serif}
.kpi .spark{width:100%;height:34px}
.kpi .hint{display:block}

/* ---------- أزرار وحقول ---------- */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:38px;padding:0 14px;border-radius:12px;border:1px solid var(--ln);background:var(--s);color:var(--ink);font:700 13px 'Cairo',sans-serif;cursor:pointer;text-decoration:none;white-space:nowrap}
.btn:hover{background:var(--s2)}
.btn.p{background:var(--b);border-color:var(--b);color:#fff}
.btn.p:hover{filter:brightness(.92)}
.btn.sm{min-height:32px;padding:0 11px;font-size:12px;border-radius:10px}
.btn.dng{color:var(--bad);border-color:color-mix(in srgb,var(--bad) 35%,var(--ln))}
.btn.dng:hover{background:color-mix(in srgb,var(--bad) 8%,var(--s))}
.btn.wa{background:#25d366;border-color:#25d366;color:#fff}
.btn:disabled{opacity:.5;cursor:not-allowed}
.in{width:100%;min-height:42px;padding:0 13px;border:1px solid var(--ln);border-radius:12px;background:var(--s);color:var(--ink);font:500 14px 'Cairo',sans-serif}
.in.sm{min-height:34px;font-size:12.5px;font-weight:700}
.in:focus{outline:0;border-color:var(--b);box-shadow:0 0 0 4px color-mix(in srgb,var(--b) 16%,transparent)}
.in.ta{padding:10px 13px;line-height:1.7;resize:vertical;min-height:90px}
select.in{padding-inline-end:8px}
.fld{display:block;margin-bottom:12px}
.fld>span{display:block;margin-bottom:5px;color:var(--mut);font-weight:700;font-size:12.5px}
.hint{display:block;margin-top:4px;color:var(--mut);font-size:11.5px;font-style:normal}
.fgrid{display:grid;grid-template-columns:1fr 1fr;gap:0 14px}
.fgrid .fld.full{grid-column:1/-1}
.clr{width:64px;height:42px;border:1px solid var(--ln);border-radius:12px;background:none;cursor:pointer;padding:3px}
.row{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:12px}
.row .fld{flex:1;min-width:110px;margin-bottom:0}
.tgrow{display:flex;align-items:center;gap:10px}
.tog{width:44px;height:26px;border-radius:99px;border:0;background:#cfd6d3;position:relative;cursor:pointer;flex:none;transition:.2s;padding:0}
.tog i{position:absolute;top:3px;inset-inline-start:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:.2s}
.tog.on{background:var(--b)}
.tog.on i{inset-inline-start:21px}
.tog:disabled{opacity:.5;cursor:not-allowed}
.chip{border:1px solid var(--ln);background:var(--s);border-radius:99px;padding:6px 14px;font:700 12.5px 'Cairo',sans-serif;cursor:pointer;color:var(--ink)}
.chip.act{background:var(--ink);color:var(--bg);border-color:var(--ink)}
.chip em{font-style:normal;opacity:.6;margin-inline-start:4px}
.chips{display:flex;gap:8px;flex-wrap:wrap}
.tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px}
.tb{border:1px solid var(--ln);background:var(--s);border-radius:99px;padding:7px 15px;font:700 13px 'Cairo',sans-serif;cursor:pointer;color:var(--ink)}
.tb.act{background:var(--b);border-color:var(--b);color:#fff}
.tb em{font-style:normal;opacity:.7;margin-inline-start:6px;font-size:12px}
.imgin{display:flex;gap:8px;align-items:center}
.thumb{width:42px;height:42px;border-radius:10px;object-fit:cover;flex:none;border:1px solid var(--ln);background:var(--s2)}
.thumb.ph{display:grid;place-items:center;font-size:18px}
.gal{display:flex;gap:8px;flex-wrap:wrap}
.gal .gi{position:relative;width:78px;height:78px;border-radius:12px;overflow:hidden;border:1px solid var(--ln)}
.gal .gi img{width:100%;height:100%;object-fit:cover}
.gal .gi button{position:absolute;top:3px;inset-inline-start:3px;width:22px;height:22px;border-radius:50%;border:0;background:rgba(0,0,0,.6);color:#fff;cursor:pointer;font-size:12px}
.gal .gi.first::after{content:'الرئيسية';position:absolute;bottom:0;inset-inline:0;background:rgba(10,127,134,.9);color:#fff;font-size:10px;text-align:center;font-weight:700}
.gal .add{width:78px;height:78px;border-radius:12px;border:2px dashed var(--ln);background:var(--s2);display:grid;place-items:center;cursor:pointer;font-size:22px;color:var(--mut)}

/* ---------- جداول ---------- */
.tw{padding:6px;overflow-x:auto}
.tbl{width:100%;border-collapse:separate;border-spacing:0;min-width:640px}
.tbl th{background:var(--s2);color:var(--mut);font-size:12px;padding:11px 12px;text-align:start;white-space:nowrap}
.tbl th:first-child{border-start-start-radius:12px;border-end-start-radius:12px}
.tbl th:last-child{border-start-end-radius:12px;border-end-end-radius:12px}
.tbl td{padding:12px;border-bottom:1px solid var(--ln);vertical-align:middle}
.tbl tr:last-child td{border:0}
.tbl td small{display:block;color:var(--mut)}
.tbl tr.sel td{background:color-mix(in srgb,var(--b) 6%,var(--s))}
.acts{display:flex;gap:6px;justify-content:flex-end;flex-wrap:wrap}
.bdg{display:inline-block;padding:2px 10px;border-radius:99px;font-size:12px;font-weight:800;white-space:nowrap}
.bulk{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:10px 14px;margin-bottom:12px;background:color-mix(in srgb,var(--b) 10%,var(--s));border:1px solid color-mix(in srgb,var(--b) 30%,transparent);border-radius:14px}
.pager{display:flex;gap:10px;align-items:center;justify-content:center;padding:14px}
.tl{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:14px}
.tl .in{max-width:240px}
.pls{display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid var(--ln)}
.pls:last-child{border:0}
.pls>p{flex:1;margin:0}
.pls small{display:block;color:var(--mut)}
.mut{color:var(--mut)}
.warn{color:var(--bad);font-weight:800;font-size:12px}
.ok{color:var(--ok)}
.c{text-align:center;padding:24px}
.errbox{background:#fdecea;border-color:#f3b8b3;color:#8a1f17;margin-bottom:14px}
.empty{text-align:center;padding:40px 16px;color:var(--mut)}
.empty span{font-size:38px;display:block;margin-bottom:6px}
.empty b{display:block;color:var(--ink);font-size:15px}
.empty p{margin:6px 0 0}
.spin{width:26px;height:26px;border:3px solid var(--ln);border-top-color:var(--b);border-radius:50%;animation:sp 0.8s linear infinite;margin:auto}
@keyframes sp{to{transform:rotate(360deg)}}
.bar{height:8px;border-radius:9px;background:var(--s2);overflow:hidden}
.bar i{display:block;height:100%;background:var(--b);border-radius:9px;transition:width .4s}
.pv{border:1px dashed var(--ln);border-radius:16px;padding:14px;display:grid;gap:8px;background:var(--s2)}
.stk{display:inline-flex;align-items:center;gap:6px}
.stk button{width:28px;height:28px;border-radius:8px;border:1px solid var(--ln);background:var(--s2);cursor:pointer;font-weight:800}
.stk input{width:70px;text-align:center}
.lnk{display:flex;gap:8px;align-items:center;background:var(--s2);border:1px solid var(--ln);border-radius:12px;padding:8px 12px;direction:ltr;overflow:hidden}
.lnk code{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12.5px}
.steps{counter-reset:s;display:grid;gap:10px;padding:0;margin:0;list-style:none}
.steps li{counter-increment:s;display:flex;gap:10px;align-items:flex-start}
.steps li::before{content:counter(s);flex:none;width:24px;height:24px;border-radius:50%;background:var(--b);color:#fff;font-weight:800;font-size:12px;display:grid;place-items:center;margin-top:1px}
.appc{display:flex;flex-direction:column;gap:10px}
.appc .top2{display:flex;gap:12px;align-items:center}
.appc .ai{width:46px;height:46px;border-radius:14px;background:var(--s2);display:grid;place-items:center;font-size:24px;flex:none}
.appc p{margin:0;color:var(--mut);font-size:13px}
.sw{width:42px;height:42px;border-radius:50%;border:3px solid var(--s);box-shadow:0 0 0 1px var(--ln);cursor:pointer}
.sw.act{box-shadow:0 0 0 3px var(--ink)}
.thm{border:2px solid var(--ln);border-radius:18px;padding:12px;cursor:pointer;background:var(--s);text-align:start}
.thm.act{border-color:var(--b);box-shadow:0 0 0 3px color-mix(in srgb,var(--b) 18%,transparent)}
.thm .pvw{height:92px;border-radius:12px;padding:10px;display:flex;flex-direction:column;gap:6px;justify-content:space-between;margin-bottom:8px}
.thm .pvw i{display:block;height:8px;border-radius:5px}
.sec{display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--ln);border-radius:14px;background:var(--s);margin-bottom:8px}
.sec.act{border-color:var(--b);background:color-mix(in srgb,var(--b) 6%,var(--s))}
.sec b{flex:1;min-width:0}

/* ---------- نوافذ ---------- */
.ov{position:fixed;inset:0;z-index:60;background:rgba(5,35,38,.55);backdrop-filter:blur(6px);display:grid;place-items:center;padding:16px}
.ov.topv{align-items:start;padding-top:12vh}
.mod{width:100%;max-width:520px;max-height:90vh;display:flex;flex-direction:column;background:var(--s);border:1px solid var(--ln);border-radius:24px;box-shadow:0 30px 80px -20px rgba(3,30,33,.55);animation:pop .1s ease-out}
.mod.wide{max-width:860px}
.mh{display:flex;justify-content:space-between;align-items:center;padding:18px 22px 6px}
.mh b{font-size:16px}
.mb{padding:10px 22px 14px;overflow:auto;flex:1}
.mf{display:flex;gap:8px;justify-content:flex-end;padding:12px 22px 18px;border-top:1px solid var(--ln)}
.toast{position:fixed;bottom:22px;left:50%;transform:translateX(-50%);background:var(--ink);color:var(--bg);padding:11px 20px;border-radius:14px;font-weight:700;z-index:90;max-width:90vw;text-align:center}
@keyframes nvIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
@keyframes pop{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}

/* ---------- الرسوم ---------- */
.hbl{display:flex;justify-content:space-between;gap:10px;font-size:12.5px;margin-bottom:5px;font-weight:600}
.hbt{height:9px;border-radius:9px;background:var(--s2);overflow:hidden}
.hbt.big{height:14px}
.hbt i{display:block;height:100%;border-radius:9px;transition:width .5s}
.dnt{display:flex;gap:18px;align-items:center;flex-wrap:wrap}
.dntc{position:relative;width:160px;height:160px;flex:none}
.dnti{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.dnti b{font-size:24px}
.dnti small{color:var(--mut)}
.dntl{display:flex;justify-content:space-between;gap:10px;font-size:12.5px}
.dntl span{display:flex;gap:7px;align-items:center;font-weight:600}
.dntl i{width:10px;height:10px;border-radius:4px;display:inline-block}

@media(max-width:1000px){
  .grid4{grid-template-columns:1fr 1fr}.grid3{grid-template-columns:1fr 1fr}
}
@media(max-width:900px){
  .side{position:fixed;top:0;bottom:0;inset-inline-start:0;transform:translateX(100%);transition:transform .12s;box-shadow:0 0 40px rgba(0,0,0,.25)}
  [dir=ltr] .side{transform:translateX(-100%)}
  .side.open{transform:none!important}
  .scrim.on{display:block;position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:35}
  .menubtn{display:inline-flex}
  .srch{display:none}
  .two,.grid2,.grid3,.fgrid{grid-template-columns:1fr}
  .pg,.top{padding-inline:14px}
}
@media(max-width:560px){.grid4{grid-template-columns:1fr 1fr}.kpi b{font-size:20px}}
@media(prefers-reduced-motion:reduce){.app *{animation:none!important;transition:none!important}}
@media print{.side,.top,.phr,.bulk,.acts,.toast{display:none!important}.app{display:block;background:#fff}.pg{padding:0}}
@media(max-width:900px){.grid3.kpis,.grid4.kpis{grid-template-columns:1fr 1fr;gap:10px}}
@media(max-width:560px){.kpis .kpi{padding:12px 12px 10px;border-radius:16px}.kpis .kpi small{display:block;font-size:11.5px;line-height:1.3}.kpis .kpi b{font-size:18px;margin:3px 0}.kpis .kpi .hint{font-size:10.5px;line-height:1.3}.kpis .spark{height:26px}}
@media(max-width:560px){
.spk .wrap{padding:0 12px}
.spk .sec{padding:20px 0}
.spk .sh h2{font-size:19px}
.spk .hd-in{height:56px;gap:8px}
.spk .hero-in{padding:34px 18px}
.spk .hero p{font-size:14px}
.spk .trust{grid-template-columns:1fr 1fr;gap:8px}
.spk .ti{padding:10px;gap:8px}
.spk .ti i{font-size:20px}
.spk .ti b{font-size:12.5px}
.spk .ti small{font-size:11px}
.spk .cats{grid-template-columns:repeat(3,1fr);gap:8px}
.spk .cat{padding:8px;font-size:12px}
.spk .grid{gap:10px}
.spk .pc-b{padding:9px 10px 11px}
.spk .pc-t{font-size:13px}
.spk .pc-p b{font-size:15px}
.spk .price b{font-size:26px}
}
/* ===== منع التمرير الأفقي على الموبايل ===== */
html,body{max-width:100%;overflow-x:hidden}
.app{max-width:100vw;overflow-x:clip}
.main,.pg{max-width:100%;min-width:0}
.grid4>*,.grid3>*,.grid2>*,.two>*,.fgrid>*{min-width:0}
.pg img,.pg video{max-width:100%;height:auto}
@media(max-width:900px){
  .top{flex-wrap:wrap;gap:6px;padding-block:8px}
  .top .btn{min-height:34px;padding:0 10px;font-size:12px;flex:0 1 auto}
  .top .btn.dng{margin-inline-start:auto}
}
@media(max-width:560px){
  .tdp{padding:16px;border-radius:20px}
  .tdp-big{font-size:26px}
  .tdp-dl{display:inline-block;margin-top:6px;margin-inline-start:0}
  .card{padding:14px}
}
`;
