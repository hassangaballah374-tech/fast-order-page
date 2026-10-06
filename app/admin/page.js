'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function SuperAdminDashboard() {
  const [activeScreen, setActiveScreen] = useState('home');
  const [loading, setLoading] = useState(true);

  // المشتركون والعملاء
  const [subscribers, setSubscribers] = useState([]);
  const [editingSub, setEditingSub] = useState(null);
  const [durationMonths, setDurationMonths] = useState(1);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // إعدادات المنصة والهوية
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

  // الطلبات والمنتجات والتحليلات العامة
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [analytics, setAnalytics] = useState([]);

  const [showProductModal, setShowProductModal] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '', price: '', stock: 20, images: [],
  });
  const [newImageUrl, setNewImageUrl] = useState('');

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);
    try {
      if (supabase) {
        const { data: subData } = await supabase
          .from('store_profiles')
          .select('*')
          .order('created_at', { ascending: false });
        if (subData) setSubscribers(subData);

        const { data: sData } = await supabase.from('store_settings').select('*').limit(1).maybeSingle();
        if (sData) {
          setSettings({
            store_name: sData.store_name || 'NEXT ORDER',
            store_logo: sData.store_logo || sData.logo_url || '',
            store_description: sData.store_description || '',
            support_phone: sData.support_phone || '',
            announcement_text: sData.announcement_text || '',
            pixel_1: sData.pixel_1 || sData.facebook_pixel_id || '',
            token_1: sData.token_1 || sData.facebook_api_token || '',
            pixel_2: sData.pixel_2 || '', token_2: sData.token_2 || '',
            pixel_3: sData.pixel_3 || '', token_3: sData.token_3 || '',
            pixel_4: sData.pixel_4 || '', token_4: sData.token_4 || '',
          });
        }

        const { data: pData } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (pData) setProducts(pData);

        const { data: oData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (oData) setOrders(oData);

        const { data: aData } = await supabase.from('store_analytics').select('*');
        if (aData) setAnalytics(aData);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  // تصنيف المشتركين
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
      loadAllData();
    } else {
      alert('خطأ أثناء التفعيل: ' + error.message);
    }
  };

  const handleSuspendSubscriber = async (sub) => {
    if (!confirm(`هل أنت متأكد من الإيقاف المؤقت لمتجر "${sub.store_name}"؟`)) return;
    await supabase.from('store_profiles').update({ is_active: false, subscription_status: 'suspended' }).eq('id', sub.id);
    loadAllData();
  };

  const handleDeactivateSubscriber = async (sub) => {
    if (!confirm(`هل تريد تعطيل متجر "${sub.store_name}" تماماً؟`)) return;
    await supabase.from('store_profiles').update({ is_active: false, subscription_status: 'disabled' }).eq('id', sub.id);
    loadAllData();
  };

  const handleDeleteSubscriber = async (sub) => {
    const confirmDelete = prompt(`⚠️ تحذير: اكتب اسم المتجر للتأكيد: "${sub.store_name}"`);
    if (confirmDelete !== sub.store_name) return;

    try {
      if (sub.user_id) {
        await supabase.from('products').delete().eq('user_id', sub.user_id);
        await supabase.from('orders').delete().eq('user_id', sub.user_id);
        await supabase.from('merchant_settings').delete().eq('user_id', sub.user_id);
      }
      await supabase.from('store_profiles').delete().eq('id', sub.id);
      alert(`🗑 تم حذف حساب (${sub.store_name}) نهائياً`);
      loadAllData();
    } catch (e) {
      alert('خطأ أثناء الحذف: ' + e.message);
    }
  };

  const copyRegisterLink = () => {
    if (typeof window !== 'undefined') {
      const link = `${window.location.origin}/register`;
      navigator.clipboard.writeText(link);
      alert('📋 تم نسخ رابط تسجيل المشتركين:\n' + link);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setSettings((prev) => ({ ...prev, store_logo: reader.result }));
      setUploadingLogo(false);
      alert('✅ تم اختيار اللوجو بنجاح!');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    const { data: existing } = await supabase.from('store_settings').select('id').limit(1).maybeSingle();
    await supabase.from('store_settings').upsert({ id: existing?.id || 1, ...settings });
    alert('✅ تم حفظ الإعدادات بنجاح!');
    setSavingSettings(false);
  };

  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total_amount || o.total_price) || 0), 0);
  const visitorsCount = analytics.filter((a) => a.event_type === 'visit').length;
  const conversionRate = visitorsCount > 0 ? ((orders.length / visitorsCount) * 100).toFixed(2) : '0.00';

  const gridCards = [
    {
      id: 'pending_subscribers',
      title: 'مشتركين جدد (قيد الانتظار)',
      desc: 'بانتظار سداد رسوم الاشتراك وتأكيد التحويل (5 دولار أو ما يعادلها بالمصري)',
      icon: '⏳',
      bgClass: 'bg-gradient-to-r from-amber-500 to-yellow-600',
      badge: `${pendingSubscribers.length} في الانتظار`,
    },
    {
      id: 'active_clients',
      title: 'العملاء الحاليين',
      desc: 'المتاجر المفعلة، بيانات العملاء، ومواعيد تجديد الاشتراك',
      icon: '👥',
      bgClass: 'bg-gradient-to-r from-emerald-500 to-teal-600',
      badge: `${activeClients.length} عميل نشط`,
    },
    {
      id: 'store_branding',
      title: 'إعدادات المنصة والهوية',
      desc: 'شعار المنصة، الاسم، ورقم الواتساب الرسمي',
      icon: '⚙️',
      bgClass: 'bg-gradient-to-r from-orange-500 to-rose-600',
      badge: 'الهوية والتصميم',
    },
    {
      id: 'orders',
      title: 'طلبات ومبيعات المنصة',
      desc: 'متابعة كافة طلبات المتاجر وحالات الشحن',
      icon: '📦',
      bgClass: 'bg-gradient-to-r from-blue-600 to-indigo-600',
      badge: `${orders.length} طلب`,
    },
    {
      id: 'products',
      title: 'المنتجات والمخزون',
      desc: 'استعراض كافة المنتجات المرفوعة ومتابعة المخزون',
      icon: '🛍️',
      bgClass: 'bg-gradient-to-r from-teal-500 to-emerald-600',
      badge: `${products.length} منتج`,
    },
    {
      id: 'analytics',
      title: 'التحليلات الشاملة',
      desc: 'إجمالي المبيعات، ومعدلات التحويل، ونمو المتاجر',
      icon: '📈',
      bgClass: 'bg-gradient-to-r from-indigo-600 to-purple-600',
      badge: `${totalRevenue.toLocaleString()} ج.م`,
    },
    {
      id: 'pixels',
      title: 'بيكسلات فيسبوك (CAPI)',
      desc: 'ربط ما يصل إلى 4 بيكسلات مع التوكن السري',
      icon: '⚡',
      bgClass: 'bg-gradient-to-r from-rose-600 to-red-600',
      badge: 'إعدادات CAPI',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center font-sans text-slate-800" dir="rtl">
        <div className="font-bold text-lg animate-pulse">جاري تحميل لوحة التحكم...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans pb-16" dir="rtl">
      
      {/* الرأس العلوي */}
      <header className="bg-white border-b border-slate-200 px-6 py-5 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {activeScreen !== 'home' && (
              <button
                onClick={() => setActiveScreen('home')}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-2xl text-sm font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>⬅</span>
                <span>الرئيسية</span>
              </button>
            )}
            <div className="flex items-center gap-3">
              {settings.store_logo && (
                <img src={settings.store_logo} alt="Logo" className="w-10 h-10 object-contain rounded-xl border border-slate-200 bg-white" />
              )}
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-wide">
                  {activeScreen === 'home' ? 'لوحة تحكم السوبر أدمن' : gridCards.find((c) => c.id === activeScreen)?.title}
                </h1>
                <p className="text-xs text-slate-500">إدارة منصة NEXT ORDER وتفعيل المتاجر والاشتراكات</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-black border border-red-200">
              👑 SUPER ADMIN
            </span>
            <div className="text-xs font-black text-slate-800 bg-slate-100 px-4 py-2 rounded-full border border-slate-200 tracking-wider">
              {settings.store_name || 'NEXT ORDER'}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 sm:p-8">

        {/* 🌟 1. الشاشة الرئيسية: شبكة الكروت الملونة */}
        {activeScreen === 'home' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {gridCards.map((card) => (
                <div
                  key={card.id}
                  onClick={() => setActiveScreen(card.id)}
                  className={`${card.bgClass} text-white p-6 rounded-3xl cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden flex flex-col justify-between min-h-[155px]`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs bg-white/20 backdrop-blur-md px-3 py-1 rounded-full font-bold">
                      {card.badge}
                    </span>
                    <span className="text-2xl opacity-90">{card.icon}</span>
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
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-lg font-black text-amber-600 flex items-center gap-2">
                  <span>⏳</span>
                  <span>مشتركون جدد بانتظار التفعيل ({pendingSubscribers.length})</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  المتاجر التي سجلت حديثاً وبانتظار تأكيد التحويل (5 دولار أو ما يعادلها بالمصري).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={copyRegisterLink} className="px-3.5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer">
                  <span>🔗</span>
                  <span>رابط التسجيل</span>
                </button>
                <button onClick={loadAllData} className="px-3.5 py-2 bg-slate-100 rounded-xl text-xs font-bold cursor-pointer">🔄 تحديث</button>
              </div>
            </div>

            <div className="space-y-3">
              {pendingSubscribers.length === 0 ? (
                <div className="text-center py-16 text-slate-400 font-bold bg-white border border-slate-200 rounded-3xl">
                  🎉 رائع! لا يوجد أي مشترك جديد في قائمة الانتظار حالياً.
                </div>
              ) : (
                pendingSubscribers.map((s) => (
                  <div key={s.id} className="bg-white border-2 border-amber-200 p-5 rounded-3xl shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-lg">{s.store_name}</span>
                        <span className="text-xs text-slate-400 font-mono">({s.store_slug})</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-black bg-amber-100 text-amber-800">
                          🟡 قيد المراجعة / لم يدفع بعد
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">سجل في: {new Date(s.created_at).toLocaleDateString('ar-EG')}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-600 bg-amber-50/60 p-3 rounded-2xl">
                      <div>اسم التاجر: <strong className="text-slate-900">{s.owner_name}</strong></div>
                      <div>رقم الواتساب: <a href={`https://wa.me/${s.phone}`} target="_blank" className="text-emerald-700 font-bold font-mono underline" dir="ltr">{s.phone} ↗</a></div>
                      <div>المحافظة: <strong className="text-slate-900">{s.governorate}</strong></div>
                      <div>الاشتراك: <strong className="text-amber-800 font-bold">5 دولار أو ما يعادلها بالمصري</strong></div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleDeleteSubscriber(s)}
                        className="px-3 py-2 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        🗑 رفض وحذف
                      </button>
                      <button
                        onClick={() => { setEditingSub(s); setPaymentAmount(s.amount_paid || ''); }}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow transition cursor-pointer flex items-center gap-1.5"
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

        {/* 🌟 3. شاشة العملاء الحاليين (الموافق عليهم) ومواعيد التجديد */}
        {activeScreen === 'active_clients' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-lg font-black text-emerald-700 flex items-center gap-2">
                  <span>👥</span>
                  <span>العملاء الحاليين والمتاجر النشطة ({activeClients.length})</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  المتاجر التي تمت الموافقة عليها، مع كامل بياناتهم ومواعيد تجديد اشتراكاتهم القادمة.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="بحث باسم المتجر أو المالك..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs p-2.5 rounded-xl w-56"
                />
                <button onClick={loadAllData} className="px-3.5 py-2.5 bg-slate-100 rounded-xl text-xs font-bold cursor-pointer">🔄 تحديث</button>
              </div>
            </div>

            <div className="space-y-3">
              {activeClients.length === 0 ? (
                <div className="text-center py-16 text-slate-400 font-bold bg-white border border-slate-200 rounded-3xl">
                  لا يوجد عملاء مفعلون حالياً. قم بتفعيل المشتركين الجدد من قائمة الانتظار.
                </div>
              ) : (
                activeClients
                  .filter((s) => (s.store_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (s.owner_name || '').toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((s) => {
                    const expiryDate = new Date(s.subscription_ends_at);
                    const daysLeft = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));

                    return (
                      <div key={s.id} className="bg-white border border-emerald-200 p-5 rounded-3xl shadow-sm space-y-4 hover:border-emerald-300 transition">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-slate-900 text-lg">{s.store_name}</span>
                            <a href={`/store/${s.store_slug}`} target="_blank" className="text-xs text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full font-mono hover:underline">
                              /{s.store_slug} ↗
                            </a>
                            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                              🟢 متجر نشط
                            </span>
                          </div>

                          <div className="text-xs font-black px-3 py-1 bg-amber-50 text-amber-800 rounded-xl border border-amber-200">
                            📅 موعد التجديد القادم: {expiryDate.toLocaleDateString('ar-EG')} ({daysLeft} يوم متبقي)
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl">
                          <div>التاجر: <strong className="text-slate-900">{s.owner_name}</strong></div>
                          <div>الهاتف: <a href={`https://wa.me/${s.phone}`} target="_blank" className="text-emerald-700 font-bold font-mono underline" dir="ltr">{s.phone}</a></div>
                          <div>المبلغ المحول: <strong className="text-emerald-600 font-bold">{s.amount_paid || 0}</strong></div>
                          <div>المحافظة: <strong className="text-slate-900">{s.governorate}</strong></div>
                        </div>

                        <div className="flex flex-wrap justify-end gap-2 pt-1">
                          <button
                            onClick={() => { setEditingSub(s); setPaymentAmount(s.amount_paid || ''); }}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                          >
                            🔄 تجديد الاشتراك
                          </button>
                          <button
                            onClick={() => handleSuspendSubscriber(s)}
                            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold transition cursor-pointer"
                          >
                            ⏸️ إيقاف مؤقت
                          </button>
                          <button
                            onClick={() => handleDeactivateSubscriber(s)}
                            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                          >
                            🛑 تعطيل
                          </button>
                          <button
                            onClick={() => handleDeleteSubscriber(s)}
                            className="px-3.5 py-2 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
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

        {/* 🌟 4. شاشة إعدادات المنصة والهوية واللوجو */}
        {activeScreen === 'store_branding' && (
          <form onSubmit={handleSaveSettings} className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6 max-w-3xl mx-auto">
            <h2 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3">هوية المنصة</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">لوجو المنصة</label>
                <div className="flex items-center gap-4 p-4 border border-dashed border-slate-300 rounded-2xl bg-slate-50">
                  <div className="w-16 h-16 rounded-xl border bg-white flex items-center justify-center overflow-hidden">
                    {settings.store_logo ? <img src={settings.store_logo} className="w-full h-full object-contain" /> : '🖼'}
                  </div>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="text-xs" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم المنصة</label>
                <input
                  type="text"
                  value={settings.store_name}
                  onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm font-bold bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">واتساب الدعم الفني العام</label>
                <input
                  type="tel"
                  dir="ltr"
                  value={settings.support_phone}
                  onChange={(e) => setSettings({ ...settings, support_phone: e.target.value })}
                  placeholder="01xxxxxxxxx"
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm font-mono bg-slate-50"
                />
              </div>
            </div>
            <button type="submit" disabled={savingSettings || uploadingLogo} className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer">
              حفظ الإعدادات 💾
            </button>
          </form>
        )}

        {/* 🌟 5. شاشة الطلبات */}
        {activeScreen === 'orders' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex justify-between items-center">
              <h2 className="text-lg font-black">كافة الطلبات ({orders.length})</h2>
              <button onClick={loadAllData} className="px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-bold">تحديث</button>
            </div>
            <div className="space-y-3">
              {orders.map((o, idx) => (
                <div key={o.id} className="bg-white border border-slate-200 p-4 rounded-2xl text-xs space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>طلب #{idx + 1} - {o.customer_name}</span>
                    <span className="text-emerald-600">{o.total_amount || o.total_price} ج.م</span>
                  </div>
                  <div className="text-slate-500">الهاتف: {o.phone} | العنوان: {o.governorate} - {o.address}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 🌟 6. شاشة المنتجات */}
        {activeScreen === 'products' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex justify-between items-center">
              <h2 className="text-lg font-black">المنتجات العامة والمخزون ({products.length})</h2>
              <button onClick={() => setShowProductModal(true)} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold">➕ إضافة منتج</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {products.map((p) => (
                <div key={p.id} className="bg-white border border-slate-200 p-4 rounded-2xl space-y-2">
                  <div className="w-full h-36 bg-slate-50 rounded-xl flex items-center justify-center overflow-hidden">
                    {p.images?.[0] ? <img src={p.images[0]} className="w-full h-full object-contain" /> : '📦'}
                  </div>
                  <h4 className="font-bold text-sm">{p.name}</h4>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span className="text-emerald-600 font-bold">{p.price} ج.م</span>
                    <span>المخزون: {p.stock || 20}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 🌟 7. شاشة التحليلات الشاملة */}
        {activeScreen === 'analytics' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
              <span className="text-xs text-slate-500 block">إجمالي الزوار</span>
              <span className="text-2xl font-black">{visitorsCount}</span>
            </div>
            <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
              <span className="text-xs text-slate-500 block">الطلبات المكتملة</span>
              <span className="text-2xl font-black text-emerald-600">{orders.length}</span>
            </div>
            <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
              <span className="text-xs text-slate-500 block">معدل التحويل</span>
              <span className="text-2xl font-black text-indigo-600">{conversionRate}%</span>
            </div>
            <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm col-span-full">
              <span className="text-xs text-slate-500 block">إجمالي المبيعات الكلية</span>
              <span className="text-3xl font-black text-emerald-600">{totalRevenue.toLocaleString()} ج.م</span>
            </div>
          </div>
        )}

        {/* 🌟 8. شاشة البيكسل */}
        {activeScreen === 'pixels' && (
          <form onSubmit={handleSaveSettings} className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-4">
            <h2 className="text-lg font-black border-b pb-3">إعدادات البيكسل</h2>
            {[1, 2, 3, 4].map((num) => (
              <div key={num} className="p-3 bg-slate-50 rounded-xl space-y-2">
                <span className="text-xs font-bold">بيكسل ({num})</span>
                <input
                  type="text"
                  dir="ltr"
                  value={settings[`pixel_${num}`] || ''}
                  onChange={(e) => setSettings({ ...settings, [`pixel_${num}`]: e.target.value })}
                  placeholder={`Pixel ID ${num}`}
                  className="w-full bg-white border rounded-xl p-2.5 text-xs font-mono"
                />
              </div>
            ))}
            <button type="submit" className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold">حفظ البيكسل 💾</button>
          </form>
        )}

      </main>

      {/* نافذة تفعيل / تجديد الاشتراك وتحديد المبلغ */}
      {editingSub && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-lg font-black border-b border-slate-100 pb-3">
              تفعيل اشتراك: {editingSub.store_name}
            </h3>
            
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <span>⚠️</span>
                <span>تنبيه الاشتراك:</span>
              </div>
              <div>قيمة الاشتراك الشهري: <strong>5 دولار أو ما يعادلها بالجنيه المصري</strong>.</div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">مدة الاشتراك</label>
              <select
                value={durationMonths}
                onChange={(e) => setDurationMonths(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-sm"
              >
                <option value="1">شهر واحد (30 يوم)</option>
                <option value="3">3 أشهر</option>
                <option value="6">6 أشهر</option>
                <option value="12">سنة كاملة (12 شهر)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">المبلغ المحول الفعلي للاشتراك</label>
              <input
                type="number"
                placeholder="اكتب المبلغ المحول هنا..."
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-sm font-bold text-emerald-600"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button onClick={() => setEditingSub(null)} className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold cursor-pointer">
                إلغاء
              </button>
              <button onClick={() => handleActivateSubscriber(editingSub)} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black cursor-pointer shadow">
                تأكيد التفعيل وفتح المتجر 🚀
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة إضافة منتج عام */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-lg font-black border-b border-slate-100 pb-3">إضافة منتج عام</h3>
            <input
              type="text"
              placeholder="اسم المنتج"
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              className="w-full border border-slate-200 rounded-xl p-2.5 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="سعر البيع"
                value={productForm.price}
                onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                className="border border-slate-200 rounded-xl p-2.5 text-sm font-bold"
              />
              <input
                type="number"
                placeholder="المخزون"
                value={productForm.stock}
                onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                className="border border-slate-200 rounded-xl p-2.5 text-sm"
              />
            </div>
            <input
              type="url"
              placeholder="رابط صورة المنتج"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2.5 text-sm"
            />
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button onClick={() => setShowProductModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold cursor-pointer">إلغاء</button>
              <button
                onClick={async () => {
                  if (!productForm.name || !productForm.price) return alert('يرجى كتابة الاسم والسعر');
                  await supabase.from('products').insert([{
                    name: productForm.name,
                    price: Number(productForm.price),
                    stock: Number(productForm.stock) || 20,
                    images: newImageUrl ? [newImageUrl] : [],
                  }]);
                  setShowProductModal(false);
                  loadAllData();
                }}
                className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer"
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
