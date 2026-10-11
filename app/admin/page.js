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
  const { lang, toggleLanguage, toggleTheme, isDark } = useApp();
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
      dashboard: 'Dashboard',
      overviewTitle: 'Dashboard Performances',
      overviewSubtitle: 'مؤشرات الأداء اللحظية، طلبات المتاجر، والتسويات المالية',
      addStore: 'إضافة متجر جديد',
      refreshData: 'Download',
      messageBtn: 'Message',
      notificationBtn: 'Notification',
      statStores: 'إجمالي المتاجر',
      statPending: 'بانتظار الشحن',
      statActiveUsers: 'العملاء المفعلين',
      statSales: 'إجمالي المبيعات',
      adminRole: 'Super Admin',
      logoutText: 'تسجيل الخروج',
      navOverview: 'Dashboard',
      navStores: 'Directories',
      navOrders: 'Timeline',
      navInventory: 'Files',
      navRates: 'Payment',
      navDomains: 'Domains & DNS',
      navPlans: 'Subscription Plans',
      navLogs: 'Audit Logs',
      navBroadcast: 'Announcements',
      navAdmins: 'Admin Team',
      adminStoresBtn: 'متاجر الأدمن الخاصة',
      applicationMenu: 'APPLICATION',
      settingsMenu: 'SETTINGS',
      ordersCount: 'أوردر',
      activeStatus: 'نشط',
      save: 'حفظ التعديلات',
      cancel: 'إلغاء'
    },
    en: {
      dashboard: 'Dashboard',
      overviewTitle: 'Dashboard Performances',
      overviewSubtitle: 'Real-time KPIs, merchant orders, and financial reconciliations',
      addStore: 'Add New Store',
      refreshData: 'Refresh Data',
      statStores: 'Total Stores',
      statPending: 'Pending Fulfillment',
      statActiveUsers: 'Active Clients',
      statSales: 'Total Sales',
      adminRole: 'Super Admin',
      logoutText: 'Sign Out',
      navOverview: 'Dashboard',
      navStores: 'Directories',
      navOrders: 'Timeline',
      navInventory: 'Files',
      navRates: 'Payment',
      navDomains: 'Domains & DNS',
      navPlans: 'Subscription Plans',
      navLogs: 'Audit Logs',
      navBroadcast: 'Broadcast Announcements',
      navAdmins: 'Admin Team',
      adminStoresBtn: 'My Admin Stores',
      applicationMenu: 'APPLICATION',
      settingsMenu: 'SETTINGS',
      ordersCount: 'orders',
      activeStatus: 'Active',
      save: 'Save Changes',
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
  }, [isAr, router]);

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
    { id: 'merchants', title: t.navStores, icon: '📂', count: totalStoresCount },
    { id: 'orders', title: t.navOrders, icon: '⏱️', count: orders.length },
    { id: 'inventory', title: t.navInventory, icon: '⚡', count: products.length },
    { id: 'admins', title: t.navAdmins, icon: '🛡️', count: adminUsers.length + 1 },
  ];

  const settingsItems = [
    { id: 'rates', title: t.navRates, icon: '📁' },
    { id: 'domains', title: t.navDomains, icon: '💳' },
    { id: 'plans', title: t.navPlans, icon: '💎' },
  ];

  const statCards = [
    { title: t.statStores, value: totalStoresCount.toString(), change: '980', icon: '⚠️', badgeColor: 'text-teal-600 bg-teal-500/10 border-teal-500/20' },
    { title: t.statPending, value: pendingOrdersCount.toString(), change: '2,940', icon: '🛡️', badgeColor: 'text-teal-600 bg-teal-500/10 border-teal-500/20' },
    { title: t.statActiveUsers, value: activeStoresCount.toString(), change: '2,504', icon: '☕', badgeColor: 'text-teal-600 bg-teal-500/10 border-teal-500/20' },
    { title: t.statSales, value: `${totalSalesAmount.toFixed(2)} ج.م`, change: '4,923', icon: '📦', badgeColor: 'text-teal-600 bg-teal-500/10 border-teal-500/20' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-sans bg-[#F0F2F5] text-teal-600">
        <div className="animate-pulse text-sm font-bold">جاري تحميل لوحة التحكم...</div>
      </div>
    );
  }

  const activeColor = '#009688';

  return (
    <div className="min-h-screen font-sans flex select-none overflow-x-hidden bg-[#EAEFF5] text-slate-800" dir={isAr ? 'rtl' : 'ltr'}>
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-xs transition-opacity" />}

      {/* الشريط الجانبي المصغر */}
      <aside className="w-20 shrink-0 bg-white border-r border-slate-200 hidden sm:flex flex-col items-center py-6 justify-between shadow-xs">
        <div className="space-y-6 flex flex-col items-center">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black shadow-md shadow-teal-500/30" style={{ backgroundColor: activeColor }}>
            S
          </div>

          <div className="space-y-3 pt-4">
            {['🏠', '📂', '⏱️', '⚡', '🛡️', '📁'].map((icon, idx) => (
              <button 
                key={idx}
                onClick={() => setActiveTab(mainMenuItems[idx]?.id || 'overview')}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg transition cursor-pointer ${
                  activeTab === mainMenuItems[idx]?.id ? 'text-white font-black shadow-md shadow-teal-500/30' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-900'
                }`}
                style={{ backgroundColor: activeTab === mainMenuItems[idx]?.id ? activeColor : 'transparent' }}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <button 
            onClick={toggleTheme}
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm transition cursor-pointer bg-slate-100 text-slate-700 hover:bg-slate-200"
            title="تغيير المظهر"
          >
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>
      </aside>

      {/* القائمة الجانبية الرئيسية الموسعة */}
      <aside className={`fixed top-0 bottom-0 ${isAr ? 'right-0' : 'left-0'} z-50 w-72 shrink-0 bg-white border-r border-slate-200 flex flex-col justify-between p-6 shadow-xl transition-all duration-300 lg:static lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0 shadow-2xl' : isAr ? 'translate-x-full' : '-translate-x-full'
      }`}>
        <div className="space-y-6 flex-1 overflow-y-auto">
          
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border border-teal-500/30">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60" alt="Profile" className="w-full h-full object-cover" />
              </div>
              <div className="leading-tight">
                <span className="text-xs font-black block text-slate-900">Hassan Hosny</span>
                <span className="text-[10px] text-slate-400 font-mono">Super Admin</span>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100">✕</button>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700">
            <span className="text-slate-400">🔍</span>
            <input type="text" placeholder="Search" className="bg-transparent text-xs outline-none w-full text-slate-800 placeholder-slate-400" />
          </div>

          <button
            onClick={() => {
              localStorage.setItem('merchant_user_id', 'main_flagship_owner');
              router.push('/dashboard');
            }}
            className="w-full py-2.5 px-3 text-white rounded-2xl text-xs font-black shadow-lg shadow-teal-500/20 transition cursor-pointer flex items-center justify-center gap-2"
            style={{ background: `linear-gradient(to right, ${activeColor}, #00796B)` }}
          >
            <span>👑</span>
            <span>{t.adminStoresBtn}</span>
          </button>

          <div className="space-y-1.5 pt-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 block mb-2">{t.mainMenu}</span>
            {mainMenuItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition cursor-pointer ${isActive ? 'text-white font-black shadow-md shadow-teal-500/25' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                  style={{ backgroundColor: isActive ? activeColor : 'transparent' }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm">{item.icon}</span>
                    <span>{item.title}</span>
                  </div>
                  {item.count !== null && <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>{item.count}</span>}
                </button>
              );
            })}
          </div>

          <div className="space-y-1.5 pt-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 block mb-2">{t.financeMenu}</span>
            {settingsItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition cursor-pointer ${isActive ? 'text-white font-black shadow-md shadow-teal-500/25' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                  style={{ backgroundColor: isActive ? activeColor : 'transparent' }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm">{item.icon}</span>
                    <span>{item.title}</span>
                  </div>
                </button>
              );
            })}
          </div>

        </div>

        <div className="p-4 border-t border-slate-100 flex flex-col gap-2.5 bg-slate-50 rounded-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black shadow-xs shrink-0" style={{ backgroundColor: activeColor }}>S.A</div>
            <div className="leading-tight truncate">
              <span className="text-xs font-bold block text-slate-900">{t.adminRole}</span>
              <span className="text-[10px] text-slate-400 block font-mono truncate">{SUPER_ADMIN_EMAIL}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 border border-rose-500/20 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer">🚪 <span>{t.logoutText}</span></button>
        </div>
      </aside>

      {/* منطقة المحتوى الرئيسية */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#F8FAFC]">
        <header className="px-8 py-5 border-b border-slate-200 bg-white/90 backdrop-blur-md flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setSidebarOpen(true)} className="lg:hidden w-9 h-9 rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-center text-lg font-bold text-slate-800 cursor-pointer">☰</button>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{t.overviewTitle}</h1>
              <p className="text-xs text-slate-500">{t.overviewSubtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button onClick={() => setNewStoreModal(true)} className="px-4 py-2 text-white rounded-2xl text-xs font-black shadow-sm transition cursor-pointer" style={{ backgroundColor: activeColor }}>+ {t.addStore}</button>
            <button onClick={fetchAllData} disabled={refreshing} className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl text-xs font-bold transition shadow-2xs cursor-pointer">📥 {t.refreshData}</button>
            <button onClick={() => setActiveTab('broadcast')} className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl text-xs font-bold transition shadow-2xs cursor-pointer">💬 {t.messageBtn}</button>
            <button onClick={() => setActiveTab('orders')} className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl text-xs font-bold transition shadow-2xs cursor-pointer">🔔 {t.notificationBtn}</button>
          </div>
        </header>

        <div className="p-6 sm:p-10 space-y-6">
          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {statCards.map((stat, i) => (
                  <div key={i} className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm transition hover:shadow-md flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xl p-2.5 rounded-2xl bg-slate-50 border border-slate-100">{stat.icon}</span>
                      <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${stat.badgeColor}`}>{stat.change}</span>
                    </div>
                    <div className="space-y-1" dir="ltr">
                      <span className="text-2xl font-black text-slate-900 font-mono tracking-tight block">{stat.value}</span>
                      <span className="text-xs text-slate-500 font-bold block">{stat.title}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 pt-3 border-t border-slate-100 mt-4 block">Chart Value</span>
                  </div>
                ))}
              </div>

              <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <div><h3 className="text-sm font-black text-slate-900">Section Title - Live Orders</h3><p className="text-xs text-slate-400">Chart Value & Transactions</p></div>
                  <button onClick={() => setActiveTab('orders')} className="text-xs font-bold hover:underline cursor-pointer" style={{ color: activeColor }}>View all →</button>
                </div>
                {orders.length === 0 ? <div className="text-center py-12 text-slate-400 text-xs">No recorded orders yet</div> : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead><tr className="border-b border-slate-100 text-slate-400 font-bold"><th className="p-3 text-right">CODE</th><th className="p-3 text-right">PRODUCT / CUSTOMER</th><th className="p-3 text-right">DATE</th><th className="p-3 text-right">PRICE</th><th className="p-3 text-right">STATUS</th></tr></thead>
                      <tbody className="divide-y divide-slate-100">{orders.slice(0, 5).map((o, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80 transition"><td className="p-3 font-mono font-bold text-slate-900">#{o.id}</td><td className="p-3 font-bold text-slate-800">{o.customer_name || 'Cash Customer'}</td><td className="p-3 text-slate-500">{new Date(o.created_at).toLocaleDateString()}</td><td className="p-3 font-mono font-bold" style={{ color: activeColor }}>{o.total_price} ج.م</td><td className="p-3"><span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase">Success</span></td></tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'merchants' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div><h3 className="text-base font-black text-slate-900">Directories - Stores & Merchants ({stores.length})</h3><p className="text-xs text-slate-500">إدارة ومتابعة المتاجر</p></div>
                <button onClick={() => setNewStoreModal(true)} className="px-4 py-2 text-white rounded-xl text-xs font-black cursor-pointer shadow-sm" style={{ backgroundColor: activeColor }}>+ Add Store</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-slate-200 text-slate-400 font-bold"><th className="p-3 text-right">STORE</th><th className="p-3 text-right">OWNER</th><th className="p-3 text-right">WALLET</th><th className="p-3 text-right">STATUS</th><th className="p-3 text-center">ACTIONS</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">{stores.map((s, idx) => (
                    <tr key={idx} className="hover:bg-slate-50"><td className="p-3"><span className="font-bold text-slate-900 block">{s.store_name}</span><span className="text-[10px] text-slate-400 font-mono" dir="ltr">{s.store_slug}.spike.shop</span></td><td className="p-3 text-slate-700">{s.owner_name || '—'}</td><td className="p-3 font-mono font-bold" style={{ color: activeColor }}>${s.wallet_balance_usd || 0}</td><td className="p-3"><button onClick={() => handleToggleStoreStatus(s.id, s.is_active !== false)} className={`px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer transition ${s.is_active !== false ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'}`}>{s.is_active !== false ? 'Active' : 'Disabled'}</button></td><td className="p-3 text-center space-x-2"><button onClick={() => handleUpdateWallet(s.id, s.wallet_balance_usd || 0)} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold cursor-pointer">Wallet</button><button onClick={() => { localStorage.setItem('merchant_user_id', s.user_id); router.push('/dashboard'); }} className="px-2.5 py-1 text-teal-700 rounded-lg font-bold cursor-pointer" style={{ backgroundColor: 'rgba(0, 150, 136, 0.1)' }}>Access ↗</button></td></tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-6"><div><h3 className="text-base font-black text-slate-900">Timeline - All Orders ({orders.length})</h3><p className="text-xs text-slate-500">متابعة الشحنات</p></div><button onClick={fetchAllData} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold cursor-pointer">Refresh</button></div>
              {orders.length === 0 ? <div className="text-center py-12 text-slate-400 text-sm">No orders found</div> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="border-b border-slate-200 text-slate-400 font-bold"><th className="p-3 text-right">ORDER ID</th><th className="p-3 text-right">CUSTOMER</th><th className="p-3 text-right">PHONE</th><th className="p-3 text-right">GOVERNORATE</th><th className="p-3 text-right">AMOUNT</th><th className="p-3 text-center">STATUS</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">{orders.map((o, idx) => (
                      <tr key={idx} className="hover:bg-slate-50"><td className="p-3 font-mono font-bold text-slate-900">#{o.id}</td><td className="p-3 font-bold text-slate-800">{o.customer_name}</td><td className="p-3 font-mono" dir="ltr">{o.customer_phone}</td><td className="p-3 text-slate-600">{o.governorate} - {o.address}</td><td className="p-3 font-mono font-bold" style={{ color: activeColor }}>{o.total_price} ج.م</td><td className="p-3 text-center"><select value={o.status || 'pending'} onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)} className="p-1.5 border border-slate-200 rounded-xl text-xs bg-slate-50 font-bold text-slate-700 cursor-pointer"><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option></select></td></tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-6"><div><h3 className="text-base font-black text-slate-900">Files - Products & Stock ({products.length})</h3><p className="text-xs text-slate-500">إدارة المخزون والمنتجات</p></div><button onClick={() => setNewProductModal(true)} className="px-4 py-2 text-white rounded-xl text-xs font-black cursor-pointer shadow-sm" style={{ backgroundColor: activeColor }}>+ Add Product</button></div>
              {products.length === 0 ? <div className="text-center py-12 text-slate-400 text-sm">Inventory is empty</div> : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{products.map((p, idx) => (
                  <div key={idx} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-3"><div><span className="font-bold text-sm text-slate-900 block">{p.title}</span><div className="flex justify-between text-xs text-slate-500 mt-2 font-mono"><span>Price: {p.price} ج.م</span><span>Cost: {p.cost_price || 0} ج.م</span></div></div><div className="flex justify-between items-center pt-2 border-t border-slate-200 text-xs"><span className="text-slate-500">Stock: <strong>{p.stock_quantity || 0}</strong></span><span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded text-[10px] font-bold">In Stock</span></div></div>
                ))}</div>
              )}
            </div>
          )}

          {activeTab === 'admins' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-6"><div><h3 className="text-base font-black text-slate-900">Admin Team & Roles</h3><p className="text-xs text-slate-500">حسابات المشرفين</p></div><button onClick={() => setNewAdminModal(true)} className="px-4 py-2 text-white rounded-xl text-xs font-black cursor-pointer shadow-sm" style={{ backgroundColor: activeColor }}>+ Add Admin</button></div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-slate-200 text-slate-400 font-bold"><th className="p-3 text-right">NAME</th><th className="p-3 text-right">EMAIL</th><th className="p-3 text-right">ROLE</th><th className="p-3 text-center">ACTION</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="bg-teal-500/5"><td className="p-3 font-black text-slate-900">Hassan Hosny (Owner)</td><td className="p-3 font-mono font-bold" dir="ltr">{SUPER_ADMIN_EMAIL}</td><td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-500/10 text-rose-600">S.A</span></td><td className="p-3 text-center text-slate-400 font-mono">🔒 Master</td></tr>
                    {adminUsers.map(user => (
                      <tr key={user.id} className="hover:bg-slate-50"><td className="p-3 font-bold text-slate-800">{user.name}</td><td className="p-3 font-mono text-slate-600" dir="ltr">{user.email}</td><td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600">{user.role}</span></td><td className="p-3 text-center"><button onClick={() => handleDeleteAdmin(user.id, user.email)} className="text-rose-500 font-bold cursor-pointer">Revoke</button></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'rates' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm max-w-xl">
              <h3 className="text-base font-black text-slate-900 mb-1">Payment & Exchange Settings</h3>
              <p className="text-xs text-slate-500 mb-4">إدارة أسعار الصرف</p>
              <div className="space-y-4 text-xs font-bold">
                <div><label className="block text-slate-500 mb-1">USD to EGP Rate</label><input type="number" step="0.1" value={exchangeRate} onChange={(e) => setExchangeRate(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono outline-none" /></div>
                <div><label className="block text-slate-500 mb-1">Platform Commission (%)</label><input type="number" step="0.1" value={platformCommission} onChange={(e) => setPlatformCommission(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono outline-none" /></div>
                <button onClick={handleSavePlatformSettings} className="px-6 py-2.5 text-white rounded-xl font-black text-xs transition cursor-pointer mt-2 shadow-sm" style={{ backgroundColor: activeColor }}>Save Changes</button>
              </div>
            </div>
          )}

          {activeTab === 'broadcast' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm max-w-xl">
              <h3 className="text-base font-black text-slate-900 mb-1">Send Broadcast Announcement</h3>
              <textarea rows="4" value={broadcastMessage} onChange={(e) => setBroadcastMessage(e.target.value)} placeholder="Type announcement..." className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs mb-3 outline-none" />
              <button onClick={() => { if (!broadcastMessage) return; alert('✅ Broadcast sent successfully'); setBroadcastMessage(''); }} className="px-5 py-2 text-white rounded-xl font-black text-xs cursor-pointer shadow-sm" style={{ backgroundColor: activeColor }}>Send Now</button>
            </div>
          )}

        </div>
      </main>

      {/* مودال إنشاء متجر */}
      {newStoreModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="p-6 rounded-3xl max-w-md w-full bg-white border border-slate-200 text-slate-900 shadow-2xl space-y-3">
            <h3 className="text-base font-black">Deploy New Store</h3>
            <form onSubmit={handleCreateStore} className="space-y-3 text-xs">
              <input type="text" required placeholder="Store Name" value={newStoreData.store_name} onChange={(e) => setNewStoreData({ ...newStoreData, store_name: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 outline-none" />
              <input type="text" required placeholder="Slug" value={newStoreData.store_slug} onChange={(e) => setNewStoreData({ ...newStoreData, store_slug: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-mono outline-none" />
              <input type="text" placeholder="Owner Name" value={newStoreData.owner_name} onChange={(e) => setNewStoreData({ ...newStoreData, owner_name: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 outline-none" />
              <input type="tel" placeholder="Phone" value={newStoreData.phone} onChange={(e) => setNewStoreData({ ...newStoreData, phone: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-mono outline-none" />
              <div className="flex gap-2 pt-2"><button type="submit" className="flex-1 py-2.5 text-white rounded-xl font-black cursor-pointer shadow-sm" style={{ backgroundColor: activeColor }}>Deploy</button><button type="button" onClick={() => setNewStoreModal(false)} className="px-4 py-2.5 border border-slate-200 rounded-xl cursor-pointer">Cancel</button></div>
            </form>
          </div>
        </div>
      )}

      {/* مودال منتج جديد */}
      {newProductModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="p-6 rounded-3xl max-w-md w-full bg-white border border-slate-200 text-slate-900 shadow-2xl space-y-3">
            <h3 className="text-base font-black">Add Product</h3>
            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <input type="text" required placeholder="Title" value={newProductData.title} onChange={(e) => setNewProductData({ ...newProductData, title: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 outline-none" />
              <input type="number" required placeholder="Price" value={newProductData.price} onChange={(e) => setNewProductData({ ...newProductData, price: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-mono outline-none" />
              <div className="flex gap-2 pt-2"><button type="submit" className="flex-1 py-2.5 text-white rounded-xl font-black cursor-pointer shadow-sm" style={{ backgroundColor: activeColor }}>Add</button><button type="button" onClick={() => setNewProductModal(false)} className="px-4 py-2.5 border border-slate-200 rounded-xl cursor-pointer">Cancel</button></div>
            </form>
          </div>
        </div>
      )}

      {/* مودال مشرف جديد */}
      {newAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="p-6 rounded-3xl max-w-md w-full bg-white border border-slate-200 text-slate-900 shadow-2xl space-y-4">
            <h3 className="text-base font-black">Add Admin & Permissions</h3>
            <form onSubmit={handleCreateAdmin} className="space-y-3 text-xs font-bold">
              <input type="text" required placeholder="Name" value={newAdminData.name} onChange={(e) => setNewAdminData({ ...newAdminData, name: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 outline-none" />
              <input type="email" required dir="ltr" placeholder="admin@example.com" value={newAdminData.email} onChange={(e) => setNewAdminData({ ...newAdminData, email: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-mono outline-none" />
              <div className="flex gap-2 pt-2"><button type="submit" className="flex-1 py-2.5 text-white rounded-xl font-black cursor-pointer shadow-sm" style={{ backgroundColor: activeColor }}>Save</button><button type="button" onClick={() => setNewAdminModal(false)} className="px-4 py-2.5 border border-slate-200 rounded-xl cursor-pointer">Cancel</button></div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
