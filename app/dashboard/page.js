'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function MerchantFullDashboard() {
  const router = useRouter();
  
  // شاشات التنقل: 'home' | 'products' | 'orders' | 'analytics' | 'pixels' | 'store_settings'
  const [activeScreen, setActiveScreen] = useState('home');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  // بيانات بروفايل متجر التاجر
  const [myStore, setMyStore] = useState(null);

  // إعدادات وبيكسلات التاجر
  const [storeSettings, setStoreSettings] = useState({
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

  const [savingSettings, setSavingSettings] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // المنتجات
  const [products, setProducts] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [selectedProductStats, setSelectedProductStats] = useState(null);

  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    original_price: '',
    discount_percent: '',
    cost_price: '',
    stock: 20,
    images: [],
    videos: [],
    sizes: [],
    colors: [],
    custom_pixel_id: '',
    custom_pixel_token: '',
  });

  const [tagInputSize, setTagInputSize] = useState('');
  const [tagInputColor, setTagInputColor] = useState('');

  // الطلبات
  const [orders, setOrders] = useState([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  // التحليلات
  const [analytics, setAnalytics] = useState([]);

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

    // 1. جلب بروفايل متجر التاجر
    const { data: storeData } = await supabase
      .from('store_profiles')
      .select('*')
      .eq('user_id', uid)
      .maybeSingle();

    if (storeData) setMyStore(storeData);

    // 2. جلب إعدادات وبيكسلات التاجر
    const { data: sData } = await supabase
      .from('merchant_settings')
      .select('*')
      .eq('user_id', uid)
      .maybeSingle();

    if (sData) {
      setStoreSettings({
        store_name: sData.store_name || storeData?.store_name || '',
        store_logo: sData.store_logo || '',
        store_description: sData.store_description || '',
        support_phone: sData.support_phone || storeData?.phone || '',
        announcement_text: sData.announcement_text || '',
        pixel_1: sData.pixel_1 || '', token_1: sData.token_1 || '',
        pixel_2: sData.pixel_2 || '', token_2: sData.token_2 || '',
        pixel_3: sData.pixel_3 || '', token_3: sData.token_3 || '',
        pixel_4: sData.pixel_4 || '', token_4: sData.token_4 || '',
      });
    }

    // 3. جلب منتجات هذا التاجر فقط
    const { data: pData } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });
    if (pData) setProducts(pData);

    // 4. جلب طلبات هذا التاجر فقط
    const { data: oData } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });
    if (oData) setOrders(oData);

    // 5. جلب تحليلات هذا التاجر فقط
    const { data: aData } = await supabase
      .from('store_analytics')
      .select('*')
      .eq('user_id', uid);
    if (aData) setAnalytics(aData);

    setLoading(false);
  }

  // رفع اللوجو الخاص بالمتجر
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setStoreSettings((prev) => ({ ...prev, store_logo: reader.result }));
      setUploadingLogo(false);
      alert('✅ تم اختيار صورة الشعار بنجاح!');
    };
    reader.readAsDataURL(file);
  };

  // رفع صور المنتج
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadingMedia(true);
    for (const file of files) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductForm((prev) => ({
          ...prev,
          images: [...prev.images, reader.result],
        }));
      };
      reader.readAsDataURL(file);
    }
    setUploadingMedia(false);
  };

  // رفع فيديو للمنتج
  const handleVideoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMedia(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setProductForm((prev) => ({
        ...prev,
        videos: [...prev.videos, reader.result],
      }));
      setUploadingMedia(false);
    };
    reader.readAsDataURL(file);
  };

  // حفظ المنتج (إضافة أو تعديل)
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price) {
      alert('يرجى كتابة اسم المنتج وسعر البيع');
      return;
    }

    const payload = {
      user_id: userId,
      name: productForm.name,
      price: Number(productForm.price),
      original_price: Number(productForm.original_price) || 0,
      discount_percent: Number(productForm.discount_percent) || 0,
      cost_price: Number(productForm.cost_price) || 0,
      stock: Number(productForm.stock) || 0,
      images: productForm.images,
      videos: productForm.videos,
      sizes: productForm.sizes,
      colors: productForm.colors,
      custom_pixel_id: (productForm.custom_pixel_id || '').trim(),
      custom_pixel_token: (productForm.custom_pixel_token || '').trim(),
    };

    if (editingProductId) {
      await supabase.from('products').update(payload).eq('id', editingProductId);
    } else {
      await supabase.from('products').insert([payload]);
    }

    setShowProductModal(false);
    setEditingProductId(null);
    initMerchant();
  };

  // حذف منتج
  const handleDeleteProduct = async (id, name) => {
    if (!confirm(`هل أنت متأكد من حذف المنتج: "${name}"؟`)) return;
    await supabase.from('products').delete().eq('id', id);
    initMerchant();
  };

  // حفظ إعدادات وبيكسلات المتجر
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const payload = {
        user_id: userId,
        store_name: storeSettings.store_name,
        store_logo: storeSettings.store_logo,
        store_description: storeSettings.store_description,
        support_phone: storeSettings.support_phone,
        announcement_text: storeSettings.announcement_text,
        pixel_1: (storeSettings.pixel_1 || '').trim(),
        token_1: (storeSettings.token_1 || '').trim(),
        pixel_2: (storeSettings.pixel_2 || '').trim(),
        token_2: (storeSettings.token_2 || '').trim(),
        pixel_3: (storeSettings.pixel_3 || '').trim(),
        token_3: (storeSettings.token_3 || '').trim(),
        pixel_4: (storeSettings.pixel_4 || '').trim(),
        token_4: (storeSettings.token_4 || '').trim(),
      };

      const { error } = await supabase.from('merchant_settings').upsert(payload, { onConflict: 'user_id' });
      if (error) throw error;
      alert('✅ تم حفظ إعدادات وهوية المتجر والبيكسلات بنجاح!');
    } catch (err) {
      alert('خطأ أثناء الحفظ: ' + err.message);
    }
    setSavingSettings(false);
  };

  // تصدير الطلبات كملف CSV لشركات الشحن
  const exportOrdersToCSV = () => {
    if (orders.length === 0) {
      alert('لا توجد طلبات لتصديرها!');
      return;
    }

    const headers = ['رقم الطلب', 'الزبون', 'الهاتف', 'المحافظة', 'العنوان', 'المنتج', 'الكمية', 'المبلغ', 'الحالة', 'التاريخ'];
    const rows = orders.map((o, idx) => [
      idx + 1,
      `"${o.customer_name || ''}"`,
      `"${o.phone || ''}"`,
      `"${o.governorate || ''}"`,
      `"${o.address || ''}"`,
      `"${o.product_name || ''}"`,
      o.quantity || 1,
      o.total_amount || 0,
      `"${o.status || 'جديد'}"`,
      new Date(o.created_at).toLocaleDateString('ar-EG'),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${myStore?.store_slug || 'orders'}_shipments_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // نسخ رابط المتجر لمشاركته في الإعلانات
  const copyStoreLink = () => {
    if (typeof window !== 'undefined' && myStore?.store_slug) {
      const link = `${window.location.origin}/store/${myStore.store_slug}`;
      navigator.clipboard.writeText(link);
      alert('📋 تم نسخ رابط متجرك للزبائن:\n' + link);
    }
  };

  // العمليات الحسابية الشاملة للتاجر
  const totalSalesRevenue = orders.reduce((sum, o) => sum + (Number(o.total_amount || o.total_price) || 0), 0);
  const totalOrdersCount = orders.length;
  const totalStoreVisitors = analytics.filter(a => a.event_type === 'visit').length;
  const totalCartAdditions = products.reduce((sum, p) => sum + (p.cart_adds_count || 0), 0);
  
  const totalCost = orders.reduce((sum, o) => {
    const itemCost = Number(o.cost_price || 0) * (o.quantity || 1);
    return sum + itemCost;
  }, 0);
  const totalNetProfit = totalSalesRevenue > 0 ? (totalSalesRevenue - totalCost) : 0;
  const conversionRate = totalStoreVisitors > 0 ? ((totalOrdersCount / totalStoreVisitors) * 100).toFixed(2) : '0.00';

  const isStoreActive = myStore?.is_active && (!myStore?.subscription_ends_at || new Date(myStore.subscription_ends_at) > new Date());

  // فلترة الطلبات
  const filteredOrders = orders.filter((o) => {
    const matchesSearch = (o.customer_name || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
                          (o.phone || '').includes(orderSearch) ||
                          (o.governorate || '').includes(orderSearch);
    const matchesStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const gridCards = [
    {
      id: 'products',
      title: 'منتجاتي والمخزون',
      desc: 'إضافة وتعديل المنتجات بالفيديوهات والمقاسات والألوان والبيكسل المخصص',
      icon: '🛍️',
      bgClass: 'bg-gradient-to-r from-teal-500 to-emerald-600',
      badge: `${products.length} منتج`,
    },
    {
      id: 'orders',
      title: 'الطلبات والمبيعات',
      desc: 'إدارة وتحديث حالات الشحن وتصدير كشوف الشحن إكسيل',
      icon: '📦',
      bgClass: 'bg-gradient-to-r from-blue-600 to-indigo-600',
      badge: `${orders.length} طلب`,
    },
    {
      id: 'pixels',
      title: 'بيكسل فيسبوك العام (CAPI)',
      desc: 'ربط ما يصل إلى 4 بيكسلات مع الرموز السرية لتعقب الإعلانات',
      icon: '⚡',
      bgClass: 'bg-gradient-to-r from-rose-600 to-red-600',
      badge: 'Facebook CAPI',
    },
    {
      id: 'store_settings',
      title: 'هوية المتجر والدعم',
      desc: 'تخصيص الشعار، الاسم، وصف المتجر، ورقم واتساب الزبائن',
      icon: '⚙️',
      bgClass: 'bg-gradient-to-r from-amber-500 to-orange-600',
      badge: 'الهوية والتصميم',
    },
    {
      id: 'analytics',
      title: 'الأرباح والتحليلات المالية',
      desc: 'تقرير مفصل بالتكلفة وصافي الأرباح ومعدلات التحويل',
      icon: '📈',
      bgClass: 'bg-gradient-to-r from-indigo-600 to-purple-600',
      badge: `${totalNetProfit.toLocaleString()} ج.م صافي الربح`,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-white flex items-center justify-center font-sans" dir="rtl">
        <div className="font-bold text-lg animate-pulse flex items-center gap-3">
          <span>🏪</span>
          <span>جاري فتح لوحة تحكم متجرك...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white font-sans pb-16" dir="rtl">
      
      {/* شريط تنبيه حالة المتجر */}
      {!isStoreActive && (
        <div className="bg-amber-600 text-white text-xs font-black p-3 text-center flex items-center justify-center gap-2">
          <span>⏳</span>
          <span>متجرك قيد المراجعة بانتظار سداد رسوم الاشتراك والتفعيل من الإدارة. يمكنك ضبط منتجاتك والبيكسل الآن.</span>
        </div>
      )}

      {/* الرأس العلوي */}
      <header className="bg-[#111827] border-b border-slate-800 px-6 py-4 sticky top-0 z-30 shadow-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {activeScreen !== 'home' && (
              <button
                onClick={() => setActiveScreen('home')}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>⬅</span>
                <span>الرئيسية</span>
              </button>
            )}

            {/* شعار منصة NEXT ORDER الرسمي وشعار التاجر */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 pl-3 border-l border-slate-700">
                <span className="text-xl sm:text-2xl font-black bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                  NEXT ORDER
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  MERCHANT
                </span>
              </div>

              <div className="flex items-center gap-2">
                {storeSettings.store_logo && (
                  <img src={storeSettings.store_logo} className="w-8 h-8 rounded-lg object-contain bg-white" alt="Store Logo" />
                )}
                <div>
                  <h2 className="text-sm font-black text-white">{myStore?.store_name || storeSettings.store_name}</h2>
                  <button
                    onClick={copyStoreLink}
                    className="text-[11px] text-emerald-400 hover:underline font-mono flex items-center gap-1 cursor-pointer"
                  >
                    <span>/store/{myStore?.store_slug}</span>
                    <span>🔗</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-xs px-3 py-1.5 rounded-full font-black ${isStoreActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
              {isStoreActive ? '🟢 متجر نشط' : '🟡 قيد المراجعة'}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-8 space-y-6">

        {/* 🌟 شريط الأرقام والتحليلات المالية والتشغيلية */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-[#111827] border border-slate-800 p-4 rounded-2xl">
            <span className="text-[11px] text-slate-400 block mb-1">🛒 السلة المتروكة</span>
            <span className="text-xl font-black text-amber-400">{totalCartAdditions}</span>
          </div>
          <div className="bg-[#111827] border border-slate-800 p-4 rounded-2xl">
            <span className="text-[11px] text-slate-400 block mb-1">👀 زوار المتجر</span>
            <span className="text-xl font-black text-cyan-400">{totalStoreVisitors}</span>
          </div>
          <div className="bg-[#111827] border border-slate-800 p-4 rounded-2xl">
            <span className="text-[11px] text-slate-400 block mb-1">📦 إجمالي الطلبات</span>
            <span className="text-xl font-black text-blue-400">{totalOrdersCount}</span>
          </div>
          <div className="bg-[#111827] border border-slate-800 p-4 rounded-2xl">
            <span className="text-[11px] text-slate-400 block mb-1">📈 معدل التحويل</span>
            <span className="text-xl font-black text-purple-400">{conversionRate}%</span>
          </div>
          <div className="bg-[#111827] border border-slate-800 p-4 rounded-2xl">
            <span className="text-[11px] text-slate-400 block mb-1">💸 تكلفة البضاعة</span>
            <span className="text-xl font-black text-rose-400">{totalCost.toLocaleString()} ج.م</span>
          </div>
          <div className="bg-[#111827] border border-slate-800 p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-teal-950/20">
            <span className="text-[11px] text-emerald-400 font-bold block mb-1">💰 صافي الأرباح</span>
            <span className="text-xl font-black text-emerald-400">{totalNetProfit.toLocaleString()} ج.م</span>
          </div>
        </section>

        {/* 🌟 1. الشاشة الرئيسية: شبكة الكروت الملونة */}
        {activeScreen === 'home' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {gridCards.map((card) => (
              <div
                key={card.id}
                onClick={() => setActiveScreen(card.id)}
                className={`${card.bgClass} p-6 rounded-3xl cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between min-h-[160px]`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs bg-black/25 backdrop-blur-md px-3 py-1 rounded-full font-bold">
                    {card.badge}
                  </span>
                  <span className="text-2xl">{card.icon}</span>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-black tracking-wide">{card.title}</h3>
                  <p className="text-xs text-white/85 line-clamp-1 mt-0.5">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 🌟 2. شاشة إدارة المنتجات */}
        {activeScreen === 'products' && (
          <div className="space-y-4">
            <div className="bg-[#111827] p-5 rounded-3xl border border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black">منتجات متجري ({products.length})</h3>
                <p className="text-xs text-slate-400">إضافة وتعديل المنتجات بالفيديو والمقاسات والألوان والبيكسل المستقل</p>
              </div>
              <button
                onClick={() => {
                  setEditingProductId(null);
                  setProductForm({
                    name: '', price: '', original_price: '', discount_percent: '', cost_price: '',
                    stock: 20, images: [], videos: [], sizes: [], colors: [], custom_pixel_id: '', custom_pixel_token: '',
                  });
                  setShowProductModal(true);
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg transition cursor-pointer"
              >
                ➕ إضافة منتج جديد
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {products.map((p) => {
                const profitPerUnit = (Number(p.price) || 0) - (Number(p.cost_price) || 0);

                return (
                  <div key={p.id} className="bg-[#111827] border border-slate-800 p-5 rounded-3xl space-y-4 hover:border-slate-700 transition">
                    <div className="w-full h-44 bg-slate-900 rounded-2xl overflow-hidden relative flex items-center justify-center">
                      {p.videos && p.videos[0] ? (
                        <video src={p.videos[0]} className="w-full h-full object-cover" muted autoPlay loop />
                      ) : p.images && p.images[0] ? (
                        <img src={p.images[0]} className="w-full h-full object-contain" alt={p.name} />
                      ) : (
                        <span className="text-3xl text-slate-600">🛍️</span>
                      )}

                      {p.discount_percent > 0 && (
                        <span className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md">
                          خصم {p.discount_percent}%
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="font-black text-sm text-white line-clamp-1">{p.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-emerald-400 font-black text-base">{p.price} ج.م</span>
                        {p.original_price > 0 && (
                          <span className="text-slate-500 line-through text-xs font-mono">{p.original_price} ج.م</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5 text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-xl">
                      <div>المقاسات: <strong className="text-slate-200">{p.sizes?.length ? p.sizes.join(' - ') : 'افتراضي'}</strong></div>
                      <div>الألوان: <strong className="text-slate-200">{p.colors?.length ? p.colors.join(' - ') : 'افتراضي'}</strong></div>
                      <div>ربح القطعة: <strong className="text-emerald-400 font-bold">{profitPerUnit} ج.م</strong></div>
                      <div>المخزون المتوفر: <strong className="text-white">{p.stock || 0} قطعة</strong></div>
                    </div>

                    {/* إحصائيات هذا المنتج الخاصة */}
                    <div className="grid grid-cols-3 gap-1 bg-slate-950 p-2.5 rounded-xl text-center text-[10px]">
                      <div>
                        <span className="text-slate-500 block">مشاهدات</span>
                        <strong className="text-white font-mono">{p.views_count || 0}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">سلة</span>
                        <strong className="text-amber-400 font-mono">{p.cart_adds_count || 0}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">مبيعات</span>
                        <strong className="text-emerald-400 font-mono">{p.sales_count || 0}</strong>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1 border-t border-slate-800">
                      <button
                        onClick={() => {
                          setEditingProductId(p.id);
                          setProductForm({
                            name: p.name,
                            price: p.price,
                            original_price: p.original_price || '',
                            discount_percent: p.discount_percent || '',
                            cost_price: p.cost_price || '',
                            stock: p.stock || 20,
                            images: p.images || [],
                            videos: p.videos || [],
                            sizes: p.sizes || [],
                            colors: p.colors || [],
                            custom_pixel_id: p.custom_pixel_id || '',
                            custom_pixel_token: p.custom_pixel_token || '',
                          });
                          setShowProductModal(true);
                        }}
                        className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        ✏️ تعديل
                      </button>
                      <button
                        onClick={() => setSelectedProductStats(p)}
                        className="flex-1 py-2 bg-indigo-900/40 hover:bg-indigo-900/60 text-indigo-300 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        📊 إحصائياته
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.id, p.name)}
                        className="px-3 py-2 bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        🗑
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 🌟 3. شاشة الطلبات والشحن */}
        {activeScreen === 'orders' && (
          <div className="space-y-4">
            <div className="bg-[#111827] p-5 rounded-3xl border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-lg font-black text-white">الطلبات الواردة لمتجري ({filteredOrders.length})</h3>
                <p className="text-xs text-slate-400">تحديث حالات الشحن، متابعة تسليم الزبائن، وتصدير كشوف الشحن</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={exportOrdersToCSV}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black shadow transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>📊</span>
                  <span>تصدير إكسيل للشحن</span>
                </button>
                <button onClick={initMerchant} className="px-3.5 py-2 bg-slate-800 rounded-xl text-xs font-bold cursor-pointer">
                  🔄
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="بحث باسم الزبون، الهاتف، أو المحافظة..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="bg-[#111827] border border-slate-800 text-xs p-3 rounded-xl flex-1 text-white"
              />
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="bg-[#111827] border border-slate-800 text-xs p-3 rounded-xl text-white"
              >
                <option value="all">كل الحالات</option>
                <option value="جديد">جديد</option>
                <option value="مؤكد">مؤكد</option>
                <option value="جاري الشحن">جاري الشحن</option>
                <option value="تم التوصيل">تم التوصيل</option>
                <option value="مرتجع">مرتجع</option>
                <option value="ملغي">ملغي</option>
              </select>
            </div>

            <div className="space-y-3">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-12 text-slate-500 font-bold bg-[#111827] border border-slate-800 rounded-3xl">
                  لا توجد طلبات واردة حالياً. شارك رابط متجرك في إعلاناتك لبدء استقبال الطلبات!
                </div>
              ) : (
                filteredOrders.map((o, idx) => (
                  <div key={o.id} className="bg-[#111827] border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm">طلب #{idx + 1} - {o.customer_name}</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-800 text-cyan-400">
                          {o.status || 'جديد'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 flex flex-wrap gap-3">
                        <span>الهاتف: <a href={`https://wa.me/${o.phone}`} target="_blank" className="text-emerald-400 font-mono font-bold underline" dir="ltr">{o.phone}</a></span>
                        <span>العنوان: <strong className="text-white">{o.governorate} - {o.address}</strong></span>
                        <span>المنتج: <strong className="text-white">{o.product_name || 'منتج عام'}</strong> (x{o.quantity || 1})</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-emerald-400 font-black text-base">{o.total_amount} ج.م</span>
                      <select
                        value={o.status || 'جديد'}
                        onChange={async (e) => {
                          const newStatus = e.target.value;
                          await supabase.from('orders').update({ status: newStatus }).eq('id', o.id);
                          initMerchant();
                        }}
                        className="bg-slate-900 border border-slate-700 text-xs p-2 rounded-xl text-white font-bold"
                      >
                        <option value="جديد">جديد</option>
                        <option value="مؤكد">مؤكد</option>
                        <option value="جاري الشحن">جاري الشحن</option>
                        <option value="تم التوصيل">تم التوصيل</option>
                        <option value="مرتجع">مرتجع</option>
                        <option value="ملغي">ملغي</option>
                      </select>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 🌟 4. شاشة إعدادات البيكسل العام (CAPI) */}
        {activeScreen === 'pixels' && (
          <form onSubmit={handleSaveSettings} className="bg-[#111827] border border-slate-800 p-6 sm:p-8 rounded-3xl max-w-2xl mx-auto space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-white">إعدادات بيكسل فيسبوك (CAPI) لمتجرك</h3>
              <p className="text-xs text-slate-400">اربط البيكسلات وأكواد التتبع العامة لتعقب كل حركات المتجر وإرسال أحداث الشراء فوراً لفيسبوك</p>
            </div>

            {[1, 2, 3, 4].map((num) => (
              <div key={num} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                <span className="text-xs font-bold text-slate-300">بيكسل فيسبوك رقم ({num})</span>
                <input
                  type="text"
                  dir="ltr"
                  placeholder={`Pixel ID ${num}`}
                  value={storeSettings[`pixel_${num}`] || ''}
                  onChange={(e) => setStoreSettings({ ...storeSettings, [`pixel_${num}`]: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-white"
                />
                <input
                  type="text"
                  dir="ltr"
                  placeholder={`Conversions API Access Token ${num}`}
                  value={storeSettings[`token_${num}`] || ''}
                  onChange={(e) => setStoreSettings({ ...storeSettings, [`token_${num}`]: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-white"
                />
              </div>
            ))}

            <button type="submit" disabled={savingSettings} className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-lg transition cursor-pointer">
              {savingSettings ? 'جاري الحفظ...' : 'حفظ إعدادات البيكسل 💾'}
            </button>
          </form>
        )}

        {/* 🌟 5. شاشة هوية المتجر وتخصيصه */}
        {activeScreen === 'store_settings' && (
          <form onSubmit={handleSaveSettings} className="bg-[#111827] border border-slate-800 p-6 sm:p-8 rounded-3xl max-w-2xl mx-auto space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-white">تخصيص وهوية متجرك</h3>
              <p className="text-xs text-slate-400">الشعار، الاسم، والوصف الذي يظهر للزبائن في صفحة الشراء</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">شعار المتجر (اللوجو)</label>
              <div className="flex items-center gap-4 p-4 border border-dashed border-slate-700 rounded-2xl bg-slate-900/60">
                <div className="w-16 h-16 rounded-xl border border-slate-700 bg-white p-1 flex items-center justify-center shrink-0 overflow-hidden">
                  {storeSettings.store_logo ? (
                    <img src={storeSettings.store_logo} alt="Store Logo" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-slate-400 text-2xl">🖼️</span>
                  )}
                </div>
                <div className="space-y-1">
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="text-xs text-slate-400" />
                  <p className="text-[10px] text-slate-500">اختر صورة لوجو مربعة من جهازك</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">اسم المتجر</label>
              <input
                type="text"
                value={storeSettings.store_name}
                onChange={(e) => setStoreSettings({ ...storeSettings, store_name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-bold text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">وصف المتجر (يظهر أسفل الاسم)</label>
              <textarea
                rows="3"
                value={storeSettings.store_description}
                onChange={(e) => setStoreSettings({ ...storeSettings, store_description: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white"
              ></textarea>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">رقم واتساب خدمة العملاء للزبائن</label>
                <input
                  type="tel"
                  dir="ltr"
                  value={storeSettings.support_phone}
                  onChange={(e) => setStoreSettings({ ...storeSettings, support_phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-mono text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">نص الشريط الإعلاني العلوي في متجرك</label>
                <input
                  type="text"
                  value={storeSettings.announcement_text}
                  onChange={(e) => setStoreSettings({ ...storeSettings, announcement_text: e.target.value })}
                  placeholder="🚚 شحن سريع ودفع عند الاستلام!"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white"
                />
              </div>
            </div>

            <button type="submit" disabled={savingSettings || uploadingLogo} className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs rounded-xl shadow-lg transition cursor-pointer">
              {savingSettings ? 'جاري الحفظ...' : 'حفظ هوية المتجر 💾'}
            </button>
          </form>
        )}

        {/* 🌟 6. شاشة التحليلات والأرباح */}
        {activeScreen === 'analytics' && (
          <div className="bg-[#111827] border border-slate-800 p-6 rounded-3xl space-y-6">
            <h3 className="text-lg font-black">التقرير المالي وصافي الأرباح لمتجرك</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">إجمالي المبيعات المحققة</span>
                <span className="text-2xl font-black text-emerald-400">{totalSalesRevenue.toLocaleString()} ج.م</span>
              </div>
              <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">إجمالي تكلفة المنتجات المباعة</span>
                <span className="text-2xl font-black text-rose-400">{totalCost.toLocaleString()} ج.م</span>
              </div>
              <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">صافي أرباحك الحقيقية</span>
                <span className="text-2xl font-black text-cyan-400">{totalNetProfit.toLocaleString()} ج.م</span>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* 🌟 نافذة إضافة / تعديل منتج متكاملة */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleSaveProduct} className="bg-[#111827] border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full my-8 space-y-5 shadow-2xl">
            
            <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
              <h3 className="text-lg font-black">
                {editingProductId ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد للمتجر'}
              </h3>
              <button type="button" onClick={() => setShowProductModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">اسم المنتج *</label>
              <input
                type="text"
                required
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                placeholder="مثال: حذاء رياضي أصلي مريح"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white"
              />
            </div>

            {/* الأسعار والتكلفة ونسبة الخصم */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">سعر البيع (ج.م) *</label>
                <input
                  type="number"
                  required
                  value={productForm.price}
                  onChange={(e) => {
                    const price = Number(e.target.value);
                    const orig = Number(productForm.original_price);
                    const discount = orig > price ? Math.round(((orig - price) / orig) * 100) : 0;
                    setProductForm({ ...productForm, price, discount_percent: discount });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">السعر قبل الخصم</label>
                <input
                  type="number"
                  value={productForm.original_price}
                  onChange={(e) => {
                    const orig = Number(e.target.value);
                    const price = Number(productForm.price);
                    const discount = orig > price ? Math.round(((orig - price) / orig) * 100) : 0;
                    setProductForm({ ...productForm, original_price: orig, discount_percent: discount });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">نسبة الخصم (%)</label>
                <input
                  type="number"
                  value={productForm.discount_percent}
                  onChange={(e) => setProductForm({ ...productForm, discount_percent: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-amber-400 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">سعر التكلفة (لحساب الربح)</label>
                <input
                  type="number"
                  value={productForm.cost_price}
                  onChange={(e) => setProductForm({ ...productForm, cost_price: e.target.value })}
                  placeholder="تكلفة عليك"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-rose-300 font-bold"
                />
              </div>
            </div>

            {/* رفع الصور والفيديوهات */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                <label className="block text-xs font-bold text-slate-300">صور المنتج (رفع من جهازك)</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="text-xs text-slate-400 file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-slate-800 file:text-white cursor-pointer"
                />
                <div className="flex gap-2 flex-wrap pt-2">
                  {productForm.images.map((img, i) => (
                    <div key={i} className="w-12 h-12 rounded-lg bg-black relative border border-slate-700 overflow-hidden">
                      <img src={img} className="w-full h-full object-cover" alt="Thumb" />
                      <button
                        type="button"
                        onClick={() => setProductForm({ ...productForm, images: productForm.images.filter((_, idx) => idx !== i) })}
                        className="absolute top-0 right-0 bg-red-600 text-[10px] w-4 h-4 flex items-center justify-center text-white"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                <label className="block text-xs font-bold text-slate-300">فيديو المنتج (رفع من جهازك)</label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="text-xs text-slate-400 file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-slate-800 file:text-white cursor-pointer"
                />
                {productForm.videos.length > 0 && (
                  <div className="text-xs text-emerald-400 font-bold flex items-center justify-between pt-1">
                    <span>🎬 تم رفع فيديو للمنتج بنجاح</span>
                    <button
                      type="button"
                      onClick={() => setProductForm({ ...productForm, videos: [] })}
                      className="text-red-400 hover:underline"
                    >
                      حذف الفيديو
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* المقاسات والألوان والمخزون */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">المقاسات (اكتب واضغط Enter)</label>
                <input
                  type="text"
                  placeholder="M, L, XL, 42..."
                  value={tagInputSize}
                  onChange={(e) => setTagInputSize(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && tagInputSize.trim()) {
                      e.preventDefault();
                      setProductForm({ ...productForm, sizes: [...productForm.sizes, tagInputSize.trim()] });
                      setTagInputSize('');
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
                />
                <div className="flex gap-1 flex-wrap mt-1.5">
                  {productForm.sizes.map((s, i) => (
                    <span key={i} className="bg-slate-800 px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
                      {s} <button type="button" onClick={() => setProductForm({ ...productForm, sizes: productForm.sizes.filter((_, idx) => idx !== i) })}>✕</button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">الألوان (اكتب واضغط Enter)</label>
                <input
                  type="text"
                  placeholder="أسود، كحلي، أحمر..."
                  value={tagInputColor}
                  onChange={(e) => setTagInputColor(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && tagInputColor.trim()) {
                      e.preventDefault();
                      setProductForm({ ...productForm, colors: [...productForm.colors, tagInputColor.trim()] });
                      setTagInputColor('');
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
                />
                <div className="flex gap-1 flex-wrap mt-1.5">
                  {productForm.colors.map((c, i) => (
                    <span key={i} className="bg-slate-800 px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
                      {c} <button type="button" onClick={() => setProductForm({ ...productForm, colors: productForm.colors.filter((_, idx) => idx !== i) })}>✕</button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">المخزون المتوفر</label>
                <input
                  type="number"
                  value={productForm.stock}
                  onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-bold"
                />
              </div>
            </div>

            {/* بيكسل خاص بهذا المنتج */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-emerald-400 block">⚡ بيكسل مخصص لهذا المنتج (لحملات إعلانية منفصلة)</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  dir="ltr"
                  placeholder="Custom Pixel ID"
                  value={productForm.custom_pixel_id}
                  onChange={(e) => setProductForm({ ...productForm, custom_pixel_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-mono text-white"
                />
                <input
                  type="text"
                  dir="ltr"
                  placeholder="Custom API Access Token"
                  value={productForm.custom_pixel_token}
                  onChange={(e) => setProductForm({ ...productForm, custom_pixel_token: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-mono text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button type="button" onClick={() => setShowProductModal(false)} className="px-4 py-2.5 bg-slate-800 rounded-xl text-xs font-bold">إلغاء</button>
              <button type="submit" disabled={uploadingMedia} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black cursor-pointer shadow-lg">
                {uploadingMedia ? 'جاري الرفع...' : 'حفظ المنتج وإطلاقه 🚀'}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* 🌟 نافذة إحصائيات المنتج المستقلة */}
      {selectedProductStats && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-black">داشبورد إحصائيات: {selectedProductStats.name}</h3>
              <button onClick={() => setSelectedProductStats(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block">إجمالي الزوار والمشاهدات</span>
                <strong className="text-lg text-white font-mono">{selectedProductStats.views_count || 0}</strong>
              </div>
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block">الإضافة إلى السلة</span>
                <strong className="text-lg text-amber-400 font-mono">{selectedProductStats.cart_adds_count || 0}</strong>
              </div>
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block">الطلبات المكتملة</span>
                <strong className="text-lg text-emerald-400 font-mono">{selectedProductStats.sales_count || 0}</strong>
              </div>
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block">أرباح هذا المنتج</span>
                <strong className="text-lg text-cyan-400 font-mono">
                  {((Number(selectedProductStats.price) - Number(selectedProductStats.cost_price || 0)) * (selectedProductStats.sales_count || 0)).toLocaleString()} ج.م
                </strong>
              </div>
            </div>

            <button onClick={() => setSelectedProductStats(null)} className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer">
              إغلاق
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
