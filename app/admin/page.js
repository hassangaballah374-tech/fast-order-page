'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function UnifiedAdminDashboard() {
  // الفئات الرئيسية الثلاث: 'subscribers' | 'orders' | 'my_store'
  const [mainCategory, setMainCategory] = useState('subscribers');

  // التبويبات الفرعية داخل متجري الخاص: 'products' | 'cart' | 'settings'
  const [storeSubTab, setStoreSubTab] = useState('products');

  const [loading, setLoading] = useState(true);

  // بيانات المشتركين والمتاجر (فئة المشتركين)
  const [subscribers, setSubscribers] = useState([]);
  const [editingSub, setEditingSub] = useState(null);
  const [durationMonths, setDurationMonths] = useState(1);
  const [paymentAmount, setPaymentAmount] = useState('');

  // بيانات المتجر الخاص
  const [settings, setSettings] = useState({
    store_name: '',
    pixel_1: '', token_1: '',
    pixel_2: '', token_2: '',
    pixel_3: '', token_3: '',
    pixel_4: '', token_4: '',
    tiktok_pixel_id: '',
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsNotice, setSettingsNotice] = useState(false);

  // الطلبات والتحليلات والمنتجات
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [products, setProducts] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [productForm, setProductForm] = useState({
    name: '', price: '', compare_price: '', cost_price: '', stock: 20,
    description: '', images: [], video_url: '', show_colors: false, colors: [], show_sizes: false, sizes: [],
  });

  const [newImageUrl, setNewImageUrl] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);
    try {
      if (supabase) {
        // 1. جلب بيانات المشتركين والمتاجر
        const { data: subData } = await supabase.from('store_profiles').select('*').order('created_at', { ascending: false });
        if (subData) setSubscribers(subData);

        // 2. جلب إعدادات المتجر الخاص والبيكسل
        const { data: sData } = await supabase.from('store_settings').select('*').limit(1).maybeSingle();
        if (sData) {
          setSettings({
            store_name: sData.store_name || '',
            pixel_1: sData.pixel_1 || sData.facebook_pixel_id || '',
            token_1: sData.token_1 || sData.facebook_api_token || '',
            pixel_2: sData.pixel_2 || '', token_2: sData.token_2 || '',
            pixel_3: sData.pixel_3 || '', token_3: sData.token_3 || '',
            pixel_4: sData.pixel_4 || '', token_4: sData.token_4 || '',
            tiktok_pixel_id: sData.tiktok_pixel_id || '',
          });
        }

        // 3. جلب منتجات المتجر
        const { data: pData } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        let list = pData ? [...pData] : [];
        if (sData && sData.product_name) {
          const exists = list.some((p) => p.name === sData.product_name);
          if (!exists) {
            list.push({
              id: 'legacy_product',
              name: sData.product_name,
              price: Number(sData.product_price) || 0,
              compare_price: Number(sData.original_price) || null,
              cost_price: Number(sData.cost_price) || 0,
              stock: Number(sData.stock) || 20,
              images: sData.images || (sData.image_url ? [sData.image_url] : []),
            });
          }
        }
        setProducts(list);

        // 4. جلب الطلبات
        const { data: oData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (oData) setOrders(oData);

        // 5. جلب إحصائيات التتبع
        const { data: aData } = await supabase.from('store_analytics').select('*');
        if (aData) setAnalytics(aData);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  // --- دوال فئة المشتركين (تفعيل وتعطيل المتاجر) ---
  const handleActivateSubscriber = async (sub) => {
    const months = parseInt(durationMonths) || 1;
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + months);

    const payload = {
      is_active: true,
      subscription_ends_at: expiry.toISOString(),
      amount_paid: Number(paymentAmount) || Number(sub.amount_paid) || 0,
    };

    const { error } = await supabase.from('store_profiles').update(payload).eq('id', sub.id);
    if (!error) {
      alert(`✅ تم تفعيل متجر (${sub.store_name}) لمدة ${months} شهر بنجاح!`);
      setEditingSub(null);
      loadAllData();
    } else {
      alert('خطأ أثناء التفعيل: ' + error.message);
    }
  };

  const handleDeactivateSubscriber = async (subId) => {
    if (!confirm('هل تريد تعطيل هذا المتجر الآن؟')) return;
    const { error } = await supabase.from('store_profiles').update({ is_active: false }).eq('id', subId);
    if (!error) loadAllData();
  };

  // --- دوال فئة الطلبات ---
  const filteredOrders = orders.filter((o) => {
    const matchSearch =
      (o.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.phone || '').includes(searchTerm) ||
      (o.governorate || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch && (statusFilter === 'all' || o.status === statusFilter);
  });

  const handleUpdateStatus = async (id, status) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (!error) {
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    }
  };

  const handleDeleteOrder = async (id) => {
    if (!confirm('هل تريد حذف هذا الطلب نهائياً؟')) return;
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (!error) setOrders((prev) => prev.filter((o) => o.id !== id));
  };

  // --- دوال فئة المتجر الخاص (المنتجات والإعدادات) ---
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const { data: existing } = await supabase.from('store_settings').select('id').limit(1).maybeSingle();
      const targetId = existing?.id || 1;

      const payload = {
        id: targetId,
        store_name: settings.store_name,
        pixel_1: (settings.pixel_1 || '').trim(),
        token_1: (settings.token_1 || '').trim(),
        pixel_2: (settings.pixel_2 || '').trim(),
        token_2: (settings.token_2 || '').trim(),
        pixel_3: (settings.pixel_3 || '').trim(),
        token_3: (settings.token_3 || '').trim(),
        pixel_4: (settings.pixel_4 || '').trim(),
        token_4: (settings.token_4 || '').trim(),
        facebook_pixel_id: (settings.pixel_1 || '').trim(),
        facebook_api_token: (settings.token_1 || '').trim(),
      };

      const { error } = await supabase.from('store_settings').upsert(payload);
      if (error) throw error;

      setSettingsNotice(true);
      setTimeout(() => setSettingsNotice(false), 3000);
      alert('✅ تم حفظ الإعدادات بنجاح!');
    } catch (err) {
      alert('خطأ أثناء الحفظ: ' + err.message);
    }
    setSavingSettings(false);
  };

  const openNewProductModal = () => {
    setEditingProduct(null);
    setProductForm({
      name: '', price: '', compare_price: '', cost_price: '', stock: 20,
      description: '', images: [], video_url: '', show_colors: false, colors: [], show_sizes: false, sizes: [],
    });
    setShowProductModal(true);
  };

  const openEditProductModal = (prod) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name || '',
      price: prod.price || '',
      compare_price: prod.compare_price || prod.original_price || '',
      cost_price: prod.cost_price || '',
      stock: prod.stock !== undefined ? prod.stock : 20,
      description: prod.description || '',
      images: prod.images || [],
      video_url: prod.video_url || '',
      show_colors: Boolean(prod.show_colors),
      colors: prod.colors || [],
      show_sizes: Boolean(prod.show_sizes),
      sizes: prod.sizes || [],
    });
    setShowProductModal(true);
  };

  const handleDeleteProduct = async (prod) => {
    if (!confirm(`حذف المنتج: ${prod.name}؟`)) return;
    if (prod.id !== 'legacy_product') {
      await supabase.from('products').delete().eq('id', prod.id);
    }
    setProducts((prev) => prev.filter((p) => p.id !== prod.id));
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setSavingProduct(true);
    const payload = {
      name: productForm.name,
      price: Number(productForm.price) || 0,
      original_price: Number(productForm.compare_price) || null,
      cost_price: Number(productForm.cost_price) || 0,
      stock: Math.max(0, parseInt(productForm.stock) || 0),
      description: productForm.description,
      images: productForm.images || [],
      video_url: productForm.video_url || '',
      show_colors: Boolean(productForm.show_colors),
      colors: productForm.colors || [],
      show_sizes: Boolean(productForm.show_sizes),
      sizes: productForm.sizes || [],
    };

    try {
      if (editingProduct?.id && editingProduct.id !== 'legacy_product') {
        await supabase.from('products').update(payload).eq('id', editingProduct.id);
        setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? { ...p, ...payload } : p)));
      } else {
        const { data } = await supabase.from('products').insert([payload]).select().single();
        if (data) setProducts((prev) => [data, ...prev]);
      }
      setShowProductModal(false);
      alert('✅ تم حفظ المنتج بنجاح!');
    } catch (err) {
      alert('خطأ: ' + err.message);
    }
    setSavingProduct(false);
  };

  // إحصائيات المتجر الخاص المجمعة
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total_amount || o.total_price) || 0), 0);
  const totalOrdersCount = orders.length;

  let totalCost = 0;
  orders.forEach((o) => {
    const matchedProduct = products.find((p) => o.product_name && o.product_name.includes(p.name));
    const costPerItem = matchedProduct ? Number(matchedProduct.cost_price) || 0 : 0;
    const qty = Number(o.quantity) || 1;
    totalCost += costPerItem * qty;
  });

  const totalProfit = totalRevenue - totalCost;
  const visitorsCount = analytics.filter((a) => a.event_type === 'visit').length;
  const addToCartCount = analytics.filter((a) => a.event_type === 'add_to_cart').length;
  const initiateCheckoutCount = analytics.filter((a) => a.event_type === 'initiate_checkout').length;
  const incompleteOrders = orders.filter((o) => o.status === 'قيد الانتظار' || o.status === 'ملغي').length;
  const conversionRate = visitorsCount > 0 ? ((totalOrdersCount / visitorsCount) * 100).toFixed(2) : '0.00';
  const averageOrderValue = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-sans" dir="rtl">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-bold">جاري تحميل لوحة التحكم المركزية...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16" dir="rtl">
      
      {/* 🌟 الشريط العلوي للفئات الرئيسية الثلاث */}
      <header className="bg-slate-900/90 backdrop-blur border-b border-slate-800 sticky top-0 z-30 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚡</span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white">اللوحة الرئيسية المركزية</h1>
              <p className="text-xs text-slate-400">إدارة المشتركين والاشتراكات | الطلبات الجديدة | المتجر الشخصي</p>
            </div>
          </div>

          {/* أزرار الفئات الرئيسية الثلاث */}
          <div className="flex items-center bg-slate-950 p-1.5 rounded-2xl border border-slate-800 gap-1">
            <button
              onClick={() => setMainCategory('subscribers')}
              className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                mainCategory === 'subscribers'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>👥 المشتركين والعملاء</span>
              <span className="bg-slate-900 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-black">
                {subscribers.length}
              </span>
            </button>

            <button
              onClick={() => setMainCategory('orders')}
              className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                mainCategory === 'orders'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>📦 طلبات جديدة</span>
              <span className="bg-slate-900 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-black">
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => setMainCategory('my_store')}
              className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                mainCategory === 'my_store'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🏪 متجري الخاص</span>
            </button>
          </div>

        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-8 space-y-6">

        {/* =========================================================================
            الفئة الأولى: 👥 فئة المشتركين والعملاء (الاشتراكات والتفعيل)
        ========================================================================= */}
        {mainCategory === 'subscribers' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 p-5 rounded-3xl border border-slate-800">
              <div>
                <h2 className="text-xl font-black text-white">إدارة المشتركين والمتاجر المفتوحة ({subscribers.length})</h2>
                <p className="text-xs text-slate-400 mt-0.5">تفعيل المتاجر بعد استلام التحويل، تحديد فترة التفعيل، ومتابعة المبالغ</p>
              </div>
              <button onClick={loadAllData} className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl text-xs sm:text-sm">
                🔄 تحديث القائمة
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {subscribers.length === 0 ? (
                <div className="text-center py-16 text-slate-500 font-bold bg-slate-900 border border-slate-800 rounded-3xl">
                  لا يوجد مشتركون مسجلون حتى الآن. عند تسجيل مستخدم جديد عبر صفحة التسجيل سيظهر هنا مباشرة.
                </div>
              ) : (
                subscribers.map((s) => {
                  const isExpired = !s.subscription_ends_at || new Date(s.subscription_ends_at) < new Date();
                  const isActive = s.is_active && !isExpired;

                  return (
                    <div key={s.id} className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-3">
                          <span className="font-black text-white text-lg">{s.store_name}</span>
                          <span className="text-xs text-slate-500 font-mono">({s.store_slug})</span>
                          <span className={`text-xs px-3 py-1 rounded-full font-bold ${isActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                            {isActive ? '✅ متجر نشط ويعمل' : '⚠️ متوقف / بانتظار التجديد'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 flex flex-wrap gap-4 pt-1">
                          <span>صاحب المتجر: <strong className="text-white">{s.owner_name || 'غير محدد'}</strong></span>
                          <span>رقم الهاتف: <strong className="text-white font-mono" dir="ltr">{s.phone || 'غير مسجل'}</strong></span>
                          <span>المبلغ المحول: <strong className="text-emerald-400 font-bold">{s.amount_paid || 0} ج.م</strong></span>
                          <span>تاريخ الانتهاء: <strong className="text-amber-400 font-mono">{s.subscription_ends_at ? new Date(s.subscription_ends_at).toLocaleDateString('ar-EG') : 'لم يُفعّل بعد'}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setEditingSub(s); setPaymentAmount(s.amount_paid || ''); }}
                          className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md transition hover:scale-105"
                        >
                          تفعيل / تجديد المتجر 🚀
                        </button>
                        {isActive && (
                          <button onClick={() => handleDeactivateSubscriber(s.id)} className="px-4 py-2.5 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-xl text-xs font-bold transition">
                            إيقاف المتجر
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            الفئة الثانية: 📦 فئة الطلبات الجديدة (إدارة المبيعات والشحن)
        ========================================================================= */}
        {mainCategory === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 p-5 rounded-3xl border border-slate-800">
              <div>
                <h2 className="text-xl font-black text-white">إدارة الطلبات الواردة ({filteredOrders.length})</h2>
                <p className="text-xs text-slate-400 mt-0.5">متابعة العملاء وتحديث حالات الشحن والتأكيد والتسليم</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="بحث باسم العميل أو الهاتف..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-white text-xs p-2.5 rounded-xl w-48 sm:w-60"
                />

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-white text-xs p-2.5 rounded-xl font-bold"
                >
                  <option value="all">كل الحالات</option>
                  <option value="جديد">جديد</option>
                  <option value="قيد الانتظار">قيد الانتظار</option>
                  <option value="تم التأكيد">تم التأكيد</option>
                  <option value="تم الشحن">تم الشحن</option>
                  <option value="تم التسليم">تم التسليم</option>
                  <option value="مرتجع">مرتجع</option>
                  <option value="ملغي">ملغي</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-16 text-slate-500 font-bold bg-slate-900 border border-slate-800 rounded-3xl">
                  لا توجد طلبات تطابق هذا البحث حالياً.
                </div>
              ) : (
                filteredOrders.map((order, idx) => (
                  <div key={order.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                      <span className="font-black text-white text-sm sm:text-base">طلب #{idx + 1} - {order.customer_name}</span>
                      <select
                        value={order.status || 'جديد'}
                        onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                        className="bg-slate-950 border border-slate-700 text-xs font-bold text-emerald-400 p-2 rounded-xl"
                      >
                        <option value="جديد">جديد</option>
                        <option value="قيد الانتظار">قيد الانتظار</option>
                        <option value="تم التأكيد">تم التأكيد</option>
                        <option value="تم الشحن">تم الشحن</option>
                        <option value="تم التسليم">تم التسليم</option>
                        <option value="مرتجع">مرتجع</option>
                        <option value="ملغي">ملغي</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div>الهاتف: <strong className="text-white font-mono" dir="ltr">{order.phone}</strong></div>
                      <div>العنوان: <strong className="text-white">{order.governorate} - {order.address}</strong></div>
                      <div>الإجمالي: <strong className="text-emerald-400 font-black">{order.total_amount || order.total_price} ج.م</strong></div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-800/60">
                      <span className="text-xs text-slate-400">المنتجات: {order.product_name}</span>
                      <button onClick={() => handleDeleteOrder(order.id)} className="text-red-400 hover:text-red-300 text-xs font-bold">
                        حذف الطلب
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            الفئة الثالثة: 🏪 فئة متجري الخاص (المنتجات، السلة، البيكسل، الإحصائيات)
        ========================================================================= */}
        {mainCategory === 'my_store' && (
          <div className="space-y-6">
            
            {/* أزرار التنقل الفرعية لمتجري الخاص */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
              <button
                onClick={() => setStoreSubTab('products')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                  storeSubTab === 'products' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                🛍️ المنتجات والمخزون ({products.length})
              </button>

              <button
                onClick={() => setStoreSubTab('cart')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                  storeSubTab === 'cart' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                📊 اللوحة الإحصائية الشاملة للمتجر
              </button>

              <button
                onClick={() => setStoreSubTab('settings')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                  storeSubTab === 'settings' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                ⚙️ إعدادات المتجر وبيكسلات فيسبوك (CAPI)
              </button>
            </div>

            {/* 1. قسم منتجات المتجر مع كروت الإحصائيات المستقلة لكل منتج */}
            {storeSubTab === 'products' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 p-5 rounded-3xl border border-slate-800">
                  <div>
                    <h2 className="text-xl font-black text-white">منتجات متجري ومخزونها ({products.length})</h2>
                    <p className="text-xs text-slate-400 mt-0.5">لوحة تحليلات مستقلة لكل منتج تتولد وتعمل تلقائياً</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={loadAllData} className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl text-xs sm:text-sm">
                      🔄 تحديث
                    </button>
                    <button onClick={openNewProductModal} className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-lg flex items-center gap-2">
                      <span>➕</span>
                      <span>إضافة منتج جديد</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((p) => {
                    const sellingPrice = Number(p.price) || 0;
                    const costPrice = Number(p.cost_price) || 0;
                    const stockCount = p.stock !== undefined ? p.stock : 20;
                    const profitMargin = sellingPrice - costPrice;
                    const productUrl = p.id === 'legacy_product' ? '/' : `/p/${p.id}`;

                    const pOrders = orders.filter((o) => o.product_name && o.product_name.includes(p.name));
                    const pOrdersCount = pOrders.length;
                    const pRevenue = pOrders.reduce((sum, o) => sum + (Number(o.total_amount || o.total_price) || 0), 0);
                    const pProfit = pOrdersCount * profitMargin;

                    const pVisits = analytics.filter((a) => String(a.product_id) === String(p.id) && a.event_type === 'visit').length;
                    const pCarts = analytics.filter((a) => String(a.product_id) === String(p.id) && a.event_type === 'add_to_cart').length;
                    const pCheckouts = analytics.filter((a) => String(a.product_id) === String(p.id) && a.event_type === 'initiate_checkout').length;
                    const pConvRate = pVisits > 0 ? ((pOrdersCount / pVisits) * 100).toFixed(2) : '0.00';
                    const pAverageOrderValue = pOrdersCount > 0 ? Math.round(pRevenue / pOrdersCount) : sellingPrice;

                    return (
                      <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                          {p.images && p.images.length > 0 ? (
                            <div className="w-full h-44 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center p-2">
                              <img src={p.images[0]} alt={p.name} className="w-full h-full object-contain" />
                            </div>
                          ) : (
                            <div className="w-full h-44 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center text-slate-600 text-3xl">
                              📦
                            </div>
                          )}

                          <h3 className="font-black text-lg text-white line-clamp-1">{p.name}</h3>

                          {/* 📊 لوحة الإحصائيات المستقلة للمنتج */}
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                              <span className="text-slate-400 block text-[10px]">الزيارات</span>
                              <span className="text-white font-black text-sm">{pVisits}</span>
                            </div>
                            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                              <span className="text-slate-400 block text-[10px]">الطلبات المكتملة</span>
                              <span className="text-emerald-400 font-black text-sm">{pOrdersCount} طلب</span>
                            </div>
                            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                              <span className="text-slate-400 block text-[10px]">إضافة للسلة</span>
                              <span className="text-teal-400 font-black text-sm">{pCarts}</span>
                            </div>
                            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                              <span className="text-slate-400 block text-[10px]">بدء الشراء</span>
                              <span className="text-indigo-400 font-black text-sm">{pCheckouts}</span>
                            </div>
                            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                              <span className="text-slate-400 block text-[10px]">إجمالي المبيعات</span>
                              <span className="text-emerald-400 font-black text-sm">{pRevenue.toLocaleString()} ج.م</span>
                            </div>
                            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                              <span className="text-slate-400 block text-[10px]">معدل التحويل</span>
                              <span className="text-sky-400 font-black text-sm">{pConvRate}%</span>
                            </div>
                            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                              <span className="text-slate-400 block text-[10px]">متوسط سعر الطلب</span>
                              <span className="text-amber-400 font-black text-sm">{pAverageOrderValue.toLocaleString()} ج.م</span>
                            </div>
                            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                              <span className="text-slate-400 block text-[10px]">صافي الأرباح</span>
                              <span className="text-teal-300 font-black text-sm">{pProfit.toLocaleString()} ج.م</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                          <a href={productUrl} target="_blank" rel="noreferrer" className="py-2.5 px-3 bg-emerald-600/20 text-emerald-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1">
                            <span>🔗</span> معاينة
                          </a>
                          <button onClick={() => openEditProductModal(p)} className="flex-1 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold">
                            ✏️ تعديل
                          </button>
                          <button onClick={() => handleDeleteProduct(p)} className="px-4 py-2.5 bg-red-600/20 text-red-400 rounded-xl text-xs font-bold">
                            حذف
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. اللوحة الإحصائية الشاملة للمتجر */}
            {storeSubTab === 'cart' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-2">
                  <div className="text-xs font-bold text-slate-400 flex items-center justify-between">
                    <span>إجمالي الزائرين</span>
                    <span>👁</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white">{visitorsCount.toLocaleString()}</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-2">
                  <div className="text-xs font-bold text-slate-400 flex items-center justify-between">
                    <span>الطلبات المكتملة</span>
                    <span>📦</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-400">{totalOrdersCount} طلب</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-2">
                  <div className="text-xs font-bold text-slate-400 flex items-center justify-between">
                    <span>طلبات غير مكتملة</span>
                    <span>⚠</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-amber-400">{incompleteOrders}</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-2">
                  <div className="text-xs font-bold text-slate-400 flex items-center justify-between">
                    <span>معدل التحويل العام</span>
                    <span>📈</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-sky-400">{conversionRate}%</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-2">
                  <div className="text-xs font-bold text-slate-400 flex items-center justify-between">
                    <span>مرات الإضافة للسلة</span>
                    <span>🛒</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-teal-400">{addToCartCount}</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-2">
                  <div className="text-xs font-bold text-slate-400 flex items-center justify-between">
                    <span>مرات بدء الشراء</span>
                    <span>⚡</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-indigo-400">{initiateCheckoutCount}</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-2">
                  <div className="text-xs font-bold text-slate-400 flex items-center justify-between">
                    <span>متوسط سعر الطلب</span>
                    <span>🏷️</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-amber-400">{averageOrderValue.toLocaleString()} ج.م</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-2">
                  <div className="text-xs font-bold text-slate-400 flex items-center justify-between">
                    <span>إجمالي المبيعات</span>
                    <span>💰</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-400">{totalRevenue.toLocaleString()} ج.م</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-2">
                  <div className="text-xs font-bold text-slate-400 flex items-center justify-between">
                    <span>صافي الأرباح</span>
                    <span>💎</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-teal-300">{totalProfit.toLocaleString()} ج.م</div>
                </div>
              </div>
            )}

            {/* 3. إعدادات المتجر وبيكسلات فيسبوك (CAPI) */}
            {storeSubTab === 'settings' && (
              <form onSubmit={handleSaveSettings} className="bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
                <div className="border-b border-slate-800 pb-3">
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <span>🎯</span>
                    <span>إعدادات البيكسلات المستقلة ورموز الوصول (CAPI Tokens) لمتجري</span>
                  </h2>
                </div>

                {settingsNotice && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl text-xs sm:text-sm font-bold">
                    ✅ تم حفظ الإعدادات بنجاح!
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">اسم المتجر</label>
                    <input
                      type="text"
                      value={settings.store_name}
                      onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-white text-sm"
                    />
                  </div>

                  {[1, 2, 3, 4].map((num) => (
                    <div key={num} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                      <h4 className="text-xs font-black text-emerald-400">⚡ بيكسل فيسبوك ({num})</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          dir="ltr"
                          value={settings[`pixel_${num}`]}
                          onChange={(e) => setSettings({ ...settings, [`pixel_${num}`]: e.target.value })}
                          placeholder={`Pixel ID ${num}`}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-mono text-white"
                        />
                        <input
                          type="text"
                          dir="ltr"
                          value={settings[`token_${num}`]}
                          onChange={(e) => setSettings({ ...settings, [`token_${num}`]: e.target.value })}
                          placeholder={`API Access Token ${num}`}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-mono text-blue-300"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-sm rounded-2xl shadow-xl transition hover:scale-105"
                >
                  {savingSettings ? 'جاري الحفظ...' : 'حفظ إعدادات المتجر والبيكسلات 💾'}
                </button>
              </form>
            )}

          </div>
        )}

      </main>

      {/* مودال تفعيل وتجديد اشتراك المشتركين */}
      {editingSub && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-white border-b border-slate-800 pb-3">
              تفعيل اشتراك: {editingSub.store_name}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">مدة الاشتراك بالأشهر</label>
                <select
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white"
                >
                  <option value="1">شهر واحد (30 يوم)</option>
                  <option value="3">3 أشهر</option>
                  <option value="6">6 أشهر</option>
                  <option value="12">سنة كاملة (12 شهر)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">المبلغ المحول المسدد (ج.م)</label>
                <input
                  type="number"
                  placeholder="مثال: 500"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button onClick={() => setEditingSub(null)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold">
                إلغاء
              </button>
              <button onClick={() => handleActivateSubscriber(editingSub)} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold">
                تأكيد التفعيل 🚀
              </button>
            </div>
          </div>
        </div>
      )}

      {/* مودال إضافة/تعديل المنتج */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            <h3 className="text-xl font-black text-white border-b border-slate-800 pb-3">
              {editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <input
                type="text"
                required
                placeholder="اسم المنتج"
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm"
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="number"
                  required
                  placeholder="سعر البيع"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm font-bold"
                />
                <input
                  type="number"
                  required
                  placeholder="سعر التكلفة"
                  value={productForm.cost_price}
                  onChange={(e) => setProductForm({ ...productForm, cost_price: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm font-bold"
                />
                <input
                  type="number"
                  required
                  placeholder="المخزون"
                  value={productForm.stock}
                  onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm font-bold"
                />
              </div>

              <input
                type="url"
                placeholder="رابط الصورة"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm"
              />
              <button
                type="button"
                onClick={() => {
                  if (newImageUrl) {
                    setProductForm((prev) => ({ ...prev, images: [...prev.images, newImageUrl] }));
                    setNewImageUrl('');
                  }
                }}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold"
              >
                إضافة الصورة
              </button>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setShowProductModal(false)} className="px-5 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-sm font-bold">
                  إلغاء
                </button>
                <button type="submit" disabled={savingProduct} className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold">
                  حفظ المنتج 💾
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
