/* الوضع الداكن للوحة التاجر: يعيد تعريف متغيرات الألوان فقط عند وجود الكلاس dk — بنفس درجات الوضع الداكن في لوحة الأدمن */
export const DARK_CSS = `
.app.dk{--b:#2bb3bb;--b2:#7fdde2;--or:#f0a468;--bg:#0B132B;--s:#0E1E38;--s2:#132645;--ln:#1e293b;--ink:#f1f5f9;--mut:#94a3b8;--ok:#48bb78;--bad:#fc8181;--warn:#ecc94b;
  background:var(--bg)}
.app.dk .card{box-shadow:none}
.app.dk .nv.act,.app.dk .btn.p{color:#04272a}
.app.dk .nv.act .bn{background:rgba(0,0,0,.25);color:#04272a}
.app.dk .errbox{background:#3a1a1a;border-color:#7a2a2a;color:#feb2b2}
.app.dk .bn{background:#1e4d36;color:#9ae6b4}
.app.dk .bn.sp{background:#4a2f17;color:#f6ad55}
.app.dk .nvsub .nv{color:#cbd5e1}
.app.dk input,.app.dk select,.app.dk textarea{color-scheme:dark}
.app.dk .card[style*="fff8e8"]{background:#3a2f14!important;border-color:#6b5520!important;color:#f6e3b0!important}
.app.dk .card[style*="fff8e8"] b{color:#fff!important}
.app.dk img{filter:none}
`;
