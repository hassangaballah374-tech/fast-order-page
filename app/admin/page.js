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
      dashboard: 'لوحة التحكم',
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
      adminRole: 'مدير النظام الأساسي (S.A)',
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
      navAdmins: 'فريق الإدارة',
      adminStoresBtn: 'متاجر الأدمن الخاصة',
      mainMenu: 'القائمة الرئيسية',
      financeMenu: 'المالية والتحكم',
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
      adminRole: 'Super Admin Master (S.A)',
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
      navAdmins: 'Admin Team',
      adminStoresBtn: 'My Admin Stores',
      mainMenu: 'MAIN MENU',
      financeMenu: 'FINANCE',
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
            fetchAllData();
            return;
          }
        }

        alert(isAr ? '⛔ عذراً، غير مسموح لك بالدخول.' : 'Access Denied.');
        router.push('/dashboard');
      } catch (err) {
        console.error('Auth check failed:', err);
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
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCreateStore = async (e) => {
    e.preventDefault();
    if (!newStoreData.store_name || !newStoreData.store_slug) return;
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
      alert(isAr ? '✅ تم إنشاء المتجر بنجاح' : 'Store created');
      setNewStoreModal(false);
      setNewStoreData({ store_name: '', store_slug: '', owner_name: '', phone: '', currency: 'USD', initial_wallet: 10 });
      fetchAllData();
    } else {
      alert(error.message);
    }
  };

  const handleToggleStoreStatus = async (storeId, currentStatus) => {
    const nextStatus = !currentStatus;
    const { error } = await supabase.from('store_profiles').update({ is_active: nextStatus }).eq('id', storeId);
    if (!error) setStores(prev => prev.map(s => s.id === storeId ? { ...s, is_active: nextStatus } : s));
  };

  const handleUpdateWallet = async (storeId, currentBalance) => {
    const amount = prompt(isAr ? 'أدخل الرصيد الجديد بالدولار:' : 'Enter new balance in USD:', currentBalance);
    if (amount === null) return;
    const num = parseFloat(amount);
    if (isNaN(num)) return;
    const { error } = await supabase.from('store_profiles').update({ wallet_balance_usd: num }).eq('id', storeId);
    if (!error) setStores(prev => prev.map(s => s.id === storeId ? { ...s, wallet_balance_usd: num } : s));
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (!error) setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!newProductData.title || !newProductData.price) return;
    const { error } = await supabase.from('products').insert([{
      title: newProductData.title,
      price: parseFloat(newProductData.price) || 0,
      cost_price: parseFloat(newProductData.cost_price) || 0,
      stock_quantity: parseInt(newProductData.stock) || 0,
      store_id: newProductData.store_id || (stores[0]?.user_id || 'spike_main'),
      status: 'active'
    }]);
    if (!error) {
      alert(isAr ? '✅ تمت إضافة المنتج بنجاح' : 'Product added');
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
      alert(isAr ? '✅ تمت إضافة المشرف بنجاح' : 'Admin created');
      setNewAdminModal(false);
      fetchAllData();
    } else {
      alert(error.message);
    }
  };

  const handleDeleteAdmin = async (id, email) => {
    if (email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) return alert('Cannot delete owner!');
    if (!confirm(`Revoke access for ${email}?`)) return;
    const { error } = await supabase.from('admin_users').delete().eq('id', id);
    if (!error) setAdminUsers(prev => prev.filter(a => a.id !== id));
  };

  const handleSavePlatformSettings = async () => {
    const { error } = await supabase.from('platform_settings').upsert({
      id: 1,
      exchange_rate: parseFloat(exchangeRate),
      commission_percentage: parseFloat(platformCommission),
      withdraw_threshold: parseFloat(withdrawThreshold),
      updated_at: new Date().toISOString()
    });
    if (!error) alert(isAr ? '✅ تم حفظ إعدادات النظام بنجاح' : 'Settings saved');
  };

  const totalStoresCount = stores.length;
  const pendingOrdersCount = orders.filter(o => o.status === 'pending' || !o.status).length;
  const activeStoresCount = stores.filter(s => s.is_active !== false).length;
  const totalSalesAmount = orders.reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0);

  const mainMenuItems = [
    { id: 'overview', title: t.navOverview, icon: '🏠' },
    { id: 'merchants', title: t.navStores, icon: '🏪', count: totalStoresCount },
    { id: 'orders', title: t.navOrders, icon: '📦', count: orders.length },
    { id: 'inventory', title: t.navInventory, icon: '🏷️', count: products.length },
    { id: 'admins', title: t.navAdmins, icon: '🛡️', count: adminUsers.length + 1 },
  ];

  const financeMenuItems = [
    { id: 'rates', title: t.navRates, icon: '💱' },
    { id: 'domains', title: t.navDomains, icon: '🌐', count: domains.length },
    { id: 'plans', title: t.navPlans, icon: '💎' },
    { id: 'audit', title: t.navLogs, icon: '📑', count: auditLogs.length },
    { id: 'broadcast', title: t.navBroadcast, icon: '📢' },
  ];

  const statCards = [
    {
      title: t.statStores,
      value: totalStoresCount.toString(),
      change: '+100%',
      icon: '🏬',
      badgeColor: 'text-[#00B050] bg-[#00B050]/15 border-[#00B050]/30',
      desc1: t.comparedLastMonth,
      desc2: t.totalReceipts,
      progress: '100%',
    },
    {
      title: t.statPending,
      value: pendingOrdersCount.toString(),
      change: `${pendingOrdersCount} ${t.ordersCount}`,
      icon: '⏳',
      badgeColor: 'text-amber-500 bg-amber-500/15 border-amber-500/30',
      desc1: t.underProcess,
      desc2: t.underProcess,
      progress: pendingOrdersCount > 0 ? '45%' : '0%',
    },
    {
      title: t.statActiveUsers,
      value: activeStoresCount.toString(),
      change: `100% ${t.activeStatus}`,
      icon: '🟢',
      badgeColor: 'text-[#00B050] bg-[#00B050]/15 border-[#00B050]/30',
      desc1: t.activeRate,
      desc2: t.activeRate,
      progress: '100%',
    },
    {
      title: t.statSales,
      value: `${totalSalesAmount.toFixed(2)} ج.م`,
      change: '0.00%',
      icon: '💰',
      badgeColor: 'text-[#00B050] bg-[#00B050]/15 border-[#00B050]/30',
      desc1: t.comparedLastMonth,
      desc2: t.totalReceipts,
      progress: totalSalesAmount > 0 ? '60%' : '5%',
    },
  ];

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center font-sans ${isDark ? 'bg-[#121824] text-white' : 'bg-[#EAEFF5] text-slate-900'}`}>
        <div className="animate-pulse text-sm font-bold">جاري تحميل لوحة التحكم...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans flex transition-colors duration-200 select-none ${
      isDark ? 'bg-[#121824] text-slate-100' : 'bg-[#EAEFF5] text-slate-800'
    }`} dir={isAr ? 'rtl' : 'ltr'}>

      {/* 1. الشريط الجانبي المصغر (Icon Dock) مطابق للصورة */}
      <aside className={`w-20 shrink-0 border-r flex flex-col items-center py-6 justify-between transition-colors ${
        isDark ? 'bg-[#0B132B] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="space-y-6 flex flex-col items-center">
          <div className="w-10 h-10 rounded-2xl bg-[#00B050] flex items-center justify-center text-white font-black shadow-md shadow-[#00B050]/30">
            S
          </div>

          <div className="space-y-3 pt-4">
            {['🏠', '🏪', '📦', '🏷️', '🛡️', '💱'].map((icon, idx) => (
              <button 
                key={idx}
                onClick={() => setActiveTab(mainMenuItems[idx]?.id || 'overview')}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg transition cursor-pointer ${
                  activeTab === mainMenuItems[idx]?.id 
                    ? 'bg-[#00B050] text-white shadow-md shadow-[#00B050]/30' 
                    : isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <button 
            onClick={toggleTheme}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm transition cursor-pointer ${
              isDark ? 'bg-slate-800 text-amber-300' : 'bg-slate-100 text-slate-700'
            }`}
            title="تغيير المظهر"
          >
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>
      </aside>

      {/* 2. القائمة الجانبية الرئيسية الموسعة (Sidebar) */}
      <aside className={`w-64 shrink-0 border-r flex flex-col justify-between p-5 transition-colors ${
        isDark ? 'bg-[#0E1E38] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="space-y-6">
          
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <img src={SPIKE_LOGO_URL} alt="SPIKE" className="h-7 w-auto object-contain rounded-lg" />
              <span className={`font-black text-base tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                salesku <span className="text-[10px] text-[#00B050] font-mono">| SPIKE</span>
              </span>
            </div>
          </div>

          {/* 👑 زر الانتقال السريع لمتاجر الأدمن الخاصة بك */}
          <button
            onClick={() => {
              localStorage.setItem('merchant_user_id', 'main_flagship_owner');
              router.push('/dashboard');
            }}
            className="w-full py-2.5 px-3 bg-gradient-to-r from-[#00B050] to-emerald-600 hover:from-[#009644] text-white rounded-2xl text-xs font-black shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <span>👑</span>
            <span>{t.adminStoresBtn}</span>
          </button>

          <div className="space-y-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-3 block mb-2">
              {t.mainMenu}
            </span>
            {mainMenuItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer ${
                  activeTab === item.id 
                    ? 'bg-[#00B050] text-white shadow-md shadow-[#00B050]/25' 
                    : isDark ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span>{item.icon}</span>
                  <span>{item.title}</span>
                </div>
                {item.count !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    activeTab === item.id ? 'bg-white/20 text-white' : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="space-y-1.5 pt-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-3 block mb-2">
              {t.financeMenu}
            </span>
            {financeMenuItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer ${
                  activeTab === item.id 
                    ? 'bg-[#00B050] text-white shadow-md shadow-[#00B050]/25' 
                    : isDark ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span>{item.icon}</span>
                  <span>{item.title}</span>
                </div>
                {item.count !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    activeTab === item.id ? 'bg-white/20 text-white' : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </div>

        </div>

        {/* بروفايل المستخدم وزر تسجيل الخروج */}
        <div className={`p-3 rounded-2xl border flex flex-col gap-2.5 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#00B050] to-emerald-400 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-xs">
              S.A
            </div>
            <div className="leading-tight truncate">
              <span className={`text-xs font-black block truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {t.adminRole}
              </span>
              <span className="text-[10px] text-slate-400 block font-mono truncate">{SUPER_ADMIN_EMAIL}</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>🚪</span>
            <span>{t.logoutText}</span>
          </button>
        </div>
      </aside>

      {/* 3. منطقة المحتوى الرئيسي */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        <header className={`px-6 sm:px-10 py-4 border-b flex items-center justify-between sticky top-0 z-30 backdrop-blur-md transition-colors ${
          isDark ? 'bg-[#0E1E38]/90 border-slate-800' : 'bg-white/90 border-slate-200 shadow-xs'
        }`}>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">Dashboard</h1>
            <p className="text-xs text-slate-400">{t.overviewSubtitle}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className={`hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-2xl border ${
              isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-100 border-slate-200 text-slate-800'
            }`}>
              <span>🔍</span>
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-transparent text-xs outline-none w-48"
              />
            </div>

            <button
              onClick={() => setNewStoreModal(true)}
              className="px-4 py-2 bg-[#00B050] hover:bg-[#009644] text-white rounded-2xl text-xs font-black shadow-md shadow-[#00B050]/25 transition cursor-pointer"
            >
              + {t.addStore}
            </button>

            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-300 dark:border-slate-700">
              <div className="w-9 h-9 rounded-full bg-slate-700 overflow-hidden border border-[#00B050]/50 shadow-xs">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60" alt="Profile" className="w-full h-full object-cover" />
              </div>
              <div className="hidden md:block text-left" dir="ltr">
                <span className={`text-xs font-black block leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Super Admin</span>
                <span className="text-[10px] text-slate-400 font-mono">Master (S.A)</span>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 sm:p-10 space-y-6">

          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {statCards.map((stat, i) => (
                  <div
                    key={i}
                    className={`p-6 rounded-3xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between ${
                      isDark ? 'bg-[#0E1E38] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className={`text-[10px] font-bold font-mono px-2.5 py-1 rounded-lg border ${stat.badgeColor}`}>
                        {stat.change}
                      </span>
                      <span className="text-xl p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60">{stat.icon}</span>
                    </div>

                    <div className="space-y-1 text-left" dir="ltr">
                      <span className="text-2xl font-black font-mono tracking-tight block">
                        {stat.value}
                      </span>
                      <span className="text-xs text-slate-400 font-bold block">
                        {stat.title}
                      </span>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[10px] text-slate-400">
                      <span>{stat.desc2}</span>
                      <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-[#00B050] rounded-full" style={{ width: stat.progress }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className={`p-6 sm:p-8 rounded-3xl border ${
                isDark ? 'bg-[#0E1E38] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-base font-black">أحدث طلبات المنصة الحية</h3>
                    <p className="text-xs text-slate-400">مزامنة لحظية للعمليات مع تأكيد الدفع والشحن</p>
                  </div>
                  <button onClick={() => setActiveTab('orders')} className="text-xs text-[#00B050] font-bold hover:underline cursor-pointer">
                    عرض الكل ←
                  </button>
                </div>

                {orders.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">لا توجد طلبات مسجلة حتى اللحظة</div>
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
                              <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-500 text-[10px] font-bold">
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

          {activeTab === 'merchants' && (
            <div className={`p-6 rounded-3xl border ${isDark ? 'bg-[#0E1E38] border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black">إدارة المتاجر والتجار ({stores.length})</h3>
                <button onClick={() => setNewStoreModal(true)} className="px-4 py-2 bg-[#00B050] text-white rounded-xl text-xs font-bold cursor-pointer">+ إضافة متجر</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                      <th className="p-3 text-right">المتجر</th>
                      <th className="p-3 text-right">المالك</th>
                      <th className="p-3 text-right">الرصيد</th>
                      <th className="p-3 text-right">الحالة</th>
                      <th className="p-3 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stores.map((s, i) => (
                      <tr key={i} className="border-b border-slate-100 dark:border-slate-800/50">
                        <td className="p-3 font-bold">{s.store_name} <span className="text-[10px] text-slate-400 block font-mono">({s.store_slug}.spike.shop)</span></td>
                        <td className="p-3">{s.owner_name}</td>
                        <td className="p-3 font-mono text-emerald-500 font-bold">${s.wallet_balance_usd || 0}</td>
                        <td className="p-3">
                          <button onClick={() => handleToggleStoreStatus(s.id, s.is_active !== false)} className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.is_active !== false ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                            {s.is_active !== false ? 'مفعل' : 'معطل'}
                          </button>
                        </td>
                        <td className="p-3 text-center space-x-2">
                          <button onClick={() => handleUpdateWallet(s.id, s.wallet_balance_usd || 0)} className="px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded font-bold">شحن</button>
                          <button onClick={() => { localStorage.setItem('merchant_user_id', s.user_id); router.push('/dashboard'); }} className="px-2 py-1 bg-[#00B050]/15 text-[#00B050] rounded font-bold">دخول ↗</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className={`p-6 rounded-3xl border ${isDark ? 'bg-[#0E1E38] border-slate-800' : 'bg-white border-slate-200'}`}>
              <h3 className="text-lg font-black mb-4">كافة طلبات المنصة ({orders.length})</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                      <th className="p-3 text-right">رقم الطلب</th>
                      <th className="p-3 text-right">العميل</th>
                      <th className="p-3 text-right">المحافظة</th>
                      <th className="p-3 text-right">الإجمالي</th>
                      <th className="p-3 text-center">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o, i) => (
                      <tr key={i} className="border-b border-slate-100 dark:border-slate-800/50">
                        <td className="p-3 font-mono font-bold">#{o.id}</td>
                        <td className="p-3 font-bold">{o.customer_name}</td>
                        <td className="p-3">{o.governorate}</td>
                        <td className="p-3 font-mono text-[#00B050] font-bold">{o.total_price} ج.م</td>
                        <td className="p-3 text-center">
                          <select value={o.status || 'pending'} onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)} className="p-1 border rounded text-xs bg-transparent">
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
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className={`p-6 rounded-3xl border ${isDark ? 'bg-[#0E1E38] border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black">المنتجات والمخزون ({products.length})</h3>
                <button onClick={() => setNewProductModal(true)} className="px-4 py-2 bg-[#00B050] text-white rounded-xl text-xs font-bold">+ إضافة منتج</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {products.map((p, i) => (
                  <div key={i} className="p-4 border rounded-2xl border-slate-700/50 space-y-2">
                    <span className="font-bold text-sm block">{p.title}</span>
                    <span className="text-[#00B050] font-mono font-bold">{p.price} ج.م</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'admins' && (
            <div className={`p-6 rounded-3xl border ${isDark ? 'bg-[#0E1E38] border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black">فريق الإدارة والصلاحيات</h3>
                <button onClick={() => setNewAdminModal(true)} className="px-4 py-2 bg-[#00B050] text-white rounded-xl text-xs font-bold">+ إضافة أدمن</button>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                    <th className="p-3 text-right">الاسم</th>
                    <th className="p-3 text-right">البريد</th>
                    <th className="p-3 text-center">الإجراء</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100 dark:border-slate-800/50 bg-emerald-500/5">
                    <td className="p-3 font-black text-emerald-500">Super Admin (المالك)</td>
                    <td className="p-3 font-mono font-bold" dir="ltr">{SUPER_ADMIN_EMAIL}</td>
                    <td className="p-3 text-center text-slate-400">🔒 أساسي</td>
                  </tr>
                  {adminUsers.map(user => (
                    <tr key={user.id} className="border-b border-slate-100 dark:border-slate-800/50">
                      <td className="p-3 font-bold">{user.name}</td>
                      <td className="p-3 font-mono" dir="ltr">{user.email}</td>
                      <td className="p-3 text-center"><button onClick={() => handleDeleteAdmin(user.id, user.email)} className="text-rose-500 font-bold">إلغاء</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'rates' && (
            <div className={`p-6 rounded-3xl border max-w-xl ${isDark ? 'bg-[#0E1E38] border-slate-800' : 'bg-white border-slate-200'}`}>
              <h3 className="text-lg font-black mb-4">سعر الصرف والعمولات</h3>
              <div className="space-y-4 text-xs font-bold">
                <div>
                  <label className="block text-slate-400 mb-1">سعر الدولار (USD to EGP)</label>
                  <input type="number" step="0.1" value={exchangeRate} onChange={e => setExchangeRate(e.target.value)} className="w-full p-3 rounded-xl border bg-transparent font-mono" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">عمولة المنصة (%)</label>
                  <input type="number" step="0.1" value={platformCommission} onChange={e => setPlatformCommission(e.target.value)} className="w-full p-3 rounded-xl border bg-transparent font-mono" />
                </div>
                <button onClick={handleSavePlatformSettings} className="px-6 py-2.5 bg-[#00B050] text-white rounded-xl font-bold cursor-pointer">حفظ الإعدادات</button>
              </div>
            </div>
          )}

          {activeTab === 'broadcast' && (
            <div className={`p-6 rounded-3xl border max-w-xl ${isDark ? 'bg-[#0E1E38] border-slate-800' : 'bg-white border-slate-200'}`}>
              <h3 className="text-lg font-black mb-2">إرسال إعلان جماعي للتجار</h3>
              <textarea rows="4" value={broadcastMessage} onChange={e => setBroadcastMessage(e.target.value)} placeholder="اكتب الإعلان هنا..." className="w-full p-3 rounded-xl border bg-transparent text-xs mb-3 outline-none focus:border-[#00B050]" />
              <button onClick={() => { if (!broadcastMessage) return; alert('✅ تم الإرسال بنجاح'); setBroadcastMessage(''); }} className="px-5 py-2 bg-[#00B050] text-white rounded-xl text-xs font-bold cursor-pointer">إرسال الآن</button>
            </div>
          )}

        </div>
      </main>

      {/* مودال متجر جديد */}
      {newStoreModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className={`p-6 rounded-3xl max-w-md w-full border ${isDark ? 'bg-[#0E1E38] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <h3 className="text-base font-black mb-4">إنشاء متجر جديد</h3>
            <form onSubmit={handleCreateStore} className="space-y-3 text-xs">
              <input type="text" required placeholder="اسم المتجر" value={newStoreData.store_name} onChange={e => setNewStoreData({ ...newStoreData, store_name: e.target.value })} className="w-full p-3 rounded-xl border bg-transparent" />
              <input type="text" required placeholder="الدومين (Slug)" value={newStoreData.store_slug} onChange={e => setNewStoreData({ ...newStoreData, store_slug: e.target.value })} className="w-full p-3 rounded-xl border bg-transparent font-mono" />
              <input type="text" placeholder="اسم المالك" value={newStoreData.owner_name} onChange={e => setNewStoreData({ ...newStoreData, owner_name: e.target.value })} className="w-full p-3 rounded-xl border bg-transparent" />
              <input type="tel" placeholder="الهاتف" value={newStoreData.phone} onChange={e => setNewStoreData({ ...newStoreData, phone: e.target.value })} className="w-full p-3 rounded-xl border bg-transparent font-mono" />
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2.5 bg-[#00B050] text-white rounded-xl font-bold cursor-pointer">إنشاء</button>
                <button type="button" onClick={() => setNewStoreModal(false)} className="px-4 py-2.5 border rounded-xl cursor-pointer">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال منتج جديد */}
      {newProductModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className={`p-6 rounded-3xl max-w-md w-full border ${isDark ? 'bg-[#0E1E38] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <h3 className="text-base font-black mb-4">إضافة منتج جديد</h3>
            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <input type="text" required placeholder="اسم المنتج" value={newProductData.title} onChange={e => setNewProductData({ ...newProductData, title: e.target.value })} className="w-full p-3 rounded-xl border bg-transparent" />
              <input type="number" required placeholder="السعر (ج.م)" value={newProductData.price} onChange={e => setNewProductData({ ...newProductData, price: e.target.value })} className="w-full p-3 rounded-xl border bg-transparent font-mono" />
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2.5 bg-[#00B050] text-white rounded-xl font-bold cursor-pointer">إضافة</button>
                <button type="button" onClick={() => setNewProductModal(false)} className="px-4 py-2.5 border rounded-xl cursor-pointer">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
