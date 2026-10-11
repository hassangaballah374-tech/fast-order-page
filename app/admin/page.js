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
      dashboard: 'داشبورد',
      overviewTitle: 'نظرة عامة على أداء منصة سبايك',
      overviewSubtitle: 'مؤشرات الأداء اللحظية، طلبات المتاجر، والتسويات المالية',
      addStore: 'إضافة متجر جديد',
      refreshData: 'تحديث البيانات',
      statStores: 'إجمالي المتاجر',
      statPending: 'بانتظار الشحن',
      statActiveUsers: 'العملاء المفعلين',
      statSales: 'إجمالي المبيعات',
      comparedLastMonth: 'مقارنة بالشهر الماضي',
      underProcess: 'تحت التجهيز',
      activeRate: 'معدل التفعيل',
      totalReceipts: 'إجمالي المتحصلات',
      adminRole: 'مدير النظام الأساسي',
      logoutText: 'تسجيل الخروج',
      navOverview: 'الرئيسية والمؤشرات',
      navStores: 'المتاجر والتجار',
      navOrders: 'كافة الطلبات',
      navInventory: 'المنتجات والمخزون',
      navPolicies: 'سياسات سبايك',
      navRates: 'سعر الصرف والعمولة',
      navDomains: 'الدومينات والربط',
      navPlans: 'باقات الاشتراك',
      navLogs: 'سجل الحركات',
      navBroadcast: 'الإعلانات الجماعية',
      navAdmins: 'فريق الإدارة والصلاحيات',
      adminStoresBtn: 'متاجر الأدمن الخاصة',
      ordersCount: 'أوردر',
      activeStatus: 'نشط',
      save: 'حفظ التعديلات',
      cancel: 'إلغاء'
    },
    en: {
      dashboard: 'Dashboard',
      overviewTitle: 'SPIKE Platform Performance Overview',
      overviewSubtitle: 'Real-time KPIs, merchant orders, and financial reconciliations',
      addStore: 'Add New Store',
      refreshData: 'Refresh Data',
      statStores: 'Total Stores',
      statPending: 'Pending Fulfillment',
      statActiveUsers: 'Active Clients',
      statSales: 'Total Sales',
      comparedLastMonth: 'vs last month',
      underProcess: 'Processing',
      activeRate: 'Activation Rate',
      totalReceipts: 'Total Net Volume',
      adminRole: 'Super Admin Master',
      logoutText: 'Sign Out',
      navOverview: 'Overview & Analytics',
      navStores: 'Stores & Merchants',
      navOrders: 'All Orders',
      navInventory: 'Products & Inventory',
      navPolicies: 'Platform Policies',
      navRates: 'Exchange & Fees',
      navDomains: 'Domains & DNS',
      navPlans: 'Subscription Plans',
      navLogs: 'Audit Logs',
      navBroadcast: 'Broadcast Announcements',
      navAdmins: 'Admin Team & Roles',
      adminStoresBtn: 'My Admin Stores',
      ordersCount: 'orders',
      activeStatus: 'Active',
      save: 'Save Changes',
      cancel: 'Cancel'
    }
  }[lang || 'ar'];

  // 🚪 دالة موحدة لجميع المستخدمين لتسجيل الخروج الآمن
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

        alert(isAr ? '⛔ عذراً، غير مسموح لك بالدخول. هذه لوحة تحكم الإدارة العليا.' : 'Access Denied: Admins Only.');
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
      owner_name: newStoreData.owner_name || 'تاجر جديد',
      phone: newStoreData.phone,
      wallet_balance_usd: parseFloat(newStoreData.initial_wallet) || 0,
      is_active: true,
      subscription_status: 'active',
      plan_type: 'starter'
    }]);

    if (!error) {
      alert(isAr ? '✅ تم إنشاء المتجر بنجاح' : 'Store created successfully');
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
    const amount = prompt(isAr ? 'أدخل الرصيد الجديد بالدولار:' : 'Enter new balance in USD:', currentBalance);
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
      alert(isAr ? 'يرجى إدخال اسم المنتج والسعر' : 'Please fill product title and price');
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
      alert(isAr ? '✅ تمت إضافة المنتج بنجاح' : 'Product added successfully');
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
      name: newAdminData.name.trim() || 'مشرف جديد',
      role: newAdminData.role,
      permissions: newAdminData.permissions
    }]);

    if (!error) {
      alert(isAr ? '✅ تمت إضافة المشرف وتعيين الصلاحيات بنجاح' : 'Admin created successfully');
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
      alert(isAr ? '⚠️ لا يمكن حذف حساب المالك الأساسي للنظام!' : 'Primary Super Admin cannot be deleted!');
      return;
    }
    if (!confirm(isAr ? `هل أنت متأكد من إلغاء صلاحيات المسؤول ${email}؟` : `Revoke access for ${email}?`)) return;

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
      alert(isAr ? '✅ تم حفظ إعدادات النظام وسعر الصرف بنجاح' : 'Settings saved successfully');
    } else {
      alert(error.message);
    }
  };

  const totalStoresCount = stores.length;
  const pendingOrdersCount = orders.filter(o => o.status === 'pending' || !o.status).length;
  const activeStoresCount = stores.filter(s => s.is_active !== false).length;
  const totalSalesAmount = orders.reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0);

  const navItems = [
    { id: 'overview', title: t.navOverview, icon: '📊', count: null },
    { id: 'merchants', title: t.navStores, icon: '🏬', count: totalStoresCount },
    { id: 'orders', title: t.navOrders, icon: '📦', count: orders.length },
    { id: 'inventory', title: t.navInventory, icon: '🏷️', count: products.length },
    { id: 'admins', title: t.navAdmins, icon: '🛡️', count: adminUsers.length + 1 },
    { id: 'rates', title: t.navRates, icon: '💱', count: null },
    { id: 'domains', title: t.navDomains, icon: '🌐', count: domains.length },
    { id: 'plans', title: t.navPlans, icon: '💎', count: null },
    { id: 'audit', title: t.navLogs, icon: '📑', count: auditLogs.length },
    { id: 'broadcast', title: t.navBroadcast, icon: '📢', count: null },
  ];

  const statCards = [
    {
      title: t.statStores,
      value: totalStoresCount.toString(),
      change: '+100%',
      icon: '🏬',
      badgeColor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      desc1: t.comparedLastMonth,
      desc2: t.totalReceipts,
      progress: '100%',
    },
    {
      title: t.statPending,
      value: pendingOrdersCount.toString(),
      change: `${pendingOrdersCount} ${t.ordersCount}`,
      icon: '⏳',
      badgeColor: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
      desc1: t.underProcess,
      desc2: t.underProcess,
      progress: pendingOrdersCount > 0 ? '45%' : '0%',
    },
    {
      title: t.statActiveUsers,
      value: activeStoresCount.toString(),
      change: `100% ${t.activeStatus}`,
      icon: '🟢',
      badgeColor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      desc1: t.activeRate,
      desc2: t.activeRate,
      progress: '100%',
    },
    {
      title: t.statSales,
      value: `${totalSalesAmount.toFixed(2)} ج.م`,
      change: '0.00%',
      icon: '💰',
      badgeColor: 'text-[#00B050] bg-[#00B050]/10 border-[#00B050]/20',
      desc1: t.comparedLastMonth,
      desc2: t.totalReceipts,
      progress: totalSalesAmount > 0 ? '60%' : '5%',
    },
  ];

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center font-sans ${isDark ? 'bg-[#0B132B] text-white' : 'bg-[#F4F6F9] text-slate-900'}`}>
        <div className="animate-pulse text-sm font-bold">جاري التحقق الأمني وفتح لوحة الإدارة...</div>
      </div>
    );
  }

  return (
    <div 
      className={`spike-dashboard min-h-screen font-sans flex relative overflow-x-hidden transition-colors duration-200 select-none ${
        isDark ? 'bg-[#0B132B] text-slate-100' : 'bg-[#F4F6F9] text-slate-800'
      }`} 
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* الشريط الجانبي الذكي */}
      <aside className={`fixed top-0 bottom-0 ${isAr ? 'right-0' : 'left-0'} z-50 w-72 shrink-0 border-r border-l flex flex-col justify-between transition-all duration-300 ease-in-out lg:static lg:z-10 lg:translate-x-0 ${
        sidebarOpen 
          ? 'translate-x-0 shadow-2xl' 
          : isAr ? 'translate-x-full' : '-translate-x-full'
      } ${
        isDark 
          ? 'bg-[#0E1E38] border-slate-800 text-white' 
          : 'bg-white border-slate-200 text-slate-900 shadow-lg'
      }`}>
        
        <div className={`p-4 sm:p-5 border-b space-y-3.5 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(false)}
              className={`lg:hidden w-8 h-8 rounded-lg border flex items-center justify-center transition cursor-pointer ${
                isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              ✕
            </button>

            {/* تم التعديل هنا إلى S.A */}
            <span className="hidden lg:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              S.A
            </span>

            <Link href="/" className="flex items-center gap-2">
              <div className="text-right">
                <div className="flex items-center gap-1 font-black text-base sm:text-lg leading-tight">
                  <span className={isDark ? 'text-white' : 'text-slate-900'}>سبايك</span>
                  <span className="text-slate-400 font-light">|</span>
                  <span className="font-mono text-xs tracking-wider text-[#00B050]">SPIKE</span>
                </div>
                <span className="text-[9px] text-slate-400 block font-medium">لوحة التحكم والإدارة</span>
              </div>
              <img
                src={SPIKE_LOGO_URL}
                alt="SPIKE"
                className="h-8 sm:h-9 w-auto object-contain rounded-lg shadow-xs"
              />
            </Link>
          </div>

          {/* 👑 زر الانتقال السريع لمتاجر الأدمن الخاصة بك */}
          <button
            onClick={() => {
              localStorage.setItem('merchant_user_id', 'main_flagship_owner');
              router.push('/dashboard');
            }}
            className="w-full py-2 bg-gradient-to-r from-[#00B050] to-emerald-600 hover:from-[#009644] text-white rounded-xl text-xs font-black shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            title="الدخول إلى متاجر الأدمن الخاصة بك"
          >
            <span>👑</span>
            <span>{t.adminStoresBtn}</span>
          </button>

          <div className={`p-1 rounded-xl flex items-center gap-1 border ${
            isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-100'
          }`}>
            <button
              type="button"
              onClick={toggleTheme}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer active:scale-95 ${
                isDark ? 'hover:bg-slate-800 text-amber-300' : 'hover:bg-white text-slate-700 shadow-2xs'
              }`}
            >
              <span>{isDark ? '☀️' : '🌙'}</span>
              <span className="text-[11px]">{isDark ? 'نهاري' : 'ليلي'}</span>
            </button>

            <button
              type="button"
              onClick={toggleLanguage}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer active:scale-95 ${
                isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-white text-slate-700 shadow-2xs'
              }`}
            >
              <span>🌐</span>
              <span className="text-[11px] font-mono">{isAr ? 'EN' : 'العربية'}</span>
            </button>
          </div>
        </div>

        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
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
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-l from-[#00B050] to-emerald-600 text-white shadow-md shadow-[#00B050]/25 font-black'
                    : isDark
                    ? 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{item.icon}</span>
                  <span>{item.title}</span>
                </div>

                {item.count !== null && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold transition ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : isDark
                      ? 'bg-slate-800 text-slate-400'
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* 🚪 قسم بيانات المشرف وزر تسجيل الخروج تحته تماماً */}
        <div className={`p-4 border-t flex flex-col gap-2.5 ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00B050] to-emerald-400 flex items-center justify-center text-white text-xs font-black shadow-xs shrink-0">
              S
            </div>
            <div className="leading-tight truncate">
              <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {t.adminRole}
              </span>
              <span className="text-[10px] text-slate-400 block font-mono truncate">{SUPER_ADMIN_EMAIL}</span>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer"
            title={t.logoutText}
          >
            <span>🚪</span>
            <span>{t.logoutText}</span>
          </button>
        </div>
      </aside>

      {/* منطقة المحتوى الرئيسية */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className={`px-4 sm:px-8 py-4 border-b flex items-center justify-between backdrop-blur-md sticky top-0 z-30 transition-colors ${
          isDark ? 'bg-[#0B132B]/95 border-slate-800' : 'bg-white/95 border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className={`lg:hidden w-9 h-9 rounded-xl border flex items-center justify-center text-lg font-bold transition active:scale-95 cursor-pointer shadow-xs ${
                isDark 
                  ? 'border-slate-700 bg-slate-800 text-white hover:bg-slate-700' 
                  : 'border-slate-200 bg-slate-100 text-slate-800 hover:bg-slate-200'
              }`}
              title="القائمة"
            >
              ☰
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className={`text-base sm:text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {t.overviewTitle}
                </span>
                <span className={`hidden sm:inline-block text-[11px] font-bold px-2 py-0.5 rounded-md ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
                  {t.dashboard}
                </span>
              </div>
              <p className="hidden sm:block text-[11px] text-slate-500 dark:text-slate-400">{t.overviewSubtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setNewStoreModal(true)}
              className="px-3 sm:px-4 py-2 rounded-xl bg-[#00B050] hover:bg-[#009644] text-white text-xs font-black shadow-sm transition cursor-pointer flex items-center gap-1 active:scale-95"
            >
              <span>+</span>
              <span className="hidden sm:inline">{t.addStore}</span>
              <span className="sm:hidden">متجر</span>
            </button>

            <button 
              onClick={fetchAllData}
              disabled={refreshing}
              className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                isDark 
                  ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700' 
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 shadow-2xs'
              }`}
              title="تحديث البيانات"
            >
              <span className={refreshing ? 'animate-spin' : ''}>🔄</span>
            </button>

            <button
              onClick={toggleMobileView}
              className={`w-9 h-9 rounded-xl border flex items-center justify-center text-sm transition cursor-pointer ${
                isMobileView 
                  ? 'bg-[#00B050] text-white border-[#00B050] shadow-xs' 
                  : isDark 
                  ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700' 
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 shadow-2xs'
              }`}
              title={isMobileView ? 'التبديل إلى شاشة اللاب توب' : 'التبديل إلى شاشة الهاتف'}
            >
              {isMobileView ? '💻' : '📱'}
            </button>
          </div>
        </header>

        <div className="p-4 sm:p-8 space-y-6">

          {/* تبويب الرئيسية والمؤشرات */}
          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {statCards.map((stat, i) => (
                  <div
                    key={i}
                    className={`p-5 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg flex flex-col justify-between ${
                      isDark 
                        ? 'bg-[#0E1E38] border-slate-800 hover:border-slate-700' 
                        : 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-md border ${stat.badgeColor}`}>
                        {stat.change}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{stat.title}</span>
                        <span className="text-base">{stat.icon}</span>
                      </div>
                    </div>

                    <div className="space-y-1 text-left" dir="ltr">
                      <span className="text-2xl font-black font-mono tracking-tight block">
                        {stat.value}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        {stat.desc1}
                      </span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-center text-[10px] text-slate-400 font-medium">
                      <span>{stat.desc2}</span>
                      <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: stat.progress }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className={`p-6 sm:p-8 rounded-3xl border transition-colors ${
                isDark ? 'bg-[#0E1E38] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-base font-black">{isAr ? 'آخر طلبات المنصة الحية' : 'Latest Live Platform Orders'}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{isAr ? 'مزامنة لحظية للعمليات مع تأكيد الدفع والشحن' : 'Real-time sync'}</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('orders')}
                    className="text-xs text-[#00B050] font-bold hover:underline cursor-pointer"
                  >
                    {isAr ? 'عرض كل الطلبات ←' : 'View all orders →'}
                  </button>
                </div>

                {orders.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    {isAr ? 'لا توجد طلبات مسجلة حتى اللحظة' : 'No recorded orders yet'}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400">
                          <th className="p-3 text-right">رقم الطلب</th>
                          <th className="p-3 text-right">العميل</th>
                          <th className="p-3 text-right">المحافظة</th>
                          <th className="p-3 text-right">الإجمالي</th>
                          <th className="p-3 text-right">الحالة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.slice(0, 5).map((o, idx) => (
                          <tr key={idx} className="border-b border-slate-100 dark:border-slate-800/50">
                            <td className="p-3 font-mono font-bold">#{o.id}</td>
                            <td className="p-3">{o.customer_name || 'عميل نقدي'}</td>
                            <td className="p-3">{o.governorate || 'القاهرة'}</td>
                            <td className="p-3 font-mono font-bold text-[#00B050]">{o.total_price} ج.م</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 text-[10px] font-bold">
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

          {/* تبويب فريق الإدارة والصلاحيات */}
          {activeTab === 'admins' && (
            <div className={`p-4 sm:p-6 rounded-2xl border ${isDark ? 'bg-[#0E1E38] border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-black">{isAr ? 'فريق إدارة منصة سبايك' : 'Platform Admins & Roles'}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">الحسابات المصرح لها حصرياً بالدخول والتحكم في الداشبورد</p>
                </div>
                <button
                  onClick={() => setNewAdminModal(true)}
                  className="px-4 py-2 bg-[#00B050] hover:bg-[#009644] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  + إضافة مشرف جديد
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                      <th className="p-3 text-right">المسؤول</th>
                      <th className="p-3 text-right">البريد الإلكتروني</th>
                      <th className="p-3 text-right">الرتبة</th>
                      <th className="p-3 text-right">الصلاحيات الممنوحة</th>
                      <th className="p-3 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-100 dark:border-slate-800/50 bg-emerald-500/5">
                      <td className="p-3 font-black text-emerald-600 dark:text-emerald-400">حسن حسني (المالك)</td>
                      <td className="p-3 font-mono font-bold" dir="ltr">{SUPER_ADMIN_EMAIL}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-500/10 text-rose-500 border border-rose-500/20">
                          S.A
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">تحكم كامل ومطلق بكافة أقسام المنظومة</span>
                      </td>
                      <td className="p-3 text-center text-slate-400 text-[10px]">
                        🔒 محمي بالنظام
                      </td>
                    </tr>

                    {adminUsers.map((user) => (
                      <tr key={user.id} className="border-b border-slate-100 dark:border-slate-800/50">
                        <td className="p-3 font-bold">{user.name}</td>
                        <td className="p-3 font-mono" dir="ltr">{user.email}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                            {user.role}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1 text-[10px]">
                            {user.permissions?.manage_stores && <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">المتاجر</span>}
                            {user.permissions?.manage_orders && <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">الطلبات</span>}
                            {user.permissions?.manage_finance && <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">المالية</span>}
                            {user.permissions?.manage_admins && <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">الأدمن</span>}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleDeleteAdmin(user.id, user.email)}
                            className="text-rose-500 hover:text-rose-600 font-bold text-xs cursor-pointer"
                          >
                            إلغاء الصلاحية
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* تبويب المتاجر والتجار */}
          {activeTab === 'merchants' && (
            <div className={`p-4 sm:p-6 rounded-2xl border ${isDark ? 'bg-[#0E1E38] border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-black">{isAr ? 'قائمة المتاجر والتجار' : 'Stores & Merchants'} ({stores.length})</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{isAr ? 'التحكم في تفعيل المتاجر والأرصدة' : 'Manage stores and balances'}</p>
                </div>
                <button 
                  onClick={() => setNewStoreModal(true)}
                  className="px-4 py-2 bg-[#00B050] text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  + {t.addStore}
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                      <th className="p-3 text-right">المتجر</th>
                      <th className="p-3 text-right">المالك</th>
                      <th className="p-3 text-right">الهاتف</th>
                      <th className="p-3 text-right">رصيد المحفظة</th>
                      <th className="p-3 text-right">الحالة</th>
                      <th className="p-3 text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stores.map((s, idx) => (
                      <tr key={idx} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3">
                          <span className="font-bold block">{s.store_name}</span>
                          <span className="text-[10px] text-slate-400 font-mono" dir="ltr">{s.store_slug}.spike.shop</span>
                        </td>
                        <td className="p-3">{s.owner_name || '—'}</td>
                        <td className="p-3 font-mono" dir="ltr">{s.phone || '—'}</td>
                        <td className="p-3 font-mono font-bold text-emerald-500">${s.wallet_balance_usd || 0}</td>
                        <td className="p-3">
                          <button
                            onClick={() => handleToggleStoreStatus(s.id, s.is_active !== false)}
                            className={`px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer transition ${
                              s.is_active !== false 
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
                                : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {s.is_active !== false ? 'مفعل' : 'معطل'}
                          </button>
                        </td>
                        <td className="p-3 text-center space-x-2">
                          <button
                            onClick={() => handleUpdateWallet(s.id, s.wallet_balance_usd || 0)}
                            className="px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded text-[11px] font-bold cursor-pointer"
                          >
                            شحن/خصم
                          </button>
                          <button
                            onClick={() => {
                              localStorage.setItem('merchant_user_id', s.user_id);
                              router.push('/dashboard');
                            }}
                            className="px-2 py-1 bg-[#00B050]/15 text-[#00B050] rounded text-[11px] font-bold cursor-pointer"
                          >
                            دخول كتاجر ↗
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* تبويب كافة الطلبات */}
          {activeTab === 'orders' && (
            <div className={`p-4 sm:p-6 rounded-2xl border ${isDark ? 'bg-[#0E1E38] border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-black">{isAr ? 'كافة طلبات المنصة' : 'All Platform Orders'} ({orders.length})</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">تحديث وتأكيد طلبات الدفع عند الاستلام والشحن</p>
                </div>
                <button onClick={fetchAllData} className="px-3 py-1.5 border rounded-lg text-xs font-bold cursor-pointer">تحديث</button>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">لا توجد طلبات حتى الآن</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                        <th className="p-3 text-right">رقم الطلب</th>
                        <th className="p-3 text-right">العميل</th>
                        <th className="p-3 text-right">الهاتف</th>
                        <th className="p-3 text-right">المحافظة / العنوان</th>
                        <th className="p-3 text-right">المبلغ</th>
                        <th className="p-3 text-right">الحالة</th>
                        <th className="p-3 text-center">تحديث الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((o, idx) => (
                        <tr key={idx} className="border-b border-slate-100 dark:border-slate-800/50">
                          <td className="p-3 font-mono font-bold">#{o.id}</td>
                          <td className="p-3 font-bold">{o.customer_name}</td>
                          <td className="p-3 font-mono" dir="ltr">{o.customer_phone}</td>
                          <td className="p-3">{o.governorate} - {o.address}</td>
                          <td className="p-3 font-mono font-bold text-[#00B050]">{o.total_price} ج.م</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500">
                              {o.status || 'pending'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <select
                              value={o.status || 'pending'}
                              onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                              className="p-1 border rounded text-[11px] bg-transparent cursor-pointer"
                            >
                              <option value="pending">بانتظار الشحن</option>
                              <option value="confirmed">تم التأكيد</option>
                              <option value="shipped">تم الشحن</option>
                              <option value="delivered">تم التسليم</option>
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

          {/* تبويب المنتجات والمخزون */}
          {activeTab === 'inventory' && (
            <div className={`p-4 sm:p-6 rounded-2xl border ${isDark ? 'bg-[#0E1E38] border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-black">{isAr ? 'المنتجات والمخزون' : 'Products & Inventory'} ({products.length})</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">إدارة المنتجات، تكلفة التوريد، وسعر البيع المقترح</p>
                </div>
                <button
                  onClick={() => setNewProductModal(true)}
                  className="px-4 py-2 bg-[#00B050] text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  + إضافة منتج جديد
                </button>
              </div>

              {products.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">المخزون فارغ حالياً، قم بإضافة أول منتج</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {products.map((p, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3">
                      <div>
                        <span className="font-bold text-sm block">{p.title}</span>
                        <div className="flex justify-between text-xs text-slate-400 mt-2 font-mono">
                          <span>سعر البيع: {p.price} ج.م</span>
                          <span>التكلفة: {p.cost_price || 0} ج.م</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                        <span className="text-slate-400">المخزون: <strong>{p.stock_quantity || 0}</strong></span>
                        <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded text-[10px] font-bold">متوفر</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* تبويب سعر الصرف والعمولة */}
          {activeTab === 'rates' && (
            <div className={`p-6 sm:p-8 rounded-2xl border max-w-2xl ${isDark ? 'bg-[#0E1E38] border-slate-800' : 'bg-white border-slate-200'}`}>
              <h3 className="text-lg font-black mb-2">{isAr ? 'إعدادات سعر الصرف والعمولات المالية' : 'Exchange Rates & Fees'}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">يتم تطبيق هذه الإعدادات لحظياً على حسابات جميع المتاجر وسحب الأرباح.</p>
              
              <div className="space-y-4 text-xs font-bold">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1.5">سعر تحويل الدولار مقابل الجنيه المصري (USD to EGP)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm font-mono outline-none focus:border-[#00B050]"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1.5">نسبة عمولة المنصة من كل طلب ناجح (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={platformCommission}
                    onChange={(e) => setPlatformCommission(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm font-mono outline-none focus:border-[#00B050]"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1.5">الحد الأدنى لطلب سحب الأرباح بالدولار ($)</label>
                  <input
                    type="number"
                    value={withdrawThreshold}
                    onChange={(e) => setWithdrawThreshold(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm font-mono outline-none focus:border-[#00B050]"
                  />
                </div>

                <button 
                  onClick={handleSavePlatformSettings}
                  className="px-6 py-3 bg-[#00B050] text-white rounded-xl font-black text-xs hover:bg-[#009644] transition cursor-pointer mt-4"
                >
                  {t.save}
                </button>
              </div>
            </div>
          )}

          {/* تبويب الدومينات */}
          {activeTab === 'domains' && (
            <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#0E1E38] border-slate-800' : 'bg-white border-slate-200'}`}>
              <h3 className="text-lg font-black mb-2">{isAr ? 'إدارة الدومينات المخصصة والربط' : 'Custom Domains & DNS'}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">حالة طلبات الدومينات المخصصة والربط بسيرفرات سبايك عبر Cloudflare و CNAME.</p>
              {domains.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  جميع المتاجر تستخدم النطاق المباشر الفرعي (.spike.shop) بشكل مستقر.
                </div>
              ) : (
                <div className="space-y-2">
                  {domains.map((d, i) => (
                    <div key={i} className="p-3 border rounded-xl flex justify-between items-center text-xs">
                      <span className="font-mono">{d.domain_name}</span>
                      <span className="text-emerald-500 font-bold">{d.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* تبويب الباقات */}
          {activeTab === 'plans' && (
            <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#0E1E38] border-slate-800' : 'bg-white border-slate-200'}`}>
              <h3 className="text-lg font-black mb-4">باقات الاشتراك المتاحة</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 border rounded-xl space-y-2">
                  <h4 className="font-black text-sm">الباقة المبتدئة (Starter)</h4>
                  <p className="text-slate-500 dark:text-slate-400">مجاناً - عمولة 2.5% على كل طلب ناجح</p>
                </div>
                <div className="p-4 border rounded-xl border-[#00B050] space-y-2">
                  <h4 className="font-black text-sm text-[#00B050]">باقة النمو (Pro)</h4>
                  <p className="text-slate-500 dark:text-slate-400">29$ شهرياً - عمولة 1% فقط + دعم فني مخصص</p>
                </div>
                <div className="p-4 border rounded-xl space-y-2">
                  <h4 className="font-black text-sm">باقة الشركات (Scale)</h4>
                  <p className="text-slate-500 dark:text-slate-400">79$ شهرياً - 0% عمولة + خوادم مستقلة فائقة السرعة</p>
                </div>
              </div>
            </div>
          )}

          {/* تبويب سجل الحركات */}
          {activeTab === 'audit' && (
            <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#0E1E38] border-slate-800' : 'bg-white border-slate-200'}`}>
              <h3 className="text-lg font-black mb-4">سجل الحركات الإدارية (Audit Logs)</h3>
              {auditLogs.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">لا توجد حركات مسجلة مؤخراً</div>
              ) : (
                <div className="space-y-2 text-xs font-mono">
                  {auditLogs.map((log, i) => (
                    <div key={i} className="p-3 border rounded-xl flex justify-between">
                      <span>{log.action}</span>
                      <span className="text-slate-400">{log.created_at}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* تبويب الإعلانات الجماعية */}
          {activeTab === 'broadcast' && (
            <div className={`p-6 sm:p-8 rounded-2xl border max-w-xl ${isDark ? 'bg-[#0E1E38] border-slate-800' : 'bg-white border-slate-200'}`}>
              <h3 className="text-lg font-black mb-2">إرسال تنبيه جماعي لجميع التجار</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">يظهر التنبيه داخل لوحة تحكم كل التجار المسجلين في المنصة فوراً.</p>
              <textarea
                rows="4"
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="اكتب التنبيه هنا..."
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-xs mb-3 outline-none focus:border-[#00B050]"
              />
              <button
                onClick={() => {
                  if (!broadcastMessage) return;
                  alert('✅ تم إرسال التنبيه الجماعي بنجاح');
                  setBroadcastMessage('');
                }}
                className="px-5 py-2.5 bg-[#00B050] text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                إرسال الإعلان الآن
              </button>
            </div>
          )}
        </div>
      </main>

      {/* مودال إنشاء متجر جديد */}
      {newStoreModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className={`p-6 rounded-2xl max-w-md w-full border ${isDark ? 'bg-[#0E1E38] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
            <h3 className="text-base font-black mb-4">إنشاء متجر جديد في المنصة</h3>
            <form onSubmit={handleCreateStore} className="space-y-3 text-xs">
              <div>
                <label className="block mb-1">اسم المتجر</label>
                <input
                  type="text"
                  required
                  value={newStoreData.store_name}
                  onChange={(e) => setNewStoreData({ ...newStoreData, store_name: e.target.value })}
                  className="w-full p-2.5 rounded-lg border bg-transparent outline-none focus:border-[#00B050]"
                />
              </div>
              <div>
                <label className="block mb-1">الدومين الفرعي (Slug)</label>
                <input
                  type="text"
                  required
                  placeholder="brand-name"
                  value={newStoreData.store_slug}
                  onChange={(e) => setNewStoreData({ ...newStoreData, store_slug: e.target.value })}
                  className="w-full p-2.5 rounded-lg border bg-transparent font-mono outline-none focus:border-[#00B050]"
                />
              </div>
              <div>
                <label className="block mb-1">اسم المالك</label>
                <input
                  type="text"
                  value={newStoreData.owner_name}
                  onChange={(e) => setNewStoreData({ ...newStoreData, owner_name: e.target.value })}
                  className="w-full p-2.5 rounded-lg border bg-transparent outline-none focus:border-[#00B050]"
                />
              </div>
              <div>
                <label className="block mb-1">رقم الهاتف</label>
                <input
                  type="text"
                  value={newStoreData.phone}
                  onChange={(e) => setNewStoreData({ ...newStoreData, phone: e.target.value })}
                  className="w-full p-2.5 rounded-lg border bg-transparent font-mono outline-none focus:border-[#00B050]"
                />
              </div>
              <div>
                <label className="block mb-1">الرصيد الأولي ($)</label>
                <input
                  type="number"
                  value={newStoreData.initial_wallet}
                  onChange={(e) => setNewStoreData({ ...newStoreData, initial_wallet: e.target.value })}
                  className="w-full p-2.5 rounded-lg border bg-transparent font-mono outline-none focus:border-[#00B050]"
                />
              </div>
              <div className="flex gap-2 pt-3">
                <button type="submit" className="flex-1 py-2.5 bg-[#00B050] text-white rounded-xl font-bold cursor-pointer">إنشاء المتجر</button>
                <button type="button" onClick={() => setNewStoreModal(false)} className="px-4 py-2.5 border rounded-xl cursor-pointer">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال إضافة منتج جديد */}
      {newProductModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className={`p-6 rounded-2xl max-w-md w-full border ${isDark ? 'bg-[#0E1E38] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
            <h3 className="text-base font-black mb-4">إضافة منتج للمخزون</h3>
            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="block mb-1">اسم المنتج</label>
                <input
                  type="text"
                  required
                  value={newProductData.title}
                  onChange={(e) => setNewProductData({ ...newProductData, title: e.target.value })}
                  className="w-full p-2.5 rounded-lg border bg-transparent outline-none focus:border-[#00B050]"
                />
              </div>
              <div>
                <label className="block mb-1">سعر البيع (ج.م)</label>
                <input
                  type="number"
                  required
                  value={newProductData.price}
                  onChange={(e) => setNewProductData({ ...newProductData, price: e.target.value })}
                  className="w-full p-2.5 rounded-lg border bg-transparent font-mono outline-none focus:border-[#00B050]"
                />
              </div>
              <div>
                <label className="block mb-1">سعر التكلفة (ج.م)</label>
                <input
                  type="number"
                  value={newProductData.cost_price}
                  onChange={(e) => setNewProductData({ ...newProductData, cost_price: e.target.value })}
                  className="w-full p-2.5 rounded-lg border bg-transparent font-mono outline-none focus:border-[#00B050]"
                />
              </div>
              <div>
                <label className="block mb-1">الكمية بالمخزن</label>
                <input
                  type="number"
                  value={newProductData.stock}
                  onChange={(e) => setNewProductData({ ...newProductData, stock: e.target.value })}
                  className="w-full p-2.5 rounded-lg border bg-transparent font-mono outline-none focus:border-[#00B050]"
                />
              </div>
              <div className="flex gap-2 pt-3">
                <button type="submit" className="flex-1 py-2.5 bg-[#00B050] text-white rounded-xl font-bold cursor-pointer">إضافة المنتج</button>
                <button type="button" onClick={() => setNewProductModal(false)} className="px-4 py-2.5 border rounded-xl cursor-pointer">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال إضافة مشرف جديد وتحديد الصلاحيات */}
      {newAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className={`p-6 rounded-2xl max-w-md w-full border ${isDark ? 'bg-[#0E1E38] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
            <h3 className="text-base font-black mb-4">إضافة مشرف وتحديد الصلاحيات</h3>
            <form onSubmit={handleCreateAdmin} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block mb-1">اسم المشرف</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: أحمد علي"
                  value={newAdminData.name}
                  onChange={(e) => setNewAdminData({ ...newAdminData, name: e.target.value })}
                  className="w-full p-2.5 rounded-lg border bg-transparent outline-none focus:border-[#00B050]"
                />
              </div>

              <div>
                <label className="block mb-1">البريد الإلكتروني المعتمد</label>
                <input
                  type="email"
                  required
                  dir="ltr"
                  placeholder="admin@example.com"
                  value={newAdminData.email}
                  onChange={(e) => setNewAdminData({ ...newAdminData, email: e.target.value })}
                  className="w-full p-2.5 rounded-lg border bg-transparent font-mono outline-none focus:border-[#00B050]"
                />
              </div>

              <div>
                <label className="block mb-2">تحديد الصلاحيات المسموح بها:</label>
                <div className="space-y-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newAdminData.permissions.manage_stores}
                      onChange={(e) => setNewAdminData({
                        ...newAdminData,
                        permissions: { ...newAdminData.permissions, manage_stores: e.target.checked }
                      })}
                    />
                    <span>إدارة المتاجر (تفعيل، تعطيل، تعديل الأرصدة)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newAdminData.permissions.manage_orders}
                      onChange={(e) => setNewAdminData({
                        ...newAdminData,
                        permissions: { ...newAdminData.permissions, manage_orders: e.target.checked }
                      })}
                    />
                    <span>إدارة ومتابعة طلبات الشحن</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newAdminData.permissions.manage_finance}
                      onChange={(e) => setNewAdminData({
                        ...newAdminData,
                        permissions: { ...newAdminData.permissions, manage_finance: e.target.checked }
                      })}
                    />
                    <span>إعدادات المالية، العمولة، وسعر الصرف</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newAdminData.permissions.manage_admins}
                      onChange={(e) => setNewAdminData({
                        ...newAdminData,
                        permissions: { ...newAdminData.permissions, manage_admins: e.target.checked }
                      })}
                    />
                    <span>إضافة وتعديل صلاحيات المشرفين الآخرين</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2.5 bg-[#00B050] text-white rounded-xl font-bold cursor-pointer">
                  حفظ المشرف
                </button>
                <button type="button" onClick={() => setNewAdminModal(false)} className="px-4 py-2.5 border rounded-xl cursor-pointer">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800&display=swap');

        .spike-dashboard {
          --spike-teal: #078b91;
          --spike-teal-dark: #05777d;
          --spike-orange: #f5a56b;
          --spike-cream: #e8e5d0;
          --spike-paper: #fbfbfa;
          --spike-ink: #25313b;
          --spike-muted: #7e8991;
          font-family: 'Cairo', 'Inter', sans-serif !important;
          background: var(--spike-cream) !important;
          color: var(--spike-ink);
          letter-spacing: 0;
        }
        .spike-dashboard * { box-sizing: border-box; }
        .spike-dashboard button,
        .spike-dashboard input,
        .spike-dashboard select,
        .spike-dashboard textarea { font-family: inherit; }
        .spike-dashboard button { transition: background-color .18s ease, border-color .18s ease, box-shadow .18s ease, transform .18s ease; }
        .spike-dashboard button:focus-visible,
        .spike-dashboard input:focus-visible,
        .spike-dashboard select:focus-visible,
        .spike-dashboard textarea:focus-visible {
          outline: 3px solid rgba(7,139,145,.2);
          outline-offset: 2px;
        }
        .spike-dashboard aside {
          background: #f8f8f6 !important;
          border-color: #e5e7e4 !important;
          box-shadow: 8px 0 32px rgba(35,55,57,.035);
        }
        .spike-dashboard header {
          background: rgba(250,250,248,.94) !important;
          border-color: #e7e9e5 !important;
          box-shadow: 0 4px 18px rgba(35,55,57,.025) !important;
        }
        .spike-dashboard .bg-white,
        .spike-dashboard [class~="bg-[#0E1E38]"],
        .spike-dashboard [class~="bg-[#0B132B]"] {
          background-color: var(--spike-paper) !important;
        }
        .spike-dashboard [class~="bg-[#F4F6F9]"] { background-color: var(--spike-cream) !important; }
        .spike-dashboard [class~="bg-[#00B050]"],
        .spike-dashboard [class~="from-[#00B050]"] {
          background-color: var(--spike-teal) !important;
        }
        .spike-dashboard [class~="bg-gradient-to-r"],
        .spike-dashboard [class~="bg-gradient-to-l"],
        .spike-dashboard [class~="bg-gradient-to-tr"] {
          background-image: linear-gradient(120deg, var(--spike-teal), #087d86) !important;
        }
        .spike-dashboard [class~="hover:bg-[#009644]"]:hover,
        .spike-dashboard [class~="hover:from-[#009644]"]:hover,
        .spike-dashboard [class~="hover:bg-emerald-600"]:hover {
          background-color: var(--spike-teal-dark) !important;
        }
        .spike-dashboard [class~="text-[#00B050]"],
        .spike-dashboard [class~="text-emerald-500"],
        .spike-dashboard [class~="text-emerald-600"] { color: var(--spike-teal) !important; }
        .spike-dashboard [class~="border-[#00B050]"] { border-color: var(--spike-teal) !important; }
        .spike-dashboard [class~="bg-amber-500"] { background-color: var(--spike-orange) !important; }
        .spike-dashboard [class~="text-amber-500"],
        .spike-dashboard [class~="text-amber-600"] { color: #bd713d !important; }
        .spike-dashboard [class~="bg-[#0E1E38]"],
        .spike-dashboard [class~="bg-slate-50"],
        .spike-dashboard [class~="bg-slate-100"] { background-color: #f2f4f2 !important; }
        .spike-dashboard [class~="border-slate-200"],
        .spike-dashboard [class~="border-slate-300"] { border-color: #e3e7e4 !important; }
        .spike-dashboard [class~="rounded-2xl"],
        .spike-dashboard [class~="rounded-3xl"] { border-radius: 21px !important; }
        .spike-dashboard [class~="rounded-xl"] { border-radius: 14px !important; }
        .spike-dashboard [class~="shadow-lg"],
        .spike-dashboard [class~="shadow-md"],
        .spike-dashboard [class~="shadow-sm"] { box-shadow: 0 7px 22px rgba(38,58,60,.055) !important; }
        .spike-dashboard main > div { scrollbar-color: #c4d4d1 transparent; }
        .spike-dashboard table { border-collapse: separate; border-spacing: 0; }
        .spike-dashboard thead th {
          background: #f1f4f2;
          color: #78858a;
          font-size: 11px;
          font-weight: 800;
          white-space: nowrap;
        }
        .spike-dashboard tbody tr { transition: background-color .15s ease; }
        .spike-dashboard tbody tr:hover { background-color: #f0f7f6; }
        .spike-dashboard input:not([type="checkbox"]):not([type="radio"]),
        .spike-dashboard select,
        .spike-dashboard textarea {
          border-color: #dfe5e2 !important;
          border-radius: 12px !important;
          background-color: #fff !important;
          color: #26343a !important;
          box-shadow: inset 0 1px 2px rgba(20,40,40,.025);
        }
        .spike-dashboard input:focus,
        .spike-dashboard select:focus,
        .spike-dashboard textarea:focus {
          border-color: var(--spike-teal) !important;
          box-shadow: 0 0 0 3px rgba(7,139,145,.10) !important;
          outline: none;
        }
        .spike-dashboard button[class*="bg-[#00B050]"],
        .spike-dashboard button[class*="from-[#00B050]"] {
          background: var(--spike-teal) !important;
          color: #fff !important;
          border-color: var(--spike-teal) !important;
          box-shadow: 0 5px 12px rgba(7,139,145,.16);
        }
        .spike-dashboard button[class*="bg-[#00B050]"]:hover,
        .spike-dashboard button[class*="from-[#00B050]"]:hover {
          background: var(--spike-teal-dark) !important;
          transform: translateY(-1px);
        }
        .spike-dashboard nav button[class*="bg-gradient"] {
          background: var(--spike-teal) !important;
          box-shadow: 0 6px 16px rgba(7,139,145,.2) !important;
        }
        .spike-dashboard nav button:not([class*="bg-gradient"]):hover {
          background: #eaf3f1 !important;
          color: var(--spike-teal) !important;
        }
        .spike-dashboard [class*="bg-rose-500/10"] { background-color: #fff0ed !important; }
        .spike-dashboard [class*="text-rose-500"] { color: #c95e53 !important; }
        .spike-dashboard [class*="bg-emerald-500/10"],
        .spike-dashboard [class*="bg-emerald-500/15"] { background-color: #e7f4f0 !important; }
        .spike-dashboard [class*="border-emerald-500"] { border-color: #c9e6dc !important; }
        .spike-dashboard [class*="bg-amber-500/10"] { background-color: #fff1e5 !important; }
        .spike-dashboard .text-slate-400 { color: var(--spike-muted) !important; }
        .spike-dashboard .text-slate-500 { color: #738087 !important; }
        .spike-dashboard .text-slate-800,
        .spike-dashboard .text-slate-900 { color: var(--spike-ink) !important; }
        .spike-dashboard .border-t,
        .spike-dashboard .border-b { border-color: #e8ebe8 !important; }

        /* Dark mode remains available, with a coordinated deep-teal palette. */
        .dark .spike-dashboard,
        .spike-dashboard:has(aside [class*="bg-[#0E1E38]"]) {
          color: #e8f0f0;
        }
        .dark .spike-dashboard aside,
        .dark .spike-dashboard header,
        .dark .spike-dashboard .bg-white,
        .dark .spike-dashboard [class~="bg-[#0E1E38]"],
        .dark .spike-dashboard [class~="bg-[#0B132B]"] {
          background-color: #102c35 !important;
          border-color: #24434a !important;
        }
        .dark .spike-dashboard input:not([type="checkbox"]):not([type="radio"]),
        .dark .spike-dashboard select,
        .dark .spike-dashboard textarea {
          background-color: #0d252d !important;
          color: #e8f0f0 !important;
          border-color: #31515a !important;
        }
        .dark .spike-dashboard thead th { background: #163740; color: #b2c5c8; }
        .dark .spike-dashboard tbody tr:hover { background: #173a41; }
        @media (max-width: 640px) {
          .spike-dashboard header { padding-inline: 12px !important; }
          .spike-dashboard main > div { padding: 14px !important; }
          .spike-dashboard [class~="rounded-2xl"],
          .spike-dashboard [class~="rounded-3xl"] { border-radius: 16px !important; }
        }
      `}</style>

    </div>
  );
}
