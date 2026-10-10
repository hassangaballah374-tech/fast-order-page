'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';
import { SPIKE_LOGO_URL } from '../../components/SpikeBrandHeader';

export default function SpikeMerchantDashboard() {
  const router = useRouter();
  const { lang, theme, toggleLanguage, toggleTheme, isDark, isMobileView, toggleMobileView } = useApp();
  const isAr = lang === 'ar';

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [storeData, setStoreData] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [customDomains, setCustomDomains] = useState([]);

  const [newProductModal, setNewProductModal] = useState(false);
  const [newProductData, setNewProductData] = useState({
    title: '',
    price: '',
    cost_price: '',
    stock: 50
  });

  const [withdrawModal, setWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [domainModal, setDomainModal] = useState(false);
  const [domainName, setDomainName] = useState('');

  const t = {
    ar: {
      dashboard: 'داشبورد التاجر',
      overviewTitle: 'لوحة تحكم المتجر',
      overviewSubtitle: 'متابعة المبيعات، المنتجات، والطلبات الخاصة بمتجرك',
      addProduct: 'إضافة منتج جديد',
      refreshData: 'تحديث البيانات',
      statBalance: 'رصيد المحفظة',
      statOrders: 'إجمالي الطلبات',
      statProducts: 'المنتجات النشطة',
      statSales: 'إجمالي المبيعات',
      logoutText: 'تسجيل الخروج',
      navOverview: 'الرئيسية والمؤشرات',
      navProducts: 'منتجات المتجر',
      navOrders: 'طلبات العملاء',
      navWallet: 'المحفظة والأرباح',
      navDomains: 'الدومينات المخصصة',
      navSettings: 'إعدادات المتجر',
      save: 'حفظ التعديلات',
      cancel: 'إلغاء'
    },
    en: {
      dashboard: 'Merchant Dashboard',
      overviewTitle: 'Store Control Panel',
      overviewSubtitle: 'Monitor your sales, products, and store orders',
      addProduct: 'Add New Product',
      refreshData: 'Refresh Data',
      statBalance: 'Wallet Balance',
      statOrders: 'Total Orders',
      statProducts: 'Active Products',
      statSales: 'Total Sales',
      logoutText: 'Sign Out',
      navOverview: 'Overview & Metrics',
      navProducts: 'Store Products',
      navOrders: 'Customer Orders',
      navWallet: 'Wallet & Payouts',
      navDomains: 'Custom Domains',
      navSettings: 'Store Settings',
      save: 'Save Changes',
      cancel: 'Cancel'
    }
  }[lang || 'ar'];

  // 🚪 دالة تسجيل الخروج للتاجر
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error(err);
    }
    localStorage.clear();
    router.push('/register');
  };

  const fetchMerchantData = async () => {
    setRefreshing(true);
    try {
      const merchantId = localStorage.getItem('merchant_user_id') || localStorage.getItem('user_email');
      if (!merchantId) {
        router.push('/register');
        return;
      }

      const { data: store } = await supabase
        .from('store_profiles')
        .select('*')
        .or(`user_id.eq.${merchantId},store_slug.eq.${merchantId}`)
        .maybeSingle();

      if (store) {
        setStoreData(store);
        
        const { data: prods } = await supabase
          .from('products')
          .select('*')
          .eq('store_id', store.user_id);
        if (prods) setProducts(prods);

        const { data: ords } = await supabase
          .from('orders')
          .select('*')
          .eq('store_id', store.user_id);
        if (ords) setOrders(ords);

        const { data: doms } = await supabase
          .from('custom_domains')
          .select('*')
          .eq('user_id', store.user_id);
        if (doms) setCustomDomains(doms);
      }
    } catch (err) {
      console.error('Error fetching merchant data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMerchantData();
  }, []);

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!newProductData.title || !newProductData.price || !storeData) return;

    const { error } = await supabase.from('products').insert([{
      title: newProductData.title,
      price: parseFloat(newProductData.price) || 0,
      cost_price: parseFloat(newProductData.cost_price) || 0,
      stock_quantity: parseInt(newProductData.stock) || 0,
      store_id: storeData.user_id,
      status: 'active'
    }]);

    if (!error) {
      alert(isAr ? '✅ تمت إضافة المنتج بنجاح' : 'Product added successfully');
      setNewProductModal(false);
      setNewProductData({ title: '', price: '', cost_price: '', stock: 50 });
      fetchMerchantData();
    } else {
      alert(error.message);
    }
  };

  const handleRequestWithdrawal = async (e) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) return;

    if (amount > (storeData?.wallet_balance_usd || 0)) {
      alert(isAr ? '❌ رصيد المحفظة غير كافٍ!' : 'Insufficient wallet balance!');
      return;
    }

    alert(isAr ? '✅ تم إرسال طلب سحب الأرباح بنجاح ومراجعة الإدارة' : 'Withdrawal request submitted successfully');
    setWithdrawModal(false);
    setWithdrawAmount('');
  };

  const handleAddDomain = async (e) => {
    e.preventDefault();
    if (!domainName || !storeData) return;

    const { error } = await supabase.from('custom_domains').insert([{
      user_id: storeData.user_id,
      domain_name: domainName.trim().toLowerCase(),
      status: 'pending'
    }]);

    if (!error) {
      alert(isAr ? '✅ تمت إضافة الدومين بنجاح بانتظار الربط' : 'Domain added successfully');
      setDomainName('');
      setDomainModal(false);
      fetchMerchantData();
    } else {
      alert(error.message);
    }
  };

  const totalSalesAmount = orders.reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0);

  const navItems = [
    { id: 'overview', title: t.navOverview, icon: '📊' },
    { id: 'products', title: t.navProducts, icon: '🏷️', count: products.length },
    { id: 'orders', title: t.navOrders, icon: '📦', count: orders.length },
    { id: 'wallet', title: t.navWallet, icon: '💰' },
    { id: 'domains', title: t.navDomains, icon: '🌐', count: customDomains.length },
    { id: 'settings', title: t.navSettings, icon: '⚙️' },
  ];

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center font-sans ${isDark ? 'bg-[#0B132B] text-white' : 'bg-[#F4F6F9] text-slate-900'}`}>
        <div className="animate-pulse text-sm font-bold">جاري تحميل لوحة تحكم التاجر...</div>
      </div>
    );
  }

  return (
    <div 
      className={`min-h-screen font-sans flex relative overflow-x-hidden transition-colors duration-200 select-none ${
        isDark ? 'bg-[#0B132B] text-slate-100' : 'bg-[#F4F6F9] text-slate-800'
      }`} 
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* الشريط الجانبي الشامل للتاجر */}
      <aside className={`fixed top-0 bottom-0 ${isAr ? 'right-0' : 'left-0'} z-50 w-72 shrink-0 border-r border-l flex flex-col justify-between transition-all duration-300 ease-in-out lg:static lg:z-10 lg:translate-x-0 ${
        sidebarOpen 
          ? 'translate-x-0 shadow-2xl' 
          : isAr ? 'translate-x-full' : '-translate-x-full'
      } ${
        isDark 
          ? 'bg-[#0E1E38] border-slate-800 text-white' 
          : 'bg-white border-slate-200/90 text-slate-800 shadow-sm'
      }`}>
        
        <div className={`p-4 sm:p-5 border-b space-y-3.5 ${isDark ? 'border-slate-800' : 'border-slate-200/80'}`}>
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-rose-500 transition cursor-pointer"
            >
              ✕
            </button>

            <span className="hidden lg:inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              Merchant Partner
            </span>

            <Link href="/" className="flex items-center gap-2">
              <div className="text-right">
                <div className="flex items-center gap-1 font-black text-base sm:text-lg leading-tight">
                  <span className={isDark ? 'text-[#F7F4EC]' : 'text-[#0E1E38]'}>سبايك</span>
                  <span className="text-slate-400 font-light">|</span>
                  <span className="font-mono text-xs tracking-wider text-[#E86A53]">SPIKE</span>
                </div>
                <span className="text-[9px] text-slate-400 block font-medium">{storeData?.store_name || 'متجرك الإلكتروني'}</span>
              </div>
              <img
                src={SPIKE_LOGO_URL}
                alt="SPIKE"
                className="h-8 sm:h-9 w-auto object-contain rounded-lg shadow-xs"
              />
            </Link>
          </div>

          <div className={`p-1 rounded-xl flex items-center gap-1 border ${
            isDark ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-slate-100/90'
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

                {item.count !== undefined && (
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

        {/* زر تسجيل الخروج الثابت */}
        <div className={`p-4 border-t flex items-center justify-between ${
          isDark ? 'border-slate-800' : 'border-slate-200/80'
        }`}>
          <button 
            onClick={handleLogout}
            className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer"
            title={t.logoutText}
          >
            <span>🚪</span>
            <span>{t.logoutText}</span>
          </button>
          <div className="flex items-center gap-2.5 text-right">
            <div className="leading-tight">
              <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {storeData?.owner_name || 'التاجر'}
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">Merchant</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00B050] to-emerald-400 flex items-center justify-center text-white text-xs font-black shadow-xs">
              M
            </div>
          </div>
        </div>
      </aside>

      {/* منطقة المحتوى الرئيسية */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className={`px-4 sm:px-8 py-4 border-b flex items-center justify-between backdrop-blur-md sticky top-0 z-30 transition-colors ${
          isDark ? 'bg-[#0B132B]/95 border-slate-800' : 'bg-[#F4F6F9]/95 border-slate-200/80 shadow-xs'
        }`}>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className={`lg:hidden w-9 h-9 rounded-xl border flex items-center justify-center text-lg font-bold transition active:scale-95 cursor-pointer shadow-xs ${
                isDark 
                  ? 'border-slate-700 bg-slate-800 text-white hover:bg-slate-700' 
                  : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-100'
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
                <span className="hidden sm:inline-block text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  {storeData?.store_slug}.spike.shop
                </span>
              </div>
              <p className="hidden sm:block text-[11px] text-slate-500 dark:text-slate-400">{t.overviewSubtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setNewProductModal(true)}
              className="px-3 sm:px-4 py-2 rounded-xl bg-[#00B050] hover:bg-[#009644] text-white text-xs font-black shadow-sm transition cursor-pointer flex items-center gap-1 active:scale-95"
            >
              <span>+</span>
              <span className="hidden sm:inline">{t.addProduct}</span>
              <span className="sm:hidden">منتج</span>
            </button>

            <button 
              onClick={fetchMerchantData}
              disabled={refreshing}
              className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                isDark 
                  ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700' 
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs'
              }`}
              title="تحديث البيانات"
            >
              <span className={refreshing ? 'animate-spin' : ''}>🔄</span>
            </button>
          </div>
        </header>

        <div className="p-4 sm:p-8 space-y-6">

          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#0E1E38] border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
                  <span className="text-xs text-slate-400 block mb-1">{t.statBalance}</span>
                  <span className="text-2xl font-black font-mono text-emerald-500">${storeData?.wallet_balance_usd || 0}</span>
                </div>
                <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#0E1E38] border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
                  <span className="text-xs text-slate-400 block mb-1">{t.statOrders}</span>
                  <span className="text-2xl font-black font-mono">{orders.length}</span>
                </div>
                <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#0E1E38] border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
                  <span className="text-xs text-slate-400 block mb-1">{t.statProducts}</span>
                  <span className="text-2xl font-black font-mono">{products.length}</span>
                </div>
                <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#0E1E38] border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
                  <span className="text-xs text-slate-400 block mb-1">{t.statSales}</span>
                  <span className="text-2xl font-black font-mono text-[#E86A53]">{totalSalesAmount.toFixed(2)} ج.م</span>
                </div>
              </div>
            </>
          )}

          {activeTab === 'products' && (
            <div className={`p-4 sm:p-6 rounded-2xl border ${isDark ? 'bg-[#0E1E38] border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black">منتجات المتجر ({products.length})</h3>
                <button onClick={() => setNewProductModal(true)} className="px-4 py-2 bg-[#00B050] text-white rounded-xl text-xs font-bold cursor-pointer">+ إضافة منتج</button>
              </div>
              {products.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">لا توجد منتجات مسجلة في متجرك حتى الآن</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {products.map((p, i) => (
                    <div key={i} className="p-4 border rounded-xl space-y-2 text-xs">
                      <span className="font-bold text-sm block">{p.title}</span>
                      <div className="flex justify-between font-mono text-slate-400">
                        <span>السعر: {p.price} ج.م</span>
                        <span>المخزون: {p.stock_quantity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className={`p-4 sm:p-6 rounded-2xl border ${isDark ? 'bg-[#0E1E38] border-slate-800' : 'bg-white border-slate-200'}`}>
              <h3 className="text-lg font-black mb-4">طلبات العملاء ({orders.length})</h3>
              {orders.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">لا توجد طلبات واردة حتى الآن</div>
              ) : (
                <div className="space-y-2 text-xs font-mono">
                  {orders.map((o, i) => (
                    <div key={i} className="p-3 border rounded-xl flex justify-between items-center">
                      <span>طلب #{o.id} - {o.customer_name}</span>
                      <span className="text-emerald-500 font-bold">{o.total_price} ج.م</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'wallet' && (
            <div className={`p-6 rounded-2xl border max-w-xl ${isDark ? 'bg-[#0E1E38] border-slate-800' : 'bg-white border-slate-200'}`}>
              <h3 className="text-lg font-black mb-2">محفظة الأرباح وسحب الأموال</h3>
              <p className="text-xs text-slate-400 mb-4">الرصيد المتاح للسحب: <strong className="text-emerald-500 text-sm font-mono">${storeData?.wallet_balance_usd || 0}</strong></p>
              <button onClick={() => setWithdrawModal(true)} className="px-4 py-2.5 bg-[#00B050] text-white rounded-xl text-xs font-bold cursor-pointer">طلب سحب أرباح</button>
            </div>
          )}

          {activeTab === 'domains' && (
            <div className={`p-6 rounded-2xl border max-w-xl ${isDark ? 'bg-[#0E1E38] border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-black">الدومينات المخصصة</h3>
                <button onClick={() => setDomainModal(true)} className="px-3 py-1.5 bg-[#00B050] text-white rounded-lg text-xs font-bold cursor-pointer">+ ربط دومين</button>
              </div>
              {customDomains.length === 0 ? (
                <p className="text-xs text-slate-400">متجرك يعمل حالياً على النطاق المجاني: <span className="font-mono text-emerald-500">{storeData?.store_slug}.spike.shop</span></p>
              ) : (
                <div className="space-y-2 text-xs font-mono">
                  {customDomains.map((d, i) => (
                    <div key={i} className="p-2 border rounded flex justify-between">
                      <span>{d.domain_name}</span>
                      <span className="text-amber-500">{d.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className={`p-6 rounded-2xl border max-w-xl ${isDark ? 'bg-[#0E1E38] border-slate-800' : 'bg-white border-slate-200'}`}>
              <h3 className="text-lg font-black mb-4">إعدادات المتجر</h3>
              <div className="space-y-3 text-xs">
                <p className="text-slate-400">اسم المتجر: <strong>{storeData?.store_name}</strong></p>
                <p className="text-slate-400">رابط المتجر الأساسي: <span className="font-mono text-emerald-500">{storeData?.store_slug}.spike.shop</span></p>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* مودال إضافة منتج */}
      {newProductModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className={`p-6 rounded-2xl max-w-md w-full border ${isDark ? 'bg-[#0E1E38] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
            <h3 className="text-base font-black mb-4">إضافة منتج جديد لمتجرك</h3>
            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="block mb-1">اسم المنتج</label>
                <input
                  type="text"
                  required
                  value={newProductData.title}
                  onChange={(e) => setNewProductData({ ...newProductData, title: e.target.value })}
                  className="w-full p-2.5 rounded-lg border bg-transparent"
                />
              </div>
              <div>
                <label className="block mb-1">سعر البيع (ج.م)</label>
                <input
                  type="number"
                  required
                  value={newProductData.price}
                  onChange={(e) => setNewProductData({ ...newProductData, price: e.target.value })}
                  className="w-full p-2.5 rounded-lg border bg-transparent font-mono"
                />
              </div>
              <div>
                <label className="block mb-1">سعر التكلفة (ج.م)</label>
                <input
                  type="number"
                  value={newProductData.cost_price}
                  onChange={(e) => setNewProductData({ ...newProductData, cost_price: e.target.value })}
                  className="w-full p-2.5 rounded-lg border bg-transparent font-mono"
                />
              </div>
              <div>
                <label className="block mb-1">الكمية بالمخزن</label>
                <input
                  type="number"
                  value={newProductData.stock}
                  onChange={(e) => setNewProductData({ ...newProductData, stock: e.target.value })}
                  className="w-full p-2.5 rounded-lg border bg-transparent font-mono"
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

      {/* مودال سحب الأرباح */}
      {withdrawModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className={`p-6 rounded-2xl max-w-sm w-full border ${isDark ? 'bg-[#0E1E38] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
            <h3 className="text-base font-black mb-3">طلب سحب أرباح</h3>
            <form onSubmit={handleRequestWithdrawal} className="space-y-3 text-xs">
              <input
                type="number"
                step="0.01"
                required
                placeholder="المبلغ بالدولار ($)"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="w-full p-2.5 rounded-lg border bg-transparent font-mono"
              />
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2 bg-[#00B050] text-white rounded-xl font-bold cursor-pointer">تأكيد الطلب</button>
                <button type="button" onClick={() => setWithdrawModal(false)} className="px-3 py-2 border rounded-xl cursor-pointer">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال ربط الدومين */}
      {domainModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className={`p-6 rounded-2xl max-w-sm w-full border ${isDark ? 'bg-[#0E1E38] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
            <h3 className="text-base font-black mb-3">ربط دومين مخصص</h3>
            <form onSubmit={handleAddDomain} className="space-y-3 text-xs">
              <input
                type="text"
                required
                placeholder="mystore.com"
                value={domainName}
                onChange={(e) => setDomainName(e.target.value)}
                className="w-full p-2.5 rounded-lg border bg-transparent font-mono"
              />
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2 bg-[#00B050] text-white rounded-xl font-bold cursor-pointer">ربط الدومين</button>
                <button type="button" onClick={() => setDomainModal(false)} className="px-3 py-2 border rounded-xl cursor-pointer">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
