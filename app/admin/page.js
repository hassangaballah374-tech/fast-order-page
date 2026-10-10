'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';
import { SPIKE_LOGO_URL } from '../../components/SpikeBrandHeader';

const SUPER_ADMIN_EMAIL = 'hassanhosny2007@gmail.com';

export default function SpikeSuperAdminDashboard() {
  const router = useRouter();
  const { lang, theme, toggleLanguage, toggleTheme, isDark, isMobileView, toggleMobileView } = useApp();
  const isAr = lang === 'ar';

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [currentAdminRole, setCurrentAdminRole] = useState(null);
  const [currentPermissions, setCurrentPermissions] = useState({});

  const [stores, setStores] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [domains, setDomains] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  
  const [exchangeRate, setExchangeRate] = useState(50.0);
  const [platformCommission, setPlatformCommission] = useState(2.5);
  const [withdrawThreshold, setWithdrawThreshold] = useState(100);

  const [newStoreModal, setNewStoreModal] = useState(false);
  const [newStoreData, setNewStoreData] = useState({
    store_name: '',
    store_slug: '',
    owner_name: '',
    phone: '',
    currency: 'USD',
    initial_wallet: 10
  });

  const [newProductModal, setNewProductModal] = useState(false);
  const [newProductData, setNewProductData] = useState({
    title: '',
    price: '',
    cost_price: '',
    stock: 100,
    store_id: ''
  });

  const [newAdminModal, setNewAdminModal] = useState(false);
  const [newAdminData, setNewAdminData] = useState({
    email: '',
    name: '',
    role: 'admin',
    permissions: {
      manage_stores: true,
      manage_orders: true,
      manage_finance: false,
      manage_admins: false
    }
  });

  const [broadcastMessage, setBroadcastMessage] = useState('');

  const t = {
    ar: {
      dashboard: 'الإدارة العليا',
      overviewTitle: 'مركز القيادة والسيادة العليا لـ SPIKE',
      overviewSubtitle: 'مؤشرات الأداء السيادية، رصد العمليات اللحظية، وإمبراطورية المتاجر',
      addStore: 'إمبراطورية متجر جديد',
      refreshData: 'مزامنة نارية',
      statStores: 'إجمالي إمبراطوريات المتاجر',
      statPending: 'شحنات قيد الانتظار',
      statActiveUsers: 'الشركاء والعملاء الأقوياء',
      statSales: 'إجمالي عوائد المنصة',
      comparedLastMonth: 'مقارنة بالشهر السيادي السابق',
      underProcess: 'قيد المعالجة الحربية',
      activeRate: 'كفاءة النشر السيادي',
      totalReceipts: 'صافي حجم السيولة',
      adminRole: 'الإمبراطور الأعظم (Master)',
      logoutText: 'خروج تكتيكي',
      navOverview: 'القيادة والتحليلات السيادية',
      navStores: 'المتاجر والشركاء',
      navOrders: 'سجل العمليات والطلبات',
      navInventory: 'مستودع العتاد والمنتجات',
      navPolicies: 'دستور وسياسات سبايك',
      navRates: 'صرف العملات والرسوم السيادية',
      navDomains: 'النطاقات وشبكات الـ DNS',
      navPlans: 'مستويات الاشتراكات الفاخرة',
      navLogs: 'سجل العمليات الاستخباراتي',
      navBroadcast: 'البث الحربي الجماعي',
      navAdmins: 'مجلس القيادة والصلاحيات',
      adminStoresBtn: 'متاجر القيادة الخاصة',
      ordersCount: 'أوردر',
      activeStatus: 'جاهز',
      save: 'تثبيت السيادة والتعديلات',
      cancel: 'إلغاء'
    },
    en: {
      dashboard: 'Supreme Command',
      overviewTitle: 'SPIKE Imperial Command Center',
      overviewSubtitle: 'Sovereign performance metrics, live transaction surveillance, and merchant empire',
      addStore: 'Deploy New Empire Store',
      refreshData: 'Tactical Sync',
      statStores: 'Total Merchant Empires',
      statPending: 'Pending Deployments',
      statActiveUsers: 'Active Elite Partners',
      statSales: 'Gross Platform Revenue',
      comparedLastMonth: 'vs previous sovereign cycle',
      underProcess: 'Combat Processing',
      activeRate: 'Deployment Efficiency',
      totalReceipts: 'Net Liquidity Volume',
      adminRole: 'Supreme Emperor (Master)',
      logoutText: 'Tactical Logout',
      navOverview: 'Command & Analytics',
      navStores: 'Stores & Partners',
      navOrders: 'Global Operations & Orders',
      navInventory: 'Armory & Inventory',
      navPolicies: 'SPIKE Constitution',
      navRates: 'Exchange & Sovereign Fees',
      navDomains: 'Domains & DNS Grids',
      navPlans: 'Luxury Tiers',
      navLogs: 'Intelligence Audit Logs',
      navBroadcast: 'Imperial Broadcasts',
      navAdmins: 'High Command & Roles',
      adminStoresBtn: 'My Sovereign Stores',
      ordersCount: 'orders',
      activeStatus: 'Active',
      save: 'Enforce Changes',
      cancel: 'Cancel'
    }
  }[lang || 'ar'];

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error(err);
    }
    localStorage.clear();
    router.push('/register');
  };

  useEffect(() => {
    const verifyAdminAccess = async () => {
      try {
        const storedEmail = (localStorage.getItem('user_email') || '').toLowerCase().trim();
        
        if (storedEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
          fetchAllData();
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        const authEmail = user?.email?.toLowerCase().trim();

        if (authEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
          localStorage.setItem('user_email', SUPER_ADMIN_EMAIL);
          fetchAllData();
          return;
        }

        const emailToCheck = storedEmail || authEmail;
        if (emailToCheck) {
          const { data: adminRecord } = await supabase
            .from('admin_users')
            .select('*')
            .eq('email', emailToCheck)
            .maybeSingle();

          if (adminRecord) {
            setCurrentAdminRole(adminRecord.role);
            setCurrentPermissions(adminRecord.permissions || {});
            fetchAllData();
            return;
          }
        }

        alert(isAr ? '⛔ وصول مرفوض: هذه منطقة سيادية خاصة بالإدارة العليا.' : 'Access Denied: Supreme Command Only.');
        router.push('/dashboard');
      } catch (err) {
        console.error('Auth verification failed:', err);
        router.push('/dashboard');
      }
    };

    verifyAdminAccess();
  }, []);

  const fetchAllData = async () => {
    setRefreshing(true);
    try {
      const { data: storesData } = await supabase.from('store_profiles').select('*').order('created_at', { ascending: false });
      if (storesData) setStores(storesData);

      const { data: ordersData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (ordersData) setOrders(ordersData);

      const { data: productsData } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (productsData) setProducts(productsData);

      const { data: logsData } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(20);
      if (logsData) setAuditLogs(logsData);

      const { data: domainsData } = await supabase.from('custom_domains').select('*').order('created_at', { ascending: false });
      if (domainsData) setDomains(domainsData);

      const { data: adminsData } = await supabase.from('admin_users').select('*').order('created_at', { ascending: false });
      if (adminsData) setAdminUsers(adminsData);

      const { data: settingsData } = await supabase.from('platform_settings').select('*').single();
      if (settingsData) {
        if (settingsData.exchange_rate) setExchangeRate(settingsData.exchange_rate);
        if (settingsData.commission_percentage) setPlatformCommission(settingsData.commission_percentage);
        if (settingsData.withdraw_threshold) setWithdrawThreshold(settingsData.withdraw_threshold);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCreateStore = async (e) => {
    e.preventDefault();
    if (!newStoreData.store_name || !newStoreData.store_slug) {
      alert(isAr ? 'يرجى كتابة اسم ورابط المتجر' : 'Please fill required fields');
      return;
    }
    const cleanSlug = newStoreData.store_slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const newUserId = 'merchant_' + Date.now().toString(36);

    const { error } = await supabase.from('store_profiles').insert([{
      user_id: newUserId,
      store_name: newStoreData.store_name,
      store_slug: cleanSlug,
      owner_name: newStoreData.owner_name || 'قائد جديد',
      phone: newStoreData.phone,
      wallet_balance_usd: parseFloat(newStoreData.initial_wallet) || 0,
      is_active: true,
      subscription_status: 'active',
      plan_type: 'starter'
    }]);

    if (!error) {
      alert(isAr ? '⚡ تم إطلاق الإمبراطورية التجارية بنجاح' : 'Store Empire deployed successfully');
      setNewStoreModal(false);
      setNewStoreData({ store_name: '', store_slug: '', owner_name: '', phone: '', currency: 'USD', initial_wallet: 10 });
      fetchAllData();
    } else {
      alert(error.message);
    }
  };

  const handleToggleStoreStatus = async (storeId, currentStatus) => {
    const nextStatus = !currentStatus;
    const { error } = await supabase
      .from('store_profiles')
      .update({ is_active: nextStatus })
      .eq('id', storeId);

    if (!error) {
      setStores(prev => prev.map(s => s.id === storeId ? { ...s, is_active: nextStatus } : s));
    }
  };

  const handleUpdateWallet = async (storeId, currentBalance) => {
    const amount = prompt(isAr ? 'أدخل السيولة الجديدة بالدولار ($):' : 'Enter new liquidity in USD:', currentBalance);
    if (amount === null) return;
    const num = parseFloat(amount);
    if (isNaN(num)) return;

    const { error } = await supabase
      .from('store_profiles')
      .update({ wallet_balance_usd: num })
      .eq('id', storeId);

    if (!error) {
      setStores(prev => prev.map(s => s.id === storeId ? { ...s, wallet_balance_usd: num } : s));
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (!error) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!newProductData.title || !newProductData.price) {
      alert(isAr ? 'يرجى إدخال اسم العتاد والسعر' : 'Please fill title and price');
      return;
    }
    const { error } = await supabase.from('products').insert([{
      title: newProductData.title,
      price: parseFloat(newProductData.price) || 0,
      cost_price: parseFloat(newProductData.cost_price) || 0,
      stock_quantity: parseInt(newProductData.stock) || 0,
      store_id: newProductData.store_id || (stores[0]?.user_id || 'spike_main'),
      status: 'active'
    }]);

    if (!error) {
      alert(isAr ? '⚡ تمت إضافة العتاد بنجاح للمستودع الإمبراطوري' : 'Armory asset deployed successfully');
      setNewProductModal(false);
      setNewProductData({ title: '', price: '', cost_price: '', stock: 100, store_id: '' });
      fetchAllData();
    } else {
      alert(error.message);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (!newAdminData.email) return;

    const cleanEmail = newAdminData.email.trim().toLowerCase();
    const { error } = await supabase.from('admin_users').insert([{
      email: cleanEmail,
      name: newAdminData.name.trim() || 'قائد ميداني',
      role: newAdminData.role,
      permissions: newAdminData.permissions
    }]);

    if (!error) {
      alert(isAr ? '🛡️ تم منح الصلاحيات السيادية بنجاح' : 'Sovereign permissions granted');
      setNewAdminModal(false);
      setNewAdminData({
        email: '',
        name: '',
        role: 'admin',
        permissions: { manage_stores: true, manage_orders: true, manage_finance: false, manage_admins: false }
      });
      fetchAllData();
    } else {
      alert(error.message);
    }
  };

  const handleDeleteAdmin = async (id, email) => {
    if (email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      alert(isAr ? '⚠️ خطأ سيادي: لا يمكن سحب صلاحيات الإمبراطور الأعظم!' : 'Critical: Master Admin cannot be revoked!');
      return;
    }
    if (!confirm(isAr ? `هل أنت متأكد من تجريد القيادي ${email} من صلاحياته؟` : `Revoke sovereign rights for ${email}?`)) return;

    const { error } = await supabase.from('admin_users').delete().eq('id', id);
    if (!error) {
      setAdminUsers(prev => prev.filter(a => a.id !== id));
    }
  };

  const handleSavePlatformSettings = async () => {
    const { error } = await supabase.from('platform_settings').upsert({
      id: 1,
      exchange_rate: parseFloat(exchangeRate),
      commission_percentage: parseFloat(platformCommission),
      withdraw_threshold: parseFloat(withdrawThreshold),
      updated_at: new Date().toISOString()
    });

    if (!error) {
      alert(isAr ? '⚡ تم تثبيت الإعدادات المالية والسيادية بنجاح' : 'Sovereign financial rules enforced');
    } else {
      alert(error.message);
    }
  };

  const totalStoresCount = stores.length;
  const pendingOrdersCount = orders.filter(o => o.status === 'pending' || !o.status).length;
  const activeStoresCount = stores.filter(s => s.is_active !== false).length;
  const totalSalesAmount = orders.reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0);

  const navItems = [
    { id: 'overview', title: t.navOverview, icon: '⚡', count: null },
    { id: 'merchants', title: t.navStores, icon: '🏛️', count: totalStoresCount },
    { id: 'orders', title: t.navOrders, icon: '⚔️', count: orders.length },
    { id: 'inventory', title: t.navInventory, icon: '🛡️', count: products.length },
    { id: 'admins', title: t.navAdmins, icon: '👑', count: adminUsers.length + 1 },
    { id: 'rates', title: t.navRates, icon: '💎', count: null },
    { id: 'domains', title: t.navDomains, icon: '🌐', count: domains.length },
    { id: 'plans', title: t.navPlans, icon: '🚀', count: null },
    { id: 'audit', title: t.navLogs, icon: '📜', count: auditLogs.length },
    { id: 'broadcast', title: t.navBroadcast, icon: '📢', count: null },
  ];

  const statCards = [
    {
      title: t.statStores,
      value: totalStoresCount.toString(),
      change: '100% صلب',
      icon: '🏛️',
      badgeColor: 'text-[#00B050] bg-[#00B050]/15 border-[#00B050]/30 shadow-xs',
      desc1: t.comparedLastMonth,
      desc2: t.totalReceipts,
      progress: '100%',
    },
    {
      title: t.statPending,
      value: pendingOrdersCount.toString(),
      change: `${pendingOrdersCount} ${t.ordersCount}`,
      icon: '⚔️',
      badgeColor: 'text-amber-400 bg-amber-500/15 border-amber-500/30 shadow-xs',
      desc1: t.underProcess,
      desc2: t.underProcess,
      progress: pendingOrdersCount > 0 ? '60%' : '5%',
    },
    {
      title: t.statActiveUsers,
      value: activeStoresCount.toString(),
      change: `نخبة قوية`,
      icon: '💎',
      badgeColor: 'text-[#00B050] bg-[#00B050]/15 border-[#00B050]/30 shadow-xs',
      desc1: t.activeRate,
      desc2: t.activeRate,
      progress: '100%',
    },
    {
      title: t.statSales,
      value: `${totalSalesAmount.toFixed(2)} ج.م`,
      change: 'سيادة تامة',
      icon: '⚡',
      badgeColor: 'text-[#00B050] bg-[#00B050]/15 border-[#00B050]/30 shadow-xs',
      desc1: t.comparedLastMonth,
      desc2: t.totalReceipts,
      progress: totalSalesAmount > 0 ? '85%' : '10%',
    },
  ];

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center font-sans ${isDark ? 'bg-[#050B14] text-emerald-400' : 'bg-slate-950 text-emerald-400'}`}>
        <div className="animate-pulse tracking-widest text-sm font-black uppercase flex items-center gap-3">
          <span className="inline-block w-3 h-3 bg-[#00B050] rounded-full animate-ping"></span>
          جاري إقلاع نظام القيادة السيادية الفاخرة...
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`min-h-screen font-sans flex relative overflow-x-hidden transition-colors duration-300 select-none ${
        isDark ? 'bg-[#050B14] text-slate-100' : 'bg-[#0B132B] text-slate-100'
      }`} 
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-md transition-opacity"
        />
      )}

      {/* الشريط الجانبي الفاخر والمهيب */}
      <aside className={`fixed top-0 bottom-0 ${isAr ? 'right-0' : 'left-0'} z-50 w-72 shrink-0 border-r border-l flex flex-col justify-between transition-all duration-300 ease-in-out lg:static lg:z-10 lg:translate-x-0 ${
        sidebarOpen 
          ? 'translate-x-0 shadow-2xl shadow-emerald-950/50' 
          : isAr ? 'translate-x-full' : '-translate-x-full'
      } bg-[#081224] border-emerald-900/40 text-white shadow-xl`}>
        
        <div className="p-5 border-b border-emerald-900/40 space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden w-8 h-8 rounded-xl border border-emerald-900 flex items-center justify-center text-slate-400 hover:text-white hover:bg-emerald-950 transition cursor-pointer"
            >
              ✕
            </button>

            <span className="hidden lg:inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#00B050]/20 text-[#00B050] border border-[#00B050]/40 shadow-xs">
              ⚡ SUPREME IMPERIAL
            </span>

            <Link href="/" className="flex items-center gap-2">
              <div className="text-right">
                <div className="flex items-center gap-1 font-black text-base sm:text-lg leading-tight">
                  <span className="text-white">سبايك</span>
                  <span className="text-[#00B050] font-light">|</span>
                  <span className="font-mono text-xs tracking-widest text-[#00B050]">SPIKE</span>
                </div>
                <span className="text-[9px] text-emerald-400/80 block font-bold">السيادة التجارية المطلقة</span>
              </div>
              <img
                src={SPIKE_LOGO_URL}
                alt="SPIKE"
                className="h-8 sm:h-9 w-auto object-contain rounded-xl shadow-md border border-[#00B050]/30"
              />
            </Link>
          </div>

          {/* 👑 زر الانتقال الملكي لمتاجر الأدمن الخاصة بك */}
          <button
            onClick={() => {
              localStorage.setItem('merchant_user_id', 'main_flagship_owner');
              router.push('/dashboard');
            }}
            className="w-full py-2.5 px-3 bg-gradient-to-r from-[#00B050] via-emerald-600 to-emerald-700 hover:from-[#009644] hover:to-emerald-800 text-white rounded-xl text-xs font-black shadow-lg shadow-[#00B050]/30 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer border border-emerald-400/30"
            title="الدخول إلى إمبراطورية متاجر الأدمن الخاصة"
          >
            <span className="text-amber-300 animate-bounce">👑</span>
            <span className="tracking-wide">{t.adminStoresBtn}</span>
          </button>

          <div className="p-1.5 rounded-2xl flex items-center gap-1 border border-emerald-900/50 bg-[#050b14]/80 shadow-inner">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer text-amber-300 hover:bg-emerald-950/50"
            >
              <span>🌙</span>
              <span className="text-[11px]">الوضع الملكي</span>
            </button>

            <button
              type="button"
              onClick={toggleLanguage}
              className="flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer text-slate-300 hover:bg-emerald-950/50"
            >
              <span>🌐</span>
              <span className="text-[11px] font-mono">{isAr ? 'EN' : 'العربية'}</span>
            </button>
          </div>
        </div>

        <nav className="p-3.5 space-y-1.5 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-l from-[#00B050] via-emerald-600 to-emerald-700 text-white shadow-lg shadow-[#00B050]/40 font-black border border-emerald-400/40 translate-x-1'
                    : 'text-slate-300 hover:bg-emerald-950/60 hover:text-white border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base">{item.icon}</span>
                  <span className="tracking-wide">{item.title}</span>
                </div>

                {item.count !== null && (
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold shadow-xs ${
                    isActive
                      ? 'bg-black/30 text-white border border-white/20'
                      : 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-emerald-900/40 bg-[#050b14]/60 flex items-center justify-between">
          <button 
            onClick={handleLogout}
            className="px-3.5 py-2 bg-rose-500/15 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            title={t.logoutText}
          >
            <span>🚪</span>
            <span>{t.logoutText}</span>
          </button>
          <div className="flex items-center gap-2.5 text-right">
            <div className="leading-tight">
              <span className="text-xs font-black text-white block tracking-wide">
                {t.adminRole}
              </span>
              <span className="text-[10px] text-emerald-400/70 block font-mono">{SUPER_ADMIN_EMAIL}</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#00B050] to-emerald-400 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-emerald-500/30 border border-emerald-300/40">
              ⚡
            </div>
          </div>
        </div>
      </aside>

      {/* منطقة المحتوى الفاخرة والمهيبة */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#040810]">
        <header className="px-6 sm:px-10 py-4 border-b border-emerald-900/30 flex items-center justify-between backdrop-blur-xl sticky top-0 z-30 bg-[#081224]/90 shadow-lg shadow-emerald-950/20">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-10 h-10 rounded-xl border border-emerald-900/60 bg-[#050b14] flex items-center justify-center text-lg font-bold text-white hover:bg-emerald-950 transition cursor-pointer shadow-md"
              title="القائمة"
            >
              ☰
            </button>

            <div>
              <div className="flex items-center gap-3">
                <span className="text-base sm:text-xl font-black tracking-wider text-white">
                  {t.overviewTitle}
                </span>
                <span className="hidden sm:inline-block text-[11px] font-black px-2.5 py-0.5 rounded-full bg-[#00B050]/20 text-[#00B050] border border-[#00B050]/40 shadow-xs uppercase tracking-widest">
                  {t.dashboard}
                </span>
              </div>
              <p className="hidden sm:block text-[11px] text-slate-400 font-medium">{t.overviewSubtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button 
              onClick={() => setNewStoreModal(true)}
              className="px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00B050] via-emerald-600 to-emerald-700 hover:from-[#009644] text-white text-xs font-black shadow-lg shadow-[#00B050]/30 transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-1.5 border border-emerald-400/30"
            >
              <span className="text-sm font-bold">+</span>
              <span className="tracking-wide">{t.addStore}</span>
            </button>

            <button 
              onClick={fetchAllData}
              disabled={refreshing}
              className="px-3.5 py-2.5 rounded-xl border border-emerald-900/60 bg-[#050b14] hover:bg-emerald-950/50 text-emerald-400 text-xs font-bold flex items-center gap-1 transition shadow-md cursor-pointer"
              title="تحديث البيانات"
            >
              <span className={refreshing ? 'animate-spin' : ''}>🔄</span>
            </button>

            <button
              onClick={toggleMobileView}
              className={`w-10 h-10 rounded-xl border flex items-center justify-center text-sm transition cursor-pointer shadow-md ${
                isMobileView 
                  ? 'bg-[#00B050] text-white border-emerald-400 shadow-lg shadow-emerald-500/40' 
                  : 'border-emerald-900/60 bg-[#050b14] text-slate-200 hover:bg-emerald-950'
              }`}
              title={isMobileView ? 'التبديل إلى شاشة اللاب توب' : 'التبديل إلى شاشة الهاتف'}
            >
              {isMobileView ? '💻' : '📱'}
            </button>
          </div>
        </header>

        <div className="p-6 sm:p-10 space-y-8">

          {/* تبويب القيادة والتحليلات */}
          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {statCards.map((stat, i) => (
                  <div
                    key={i}
                    className="p-6 rounded-3xl border border-emerald-950 bg-gradient-to-b from-[#081224] to-[#050b14] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-950/50 hover:border-emerald-700/60 flex flex-col justify-between relative overflow-hidden group"
                  >
                    {/* تأثير إضاءة خلفية خفيفة جداً للبطاقات */}
                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#00B050]/10 rounded-full blur-2xl group-hover:bg-[#00B050]/25 transition-all"></div>

                    <div className="flex items-center justify-between mb-5 relative z-10">
                      <span className={`text-[10px] font-black font-mono px-2.5 py-1 rounded-full border ${stat.badgeColor} tracking-wider`}>
                        {stat.change}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400">{stat.title}</span>
                        <span className="text-lg p-2 rounded-2xl bg-emerald-950/80 border border-emerald-800/50 shadow-inner">{stat.icon}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-left relative z-10" dir="ltr">
                      <span className="text-3xl font-black font-mono tracking-tight text-white drop-shadow-sm">
                        {stat.value}
                      </span>
                      <span className="text-[11px] text-emerald-400/80 block font-bold tracking-wide">
                        {stat.desc1}
                      </span>
                    </div>

                    <div className="mt-6 pt-4 border-t border-emerald-900/40 flex justify-between items-center text-[11px] text-slate-400 font-medium relative z-10">
                      <span className="text-slate-300 font-bold">{stat.desc2}</span>
                      <div className="w-28 h-2 bg-emerald-950 rounded-full overflow-hidden p-0.5 border border-emerald-900/60">
                        <div className="h-full bg-gradient-to-r from-[#00B050] to-emerald-400 rounded-full shadow-sm transition-all duration-700" style={{ width: stat.progress }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-8 rounded-3xl border border-emerald-950 bg-gradient-to-b from-[#081224] to-[#050b14] shadow-2xl relative overflow-hidden">
                <div className="flex justify-between items-center mb-6 border-b border-emerald-900/40 pb-4">
                  <div>
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#00B050] animate-ping"></span>
                      {isAr ? 'آخر طلبات المنصة الحية (مراقبة سيادية)' : 'Latest Live Platform Operations'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{isAr ? 'رصد لحظي للعمليات التجارية مع تأكيد الشحن الفوري' : 'Real-time combat synchronization'}</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('orders')}
                    className="text-xs text-[#00B050] font-black hover:text-emerald-400 transition cursor-pointer flex items-center gap-1 bg-emerald-950/60 px-3.5 py-2 rounded-xl border border-emerald-800/60 shadow-sm"
                  >
                    <span>{isAr ? 'عرض كافة العمليات ←' : 'View all operations →'}</span>
                  </button>
                </div>

                {orders.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 text-xs tracking-wider">
                    {isAr ? '— لا توجد عمليات تجارية مسجلة في ساحة المعركة حتى اللحظة —' : '— No recorded operations in the theater yet —'}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-emerald-900/40 text-slate-400 font-bold">
                          <th className="p-3.5 text-right">رقم العملية</th>
                          <th className="p-3.5 text-right">القائد / العميل</th>
                          <th className="p-3.5 text-right">منطقة العمليات</th>
                          <th className="p-3.5 text-right">إجمالي السيولة</th>
                          <th className="p-3.5 text-right">حالة المعركة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-950/60">
                        {orders.slice(0, 5).map((o, idx) => (
                          <tr key={idx} className="hover:bg-emerald-950/30 transition">
                            <td className="p-3.5 font-mono font-black text-emerald-400">#{o.id}</td>
                            <td className="p-3.5 font-bold text-white">{o.customer_name || 'عميل سيادي'}</td>
                            <td className="p-3.5 text-slate-300">{o.governorate || 'القاهرة'}</td>
                            <td className="p-3.5 font-mono font-black text-[#00B050]">{o.total_price} ج.م</td>
                            <td className="p-3.5">
                              <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider">
                                {o.status || 'pending'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* تبويب فريق القيادة */}
          {activeTab === 'admins' && (
            <div className="p-8 rounded-3xl border border-emerald-950 bg-gradient-to-b from-[#081224] to-[#050b14] shadow-2xl">
              <div className="flex justify-between items-center mb-6 border-b border-emerald-900/40 pb-4">
                <div>
                  <h3 className="text-xl font-black text-white">{isAr ? 'مجلس القيادة والصلاحيات السيادية' : 'Supreme Command Board'}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">الحسابات المخولة حصرياً بالتحكم في مفاتيح تشغيل منصة سبايك</p>
                </div>
                <button
                  onClick={() => setNewAdminModal(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#00B050] to-emerald-600 hover:from-[#009644] text-white rounded-2xl text-xs font-black shadow-lg shadow-[#00B050]/30 transition cursor-pointer border border-emerald-400/30"
                >
                  + إضافة قائد ميداني جديد
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-emerald-900/40 text-slate-400 font-bold">
                      <th className="p-3.5 text-right">القائد</th>
                      <th className="p-3.5 text-right">البريد السيادي</th>
                      <th className="p-3 text-right">الرتبة العسكرية</th>
                      <th className="p-3 text-right">صلاحيات السيطرة</th>
                      <th className="p-3.5 text-center">الإجراءات الحربية</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-950/60">
                    <tr className="bg-emerald-950/30">
                      <td className="p-3.5 font-black text-emerald-400 text-sm">حسن حسني (الإمبراطور الأعظم)</td>
                      <td className="p-3.5 font-mono font-bold text-white" dir="ltr">{SUPER_ADMIN_EMAIL}</td>
                      <td className="p-3.5">
                        <span className="px-3 py-1 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-xs uppercase">
                          Supreme Master
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="text-[11px] font-black text-emerald-400">سيطرة مطلقة وغير محدودة على كامل الإمبراطورية</span>
                      </td>
                      <td className="p-3.5 text-center text-amber-400 text-xs font-bold">
                        👑 محمي بالسيادة العليا
                      </td>
                    </tr>

                    {adminUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-emerald-950/20 transition">
                        <td className="p-3.5 font-bold text-white">{user.name}</td>
                        <td className="p-3.5 font-mono text-slate-300" dir="ltr">{user.email}</td>
                        <td className="p-3.5">
                          <span className="px-3 py-1 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-400 border border-blue-500/40 uppercase">
                            {user.role}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
                            {user.permissions?.manage_stores && <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-lg">المتاجر</span>}
                            {user.permissions?.manage_orders && <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-lg">الطلبات</span>}
                            {user.permissions?.manage_finance && <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-lg">المالية</span>}
                            {user.permissions?.manage_admins && <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-lg">الأدمن</span>}
                          </div>
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => handleDeleteAdmin(user.id, user.email)}
                            className="px-3 py-1.5 bg-rose-500/15 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 rounded-xl font-bold text-xs cursor-pointer transition shadow-xs"
                          >
                            تجريد الصلاحية
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* تبويب المتاجر والشركاء */}
          {activeTab === 'merchants' && (
            <div className="p-8 rounded-3xl border border-emerald-950 bg-gradient-to-b from-[#081224] to-[#050b14] shadow-2xl">
              <div className="flex justify-between items-center mb-6 border-b border-emerald-900/40 pb-4">
                <div>
                  <h3 className="text-xl font-black text-white">{isAr ? 'قائمة إمبراطوريات المتاجر والشركاء' : 'Merchant Empires'} ({stores.length})</h3>
                  <p className="text-xs text-slate-400 mt-0.5">السيطرة الكاملة على تفعيل المتاجر، الأرصدة، والوصول المباشر</p>
                </div>
                <button 
                  onClick={() => setNewStoreModal(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#00B050] to-emerald-600 hover:from-[#009644] text-white rounded-2xl text-xs font-black shadow-lg shadow-[#00B050]/30 transition cursor-pointer border border-emerald-400/30"
                >
                  + {t.addStore}
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-emerald-900/40 text-slate-400 font-bold">
                      <th className="p-3.5 text-right">المتجر الإمبراطوري</th>
                      <th className="p-3.5 text-right">القائد المالك</th>
                      <th className="p-3.5 text-right">رقم الاتصال</th>
                      <th className="p-3.5 text-right">السيولة المتاحة</th>
                      <th className="p-3.5 text-right">حالة العمليات</th>
                      <th className="p-3.5 text-center">أوامر السيطرة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-950/60">
                    {stores.map((s, idx) => (
                      <tr key={idx} className="hover:bg-emerald-950/30 transition">
                        <td className="p-3.5">
                          <span className="font-black text-white block text-sm">{s.store_name}</span>
                          <span className="text-[11px] text-emerald-400 font-mono" dir="ltr">{s.store_slug}.spike.shop</span>
                        </td>
                        <td className="p-3.5 font-bold text-slate-200">{s.owner_name || '—'}</td>
                        <td className="p-3.5 font-mono text-slate-300" dir="ltr">{s.phone || '—'}</td>
                        <td className="p-3.5 font-mono font-black text-[#00B050] text-sm">${s.wallet_balance_usd || 0}</td>
                        <td className="p-3.5">
                          <button
                            onClick={() => handleToggleStoreStatus(s.id, s.is_active !== false)}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black cursor-pointer transition shadow-xs ${
                              s.is_active !== false 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                            }`}
                          >
                            {s.is_active !== false ? '⚡ متصل وفعال' : '🛑 مجمد أمنياً'}
                          </button>
                        </td>
                        <td className="p-3.5 text-center space-x-2">
                          <button
                            onClick={() => handleUpdateWallet(s.id, s.wallet_balance_usd || 0)}
                            className="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 rounded-xl text-xs font-bold cursor-pointer transition shadow-xs"
                          >
                            شحن / خصم سيولة
                          </button>
                          <button
                            onClick={() => {
                              localStorage.setItem('merchant_user_id', s.user_id);
                              router.push('/dashboard');
                            }}
                            className="px-3 py-1.5 bg-[#00B050]/20 hover:bg-[#00B050]/40 text-[#00B050] border border-[#00B050]/40 rounded-xl text-xs font-black cursor-pointer transition shadow-xs"
                          >
                            دخول قيادي كتاجر ↗
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* تبويب كافة العمليات والطلبات */}
          {activeTab === 'orders' && (
            <div className="p-8 rounded-3xl border border-emerald-950 bg-gradient-to-b from-[#081224] to-[#050b14] shadow-2xl">
              <div className="flex justify-between items-center mb-6 border-b border-emerald-900/40 pb-4">
                <div>
                  <h3 className="text-xl font-black text-white">{isAr ? 'سجل العمليات والطلبات الكلي' : 'Global Operations & Orders'} ({orders.length})</h3>
                  <p className="text-xs text-slate-400 mt-0.5">متابعة شحنات الدفع عند الاستلام والتأكيد الفوري عبر المنظومة</p>
                </div>
                <button onClick={fetchAllData} className="px-4 py-2 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 rounded-xl text-xs font-bold cursor-pointer transition">مزامنة العمليات</button>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-xs tracking-wider">لا توجد عمليات مسجلة في النظام حالياً</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-emerald-900/40 text-slate-400 font-bold">
                        <th className="p-3.5 text-right">رقم الأوردر</th>
                        <th className="p-3.5 text-right">العميل</th>
                        <th className="p-3.5 text-right">رقم الهاتف</th>
                        <th className="p-3.5 text-right">منطقة التوصيل</th>
                        <th className="p-3 text-right">السيولة</th>
                        <th className="p-3 text-right">الحالة</th>
                        <th className="p-3 text-center">أوامر التوجيه</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-950/60">
                      {orders.map((o, idx) => (
                        <tr key={idx} className="hover:bg-emerald-950/20 transition">
                          <td className="p-3.5 font-mono font-bold text-emerald-400">#{o.id}</td>
                          <td className="p-3.5 font-bold text-white">{o.customer_name}</td>
                          <td className="p-3.5 font-mono text-slate-300" dir="ltr">{o.customer_phone}</td>
                          <td className="p-3.5 text-slate-200">{o.governorate} - {o.address}</td>
                          <td className="p-3.5 font-mono font-black text-[#00B050]">{o.total_price} ج.م</td>
                          <td className="p-3.5">
                            <span className="px-3 py-1 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-300 border border-amber-500/30 uppercase">
                              {o.status || 'pending'}
                            </span>
                          </td>
                          <td className="p-3.5 text-center">
                            <select
                              value={o.status || 'pending'}
                              onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                              className="p-2 bg-[#050b14] border border-emerald-800 text-emerald-300 rounded-xl text-xs font-bold outline-none cursor-pointer shadow-sm"
                            >
                              <option value="pending">بانتظار الشحن</option>
                              <option value="confirmed">تم التأكيد</option>
                              <option value="shipped">جاري الشحن</option>
                              <option value="delivered">تم التسليم بنجاح</option>
                              <option value="cancelled">ملغي</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* تبويب مستودع العتاد والمنتجات */}
          {activeTab === 'inventory' && (
            <div className="p-8 rounded-3xl border border-emerald-950 bg-gradient-to-b from-[#081224] to-[#050b14] shadow-2xl">
              <div className="flex justify-between items-center mb-6 border-b border-emerald-900/40 pb-4">
                <div>
                  <h3 className="text-xl font-black text-white">{isAr ? 'مستودع العتاد والمنتجات المركزي' : 'Central Armory & Inventory'} ({products.length})</h3>
                  <p className="text-xs text-slate-400 mt-0.5">إدارة الأصول والمنتجات ومتابعة مخزون الإمبراطورية</p>
                </div>
                <button
                  onClick={() => setNewProductModal(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#00B050] to-emerald-600 hover:from-[#009644] text-white rounded-2xl text-xs font-black shadow-lg shadow-[#00B050]/30 transition cursor-pointer border border-emerald-400/30"
                >
                  + إطلاق عتاد جديد
                </button>
              </div>

              {products.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-xs tracking-wider">المستودع الإمبراطوري فارغ حالياً</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {products.map((p, idx) => (
                    <div key={idx} className="p-5 rounded-2xl border border-emerald-950 bg-[#050b14] flex flex-col justify-between space-y-4 shadow-md hover:border-emerald-700/60 transition">
                      <div>
                        <span className="font-black text-white text-base block">{p.title}</span>
                        <div className="flex justify-between text-xs text-slate-400 mt-2 font-mono bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-900/40">
                          <span className="text-[#00B050] font-bold">السعر: {p.price} ج.م</span>
                          <span>التكلفة: {p.cost_price || 0} ج.م</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t border-emerald-900/40 text-xs">
                        <span className="text-slate-400">مخزون الصمود: <strong className="text-white">{p.stock_quantity || 0}</strong></span>
                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full text-[10px] font-black">جاهز للانتشار</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* تبويب سعر الصرف والرسوم */}
          {activeTab === 'rates' && (
            <div className="p-8 rounded-3xl border border-emerald-950 bg-gradient-to-b from-[#081224] to-[#050b14] shadow-2xl max-w-2xl">
              <h3 className="text-xl font-black mb-2 text-white">{isAr ? 'إعدادات سعر الصرف والرسوم السيادية' : 'Exchange Rates & Sovereign Fees'}</h3>
              <p className="text-xs text-slate-400 mb-6">يتم تطبيق هذه القواعد المالية فوراً على كامل إمبراطورية المتاجر وسحب الأرباح.</p>
              
              <div className="space-y-5 text-xs font-bold">
                <div>
                  <label className="block text-slate-300 mb-2">سعر تحويل الدولار مقابل الجنيه المصري (USD to EGP)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(e.target.value)}
                    className="w-full p-3.5 rounded-2xl border border-emerald-900 bg-[#050b14] text-white text-sm font-mono outline-none focus:border-[#00B050] shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-2">نسبة عمولة المنصة السيادية (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={platformCommission}
                    onChange={(e) => setPlatformCommission(e.target.value)}
                    className="w-full p-3.5 rounded-2xl border border-emerald-900 bg-[#050b14] text-white text-sm font-mono outline-none focus:border-[#00B050] shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-2">الحد الأدنى لطلب سحب الأرباح بالدولار ($)</label>
                  <input
                    type="number"
                    value={withdrawThreshold}
                    onChange={(e) => setWithdrawThreshold(e.target.value)}
                    className="w-full p-3.5 rounded-2xl border border-emerald-900 bg-[#050b14] text-white text-sm font-mono outline-none focus:border-[#00B050] shadow-inner"
                  />
                </div>

                <button 
                  onClick={handleSavePlatformSettings}
                  className="px-8 py-4 bg-gradient-to-r from-[#00B050] to-emerald-600 hover:from-[#009644] text-white rounded-2xl font-black text-xs shadow-lg shadow-[#00B050]/30 transition cursor-pointer mt-4 border border-emerald-400/30"
                >
                  {t.save}
                </button>
              </div>
            </div>
          )}

          {/* تبويب النطاقات وشبكات DNS */}
          {activeTab === 'domains' && (
            <div className="p-8 rounded-3xl border border-emerald-950 bg-gradient-to-b from-[#081224] to-[#050b14] shadow-2xl">
              <h3 className="text-xl font-black mb-2 text-white">{isAr ? 'إدارة النطاقات وشبكات التوجيه (DNS)' : 'Custom Domains & DNS'}</h3>
              <p className="text-xs text-slate-400 mb-6">مراقبة ربط الدومينات المخصصة عبر Cloudflare و CNAME.</p>
              {domains.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-xs tracking-wider">
                  جميع المتاجر مرتبطة بنطاقات سبايك الفرعية (.spike.shop) بكفاءة تامة.
                </div>
              ) : (
                <div className="space-y-3">
                  {domains.map((d, i) => (
                    <div key={i} className="p-4 border border-emerald-900/60 bg-[#050b14] rounded-2xl flex justify-between items-center text-xs shadow-md">
                      <span className="font-mono text-white text-sm">{d.domain_name}</span>
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full font-bold">{d.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* تبويب المستويات الفاخرة */}
          {activeTab === 'plans' && (
            <div className="p-8 rounded-3xl border border-emerald-950 bg-gradient-to-b from-[#081224] to-[#050b14] shadow-2xl">
              <h3 className="text-xl font-black mb-6 text-white">مستويات الاشتراكات الفاخرة والسيادية</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
                <div className="p-6 border border-emerald-950 bg-[#050b14] rounded-3xl space-y-3 shadow-md">
                  <h4 className="font-black text-sm text-white">الباقة المبتدئة (Starter)</h4>
                  <p className="text-slate-400 leading-relaxed">مجاناً - عمولة 2.5% على كل عملية ناجحة بداخل الإمبراطورية.</p>
                </div>
                <div className="p-6 border border-[#00B050]/60 bg-gradient-to-b from-emerald-950/40 to-[#050b14] rounded-3xl space-y-3 shadow-lg relative">
                  <span className="absolute -top-3 left-6 bg-[#00B050] text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider">الأكثر هيبة</span>
                  <h4 className="font-black text-sm text-[#00B050]">باقة النمو السيادي (Pro)</h4>
                  <p className="text-slate-300 leading-relaxed">29$ شهرياً - عمولة 1% فقط + دعم فني حربي مخصص 24/7.</p>
                </div>
                <div className="p-6 border border-emerald-950 bg-[#050b14] rounded-3xl space-y-3 shadow-md">
                  <h4 className="font-black text-sm text-white">باقة الإمبراطوريات (Scale)</h4>
                  <p className="text-slate-400 leading-relaxed">79$ شهرياً - 0% عمولة + خوادم مستقلة فائقة السرعة وعالية التأمين.</p>
                </div>
              </div>
            </div>
          )}

          {/* تبويب سجل العمليات الاستخباراتي */}
          {activeTab === 'audit' && (
            <div className="p-8 rounded-3xl border border-emerald-950 bg-gradient-to-b from-[#081224] to-[#050b14] shadow-2xl">
              <h3 className="text-xl font-black mb-4 text-white">سجل العمليات الاستخباراتي (Audit Logs)</h3>
              {auditLogs.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-xs tracking-wider">لا توجد حركات استخباراتية مسجلة مؤخراً</div>
              ) : (
                <div className="space-y-2 text-xs font-mono">
                  {auditLogs.map((log, i) => (
                    <div key={i} className="p-4 border border-emerald-900/50 bg-[#050b14] rounded-2xl flex justify-between items-center shadow-xs">
                      <span className="text-white font-bold">{log.action}</span>
                      <span className="text-emerald-400/80">{log.created_at}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* تبويب البث الحربي الجماعي */}
          {activeTab === 'broadcast' && (
            <div className="p-8 rounded-3xl border border-emerald-950 bg-gradient-to-b from-[#081224] to-[#050b14] shadow-2xl max-w-xl">
              <h3 className="text-xl font-black mb-2 text-white">إرسال تعميم حربى / سيادي لجميع التجار</h3>
              <p className="text-xs text-slate-400 mb-6">يظهر هذا التعميم في لوحة تحكم كل التجار فوراً وبشكل بارز.</p>
              <textarea
                rows="4"
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="اكتب التنبيه أو التعميم السيادي هنا..."
                className="w-full p-4 rounded-2xl border border-emerald-900 bg-[#050b14] text-white text-xs mb-4 outline-none focus:border-[#00B050] shadow-inner"
              />
              <button
                onClick={() => {
                  if (!broadcastMessage) return;
                  alert('⚡ تم بث التعميم السيادي لكافة المتاجر بنجاح');
                  setBroadcastMessage('');
                }}
                className="px-6 py-3.5 bg-gradient-to-r from-[#00B050] to-emerald-600 text-white rounded-2xl text-xs font-black cursor-pointer shadow-lg shadow-[#00B050]/30 border border-emerald-400/30"
              >
                بث التعميم فوراً 📢
              </button>
            </div>
          )}
        </div>
      </main>

      {/* مودال نشر إمبراطورية متجر جديد */}
      {newStoreModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="p-8 rounded-3xl max-w-md w-full border border-emerald-800 bg-[#081224] text-white shadow-2xl shadow-emerald-950/50 space-y-5">
            <h3 className="text-lg font-black border-b border-emerald-900/60 pb-3">إطلاق إмبرطورية متجر جديد</h3>
            <form onSubmit={handleCreateStore} className="space-y-3.5 text-xs font-bold">
              <div>
                <label className="block mb-1.5 text-slate-300">اسم المتجر</label>
                <input
                  type="text"
                  required
                  value={newStoreData.store_name}
                  onChange={(e) => setNewStoreData({ ...newStoreData, store_name: e.target.value })}
                  className="w-full p-3 rounded-xl border border-emerald-900 bg-[#050b14] text-white outline-none focus:border-[#00B050]"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-slate-300">النطاق الفرعي (Slug)</label>
                <input
                  type="text"
                  required
                  placeholder="brand-name"
                  value={newStoreData.store_slug}
                  onChange={(e) => setNewStoreData({ ...newStoreData, store_slug: e.target.value })}
                  className="w-full p-3 rounded-xl border border-emerald-900 bg-[#050b14] text-white font-mono outline-none focus:border-[#00B050]"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-slate-300">اسم القائد المالك</label>
                <input
                  type="text"
                  value={newStoreData.owner_name}
                  onChange={(e) => setNewStoreData({ ...newStoreData, owner_name: e.target.value })}
                  className="w-full p-3 rounded-xl border border-emerald-900 bg-[#050b14] text-white outline-none focus:border-[#00B050]"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-slate-300">رقم الهاتف</label>
                <input
                  type="text"
                  value={newStoreData.phone}
                  onChange={(e) => setNewStoreData({ ...newStoreData, phone: e.target.value })}
                  className="w-full p-3 rounded-xl border border-emerald-900 bg-[#050b14] text-white font-mono outline-none focus:border-[#00B050]"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-slate-300">السيولة الأولية للمحفظة ($)</label>
                <input
                  type="number"
                  value={newStoreData.initial_wallet}
                  onChange={(e) => setNewStoreData({ ...newStoreData, initial_wallet: e.target.value })}
                  className="w-full p-3 rounded-xl border border-emerald-900 bg-[#050b14] text-white font-mono outline-none focus:border-[#00B050]"
                />
              </div>
              <div className="flex gap-3 pt-3">
                <button type="submit" className="flex-1 py-3 bg-[#00B050] hover:bg-[#009644] text-white rounded-xl font-black cursor-pointer shadow-md shadow-emerald-600/30">إطلاق المتجر</button>
                <button type="button" onClick={() => setNewStoreModal(false)} className="px-5 py-3 border border-emerald-900 bg-emerald-950/40 text-slate-300 rounded-xl cursor-pointer">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال إطلاق عتاد جديد */}
      {newProductModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="p-8 rounded-3xl max-w-md w-full border border-emerald-800 bg-[#081224] text-white shadow-2xl shadow-emerald-950/50 space-y-5">
            <h3 className="text-lg font-black border-b border-emerald-900/60 pb-3">إطلاق عتاد جديد للمستودع</h3>
            <form onSubmit={handleCreateProduct} className="space-y-3.5 text-xs font-bold">
              <div>
                <label className="block mb-1.5 text-slate-300">اسم العتاد / المنتج</label>
                <input
                  type="text"
                  required
                  value={newProductData.title}
                  onChange={(e) => setNewProductData({ ...newProductData, title: e.target.value })}
                  className="w-full p-3 rounded-xl border border-emerald-900 bg-[#050b14] text-white outline-none focus:border-[#00B050]"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-slate-300">سعر البيع الأساسي (ج.م)</label>
                <input
                  type="number"
                  required
                  value={newProductData.price}
                  onChange={(e) => setNewProductData({ ...newProductData, price: e.target.value })}
                  className="w-full p-3 rounded-xl border border-emerald-900 bg-[#050b14] text-white font-mono outline-none focus:border-[#00B050]"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-slate-300">سعر التكلفة (ج.م)</label>
                <input
                  type="number"
                  value={newProductData.cost_price}
                  onChange={(e) => setNewProductData({ ...newProductData, cost_price: e.target.value })}
                  className="w-full p-3 rounded-xl border border-emerald-900 bg-[#050b14] text-white font-mono outline-none focus:border-[#00B050]"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-slate-300">مخزون الصمود</label>
                <input
                  type="number"
                  value={newProductData.stock}
                  onChange={(e) => setNewProductData({ ...newProductData, stock: e.target.value })}
                  className="w-full p-3 rounded-xl border border-emerald-900 bg-[#050b14] text-white font-mono outline-none focus:border-[#00B050]"
                />
              </div>
              <div className="flex gap-3 pt-3">
                <button type="submit" className="flex-1 py-3 bg-[#00B050] hover:bg-[#009644] text-white rounded-xl font-black cursor-pointer shadow-md shadow-emerald-600/30">إطلاق العتاد</button>
                <button type="button" onClick={() => setNewProductModal(false)} className="px-5 py-3 border border-emerald-900 bg-emerald-950/40 text-slate-300 rounded-xl cursor-pointer">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال منح الصلاحيات السيادية */}
      {newAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="p-8 rounded-3xl max-w-md w-full border border-emerald-800 bg-[#081224] text-white shadow-2xl shadow-emerald-950/50 space-y-5">
            <h3 className="text-lg font-black border-b border-emerald-900/60 pb-3">منح الصلاحيات السيادية لقائد</h3>
            <form onSubmit={handleCreateAdmin} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block mb-1.5 text-slate-300">اسم القائد الميداني</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: أحمد علي"
                  value={newAdminData.name}
                  onChange={(e) => setNewAdminData({ ...newAdminData, name: e.target.value })}
                  className="w-full p-3 rounded-xl border border-emerald-900 bg-[#050b14] text-white outline-none focus:border-[#00B050]"
                />
              </div>

              <div>
                <label className="block mb-1.5 text-slate-300">البريد الإلكتروني السيادي</label>
                <input
                  type="email"
                  required
                  dir="ltr"
                  placeholder="commander@spike.shop"
                  value={newAdminData.email}
                  onChange={(e) => setNewAdminData({ ...newAdminData, email: e.target.value })}
                  className="w-full p-3 rounded-xl border border-emerald-900 bg-[#050b14] text-white font-mono outline-none focus:border-[#00B050]"
                />
              </div>

              <div>
                <label className="block mb-2 text-slate-300">نطاق السيطرة المسموح:</label>
                <div className="space-y-2 p-3.5 rounded-2xl border border-emerald-900/60 bg-[#050b14]">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newAdminData.permissions.manage_stores}
                      onChange={(e) => setNewAdminData({
                        ...newAdminData,
                        permissions: { ...newAdminData.permissions, manage_stores: e.target.checked }
                      })}
                    />
                    <span className="text-slate-200">إدارة الإمبراطوريات والمتاجر (تفعيل وتعطيل)</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newAdminData.permissions.manage_orders}
                      onChange={(e) => setNewAdminData({
                        ...newAdminData,
                        permissions: { ...newAdminData.permissions, manage_orders: e.target.checked }
                      })}
                    />
                    <span className="text-slate-200">إدارة العمليات والطلبات الحربية</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newAdminData.permissions.manage_finance}
                      onChange={(e) => setNewAdminData({
                        ...newAdminData,
                        permissions: { ...newAdminData.permissions, manage_finance: e.target.checked }
                      })}
                    />
                    <span className="text-slate-200">إعدادات السيولة، الرسوم، وسعر الصرف</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newAdminData.permissions.manage_admins}
                      onChange={(e) => setNewAdminData({
                        ...newAdminData,
                        permissions: { ...newAdminData.permissions, manage_admins: e.target.checked }
                      })}
                    />
                    <span className="text-slate-200">تفويض الصلاحيات للقادة الآخرين</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-3 bg-[#00B050] hover:bg-[#009644] text-white rounded-xl font-black cursor-pointer shadow-md shadow-emerald-600/30">
                  تثبيت الصلاحيات
                </button>
                <button type="button" onClick={() => setNewAdminModal(false)} className="px-5 py-3 border border-emerald-900 bg-emerald-950/40 text-slate-300 rounded-xl cursor-pointer">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
