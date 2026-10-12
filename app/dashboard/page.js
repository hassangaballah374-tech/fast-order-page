'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import MerchantPixelsPanel from '../../components/MerchantPixelsPanel';
import { spikeLogout } from '../../components/SpikeSessionBar';

const ADMIN_EMAIL = 'hassanhosny2007@gmail.com';

const money = (n, c = 'ج.م') => `${Math.round(n).toLocaleString('en-US')} ${c}`;
const NAV = [
  ['home', 'الرئيسية', '🏠'],
  ['orders', 'الطلبات', '📦'],
  ['products', 'المنتجات والهبوط', '🏷️'],
  ['carts', 'السلات المتروكة', '🛒'],
  ['marketing', 'التسويق وعروض الكميات', '📣'],
  ['themes', 'الثيمات وتصميم المتجر', '🎨'],
  ['settings', 'الإعدادات', '⚙️']
];
const ST = { pending: ['جديد', '#b7791f'], confirmed: ['مؤكد', '#0a7f86'], shipped: ['في الشحن', '#6b46c1'], delivered: ['تم التسليم', '#2f855a'], returned: ['مرتجع', '#c53030'] };

const THEMES_LIST = [
  { id: 'modern', name: 'الستايل العصري (Modern Minimal)', bg: '#fcfbf7', primary: '#0a7f86' },
  { id: 'luxury', name: 'الستايل الفاخر (Luxury Gold)', bg: '#1a1a1a', primary: '#d4af37' },
  { id: 'vibrant', name: 'ستايل التخفيضات (Flash Sale)', bg: '#fff5f5', primary: '#e53e3e' },
  { id: 'tech', name: 'ستايل الإلكترونيات (Tech Dark)', bg: '#0f172a', primary: '#38bdf8' },
  { id: 'nature', name: 'ستايل الطبيعة (Eco Organic)', bg: '#f4fbf7', primary: '#2f855a' },
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
  const [uid, setUid] = useState('');
  const [email, setEmail] = useState('');
  const [pixelCount, setPixelCount] = useState(0);
  const isAdmin = email.toLowerCase() === ADMIN_EMAIL;
  const [tab, setTab] = useState('home');
  const [store, setStore] = useState({ name: 'متجري', slug: 'my-store', cat: 'ملابس', color: '#0a7f86', cur: 'ج.م', domain: '', freeShip: 1000, themeId: 'modern' });
  
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [carts] = useState([
    { id: 1, name: 'نور حسن', phone: '01077771111', value: 1120, items: 3, ago: 'من ساعتين' },
  ]);
  const [coupons, setCoupons] = useState([{ code: 'WELCOME10', pct: 10, uses: 12, on: true }]);
  const [zones, setZones] = useState(ZONES);
  const [pay, setPay] = useState({ cod: true, wallet: false, card: false });
  const [fields, setFields] = useState({ phone2: false, email: false, note: true, codFast: true, fakeProtection: true });
  
  const [bundles, setBundles] = useState({ active: true, item2Price: 599, item3Price: 799 });
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [sel, setSel] = useState([]);
  const [wiz, setWiz] = useState(null);
  
  const [pm, setPm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [previewProduct, setPreviewProduct] = useState(null); // نافذة معاينة كعميل

  // حقول معاينة الشراء كعميل
  const [clientOrder, setClientOrder] = useState({ name: '', phone: '', address: '', gov: 'القاهرة والجيزة', selectedSize: '', selectedColor: '', qty: 1 });

  const [cmd, setCmd] = useState(false);
  const [cq, setCq] = useState('');
  const [toast, setToast] = useState('');

  const [np, setNp] = useState({
    name: '', cost: '', comparePrice: '', price: '', stock: 10, colors: 'أسود, أبيض', sizes: 'S, M, L, XL', showBadge: true, media: [], desc: ''
  });

  const [nc, setNc] = useState({ code: '', pct: 10 });

  // جلب البيانات الفعلية من Supabase للمستخدم الحالي
  useEffect(() => {
    let off = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const user = data?.session?.user;
      if (!user) { router.replace('/register'); return; }
      if (off) return;
      const em = user.email || '';
      setEmail(em);
      let storeKey = user.id;
      if (em.toLowerCase() === ADMIN_EMAIL) {
        try { storeKey = localStorage.getItem('merchant_user_id') || 'main_flagship_owner'; } catch { storeKey = 'main_flagship_owner'; }
      }
      setUid(storeKey);

      // جلب بيانات المتجر
      const { data: sp } = await supabase.from('store_profiles').select('*').eq('user_id', storeKey).maybeSingle();
      if (sp && !off) {
        setStore((s) => ({ ...s, name: sp.store_name || s.name, slug: sp.store_slug || s.slug }));
      }

      // جلب المنتجات الحقيقية من Supabase
      const { data: dbProducts } = await supabase.from('products').select('*').eq('store_id', storeKey);
      if (dbProducts && dbProducts.length > 0 && !off) {
        setProducts(dbProducts.map(p => ({
          id: p.id,
          name: p.title || p.name,
          price: p.price,
          comparePrice: p.compare_price || p.price * 1.3,
          cost: p.cost_price || 0,
          stock: p.stock_quantity || 10,
          colors: p.colors || 'أسود',
          sizes: p.sizes || 'M, L',
          showBadge: true,
          media: p.image_url ? [p.image_url] : [],
          desc: p.description || ''
        })));
      }

      // جلب الطلبات الحقيقية من Supabase
      const { data: dbOrders } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (dbOrders && !off) {
        setOrders(dbOrders.map(o => ({
          id: o.id,
          name: o.customer_name,
          phone: o.customer_phone,
          gov: o.governorate || 'القاهرة',
          total: o.total_price,
          cost: 200,
          ship: 50,
          st: o.status || 'pending'
        })));
      }

      if (!off) setReady(true);
    })();
    return () => { off = true; };
  }, [router]);

  useEffect(() => {
    try { setWiz(localStorage.getItem('spike_onboarded') ? 0 : 1); } catch { setWiz(0); }
    const k = (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setCmd((v) => !v); } if (e.key === 'Escape') setCmd(false); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, []);

  const say = (m) => { setToast(m); setTimeout(() => setToast(''), 2200); };
  const finishWiz = () => { try { localStorage.setItem('spike_onboarded', '1'); } catch {} setWiz(0); say('🎉 متجرك جاهز وقوي للبيع!'); setTab('products'); };

  const setSt = async (ids, st) => {
    setOrders((o) => o.map((x) => (ids.includes(x.id) ? { ...x, st } : x)));
    for (let id of ids) {
      await supabase.from('orders').update({ status: st }).eq('id', id);
    }
    setSel([]); say('تم تحديث الطلبات في قاعدة البيانات');
  };

  const dupPhones = useMemo(() => { const c = {}; orders.filter((o) => o.st === 'pending').forEach((o) => (c[o.phone] = (c[o.phone] || 0) + 1)); return Object.keys(c).filter((k) => c[k] > 1); }, [orders]);
  const live = orders.filter((o) => o.st !== 'returned');
  const sales = live.reduce((a, o) => a + o.total, 0);
  const profit = live.reduce((a, o) => a + o.total - o.cost - o.ship, 0);
  const pending = orders.filter((o) => o.st === 'pending');
  const confirmRate = orders.length ? Math.round((orders.filter((o) => ['confirmed', 'shipped', 'delivered'].includes(o.st)).length / orders.length) * 100) : 100;
  const shown = orders.filter((o) => (filter === 'all' || o.st === filter) && (!q || (o.name + o.phone + o.id).includes(q)));
  const wa = (phone, text) => `https://wa.me/2${phone}?text=${encodeURIComponent(text)}`;

  const calcProfit = (+np.price || 0) - (+np.cost || 0);
  const calcDiscountPct = np.comparePrice && np.price ? Math.round(((+np.comparePrice - +np.price) / +np.comparePrice) * 100) : 0;

  // حفظ منتج جديد فعلياً في Supabase
  const addProduct = async (e) => {
    e.preventDefault();
    if (!np.name || !np.price) return say('اكتب اسم المنتج وسعر البيع');
    
    const newProdData = {
      title: np.name,
      price: parseFloat(np.price) || 0,
      compare_price: parseFloat(np.comparePrice) || parseFloat(np.price),
      cost_price: parseFloat(np.cost) || 0,
      stock_quantity: parseInt(np.stock) || 10,
      colors: np.colors,
      sizes: np.sizes,
      description: np.desc,
      store_id: uid,
      status: 'active'
    };

    const { data, error } = await supabase.from('products').insert([newProdData]).select().single();

    if (!error && data) {
      setProducts([{
        id: data.id,
        name: data.title,
        price: data.price,
        comparePrice: data.compare_price,
        cost: data.cost_price,
        stock: data.stock_quantity,
        colors: data.colors,
        sizes: data.sizes,
        showBadge: true,
        media: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'],
        desc: data.description
      }, ...products]);
      setNp({ name: '', cost: '', comparePrice: '', price: '', stock: 10, colors: '', sizes: '', showBadge: true, media: [], desc: '' });
      setPm(false);
      say('✅ تم حفظ المنتج في قاعدة البيانات بنجاح');
    } else {
      say('❌ خطأ أثناء الحفظ: ' + (error?.message || 'تأكد من الاتصال'));
    }
  };

  // حفظ التعديلات على المنتج في Supabase
  const updateProduct = async (e) => {
    e.preventDefault();
    if (!editProduct) return;

    const { error } = await supabase.from('products').update({
      title: editProduct.name,
      price: editProduct.price,
      compare_price: editProduct.comparePrice,
      cost_price: editProduct.cost,
      stock_quantity: editProduct.stock,
      colors: editProduct.colors,
      sizes: editProduct.sizes,
      description: editProduct.desc
    }).eq('id', editProduct.id);

    if (!error) {
      setProducts(products.map((p) => p.id === editProduct.id ? editProduct : p));
      setEditProduct(null);
      say('✅ تم تحديث بيانات المنتج وحفظها في قاعدة البيانات');
    } else {
      say('❌ خطأ في التحديث');
    }
  };

  // محاكاة إتمام طلب حقيقي كعميل من صفحة المعاينة
  const handleClientSubmitOrder = async (e) => {
    e.preventDefault();
    if (!clientOrder.name || !clientOrder.phone) return say('يرجى كتابة الاسم ورقم الهاتف لإتمام الطلب');

    const totalCalculated = previewProduct.price * clientOrder.qty;

    const newOrderPayload = {
      customer_name: clientOrder.name,
      customer_phone: clientOrder.phone,
      governorate: clientOrder.gov,
      address: clientOrder.address || 'القاهرة',
      total_price: totalCalculated,
      status: 'pending',
      store_id: uid
    };

    const { data, error } = await supabase.from('orders').insert([newOrderPayload]).select().single();

    if (!error && data) {
      setOrders([{
        id: data.id,
        name: data.customer_name,
        phone: data.customer_phone,
        gov: data.governorate,
        total: data.total_price,
        cost: previewProduct.cost,
        ship: 50,
        st: 'pending'
      }, ...orders]);

      setPreviewProduct(null);
      setClientOrder({ name: '', phone: '', address: '', gov: 'القاهرة والجيزة', selectedSize: '', selectedColor: '', qty: 1 });
      say('🎉 تم استلام طلبك بنجاح! تم إضافته لجدول الطلبات في الداشبورد');
      setTab('orders');
    } else {
      say('❌ لم يتم تسجيل الطلب: ' + (error?.message || ''));
    }
  };

  if (!ready) {
    return <div className="app" dir="rtl" style={{ '--b': store.color, alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>جاري مزامنة بيانات متجرك من قاعدة البيانات...</div>;
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
      </aside>

      <main className="main">
        <header className="top">
          <button className="srch" onClick={() => setCmd(true)}>🔎 ابحث أو نفّذ أمرًا متقدمًا… <kbd>Ctrl K</kbd></button>
          <a className="btn" href={`https://${store.slug}.spike.shop`} target="_blank" rel="noreferrer">👁️ معاينة المتجر الحي</a>
          <button className="btn p" onClick={() => { setTab('products'); setPm(true); }}>+ منتج جديد</button>
          {isAdmin && <button className="btn" onClick={() => router.push('/admin')}>🛡️ لوحة الإدارة</button>}
          <button className="btn" style={{ color: '#c53030' }} onClick={() => spikeLogout(router)}>🚪 خروج</button>
        </header>

        <section className="pg">
          {tab === 'home' && (<>
            <h1>أهلاً بك في منصة مبيعاتك الخارقة 🚀 <small>بيانات متصلة بقاعدة البيانات الحية</small></h1>
            <div className="grid4">
              {[['إجمالي المبيعات', money(sales), [3, 5, 4, 7, 6, 9, 8]], ['صافي الأرباح', money(profit), [2, 3, 3, 4, 5, 5, 7]], ['نسبة التأكيد', `${confirmRate}%`, [6, 5, 7, 6, 8, 7, 9]], ['طلبات جديدة (COD)', pending.length, [1, 3, 2, 4, 3, 5, 4]]].map(([t, v, d]) => (
                <div className="card kpi" key={t}><small>{t}</small><b>{v}</b><Spark d={d} c={store.color} /></div>
              ))}
            </div>
          </>)}

          {tab === 'orders' && (<>
            <h1>الطلبات الحية (من قاعدة البيانات)</h1>
            <div className="row">
              {[['all', 'الكل', orders.length], ...Object.entries(ST).map(([k, v]) => [k, v[0], orders.filter((o) => o.st === k).length])].map(([k, t, n]) => (
                <button key={k} className={'chip' + (filter === k ? ' act' : '')} onClick={() => setFilter(k)}>{t} <em>{n}</em></button>
              ))}
              <input className="in" style={{ marginInlineStart: 'auto', maxWidth: 220 }} placeholder="بحث بالاسم أو الهاتف…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <div className="card tw"><table className="tbl"><thead><tr><th /><th>#</th><th>العميل ورقم الهاتف</th><th>المحافظة</th><th>الإجمالي</th><th>الربح</th><th>الحالة</th><th /></tr></thead>
              <tbody>{shown.map((o) => (
                <tr key={o.id}>
                  <td><input type="checkbox" checked={sel.includes(o.id)} onChange={(e) => setSel(e.target.checked ? [...sel, o.id] : sel.filter((x) => x !== o.id))} /></td>
                  <td className="num">#{o.id}</td>
                  <td><b>{o.name}</b> <small className="num" dir="ltr">{o.phone}</small></td>
                  <td>{o.gov}</td><td className="num">{money(o.total)}</td>
                  <td className="num" style={{ color: '#2f855a' }}>{money(o.total - o.cost - o.ship)}</td>
                  <td><select className="in sm" style={{ color: ST[o.st][1] }} value={o.st} onChange={(e) => setSt([o.id], e.target.value)}>{Object.entries(ST).map(([k, v]) => <option key={k} value={k}>{v[0]}</option>)}</select></td>
                  <td><a className="btn sm" target="_blank" rel="noreferrer" href={wa(o.phone, `أهلاً ${o.name}، نؤكد طلبك رقم ${o.id} من ${store.name} بقيمة ${money(o.total)}. هل نؤكد الشحن؟`)}>💬 واتساب</a></td>
                </tr>))}</tbody></table>
            </div>
          </>)}

          {tab === 'products' && (<>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h1>إدارة المنتجات وصفحات الهبوط <small>{products.length} منتج مسجل في الدาตาبيز</small></h1>
              <button className="btn p" onClick={() => setPm(true)}>+ إضافة منتج جديد</button>
            </div>
            <div className="card tw"><table className="tbl"><thead><tr><th>المنتج والمقاسات</th><th>الأسعار</th><th>الربح</th><th>المخزون</th><th>الإجراءات والعميل</th></tr></thead>
              <tbody>{products.map((p) => (
                <tr key={p.id}>
                  <td><b>{p.name}</b><small>ألوان: {p.colors || 'عام'} · مقاسات: {p.sizes || 'عام'}</small></td>
                  <td className="num"><span style={{ textDecoration: 'line-through', color: '#999', fontSize: 11, marginInlineEnd: 6 }}>{money(p.comparePrice)}</span><b>{money(p.price)}</b></td>
                  <td className="num" style={{ color: '#2f855a', fontWeight: 800 }}>{money(p.price - p.cost)}</td>
                  <td><div className="stk">
                    <button onClick={() => setProducts(products.map((x) => (x.id === p.id ? { ...x, stock: Math.max(0, x.stock - 1) } : x)))}>−</button>
                    <b className={p.stock <= 5 ? 'warn' : ''}>{p.stock}</b>
                    <button onClick={() => setProducts(products.map((x) => (x.id === p.id ? { ...x, stock: x.stock + 1 } : x)))}>+</button></div></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn sm" onClick={() => setEditProduct({ ...p })}>✏️ تعديل</button>
                      <button className="btn sm p" onClick={() => setPreviewProduct(p)}>🌐 معاينة كعميل</button>
                      <button className="btn sm" style={{ color: '#c53030' }} onClick={() => { setProducts(products.filter((x) => x.id !== p.id)); say('تم الحذف'); }}>حذف</button>
                    </div>
                  </td>
                </tr>))}</tbody></table>
            </div>
          </>)}

          {tab === 'carts' && (<><h1>السلات المتروكة</h1><div className="card">لا توجد سلات متروكة حالياً.</div></>)}
          {tab === 'marketing' && (<><h1>التسويق وعروض الكميات</h1><div className="card"><MerchantPixelsPanel storeId={uid} isAr canEdit onCount={setPixelCount} /></div></>)}
          {tab === 'themes' && (<><h1>الثيمات</h1><div className="grid4">{THEMES_LIST.map(th => <div key={th.id} className="card" onClick={() => { setStore({...store, color: th.primary}); say(`تم تطبيق ${th.name}`); }}><b>{th.name}</b></div>)}</div></>)}
          {tab === 'settings' && (<><h1>الإعدادات</h1><div className="card"><p>الإعدادات مرتبطة بقاعدة البيانات.</p></div></>)}
        </section>
      </main>

      {/* مودال إضافة منتج جديد */}
      {pm && (<Modal t="إضافة منتج جديد وحفظه في قاعدة البيانات" x={() => setPm(false)}><form onSubmit={addProduct}>
        <Field l="اسم المنتج"><input className="in" value={np.name} onChange={(e) => setNp({ ...np, name: e.target.value })} autoFocus placeholder="اسم المنتج التسويقي" /></Field>
        <div className="row">
          <Field l="1. التكلفة"><input className="in num" type="number" value={np.cost} onChange={(e) => setNp({ ...np, cost: e.target.value })} placeholder="150" /></Field>
          <Field l="2. قبل الخصم"><input className="in num" type="number" value={np.comparePrice} onChange={(e) => setNp({ ...np, comparePrice: e.target.value })} placeholder="600" /></Field>
          <Field l="3. بعد الخصم (سعر البيع)"><input className="in num" type="number" value={np.price} onChange={(e) => setNp({ ...np, price: e.target.value })} placeholder="450" /></Field>
        </div>
        <div className="row">
          <Field l="المخزون"><input className="in num" type="number" value={np.stock} onChange={(e) => setNp({ ...np, stock: e.target.value })} /></Field>
          <Field l="الألوان"><input className="in" value={np.colors} onChange={(e) => setNp({ ...np, colors: e.target.value })} placeholder="أحمر، أسود" /></Field>
          <Field l="المقاسات"><input className="in" value={np.sizes} onChange={(e) => setNp({ ...np, sizes: e.target.value })} placeholder="S, M, L, XL" /></Field>
        </div>
        <Field l="وصف صفحة الهبوط التسويقي"><textarea className="in" value={np.desc} onChange={(e) => setNp({ ...np, desc: e.target.value })} /></Field>
        <div className="row" style={{ background: 'var(--s2)', padding: 10, borderRadius: 12, justifyContent: 'space-between' }}>
          <span>صافي الربح: <b style={{ color: '#2f855a' }}>{money(calcProfit)}</b></span>
          {calcDiscountPct > 0 && <span>نسبة الخصم: <b style={{ color: '#e53e3e' }}>{calcDiscountPct}%</b></span>}
        </div>
        <button className="btn p" style={{ width: '100%', marginTop: 12 }}>حفظ في الدาตาبيز ونشر المنتج</button></form></Modal>)}

      {/* مودال تعديل المنتج */}
      {editProduct && (<Modal t="تعديل المنتج وحفظه في قاعدة البيانات" x={() => setEditProduct(null)}><form onSubmit={updateProduct}>
        <Field l="اسم المنتج"><input className="in" value={editProduct.name} onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })} /></Field>
        <div className="row">
          <Field l="التكلفة"><input className="in num" type="number" value={editProduct.cost} onChange={(e) => setEditProduct({ ...editProduct, cost: +e.target.value })} /></Field>
          <Field l="قبل الخصم"><input className="in num" type="number" value={editProduct.comparePrice} onChange={(e) => setEditProduct({ ...editProduct, comparePrice: +e.target.value })} /></Field>
          <Field l="بعد الخصم"><input className="in num" type="number" value={editProduct.price} onChange={(e) => setEditProduct({ ...editProduct, price: +e.target.value })} /></Field>
        </div>
        <div className="row">
          <Field l="المخزون"><input className="in num" type="number" value={editProduct.stock} onChange={(e) => setEditProduct({ ...editProduct, stock: +e.target.value })} /></Field>
          <Field l="الألوان"><input className="in" value={editProduct.colors} onChange={(e) => setEditProduct({ ...editProduct, colors: e.target.value })} /></Field>
          <Field l="المقاسات"><input className="in" value={editProduct.sizes} onChange={(e) => setEditProduct({ ...editProduct, sizes: e.target.value })} /></Field>
        </div>
        <Field l="الوصف"><textarea className="in" value={editProduct.desc} onChange={(e) => setEditProduct({ ...editProduct, desc: e.target.value })} /></Field>
        <button className="btn p" style={{ width: '100%', marginTop: 12 }}>حفظ التعديلات في قاعدة البيانات</button></form></Modal>)}

      {/* نافذة معاينة صفحة الهبوط كعميل وإمكانية إتمام الشراء الفعلي وتوليد طلب في الداشبورد */}
      {previewProduct && (
        <div className="ov" onClick={() => setPreviewProduct(null)}>
          <div className="mod" style={{ maxWidth: 760, padding: 32, background: '#fff' }} onClick={(e) => e.stopPropagation()}>
            <div className="mh">
              <span style={{ background: 'var(--b)', color: '#fff', padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 800 }}>معاينة المتجر كعميل (حقيقي)</span>
              <button className="btn sm" onClick={() => setPreviewProduct(null)}>إغلاق المعاينة ✕</button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 16 }}>
              <div>
                <img src={previewProduct.media?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'} alt="product" style={{ width: '100%', height: 260, objectFit: 'cover', borderRadius: 16, border: '1px solid var(--ln)' }} />
                <h2 style={{ fontSize: 20, fontWeight: 900, margin: '12px 0 6px' }}>{previewProduct.name}</h2>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                  <span className="num" style={{ fontSize: 18, fontWeight: 900, color: 'var(--b)' }}>{money(previewProduct.price)}</span>
                  <span className="num" style={{ textDecoration: 'line-through', color: '#888', fontSize: 13 }}>{money(previewProduct.comparePrice)}</span>
                </div>
                <p style={{ color: '#666', fontSize: 12, lineHeight: 1.5 }}>{previewProduct.desc || 'لا يوجد وصف مضاف'}</p>
              </div>

              <div style={{ background: 'var(--s2)', padding: 16, borderRadius: 16, border: '1px solid var(--ln)' }}>
                <b style={{ display: 'block', marginBottom: 10, fontSize: 14 }}>🛒 استمارة الشراء السريع (COD)</b>
                <form onSubmit={handleClientSubmitOrder} style={{ display: 'grid', gap: 8 }}>
                  <input className="in sm" required placeholder="الاسم الكامل" value={clientOrder.name} onChange={e => setClientOrder({...clientOrder, name: e.target.value})} />
                  <input className="in sm num" required placeholder="رقم الهاتف (واتساب)" dir="ltr" value={clientOrder.phone} onChange={e => setClientOrder({...clientOrder, phone: e.target.value})} />
                  <select className="in sm" value={clientOrder.gov} onChange={e => setClientOrder({...clientOrder, gov: e.target.value})}>
                    {ZONES.map(z => <option key={z[0]} value={z[0]}>{z[0]} (+{z[1]} ج.م شحن)</option>)}
                  </select>
                  <input className="in sm" placeholder="العنوان بالتفصيل" value={clientOrder.address} onChange={e => setClientOrder({...clientOrder, address: e.target.value})} />

                  {previewProduct.sizes && (
                    <div>
                      <small style={{ fontWeight: 700 }}>المقاس:</small>
                      <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                        {previewProduct.sizes.split(',').map((s, idx) => (
                          <button key={idx} type="button" className={`btn sm ${clientOrder.selectedSize === s.trim() ? 'p' : ''}`} onClick={() => setClientOrder({...clientOrder, selectedSize: s.trim()})}>{s.trim()}</button>
                        ))}
                      </div>
                    </div>
                  )}

                  <button className="btn p" style={{ width: '100%', marginTop: 8, minHeight: 42 }}>تأكيد وإتمام الطلب (الدفع عند الاستلام)</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

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
        .fld{display:block;margin-bottom:12px}.fld span{display:block;margin-bottom:5px;color:var(--mut);font-weight:700;font-size:12.5px}
        .row{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:12px}.row .fld{flex:1;min-width:90px}
        .chip{border:1px solid var(--ln);background:var(--s);border-radius:99px;padding:6px 14px;font:700 12.5px Cairo;cursor:pointer;color:var(--ink)}.chip.act{background:var(--ink);color:#fff;border-color:var(--ink)}.chip em{font-style:normal;opacity:.6;margin-inline-start:4px}
        .tw{padding:6px;overflow-x:auto}.tbl{width:100%;border-collapse:separate;border-spacing:0;min-width:680px}.tbl th{background:var(--s2);color:var(--mut);font-size:12px;padding:11px 12px;text-align:start}.tbl td{padding:13px 12px;border-bottom:1px solid var(--ln);vertical-align:middle}
        .warn{color:#c53030;font-weight:800;font-size:12px}.mut{color:var(--mut)}
        .stk{display:inline-flex;align-items:center;gap:8px}.stk button{width:28px;height:28px;border-radius:8px;border:1px solid var(--ln);background:var(--s2);cursor:pointer;font-weight:800}
        .ov{position:fixed;inset:0;z-index:50;background:rgba(5,35,38,.55);backdrop-filter:blur(6px);display:grid;place-items:center;padding:16px}
        .mod{width:100%;max-width:560px;max-height:90vh;overflow:auto;background:var(--s);border:1px solid var(--ln);border-radius:24px;padding:24px;box-shadow:0 30px 80px -20px rgba(3,30,33,.55)}
        .mh{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
        .toast{position:fixed;bottom:22px;left:50%;transform:translateX(-50%);background:var(--ink);color:#fff;padding:11px 20px;border-radius:14px;font-weight:700;z-index:60}
      `}</style>
    </div>
  );
}
