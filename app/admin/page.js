'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function SuperAdminExecutiveMaster() {
  const router = useRouter();

  // التبويب النشط في الشريط الجانبي
  // 'overview' | 'merchants' | 'orders' | 'products' | 'plans' | 'domains' | 'rates' | 'invoices' | 'broadcasts' | 'branding' | 'pixels'
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // 1. بيانات المتاجر والمشتركين
  const [merchants, setMerchants] = useState([]);
  const [merchantSearch, setMerchantSearch] = useState('');
  const [merchantFilter, setMerchantFilter] = useState('all');

  // نافذة شحن المحفظة والتفعيل
  const [rechargeModalMerchant, setRechargeModalMerchant] = useState(null);
  const [chargeUsd, setChargeUsd] = useState(5.0);
  const [chargeEgp, setChargeEgp] = useState(250.0);

  // 2. سعر الصرف والعمولة
  const [exchangeRate, setExchangeRate] = useState(50.0);
  const [orderFeeUsd, setOrderFeeUsd] = useState(0.05);

  // 3. الطلبات والمنتجات
  const [allOrders, setAllOrders] = useState([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  const [products, setProducts] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [productForm, setProductForm] = useState({ name: '', price: '', stock: 20 });

  // 4. الدومينات، الباقات، الفواتير، التحليلات، والإعلانات
  const [domains, setDomains] = useState([]);
  const [plans, setPlans] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [newBroadcast, setNewBroadcast] = useState({ title: '', message: '', banner_type: 'info' });

  // 5. هوية المنصة والبيكسل
  const [platformSettings, setPlatformSettings] = useState({
    store_name: 'NEXT ORDER',
    store_logo: '',
    store_description: '',
    support_phone: '',
    announcement_text: '',
    pixel_1: '', token_1: '',
    pixel_2: '', token_2: '',
    pixel_3: '', token_3: '',
    pixel_4: '', token_4: '',
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
        // 1. سعر الصرف والعمولة
        const { data: rData } = await supabase.from('platform_exchange_rates').select('*').eq('id', 1).maybeSingle();
        if (rData) {
          setExchangeRate(Number(rData.usd_to_egp) || 50.0);
          setOrderFeeUsd(Number(rData.order_fee_usd) || 0.05);
        }

        // 2. المتاجر والمشتركين
        const { data: mData } = await supabase.from('store_profiles').select('*').order('created_at', { ascending: false });
        if (mData) setMerchants(mData);

        // 3. الطلبات
        const { data: oData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (oData) setAllOrders(oData);

        // 4. المنتجات
        const { data: pData } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (pData) setProducts(pData);

        // 5. الدومينات المخصصة
        const { data: dData } = await supabase.from('custom_domain_requests').select('*').order('created_at', { ascending: false });
        if (dData) setDomains(dData);

        // 6. الباقات
        const { data: plData } = await supabase.from('subscription_plans').select('*').order('price_egp', { ascending: true });
        if (plData) setPlans(plData);

        // 7. الفواتير
        const { data: iData } = await supabase.from('wallet_transactions').select('*').order('created_at', { ascending: false });
        if (iData) setInvoices(iData);

        // 8. الإعلانات والتحليلات
        const { data: bData } = await supabase.from('platform_broadcasts').select('*').order('created_at', { ascending: false });
        if (bData) setBroadcasts(bData);

        const { data: aData } = await supabase.from('store_analytics').select('*');
        if (aData) setAnalytics(aData);

        // 9. هوية المنصة
        const { data: sData } = await supabase.from('store_settings').select('*').limit(1).maybeSingle();
        if (sData) setPlatformSettings(prev => ({ ...prev, ...sData }));
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  // 👑 ميزة السوبر أدمن: الدخول كتاجر بنقرة واحدة
  const handleLoginAs = (merchant) => {
    if (!merchant.user_id) return alert('لا يوجد معرف مستخدم لهذا الحساب');
    if (!confirm(`هل تريد الدخول فوراً لإدارة متجر "${merchant.store_name}" بصفة التاجر؟`)) return;
    localStorage.setItem('merchant_user_id', merchant.user_id);
    router.push('/dashboard');
  };

  // شحن محفظة التاجر وتفعيل متجره
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

  // تغيير حالة التاجر (إيقاف مؤقت / تعطيل)
  const handleToggleMerchantStatus = async (merchant, targetStatus) => {
    if (!confirm(`هل أنت متأكد من تغيير حالة متجر "${merchant.store_name}" إلى [${targetStatus}]؟`)) return;
    await supabase.from('store_profiles').update({
      is_active: targetStatus === 'active',
      subscription_status: targetStatus,
    }).eq('id', merchant.id);
    loadAllMasterData();
  };

  // حذف تاجر نهائياً مع كافة متعلقاته
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

  // تحديث سعر الصرف والعمولة
  const handleUpdateExchangeRate = async () => {
    await supabase.from('platform_exchange_rates').update({
      usd_to_egp: Number(exchangeRate),
      order_fee_usd: Number(orderFeeUsd),
      updated_at: new Date().toISOString(),
    }).eq('id', 1);
    alert('✅ تم تحديث سعر الدولار والعمولة اللحظية بنجاح!');
    loadAllMasterData();
  };

  // رفع اللوجو كملف
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

  // حفظ هوية المنصة والبيكسلات
  const handleSavePlatformSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    await supabase.from('store_settings').upsert({ id: 1, ...platformSettings });
    alert('✅ تم حفظ هوية وإعدادات المنصة بنجاح!');
    setSavingSettings(false);
  };

  // تصدير الطلبات كملف إكسيل CSV للشحن
  const exportOrdersToCSV = () => {
    if (allOrders.length === 0) return alert('لا توجد طلبات للتصدير!');
    const headers = ['رقم الطلب', 'العميل', 'الهاتف', 'المحافظة', 'العنوان', 'المنتج', 'المبلغ', 'الحالة', 'التاريخ'];
    const rows = allOrders.map((o, idx) => [
      idx + 1, `"${o.customer_name || ''}"`, `"${o.phone || ''}"`, `"${o.governorate || ''}"`,
      `"${o.address || ''}"`, `"${o.product_name || ''}"`, o.total_amount || 0, `"${o.status || 'جديد'}"`,
      new Date(o.created_at).toLocaleDateString('ar-EG'),
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `NextOrder_Shipments_${Date.now()}.csv`;
    link.click();
  };

  // نسخ رابط تسجيل التجار
  const copyRegisterLink = () => {
    const link = `${window.location.origin}/register`;
    navigator.clipboard.writeText(link);
    alert('📋 تم نسخ رابط تسجيل التجار:\n' + link);
  };

  // حسابات سريعة
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
      <div className="min-h-screen bg-[#070b14] text-white flex items-center justify-center font-sans" dir="rtl">
        <div className="animate-pulse text-lg font-black flex items-center gap-3">
          <span>👑</span>
          <span>جاري فتح لوحة السوبر أدمن الشاملة (NEXT ORDER)...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-white font-sans flex flex-col md:flex-row select-none" dir="rtl">
      
      {/* 🧭 القائمة الجانبية الكاملة لجميع أقسام المنصة */}
      <aside className="w-full md:w-64 bg-[#0d1322] border-b md:border-b-0 md:border-l border-slate-800 p-5 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                NEXT ORDER
              </span>
              <span className="text-[9px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-black">
                SUPER ADMIN
              </span>
            </div>
            <p className="text-[11px] text-slate-400">لوحة الإدارة المركزية والتحكم الشامل</p>
          </div>

          <nav className="space-y-1 text-xs font-bold">
            {[
              { id: 'overview', label: 'الرئيسية والمؤشرات', icon: '📊' },
              { id: 'merchants', label: `المتاجر والتجار (${merchants.length})`, icon: '🏪', badge: pendingClients.length },
              { id: 'orders', label: `كافة الطلبات (${allOrders.length})`, icon: '📦' },
              { id: 'products', label: `المنتجات العامة (${products.length})`, icon: '🛍️' },
              { id: 'rates', label: 'سعر الصرف والعمولة (0.05$)', icon: '💱' },
              { id: 'domains', label: `الدومينات المخصصة (${domains.length})`, icon: '🌐' },
              { id: 'plans', label: 'باقات الاشتراك', icon: '💎' },
              { id: 'invoices', label: 'سجل الحركات والمقبوضات', icon: '🧾' },
              { id: 'broadcasts', label: 'الإعلانات الجماعية', icon: '📢' },
              { id: 'branding', label: 'هوية المنصة واللوجو', icon: '⚙️' },
              { id: 'pixels', label: 'بيكسلات فيسبوك (CAPI)', icon: '⚡' },
            ].map((nav) => (
              <button
                key={nav.id}
                onClick={() => setActiveTab(nav.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition cursor-pointer ${
                  activeTab === nav.id
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
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

        <div className="pt-4 border-t border-slate-800 space-y-2">
          <button
            onClick={copyRegisterLink}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>🔗</span>
            <span>نسخ رابط تسجيل التجار</span>
          </button>
        </div>
      </aside>

      {/* 🖥️ منطقة المحتوى الرئيسية */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto space-y-6">

        {/* 🌟 1. الرئيسية والمؤشرات الشاملة (Overview) */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h2 className="text-xl font-black text-white">نظرة عامة على أداء منصة NEXT ORDER</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#0d1322] border border-slate-800 p-5 rounded-3xl">
                <span className="text-xs text-slate-400 block mb-1">🏪 إجمالي المتاجر المسجلة</span>
                <span className="text-2xl font-black text-white">{merchants.length} متجر</span>
              </div>
              <div className="bg-[#0d1322] border border-slate-800 p-5 rounded-3xl">
                <span className="text-xs text-slate-400 block mb-1">🟢 العملاء الحاليين (المفعلين)</span>
                <span className="text-2xl font-black text-emerald-400">{activeClients.length} عميل</span>
              </div>
              <div className="bg-[#0d1322] border border-slate-800 p-5 rounded-3xl">
                <span className="text-xs text-slate-400 block mb-1">⏳ مشتركين جدد (بانتظار الشحن)</span>
                <span className="text-2xl font-black text-amber-400">{pendingClients.length} في الانتظار</span>
              </div>
              <div className="bg-[#0d1322] border border-slate-800 p-5 rounded-3xl">
                <span className="text-xs text-slate-400 block mb-1">💰 إجمالي مبيعات المتاجر</span>
                <span className="text-2xl font-black text-emerald-400">{totalStoreSales.toLocaleString()} ج.م</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#0d1322] border border-slate-800 p-5 rounded-3xl">
                <span className="text-xs text-slate-400 block mb-1">📦 إجمالي طلبات المنصة</span>
                <span className="text-2xl font-black text-blue-400">{allOrders.length} طلب</span>
              </div>
              <div className="bg-[#0d1322] border border-slate-800 p-5 rounded-3xl">
                <span className="text-xs text-slate-400 block mb-1">💱 سعر صرف الدولار المعتمد</span>
                <span className="text-2xl font-black text-cyan-400 font-mono">{exchangeRate} ج.م</span>
              </div>
              <div className="bg-[#0d1322] border border-slate-800 p-5 rounded-3xl">
                <span className="text-xs text-slate-400 block mb-1">⚡ عمولة الطلب الواحد</span>
                <span className="text-2xl font-black text-amber-400 font-mono">{orderFeeUsd}$ ({(orderFeeUsd * exchangeRate).toFixed(2)} ج.م)</span>
              </div>
            </div>
          </div>
        )}

        {/* 🌟 2. إدارة المتاجر والتجار (المحفظة + الدخول كتاجر + التفعيل والحذف) */}
        {activeTab === 'merchants' && (
          <div className="space-y-4">
            <div className="bg-[#0d1322] p-5 rounded-3xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div>
                <h2 className="text-lg font-black text-white">إدارة المتاجر والمشتركين ({filteredMerchants.length})</h2>
                <p className="text-xs text-slate-400">شحن المحافظ، الدخول بحساب التاجر، وتفعيل أو إيقاف أو حذف المتاجر</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="بحث باسم المتجر أو المالك أو الهاتف..."
                  value={merchantSearch}
                  onChange={(e) => setMerchantSearch(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-xs p-2.5 rounded-xl w-56 text-white"
                />
                <select
                  value={merchantFilter}
                  onChange={(e) => setMerchantFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-xs p-2.5 rounded-xl text-white font-bold"
                >
                  <option value="all">كل المتاجر ({merchants.length})</option>
                  <option value="active">العملاء الحاليين المفعلين ({activeClients.length})</option>
                  <option value="pending">مشتركين جدد / بانتظار الشحن ({pendingClients.length})</option>
                  <option value="suspended">الموقوفين مؤقتاً</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              {filteredMerchants.map((m) => {
                const bal = Number(m.wallet_balance_usd || 0);
                const ordersCap = Math.floor(bal / orderFeeUsd);
                const isActive = bal >= 0.05 && m.is_active && m.subscription_status === 'active';

                return (
                  <div key={m.id} className="bg-[#0d1322] border border-slate-800 p-5 rounded-3xl space-y-3 hover:border-slate-700 transition">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-base text-white">{m.store_name}</strong>
                        <a href={`/store/${m.store_slug}`} target="_blank" className="text-xs text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-lg font-mono hover:underline">
                          /{m.store_slug} ↗
                        </a>
                        <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                          isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {isActive ? '🟢 نشط ومفعل' : m.subscription_status === 'suspended' ? '⏸️ موقوف مؤقتاً' : '🟡 بانتظار الشحن (5$)'}
                        </span>
                      </div>

                      <div className="text-xs text-slate-400">
                        المالك: <strong className="text-white">{m.owner_name}</strong> (<a href={`https://wa.me/${m.phone}`} target="_blank" className="text-emerald-400 underline font-mono" dir="ltr">{m.phone}</a>)
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-300 bg-slate-900/60 p-3 rounded-2xl">
                      <div>رصيد المحفظة: <strong className="text-emerald-400 font-mono font-bold">{bal.toFixed(2)}$</strong> ({Math.round(bal * exchangeRate)} ج.م)</div>
                      <div>يكفي حتى: <strong className="text-cyan-400 font-mono font-bold">{ordersCap} أوردر</strong></div>
                      <div>أوردرات مخصومة: <strong className="text-amber-400 font-mono">{m.total_orders_billed || 0}</strong></div>
                      <div>إجمالي ما شحنه: <strong className="text-white font-mono">{m.amount_paid || 0} ج.م</strong></div>
                    </div>

                    <div className="flex flex-wrap justify-end gap-2 pt-1">
                      {/* 🔑 الدخول كتاجر */}
                      <button
                        onClick={() => handleLoginAs(m)}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>🔑</span>
                        <span>دخول كتاجر</span>
                      </button>

                      {/* 💳 شحن المحفظة */}
                      <button
                        onClick={() => {
                          setRechargeModalMerchant(m);
                          setChargeUsd(5.0);
                          setChargeEgp(Math.round(5.0 * exchangeRate));
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow transition cursor-pointer flex items-center gap-1.5"
                      >
                        <span>💳</span>
                        <span>شحن المحفظة وتفعيل</span>
                      </button>

                      {/* إيقاف مؤقت */}
                      <button
                        onClick={() => handleToggleMerchantStatus(m, m.subscription_status === 'suspended' ? 'active' : 'suspended')}
                        className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        {m.subscription_status === 'suspended' ? 'تشغيل' : 'إيقاف مؤقت'}
                      </button>

                      {/* حذف نهائي */}
                      <button
                        onClick={() => handleDeleteMerchantFully(m)}
                        className="px-3 py-2 bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        🗑️ حذف
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 🌟 3. كافة طلبات المنصة وتصدير الشحن */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="bg-[#0d1322] p-5 rounded-3xl border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-lg font-black text-white">إدارة طلبات ومبيعات المنصة ({filteredOrders.length})</h2>
                <p className="text-xs text-slate-400">تحديث الحالات وتصدير كشوف الشحن إكسيل لكافة المتاجر</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={exportOrdersToCSV}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black shadow transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>📊</span>
                  <span>تصدير إكسيل للشحن</span>
                </button>
                <button onClick={loadAllMasterData} className="px-3.5 py-2 bg-slate-800 rounded-xl text-xs font-bold cursor-pointer">
                  🔄
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="بحث باسم الزبون أو الهاتف..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="bg-[#0d1322] border border-slate-800 text-xs p-3 rounded-xl flex-1 text-white"
              />
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="bg-[#0d1322] border border-slate-800 text-xs p-3 rounded-xl text-white font-bold"
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
              {filteredOrders.map((o, idx) => (
                <div key={o.id} className="bg-[#0d1322] border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-white text-sm">طلب #{idx + 1} - {o.customer_name}</strong>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-800 text-cyan-400">
                        {o.status || 'جديد'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 flex flex-wrap gap-3">
                      <span>الهاتف: <strong className="text-white font-mono" dir="ltr">{o.phone}</strong></span>
                      <span>المحافظة: <strong className="text-white">{o.governorate}</strong></span>
                      <span>المنتج: <strong className="text-white">{o.product_name}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400 font-black text-base">{o.total_amount} ج.م</span>
                    <select
                      value={o.status || 'جديد'}
                      onChange={async (e) => {
                        const newSt = e.target.value;
                        await supabase.from('orders').update({ status: newSt }).eq('id', o.id);
                        loadAllMasterData();
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
              ))}
            </div>
          </div>
        )}

        {/* 🌟 4. المنتجات العامة والمخزون */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="bg-[#0d1322] p-5 rounded-3xl border border-slate-800 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-black text-white">المنتجات في المنصة ({products.length})</h2>
                <p className="text-xs text-slate-400">استعراض كافة منتجات المتاجر ومتابعة المخزون</p>
              </div>
              <button
                onClick={() => setShowProductModal(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                ➕ إضافة منتج عام
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {products.map((p) => (
                <div key={p.id} className="bg-[#0d1322] border border-slate-800 p-4 rounded-3xl space-y-3">
                  <div className="w-full h-36 bg-slate-900 rounded-2xl flex items-center justify-center overflow-hidden">
                    {p.images?.[0] ? <img src={p.images[0]} className="w-full h-full object-contain" /> : '📦'}
                  </div>
                  <h4 className="font-bold text-sm text-white line-clamp-1">{p.name}</h4>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-emerald-400 font-bold">{p.price} ج.م</span>
                    <span className="text-slate-400">المخزون: {p.stock || 20}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 🌟 5. ضبط سعر الصرف والعمولة اللحظية */}
        {activeTab === 'rates' && (
          <div className="bg-[#0d1322] border border-slate-800 p-6 rounded-3xl max-w-xl space-y-4">
            <h3 className="text-base font-black text-white">ضبط سعر الصرف والعمولة اللحظية</h3>
            <p className="text-xs text-slate-400">السعر المعتمد لتحويل الـ 5$ عند الشحن ولحساب الـ 0.05$ لكل أوردر</p>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">سعر الدولار المعتمد بالجنيه المصري (USD/EGP)</label>
              <input
                type="number"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm font-bold text-emerald-400"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">عمولة الطلب الواحد بالدولار ($)</label>
              <input
                type="number"
                step="0.01"
                value={orderFeeUsd}
                onChange={(e) => setOrderFeeUsd(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm font-bold text-amber-400"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                تساوي حالياً: <strong>{(orderFeeUsd * exchangeRate).toFixed(2)} ج.م</strong> لكل أوردر ناجح.
              </span>
            </div>

            <button
              onClick={handleUpdateExchangeRate}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              حفظ التعديلات اللحظية 💾
            </button>
          </div>
        )}

        {/* 🌟 6. الدومينات المخصصة */}
        {activeTab === 'domains' && (
          <div className="space-y-4 max-w-3xl">
            <h3 className="text-base font-black">طلبات فحص واعتماد الدومينات المخصصة ({domains.length})</h3>
            <div className="space-y-2">
              {domains.length === 0 ? (
                <div className="p-8 text-center text-slate-500 bg-[#0d1322] border border-slate-800 rounded-2xl">لا توجد طلبات دومين حالياً.</div>
              ) : (
                domains.map(d => (
                  <div key={d.id} className="p-4 bg-[#0d1322] border border-slate-800 rounded-2xl flex justify-between items-center text-xs">
                    <div>
                      <strong className="text-cyan-400 font-mono text-sm block">{d.domain}</strong>
                      <span className="text-slate-400">متجر: {d.store_slug}</span>
                    </div>
                    <span className="text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg font-bold">{d.status}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 🌟 7. باقات الاشتراك */}
        {activeTab === 'plans' && (
          <div className="space-y-4 max-w-3xl">
            <h3 className="text-base font-black">باقات الاشتراك المسجلة</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {plans.map(p => (
                <div key={p.id} className="p-5 bg-[#0d1322] border border-slate-800 rounded-3xl space-y-2">
                  <h4 className="font-bold text-white text-sm">{p.name}</h4>
                  <div className="text-emerald-400 font-black text-lg font-mono">{p.price_egp} ج.م / شهر</div>
                  <span className="text-[11px] text-slate-400 block">أقصى منتجات: {p.max_products}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 🌟 8. سجل الحركات والمقبوضات */}
        {activeTab === 'invoices' && (
          <div className="space-y-4">
            <h3 className="text-base font-black">سجل شحن المحافظ والخصومات الحية</h3>
            <div className="space-y-2">
              {invoices.map(inv => (
                <div key={inv.id} className="p-3 bg-[#0d1322] border border-slate-800 rounded-2xl flex justify-between items-center text-xs">
                  <div>
                    <strong className="text-white block">{inv.store_name}</strong>
                    <span className="text-slate-400">{inv.description}</span>
                  </div>
                  <div className="text-right">
                    <span className={`font-mono font-bold block ${inv.type === 'deposit' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {inv.type === 'deposit' ? `+${inv.amount_usd}$` : `-${inv.amount_usd}$`}
                    </span>
                    <span className="text-slate-500 text-[10px]">{new Date(inv.created_at).toLocaleDateString('ar-EG')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 🌟 9. الإعلانات والتنبيهات الجماعية */}
        {activeTab === 'broadcasts' && (
          <div className="space-y-4 max-w-2xl">
            <form onSubmit={async (e) => {
              e.preventDefault();
              await supabase.from('platform_broadcasts').insert([newBroadcast]);
              setNewBroadcast({ title: '', message: '', banner_type: 'info' });
              alert('📢 تم نشر الإعلان العام لجميع التجار!');
              loadAllMasterData();
            }} className="bg-[#0d1322] border border-slate-800 p-6 rounded-3xl space-y-3">
              <h3 className="text-base font-black">إرسال إعلان يظهر في لوحة تحكم التجار</h3>
              <input
                type="text"
                required
                placeholder="عنوان التنبيه"
                value={newBroadcast.title}
                onChange={(e) => setNewBroadcast({ ...newBroadcast, title: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white"
              />
              <textarea
                rows="3"
                required
                placeholder="نص التنبيه..."
                value={newBroadcast.message}
                onChange={(e) => setNewBroadcast({ ...newBroadcast, message: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white"
              ></textarea>
              <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer">نشر الإعلان 📢</button>
            </form>
          </div>
        )}

        {/* 🌟 10. هوية المنصة وإعدادات الشعار واللوجو */}
        {activeTab === 'branding' && (
          <form onSubmit={handleSavePlatformSettings} className="bg-[#0d1322] border border-slate-800 p-6 sm:p-8 rounded-3xl max-w-2xl space-y-5">
            <h3 className="text-base font-black border-b border-slate-800 pb-3">هوية منصة NEXT ORDER الرسمية</h3>
            
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">لوجو المنصة</label>
              <div className="flex items-center gap-4 p-4 border border-dashed border-slate-700 rounded-2xl bg-slate-900/60">
                <div className="w-16 h-16 rounded-xl border border-slate-700 bg-white p-1 flex items-center justify-center shrink-0 overflow-hidden">
                  {platformSettings.store_logo ? <img src={platformSettings.store_logo} className="w-full h-full object-contain" /> : '🖼️'}
                </div>
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="text-xs text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">اسم المنصة الرسمي</label>
              <input
                type="text"
                value={platformSettings.store_name}
                onChange={(e) => setPlatformSettings({ ...platformSettings, store_name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">واتساب الدعم الفني العام</label>
              <input
                type="tel"
                dir="ltr"
                value={platformSettings.support_phone}
                onChange={(e) => setPlatformSettings({ ...platformSettings, support_phone: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white font-mono"
              />
            </div>

            <button type="submit" disabled={savingSettings || uploadingLogo} className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer">
              حفظ الهوية 💾
            </button>
          </form>
        )}

        {/* 🌟 11. بيكسلات فيسبوك المركزية */}
        {activeTab === 'pixels' && (
          <form onSubmit={handleSavePlatformSettings} className="bg-[#0d1322] border border-slate-800 p-6 rounded-3xl max-w-2xl space-y-4">
            <h3 className="text-base font-black border-b border-slate-800 pb-3">بيكسلات فيسبوك (CAPI) للمنصة</h3>
            {[1, 2].map(n => (
              <div key={n} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                <span className="text-xs font-bold text-slate-300">بيكسل فيسبوك ({n})</span>
                <input
                  type="text"
                  dir="ltr"
                  placeholder={`Pixel ID ${n}`}
                  value={platformSettings[`pixel_${n}`] || ''}
                  onChange={(e) => setPlatformSettings({ ...platformSettings, [`pixel_${n}`]: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-mono text-white"
                />
                <input
                  type="text"
                  dir="ltr"
                  placeholder={`Access Token (CAPI) ${n}`}
                  value={platformSettings[`token_${n}`] || ''}
                  onChange={(e) => setPlatformSettings({ ...platformSettings, [`token_${n}`]: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-mono text-white"
                />
              </div>
            ))}
            <button type="submit" className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer">حفظ البيكسلات 💾</button>
          </form>
        )}

      </main>

      {/* نافذة شحن المحفظة والتفعيل */}
      {rechargeModalMerchant && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d1322] border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-black border-b border-slate-800 pb-2">
              شحن محفظة: {rechargeModalMerchant.store_name}
            </h3>

            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400">
              الرصيد الحالي: <strong>{Number(rechargeModalMerchant.wallet_balance_usd || 0).toFixed(2)}$</strong>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">المبلغ بالدولار ($)</label>
                <input
                  type="number"
                  min="5"
                  value={chargeUsd}
                  onChange={(e) => {
                    const u = Number(e.target.value);
                    setChargeUsd(u);
                    setChargeEgp(Math.round(u * exchangeRate));
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 font-bold text-emerald-400"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">المعادل بالمصري (ج.م)</label>
                <input
                  type="number"
                  value={chargeEgp}
                  onChange={(e) => {
                    const eg = Number(e.target.value);
                    setChargeEgp(eg);
                    setChargeUsd(Number((eg / exchangeRate).toFixed(2)));
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 font-bold text-white"
                />
              </div>
            </div>

            <div className="text-[11px] text-slate-400 bg-slate-900/60 p-3 rounded-xl space-y-1">
              <div>• عمولة الطلب الواحد: <strong>{orderFeeUsd}$</strong> (~{(orderFeeUsd * exchangeRate).toFixed(2)} ج.م).</div>
              <div>• سعة الشحن: <strong>{Math.floor(chargeUsd / orderFeeUsd)} أوردر</strong>.</div>
              <div>• الرصيد المتبقي بنهاية الشهر يرحل تلقائياً دون أي فقد.</div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button onClick={() => setRechargeModalMerchant(null)} className="px-4 py-2 bg-slate-800 rounded-xl text-xs font-bold">إلغاء</button>
              <button onClick={handleConfirmRecharge} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 font-black text-xs rounded-xl shadow-lg cursor-pointer">
                تأكيد الشحن والتفعيل 🚀
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة إضافة منتج عام */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d1322] border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-3">
            <h3 className="text-base font-black border-b border-slate-800 pb-2">إضافة منتج عام</h3>
            <input
              type="text"
              placeholder="اسم المنتج"
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
            />
            <input
              type="number"
              placeholder="السعر (ج.م)"
              value={productForm.price}
              onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowProductModal(false)} className="px-4 py-2 bg-slate-800 rounded-xl text-xs font-bold">إلغاء</button>
              <button onClick={async () => {
                await supabase.from('products').insert([{ name: productForm.name, price: Number(productForm.price) }]);
                setShowProductModal(false);
                loadAllMasterData();
              }} className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold">حفظ</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
