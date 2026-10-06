'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function SuperAdminMasterDashboard() {
  // شاشات التنقل: 'home' | 'pending_subscribers' | 'active_clients' | 'orders' | 'products' | 'analytics' | 'pixels' | 'store_branding'
  const [activeScreen, setActiveScreen] = useState('home');
  const [loading, setLoading] = useState(true);

  // المشتركون والمتاجر
  const [subscribers, setSubscribers] = useState([]);
  const [editingSub, setEditingSub] = useState(null);
  const [durationMonths, setDurationMonths] = useState(1);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [searchSubscriber, setSearchSubscriber] = useState('');

  // إعدادات وهوية المنصة
  const [settings, setSettings] = useState({
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

  // الطلبات المركزية
  const [orders, setOrders] = useState([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  // المنتجات المركزية
  const [products, setProducts] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '', price: '', cost_price: '', stock: 20, images: [],
  });

  // التحليلات العامة
  const [analytics, setAnalytics] = useState([]);

  useEffect(() => {
    loadAllMasterData();
  }, []);

  async function loadAllMasterData() {
    setLoading(true);
    try {
      if (supabase) {
        // 1. جلب المشتركين
        const { data: subData } = await supabase
          .from('store_profiles')
          .select('*')
          .order('created_at', { ascending: false });
        if (subData) setSubscribers(subData);

        // 2. جلب إعدادات المنصة
        const { data: sData } = await supabase.from('store_settings').select('*').limit(1).maybeSingle();
        if (sData) {
          setSettings({
            store_name: sData.store_name || 'NEXT ORDER',
            store_logo: sData.store_logo || sData.logo_url || '',
            store_description: sData.store_description || '',
            support_phone: sData.support_phone || '',
            announcement_text: sData.announcement_text || '',
            pixel_1: sData.pixel_1 || '', token_1: sData.token_1 || '',
            pixel_2: sData.pixel_2 || '', token_2: sData.token_2 || '',
            pixel_3: sData.pixel_3 || '', token_3: sData.token_3 || '',
            pixel_4: sData.pixel_4 || '', token_4: sData.token_4 || '',
          });
        }

        // 3. جلب جميع الطلبات
        const { data: oData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (oData) setOrders(oData);

        // 4. جلب جميع المنتجات
        const { data: pData } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (pData) setProducts(pData);

        // 5. جلب التحليلات
        const { data: aData } = await supabase.from('store_analytics').select('*');
        if (aData) setAnalytics(aData);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  // فرز المشتركين
  const activeClients = subscribers.filter((s) => {
    const isExpired = !s.subscription_ends_at || new Date(s.subscription_ends_at) < new Date();
    return s.is_active && !isExpired && s.subscription_status !== 'suspended' && s.subscription_status !== 'disabled';
  });

  const pendingSubscribers = subscribers.filter((s) => {
    const isExpired = !s.subscription_ends_at || new Date(s.subscription_ends_at) < new Date();
    return !s.is_active || isExpired || s.subscription_status === 'pending';
  });

  // تفعيل أو تجديد المتجر
  const handleActivateSubscriber = async (sub) => {
    const months = parseInt(durationMonths) || 1;
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + months);

    const payload = {
      is_active: true,
      subscription_status: 'active',
      subscription_ends_at: expiry.toISOString(),
      amount_paid: Number(paymentAmount) || Number(sub.amount_paid) || 0,
    };

    const { error } = await supabase.from('store_profiles').update(payload).eq('id', sub.id);
    if (!error) {
      alert(`✅ تم تفعيل متجر (${sub.store_name}) بنجاح حتى: ${expiry.toLocaleDateString('ar-EG')}`);
      setEditingSub(null);
      loadAllMasterData();
    } else {
      alert('خطأ أثناء التفعيل: ' + error.message);
    }
  };

  // إيقاف مؤقت
  const handleSuspendSubscriber = async (sub) => {
    if (!confirm(`هل أنت متأكد من الإيقاف المؤقت لمتجر "${sub.store_name}"؟`)) return;
    await supabase.from('store_profiles').update({ is_active: false, subscription_status: 'suspended' }).eq('id', sub.id);
    loadAllMasterData();
  };

  // تعطيل
  const handleDeactivateSubscriber = async (sub) => {
    if (!confirm(`هل تريد تعطيل متجر "${sub.store_name}" بالكامل؟`)) return;
    await supabase.from('store_profiles').update({ is_active: false, subscription_status: 'disabled' }).eq('id', sub.id);
    loadAllMasterData();
  };

  // حذف نهائي شامل
  const handleDeleteSubscriber = async (sub) => {
    const confirmDelete = prompt(`⚠️ تحذير شديد: سيتم حذف متجر "${sub.store_name}" مع كافة منتجاته وطلباته.\nللتأكيد اكتب اسم المتجر تماماً:`);
    if (confirmDelete !== sub.store_name) {
      if (confirmDelete !== null) alert('الاسم غير متطابق!');
      return;
    }

    try {
      if (sub.user_id) {
        await supabase.from('products').delete().eq('user_id', sub.user_id);
        await supabase.from('orders').delete().eq('user_id', sub.user_id);
        await supabase.from('merchant_settings').delete().eq('user_id', sub.user_id);
        await supabase.from('store_analytics').delete().eq('user_id', sub.user_id);
      }
      await supabase.from('store_profiles').delete().eq('id', sub.id);
      alert(`🗑️ تم حذف الحساب وبياناته نهائياً.`);
      loadAllMasterData();
    } catch (err) {
      alert('خطأ أثناء الحذف: ' + err.message);
    }
  };

  // رفع اللوجو كملف
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار ملف صورة صالح (PNG, JPG, WEBP, SVG)');
      return;
    }

    setUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `platform_logo_${Date.now()}.${fileExt}`;
      const filePath = `platform/${fileName}`;

      const { error } = await supabase.storage
        .from('store-assets')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (error) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setSettings((prev) => ({ ...prev, store_logo: reader.result }));
          setUploadingLogo(false);
          alert('✅ تم تجهيز الصورة بنجاح!');
        };
        reader.readAsDataURL(file);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('store-assets')
        .getPublicUrl(filePath);

      if (publicUrlData?.publicUrl) {
        setSettings((prev) => ({ ...prev, store_logo: publicUrlData.publicUrl }));
        alert('✅ تم رفع لوجو المنصة بنجاح!');
      }
    } catch (err) {
      alert('خطأ أثناء رفع الصورة: ' + err.message);
    }
    setUploadingLogo(false);
  };

  // حفظ إعدادات وهوية المنصة
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const payload = {
        id: 1,
        store_name: settings.store_name,
        store_logo: settings.store_logo,
        logo_url: settings.store_logo,
        store_description: settings.store_description,
        support_phone: settings.support_phone,
        announcement_text: settings.announcement_text,
        pixel_1: (settings.pixel_1 || '').trim(),
        token_1: (settings.token_1 || '').trim(),
        pixel_2: (settings.pixel_2 || '').trim(),
        token_2: (settings.token_2 || '').trim(),
        pixel_3: (settings.pixel_3 || '').trim(),
        token_3: (settings.token_3 || '').trim(),
        pixel_4: (settings.pixel_4 || '').trim(),
        token_4: (settings.token_4 || '').trim(),
      };

      const { error } = await supabase.from('store_settings').upsert(payload);
      if (error) throw error;
      alert('✅ تم حفظ إعدادات وهوية المنصة بنجاح!');
    } catch (err) {
      alert('خطأ: ' + err.message);
    }
    setSavingSettings(false);
  };

  // تصدير الطلبات كملف CSV لشركات الشحن
  const exportOrdersToCSV = () => {
    if (orders.length === 0) {
      alert('لا توجد طلبات للتصدير!');
      return;
    }

    const headers = ['رقم الطلب', 'العميل', 'الهاتف', 'المحافظة', 'العنوان', 'المنتج', 'الكمية', 'المبلغ', 'الحالة', 'التاريخ'];
    const rows = orders.map((o, idx) => [
      idx + 1,
      `"${o.customer_name || ''}"`,
      `"${o.phone || ''}"`,
      `"${o.governorate || ''}"`,
      `"${o.address || ''}"`,
      `"${o.product_name || ''}"`,
      o.quantity || 1,
      o.total_amount || 0,
      `"${o.status || 'جديد'}"`,
      new Date(o.created_at).toLocaleDateString('ar-EG'),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NextOrder_Shipment_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // نسخ رابط التسجيل المباشر
  const copyRegisterLink = () => {
    if (typeof window !== 'undefined') {
      const link = `${window.location.origin}/register`;
      navigator.clipboard.writeText(link);
      alert('📋 تم نسخ رابط تسجيل المشتركين:\n' + link);
    }
  };

  // العمليات الحسابية الشاملة
  const totalStoreSales = orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
  const totalSubFeesCollected = subscribers.reduce((sum, s) => sum + (Number(s.amount_paid) || 0), 0);
  const totalStoreVisitors = analytics.filter(a => a.event_type === 'visit').length;
  const platformConversionRate = totalStoreVisitors > 0 ? ((orders.length / totalStoreVisitors) * 100).toFixed(2) : '0.00';

  // فلترة الطلبات
  const filteredOrders = orders.filter((o) => {
    const matchesSearch = (o.customer_name || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
                          (o.phone || '').includes(orderSearch) ||
                          (o.governorate || '').includes(orderSearch);
    const matchesStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // كروت الشاشة الرئيسية الملونة
  const gridCards = [
    {
      id: 'pending_subscribers',
      title: 'مشتركين جدد (قيد الانتظار)',
      desc: 'بانتظار سداد رسوم الاشتراك وتأكيد التحويل (5 دولار أو ما يعادلها بالمصري)',
      icon: '⏳',
      bgClass: 'bg-gradient-to-r from-amber-500 to-yellow-600',
      badge: `${pendingSubscribers.length} متجر في الانتظار`,
    },
    {
      id: 'active_clients',
      title: 'العملاء الحاليين',
      desc: 'المتاجر المفعلة، بيانات العملاء، ومواعيد تجديد الاشتراك القادمة',
      icon: '👥',
      bgClass: 'bg-gradient-to-r from-emerald-500 to-teal-600',
      badge: `${activeClients.length} عميل نشط`,
    },
    {
      id: 'store_branding',
      title: 'إعدادات المنصة والهوية',
      desc: 'لوجو المنصة، الاسم، الوصف، ورقم الواتساب الرسمي للدعم',
      icon: '⚙️',
      bgClass: 'bg-gradient-to-r from-orange-500 to-rose-600',
      badge: 'الهوية والتصميم',
    },
    {
      id: 'orders',
      title: 'كافة طلبات ومبيعات المنصة',
      desc: 'متابعة وتحديث حالات الشحن وتصدير إكسيل لشركات الشحن',
      icon: '📦',
      bgClass: 'bg-gradient-to-r from-blue-600 to-indigo-600',
      badge: `${orders.length} طلب كلي`,
    },
    {
      id: 'products',
      title: 'المنتجات والمخزون العام',
      desc: 'استعراض كافة منتجات التجار المرفوعة ومتابعة توفر المخزون',
      icon: '🛍️',
      bgClass: 'bg-gradient-to-r from-teal-500 to-emerald-600',
      badge: `${products.length} منتج مسجل`,
    },
    {
      id: 'analytics',
      title: 'التحليلات الشاملة والمالية',
      desc: 'إجمالي المبيعات، رسوم الاشتراكات المحصلة، والتحويلات',
      icon: '📈',
      bgClass: 'bg-gradient-to-r from-indigo-600 to-purple-600',
      badge: `${totalStoreSales.toLocaleString()} ج.م مبيعات`,
    },
    {
      id: 'pixels',
      title: 'بيكسلات فيسبوك (CAPI)',
      desc: 'ربط البيكسلات ورموز التتبع العامة للمنصة',
      icon: '⚡',
      bgClass: 'bg-gradient-to-r from-rose-600 to-red-600',
      badge: 'إعدادات CAPI',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center font-sans" dir="rtl">
        <div className="font-bold text-lg animate-pulse flex items-center gap-3">
          <span>👑</span>
          <span>جاري فتح لوحة السوبر أدمن (NEXT ORDER)...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white font-sans pb-16" dir="rtl">
      
      {/* الرأس العلوي */}
      <header className="bg-[#111827] border-b border-slate-800 px-6 py-4 sticky top-0 z-30 shadow-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {activeScreen !== 'home' && (
              <button
                onClick={() => setActiveScreen('home')}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>⬅</span>
                <span>الرئيسية</span>
              </button>
            )}
            <div className="flex items-center gap-3">
              {settings.store_logo && (
                <img src={settings.store_logo} alt="Logo" className="w-10 h-10 object-contain rounded-xl border border-slate-700 bg-white" />
              )}
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-wide text-white">
                  {activeScreen === 'home' ? 'لوحة تحكم السوبر أدمن' : gridCards.find((c) => c.id === activeScreen)?.title}
                </h1>
                <p className="text-xs text-slate-400">إدارة منصة NEXT ORDER والتحكم بالمتاجر والمبيعات</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-full font-black">
              👑 SUPER ADMIN
            </span>
            <div className="text-xs font-black text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3.5 py-1.5 rounded-full font-mono">
              {settings.store_name || 'NEXT ORDER'}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-8 space-y-6">

        {/* 🌟 1. الشاشة الرئيسية: شبكة الكروت الملونة */}
        {activeScreen === 'home' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {gridCards.map((card) => (
                <div
                  key={card.id}
                  onClick={() => setActiveScreen(card.id)}
                  className={`${card.bgClass} p-6 rounded-3xl cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden flex flex-col justify-between min-h-[160px]`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs bg-black/25 backdrop-blur-md px-3 py-1 rounded-full font-bold">
                      {card.badge}
                    </span>
                    <span className="text-2xl">{card.icon}</span>
                  </div>

                  <div className="space-y-1 mt-4">
                    <h3 className="text-xl font-black tracking-wide">{card.title}</h3>
                    <p className="text-xs text-white/85 line-clamp-1">{card.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 🌟 2. شاشة المشتركين الجدد (قيد الانتظار) */}
        {activeScreen === 'pending_subscribers' && (
          <div className="space-y-4">
            <div className="bg-[#111827] p-5 rounded-3xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-lg font-black text-amber-400 flex items-center gap-2">
                  <span>⏳</span>
                  <span>مشتركون جدد بانتظار التفعيل ({pendingSubscribers.length})</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  المتاجر التي سجلت حديثاً وبانتظار تأكيد التحويل (5 دولار أو ما يعادلها بالمصري).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={copyRegisterLink}
                  className="px-3.5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>🔗</span>
                  <span>نسخ رابط التسجيل</span>
                </button>
                <button onClick={loadAllMasterData} className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold cursor-pointer">
                  🔄 تحديث
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {pendingSubscribers.length === 0 ? (
                <div className="text-center py-16 text-slate-500 font-bold bg-[#111827] border border-slate-800 rounded-3xl">
                  🎉 رائع! لا يوجد مشتركون جدد في قائمة الانتظار حالياً.
                </div>
              ) : (
                pendingSubscribers.map((s) => (
                  <div key={s.id} className="bg-[#111827] border-2 border-amber-500/30 p-5 rounded-3xl space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-white text-lg">{s.store_name}</span>
                        <span className="text-xs text-slate-400 font-mono">({s.store_slug})</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          🟡 بانتظار التحويل المالي
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">تاريخ التسجيل: {new Date(s.created_at).toLocaleDateString('ar-EG')}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-300 bg-slate-900/60 p-3.5 rounded-2xl">
                      <div>اسم التاجر: <strong className="text-white">{s.owner_name}</strong></div>
                      <div>رقم الواتساب: <a href={`https://wa.me/${s.phone}`} target="_blank" className="text-emerald-400 font-bold font-mono underline" dir="ltr">{s.phone} ↗</a></div>
                      <div>المحافظة: <strong className="text-white">{s.governorate}</strong></div>
                      <div>الاشتراك: <strong className="text-amber-400 font-bold">5 دولار أو ما يعادلها بالمصري</strong></div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleDeleteSubscriber(s)}
                        className="px-3.5 py-2 bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        🗑 رفض وحذف
                      </button>
                      <button
                        onClick={() => { setEditingSub(s); setPaymentAmount(s.amount_paid || ''); }}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg transition cursor-pointer flex items-center gap-1.5"
                      >
                        <span>💰</span>
                        <span>تأكيد استلام المبلغ وتفعيل المتجر 🚀</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 🌟 3. شاشة العملاء الحاليين (الموافق عليهم) */}
        {activeScreen === 'active_clients' && (
          <div className="space-y-4">
            <div className="bg-[#111827] p-5 rounded-3xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-lg font-black text-emerald-400 flex items-center gap-2">
                  <span>👥</span>
                  <span>العملاء الحاليين والمتاجر النشطة ({activeClients.length})</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  المتاجر المفعلة رسمياً ومواعيد تجديد اشتراكاتهم القادمة.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="بحث باسم المتجر أو المالك..."
                  value={searchSubscriber}
                  onChange={(e) => setSearchSubscriber(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-xs p-2.5 rounded-xl w-56 text-white"
                />
                <button onClick={loadAllMasterData} className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold cursor-pointer">
                  🔄 تحديث
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {activeClients.length === 0 ? (
                <div className="text-center py-16 text-slate-500 font-bold bg-[#111827] border border-slate-800 rounded-3xl">
                  لا يوجد عملاء مفعلون حالياً.
                </div>
              ) : (
                activeClients
                  .filter((s) => (s.store_name || '').toLowerCase().includes(searchSubscriber.toLowerCase()) || (s.owner_name || '').toLowerCase().includes(searchSubscriber.toLowerCase()))
                  .map((s) => {
                    const expiryDate = new Date(s.subscription_ends_at);
                    const daysLeft = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));

                    return (
                      <div key={s.id} className="bg-[#111827] border border-emerald-500/20 p-5 rounded-3xl space-y-4 hover:border-emerald-500/40 transition">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-white text-lg">{s.store_name}</span>
                            <a href={`/store/${s.store_slug}`} target="_blank" className="text-xs text-cyan-400 bg-cyan-950/60 px-2.5 py-0.5 rounded-full font-mono hover:underline">
                              /{s.store_slug} ↗
                            </a>
                            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              🟢 متجر نشط
                            </span>
                          </div>

                          <div className="text-xs font-black px-3 py-1 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                            📅 التجديد القادم: {expiryDate.toLocaleDateString('ar-EG')} ({daysLeft} يوم متبقي)
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-300 bg-slate-900/60 p-3 rounded-2xl">
                          <div>التاجر: <strong className="text-white">{s.owner_name}</strong></div>
                          <div>الهاتف: <a href={`https://wa.me/${s.phone}`} target="_blank" className="text-emerald-400 font-bold font-mono underline" dir="ltr">{s.phone}</a></div>
                          <div>المبلغ المحول: <strong className="text-emerald-400 font-bold">{s.amount_paid || 0} ج.م</strong></div>
                          <div>المحافظة: <strong className="text-white">{s.governorate}</strong></div>
                        </div>

                        <div className="flex flex-wrap justify-end gap-2 pt-1">
                          <button
                            onClick={() => { setEditingSub(s); setPaymentAmount(s.amount_paid || ''); }}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                          >
                            🔄 تجديد الاشتراك
                          </button>
                          <button
                            onClick={() => handleSuspendSubscriber(s)}
                            className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold transition cursor-pointer"
                          >
                            ⏸️ إيقاف مؤقت
                          </button>
                          <button
                            onClick={() => handleDeactivateSubscriber(s)}
                            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                          >
                            🛑 تعطيل
                          </button>
                          <button
                            onClick={() => handleDeleteSubscriber(s)}
                            className="px-3.5 py-2 bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                          >
                            🗑 حذف
                          </button>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        )}

        {/* 🌟 4. شاشة الطلبات المركزية وتصدير الشحن */}
        {activeScreen === 'orders' && (
          <div className="space-y-4">
            <div className="bg-[#111827] p-5 rounded-3xl border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-lg font-black text-white">إدارة طلبات المنصة ({filteredOrders.length})</h2>
                <p className="text-xs text-slate-400">تحديث حالات الشحن وتصدير الطلبات مباشرة لشركات التوصيل</p>
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
                placeholder="بحث باسم الزبون أو الهاتف أو المحافظة..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="bg-[#111827] border border-slate-800 text-xs p-3 rounded-xl flex-1 text-white"
              />
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="bg-[#111827] border border-slate-800 text-xs p-3 rounded-xl text-white"
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
              {filteredOrders.length === 0 ? (
                <div className="text-center py-12 text-slate-500 font-bold bg-[#111827] border border-slate-800 rounded-3xl">
                  لا توجد طلبات مطابقة.
                </div>
              ) : (
                filteredOrders.map((o, idx) => (
                  <div key={o.id} className="bg-[#111827] border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm">طلب #{idx + 1} - {o.customer_name}</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-800 text-cyan-400">
                          {o.status || 'جديد'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 flex flex-wrap gap-3">
                        <span>الهاتف: <strong className="text-white font-mono" dir="ltr">{o.phone}</strong></span>
                        <span>العنوان: <strong className="text-white">{o.governorate} - {o.address}</strong></span>
                        <span>المنتج: <strong className="text-white">{o.product_name || 'منتج عام'}</strong> (x{o.quantity || 1})</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-emerald-400 font-black text-base">{o.total_amount} ج.م</span>
                      <select
                        value={o.status || 'جديد'}
                        onChange={async (e) => {
                          const newStatus = e.target.value;
                          await supabase.from('orders').update({ status: newStatus }).eq('id', o.id);
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
                ))
              )}
            </div>
          </div>
        )}

        {/* 🌟 5. شاشة المنتجات العامة */}
        {activeScreen === 'products' && (
          <div className="space-y-4">
            <div className="bg-[#111827] p-5 rounded-3xl border border-slate-800 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-black">المنتجات في المنصة ({products.length})</h2>
                <p className="text-xs text-slate-400">استعراض كافة منتجات المتاجر ومتابعة المخزون</p>
              </div>
              <button
                onClick={() => {
                  setProductForm({ name: '', price: '', cost_price: '', stock: 20, images: [] });
                  setShowProductModal(true);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                ➕ إضافة منتج عام
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {products.map((p) => (
                <div key={p.id} className="bg-[#111827] border border-slate-800 p-4 rounded-3xl space-y-3">
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

        {/* 🌟 6. شاشة التحليلات الشاملة والمالية */}
        {activeScreen === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#111827] border border-slate-800 p-5 rounded-3xl shadow-sm">
                <span className="text-xs text-slate-400 block mb-1">إجمالي الزوار الكلي</span>
                <span className="text-2xl font-black text-cyan-400">{totalStoreVisitors}</span>
              </div>
              <div className="bg-[#111827] border border-slate-800 p-5 rounded-3xl shadow-sm">
                <span className="text-xs text-slate-400 block mb-1">الطلبات المكتملة</span>
                <span className="text-2xl font-black text-blue-400">{orders.length} طلب</span>
              </div>
              <div className="bg-[#111827] border border-slate-800 p-5 rounded-3xl shadow-sm">
                <span className="text-xs text-slate-400 block mb-1">معدل التحويل العام</span>
                <span className="text-2xl font-black text-purple-400">{platformConversionRate}%</span>
              </div>
              <div className="bg-[#111827] border border-slate-800 p-5 rounded-3xl shadow-sm">
                <span className="text-xs text-slate-400 block mb-1">اشتراكات المنصة المحصلة</span>
                <span className="text-2xl font-black text-amber-400">{totalSubFeesCollected.toLocaleString()} ج.م</span>
              </div>
              <div className="bg-[#111827] border border-slate-800 p-5 rounded-3xl shadow-sm col-span-full">
                <span className="text-xs text-slate-400 block mb-1">إجمالي مبيعات كل المتاجر في NEXT ORDER</span>
                <span className="text-3xl font-black text-emerald-400">{totalStoreSales.toLocaleString()} ج.م</span>
              </div>
            </div>
          </div>
        )}

        {/* 🌟 7. شاشة بيكسلات فيسبوك (CAPI) */}
        {activeScreen === 'pixels' && (
          <form onSubmit={handleSaveSettings} className="bg-[#111827] border border-slate-800 p-6 rounded-3xl max-w-2xl mx-auto space-y-4">
            <h2 className="text-lg font-black border-b border-slate-800 pb-3">إعدادات البيكسل العامة للمنصة</h2>
            {[1, 2, 3, 4].map((num) => (
              <div key={num} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                <span className="text-xs font-bold text-slate-300">بيكسل فيسبوك ({num})</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    dir="ltr"
                    value={settings[`pixel_${num}`]}
                    onChange={(e) => setSettings({ ...settings, [`pixel_${num}`]: e.target.value })}
                    placeholder={`Pixel ID ${num}`}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-mono text-white"
                  />
                  <input
                    type="text"
                    dir="ltr"
                    value={settings[`token_${num}`]}
                    onChange={(e) => setSettings({ ...settings, [`token_${num}`]: e.target.value })}
                    placeholder={`API Token ${num}`}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-mono text-white"
                  />
                </div>
              </div>
            ))}
            <button type="submit" disabled={savingSettings} className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow cursor-pointer">
              حفظ البيكسلات 💾
            </button>
          </form>
        )}

        {/* 🌟 8. شاشة هوية المنصة وإعدادات اللوجو */}
        {activeScreen === 'store_branding' && (
          <form onSubmit={handleSaveSettings} className="bg-[#111827] border border-slate-800 p-6 sm:p-8 rounded-3xl max-w-3xl mx-auto space-y-6">
            <h2 className="text-lg font-black border-b border-slate-800 pb-4">هوية منصة NEXT ORDER</h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">لوجو المنصة الرسمي</label>
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border border-dashed border-slate-700 rounded-2xl bg-slate-900/60">
                  <div className="w-20 h-20 rounded-2xl border border-slate-700 bg-white p-1.5 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                    {settings.store_logo ? (
                      <img src={settings.store_logo} alt="Platform Logo" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-slate-400 text-3xl">🖼</span>
                    )}
                  </div>

                  <div className="space-y-2 flex-1 text-center sm:text-right">
                    <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow">
                      <span>📁</span>
                      <span>{uploadingLogo ? 'جاري رفع الصورة...' : 'اختيار لوجو المنصة من جهازك'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={uploadingLogo}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[11px] text-slate-500">
                      الصيغ المدعومة: PNG, JPG, WEBP, SVG.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">اسم المنصة الرسمي *</label>
                <input
                  type="text"
                  required
                  value={settings.store_name}
                  onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                  placeholder="NEXT ORDER"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-bold text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">وصف المنصة</label>
                <textarea
                  rows="3"
                  value={settings.store_description}
                  onChange={(e) => setSettings({ ...settings, store_description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">رقم واتساب الدعم الفني العام</label>
                  <input
                    type="tel"
                    dir="ltr"
                    value={settings.support_phone}
                    onChange={(e) => setSettings({ ...settings, support_phone: e.target.value })}
                    placeholder="01xxxxxxxxx"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-mono text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">نص الشريط الإعلاني العلوي</label>
                  <input
                    type="text"
                    value={settings.announcement_text}
                    onChange={(e) => setSettings({ ...settings, announcement_text: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={savingSettings || uploadingLogo}
                className="px-8 py-3.5 bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white font-black text-sm rounded-2xl shadow-lg transition cursor-pointer"
              >
                {savingSettings ? 'جاري الحفظ...' : 'حفظ هوية المنصة 💾'}
              </button>
            </div>
          </form>
        )}

      </main>

      {/* نافذة تفعيل المشتركين مع تنبيه الاشتراك */}
      {editingSub && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-black border-b border-slate-800 pb-3">
              تفعيل اشتراك: {editingSub.store_name}
            </h3>

            <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-300 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <span>⚠️</span>
                <span>تنبيه الاشتراك:</span>
              </div>
              <div>قيمة الاشتراك الشهري: <strong>5 دولار أو ما يعادلها بالجنيه المصري</strong>.</div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">مدة الاشتراك</label>
              <select
                value={durationMonths}
                onChange={(e) => setDurationMonths(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white"
              >
                <option value="1">شهر واحد (30 يوم)</option>
                <option value="3">3 أشهر</option>
                <option value="6">6 أشهر</option>
                <option value="12">سنة كاملة (12 شهر)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">المبلغ المحول الفعلي</label>
              <input
                type="number"
                placeholder="المبلغ المحول هنا..."
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm font-bold text-emerald-400"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button onClick={() => setEditingSub(null)} className="px-4 py-2.5 bg-slate-800 rounded-xl text-xs font-bold">
                إلغاء
              </button>
              <button onClick={() => handleActivateSubscriber(editingSub)} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow cursor-pointer">
                تأكيد التفعيل وفتح المتجر 🚀
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة إضافة منتج عام */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-black border-b border-slate-800 pb-3">إضافة منتج عام</h3>
            <input
              type="text"
              placeholder="اسم المنتج"
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="سعر البيع"
                value={productForm.price}
                onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm font-bold text-white"
              />
              <input
                type="number"
                placeholder="المخزون"
                value={productForm.stock}
                onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button onClick={() => setShowProductModal(false)} className="px-4 py-2 bg-slate-800 rounded-xl text-xs font-bold">إلغاء</button>
              <button
                onClick={async () => {
                  if (!productForm.name || !productForm.price) return alert('اكتب الاسم والسعر');
                  await supabase.from('products').insert([{
                    name: productForm.name,
                    price: Number(productForm.price),
                    stock: Number(productForm.stock) || 20,
                  }]);
                  setShowProductModal(false);
                  loadAllMasterData();
                }}
                className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
              >
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
