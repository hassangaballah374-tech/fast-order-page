'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function MerchantFullDashboard() {
  const router = useRouter();

  // 'home' | 'products' | 'landing_builder' | 'orders' | 'shipping' | 'policies' | 'blacklist' | 'pixels' | 'wallet' | 'settings'
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  const [myStore, setMyStore] = useState(null);
  const [exchangeRate, setExchangeRate] = useState(50.0);

  // إعدادات المتجر وهوية العرض والسياسات
  const [storeSettings, setStoreSettings] = useState({
    store_name: '',
    store_logo: '',
    store_description: '',
    support_phone: '',
    announcement_text: '',
    theme_style: 'modern',
    return_policy: 'يحق للعميل استبدال أو استرجاع المنتج خلال 14 يوماً من الاستلام في حالته الأصلية.',
    shipping_policy: 'التوصيل خلال 2 إلى 4 أيام عمل لجميع المحافظات والدفع عند الاستلام.',
    facebook_url: '',
    instagram_url: '',
    tiktok_url: '',
    pixel_1: '', token_1: '',
    pixel_2: '', token_2: '',
    pixel_3: '', token_3: '',
    pixel_4: '', token_4: '',
    tiktok_pixel_id: '',
    snapchat_pixel_id: '',
  });

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [shippingRates, setShippingRates] = useState([]);
  const [blacklist, setBlacklist] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // مودال إضافة / تعديل منتج
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [selectedProductStats, setSelectedProductStats] = useState(null);

  const [productForm, setProductForm] = useState({
    name: '', price: '', original_price: '', discount_percent: '', cost_price: '', stock: 20,
    images: [], videos: [], sizes: [], colors: [],
    landing_headline: '', landing_video_url: '', product_features: [],
    bundle_tier_2_discount: 10, bundle_tier_3_discount: 20,
    custom_pixel_id: '', custom_pixel_token: '',
  });

  const [tagInputSize, setTagInputSize] = useState('');
  const [tagInputColor, setTagInputColor] = useState('');
  const [tagFeature, setTagFeature] = useState('');

  // شحن المحافظات والبلاك ليست
  const [selectedGov, setSelectedGov] = useState('القاهرة');
  const [govShippingCost, setGovShippingCost] = useState('50');
  const [blacklistPhone, setBlacklistPhone] = useState('');
  const [blacklistReason, setBlacklistReason] = useState('');

  // فلاتر الطلبات
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  const governoratesList = [
    'القاهرة', 'الجيزة', 'الإسكندرية', 'البحيرة', 'الغربية', 'المنوفية',
    'الشرقية', 'الدقهلية', 'كفر الشيخ', 'القليوبية', 'دمياط', 'بورسعيد',
    'الإسماعيلية', 'السويس', 'الفيوم', 'بني سويف', 'المنيا', 'أسيوط',
    'سوهاج', 'قنا', 'الأقصر', 'أسوان', 'البحر الأحمر', 'مطروح',
  ];

  useEffect(() => {
    initMerchant();
  }, []);

  async function initMerchant() {
    setLoading(true);
    let uid = null;
    const { data: { session } } = await supabase.auth.getSession();
    uid = session?.user?.id || localStorage.getItem('merchant_user_id');

    if (!uid) {
      router.push('/register');
      return;
    }
    setUserId(uid);

    // 1. جلب بروفايل المتجر
    const { data: sData } = await supabase.from('store_profiles').select('*').eq('user_id', uid).maybeSingle();
    if (sData) setMyStore(sData);

    // 2. سعر الدولار اللحظي
    const { data: rateData } = await supabase.from('platform_exchange_rates').select('*').eq('id', 1).single();
    if (rateData) setExchangeRate(Number(rateData.usd_to_egp) || 50.0);

    // 3. الإعدادات والسياسات
    const { data: setts } = await supabase.from('merchant_settings').select('*').eq('user_id', uid).maybeSingle();
    if (setts) setStoreSettings(prev => ({ ...prev, ...setts }));

    // 4. المنتجات والطلبات
    const { data: pData } = await supabase.from('products').select('*').eq('user_id', uid).order('created_at', { ascending: false });
    if (pData) setProducts(pData);

    const { data: oData } = await supabase.from('orders').select('*').eq('user_id', uid).order('created_at', { ascending: false });
    if (oData) setOrders(oData);

    // 5. أسعار الشحن والبلاك ليست
    const { data: shipData } = await supabase.from('shipping_rates').select('*').eq('user_id', uid);
    if (shipData) setShippingRates(shipData);

    const { data: bData } = await supabase.from('blacklist').select('*').eq('user_id', uid);
    if (bData) setBlacklist(bData);

    // 6. التحليلات وسجل المحفظة
    const { data: aData } = await supabase.from('store_analytics').select('*').eq('user_id', uid);
    if (aData) setAnalytics(aData);

    const { data: tData } = await supabase.from('wallet_transactions').select('*').eq('user_id', uid).order('created_at', { ascending: false });
    if (tData) setTransactions(tData);

    setLoading(false);
  }

  // رفع اللوجو
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setStoreSettings(prev => ({ ...prev, store_logo: reader.result }));
      alert('✅ تم اختيار اللوجو بنجاح!');
    };
    reader.readAsDataURL(file);
  };

  // رفع الصور
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadingMedia(true);
    for (const file of files) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductForm(prev => ({ ...prev, images: [...prev.images, reader.result] }));
      };
      reader.readAsDataURL(file);
    }
    setUploadingMedia(false);
  };

  // رفع الفيديو
  const handleVideoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMedia(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setProductForm(prev => ({ ...prev, videos: [...prev.videos, reader.result] }));
      setUploadingMedia(false);
    };
    reader.readAsDataURL(file);
  };

  // حفظ المنتج
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price) return alert('اكتب اسم المنتج وسعر البيع');

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
      landing_headline: productForm.landing_headline,
      landing_video_url: productForm.landing_video_url,
      product_features: productForm.product_features,
      bundle_tier_2_discount: Number(productForm.bundle_tier_2_discount) || 10,
      bundle_tier_3_discount: Number(productForm.bundle_tier_3_discount) || 20,
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

  // حفظ الإعدادات والسياسات
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    await supabase.from('merchant_settings').upsert({ user_id: userId, ...storeSettings }, { onConflict: 'user_id' });
    alert('✅ تم حفظ كافة الإعدادات والسياسات بنجاح!');
  };

  // مصفوفة الشحن
  const handleSaveShippingRate = async () => {
    await supabase.from('shipping_rates').upsert({
      user_id: userId,
      governorate: selectedGov,
      cost: Number(govShippingCost),
      is_free: Number(govShippingCost) === 0,
    }, { onConflict: 'user_id,governorate' });
    alert(`✅ تم تحديث شحن محافظة ${selectedGov}`);
    initMerchant();
  };

  // البلاك ليست
  const handleAddBlacklist = async () => {
    if (!blacklistPhone) return alert('اكتب رقم الهاتف');
    await supabase.from('blacklist').insert([{
      user_id: userId,
      phone: blacklistPhone.trim(),
      reason: blacklistReason || 'عميل مزعج / وهمي',
    }]);
    setBlacklistPhone('');
    setBlacklistReason('');
    initMerchant();
  };

  // تصدير إكسيل
  const exportOrdersToCSV = () => {
    if (orders.length === 0) return alert('لا توجد طلبات لتصديرها!');
    const headers = ['رقم الطلب', 'الزبون', 'الهاتف', 'المحافظة', 'العنوان', 'المنتج', 'الكمية', 'المبلغ', 'الحالة', 'التاريخ'];
    const rows = orders.map((o, idx) => [
      idx + 1, `"${o.customer_name || ''}"`, `"${o.phone || ''}"`, `"${o.governorate || ''}"`,
      `"${o.address || ''}"`, `"${o.product_name || ''}"`, o.quantity || 1, o.total_amount || 0,
      `"${o.status || 'جديد'}"`, new Date(o.created_at).toLocaleDateString('ar-EG'),
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `${myStore?.store_slug}_orders.csv`;
    link.click();
  };

  // الحسابات المالية
  const totalSales = orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
  const totalCost = orders.reduce((sum, o) => sum + (Number(o.cost_price || 0) * (o.quantity || 1)), 0);
  const netProfit = totalSales - totalCost;
  const walletUsd = Number(myStore?.wallet_balance_usd || 0);
  const remainingOrders = Math.floor(walletUsd / 0.05);

  const filteredOrders = orders.filter(o => {
    const mSearch = (o.customer_name || '').toLowerCase().includes(orderSearch.toLowerCase()) || (o.phone || '').includes(orderSearch);
    const mStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
    return mSearch && mStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-white flex items-center justify-center font-sans" dir="rtl">
        <div className="animate-pulse text-lg font-bold">جاري فتح منظومة التاجر المتكاملة...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white font-sans flex flex-col md:flex-row select-none" dir="rtl">
      
      {/* 🧭 الشريط الجانبي الشامل لكافة أدوات التاجر */}
      <aside className="w-full md:w-64 bg-[#111827] border-b md:border-b-0 md:border-l border-slate-800 p-5 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          <div className="space-y-1">
            <span className="text-xl font-black bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              NEXT ORDER
            </span>
            <p className="text-xs text-slate-400 font-bold truncate">متجر: {myStore?.store_name}</p>
          </div>

          <nav className="space-y-1 text-xs font-bold">
            {[
              { id: 'home', label: 'الرئيسية والمؤشرات', icon: '📊' },
              { id: 'wallet', label: `المحفظة والعمولة (${walletUsd.toFixed(2)}$)`, icon: '💳' },
              { id: 'products', label: `المنتجات والمخزون (${products.length})`, icon: '🛍️' },
              { id: 'landing_builder', label: 'القوالب وصفحات الهبوط', icon: '🎨' },
              { id: 'orders', label: `الطلبات والمبيعات (${orders.length})`, icon: '📦' },
              { id: 'shipping', label: 'أسعار الشحن للمحافظات', icon: '🚚' },
              { id: 'policies', label: 'السياسات وروابط السوشيال', icon: '📜' },
              { id: 'blacklist', label: 'حظر الأرقام الوهمية', icon: '🚫' },
              { id: 'pixels', label: 'البيكسلات وتتبع CAPI', icon: '⚡' },
              { id: 'settings', label: 'هوية المتجر والدعم', icon: '⚙️' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition cursor-pointer ${
                  activeTab === item.id ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-800">
          <a
            href={`/store/${myStore?.store_slug}`}
            target="_blank"
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition"
          >
            <span>رابط متجرك للزبائن ↗</span>
          </a>
        </div>
      </aside>

      {/* 🖥️ منطقة المحتوى الرئيسية */}
      <main className="flex-1 p-4 sm:p-8 space-y-6 overflow-y-auto">

        {/* 🌟 1. الرئيسية والمؤشرات */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            
            {/* كرت المحفظة السريع */}
            <div className="bg-gradient-to-r from-slate-900 to-[#111827] border-2 border-emerald-500/30 p-5 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-xs text-slate-400 block mb-1">💳 رصيد محفظتك المسبقة (يخصم 0.05$ لكل أوردر ناجح)</span>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-black text-emerald-400 font-mono">{walletUsd.toFixed(2)}$</span>
                  <span className="text-xs text-slate-400">(~{Math.round(walletUsd * exchangeRate)} ج.م)</span>
                </div>
                <p className="text-xs text-cyan-400 mt-1">يكفيك لاستقبال حتى: <strong>{remainingOrders} أوردر قادم</strong> والرصيد المتبقي يرحل تلقائياً للشهر الجديد.</p>
              </div>

              <button
                onClick={() => setActiveTab('wallet')}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg cursor-pointer"
              >
                تفاصيل المحفظة والشحن ⚡
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-[#111827] border border-slate-800 p-5 rounded-2xl">
                <span className="text-xs text-slate-400 block mb-1">إجمالي المبيعات</span>
                <span className="text-2xl font-black text-emerald-400">{totalSales.toLocaleString()} ج.م</span>
              </div>
              <div className="bg-[#111827] border border-slate-800 p-5 rounded-2xl">
                <span className="text-xs text-slate-400 block mb-1">تكلفة البضاعة</span>
                <span className="text-2xl font-black text-rose-400">{totalCost.toLocaleString()} ج.م</span>
              </div>
              <div className="bg-[#111827] border border-slate-800 p-5 rounded-2xl">
                <span className="text-xs text-slate-400 block mb-1">صافي الأرباح</span>
                <span className="text-2xl font-black text-cyan-400">{netProfit.toLocaleString()} ج.م</span>
              </div>
              <div className="bg-[#111827] border border-slate-800 p-5 rounded-2xl">
                <span className="text-xs text-slate-400 block mb-1">إجمالي الطلبات</span>
                <span className="text-2xl font-black text-blue-400">{orders.length}</span>
              </div>
            </div>
          </div>
        )}

        {/* 🌟 2. المحفظة وسجل الخصومات (0.05$ لكل أوردر) */}
        {activeTab === 'wallet' && (
          <div className="space-y-6 max-w-3xl">
            <div className="bg-[#111827] border border-slate-800 p-6 rounded-3xl space-y-4">
              <h3 className="text-lg font-black text-white">إدارة المحفظة وشحن الرصيد</h3>
              <p className="text-xs text-slate-400">تدفع 5$ كحد أدنى (أو ما يعادلها بالمصري)، ويخصم النظام 0.05$ فقط عند كل أوردر، والمتبقي يرحل للشهر الجديد.</p>

              <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-xs text-slate-400 block">الرصيد المتاح للطلبات</span>
                  <strong className="text-2xl text-emerald-400 font-mono">{walletUsd.toFixed(2)}$</strong>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">سعر الصرف المعتمد</span>
                  <strong className="text-white font-mono">{exchangeRate} ج.م / $</strong>
                </div>
              </div>

              <button
                onClick={() => {
                  const phone = '01000000000'; // رقم الإدارة
                  const msg = encodeURIComponent(`مرحباً، أود شحن محفظة متجري (${myStore?.store_name}) بمبلغ 5$ أو ما يعادلها بالمصري.`);
                  window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
                }}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg transition cursor-pointer"
              >
                طلب شحن رصيد إضافي عبر واتساب الإدارة 🚀
              </button>
            </div>

            <div className="bg-[#111827] border border-slate-800 p-6 rounded-3xl space-y-3">
              <h4 className="text-sm font-bold text-white">سجل الخصومات وشحن المحفظة</h4>
              <div className="space-y-2">
                {transactions.map(t => (
                  <div key={t.id} className="p-3 bg-slate-900 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <strong className="text-white block">{t.description}</strong>
                      <span className="text-slate-500 text-[10px]">{new Date(t.created_at).toLocaleDateString('ar-EG')}</span>
                    </div>
                    <span className={`font-mono font-bold ${t.type === 'deposit' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {t.type === 'deposit' ? `+${t.amount_usd}$` : `-${t.amount_usd}$`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 🌟 3. المنتجات والمخزون (رفع وسائط ومقاسات وألوان) */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="bg-[#111827] p-5 rounded-3xl border border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black">منتجات متجري ({products.length})</h3>
                <p className="text-xs text-slate-400">إضافة وتعديل المنتجات بالفيديو والمقاسات والألوان والبيكسل المخصص</p>
              </div>
              <button
                onClick={() => {
                  setEditingProductId(null);
                  setProductForm({
                    name: '', price: '', original_price: '', discount_percent: '', cost_price: '', stock: 20,
                    images: [], videos: [], sizes: [], colors: [],
                    landing_headline: '', landing_video_url: '', product_features: [],
                    bundle_tier_2_discount: 10, bundle_tier_3_discount: 20,
                    custom_pixel_id: '', custom_pixel_token: '',
                  });
                  setShowProductModal(true);
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg cursor-pointer"
              >
                ➕ إضافة منتج جديد
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {products.map(p => (
                <div key={p.id} className="bg-[#111827] border border-slate-800 p-5 rounded-3xl space-y-3">
                  <div className="w-full h-40 bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center">
                    {p.videos?.[0] ? (
                      <video src={p.videos[0]} className="w-full h-full object-cover" muted autoPlay loop />
                    ) : p.images?.[0] ? (
                      <img src={p.images[0]} className="w-full h-full object-contain" />
                    ) : '🛍️'}
                  </div>
                  <h4 className="font-bold text-sm text-white truncate">{p.name}</h4>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-emerald-400 font-bold">{p.price} ج.م</span>
                    <span className="text-slate-400">المخزون: {p.stock || 20}</span>
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => {
                        setEditingProductId(p.id);
                        setProductForm(p);
                        setShowProductModal(true);
                      }}
                      className="flex-1 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
                    >
                      ✏️ تعديل
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm('حذف المنتج؟')) return;
                        await supabase.from('products').delete().eq('id', p.id);
                        initMerchant();
                      }}
                      className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-xl text-xs font-bold"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 🌟 4. القوالب وصفحات الهبوط */}
        {activeTab === 'landing_builder' && (
          <div className="bg-[#111827] border border-slate-800 p-6 rounded-3xl space-y-6 max-w-4xl">
            <h3 className="text-lg font-black">قوالب العرض وصفحات الهبوط</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { id: 'modern', name: 'المتجر الحديث (Modern Store)', desc: 'عرض شبكي أنيق مع شراء سريع' },
                { id: 'landing', name: 'صفحة هبوط مباشرة (Landing Page)', desc: 'فيديو ومميزات في الصدارة ونموذج أسفلها' },
                { id: 'classic', name: 'الكلاسيكي السريع (Classic COD)', desc: 'تصميم فائق السرعة لحملات الموبايل' },
              ].map(th => (
                <div
                  key={th.id}
                  onClick={() => setStoreSettings({ ...storeSettings, theme_style: th.id })}
                  className={`p-4 rounded-2xl border cursor-pointer transition space-y-2 ${
                    storeSettings.theme_style === th.id ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 bg-slate-900'
                  }`}
                >
                  <span className="text-xs font-bold text-white block">{th.name}</span>
                  <p className="text-[11px] text-slate-400">{th.desc}</p>
                </div>
              ))}
            </div>
            <button onClick={handleSaveSettings} className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer">
              حفظ النمط المختار 💾
            </button>
          </div>
        )}

        {/* 🌟 5. الطلبات والشحن وتصدير الإكسيل */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="bg-[#111827] p-5 rounded-3xl border border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black">الطلبات الواردة لمتجرك ({filteredOrders.length})</h3>
                <p className="text-xs text-slate-400">متابعة الشحن والتوصيل وتصدير كشوف الإكسيل</p>
              </div>
              <button onClick={exportOrdersToCSV} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer">
                📊 تصدير إكسيل للشحن
              </button>
            </div>

            <div className="space-y-3">
              {filteredOrders.map((o, idx) => (
                <div key={o.id} className="bg-[#111827] border border-slate-800 p-4 rounded-2xl flex justify-between items-center text-xs">
                  <div>
                    <strong className="text-white block">طلب #{idx + 1} - {o.customer_name}</strong>
                    <span className="text-slate-400">{o.product_name} | {o.governorate} - {o.address}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400 font-bold font-mono">{o.total_amount} ج.م</span>
                    <select
                      value={o.status || 'جديد'}
                      onChange={async (e) => {
                        await supabase.from('orders').update({ status: e.target.value }).eq('id', o.id);
                        initMerchant();
                      }}
                      className="bg-slate-900 border border-slate-700 text-xs p-2 rounded-xl text-white"
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
              ))}
            </div>
          </div>
        )}

        {/* 🌟 6. أسعار الشحن للمحافظات */}
        {activeTab === 'shipping' && (
          <div className="bg-[#111827] border border-slate-800 p-6 rounded-3xl space-y-4 max-w-2xl">
            <h3 className="text-lg font-black">مصفوفة أسعار الشحن بالمحافظات</h3>
            <div className="flex gap-2">
              <select value={selectedGov} onChange={(e) => setSelectedGov(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white flex-1">
                {governoratesList.map((g, i) => <option key={i} value={g}>{g}</option>)}
              </select>
              <input type="number" placeholder="السعر" value={govShippingCost} onChange={(e) => setGovShippingCost(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white w-28 font-bold" />
              <button onClick={handleSaveShippingRate} className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer">حفظ</button>
            </div>
          </div>
        )}

        {/* 🌟 7. السياسات والشروط */}
        {activeTab === 'policies' && (
          <form onSubmit={handleSaveSettings} className="bg-[#111827] border border-slate-800 p-6 rounded-3xl space-y-4 max-w-2xl">
            <h3 className="text-lg font-black">السياسات وروابط السوشيال</h3>
            <textarea rows="3" placeholder="سياسة الاستبدال" value={storeSettings.return_policy} onChange={(e) => setStoreSettings({ ...storeSettings, return_policy: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white"></textarea>
            <textarea rows="3" placeholder="سياسة الشحن" value={storeSettings.shipping_policy} onChange={(e) => setStoreSettings({ ...storeSettings, shipping_policy: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white"></textarea>
            <button type="submit" className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer">حفظ السياسات</button>
          </form>
        )}

        {/* 🌟 8. البلاك ليست */}
        {activeTab === 'blacklist' && (
          <div className="bg-[#111827] border border-slate-800 p-6 rounded-3xl space-y-4 max-w-2xl">
            <h3 className="text-lg font-black text-rose-400">حظر الأرقام والطلبات الوهمية</h3>
            <div className="flex gap-2">
              <input type="tel" placeholder="01xxxxxxxxx" value={blacklistPhone} onChange={(e) => setBlacklistPhone(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono flex-1" />
              <button onClick={handleAddBlacklist} className="px-4 py-2.5 bg-red-600 text-white rounded-xl text-xs font-bold cursor-pointer">حظر 🚫</button>
            </div>
            <div className="space-y-2">
              {blacklist.map(b => (
                <div key={b.id} className="p-3 bg-slate-900 rounded-xl flex justify-between text-xs">
                  <span className="font-mono text-rose-400">{b.phone}</span>
                  <button onClick={async () => { await supabase.from('blacklist').delete().eq('id', b.id); initMerchant(); }} className="text-slate-500 hover:text-white">إلغاء</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 🌟 9. البيكسلات CAPI */}
        {activeTab === 'pixels' && (
          <form onSubmit={handleSaveSettings} className="bg-[#111827] border border-slate-800 p-6 rounded-3xl space-y-4 max-w-2xl">
            <h3 className="text-lg font-black">إعدادات البيكسل (Facebook CAPI)</h3>
            <input type="text" placeholder="Pixel ID" value={storeSettings.pixel_1} onChange={(e) => setStoreSettings({ ...storeSettings, pixel_1: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs font-mono text-white" />
            <input type="text" placeholder="Access Token" value={storeSettings.token_1} onChange={(e) => setStoreSettings({ ...storeSettings, token_1: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs font-mono text-white" />
            <button type="submit" className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer">حفظ البيكسل</button>
          </form>
        )}

        {/* 🌟 10. إعدادات المتجر */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="bg-[#111827] border border-slate-800 p-6 rounded-3xl space-y-4 max-w-2xl">
            <h3 className="text-lg font-black">هوية المتجر والشعار</h3>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden flex items-center justify-center">
                {storeSettings.store_logo ? <img src={storeSettings.store_logo} className="w-full h-full object-contain" /> : '🖼️'}
              </div>
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="text-xs text-slate-400" />
            </div>
            <input type="text" placeholder="اسم المتجر" value={storeSettings.store_name} onChange={(e) => setStoreSettings({ ...storeSettings, store_name: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white" />
            <input type="tel" placeholder="واتساب خدمة العملاء" value={storeSettings.support_phone} onChange={(e) => setStoreSettings({ ...storeSettings, support_phone: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono" />
            <button type="submit" className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer">حفظ التعديلات</button>
          </form>
        )}

      </main>

      {/* مودال إضافة وتعديل منتج بكافة التفاصيل */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleSaveProduct} className="bg-[#111827] border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full my-8 space-y-4">
            <h3 className="text-base font-black border-b border-slate-800 pb-2">بيانات المنتج وعروض الـ Upsell</h3>
            
            <input type="text" required placeholder="اسم المنتج" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white" />
            
            <div className="grid grid-cols-3 gap-2">
              <input type="number" required placeholder="سعر البيع" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} className="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-bold" />
              <input type="number" placeholder="قبل الخصم" value={productForm.original_price} onChange={(e) => setProductForm({ ...productForm, original_price: e.target.value })} className="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white" />
              <input type="number" placeholder="سعر التكلفة" value={productForm.cost_price} onChange={(e) => setProductForm({ ...productForm, cost_price: e.target.value })} className="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white" />
            </div>

            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-900 rounded-xl text-xs">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">خصم عرض القطعتين (%)</label>
                <input type="number" value={productForm.bundle_tier_2_discount} onChange={(e) => setProductForm({ ...productForm, bundle_tier_2_discount: e.target.value })} className="w-full bg-black border border-slate-800 rounded-lg p-2 text-white font-bold" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">خصم عرض الـ 3 قطع (%)</label>
                <input type="number" value={productForm.bundle_tier_3_discount} onChange={(e) => setProductForm({ ...productForm, bundle_tier_3_discount: e.target.value })} className="w-full bg-black border border-slate-800 rounded-lg p-2 text-white font-bold" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400">رفع صور المنتج</label>
                <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="text-slate-400 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400">رفع فيديو المنتج</label>
                <input type="file" accept="video/*" onChange={handleVideoUpload} className="text-slate-400 text-xs" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button type="button" onClick={() => setShowProductModal(false)} className="px-4 py-2 bg-slate-800 rounded-xl text-xs font-bold">إلغاء</button>
              <button type="submit" disabled={uploadingMedia} className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer">حفظ المنتج 🚀</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
