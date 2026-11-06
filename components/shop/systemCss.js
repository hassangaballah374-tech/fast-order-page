/* نظام تصميم سبايك الموحّد للمتجر كله (نفس لغة عرض المدار): عناوين عريضة، حواف رفيعة، أزرار كبسولة،
   مربعات اختيار بسيطة، روابط بخط سفلي وأسهم. الألوان والخط من ثيم التاجر، والشكل ثابت في كل الصفحات.
   كل القواعد تحت [data-ob] ويُحقن بعد ستايل المتجر الأساسي. */
export const SYS_CSS = `
.spk[data-ob]{--bx:12px;--ln2:color-mix(in srgb,var(--ink) 14%,transparent);--ln3:color-mix(in srgb,var(--ink) 9%,transparent)}
.spk[data-ob] h1,.spk[data-ob] h2,.spk[data-ob] h3{font-weight:900;letter-spacing:0;line-height:1.12}
.spk[data-ob] .sh{margin-bottom:22px;display:flex;align-items:baseline;justify-content:space-between;gap:6px 14px;flex-wrap:wrap}
.spk[data-ob] .sh h2{font-size:clamp(24px,3.6vw,40px);line-height:1.1}
.spk[data-ob] .sh p{font-size:12px;letter-spacing:.06em;color:var(--mut);font-weight:700}
.spk[data-ob] .sec{padding-block:34px}

/* الشريط العلوي */
.spk[data-ob] .ann{background:var(--ink);color:var(--bg);font-size:12px;letter-spacing:.04em}
.spk[data-ob] .hd{background:var(--bg);-webkit-backdrop-filter:none;backdrop-filter:none;border-bottom:1px solid var(--ln3)}
.spk[data-ob] .hd-in{height:66px}
.spk[data-ob] .logo{font-weight:900;font-size:17px}
.spk[data-ob] .logo img{width:38px;height:38px;border-radius:50%}
.spk[data-ob] .nav{gap:22px}
.spk[data-ob] .nav a{font-size:13px;font-weight:700;color:var(--mut);padding:4px 0;border-bottom:1.5px solid transparent;transition:color .15s,border-color .15s}
.spk[data-ob] .nav a:hover{color:var(--ink);border-bottom-color:var(--ink)}
.spk[data-ob] .sbx-in{background:color-mix(in srgb,var(--ink) 5%,var(--bg));border:1px solid transparent;border-radius:999px;font-size:13px}
.spk[data-ob] .sbx-in:focus{outline:none;border-color:var(--ink)}
.spk[data-ob] .sbx-dd{border-radius:16px;border:1px solid var(--ln3);box-shadow:0 18px 40px -18px color-mix(in srgb,var(--ink) 40%,transparent)}
.spk[data-ob] .cartb{background:transparent;border:1.5px solid var(--ln2);font-size:13px}
.spk[data-ob] .cartb:hover{border-color:var(--ink)}
.spk[data-ob] .cnt{background:var(--ink);color:var(--bg)}

/* الأزرار: كبسولة، الأساسي داكن */
.spk[data-ob] .b{border-radius:999px;border:1.5px solid var(--ln2);background:transparent;color:var(--ink);min-height:48px;padding:12px 26px;font-weight:800;font-size:14px;letter-spacing:.02em;box-shadow:none;transition:background .15s,color .15s,border-color .15s,transform .12s}
.spk[data-ob] .b:hover{border-color:var(--ink)}
.spk[data-ob] .b.p{background:var(--ink);color:var(--bg);border-color:var(--ink);box-shadow:none}
.spk[data-ob] .b.p:hover{background:color-mix(in srgb,var(--ink) 86%,var(--bg))}
.spk[data-ob] .b.p::after{display:none}
.spk[data-ob] .b.wa{background:#25d366;border-color:#25d366;color:#fff}
.spk[data-ob] .b.sm{min-height:38px;padding:7px 18px;font-size:12.5px}
.spk[data-ob] .b[disabled]{opacity:.45}

/* مربعات الاختيار (المقاس / الخيارات / التصنيفات) */
.spk[data-ob] .opt{margin:18px 0}
.spk[data-ob] .opt>b{font-size:11px;letter-spacing:.08em;color:var(--mut);font-weight:800;margin-bottom:9px}
.spk[data-ob] .chips{display:grid;grid-template-columns:repeat(auto-fill,minmax(66px,1fr));gap:8px}
.spk[data-ob] .chip{border:1.5px solid var(--ln2);background:var(--card);color:var(--ink);border-radius:10px;padding:11px 8px;min-height:44px;text-align:center;font-weight:800;font-size:14px;display:inline-flex;align-items:center;justify-content:center;transition:background .15s,color .15s,border-color .15s}
.spk[data-ob] .chip:hover{border-color:var(--ink)}
.spk[data-ob] .chip.act{background:var(--ink);color:var(--bg);border-color:var(--ink)}
.spk[data-ob] .tabs{display:flex;gap:8px;flex-wrap:wrap}
.spk[data-ob] .tabs .chip{border-radius:999px;padding:8px 18px;min-height:0;font-size:13px}
.spk[data-ob] .qty{border:1.5px solid var(--ln2);border-radius:999px;background:transparent}
.spk[data-ob] .qty button{color:var(--ink)}
.spk[data-ob] .offer{border:1.5px solid var(--ln2);border-style:solid;border-radius:14px;background:transparent}
.spk[data-ob] .offer.act{border-color:var(--ink);background:color-mix(in srgb,var(--ink) 5%,transparent)}
.spk[data-ob] .bump{border:1.5px solid var(--ln2);background:transparent;color:var(--ink);border-radius:16px}
.spk[data-ob] .bump input{accent-color:var(--ink)}

/* الحقول */
.spk[data-ob] .in{border-radius:12px;min-height:48px;background:transparent;border:1.5px solid var(--ln2);box-shadow:none}
.spk[data-ob] .in:hover{border-color:color-mix(in srgb,var(--ink) 30%,transparent)}
.spk[data-ob] .in:focus{border-color:var(--ink);background:transparent;box-shadow:none}
.spk[data-ob] .fld label{font-size:12px;letter-spacing:.04em;font-weight:800}
.spk[data-ob] .err{border-radius:12px}

/* كروت المنتجات: صورة عائمة + اسم + سعر + رابط تفاصيل */
.spk[data-ob] .pc{background:transparent;border:0;border-radius:0;box-shadow:none!important;overflow:visible}
.spk[data-ob] .pc:hover{transform:none;box-shadow:none}
.spk[data-ob] .pc-img{border-radius:18px;background:var(--card);border:1px solid var(--ln3);position:relative}
.spk[data-ob] .pc-img img{object-fit:contain;padding:6%}
.spk[data-ob] .pc-b{padding:12px 2px 2px;gap:3px}
.spk[data-ob] .pc-t{font-size:15px;font-weight:800;min-height:0}
.spk[data-ob] .pc-p b{color:var(--ink);font-size:14px;font-weight:700}
.spk[data-ob] .old{font-size:12px}
.spk[data-ob] .pc .b,.spk[data-ob] .pc .b.p,.spk[data-ob] .pc .b.blk{width:auto;align-self:flex-start;min-height:0;margin-top:8px;padding:0 0 3px;border:0;border-bottom:1.5px solid var(--ink);border-radius:0;background:none;color:var(--ink);font-size:12.5px;box-shadow:none}
.spk[data-ob] .pc .b.p::after{display:inline;content:'←';position:static;width:auto;height:auto;background:none;transform:none;animation:none;margin-inline-start:6px}
.spk[data-ob] .pc-fav{inset-inline-start:auto;inset-inline-end:10px;width:34px;height:34px;background:color-mix(in srgb,var(--card) 90%,transparent);box-shadow:none}
.spk[data-ob] .bdg{background:var(--ink);color:var(--bg);font-size:10px;letter-spacing:.05em;padding:3px 10px}
.spk[data-ob] .bdg.so{background:color-mix(in srgb,var(--ink) 45%,var(--bg))}
.spk[data-ob] .save{background:var(--ink);color:var(--bg)}
.spk[data-ob] .scar{background:transparent;border:1.5px solid #dc2626;color:#dc2626}

/* صفحة المنتج */
.spk[data-ob] .pv{gap:30px;padding:30px 0}
.spk[data-ob] .gal-main{background:var(--card);border:1px solid var(--ln3);box-shadow:none;border-radius:22px}
.spk[data-ob] .gal-main img{object-fit:contain;padding:5%}
.spk[data-ob] .gal-th button{border:1.5px solid transparent;border-radius:12px;background:var(--card)}
.spk[data-ob] .gal-th button.act{border-color:var(--ink)}
.spk[data-ob] .gal-th img{object-fit:contain}
.spk[data-ob] .gal-nav{display:flex;align-items:center;justify-content:center;gap:14px;margin-top:12px;font-size:12px;letter-spacing:.1em}
.spk[data-ob] .gal-nav button{width:40px;height:40px;border-radius:50%;border:1.5px solid var(--ln2);background:transparent;color:var(--ink);font-size:18px;cursor:pointer}
.spk[data-ob] .gal-nav button.dk{background:var(--ink);color:var(--bg);border-color:var(--ink)}
.spk[data-ob] .info h1{font-size:clamp(28px,4.4vw,52px);line-height:1.08}
.spk[data-ob] .price b{font-size:22px;color:var(--ink);font-weight:800;letter-spacing:0}
.spk[data-ob] .assure{display:flex;gap:6px 18px;flex-wrap:wrap}
.spk[data-ob] .assure div{border:0;background:none;padding:4px 0;font-size:12px;color:var(--mut);font-weight:700}
.spk[data-ob] .stk{background:var(--bg);-webkit-backdrop-filter:none;backdrop-filter:none;border-top:1px solid var(--ln3)}
.spk[data-ob] .stk b{color:var(--ink)}
.spk[data-ob] .rev{border-top:1px solid var(--ln3)}

/* الكروت العامة والنماذج */
.spk[data-ob] .card,.spk[data-ob] .frm,.spk[data-ob] .ti,.spk[data-ob] .cat,.spk[data-ob] .ci,.spk[data-ob] .bl-cd,.spk[data-ob] .bl-faq details,.spk[data-ob] .banner,.spk[data-ob] .nxt div,.spk[data-ob] .pop{border:1px solid var(--ln3);border-radius:18px;box-shadow:none;background:var(--card)}
.spk[data-ob] .sum{border:1px solid var(--ln3);border-radius:16px;background:transparent}
.spk[data-ob] .cat{background:transparent;border:0;padding:0;text-align:start;font-size:15px;font-weight:800}
.spk[data-ob] .cat img,.spk[data-ob] .cat .ph{border-radius:18px;background:var(--card);margin-bottom:10px}
.spk[data-ob] .cat.act{box-shadow:none;text-decoration:underline}
.spk[data-ob] .ci img{border-radius:12px}
.spk[data-ob] .hero{border-radius:24px}
.spk[data-ob] .hero h1{font-weight:900}
.spk[data-ob] .hero .b,.spk[data-ob] .hero .b:hover{background:#fff;color:#111;border-color:#fff}
.spk[data-ob] .cd div{background:var(--ink);color:var(--bg);border-radius:12px}
.spk[data-ob] .code{border:1.5px dashed var(--ink);color:var(--ink)}
.spk[data-ob] .mdl-b,.spk[data-ob] .mc{border-radius:20px}
.spk[data-ob] .welc{background:var(--ink);color:var(--bg)}
.spk[data-ob] .prog i{background:var(--ink)}
.spk[data-ob] .sum .tot{border-top:1px solid var(--ln2)}

/* الفوتر */
.spk[data-ob] .ft{background:transparent;border-top:1px solid var(--ln3);margin-top:48px}
.spk[data-ob] .ft h4{font-size:12px;letter-spacing:.08em;font-weight:900}
.spk[data-ob] .soc a{border:1.5px solid var(--ln2);padding:4px 16px;font-size:13px}
.spk[data-ob] .soc a:hover{border-color:var(--ink);color:var(--ink)}

@media(max-width:699px){
.spk[data-ob] .hd-in{height:auto;flex-wrap:wrap;padding-top:10px;padding-bottom:6px;gap:8px 10px}
.spk[data-ob] .nav{order:5;width:100%;margin:0;gap:20px;overflow-x:auto;white-space:nowrap;scrollbar-width:none;padding:2px 0 6px}
.spk[data-ob] .nav::-webkit-scrollbar{display:none}
.spk[data-ob] .logo span{max-width:46vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
}

/* رابط «عرض الكل ←» */
.spk .more{display:inline-block;font-size:13px;font-weight:800;border-bottom:1.5px solid currentColor;padding-bottom:2px}

/* الثيمات الداكنة: بلاطة الصورة بيضاء عشان خلفيات الصور البيضا تذوب */
.spk[data-ob][data-dk="1"] .pc-img,.spk[data-ob][data-dk="1"] .gal-main,.spk[data-ob][data-dk="1"] .gal-th button,.spk[data-ob][data-dk="1"] .cat img,.spk[data-ob][data-dk="1"] .cat .ph{background:#fff}
/* ===== هوية سبايك (نهاري/ليلي): تفعل مع ثيمي «سبايك نهاري/ليلي» فقط ===== */
.spk[data-mode="night"]{--bg:var(--n-bg,#061C2A)!important;--card:var(--n-card,#0A2A3E)!important;--ink:var(--n-ink,#E8F1F8)!important;--mut:var(--n-mut,#8FA9BC)!important;--ln:var(--n-ln,#16435D)!important;--tint:var(--n-tint,#0F3650)!important;--tint2:var(--n-tint2,#082436)!important;--deep:var(--n-deep,#02131E)!important;color-scheme:dark}
.spk[data-mode="night"][data-pal="1"]{--c:var(--n-c,#5BB6E0)!important;--onc:var(--n-onc,#04202F)!important}
.spk[data-mode="night"]{background:var(--bg);color:var(--ink)}
.spk .mode{width:40px;height:40px;border-radius:50%;border:1.5px solid var(--ln2,var(--ln));background:transparent;color:var(--ink);font-size:17px;cursor:pointer;flex:none;display:inline-flex;align-items:center;justify-content:center;line-height:1}
.spk .mode:hover{border-color:var(--ink)}
.spk[data-pal="1"]{background:var(--bg)}
.spk[data-pal="1"] .ann{background:var(--deep);color:#fff}
.spk[data-pal="1"] .hero{background:var(--tint);color:var(--ink);border-radius:20px}
.spk[data-pal="1"] .hero.img{background-size:cover;background-position:center;min-height:clamp(300px,40vw,430px);display:flex;align-items:center}
.spk[data-pal="1"] .hero.img::before{display:none}
.spk[data-pal="1"] .hero-in{padding:clamp(24px,3.4vw,38px);max-width:480px}
.spk[data-pal="1"] .hero.img .hero-in{background:var(--tint);color:var(--ink);border-radius:14px;margin:clamp(14px,3vw,36px);box-shadow:0 18px 40px -26px rgba(2,52,77,.55)}
.spk[data-pal="1"] .hero h1{color:var(--ink)}
.spk[data-pal="1"] .hero p{opacity:1;color:color-mix(in srgb,var(--ink) 78%,var(--bg))}
.spk[data-ob][data-pal="1"] .hero .b,.spk[data-ob][data-pal="1"] .hero .b:hover{background:var(--ink);color:var(--bg);border-color:var(--ink)}
.spk[data-pal="1"] .trust{background:var(--tint2);border-radius:16px;padding:clamp(12px,2vw,20px);gap:10px}
.spk[data-ob][data-pal="1"] .ti{border:0;background:transparent}
.spk[data-pal="1"] .ti i{color:var(--ink)}
.spk[data-ob][data-pal="1"] .pc-img,.spk[data-ob][data-pal="1"] .cat img,.spk[data-ob][data-pal="1"] .cat .ph{background:var(--card)}
.spk[data-ob][data-pal="1"] .banner{background:var(--tint);border-color:transparent}
.spk[data-ob][data-pal="1"] .ft{background:var(--deep);color:#fff;border-top:0}
.spk[data-ob][data-pal="1"] .ft h4{color:#fff}
.spk[data-ob][data-pal="1"] .ft a,.spk[data-ob][data-pal="1"] .ft .mut,.spk[data-ob][data-pal="1"] .ft p{color:rgba(255,255,255,.76)}
.spk[data-ob][data-pal="1"] .ft a:hover{color:#fff}
.spk[data-ob][data-pal="1"] .ft .soc a{border-color:rgba(255,255,255,.3);color:#fff}
.spk[data-ob][data-pal="1"] .ft .b.wa{color:#fff}
.spk[data-ob][data-pal="1"] .ft .pw{color:rgba(255,255,255,.55)}
.spk[data-mode="night"] .pc-img,.spk[data-mode="night"] .gal-main,.spk[data-mode="night"] .gal-th button,.spk[data-mode="night"] .cat img,.spk[data-mode="night"] .cat .ph{background:#fff}
.spk[data-mode="night"] .ob-it,.spk[data-mode="night"] .ob-fpic,.spk[data-mode="night"] .ob-ths img{mix-blend-mode:normal}
@media(max-width:699px){
.spk[data-ob] .chips{display:flex;flex-wrap:wrap;gap:6px}
.spk[data-ob] .chips .chip{flex:1 1 52px;min-width:52px;padding:10px 6px}
.spk .ob-sz{gap:6px}
.spk .ob-sz button{flex:1 1 48px;min-width:48px}
.spk .lk-chips{gap:6px}
.spk .sf-link{padding:10px 0;font-size:13.5px}
}
`;
