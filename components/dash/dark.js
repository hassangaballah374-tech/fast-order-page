/* الوضع الداكن للوحة التاجر: يعيد تعريف متغيرات الألوان فقط عند وجود الكلاس dk */
export const DARK_CSS = `
.app.dk{--b:#9CBF4A;--b2:#C3DE82;--or:#f0a468;--bg:#151a10;--s:#1e2517;--s2:#283220;--ln:#3b4730;--ink:#f3f5ea;--mut:#b2bba0;--okbg:#2a3d1b;--okfg:#c3e08a;--cream:#262b1a;--ok:#8fd16a;--bad:#fc8181;--warn:#ecc94b;
  background:radial-gradient(1000px 420px at 100% -10%,rgba(156,191,74,.10),transparent 60%),radial-gradient(800px 380px at 0% 110%,rgba(240,164,104,.08),transparent 60%),var(--bg)}
.app.dk,.app.dk *{color-scheme:dark}
.app.dk .card{box-shadow:0 10px 30px -16px rgba(0,0,0,.6)}
.app.dk .nv.act,.app.dk .btn.p{color:#1c2a08}
.app.dk .nv.act .bn{background:rgba(0,0,0,.25);color:#1c2a08}
.app.dk .errbox{background:#3a1a1a;border-color:#7a2a2a;color:#feb2b2}
.app.dk .bn{background:var(--okbg);color:var(--okfg)}
.app.dk .bn.sp{background:#4a2f17;color:#f6ad55}
.app.dk .nvsub .nv{color:#b6cacd}
.app.dk input,.app.dk select,.app.dk textarea{color-scheme:dark}
.app.dk .card[style*="fff8e8"]{background:#3a2f14!important;border-color:#6b5520!important}
`;
