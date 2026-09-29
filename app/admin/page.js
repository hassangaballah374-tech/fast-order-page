'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function AdminDashboard() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [currentView, setCurrentView] = useState('overview'); // 'overview' | 'products' | 'orders'
  const [statusMessage, setStatusMessage] = useState('');

  // إعدادات المتجر والبيكسل والشحن
  const [settings, setSettings] = useState({
    store_name: '',
    fb_pixel_id: '',
    tiktok_pixel_id: '',
    shipping_rates: {
      cairo_giza: 50,
      alex: 60,
      delta: 65,
      canal: 70,
      upper_egypt: 80,
      remote: 100,
    },
  });

  // المنتجات والطلبات
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // نافذة إضافة وتعديل منتج
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    original_price: '',
    description: '',
    images: [],
    video_url: '',
    show_colors: false,
    colors: [],
    show_sizes: false,
    sizes: [],
  });

  const [newColorName, setNewColorName] = useState('');
  const [newColorCode, setNewColorCode] = useState('#000000');
  const [newSizeName, setNewSizeName] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadAllDashboardData();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadAllDashboardData();
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadAllDashboardData = async () => {
    setLoadingData(true);

    // 1. جلب الإعدادات
    const { data: setRes } = await supabase.from('store_settings').select('*').eq('id', 1).single();
    if (setRes) {
      setSettings({
        store_name: setRes.store_name || '',
        fb_pixel_id: setRes.fb_pixel_id || '',
        tiktok_pixel_id: setRes.tiktok_pixel_id || '',
        shipping_rates: setRes.shipping_rates || {
          cairo_giza: 50,
          alex: 60,
          delta: 65,
          canal: 70,
          upper_egypt: 80,
          remote: 100,
        },
      });
    }

    // 2. جلب المنتجات
    const { data: prodRes } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (prodRes) setProducts(prodRes);

    // 3. جلب الطلبات
    const { data: ordRes } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (ordRes) setOrders(ordRes);

    setLoadingData(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setStatusMessage('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setStatusMessage('❌ بيانات الدخول غير صحيحة');
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setStatusMessage('');

    const { error } = await supabase.from('store_settings').upsert({
      id: 1,
      store_name: settings.store_name,
      fb_pixel_id: settings.fb_pixel_id.trim(),
      tiktok_pixel_id: settings.tiktok_pixel_id.trim(),
      shipping_rates: settings.shipping_rates,
      updated_at: new Date(),
    });

    if (!error) {
      setStatusMessage('✅ تم حفظ التعديلات بنجاح!');
      setTimeout(() => setStatusMessage(''), 3000);
    } else {
      setStatusMessage('❌ خطأ أثناء الحفظ: ' + error.message);
    }
    setSavingSettings(false);
  };

  // حذف طلب
  const handleDeleteOrder = async (orderId) => {
    if (!confirm('هل أنت متأكد من حذف هذا الطلب نهائياً؟')) return;

    const { error } = await supabase.from('orders').delete().eq('id', orderId);
    if (!error) {
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      setStatusMessage('✅ تم حذف الطلب بنجاح');
      setTimeout(() => setStatusMessage(''), 2500);
    } else {
      alert('حدث خطأ أثناء حذف الطلب: ' + error.message);
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      price: '',
      original_price: '',
      description: '',
      images: [],
      video_url: '',
      show_colors: false,
      colors: [],
      show_sizes: false,
      sizes: [],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (prod) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name || '',
      price: prod.price || '',
      original_price: prod.original_price || '',
      description: prod.description || '',
      images: Array.isArray(prod.images) ? prod.images : [],
      video_url: prod.video_url || '',
      show_colors: !!prod.show_colors,
      colors: Array.isArray(prod.colors) ? prod.colors : [],
      show_sizes: !!prod.show_sizes,
      sizes: Array.isArray(prod.sizes) ? prod.sizes : [],
    });
    setIsModalOpen(true);
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('هل تريد بالتأكيد حذف هذا المنتج؟')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } else {
      alert('حدث خطأ أثناء الحذف: ' + error.message);
    }
  };

  const handleMultipleImagesUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploadingImage(true);
    try {
      const urls = [];
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `p_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `uploads/${fileName}`;

        const { error: uploadError } = await supabase.storage.from('products').upload(filePath, file);
        if (!uploadError) {
          const { data } = supabase.storage.from('products').getPublicUrl(filePath);
          urls.push(data.publicUrl);
        }
      }
      setProductForm((prev) => ({ ...prev, images: [...prev.images, ...urls] }));
    } catch (err) {
      alert('خطأ أثناء الرفع: ' + err.message);
    }
    setUploadingImage(false);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setSavingProduct(true);

    const payload = {
      name: productForm.name,
      price: Number(productForm.price),
      original_price: Number(productForm.original_price) || null,
      description: productForm.description,
      images: productForm.images,
      video_url: productForm.video_url,
      show_colors: productForm.show_colors,
      colors: productForm.colors,
      show_sizes: productForm.show_sizes,
      sizes: productForm.sizes,
    };

    let resErr = null;
    if (editingProduct) {
      const { error } = await supabase.from('products').update(payload).eq('id', editingProduct.id);
      resErr = error;
    } else {
      const { error } = await supabase.from('products').insert([payload]);
      resErr = error;
    }

    if (!resErr) {
      setIsModalOpen(false);
      loadAllDashboardData();
    } else {
      alert('فشل حفظ المنتج: ' + resErr.message);
    }
    setSavingProduct(false);
  };

  const totalRevenue = orders.reduce((sum, ord) => sum + (Number(ord.total_amount) || Number(ord.total_price) || 0), 0);

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-white font-sans" dir="rtl">
        <form onSubmit={handleLogin} className="bg-slate-800 p-8 rounded-3xl shadow-2xl w-full max-w-md border border-slate-700 space-y-5">
          <div className="text-center">
            <h1 className="text-2xl font-black text-emerald-400">لوحة تحكم المتجر</h1>
            <p className="text-xs text-slate-400 mt-1">سجل الدخول لإدارة منتجاتك ومبيعاتك</p>
          </div>
          {statusMessage && <div className="p-3 bg-red-500/20 text-red-300 rounded-xl text-sm text-center font-bold">{statusMessage}</div>}
          <div>
            <label className="block mb-2 text-xs font-bold text-slate-300">البريد الإلكتروني</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-slate-700 border border-slate-600 text-white focus:outline-none focus:border-emerald-400"
              required
            />
          </div>
          <div>
            <label className="block mb-2 text-xs font-bold text-slate-300">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-slate-700 border border-slate-600 text-white focus:outline-none focus:border-emerald-400"
              required
            />
          </div>
          <button
            type="submit"
            disabled={authLoading}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-black text-white transition disabled:opacity-50"
          >
            {authLoading ? 'جاري التحقق...' : 'تسجيل الدخول'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans antialiased" dir="rtl">
      {/* الشريط العلوي */}
      <header className="bg-slate-900/90 backdrop-blur border-b border-slate-800 py-3.5 px-4 sm:px-8 sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚡</span>
          <div>
            <h1 className="text-base sm:text-lg font-black text-white">{settings.store_name || 'لوحة تحكم المتجر'}</h1>
            <p className="text-[11px] text-emerald-400 font-semibold">متصل بقاعدة البيانات وجوجل شيت</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/"
            target="_blank"
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <span>👁️</span>
            <span>عرض المتجر</span>
          </a>
          <button
            onClick={handleLogout}
            className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 rounded-xl text-xs font-bold transition"
          >
            خروج
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-8">
        {/* شريط الأقسام */}
        <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 gap-1.5 overflow-x-auto">
          <button
            onClick={() => setCurrentView('overview')}
            className={`flex-1 min-w-[130px] py-3 rounded-xl font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 ${
              currentView === 'overview'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>📊</span>
            <span>الرئيسية والإعدادات</span>
          </button>

          <button
            onClick={() => setCurrentView('products')}
            className={`flex-1 min-w-[130px] py-3 rounded-xl font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 ${
              currentView === 'products'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>📦</span>
            <span>المنتجات ({products.length})</span>
          </button>

          <button
            onClick={() => setCurrentView('orders')}
            className={`flex-1 min-w-[130px] py-3 rounded-xl font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 ${
              currentView === 'orders'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>🛒</span>
            <span>الطلبات ({orders.length})</span>
          </button>
        </div>

        {statusMessage && (
          <div className="p-4 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-2xl text-center font-bold text-sm">
            {statusMessage}
          </div>
        )}

        {/* 1. قسم الرئيسية والإعدادات */}
        {currentView === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-xl">
                <span className="text-xs text-slate-400 font-bold block mb-1">المنتجات المعروضة</span>
                <span className="text-2xl sm:text-3xl font-black text-white">{products.length}</span>
              </div>

              <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-xl">
                <span className="text-xs text-slate-400 font-bold block mb-1">إجمالي الطلبات</span>
                <span className="text-2xl sm:text-3xl font-black text-emerald-400">{orders.length}</span>
              </div>

              <div className="col-span-2 sm:col-span-1 bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-xl">
                <span className="text-xs text-slate-400 font-bold block mb-1">إجمالي المبيعات</span>
                <span className="text-2xl sm:text-3xl font-black text-emerald-400">{totalRevenue.toLocaleString()} <span className="text-xs text-slate-300">ج.م</span></span>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-base font-black text-white">🏷️ اسم الموقع والمتجر</h3>
                  <p className="text-xs text-slate-400 mt-0.5">يظهر اسم المتجر في ترويسة الموقع</p>
                </div>
                <div>
                  <input
                    type="text"
                    required
                    placeholder="مثال: لَمّة ستور"
                    value={settings.store_name}
                    onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                    className="w-full p-3.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-400 font-bold text-sm"
                  />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-base font-black text-emerald-400">🎯 إعدادات بيكسل الإعلانات (Meta & TikTok Pixel)</h3>
                  <p className="text-xs text-slate-400 mt-0.5">ضع معرّف البيكسل لربط التتبع التلقائي</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Meta Pixel ID (فيسبوك بيكسل)</label>
                    <input
                      type="text"
                      placeholder="مثال: 123456789012345"
                      value={settings.fb_pixel_id}
                      onChange={(e) => setSettings({ ...settings, fb_pixel_id: e.target.value })}
                      className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm font-mono focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">TikTok Pixel ID (تيك توك بيكسل)</label>
                    <input
                      type="text"
                      placeholder="مثال: C1234567890ABCDEF"
                      value={settings.tiktok_pixel_id}
                      onChange={(e) => setSettings({ ...settings, tiktok_pixel_id: e.target.value })}
                      className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm font-mono focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-base font-black text-white">🚚 تسعير الشحن للمحافظات (ج.م)</h3>
                  <p className="text-xs text-slate-400 mt-0.5">تطبق التكلفة تلقائياً على العميل بمجرد اختيار محافظته</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1 font-semibold">القاهرة والجيزة</label>
                    <input
                      type="number"
                      value={settings.shipping_rates?.cairo_giza ?? 50}
                      onChange={(e) => setSettings({
                        ...settings,
                        shipping_rates: { ...settings.shipping_rates, cairo_giza: Number(e.target.value) }
                      })}
                      className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1 font-semibold">الإسكندرية</label>
                    <input
                      type="number"
                      value={settings.shipping_rates?.alex ?? 60}
                      onChange={(e) => setSettings({
                        ...settings,
                        shipping_rates: { ...settings.shipping_rates, alex: Number(e.target.value) }
                      })}
                      className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1 font-semibold">وجه بحري (الدلتا)</label>
                    <input
                      type="number"
                      value={settings.shipping_rates?.delta ?? 65}
                      onChange={(e) => setSettings({
                        ...settings,
                        shipping_rates: { ...settings.shipping_rates, delta: Number(e.target.value) }
                      })}
                      className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1 font-semibold">مدن القناة</label>
                    <input
                      type="number"
                      value={settings.shipping_rates?.canal ?? 70}
                      onChange={(e) => setSettings({
                        ...settings,
                        shipping_rates: { ...settings.shipping_rates, canal: Number(e.target.value) }
                      })}
                      className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1 font-semibold">وجه قبلي (الصعيد)</label>
                    <input
                      type="number"
                      value={settings.shipping_rates?.upper_egypt ?? 80}
                      onChange={(e) => setSettings({
                        ...settings,
                        shipping_rates: { ...settings.shipping_rates, upper_egypt: Number(e.target.value) }
                      })}
                      className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1 font-semibold">محافظات حدودية</label>
                    <input
                      type="number"
                      value={settings.shipping_rates?.remote ?? 100}
                      onChange={(e) => setSettings({
                        ...settings,
                        shipping_rates: { ...settings.shipping_rates, remote: Number(e.target.value) }
                      })}
                      className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={savingSettings}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-base rounded-2xl shadow-lg shadow-emerald-500/20 transition active:scale-[0.99] disabled:opacity-50"
              >
                {savingSettings ? 'جاري الحفظ...' : 'حفظ إعدادات المتجر والبيكسل والشحن 🚀'}
              </button>
            </form>
          </div>
        )}

        {/* 2. قسم إدارة المنتجات */}
        {currentView === 'products' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-900 p-5 rounded-3xl border border-slate-800">
              <div>
                <h2 className="text-lg font-black text-white">المنتجات المعروضة في المتجر</h2>
                <p className="text-xs text-slate-400">يمكنك تعديل أي منتج أو حذفه أو إضافة منتج جديد</p>
              </div>
              <button
                onClick={openAddModal}
                className="py-3 px-5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-emerald-500/20 transition active:scale-95 flex items-center gap-1.5"
              >
                <span>➕</span>
                <span>إضافة منتج جديد</span>
              </button>
            </div>

            {loadingData ? (
              <div className="p-12 text-center text-slate-400">جاري تحميل المنتجات...</div>
            ) : products.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
                <span className="text-5xl">🛍️</span>
                <p className="text-slate-300 font-bold">لا يوجد أي منتج في المتجر حتى الآن!</p>
                <button
                  onClick={openAddModal}
                  className="py-3 px-6 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm"
                >
                  أضف منتجك الأول الآن
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {products.map((prod) => (
                  <div key={prod.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col justify-between shadow-xl">
                    <div className="space-y-3">
                      <div className="w-full h-44 bg-slate-800 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-700/50">
                        {Array.isArray(prod.images) && prod.images[0] ? (
                          <img src={prod.images[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-slate-500 text-xs">بدون صورة</span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-base text-white line-clamp-1">{prod.name}</h4>
                        <p className="text-emerald-400 font-black text-lg mt-0.5">{prod.price} ج.م</p>
                      </div>
                      <div className="flex gap-2 text-[11px] text-slate-400">
                        {prod.show_colors && <span>🎨 ألوان مفعّلة</span>}
                        {prod.show_sizes && <span>📏 مقاسات مفعّلة</span>}
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4 pt-3 border-t border-slate-800">
                      <button
                        onClick={() => openEditModal(prod)}
                        className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl transition"
                      >
                        تعديل ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(prod.id)}
                        className="py-2.5 px-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 font-bold text-xs rounded-xl transition"
                      >
                        حذف 🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. قسم الطلبات مع إمكانية الحذف */}
        {currentView === 'orders' && (
          <div className="space-y-6">
            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-black text-white">الطلبات الواردة من المتجر</h2>
                <p className="text-xs text-slate-400">تستطيع حذف أي طلب تجريبي أو ملغي بضغطة زر</p>
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                {orders.length} طلب
              </span>
            </div>

            {orders.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 font-bold">
                لا توجد طلبات واردة حتى الآن.
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-sm">
                    <thead className="bg-slate-800/80 text-slate-300 text-xs font-bold border-b border-slate-700">
                      <tr>
                        <th className="p-3.5">العميل</th>
                        <th className="p-3.5">الهاتف</th>
                        <th className="p-3.5">المحافظة / العنوان</th>
                        <th className="p-3.5">المنتج والمواصفات</th>
                        <th className="p-3.5">الإجمالي</th>
                        <th className="p-3.5">التاريخ</th>
                        <th className="p-3.5 text-center">إجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {orders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-slate-800/40 text-slate-200 text-xs sm:text-sm">
                          <td className="p-3.5 font-bold text-white">{ord.customer_name}</td>
                          <td className="p-3.5 font-mono">{ord.phone}</td>
                          <td className="p-3.5">{ord.address}</td>
                          <td className="p-3.5">
                            <span className="font-semibold text-emerald-300">{ord.product_name}</span>
                            {(ord.selected_color || ord.selected_size) && (
                              <span className="block text-[11px] text-slate-400 mt-0.5">
                                {ord.selected_color && `اللون: ${ord.selected_color} `}
                                {ord.selected_size && `المقاس: ${ord.selected_size}`}
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 font-black text-emerald-400">
                            {ord.total_amount || ord.total_price} ج.م
                          </td>
                          <td className="p-3.5 text-slate-400 text-xs">
                            {new Date(ord.created_at).toLocaleDateString('ar-EG')}
                          </td>
                          <td className="p-3.5 text-center">
                            <button
                              onClick={() => handleDeleteOrder(ord.id)}
                              className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 font-bold text-xs rounded-xl transition"
                              title="حذف هذا الطلب"
                            >
                              حذف 🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* نافذة Modal لإضافة أو تعديل منتج */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 sm:p-8 space-y-6 my-8 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-xl font-black text-emerald-400">
                {editingProduct ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">اسم المنتج</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: كوتش مريح خامات مستوردة"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">سعر البيع (ج.م)</label>
                  <input
                    type="number"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">السعر قبل الخصم (اختياري)</label>
                  <input
                    type="number"
                    value={productForm.original_price}
                    onChange={(e) => setProductForm({ ...productForm, original_price: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">وصف ومميزات المنتج</label>
                <textarea
                  rows="4"
                  placeholder="اكتب تفاصيل المنتج ومميزاته التي تظهر في المتجر..."
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm leading-relaxed"
                ></textarea>
              </div>

              <div className="border border-slate-800 p-4 rounded-xl bg-slate-800/40 space-y-3">
                <label className="block text-xs font-bold text-slate-200">معرض صور المنتج (اختر صورة أو أكثر)</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleMultipleImagesUpload}
                  disabled={uploadingImage}
                  className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-500 file:text-white cursor-pointer"
                />
                {uploadingImage && <p className="text-xs text-yellow-400">جاري رفع الصور...</p>}

                {productForm.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 pt-2">
                    {productForm.images.map((img, idx) => (
                      <div key={idx} className="relative group border border-slate-700 rounded-lg overflow-hidden h-20">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setProductForm((p) => ({ ...p, images: p.images.filter((_, i) => i !== idx) }))}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border border-slate-800 p-4 rounded-xl bg-slate-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">خيارات الألوان</span>
                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={productForm.show_colors}
                      onChange={(e) => setProductForm({ ...productForm, show_colors: e.target.checked })}
                      className="w-4 h-4 text-emerald-500"
                    />
                    <span>تفعيل الألوان</span>
                  </label>
                </div>

                {productForm.show_colors && (
                  <div className="space-y-2 pt-2">
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={newColorCode}
                        onChange={(e) => setNewColorCode(e.target.value)}
                        className="w-10 h-9 p-1 bg-slate-800 border border-slate-700 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        placeholder="اسم اللون (مثال: أسود)"
                        value={newColorName}
                        onChange={(e) => setNewColorName(e.target.value)}
                        className="flex-1 p-2 rounded bg-slate-800 border border-slate-700 text-xs text-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newColorName.trim()) {
                            setProductForm({
                              ...productForm,
                              colors: [...productForm.colors, { name: newColorName.trim(), code: newColorCode }],
                            });
                            setNewColorName('');
                          }
                        }}
                        className="px-3 bg-emerald-500 text-white rounded text-xs font-bold"
                      >
                        إضافة
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {productForm.colors.map((c, i) => (
                        <div key={i} className="flex items-center gap-1.5 bg-slate-800 px-2 py-1 rounded border border-slate-700 text-xs">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.code }}></span>
                          <span>{c.name}</span>
                          <button
                            type="button"
                            onClick={() => setProductForm({ ...productForm, colors: productForm.colors.filter((_, idx) => idx !== i) })}
                            className="text-red-400 mr-1"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="border border-slate-800 p-4 rounded-xl bg-slate-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">خيارات المقاسات</span>
                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={productForm.show_sizes}
                      onChange={(e) => setProductForm({ ...productForm, show_sizes: e.target.checked })}
                      className="w-4 h-4 text-emerald-500"
                    />
                    <span>تفعيل المقاسات</span>
                  </label>
                </div>

                {productForm.show_sizes && (
                  <div className="space-y-2 pt-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="المقاس (مثال: 42 أو XL)"
                        value={newSizeName}
                        onChange={(e) => setNewSizeName(e.target.value)}
                        className="flex-1 p-2 rounded bg-slate-800 border border-slate-700 text-xs text-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newSizeName.trim()) {
                            setProductForm({
                              ...productForm,
                              sizes: [...productForm.sizes, newSizeName.trim()],
                            });
                            setNewSizeName('');
                          }
                        }}
                        className="px-3 bg-emerald-500 text-white rounded text-xs font-bold"
                      >
                        إضافة
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {productForm.sizes.map((s, i) => (
                        <div key={i} className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded border border-slate-700 text-xs font-bold">
                          <span>{s}</span>
                          <button
                            type="button"
                            onClick={() => setProductForm({ ...productForm, sizes: productForm.sizes.filter((_, idx) => idx !== i) })}
                            className="text-red-400 mr-1"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  disabled={savingProduct || uploadingImage}
                  className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl text-sm transition"
                >
                  {savingProduct ? 'جاري الحفظ...' : 'حفظ المنتج'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-sm"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
