/* الوضع الداكن للوحة التاجر: يعيد تعريف متغيرات الألوان فقط عند وجود الكلاس dk */
export const DARK_CSS = `
.app.dk{--b:#2bb3bb;--b2:#7fdde2;--or:#f0a468;--bg:#0b1315;--s:#122024;--s2:#18292e;--ln:#26393f;--ink:#e6f0f1;--mut:#8fa6aa;--ok:#48bb78;--bad:#fc8181;--warn:#ecc94b;
  background:radial-gradient(1000px 420px at 100% -10%,rgba(43,179,187,.10),transparent 60%),radial-gradient(800px 380px at 0% 110%,rgba(240,164,104,.08),transparent 60%),var(--bg)}
.app.dk .card{box-shadow:0 10px 30px -16px rgba(0,0,0,.6)}
.app.dk .nv.act,.app.dk .btn.p{color:#04272a}
.app.dk .nv.act .bn{background:rgba(0,0,0,.25);color:#04272a}
.app.dk .errbox{background:#3a1a1a;border-color:#7a2a2a;color:#feb2b2}
.app.dk .bn{background:#1e4d36;color:#9ae6b4}
.app.dk .bn.sp{background:#4a2f17;color:#f6ad55}
.app.dk .nvsub .nv{color:#b6cacd}
.app.dk input,.app.dk select,.app.dk textarea{color-scheme:dark}
.app.dk .card[style*="fff8e8"]{background:#3a2f14!important;border-color:#6b5520!important}
`;
