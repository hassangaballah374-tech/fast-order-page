'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'product' | 'settings'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // إعدادات المتجر
  const [storeSettings, setStoreSettings] = useState({
    store_name: '',
    shipping_rates: {
      cairo_giza: 50,
      alex: 55,
      delta: 60,
      canal: 65,
      upper_egypt: 70,
      remote: 80,
    },
  });

  // بيانات المنتج
  const [product, setProduct] = useState({
    id: null,
    name: '',
    price: '',
    original_price: '',
    description: '',
    images: [],
    video_url: '',
    show_colors: false,
    colors: [],
    show_sizes: false,
    sizes: [],
  });

  const [newImage, setNewImage] = useState('');
  const [colorInput, setColorInput] = useState({ name: '', code: '#000000' });
  const [sizeInput, setSizeInput] = useState('');

  // الطلبات
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // التحديد المتعدد للطلبات
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);
    try {
      // 1. جلب إعدادات المتجر
      const { data: sData } = await supabase.from('store_settings').select('*').eq('id', 1).maybeSingle();
      if (sData) {
        setStoreSettings({
          store_name: sData.store_name || '',
          shipping_rates: sData.shipping_rates || {
            cairo_giza: 50,
            alex: 55,
            delta: 60,
            canal: 65,
            upper_egypt: 70,
            remote: 80,
          },
        });
      }

      // 2. جلب المنتج
      const { data: pData } = await supabase.from('products').select('*').order('created_at', { ascending: false }).limit(1);
      if (pData && pData.length > 0) {
        setProduct(pData[0]);
      }

      // 3. جلب الطلبات
      const { data: oData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (oData) {
        setOrders(oData);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  // حفظ الإعدادات والمنتج
  async function handleSaveSettings(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await supabase.from('store_settings').upsert({
        id: 1,
        store_name: storeSettings.store_name,
        shipping_rates: storeSettings.shipping_rates,
      });

      if (product.id) {
        await supabase.from('products').update({
          name: product.name,
          price: Number(product.price),
          original_price: Number(product.original_price) || null,
          description: product.description,
          images: product.images || [],
          video_url: product.video_url || '',
          show_colors: Boolean(product.show_colors),
          colors: product.colors || [],
          show_sizes: Boolean(product.show_sizes),
          sizes: product.sizes || [],
        }).eq('id', product.id);
      } else {
        const { data: newP } = await supabase.from('products').insert([{
          name: product.name,
          price: Number(product.price),
          original_price: Number(product.original_price) || null,
          description: product.description,
          images: product.images || [],
          video_url: product.video_url || '',
          show_colors: Boolean(product.show_colors),
          colors: product.colors || [],
          show_sizes: Boolean(product.show_sizes),
          sizes: product.sizes || [],
        }]).select().single();
        if (newP) setProduct(newP);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert('خطأ أثناء الحفظ: ' + err.message);
    }
    setSaving(false);
  }

  // إدارة صور وألوان المنتج
  const handleAddImage = () => {
    if (!newImage.trim()) return;
    setProduct((prev) => ({ ...prev, images: [...(prev.images || []), newImage.trim()] }));
    setNewImage('');
  };

  const handleRemoveImage = (index) => {
    setProduct((prev) => ({ ...prev, images: (prev.images || []).filter((_, i) => i !== index) }));
  };

  const handleAddColor = () => {
    if (!colorInput.name.trim()) return;
    setProduct((prev) => ({
      ...prev,
      colors: [...(prev.colors || []), { name: colorInput.name.trim(), code: colorInput.code }],
    }));
    setColorInput({ name: '', code: '#000000' });
  };

  const handleRemoveColor = (index) => {
    setProduct((prev) => ({ ...prev, colors: (prev.colors || []).filter((_, i) => i !== index) }));
  };

  const handleAddSize = () => {
    if (!sizeInput.trim()) return;
    setProduct((prev) => ({ ...prev, sizes: [...(prev.sizes || []), sizeInput.trim()] }));
    setSizeInput('');
  };

  const handleRemoveSize = (index) => {
    setProduct((prev) => ({ ...prev, sizes: (prev.sizes || []).filter((_, i) => i !== index) }));
  };

  // دوال الطلبات
  const filteredOrders = orders.filter((o) => {
    const matchSearch =
      (o.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.phone || '').includes(searchTerm) ||
      (o.governorate || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedOrderIds(filteredOrders.map((o) => o.id));
    } else {
      setSelectedOrderIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleDeleteSingleOrder = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا الطلب نهائياً؟')) return;
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (!error) {
      setOrders((prev) => prev.filter((o) => o.id !== id));
      setSelectedOrderIds((prev) => prev.filter((i) => i !== id));
    }
  };

  const handleDeleteBulkOrders = async () => {
    if (selectedOrderIds.length === 0) return;
    if (!confirm(`هل أنت متأكد من حذف ${selectedOrderIds.length} طلبات محددة؟`)) return;

    setIsDeletingBulk(true);
    const { error } = await supabase.from('orders').delete().in('id', selectedOrderIds);
    if (!error) {
      setOrders((prev) => prev.filter((o) => !selectedOrderIds.includes(o.id)));
      setSelectedOrderIds([]);
    }
    setIsDeletingBulk(false);
  };

  const handleUpdateStatus = async (id, status) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (!error) {
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    }
  };

  // إحصائيات سريعة
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total_amount || o.total_price) || 0), 0);
  const newOrdersCount = orders.filter((o) => (o.status || 'جديد') === 'جديد').length;
  const isAllSelected = filteredOrders.length > 0 && selectedOrderIds.length === filteredOrders.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center font-sans" dir="rtl">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-bold">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans pb-16" dir="rtl">
      
      {/* الشريط العلوي الأصلي */}
      <header className="bg-[#1e293b]/80 backdrop-blur border-b border-slate-700/80 sticky top-0 z-30 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white">{storeSettings.store_name || 'لوحة التحكم'}</h1>
              <p className="text-xs text-slate-400">إدارة المتجر والمنتجات والطلبات</p>
            </div>
          </div>

          {/* التبويبات بالترتيب الأصلي */}
          <div className="flex items-center bg-[#0f172a] p-1.5 rounded-2xl border border-slate-700/70">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                activeTab === 'orders' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>📦 الطلبات</span>
              <span className="bg-[#1e293b] text-emerald-400 text-xs px-2 py-0.5 rounded-full font-black">
                {orders.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('product')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                activeTab === 'product' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              🛍️ بيانات المنتج
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                activeTab === 'settings' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              ⚙️ إعدادات المتجر
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-8 space-y-6">

        {/* بطاقات الإحصائيات العلوية */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#1e293b] p-5 rounded-3xl border border-slate-700/60 shadow-lg">
            <div className="text-slate-400 text-xs font-bold mb-1">إجمالي المبيعات</div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400">{totalRevenue.toLocaleString()} ج.م</div>
          </div>
          <div className="bg-[#1e293b] p-5 rounded-3xl border border-slate-700/60 shadow-lg">
            <div className="text-slate-400 text-xs font-bold mb-1">إجمالي عدد الطلبات</div>
            <div className="text-2xl sm:text-3xl font-black text-white">{orders.length} طلب</div>
          </div>
          <div className="bg-[#1e293b] p-5 rounded-3xl border border-slate-700/60 shadow-lg">
            <div className="text-slate-400 text-xs font-bold mb-1">طلبات جديدة في الانتظار</div>
            <div className="text-2xl sm:text-3xl font-black text-amber-400">{newOrdersCount} طلب</div>
          </div>
        </div>

        {/* 1. تبويب الطلبات (مع ميزة التحديد المتعدد الجديدة) */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {/* شريط البحث والفلترة */}
            <div className="bg-[#1e293b] p-4 rounded-3xl border border-slate-700/60 flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="ابحث باسم العميل أو رقم هاتفه أو المحافظة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-[#0f172a] border border-slate-700 text-white rounded-2xl p-3 text-sm focus:outline-none focus:border-emerald-500"
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-[#0f172a] border border-slate-700 text-slate-200 rounded-2xl p-3 text-sm font-bold cursor-pointer"
              >
                <option value="all">كل الحالات</option>
                <option value="جديد">جديد</option>
                <option value="تم التأكيد">تم التأكيد</option>
                <option value="تم الشحن">تم الشحن</option>
                <option value="تم التوصيل">تم التوصيل</option>
                <option value="ملغي">ملغي</option>
              </select>
              <button
                onClick={loadAllData}
                className="px-5 py-3 bg-[#0f172a] hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-2xl text-sm font-bold transition"
              >
                🔄 تحديث
              </button>
            </div>

            {/* شريط الحذف الجماعي العائم عند تحديد طلبات */}
            {selectedOrderIds.length > 0 && (
              <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between animate-fade-in">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-white text-emerald-800 flex items-center justify-center font-black text-xs">
                    {selectedOrderIds.length}
                  </span>
                  <span className="font-bold text-sm sm:text-base">طلبات محددة</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedOrderIds([])}
                    className="px-3 py-1.5 bg-black/20 hover:bg-black/30 rounded-xl text-xs font-bold transition"
                  >
                    إلغاء التحديد
                  </button>
                  <button
                    onClick={handleDeleteBulkOrders}
                    disabled={isDeletingBulk}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    🗑️ {isDeletingBulk ? 'جاري الحذف...' : `حذف المحدد (${selectedOrderIds.length})`}
                  </button>
                </div>
              </div>
            )}

            {/* جدول الطلبات */}
            <div className="bg-[#1e293b] rounded-3xl border border-slate-700/60 overflow-hidden shadow-xl">
              {filteredOrders.length === 0 ? (
                <div className="p-12 text-center text-slate-400 font-bold">لا توجد طلبات مطابقة للبحث</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-[#0f172a]/60 border-b border-slate-700 text-slate-400 text-xs font-bold uppercase">
                        <th className="p-4 w-12 text-center">
                          <input
                            type="checkbox"
                            checked={isAllSelected}
                            onChange={handleSelectAll}
                            className="w-4 h-4 rounded text-emerald-600 bg-[#0f172a] border-slate-700 cursor-pointer"
                            title="تحديد الكل"
                          />
                        </th>
                        <th className="p-4">العميل</th>
                        <th className="p-4">الهاتف</th>
                        <th className="p-4">المحافظة والعنوان</th>
                        <th className="p-4">المنتجات</th>
                        <th className="p-4">المبلغ</th>
                        <th className="p-4">الحالة</th>
                        <th className="p-4">التاريخ</th>
                        <th className="p-4 text-center">حذف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-sm">
                      {filteredOrders.map((order) => {
                        const isSelected = selectedOrderIds.includes(order.id);
                        return (
                          <tr
                            key={order.id}
                            className={`transition hover:bg-slate-800/50 ${
                              isSelected ? 'bg-emerald-950/40' : ''
                            }`}
                          >
                            <td className="p-4 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleSelectOne(order.id)}
                                className="w-4 h-4 rounded text-emerald-600 bg-[#0f172a] border-slate-700 cursor-pointer"
                              />
                            </td>
                            <td className="p-4 font-bold text-white">{order.customer_name}</td>
                            <td className="p-4 font-mono text-emerald-400" dir="ltr">
                              {order.phone}
                            </td>
                            <td className="p-4 text-xs text-slate-300 max-w-xs truncate" title={order.address}>
                              <span className="font-bold text-white">{order.governorate}</span> - {order.address}
                            </td>
                            <td className="p-4 text-xs text-slate-300 max-w-xs">
                              <div className="font-medium text-white">{order.product_name}</div>
                              {(order.selected_color || order.selected_size) && (
                                <div className="text-[11px] text-slate-400 mt-0.5">
                                  {order.selected_color && order.selected_color !== '-' && `اللون: ${order.selected_color} `}
                                  {order.selected_size && order.selected_size !== '-' && `المقاس: ${order.selected_size}`}
                                </div>
                              )}
                            </td>
                            <td className="p-4 font-black text-emerald-400">
                              {order.total_amount || order.total_price} ج.م
                            </td>
                            <td className="p-4">
                              <select
                                value={order.status || 'جديد'}
                                onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                                className="bg-[#0f172a] border border-slate-700 text-xs font-bold rounded-xl p-2 text-white cursor-pointer focus:outline-none"
                              >
                                <option value="جديد">جديد</option>
                                <option value="تم التأكيد">تم التأكيد</option>
                                <option value="تم الشحن">تم الشحن</option>
                                <option value="تم التوصيل">تم التوصيل</option>
                                <option value="ملغي">ملغي</option>
                              </select>
                            </td>
                            <td className="p-4 text-xs text-slate-400 font-mono">
                              {new Date(order.created_at).toLocaleDateString('ar-EG', {
                                month: 'numeric',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => handleDeleteSingleOrder(order.id)}
                                className="p-2 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-xl transition"
                                title="حذف"
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. تبويب بيانات المنتج (بتصميمه الأصلي القديم) */}
        {activeTab === 'product' && (
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="bg-[#1e293b] p-6 sm:p-8 rounded-3xl border border-slate-700/60 shadow-xl space-y-6">
              <h2 className="text-xl font-black text-white border-b border-slate-700 pb-4">🛍️ تعديل بيانات المنتج المعروض</h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-400 mb-2">اسم المنتج</label>
                  <input
                    type="text"
                    required
                    value={product.name || ''}
                    onChange={(e) => setProduct({ ...product, name: e.target.value })}
                    className="w-full bg-[#0f172a] border border-slate-700 rounded-2xl p-3.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">سعر البيع (ج.م)</label>
                  <input
                    type="number"
                    required
                    value={product.price || ''}
                    onChange={(e) => setProduct({ ...product, price: e.target.value })}
                    className="w-full bg-[#0f172a] border border-slate-700 rounded-2xl p-3.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">السعر الأصلي (قبل الخصم)</label>
                  <input
                    type="number"
                    value={product.original_price || ''}
                    onChange={(e) => setProduct({ ...product, original_price: e.target.value })}
                    className="w-full bg-[#0f172a] border border-slate-700 rounded-2xl p-3.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">وصف ومميزات المنتج</label>
                <textarea
                  rows="4"
                  value={product.description || ''}
                  onChange={(e) => setProduct({ ...product, description: e.target.value })}
                  className="w-full bg-[#0f172a] border border-slate-700 rounded-2xl p-3.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                ></textarea>
              </div>

              {/* صور المنتج */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold text-slate-400">معرض صور المنتج (روابط مباشرة)</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="ضع رابط الصورة هنا..."
                    value={newImage}
                    onChange={(e) => setNewImage(e.target.value)}
                    className="flex-1 bg-[#0f172a] border border-slate-700 rounded-2xl p-3 text-white text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleAddImage}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-sm"
                  >
                    + إضافة صورة
                  </button>
                </div>
                <div className="flex flex-wrap gap-3 pt-2">
                  {product.images?.map((img, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-2xl overflow-hidden border border-slate-700 bg-black">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 left-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* الألوان */}
              <div className="pt-4 border-t border-slate-700/60 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="show_colors"
                    checked={product.show_colors || false}
                    onChange={(e) => setProduct({ ...product, show_colors: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                  />
                  <label htmlFor="show_colors" className="text-sm font-bold text-white cursor-pointer">
                    تفعيل خيارات الألوان
                  </label>
                </div>

                {product.show_colors && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="اسم اللون (مثال: أسود، أزرق)"
                        value={colorInput.name}
                        onChange={(e) => setColorInput({ ...colorInput, name: e.target.value })}
                        className="flex-1 bg-[#0f172a] border border-slate-700 rounded-2xl p-2.5 text-white text-sm"
                      />
                      <input
                        type="color"
                        value={colorInput.code}
                        onChange={(e) => setColorInput({ ...colorInput, code: e.target.value })}
                        className="w-12 h-11 p-1 bg-[#0f172a] border border-slate-700 rounded-2xl cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={handleAddColor}
                        className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-2xl border border-slate-700"
                      >
                        إضافة لون
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {product.colors?.map((c, idx) => (
                        <span key={idx} className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#0f172a] border border-slate-700 rounded-xl text-xs font-bold text-white">
                          <span className="w-3.5 h-3.5 rounded-full border border-slate-600" style={{ backgroundColor: c.code }}></span>
                          <span>{c.name}</span>
                          <button type="button" onClick={() => handleRemoveColor(idx)} className="text-red-400 font-bold ml-1">✕</button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* المقاسات */}
              <div className="pt-4 border-t border-slate-700/60 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="show_sizes"
                    checked={product.show_sizes || false}
                    onChange={(e) => setProduct({ ...product, show_sizes: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                  />
                  <label htmlFor="show_sizes" className="text-sm font-bold text-white cursor-pointer">
                    تفعيل خيارات المقاسات
                  </label>
                </div>

                {product.show_sizes && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="المقاس (مثال: M, L, XL, 42)"
                        value={sizeInput}
                        onChange={(e) => setSizeInput(e.target.value)}
                        className="flex-1 bg-[#0f172a] border border-slate-700 rounded-2xl p-2.5 text-white text-sm"
                      />
                      <button
                        type="button"
                        onClick={handleAddSize}
                        className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-2xl border border-slate-700"
                      >
                        إضافة مقاس
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes?.map((s, idx) => (
                        <span key={idx} className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#0f172a] border border-slate-700 rounded-xl text-xs font-bold text-white">
                          <span>{s}</span>
                          <button type="button" onClick={() => handleRemoveSize(idx)} className="text-red-400 font-bold ml-1">✕</button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg rounded-2xl shadow-xl transition disabled:opacity-50"
              >
                {saving ? 'جاري الحفظ...' : '💾 حفظ بيانات المنتج'}
              </button>
            </div>
          </form>
        )}

        {/* 3. تبويب إعدادات المتجر والشحن (الأصلي) */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="bg-[#1e293b] p-6 sm:p-8 rounded-3xl border border-slate-700/60 shadow-xl space-y-6">
              <h2 className="text-xl font-black text-white border-b border-slate-700 pb-4">⚙️ إعدادات المتجر وأسعار الشحن</h2>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">اسم المتجر</label>
                <input
                  type="text"
                  value={storeSettings.store_name}
                  onChange={(e) => setStoreSettings({ ...storeSettings, store_name: e.target.value })}
                  className="w-full bg-[#0f172a] border border-slate-700 rounded-2xl p-3.5 text-white text-sm"
                />
              </div>

              <div className="pt-4 border-t border-slate-700/60 space-y-4">
                <h3 className="text-sm font-bold text-emerald-400">🚚 تسعير الشحن حسب المناطق (ج.م)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1 font-bold">القاهرة والجيزة</label>
                    <input
                      type="number"
                      value={storeSettings.shipping_rates?.cairo_giza ?? 50}
                      onChange={(e) => setStoreSettings({
                        ...storeSettings,
                        shipping_rates: { ...storeSettings.shipping_rates, cairo_giza: Number(e.target.value) }
                      })}
                      className="w-full bg-[#0f172a] border border-slate-700 rounded-xl p-3 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1 font-bold">الإسكندرية</label>
                    <input
                      type="number"
                      value={storeSettings.shipping_rates?.alex ?? 55}
                      onChange={(e) => setStoreSettings({
                        ...storeSettings,
                        shipping_rates: { ...storeSettings.shipping_rates, alex: Number(e.target.value) }
                      })}
                      className="w-full bg-[#0f172a] border border-slate-700 rounded-xl p-3 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1 font-bold">محافظات الدلتا</label>
                    <input
                      type="number"
                      value={storeSettings.shipping_rates?.delta ?? 60}
                      onChange={(e) => setStoreSettings({
                        ...storeSettings,
                        shipping_rates: { ...storeSettings.shipping_rates, delta: Number(e.target.value) }
                      })}
                      className="w-full bg-[#0f172a] border border-slate-700 rounded-xl p-3 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1 font-bold">مدن القناة</label>
                    <input
                      type="number"
                      value={storeSettings.shipping_rates?.canal ?? 65}
                      onChange={(e) => setStoreSettings({
                        ...storeSettings,
                        shipping_rates: { ...storeSettings.shipping_rates, canal: Number(e.target.value) }
                      })}
                      className="w-full bg-[#0f172a] border border-slate-700 rounded-xl p-3 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1 font-bold">محافظات الصعيد</label>
                    <input
                      type="number"
                      value={storeSettings.shipping_rates?.upper_egypt ?? 70}
                      onChange={(e) => setStoreSettings({
                        ...storeSettings,
                        shipping_rates: { ...storeSettings.shipping_rates, upper_egypt: Number(e.target.value) }
                      })}
                      className="w-full bg-[#0f172a] border border-slate-700 rounded-xl p-3 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1 font-bold">المناطق الحدودية والنائية</label>
                    <input
                      type="number"
                      value={storeSettings.shipping_rates?.remote ?? 80}
                      onChange={(e) => setStoreSettings({
                        ...storeSettings,
                        shipping_rates: { ...storeSettings.shipping_rates, remote: Number(e.target.value) }
                      })}
                      className="w-full bg-[#0f172a] border border-slate-700 rounded-xl p-3 text-white text-sm"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg rounded-2xl shadow-xl transition disabled:opacity-50"
              >
                {saving ? 'جاري الحفظ...' : '💾 حفظ إعدادات المتجر والشحن'}
              </button>
            </div>
          </form>
        )}

      </main>
    </div>
  );
}
