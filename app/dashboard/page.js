'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function MerchantFullDashboard() {
  const router = useRouter();

  // التبويب النشط
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [myStore, setMyStore] = useState(null);
  const [platformLogo, setPlatformLogo] = useState('');
  const [exchangeRate, setExchangeRate] = useState(50.0);

  // سياسات منصة NEXT ORDER الرسمية
  const [platformTerms, setPlatformTerms] = useState({
    about_us: '',
    privacy_policy: '',
    terms_conditions: '',
    support_email: 'support@nextorder.shop',
    business_address: 'القاهرة، جمهورية مصر العربية',
    support_phone: '',
  });

  // إعدادات وسياسات متجر التاجر الخاصة به للزبائن
  const [storeSettings, setStoreSettings] = useState({
    store_name: '',
    owner_name: '',
    store_logo: '',
    store_description: '',
    support_phone: '',
    store_email: '',
    store_address: '',
    announcement_text: '',
    theme_style: 'modern',
    about_us: 'متجر متخصص في توفير أفضل المنتجات بأعلى معايير الجودة مع ضمان المعاينة قبل الاستلام.',
    privacy_policy: 'نضمن الحفاظ التام على سرية أرقام الهواتف وبيانات الشحن واستخدامها فقط لتوصيل طلبك.',
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

  // حالة إضافة / تعديل منتج
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const [productForm, setProductForm] = useState({
    name: '', price: '', original_price: '', discount_percent: '', cost_price: '', stock: 20,
    images: [], videos: [], sizes: [], colors: [], variants_matrix: [],
    landing_headline: '', landing_video_url: '', product_features: [],
    bundle_tier_2_discount: 10, bundle_tier_3_discount: 20,
    custom_pixel_id: '', custom_pixel_token: '',
  });

  const [tagInputSize, setTagInputSize] = useState('');
  const [tagInputColor, setTagInputColor] = useState('');
  const [bulkPriceInput, setBulkPriceInput] = useState('');
  const [bulkStockInput, setBulkStockInput] = useState('');

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
    if (typeof window !== 'undefined') {
      setIsSuperAdmin(localStorage.getItem('is_super_admin') === 'true');
    }
    initMerchant();
  }, []);

  async function initMerchant() {
    setLoading(true);
    let uid = null;
    const { data: { session } } = await supabase.auth.getSession();
    uid = localStorage.getItem('merchant_user_id') || session?.user?.id || 'main_flagship_owner';
    setUserId(uid);

    // 1. بروفايل المتجر
    let { data: sData } = await supabase.from('store_profiles').select('*').eq('user_id', uid).maybeSingle();
    
    if (!sData) {
      const { data: fallbackStore } = await supabase.from('store_profiles').select('*').limit(1).maybeSingle();
      if (fallbackStore) sData = fallbackStore;
    }

    if (sData) {
      setMyStore(sData);
      setStoreSettings(prev => ({
        ...prev,
        store_name: sData.store_name || prev.store_name,
        owner_name: sData.owner_name || prev.owner_name,
      }));
    }

    // 2. إعدادات وسياسات وشعار المنصة
    const { data: platSettings } = await supabase.from('store_settings').select('*').limit(1).maybeSingle();
    if (platSettings) {
      if (platSettings.store_logo) setPlatformLogo(platSettings.store_logo);
      setPlatformTerms({
        about_us: platSettings.about_us || '',
        privacy_policy: platSettings.privacy_policy || '',
        terms_conditions: platSettings.terms_conditions || '',
        support_email: platSettings.support_email || 'support@nextorder.shop',
        business_address: platSettings.business_address || 'القاهرة، مصر',
        support_phone: platSettings.support_phone || '',
      });
    }

    // 3. سعر الدولار
    const { data: rateData } = await supabase.from('platform_exchange_rates').select('*').eq('id', 1).single();
    if (rateData) setExchangeRate(Number(rateData.usd_to_egp) || 50.0);

    // 4. إعدادات التاجر
    const { data: setts } = await supabase.from('merchant_settings').select('*').eq('user_id', uid).maybeSingle();
    if (setts) {
      setStoreSettings(prev => ({
        ...prev,
        ...setts,
        store_name: setts.store_name || sData?.store_name || '',
        owner_name: setts.owner_name || sData?.owner_name || '',
      }));
    }

    // 5. جلب كافة منتجات هذا المتجر (سواء بربط user_id أو slug أو المنتجات غير المرتبطة لضمان ظهور منتجاتك)
    const storeSlug = sData?.store_slug || 'main-store';
    const { data: pData } = await supabase
      .from('products')
      .select('*')
      .or(`user_id.eq.${uid},store_slug.eq.${storeSlug},user_id.is.null`)
      .order('created_at', { ascending: false });

    if (pData) {
      const sanitizedProducts = pData.map(p => {
        let imgs = [];
        if (Array.isArray(p.images)) {
          imgs = p.images;
        } else if (typeof p.images === 'string' && p.images.trim()) {
          try {
            const parsed = JSON.parse(p.images);
            imgs = Array.isArray(parsed) ? parsed : [p.images];
          } catch {
            imgs = [p.images];
          }
        }
        return {
          ...p,
          images: imgs,
          variants_matrix: Array.isArray(p.variants_matrix) ? p.variants_matrix : [],
        };
      });
      setProducts(sanitizedProducts);
    }

    // 6. الطلبات
    const { data: oData } = await supabase.from('orders').select('*').eq('user_id', uid).order('created_at', { ascending: false });
    if (oData) setOrders(oData);

    // 7. أسعار الشحن والبلاك ليست
    const { data: shipData } = await supabase.from('shipping_rates').select('*').eq('user_id', uid);
    if (shipData) setShippingRates(shipData);

    const { data: bData } = await supabase.from('blacklist').select('*').eq('user_id', uid);
    if (bData) setBlacklist(bData);

    // 8. التحليلات وسجل المحفظة
    const { data: aData } = await supabase.from('store_analytics').select('*').eq('user_id', uid);
    if (aData) setAnalytics(aData);

    const { data: tData } = await supabase.from('wallet_transactions').select('*').eq('user_id', uid).order('created_at', { ascending: false });
    if (tData) setTransactions(tData);

    setLoading(false);
  }

  // توليد مصفوفة المتغيرات المركبة
  const generateVariantsMatrix = (sizes, colors, basePrice, baseStock, currentMatrix = []) => {
    if (!sizes.length && !colors.length) return [];
    const validSizes = sizes.length ? sizes : ['افتراضي'];
    const validColors = colors.length ? colors : ['افتراضي'];

    const matrix = [];
    validColors.forEach(color => {
      validSizes.forEach(size => {
        const existing = currentMatrix.find(v => v.color === color && v.size === size);
        matrix.push({
          id: `${color}_${size}`,
          color,
          size,
          price: existing ? existing.price : (Number(basePrice) || 0),
          stock: existing ? existing.stock : (Number(baseStock) || 20),
        });
      });
    });
    return matrix;
  };

  const handleAddSize = (val) => {
    if (!val.trim()) return;
    const newSizes = [...productForm.sizes, val.trim()];
    const newMatrix = generateVariantsMatrix(newSizes, productForm.colors, productForm.price, productForm.stock, productForm.variants_matrix);
    setProductForm({ ...productForm, sizes: newSizes, variants_matrix: newMatrix });
    setTagInputSize('');
  };

  const handleRemoveSize = (index) => {
    const newSizes = productForm.sizes.filter((_, i) => i !== index);
    const newMatrix = generateVariantsMatrix(newSizes, productForm.colors, productForm.price, productForm.stock, productForm.variants_matrix);
    setProductForm({ ...productForm, sizes: newSizes, variants_matrix: newMatrix });
  };

  const handleAddColor = (val) => {
    if (!val.trim()) return;
    const newColors = [...productForm.colors, val.trim()];
    const newMatrix = generateVariantsMatrix(productForm.sizes, newColors, productForm.price, productForm.stock, productForm.variants_matrix);
    setProductForm({ ...productForm, colors: newColors, variants_matrix: newMatrix });
    setTagInputColor('');
  };

  const handleRemoveColor = (index) => {
    const newColors = productForm.colors.filter((_, i) => i !== index);
    const newMatrix = generateVariantsMatrix(productForm.sizes, newColors, productForm.price, productForm.stock, productForm.variants_matrix);
    setProductForm({ ...productForm, colors: newColors, variants_matrix: newMatrix });
  };

  const handleApplyBulkPricing = () => {
    if (!bulkPriceInput && !bulkStockInput) return alert('أدخل سعراً أو كمية للتطبيق الموحد');
    const updated = productForm.variants_matrix.map(v => ({
      ...v,
      price: bulkPriceInput ? Number(bulkPriceInput) : v.price,
      stock: bulkStockInput ? Number(bulkStockInput) : v.stock,
    }));
    setProductForm({ ...productForm, variants_matrix: updated });
    alert(`✅ تم تحديث الأسعار والمخزون لجميع الخانات الـ ${updated.length} بنجاح!`);
  };

  const handleMatrixItemChange = (index, field, value) => {
    const updated = [...productForm.variants_matrix];
    updated[index][field] = Number(value);
    setProductForm({ ...productForm, variants_matrix: updated });
  };

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

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price) return alert('اكتب اسم المنتج وسعر البيع');

    const payload = {
      user_id: userId,
      store_slug: myStore?.store_slug || 'main-store',
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
      variants_matrix: productForm.variants_matrix,
      landing_headline: productForm.landing_headline,
      landing_video_url: productForm.landing_video_url,
      product_features: productForm.product_features,
      bundle_tier_2_discount: Number(productForm.bundle_tier_2_discount) || 10,
      bundle_tier_3_discount: Number(productForm.bundle_tier_3_discount) || 20,
      custom_pixel_id: (productForm.custom_pixel_id || '').trim(),
      custom_pixel_token: (productForm.custom_pixel_token || '').trim(),
    };

    if (editingProductId) {
      const { error } = await supabase.from('products').update(payload).eq('id', editingProductId);
      if (error) alert('خطأ في التعديل: ' + error.message);
    } else {
      const { error } = await supabase.from('products').insert([payload]);
      if (error) alert('خطأ في الإضافة: ' + error.message);
    }

    setShowProductModal(false);
    setEditingProductId(null);
    initMerchant();
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    await supabase.from('merchant_settings').upsert({
      user_id: userId,
      ...storeSettings,
    }, { onConflict: 'user_id' });

    if (storeSettings.store_name || storeSettings.owner_name) {
      await supabase.from('store_profiles').update({
        store_name: storeSettings.store_name,
        owner_name: storeSettings.owner_name,
      }).eq('user_id', userId);
    }

    setMyStore(prev => ({ ...prev, store_name: storeSettings.store_name, owner_name: storeSettings.owner_name }));
    alert('✅ تم حفظ كافة الإعدادات والسياسات واسم التاجر بنجاح!');
  };

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
    link.download = `${myStore?.store_slug || 'orders'}.csv`;
    link.click();
  };

  const totalSales = orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
  const totalCost = orders.reduce((sum, o) => sum + (Number(o.cost_price || 0) * (o.quantity || 1)), 0);
  const netProfit = totalSales - totalCost;
  const walletUsd = Number(myStore?.wallet_balance_usd || 0);
  const remainingOrders = Math.floor(walletUsd / 0.05);

  const isUnlimitedActive =
    myStore?.plan_type === 'unlimited_monthly' &&
    myStore?.unlimited_ends_at &&
    new Date(myStore.unlimited_ends_at) > new Date();

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
    <div className="min-h-screen bg-[#0b0f19] text-white font-sans flex flex-col select-none relative" dir="rtl">
      
      {/* زر عائم دائم للرجوع الفوري للسوبر أدمن */}
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 bg-slate-900/95 border-2 border-emerald-500/80 p-2 rounded-2xl shadow-2xl backdrop-blur-md">
        <button
          onClick={() => {
            localStorage.setItem('is_super_admin', 'true');
            router.push('/admin');
          }}
          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black text-xs font-black rounded-xl shadow-lg transition cursor-pointer flex items-center gap-1.5"
        >
          <span>👑</span>
          <span>العودة للوحة السوبر أدمن</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row flex-1">
        {/* الشريط الجانبي */}
        <aside className="w-full md:w-64 bg-[#111827] border-b md:border-b-0 md:border-l border-slate-800 p-5 flex flex-col justify-between shrink-0">
          <div className="space-y-6">
            
            <div className="space-y-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                {platformLogo ? (
                  <img src={platformLogo} alt="NEXT ORDER" className="w-9 h-9 object-contain rounded-xl bg-white p-0.5 shadow-sm" />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-black font-black flex items-center justify-center text-sm">
                    NO
                  </div>
                )}
                <div>
                  <span className="text-base font-black bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent block leading-tight">
                    NEXT ORDER
                  </span>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.2 rounded-full border border-emerald-500/30">
                    لوحة التاجر الشريك
                  </span>
                </div>
              </div>

              <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 space-y-0.5">
                <div className="text-xs text-white font-black truncate flex items-center gap-1.5">
                  <span>🏪</span>
                  <span>{myStore?.store_name || storeSettings.store_name || 'متجري'}</span>
                </div>
                <div className="text-[11px] text-emerald-400 font-bold truncate flex items-center gap-1.5">
                  <span>👤 التاجر:</span>
                  <span>{myStore?.owner_name || storeSettings.owner_name || 'التاجر'}</span>
                </div>
              </div>
            </div>

            <nav className="space-y-1 text-xs font-bold">
              {[
                { id: 'home', label: 'الرئيسية والمؤشرات', icon: '📊' },
                { id: 'plans', label: 'باقات الشحن والاشتراك', icon: '💎' },
                { id: 'wallet', label: isUnlimitedActive ? 'الباقة المفتوحة 👑' : `المحفظة (${walletUsd.toFixed(2)}$)`, icon: '💳' },
                { id: 'products', label: `المنتجات والمخزون (${products.length})`, icon: '🛍️' },
                { id: 'landing_builder', label: 'القوالب وصفحات الهبوط', icon: '🎨' },
                { id: 'orders', label: `الطلبات والمبيعات (${orders.length})`, icon: '📦' },
                { id: 'shipping', label: 'أسعار الشحن للمحافظات', icon: '🚚' },
                { id: 'my_policies', label: 'سياسات وتواصل متجري', icon: '📜' },
                { id: 'platform_terms', label: 'سياسات وشروط المنصة', icon: '🛡️' },
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
              href={`/store/${myStore?.store_slug || 'main-store'}`}
              target="_blank"
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition"
            >
              <span>رابط متجرك للزبائن ↗</span>
            </a>
          </div>
        </aside>

        {/* المحتوى */}
        <main className="flex-1 p-4 sm:p-8 space-y-6 overflow-y-auto">

          {/* 1. الرئيسية والمؤشرات */}
          {activeTab === 'home' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-slate-900 to-[#111827] border-2 border-emerald-500/30 p-5 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <span className="text-xs text-slate-400 block mb-1">
                    {isUnlimitedActive ? '👑 حالة الاشتراك: الباقة الشهرية المفتوحة (غير محدود)' : '💳 رصيد محفظتك المسبقة (يخصم 0.05$ لكل أوردر ناجح)'}
                  </span>
                  <div className="flex items-baseline gap-3">
                    {isUnlimitedActive ? (
                      <span className="text-2xl font-black text-amber-400">طلبات غير محدودة (0$ عمولة)</span>
                    ) : (
                      <>
                        <span className="text-3xl font-black text-emerald-400 font-mono">{walletUsd.toFixed(2)}$</span>
                        <span className="text-xs text-slate-400">(~{Math.round(walletUsd * exchangeRate)} ج.م)</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-cyan-400 mt-1">
                    {isUnlimitedActive
                      ? `سارية حتى: ${new Date(myStore.unlimited_ends_at).toLocaleDateString('ar-EG')}`
                      : `يكفيك لاستقبال حتى: ${remainingOrders} أوردر قادم والرصيد المتبقي يرحل تلقائياً.`}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab('plans')}
                    className="px-4 py-2.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-black shadow-lg cursor-pointer"
                  >
                    💎 ترقية / شحن الباقة
                  </button>
                  <button
                    onClick={() => setActiveTab('wallet')}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg cursor-pointer"
                  >
                    تفاصيل الاستهلاك ⚡
                  </button>
                </div>
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

          {/* 2. باقات الشحن والاشتراك */}
          {activeTab === 'plans' && (
            <div className="space-y-8">
              <div className="border-b border-slate-800 pb-4">
                <h3 className="text-xl font-black text-white">باقات الشحن والاشتراك</h3>
                <p className="text-xs text-slate-400 mt-1">
                  اشحن محفظتك بالقدر الذي يناسبك ليُخصم 0.05$ (5 سنت) فقط لكل طلب ناجح، أو اشترك في الباقة الشهرية المفتوحة لطلبات غير محدودة.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">💳</span>
                  <h4 className="text-sm font-black text-emerald-400">باقات شحن الرصيد المفتوحة (خصم 5 سنت لكل أوردر)</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { usd: 5, orders: 100, label: 'شحن رصيد 5$' },
                    { usd: 25, orders: 500, label: 'شحن رصيد 25$' },
                    { usd: 50, orders: 1000, label: 'شحن رصيد 50$', popular: true },
                    { usd: 100, orders: 2000, label: 'شحن رصيد 100$' },
                  ].map((tier) => (
                    <div
                      key={tier.usd}
                      className={`bg-[#111827] border p-5 rounded-3xl relative flex flex-col justify-between space-y-4 ${
                        tier.popular ? 'border-emerald-500/80 bg-gradient-to-b from-emerald-950/20 to-[#111827]' : 'border-slate-800'
                      }`}
                    >
                      {tier.popular && (
                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-emerald-500 text-black text-[9px] font-black px-2.5 py-0.5 rounded-full">
                          الأكثر استخداماً
                        </span>
                      )}

                      <div className="space-y-2">
                        <span className="text-xs text-slate-400 font-bold block">{tier.label}</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-white font-mono">{tier.usd}$</span>
                          <span className="text-xs text-slate-400 font-mono">(~{Math.round(tier.usd * exchangeRate)} ج.م)</span>
                        </div>
                        <div className="text-xs text-emerald-400 font-bold bg-emerald-500/10 p-2 rounded-xl">
                          سعة الشحن: <strong className="text-white">{tier.orders} طلب</strong>
                        </div>
                        <ul className="text-[11px] text-slate-400 space-y-1.5 pt-2">
                          <li>• خصم 0.05$ لكل طلب ناجح فقط</li>
                          <li>• رصيد تراكمي مستمر بدون تاريخ انتهاء</li>
                          <li>• يرحل الرصيد المتبقي دائماً</li>
                          <li>• عدد منتجات غير محدود</li>
                        </ul>
                      </div>

                      <button
                        onClick={() => {
                          const phone = storeSettings?.support_phone || '01000000000';
                          const msg = encodeURIComponent(`مرحباً، أود شحن محفظة متجري (${myStore?.store_name}) بقيمة ${tier.usd}$ (${Math.round(tier.usd * exchangeRate)} ج.م).`);
                          window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
                        }}
                        className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black transition cursor-pointer"
                      >
                        شحن {tier.usd}$ الآن ⚡
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-lg">👑</span>
                  <h4 className="text-sm font-black text-amber-400">الباقة الشهرية المفتوحة (بدون أي عمولة على الطلبات)</h4>
                </div>

                <div className="bg-gradient-to-r from-amber-950/30 via-[#111827] to-amber-950/20 border-2 border-amber-500/60 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="space-y-2 max-w-xl">
                    <div className="flex items-center gap-3">
                      <h5 className="text-lg font-black text-white">اشتراك شهري غير محدود (Unlimited Monthly)</h5>
                      <span className="bg-amber-500 text-black text-[10px] font-black px-2.5 py-0.5 rounded-full">
                        0% عمولة على الطلبات
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      ادفع 50 دولار شهرياً واستقبل أي عدد تريده من الطلبات بدون احتساب الـ 5 سنت لكل طلب.
                    </p>
                    <div className="flex items-baseline gap-2 pt-1">
                      <span className="text-3xl font-black text-amber-400 font-mono">50$</span>
                      <span className="text-xs text-slate-400">/ شهرياً (~{Math.round(50 * exchangeRate)} ج.م)</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const phone = storeSettings?.support_phone || '01000000000';
                      const msg = encodeURIComponent(`مرحباً إدارة NEXT ORDER، أود تفعيل الباقة الشهرية المفتوحة (50$ شهرياً) لمتجري (${myStore?.store_name}).`);
                      window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
                    }}
                    className="px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black text-xs font-black rounded-2xl shadow-xl transition cursor-pointer whitespace-nowrap"
                  >
                    تفعيل الباقة الشهرية المفتوحة (50$) 🚀
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3. المحفظة وسجل الخصومات */}
          {activeTab === 'wallet' && (
            <div className="space-y-6 max-w-3xl">
              <div className="bg-[#111827] border border-slate-800 p-6 rounded-3xl space-y-4">
                <h3 className="text-lg font-black text-white">إدارة المحفظة وسجل الاستهلاك</h3>
                <p className="text-xs text-slate-400">
                  {isUnlimitedActive
                    ? 'أنت حالياً على الباقة الشهرية غير المحدودة. لا يتم خصم أي عمولة على الطلبات الواردة.'
                    : 'يتم خصم 0.05$ (5 سنت) لكل طلب ناجح وفقاً لسعر صرف الدولار المعتمد لحظياً.'}
                </p>

                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="text-xs text-slate-400 block">حالة الحساب</span>
                    <strong className="text-2xl text-emerald-400 font-mono">
                      {isUnlimitedActive ? 'غير محدود (Unlimited)' : `${walletUsd.toFixed(2)}$`}
                    </strong>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">سعر الصرف المعتمد</span>
                    <strong className="text-white font-mono">{exchangeRate} ج.م / $</strong>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('plans')}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg transition cursor-pointer"
                >
                  شحن رصيد أو ترقية الباقة 🚀
                </button>
              </div>

              <div className="bg-[#111827] border border-slate-800 p-6 rounded-3xl space-y-3">
                <h4 className="text-sm font-bold text-white">سجل العمليات والخصومات</h4>
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

          {/* 4. المنتجات والمخزون ومصفوفة الـ 16 خانة */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="bg-[#111827] p-5 rounded-3xl border border-slate-800 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-black">منتجات متجري ({products.length})</h3>
                  <p className="text-xs text-slate-400">إضافة وتعديل المنتجات بمصفوفة المتغيرات المركبة والتسعير المستقل</p>
                </div>
                <button
                  onClick={() => {
                    setEditingProductId(null);
                    setProductForm({
                      name: '', price: '', original_price: '', discount_percent: '', cost_price: '', stock: 20,
                      images: [], videos: [], sizes: [], colors: [], variants_matrix: [],
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
                {products.map(p => {
                  const displayImg = Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : '';
                  return (
                    <div key={p.id} className="bg-[#111827] border border-slate-800 p-5 rounded-3xl space-y-3">
                      <div className="w-full h-40 bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center">
                        {p.videos?.[0] ? (
                          <video src={p.videos[0]} className="w-full h-full object-cover" muted autoPlay loop />
                        ) : displayImg ? (
                          <img src={displayImg} className="w-full h-full object-contain p-1" alt={p.name} />
                        ) : (
                          <span className="text-2xl">🛍️</span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-white truncate">{p.name}</h4>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-emerald-400 font-bold">{p.price} ج.م</span>
                        <span className="text-slate-400">المخزون: {p.stock || 0}</span>
                      </div>
                      <div className="flex gap-2 pt-2 border-t border-slate-800">
                        <button
                          onClick={() => {
                            setEditingProductId(p.id);
                            setProductForm({
                              ...p,
                              sizes: Array.isArray(p.sizes) ? p.sizes : [],
                              colors: Array.isArray(p.colors) ? p.colors : [],
                              images: Array.isArray(p.images) ? p.images : [],
                              videos: Array.isArray(p.videos) ? p.videos : [],
                              variants_matrix: Array.isArray(p.variants_matrix) ? p.variants_matrix : [],
                            });
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
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. القوالب وصفحات الهبوط */}
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

          {/* 6. الطلبات والشحن وتصدير الإكسيل */}
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

          {/* 7. أسعار الشحن للمحافظات */}
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

          {/* 8. سياسات وتواصل متجر التاجر للزبائن */}
          {activeTab === 'my_policies' && (
            <form onSubmit={handleSaveSettings} className="bg-[#111827] border border-slate-800 p-6 rounded-3xl space-y-5 max-w-3xl">
              <div>
                <h3 className="text-base font-black text-white">إعداد سياسات وبيانات تواصل متجرك للزبائن</h3>
                <p className="text-xs text-slate-400">تظهر في صفحة المنتج في أزرار ومودالات منبثقة تفاعلية للمشتري.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">البريد الإلكتروني الرسمي للمتجر</label>
                  <input
                    type="email"
                    dir="ltr"
                    placeholder="contact@mystore.com"
                    value={storeSettings.store_email || ''}
                    onChange={(e) => setStoreSettings({ ...storeSettings, store_email: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">عنوان المتجر / المخزن / المحافظة</label>
                  <input
                    type="text"
                    placeholder="مثال: مدينة نصر، القاهرة"
                    value={storeSettings.store_address || ''}
                    onChange={(e) => setStoreSettings({ ...storeSettings, store_address: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">من نحن (عن متجرك)</label>
                  <textarea
                    rows="3"
                    value={storeSettings.about_us}
                    onChange={(e) => setStoreSettings({ ...storeSettings, about_us: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white"
                  ></textarea>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">سياسة الاستبدال والاسترجاع للعملاء</label>
                  <textarea
                    rows="3"
                    value={storeSettings.return_policy}
                    onChange={(e) => setStoreSettings({ ...storeSettings, return_policy: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white"
                  ></textarea>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">سياسة الخصوصية وأمان بيانات الزبائن</label>
                  <textarea
                    rows="3"
                    value={storeSettings.privacy_policy}
                    onChange={(e) => setStoreSettings({ ...storeSettings, privacy_policy: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white"
                  ></textarea>
                </div>
              </div>

              <button type="submit" className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black cursor-pointer shadow-lg">
                حفظ السياسات وعرضها للمشترين 💾
              </button>
            </form>
          )}

          {/* 9. سياسات وشروط منصة NEXT ORDER الرسمية */}
          {activeTab === 'platform_terms' && (
            <div className="bg-[#111827] border border-slate-800 p-6 rounded-3xl space-y-5 max-w-3xl">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span>🛡️</span>
                  <span>مركز الشفافية وسياسات منصة NEXT ORDER</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">البيانات والسياسات الرسمية المعتمدة من إدارة المنصة لتنظيم حقوق التجار والخدمات.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                <div>
                  <span className="text-slate-400 block mb-0.5">بريد الدعم الفني للمنصة:</span>
                  <strong className="text-cyan-400 font-mono">{platformTerms.support_email}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">مقر الإدارة:</span>
                  <strong className="text-white">{platformTerms.business_address}</strong>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-1">
                  <h4 className="font-bold text-emerald-400 text-sm">من نحن:</h4>
                  <p className="text-slate-300 leading-relaxed">{platformTerms.about_us || 'منظومة NEXT ORDER الرائدة في التجارة الإلكترونية والدفع عند الاستلام.'}</p>
                </div>

                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-1">
                  <h4 className="font-bold text-amber-400 text-sm">سياسة الخصوصية وأمان المنصة:</h4>
                  <p className="text-slate-300 leading-relaxed">{platformTerms.privacy_policy || 'نلتزم بالحفاظ الكامل على سرية قواعد بيانات التجار والعملاء.'}</p>
                </div>

                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-1">
                  <h4 className="font-bold text-purple-400 text-sm">الشروط والأحكام واتفاقية الخدمة:</h4>
                  <p className="text-slate-300 leading-relaxed">{platformTerms.terms_conditions || 'تخضع جميع المعاملات لشروط الاستخدام العادل وعمولة الطلب المتفق عليها.'}</p>
                </div>
              </div>
            </div>
          )}

          {/* 10. البلاك ليست */}
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

          {/* 11. البيكسلات CAPI */}
          {activeTab === 'pixels' && (
            <form onSubmit={handleSaveSettings} className="bg-[#111827] border border-slate-800 p-6 rounded-3xl space-y-4 max-w-2xl">
              <h3 className="text-lg font-black">إعدادات البيكسل (Facebook CAPI)</h3>
              <input type="text" placeholder="Pixel ID" value={storeSettings.pixel_1} onChange={(e) => setStoreSettings({ ...storeSettings, pixel_1: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs font-mono text-white" />
              <input type="text" placeholder="Access Token" value={storeSettings.token_1} onChange={(e) => setStoreSettings({ ...storeSettings, token_1: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs font-mono text-white" />
              <button type="submit" className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer">حفظ البيكسل</button>
            </form>
          )}

          {/* 12. إعدادات المتجر وهوية التاجر */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="bg-[#111827] border border-slate-800 p-6 rounded-3xl space-y-4 max-w-2xl">
              <h3 className="text-lg font-black">هوية المتجر واسم التاجر والشعار</h3>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden flex items-center justify-center">
                  {storeSettings.store_logo ? <img src={storeSettings.store_logo} className="w-full h-full object-contain" /> : '🖼️'}
                </div>
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="text-xs text-slate-400" />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">اسم التاجر / المالك (يظهر في اللوحة وللزبائن) *</label>
                <input type="text" required value={storeSettings.owner_name} onChange={(e) => setStoreSettings({ ...storeSettings, owner_name: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-bold" />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">اسم المتجر الرسمي *</label>
                <input type="text" required value={storeSettings.store_name} onChange={(e) => setStoreSettings({ ...storeSettings, store_name: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-bold" />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">واتساب خدمة العملاء للزبائن</label>
                <input type="tel" value={storeSettings.support_phone} onChange={(e) => setStoreSettings({ ...storeSettings, support_phone: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono" />
              </div>

              <button type="submit" className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black cursor-pointer">حفظ وتحديث التاجر 💾</button>
            </form>
          )}

        </main>
      </div>

      {/* مودال إضافة وتعديل المنتج */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleSaveProduct} className="bg-[#111827] border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-3xl w-full my-8 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="text-base font-black">بيانات المنتج ومصفوفة الألوان والمقاسات</h3>
              <button type="button" onClick={() => setShowProductModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input type="text" required placeholder="اسم المنتج" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} className="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white" />
              <input type="number" required placeholder="سعر البيع الأساسي (ج.م)" value={productForm.price} onChange={(e) => {
                const p = e.target.value;
                const newMatrix = generateVariantsMatrix(productForm.sizes, productForm.colors, p, productForm.stock, productForm.variants_matrix);
                setProductForm({ ...productForm, price: p, variants_matrix: newMatrix });
              }} className="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-bold" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input type="number" placeholder="قبل الخصم" value={productForm.original_price} onChange={(e) => setProductForm({ ...productForm, original_price: e.target.value })} className="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white" />
              <input type="number" placeholder="سعر التكلفة" value={productForm.cost_price} onChange={(e) => setProductForm({ ...productForm, cost_price: e.target.value })} className="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white" />
            </div>

            {/* الألوان والمقاسات */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">الألوان (أدخل واضغط إضافة)</label>
                <div className="flex gap-2">
                  <input type="text" placeholder="مثال: أسود، أبيض..." value={tagInputColor} onChange={(e) => setTagInputColor(e.target.value)} className="flex-1 bg-black border border-slate-800 rounded-xl p-2 text-xs text-white" />
                  <button type="button" onClick={() => handleAddColor(tagInputColor)} className="px-3 bg-slate-800 text-xs font-bold rounded-xl">+</button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {productForm.colors.map((c, i) => (
                    <span key={i} className="bg-slate-800 px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
                      {c} <button type="button" onClick={() => handleRemoveColor(i)}>✕</button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">المقاسات (أدخل واضغط إضافة)</label>
                <div className="flex gap-2">
                  <input type="text" placeholder="مثال: S, M, L, XL..." value={tagInputSize} onChange={(e) => setTagInputSize(e.target.value)} className="flex-1 bg-black border border-slate-800 rounded-xl p-2 text-xs text-white" />
                  <button type="button" onClick={() => handleAddSize(tagInputSize)} className="px-3 bg-slate-800 text-xs font-bold rounded-xl">+</button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {productForm.sizes.map((s, i) => (
                    <span key={i} className="bg-slate-800 px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
                      {s} <button type="button" onClick={() => handleRemoveSize(i)}>✕</button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* مصفوفة الخانات المركبة */}
            {productForm.variants_matrix.length > 0 && (
              <div className="space-y-3 bg-[#0d1322] border border-slate-800 p-4 rounded-2xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h4 className="text-xs font-black text-emerald-400">
                      مصفوفة المتغيرات المركبة ({productForm.variants_matrix.length} خانة ناتجة)
                    </h4>
                    <p className="text-[10px] text-slate-400">تسعير فردي لكل خانة أو تسعير موحد للجميع أدناه:</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input type="number" placeholder="سعر موحد" value={bulkPriceInput} onChange={(e) => setBulkPriceInput(e.target.value)} className="w-24 bg-black border border-slate-700 rounded-lg p-1.5 text-xs text-emerald-400 font-bold" />
                    <input type="number" placeholder="كمية موحدة" value={bulkStockInput} onChange={(e) => setBulkStockInput(e.target.value)} className="w-20 bg-black border border-slate-700 rounded-lg p-1.5 text-xs text-white" />
                    <button type="button" onClick={handleApplyBulkPricing} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold">تطبيق للكل ✓</button>
                  </div>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                  {productForm.variants_matrix.map((item, idx) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center bg-slate-900/80 p-2 rounded-xl text-xs border border-slate-800">
                      <div className="col-span-4 font-bold text-white flex items-center gap-1">
                        <span className="text-emerald-400">●</span>
                        <span>{item.color}</span> / <span>{item.size}</span>
                      </div>
                      <div className="col-span-4">
                        <input type="number" value={item.price} onChange={(e) => handleMatrixItemChange(idx, 'price', e.target.value)} className="w-full bg-black border border-slate-700 rounded-lg p-1.5 text-xs text-emerald-400 font-bold" />
                      </div>
                      <div className="col-span-4">
                        <input type="number" value={item.stock} onChange={(e) => handleMatrixItemChange(idx, 'stock', e.target.value)} className="w-full bg-black border border-slate-700 rounded-lg p-1.5 text-xs text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* وسائط وعروض الـ Upsell */}
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
              <div>
                <label className="text-[10px] text-slate-400 block">رفع صور المنتج</label>
                <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="text-slate-400 text-xs" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block">رفع فيديو المنتج</label>
                <input type="file" accept="video/*" onChange={handleVideoUpload} className="text-slate-400 text-xs" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button type="button" onClick={() => setShowProductModal(false)} className="px-4 py-2 bg-slate-800 rounded-xl text-xs font-bold">إلغاء</button>
              <button type="submit" disabled={uploadingMedia} className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black cursor-pointer shadow-lg">حفظ المنتج والمصفوفة 🚀</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
