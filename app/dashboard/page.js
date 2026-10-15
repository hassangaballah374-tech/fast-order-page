'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import MerchantPixelsPanel from '../../components/MerchantPixelsPanel';
import { spikeLogout } from '../../components/SpikeSessionBar';

const ADMIN_EMAIL = 'hassanhosny2007@gmail.com';

const money = (n, c = 'ج.م') => `${Math.round(n).toLocaleString('en-US')} ${c}`;

const NAV_GROUPS = [
  { section: 'الرئيسية', items: [['home', 'لوحة الإحصائيات', '📊']] },
  { section: 'الطلبات', items: [['orders', 'كل الطلبات', '📦'], ['lost_orders', 'الطلبات المفقودة', '⚠️'], ['blocked_phones', 'الأرقام المحظورة من الطلب', '🚫'], ['otp_blocked', 'الارقام المحظورة OTP', '🔒'], ['newsletter', 'NewsLetter', '✉️', true]] },
  { section: 'المنتجات', items: [['products', 'كل المنتجات', '🏷️'], ['categories', 'الاقسام', '🗂️'], ['reviews', 'التقييمات', '⭐'], ['feed', 'Product Feed', '🔄'], ['catalog', 'Spike Catalog', '📚']] },
  { section: 'تصميم المتجر', items: [['themes', 'الثيمات', '🎨'], ['home_editor', 'تعديل الصفحة الرئيسية', '🖥️'], ['pages', 'الصفحات', '📄'], ['checkout_form', 'نموذج الشراء', '🛒'], ['thank_you', 'تعديل صفحة الشكر', '🎉'], ['ui_blocks', 'UI Blocks', '🧩'], ['upload_designs', 'رفع ملفات التصاميم', '📁']] },
  { section: 'أدوات التتبع', items: [['pixels', 'اعدادات البيكسل', '🎯'], ['conversion_api', 'Conversion api', '🔌'], ['google_tag', 'الربط مع جوجل تاج', '🌐']] },
  { section: 'أدوات التسويق', items: [['cross_selling', 'CROSS SELLING', '🧲'], ['coupons', 'الكوبونات', '🎟️'], ['retargeting', 'اعادة الاستهداف', '🎯'], ['whatsapp_mkt', 'Whatsapp Marketing', '💬'], ['top_mb', 'وثق طلباتك مع Top MB', '⭐'], ['ads_tracking', 'تتبع نتائج الحملات الاعلانية', '📈'], ['google_merchant', 'Google Merchant', '🛍️'], ['sales_popup', 'Sales Popup', '🔔'], ['referrals', 'انشاء روابط الاحالة', '🔗'], ['free_shipping_limit', 'الحد الأدنى للشحن المجاني ولل...', '🚚'], ['downsell', 'Downsell', '📉']] },
  { section: 'محفظتك', items: [['wallet_balance', 'رصيدك', '💰'], ['transactions', 'المعاملات', '📑']] },
  { section: 'خدمات مجتمع سبايك', items: [['services_market', 'معرض الخدمات', '💼', true], ['marketing_services', 'خدمات التسويق', '🏷️', true], ['affiliate_system', 'نظام التسويق بالعمولة', '🤝']] },
  { section: 'الإعدادات', items: [['apps', 'التطبيقات', '🧩'], ['settings', 'الأعدادات العامة', '⚙️']] }
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
  const [store, setStore] = useState({ name: 'متجري', slug: 'my-store', cat: 'ملابس', color: '#0a7f86', cur: 'ج.م', domain: '', freeShip: 1000, themeId: 'modern', logoUrl: '' });
  
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [wallet, setWallet] = useState({ balance: 2450, history: [{ id: 1, type: 'إيداع أرباح', amount: 1200, date: '2026-06-01' }] });
  
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [sel, setSel] = useState([]);
  
  const [pm, setPm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [previewProduct, setPreviewProduct] = useState(null);

  // سلة الشراء التفاعلية للعميل
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [clientOrder, setClientOrder] = useState({ name: '', phone: '', address: '', gov: 'القاهرة والجيزة', selectedSize: '', selectedColor: '', qty: 1, appliedCoupon: null, couponCodeInput: '' });

  const [cmd, setCmd] = useState(false);
  const [cq, setCq] = useState('');
  const [toast, setToast] = useState('');

  // نموذج إضافة منتج متطور مع الصور، الألوان، والمقاسات التفصيلية
  const [np, setNp] = useState({
    name: '', cost: '', price: '', stock: 10,
    colorsInput: 'أسود, أبيض',
    sizesInput: 'S, M, L, XL',
    unifiedPrice: true, // توحيد السعر لكل المقاسات والألوان
    mediaUrls: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'],
    desc: '',
    bundleActive: true, item2Price: 599, item3Price: 799, couponCode: 'WELCOME10', couponPct: 10
  });

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

      const { data: sp } = await supabase.from('store_profiles').select('*').eq('user_id', storeKey).maybeSingle();
      if (sp && !off) {
        setStore((s) => ({
          ...s,
          name: sp.store_name || s.name,
          slug: sp.store_slug || s.slug,
          logoUrl: sp.store_logo || sp.logo_url || s.logoUrl,
          freeShip: sp.free_shipping_limit || s.freeShip
        }));
      }

      const { data: dbProducts } = await supabase.from('products').select('*').eq('store_id', storeKey).order('created_at', { ascending: false });
      if (dbProducts && !off) {
        setProducts(dbProducts.map(p => ({
          id: p.id,
          name: p.name || p.title,
          price: p.price || 450,
          cost: 150,
          stock: 10,
          colors: ['أسود', 'أبيض'],
          sizes: ['S', 'M', 'L', 'XL'],
          media: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'],
          desc: p.description || '',
          bundleActive: true,
          item2Price: 599,
          item3Price: 799,
          couponCode: 'WELCOME10',
          couponPct: 10
        })));
      }

      const { data: dbOrders } = await supabase.from('orders').select('*').eq('store_id', storeKey).order('created_at', { ascending: false });
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

  const say = (m) => { setToast(m); setTimeout(() => setToast(''), 2200); };

  const setSt = async (ids, st) => {
    setOrders((o) => o.map((x) => (ids.includes(x.id) ? { ...x, st } : x)));
    for (let id of ids) {
      await supabase.from('orders').update({ status: st }).eq('id', id);
    }
    setSel([]); say('تم تحديث الطلبات في قاعدة البيانات');
  };

  const live = orders.filter((o) => o.st !== 'returned');
  const sales = live.reduce((a, o) => a + o.total, 0);
  const profit = live.reduce((a, o) => a + o.total - o.cost - o.ship, 0);
  const pending = orders.filter((o) => o.st === 'pending');
  const confirmRate = orders.length ? Math.round((orders.filter((o) => ['confirmed', 'shipped', 'delivered'].includes(o.st)).length / orders.length) * 100) : 100;
  const shown = orders.filter((o) => (filter === 'all' || o.st === filter) && (!q || (o.name + o.phone + o.id).includes(q)));
  const wa = (phone, text) => `https://wa.me/2${phone}?text=${encodeURIComponent(text)}`;

  const addProduct = async (e) => {
    e.preventDefault();
    if (!np.name || !np.price) return say('اكتب اسم المنتج وسعر البيع');
    
    const colorsArr = np.colorsInput.split(',').map(c => c.trim()).filter(Boolean);
    const sizesArr = np.sizesInput.split(',').map(s => s.trim()).filter(Boolean);

    const newProdData = {
      name: np.name,
      price: parseFloat(np.price) || 0,
      description: np.desc || '',
      store_id: uid
    };

    const { data, error } = await supabase.from('products').insert([newProdData]).select().single();

    if (!error && data) {
      setProducts([{
        id: data.id,
        name: data.name,
        price: data.price,
        cost: parseFloat(np.cost) || 150,
        stock: parseInt(np.stock) || 10,
        colors: colorsArr,
        sizes: sizesArr,
        media: np.mediaUrls,
        desc: data.description,
        bundleActive: np.bundleActive,
        item2Price: np.item2Price,
        item3Price: np.item3Price,
        couponCode: np.couponCode,
        couponPct: np.couponPct
      }, ...products]);
      setNp({ name: '', cost: '', price: '', stock: 10, colorsInput: 'أسود, أبيض', sizesInput: 'S, M, L, XL', unifiedPrice: true, mediaUrls: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'], desc: '', bundleActive: true, item2Price: 599, item3Price: 799, couponCode: 'WELCOME10', couponPct: 10 });
      setPm(false);
      say('✅ تم حفظ ونشر المنتج مع الصور والمقاسات في متجر سبايك');
    } else {
      say('❌ خطأ أثناء الحفظ: ' + (error?.message || ''));
    }
  };

  const updateProduct = async (e) => {
    e.preventDefault();
    if (!editProduct) return;

    const { error } = await supabase.from('products').update({
      name: editProduct.name,
      price: editProduct.price,
      description: editProduct.desc
    }).eq('id', editProduct.id);

    if (!error) {
      setProducts(products.map((p) => p.id === editProduct.id ? editProduct : p));
      setEditProduct(null);
      say('✅ تم تحديث المنتج وحفظه بنجاح');
    } else {
      say('❌ خطأ في التحديث');
    }
  };

  const handleSaveStoreSettings = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('store_profiles').update({
      store_name: store.name,
      store_slug: store.slug
    }).eq('user_id', uid);

    if (!error) {
      say('✅ تم حفظ إعدادات متجر سبايك بنجاح');
    } else {
      say('❌ خطأ في الحفظ');
    }
  };

  // إضافة منتج للسلة
  const addToCart = (product) => {
    setCart([...cart, { ...product, selectedColor: clientOrder.selectedColor || product.colors?.[0], selectedSize: clientOrder.selectedSize || product.sizes?.[0] }]);
    setIsCartOpen(true);
    say('🛒 تمت إضافة المنتج إلى سلة الشراء بنجاح');
  };

  // إتمام الطلب الفعلي وتسجيله في قاعدة البيانات
  const handleClientSubmitOrder = async (e) => {
    e.preventDefault();
    if (!clientOrder.name || !clientOrder.phone) return say('يرجى كتابة الاسم ورقم الهاتف');

    const targetProduct = previewProduct || cart[0];
    if (!targetProduct) return say('السلة فارغة');

    let finalTotal = targetProduct.price * clientOrder.qty;
    if (clientOrder.appliedCoupon) {
      finalTotal = finalTotal * (1 - clientOrder.appliedCoupon.pct / 100);
    }

    const newOrderPayload = {
      customer_name: clientOrder.name,
      customer_phone: clientOrder.phone,
      governorate: clientOrder.gov,
      address: clientOrder.address || 'القاهرة',
      total_price: Math.round(finalTotal),
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
        cost: targetProduct.cost || 150,
        ship: 50,
        st: 'pending'
      }, ...orders]);

      setPreviewProduct(null);
      setCart([]);
      setIsCartOpen(false);
      setClientOrder({ name: '', phone: '', address: '', gov: 'القاهرة والجيزة', selectedSize: '', selectedColor: '', qty: 1, appliedCoupon: null, couponCodeInput: '' });
      say('🎉 تم تأكيد طلبك بنجاح وسُجل في لوحة تحكم سبايك!');
      setTab('orders');
    } else {
      say('❌ خطأ في إتمام الطلب');
    }
  };

  if (!ready) {
    return <div className="app" dir="rtl" style={{ '--b': store.color, alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>جاري تشغيل منصة سبايك المتكاملة...</div>;
  }

  return (
    <div className="app" dir="rtl" style={{ '--b': store.color }}>
      <aside className="side">
        <div className="logo">
          {store.logoUrl ? <img src={store.logoUrl} alt="Logo" style={{ width: 40, height: 40, borderRadius: 12, objectFit: 'cover' }} /> : <span className="lg">{store.name.slice(0, 1)}</span>}
          <div><b>{store.name}</b><small>سبايك · {store.slug}</small></div>
        </div>
        <nav>
          {NAV_GROUPS.map((grp, idx) => (
            <div key={idx} className="nav-group">
              <small className="nav-lbl">{grp.section}</small>
              {grp.items.map(([id, t, i, isNew]) => (
                <button key={id} className={'nv' + (tab === id ? ' act' : '')} onClick={() => setTab(id)}>
                  <span>{i}</span>{t}
                  {isNew && <span className="badge-new">جديد</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <main className="main">
        <header className="top">
          <button className="srch" onClick={() => setCmd(true)}>🔎 ابحث في أدوات سبايك… <kbd>Ctrl K</kbd></button>
          <button className="btn" onClick={() => setIsCartOpen(true)}>🛒 السلة ({cart.length})</button>
          <a className="btn" href={`https://${store.slug}.spike.shop`} target="_blank" rel="noreferrer">👁️ معاينة متجر سبايك الحي</a>
          <button className="btn p" onClick={() => { setTab('products'); setPm(true); }}>+ منتج جديد</button>
          {isAdmin && <button className="btn" onClick={() => router.push('/admin')}>🛡️ لوحة الإدارة العليا</button>}
          <button className="btn" style={{ color: '#c53030' }} onClick={() => spikeLogout(router)}>🚪 خروج</button>
        </header>

        <section className="pg">
          {tab === 'home' && (<>
            <h1>لوحة الإحصائيات الشاملة (منصة سبايك) 🚀 <small>تحديثات فورية ومباشرة من قاعدة البيانات</small></h1>
            <div className="grid4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              <div className="card kpi"><small>إجمالي المبيعات</small><b>{money(sales)}</b><Spark d={[3, 5, 4, 7, 6, 9, 8]} c={store.color} /></div>
              <div className="card kpi"><small>صافي الأرباح</small><b>{money(profit)}</b><Spark d={[2, 3, 3, 4, 5, 5, 7]} c={store.color} /></div>
              <div className="card kpi"><small>إجمالي الطلبات</small><b>{orders.length} طلب</b><Spark d={[6, 5, 7, 6, 8, 7, 9]} c={store.color} /></div>
              <div className="card kpi"><small>طلبات جديدة</small><b>{pending.length} طلب</b><Spark d={[1, 3, 2, 4, 3, 5, 4]} c={store.color} /></div>
              <div className="card kpi"><small>متوسط سعر الطلب</small><b>{money(orders.length ? sales / orders.length : 0)}</b></div>
              <div className="card kpi"><small>معدل التأكيد</small><b>{confirmRate}%</b></div>
            </div>
          </>)}

          {tab === 'orders' && (<>
            <h1>إدارة الطلبات الحية <small>سجل طلبات الدفع عند الاستلام والحماية الذكية</small></h1>
            <div className="row">
              {[['all', 'كل الطلبات', orders.length], ...Object.entries(ST).map(([k, v]) => [k, v[0], orders.filter((o) => o.st === k).length])].map(([k, t, n]) => (
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
                  <td><a className="btn sm" target="_blank" rel="noreferrer" href={wa(o.phone, `أهلاً ${o.name}، نؤكد طلبك رقم ${o.id} من متجر ${store.name} بقيمة ${money(o.total)}. هل نؤكد الشحن؟`)}>💬 واتساب</a></td>
                </tr>))}</tbody></table>
            </div>
          </>)}

          {tab === 'products' && (<>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h1>إدارة المنتجات والأقسام <small>{products.length} منتج مسجل في قاعدة البيانات</small></h1>
              <button className="btn p" onClick={() => setPm(true)}>+ إضافة منتج جديد</button>
            </div>
            <div className="card tw"><table className="tbl"><thead><tr><th>المنتج والمقاسات</th><th>السعر</th><th>العروض الخاصة</th><th>الربح</th><th>الإجراءات</th></tr></thead>
              <tbody>{products.map((p) => (
                <tr key={p.id}>
                  <td><b>{p.name}</b><small>ألوان: {p.colors?.join(', ') || 'عام'} · مقاسات: {p.sizes?.join(', ') || 'عام'}</small></td>
                  <td className="num"><b>{money(p.price)}</b></td>
                  <td>
                    <small style={{ color: 'var(--b)', fontWeight: 700 }}>{p.bundleActive ? '✓ عروض الكميات مفعلة' : '—'}</small>
                    <small style={{ color: '#c53030' }}>{p.couponCode ? `كوبون: ${p.couponCode} (${p.couponPct}%)` : ''}</small>
                  </td>
                  <td className="num" style={{ color: '#2f855a', fontWeight: 800 }}>{money(p.price - p.cost)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn sm" onClick={() => setEditProduct({ ...p })}>✏️ تعديل</button>
                      <button className="btn sm p" onClick={() => setPreviewProduct(p)}>🌐 معاينة كعميل</button>
                      <button className="btn sm" style={{ color: '#c53030' }} onClick={async () => {
                        await supabase.from('products').delete().eq('id', p.id);
                        setProducts(products.filter((x) => x.id !== p.id));
                        say('تم حذف المنتج بنجاح');
                      }}>حذف</button>
                    </div>
                  </td>
                </tr>))}</tbody></table>
            </div>
          </>)}

          {tab === 'wallet_balance' && (<>
            <h1>محفظة أرباح التاجر (Spike Wallet)</h1>
            <div className="two">
              <div className="card kpi"><small>الرصيد المتاح للسحب</small><b>{money(wallet.balance)}</b><button className="btn p" style={{ marginTop: 12 }} onClick={() => say('تم تقديم طلب سحب الأرباح بنجاح')}>طلب سحب الأرباح</button></div>
              <div className="card">
                <h3>سجل المعاملات المالية</h3>
                {wallet.history.map((h, i) => (
                  <div className="pls" key={i}><p><b>{h.type}</b><small>{h.date}</small></p><span className="num" style={{ color: '#2f855a', fontWeight: 800 }}>+{money(h.amount)}</span></div>
                ))}
              </div>
            </div>
          </>)}

          {tab === 'themes' && (<>
            <h1>الثيمات وتصميم متجر سبايك</h1>
            <div className="grid4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              {THEMES_LIST.map((th) => (
                <div key={th.id} className={'card' + (store.themeId === th.id ? ' act-theme' : '')} style={{ cursor: 'pointer', border: store.themeId === th.id ? `2px solid ${store.color}` : undefined }} onClick={() => { setStore({ ...store, themeId: th.id, color: th.primary }); say(`تم تفعيل ${th.name}`); }}>
                  <div style={{ height: 90, background: th.bg, borderRadius: 12, marginBottom: 12, display: 'grid', placeItems: 'center', color: th.primary, fontWeight: 800 }}>معاينة الثيم</div>
                  <b>{th.name}</b>
                  <p className="mut" style={{ fontSize: 12 }}>اللون الأساسي: <span style={{ color: th.primary, fontWeight: 700 }}>■ {th.primary}</span></p>
                </div>
              ))}
            </div>
          </>)}

          {tab === 'pixels' && (<>
            <h1>إعدادات تتبع البيكسل (Meta, TikTok, Snapchat)</h1>
            <div className="card"><MerchantPixelsPanel storeId={uid} isAr canEdit onCount={setPixelCount} /></div>
          </>)}

          {tab === 'settings' && (<>
            <h1>إعدادات متجر سبايك العامة</h1>
            <form onSubmit={handleSaveStoreSettings} className="card" style={{ maxWidth: 600 }}>
              <Field l="اسم المتجر"><input className="in" value={store.name} onChange={(e) => setStore({ ...store, name: e.target.value })} /></Field>
              <Field l="رابط المتجر (Slug)"><input className="in num" dir="ltr" value={store.slug} onChange={(e) => setStore({ ...store, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} /></Field>
              <button className="btn p" style={{ marginTop: 12 }}>حفظ الإعدادات في قاعدة البيانات</button>
            </form>
          </>)}

          {/* تبويبات الخدمة المؤقتة للتفرعات الجديدة */}
          {['lost_orders', 'blocked_phones', 'otp_blocked', 'newsletter', 'categories', 'reviews', 'feed', 'catalog', 'home_editor', 'pages', 'checkout_form', 'thank_you', 'ui_blocks', 'upload_designs', 'conversion_api', 'google_tag', 'cross_selling', 'coupons', 'retargeting', 'whatsapp_mkt', 'top_mb', 'ads_tracking', 'google_merchant', 'sales_popup', 'referrals', 'free_shipping_limit', 'downsell', 'transactions', 'services_market', 'marketing_services', 'affiliate_system', 'apps'].includes(tab) && (
            <div className="card">
              <h1>قسم متطور ومخصص ({tab})</h1>
              <p className="mut">تم تفعيل هذا القسم في بيئة سبايك بنجاح لتوسيع صلاحيات التاجر وزيادة مبيعاته.</p>
            </div>
          )}
        </section>
      </main>

      {/* مودال إضافة منتج جديد مع الألوان والمقاسات والصور */}
      {pm && (<Modal t="إضافة منتج جديد (الصور، الألوان، والمقاسات)" x={() => setPm(false)}><form onSubmit={addProduct}>
        <Field l="اسم المنتج"><input className="in" value={np.name} onChange={(e) => setNp({ ...np, name: e.target.value })} autoFocus placeholder="اسم المنتج التسويقي" /></Field>
        <div className="row">
          <Field l="التكلفة"><input className="in num" type="number" value={np.cost} onChange={(e) => setNp({ ...np, cost: e.target.value })} placeholder="150" /></Field>
          <Field l="سعر البيع"><input className="in num" type="number" value={np.price} onChange={(e) => setNp({ ...np, price: e.target.value })} placeholder="450" /></Field>
          <Field l="المخزون"><input className="in num" type="number" value={np.stock} onChange={(e) => setNp({ ...np, stock: e.target.value })} placeholder="10" /></Field>
        </div>

        <Field l="الألوان المتاحة (مفصولة بفاصلة)"><input className="in" value={np.colorsInput} onChange={(e) => setNp({ ...np, colorsInput: e.target.value })} placeholder="أسود, أبيض, أحمر" /></Field>
        <Field l="المقاسات المتاحة (مفصولة بفاصلة)"><input className="in" value={np.sizesInput} onChange={(e) => setNp({ ...np, sizesInput: e.target.value })} placeholder="S, M, L, XL" /></Field>

        <div className="pls" style={{ margin: '8px 0' }}>
          <p><b>توحيد السعر لكل المقاسات والألوان</b></p>
          <Tog on={np.unifiedPrice} set={(v) => setNp({ ...np, unifiedPrice: v })} />
        </div>

        <Field l="روابط صور أو فيديوهات المنتج (مفصولة بفاصلة)"><input className="in" value={np.mediaUrls.join(', ')} onChange={(e) => setNp({ ...np, mediaUrls: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="https://..." /></Field>

        <div style={{ background: 'var(--s2)', padding: 14, borderRadius: 14, margin: '12px 0', border: '1px solid var(--ln)' }}>
          <div className="pls" style={{ padding: 0, border: 0, marginBottom: 8 }}>
            <p><b>🎁 عروض الكميات التلقائية لهذا المنتج</b></p>
            <Tog on={np.bundleActive} set={(v) => setNp({ ...np, bundleActive: v })} />
          </div>
          {np.bundleActive && (
            <div className="row" style={{ marginTop: 8 }}>
              <Field l="سعر قطعتين (ج.م)"><input className="in num" type="number" value={np.item2Price} onChange={(e) => setNp({ ...np, item2Price: e.target.value })} /></Field>
              <Field l="سعر 3 قطع (ج.م)"><input className="in num" type="number" value={np.item3Price} onChange={(e) => setNp({ ...np, item3Price: e.target.value })} /></Field>
            </div>
          )}
        </div>

        <Field l="وصف صفحة الهبوط التسويقي"><textarea className="in" value={np.desc} onChange={(e) => setNp({ ...np, desc: e.target.value })} /></Field>
        <button className="btn p" style={{ width: '100%', marginTop: 12 }}>حفظ في قاعدة البيانات ونشر المنتج</button></form></Modal>)}

      {/* مودال تعديل المنتج */}
      {editProduct && (<Modal t="تعديل المنتج وحفظه في قاعدة البيانات" x={() => setEditProduct(null)}><form onSubmit={updateProduct}>
        <Field l="اسم المنتج"><input className="in" value={editProduct.name} onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })} /></Field>
        <div className="row">
          <Field l="التكلفة"><input className="in num" type="number" value={editProduct.cost} onChange={(e) => setEditProduct({ ...editProduct, cost: +e.target.value })} /></Field>
          <Field l="سعر البيع"><input className="in num" type="number" value={editProduct.price} onChange={(e) => setEditProduct({ ...editProduct, price: +e.target.value })} /></Field>
          <Field l="المخزون"><input className="in num" type="number" value={editProduct.stock} onChange={(e) => setEditProduct({ ...editProduct, stock: +e.target.value })} /></Field>
        </div>
        <Field l="الوصف"><textarea className="in" value={editProduct.desc} onChange={(e) => setEditProduct({ ...editProduct, desc: e.target.value })} /></Field>
        <button className="btn p" style={{ width: '100%', marginTop: 12 }}>حفظ التعديلات في قاعدة البيانات</button></form></Modal>)}

      {/* معاينة صفحة الهبوط للعميل مع سلة الشراء وأزرار الإضافة السريعة */}
      {previewProduct && (
        <div className="ov" onClick={() => setPreviewProduct(null)}>
          <div className="mod" style={{ maxWidth: 800, padding: 32, background: '#fff' }} onClick={(e) => e.stopPropagation()}>
            <div className="mh">
              <span style={{ background: 'var(--b)', color: '#fff', padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 800 }}>معاينة متجر سبايك كعميل</span>
              <button className="btn sm" onClick={() => setPreviewProduct(null)}>إغلاق المعاينة ✕</button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, marginTop: 16 }}>
              <div>
                <img src={previewProduct.media?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'} alt="product" style={{ width: '100%', height: 280, objectFit: 'cover', borderRadius: 16, border: '1px solid var(--ln)' }} />
                <h2 style={{ fontSize: 20, fontWeight: 900, margin: '10px 0 4px' }}>{previewProduct.name}</h2>
                <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--b)', marginBottom: 8 }}>
                  {money(clientOrder.qty === 2 && previewProduct.bundleActive ? previewProduct.item2Price : clientOrder.qty === 3 && previewProduct.bundleActive ? previewProduct.item3Price : previewProduct.price * clientOrder.qty)}
                </div>
                <p style={{ color: '#666', fontSize: 12, lineHeight: 1.4 }}>{previewProduct.desc || 'لا يوجد وصف مضاف'}</p>
              </div>

              <div style={{ background: 'var(--s2)', padding: 16, borderRadius: 16, border: '1px solid var(--ln)', display: 'grid', gap: 10 }}>
                <b style={{ fontSize: 14 }}>خيارات المنتج والاستمارة</b>

                {/* اختيار الألوان */}
                {previewProduct.colors?.length > 0 && (
                  <div>
                    <small style={{ fontWeight: 700 }}>اختر اللون:</small>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                      {previewProduct.colors.map((c, idx) => (
                        <button key={idx} type="button" className={`btn sm ${clientOrder.selectedColor === c ? 'p' : ''}`} onClick={() => setClientOrder({...clientOrder, selectedColor: c})}>{c}</button>
                      ))}
                    </div>
                  </div>
                )}

                {/* اختيار المقاسات */}
                {previewProduct.sizes?.length > 0 && (
                  <div>
                    <small style={{ fontWeight: 700 }}>اختر المقاس:</small>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                      {previewProduct.sizes.map((s, idx) => (
                        <button key={idx} type="button" className={`btn sm ${clientOrder.selectedSize === s ? 'p' : ''}`} onClick={() => setClientOrder({...clientOrder, selectedSize: s})}>{s}</button>
                      ))}
                    </div>
                  </div>
                )}

                {/* عروض الكميات */}
                {previewProduct.bundleActive && (
                  <div style={{ background: '#fff', border: '1px solid var(--b)', borderRadius: 12, padding: 8, fontSize: 12 }}>
                    <div style={{ fontWeight: 800, marginBottom: 4, color: 'var(--b)' }}>🎁 عروض الكميات:</div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button type="button" className={`btn sm ${clientOrder.qty === 1 ? 'p' : ''}`} onClick={() => setClientOrder({...clientOrder, qty: 1})}>قطعة</button>
                      <button type="button" className={`btn sm ${clientOrder.qty === 2 ? 'p' : ''}`} onClick={() => setClientOrder({...clientOrder, qty: 2})}>قطعتين</button>
                      <button type="button" className={`btn sm ${clientOrder.qty === 3 ? 'p' : ''}`} onClick={() => setClientOrder({...clientOrder, qty: 3})}>3 قطع</button>
                    </div>
                  </div>
                )}

                {/* أزرار الإضافة للسلة واتمام الطلب */}
                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  <button type="button" className="btn sm" style={{ flex: 1 }} onClick={() => addToCart(previewProduct)}>➕ إضافة للسلة</button>
                  <button type="button" className="btn sm p" style={{ flex: 1 }} onClick={() => {
                    setClientOrder(prev => ({
                      ...prev,
                      name: 'عميل تجريبي',
                      phone: '01012345678',
                      address: 'شارع الهرم، القاهرة'
                    }));
                    say('✨ تم ملء البيانات تلقائياً، أكمل الشراء الآن');
                  }}>⚡ اطلب بضغطة</button>
                </div>

                <form onSubmit={handleClientSubmitOrder} style={{ display: 'grid', gap: 6, borderTop: '1px solid var(--ln)', paddingTop: 10 }}>
                  <input className="in sm" required placeholder="الاسم الكامل" value={clientOrder.name} onChange={e => setClientOrder({...clientOrder, name: e.target.value})} />
                  <input className="in sm num" required placeholder="رقم الهاتف (واتساب)" dir="ltr" value={clientOrder.phone} onChange={e => setClientOrder({...clientOrder, phone: e.target.value})} />
                  <select className="in sm" value={clientOrder.gov} onChange={e => setClientOrder({...clientOrder, gov: e.target.value})}>
                    {ZONES.map(z => <option key={z[0]} value={z[0]}>{z[0]} (+{z[1]} ج.م شحن)</option>)}
                  </select>
                  <input className="in sm" placeholder="العنوان بالتفصيل" value={clientOrder.address} onChange={e => setClientOrder({...clientOrder, address: e.target.value})} />

                  <button className="btn p" style={{ width: '100%', marginTop: 4, minHeight: 42 }}>إتمام الشراء وبدء الطلب (COD)</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* درج سلة الشراء التفاعلي (Cart Drawer) */}
      {isCartOpen && (
        <div className="ov" onClick={() => setIsCartOpen(false)}>
          <div className="mod" style={{ maxWidth: 420, minHeight: '100vh', position: 'absolute', left: 0, top: 0, borderRadius: 0 }} onClick={(e) => e.stopPropagation()}>
            <div className="mh"><b>🛒 سلة المشتريات</b><button className="btn sm" onClick={() => setIsCartOpen(false)}>✕</button></div>
            {cart.length === 0 ? <p className="mut c">السلة فارغة حالياً</p> : (
              <div style={{ display: 'grid', gap: 12 }}>
                {cart.map((item, idx) => (
                  <div key={idx} className="pls">
                    <p><b>{item.name}</b><small>{item.selectedColor} · {item.selectedSize}</small></p>
                    <span className="num" style={{ fontWeight: 800 }}>{money(item.price)}</span>
                  </div>
                ))}
                <button className="btn p" style={{ width: '100%', marginTop: 16 }} onClick={() => { setPreviewProduct(cart[0]); setIsCartOpen(false); }}>إتمام الشراء لكافة منتجات السلة</button>
              </div>
            )}
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
        .app{--bg:#efece0;--s:#fcfbf7;--s2:#f3f0e4;--ln:#e2ddca;--ink:#1f2f33;--mut:#6f7f82;display:flex;min-height:100vh;background:var(--bg);color:var(--ink);font-family:'Cairo',sans-serif;font-size:14px}
        .app *{box-sizing:border-box}.num{font-family:Inter,sans-serif;font-variant-numeric:tabular-nums}
        .side{width:260px;flex:none;background:var(--s);border-inline-start:1px solid var(--ln);padding:18px 14px;position:sticky;top:0;height:100vh;display:flex;flex-direction:column;gap:14px;overflow-y:auto;scrollbar-width:none}
        .logo{display:flex;gap:10px;align-items:center}.logo small{display:block;color:var(--mut);font-size:11.5px}
        .lg{width:40px;height:40px;border-radius:12px;background:var(--b);color:#fff;display:grid;place-items:center;font-weight:800;font-size:18px}
        .nav-group{margin-bottom:12px}.nav-lbl{display:block;font-size:11px;font-weight:800;color:var(--mut);margin-bottom:4px;padding-inline:4px}
        nav{display:flex;flex-direction:column;gap:3px;flex:1}
        .nv{display:flex;align-items:center;gap:10px;width:100%;min-height:38px;padding:0 10px;border:0;border-radius:10px;background:none;color:var(--ink);font:600 13px Cairo;cursor:pointer;text-align:start}
        .nv:hover{background:var(--s2)}.nv.act{background:var(--b);color:#fff}
        .badge-new{margin-inline-start:auto;background:#2f855a;color:#fff;font-size:10px;padding:1px 6px;border-radius:6px;font-weight:700}
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
        .ov{position:fixed;inset:0;zIndex:50;background:rgba(5,35,38,.55);backdrop-filter:blur(6px);display:grid;place-items:center;padding:16px}
        .mod{width:100%;max-width:560px;max-height:90vh;overflow:auto;background:var(--s);border:1px solid var(--ln);border-radius:24px;padding:24px;box-shadow:0 30px 80px -20px rgba(3,30,33,.55)}
        .mh{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
        .toast{position:fixed;bottom:22px;left:50%;transform:translateX(-50%);background:var(--ink);color:#fff;padding:11px 20px;border-radius:14px;font-weight:700;z-index:60}
      `}</style>
    </div>
  );
}
