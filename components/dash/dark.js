/* الوضع الداكن للوحة التاجر: يعيد تعريف متغيرات الألوان فقط عند وجود الكلاس dk */
export const DARK_CSS = `
.app.dk{--b:#5BB6E0;--b2:#8FD0F0;--or:#f0a468;--bg:#061C2A;--s:#0A2A3E;--s2:#0F3650;--ln:#16435D;--ink:#E8F1F8;--mut:#8FA9BC;--okbg:#123A2C;--okfg:#86E0B0;--cream:#0F3650;--ok:#5FD39A;--bad:#fc8181;--warn:#ecc94b;
  background:radial-gradient(1000px 420px at 100% -10%,rgba(91,182,224,.10),transparent 60%),radial-gradient(800px 380px at 0% 110%,rgba(46,134,181,.10),transparent 60%),var(--bg)}
.app.dk,.app.dk *{color-scheme:dark}
.app.dk .card{box-shadow:0 10px 30px -16px rgba(0,0,0,.6)}
.app.dk .nv.act,.app.dk .btn.p{color:#04202F}
.app.dk .nv.act .bn{background:rgba(0,0,0,.25);color:#04202F} 
.app.dk .errbox{background:#3a1a1a;border-color:#7a2a2a;color:#feb2b2}
.app.dk .bn{background:var(--cream);color:var(--b2)}
.app.dk .bn.sp{background:#4a2f17;color:#f6ad55}
.app.dk .nvsub .nv{color:#9FB8CC}
.app.dk input,.app.dk select,.app.dk textarea{color-scheme:dark}
.app.dk .card[style*="fff8e8"]{background:#3a2f14!important;border-color:#6b5520!important}
`;
