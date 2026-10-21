'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';
import { SPIKE_LOGO_URL } from '../../components/SpikeBrandHeader';
import {
  ChartCard, Segmented, Sparkline, AreaChart, BarChart, HBarList, Donut, ProgressBar, fmt, fmtK,
} from '../../components/SpikeCharts';
import SpikeIntegrations from '../../components/SpikeIntegrations';
import { spikeLogout } from '../../components/SpikeSessionBar';
import AdminBilling from '../../components/admin/AdminBilling';
import AdminBell from '../../components/admin/AdminBell';
import PaymentNote from '../../components/admin/PaymentNote';
import ThemeColors from '../../components/admin/ThemeColors';  

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
  const [statModal, setStatModal] = useState(null); // 'stores' | 'active' | 'pending' | 'sales'
  const [isSuper, setIsSuper] = useState(false);
  const [actorEmail, setActorEmail] = useState('');
  const [range, setRange] = useState(7);          // 7 | 30 يوم
  const [metric, setMetric] = useState('sales');  // sales | orders
  const [broadcasts, setBroadcasts] = useState([]);

  // ===== الصلاحيات (فعلية، مش شكل) =====
  const can = (perm) => isSuper || currentPermissions?.[perm] === true;
  const TAB_PERM = {
    overview: null,
    merchants: 'manage_stores',
    inventory: 'manage_stores',
    integrations: 'manage_stores',
    domains: 'manage_stores',
    orders: 'manage_orders',
    rates: 'manage_finance',
    plans: 'manage_finance',
    billing: 'manage_finance',
    admins: 'manage_admins',
    audit: 'manage_admins',
    broadcast: 'manage_admins',
  };
  const tabAllowed = (id) => !TAB_PERM[id] || can(TAB_PERM[id]);
  const shown = (id) => activeTab === id && tabAllowed(id);
  const guard = (perm) => {
    if (can(perm)) return true;
    alert(isAr ? '⛔ ليس لديك صلاحية لهذا الإجراء' : 'You do not have permission for this action');
    return false;
  };
  // ===== سجل الحركات =====
  const logAction = async (action, meta = {}) => {
    try {
      await supabase.from('audit_logs').insert([{ action, actor_email: actorEmail || SUPER_ADMIN_EMAIL, meta }]);
    } catch (err) { /* السجل لا يوقف العملية */ }
  };

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
      navIntegrations: 'التكاملات والإضافات',
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
      navIntegrations: 'Integrations & Add-ons',
      navAdmins: 'Admin Team & Roles',
      adminStoresBtn: 'My Admin Stores',
      ordersCount: 'orders',
      activeStatus: 'Active',
      save: 'Save Changes',
      cancel: 'Cancel'
    }
  }[lang || 'ar'];

  // 🚪 دالة موحدة لجميع المستخدمين لتسجيل الخروج الآمن
  const handleLogout = () => spikeLogout(router);

  useEffect(() => {
    const verifyAdminAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const authEmail = user?.email?.toLowerCase().trim();

        if (authEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
          localStorage.setItem('user_email', SUPER_ADMIN_EMAIL);
          setIsSuper(true);
          setActorEmail(authEmail);
          fetchAllData();
          return;
        }

        const emailToCheck = authEmail;
        if (emailToCheck) {
          const { data: adminRecord } = await supabase
            .from('admin_users')
            .select('*')
            .eq('email', emailToCheck)
            .maybeSingle();

          if (adminRecord) {
            setActorEmail(emailToCheck);
            setCurrentAdminRole(adminRecord.role);
            setCurrentPermissions(adminRecord.permissions || {});
            fetchAllData();
            return;
          }
        }

        if (!authEmail) { router.replace('/register'); return; }
        alert(isAr ? '⛔ عذراً، غير مسموح لك بالدخول. هذه لوحة تحكم الإدارة العليا.' : 'Access Denied: Admins Only.');
        router.replace('/dashboard');
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

      const { data: logsData } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50);
      if (logsData) setAuditLogs(logsData);

      const { data: bcData } = await supabase.from('broadcasts').select('*').order('created_at', { ascending: false }).limit(5);
      if (bcData) setBroadcasts(bcData);

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
    if (!guard('manage_stores')) { e.preventDefault(); return; }
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
      logAction('store.create', { name: newStoreData.store_name, slug: cleanSlug });
      alert(isAr ? '✅ تم إنشاء المتجر بنجاح' : 'Store created successfully');
      setNewStoreModal(false);
      setNewStoreData({ store_name: '', store_slug: '', owner_name: '', phone: '', currency: 'USD', initial_wallet: 10 });
      fetchAllData();
    } else {
      alert(error.message);
    }
  };

  const handleToggleStoreStatus = async (storeId, currentStatus) => {
    if (!guard('manage_stores')) return;
    const nextStatus = !currentStatus;
    const { error } = await supabase
      .from('store_profiles')
      .update({ is_active: nextStatus })
      .eq('id', storeId);

    if (!error) {
      setStores(prev => prev.map(s => s.id === storeId ? { ...s, is_active: nextStatus } : s));
      logAction(nextStatus ? 'store.activate' : 'store.deactivate', { store_id: storeId });
    }
  };

  const handleUpdateWallet = async (storeId, currentBalance) => {
    if (!guard('manage_stores')) return;
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
      logAction('wallet.update', { store_id: storeId, from: currentBalance, to: num });
    }
  };

  const handleChangePlan = async (storeId, plan) => {
    if (!guard('manage_finance')) return;
    const { error } = await supabase.from('store_profiles').update({ plan_type: plan }).eq('id', storeId);
    if (!error) {
      setStores(prev => prev.map(s => s.id === storeId ? { ...s, plan_type: plan } : s));
      logAction('store.plan', { store_id: storeId, plan });
    } else alert(error.message);
  };

  const handleSendBroadcast = async () => {
    if (!guard('manage_admins')) return;
    const msg = broadcastMessage.trim();
    if (!msg) return;
    const { error } = await supabase.from('broadcasts').insert([{ message: msg, created_by: actorEmail || SUPER_ADMIN_EMAIL }]);
    if (error) { alert(error.message); return; }
    logAction('broadcast.send', { length: msg.length });
    setBroadcastMessage('');
    fetchAllData();
    alert(isAr ? '✅ تم إرسال التنبيه لجميع التجار' : 'Broadcast sent');
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    if (!guard('manage_orders')) return;
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (!error) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      logAction('order.status', { order_id: orderId, status: newStatus });
    }
  };

  const handleCreateProduct = async (e) => {
    if (!guard('manage_stores')) { e.preventDefault(); return; }
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
      logAction('product.create', { title: newProductData.title });
      alert(isAr ? '✅ تمت إضافة المنتج بنجاح' : 'Product added successfully');
      setNewProductModal(false);
      setNewProductData({ title: '', price: '', cost_price: '', stock: 100, store_id: '' });
      fetchAllData();
    } else {
      alert(error.message);
    }
  };

  const handleCreateAdmin = async (e) => {
    if (!guard('manage_admins')) { e.preventDefault(); return; }
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
      logAction('admin.create', { email: cleanEmail, permissions: newAdminData.permissions });
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
    if (!guard('manage_admins')) return;
    if (email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      alert(isAr ? '⚠️ لا يمكن حذف حساب المالك الأساسي للنظام!' : 'Primary Super Admin cannot be deleted!');
      return;
    }
    if (!confirm(isAr ? `هل أنت متأكد من إلغاء صلاحيات المسؤول ${email}؟` : `Revoke access for ${email}?`)) return;

    const { error } = await supabase.from('admin_users').delete().eq('id', id);
    if (!error) {
      setAdminUsers(prev => prev.filter(a => a.id !== id));
      logAction('admin.revoke', { email });
    }
  };

  const handleSavePlatformSettings = async () => {
    if (!guard('manage_finance')) return;
    const { error } = await supabase.from('platform_settings').upsert({
      id: 1,
      exchange_rate: parseFloat(exchangeRate),
      commission_percentage: parseFloat(platformCommission),
      withdraw_threshold: parseFloat(withdrawThreshold),
      updated_at: new Date().toISOString()
    });

    if (!error) {
      logAction('settings.update', { exchangeRate, platformCommission, withdrawThreshold });
      alert(isAr ? '✅ تم حفظ إعدادات النظام وسعر الصرف بنجاح' : 'Settings saved successfully');
    } else {
      alert(error.message);
    }
  };

  const totalStoresCount = stores.length;
  const pendingOrdersCount = orders.filter(o => o.status === 'pending' || !o.status).length;
  const activeStoresCount = stores.filter(s => s.is_active !== false).length;
  const totalSalesAmount = orders.reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0);

  // ===================== التحليلات (كلها من بيانات حقيقية) =====================
  const sumPrice = (list) => list.reduce((a, o) => a + (Number(o.total_price) || 0), 0);
  const dayKey = (d) => {
    const x = new Date(d);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
  };
  const days30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (29 - i));
    return d;
  });
  const bucket = (list, getVal) => {
    const m = {};
    list.forEach((o) => {
      if (!o.created_at) return;
      const k = dayKey(o.created_at);
      m[k] = (m[k] || 0) + getVal(o);
    });
    return days30.map((d) => m[dayKey(d)] || 0);
  };
  const isPending = (o) => o.status === 'pending' || !o.status;
  const salesSeries30 = bucket(orders, (o) => Number(o.total_price) || 0);
  const ordersSeries30 = bucket(orders, () => 1);
  const pendingSeries30 = bucket(orders.filter(isPending), () => 1);
  const newStoresSeries30 = bucket(stores, () => 1);
  const activeSeries30 = (() => {
    const m = {};
    orders.forEach((o) => {
      if (!o.created_at) return;
      const k = dayKey(o.created_at);
      (m[k] = m[k] || new Set()).add(o.store_id || 'x');
    });
    return days30.map((d) => (m[dayKey(d)] ? m[dayKey(d)].size : 0));
  })();

  const monthIdx = (d) => { const x = new Date(d); return x.getFullYear() * 12 + x.getMonth(); };
  const curMonth = monthIdx(new Date());
  const inMonth = (list, off) => list.filter((x) => x.created_at && monthIdx(x.created_at) === curMonth - off);
  const pct = (c, p) => (p > 0 ? ((c - p) / p) * 100 : c > 0 ? 100 : 0);
  const pctLabel = (v) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;
  const salesGrowth = pct(sumPrice(inMonth(orders, 0)), sumPrice(inMonth(orders, 1)));
  const storesThisMonth = inMonth(stores, 0).length;
  const activeRatePct = totalStoresCount ? Math.round((activeStoresCount / totalStoresCount) * 100) : 0;

  const deliveredSales = sumPrice(orders.filter((o) => o.status === 'delivered'));
  const commissionEarned = (deliveredSales * (Number(platformCommission) || 0)) / 100;
  const avgOrderValue = orders.length ? totalSalesAmount / orders.length : 0;
  const walletsTotalUsd = stores.reduce((a, s) => a + (Number(s.wallet_balance_usd) || 0), 0);
  const lowStockCount = products.filter((p) => (Number(p.stock_quantity) || 0) <= 5).length;

  const chartDays = days30.slice(-range);
  const chartLabels = chartDays.map((d) => `${d.getDate()}/${d.getMonth() + 1}`);
  const chartSales = salesSeries30.slice(-range);
  const chartOrders = ordersSeries30.slice(-range);

  const statusMeta = [
    { key: 'pending', label: isAr ? 'بانتظار الشحن' : 'Pending', color: '#f2a066' },
    { key: 'confirmed', label: isAr ? 'تم التأكيد' : 'Confirmed', color: '#c9a45c' },
    { key: 'shipped', label: isAr ? 'تم الشحن' : 'Shipped', color: '#5fb7bb' },
    { key: 'delivered', label: isAr ? 'تم التسليم' : 'Delivered', color: '#0a7f86' },
    { key: 'cancelled', label: isAr ? 'ملغي' : 'Cancelled', color: '#c95e53' },
  ];
  const statusSegments = statusMeta.map((m) => ({
    label: m.label,
    color: m.color,
    value: orders.filter((o) => (o.status || 'pending') === m.key).length,
  }));

  const groupTop = (list, keyFn, valFn, limit) => {
    const m = {};
    list.forEach((o) => { const k = keyFn(o); if (!k) return; m[k] = (m[k] || 0) + valFn(o); });
    return Object.entries(m).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, limit);
  };
  const topGovernorates = groupTop(orders, (o) => o.governorate, () => 1, 6);
  const storeName = (id) => stores.find((s) => s.user_id === id)?.store_name || id;
  const topStores = groupTop(orders, (o) => o.store_id, (o) => Number(o.total_price) || 0, 5).map((x) => ({ ...x, label: storeName(x.label) }));
  const topProducts = products
    .filter((p) => Number(p.price) > 0)
    .map((p) => ({ ...p, margin: ((Number(p.price) - (Number(p.cost_price) || 0)) / Number(p.price)) * 100 }))
    .sort((a, b) => b.margin - a.margin)
    .slice(0, 6);

  const navItemsAll = [
    { id: 'overview', title: t.navOverview, icon: '📊', count: null },
    { id: 'merchants', title: t.navStores, icon: '🏬', count: totalStoresCount },
    { id: 'billing', title: 'الحصص والاشتراكات', icon: '💳', count: null },
    { id: 'orders', title: t.navOrders, icon: '📦', count: orders.length },
    { id: 'inventory', title: t.navInventory, icon: '🏷️', count: products.length },
    { id: 'integrations', title: t.navIntegrations, icon: '🔌', count: null },
    { id: 'admins', title: t.navAdmins, icon: '🛡️', count: adminUsers.length + 1 },
    { id: 'rates', title: t.navRates, icon: '💱', count: null },
    { id: 'domains', title: t.navDomains, icon: '🌐', count: domains.length },
    { id: 'plans', title: t.navPlans, icon: '💎', count: null },
    { id: 'audit', title: t.navLogs, icon: '📑', count: auditLogs.length },
    { id: 'broadcast', title: t.navBroadcast, icon: '📢', count: null },
  ];

  const navItems = navItemsAll.filter((i) => tabAllowed(i.id));

  const upCls = 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  const downCls = 'text-rose-500 bg-rose-500/10 border-rose-500/20';
  const statCards = [
    {
      id: 'stores',
      title: t.statStores,
      value: totalStoresCount.toString(),
      change: `${storesThisMonth >= 0 ? '+' : ''}${storesThisMonth} ${isAr ? 'هذا الشهر' : 'this month'}`,
      icon: '🏬',
      badgeColor: upCls,
      desc1: isAr ? 'متاجر جديدة آخر 30 يوم' : 'New stores, last 30 days',
      desc2: t.statStores,
      progress: `${Math.min(100, totalStoresCount * 10)}%`,
      spark: newStoresSeries30,
    },
    {
      id: 'pending',
      title: t.statPending,
      value: pendingOrdersCount.toString(),
      change: `${pendingOrdersCount} ${t.ordersCount}`,
      icon: '⏳',
      badgeColor: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
      desc1: t.underProcess,
      desc2: isAr ? 'من إجمالي الطلبات' : 'of all orders',
      progress: orders.length ? `${Math.round((pendingOrdersCount / orders.length) * 100)}%` : '0%',
      spark: pendingSeries30,
    },
    {
      id: 'active',
      title: t.statActiveUsers,
      value: activeStoresCount.toString(),
      change: `${activeRatePct}% ${t.activeStatus}`,
      icon: '🟢',
      badgeColor: upCls,
      desc1: t.activeRate,
      desc2: `${activeStoresCount}/${totalStoresCount}`,
      progress: `${activeRatePct}%`,
      spark: activeSeries30,
    },
    {
      id: 'sales',
      title: t.statSales,
      value: `${fmt(totalSalesAmount, 2)} ج.م`,
      change: pctLabel(salesGrowth),
      icon: '💰',
      badgeColor: salesGrowth >= 0 ? 'text-[#00B050] bg-[#00B050]/10 border-[#00B050]/20' : downCls,
      desc1: t.comparedLastMonth,
      desc2: `${fmt(orders.length)} ${t.ordersCount}`,
      progress: `${Math.min(100, Math.max(5, Math.round(50 + salesGrowth / 2)))}%`,
      spark: salesSeries30,
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
      data-theme={isDark ? 'dark' : 'light'}
      className={`spike-dashboard min-h-screen font-sans flex relative overflow-x-hidden transition-colors duration-200 ${
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
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
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

          {/* 👑 متاجر الأدمن الخاصة — داخل السكرول */}
          <button
            data-admin-stores
            onClick={() => {
              localStorage.setItem('merchant_user_id', 'main_flagship_owner');
              router.push('/dashboard');
            }}
            className="w-full py-2 mt-3 bg-gradient-to-r from-[#00B050] to-emerald-600 text-white rounded-xl text-xs font-black shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
            title="الدخول إلى متاجر الأدمن الخاصة بك"
          >
            <span>👑</span>
            <span>{t.adminStoresBtn}</span>
          </button>

          {/* 🚪 بيانات المشرف وتسجيل الخروج — تظهر عند النزول */}
          <div className={`px-1 pt-4 mt-3 border-t flex flex-col gap-2.5 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
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
        </nav>

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
              type="button"
              onClick={toggleLanguage}
              className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                isDark
                  ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 shadow-2xs'
              }`}
              title={isAr ? 'English' : 'العربية'}
            >
              <span>🌐</span>
              <span className="font-mono">{isAr ? 'EN' : 'العربية'}</span>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                isDark
                  ? 'border-slate-700 bg-slate-800 text-amber-300 hover:bg-slate-700'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 shadow-2xs'
              }`}
              title={isDark ? 'الوضع النهاري' : 'الوضع الليلي'}
            >
              <span>{isDark ? '☀️' : '🌙'}</span>
              <span className="hidden sm:inline">{isDark ? 'نهاري' : 'ليلي'}</span>
            </button>

            <AdminBell isDark={isDark} onNewOrder={fetchAllData} onOpenTab={(id) => setActiveTab(id)} />
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
          {shown('overview') && (
            <>
              {/* مؤشرات رئيسية */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {statCards.map((stat, i) => (
                  <div
                    key={i}
                    role="button"
                    tabIndex={0}
                    onClick={() => setStatModal(stat.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setStatModal(stat.id); } }}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg flex flex-col justify-between ${
                      isDark ? 'bg-[#0E1E38] border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-md border ${stat.badgeColor}`}>{stat.change}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{stat.title}</span>
                        <span className="text-base">{stat.icon}</span>
                      </div>
                    </div>
                    <div className="space-y-1 text-left" dir="ltr">
                      <span className="text-2xl font-black font-mono tracking-tight block">{stat.value}</span>
                      <span className="text-[10px] text-slate-400 block font-medium">{stat.desc1}</span>
                    </div>
                    <div className="mt-2" dir="ltr"><Sparkline data={stat.spark} /></div>
                    <div className="mt-2 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-center text-[10px] text-slate-400 font-medium">
                      <span>{stat.desc2}</span>
                      <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: stat.progress }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* مؤشرات مالية ثانوية */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {[
                  { icon: '🏦', label: isAr ? 'عمولة المنصة (طلبات مسلّمة)' : 'Platform commission', val: `${fmt(commissionEarned, 2)} ج.م` },
                  { icon: '🧾', label: isAr ? 'متوسط قيمة الطلب' : 'Avg order value', val: `${fmt(avgOrderValue, 2)} ج.م` },
                  { icon: '👛', label: isAr ? 'إجمالي محافظ التجار' : 'Merchant wallets', val: `$${fmt(walletsTotalUsd, 2)}` },
                  { icon: '⚠️', label: isAr ? 'منتجات مخزونها ≤ 5' : 'Low stock items', val: String(lowStockCount) },
                ].map((k, i) => (
                  <div key={i} className="p-5 rounded-2xl border">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-2"><span className="text-base">{k.icon}</span>{k.label}</div>
                    <div className="text-xl font-black font-mono" dir="ltr">{k.val}</div>
                  </div>
                ))}
              </div>

              {/* الرسم الرئيسي + حالة الطلبات */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-5">
                <ChartCard
                  className="xl:col-span-2"
                  title={metric === 'sales' ? (isAr ? 'المبيعات اليومية' : 'Daily sales') : (isAr ? 'الطلبات اليومية' : 'Daily orders')}
                  subtitle={isAr ? `آخر ${range} يوم` : `Last ${range} days`}
                  right={
                    <div className="flex flex-col items-end gap-2">
                      <Segmented
                        value={metric}
                        onChange={setMetric}
                        options={[{ value: 'sales', label: isAr ? 'المبيعات' : 'Sales' }, { value: 'orders', label: isAr ? 'الطلبات' : 'Orders' }]}
                      />
                      <Segmented
                        value={range}
                        onChange={setRange}
                        options={[{ value: 7, label: isAr ? '7 أيام' : '7d' }, { value: 30, label: isAr ? '30 يوم' : '30d' }]}
                      />
                    </div>
                  }
                >
                  <AreaChart
                    labels={chartLabels}
                    values={metric === 'sales' ? chartSales : chartOrders}
                    unit={metric === 'sales' ? 'ج.م' : isAr ? 'طلب' : 'orders'}
                    name={metric}
                  />
                </ChartCard>

                <ChartCard title={isAr ? 'حالة الطلبات' : 'Order status'} subtitle={isAr ? 'توزيع كل الطلبات' : 'All orders'}>
                  <Donut segments={statusSegments} centerValue={fmt(orders.length)} centerLabel={isAr ? 'طلب' : 'orders'} />
                </ChartCard>
              </div>

              {/* محافظات + متاجر + طلبات يومية */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
                <ChartCard title={isAr ? 'أكثر المحافظات طلباً' : 'Top governorates'} subtitle={isAr ? 'عدد الطلبات' : 'Order count'}>
                  <HBarList items={topGovernorates} unit={isAr ? 'طلب' : ''} empty={isAr ? 'لا توجد بيانات بعد' : 'No data yet'} />
                </ChartCard>
                <ChartCard title={isAr ? 'أفضل المتاجر مبيعاً' : 'Top stores'} subtitle={isAr ? 'بالجنيه' : 'EGP'}>
                  <HBarList items={topStores} unit="ج.م" color="var(--orange)" empty={isAr ? 'لا توجد بيانات بعد' : 'No data yet'} />
                </ChartCard>
                <ChartCard title={isAr ? 'عدد الطلبات' : 'Orders per day'} subtitle={isAr ? `آخر ${range} يوم` : `Last ${range} days`}>
                  <BarChart labels={chartLabels} values={chartOrders} height={210} />
                </ChartCard>
              </div>

              {/* المنتجات الأعلى هامش ربح */}
              <ChartCard title={isAr ? 'المنتجات الأعلى هامش ربح' : 'Highest-margin products'} subtitle={isAr ? 'من سعر البيع وسعر التكلفة' : 'From price and cost'}>
                {topProducts.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs">{isAr ? 'أضف منتجات بسعر وتكلفة لتظهر هنا' : 'Add products with price and cost'}</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr>
                          <th className="p-3 text-right">المنتج</th>
                          <th className="p-3 text-right">المخزون</th>
                          <th className="p-3 text-right">هامش الربح</th>
                          <th className="p-3 text-right">سعر البيع</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topProducts.map((p, i) => (
                          <tr key={i}>
                            <td className="p-3 font-bold">{p.title}</td>
                            <td className="p-3 font-mono">{p.stock_quantity || 0}</td>
                            <td className="p-3" style={{ minWidth: 180 }}>
                              <div className="flex items-center gap-3">
                                <div className="flex-1"><ProgressBar value={p.margin} color={p.margin < 15 ? 'var(--orange)' : 'var(--teal)'} /></div>
                                <span className="font-mono text-[11px] w-12 text-left" dir="ltr">{p.margin.toFixed(0)}%</span>
                              </div>
                            </td>
                            <td className="p-3 font-mono font-bold text-[#00B050]">{fmt(p.price, 2)} ج.م</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </ChartCard>

              <div className={`p-6 sm:p-8 rounded-3xl border transition-colors ${
                isDark ? 'bg-[#0E1E38] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-base font-black">{isAr ? 'آخر طلبات المنصة الحية' : 'Latest Live Platform Orders'}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{isAr ? 'مزامنة لحظية للعمليات مع تأكيد الدفع والشحن' : 'Real-time sync'}</p>
                  </div>
                  {can('manage_orders') && (
                    <button onClick={() => setActiveTab('orders')} className="text-xs text-[#00B050] font-bold hover:underline cursor-pointer">
                      {isAr ? 'عرض كل الطلبات ←' : 'View all orders →'}
                    </button>
                  )}
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
          {shown('admins') && (
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
          {shown('merchants') && (
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
                      <th className="p-3 text-right">الباقة</th>
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
                          <select
                            value={s.plan_type || 'starter'}
                            onChange={(e) => handleChangePlan(s.id, e.target.value)}
                            disabled={!can('manage_finance')}
                            style={{ minHeight: 34, padding: '4px 10px', fontSize: 12 }}
                          >
                            <option value="starter">Starter</option>
                            <option value="pro">Pro</option>
                            <option value="scale">Scale</option>
                          </select>
                        </td>
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
          {shown('orders') && (
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
          {shown('inventory') && (
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
          {shown('rates') && (
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
          {shown('domains') && (
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
         {shown('plans') && <><PaymentNote isDark={isDark} /><ThemeColors isDark={isDark} /><AdminBilling isDark={isDark} initial="plans" onChanged={fetchAllData} /></>}
          {shown('billing') && <AdminBilling isDark={isDark} initial="stores" onChanged={fetchAllData} />}

          {/* تبويب سجل الحركات */}
          {shown('audit') && (
            <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#0E1E38] border-slate-800' : 'bg-white border-slate-200'}`}>
              <h3 className="text-lg font-black mb-4">سجل الحركات الإدارية (Audit Logs)</h3>
              {auditLogs.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">لا توجد حركات مسجلة مؤخراً</div>
              ) : (
                <div className="space-y-2 text-xs font-mono">
                  {auditLogs.map((log, i) => (
                    <div key={i} className="p-3 border rounded-xl flex justify-between">
                      <span className="font-bold">{log.action}</span>
                      <span className="text-slate-400 truncate mx-3 flex-1" dir="ltr">{log.actor_email || ''}</span>
                      <span className="text-slate-400" dir="ltr">{log.created_at ? new Date(log.created_at).toLocaleString() : ''}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* تبويب التكاملات والإضافات */}
          {shown('integrations') && (
            <SpikeIntegrations
              stores={stores}
              isAr={isAr}
              canManage={can('manage_stores')}
              onLog={logAction}
              onImported={fetchAllData}
            />
          )}

          {/* تبويب الإعلانات الجماعية */}
          {shown('broadcast') && (
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
                onClick={handleSendBroadcast}
                className="px-5 py-2.5 bg-[#00B050] text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                إرسال الإعلان الآن
              </button>
              {broadcasts.length > 0 && (
                <div className="mt-6 space-y-2">
                  <div className="text-xs font-black text-slate-400">آخر الإعلانات المرسلة</div>
                  {broadcasts.map((b) => (
                    <div key={b.id} className="p-3 rounded-xl border text-xs">
                      <div>{b.message}</div>
                      <div className="text-[10px] text-slate-400 mt-1 font-mono" dir="ltr">{new Date(b.created_at).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* مودال تفاصيل المؤشرات (يفتح عند الضغط على كارت من الأعلى) */}
      {statModal && (() => {
        const cfgMap = {
          stores:  { title: isAr ? 'إجمالي المتاجر' : 'All stores', kind: 'stores', rows: stores, tab: 'merchants' },
          active:  { title: isAr ? 'المتاجر المفعلة' : 'Active stores', kind: 'stores', rows: stores.filter(s => s.is_active !== false), tab: 'merchants' },
          pending: { title: isAr ? 'طلبات بانتظار الشحن' : 'Pending orders', kind: 'orders', rows: orders.filter(o => o.status === 'pending' || !o.status), tab: 'orders' },
          sales:   { title: isAr ? 'إجمالي المبيعات' : 'Total sales', kind: 'orders', rows: orders, tab: 'orders' },
        };
        const cfg = cfgMap[statModal];
        if (!cfg) return null;
        return (
          <div onClick={() => setStatModal(null)} className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div
              onClick={(e) => e.stopPropagation()}
              className={`p-6 rounded-2xl max-w-3xl w-full border ${isDark ? 'bg-[#0E1E38] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
            >
              <div className="flex justify-between items-center mb-4 gap-3">
                <h3 className="text-base font-black !mb-0">{cfg.title} ({cfg.rows.length})</h3>
                <button type="button" onClick={() => setStatModal(null)} className="border rounded-xl cursor-pointer">
                  {isAr ? 'إغلاق' : 'Close'}
                </button>
              </div>

              {cfg.rows.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">
                  {isAr ? 'لا توجد بيانات لعرضها' : 'Nothing to show yet'}
                </div>
              ) : (
                <div className="overflow-auto" style={{ maxHeight: '55vh' }}>
                  {cfg.kind === 'stores' ? (
                    <table className="w-full text-xs">
                      <thead>
                        <tr>
                          <th className="p-3 text-right">المتجر</th>
                          <th className="p-3 text-right">المالك</th>
                          <th className="p-3 text-right">الهاتف</th>
                          <th className="p-3 text-right">رصيد المحفظة</th>
                          <th className="p-3 text-right">الحالة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cfg.rows.map((s, idx) => (
                          <tr key={idx}>
                            <td className="p-3">
                              <span className="font-bold block">{s.store_name}</span>
                              <span className="text-[10px] text-slate-400 font-mono" dir="ltr">{s.store_slug}.spike.shop</span>
                            </td>
                            <td className="p-3">{s.owner_name || '—'}</td>
                            <td className="p-3 font-mono" dir="ltr">{s.phone || '—'}</td>
                            <td className="p-3 font-mono font-bold text-emerald-500">${s.wallet_balance_usd || 0}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                s.is_active !== false ? 'bg-emerald-500/15 text-emerald-600' : 'bg-rose-500/15 text-rose-500'
                              }`}>
                                {s.is_active !== false ? 'مفعل' : 'معطل'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <table className="w-full text-xs">
                      <thead>
                        <tr>
                          <th className="p-3 text-right">رقم الطلب</th>
                          <th className="p-3 text-right">العميل</th>
                          <th className="p-3 text-right">المحافظة</th>
                          <th className="p-3 text-right">الإجمالي</th>
                          <th className="p-3 text-right">الحالة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cfg.rows.map((o, idx) => (
                          <tr key={idx}>
                            <td className="p-3 font-mono font-bold">#{o.id}</td>
                            <td className="p-3">{o.customer_name || 'عميل نقدي'}</td>
                            <td className="p-3">{o.governorate || '—'}</td>
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
                  )}
                </div>
              )}

              <div className="flex justify-between items-center gap-3 pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-400 font-mono" dir="ltr">
                  {statModal === 'sales' ? `${totalSalesAmount.toFixed(2)} ج.م` : ''}
                </span>
                <button
                  type="button"
                  onClick={() => { setActiveTab(cfg.tab); setStatModal(null); }}
                  className="px-4 py-2 bg-[#00B050] text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  {isAr ? 'فتح الصفحة الكاملة' : 'Open full page'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

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

      {/* ===== SPIKE admin theme — استبدل بلوك <style jsx global> القديم بالكامل بهذا ===== */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap');

        /* ---------- Tokens ---------- */
        .spike-dashboard {
          --teal: #0a7f86;
          --teal-deep: #06494e;
          --teal-ink: #052f33;
          --orange: #f2a066;
          --gold: #c9a45c;
          --ivory: #f6f2e7;
          --bg: #ece8d8;
          --surface: #fcfbf7;
          --surface-2: #f3f0e4;
          --line: #e2ddca;
          --ink: #1f2f33;
          --muted: #6f7f82;
          --accent-text: #0a7f86;
          --danger: #c95e53;
          --shadow: 0 10px 30px -14px rgba(6, 73, 78, 0.22);
          font-family: 'Cairo', 'Inter', sans-serif;
          font-size: 14px;
          color: var(--ink);
          background:
            radial-gradient(1100px 480px at 100% -10%, rgba(10, 127, 134, 0.10), transparent 60%),
            radial-gradient(800px 420px at 0% 110%, rgba(242, 160, 102, 0.13), transparent 60%),
            var(--bg) !important;
        }
        .spike-dashboard[data-theme='dark'] {
          --bg: #07252a;
          --surface: #0d3339;
          --surface-2: #11404a;
          --line: #1f4f57;
          --ink: #eaf2ef;
          --muted: #93b0b2;
          --accent-text: #5fd0d3;
          --danger: #ff9d94;
          --shadow: 0 14px 34px -16px rgba(0, 0, 0, 0.65);
        }
        .spike-dashboard * { box-sizing: border-box; }
        .spike-dashboard button,
        .spike-dashboard input,
        .spike-dashboard select,
        .spike-dashboard textarea { font-family: inherit; }

        /* ---------- Type scale (يرفع الخطوط الصغيرة جداً) ---------- */
        .spike-dashboard [class~='text-xs'] { font-size: 13px; }
        .spike-dashboard [class*='text-[11px]'] { font-size: 12px; }
        .spike-dashboard [class*='text-[10px]'] { font-size: 11.5px; }
        .spike-dashboard [class*='text-[9px]'] { font-size: 11px; }
        .spike-dashboard h3 { color: var(--ink); line-height: 1.5; font-weight: 800; }
        .spike-dashboard .font-mono {
          font-family: 'Inter', 'Cairo', sans-serif;
          font-variant-numeric: tabular-nums;
        }
        .spike-dashboard .text-slate-400,
        .spike-dashboard .text-slate-500 { color: var(--muted); }
        .spike-dashboard [class*='text-emerald-'],
        .spike-dashboard [class*='text-[#00B050]'] { color: var(--accent-text); }
        .spike-dashboard .bg-emerald-500 { background: var(--teal); }

        /* ---------- Layout ---------- */
        .spike-dashboard > main { min-width: 0; }
        @media (min-width: 1024px) {
          .spike-dashboard > aside {
            position: sticky !important;
            top: 0 !important;
            bottom: auto !important;
            left: auto !important;
            right: auto !important;
            height: 100vh;
            width: 288px;
            flex: 0 0 288px;
            transform: none !important;
          }
        }
        @media (max-width: 1023px) {
          .spike-dashboard > aside { width: 288px; }
        }
        @media (min-width: 1024px) {
          .spike-dashboard button[class*='lg:hidden'] { display: none; }
        }

        /* ---------- Header ---------- */
        .spike-dashboard header {
          min-height: 76px;
          background: color-mix(in srgb, var(--surface) 88%, transparent);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid var(--line);
        }
        .spike-dashboard header::after {
          content: '';
          position: absolute;
          inset-inline: 0;
          bottom: -1px;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--gold), transparent);
          opacity: 0.55;
          pointer-events: none;
        }

        /* ---------- Buttons: حجم موحد وطبيعي ---------- */
        .spike-dashboard button {
          align-items: center;
          justify-content: center;
          gap: 6px;
          min-height: 38px;
          padding-inline: 14px;
          font-size: 13px;
          font-weight: 700;
          line-height: 1.2;
          white-space: nowrap;
          border: 1px solid transparent;
          border-radius: 12px;
          cursor: pointer;
          transition: background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
        }
        .spike-dashboard button:active { transform: scale(0.97); }
        .spike-dashboard button:disabled { opacity: 0.6; cursor: not-allowed; }
        .spike-dashboard button[class*='w-8'],
        .spike-dashboard button[class*='w-9'] { width: 38px; padding: 0; }

        /* أزرار الحدود (ثانوية) */
        .spike-dashboard button[class~='border'] {
          background: var(--surface);
          border-color: var(--line);
          color: var(--ink);
        }
        .spike-dashboard button[class~='border']:hover { background: var(--surface-2); }

        /* الأزرار الأساسية */
        .spike-dashboard button[class*='bg-[#00B050]']:not([class*='bg-[#00B050]/']) {
          background: var(--teal);
          border-color: var(--teal);
          color: #fff;
          box-shadow: 0 6px 14px -6px rgba(10, 127, 134, 0.55);
        }
        .spike-dashboard button[class*='bg-[#00B050]']:not([class*='bg-[#00B050]/']):hover {
          background: var(--teal-deep);
          border-color: var(--teal-deep);
        }
        .spike-dashboard button[class*='hover:underline'] {
          background: none;
          border: 0;
          min-height: 0;
          padding: 0;
          box-shadow: none;
        }
        .spike-dashboard form button[type='submit'] { min-height: 44px; }

        /* أزرار داخل الجداول: أصغر قليلاً لكن مريحة للّمس */
        .spike-dashboard td button {
          min-height: 32px;
          padding-inline: 12px;
          font-size: 12px;
          border-radius: 10px;
          margin-inline: 2px;
          background: var(--surface-2);
          border-color: var(--line);
          color: var(--ink);
          box-shadow: none;
        }
        .spike-dashboard td button[class*='bg-[#00B050]/'],
        .spike-dashboard td button[class*='bg-emerald'] {
          background: color-mix(in srgb, var(--teal) 13%, transparent);
          border-color: color-mix(in srgb, var(--teal) 32%, transparent);
          color: var(--accent-text);
        }
        .spike-dashboard td button[class*='bg-rose'],
        .spike-dashboard td button[class*='text-rose-500']:not([class*='bg-']) {
          background: color-mix(in srgb, #dc5a50 12%, transparent);
          border-color: color-mix(in srgb, #dc5a50 32%, transparent);
          color: var(--danger);
        }
        .spike-dashboard td select { min-height: 34px; padding: 4px 10px; font-size: 12px; }

        /* ---------- Cards ---------- */
        .spike-dashboard main div[class*='rounded-2xl'],
        .spike-dashboard main div[class*='rounded-3xl'] {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 20px;
          box-shadow: var(--shadow);
        }
        .spike-dashboard div[class*='rounded-xl'][class*='border'] {
          border-color: var(--line);
          background: var(--surface-2);
        }
        /* بطاقات المؤشرات: شريط برتقالي صغير = لمسة الهوية الوحيدة في الصفحة */
        .spike-dashboard .grid > div[class*='p-5'] { position: relative; overflow: hidden; }
        .spike-dashboard .grid > div[class*='p-5']::before {
          content: '';
          position: absolute;
          top: 0;
          inset-inline-start: 20px;
          width: 44px;
          height: 3px;
          border-radius: 0 0 4px 4px;
          background: var(--orange);
        }
        .spike-dashboard span[class*='text-2xl'] { font-size: 28px; font-weight: 800; letter-spacing: -0.02em; }

        /* ---------- Tables ---------- */
        .spike-dashboard table { min-width: 640px; border-collapse: separate; border-spacing: 0; font-size: 13px; }
        .spike-dashboard thead th {
          padding: 12px 14px;
          background: var(--surface-2);
          color: var(--muted);
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }
        .spike-dashboard thead th:first-child { border-start-start-radius: 12px; border-end-start-radius: 12px; }
        .spike-dashboard thead th:last-child { border-start-end-radius: 12px; border-end-end-radius: 12px; }
        .spike-dashboard tbody td { padding: 14px; border-bottom: 1px solid var(--line); vertical-align: middle; }
        .spike-dashboard tbody tr:last-child td { border-bottom: 0; }
        .spike-dashboard tbody tr:hover { background: color-mix(in srgb, var(--teal) 6%, transparent); }

        /* ---------- Inputs ---------- */
        .spike-dashboard input:not([type='checkbox']):not([type='radio']),
        .spike-dashboard select,
        .spike-dashboard textarea {
          min-height: 44px;
          padding: 10px 14px;
          font-size: 14px;
          color: var(--ink);
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 12px;
        }
        .spike-dashboard textarea { min-height: 110px; line-height: 1.7; }
        .spike-dashboard input[type='checkbox'] { width: 16px; height: 16px; accent-color: var(--teal); }
        .spike-dashboard input:focus,
        .spike-dashboard select:focus,
        .spike-dashboard textarea:focus {
          outline: none;
          border-color: var(--teal);
          box-shadow: 0 0 0 4px color-mix(in srgb, var(--teal) 16%, transparent);
        }
        .spike-dashboard button:focus-visible {
          outline: 3px solid color-mix(in srgb, var(--teal) 35%, transparent);
          outline-offset: 2px;
        }

        /* ---------- Sidebar: فاتح، والأزرار الغامقة ---------- */
        .spike-dashboard {
          --nav-active-bg: var(--teal-deep);
          --nav-active-ink: var(--ivory);
        }
        .spike-dashboard[data-theme='dark'] {
          --nav-active-bg: var(--ivory);
          --nav-active-ink: var(--teal-deep);
        }
        .spike-dashboard > aside {
          background: var(--surface);
          border: 0;
          color: var(--ink);
          box-shadow: 0 0 0 1px var(--line), 12px 0 40px -26px rgba(6, 73, 78, 0.35);
        }
        /* إخفاء السكرول مع بقاء التمرير شغال */
        .spike-dashboard > aside,
        .spike-dashboard > aside nav { scrollbar-width: none; -ms-overflow-style: none; }
        .spike-dashboard > aside::-webkit-scrollbar,
        .spike-dashboard > aside nav::-webkit-scrollbar { display: none; width: 0; height: 0; }

        .spike-dashboard > aside [class*='text-slate-900'],
        .spike-dashboard > aside [class*='text-white'] { color: var(--ink); }
        .spike-dashboard > aside .text-slate-400 { color: var(--muted); }
        .spike-dashboard > aside [class*='border-slate'],
        .spike-dashboard > aside .border-b,
        .spike-dashboard > aside .border-t { border-color: var(--line); }

        /* زر متاجر الأدمن (داخل القائمة) يُعرَّف بعد قواعد عناصر القائمة */
        /* عناصر القائمة */
        .spike-dashboard > aside nav { padding: 14px 12px; }
        .spike-dashboard > aside nav button {
          width: 100%;
          min-height: 46px;
          justify-content: space-between;
          padding-inline: 14px;
          font-size: 13.5px;
          font-weight: 600;
          white-space: normal;
          color: var(--ink);
          background: transparent;
          border-radius: 14px;
          box-shadow: none;
        }
        .spike-dashboard > aside nav button:hover { background: var(--surface-2); color: var(--ink); }
        .spike-dashboard > aside nav button span[class*='rounded-full'] {
          min-width: 26px;
          text-align: center;
          font-size: 11.5px;
          background: var(--surface-2);
          color: var(--muted);
        }
        .spike-dashboard > aside nav button[class*='from-[#00B050]'] {
          background: var(--nav-active-bg);
          color: var(--nav-active-ink);
          font-weight: 800;
          box-shadow: 0 10px 22px -12px rgba(6, 73, 78, 0.6);
        }
        .spike-dashboard > aside nav button[class*='from-[#00B050]']:hover {
          background: var(--nav-active-bg);
          color: var(--nav-active-ink);
        }
        .spike-dashboard > aside nav button[class*='from-[#00B050]'] span[class*='rounded-full'] {
          background: rgba(255, 255, 255, 0.18);
          color: var(--nav-active-ink);
        }
        .spike-dashboard[data-theme='dark'] > aside nav button[class*='from-[#00B050]'] span[class*='rounded-full'] {
          background: rgba(6, 73, 78, 0.14);
        }
        .spike-dashboard > aside div[class*='bg-gradient'] {
          background: linear-gradient(135deg, var(--orange), #e08f4f);
          color: #3a1d08;
        }
        .spike-dashboard > aside button[class*='rose'] {
          background: color-mix(in srgb, #dc5a50 10%, transparent);
          border-color: color-mix(in srgb, #dc5a50 30%, transparent);
          color: var(--danger);
        }
        .spike-dashboard > aside button[class*='rose']:hover {
          background: color-mix(in srgb, #dc5a50 18%, transparent);
        }

        /* زر متاجر الأدمن = اللمسة البرتقالية */
        .spike-dashboard > aside nav button[data-admin-stores] {
          justify-content: center;
          background: linear-gradient(135deg, #f4b987, #e08f4f);
          border-color: transparent;
          color: #3a1d08;
          font-weight: 800;
          box-shadow: 0 8px 18px -8px rgba(224, 143, 79, 0.7);
        }
        .spike-dashboard > aside nav button[data-admin-stores]:hover {
          background: linear-gradient(135deg, #f7c79c, #e79a5c);
          color: #3a1d08;
        }
        .spike-dashboard > aside nav button[class*='rose'] { justify-content: center; }

        /* كروت المؤشرات قابلة للضغط */
        .spike-dashboard .grid > div[class*='p-5'][role='button']:focus-visible {
          outline: 3px solid color-mix(in srgb, var(--teal) 35%, transparent);
          outline-offset: 2px;
        }

        /* ---------- Modals ---------- */
        .spike-dashboard div[class*='bg-black/'] {
          background: rgba(5, 35, 38, 0.55);
          backdrop-filter: blur(6px);
        }
        .spike-dashboard div[class*='max-w-md'],
        .spike-dashboard div[class*='max-w-3xl'] {
          max-height: 90vh;
          overflow-y: auto;
          padding: 28px;
          color: var(--ink);
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 24px;
          box-shadow: 0 30px 80px -20px rgba(3, 30, 33, 0.55);
          animation: spike-pop 0.18s ease-out;
        }
        .spike-dashboard div[class*='max-w-md'] h3,
        .spike-dashboard div[class*='max-w-3xl'] h3 { font-size: 18px; margin-bottom: 18px; }
        .spike-dashboard div[class*='max-w-md'] label,
        .spike-dashboard div[class*='max-w-3xl'] label { color: var(--muted); font-weight: 700; }
        @keyframes spike-pop {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to { opacity: 1; transform: none; }
        }

        /* ---------- Responsive + a11y ---------- */
        @media (max-width: 640px) {
          .spike-dashboard header { padding-inline: 12px; }
          .spike-dashboard main > div { padding: 14px; }
          .spike-dashboard main div[class*='rounded-2xl'],
          .spike-dashboard main div[class*='rounded-3xl'] { border-radius: 16px; }
          .spike-dashboard div[class*='max-w-md'],
          .spike-dashboard div[class*='max-w-3xl'] { padding: 20px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .spike-dashboard * { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
}
