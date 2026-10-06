'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function SuperAdminExecutiveDashboard() {
  const router = useRouter();

  // التبويبات الرئيسية في الشريط الجانبي
  // 'overview' | 'merchants' | 'plans' | 'domains' | 'invoices' | 'broadcasts' | 'orders_feed' | 'settings'
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // بيانات المنظومة المركزية
  const [merchants, setMerchants] = useState([]);
  const [plans, setPlans] = useState([]);
  const [domains, setDomains] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [platformSettings, setPlatformSettings] = useState({
    store_name: 'NEXT ORDER',
    store_logo: '',
    support_phone: '',
    announcement_text: '',
  });

  // نوافذ وفلاتر التعديل
  const [merchantSearch, setMerchantSearch] = useState('');
  const [merchantStatusFilter, setMerchantStatusFilter] = useState('all');
  const [editingMerchant, setEditingMerchant] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [customAmountPaid, setCustomAmountPaid] = useState('');

  // إضافة إعلان جماعي للتجار
  const [newBroadcast, setNewBroadcast] = useState({ title: '', message: '', banner_type: 'info' });

  useEffect(() => {
    loadSaaSCoreData();
  }, []);

  async function loadSaaSCoreData() {
    setLoading(true);
    try {
      if (supabase) {
        // 1. المشتركون
        const { data: mData } = await supabase.from('store_profiles').select('*').order('created_at', { ascending: false });
        if (mData) setMerchants(mData);

        // 2. باقات الاشتراك
        const { data: pData } = await supabase.from('subscription_plans').select('*').order('price_egp', { ascending: true });
        if (pData) setPlans(pData);

        // 3. طلبات الدومينات
        const { data: dData } = await supabase.from('custom_domain_requests').select('*').order('created_at', { ascending: false });
        if (dData) setDomains(dData);

        // 4. الفواتير
        const { data: iData } = await supabase.from('platform_invoices').select('*').order('created_at', { ascending: false });
        if (iData) setInvoices(iData);

        // 5. الإعلانات العامة
        const { data: bData } = await supabase.from('platform_broadcasts').select('*').order('created_at', { ascending: false });
        if (bData) setBroadcasts(bData);

        // 6. آخر الطلبات في المنصة
        const { data: oData } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(50);
        if (oData) setAllOrders(oData);

        // 7. إعدادات المنصة
        const { data: sData } = await supabase.from('store_settings').select('*').limit(1).maybeSingle();
        if (sData) setPlatformSettings(sData);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  // 👑 ميزة السوبر أدمن الحصرية: الدخول كتاجر بنقرة واحدة (Impersonation)
  const handleLoginAsMerchant = (merchant) => {
    if (!merchant.user_id) return alert('هذا الحساب لا يملك معرف مستخدم صالح');
    const confirmLogin = confirm(`هل تريد الدخول فوراً لإدارة متجر "${merchant.store_name}" بصفة التاجر؟`);
    if (!confirmLogin) return;

    localStorage.setItem('merchant_user_id', merchant.user_id);
    router.push('/dashboard');
  };

  // تفعيل واشتراك تاجر مع إصدار فاتورة رسمية
  const handleActivateMerchantWithInvoice = async (e) => {
    e.preventDefault();
    if (!editingMerchant) return;

    const chosenPlan = plans.find(p => p.id === selectedPlanId) || plans[0];
    const durationDays = chosenPlan?.duration_days || 30;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + durationDays);

    const paidVal = Number(customAmountPaid) || Number(chosenPlan?.price_egp) || 250;

    // 1. تحديث بروفايل التاجر
    await supabase.from('store_profiles').update({
      is_active: true,
      subscription_status: 'active',
      plan_id: chosenPlan?.id,
      amount_paid: paidVal,
      subscription_ends_at: expiryDate.toISOString(),
    }).eq('id', editingMerchant.id);

    // 2. إصدار فاتورة في سجل الإيرادات
    const invoiceNum = 'INV-' + Date.now().toString().slice(-8);
    await supabase.from('platform_invoices').insert([{
      invoice_number: invoiceNum,
      user_id: editingMerchant.user_id,
      store_name: editingMerchant.store_name,
      plan_name: chosenPlan?.name || 'خطة الاشتراك القياسية',
      amount_paid: paidVal,
      starts_at: new Date().toISOString(),
      ends_at: expiryDate.toISOString(),
    }]);

    alert(`✅ تم تفعيل متجر (${editingMerchant.store_name}) وإصدار الفاتورة (${invoiceNum}) بنجاح!`);
    setEditingMerchant(null);
    loadSaaSCoreData();
  };

  // تعليق أو تعطيل التاجر
  const handleToggleMerchantStatus = async (merchant, targetStatus) => {
    if (!confirm(`هل أنت متأكد من تغيير حالة متجر "${merchant.store_name}" إلى [${targetStatus}]؟`)) return;
    await supabase.from('store_profiles').update({
      is_active: targetStatus === 'active',
      subscription_status: targetStatus,
    }).eq('id', merchant.id);
    loadSaaSCoreData();
  };

  // حذف شامل لحساب التاجر
  const handleDeleteMerchantFully = async (merchant) => {
    const confirmName = prompt(`⚠️ تحذير: اكتب اسم المتجر لحذفه نهائياً مع كافة ملفاته: "${merchant.store_name}"`);
    if (confirmName !== merchant.store_name) return;

    if (merchant.user_id) {
      await supabase.from('products').delete().eq('user_id', merchant.user_id);
      await supabase.from('orders').delete().eq('user_id', merchant.user_id);
      await supabase.from('merchant_settings').delete().eq('user_id', merchant.user_id);
      await supabase.from('shipping_rates').delete().eq('user_id', merchant.user_id);
      await supabase.from('blacklist').delete().eq('user_id', merchant.user_id);
      await supabase.from('custom_domain_requests').delete().eq('user_id', merchant.user_id);
    }
    await supabase.from('store_profiles').delete().eq('id', merchant.id);
    alert('🗑️ تم الحذف النهائي للحساب وجميع متعلقاته.');
    loadSaaSCoreData();
  };

  // اعتماد الدومين المخصص
  const handleVerifyDomain = async (domainObj) => {
    await supabase.from('custom_domain_requests').update({
      status: 'active',
      verified_at: new Date().toISOString(),
    }).eq('id', domainObj.id);

    await supabase.from('store_profiles').update({
      custom_domain: domainObj.domain,
    }).eq('user_id', domainObj.user_id);

    alert(`✅ تم تفعيل وربط الدومين (${domainObj.domain}) بالمتجر بنجاح!`);
    loadSaaSCoreData();
  };

  // إنشاء بث إعلاني جماعي لجميع التجار
  const handleCreateBroadcast = async (e) => {
    e.preventDefault();
    if (!newBroadcast.title || !newBroadcast.message) return;
    await supabase.from('platform_broadcasts').insert([newBroadcast]);
    setNewBroadcast({ title: '', message: '', banner_type: 'info' });
    alert('📢 تم نشر الإعلان العام في لوحات تحكم كافة التجار!');
    loadSaaSCoreData();
  };

  // الحسابات المالية للمنصة
  const totalPlatformRevenue = invoices.reduce((sum, inv) => sum + (Number(inv.amount_paid) || 0), 0);
  const activeMerchantsCount = merchants.filter(m => m.is_active && m.subscription_status === 'active').length;
  const pendingMerchantsCount = merchants.filter(m => !m.is_active || m.subscription_status === 'pending').length;

  const filteredMerchants = merchants.filter(m => {
    const matchesSearch = (m.store_name || '').toLowerCase().includes(merchantSearch.toLowerCase()) ||
                          (m.owner_name || '').toLowerCase().includes(merchantSearch.toLowerCase()) ||
                          (m.phone || '').includes(merchantSearch);
    const matchesStatus = merchantStatusFilter === 'all' || m.subscription_status === merchantStatusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] text-white flex items-center justify-center font-sans" dir="rtl">
        <div className="animate-pulse text-lg font-black flex items-center gap-3">
          <span>👑</span>
          <span>جاري تحميل منظومة Super Admin المركزية...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-white font-sans flex flex-col md:flex-row select-none" dir="rtl">
      
      {/* 🧭 الشريط الجانبي القيادي للسوبر أدمن (Super Admin Executive Sidebar) */}
      <aside className="w-full md:w-64 bg-[#0d1322] border-b md:border-b-0 md:border-l border-slate-800 p-5 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black bg-gradient-to-r from-red-500 via-amber-400 to-emerald-400 bg-clip-text text-transparent">
                NEXT ORDER
              </span>
              <span className="text-[9px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-black">
                SUPER ADMIN
              </span>
            </div>
            <p className="text-[11px] text-slate-400">إدارة البنية التحتية والاشتراكات</p>
          </div>

          <nav className="space-y-1 text-xs font-bold">
            {[
              { id: 'overview', label: 'الرئيسية والإحصائيات', icon: '📈' },
              { id: 'merchants', label: `المتاجر والتجار (${merchants.length})`, icon: '🏪' },
              { id: 'plans', label: 'خطط وباقات الاشتراك', icon: '💎' },
              { id: 'domains', label: `الدومينات المخصصة (${domains.length})`, icon: '🌐' },
              { id: 'invoices', label: `الفواتير والمقبوضات`, icon: '🧾' },
              { id: 'broadcasts', label: 'الإعلانات الجماعية', icon: '📢' },
              { id: 'orders_feed', label: 'بث الطلبات المباشر', icon: '📦' },
              { id: 'settings', label: 'إعدادات المنصة', icon: '⚙️' },
            ].map((nav) => (
              <button
                key={nav.id}
                onClick={() => setActiveTab(nav.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl transition cursor-pointer ${
                  activeTab === nav.id
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span>{nav.icon}</span>
                  <span>{nav.label}</span>
                </div>
                {nav.id === 'merchants' && pendingMerchantsCount > 0 && (
                  <span className="bg-amber-500 text-black text-[10px] font-black px-1.5 py-0.2 rounded-full">
                    {pendingMerchantsCount}
                  </span>
                )}
              </button>
            ))}
          </nav>

        </div>

        <div className="pt-4 border-t border-slate-800/80 space-y-2">
          <button
            onClick={() => {
              const link = `${window.location.origin}/register`;
              navigator.clipboard.writeText(link);
              alert('📋 تم نسخ رابط تسجيل المشتركين:\n' + link);
            }}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>🔗</span>
            <span>نسخ رابط تسجيل التجار</span>
          </button>
        </div>
      </aside>

      {/* 🖥️ المحتوى التنفيذي الرئيسي */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto space-y-6">
        
        {/* 1. لوحة المؤشرات المالية للمنصة (Platform Overview) */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h2 className="text-xl font-black text-white">المؤشرات الحيوية لمنصة NEXT ORDER</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#0d1322] border border-slate-800 p-5 rounded-3xl">
                <span className="text-xs text-slate-400 block mb-1">💰 إجمالي إيرادات الاشتراكات</span>
                <span className="text-2xl font-black text-emerald-400">{totalPlatformRevenue.toLocaleString()} ج.م</span>
              </div>
              <div className="bg-[#0d1322] border border-slate-800 p-5 rounded-3xl">
                <span className="text-xs text-slate-400 block mb-1">🟢 المتاجر النشطة والمفعلة</span>
                <span className="text-2xl font-black text-cyan-400">{activeMerchantsCount} متجر</span>
              </div>
              <div className="bg-[#0d1322] border border-slate-800 p-5 rounded-3xl">
                <span className="text-xs text-slate-400 block mb-1">⏳ متاجر بانتظار التفعيل (معلقة)</span>
                <span className="text-2xl font-black text-amber-400">{pendingMerchantsCount} متجر</span>
              </div>
              <div className="bg-[#0d1322] border border-slate-800 p-5 rounded-3xl">
                <span className="text-xs text-slate-400 block mb-1">📦 إجمالي عمليات الشراء المحققة</span>
                <span className="text-2xl font-black text-indigo-400">{allOrders.length}+ طلب</span>
              </div>
            </div>

            {/* آخر العمليات المباشرة */}
            <div className="bg-[#0d1322] border border-slate-800 p-6 rounded-3xl space-y-4">
              <h3 className="text-base font-black">أحدث فواتير الاشتراكات المحصلة</h3>
              <div className="space-y-2">
                {invoices.slice(0, 5).map(inv => (
                  <div key={inv.id} className="p-3 bg-slate-900/60 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <strong className="text-white block">{inv.store_name}</strong>
                      <span className="text-slate-400 font-mono">{inv.invoice_number} | {inv.plan_name}</span>
                    </div>
                    <div className="text-right">
                      <strong className="text-emerald-400 block font-mono">{inv.amount_paid} ج.م</strong>
                      <span className="text-slate-500 text-[10px]">{new Date(inv.created_at).toLocaleDateString('ar-EG')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. إدارة المتاجر والتجار مع ميزة الـ Impersonation */}
        {activeTab === 'merchants' && (
          <div className="space-y-4">
            <div className="bg-[#0d1322] p-5 rounded-3xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div>
                <h3 className="text-lg font-black">إدارة متاجر المنصة ({filteredMerchants.length})</h3>
                <p className="text-xs text-slate-400">تحكم كامل، دخول مباشر لحساب التاجر، وتفعيل الاشتراكات</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="بحث باسم المتجر أو المالك أو الهاتف..."
                  value={merchantSearch}
                  onChange={(e) => setMerchantSearch(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-xs p-2.5 rounded-xl w-60 text-white"
                />
                <select
                  value={merchantStatusFilter}
                  onChange={(e) => setMerchantStatusFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-xs p-2.5 rounded-xl text-white"
                >
                  <option value="all">كل الحالات</option>
                  <option value="active">نشط ومفعل</option>
                  <option value="pending">قيد الانتظار</option>
                  <option value="suspended">موقوف مؤقتاً</option>
                  <option value="disabled">معطل</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              {filteredMerchants.map((m) => {
                const isExpired = !m.subscription_ends_at || new Date(m.subscription_ends_at) < new Date();
                const isActive = m.is_active && !isExpired && m.subscription_status === 'active';

                return (
                  <div key={m.id} className="bg-[#0d1322] border border-slate-800 p-5 rounded-3xl space-y-3 hover:border-slate-700 transition">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-base text-white">{m.store_name}</strong>
                        <span className="text-xs text-slate-400 font-mono">({m.store_slug})</span>
                        
                        <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                          isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {isActive ? '🟢 نشط' : m.subscription_status === 'suspended' ? '⏸️ موقوف' : '🟡 بانتظار التفعيل'}
                        </span>
                      </div>

                      <div className="text-xs text-slate-400">
                        الانتهاء: <strong className="text-amber-300 font-mono">{m.subscription_ends_at ? new Date(m.subscription_ends_at).toLocaleDateString('ar-EG') : 'لم يُحدد'}</strong>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-300 bg-slate-900/60 p-3 rounded-2xl">
                      <div>صاحب المتجر: <strong className="text-white">{m.owner_name}</strong></div>
                      <div>رقم الهاتف: <a href={`https://wa.me/${m.phone}`} target="_blank" className="text-emerald-400 font-mono underline" dir="ltr">{m.phone}</a></div>
                      <div>المسدد: <strong className="text-emerald-400 font-bold">{m.amount_paid || 0} ج.م</strong></div>
                      <div>الدومين: <strong className="text-cyan-400 font-mono">{m.custom_domain || 'دومين فرعي'}</strong></div>
                    </div>

                    {/* أزرار الإجراءات والـ Impersonation */}
                    <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                      
                      {/* 🔑 الدخول كتاجر */}
                      <button
                        onClick={() => handleLoginAsMerchant(m)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow transition flex items-center gap-1.5 cursor-pointer"
                        title="الدخول إلى متجر هذا التاجر فوراً لحل مشاكله أو ضبط إعداداته"
                      >
                        <span>🔑</span>
                        <span>دخول كتاجر (Login As)</span>
                      </button>

                      {/* تفعيل / تجديد */}
                      <button
                        onClick={() => { setEditingMerchant(m); setCustomAmountPaid(m.amount_paid || '250'); }}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        🚀 تفعيل / تجديد
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
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. خطط وباقات الاشتراك (Plans Engine) */}
        {activeTab === 'plans' && (
          <div className="space-y-6 max-w-4xl">
            <div>
              <h3 className="text-lg font-black">خطط وباقات اشتراك منصة NEXT ORDER</h3>
              <p className="text-xs text-slate-400">تحديد حدود المنتجات والطلبات والأسعار لكل باقة</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((p) => (
                <div key={p.id} className="bg-[#0d1322] border border-slate-800 p-6 rounded-3xl space-y-4 relative">
                  <div>
                    <h4 className="text-base font-black text-white">{p.name}</h4>
                    <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">
                      {p.price_egp} ج.م <span className="text-xs text-slate-500 font-normal">/ {p.price_usd}$ شهرياً</span>
                    </div>
                  </div>

                  <ul className="text-xs text-slate-300 space-y-2 border-t border-slate-800 pt-3">
                    <li>📦 أقصى عدد منتجات: <strong>{p.max_products}</strong></li>
                    <li>📊 أقصى عدد أوردرات: <strong>{p.max_orders_per_month} شهرياً</strong></li>
                    <li>🌐 ربط دومين مخصص: <strong>{p.allow_custom_domain ? '✅ متاح' : '❌ غير متاح'}</strong></li>
                    <li>🎬 رفع فيديوهات للمنتج: <strong>{p.allow_video_uploads ? '✅ متاح' : '❌ غير متاح'}</strong></li>
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. الدومينات المخصصة (Custom Domains Manager) */}
        {activeTab === 'domains' && (
          <div className="space-y-4 max-w-4xl">
            <div>
              <h3 className="text-lg font-black">طلبات فحص وربط الدومينات المخصصة</h3>
              <p className="text-xs text-slate-400">التأكد من توجيه سجلات DNS وتفعيل الدومين لمتجر التاجر</p>
            </div>

            <div className="space-y-3">
              {domains.length === 0 ? (
                <div className="p-12 text-center text-slate-500 bg-[#0d1322] border border-slate-800 rounded-3xl">
                  لا توجد طلبات دومين مخصص حالياً.
                </div>
              ) : (
                domains.map((d) => (
                  <div key={d.id} className="bg-[#0d1322] border border-slate-800 p-4 rounded-2xl flex justify-between items-center text-xs">
                    <div>
                      <strong className="text-cyan-400 font-mono text-sm block">{d.domain}</strong>
                      <span className="text-slate-400">متجر: {d.store_slug} | الهدف: {d.dns_target}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold ${
                        d.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {d.status === 'active' ? 'مفعل ويعمل' : 'قيد الفحص'}
                      </span>
                      {d.status !== 'active' && (
                        <button
                          onClick={() => handleVerifyDomain(d)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold cursor-pointer"
                        >
                          اعتماد وتفعيل الدومين ✓
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 5. الفواتير والتحصيلات (Platform Invoices) */}
        {activeTab === 'invoices' && (
          <div className="space-y-4">
            <h3 className="text-lg font-black">سجل المقبوضات والفواتير الصادرة</h3>
            <div className="bg-[#0d1322] border border-slate-800 rounded-3xl overflow-hidden">
              <table className="w-full text-right text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">رقم الفاتورة</th>
                    <th className="p-3.5">المتجر</th>
                    <th className="p-3.5">الباقة</th>
                    <th className="p-3.5">المبلغ المحول</th>
                    <th className="p-3.5">تاريخ الإصدار</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-900/40">
                      <td className="p-3.5 font-mono text-cyan-400">{inv.invoice_number}</td>
                      <td className="p-3.5 font-bold text-white">{inv.store_name}</td>
                      <td className="p-3.5">{inv.plan_name}</td>
                      <td className="p-3.5 text-emerald-400 font-black font-mono">{inv.amount_paid} ج.م</td>
                      <td className="p-3.5 text-slate-400">{new Date(inv.created_at).toLocaleDateString('ar-EG')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. الإعلانات والتنبيهات الجماعية (Broadcasts) */}
        {activeTab === 'broadcasts' && (
          <div className="space-y-6 max-w-3xl">
            <form onSubmit={handleCreateBroadcast} className="bg-[#0d1322] border border-slate-800 p-6 rounded-3xl space-y-4">
              <h3 className="text-base font-black">إرسال إشعار / شريط تنبيهي لجميع التجار</h3>
              
              <input
                type="text"
                required
                placeholder="عنوان التنبيه (مثال: تحديث أمني جديد)"
                value={newBroadcast.title}
                onChange={(e) => setNewBroadcast({ ...newBroadcast, title: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white"
              />

              <textarea
                rows="3"
                required
                placeholder="نص الرسالة التي ستظهر في لوحة تحكم التجار..."
                value={newBroadcast.message}
                onChange={(e) => setNewBroadcast({ ...newBroadcast, message: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white"
              ></textarea>

              <button type="submit" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer">
                نشر التنبيه الآن 📢
              </button>
            </form>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400">الإعلانات السابقة المنشورة:</h4>
              {broadcasts.map((b) => (
                <div key={b.id} className="p-3 bg-[#0d1322] border border-slate-800 rounded-2xl text-xs space-y-1">
                  <strong className="text-white block">{b.title}</strong>
                  <p className="text-slate-400">{b.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* نافذة التفعيل وتحديد الباقة وإصدار الفاتورة */}
      {editingMerchant && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <form onSubmit={handleActivateMerchantWithInvoice} className="bg-[#0d1322] border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-black border-b border-slate-800 pb-3">
              تفعيل اشتراك: {editingMerchant.store_name}
            </h3>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-300">
              قيمة الاشتراك الشهري: <strong>5 دولار أو ما يعادلها بالمصري</strong>.
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">اختر الباقة</label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} - ({p.price_egp} ج.م)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">المبلغ المحول الفعلي (ج.م)</label>
              <input
                type="number"
                value={customAmountPaid}
                onChange={(e) => setCustomAmountPaid(e.target.value)}
                placeholder="250"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-emerald-400 font-bold"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button type="button" onClick={() => setEditingMerchant(null)} className="px-4 py-2 bg-slate-800 rounded-xl text-xs font-bold">
                إلغاء
              </button>
              <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold">
                تأكيد التفعيل وإصدار الفاتورة 🚀
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
