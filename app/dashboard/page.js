'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import MerchantPixelsPanel from '../../components/MerchantPixelsPanel';
import { spikeLogout } from '../../components/SpikeSessionBar';

const ADMIN_EMAIL = 'hassanhosny2007@gmail.com';

/* =====================================================================
   SPIKE — لوحة التاجر (Merchant Admin)
   بيانات تجريبية في الـ state. اربطها بـ Supabase مكان أي setX(...) لاحقًا.
   ===================================================================== */

const money = (n, c = 'ج.م') => `${Math.round(n).toLocaleString('en-US')} ${c}`;
const NAV = [['home', 'الرئيسية', '🏠'], ['orders', 'الطلبات', '📦'], ['products', 'المنتجات', '🏷️'], ['carts', 'السلات المتروكة', '🛒'], ['marketing', 'التسويق', '📣'], ['settings', 'الإعدادات', '⚙️']];
const ST = { pending: ['جديد', '#b7791f'], confirmed: ['مؤكد', '#0a7f86'], shipped: ['في الشحن', '#6b46c1'], delivered: ['تم التسليم', '#2f855a'], returned: ['مرتجع', '#c53030'] };

const seedOrders = [
  { id: 1042, name: 'منى السيد', phone: '01012345678', gov: 'القاهرة', total: 780, cost: 410, ship: 50, st: 'pending' },
  { id: 1041, name: 'كريم عادل', phone: '01155550001', gov: 'الإسكندرية', total: 1250, cost: 700, ship: 60, st: 'confirmed' },
  { id: 1040, name: 'منى السيد', phone: '01012345678', gov: 'القاهرة', total: 780, cost: 410, ship: 50, st: 'pending' },
  { id: 1039, name: 'سارة محمود', phone: '01234567890', gov: 'المنصورة', total: 460, cost: 230, ship: 65, st: 'shipped' },
  { id: 1038, name: 'أحمد فتحي', phone: '01099998888', gov: 'أسيوط', total: 920, cost: 520, ship: 85, st: 'delivered' },
  { id: 1037, name: 'هدى رضا', phone: '01511112222', gov: 'الجيزة', total: 340, cost: 190, ship: 50, st: 'returned' },
];
const seedProducts = [
  { id: 1, name: 'تيشيرت قطن أوفر سايز', price: 340, cost: 170, stock: 42, variants: 'S, M, L, XL' },
  { id: 2, name: 'هودي شتوي', price: 780, cost: 410, stock: 4, variants: 'M, L' },
  { id: 3, name: 'شنطة ظهر', price: 460, cost: 230, stock: 18, variants: 'أسود, بيج' },
];
const seedCarts = [
  { id: 1, name: 'نور حسن', phone: '01077771111', value: 1120, items: 3, ago: 'من ساعتين' },
  { id: 2, name: 'ياسمين علي', phone: '01288884444', value: 340, items: 1, ago: 'من يوم' },
];
const ZONES = [['القاهرة والجيزة', 50], ['الإسكندرية', 60], ['الدلتا', 65], ['القناة', 70], ['الصعيد', 85], ['سيناء والبحر الأحمر', 110]];

const Spark = ({ d, c }) => {
  const m = Math.max(...d), n = Math.min(...d);
  const pts = d.map((v, i) => `${(i / (d.length - 1)) * 100},${27 - ((v - n) / (m - n || 1)) * 23}`).join(' ');
  return <svg viewBox="0 0 100 30" className="spark"><polyline points={pts} fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
};
const Tog = ({ on, set }) => <button type="button" role="switch" aria-checked={on} className={'tog' + (on ? ' on' : '')} onClick={() => set(!on)}><i /></button>;
const Modal = ({ t, x, children }) => (
  <div className="ov" onClick={x}><div className="mod" onClick={(e) => e.stopPropagation()}>
    <div className="mh"><b>{t}</b><button className="btn" onClick={x}>إغلاق</button></div>{children}
  </div></div>
);
const Field = ({ l, children }) => <label className="fld"><span>{l}</span>{children}</label>;

