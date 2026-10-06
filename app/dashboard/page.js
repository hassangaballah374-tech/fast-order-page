'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function MerchantFullDashboard() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  const [myStore, setMyStore] = useState(null);
  const [platformLogo, setPlatformLogo] = useState('');
  const [exchangeRate, setExchangeRate] = useState(50.0);

  const [storeSettings, setStoreSettings] = useState({
    store_name: '',
    owner_name: '',
    store_logo: '',
    store_description: '',
    support_phone: '',
    announcement_text: '',
    theme_style: 'modern',
    return_policy: 'يحق للعميل استبدال أو استرجاع المنتج خلال 14 يوماً من الاستلام في حالته الأصلية.',
    shipping_policy: 'التوصيل خلال 2 إلى 4 أيام عمل لجميع المحافظات والدفع عند الاستلام.',
    pixel_1: '', token_1: '',
  });

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [shippingRates, setShippingRates] = useState([]);
  const [blacklist, setBlacklist] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // مودال المنتج
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const [productForm, setProductForm] = useState({
    name: '', price: '', original_price: '', discount_percent: '', cost_price: '', stock: 20,
    images: [], videos: [], sizes: [], colors: [],
    variants_matrix: [],
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

    const { data: sData } = await supabase.from('store_profiles').select('*').eq('user_id', uid).maybeSingle();
    if (sData) {
      setMyStore(sData);
      setStoreSettings(prev => ({
        ...prev,
        store_name: sData.store_name || prev.store_name,
        owner_name: sData.owner_name || prev.owner_name,
      }));
    }

    const { data: platSettings } = await supabase.from('store_settings').select('store_logo').limit(1).maybeSingle();
    if (platSettings?.store_logo) setPlatformLogo(platSettings.store_logo);

    const { data: rateData } = await supabase.from('platform_exchange_rates').select('*').eq('id', 1).single();
    if (rateData) setExchangeRate(Number(rateData.usd_to_egp) || 50.0);

    const { data: setts } = await supabase.from('merchant_settings').select('*').eq('user_id', uid).maybeSingle();
    if (setts) {
      setStoreSettings(prev => ({
        ...prev,
        ...setts,
        store_name: setts.store_name || sData?.store_name || '',
        owner_name: setts.owner_name || sData?.owner_name || '',
      }));
    }

    const { data: pData } = await supabase.from('products').select('*').eq('user_id', uid).order('created_at', { ascending: false });
    if (pData) setProducts(pData);

    const { data: oData } = await supabase.from('orders').select('*').eq('user_id', uid).order('created_at', { ascending: false });
    if (oData) setOrders(oData);

    const { data: shipData } = await supabase.from('shipping_rates').select('*').eq('user_id', uid);
    if (shipData) setShippingRates(shipData);

    const { data: bData } = await supabase.from('blacklist').select('*').eq('user_id', uid);
    if (bData) setBlacklist(bData);

    const { data: aData } = await supabase.from('store_analytics').select('*').eq('user_id', uid);
    if (aData) setAnalytics(aData);

    const { data: tData } = await supabase.from('wallet_transactions').select('*').eq('user_id', uid).order('created_at', { ascending: false });
    if (tData) setTransactions(tData);

    setLoading(false);
  }

  // 🔄 توليد مصفوفة الألوان والمقاسات (مثال: 4 × 4 = 16 خانة)
  const generateVariantsMatrix = (sizes, colors, basePrice, baseStock) => {
    if (!sizes.length && !colors.length) return [];
    const validSizes = sizes.length ? sizes : ['افتراضي'];
    const validColors = colors.length ? colors : ['افتراضي'];

    const matrix = [];
    validColors.forEach(color => {
      validSizes.forEach(size => {
        // فحص إن كان هذا العنصر موجود مسبقاً للحفاظ على سعره المعدل
        const existing = productForm.variants_matrix.find(v => v.color === color && v.size === size);
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
    const newMatrix = generateVariantsMatrix(newSizes, productForm.colors, productForm.price, productForm.stock);
    setProductForm({ ...productForm, sizes: newSizes, variants_matrix: newMatrix });
    setTagInputSize('');
  };

  const handleRemoveSize = (index) => {
    const newSizes = productForm.sizes.filter((_, i) => i !== index);
    const newMatrix = generateVariantsMatrix(newSizes, productForm.colors, productForm.price, productForm.stock);
    setProductForm({ ...productForm, sizes: newSizes, variants_matrix: newMatrix });
  };

  const handleAddColor = (val) => {
    if (!val.trim()) return;
    const newColors = [...productForm.colors, val.trim()];
    const newMatrix = generateVariantsMatrix(productForm.sizes, newColors, productForm.price, productForm.stock);
    setProductForm({ ...productForm, colors: newColors, variants_matrix: newMatrix });
    setTagInputColor('');
  };

  const handleRemoveColor = (index) => {
    const newColors = productForm.colors.filter((_, i) => i !== index);
    const newMatrix = generateVariantsMatrix(productForm.sizes, newColors, productForm.price, productForm.stock);
    setProductForm({ ...productForm, colors: newColors, variants_matrix: newMatrix });
  };

  // تطبيق السعر والمخزون الموحد على جميع المتغيرات
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

  // حفظ الإعدادات واسم التاجر والمتجر
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
    alert('✅ تم حفظ بيانات التاجر وإعدادات المتجر بنجاح!');
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price) return alert('يرجى ملء اسم المنتج وسعر البيع');

    const payload = {
      user_id: userId,
      name: productForm.name,
      price: Number(productForm.price),
      original_price: Number(productForm.original_price) || 0,
      cost_price: Number(productForm.cost_price) || 0,
      stock: Number(productForm.stock) || 0,
      images: productForm.images,
      videos: productForm.videos,
      sizes: productForm.sizes,
      colors: productForm.colors,
      variants_matrix: productForm.variants_matrix,
      landing_headline: productForm.landing_headline,
      landing_video_url: productForm.landing_video_url,
      custom_pixel_id: (productForm.custom_pixel_id || '').trim(),
      custom_pixel_token: (productForm.custom_pixel_token || '').trim(),
    };

    if (editingProductId) {
      await supabase.from('products').update(payload).eq('id', editingProductId);
    } else {
      await supabase.from('products').insert([payload]);
    }

    setShowProductModal(false);
    initMerchant();
  };

  const walletUsd = Number(myStore?.wallet_balance_usd || 0);
  const remainingOrders = Math.floor(walletUsd / 0.05);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-white flex items-center justify-center font-sans" dir="rtl">
        <div className="animate-pulse text-lg font-bold">جاري فتح لوحة التحكم...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white font-sans flex flex-col md:flex-row select-none" dir="rtl">
      
      {/* 🧭 الشريط الجانبي */}
      <aside className="w-full md:w-64 bg-[#111827] border-b md:border-b-0 md:border-l border-slate-800 p-5 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          
          <div className="space-y-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              {platformLogo ? (
                <img src={platformLogo} alt="Logo" className="w-9 h-9 object-contain rounded-xl bg-white p-0.5 shadow-sm" />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-black font-black flex items-center justify-center text-sm">NO</div>
              )}
              <div>
                <span className="text-base font-black bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent block leading-tight">
                  NEXT ORDER
                </span>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.2 rounded-full border border-emerald-500/30">
                  لوحة التاجر
                </span>
              </div>
            </div>

            {/* اسم المتجر واسم التاجر يظهران بوضوح */}
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 space-y-0.5">
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
              { id: 'products', label: `المنتجات (${products.length})`, icon: '🛍️' },
              { id: 'orders', label: `الطلبات والمبيعات (${orders.length})`, icon: '📦' },
              { id: 'settings', label: 'إعدادات وهوية المتجر', icon: '⚙️' },
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
            <span>عرض المتجر للزبائن ↗</span>
          </a>
        </div>
      </aside>

      {/* 🖥️ المحتوى */}
      <main className="flex-1 p-4 sm:p-8 space-y-6 overflow-y-auto">

        {/* 1. المنتجات وإضافة المنتج مع مصفوفة الـ 16 خانة */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="bg-[#111827] p-5 rounded-3xl border border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black">منتجات المتجر ({products.length})</h3>
                <p className="text-xs text-slate-400">إضافة متغيرات الألوان والمقاسات المركبة مع التسعير الفردي والجماعي</p>
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
              {products.map(p => (
                <div key={p.id} className="bg-[#111827] border border-slate-800 p-5 rounded-3xl space-y-3">
                  <div className="w-full h-40 bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center">
                    {p.images?.[0] ? <img src={p.images[0]} className="w-full h-full object-contain" /> : '🛍️'}
                  </div>
                  <h4 className="font-bold text-sm text-white truncate">{p.name}</h4>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-emerald-400 font-bold">{p.price} ج.م</span>
                    <span className="text-slate-400">المتغيرات: {p.variants_matrix?.length || 0} خيار</span>
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

        {/* 2. إعدادات وهوية المتجر واسم التاجر */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="bg-[#111827] border border-slate-800 p-6 rounded-3xl space-y-4 max-w-2xl">
            <h3 className="text-lg font-black">إعدادات واسم المتجر والتاجر</h3>
            
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">اسم التاجر / المالك (يظهر في اللوحة وللزبائن) *</label>
              <input
                type="text"
                required
                value={storeSettings.owner_name}
                onChange={(e) => setStoreSettings({ ...storeSettings, owner_name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">اسم المتجر الرسمي *</label>
              <input
                type="text"
                required
                value={storeSettings.store_name}
                onChange={(e) => setStoreSettings({ ...storeSettings, store_name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">رقم هاتف الدعم الفني والواتساب</label>
              <input
                type="tel"
                dir="ltr"
                value={storeSettings.support_phone}
                onChange={(e) => setStoreSettings({ ...storeSettings, support_phone: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white font-mono"
              />
            </div>

            <button type="submit" className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-xs font-black cursor-pointer">
              حفظ التعديلات وتحديث الاسم 💾
            </button>
          </form>
        )}

        {/* 3. الشاشة الرئيسية الافتراضية */}
        {activeTab === 'home' && (
          <div className="space-y-4">
            <div className="bg-[#111827] border border-slate-800 p-6 rounded-3xl">
              <h2 className="text-xl font-black">أهلاً بك يا {myStore?.owner_name || 'تاجرنا العزيز'} 🚀</h2>
              <p className="text-xs text-slate-400 mt-1">متجر ({myStore?.store_name}) - استقبل الطلبات وتابع متغيرات منتجاتك بسهولة.</p>
            </div>
          </div>
        )}

      </main>

      {/* 🌟 مودال إضافة المنتج بمصفوفة المتغيرات المركبة (4×4 = 16 خانة) والتسعير الموحد والفردي */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleSaveProduct} className="bg-[#111827] border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-3xl w-full my-8 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-black">بيانات المنتج ومصفوفة الألوان والمقاسات</h3>
              <button type="button" onClick={() => setShowProductModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                required
                placeholder="اسم المنتج"
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white"
              />
              <input
                type="number"
                required
                placeholder="السعر الأساسي (ج.م)"
                value={productForm.price}
                onChange={(e) => {
                  const p = e.target.value;
                  const newMatrix = generateVariantsMatrix(productForm.sizes, productForm.colors, p, productForm.stock);
                  setProductForm({ ...productForm, price: p, variants_matrix: newMatrix });
                }}
                className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white font-bold"
              />
            </div>

            {/* إضافة الألوان والمقاسات */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">الألوان (أدخل واضغط إضافة)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="مثال: أسود، أبيض..."
                    value={tagInputColor}
                    onChange={(e) => setTagInputColor(e.target.value)}
                    className="flex-1 bg-black border border-slate-800 rounded-xl p-2 text-xs text-white"
                  />
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
                  <input
                    type="text"
                    placeholder="مثال: S, M, L, XL..."
                    value={tagInputSize}
                    onChange={(e) => setTagInputSize(e.target.value)}
                    className="flex-1 bg-black border border-slate-800 rounded-xl p-2 text-xs text-white"
                  />
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

            {/* 🌟 مصفوفة التباديل (Combinations Table: 4 ألوان × 4 مقاسات = 16 خانة) */}
            {productForm.variants_matrix.length > 0 && (
              <div className="space-y-3 bg-[#0d1322] border border-slate-800 p-4 rounded-2xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h4 className="text-xs font-black text-emerald-400">
                      مصفوفة المتغيرات الناتجة ({productForm.variants_matrix.length} خانة مدمجة)
                    </h4>
                    <p className="text-[10px] text-slate-400">يمكنك تسعير كل خانة بشكل مستقل، أو وضع تسعير موحد للجميع أدناه.</p>
                  </div>

                  {/* شريط التسعير والمخزون الموحد بنقرة واحدة */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                      type="number"
                      placeholder="سعر موحد للكل"
                      value={bulkPriceInput}
                      onChange={(e) => setBulkPriceInput(e.target.value)}
                      className="w-28 bg-black border border-slate-700 rounded-lg p-1.5 text-xs text-emerald-400 font-bold"
                    />
                    <input
                      type="number"
                      placeholder="كمية موحدة"
                      value={bulkStockInput}
                      onChange={(e) => setBulkStockInput(e.target.value)}
                      className="w-24 bg-black border border-slate-700 rounded-lg p-1.5 text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={handleApplyBulkPricing}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black"
                    >
                      تطبيق للكل ✓
                    </button>
                  </div>
                </div>

                {/* جدول الخانات الـ 16 أو التباديل */}
                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                  <div className="grid grid-cols-12 text-[10px] text-slate-400 font-bold px-2 py-1">
                    <span className="col-span-4">المتغير (اللون / المقاس)</span>
                    <span className="col-span-4">السعر المخصص (ج.م)</span>
                    <span className="col-span-4">المخزون المتوفر</span>
                  </div>
                  {productForm.variants_matrix.map((item, idx) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center bg-slate-900/80 p-2 rounded-xl text-xs border border-slate-800">
                      <div className="col-span-4 font-bold text-white flex items-center gap-1.5">
                        <span className="text-emerald-400">●</span>
                        <span>{item.color}</span> / <span>{item.size}</span>
                      </div>
                      <div className="col-span-4">
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => handleMatrixItemChange(idx, 'price', e.target.value)}
                          className="w-full bg-black border border-slate-700 rounded-lg p-1.5 text-xs text-emerald-400 font-bold"
                        />
                      </div>
                      <div className="col-span-4">
                        <input
                          type="number"
                          value={item.stock}
                          onChange={(e) => handleMatrixItemChange(idx, 'stock', e.target.value)}
                          className="w-full bg-black border border-slate-700 rounded-lg p-1.5 text-xs text-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button type="button" onClick={() => setShowProductModal(false)} className="px-4 py-2 bg-slate-800 rounded-xl text-xs font-bold">إلغاء</button>
              <button type="submit" className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black cursor-pointer shadow-lg">حفظ المنتج والمصفوفة 🚀</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
