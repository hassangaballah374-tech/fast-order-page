'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function SuperAdminDashboard() {
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

  // الطلبات والمنتجات والتحليلات العامة
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

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
        // جلب جميع المشتركين
        const { data: subData } = await supabase
          .from('store_profiles')
          .select('*')
          .order('created_at', { ascending: false });
        if (subData) setSubscribers(subData);

        // جلب إعدادات المنصة
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

  // 1. تفعيل / تجديد الاشتراك
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
      alert(`✅ تم تفعيل متجر (${sub.store_name}) لمدة ${months} شهر بنجاح!`);
      setEditingSub(null);
      loadAllData();
    } else {
      alert('حدث خطأ أثناء التفعيل: ' + error.message);
    }
  };

  // 2. إيقاف مؤقت للحساب
  const handleSuspendSubscriber = async (sub) => {
    const confirmSuspend = confirm(`هل أنت متأكد من الإيقاف المؤقت لمتجر "${sub.store_name}"؟\nلن يتمكن الزبائن من فتح المتجر حتى تعيد تشغيله.`);
    if (!confirmSuspend) return;

    const { error } = await supabase
      .from('store_profiles')
      .update({ is_active: false, subscription_status: 'suspended' })
      .eq('id', sub.id);

    if (!error) {
      alert(`⏸️ تم إيقاف متجر (${sub.store_name}) مؤقتاً.`);
      loadAllData();
    } else {
      alert('خطأ: ' + error.message);
    }
  };

  // 3. تعطيل الحساب بالكامل
  const handleDeactivateSubscriber = async (sub) => {
    const confirmDeact = confirm(`هل تريد تعطيل حساب متجر "${sub.store_name}" بالكامل؟`);
    if (!confirmDeact) return;

    const { error } = await supabase
      .from('store_profiles')
      .update({ is_active: false, subscription_status: 'disabled' })
      .eq('id', sub.id);

    if (!error) {
      alert(`🛑 تم تعطيل الحساب.`);
      loadAllData();
    } else {
      alert('خطأ: ' + error.message);
    }
  };

  // 4. حذف الحساب نهائياً مع متعلقاته
  const handleDeleteSubscriber = async (sub) => {
    const confirmDelete = prompt(`⚠️ تحذير شديد الخطورة!\nأنت على وشك حذف متجر "${sub.store_name}" نهائياً مع كافة منتجاته وطلباته.\nللتأكيد، اكتب اسم المتجر تماماً كما هو: "${sub.store_name}"`);
    if (confirmDelete !== sub.store_name) {
      if (confirmDelete !== null) alert('لم يتم الحذف: الاسم المدخل غير مطابق!');
      return;
    }

    try {
      // حذف المنتجات والطلبات والإعدادات المرتبطة بهذا التاجر أولاً
      if (sub.user_id) {
        await supabase.from('products').delete().eq('user_id', sub.user_id);
        await supabase.from('orders').delete().eq('user_id', sub.user_id);
        await supabase.from('merchant_settings').delete().eq('user_id', sub.user_id);
        await supabase.from('store_analytics').delete().eq('user_id', sub.user_id);
      }

      // حذف بروفايل المتجر
      const { error } = await supabase.from('store_profiles').delete().eq('id', sub.id);
      if (error) throw error;

      alert(`🗑️ تم حذف حساب ومتجر (${sub.store_name}) وكافة بياناته نهائياً.`);
      loadAllData();
    } catch (err) {
      alert('حدث خطأ أثناء محاولة الحذف: ' + err.message);
    }
  };

  // رفع اللوجو كملف صورة
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
      const fileName = `logo_${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

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
        alert('✅ تم رفع اللوجو بنجاح!');
      }
    } catch (err) {
      alert('حدث خطأ أثناء رفع الصورة: ' + err.message);
    }
    setUploadingLogo(false);
  };

  // حفظ إعدادات وهوية النظام
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const { data: existing } = await supabase.from('store_settings').select('id').limit(1).maybeSingle();
      const targetId = existing?.id || 1;

      const payload = {
        id: targetId,
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

      alert('✅ تم حفظ إعدادات وهوية المتجر بنجاح!');
    } catch (err) {
      alert('خطأ أثناء الحفظ: ' + err.message);
    }
    setSavingSettings(false);
  };

  const copyRegisterLink = () => {
    if (typeof window !== 'undefined') {
      const link = `${window.location.origin}/register`;
      navigator.clipboard.writeText(link);
      alert('📋 تم نسخ رابط تسجيل المشتركين:\n' + link);
    }
  };

  // الحسابات العامة
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total_amount || o.total_price) || 0), 0);
  const totalOrdersCount = orders.length;
  const visitorsCount = analytics.filter((a) => a.event_type === 'visit').length;
  const averageOrderValue = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;
  const conversionRate = visitorsCount > 0 ? ((totalOrdersCount / visitorsCount) * 100).toFixed(2) : '0.00';

  // فلترة المشتركين
  const filteredSubscribers = subscribers.filter(s =>
    (s.store_name || '').toLowerCase().includes(searchSubscriber.toLowerCase()) ||
    (s.owner_name || '').toLowerCase().includes(searchSubscriber.toLowerCase()) ||
    (s.phone || '').includes(searchSubscriber)
  );

  const gridCards = [
    {
      id: 'subscribers',
      title: 'إدارة المشتركين والمتاجر',
      desc: 'تفعيل، تجميد مؤقت، تعطيل، أو حذف المتاجر والحسابات',
      icon: '👥',
      bgClass: 'bg-gradient-to-r from-emerald-500 to-teal-600',
      badge: `${subscribers.length} متجر`,
    },
    {
      id: 'store_branding',
      title: 'إعدادات المنصة والهوية',
      desc: 'شعار المنصة، الاسم، الوصف، ورقم الدعم الفني',
      icon: '⚙️',
      bgClass: 'bg-gradient-to-r from-amber-500 to-orange-600',
      badge: 'الهوية والتصميم',
    },
    {
      id: 'orders',
      title: 'طلبات ومبيعات المنصة',
      desc: 'متابعة كافة الطلبات الواردة في جميع المتاجر',
      icon: '📦',
      bgClass: 'bg-gradient-to-r from-blue-600 to-indigo-600',
      badge: `${orders.length} طلب`,
    },
    {
      id: 'products',
      title: 'المنتجات والمخزون العام',
      desc: 'قائمة بجميع المنتجات المرفوعة ومتابعة توفرها',
      icon: '🛍️',
      bgClass: 'bg-gradient-to-r from-teal-500 to-emerald-600',
      badge: `${products.length} منتج`,
    },
    {
      id: 'analytics',
      title: 'التحليلات الشاملة والأرباح',
      desc: 'معدل التحويل ومتوسط السلة وصافي المبيعات الكلية',
      icon: '📈',
      bgClass: 'bg-gradient-to-r from-indigo-600 to-purple-600',
      badge: `${totalRevenue.toLocaleString()} ج.م`,
    },
    {
      id: 'pixels',
      title: 'بيكسلات فيسبوك (CAPI)',
      desc: 'ربط ما يصل إلى 4 بيكسلات مع الرموز السرية',
      icon: '⚡',
      bgClass: 'bg-gradient-to-r from-rose-600 to-red-600',
      badge: 'إعدادات CAPI',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center font-sans text-slate-800" dir="rtl">
        <div className="font-bold text-lg animate-pulse">جاري تحميل لوحة الإدارة العامة (Super Admin)...</div>
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
                <p className="text-xs text-slate-500">إدارة منصة NEXT ORDER والتحكم في حسابات ومتاجر المشتركين</p>
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

        {/* 🌟 2. شاشة المشتركين والمتاجر مع أزرار التحكم الكامل */}
        {activeScreen === 'subscribers' && (
          <div className="space-y-5">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-lg font-black">إدارة متاجر المشتركين ({subscribers.length})</h2>
                <p className="text-xs text-slate-500">تحكم كامل في تفعيل، إيقاف مؤقت، تعطيل، أو حذف أي متجر مشترك</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <input
                  type="text"
                  placeholder="بحث باسم المتجر أو المالك أو الهاتف..."
                  value={searchSubscriber}
                  onChange={(e) => setSearchSubscriber(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs p-2.5 rounded-xl flex-1 md:w-64"
                />
                <button
                  onClick={copyRegisterLink}
                  className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <span>🔗</span>
                  <span>رابط التسجيل</span>
                </button>
                <button onClick={loadAllData} className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold cursor-pointer">
                  🔄 تحديث
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {filteredSubscribers.length === 0 ? (
                <div className="text-center py-16 text-slate-400 font-bold bg-white border border-slate-200 rounded-3xl">
                  لا توجد متاجر مطابقة لبحثك.
                </div>
              ) : (
                filteredSubscribers.map((s) => {
                  const isExpired = !s.subscription_ends_at || new Date(s.subscription_ends_at) < new Date();
                  const isSuspended = s.subscription_status === 'suspended';
                  const isDisabled = s.subscription_status === 'disabled';
                  const isActive = s.is_active && !isExpired && !isSuspended && !isDisabled;

                  return (
                    <div key={s.id} className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm space-y-4 hover:border-slate-300 transition">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-slate-900 text-lg">{s.store_name}</span>
                          <a
                            href={`/store/${s.store_slug}`}
                            target="_blank"
                            className="text-xs text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full font-mono hover:underline"
                          >
                            /{s.store_slug} ↗
                          </a>
                          
                          {/* شارة حالة المتجر */}
                          {isActive && (
                            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700">
                              🟢 نشط ويعمل
                            </span>
                          )}
                          {isSuspended && (
                            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-700">
                              ⏸️ موقوف مؤقتاً
                            </span>
                          )}
                          {isDisabled && (
                            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-gray-200 text-gray-700">
                              🛑 معطل
                            </span>
                          )}
                          {!isActive && !isSuspended && !isDisabled && (
                            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-red-100 text-red-600">
                              🔴 منتهي / غير مفعل
                            </span>
                          )}
                        </div>

                        <div className="text-xs font-bold text-slate-500">
                          تاريخ التسجيل: {s.created_at ? new Date(s.created_at).toLocaleDateString('ar-EG') : 'غير محدد'}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl">
                        <div>صاحب المتجر: <strong className="text-slate-800">{s.owner_name}</strong></div>
                        <div>الهاتف: <strong className="text-slate-800 font-mono" dir="ltr">{s.phone}</strong></div>
                        <div>المبلغ المسدد: <strong className="text-emerald-600 font-bold">{s.amount_paid || 0} ج.م</strong></div>
                        <div>انتهاء الاشتراك: <strong className="text-amber-700 font-mono">{s.subscription_ends_at ? new Date(s.subscription_ends_at).toLocaleDateString('ar-EG') : 'لم يُفعّل'}</strong></div>
                      </div>

                      {/* أزرار التحكم الكامل في الحساب */}
                      <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                        
                        {/* 1. زر تفعيل / تجديد */}
                        <button
                          onClick={() => { setEditingSub(s); setPaymentAmount(s.amount_paid || ''); }}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition cursor-pointer flex items-center gap-1"
                        >
                          <span>🚀</span>
                          <span>{isActive ? 'تجديد الاشتراك' : 'تفعيل المتجر'}</span>
                        </button>

                        {/* 2. زر إيقاف مؤقت */}
                        <button
                          onClick={() => handleSuspendSubscriber(s)}
                          className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
                          title="تجميد المتجر مؤقتاً لحين مراجعة الحساب أو السداد"
                        >
                          <span>⏸️</span>
                          <span>إيقاف مؤقت</span>
                        </button>

                        {/* 3. زر تعطيل */}
                        <button
                          onClick={() => handleDeactivateSubscriber(s)}
                          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
                          title="تعطيل الحساب ومنعه من العمل"
                        >
                          <span>🛑</span>
                          <span>تعطيل الحساب</span>
                        </button>

                        {/* 4. زر حذف نهائي */}
                        <button
                          onClick={() => handleDeleteSubscriber(s)}
                          className="px-3.5 py-2 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
                          title="حذف الحساب نهائياً مع كافة منتجاته وطلباته"
                        >
                          <span>🗑️</span>
                          <span>حذف نهائي</span>
                        </button>

                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* 🌟 3. شاشة إعدادات المتجر وهوية اللوجو */}
        {activeScreen === 'store_branding' && (
          <form onSubmit={handleSaveSettings} className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6 max-w-3xl mx-auto">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-black text-slate-900">هوية وتفاصيل المنصة</h2>
              <p className="text-xs text-slate-500 mt-0.5">رفع الشعار، تعديل الاسم، الوصف، ومعلومات التواصل الرسمية</p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">لوجو المنصة الرسمي</label>
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border border-dashed border-slate-300 bg-slate-50/70 rounded-2xl">
                  <div className="w-20 h-20 rounded-2xl border border-slate-200 bg-white p-1.5 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                    {settings.store_logo ? (
                      <img src={settings.store_logo} alt="Store Logo" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-slate-400 text-3xl">🖼️️</span>
                    )}
                  </div>

                  <div className="space-y-2 flex-1 text-center sm:text-right">
                    <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow">
                      <span>📁</span>
                      <span>{uploadingLogo ? 'جاري رفع ومعالجة الصورة...' : 'اختيار صورة اللوجو من جهازك'}</span>
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
                <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم المنصة (Platform Name) *</label>
                <input
                  type="text"
                  required
                  value={settings.store_name}
                  onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                  placeholder="NEXT ORDER"
                  className="w-full border border-slate-200 rounded-2xl p-3.5 text-sm font-bold text-slate-900 focus:outline-emerald-500 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">وصف المنصة</label>
                <textarea
                  rows="3"
                  value={settings.store_description}
                  onChange={(e) => setSettings({ ...settings, store_description: e.target.value })}
                  placeholder="منظومة NEXT ORDER لإنشاء وإدارة المتاجر الإلكترونية السريعة..."
                  className="w-full border border-slate-200 rounded-2xl p-3.5 text-sm text-slate-900 focus:outline-emerald-500 bg-slate-50"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">واتساب الدعم الفني العام</label>
                  <input
                    type="tel"
                    dir="ltr"
                    value={settings.support_phone}
                    onChange={(e) => setSettings({ ...settings, support_phone: e.target.value })}
                    placeholder="01xxxxxxxxx"
                    className="w-full border border-slate-200 rounded-2xl p-3.5 text-sm font-mono text-slate-900 focus:outline-emerald-500 bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">نص الشريط الإعلاني العلوي</label>
                  <input
                    type="text"
                    value={settings.announcement_text}
                    onChange={(e) => setSettings({ ...settings, announcement_text: e.target.value })}
                    placeholder="🚚 شحن سريع ومجاني لجميع الطلبات اليوم مع NEXT ORDER!"
                    className="w-full border border-slate-200 rounded-2xl p-3.5 text-sm text-slate-900 focus:outline-emerald-500 bg-slate-50"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={savingSettings || uploadingLogo}
                className="px-8 py-3.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-black text-sm rounded-2xl shadow-lg transition duration-200 cursor-pointer disabled:opacity-50"
              >
                {savingSettings ? 'جاري الحفظ...' : 'حفظ التعديلات واللوجو 💾'}
              </button>
            </div>
          </form>
        )}

        {/* 🌟 4. شاشة الطلبات */}
        {activeScreen === 'orders' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between gap-3">
              <div>
                <h2 className="text-lg font-black">الطلبات الواردة في كافة المتاجر ({orders.length})</h2>
                <p className="text-xs text-slate-500">إدارة ومتابعة كافة الطلبات الصادرة من كل التجار</p>
              </div>
              <input
                type="text"
                placeholder="بحث بالاسم أو الهاتف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs p-2.5 rounded-xl w-60"
              />
            </div>

            <div className="space-y-3">
              {orders.map((o, idx) => (
                <div key={o.id} className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm space-y-2">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="font-black text-slate-900">طلب #{idx + 1} - {o.customer_name}</span>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl">{o.status || 'جديد'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600">
                    <div>الهاتف: <strong className="text-slate-900 font-mono" dir="ltr">{o.phone}</strong></div>
                    <div>العنوان: <strong className="text-slate-900">{o.governorate} - {o.address}</strong></div>
                    <div>المبلغ: <strong className="text-emerald-600 font-bold">{o.total_amount || o.total_price} ج.م</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 🌟 5. شاشة المنتجات */}
        {activeScreen === 'products' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex justify-between items-center">
              <div>
                <h2 className="text-lg font-black">المنتجات في المنصة ({products.length})</h2>
                <p className="text-xs text-slate-500">متابعة كافة منتجات المشتركين</p>
              </div>
              <button
                onClick={() => { setProductForm({ name: '', price: '', stock: 20, images: [] }); setShowProductModal(true); }}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                ➕ إضافة منتج عام
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {products.map((p) => (
                <div key={p.id} className="bg-white border border-slate-200 p-4 rounded-3xl shadow-sm space-y-3">
                  <div className="w-full h-40 bg-slate-100 rounded-2xl flex items-center justify-center overflow-hidden">
                    {p.images && p.images[0] ? <img src={p.images[0]} className="w-full h-full object-contain" /> : '📦'}
                  </div>
                  <h4 className="font-bold text-slate-900 line-clamp-1">{p.name}</h4>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-emerald-600 font-black">{p.price} ج.م</span>
                    <span className="text-slate-500">المخزون: {p.stock || 20}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 🌟 6. شاشة التحليلات الشاملة */}
        {activeScreen === 'analytics' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
              <span className="text-xs text-slate-500 block">إجمالي الزوار لكافة المتاجر</span>
              <span className="text-2xl font-black text-slate-900">{visitorsCount}</span>
            </div>
            <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
              <span className="text-xs text-slate-500 block">إجمالي الطلبات الكلية</span>
              <span className="text-2xl font-black text-emerald-600">{totalOrdersCount} طلب</span>
            </div>
            <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
              <span className="text-xs text-slate-500 block">متوسط قيمة الطلب</span>
              <span className="text-2xl font-black text-amber-500">{averageOrderValue} ج.م</span>
            </div>
            <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
              <span className="text-xs text-slate-500 block">معدل التحويل العام</span>
              <span className="text-2xl font-black text-indigo-600">{conversionRate}%</span>
            </div>
            <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm col-span-full">
              <span className="text-xs text-slate-500 block">إجمالي مبيعات المنصة</span>
              <span className="text-3xl font-black text-emerald-600">{totalRevenue.toLocaleString()} ج.م</span>
            </div>
          </div>
        )}

        {/* 🌟 7. شاشة بيكسلات فيسبوك (CAPI) */}
        {activeScreen === 'pixels' && (
          <form onSubmit={handleSaveSettings} className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-4">
            <h2 className="text-lg font-black border-b border-slate-100 pb-3">إعدادات البيكسلات العامة</h2>
            {[1, 2, 3, 4].map((num) => (
              <div key={num} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <span className="text-xs font-bold text-slate-700">بيكسل فيسبوك ({num})</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    dir="ltr"
                    value={settings[`pixel_${num}`]}
                    onChange={(e) => setSettings({ ...settings, [`pixel_${num}`]: e.target.value })}
                    placeholder={`Pixel ID ${num}`}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-mono"
                  />
                  <input
                    type="text"
                    dir="ltr"
                    value={settings[`token_${num}`]}
                    onChange={(e) => setSettings({ ...settings, [`token_${num}`]: e.target.value })}
                    placeholder={`API Token ${num}`}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-mono"
                  />
                </div>
              </div>
            ))}
            <button type="submit" disabled={savingSettings} className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow cursor-pointer">
              حفظ الإعدادات 💾
            </button>
          </form>
        )}

      </main>

      {/* نافذة تفعيل / تجديد المشتركين */}
      {editingSub && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-lg font-black border-b border-slate-100 pb-3">تفعيل / تجديد: {editingSub.store_name}</h3>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">المدة بالأشهر</label>
              <select value={durationMonths} onChange={(e) => setDurationMonths(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2.5 text-sm">
                <option value="1">شهر واحد (30 يوم)</option>
                <option value="3">3 أشهر</option>
                <option value="6">6 أشهر</option>
                <option value="12">سنة كاملة (12 شهر)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">المبلغ المحول للاشتراك (ج.م)</label>
              <input
                type="number"
                placeholder="500"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-sm font-bold"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button onClick={() => setEditingSub(null)} className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold cursor-pointer">إلغاء</button>
              <button onClick={() => handleActivateSubscriber(editingSub)} className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer">تأكيد التفعيل 🚀</button>
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
                  const payload = {
                    name: productForm.name,
                    price: Number(productForm.price),
                    stock: Number(productForm.stock) || 20,
                    images: newImageUrl ? [newImageUrl] : [],
                  };
                  await supabase.from('products').insert([payload]);
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
