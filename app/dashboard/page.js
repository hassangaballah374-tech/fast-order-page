'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function MerchantFullDashboard() {
  const router = useRouter();
  const [activeScreen, setActiveScreen] = useState('home');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  // بيانات المتجر
  const [myStore, setMyStore] = useState(null);
  const [storeSettings, setStoreSettings] = useState({
    store_name: '',
    store_logo: '',
    support_phone: '',
    pixel_1: '', token_1: '',
    pixel_2: '', token_2: '',
  });

  // المنتجات والطلبات والتحليلات
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState([]);

  // مودال إضافة / تعديل منتج
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // حالة نموذج المنتج
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
  const [selectedProductStats, setSelectedProductStats] = useState(null);

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

    // 1. جلب بيانات المتجر
    const { data: storeData } = await supabase
      .from('store_profiles')
      .select('*')
      .eq('user_id', uid)
      .maybeSingle();

    if (storeData) setMyStore(storeData);

    // 2. جلب إعدادات التاجر والبيكسل
    const { data: sData } = await supabase
      .from('merchant_settings')
      .select('*')
      .eq('user_id', uid)
      .maybeSingle();

    if (sData) setStoreSettings(sData);

    // 3. جلب منتجات وطلبات التاجر
    const { data: pData } = await supabase.from('products').select('*').eq('user_id', uid).order('created_at', { ascending: false });
    if (pData) setProducts(pData);

    const { data: oData } = await supabase.from('orders').select('*').eq('user_id', uid).order('created_at', { ascending: false });
    if (oData) setOrders(oData);

    const { data: aData } = await supabase.from('store_analytics').select('*').eq('user_id', uid);
    if (aData) setAnalytics(aData);

    setLoading(false);
  }

  // رفع الصور من الجهاز
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadingMedia(true);

    for (const file of files) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductForm(prev => ({
          ...prev,
          images: [...prev.images, reader.result]
        }));
      };
      reader.readAsDataURL(file);
    }
    setUploadingMedia(false);
  };

  // رفع فيديو من الجهاز
  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMedia(true);

    const reader = new FileReader();
    reader.onloadend = () => {
      setProductForm(prev => ({
        ...prev,
        videos: [...prev.videos, reader.result]
      }));
      setUploadingMedia(false);
    };
    reader.readAsDataURL(file);
  };

  // حفظ المنتج (إضافة / تعديل)
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
      custom_pixel_id: productForm.custom_pixel_id.trim(),
      custom_pixel_token: productForm.custom_pixel_token.trim(),
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

  // حفظ إعدادات البيكسل العامة للمتجر
  const handleSaveStoreSettings = async (e) => {
    e.preventDefault();
    await supabase.from('merchant_settings').upsert({
      user_id: userId,
      ...storeSettings,
    }, { onConflict: 'user_id' });
    alert('✅ تم حفظ إعدادات البيكسل والمتجر بنجاح!');
  };

  // الحسابات المالية العامة للتاجر
  const totalSalesRevenue = orders.reduce((sum, o) => sum + (Number(o.total_amount || o.total_price) || 0), 0);
  const totalOrdersCount = orders.length;
  const totalStoreVisitors = analytics.filter(a => a.event_type === 'visit').length;
  const totalCartAdditions = products.reduce((sum, p) => sum + (p.cart_adds_count || 0), 0);
  
  // حساب التكلفة وصافي الأرباح
  const totalCost = orders.reduce((sum, o) => {
    const itemCost = Number(o.cost_price || 0) * (o.quantity || 1);
    return sum + itemCost;
  }, 0);
  const totalNetProfit = totalSalesRevenue > 0 ? (totalSalesRevenue - totalCost) : 0;
  const conversionRate = totalStoreVisitors > 0 ? ((totalOrdersCount / totalStoreVisitors) * 100).toFixed(2) : '0.00';

  const isStoreActive = myStore?.is_active && (!myStore?.subscription_ends_at || new Date(myStore.subscription_ends_at) > new Date());

  const gridCards = [
    {
      id: 'products',
      title: 'إدارة المنتجات والمخزون',
      desc: 'إضافة وتعديل المنتجات بالفيديو والمقاسات والألوان والبيكسل',
      icon: '🛍️',
      bgClass: 'bg-gradient-to-r from-emerald-500 to-teal-600',
      badge: `${products.length} منتج`,
    },
    {
      id: 'analytics_detailed',
      title: 'لوحة الأرقام والأرباح',
      desc: 'السلة، الزوار، التحويلات، التكلفة، وصافي الأرباح',
      icon: '📊',
      bgClass: 'bg-gradient-to-r from-blue-600 to-indigo-600',
      badge: `${totalNetProfit.toLocaleString()} ج.م أرباح`,
    },
    {
      id: 'pixels',
      title: 'بيكسل فيسبوك العام (CAPI)',
      desc: 'ربط البيكسل والتوكن السري على مستوى المتجر ككل',
      icon: '⚡',
      bgClass: 'bg-gradient-to-r from-rose-600 to-red-600',
      badge: 'إعدادات CAPI',
    },
    {
      id: 'orders',
      title: 'الطلبات والمبيعات',
      desc: 'فواتير العملاء وبيانات الشحن والتوصيل المباشر',
      icon: '📦',
      bgClass: 'bg-gradient-to-r from-amber-500 to-orange-600',
      badge: `${orders.length} طلب`,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center font-sans" dir="rtl">
        <div className="font-bold text-lg animate-pulse">جاري تحميل لوحة تحكم المتجر...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white font-sans pb-16" dir="rtl">
      
      {/* تنبيه حالة الاشتراك */}
      {!isStoreActive && (
        <div className="bg-amber-600 text-white text-xs font-black p-3 text-center flex items-center justify-center gap-2">
          <span>⏳</span>
          <span>متجرك قيد المراجعة بانتظار سداد الاشتراك والتفعيل من الإدارة. يمكنك ضبط منتجاتك والبيكسل حالياً.</span>
        </div>
      )}

      {/* الرأس العلوي بشعار المنصة الرسمي وشعار التاجر */}
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

            {/* شعار منصة NEXT ORDER الرسمي */}
            <div className="flex items-center gap-2 pl-3 border-l border-slate-700">
              <span className="text-2xl font-black bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                NEXT ORDER
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                PLATFORM
              </span>
            </div>

            {/* اسم متجر التاجر ورابطه */}
            <div className="flex items-center gap-2">
              {storeSettings.store_logo && (
                <img src={storeSettings.store_logo} className="w-8 h-8 rounded-lg object-contain bg-white" />
              )}
              <div>
                <h2 className="text-sm font-black text-white">{myStore?.store_name || 'متجري'}</h2>
                <a
                  href={`/store/${myStore?.store_slug}`}
                  target="_blank"
                  className="text-[11px] text-emerald-400 hover:underline font-mono"
                >
                  /store/{myStore?.store_slug} ↗
                </a>
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

        {/* 🌟 شريط مؤشرات الأداء السريع (الأرقام والتحليلات) */}
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
            <span className="text-[11px] text-slate-400 block mb-1">💸 إجمالي التكلفة</span>
            <span className="text-xl font-black text-rose-400">{totalCost.toLocaleString()} ج.م</span>
          </div>
          <div className="bg-[#111827] border border-slate-800 p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-teal-950/20">
            <span className="text-[11px] text-emerald-400 font-bold block mb-1">💰 صافي الأرباح</span>
            <span className="text-xl font-black text-emerald-400">{totalNetProfit.toLocaleString()} ج.م</span>
          </div>
        </section>

        {/* 🌟 شبكة الكروت الرئيسية */}
        {activeScreen === 'home' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <p className="text-xs text-white/80 line-clamp-1 mt-0.5">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 🌟 شاشة إدارة المنتجات (إضافة بالفيديو، مقاس، لون، بيكسل خاص) */}
        {activeScreen === 'products' && (
          <div className="space-y-4">
            <div className="bg-[#111827] p-5 rounded-3xl border border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black">منتجات متجري ({products.length})</h3>
                <p className="text-xs text-slate-400">إضافة وتعديل المنتجات بالفيديو والمقاسات والألوان والبيكسلات المستقلة</p>
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
                    
                    {/* وسائط المنتج (صورة / فيديو) */}
                    <div className="w-full h-44 bg-slate-900 rounded-2xl overflow-hidden relative flex items-center justify-center">
                      {p.videos && p.videos[0] ? (
                        <video src={p.videos[0]} className="w-full h-full object-cover" muted autoPlay loop />
                      ) : p.images && p.images[0] ? (
                        <img src={p.images[0]} className="w-full h-full object-contain" />
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

                    {/* مقاسات وألوان */}
                    <div className="space-y-1.5 text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-xl">
                      <div>المقاسات: <strong className="text-slate-200">{p.sizes?.length ? p.sizes.join(' - ') : 'افتراضي'}</strong></div>
                      <div>الألوان: <strong className="text-slate-200">{p.colors?.length ? p.colors.join(' - ') : 'افتراضي'}</strong></div>
                      <div>ربح القطعة: <strong className="text-emerald-400 font-bold">{profitPerUnit} ج.م</strong></div>
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

                    {/* أزرار الإجراءات */}
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
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 🌟 شاشة إعدادات البيكسل العام (CAPI) */}
        {activeScreen === 'pixels' && (
          <form onSubmit={handleSaveStoreSettings} className="bg-[#111827] border border-slate-800 p-6 rounded-3xl max-w-2xl mx-auto space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-white">إعدادات بيكسل فيسبوك (CAPI) للمتجر</h3>
              <p className="text-xs text-slate-400">اربط البيكسل والتوكن لتعقب كل حركات المتجر وإرسال أحداث الشراء فوراً لفيسبوك</p>
            </div>

            {[1, 2].map((num) => (
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

            <button type="submit" className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-lg transition cursor-pointer">
              حفظ إعدادات البيكسل 💾
            </button>
          </form>
        )}

        {/* 🌟 شاشة تفصيلية للوحة الأرقام والأرباح */}
        {activeScreen === 'analytics_detailed' && (
          <div className="bg-[#111827] border border-slate-800 p-6 rounded-3xl space-y-6">
            <h3 className="text-lg font-black">التقرير المالي والتشغيلي للمتجر</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">إجمالي الإيرادات (المبيعات)</span>
                <span className="text-2xl font-black text-emerald-400">{totalSalesRevenue.toLocaleString()} ج.م</span>
              </div>
              <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">إجمالي تكلفة البضاعة المباعة</span>
                <span className="text-2xl font-black text-rose-400">{totalCost.toLocaleString()} ج.م</span>
              </div>
              <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">صافي الربح الفعلي</span>
                <span className="text-2xl font-black text-cyan-400">{totalNetProfit.toLocaleString()} ج.م</span>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* 🌟 نافذة إضافة وتعديل المنتج المتكاملة */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleSaveProduct} className="bg-[#111827] border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full my-8 space-y-5 shadow-2xl">
            
            <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
              <h3 className="text-lg font-black">
                {editingProductId ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد للمتجر'}
              </h3>
              <button type="button" onClick={() => setShowProductModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {/* الاسم */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">اسم المنتج *</label>
              <input
                type="text"
                required
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                placeholder="مثال: ساعة ذكية الترا ضد الماء"
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

            {/* رفع الصور والفيديوهات مباشرة من الجهاز */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* الصور */}
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
                      <img src={img} className="w-full h-full object-cover" />
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

              {/* الفيديو */}
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                <label className="block text-xs font-bold text-slate-300">فيديو المنتج (رفع فيديو من جهازك)</label>
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
              
              {/* المقاسات */}
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

              {/* الألوان */}
              <div>
                <label className="block font-bold text-slate-300 mb-1">الألوان (اكتب واضغط Enter)</label>
                <input
                  type="text"
                  placeholder="أسود، أبيض، كحلي..."
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

              {/* المخزون */}
              <div>
                <label className="block font-bold text-slate-300 mb-1">الكمية المتوفرة بالمخزون</label>
                <input
                  type="number"
                  value={productForm.stock}
                  onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-bold"
                />
              </div>

            </div>

            {/* بيكسل فيسبوك مخصص لهذا المنتج فقط */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-emerald-400 block">⚡ بيكسل خاص بهذا المنتج (اختياري للإعلانات المستقلة)</span>
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
                  placeholder="Custom API Token"
                  value={productForm.custom_pixel_token}
                  onChange={(e) => setProductForm({ ...productForm, custom_pixel_token: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-mono text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button type="button" onClick={() => setShowProductModal(false)} className="px-4 py-2.5 bg-slate-800 rounded-xl text-xs font-bold">إلغاء</button>
              <button type="submit" disabled={uploadingMedia} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black cursor-pointer shadow-lg">
                {uploadingMedia ? 'جاري رفع الملفات...' : 'حفظ المنتج وإطلاقه 🚀'}
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

            <button onClick={() => setSelectedProductStats(null)} className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold">
              إغلاق
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
