'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function AdminDashboard() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'settings' | 'pixel'
  const [message, setMessage] = useState('');

  // بيانات الإعدادات والبيكسل
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

  // قائمة المنتجات
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // نافذة إضافة / تعديل منتج
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
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        loadSettings();
        loadProducts();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        loadSettings();
        loadProducts();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadSettings = async () => {
    const { data } = await supabase.from('store_settings').select('*').eq('id', 1).single();
    if (data) {
      setSettings({
        store_name: data.store_name || '',
        fb_pixel_id: data.fb_pixel_id || '',
        tiktok_pixel_id: data.tiktok_pixel_id || '',
        shipping_rates: data.shipping_rates || {
          cairo_giza: 50,
          alex: 60,
          delta: 65,
          canal: 70,
          upper_egypt: 80,
          remote: 100,
        },
      });
    }
  };

  const loadProducts = async () => {
    setLoadingProducts(true);
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
    setLoadingProducts(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setMessage('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMessage('❌ بيانات تسجيل الدخول غير صحيحة');
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setMessage('');

    const { error } = await supabase.from('store_settings').upsert({
      id: 1,
      store_name: settings.store_name,
      fb_pixel_id: settings.fb_pixel_id.trim(),
      tiktok_pixel_id: settings.tiktok_pixel_id.trim(),
      shipping_rates: settings.shipping_rates,
      updated_at: new Date(),
    });

    if (!error) {
      setMessage('✅ تم حفظ الإعدادات بنجاح!');
      setTimeout(() => setMessage(''), 3000);
    } else {
      setMessage('❌ خطأ في الحفظ: ' + error.message);
    }
    setSavingSettings(false);
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
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) {
      loadProducts();
    } else {
      alert('خطأ أثناء الحذف: ' + error.message);
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
        const fileName = `prod_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `uploads/${fileName}`;

        const { error: uploadError } = await supabase.storage.from('products').upload(filePath, file);
        if (!uploadError) {
          const { data } = supabase.storage.from('products').getPublicUrl(filePath);
          urls.push(data.publicUrl);
        }
      }
      setProductForm((prev) => ({ ...prev, images: [...prev.images, ...urls] }));
    } catch (err) {
      alert('فشل الرفع: ' + err.message);
    }
    setUploadingImage(false);
  };

  const removeImage = (idx) => {
    setProductForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx),
    }));
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

    let resultError = null;

    if (editingProduct) {
      const { error } = await supabase.from('products').update(payload).eq('id', editingProduct.id);
      resultError = error;
    } else {
      const { error } = await supabase.from('products').insert([payload]);
      resultError = error;
    }

    if (!resultError) {
      setIsModalOpen(false);
      loadProducts();
    } else {
      alert('حدث خطأ أثناء حفظ المنتج: ' + resultError.message);
    }
    setSavingProduct(false);
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-white font-sans" dir="rtl">
        <form onSubmit={handleLogin} className="bg-slate-800 p-8 rounded-3xl shadow-2xl w-full max-w-md border border-slate-700">
          <h1 className="text-2xl font-black mb-6 text-center text-emerald-400">لوحة تحكم المتجر</h1>
          {message && <div className="p-3 mb-4 bg-red-500/20 text-red-300 rounded-xl text-sm text-center">{message}</div>}
          <div className="mb-4">
            <label className="block mb-2 text-sm text-slate-300 font-semibold">البريد الإلكتروني</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-slate-700 border border-slate-600 text-white focus:outline-none focus:border-emerald-400"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block mb-2 text-sm text-slate-300 font-semibold">كلمة المرور</label>
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
    <div className="min-h-screen bg-slate-900 text-white font-sans p-4 sm:p-8" dir="rtl">
      <div className="max-w-5xl mx-auto">
        
        {/* الترويسة العلوية */}
        <header className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-emerald-400">لوحة تحكم المتجر</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">إدارة المنتجات، تسعير الشحن، وبيكسل التتبع الإعلاني</p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/"
              target="_blank"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-bold border border-slate-700 transition"
            >
              👁️ معاينة المتجر
            </a>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl text-sm font-bold transition"
            >
              تسجيل الخروج
            </button>
          </div>
        </header>

        {message && (
          <div className="p-4 mb-6 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-center font-bold">
            {message}
          </div>
        )}

        {/* أزرار التبويبات الرئيسية (Tabs) */}
        <div className="flex border-b border-slate-800 mb-8 gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('products')}
            className={`py-3 px-5 font-black text-sm rounded-xl transition ${
              activeTab === 'products'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            📦 المنتجات ({products.length})
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 px-5 font-black text-sm rounded-xl transition ${
              activeTab === 'settings'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            ⚙️ إعدادات المتجر والشحن
          </button>

          <button
            onClick={() => setActiveTab('pixel')}
            className={`py-3 px-5 font-black text-sm rounded-xl transition ${
              activeTab === 'pixel'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            🎯 إعدادات البيكسل (Tracking)
          </button>
        </div>

        {/* 1. تبويب المنتجات */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black text-white">قائمة المنتجات المعروضة</h2>
              <button
                onClick={openAddModal}
                className="py-3 px-5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-500/20 transition active:scale-95 flex items-center gap-2"
              >
                <span>➕</span>
                <span>إضافة منتج جديد</span>
              </button>
            </div>

            {loadingProducts ? (
              <div className="p-12 text-center text-slate-400">جاري تحميل المنتجات...</div>
            ) : products.length === 0 ? (
              <div className="bg-slate-800/50 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
                <span className="text-5xl">🛍️</span>
                <p className="text-lg text-slate-300 font-bold">لا يوجد أي منتج مضاف حتى الآن!</p>
                <button
                  onClick={openAddModal}
                  className="py-3 px-6 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm"
                >
                  أضف أول منتج لمتجرك الآن
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {products.map((prod) => (
                  <div key={prod.id} className="bg-slate-800/80 border border-slate-700 rounded-3xl p-4 flex flex-col justify-between shadow-xl">
                    <div className="space-y-3">
                      <div className="w-full h-44 bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-700/60">
                        {Array.isArray(prod.images) && prod.images[0] ? (
                          <img src={prod.images[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-slate-500 text-sm">بدون صورة</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base text-white line-clamp-1">{prod.name}</h3>
                        <p className="text-emerald-400 font-black text-lg mt-1">{prod.price} ج.م</p>
                      </div>
                      <div className="flex gap-2 text-xs text-slate-400">
                        {prod.show_colors && <span>🎨 ألوان</span>}
                        {prod.show_sizes && <span>📏 مقاسات</span>}
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4 pt-4 border-t border-slate-700/60">
                      <button
                        onClick={() => openEditModal(prod)}
                        className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded-xl transition"
                      >
                        تعديل ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(prod.id)}
                        className="py-2.5 px-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold text-xs rounded-xl transition"
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

        {/* 2. تبويب إعدادات المتجر والشحن */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="bg-slate-800/80 border border-slate-700 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div>
              <h2 className="text-xl font-black text-white mb-1">بيانات المتجر العامة</h2>
              <p className="text-xs text-slate-400 mb-4">اسم المتجر يظهر في ترويسة الموقع لجميع الزوار</p>
              <label className="block text-sm font-bold text-slate-300 mb-2">اسم المتجر / العلامة التجارية</label>
              <input
                type="text"
                value={settings.store_name}
                onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                placeholder="مثال: متجر لَمّة، الرواد ستور..."
                className="w-full p-3.5 rounded-xl bg-slate-700 border border-slate-600 text-white focus:outline-none focus:border-emerald-400"
                required
              />
            </div>

            <div className="border-t border-slate-700 pt-6 space-y-4">
              <div>
                <h3 className="text-lg font-black text-emerald-400">تسعير الشحن الإقليمي للمحافظات (ج.م)</h3>
                <p className="text-xs text-slate-400 mt-0.5">يتم احتساب التكلفة المحددة هنا فور اختيار العميل لمحافظته</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">القاهرة والجيزة</label>
                  <input
                    type="number"
                    value={settings.shipping_rates?.cairo_giza ?? 50}
                    onChange={(e) => setSettings({
                      ...settings,
                      shipping_rates: { ...settings.shipping_rates, cairo_giza: Number(e.target.value) }
                    })}
                    className="w-full p-3 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">الإسكندرية</label>
                  <input
                    type="number"
                    value={settings.shipping_rates?.alex ?? 60}
                    onChange={(e) => setSettings({
                      ...settings,
                      shipping_rates: { ...settings.shipping_rates, alex: Number(e.target.value) }
                    })}
                    className="w-full p-3 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">وجه بحري (الدلتا)</label>
                  <input
                    type="number"
                    value={settings.shipping_rates?.delta ?? 65}
                    onChange={(e) => setSettings({
                      ...settings,
                      shipping_rates: { ...settings.shipping_rates, delta: Number(e.target.value) }
                    })}
                    className="w-full p-3 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">مدن القناة</label>
                  <input
                    type="number"
                    value={settings.shipping_rates?.canal ?? 70}
                    onChange={(e) => setSettings({
                      ...settings,
                      shipping_rates: { ...settings.shipping_rates, canal: Number(e.target.value) }
                    })}
                    className="w-full p-3 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">وجه قبلي (الصعيد)</label>
                  <input
                    type="number"
                    value={settings.shipping_rates?.upper_egypt ?? 80}
                    onChange={(e) => setSettings({
                      ...settings,
                      shipping_rates: { ...settings.shipping_rates, upper_egypt: Number(e.target.value) }
                    })}
                    className="w-full p-3 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">محافظات حدودية</label>
                  <input
                    type="number"
                    value={settings.shipping_rates?.remote ?? 100}
                    onChange={(e) => setSettings({
                      ...settings,
                      shipping_rates: { ...settings.shipping_rates, remote: Number(e.target.value) }
                    })}
                    className="w-full p-3 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-base rounded-2xl shadow-lg shadow-emerald-500/20 transition active:scale-[0.99] disabled:opacity-50"
            >
              {savingSettings ? 'جاري الحفظ...' : 'حفظ إعدادات المتجر والشحن 🚀'}
            </button>
          </form>
        )}

        {/* 3. تبويب إعدادات البيكسل */}
        {activeTab === 'pixel' && (
          <form onSubmit={handleSaveSettings} className="bg-slate-800/80 border border-slate-700 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div>
              <h2 className="text-xl font-black text-white mb-1">إعدادات بيكسل الإعلانات (Meta & TikTok)</h2>
              <p className="text-xs text-slate-400 mb-6">
                ضع معرفات البيكسل ليقوم المتجر تلقائياً بتتبع أحداث: الزيارة (PageView)، إضافة للسلة (AddToCart)، بدء الطلب (InitiateCheckout)، وإتمام الشراء (Purchase).
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-1.5 flex items-center gap-2">
                  <span>🔵</span>
                  <span>Meta Pixel ID (فيسبوك بيكسل)</span>
                </label>
                <input
                  type="text"
                  placeholder="مثال: 123456789012345"
                  value={settings.fb_pixel_id}
                  onChange={(e) => setSettings({ ...settings, fb_pixel_id: e.target.value })}
                  className="w-full p-3.5 rounded-xl bg-slate-700 border border-slate-600 text-white focus:outline-none focus:border-emerald-400 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-300 mb-1.5 flex items-center gap-2">
                  <span>⚫</span>
                  <span>TikTok Pixel ID (تيك توك بيكسل)</span>
                </label>
                <input
                  type="text"
                  placeholder="مثال: C1234567890ABCDEF"
                  value={settings.tiktok_pixel_id}
                  onChange={(e) => setSettings({ ...settings, tiktok_pixel_id: e.target.value })}
                  className="w-full p-3.5 rounded-xl bg-slate-700 border border-slate-600 text-white focus:outline-none focus:border-emerald-400 font-mono text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-base rounded-2xl shadow-lg shadow-emerald-500/20 transition active:scale-[0.99] disabled:opacity-50"
            >
              {savingSettings ? 'جاري الحفظ...' : 'حفظ إعدادات البيكسل 🚀'}
            </button>
          </form>
        )}

      </div>

      {/* نافذة منبثقة لإضافة أو تعديل منتج (Modal) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl w-full max-w-2xl p-6 sm:p-8 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-700 pb-4">
              <h3 className="text-xl font-black text-emerald-400">
                {editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold"
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
                  placeholder="مثال: كوتش مريح وعملي"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full p-3 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm"
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
                    className="w-full p-3 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">السعر قبل الخصم (اختياري)</label>
                  <input
                    type="number"
                    value={productForm.original_price}
                    onChange={(e) => setProductForm({ ...productForm, original_price: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">وصف ومميزات المنتج</label>
                <textarea
                  rows="4"
                  placeholder="اكتب هنا كل مواصفات ومميزات المنتج..."
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full p-3 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm leading-relaxed"
                ></textarea>
              </div>

              {/* صور المنتج */}
              <div className="border border-slate-700 p-4 rounded-xl bg-slate-700/40 space-y-3">
                <label className="block text-xs font-bold text-slate-200">معرض الصور (اختر صورة أو أكثر)</label>
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
                      <div key={idx} className="relative group border border-slate-600 rounded-lg overflow-hidden h-20">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* قسم الألوان */}
              <div className="border border-slate-700 p-4 rounded-xl bg-slate-700/40 space-y-3">
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
                        className="w-10 h-9 p-1 bg-slate-700 border border-slate-600 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        placeholder="اسم اللون (مثال: أسود)"
                        value={newColorName}
                        onChange={(e) => setNewColorName(e.target.value)}
                        className="flex-1 p-2 rounded bg-slate-700 border border-slate-600 text-xs text-white"
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
                        <div key={i} className="flex items-center gap-1.5 bg-slate-800 px-2 py-1 rounded border border-slate-600 text-xs">
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

              {/* قسم المقاسات */}
              <div className="border border-slate-700 p-4 rounded-xl bg-slate-700/40 space-y-3">
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
                        className="flex-1 p-2 rounded bg-slate-700 border border-slate-600 text-xs text-white"
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
                        <div key={i} className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded border border-slate-600 text-xs font-bold">
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
                  disabled={savingProduct || uploadingImage || uploadingVideo}
                  className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl text-sm transition"
                >
                  {savingProduct ? 'جاري الحفظ...' : 'حفظ بيانات المنتج'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3.5 bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold rounded-xl text-sm"
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
