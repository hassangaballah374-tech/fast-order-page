'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function AdminPage() {
  const [activeView, setActiveView] = useState('products'); // 'cart' | 'products' | 'settings'
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

  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newColorName, setNewColorName] = useState('');
  const [newColorCode, setNewColorCode] = useState('#000000');
  const [newSize, setNewSize] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);
    try {
      if (supabase) {
        // 1. جلب إعدادات المتجر
        const { data: sData } = await supabase.from('store_settings').select('*').limit(1).maybeSingle();
        if (sData) {
          setSettings({
            store_name: sData.store_name || '',
            facebook_pixel_id: sData.facebook_pixel_id || '',
            tiktok_pixel_id: sData.tiktok_pixel_id || '',
          });
        }

        // 2. جلب كل المنتجات من جدول products
        const { data: pData } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        let combined = pData ? [...pData] : [];

        // ضم المنتج الأصلي من store_settings إن وجد ولم يكن مكرراً
        if (sData && sData.product_name) {
          const exists = combined.some((p) => p.name === sData.product_name);
          if (!exists) {
            combined.push({
              id: 'legacy_product',
              is_legacy: true,
              name: sData.product_name,
              price: Number(sData.product_price) || 0,
              original_price: Number(sData.original_price) || null,
              description: sData.description || '',
              images: sData.images || (sData.image_url ? [sData.image_url] : []),
              video_url: sData.video_url || '',
              show_colors: Boolean(sData.show_colors),
              colors: sData.colors || [],
              show_sizes: Boolean(sData.show_sizes),
              sizes: sData.sizes || [],
            });
          }
        }

        setProducts(combined);

        // 3. جلب الطلبات
        const { data: oData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (oData) setOrders(oData);
      }
    } catch (e) {
      console.error('Error loading data:', e);
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
      alert('خطأ أثناء الحفظ: ' + err.message);
    }
    setSavingSettings(false);
  };

  // فلترة الطلبات
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

  // فتح وإغلاق نافذة المنتج
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
    setNewImageUrl('');
    setNewColorName('');
    setNewColorCode('#000000');
    setNewSize('');
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
    setNewImageUrl('');
    setNewColorName('');
    setNewColorCode('#000000');
    setNewSize('');
    setShowProductModal(true);
  };

  const handleDeleteProduct = async (prod) => {
    if (!confirm(`هل أنت متأكد من حذف المنتج: ${prod.name}؟`)) return;

    if (prod.id !== 'legacy_product') {
      const { error } = await supabase.from('products').delete().eq('id', prod.id);
      if (error) alert('خطأ أثناء الحذف: ' + error.message);
    } else {
      await supabase.from('store_settings').update({
        product_name: null,
        product_price: null,
        description: null,
        images: [],
      }).eq('id', 1);
    }

    setProducts((prev) => prev.filter((p) => p.id !== prod.id));
  };

  // ضغط الصور تلقائياً لتسريع الرفع والتخزين
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height *= maxDim / width;
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width *= maxDim / height;
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
      };
    });
  };

  const handleImageFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingMedia(true);
    try {
      const compressedList = [];
      for (const file of files) {
        const compressed = await compressImage(file);
        compressedList.push(compressed);
      }
      setProductForm((prev) => ({
        ...prev,
        images: [...(prev.images || []), ...compressedList],
      }));
    } catch (err) {
      alert('خطأ أثناء رفع الصورة: ' + err.message);
    }
    setUploadingMedia(false);
    e.target.value = '';
  };

  const handleVideoFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('⚠️ حجم الفيديو أكبر من 15 ميجابايت، يرجى اختيار فيديو أقصر أو لصق رابط مباشر');
      return;
    }

    setUploadingMedia(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      setProductForm((prev) => ({
        ...prev,
        video_url: event.target.result,
      }));
      setUploadingMedia(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // حفظ المنتج المستقل (دون استبدال القديم)
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setSavingProduct(true);

    const payload = {
      name: productForm.name,
      price: Number(productForm.price),
      original_price: Number(productForm.original_price) || null,
      description: productForm.description,
      images: productForm.images || [],
      video_url: productForm.video_url || '',
      show_colors: Boolean(productForm.show_colors),
      colors: productForm.colors || [],
      show_sizes: Boolean(productForm.show_sizes),
      sizes: productForm.sizes || [],
    };

    try {
      if (editingProduct?.id && editingProduct.id !== 'legacy_product') {
        // تعديل منتج قائم
        const { error } = await supabase.from('products').update(payload).eq('id', editingProduct.id);
        if (error) throw error;
        setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? { ...p, ...payload } : p)));
      } else {
        // إضافة منتج جديد كصفحة منفصلة برقم id مستقل في جدول products!
        const { data, error } = await supabase.from('products').insert([payload]).select().single();
        if (error) throw error;
        if (data) {
          setProducts((prev) => [data, ...prev]);
        }
      }

      alert('✅ تم حفظ المنتج بنجاح كصفحة جديدة مستقلة!');
      setShowProductModal(false);
    } catch (err) {
      alert('❌ فشل الحفظ! السبب: ' + err.message);
      console.error(err);
    }
    setSavingProduct(false);
  };

  // دوال الألوان والمقاسات
  const addColor = () => {
    if (!newColorName.trim()) return;
    setProductForm((prev) => ({
      ...prev,
      colors: [...(prev.colors || []), { name: newColorName.trim(), code: newColorCode }],
    }));
    setNewColorName('');
  };

  const removeColor = (idx) => {
    setProductForm((prev) => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== idx),
    }));
  };

  const addSize = () => {
    if (!newSize.trim()) return;
    setProductForm((prev) => ({
      ...prev,
      sizes: [...(prev.sizes || []), newSize.trim()],
    }));
    setNewSize('');
  };

  const removeSize = (idx) => {
    setProductForm((prev) => ({
      ...prev,
      sizes: prev.sizes.filter((_, i) => i !== idx),
    }));
  };

  const removeImage = (idx) => {
    setProductForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx),
    }));
  };

  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total_amount || o.total_price) || 0), 0);
  const totalOrdersCount = orders.length;

  const ALL_STATUSES = [
    { key: 'جديد', label: 'جديد', barColor: '#10b981', textColor: 'text-emerald-400' },
    { key: 'قيد الانتظار', label: 'قيد الانتظار', barColor: '#f59e0b', textColor: 'text-amber-400' },
    { key: 'تم التأكيد', label: 'تم التأكيد', barColor: '#3b82f6', textColor: 'text-blue-400' },
    { key: 'تم الشحن', label: 'تم الشحن', barColor: '#a855f7', textColor: 'text-purple-400' },
    { key: 'تم التسليم', label: 'تم التسليم', barColor: '#14b8a6', textColor: 'text-teal-400' },
    { key: 'مرتجع', label: 'مرتجع', barColor: '#f43f5e', textColor: 'text-rose-400' },
    { key: 'ملغي', label: 'ملغي', barColor: '#64748b', textColor: 'text-slate-400' },
  ];

  const statusStats = ALL_STATUSES.map((st) => {
    const count = orders.filter((o) => (o.status || 'جديد') === st.key).length;
    const percent = totalOrdersCount > 0 ? ((count / totalOrdersCount) * 100).toFixed(1) : 0;
    return { ...st, count, percent: Number(percent) };
  });

  const maxStatusCount = Math.max(...statusStats.map((s) => s.count), 1);

  const currentMargin = (Number(productForm.price) || 0) - (Number(productForm.original_price) || 0);
  const currentMarginPercent = productForm.price > 0 && productForm.original_price > 0
    ? Math.round((currentMargin / Number(productForm.price)) * 100)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-sans" dir="rtl">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-bold">جاري تحميل لوحة التحكم والمنتجات...</p>
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
              <p className="text-xs text-slate-400">إدارة السلة، المنتجات، والتتبع</p>
            </div>
          </div>

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

        {/* 1. تبويب السلة */}
        {activeView === 'cart' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-lg">
                <div className="text-slate-400 text-xs font-bold mb-1">إجمالي مبيعات السلة</div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-400">{totalRevenue.toLocaleString()} ج.م</div>
              </div>
              <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-lg">
                <div className="text-slate-400 text-xs font-bold mb-1">إجمالي عدد الطلبات</div>
                <div className="text-2xl sm:text-3xl font-black text-white">{totalOrdersCount} طلب</div>
              </div>
              <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-lg">
                <div className="text-slate-400 text-xs font-bold mb-1">متوسط الطلب</div>
                <div className="text-2xl sm:text-3xl font-black text-teal-400">
                  {totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0} ج.م
                </div>
              </div>
            </div>

            {/* جدول الأعمدة ونسب الحالات */}
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <span>📊</span>
                    <span>تحليل ونسب حالات الطلبات (جدول الأعمدة)</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">توزيع حالات طلبات المتجر</p>
                </div>
                <span className="text-xs font-bold bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-emerald-400">
                  إجمالي الطلبات: {totalOrdersCount}
                </span>
              </div>

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
            </div>

            {/* شريط البحث وفلترة الحالة */}
            <div className="bg-slate-900 p-4 rounded-3xl border border-slate-800 flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="ابحث باسم العميل، الهاتف، أو المحافظة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 text-white rounded-2xl p-3 text-sm focus:outline-none focus:border-emerald-500"
              />

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">الحالة:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-200 rounded-2xl p-3 text-sm font-bold cursor-pointer min-w-[150px]"
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

            {/* قائمة كروت السلة */}
            {filteredOrders.length === 0 ? (
              <div className="bg-slate-900 p-12 text-center text-slate-400 font-bold rounded-3xl border border-slate-800">
                🛒 لا توجد طلبات مطابقة
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order, index) => (
                  <div
                    key={order.id}
                    className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center justify-center w-11 h-11 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 font-black">
                          <span className="text-[10px] text-emerald-500 leading-none">طلب</span>
                          <span className="text-base leading-none mt-0.5">#{index + 1}</span>
                        </div>
                        <div>
                          <h3 className="font-black text-lg text-white">{order.customer_name}</h3>
                          <span className="text-xs text-slate-400 font-mono">
                            {new Date(order.created_at).toLocaleDateString('ar-EG', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>

                      <select
                        value={order.status || 'جديد'}
                        onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                        className="text-xs font-black px-3 py-1.5 rounded-xl border cursor-pointer bg-slate-950 border-slate-700 text-white"
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
                        <span className="text-xs font-bold text-slate-400 block mb-1">الهاتف:</span>
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-emerald-400 font-bold" dir="ltr">{order.phone}</span>
                          <a
                            href={`https://wa.me/2${order.phone?.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 bg-emerald-600/20 text-emerald-400 rounded-lg text-xs font-bold"
                          >
                            واتساب
                          </a>
                        </div>
                      </div>
                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
                        <span className="text-xs font-bold text-slate-400 block mb-1">العنوان:</span>
                        <p className="text-white text-xs truncate">{order.governorate} - {order.address}</p>
                      </div>
                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
                        <span className="text-xs font-bold text-slate-400 block mb-1">الإجمالي:</span>
                        <p className="text-lg font-black text-emerald-400">{order.total_amount || order.total_price} ج.م</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <span className="text-xs text-slate-300 font-bold">{order.product_name}</span>
                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        className="px-3 py-1.5 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white rounded-xl text-xs font-bold"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ---------------- 2. تبويب المنتجات والأرباح (عرض كل المنتجات بروابطها) ---------------- */}
        {activeView === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 p-5 rounded-3xl border border-slate-800">
              <div>
                <h2 className="text-xl font-black text-white">قائمة المنتجات ({products.length})</h2>
                <p className="text-xs text-slate-400 mt-0.5">كل منتج له صفحة هبوط مستقلة ورابط إعلان خاص</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={loadAllData}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl text-xs sm:text-sm"
                >
                  🔄 تحديث
                </button>
                <button
                  onClick={openNewProductModal}
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-lg flex items-center gap-2"
                >
                  <span>➕</span>
                  <span>إضافة منتج جديد كصفحة مستقلة</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p) => {
                const cost = Number(p.original_price) || 0;
                const price = Number(p.price) || 0;
                const margin = price - cost;
                const marginPercent = price > 0 && cost > 0 ? Math.round((margin / price) * 100) : 0;
                const productUrl = p.id === 'legacy_product' ? '/' : `/p/${p.id}`;

                return (
                  <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      {p.images && p.images.length > 0 ? (
                        <div className="w-full h-48 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center p-2">
                          <img src={p.images[0]} alt={p.name} className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div className="w-full h-48 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center text-slate-600 text-4xl">
                          📦
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-black text-lg text-white line-clamp-1">{p.name}</h3>
                        {p.is_legacy && (
                          <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
                            الرئيسية
                          </span>
                        )}
                      </div>

                      <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">سعر البيع:</span>
                          <span className="text-emerald-400 font-black text-sm">{price} ج.م</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">سعر التكلفة:</span>
                          <span className="text-slate-300 font-bold">{cost > 0 ? `${cost} ج.م` : 'غير محدد'}</span>
                        </div>
                        <div className="border-t border-slate-800 pt-2 flex justify-between items-center font-bold">
                          <span className="text-slate-300">صافي الربح:</span>
                          <span className={`text-sm font-black ${margin >= 0 ? 'text-teal-400' : 'text-red-400'}`}>
                            {margin > 0 ? `+${margin} ج.م (${marginPercent}%)` : `${margin} ج.م`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1 text-xs">
                        <span className={`px-2.5 py-1 rounded-lg border font-bold ${p.show_colors ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                          الألوان: {p.show_colors ? (p.colors?.length || 0) : 'معطلة'}
                        </span>
                        <span className={`px-2.5 py-1 rounded-lg border font-bold ${p.show_sizes ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                          المقاسات: {p.show_sizes ? (p.sizes?.length || 0) : 'معطلة'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                      <a
                        href={productUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2.5 px-3 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
                        title="فتح صفحة الهبوط المستقلة لهذا المنتج"
                      >
                        <span>🔗</span>
                        <span>رابط الصفحة</span>
                      </a>
                      <button
                        onClick={() => openEditProductModal(p)}
                        className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                      >
                        <span>✏️</span>
                        <span>تعديل</span>
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p)}
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

      {/* نافذة المودال لإضافة وتعديل المنتج كصفحة مستقلة */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xl font-black text-white">
                {editingProduct ? '✏️ تعديل المنتج' : '➕ إضافة منتج جديد (صفحة مستقلة)'}
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

              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold">هامش الربح المتوقع للقطعة:</span>
                <span className="text-emerald-400 font-black text-sm">
                  {currentMargin} ج.م {currentMarginPercent > 0 && `(${currentMarginPercent}%)`}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">وصف المنتج ومميزاته</label>
                <textarea
                  rows="3"
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-emerald-500"
                ></textarea>
              </div>

              {/* رفع صور المنتج المباشر */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-300">
                    📷 صور المنتج (اختر صور من جهازك أو الصق رابط)
                  </label>
                  {uploadingMedia && (
                    <span className="text-xs text-amber-400 font-bold animate-pulse">جاري تجهيز الصورة...</span>
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <label className="flex-1 flex items-center justify-center gap-2 p-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border-2 border-dashed border-emerald-500/50 cursor-pointer text-xs font-bold transition">
                    <span className="text-lg">📁</span>
                    <span>اضغط لاختيار صور من جهازك</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageFileUpload}
                      className="hidden"
                    />
                  </label>

                  <div className="flex-1 flex gap-2">
                    <input
                      type="url"
                      placeholder="أو الصق رابط صورة..."
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newImageUrl.trim()) {
                          setProductForm((prev) => ({ ...prev, images: [...(prev.images || []), newImageUrl.trim()] }));
                          setNewImageUrl('');
                        }
                      }}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
                    >
                      إضافة
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {productForm.images?.map((img, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-700 bg-black">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 left-1 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]"
                        title="حذف"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* رفع فيديو المنتج */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="block text-xs font-bold text-slate-300">
                  🎥 فيديو المنتج (اختياري)
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <label className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border-2 border-dashed border-emerald-500/50 cursor-pointer text-xs font-bold transition">
                    <span className="text-base">🎬</span>
                    <span>رفع فيديو من الجهاز</span>
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/*"
                      onChange={handleVideoFileUpload}
                      className="hidden"
                    />
                  </label>
                  <input
                    type="url"
                    placeholder="أو رابط فيديو مباشر (MP4)..."
                    value={productForm.video_url || ''}
                    onChange={(e) => setProductForm({ ...productForm, video_url: e.target.value })}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs"
                  />
                  {productForm.video_url && (
                    <button
                      type="button"
                      onClick={() => setProductForm({ ...productForm, video_url: '' })}
                      className="px-3 py-2 bg-red-600/20 text-red-400 hover:text-white rounded-xl text-xs font-bold"
                    >
                      حذف
                    </button>
                  )}
                </div>
              </div>

              {/* خيارات الألوان */}
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between bg-slate-950 p-3 rounded-2xl border border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🎨</span>
                    <div>
                      <span className="text-xs font-bold text-white block">خيارات ألوان المنتج</span>
                      <span className="text-[11px] text-slate-400">تحديد الألوان المتوفرة للعميل</span>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setProductForm({ ...productForm, show_colors: !productForm.show_colors })}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      productForm.show_colors
                        ? 'bg-emerald-600 text-white shadow'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>{productForm.show_colors ? 'مفعلة (ظاهرة) 👁️' : 'معطلة (مخفية) 🙈'}</span>
                  </button>
                </div>

                {productForm.show_colors && (
                  <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800/60 space-y-2.5">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="اسم اللون (مثال: كحلي، أحمر)"
                        value={newColorName}
                        onChange={(e) => setNewColorName(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white text-xs focus:outline-none"
                      />
                      <input
                        type="color"
                        value={newColorCode}
                        onChange={(e) => setNewColorCode(e.target.value)}
                        className="w-12 h-10 p-1 bg-slate-900 border border-slate-800 rounded-xl cursor-pointer"
                        title="اختر درجة اللون"
                      />
                      <button
                        type="button"
                        onClick={addColor}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
                      >
                        + إضافة
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {productForm.colors?.length === 0 ? (
                        <span className="text-[11px] text-slate-500">لم تتم إضافة أي لون بعد.</span>
                      ) : (
                        productForm.colors?.map((c, idx) => (
                          <span key={idx} className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-white shadow-sm">
                            <span className="w-3.5 h-3.5 rounded-full border border-slate-700" style={{ backgroundColor: c.code }}></span>
                            <span>{c.name}</span>
                            <button type="button" onClick={() => removeColor(idx)} className="text-red-400 hover:text-red-300 font-bold ml-1">✕</button>
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* خيارات المقاسات */}
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between bg-slate-950 p-3 rounded-2xl border border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📏</span>
                    <div>
                      <span className="text-xs font-bold text-white block">خيارات مقاسات المنتج</span>
                      <span className="text-[11px] text-slate-400">تحديد المقاسات المتوفرة للعميل</span>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setProductForm({ ...productForm, show_sizes: !productForm.show_sizes })}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      productForm.show_sizes
                        ? 'bg-emerald-600 text-white shadow'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>{productForm.show_sizes ? 'مفعلة (ظاهرة) 👁️' : 'معطلة (مخفية) 🙈'}</span>
                  </button>
                </div>

                {productForm.show_sizes && (
                  <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800/60 space-y-2.5">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="المقاس (مثال: M, L, XL, 42)"
                        value={newSize}
                        onChange={(e) => setNewSize(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white text-xs focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={addSize}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
                      >
                        + إضافة مقاس
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {productForm.sizes?.length === 0 ? (
                        <span className="text-[11px] text-slate-500">لم تتم إضافة أي مقاس بعد.</span>
                      ) : (
                        productForm.sizes?.map((s, idx) => (
                          <span key={idx} className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-white shadow-sm">
                            <span>{s}</span>
                            <button type="button" onClick={() => removeSize(idx)} className="text-red-400 hover:text-red-300 font-bold ml-1">✕</button>
                          </span>
                        ))
                      )}
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
                  disabled={savingProduct || uploadingMedia}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition shadow-lg disabled:opacity-50"
                >
                  {savingProduct ? 'جاري الحفظ...' : 'حفظ كصفحة مستقلة 💾'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
