'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function AppGridDashboard() {
  const [activeScreen, setActiveScreen] = useState('home');
  const [loading, setLoading] = useState(true);

  // بيانات المشتركين
  const [subscribers, setSubscribers] = useState([]);
  const [editingSub, setEditingSub] = useState(null);
  const [durationMonths, setDurationMonths] = useState(1);
  const [paymentAmount, setPaymentAmount] = useState('');

  // إعدادات المتجر وهوية اللوجو
  const [settings, setSettings] = useState({
    store_name: '',
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

  // الطلبات والمنتجات والتحليلات
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '', price: '', cost_price: '', stock: 20, images: [],
  });
  const [newImageUrl, setNewImageUrl] = useState('');

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);
    try {
      if (supabase) {
        const { data: subData } = await supabase.from('store_profiles').select('*').order('created_at', { ascending: false });
        if (subData) setSubscribers(subData);

        const { data: sData } = await supabase.from('store_settings').select('*').limit(1).maybeSingle();
        if (sData) {
          setSettings({
            store_name: sData.store_name || '',
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

  // 📤 دالة رفع ملف اللوجو مباشرة من الجهاز
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // التحقق من أن الملف صورة
    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار ملف صورة صالح (PNG, JPG, WEBP, SVG)');
      return;
    }

    setUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo_${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      // محاولة الرفع إلى Supabase Storage Bucket (store-assets)
      const { data, error } = await supabase.storage
        .from('store-assets')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (error) {
        // بديل تلقائي وفوري: تحويل الصورة لـ Base64 إذا لم يكن الـ Bucket مجهزاً
        const reader = new FileReader();
        reader.onloadend = () => {
          setSettings(prev => ({ ...prev, store_logo: reader.result }));
          setUploadingLogo(false);
          alert('✅ تم تجهيز الصورة بنجاح!');
        };
        reader.readAsDataURL(file);
        return;
      }

      // استخراج الرابط العام للصورة المرفوعة
      const { data: publicUrlData } = supabase.storage
        .from('store-assets')
        .getPublicUrl(filePath);

      if (publicUrlData?.publicUrl) {
        setSettings(prev => ({ ...prev, store_logo: publicUrlData.publicUrl }));
        alert('✅ تم رفع اللوجو بنجاح!');
      }
    } catch (err) {
      alert('حدث خطأ أثناء رفع الصورة: ' + err.message);
    }
    setUploadingLogo(false);
  };

  // حفظ بيانات وإعدادات المتجر
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

      alert('✅ تم حفظ إعدادات وهوية المتجر واللوجو بنجاح!');
    } catch (err) {
      alert('خطأ أثناء الحفظ: ' + err.message);
    }
    setSavingSettings(false);
  };

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
      alert(`✅ تم تفعيل متجر (${sub.store_name}) بنجاح!`);
      setEditingSub(null);
      loadAllData();
    }
  };

  const handleDeactivateSubscriber = async (id) => {
    if (!confirm('تعطيل هذا المتجر؟')) return;
    await supabase.from('store_profiles').update({ is_active: false }).eq('id', id);
    loadAllData();
  };

  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total_amount || o.total_price) || 0), 0);
  const totalOrdersCount = orders.length;
  const visitorsCount = analytics.filter(a => a.event_type === 'visit').length;
  const averageOrderValue = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;
  const conversionRate = visitorsCount > 0 ? ((totalOrdersCount / visitorsCount) * 100).toFixed(2) : '0.00';

  const gridCards = [
    {
      id: 'store_branding',
      title: 'إعدادات المتجر والهوية',
      desc: 'رفع لوجو المتجر، الاسم، الوصف، ورقم الدعم',
      icon: '⚙️',
      bgClass: 'bg-gradient-to-r from-amber-500 to-orange-600',
      badge: 'الهوية والتصميم',
    },
    {
      id: 'subscribers',
      title: 'المشتركين والعملاء',
      desc: 'إدارة المتاجر وتفعيل الاشتراكات وتحديد المبالغ',
      icon: '👥',
      bgClass: 'bg-gradient-to-r from-emerald-500 to-teal-600',
      badge: `${subscribers.length} مشترك`,
    },
    {
      id: 'orders',
      title: 'طلبات جديدة ومبيعات',
      desc: 'متابعة شحن وتأكيد الطلبات الواردة فوراً',
      icon: '📦',
      bgClass: 'bg-gradient-to-r from-blue-600 to-indigo-600',
      badge: `${orders.length} طلب`,
    },
    {
      id: 'products',
      title: 'منتجاتي والمخزون',
      desc: 'إضافة وتعديل المنتجات ومتابعة مخزون القطع',
      icon: '🛍️',
      bgClass: 'bg-gradient-to-r from-teal-500 to-emerald-600',
      badge: `${products.length} منتج`,
    },
    {
      id: 'analytics',
      title: 'التحليلات والمبيعات',
      desc: 'معدل التحويل ومتوسط قيمة الطلب وصافي الأرباح',
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
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                  {activeScreen === 'home' ? 'لوحة التحكم الرئيسية' : gridCards.find(c => c.id === activeScreen)?.title}
                </h1>
                <p className="text-xs text-slate-500">منظومة إدارة المتاجر والمبيعات والتحليلات</p>
              </div>
            </div>
          </div>

          <div className="text-xs font-bold text-slate-700 bg-slate-100 px-4 py-2 rounded-full border border-slate-200">
            {settings.store_name || 'LMAA STOR'}
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

        {/* 🌟 2. شاشة إعدادات المتجر وهوية اللوجو (مع رفع الصور من الجهاز) */}
        {activeScreen === 'store_branding' && (
          <form onSubmit={handleSaveSettings} className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6 max-w-3xl mx-auto">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-black text-slate-900">هوية وتفاصيل المتجر</h2>
              <p className="text-xs text-slate-500 mt-0.5">رفع لوجو المتجر، تعديل الاسم، والوصف، ومعلومات التواصل</p>
            </div>

            <div className="space-y-5">
              
              {/* قسم رفع لوجو المتجر كصورة من الجهاز */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">لوجو المتجر (شعار المتجر الرسمي)</label>
                
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border border-dashed border-slate-300 bg-slate-50/70 rounded-2xl">
                  {/* عرض معاينة الصورة الحالية */}
                  <div className="w-20 h-20 rounded-2xl border border-slate-200 bg-white p-1.5 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                    {settings.store_logo ? (
                      <img src={settings.store_logo} alt="Store Logo" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-slate-400 text-3xl">🖼️</span>
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
                      الصيغ المدعومة: PNG, JPG, WEBP, SVG (يُفضل صورة مربعة أو بخلفية شفافة).
                    </p>
                    {settings.store_logo && (
                      <button
                        type="button"
                        onClick={() => setSettings(prev => ({ ...prev, store_logo: '' }))}
                        className="text-red-500 hover:text-red-700 text-xs font-bold block"
                      >
                        🗑️ إزالة اللوجو الحالي
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* اسم المتجر */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم المتجر (Store Name) *</label>
                <input
                  type="text"
                  required
                  value={settings.store_name}
                  onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                  placeholder="مثال: لقطة ستور"
                  className="w-full border border-slate-200 rounded-2xl p-3.5 text-sm font-bold text-slate-900 focus:outline-emerald-500 bg-slate-50"
                />
              </div>

              {/* وصف المتجر */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">وصف المتجر (يظهر في الترويسة ومشاركات السوشيال ميديا)</label>
                <textarea
                  rows="3"
                  value={settings.store_description}
                  onChange={(e) => setSettings({ ...settings, store_description: e.target.value })}
                  placeholder="أفضل المنتجات بأسعار حصرية وضمان شامل وخدمة دفع عند الاستلام..."
                  className="w-full border border-slate-200 rounded-2xl p-3.5 text-sm text-slate-900 focus:outline-emerald-500 bg-slate-50"
                ></textarea>
              </div>

              {/* رقم هاتف الدعم والشريط الإعلاني */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">رقم خدمة العملاء / واتساب الدعم</label>
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
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">نص الشريط الإعلاني العلوي (اختياري)</label>
                  <input
                    type="text"
                    value={settings.announcement_text}
                    onChange={(e) => setSettings({ ...settings, announcement_text: e.target.value })}
                    placeholder="🚚 شحن مجاني لجميع المحافظات لفترة محدودة!"
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

        {/* 🌟 3. شاشة المشتركين والعملاء */}
        {activeScreen === 'subscribers' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex justify-between items-center">
              <div>
                <h2 className="text-lg font-black">المشتركين والمتاجر ({subscribers.length})</h2>
                <p className="text-xs text-slate-500">تفعيل المتجر فور تحويل المبلغ وتحديد عدد الأشهر</p>
              </div>
              <button onClick={loadAllData} className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold cursor-pointer">🔄 تحديث</button>
            </div>

            <div className="space-y-3">
              {subscribers.map((s) => {
                const isExpired = !s.subscription_ends_at || new Date(s.subscription_ends_at) < new Date();
                const isActive = s.is_active && !isExpired;

                return (
                  <div key={s.id} className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-lg">{s.store_name}</span>
                        <span className="text-xs text-slate-400 font-mono">({s.store_slug})</span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                          {isActive ? 'نشط ويعمل' : 'معطل / غير مفعل'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex flex-wrap gap-4 pt-1">
                        <span>المالك: <strong className="text-slate-800">{s.owner_name}</strong></span>
                        <span>الهاتف: <strong className="text-slate-800 font-mono" dir="ltr">{s.phone}</strong></span>
                        <span>المسدد: <strong className="text-emerald-600 font-bold">{s.amount_paid || 0} ج.م</strong></span>
                        <span>الانتهاء: <strong className="text-amber-600 font-mono">{s.subscription_ends_at ? new Date(s.subscription_ends_at).toLocaleDateString('ar-EG') : 'لم يفعل'}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setEditingSub(s); setPaymentAmount(s.amount_paid || ''); }}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition cursor-pointer"
                      >
                        تفعيل / تجديد المتجر 🚀
                      </button>
                      {isActive && (
                        <button onClick={() => handleDeactivateSubscriber(s.id)} className="px-3 py-2.5 bg-red-100 text-red-600 rounded-xl text-xs font-bold cursor-pointer">
                          إيقاف
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 🌟 4. شاشة الطلبات الجديدة */}
        {activeScreen === 'orders' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between gap-3">
              <div>
                <h2 className="text-lg font-black">الطلبات الواردة ({orders.length})</h2>
                <p className="text-xs text-slate-500">إدارة ومتابعة طلبات المتجر وتغيير الحالات</p>
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
                <h2 className="text-lg font-black">منتجاتي ومخزون القطع ({products.length})</h2>
                <p className="text-xs text-slate-500">إدارة كل منتج وتعديله ومتابعته</p>
              </div>
              <button
                onClick={() => { setEditingProduct(null); setShowProductModal(true); }}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                ➕ إضافة منتج
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
              <span className="text-xs text-slate-500 block">إجمالي الزوار</span>
              <span className="text-2xl font-black text-slate-900">{visitorsCount}</span>
            </div>
            <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
              <span className="text-xs text-slate-500 block">الطلبات المكتملة</span>
              <span className="text-2xl font-black text-emerald-600">{totalOrdersCount} طلب</span>
            </div>
            <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
              <span className="text-xs text-slate-500 block">متوسط سعر الطلب</span>
              <span className="text-2xl font-black text-amber-500">{averageOrderValue} ج.م</span>
            </div>
            <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
              <span className="text-xs text-slate-500 block">معدل التحويل</span>
              <span className="text-2xl font-black text-indigo-600">{conversionRate}%</span>
            </div>
            <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm col-span-full">
              <span className="text-xs text-slate-500 block">إجمالي المبيعات</span>
              <span className="text-3xl font-black text-emerald-600">{totalRevenue.toLocaleString()} ج.م</span>
            </div>
          </div>
        )}

        {/* 🌟 7. شاشة بيكسلات فيسبوك (CAPI) */}
        {activeScreen === 'pixels' && (
          <form onSubmit={handleSaveSettings} className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-4">
            <h2 className="text-lg font-black border-b border-slate-100 pb-3">إعدادات البيكسلات ورموز CAPI</h2>
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

      {/* نافذة تفعيل المشتركين */}
      {editingSub && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-lg font-black border-b border-slate-100 pb-3">تفعيل اشتراك: {editingSub.store_name}</h3>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">المدة بالأشهر</label>
              <select value={durationMonths} onChange={(e) => setDurationMonths(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2.5 text-sm">
                <option value="1">شهر واحد (30 يوم)</option>
                <option value="3">3 أشهر</option>
                <option value="6">6 أشهر</option>
                <option value="12">سنة كاملة</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">المبلغ المحول (ج.م)</label>
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

      {/* نافذة إضافة المنتجات */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-lg font-black border-b border-slate-100 pb-3">إضافة منتج جديد</h3>
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
