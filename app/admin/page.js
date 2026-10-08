'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import { useApp } from '../../context/AppContext';

export default function SuperAdminExecutiveMaster() {
  const router = useRouter();
  const { lang, theme, toggleLanguage, toggleTheme } = useApp();
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  const [merchants, setMerchants] = useState([]);
  const [merchantSearch, setMerchantSearch] = useState('');
  const [merchantFilter, setMerchantFilter] = useState('all');

  const [rechargeModalMerchant, setRechargeModalMerchant] = useState(null);
  const [chargeUsd, setChargeUsd] = useState(5.0);
  const [chargeEgp, setChargeEgp] = useState(250.0);

  const [exchangeRate, setExchangeRate] = useState(50.0);
  const [orderFeeUsd, setOrderFeeUsd] = useState(0.05);

  const [allOrders, setAllOrders] = useState([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  const [products, setProducts] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({ name: '', price: '', stock: 20, image_url: '' });

  const [domains, setDomains] = useState([]);
  const [plans, setPlans] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  const [newBroadcast, setNewBroadcast] = useState({ title: '', message: '', banner_type: 'info' });

  const [platformSettings, setPlatformSettings] = useState({
    store_name: 'NEXT ORDER',
    store_logo: '',
    support_phone: '',
    support_email: 'support@nextorder.shop',
    business_address: 'القاهرة، جمهورية مصر العربية',
    about_us: '',
    privacy_policy: '',
    terms_conditions: '',
    announcement_text: '',
    pixel_1: '', token_1: '',
    pixel_2: '', token_2: '',
  });

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    loadAllMasterData();
  }, []);

  async function loadAllMasterData() {
    setLoading(true);
    try {
      if (supabase) {
        const { data: rData } = await supabase.from('platform_exchange_rates').select('*').eq('id', 1).maybeSingle();
        if (rData) {
          setExchangeRate(Number(rData.usd_to_egp) || 50.0);
          setOrderFeeUsd(Number(rData.order_fee_usd) || 0.05);
        }

        const { data: mData } = await supabase.from('store_profiles').select('*').order('created_at', { ascending: false });
        if (mData) setMerchants(mData);

        const { data: oData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (oData) setAllOrders(oData);

        const { data: pData } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (pData) {
          const formatted = pData.map(p => {
            let img = '';
            if (Array.isArray(p.images) && p.images.length > 0) img = p.images[0];
            else if (typeof p.images === 'string') img = p.images;
            return { ...p, primary_image: img };
          });
          setProducts(formatted);
        }

        const { data: dData } = await supabase.from('custom_domain_requests').select('*').order('created_at', { ascending: false });
        if (dData) setDomains(dData);

        const { data: plData } = await supabase.from('subscription_plans').select('*').order('price_egp', { ascending: true });
        if (plData) setPlans(plData);

        const { data: iData } = await supabase.from('wallet_transactions').select('*').order('created_at', { ascending: false });
        if (iData) setInvoices(iData);

        const { data: bData } = await supabase.from('platform_broadcasts').select('*').order('created_at', { ascending: false });
        if (bData) setBroadcasts(bData);

        const { data: sData } = await supabase.from('store_settings').select('*').limit(1).maybeSingle();
        if (sData) setPlatformSettings(prev => ({ ...prev, ...sData }));
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  const handleLoginAs = (merchant) => {
    if (!merchant.user_id) return alert('لا يوجد معرف مستخدم لهذا الحساب');
    if (!confirm(`هل تريد الدخول فوراً لإدارة متجر "${merchant.store_name}" بصفة التاجر؟`)) return;

    localStorage.setItem('merchant_user_id', merchant.user_id);
    localStorage.setItem('is_super_admin', 'true');
    router.push('/dashboard');
  };

  const handleClaimAllProducts = async () => {
    let targetStore = merchants[0];
    if (!targetStore) {
      const { data: newSt } = await supabase.from('store_profiles').insert([{
        store_name: 'متجري الأصلي المعتمد',
        store_slug: 'main-store',
        owner_name: 'المدير العام',
        phone: '01000000000',
        wallet_balance_usd: 50.0,
        is_active: true,
        plan_type: 'unlimited_monthly',
      }]).select().single();
      targetStore = newSt;
    }

    const targetUid = targetStore?.user_id;
    const targetSlug = targetStore?.store_slug || 'main-store';

    if (!targetUid) {
      alert('تعذر تحديد معرف المتجر المستهدف.');
      return;
    }

    const { error } = await supabase.from('products').update({
      user_id: targetUid,
      store_slug: targetSlug,
    }).neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      alert('خطأ أثناء ربط المنتجات: ' + error.message);
      return;
    }

    localStorage.setItem('merchant_user_id', targetUid);
    localStorage.setItem('is_super_admin', 'true');

    alert(`✅ تم ربط جميع المنتجات بنجاح بالمتجر (${targetStore.store_name})! يمكنك الآن تعديلها كأدمن أو الدخول لإدارتها كتاجر.`);
    loadAllMasterData();
  };

  const handleSaveProductFromAdmin = async (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price) return alert('يرجى كتابة الاسم والسعر');

    const payload = {
      name: productForm.name,
      price: Number(productForm.price),
      stock: Number(productForm.stock) || 20,
      images: productForm.image_url ? [productForm.image_url] : [],
    };

    if (editingProduct) {
      await supabase.from('products').update(payload).eq('id', editingProduct.id);
      alert('✅ تم تعديل المنتج بنجاح!');
    } else {
      const defaultStore = merchants[0];
      await supabase.from('products').insert([{
        ...payload,
        user_id: defaultStore ? defaultStore.user_id : null,
        store_slug: defaultStore ? defaultStore.store_slug : 'main-store',
      }]);
      alert('✅ تم إضافة المنتج بنجاح!');
    }

    setShowProductModal(false);
    setEditingProduct(null);
    loadAllMasterData();
  };

  const handleConfirmRecharge = async () => {
    if (!rechargeModalMerchant) return;
    const currentBal = Number(rechargeModalMerchant.wallet_balance_usd || 0);
    const newBal = currentBal + Number(chargeUsd);

    await supabase.from('store_profiles').update({
      wallet_balance_usd: newBal,
      is_active: true,
      subscription_status: 'active',
      amount_paid: (Number(rechargeModalMerchant.amount_paid) || 0) + Number(chargeEgp),
    }).eq('id', rechargeModalMerchant.id);

    await supabase.from('wallet_transactions').insert([{
      user_id: rechargeModalMerchant.user_id,
      store_name: rechargeModalMerchant.store_name,
      type: 'deposit',
      amount_usd: Number(chargeUsd),
      amount_egp: Number(chargeEgp),
      usd_rate: Number(exchangeRate),
      description: `شحن محفظة التاجر (${chargeUsd}$ = ${chargeEgp} ج.م)`,
    }]);

    alert(`✅ تم شحن ${chargeUsd}$ وتفعيل متجر (${rechargeModalMerchant.store_name}) بنجاح!`);
    setRechargeModalMerchant(null);
    loadAllMasterData();
  };

  const handleToggleMerchantStatus = async (merchant, targetStatus) => {
    if (!confirm(`هل أنت متأكد من تغيير حالة متجر "${merchant.store_name}" إلى [${targetStatus}]؟`)) return;
    await supabase.from('store_profiles').update({
      is_active: targetStatus === 'active',
      subscription_status: targetStatus,
    }).eq('id', merchant.id);
    loadAllMasterData();
  };

  const handleDeleteMerchantFully = async (merchant) => {
    const confirmName = prompt(`⚠️ تحذير شديد: اكتب اسم المتجر للتأكيد وحذفه نهائياً: "${merchant.store_name}"`);
    if (confirmName !== merchant.store_name) return;

    if (merchant.user_id) {
      await supabase.from('products').delete().eq('user_id', merchant.user_id);
      await supabase.from('orders').delete().eq('user_id', merchant.user_id);
      await supabase.from('merchant_settings').delete().eq('user_id', merchant.user_id);
      await supabase.from('shipping_rates').delete().eq('user_id', merchant.user_id);
      await supabase.from('blacklist').delete().eq('user_id', merchant.user_id);
      await supabase.from('custom_domain_requests').delete().eq('user_id', merchant.user_id);
      await supabase.from('wallet_transactions').delete().eq('user_id', merchant.user_id);
    }
    await supabase.from('store_profiles').delete().eq('id', merchant.id);
    alert('🗑️ تم حذف الحساب وبياناته نهائياً.');
    loadAllMasterData();
  };

  const handleUpdateExchangeRate = async () => {
    await supabase.from('platform_exchange_rates').update({
      usd_to_egp: Number(exchangeRate),
      order_fee_usd: Number(orderFeeUsd),
      updated_at: new Date().toISOString(),
    }).eq('id', 1);
    alert('✅ تم تحديث سعر الدولار والعمولة اللحظية بنجاح!');
    loadAllMasterData();
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPlatformSettings(prev => ({ ...prev, store_logo: reader.result }));
      setUploadingLogo(false);
      alert('✅ تم اختيار اللوجو بنجاح!');
    };
    reader.readAsDataURL(file);
  };

  const handleSavePlatformSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    await supabase.from('store_settings').upsert({ id: 1, ...platformSettings });
    alert('✅ تم حفظ هوية وسياسات المنصة بنجاح!');
    setSavingSettings(false);
  };

  const exportOrdersToCSV = () => {
    if (allOrders.length === 0) return alert('لا توجد طلبات للتصدير!');
    const headers = ['رقم الطلب', 'العميل', 'الهاتف', 'المحافظة', 'العنوان', 'المنتج', 'المبلغ', 'الحالة', 'التاريخ'];
    const rows = allOrders.map((o, idx) => [
      idx + 1, `"${o.customer_name || ''}"`, `"${o.phone || ''}"`, `"${o.governorate || ''}"`,
      `"${o.address || ''}"`, `"${o.product_name || ''}"`, o.total_amount || 0, `"${o.status || 'جديد'}"`,
      new Date(o.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US'),
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `NextOrder_Shipments_${Date.now()}.csv`;
    link.click();
  };

  const totalStoreSales = allOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
  const activeClients = merchants.filter(m => (Number(m.wallet_balance_usd) >= 0.05) && m.is_active && m.subscription_status === 'active');
  const pendingClients = merchants.filter(m => (Number(m.wallet_balance_usd) < 0.05) || !m.is_active || m.subscription_status === 'pending');

  const filteredMerchants = merchants.filter(m => {
    const matchesSearch = (m.store_name || '').toLowerCase().includes(merchantSearch.toLowerCase()) ||
                          (m.owner_name || '').toLowerCase().includes(merchantSearch.toLowerCase()) ||
                          (m.phone || '').includes(merchantSearch);
    if (merchantFilter === 'active') return matchesSearch && (Number(m.wallet_balance_usd) >= 0.05 && m.is_active);
    if (merchantFilter === 'pending') return matchesSearch && (Number(m.wallet_balance_usd) < 0.05 || !m.is_active);
    if (merchantFilter === 'suspended') return matchesSearch && m.subscription_status === 'suspended';
    return matchesSearch;
  });

  const filteredOrders = allOrders.filter(o => {
    const mSearch = (o.customer_name || '').toLowerCase().includes(orderSearch.toLowerCase()) || (o.phone || '').includes(orderSearch);
    const mStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
    return mSearch && mStatus;
  });

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center font-sans ${isDark ? 'bg-[#070b14] text-white' : 'bg-slate-100 text-black'}`}>
        <div className="animate-pulse text-lg font-black flex items-center gap-3">
          <span>👑</span>
          <span>{lang === 'ar' ? 'جاري فتح لوحة السوبر أدمن الشاملة...' : 'Loading Super Admin Control Panel...'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans flex flex-col md:flex-row select-none transition-colors ${
      isDark ? 'bg-[#070b14] text-white' : 'bg-slate-100 text-slate-900'
    }`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* 🧭 الشريط الجانبي */}
      <aside className={`w-full md:w-64 border-b md:border-b-0 p-5 flex flex-col justify-between shrink-0 transition-colors ${
        lang === 'ar' ? 'md:border-l' : 'md:border-r'
      } ${isDark ? 'bg-[#0d1322] border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xl font-black bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent block">
                NEXT ORDER
              </span>
              <span className="text-[9px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-black block w-fit mt-1">
                SUPER ADMIN
              </span>
            </div>
            
            {/* أزرار التبديل السريعة في السايد بار */}
            <div className="flex gap-1.5">
              <button onClick={toggleLanguage} className="px-2 py-1 bg-slate-800 text-white rounded-lg text-[10px] font-bold border border-slate-700">
                🌐 {lang === 'ar' ? 'EN' : 'AR'}
              </button>
              <button onClick={toggleTheme} className="px-2 py-1 bg-slate-800 text-white rounded-lg text-[10px] font-bold border border-slate-700">
                {isDark ? '☀️' : '🌙'}
              </button>
            </div>
          </div>

          <nav className="space-y-1 text-xs font-bold">
            {[
              { id: 'overview', label: lang === 'ar' ? 'الرئيسية والمؤشرات' : 'Dashboard Overview', icon: '📊' },
              { id: 'merchants', label: `${lang === 'ar' ? 'المتاجر والتجار' : 'Merchants & Stores'} (${merchants.length})`, icon: '🏪', badge: pendingClients.length },
              { id: 'orders', label: `${lang === 'ar' ? 'كافة الطلبات' : 'All Orders'} (${allOrders.length})`, icon: '📦' },
              { id: 'products', label: `${lang === 'ar' ? 'المنتجات والمخزون' : 'Products & Stock'} (${products.length})`, icon: '🛍️' },
              { id: 'platform_policies', label: lang === 'ar' ? 'سياسات المنصة وتواصلنا' : 'Platform Policies', icon: '📜' },
              { id: 'rates', label: lang === 'ar' ? 'سعر الصرف والعمولة' : 'Rates & Order Fee', icon: '💱' },
              { id: 'domains', label: `${lang === 'ar' ? 'الدومينات المخصصة' : 'Custom Domains'} (${domains.length})`, icon: '🌐' },
              { id: 'plans', label: lang === 'ar' ? 'باقات الاشتراك' : 'Subscription Plans', icon: '💎' },
              { id: 'invoices', label: lang === 'ar' ? 'سجل الحركات المالية' : 'Wallet Transactions', icon: '🧾' },
              { id: 'broadcasts', label: lang === 'ar' ? 'الإعلانات الجماعية' : 'Broadcasts', icon: '📢' },
              { id: 'branding', label: lang === 'ar' ? 'هوية المنصة واللوجو' : 'Branding & Logo', icon: '⚙️' },
            ].map((nav) => (
              <button
                key={nav.id}
                onClick={() => setActiveTab(nav.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition cursor-pointer ${
                  activeTab === nav.id
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg'
                    : isDark ? 'text-slate-400 hover:bg-slate-800/60 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-black'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span>{nav.icon}</span>
                  <span>{nav.label}</span>
                </div>
                {nav.badge > 0 && (
                  <span className="bg-amber-500 text-black text-[10px] font-black px-1.5 py-0.2 rounded-full">
                    {nav.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="space-y-2 pt-4 border-t border-slate-800">
          <button
            onClick={handleClaimAllProducts}
            className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-black text-xs font-black rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>⚡</span>
            <span>{lang === 'ar' ? 'ربط واسترداد المنتجات القديمة' : 'Claim Legacy Products'}</span>
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/register`);
              alert(lang === 'ar' ? '📋 تم نسخ رابط تسجيل التجار!' : '📋 Registration link copied!');
            }}
            className={`w-full py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
            }`}
          >
            🔗 {lang === 'ar' ? 'نسخ رابط تسجيل التجار' : 'Copy Merchant Register Link'}
          </button>
        </div>
      </aside>

      {/* 🖥️ المحتوى */}
      <main className="flex-1 p-4 sm:p-8 space-y-6 overflow-y-auto">

        {/* 1. الرئيسية والمؤشرات */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h2 className="text-xl font-black">{lang === 'ar' ? 'نظرة عامة على أداء منصة NEXT ORDER' : 'Platform Executive Overview'}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className={`p-5 rounded-3xl border ${isDark ? 'bg-[#0d1322] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <span className="text-xs text-slate-400 block mb-1">🏪 {lang === 'ar' ? 'إجمالي المتاجر' : 'Total Stores'}</span>
                <span className="text-2xl font-black">{merchants.length}</span>
              </div>
              <div className={`p-5 rounded-3xl border ${isDark ? 'bg-[#0d1322] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <span className="text-xs text-slate-400 block mb-1">🟢 {lang === 'ar' ? 'العملاء المفعلين' : 'Active Stores'}</span>
                <span className="text-2xl font-black text-emerald-400">{activeClients.length}</span>
              </div>
              <div className={`p-5 rounded-3xl border ${isDark ? 'bg-[#0d1322] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <span className="text-xs text-slate-400 block mb-1">⏳ {lang === 'ar' ? 'بانتظار الشحن' : 'Pending Wallet Recharge'}</span>
                <span className="text-2xl font-black text-amber-400">{pendingClients.length}</span>
              </div>
              <div className={`p-5 rounded-3xl border ${isDark ? 'bg-[#0d1322] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <span className="text-xs text-slate-400 block mb-1">💰 {lang === 'ar' ? 'إجمالي مبيعات المتاجر' : 'Gross Sales'}</span>
                <span className="text-2xl font-black text-emerald-400">{totalStoreSales.toLocaleString()} {lang === 'ar' ? 'ج.م' : 'EGP'}</span>
              </div>
            </div>
          </div>
        )}

        {/* 2. إدارة المتاجر */}
        {activeTab === 'merchants' && (
          <div className="space-y-4">
            <div className={`p-5 rounded-3xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-3 ${
              isDark ? 'bg-[#0d1322] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div>
                <h2 className="text-lg font-black">{lang === 'ar' ? 'إدارة المتاجر والمشتركين' : 'Stores & Merchants'} ({filteredMerchants.length})</h2>
                <p className="text-xs text-slate-400">{lang === 'ar' ? 'شحن المحافظ، الدخول بحساب التاجر، وتفعيل أو إيقاف أو حذف المتاجر' : 'Manage wallets, login as merchant, and toggle active status'}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder={lang === 'ar' ? 'بحث باسم المتجر أو المالك...' : 'Search store or owner...'}
                  value={merchantSearch}
                  onChange={(e) => setMerchantSearch(e.target.value)}
                  className={`text-xs p-2.5 rounded-xl w-56 border ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-black'}`}
                />
                <select
                  value={merchantFilter}
                  onChange={(e) => setMerchantFilter(e.target.value)}
                  className={`text-xs p-2.5 rounded-xl font-bold border ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-black'}`}
                >
                  <option value="all">{lang === 'ar' ? 'كل المتاجر' : 'All Stores'} ({merchants.length})</option>
                  <option value="active">{lang === 'ar' ? 'المفعلين' : 'Active'} ({activeClients.length})</option>
                  <option value="pending">{lang === 'ar' ? 'بانتظار الشحن' : 'Pending'} ({pendingClients.length})</option>
                  <option value="suspended">{lang === 'ar' ? 'الموقوفين' : 'Suspended'}</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              {filteredMerchants.map((m) => {
                const bal = Number(m.wallet_balance_usd || 0);
                const ordersCap = Math.floor(bal / orderFeeUsd);
                const isActive = bal >= 0.05 && m.is_active && m.subscription_status === 'active';

                return (
                  <div key={m.id} className={`border p-5 rounded-3xl space-y-3 transition ${
                    isDark ? 'bg-[#0d1322] border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 shadow-sm'
                  }`}>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-base">{m.store_name}</strong>
                        <a href={`/store/${m.store_slug}`} target="_blank" className="text-xs text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-lg font-mono hover:underline">
                          /{m.store_slug} ↗
                        </a>
                        <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                          isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {isActive ? (lang === 'ar' ? '🟢 نشط ومفعل' : '🟢 Active') : m.subscription_status === 'suspended' ? (lang === 'ar' ? '⏸️ موقوف مؤقتاً' : '⏸️ Suspended') : (lang === 'ar' ? '🟡 بانتظار الشحن (5$)' : '🟡 Awaiting Deposit')}
                        </span>
                      </div>

                      <div className="text-xs text-slate-400">
                        {lang === 'ar' ? 'المالك:' : 'Owner:'} <strong className={isDark ? 'text-white' : 'text-black'}>{m.owner_name}</strong> (<a href={`https://wa.me/${m.phone}`} target="_blank" className="text-emerald-400 underline font-mono" dir="ltr">{m.phone}</a>)
                      </div>
                    </div>

                    <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs p-3 rounded-2xl ${isDark ? 'bg-slate-900/60 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
                      <div>{lang === 'ar' ? 'رصيد المحفظة:' : 'Wallet:'} <strong className="text-emerald-400 font-mono font-bold">{bal.toFixed(2)}$</strong> ({Math.round(bal * exchangeRate)} {lang === 'ar' ? 'ج.م' : 'EGP'})</div>
                      <div>{lang === 'ar' ? 'يكفي حتى:' : 'Capacity:'} <strong className="text-cyan-400 font-mono font-bold">{ordersCap} {lang === 'ar' ? 'أوردر' : 'Orders'}</strong></div>
                      <div>{lang === 'ar' ? 'أوردرات مخصومة:' : 'Billed Orders:'} <strong className="text-amber-400 font-mono">{m.total_orders_billed || 0}</strong></div>
                      <div>{lang === 'ar' ? 'إجمالي ما شحنه:' : 'Total Deposited:'} <strong className="font-mono">{m.amount_paid || 0} {lang === 'ar' ? 'ج.م' : 'EGP'}</strong></div>
                    </div>

                    <div className="flex flex-wrap justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleLoginAs(m)}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>🔑</span>
                        <span>{lang === 'ar' ? 'دخول كتاجر' : 'Login as Merchant'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setRechargeModalMerchant(m);
                          setChargeUsd(5.0);
                          setChargeEgp(Math.round(5.0 * exchangeRate));
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow transition cursor-pointer flex items-center gap-1.5"
                      >
                        <span>💳</span>
                        <span>{lang === 'ar' ? 'شحن المحفظة' : 'Recharge Wallet'}</span>
                      </button>

                      <button
                        onClick={() => handleToggleMerchantStatus(m, m.subscription_status === 'suspended' ? 'active' : 'suspended')}
                        className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        {m.subscription_status === 'suspended' ? (lang === 'ar' ? 'تشغيل' : 'Activate') : (lang === 'ar' ? 'إيقاف مؤقت' : 'Suspend')}
                      </button>

                      <button
                        onClick={() => handleDeleteMerchantFully(m)}
                        className="px-3 py-2 bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        🗑️ {lang === 'ar' ? 'حذف' : 'Delete'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. طلبات المنصة */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className={`p-5 rounded-3xl border flex justify-between items-center ${isDark ? 'bg-[#0d1322] border-slate-800' : 'bg-white border-slate-200'}`}>
              <h2 className="text-lg font-black">{lang === 'ar' ? 'إدارة طلبات المنصة' : 'Orders Management'} ({filteredOrders.length})</h2>
              <button onClick={exportOrdersToCSV} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer">
                📊 {lang === 'ar' ? 'تصدير إكسيل للشحن' : 'Export Orders CSV'}
              </button>
            </div>
            <div className="space-y-2">
              {filteredOrders.map(o => (
                <div key={o.id} className={`p-4 border rounded-2xl flex justify-between items-center text-xs ${isDark ? 'bg-[#0d1322] border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div>
                    <strong className="block">{o.customer_name} ({o.phone})</strong>
                    <span className="text-slate-400">{o.product_name} | {o.governorate}</span>
                  </div>
                  <strong className="text-emerald-400 font-mono text-sm">{o.total_amount} {lang === 'ar' ? 'ج.م' : 'EGP'}</strong>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. المنتجات */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className={`p-5 rounded-3xl border flex justify-between items-center ${isDark ? 'bg-[#0d1322] border-slate-800' : 'bg-white border-slate-200'}`}>
              <div>
                <h2 className="text-lg font-black">{lang === 'ar' ? 'المنتجات في المنظومة' : 'All Products in System'} ({products.length})</h2>
                <p className="text-xs text-slate-400">{lang === 'ar' ? 'إدارة، تسعير، وتعديل الصور والمخزون لكافة المنتجات' : 'Direct edit for pricing, stock, and images'}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleClaimAllProducts}
                  className="px-3.5 py-2 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-black cursor-pointer"
                >
                  ⚡ {lang === 'ar' ? 'ربط المنتجات القديمة' : 'Claim Legacy Products'}
                </button>
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setProductForm({ name: '', price: '', stock: 20, image_url: '' });
                    setShowProductModal(true);
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  ➕ {lang === 'ar' ? 'إضافة منتج جديد' : 'Add Product'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {products.map(p => (
                <div key={p.id} className={`p-4 border rounded-2xl space-y-3 ${isDark ? 'bg-[#0d1322] border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="w-full h-40 bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800">
                    {p.primary_image ? (
                      <img src={p.primary_image} alt={p.name} className="w-full h-full object-contain p-2" />
                    ) : (
                      <span className="text-3xl">📦</span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm truncate">{p.name}</h4>
                    <div className="flex justify-between items-center text-xs mt-1">
                      <span className="text-emerald-400 font-bold font-mono text-base">{p.price} {lang === 'ar' ? 'ج.م' : 'EGP'}</span>
                      <span className="text-slate-400 bg-slate-800/40 px-2 py-0.5 rounded-lg">{lang === 'ar' ? 'المخزون:' : 'Stock:'} {p.stock || 0}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-slate-800 text-xs">
                    <button
                      onClick={() => {
                        setEditingProduct(p);
                        setProductForm({
                          name: p.name,
                          price: p.price,
                          stock: p.stock || 20,
                          image_url: p.primary_image || '',
                        });
                        setShowProductModal(true);
                      }}
                      className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold cursor-pointer"
                    >
                      {lang === 'ar' ? 'تعديل ✏️' : 'Edit ✏️'}
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm(lang === 'ar' ? `حذف المنتج: ${p.name}؟` : `Delete product: ${p.name}?`)) return;
                        await supabase.from('products').delete().eq('id', p.id);
                        loadAllMasterData();
                      }}
                      className="px-3 py-1.5 bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white rounded-lg font-bold cursor-pointer"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. سياسات المنصة الرسمية */}
        {activeTab === 'platform_policies' && (
          <form onSubmit={handleSavePlatformSettings} className={`border p-6 rounded-3xl space-y-4 max-w-3xl ${isDark ? 'bg-[#0d1322] border-slate-800' : 'bg-white border-slate-200'}`}>
            <h3 className="text-base font-black">{lang === 'ar' ? 'مركز سياسات منصة NEXT ORDER الرسمية' : 'Official Platform Policies'}</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <input type="email" placeholder="Official Support Email" value={platformSettings.support_email} onChange={(e) => setPlatformSettings({ ...platformSettings, support_email: e.target.value })} className={`border p-2.5 rounded-xl font-mono ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`} />
              <input type="text" placeholder="Office Address" value={platformSettings.business_address} onChange={(e) => setPlatformSettings({ ...platformSettings, business_address: e.target.value })} className={`border p-2.5 rounded-xl ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`} />
            </div>
            <textarea rows="3" placeholder={lang === 'ar' ? 'من نحن' : 'About Us'} value={platformSettings.about_us} onChange={(e) => setPlatformSettings({ ...platformSettings, about_us: e.target.value })} className={`w-full border p-3 rounded-xl text-xs ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}></textarea>
            <textarea rows="3" placeholder={lang === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'} value={platformSettings.privacy_policy} onChange={(e) => setPlatformSettings({ ...platformSettings, privacy_policy: e.target.value })} className={`w-full border p-3 rounded-xl text-xs ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}></textarea>
            <textarea rows="3" placeholder={lang === 'ar' ? 'الشروط والأحكام' : 'Terms & Conditions'} value={platformSettings.terms_conditions} onChange={(e) => setPlatformSettings({ ...platformSettings, terms_conditions: e.target.value })} className={`w-full border p-3 rounded-xl text-xs ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}></textarea>
            <button type="submit" className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold">{lang === 'ar' ? 'حفظ السياسات 💾' : 'Save Policies 💾'}</button>
          </form>
        )}

        {/* 6. سعر الصرف والعمولة */}
        {activeTab === 'rates' && (
          <div className={`border p-6 rounded-3xl max-w-xl space-y-4 ${isDark ? 'bg-[#0d1322] border-slate-800' : 'bg-white border-slate-200'}`}>
            <h3 className="text-base font-black">{lang === 'ar' ? 'سعر الصرف وعمولة الطلب اللحظية' : 'Exchange Rate & Instant Order Fee'}</h3>
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">{lang === 'ar' ? 'سعر الدولار بالجنيه (USD/EGP)' : 'USD to EGP Rate'}</label>
              <input type="number" value={exchangeRate} onChange={(e) => setExchangeRate(Number(e.target.value))} className={`w-full border rounded-xl p-3 text-sm font-bold text-emerald-400 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-300'}`} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">{lang === 'ar' ? 'عمولة الطلب بالدولار ($)' : 'Order Fee in USD ($)'}</label>
              <input type="number" step="0.01" value={orderFeeUsd} onChange={(e) => setOrderFeeUsd(Number(e.target.value))} className={`w-full border rounded-xl p-3 text-sm font-bold text-amber-400 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-300'}`} />
            </div>
            <button onClick={handleUpdateExchangeRate} className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer">{lang === 'ar' ? 'حفظ التحديث 💾' : 'Save Update 💾'}</button>
          </div>
        )}

        {/* 7. الدومينات المخصصة */}
        {activeTab === 'domains' && (
          <div className="space-y-4 max-w-3xl">
            <h3 className="text-base font-black">{lang === 'ar' ? 'الدومينات المخصصة' : 'Custom Domains'} ({domains.length})</h3>
            {domains.map(d => (
              <div key={d.id} className={`p-4 border rounded-2xl flex justify-between text-xs ${isDark ? 'bg-[#0d1322] border-slate-800' : 'bg-white border-slate-200'}`}>
                <span className="font-mono text-cyan-400">{d.domain}</span>
                <span className="text-emerald-400">{d.status}</span>
              </div>
            ))}
          </div>
        )}

        {/* 8. باقات الاشتراك */}
        {activeTab === 'plans' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl">
            {plans.map(p => (
              <div key={p.id} className={`p-5 border rounded-3xl space-y-1 ${isDark ? 'bg-[#0d1322] border-slate-800' : 'bg-white border-slate-200'}`}>
                <h4 className="font-bold text-sm">{p.name}</h4>
                <div className="text-emerald-400 font-bold font-mono">{p.price_egp} {lang === 'ar' ? 'ج.م / شهر' : 'EGP / month'}</div>
              </div>
            ))}
          </div>
        )}

        {/* 9. سجل الحركات */}
        {activeTab === 'invoices' && (
          <div className="space-y-2">
            <h3 className="text-base font-black mb-3">{lang === 'ar' ? 'سجل العمليات المالية والخصومات' : 'Transactions & Invoices'}</h3>
            {invoices.map(t => (
              <div key={t.id} className={`p-3 border rounded-xl flex justify-between text-xs ${isDark ? 'bg-[#0d1322] border-slate-800' : 'bg-white border-slate-200'}`}>
                <div>
                  <strong className="block">{t.store_name}</strong>
                  <span className="text-slate-400">{t.description}</span>
                </div>
                <span className={`font-mono font-bold ${t.type === 'deposit' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {t.type === 'deposit' ? `+${t.amount_usd}$` : `-${t.amount_usd}$`}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* 10. الإعلانات الجماعية */}
        {activeTab === 'broadcasts' && (
          <form onSubmit={async (e) => {
            e.preventDefault();
            await supabase.from('platform_broadcasts').insert([newBroadcast]);
            setNewBroadcast({ title: '', message: '', banner_type: 'info' });
            alert(lang === 'ar' ? '📢 تم نشر الإعلان العام لجميع التجار!' : '📢 Broadcast Published!');
            loadAllMasterData();
          }} className={`border p-6 rounded-3xl space-y-3 max-w-2xl ${isDark ? 'bg-[#0d1322] border-slate-800' : 'bg-white border-slate-200'}`}>
            <h3 className="text-base font-black">{lang === 'ar' ? 'إرسال إعلان للوحة التجار' : 'Send Platform Broadcast'}</h3>
            <input type="text" required placeholder={lang === 'ar' ? 'عنوان التنبيه' : 'Broadcast Title'} value={newBroadcast.title} onChange={(e) => setNewBroadcast({ ...newBroadcast, title: e.target.value })} className={`w-full border rounded-xl p-2.5 text-xs ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`} />
            <textarea rows="3" required placeholder={lang === 'ar' ? 'نص التنبيه...' : 'Message body...'} value={newBroadcast.message} onChange={(e) => setNewBroadcast({ ...newBroadcast, message: e.target.value })} className={`w-full border rounded-xl p-2.5 text-xs ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}></textarea>
            <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer">{lang === 'ar' ? 'نشر الإعلان 📢' : 'Publish Broadcast 📢'}</button>
          </form>
        )}

        {/* 11. هوية المنصة واللوجو */}
        {activeTab === 'branding' && (
          <form onSubmit={handleSavePlatformSettings} className={`border p-6 rounded-3xl space-y-4 max-w-2xl ${isDark ? 'bg-[#0d1322] border-slate-800' : 'bg-white border-slate-200'}`}>
            <h3 className="text-base font-black border-b border-slate-800 pb-2">{lang === 'ar' ? 'هوية المنصة واللوجو الرسمي' : 'Platform Logo & Identity'}</h3>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-slate-900 border border-slate-700 rounded-2xl flex items-center justify-center overflow-hidden">
                {platformSettings.store_logo ? <img src={platformSettings.store_logo} className="w-full h-full object-contain" /> : '🖼️'}
              </div>
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="text-xs text-slate-400" />
            </div>
            <input type="text" placeholder="Platform Name" value={platformSettings.store_name} onChange={(e) => setPlatformSettings({ ...platformSettings, store_name: e.target.value })} className={`w-full border rounded-xl p-2.5 text-xs font-bold ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`} />
            <input type="tel" placeholder="WhatsApp Support Phone" value={platformSettings.support_phone} onChange={(e) => setPlatformSettings({ ...platformSettings, support_phone: e.target.value })} className={`w-full border rounded-xl p-2.5 text-xs font-mono ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`} />
            <button type="submit" disabled={savingSettings || uploadingLogo} className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold">{lang === 'ar' ? 'حفظ الهوية 💾' : 'Save Identity 💾'}</button>
          </form>
        )}

      </main>

      {/* مودال شحن المحفظة */}
      {rechargeModalMerchant && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className={`border rounded-3xl p-6 max-w-md w-full space-y-4 ${isDark ? 'bg-[#0d1322] border-slate-800' : 'bg-white border-slate-300'}`}>
            <h3 className="text-base font-black border-b border-slate-800 pb-2">{lang === 'ar' ? 'شحن محفظة:' : 'Recharge Wallet:'} {rechargeModalMerchant.store_name}</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <input type="number" min="5" value={chargeUsd} onChange={(e) => { setChargeUsd(Number(e.target.value)); setChargeEgp(Math.round(Number(e.target.value) * exchangeRate)); }} className={`border p-2.5 rounded-xl font-bold text-emerald-400 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-300'}`} />
              <input type="number" value={chargeEgp} onChange={(e) => { setChargeEgp(Number(e.target.value)); setChargeUsd(Number((Number(e.target.value) / exchangeRate).toFixed(2))); }} className={`border p-2.5 rounded-xl font-bold ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-black'}`} />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button onClick={() => setRechargeModalMerchant(null)} className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold">{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
              <button onClick={handleConfirmRecharge} className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black cursor-pointer">{lang === 'ar' ? 'تأكيد الشحن والتفعيل 🚀' : 'Confirm Recharge 🚀'}</button>
            </div>
          </div>
        </div>
      )}

      {/* مودال إضافة وتعديل المنتج من السوبر أدمن */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveProductFromAdmin} className={`border rounded-3xl p-6 max-w-md w-full space-y-4 ${isDark ? 'bg-[#0d1322] border-slate-800 text-white' : 'bg-white border-slate-300 text-black'}`}>
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="text-base font-black">
                {editingProduct ? (lang === 'ar' ? `تعديل: ${editingProduct.name}` : `Edit: ${editingProduct.name}`) : (lang === 'ar' ? 'إضافة منتج عام' : 'Add General Product')}
              </h3>
              <button type="button" onClick={() => setShowProductModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">{lang === 'ar' ? 'اسم المنتج' : 'Product Name'}</label>
              <input
                type="text"
                required
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                className={`w-full border rounded-xl p-2.5 text-xs ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-black'}`}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">{lang === 'ar' ? 'سعر البيع (ج.م)' : 'Price (EGP)'}</label>
                <input
                  type="number"
                  required
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  className={`w-full border rounded-xl p-2.5 text-xs text-emerald-400 font-bold ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-300'}`}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">{lang === 'ar' ? 'المخزون المتوفر' : 'Stock Quantity'}</label>
                <input
                  type="number"
                  value={productForm.stock}
                  onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                  className={`w-full border rounded-xl p-2.5 text-xs ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-black'}`}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">{lang === 'ar' ? 'رابط صورة المنتج (URL)' : 'Product Image URL'}</label>
              <input
                type="url"
                placeholder="https://..."
                value={productForm.image_url}
                onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                className={`w-full border rounded-xl p-2.5 text-xs font-mono ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-black'}`}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button type="button" onClick={() => setShowProductModal(false)} className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold">{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
              <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black">{lang === 'ar' ? 'حفظ التعديلات ✓' : 'Save Changes ✓'}</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