export default function MerchantDashboard() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [uid, setUid] = useState('');          // معرّف المتجر اللي بتتربط بيه البيكسلات
  const [email, setEmail] = useState('');
  const [pixelCount, setPixelCount] = useState(0);
  const isAdmin = email.toLowerCase() === ADMIN_EMAIL;
  const [tab, setTab] = useState('home');
  const [store, setStore] = useState({ name: 'متجري', slug: 'my-store', cat: 'ملابس', color: '#0a7f86', cur: 'ج.م', domain: '', freeShip: 1000 });
  const [orders, setOrders] = useState(seedOrders);
  const [products, setProducts] = useState(seedProducts);
  const [carts] = useState(seedCarts);
  const [coupons, setCoupons] = useState([{ code: 'WELCOME10', pct: 10, uses: 12, on: true }]);
  const [zones, setZones] = useState(ZONES);
  const [pay, setPay] = useState({ cod: true, wallet: false, card: false });
  const [fields, setFields] = useState({ phone2: false, email: false, note: true });
  const [upsell, setUpsell] = useState({ bundle: false, free: true });
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [sel, setSel] = useState([]);
  const [wiz, setWiz] = useState(null); // null = لم يُحدد بعد، 0 = مغلق، 1..3 خطوات
  const [pm, setPm] = useState(false);
  const [cmd, setCmd] = useState(false);
  const [cq, setCq] = useState('');
  const [toast, setToast] = useState('');
  const [np, setNp] = useState({ name: '', price: '', cost: '', stock: 10, variants: '' });
  const [nc, setNc] = useState({ code: '', pct: 10 });

  // حماية الصفحة: لازم جلسة Supabase حقيقية، وإلا يرجع لصفحة الدخول
  useEffect(() => {
    let off = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const user = data?.session?.user;
      if (!user) { router.replace('/register'); return; }
      if (off) return;
      const em = user.email || '';
      setEmail(em);
      // الأدمن: يشتغل على متجره الرئيسي (أو المتجر اللي اختاره من لوحة الإدارة). التاجر: متجره هو بس.
      let storeKey = user.id;
      if (em.toLowerCase() === ADMIN_EMAIL) {
        try { storeKey = localStorage.getItem('merchant_user_id') || 'main_flagship_owner'; } catch { storeKey = 'main_flagship_owner'; }
      }
      setUid(storeKey);
      const { data: sp } = await supabase.from('store_profiles').select('store_name,store_slug').eq('user_id', storeKey).maybeSingle();
      if (sp && !off) setStore((s) => ({ ...s, name: sp.store_name || s.name, slug: sp.store_slug || s.slug }));
      if (!off) setReady(true);
    })();
    return () => { off = true; };
  }, []);

  useEffect(() => {
    try { setWiz(localStorage.getItem('spike_onboarded') ? 0 : 1); } catch { setWiz(0); }
    const k = (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setCmd((v) => !v); } if (e.key === 'Escape') setCmd(false); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, []);
  const say = (m) => { setToast(m); setTimeout(() => setToast(''), 2200); };
  const finishWiz = () => { try { localStorage.setItem('spike_onboarded', '1'); } catch {} setWiz(0); say('🎉 متجرك جاهز! ابدأ بإضافة أول منتج'); setTab('products'); };

  const setSt = (ids, st) => { setOrders((o) => o.map((x) => (ids.includes(x.id) ? { ...x, st } : x))); setSel([]); say('تم تحديث الطلبات'); };
  const dupPhones = useMemo(() => { const c = {}; orders.filter((o) => o.st === 'pending').forEach((o) => (c[o.phone] = (c[o.phone] || 0) + 1)); return Object.keys(c).filter((k) => c[k] > 1); }, [orders]);
  const live = orders.filter((o) => o.st !== 'returned');
  const sales = live.reduce((a, o) => a + o.total, 0);
  const profit = live.reduce((a, o) => a + o.total - o.cost - o.ship, 0);
  const pending = orders.filter((o) => o.st === 'pending');
  const confirmRate = Math.round((orders.filter((o) => ['confirmed', 'shipped', 'delivered'].includes(o.st)).length / orders.length) * 100);
  const cartVal = carts.reduce((a, c) => a + c.value, 0);
  const low = products.filter((p) => p.stock <= 5);
  const shown = orders.filter((o) => (filter === 'all' || o.st === filter) && (!q || (o.name + o.phone + o.id).includes(q)));
  const wa = (phone, text) => `https://wa.me/2${phone}?text=${encodeURIComponent(text)}`;

  const steps = [
    ['أنشئ متجرك', true, () => setWiz(1)],
    ['أضف أول منتج', products.length > 0, () => { setTab('products'); setPm(true); }],
    ['اضبط أسعار الشحن', zones.every((z) => z[1] > 0), () => setTab('settings')],
    ['فعّل طريقة دفع', pay.cod || pay.wallet || pay.card, () => setTab('settings')],
    ['اربط دومينك', !!store.domain, () => setTab('settings')],
    ['فعّل بكسل التتبع', pixelCount > 0, () => setTab('marketing')],
  ];
  const done = steps.filter((s) => s[1]).length;

  const pulse = [
    pending.length && { i: '⏱️', t: `${pending.length} طلبات جديدة تنتظر التأكيد`, a: 'أكّد الكل', f: () => setSt(pending.map((o) => o.id), 'confirmed') },
    dupPhones.length > 0 && { i: '🛡️', t: 'طلبات متكررة من نفس الرقم — راجعها قبل الشحن', a: 'راجع', f: () => { setTab('orders'); setFilter('pending'); } },
    cartVal > 0 && { i: '🛒', t: `سلات متروكة بقيمة ${money(cartVal)} يمكن استرجاعها`, a: 'استرجع', f: () => setTab('carts') },
    low[0] && { i: '📉', t: `«${low[0].name}» قارب على النفاد (${low[0].stock} قطع)`, a: 'عدّل المخزون', f: () => setTab('products') },
  ].filter(Boolean);

  const actions = [...NAV.map((n) => ({ t: `اذهب إلى ${n[1]}`, f: () => setTab(n[0]) })), { t: 'إضافة منتج جديد', f: () => { setTab('products'); setPm(true); } }, { t: 'إنشاء كوبون خصم', f: () => setTab('marketing') }, { t: 'تأكيد كل الطلبات الجديدة', f: () => setSt(pending.map((o) => o.id), 'confirmed') }];
  const cmds = actions.filter((a) => a.t.includes(cq));

  const addProduct = (e) => {
    e.preventDefault();
    if (!np.name || !np.price) return say('اكتب اسم المنتج وسعره');
    setProducts([{ id: Date.now(), name: np.name, price: +np.price, cost: +np.cost || 0, stock: +np.stock || 0, variants: np.variants }, ...products]);
    setNp({ name: '', price: '', cost: '', stock: 10, variants: '' }); setPm(false); say('✅ تمت إضافة المنتج');
  };
  const margin = np.price ? Math.round(((np.price - (np.cost || 0)) / np.price) * 100) : 0;

  if (!ready) {
    return <div className="app" dir="rtl" style={{ '--b': store.color, alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>جاري تحميل لوحتك...</div>;
  }

  return (
    <div className="app" dir="rtl" style={{ '--b': store.color }}>
      <aside className="side">
        <div className="logo"><span className="lg">{store.name.slice(0, 1)}</span><div><b>{store.name}</b><small>{store.slug}.spike.shop</small></div></div>
        <nav>
          {NAV.map(([id, t, i]) => (
            <button key={id} className={'nv' + (tab === id ? ' act' : '')} onClick={() => setTab(id)}>
              <span>{i}</span>{t}
              {id === 'orders' && pending.length > 0 && <em>{pending.length}</em>}
            </button>
          ))}
        </nav>
        <div className="prog"><small>جاهزية المتجر {done}/{steps.length}</small><div className="bar"><i style={{ width: `${(done / steps.length) * 100}%` }} /></div></div>
      </aside>

      <main className="main">
        <header className="top">
          <button className="srch" onClick={() => setCmd(true)}>🔎 ابحث أو نفّذ أمرًا… <kbd>Ctrl K</kbd></button>
          <a className="btn" href={`https://${store.slug}.spike.shop`} target="_blank" rel="noreferrer">👁️ معاينة المتجر</a>
          <button className="btn p" onClick={() => { setTab('products'); setPm(true); }}>+ منتج جديد</button>
          {isAdmin && <button className="btn" onClick={() => router.push('/admin')}>🛡️ لوحة الإدارة</button>}
          <button className="btn" style={{ color: '#c53030' }} onClick={() => spikeLogout(router)}>🚪 تسجيل الخروج</button>
        </header>

        <section className="pg">
          {tab === 'home' && (<>
            <h1>أهلاً بك 👋 <small>إليك ملخص متجرك</small></h1>
            <div className="grid4">
              {[['مبيعات الطلبات', money(sales), [3, 5, 4, 7, 6, 9, 8]], ['صافي الربح', money(profit), [2, 3, 3, 4, 5, 5, 7]], ['نسبة التأكيد', `${confirmRate}%`, [6, 5, 7, 6, 8, 7, 9]], ['طلبات جديدة', pending.length, [1, 3, 2, 4, 3, 5, 4]]].map(([t, v, d]) => (
                <div className="card kpi" key={t}><small>{t}</small><b>{v}</b><Spark d={d} c={store.color} /></div>
              ))}
            </div>
            <div className="two">
              <div className="card">
                <h3>✨ مساعد سبايك <small>اقتراحات استباقية من بيانات متجرك</small></h3>
                {pulse.length === 0 ? <p className="mut">كل شيء تمام الآن 👌</p> : pulse.map((p, i) => (
                  <div className="pls" key={i}><span>{p.i}</span><p>{p.t}</p><button className="btn p sm" onClick={p.f}>{p.a}</button></div>
                ))}
              </div>
              <div className="card">
                <h3>🚀 ابدأ متجرك <small>{done} من {steps.length}</small></h3>
                <div className="bar big"><i style={{ width: `${(done / steps.length) * 100}%` }} /></div>
                {steps.map(([t, ok, f]) => (
                  <button key={t} className={'stp' + (ok ? ' ok' : '')} onClick={f}><span>{ok ? '✓' : ''}</span>{t}</button>
                ))}
              </div>
            </div>
          </>)}

          {tab === 'orders' && (<>
            <h1>الطلبات <small>الدفع عند الاستلام مع تأكيد سريع بالواتساب</small></h1>
            <div className="row">
              {[['all', 'الكل', orders.length], ...Object.entries(ST).map(([k, v]) => [k, v[0], orders.filter((o) => o.st === k).length])].map(([k, t, n]) => (
                <button key={k} className={'chip' + (filter === k ? ' act' : '')} onClick={() => setFilter(k)}>{t} <em>{n}</em></button>
              ))}
              <input className="in" style={{ marginInlineStart: 'auto', maxWidth: 220 }} placeholder="بحث بالاسم أو الهاتف…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            {sel.length > 0 && (
              <div className="bulk"><b>{sel.length} محدد</b>
                <button className="btn p sm" onClick={() => setSt(sel, 'confirmed')}>تأكيد</button>
                <button className="btn sm" onClick={() => setSt(sel, 'shipped')}>تسليم للشحن</button>
                <button className="btn sm" onClick={() => setSel([])}>إلغاء التحديد</button>
              </div>)}
            <div className="card tw"><table className="tbl"><thead><tr><th /><th>#</th><th>العميل</th><th>المحافظة</th><th>الإجمالي</th><th>الربح</th><th>الحالة</th><th /></tr></thead>
              <tbody>{shown.map((o) => (
                <tr key={o.id}>
                  <td><input type="checkbox" checked={sel.includes(o.id)} onChange={(e) => setSel(e.target.checked ? [...sel, o.id] : sel.filter((x) => x !== o.id))} /></td>
                  <td className="num">#{o.id}</td>
                  <td><b>{o.name}</b> {dupPhones.includes(o.phone) && o.st === 'pending' && <span className="warn">⚠ مكرر</span>}<small className="num" dir="ltr">{o.phone}</small></td>
                  <td>{o.gov}</td><td className="num">{money(o.total)}</td>
                  <td className="num" style={{ color: '#2f855a' }}>{money(o.total - o.cost - o.ship)}</td>
                  <td><select className="in sm" style={{ color: ST[o.st][1] }} value={o.st} onChange={(e) => setSt([o.id], e.target.value)}>{Object.entries(ST).map(([k, v]) => <option key={k} value={k}>{v[0]}</option>)}</select></td>
                  <td><a className="btn sm" target="_blank" rel="noreferrer" href={wa(o.phone, `أهلاً ${o.name}، نؤكد طلبك رقم ${o.id} من ${store.name} بقيمة ${money(o.total)}. هل نؤكد الشحن؟`)}>💬 واتساب</a></td>
                </tr>))}</tbody></table>
              {shown.length === 0 && <p className="mut c">لا توجد طلبات مطابقة</p>}
            </div>
          </>)}

          {tab === 'products' && (<>
            <h1>المنتجات <small>{products.length} منتج</small></h1>
            <div className="card tw"><table className="tbl"><thead><tr><th>المنتج</th><th>السعر</th><th>التكلفة</th><th>الهامش</th><th>المخزون</th><th /></tr></thead>
              <tbody>{products.map((p) => (
                <tr key={p.id}>
                  <td><b>{p.name}</b><small>{p.variants || 'بدون اختيارات'}</small></td>
                  <td className="num">{money(p.price)}</td><td className="num">{money(p.cost)}</td>
                  <td className="num">{Math.round(((p.price - p.cost) / p.price) * 100)}%</td>
                  <td><div className="stk">
                    <button onClick={() => setProducts(products.map((x) => (x.id === p.id ? { ...x, stock: Math.max(0, x.stock - 1) } : x)))}>−</button>
                    <b className={p.stock <= 5 ? 'warn' : ''}>{p.stock}</b>
                    <button onClick={() => setProducts(products.map((x) => (x.id === p.id ? { ...x, stock: x.stock + 1 } : x)))}>+</button></div></td>
                  <td><button className="btn sm" onClick={() => { setProducts(products.filter((x) => x.id !== p.id)); say('تم الحذف'); }}>حذف</button></td>
                </tr>))}</tbody></table>
              {products.length === 0 && <p className="mut c">لا توجد منتجات بعد — أضف أول منتج لتبدأ البيع</p>}
            </div>
          </>)}

          {tab === 'carts' && (<>
            <h1>السلات المتروكة <small>عملاء تركوا الدفع — استرجعهم بضغطة</small></h1>
            <div className="card">{carts.map((c) => (
              <div className="pls" key={c.id}><span>🛒</span><p><b>{c.name}</b> · {c.items} منتجات · {money(c.value)} <small>{c.ago}</small></p>
                <a className="btn p sm" target="_blank" rel="noreferrer" href={wa(c.phone, `أهلاً ${c.name} 👋 لاحظنا إنك نسيت طلبك في ${store.name}. كمّله دلوقتي واستخدم كود WELCOME10 لخصم 10%!`)}>استرجاع بالواتساب</a></div>))}</div>
          </>)}

          {tab === 'marketing' && (<>
            <h1>التسويق والخصومات</h1>
            <div className="two">
              <div className="card"><h3>🎟️ كوبونات الخصم</h3>
                <form className="row" onSubmit={(e) => { e.preventDefault(); if (!nc.code) return; setCoupons([{ code: nc.code.toUpperCase(), pct: +nc.pct, uses: 0, on: true }, ...coupons]); setNc({ code: '', pct: 10 }); say('تم إنشاء الكوبون'); }}>
                  <input className="in" placeholder="الكود مثل SALE20" value={nc.code} onChange={(e) => setNc({ ...nc, code: e.target.value })} />
                  <input className="in" type="number" style={{ maxWidth: 80 }} value={nc.pct} onChange={(e) => setNc({ ...nc, pct: e.target.value })} /><button className="btn p">إضافة</button></form>
                {coupons.map((c, i) => (<div className="pls" key={c.code}><span>%</span><p><b className="num">{c.code}</b> خصم {c.pct}% <small>استُخدم {c.uses} مرة</small></p><Tog on={c.on} set={(v) => setCoupons(coupons.map((x, j) => (j === i ? { ...x, on: v } : x)))} /></div>))}
              </div>
              <div className="card"><h3>🧲 زيادة قيمة الطلب</h3>
                <div className="pls"><p>شحن مجاني فوق {money(store.freeShip)}</p><Tog on={upsell.free} set={(v) => setUpsell({ ...upsell, free: v })} /></div>
                <div className="pls"><p>عرض «اشترِ 2 بسعر أقل» في صفحة الدفع</p><Tog on={upsell.bundle} set={(v) => setUpsell({ ...upsell, bundle: v })} /></div>
              </div>
            </div>
            <div className="card" style={{ marginTop: 16 }}>
              <h3>📡 بكسلات التتبع والأحداث <small>اربط صفحاتك بنفسك وتحكم في الأحداث</small></h3>
              <MerchantPixelsPanel storeId={uid} isAr canEdit onCount={setPixelCount} />
            </div>
          </>)}

          {tab === 'settings' && (<>
            <h1>الإعدادات</h1>
            <div className="two">
              <div className="card"><h3>🏪 المتجر والهوية</h3>
                <Field l="اسم المتجر"><input className="in" value={store.name} onChange={(e) => setStore({ ...store, name: e.target.value })} /></Field>
                <Field l="رابط المتجر"><input className="in num" dir="ltr" value={store.slug} onChange={(e) => setStore({ ...store, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} /></Field>
                <Field l="دومين خاص (اختياري)"><input className="in num" dir="ltr" placeholder="shop.example.com" value={store.domain} onChange={(e) => setStore({ ...store, domain: e.target.value })} /></Field>
                <Field l="لون الهوية"><input type="color" value={store.color} onChange={(e) => setStore({ ...store, color: e.target.value })} className="clr" /></Field>
                <Field l="حد الشحن المجاني"><input className="in num" type="number" value={store.freeShip} onChange={(e) => setStore({ ...store, freeShip: +e.target.value })} /></Field>
              </div>
              <div className="card"><h3>👁️ معاينة صفحة الدفع <small>تتغير فورًا</small></h3>
                <div className="pv"><b>{store.name}</b>
                  <input className="in" placeholder="الاسم" readOnly /><input className="in" placeholder="رقم الهاتف" readOnly />
                  {fields.phone2 && <input className="in" placeholder="رقم هاتف آخر" readOnly />}
                  {fields.email && <input className="in" placeholder="البريد الإلكتروني" readOnly />}
                  <input className="in" placeholder="العنوان بالتفصيل" readOnly />
                  {fields.note && <input className="in" placeholder="ملاحظات للطلب" readOnly />}
                  <button className="btn p" style={{ width: '100%' }}>اطلب الآن · الدفع عند الاستلام</button></div>
                {[['phone2', 'رقم هاتف إضافي'], ['email', 'البريد الإلكتروني'], ['note', 'ملاحظات الطلب']].map(([k, t]) => (<div className="pls" key={k}><p>{t}</p><Tog on={fields[k]} set={(v) => setFields({ ...fields, [k]: v })} /></div>))}
              </div>
              <div className="card"><h3>🚚 أسعار الشحن</h3>
                {zones.map(([n, p], i) => (<div className="pls" key={n}><p>{n}</p><input className="in num" style={{ maxWidth: 90 }} type="number" value={p} onChange={(e) => setZones(zones.map((z, j) => (j === i ? [z[0], +e.target.value] : z)))} /></div>))}
              </div>
              <div className="card"><h3>💳 طرق الدفع</h3>
                {[['cod', 'الدفع عند الاستلام'], ['wallet', 'محافظ إلكترونية (فودافون كاش…)'], ['card', 'بطاقات بنكية']].map(([k, t]) => (<div className="pls" key={k}><p>{t}</p><Tog on={pay[k]} set={(v) => setPay({ ...pay, [k]: v })} /></div>))}
                <button className="btn p" style={{ marginTop: 14 }} onClick={() => say('✅ تم حفظ الإعدادات')}>حفظ الإعدادات</button>
              </div>
            </div>
          </>)}
        </section>
      </main>

      {pm && (<Modal t="إضافة منتج" x={() => setPm(false)}><form onSubmit={addProduct}>
        <Field l="اسم المنتج"><input className="in" value={np.name} onChange={(e) => setNp({ ...np, name: e.target.value })} autoFocus /></Field>
        <div className="row"><Field l="سعر البيع"><input className="in" type="number" value={np.price} onChange={(e) => setNp({ ...np, price: e.target.value })} /></Field>
          <Field l="التكلفة"><input className="in" type="number" value={np.cost} onChange={(e) => setNp({ ...np, cost: e.target.value })} /></Field>
          <Field l="المخزون"><input className="in" type="number" value={np.stock} onChange={(e) => setNp({ ...np, stock: e.target.value })} /></Field></div>
        <Field l="الاختيارات (مقاسات/ألوان) مفصولة بفاصلة"><input className="in" value={np.variants} onChange={(e) => setNp({ ...np, variants: e.target.value })} /></Field>
        <p className="mut">هامش الربح المتوقع: <b style={{ color: margin >= 30 ? '#2f855a' : '#b7791f' }}>{margin}%</b></p>
        <button className="btn p" style={{ width: '100%' }}>حفظ المنتج</button></form></Modal>)}

      {wiz > 0 && (<div className="ov"><div className="mod wz">
        <div className="dots">{[1, 2, 3].map((n) => <i key={n} className={wiz >= n ? 'on' : ''} />)}</div>
        {wiz === 1 && (<><h2>مرحبًا في سبايك 👋</h2><p className="mut">دقيقتان وتجهز متجرك. ما اسم متجرك؟</p>
          <Field l="اسم المتجر"><input className="in" value={store.name} onChange={(e) => setStore({ ...store, name: e.target.value })} /></Field>
          <Field l="الرابط"><input className="in num" dir="ltr" value={store.slug} onChange={(e) => setStore({ ...store, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} /></Field>
          <Field l="نوع النشاط"><select className="in" value={store.cat} onChange={(e) => setStore({ ...store, cat: e.target.value })}>{['ملابس', 'إلكترونيات', 'تجميل', 'أغذية', 'مستلزمات منزل', 'أخرى'].map((c) => <option key={c}>{c}</option>)}</select></Field></>)}
        {wiz === 2 && (<><h2>اختر هوية متجرك 🎨</h2><p className="mut">لون واحد يكفي — يمكنك تغييره لاحقًا.</p>
          <div className="row">{['#0a7f86', '#e08f4f', '#6b46c1', '#c53030', '#2f855a', '#1a202c'].map((c) => <button key={c} type="button" className={'sw' + (store.color === c ? ' act' : '')} style={{ background: c }} onClick={() => setStore({ ...store, color: c })} aria-label={c} />)}</div>
          <div className="pv"><b>{store.name}</b><button className="btn p" style={{ width: '100%' }}>اطلب الآن</button></div></>)}
        {wiz === 3 && (<><h2>متجرك جاهز! 🎉</h2><p className="mut">رابطك: <b className="num" dir="ltr">{store.slug}.spike.shop</b><br />أضف أول منتج وشارك الرابط لتستقبل أول طلب.</p></>)}
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <button className="btn" onClick={() => (wiz > 1 ? setWiz(wiz - 1) : finishWiz())}>{wiz > 1 ? 'رجوع' : 'تخطي'}</button>
          <button className="btn p" onClick={() => (wiz < 3 ? setWiz(wiz + 1) : finishWiz())}>{wiz < 3 ? 'التالي' : 'ادخل لوحة التحكم'}</button></div>
      </div></div>)}

      {cmd && (<div className="ov top" onClick={() => setCmd(false)}><div className="mod cm" onClick={(e) => e.stopPropagation()}>
        <input className="in" autoFocus placeholder="اكتب أمرًا…" value={cq} onChange={(e) => setCq(e.target.value)} />
        {cmds.map((a) => <button key={a.t} className="nv" onClick={() => { a.f(); setCmd(false); setCq(''); }}>{a.t}</button>)}</div></div>)}
      {toast && <div className="toast">{toast}</div>}

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
        .app{--bg:#efece0;--s:#fcfbf7;--s2:#f3f0e4;--ln:#e2ddca;--ink:#1f2f33;--mut:#6f7f82;display:flex;min-height:100vh;background:var(--bg);color:var(--ink);font-family:'Cairo',sans-serif;font-size:14px}
        .app *{box-sizing:border-box}.num{font-family:Inter,sans-serif;font-variant-numeric:tabular-nums}
        .side{width:250px;flex:none;background:var(--s);border-inline-start:1px solid var(--ln);padding:18px 14px;position:sticky;top:0;height:100vh;display:flex;flex-direction:column;gap:14px}
        .logo{display:flex;gap:10px;align-items:center}.logo small{display:block;color:var(--mut);font-size:11.5px}
        .lg{width:40px;height:40px;border-radius:12px;background:var(--b);color:#fff;display:grid;place-items:center;font-weight:800;font-size:18px}
        nav{display:flex;flex-direction:column;gap:4px;flex:1;overflow:auto;scrollbar-width:none}
        .nv{display:flex;align-items:center;gap:10px;width:100%;min-height:44px;padding:0 12px;border:0;border-radius:12px;background:none;color:var(--ink);font:600 13.5px Cairo;cursor:pointer;text-align:start}
        .nv:hover{background:var(--s2)}.nv.act{background:var(--b);color:#fff}.nv em{margin-inline-start:auto;font-style:normal;background:#e08f4f;color:#fff;border-radius:99px;padding:1px 8px;font-size:11.5px}
        .prog small{color:var(--mut)}.bar{height:7px;border-radius:9px;background:var(--s2);overflow:hidden;margin-top:6px}.bar i{display:block;height:100%;background:var(--b);border-radius:9px;transition:width .4s}.bar.big{height:10px;margin:8px 0 12px}
        .main{flex:1;min-width:0}.top{position:sticky;top:0;z-index:5;display:flex;gap:10px;align-items:center;padding:12px 28px;background:color-mix(in srgb,var(--s) 90%,transparent);backdrop-filter:blur(12px);border-bottom:1px solid var(--ln)}
        .srch{flex:1;max-width:460px;text-align:start;height:40px;padding:0 14px;border-radius:12px;border:1px solid var(--ln);background:var(--s);color:var(--mut);font:600 13px Cairo;cursor:pointer}
        .srch kbd{float:left;font-size:11px;background:var(--s2);padding:2px 7px;border-radius:6px}
        .pg{padding:26px 28px 60px;max-width:1200px}h1{font-size:24px;font-weight:800;margin:0 0 18px}h1 small,h3 small{font-size:12.5px;color:var(--mut);font-weight:600;margin-inline-start:8px}h3{margin:0 0 12px;font-size:15.5px;font-weight:800}
        .card{background:var(--s);border:1px solid var(--ln);border-radius:20px;padding:20px;box-shadow:0 10px 30px -16px rgba(6,73,78,.22)}
        .grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:16px}.two{display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start}
        .kpi small{color:var(--mut);font-weight:600}.kpi b{display:block;font-size:26px;font-weight:800;margin:4px 0 6px}.spark{width:100%;height:34px}
        .pls{display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid var(--ln)}.pls:last-child{border:0}.pls p{flex:1;margin:0}.pls small{display:block;color:var(--mut)}
        .btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:38px;padding:0 14px;border-radius:12px;border:1px solid var(--ln);background:var(--s);color:var(--ink);font:700 13px Cairo;cursor:pointer;text-decoration:none;white-space:nowrap}
        .btn:hover{background:var(--s2)}.btn.p{background:var(--b);border-color:var(--b);color:#fff}.btn.p:hover{filter:brightness(.92)}.btn.sm{min-height:32px;padding:0 11px;font-size:12px;border-radius:10px}
        .in{width:100%;min-height:42px;padding:0 13px;border:1px solid var(--ln);border-radius:12px;background:var(--s);color:var(--ink);font:500 14px Cairo}.in.sm{min-height:34px;font-size:12.5px;font-weight:700}.in:focus{outline:0;border-color:var(--b);box-shadow:0 0 0 4px color-mix(in srgb,var(--b) 16%,transparent)}
        .fld{display:block;margin-bottom:12px}.fld span{display:block;margin-bottom:5px;color:var(--mut);font-weight:700;font-size:12.5px}.clr{width:64px;height:42px;border:1px solid var(--ln);border-radius:12px;background:none;cursor:pointer}
        .row{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:12px}.row .fld{flex:1;min-width:90px}
        .chip{border:1px solid var(--ln);background:var(--s);border-radius:99px;padding:6px 14px;font:700 12.5px Cairo;cursor:pointer;color:var(--ink)}.chip.act{background:var(--ink);color:#fff;border-color:var(--ink)}.chip em{font-style:normal;opacity:.6;margin-inline-start:4px}
        .tw{padding:6px;overflow-x:auto}.tbl{width:100%;border-collapse:separate;border-spacing:0;min-width:680px}.tbl th{background:var(--s2);color:var(--mut);font-size:12px;padding:11px 12px;text-align:start}.tbl td{padding:13px 12px;border-bottom:1px solid var(--ln);vertical-align:middle}.tbl tr:last-child td{border:0}.tbl td small{display:block;color:var(--mut)}
        .bulk{display:flex;gap:8px;align-items:center;padding:10px 14px;margin-bottom:12px;background:color-mix(in srgb,var(--b) 10%,var(--s));border:1px solid color-mix(in srgb,var(--b) 30%,transparent);border-radius:14px}
        .warn{color:#c53030;font-weight:800;font-size:12px}.mut{color:var(--mut)}.c{text-align:center;padding:24px}
        .stk{display:inline-flex;align-items:center;gap:8px}.stk button{width:28px;height:28px;border-radius:8px;border:1px solid var(--ln);background:var(--s2);cursor:pointer;font-weight:800}
        .tog{width:44px;height:26px;border-radius:99px;border:0;background:#cfd6d3;position:relative;cursor:pointer;flex:none;transition:.2s}.tog i{position:absolute;top:3px;inset-inline-start:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:.2s}.tog.on{background:var(--b)}.tog.on i{inset-inline-start:21px}
        .stp{display:flex;align-items:center;gap:10px;width:100%;padding:10px 4px;border:0;background:none;font:600 13.5px Cairo;color:var(--ink);cursor:pointer;text-align:start}.stp span{width:22px;height:22px;border-radius:50%;border:2px solid var(--ln);display:grid;place-items:center;font-size:12px;color:#fff}.stp.ok span{background:var(--b);border-color:var(--b)}.stp.ok{color:var(--mut);text-decoration:line-through}
        .pv{border:1px dashed var(--ln);border-radius:16px;padding:14px;margin-bottom:12px;display:grid;gap:8px;background:var(--s2)}
        .ov{position:fixed;inset:0;z-index:50;background:rgba(5,35,38,.55);backdrop-filter:blur(6px);display:grid;place-items:center;padding:16px}.ov.top{align-items:start;padding-top:12vh}
        .mod{width:100%;max-width:480px;max-height:90vh;overflow:auto;background:var(--s);border:1px solid var(--ln);border-radius:24px;padding:24px;box-shadow:0 30px 80px -20px rgba(3,30,33,.55);animation:pop .18s ease-out}.mh{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
        .wz h2{margin:6px 0 4px;font-size:22px}.dots{display:flex;gap:6px;margin-bottom:10px}.dots i{height:5px;flex:1;border-radius:9px;background:var(--s2)}.dots i.on{background:var(--b)}
        .sw{width:42px;height:42px;border-radius:50%;border:3px solid var(--s);box-shadow:0 0 0 1px var(--ln);cursor:pointer}.sw.act{box-shadow:0 0 0 3px var(--ink)}.cm .nv{min-height:40px}
        .toast{position:fixed;bottom:22px;left:50%;transform:translateX(-50%);background:var(--ink);color:#fff;padding:11px 20px;border-radius:14px;font-weight:700;z-index:60}
        @keyframes pop{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}
        @media(max-width:900px){.app{flex-direction:column}.side{width:100%;height:auto;position:static;flex-direction:row;align-items:center;overflow-x:auto}.side nav{flex-direction:row;flex:none}.nv{white-space:nowrap;width:auto}.prog{display:none}.grid4{grid-template-columns:1fr 1fr}.two{grid-template-columns:1fr}.pg,.top{padding-inline:14px}.srch{display:none}}
        @media(prefers-reduced-motion:reduce){.app *{animation:none!important;transition:none!important}}
      `}</style>
    </div>
  );
}
