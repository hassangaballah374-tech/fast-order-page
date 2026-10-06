'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function MerchantDashboard() {
  const router = useRouter();
  const [activeScreen, setActiveScreen] = useState('home');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  // حالة اشتراك التاجر
  const [myStore, setMyStore] = useState(null);

  // إعدادات وبيكسلات التاجر
  const [settings, setSettings] = useState({
    store_name: '',
    store_logo: '',
    store_description: '',
    support_phone: '',
    announcement_text: '',
    pixel_1: '', token_1: '',
    pixel_2: '', token_2: '',
    pixel_3: '', token_3: '',
    pixel_4: '', token_4: '',
  });

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState([]);

  const [savingSettings, setSavingSettings] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [productForm, setProductForm] = useState({ name: '', price: '', stock: 20, image: '' });

  useEffect(() => {
    initMerchant();
  }, []);

  async function initMerchant() {
    setLoading(true);
    let uid = null;
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      uid = session.user.id;
    } else {
      uid = localStorage.getItem('merchant_user_id');
    }

    if (!uid) {
      router.push('/register');
      return;
    }
    setUserId(uid);

    // 1. جلب بيانات متجر التاجر وحالة التفعيل
    const { data: storeData } = await supabase
      .from('store_profiles')
      .select('*')
      .eq('user_id', uid)
      .maybeSingle();
    
    if (storeData) {
      setMyStore(storeData);
      setSettings(prev => ({ ...prev, store_name: storeData.store_name }));
    }

    // 2. جلب إعدادات وبيكسلات هذا التاجر فقط
    const { data: sData } = await supabase
      .from('merchant_settings')
      .select('*')
      .eq('user_id', uid)
      .maybeSingle();

    if (sData) {
      setSettings(sData);
    }

    // 3. جلب منتجات وطلبات وتحليلات هذا التاجر فقط
    const { data: pData } = await supabase.from('products').select('*').eq('user_id', uid);
    if (pData) setProducts(pData);

    const { data: oData } = await supabase.from('orders').select('*').eq('user_id', uid);
    if (oData) setOrders(oData);

    const { data: aData } = await supabase.from('store_analytics').select('*').eq('user_id', uid);
    if (aData) setAnalytics(aData);

    setLoading(false);
  }

  // حفظ إعدادات وبيكسلات التاجر
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const payload = { ...settings, user_id: userId };
      const { error } = await supabase.from('merchant_settings').upsert(payload, { onConflict: 'user_id' });
      if (error) throw error;
      alert('✅ تم حفظ إعدادات وبيكسلات متجرك بنجاح!');
    } catch (err) {
      alert('خطأ أثناء الحفظ: ' + err.message);
    }
    setSavingSettings(false);
  };

  // رفع اللوجو
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setSettings(prev => ({ ...prev, store_logo: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  // إضافة منتج جديد خاص بالتاجر
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price) return;

    const payload = {
      user_id: userId,
      name: productForm.name,
      price: Number(productForm.price),
      stock: Number(productForm.stock) || 20,
      images: productForm.image ? [productForm.image] : [],
    };

    await supabase.from('products').insert([payload]);
    setShowProductModal(false);
    setProductForm({ name: '', price: '', stock: 20, image: '' });
    initMerchant();
  };

  // إحصائيات خاصة بالتاجر
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total_amount || o.total_price) || 0), 0);
  const visitorsCount = analytics.filter(a => a.event_type === 'visit').length;
  const conversionRate = visitorsCount > 0 ? ((orders.length / visitorsCount) * 100).toFixed(2) : '0.00';

  const isStoreActive = myStore?.is_active && (!myStore?.subscription_ends_at || new Date(myStore.subscription_ends_at) > new Date());

  const gridCards = [
    {
      id: 'products',
      title: 'منتجاتي والمخزون',
      desc: 'إضافة المنتجات والصور وتحديد الأسعار والكميات',
      icon: '🛍️',
      bgClass: 'bg-gradient-to-r from-teal-500 to-emerald-600',
      badge: `${products.length} منتج`,
    },
    {
      id: 'orders',
      title: 'طلبات الزبائن والمبيعات',
      desc: 'متابعة الطلبات الواردة والشحن والتوصيل',
      icon: '📦',
      bgClass: 'bg-gradient-to-r from-blue-600 to-indigo-600',
      badge: `${orders.length} طلب`,
    },
    {
      id: 'pixels',
      title: 'إعدادات البيكسل (CAPI)',
      desc: 'ربط بيكسل فيسبوك وأكواد التتبع لحملاتك الإعلانية',
      icon: '⚡',
      bgClass: 'bg-gradient-to-r from-rose-600 to-red-600',
      badge: 'Facebook CAPI',
    },
    {
      id: 'branding',
      title: 'هوية المتجر والدعم',
      desc: 'شعار المتجر، الاسم، الوصف، ورقم واتساب الزبائن',
      icon: '⚙️',
      bgClass: 'bg-gradient-to-r from-amber-500 to-orange-600',
      badge: 'الهوية والتصميم',
    },
    {
      id: 'analytics',
      title: 'إحصائيات المبيعات',
      desc: 'الزوار، معدل التحويل، ومتوسط سلة المشتريات',
      icon: '📈',
      bgClass: 'bg-gradient-to-r from-indigo-600 to-purple-600',
      badge: `${totalRevenue.toLocaleString()} ج.م`,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center font-sans text-slate-800" dir="rtl">
        <div className="font-bold text-lg animate-pulse">جاري فتح لوحة تحكم متجرك...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans pb-16" dir="rtl">
      
      {/* تنبيه حالة الاشتراك إن كان غير مفعل */}
      {!isStoreActive && (
        <div className="bg-amber-500 text-white text-xs font-black p-3 text-center">
          ⏳ متجرك قيد المراجعة وبانتظار تفعيل الاشتراك من الإدارة. يمكنك الآن تجهيز منتجاتك والبيكسل وإعدادات متجرك.
        </div>
      )}

      {/* الرأس العلوي للتاجر */}
      <header className="bg-white border-b border-slate-200 px-6 py-5 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {activeScreen !== 'home' && (
              <button
                onClick={() => setActiveScreen('home')}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-2xl text-sm font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>⬅</span>
                <span>الرئيسية</span>
              </button>
            )}
            <div className="flex items-center gap-3">
              {settings.store_logo && (
                <img src={settings.store_logo} alt="Logo" className="w-10 h-10 object-contain rounded-xl border border-slate-200" />
              )}
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                  لوحة تحكم: {myStore?.store_name || settings.store_name}
                </h1>
                <p className="text-xs text-slate-500">
                  رابط متجرك للزبائن: <a href={`/store/${myStore?.store_slug}`} target="_blank" className="text-blue-600 underline font-mono">/store/{myStore?.store_slug}</a>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-xs px-3 py-1.5 rounded-full font-black ${isStoreActive ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {isStoreActive ? '🟢 متجرك نشط' : '🟡 بانتظار التفعيل'}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 sm:p-8">

        {/* شبكة الكروت الرئيسية الخاصة بالتاجر */}
        {activeScreen === 'home' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {gridCards.map((card) => (
              <div
                key={card.id}
                onClick={() => setActiveScreen(card.id)}
                className={`${card.bgClass} text-white p-6 rounded-3xl cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden flex flex-col justify-between min-h-[155px]`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs bg-white/20 backdrop-blur-md px-3 py-1 rounded-full font-bold">
                    {card.badge}
                  </span>
                  <span className="text-2xl opacity-90">{card.icon}</span>
                </div>
                <div className="space-y-1 mt-4">
                  <h3 className="text-xl font-black tracking-wide">{card.title}</h3>
                  <p className="text-xs text-white/85 line-clamp-1">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 1. شاشة منتجات التاجر */}
        {activeScreen === 'products' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex justify-between items-center">
              <div>
                <h2 className="text-lg font-black">منتجات متجري ({products.length})</h2>
                <p className="text-xs text-slate-500">أضف منتجاتك لتظهر مباشرة في صفحة الشراء لزبائنك</p>
              </div>
              <button
                onClick={() => setShowProductModal(true)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition cursor-pointer"
              >
                ➕ إضافة منتج جديد
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {products.map((p) => (
                <div key={p.id} className="bg-white border border-slate-200 p-4 rounded-3xl shadow-sm space-y-3">
                  <div className="w-full h-40 bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden">
                    {p.images?.[0] ? <img src={p.images[0]} className="w-full h-full object-contain" /> : '📦'}
                  </div>
                  <h4 className="font-bold text-slate-900">{p.name}</h4>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-emerald-600 font-black text-sm">{p.price} ج.م</span>
                    <span className="text-slate-500">المخزون: {p.stock || 20}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. شاشة طلبات الزبائن للتاجر */}
        {activeScreen === 'orders' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-black">الطلبات الواردة لمتجرك ({orders.length})</h2>
              <p className="text-xs text-slate-500">بيانات الزبائن الذين طلبوا من متجرك للشحن والتوصيل</p>
            </div>

            <div className="space-y-3">
              {orders.map((o, idx) => (
                <div key={o.id} className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm space-y-2">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="font-black text-slate-900">طلب #{idx + 1} - {o.customer_name}</span>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl">{o.status || 'جديد'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600">
                    <div>الهاتف: <strong className="text-slate-900 font-mono" dir="ltr">{o.phone}</strong></div>
                    <div>المحافظة: <strong className="text-slate-900">{o.governorate}</strong></div>
                    <div>إجمالي المبلغ: <strong className="text-emerald-600 font-bold">{o.total_amount || o.total_price} ج.م</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. شاشة إعدادات البيكسل الخاصة بالتاجر */}
        {activeScreen === 'pixels' && (
          <form onSubmit={handleSaveSettings} className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-4 max-w-2xl mx-auto">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-black">ربط بيكسل فيسبوك (CAPI) لمتجرك</h2>
              <p className="text-xs text-slate-500">اربط إعلاناتك بمتجرك لتتبع عمليات الشراء (Purchase) بدقة</p>
            </div>

            {[1, 2].map((num) => (
              <div key={num} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <span className="text-xs font-bold text-slate-700">بيكسل فيسبوك ({num})</span>
                <input
                  type="text"
                  dir="ltr"
                  value={settings[`pixel_${num}`] || ''}
                  onChange={(e) => setSettings({ ...settings, [`pixel_${num}`]: e.target.value })}
                  placeholder={`Pixel ID ${num}`}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-mono"
                />
                <input
                  type="text"
                  dir="ltr"
                  value={settings[`token_${num}`] || ''}
                  onChange={(e) => setSettings({ ...settings, [`token_${num}`]: e.target.value })}
                  placeholder={`Access Token (CAPI) ${num}`}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-mono"
                />
              </div>
            ))}

            <button type="submit" disabled={savingSettings} className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow cursor-pointer">
              {savingSettings ? 'جاري الحفظ...' : 'حفظ البيكسلات 💾'}
            </button>
          </form>
        )}

        {/* 4. شاشة هوية المتجر واللوجو */}
        {activeScreen === 'branding' && (
          <form onSubmit={handleSaveSettings} className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-4 max-w-2xl mx-auto">
            <h2 className="text-lg font-black border-b border-slate-100 pb-3">تخصيص متجرك وهويتك</h2>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">لوجو المتجر</label>
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="text-xs" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">اسم المتجر</label>
              <input
                type="text"
                value={settings.store_name || ''}
                onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">رقم واتساب خدمة العملاء للزبائن</label>
              <input
                type="tel"
                dir="ltr"
                value={settings.support_phone || ''}
                onChange={(e) => setSettings({ ...settings, support_phone: e.target.value })}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-mono"
              />
            </div>
            <button type="submit" disabled={savingSettings} className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow cursor-pointer">
              حفظ الهوية 💾
            </button>
          </form>
        )}

        {/* 5. إحصائيات التاجر */}
        {activeScreen === 'analytics' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
              <span className="text-xs text-slate-500 block">زوار متجرك</span>
              <span className="text-2xl font-black text-slate-900">{visitorsCount}</span>
            </div>
            <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
              <span className="text-xs text-slate-500 block">إجمالي مبيعاتك</span>
              <span className="text-2xl font-black text-emerald-600">{totalRevenue.toLocaleString()} ج.م</span>
            </div>
            <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
              <span className="text-xs text-slate-500 block">معدل تحويل الزوار لطلبات</span>
              <span className="text-2xl font-black text-indigo-600">{conversionRate}%</span>
            </div>
          </div>
        )}

      </main>

      {/* نافذة إضافة منتج جديد */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAddProduct} className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-lg font-black border-b border-slate-100 pb-3">إضافة منتج جديد لمتجرك</h3>
            <input
              type="text"
              required
              placeholder="اسم المنتج"
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              className="w-full border border-slate-200 rounded-xl p-2.5 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                required
                placeholder="السعر (ج.م)"
                value={productForm.price}
                onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                className="border border-slate-200 rounded-xl p-2.5 text-sm font-bold"
              />
              <input
                type="number"
                placeholder="المخزون المتوفر"
                value={productForm.stock}
                onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                className="border border-slate-200 rounded-xl p-2.5 text-sm"
              />
            </div>
            <input
              type="url"
              placeholder="رابط صورة المنتج"
              value={productForm.image}
              onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
              className="w-full border border-slate-200 rounded-xl p-2.5 text-sm"
            />
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setShowProductModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold cursor-pointer">إلغاء</button>
              <button type="submit" className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer">حفظ المنتج 🚀</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
