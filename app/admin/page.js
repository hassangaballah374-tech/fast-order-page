'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function AdminPage() {
  const [activeView, setActiveView] = useState('cart'); // 'cart' | 'products' | 'settings'
  const [loading, setLoading] = useState(true);

  // إعدادات المتجر والبيكسل
  const [settings, setSettings] = useState({
    store_name: '',
    facebook_pixel_id: '',
    tiktok_pixel_id: '',
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsNotice, setSettingsNotice] = useState(false);

  // بيانات السلة (الطلبات)
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // بيانات المنتجات
  const [products, setProducts] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
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
        const { data: sData } = await supabase.from('store_settings').select('*').eq('id', 1).maybeSingle();
        if (sData) {
          setSettings({
            store_name: sData.store_name || '',
            facebook_pixel_id: sData.facebook_pixel_id || '',
            tiktok_pixel_id: sData.tiktok_pixel_id || '',
          });
        }

        const { data: pData } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (pData) setProducts(pData);

        const { data: oData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (oData) setOrders(oData);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  // حفظ الإعدادات
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
      alert('خطأ أثناء الحفظ: ' + err.message);
    }
    setSavingSettings(false);
  };

  // فلترة السلة
  const filteredOrders = orders.filter((o) => {
    const matchSearch =
      (o.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.phone || '').includes(searchTerm) ||
      (o.governorate || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.city || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // تحديث حالة الطلب
  const handleUpdateStatus = async (id, status) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (!error) {
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    }
  };

  // حذف طلب
  const handleDeleteOrder = async (id) => {
    if (!confirm('هل تريد حذف هذا الطلب نهائياً من السلة؟')) return;
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (!error) {
      setOrders((prev) => prev.filter((o) => o.id !== id));
    }
  };

  // دوال المنتجات
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
      }
    } else {
      const { data, error } = await supabase.from('products').insert([payload]).select().single();
      if (!error && data) {
        setProducts((prev) => [data, ...prev]);
        setShowProductModal(false);
      }
    }
    setSavingProduct(false);
  };

  // الحسابات المالية وإحصائيات الحالات
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total_amount || o.total_price) || 0), 0);
  const totalOrdersCount = orders.length;

  // الحالات مع ألوانها وأيقوناتها
  const ALL_STATUSES = [
    { key: 'جديد', label: 'جديد', color: 'bg-emerald-500', barColor: '#10b981', textColor: 'text-emerald-400' },
    { key: 'قيد الانتظار', label: 'قيد الانتظار', color: 'bg-amber-500', barColor: '#f59e0b', textColor: 'text-amber-400' },
    { key: 'تم التأكيد', label: 'تم التأكيد', color: 'bg-blue-500', barColor: '#3b82f6', textColor: 'text-blue-400' },
    { key: 'تم الشحن', label: 'تم الشحن', color: 'bg-purple-500', barColor: '#a855f7', textColor: 'text-purple-400' },
    { key: 'تم التسليم', label: 'تم التسليم', color: 'bg-teal-500', barColor: '#14b8a6', textColor: 'text-teal-400' },
    { key: 'مرتجع', label: 'مرتجع', color: 'bg-rose-500', barColor: '#f43f5e', textColor: 'text-rose-400' },
    { key: 'ملغي', label: 'ملغي', color: 'bg-slate-500', barColor: '#64748b', textColor: 'text-slate-400' },
  ];

  // حساب عدد ونسبة كل حالة
  const statusStats = ALL_STATUSES.map((st) => {
    const count = orders.filter((o) => (o.status || 'جديد') === st.key).length;
    const percent = totalOrdersCount > 0 ? ((count / totalOrdersCount) * 100).toFixed(1) : 0;
    return { ...st, count, percent: Number(percent) };
  });

  const maxStatusCount = Math.max(...statusStats.map((s) => s.count), 1);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-sans" dir="rtl">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-bold">جاري تحميل السلة ولوحة التحكم...</p>
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
              <p className="text-xs text-slate-400">إدارة السلة والطلبات، المنتجات والتتبع</p>
            </div>
          </div>

          {/* التبويبات الرئيسية */}
          <div className="flex items-center bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveView('cart')}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                activeView === 'cart' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🛒 السلة</span>
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

            <button
              onClick={() => setActiveView('settings')}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                activeView === 'settings' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>⚙️ البيكسل والمتجر</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-8 space-y-6">

        {/* ---------------- 1. تبويب السلة ---------------- */}
        {activeView === 'cart' && (
          <div className="space-y-6">
            
            {/* البطاقات المالية العلوية */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-lg">
                <div className="text-slate-400 text-xs font-bold mb-1">إجمالي مبيعات السلة</div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-400">{totalRevenue.toLocaleString()} ج.م</div>
              </div>
              <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-lg">
                <div className="text-slate-400 text-xs font-bold mb-1">إجمالي عدد الطلبات الكلي</div>
                <div className="text-2xl sm:text-3xl font-black text-white">{totalOrdersCount} طلب</div>
              </div>
              <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-lg">
                <div className="text-slate-400 text-xs font-bold mb-1">متوسط قيمة الطلب الواحد</div>
                <div className="text-2xl sm:text-3xl font-black text-teal-400">
                  {totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0} ج.م
                </div>
              </div>
            </div>

            {/* جدول الأعمدة ونسب كل حالة (Bar Chart & Analytics) */}
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <span>📊</span>
                    <span>تحليل ونسب حالات الطلبات (جدول الأعمدة)</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">نسبة وتوزيع كل حالة من إجمالي طلبات المتجر</p>
                </div>
                <span className="text-xs font-bold bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-emerald-400">
                  إجمالي الطلبات: {totalOrdersCount}
                </span>
              </div>

              {/* 1. الأعمدة الرأسية المقارنة (Visual Bar Chart) */}
              <div className="pt-4 pb-2">
                <div className="h-44 sm:h-52 flex items-end justify-between gap-2 sm:gap-4 px-2 sm:px-6 bg-slate-950/60 rounded-2xl border border-slate-800/80 pt-6 pb-3">
                  {statusStats.map((st, idx) => {
                    const barHeightPercent = totalOrdersCount > 0 ? Math.max((st.count / maxStatusCount) * 100, 6) : 6;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                        <span className="text-[11px] font-black text-white mb-1.5 group-hover:scale-110 transition">
                          {st.count}
                        </span>
                        <div className="w-full max-w-[42px] bg-slate-800/50 rounded-t-xl overflow-hidden flex items-end h-full">
                          <div
                            style={{ height: `${barHeightPercent}%`, backgroundColor: st.barColor }}
                            className="w-full rounded-t-xl transition-all duration-700 shadow-lg group-hover:brightness-125"
                          ></div>
                        </div>
                        <span className="text-[10px] sm:text-xs font-bold text-slate-300 mt-2 truncate w-full text-center">
                          {st.label}
                        </span>
                        <span className={`text-[10px] sm:text-[11px] font-black mt-0.5 ${st.textColor}`}>
                          {st.percent}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. بطاقات النسب الأفقية التفصيلية */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-2">
                {statusStats.map((st, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setStatusFilter(st.key)}
                    className={`p-3 rounded-2xl border text-right transition hover:scale-[1.02] ${
                      statusFilter === st.key
                        ? 'bg-slate-800 border-emerald-500 shadow-md ring-1 ring-emerald-500'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs text-slate-400 font-bold mb-1">
                      <span className="truncate">{st.label}</span>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: st.barColor }}></span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-base font-black text-white">{st.count}</span>
                      <span className={`text-xs font-black ${st.textColor}`}>{st.percent}%</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* شريط البحث وفلترة الحالة (مع خيار الكل) */}
            <div className="bg-slate-900 p-4 rounded-3xl border border-slate-800 flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="ابحث باسم العميل، رقم الهاتف، المحافظة أو المركز..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 text-white rounded-2xl p-3 text-sm focus:outline-none focus:border-emerald-500"
              />

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 whitespace-nowrap">الحالة:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-200 rounded-2xl p-3 text-sm font-bold cursor-pointer min-w-[150px] focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">الكل (جميع الحالات) ({totalOrdersCount})</option>
                  <option value="جديد">جديد</option>
                  <option value="قيد الانتظار">قيد الانتظار</option>
                  <option value="تم التأكيد">تم التأكيد</option>
                  <option value="تم الشحن">تم الشحن</option>
                  <option value="تم التسليم">تم التسليم</option>
                  <option value="مرتجع">مرتجع</option>
                  <option value="ملغي">ملغي</option>
                </select>
              </div>

              <button
                onClick={loadAllData}
                className="px-5 py-3 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-2xl text-sm font-bold transition"
              >
                🔄 تحديث
              </button>
            </div>

            {/* قائمة كروت وعناصر السلة مع الترقيم التلقائي */}
            {filteredOrders.length === 0 ? (
              <div className="bg-slate-900 p-12 text-center text-slate-400 font-bold rounded-3xl border border-slate-800">
                🛒 لا توجد طلبات مطابقة للبحث أو الفلتر المختار
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order, index) => {
                  const statusColors = {
                    'جديد': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
                    'قيد الانتظار': 'bg-amber-500/20 text-amber-400 border-amber-500/40',
                    'تم التأكيد': 'bg-blue-500/20 text-blue-400 border-blue-500/40',
                    'تم الشحن': 'bg-purple-500/20 text-purple-400 border-purple-500/40',
                    'تم التسليم': 'bg-teal-500/20 text-teal-400 border-teal-500/40',
                    'مرتجع': 'bg-rose-500/20 text-rose-400 border-rose-500/40',
                    'ملغي': 'bg-slate-700/40 text-slate-400 border-slate-600',
                  };

                  return (
                    <div
                      key={order.id}
                      className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 transition hover:border-slate-700 relative overflow-hidden"
                    >
                      {/* رأس الطلب مع شارة الترقيم التلقائي والحالة */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                        <div className="flex items-center gap-3">
                          {/* شارة الترقيم التلقائي للطلب */}
                          <div className="flex flex-col items-center justify-center w-11 h-11 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 font-black">
                            <span className="text-[10px] text-emerald-500 leading-none">طلب</span>
                            <span className="text-base leading-none mt-0.5">#{index + 1}</span>
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-black text-lg text-white">{order.customer_name}</h3>
                            </div>
                            <span className="text-xs text-slate-400 font-mono">
                              بتاريخ: {new Date(order.created_at).toLocaleDateString('ar-EG', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>

                        {/* تغيير الحالة */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 font-bold">الحالة:</span>
                          <select
                            value={order.status || 'جديد'}
                            onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                            className={`text-xs font-black px-3 py-1.5 rounded-xl border cursor-pointer focus:outline-none bg-slate-950 ${
                              statusColors[order.status || 'جديد'] || 'border-slate-700 text-white'
                            }`}
                          >
                            <option value="جديد">جديد</option>
                            <option value="قيد الانتظار">قيد الانتظار</option>
                            <option value="تم التأكيد">تم التأكيد</option>
                            <option value="تم الشحن">تم الشحن</option>
                            <option value="تم التسليم">تم التسليم</option>
                            <option value="مرتجع">مرتجع</option>
                            <option value="ملغي">ملغي</option>
                          </select>
                        </div>
                      </div>

                      {/* تفاصيل الهاتف والعنوان والإجمالي */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-2">
                          <span className="text-xs font-bold text-slate-400 block">📞 الهاتف والتواصل:</span>
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-emerald-400 font-bold" dir="ltr">{order.phone}</span>
                            <a
                              href={`https://wa.me/2${order.phone?.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                            >
                              <span>💬</span>
                              <span>واتساب</span>
                            </a>
                          </div>
                        </div>

                        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-1">
                          <span className="text-xs font-bold text-slate-400 block">📍 عنوان التوصيل:</span>
                          <p className="text-white font-bold text-xs sm:text-sm">
                            {order.governorate} {order.city && `- ${order.city}`}
                          </p>
                          <p className="text-slate-400 text-xs">{order.address}</p>
                        </div>

                        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
                          <span className="text-xs font-bold text-slate-400">💰 المبلغ الإجمالي:</span>
                          <div className="flex items-baseline justify-between mt-1">
                            <span className="text-2xl font-black text-emerald-400">
                              {order.total_amount || order.total_price} ج.م
                            </span>
                            <span className="text-[11px] text-slate-500 font-bold">شامل الشحن</span>
                          </div>
                        </div>
                      </div>

                      {/* محتويات الطلب والمنتجات وحذف الطلب */}
                      <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-slate-400 block">🛍️ المنتجات المطلوبة:</span>
                          <p className="text-sm font-black text-white">{order.product_name}</p>
                          <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                            {order.selected_color && order.selected_color !== '-' && (
                              <span className="bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                                اللون: <strong className="text-slate-200">{order.selected_color}</strong>
                              </span>
                            )}
                            {order.selected_size && order.selected_size !== '-' && (
                              <span className="bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                                المقاس: <strong className="text-slate-200">{order.selected_size}</strong>
                              </span>
                            )}
                            {order.quantity && (
                              <span className="bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                                العدد: <strong className="text-emerald-400">{order.quantity}</strong>
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className="px-4 py-2 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1 self-end sm:self-center"
                        >
                          <span>🗑️</span>
                          <span>حذف من السلة</span>
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ---------------- 2. تبويب المنتجات والأرباح ---------------- */}
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
                        <span>✏️️</span>
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

        {/* ---------------- 3. تبويب البيكسل والمتجر ---------------- */}
        {activeView === 'settings' && (
          <form onSubmit={handleSaveSettings} className="bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-black text-white">⚙️ ربط البيكسل وإعدادات المتجر</h2>
                <p className="text-xs text-slate-400 mt-0.5">تحديث معرّف التتبع لفيسبوك وتيك توك واسم المتجر</p>
              </div>
              {settingsNotice && (
                <span className="text-xs text-emerald-400 font-bold animate-pulse">
                  ✅ تم حفظ التعديلات بنجاح!
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
                  placeholder="870300779500843"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">TikTok Pixel ID</label>
                <input
                  type="text"
                  value={settings.tiktok_pixel_id}
                  onChange={(e) => setSettings({ ...settings, tiktok_pixel_id: e.target.value })}
                  placeholder="C1234567890"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingSettings}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition shadow-lg disabled:opacity-50"
              >
                {savingSettings ? 'جاري الحفظ...' : 'حفظ الإعدادات 💾'}
              </button>
            </div>
          </form>
        )}

      </main>

      {/* مودال إضافة وتعديل المنتج */}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">سعر البيع للعميل (ج.م)</label>
                  <input
                    type="number"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">سعر التكلفة الأصلي (ج.م)</label>
                  <input
                    type="number"
                    value={productForm.original_price}
                    onChange={(e) => setProductForm({ ...productForm, original_price: e.target.value })}
                    placeholder="تكلفة المنتج عليك"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm"
                  />
                </div>
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
                    onClick={() => {
                      if (newImageUrl.trim()) {
                        setProductForm((prev) => ({ ...prev, images: [...prev.images, newImageUrl.trim()] }));
                        setNewImageUrl('');
                      }
                    }}
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
                        onClick={() => setProductForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))}
                        className="absolute top-1 left-1 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
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
