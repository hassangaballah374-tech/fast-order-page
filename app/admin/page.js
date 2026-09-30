'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function AdminPage() {
  const [activeView, setActiveView] = useState('main'); // 'main' (الرئيسية والطلبات) | 'products' (المنتجات)
  const [loading, setLoading] = useState(true);

  // إعدادات المتجر والبيكسل
  const [settings, setSettings] = useState({
    store_name: '',
    facebook_pixel_id: '',
    tiktok_pixel_id: '',
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsNotice, setSettingsNotice] = useState(false);

  // الطلبات
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // المنتجات
  const [products, setProducts] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',          // سعر البيع للعميل
    original_price: '', // سعر التكلفة / السعر الأصلي
    description: '',
    images: [],
    video_url: '',
    show_colors: false,
    colors: [],
    show_sizes: false,
    sizes: [],
  });

  const [newImageUrl, setNewImageUrl] = useState('');
  const [newColor, setNewColor] = useState({ name: '', code: '#000000' });
  const [newSize, setNewSize] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);
    try {
      if (supabase) {
        // 1. جلب الإعدادات والبيكسل
        const { data: sData } = await supabase.from('store_settings').select('*').eq('id', 1).maybeSingle();
        if (sData) {
          setSettings({
            store_name: sData.store_name || '',
            facebook_pixel_id: sData.facebook_pixel_id || '',
            tiktok_pixel_id: sData.tiktok_pixel_id || '',
          });
        }

        // 2. جلب المنتجات
        const { data: pData } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (pData) setProducts(pData);

        // 3. جلب الطلبات
        const { data: oData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (oData) setOrders(oData);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  // حفظ إعدادات البيكسل والمتجر
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await supabase.from('store_settings').upsert({
        id: 1,
        store_name: settings.store_name,
        facebook_pixel_id: settings.facebook_pixel_id,
        tiktok_pixel_id: settings.tiktok_pixel_id,
      });
      setSettingsNotice(true);
      setTimeout(() => setSettingsNotice(false), 3000);
    } catch (err) {
      alert('خطأ في حفظ الإعدادات: ' + err.message);
    }
    setSavingSettings(false);
  };

  // دوال الطلبات
  const filteredOrders = orders.filter((o) => {
    const matchSearch =
      (o.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.phone || '').includes(searchTerm) ||
      (o.governorate || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleUpdateStatus = async (id, status) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (!error) {
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    }
  };

  const handleDeleteOrder = async (id) => {
    if (!confirm('هل تريد حذف هذا الطلب نهائياً؟')) return;
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (!error) {
      setOrders((prev) => prev.filter((o) => o.id !== id));
    }
  };

  // دوال إدارة المنتجات
  const openNewProductModal = () => {
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
    setShowProductModal(true);
  };

  const openEditProductModal = (prod) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name || '',
      price: prod.price || '',
      original_price: prod.original_price || '',
      description: prod.description || '',
      images: prod.images || [],
      video_url: prod.video_url || '',
      show_colors: Boolean(prod.show_colors),
      colors: prod.colors || [],
      show_sizes: Boolean(prod.show_sizes),
      sizes: prod.sizes || [],
    });
    setShowProductModal(true);
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } else {
      alert('خطأ أثناء الحذف: ' + error.message);
    }
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

    if (editingProduct?.id) {
      const { error } = await supabase.from('products').update(payload).eq('id', editingProduct.id);
      if (!error) {
        setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? { ...p, ...payload } : p)));
        setShowProductModal(false);
      } else {
        alert('خطأ في تعديل المنتج: ' + error.message);
      }
    } else {
      const { data, error } = await supabase.from('products').insert([payload]).select().single();
      if (!error && data) {
        setProducts((prev) => [data, ...prev]);
        setShowProductModal(false);
      } else {
        alert('خطأ في إضافة المنتج: ' + error.message);
      }
    }
    setSavingProduct(false);
  };

  // إدارة عناصر المنتج (صور، ألوان، مقاسات)
  const addImageToForm = () => {
    if (!newImageUrl.trim()) return;
    setProductForm((prev) => ({ ...prev, images: [...prev.images, newImageUrl.trim()] }));
    setNewImageUrl('');
  };

  const removeImageFromForm = (idx) => {
    setProductForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
  };

  const addColorToForm = () => {
    if (!newColor.name.trim()) return;
    setProductForm((prev) => ({
      ...prev,
      colors: [...prev.colors, { name: newColor.name.trim(), code: newColor.code }],
    }));
    setNewColor({ name: '', code: '#000000' });
  };

  const removeColorFromForm = (idx) => {
    setProductForm((prev) => ({ ...prev, colors: prev.colors.filter((_, i) => i !== idx) }));
  };

  const addSizeToForm = () => {
    if (!newSize.trim()) return;
    setProductForm((prev) => ({ ...prev, sizes: [...prev.sizes, newSize.trim()] }));
    setNewSize('');
  };

  const removeSizeFromForm = (idx) => {
    setProductForm((prev) => ({ ...prev, sizes: prev.sizes.filter((_, i) => i !== idx) }));
  };

  // الحسابات المالية
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total_amount || o.total_price) || 0), 0);
  const pendingOrders = orders.filter((o) => (o.status || 'جديد') === 'جديد').length;

  // احتساب هامش الربح للنموذج
  const currentMargin = (Number(productForm.price) || 0) - (Number(productForm.original_price) || 0);
  const currentMarginPercent = productForm.price > 0 && productForm.original_price > 0
    ? Math.round((currentMargin / Number(productForm.price)) * 100)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-sans" dir="rtl">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-bold">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16" dir="rtl">
      {/* الشريط العلوي */}
      <header className="bg-slate-900/90 backdrop-blur border-b border-slate-800 sticky top-0 z-30 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white">{settings.store_name || 'لوحة تحكم المتجر'}</h1>
              <p className="text-xs text-slate-400">إدارة التتبع، المبيعات والمنتجات</p>
            </div>
          </div>

          {/* أزرار التبديل الرئيسية */}
          <div className="flex items-center bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveView('main')}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                activeView === 'main' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>📊 الرئيسية والطلبات</span>
              <span className="bg-slate-900 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-black">
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveView('products')}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                activeView === 'products' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🛍️ المنتجات والأرباح</span>
              <span className="bg-slate-900 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-black">
                {products.length}
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-8 space-y-6">

        {/* ---------------- 1. الصفحة الرئيسية: البيكسل، الإحصائيات، والطلبات ---------------- */}
        {activeView === 'main' && (
          <div className="space-y-6">
            
            {/* بطاقات الإحصائيات المالية */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-lg">
                <div className="text-slate-400 text-xs font-bold mb-1">إجمالي الإيرادات الكلية</div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-400">{totalRevenue.toLocaleString()} ج.م</div>
              </div>
              <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-lg">
                <div className="text-slate-400 text-xs font-bold mb-1">إجمالي الطلبات</div>
                <div className="text-2xl sm:text-3xl font-black text-white">{orders.length} طلب</div>
              </div>
              <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-lg">
                <div className="text-slate-400 text-xs font-bold mb-1">طلبات جديدة في الانتظار</div>
                <div className="text-2xl sm:text-3xl font-black text-amber-400">{pendingOrders} طلب</div>
              </div>
            </div>

            {/* قسم إعدادات البيكسل واسم المتجر */}
            <form onSubmit={handleSaveSettings} className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <span>🎯</span>
                  <span>ربط البيكسل وإعدادات المتجر</span>
                </h2>
                {settingsNotice && (
                  <span className="text-xs text-emerald-400 font-bold animate-pulse">
                    ✅ تم حفظ وتحديث البيكسل بنجاح!
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">اسم المتجر</label>
                  <input
                    type="text"
                    value={settings.store_name}
                    onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                    placeholder="متجرنا الرسمي"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Meta Pixel ID (فيسبوك)</label>
                  <input
                    type="text"
                    value={settings.facebook_pixel_id}
                    onChange={(e) => setSettings({ ...settings, facebook_pixel_id: e.target.value })}
                    placeholder="مثال: 870300779500843"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">TikTok Pixel ID</label>
                  <input
                    type="text"
                    value={settings.tiktok_pixel_id}
                    onChange={(e) => setSettings({ ...settings, tiktok_pixel_id: e.target.value })}
                    placeholder="مثال: C1234567890"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition shadow-md disabled:opacity-50"
                >
                  {savingSettings ? 'جاري الحفظ...' : 'حفظ البيكسل والإعدادات 💾'}
                </button>
              </div>
            </form>

            {/* جدول الطلبات وبيانات العملاء */}
            <div className="space-y-4">
              <div className="bg-slate-900 p-4 rounded-3xl border border-slate-800 flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="ابحث باسم العميل، الهاتف، أو المحافظة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 text-white rounded-2xl p-3 text-sm focus:outline-none focus:border-emerald-500"
                />

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-200 rounded-2xl p-3 text-sm font-bold cursor-pointer"
                >
                  <option value="all">كل الحالات</option>
                  <option value="جديد">جديد</option>
                  <option value="تم التأكيد">تم التأكيد</option>
                  <option value="تم الشحن">تم الشحن</option>
                  <option value="تم التوصيل">تم التوصيل</option>
                  <option value="ملغي">ملغي</option>
                </select>

                <button
                  onClick={loadAllData}
                  className="px-5 py-3 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-2xl text-sm font-bold transition"
                >
                  🔄 تحديث
                </button>
              </div>

              <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
                {filteredOrders.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 font-bold">لا توجد طلبات مسجلة</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 text-xs font-bold uppercase">
                          <th className="p-4">العميل</th>
                          <th className="p-4">الهاتف والواتساب</th>
                          <th className="p-4">المحافظة / العنوان</th>
                          <th className="p-4">تفاصيل المنتجات</th>
                          <th className="p-4">الإجمالي الكلي</th>
                          <th className="p-4">الحالة</th>
                          <th className="p-4">التاريخ</th>
                          <th className="p-4 text-center">إجراء</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-sm">
                        {filteredOrders.map((order) => (
                          <tr key={order.id} className="transition hover:bg-slate-800/50">
                            <td className="p-4 font-bold text-white">{order.customer_name}</td>
                            <td className="p-4 font-mono text-emerald-400" dir="ltr">
                              <a
                                href={`https://wa.me/2${order.phone?.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="hover:underline flex items-center gap-1.5"
                                title="فتح محادثة واتساب"
                              >
                                <span>💬</span>
                                <span>{order.phone}</span>
                              </a>
                            </td>
                            <td className="p-4 text-xs text-slate-300 max-w-xs truncate" title={order.address}>
                              <span className="font-bold text-white">{order.governorate}</span> - {order.address}
                            </td>
                            <td className="p-4 text-xs text-slate-300 max-w-xs">
                              <div className="font-medium text-white">{order.product_name}</div>
                              {(order.selected_color || order.selected_size) && (
                                <div className="text-[11px] text-slate-400 mt-0.5">
                                  {order.selected_color && order.selected_color !== '-' && `اللون: ${order.selected_color} `}
                                  {order.selected_size && order.selected_size !== '-' && `المقاس: ${order.selected_size}`}
                                </div>
                              )}
                            </td>
                            <td className="p-4 font-black text-emerald-400 text-base">
                              {order.total_amount || order.total_price} ج.م
                            </td>
                            <td className="p-4">
                              <select
                                value={order.status || 'جديد'}
                                onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                                className="bg-slate-950 border border-slate-800 text-xs font-bold rounded-xl p-2 text-white cursor-pointer focus:outline-none"
                              >
                                <option value="جديد">جديد</option>
                                <option value="تم التأكيد">تم التأكيد</option>
                                <option value="تم الشحن">تم الشحن</option>
                                <option value="تم التوصيل">تم التوصيل</option>
                                <option value="ملغي">ملغي</option>
                              </select>
                            </td>
                            <td className="p-4 text-xs text-slate-400 font-mono">
                              {new Date(order.created_at).toLocaleDateString('ar-EG', {
                                month: 'numeric',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => handleDeleteOrder(order.id)}
                                className="p-2 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-xl transition"
                                title="حذف الطلب"
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ---------------- 2. صفحة المنتجات وهامش الربح ---------------- */}
        {activeView === 'products' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-slate-900 p-5 rounded-3xl border border-slate-800">
              <div>
                <h2 className="text-xl font-black text-white">قائمة المنتجات المعروضة</h2>
                <p className="text-xs text-slate-400 mt-0.5">إدارة أسعار البيع والتكلفة ومتابعة هوامش الأرباح</p>
              </div>
              <button
                onClick={openNewProductModal}
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-sm transition shadow-lg flex items-center gap-2"
              >
                <span>➕</span>
                <span>إضافة منتج جديد</span>
              </button>
            </div>

            {/* شبكة المنتجات */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p) => {
                const cost = Number(p.original_price) || 0;
                const price = Number(p.price) || 0;
                const margin = price - cost;
                const marginPercent = price > 0 && cost > 0 ? Math.round((margin / price) * 100) : 0;

                return (
                  <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      {p.images && p.images.length > 0 ? (
                        <div className="w-full h-48 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
                          <img src={p.images[0]} alt={p.name} className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div className="w-full h-48 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center text-slate-600 text-4xl">
                          📦
                        </div>
                      )}

                      <h3 className="font-black text-lg text-white line-clamp-1">{p.name}</h3>

                      {/* شريط الأسعار وهوامش الربح */}
                      <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">سعر البيع للعميل:</span>
                          <span className="text-emerald-400 font-black text-sm">{price} ج.م</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">سعر التكلفة (الأصلي):</span>
                          <span className="text-slate-300 font-bold">{cost > 0 ? `${cost} ج.م` : 'غير محدد'}</span>
                        </div>
                        <div className="border-t border-slate-800 pt-2 flex justify-between items-center font-bold">
                          <span className="text-slate-300">صافي هامش الربح:</span>
                          <span className={`text-sm font-black ${margin >= 0 ? 'text-teal-400' : 'text-red-400'}`}>
                            {margin > 0 ? `+${margin} ج.م (${marginPercent}%)` : `${margin} ج.م`}
                          </span>
                        </div>
                      </div>

                      {p.description && (
                        <p className="text-xs text-slate-400 line-clamp-2">{p.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                      <button
                        onClick={() => openEditProductModal(p)}
                        className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                      >
                        <span>✏️</span>
                        <span>تعديل</span>
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="px-4 py-2.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-xl text-xs font-bold transition"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </main>

      {/* مودال (Modal) إضافة وتعديل المنتج وهامش الربح */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xl font-black text-white">
                {editingProduct ? '✏️ تعديل المنتج' : '➕ إضافة منتج جديد'}
              </h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">اسم المنتج</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* الأسعار وحساب هامش الربح المباشر */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">سعر البيع المطلوب (ج.م)</label>
                  <input
                    type="number"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">سعر التكلفة / السعر الأصلي (ج.م)</label>
                  <input
                    type="number"
                    value={productForm.original_price}
                    onChange={(e) => setProductForm({ ...productForm, original_price: e.target.value })}
                    placeholder="التكلفة عليك"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm"
                  />
                </div>
              </div>

              {/* حاسبة هامش الربح اللحظية */}
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold">هامش الربح المتوقع للقطعة:</span>
                <span className="text-emerald-400 font-black text-sm">
                  {currentMargin} ج.م {currentMarginPercent > 0 && `(${currentMarginPercent}%)`}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">وصف المنتج</label>
                <textarea
                  rows="3"
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-emerald-500"
                ></textarea>
              </div>

              {/* إضافة صور */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-400">صور المنتج</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="رابط الصورة المباشر..."
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-sm"
                  />
                  <button
                    type="button"
                    onClick={addImageToForm}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
                  >
                    + إضافة
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {productForm.images.map((img, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-800">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImageFromForm(idx)}
                        className="absolute top-1 left-1 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* خيارات الألوان */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="modal_colors"
                    checked={productForm.show_colors}
                    onChange={(e) => setProductForm({ ...productForm, show_colors: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                  />
                  <label htmlFor="modal_colors" className="text-xs font-bold text-white cursor-pointer">
                    تفعيل الألوان
                  </label>
                </div>

                {productForm.show_colors && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="اسم اللون"
                        value={newColor.name}
                        onChange={(e) => setNewColor({ ...newColor, name: e.target.value })}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-2 text-white text-xs"
                      />
                      <input
                        type="color"
                        value={newColor.code}
                        onChange={(e) => setNewColor({ ...newColor, code: e.target.value })}
                        className="w-10 h-9 p-1 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={addColorToForm}
                        className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold"
                      >
                        إضافة
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {productForm.colors.map((c, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-white">
                          <span className="w-3 h-3 rounded-full border border-slate-700" style={{ backgroundColor: c.code }}></span>
                          <span>{c.name}</span>
                          <button type="button" onClick={() => removeColorFromForm(idx)} className="text-red-400 ml-1">✕</button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* خيارات المقاسات */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="modal_sizes"
                    checked={productForm.show_sizes}
                    onChange={(e) => setProductForm({ ...productForm, show_sizes: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                  />
                  <label htmlFor="modal_sizes" className="text-xs font-bold text-white cursor-pointer">
                    تفعيل المقاسات
                  </label>
                </div>

                {productForm.show_sizes && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="المقاس (M, L, XL)"
                        value={newSize}
                        onChange={(e) => setNewSize(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-2 text-white text-xs"
                      />
                      <button
                        type="button"
                        onClick={addSizeToForm}
                        className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold"
                      >
                        إضافة
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {productForm.sizes.map((s, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-white">
                          <span>{s}</span>
                          <button type="button" onClick={() => removeSizeFromForm(idx)} className="text-red-400 ml-1">✕</button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-5 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl text-sm"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition shadow-lg disabled:opacity-50"
                >
                  {savingProduct ? 'جاري الحفظ...' : 'حفظ المنتج'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
