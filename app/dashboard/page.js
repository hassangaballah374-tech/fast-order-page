'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import { useApp } from '../../context/AppContext';
import SpikeBrandHeader from '../../components/SpikeBrandHeader';

export default function MerchantFullDashboard() {
  const router = useRouter();
  const { lang, theme, toggleLanguage, toggleTheme } = useApp();
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [myStore, setMyStore] = useState(null);
  const [platformLogo, setPlatformLogo] = useState('/spike-brand.jpg');
  const [exchangeRate, setExchangeRate] = useState(50.0);

  const [platformTerms, setPlatformTerms] = useState({
    about_us: '',
    privacy_policy: '',
    terms_conditions: '',
    support_email: 'support@spike.shop',
    business_address: 'القاهرة، مصر',
    support_phone: '',
  });

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
    about_us: 'متجر معتمد يوفر منتجات أصلية مع ضمان المعاينة قبل الاستلام والدفع عند التوصيل.',
    privacy_policy: 'نضمن سرية أرقام الهواتف وبيانات الشحن واستخدامها فقط لتسليم الأوردر.',
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

    const { data: platSettings } = await supabase.from('store_settings').select('*').limit(1).maybeSingle();
    if (platSettings) {
      if (platSettings.store_logo) setPlatformLogo(platSettings.store_logo);
      setPlatformTerms({
        about_us: platSettings.about_us || '',
        privacy_policy: platSettings.privacy_policy || '',
        terms_conditions: platSettings.terms_conditions || '',
        support_email: platSettings.support_email || 'support@spike.shop',
        business_address: platSettings.business_address || 'القاهرة، مصر',
        support_phone: platSettings.support_phone || '',
      });
    }

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
    if (!bulkPriceInput && !bulkStockInput) return alert(lang === 'ar' ? 'أدخل سعراً أو كمية للتطبيق الموحد' : 'Enter price or stock to apply');
    const updated = productForm.variants_matrix.map(v => ({
      ...v,
      price: bulkPriceInput ? Number(bulkPriceInput) : v.price,
      stock: bulkStockInput ? Number(bulkStockInput) : v.stock,
    }));
    setProductForm({ ...productForm, variants_matrix: updated });
    alert(lang === 'ar' ? `✅ تم تحديث الأسعار والمخزون لجميع الخانات الـ ${updated.length} بنجاح!` : `✅ Updated for all ${updated.length} variants!`);
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
      alert(lang === 'ar' ? '✅ تم اختيار اللوجو بنجاح!' : '✅ Logo selected!');
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
    if (!productForm.name || !productForm.price) return alert(lang === 'ar' ? 'اكتب اسم المنتج وسعر البيع' : 'Enter product name & price');

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
      if (error) alert('Error: ' + error.message);
    } else {
      const { error } = await supabase.from('products').insert([payload]);
      if (error) alert('Error: ' + error.message);
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
    alert(lang === 'ar' ? '✅ تم حفظ كافة الإعدادات والسياسات واسم التاجر بنجاح!' : '✅ Store Settings Saved!');
  };

  const handleSaveShippingRate = async () => {
    await supabase.from('shipping_rates').upsert({
      user_id: userId,
      governorate: selectedGov,
      cost: Number(govShippingCost),
      is_free: Number(govShippingCost) === 0,
    }, { onConflict: 'user_id,governorate' });
    alert(lang === 'ar' ? `✅ تم تحديث شحن محافظة ${selectedGov}` : `✅ Shipping updated for ${selectedGov}`);
    initMerchant();
  };

  const handleAddBlacklist = async () => {
    if (!blacklistPhone) return alert(lang === 'ar' ? 'اكتب رقم الهاتف' : 'Enter phone number');
    await supabase.from('blacklist').insert([{
      user_id: userId,
      phone: blacklistPhone.trim(),
      reason: blacklistReason || 'Fake / Spam',
    }]);
    setBlacklistPhone('');
    setBlacklistReason('');
    initMerchant();
  };

  const exportOrdersToCSV = () => {
    if (orders.length === 0) return alert(lang === 'ar' ? 'لا توجد طلبات لتصديرها!' : 'No orders to export!');
    const headers = ['Order #', 'Customer', 'Phone', 'Governorate', 'Address', 'Product', 'Quantity', 'Amount', 'Status', 'Date'];
    const rows = orders.map((o, idx) => [
      idx + 1, `"${o.customer_name || ''}"`, `"${o.phone || ''}"`, `"${o.governorate || ''}"`,
      `"${o.address || ''}"`, `"${o.product_name || ''}"`, o.quantity || 1, o.total_amount || 0,
      `"${o.status || 'جديد'}"`, new Date(o.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US'),
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
      <div className={`min-h-screen flex items-center justify-center font-sans ${isDark ? 'bg-[#0E1E38] text-white' : 'bg-[#F7F4EC] text-[#0E1E38]'}`}>
        <div className="animate-pulse text-lg font-bold">{lang === 'ar' ? 'جاري فتح لوحة التاجر الشريك (سبايك)...' : 'Loading SPIKE Merchant Dashboard...'}</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans flex flex-col select-none relative transition-colors ${
      isDark ? 'bg-[#0E1E38] text-white' : 'bg-[#F7F4EC] text-[#0E1E38]'
    }`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* 👑 شريط عائم دائم للسوبر أدمن */}
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 bg-slate-900/95 border-2 border-[#E86A53] p-2 rounded-2xl shadow-2xl backdrop-blur-md">
        <button
          onClick={() => {
            localStorage.setItem('is_super_admin', 'true');
            router.push('/admin');
          }}
          className="px-4 py-2 bg-gradient-to-r from-[#E86A53] to-amber-500 hover:from-[#d65942] text-white text-xs font-black rounded-xl shadow-lg transition cursor-pointer flex items-center gap-1.5"
        >
          <span>👑</span>
          <span>{lang === 'ar' ? 'العودة للوحة السوبر أدمن' : 'Back to Super Admin'}</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row flex-1">
        {/* 🧭 الشريط الجانبي */}
        <aside className={`w-full md:w-64 border-b md:border-b-0 p-5 flex flex-col justify-between shrink-0 transition-colors ${
          lang === 'ar' ? 'md:border-l' : 'md:border-r'
        } ${isDark ? 'bg-[#091222] border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="space-y-6">
            
            <div className="space-y-3 pb-3 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src="/spike-brand.jpg"
                    alt="سبايك"
                    className="h-10 w-auto object-contain rounded-lg shadow-sm border border-slate-700"
                  />
                  <div>
                    <span className="text-sm font-black text-[#E86A53] block leading-tight">
                      سبايك | SPIKE
                    </span>
                    <span className="text-[9px] bg-[#E86A53]/20 text-[#E86A53] font-bold px-1.5 py-0.2 rounded-full border border-[#E86A53]/30">
                      {lang === 'ar' ? 'لوحة التاجر الشريك' : 'Merchant Partner'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-1">
                  <button onClick={toggleLanguage} className="px-2 py-1 bg-slate-800 text-white rounded-lg text-[10px] font-bold border border-slate-700">
                    🌐 {lang === 'ar' ? 'EN' : 'AR'}
                  </button>
                  <button onClick={toggleTheme} className="px-2 py-1 bg-slate-800 text-white rounded-lg text-[10px] font-bold border border-slate-700">
                    {isDark ? '☀️' : '🌙'}
                  </button>
                </div>
              </div>

              <div className={`p-2.5 rounded-xl border space-y-0.5 ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                <div className="text-xs font-black truncate flex items-center gap-1.5">
                  <span>🏪</span>
                  <span>{myStore?.store_name || storeSettings.store_name || (lang === 'ar' ? 'متجري' : 'My Store')}</span>
                </div>
                <div className="text-[11px] text-[#E86A53] font-bold truncate flex items-center gap-1.5">
                  <span>👤 {lang === 'ar' ? 'التاجر:' : 'Merchant:'}</span>
                  <span>{myStore?.owner_name || storeSettings.owner_name || (lang === 'ar' ? 'التاجر' : 'Owner')}</span>
                </div>
              </div>
            </div>

            <nav className="space-y-1 text-xs font-bold">
              {[
                { id: 'home', label: lang === 'ar' ? 'الرئيسية والمؤشرات' : 'Dashboard Overview', icon: '📊' },
                { id: 'plans', label: lang === 'ar' ? 'باقات الشحن والاشتراك' : 'Top-up & Plans', icon: '💎' },
                { id: 'wallet', label: isUnlimitedActive ? (lang === 'ar' ? 'الباقة المفتوحة 👑' : 'Unlimited Plan 👑') : `${lang === 'ar' ? 'المحفظة' : 'Wallet'} (${walletUsd.toFixed(2)}$)`, icon: '💳' },
                { id: 'products', label: `${lang === 'ar' ? 'المنتجات والمخزون' : 'Products & Stock'} (${products.length})`, icon: '🛍️' },
                { id: 'landing_builder', label: lang === 'ar' ? 'القوالب وصفحات الهبوط' : 'Templates & Landers', icon: '🎨' },
                { id: 'orders', label: `${lang === 'ar' ? 'الطلبات والمبيعات' : 'Orders & Sales'} (${orders.length})`, icon: '📦' },
                { id: 'shipping', label: lang === 'ar' ? 'أسعار الشحن للمحافظات' : 'Shipping Matrix', icon: '🚚' },
                { id: 'my_policies', label: lang === 'ar' ? 'سياسات وتواصل متجري' : 'Store Policies', icon: '📜' },
                { id: 'platform_terms', label: lang === 'ar' ? 'سياسات منصة سبايك' : 'SPIKE Terms', icon: '🛡️' },
                { id: 'blacklist', label: lang === 'ar' ? 'حظر الأرقام الوهمية' : 'Spam Blacklist', icon: '🚫' },
                { id: 'pixels', label: lang === 'ar' ? 'البيكسلات وتتبع CAPI' : 'Tracking Pixels', icon: '⚡' },
                { id: 'settings', label: lang === 'ar' ? 'هوية المتجر والدعم' : 'Store Settings', icon: '⚙️' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition cursor-pointer ${
                    activeTab === item.id 
                      ? 'bg-[#E86A53] text-white shadow-lg shadow-[#E86A53]/30' 
                      : isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-black'
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
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-[#E86A53] text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition"
            >
              <span>{lang === 'ar' ? 'رابط متجرك للزبائن ↗' : 'View Customer Store ↗'}</span>
            </a>
          </div>
        </aside>

        {/* 🖥️ المحتوى */}
        <main className="flex-1 p-4 sm:p-8 space-y-6 overflow-y-auto">

          {/* 1. الرئيسية والمؤشرات */}
          {activeTab === 'home' && (
            <div className="space-y-6">
              <div className={`border-2 p-5 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                isDark ? 'bg-gradient-to-r from-slate-900 to-[#091222] border-[#E86A53]/40' : 'bg-white border-[#E86A53]/40 shadow-sm'
              }`}>
                <div>
                  <span className="text-xs text-slate-400 block mb-1">
                    {isUnlimitedActive 
                      ? (lang === 'ar' ? '👑 حالة الاشتراك: الباقة الشهرية المفتوحة (غير محدود)' : '👑 Plan: Unlimited Monthly Plan') 
                      : (lang === 'ar' ? '💳 رصيد محفظتك المسبقة (يخصم 0.05$ لكل أوردر ناجح)' : '💳 Wallet Balance (Deducts $0.05 per confirmed order)')}
                  </span>
                  <div className="flex items-baseline gap-3">
                    {isUnlimitedActive ? (
                      <span className="text-2xl font-black text-amber-400">{lang === 'ar' ? 'طلبات غير محدودة (0$ عمولة)' : 'Unlimited Orders ($0 Fee)'}</span>
                    ) : (
                      <>
                        <span className="text-3xl font-black text-[#E86A53] font-mono">{walletUsd.toFixed(2)}$</span>
                        <span className="text-xs text-slate-400">(~{Math.round(walletUsd * exchangeRate)} {lang === 'ar' ? 'ج.م' : 'EGP'})</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-cyan-400 mt-1">
                    {isUnlimitedActive
                      ? `${lang === 'ar' ? 'سارية حتى:' : 'Valid until:'} ${new Date(myStore.unlimited_ends_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}`
                      : `${lang === 'ar' ? 'يكفيك لاستقبال حتى:' : 'Capacity for:'} ${remainingOrders} ${lang === 'ar' ? 'أوردر قادم والرصيد يرحل تلقائياً.' : 'upcoming orders. Balance rolls over.'}`}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab('plans')}
                    className="px-4 py-2.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-black shadow-lg cursor-pointer"
                  >
                    💎 {lang === 'ar' ? 'ترقية / شحن الباقة' : 'Upgrade / Top-up'}
                  </button>
                  <button
                    onClick={() => setActiveTab('wallet')}
                    className="px-5 py-2.5 bg-[#E86A53] hover:bg-[#d65942] text-white rounded-xl text-xs font-black shadow-lg cursor-pointer"
                  >
                    {lang === 'ar' ? 'تفاصيل الاستهلاك ⚡' : 'Wallet Details ⚡'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#091222] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <span className="text-xs text-slate-400 block mb-1">{lang === 'ar' ? 'إجمالي المبيعات' : 'Gross Revenue'}</span>
                  <span className="text-2xl font-black text-[#E86A53]">{totalSales.toLocaleString()} {lang === 'ar' ? 'ج.م' : 'EGP'}</span>
                </div>
                <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#091222] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <span className="text-xs text-slate-400 block mb-1">{lang === 'ar' ? 'تكلفة البضاعة' : 'Cost of Goods'}</span>
                  <span className="text-2xl font-black text-rose-400">{totalCost.toLocaleString()} {lang === 'ar' ? 'ج.م' : 'EGP'}</span>
                </div>
                <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#091222] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <span className="text-xs text-slate-400 block mb-1">{lang === 'ar' ? 'صافي الأرباح' : 'Net Profit'}</span>
                  <span className="text-2xl font-black text-emerald-400">{netProfit.toLocaleString()} {lang === 'ar' ? 'ج.م' : 'EGP'}</span>
                </div>
                <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#091222] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <span className="text-xs text-slate-400 block mb-1">{lang === 'ar' ? 'إجمالي الطلبات' : 'Total Orders'}</span>
                  <span className="text-2xl font-black text-blue-400">{orders.length}</span>
                </div>
              </div>
            </div>
          )}

          {/* 2. باقات الشحن والاشتراك */}
          {activeTab === 'plans' && (
            <div className="space-y-8">
              <div className="border-b border-slate-800 pb-4">
                <h3 className="text-xl font-black">{lang === 'ar' ? 'باقات الشحن والاشتراك' : 'Plans & Top-up Packages'}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  {lang === 'ar' 
                    ? 'اشحن محفظتك بالقدر الذي يناسبك ليُخصم 0.05$ (5 سنت) فقط لكل طلب ناجح، أو اشترك في الباقة الشهرية المفتوحة لطلبات غير محدودة.'
                    : 'Recharge your wallet to deduct only $0.05 per confirmed order, or subscribe to the unlimited monthly plan.'}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">💳</span>
                  <h4 className="text-sm font-black text-[#E86A53]">{lang === 'ar' ? 'باقات شحن الرصيد المفتوحة (خصم 5 سنت لكل أوردر)' : 'Pay-As-You-Go Top-up (5¢ per order)'}</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { usd: 5, orders: 100, label: lang === 'ar' ? 'شحن رصيد 5$' : 'Starter ($5)' },
                    { usd: 25, orders: 500, label: lang === 'ar' ? 'شحن رصيد 25$' : 'Growth ($25)' },
                    { usd: 50, orders: 1000, label: lang === 'ar' ? 'شحن رصيد 50$' : 'Pro ($50)', popular: true },
                    { usd: 100, orders: 2000, label: lang === 'ar' ? 'شحن رصيد 100$' : 'Enterprise ($100)' },
                  ].map((tier) => (
                    <div
                      key={tier.usd}
                      className={`border p-5 rounded-3xl relative flex flex-col justify-between space-y-4 ${
                        tier.popular 
                          ? isDark ? 'border-[#E86A53]/80 bg-gradient-to-b from-[#E86A53]/20 to-[#091222]' : 'border-[#E86A53] bg-[#E86A53]/5 shadow-md'
                          : isDark ? 'bg-[#091222] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                      }`}
                    >
                      {tier.popular && (
                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#E86A53] text-white text-[9px] font-black px-2.5 py-0.5 rounded-full">
                          {lang === 'ar' ? 'الأكثر استخداماً' : 'Most Popular'}
                        </span>
                      )}

                      <div className="space-y-2">
                        <span className="text-xs text-slate-400 font-bold block">{tier.label}</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black font-mono">{tier.usd}$</span>
                          <span className="text-xs text-slate-400 font-mono">(~{Math.round(tier.usd * exchangeRate)} {lang === 'ar' ? 'ج.م' : 'EGP'})</span>
                        </div>
                        <div className="text-xs text-[#E86A53] font-bold bg-[#E86A53]/10 p-2 rounded-xl">
                          {lang === 'ar' ? 'سعة الشحن:' : 'Capacity:'} <strong className={isDark ? 'text-white' : 'text-black'}>{tier.orders} {lang === 'ar' ? 'طلب' : 'orders'}</strong>
                        </div>
                        <ul className="text-[11px] text-slate-400 space-y-1.5 pt-2">
                          <li>• {lang === 'ar' ? 'خصم 0.05$ لكل طلب ناجح فقط' : '$0.05 per confirmed order only'}</li>
                          <li>• {lang === 'ar' ? 'رصيد تراكمي مستمر بدون تاريخ انتهاء' : 'Balance never expires'}</li>
                          <li>• {lang === 'ar' ? 'عدد منتجات غير محدود' : 'Unlimited products allowed'}</li>
                        </ul>
                      </div>

                      <button
                        onClick={() => {
                          const phone = storeSettings?.support_phone || '01000000000';
                          const msg = encodeURIComponent(`مرحباً منصة سبايك، أود شحن محفظة متجري (${myStore?.store_name}) بقيمة ${tier.usd}$ (${Math.round(tier.usd * exchangeRate)} ج.م).`);
                          window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
                        }}
                        className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black transition cursor-pointer"
                      >
                        {lang === 'ar' ? `شحن ${tier.usd}$ الآن ⚡` : `Top-up $${tier.usd} Now ⚡`}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-lg">👑</span>
                  <h4 className="text-sm font-black text-amber-400">{lang === 'ar' ? 'الباقة الشهرية المفتوحة (بدون أي عمولة على الطلبات)' : 'Unlimited Monthly Plan (0% Commission)'}</h4>
                </div>

                <div className={`border-2 border-amber-500/60 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${
                  isDark ? 'bg-gradient-to-r from-amber-950/30 via-[#091222] to-amber-950/20' : 'bg-amber-50/50'
                }`}>
                  <div className="space-y-2 max-w-xl">
                    <div className="flex items-center gap-3">
                      <h5 className="text-lg font-black">{lang === 'ar' ? 'اشتراك شهري غير محدود (Unlimited Monthly)' : 'Unlimited Monthly Subscription'}</h5>
                      <span className="bg-amber-500 text-black text-[10px] font-black px-2.5 py-0.5 rounded-full">
                        {lang === 'ar' ? '0% عمولة على الطلبات' : '0% Order Commission'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {lang === 'ar' 
                        ? 'ادفع 50 دولار شهرياً واستقبل أي عدد تريده من الطلبات بدون احتساب الـ 5 سنت لكل طلب.'
                        : 'Pay $50/month flat fee and take unlimited orders without paying 5 cents per order.'}
                    </p>
                    <div className="flex items-baseline gap-2 pt-1">
                      <span className="text-3xl font-black text-amber-400 font-mono">50$</span>
                      <span className="text-xs text-slate-400">/ {lang === 'ar' ? 'شهرياً' : 'month'} (~{Math.round(50 * exchangeRate)} {lang === 'ar' ? 'ج.م' : 'EGP'})</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const phone = storeSettings?.support_phone || '01000000000';
                      const msg = encodeURIComponent(`مرحباً إدارة سبايك، أود تفعيل الباقة الشهرية المفتوحة (50$ شهرياً) لمتجري (${myStore?.store_name}).`);
                      window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
                    }}
                    className="px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black text-xs font-black rounded-2xl shadow-xl transition cursor-pointer whitespace-nowrap"
                  >
                    {lang === 'ar' ? 'تفعيل الباقة الشهرية المفتوحة (50$) 🚀' : 'Activate Unlimited Plan ($50) 🚀'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3. المحفظة وسجل الخصومات */}
          {activeTab === 'wallet' && (
            <div className="space-y-6 max-w-3xl">
              <div className={`border p-6 rounded-3xl space-y-4 ${isDark ? 'bg-[#091222] border-slate-800' : 'bg-white border-slate-200'}`}>
                <h3 className="text-lg font-black">{lang === 'ar' ? 'إدارة المحفظة وسجل الاستهلاك' : 'Wallet & Usage History'}</h3>
                <p className="text-xs text-slate-400">
                  {isUnlimitedActive
                    ? (lang === 'ar' ? 'أنت حالياً على الباقة الشهرية غير المحدودة. لا يتم خصم أي عمولة على الطلبات الواردة.' : 'You are on the Unlimited Plan. Zero commission on incoming orders.')
                    : (lang === 'ar' ? 'يتم خصم 0.05$ (5 سنت) لكل طلب ناجح وفقاً لسعر صرف الدولار المعتمد لحظياً.' : 'Deducts $0.05 per confirmed order dynamically at real-time USD exchange rate.')}
                </p>

                <div className={`p-4 rounded-2xl border flex justify-between items-center ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div>
                    <span className="text-xs text-slate-400 block">{lang === 'ar' ? 'حالة الحساب' : 'Account Status'}</span>
                    <strong className="text-2xl text-[#E86A53] font-mono">
                      {isUnlimitedActive ? 'غير محدود (Unlimited)' : `${walletUsd.toFixed(2)}$`}
                    </strong>
                  </div>
                  <div className={lang === 'ar' ? 'text-right' : 'text-left'}>
                    <span className="text-xs text-slate-400 block">{lang === 'ar' ? 'سعر الصرف المعتمد' : 'USD Rate'}</span>
                    <strong className="font-mono">{exchangeRate} {lang === 'ar' ? 'ج.م / $' : 'EGP / $'}</strong>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('plans')}
                  className="w-full py-3.5 bg-[#E86A53] hover:bg-[#d65942] text-white font-black text-xs rounded-xl shadow-lg shadow-[#E86A53]/30 transition cursor-pointer"
                >
                  {lang === 'ar' ? 'شحن رصيد أو ترقية الباقة 🚀' : 'Top-up or Upgrade Plan 🚀'}
                </button>
              </div>

              <div className={`border p-6 rounded-3xl space-y-3 ${isDark ? 'bg-[#091222] border-slate-800' : 'bg-white border-slate-200'}`}>
                <h4 className="text-sm font-bold">{lang === 'ar' ? 'سجل العمليات والخصومات' : 'Transaction Log'}</h4>
                <div className="space-y-2">
                  {transactions.map(t => (
                    <div key={t.id} className={`p-3 rounded-xl flex justify-between items-center text-xs ${isDark ? 'bg-slate-900' : 'bg-slate-100'}`}>
                      <div>
                        <strong className="block">{t.description}</strong>
                        <span className="text-slate-500 text-[10px]">{new Date(t.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}</span>
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
              <div className={`p-5 rounded-3xl border flex justify-between items-center ${isDark ? 'bg-[#091222] border-slate-800' : 'bg-white border-slate-200'}`}>
                <div>
                  <h3 className="text-lg font-black">{lang === 'ar' ? 'منتجات متجري' : 'Store Products'} ({products.length})</h3>
                  <p className="text-xs text-slate-400">{lang === 'ar' ? 'إضافة وتعديل المنتجات بمصفوفة المتغيرات المركبة والتسعير المستقل' : 'Manage products with variants matrix & independent pricing'}</p>
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
                  className="px-5 py-2.5 bg-[#E86A53] hover:bg-[#d65942] text-white rounded-xl text-xs font-black shadow-lg shadow-[#E86A53]/30 cursor-pointer"
                >
                  ➕ {lang === 'ar' ? 'إضافة منتج جديد' : 'Add Product'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {products.map(p => {
                  const displayImg = Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : '';
                  return (
                    <div key={p.id} className={`border p-5 rounded-3xl space-y-3 ${isDark ? 'bg-[#091222] border-slate-800' : 'bg-white border-slate-200'}`}>
                      <div className="w-full h-40 bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center">
                        {p.videos?.[0] ? (
                          <video src={p.videos[0]} className="w-full h-full object-cover" muted autoPlay loop />
                        ) : displayImg ? (
                          <img src={displayImg} className="w-full h-full object-contain p-1" alt={p.name} />
                        ) : (
                          <span className="text-2xl">🛍️</span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm truncate">{p.name}</h4>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[#E86A53] font-bold">{p.price} {lang === 'ar' ? 'ج.م' : 'EGP'}</span>
                        <span className="text-slate-400">{lang === 'ar' ? 'الخيارات:' : 'Variants:'} {p.variants_matrix?.length || 0}</span>
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
                          className={`flex-1 py-1.5 rounded-xl text-xs font-bold ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-black'}`}
                        >
                          ✏️ {lang === 'ar' ? 'تعديل' : 'Edit'}
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm(lang === 'ar' ? 'حذف المنتج؟' : 'Delete product?')) return;
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
            <div className={`border p-6 rounded-3xl space-y-6 max-w-4xl ${isDark ? 'bg-[#091222] border-slate-800' : 'bg-white border-slate-200'}`}>
              <h3 className="text-lg font-black">{lang === 'ar' ? 'قوالب العرض وصفحات الهبوط' : 'Templates & Landers'}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { id: 'modern', name: lang === 'ar' ? 'المتجر الحديث (Modern Store)' : 'Modern Storefront', desc: lang === 'ar' ? 'عرض شبكي أنيق مع شراء سريع' : 'Grid layout with instant checkout' },
                  { id: 'landing', name: lang === 'ar' ? 'صفحة هبوط مباشرة (Landing Page)' : 'Direct Landing Page', desc: lang === 'ar' ? 'فيديو ومميزات في الصدارة ونموذج أسفلها' : 'Hero video & direct order form' },
                  { id: 'classic', name: lang === 'ar' ? 'الكلاسيكي السريع (Classic COD)' : 'Classic Fast COD', desc: lang === 'ar' ? 'تصميم فائق السرعة لحملات الموبايل' : 'Ultra-fast mobile optimized' },
                ].map(th => (
                  <div
                    key={th.id}
                    onClick={() => setStoreSettings({ ...storeSettings, theme_style: th.id })}
                    className={`p-4 rounded-2xl border cursor-pointer transition space-y-2 ${
                      storeSettings.theme_style === th.id 
                        ? 'border-[#E86A53] bg-[#E86A53]/10' 
                        : isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <span className="text-xs font-bold block">{th.name}</span>
                    <p className="text-[11px] text-slate-400">{th.desc}</p>
                  </div>
                ))}
              </div>
              <button onClick={handleSaveSettings} className="px-6 py-3 bg-[#E86A53] hover:bg-[#d65942] text-white rounded-xl text-xs font-bold cursor-pointer shadow-md shadow-[#E86A53]/30">
                {lang === 'ar' ? 'حفظ النمط المختار 💾' : 'Save Template Style 💾'}
              </button>
            </div>
          )}

          {/* 6. الطلبات والشحن وتصدير الإكسيل */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className={`p-5 rounded-3xl border flex justify-between items-center ${isDark ? 'bg-[#091222] border-slate-800' : 'bg-white border-slate-200'}`}>
                <div>
                  <h3 className="text-lg font-black">{lang === 'ar' ? 'الطلبات الواردة لمتجرك' : 'Incoming Orders'} ({filteredOrders.length})</h3>
                  <p className="text-xs text-slate-400">{lang === 'ar' ? 'متابعة الشحن والتوصيل وتصدير كشوف الإكسيل' : 'Manage orders & export courier manifests'}</p>
                </div>
                <button onClick={exportOrdersToCSV} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer">
                  📊 {lang === 'ar' ? 'تصدير إكسيل للشحن' : 'Export Orders CSV'}
                </button>
              </div>

              <div className="space-y-3">
                {filteredOrders.map((o, idx) => (
                  <div key={o.id} className={`border p-4 rounded-2xl flex justify-between items-center text-xs ${isDark ? 'bg-[#091222] border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div>
                      <strong className="block">#{idx + 1} - {o.customer_name}</strong>
                      <span className="text-slate-400">{o.product_name} | {o.governorate} - {o.address}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[#E86A53] font-bold font-mono">{o.total_amount} {lang === 'ar' ? 'ج.م' : 'EGP'}</span>
                      <select
                        value={o.status || 'جديد'}
                        onChange={async (e) => {
                          await supabase.from('orders').update({ status: e.target.value }).eq('id', o.id);
                          initMerchant();
                        }}
                        className={`text-xs p-2 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}
                      >
                        <option value="جديد">جديد / New</option>
                        <option value="مؤكد">مؤكد / Confirmed</option>
                        <option value="جاري الشحن">جاري الشحن / Dispatched</option>
                        <option value="تم التوصيل">تم التوصيل / Delivered</option>
                        <option value="مرتجع">مرتجع / Returned</option>
                        <option value="ملغي">ملغي / Cancelled</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. أسعار الشحن للمحافظات */}
          {activeTab === 'shipping' && (
            <div className={`border p-6 rounded-3xl space-y-4 max-w-2xl ${isDark ? 'bg-[#091222] border-slate-800' : 'bg-white border-slate-200'}`}>
              <h3 className="text-lg font-black">{lang === 'ar' ? 'مصفوفة أسعار الشحن بالمحافظات' : 'Shipping Rates Matrix'}</h3>
              <div className="flex gap-2">
                <select value={selectedGov} onChange={(e) => setSelectedGov(e.target.value)} className={`border rounded-xl p-2.5 text-xs flex-1 ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}>
                  {governoratesList.map((g, i) => <option key={i} value={g}>{g}</option>)}
                </select>
                <input type="number" placeholder="Cost" value={govShippingCost} onChange={(e) => setGovShippingCost(e.target.value)} className={`border rounded-xl p-2.5 text-xs w-28 font-bold ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`} />
                <button onClick={handleSaveShippingRate} className="px-4 py-2.5 bg-[#E86A53] hover:bg-[#d65942] text-white rounded-xl text-xs font-bold cursor-pointer">{lang === 'ar' ? 'حفظ' : 'Save'}</button>
              </div>
            </div>
          )}

          {/* 8. سياسات وتواصل متجر التاجر للزبائن */}
          {activeTab === 'my_policies' && (
            <form onSubmit={handleSaveSettings} className={`border p-6 rounded-3xl space-y-5 max-w-3xl ${isDark ? 'bg-[#091222] border-slate-800' : 'bg-white border-slate-200'}`}>
              <div>
                <h3 className="text-base font-black">{lang === 'ar' ? 'إعداد سياسات وبيانات تواصل متجرك للزبائن' : 'Store Policies for Customers'}</h3>
                <p className="text-xs text-slate-400">{lang === 'ar' ? 'تظهر في صفحة المنتج في أزرار ومودالات منبثقة تفاعلية للمشتري.' : 'Displays on product page for customer trust'}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">{lang === 'ar' ? 'البريد الإلكتروني الرسمي للمتجر' : 'Store Official Email'}</label>
                  <input
                    type="email"
                    dir="ltr"
                    placeholder="contact@mystore.com"
                    value={storeSettings.store_email || ''}
                    onChange={(e) => setStoreSettings({ ...storeSettings, store_email: e.target.value })}
                    className={`w-full border rounded-xl p-2.5 font-mono ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">{lang === 'ar' ? 'عنوان المتجر / المخزن / المحافظة' : 'Warehouse / Office Address'}</label>
                  <input
                    type="text"
                    placeholder="Cairo, Egypt"
                    value={storeSettings.store_address || ''}
                    onChange={(e) => setStoreSettings({ ...storeSettings, store_address: e.target.value })}
                    className={`w-full border rounded-xl p-2.5 ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}
                  />
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">{lang === 'ar' ? 'من نحن (عن متجرك)' : 'About Us'}</label>
                  <textarea
                    rows="3"
                    value={storeSettings.about_us}
                    onChange={(e) => setStoreSettings({ ...storeSettings, about_us: e.target.value })}
                    className={`w-full border rounded-xl p-3 ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}
                  ></textarea>
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">{lang === 'ar' ? 'سياسة الاستبدال والاسترجاع' : 'Return Policy'}</label>
                  <textarea
                    rows="3"
                    value={storeSettings.return_policy}
                    onChange={(e) => setStoreSettings({ ...storeSettings, return_policy: e.target.value })}
                    className={`w-full border rounded-xl p-3 ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}
                  ></textarea>
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">{lang === 'ar' ? 'سياسة الخصوصية وأمان بيانات الزبائن' : 'Customer Privacy Policy'}</label>
                  <textarea
                    rows="3"
                    value={storeSettings.privacy_policy}
                    onChange={(e) => setStoreSettings({ ...storeSettings, privacy_policy: e.target.value })}
                    className={`w-full border rounded-xl p-3 ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}
                  ></textarea>
                </div>
              </div>

              <button type="submit" className="px-6 py-3 bg-[#E86A53] hover:bg-[#d65942] text-white rounded-xl text-xs font-black cursor-pointer shadow-lg shadow-[#E86A53]/30">
                {lang === 'ar' ? 'حفظ السياسات وعرضها للمشترين 💾' : 'Save & Publish Policies 💾'}
              </button>
            </form>
          )}

          {/* 9. سياسات وشروط منصة سبايك الرسمية */}
          {activeTab === 'platform_terms' && (
            <div className={`border p-6 rounded-3xl space-y-5 max-w-3xl ${isDark ? 'bg-[#091222] border-slate-800' : 'bg-white border-slate-200'}`}>
              <div>
                <h3 className="text-base font-black flex items-center gap-2">
                  <span>🛡️</span>
                  <span>{lang === 'ar' ? 'مركز الشفافية وسياسات منصة سبايك' : 'SPIKE Transparency Center'}</span>
                </h3>
              </div>

              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs p-4 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div>
                  <span className="text-slate-400 block mb-0.5">{lang === 'ar' ? 'بريد الدعم الفني للمنصة:' : 'Platform Support Email:'}</span>
                  <strong className="text-cyan-400 font-mono">{platformTerms.support_email}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">{lang === 'ar' ? 'مقر الإدارة:' : 'Headquarters:'}</span>
                  <strong>{platformTerms.business_address}</strong>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div className={`p-4 rounded-2xl border space-y-1 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <h4 className="font-bold text-[#E86A53] text-sm">{lang === 'ar' ? 'من نحن:' : 'About Us:'}</h4>
                  <p className="leading-relaxed">{platformTerms.about_us || 'منظومة سبايك الرائدة في التجارة الإلكترونية ومضاعفة المبيعات والدفع عند الاستلام.'}</p>
                </div>

                <div className={`p-4 rounded-2xl border space-y-1 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <h4 className="font-bold text-amber-400 text-sm">{lang === 'ar' ? 'سياسة الخصوصية وأمان المنصة:' : 'Platform Privacy Policy:'}</h4>
                  <p className="leading-relaxed">{platformTerms.privacy_policy || 'نلتزم بالحفاظ الكامل على سرية قواعد بيانات التجار والعملاء.'}</p>
                </div>

                <div className={`p-4 rounded-2xl border space-y-1 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <h4 className="font-bold text-purple-400 text-sm">{lang === 'ar' ? 'الشروط والأحكام:' : 'Terms of Service:'}</h4>
                  <p className="leading-relaxed">{platformTerms.terms_conditions || 'تخضع جميع المعاملات لشروط الاستخدام العادل وعمولة الطلب المتفق عليها.'}</p>
                </div>
              </div>
            </div>
          )}

          {/* 10. البلاك ليست */}
          {activeTab === 'blacklist' && (
            <div className={`border p-6 rounded-3xl space-y-4 max-w-2xl ${isDark ? 'bg-[#091222] border-slate-800' : 'bg-white border-slate-200'}`}>
              <h3 className="text-lg font-black text-rose-400">{lang === 'ar' ? 'حظر الأرقام والطلبات الوهمية' : 'Spam & Fake Orders Blacklist'}</h3>
              <div className="flex gap-2">
                <input type="tel" placeholder="01xxxxxxxxx" value={blacklistPhone} onChange={(e) => setBlacklistPhone(e.target.value)} className={`border rounded-xl p-2.5 text-xs font-mono flex-1 ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`} />
                <button onClick={handleAddBlacklist} className="px-4 py-2.5 bg-red-600 text-white rounded-xl text-xs font-bold cursor-pointer">{lang === 'ar' ? 'حظر 🚫' : 'Block 🚫'}</button>
              </div>
              <div className="space-y-2">
                {blacklist.map(b => (
                  <div key={b.id} className={`p-3 rounded-xl flex justify-between text-xs ${isDark ? 'bg-slate-900' : 'bg-slate-100'}`}>
                    <span className="font-mono text-rose-400">{b.phone}</span>
                    <button onClick={async () => { await supabase.from('blacklist').delete().eq('id', b.id); initMerchant(); }} className="text-slate-500 hover:text-white">{lang === 'ar' ? 'إلغاء' : 'Remove'}</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 11. البيكسلات CAPI */}
          {activeTab === 'pixels' && (
            <form onSubmit={handleSaveSettings} className={`border p-6 rounded-3xl space-y-4 max-w-2xl ${isDark ? 'bg-[#091222] border-slate-800' : 'bg-white border-slate-200'}`}>
              <h3 className="text-lg font-black">{lang === 'ar' ? 'إعدادات البيكسل (Facebook CAPI)' : 'Facebook Pixel & CAPI Settings'}</h3>
              <input type="text" placeholder="Pixel ID" value={storeSettings.pixel_1} onChange={(e) => setStoreSettings({ ...storeSettings, pixel_1: e.target.value })} className={`w-full border rounded-xl p-2.5 text-xs font-mono ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`} />
              <input type="text" placeholder="Access Token" value={storeSettings.token_1} onChange={(e) => setStoreSettings({ ...storeSettings, token_1: e.target.value })} className={`w-full border rounded-xl p-2.5 text-xs font-mono ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`} />
              <button type="submit" className="px-6 py-2.5 bg-[#E86A53] hover:bg-[#d65942] text-white rounded-xl text-xs font-bold cursor-pointer shadow-md shadow-[#E86A53]/30">{lang === 'ar' ? 'حفظ البيكسل' : 'Save Pixel'}</button>
            </form>
          )}

          {/* 12. إعدادات المتجر وهوية التاجر */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className={`border p-6 rounded-3xl space-y-4 max-w-2xl ${isDark ? 'bg-[#091222] border-slate-800' : 'bg-white border-slate-200'}`}>
              <h3 className="text-lg font-black">{lang === 'ar' ? 'هوية المتجر واسم التاجر والشعار' : 'Store Identity & Merchant Name'}</h3>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden flex items-center justify-center">
                  {storeSettings.store_logo ? <img src={storeSettings.store_logo} className="w-full h-full object-contain" /> : '🖼️'}
                </div>
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="text-xs text-slate-400" />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">{lang === 'ar' ? 'اسم التاجر / المالك *' : 'Merchant / Owner Name *'}</label>
                <input type="text" required value={storeSettings.owner_name} onChange={(e) => setStoreSettings({ ...storeSettings, owner_name: e.target.value })} className={`w-full border rounded-xl p-2.5 text-xs font-bold ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`} />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">{lang === 'ar' ? 'اسم المتجر الرسمي *' : 'Store Name *'}</label>
                <input type="text" required value={storeSettings.store_name} onChange={(e) => setStoreSettings({ ...storeSettings, store_name: e.target.value })} className={`w-full border rounded-xl p-2.5 text-xs font-bold ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`} />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">{lang === 'ar' ? 'واتساب خدمة العملاء للزبائن' : 'Customer Support WhatsApp'}</label>
                <input type="tel" value={storeSettings.support_phone} onChange={(e) => setStoreSettings({ ...storeSettings, support_phone: e.target.value })} className={`w-full border rounded-xl p-2.5 text-xs font-mono ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`} />
              </div>

              <button type="submit" className="px-6 py-2.5 bg-[#E86A53] hover:bg-[#d65942] text-white rounded-xl text-xs font-black cursor-pointer shadow-md shadow-[#E86A53]/30">{lang === 'ar' ? 'حفظ وتحديث التاجر 💾' : 'Save Merchant Settings 💾'}</button>
            </form>
          )}

        </main>
      </div>

      {/* مودال إضافة وتعديل المنتج */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleSaveProduct} className={`border rounded-3xl p-6 sm:p-8 max-w-3xl w-full my-8 space-y-4 ${isDark ? 'bg-[#091222] border-slate-800 text-white' : 'bg-white border-slate-300 text-black'}`}>
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="text-base font-black">{lang === 'ar' ? 'بيانات المنتج ومصفوفة الألوان والمقاسات' : 'Product & Variants Matrix'}</h3>
              <button type="button" onClick={() => setShowProductModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input type="text" required placeholder={lang === 'ar' ? 'اسم المنتج' : 'Product Name'} value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} className={`border rounded-xl p-2.5 text-xs ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`} />
              <input type="number" required placeholder={lang === 'ar' ? 'سعر البيع الأساسي (ج.م)' : 'Base Price (EGP)'} value={productForm.price} onChange={(e) => {
                const p = e.target.value;
                const newMatrix = generateVariantsMatrix(productForm.sizes, productForm.colors, p, productForm.stock, productForm.variants_matrix);
                setProductForm({ ...productForm, price: p, variants_matrix: newMatrix });
              }} className={`border rounded-xl p-2.5 text-xs font-bold ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input type="number" placeholder={lang === 'ar' ? 'قبل الخصم' : 'Original Price'} value={productForm.original_price} onChange={(e) => setProductForm({ ...productForm, original_price: e.target.value })} className={`border rounded-xl p-2.5 text-xs ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`} />
              <input type="number" placeholder={lang === 'ar' ? 'سعر التكلفة' : 'Cost Price'} value={productForm.cost_price} onChange={(e) => setProductForm({ ...productForm, cost_price: e.target.value })} className={`border rounded-xl p-2.5 text-xs ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`} />
            </div>

            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border rounded-2xl ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">{lang === 'ar' ? 'الألوان (أدخل واضغط إضافة)' : 'Colors'}</label>
                <div className="flex gap-2">
                  <input type="text" placeholder="أسود، أبيض..." value={tagInputColor} onChange={(e) => setTagInputColor(e.target.value)} className="flex-1 bg-black border border-slate-800 rounded-xl p-2 text-xs text-white" />
                  <button type="button" onClick={() => handleAddColor(tagInputColor)} className="px-3 bg-slate-800 text-xs font-bold rounded-xl text-white">+</button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {productForm.colors.map((c, i) => (
                    <span key={i} className="bg-slate-800 text-white px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
                      {c} <button type="button" onClick={() => handleRemoveColor(i)}>✕</button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">{lang === 'ar' ? 'المقاسات (أدخل واضغط إضافة)' : 'Sizes'}</label>
                <div className="flex gap-2">
                  <input type="text" placeholder="S, M, L, XL..." value={tagInputSize} onChange={(e) => setTagInputSize(e.target.value)} className="flex-1 bg-black border border-slate-800 rounded-xl p-2 text-xs text-white" />
                  <button type="button" onClick={() => handleAddSize(tagInputSize)} className="px-3 bg-slate-800 text-xs font-bold rounded-xl text-white">+</button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {productForm.sizes.map((s, i) => (
                    <span key={i} className="bg-slate-800 text-white px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
                      {s} <button type="button" onClick={() => handleRemoveSize(i)}>✕</button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {productForm.variants_matrix.length > 0 && (
              <div className={`space-y-3 border p-4 rounded-2xl ${isDark ? 'bg-[#091222] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h4 className="text-xs font-black text-[#E86A53]">
                      {lang === 'ar' ? 'مصفوفة المتغيرات المركبة' : 'Variants Matrix'} ({productForm.variants_matrix.length})
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="number" placeholder="Bulk Price" value={bulkPriceInput} onChange={(e) => setBulkPriceInput(e.target.value)} className="w-24 bg-black border border-slate-700 rounded-lg p-1.5 text-xs text-[#E86A53] font-bold" />
                    <input type="number" placeholder="Bulk Stock" value={bulkStockInput} onChange={(e) => setBulkStockInput(e.target.value)} className="w-20 bg-black border border-slate-700 rounded-lg p-1.5 text-xs text-white" />
                    <button type="button" onClick={handleApplyBulkPricing} className="px-3 py-1.5 bg-[#E86A53] text-white rounded-lg text-xs font-bold shadow-md shadow-[#E86A53]/30">Apply ✓</button>
                  </div>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                  {productForm.variants_matrix.map((item, idx) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center bg-slate-900/80 p-2 rounded-xl text-xs border border-slate-800 text-white">
                      <div className="col-span-4 font-bold flex items-center gap-1">
                        <span className="text-[#E86A53]">●</span>
                        <span>{item.color}</span> / <span>{item.size}</span>
                      </div>
                      <div className="col-span-4">
                        <input type="number" value={item.price} onChange={(e) => handleMatrixItemChange(idx, 'price', e.target.value)} className="w-full bg-black border border-slate-700 rounded-lg p-1.5 text-xs text-[#E86A53] font-bold" />
                      </div>
                      <div className="col-span-4">
                        <input type="number" value={item.stock} onChange={(e) => handleMatrixItemChange(idx, 'stock', e.target.value)} className="w-full bg-black border border-slate-700 rounded-lg p-1.5 text-xs text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={`grid grid-cols-2 gap-2 p-3 rounded-xl text-xs ${isDark ? 'bg-slate-900' : 'bg-slate-100'}`}>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">{lang === 'ar' ? 'خصم عرض القطعتين (%)' : 'Tier 2 Discount (%)'}</label>
                <input type="number" value={productForm.bundle_tier_2_discount} onChange={(e) => setProductForm({ ...productForm, bundle_tier_2_discount: e.target.value })} className="w-full bg-black border border-slate-800 rounded-lg p-2 text-white font-bold" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">{lang === 'ar' ? 'خصم عرض الـ 3 قطع (%)' : 'Tier 3 Discount (%)'}</label>
                <input type="number" value={productForm.bundle_tier_3_discount} onChange={(e) => setProductForm({ ...productForm, bundle_tier_3_discount: e.target.value })} className="w-full bg-black border border-slate-800 rounded-lg p-2 text-white font-bold" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 block">{lang === 'ar' ? 'رفع صور المنتج' : 'Upload Images'}</label>
                <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="text-slate-400 text-xs" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block">{lang === 'ar' ? 'رفع فيديو المنتج' : 'Upload Video'}</label>
                <input type="file" accept="video/*" onChange={handleVideoUpload} className="text-slate-400 text-xs" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button type="button" onClick={() => setShowProductModal(false)} className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold">{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
              <button type="submit" disabled={uploadingMedia} className="px-5 py-2 bg-[#E86A53] hover:bg-[#d65942] text-white rounded-xl text-xs font-black cursor-pointer shadow-lg shadow-[#E86A53]/30">{lang === 'ar' ? 'حفظ المنتج والمصفوفة 🚀' : 'Save Product Matrix 🚀'}</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
