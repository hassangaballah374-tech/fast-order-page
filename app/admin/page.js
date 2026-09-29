'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function AdminPage() {
  // التبديل بين التبويبات: 'dashboard' (الداشبورد والمنتجات) أو 'orders' (الطلبات)
  const [activeTab, setActiveTab] = useState('dashboard');

  // بيانات المتجر والمنتج (الداشبورد)
  const [settings, setSettings] = useState({
    store_name: '',
    shipping_rates: { cairo_giza: 50, alex: 55, delta: 60, canal: 65, upper_egypt: 70, remote: 80 },
  });
  const [product, setProduct] = useState({
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
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newColorName, setNewColorName] = useState('');
  const [newColorCode, setNewColorCode] = useState('#000000');
  const [newSize, setNewSize] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveNotice, setSaveNotice] = useState(false);

  // بيانات الطلبات
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // حالات التحديد المتعدد
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  useEffect(() => {
    loadDashboardData();
    fetchOrders();
  }, []);

  // 1. جلب بيانات الداشبورد والمنتج
  async function loadDashboardData() {
    const { data: storeData } = await supabase.from('store_settings').select('*').eq('id', 1).single();
    if (storeData) {
      setSettings(storeData);
    }

    const { data: prodData } = await supabase.from('products').select('*').order('created_at', { ascending: false }).limit(1);
    if (prodData && prodData.length > 0) {
      setProduct(prodData[0]);
    }
  }

  // 2. جلب الطلبات
  async function fetchOrders() {
    setOrdersLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setOrders(data);
    }
    setOrdersLoading(false);
  }

  // حفظ تعديلات الداشبورد والمنتج
  const handleSaveDashboard = async (e) => {
    e.preventDefault();
    setSaveLoading(true);

    // حفظ إعدادات المتجر
    await supabase.from('store_settings').upsert({
      id: 1,
      store_name: settings.store_name,
      shipping_rates: settings.shipping_rates,
    });

    // حفظ المنتج
    if (product.id) {
      await supabase.from('products').update({
        name: product.name,
        price: Number(product.price),
        original_price: Number(product.original_price) || null,
        description: product.description,
        images: product.images,
        video_url: product.video_url,
        show_colors: product.show_colors,
        colors: product.colors,
        show_sizes: product.show_sizes,
        sizes: product.sizes,
      }).eq('id', product.id);
    } else {
      const { data: newProd } = await supabase.from('products').insert([
        {
          name: product.name,
          price: Number(product.price),
          original_price: Number(product.original_price) || null,
          description: product.description,
          images: product.images,
          video_url: product.video_url,
          show_colors: product.show_colors,
          colors: product.colors,
          show_sizes: product.show_sizes,
          sizes: product.sizes,
        }
      ]).select().single();
      if (newProd) setProduct(newProd);
    }

    setSaveLoading(false);
    setSaveNotice(true);
    setTimeout(() => setSaveNotice(false), 3000);
  };

  // دوال الصور والألوان والمقاسات
  const addImage = () => {
    if (!newImageUrl.trim()) return;
    setProduct((prev) => ({ ...prev, images: [...(prev.images || []), newImageUrl.trim()] }));
    setNewImageUrl('');
  };

  const removeImage = (idx) => {
    setProduct((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
  };

  const addColor = () => {
    if (!newColorName.trim()) return;
    setProduct((prev) => ({
      ...prev,
      colors: [...(prev.colors || []), { name: newColorName.trim(), code: newColorCode }],
    }));
    setNewColorName('');
  };

  const removeColor = (idx) => {
    setProduct((prev) => ({ ...prev, colors: prev.colors.filter((_, i) => i !== idx) }));
  };

  const addSize = () => {
    if (!newSize.trim()) return;
    setProduct((prev) => ({ ...prev, sizes: [...(prev.sizes || []), newSize.trim()] }));
    setNewSize('');
  };

  const removeSize = (idx) => {
    setProduct((prev) => ({ ...prev, sizes: prev.sizes.filter((_, i) => i !== idx) }));
  };

  // دوال إدارة الطلبات
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      (order.customer_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (order.phone || '').includes(search) ||
      (order.governorate || '').toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedOrderIds(filteredOrders.map((o) => o.id));
    } else {
      setSelectedOrderIds([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDeleteSingle = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا الطلب نهائياً؟')) return;
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (!error) {
      setOrders((prev) => prev.filter((o) => o.id !== id));
      setSelectedOrderIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const handleDeleteBulk = async () => {
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

  const handleStatusChange = async (id, newStatus) => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', id);
    if (!error) {
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)));
    }
  };

  const isAllSelected = filteredOrders.length > 0 && selectedOrderIds.length === filteredOrders.length;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-4 sm:p-8 font-sans" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* الشريط العلوي واختيار التبويب */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">لوحة تحكم المتجر</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">تحكم بالمنتج، الأسعار، وإدارة الطلبات</p>
          </div>

          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`px-5 py-2.5 rounded-xl font-black text-sm transition ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ⚙️ الداشبورد والمنتج
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`px-5 py-2.5 rounded-xl font-black text-sm transition flex items-center gap-2 ${
                activeTab === 'orders'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>📦 الطلبات</span>
              <span className="bg-slate-200 text-slate-800 text-xs px-2 py-0.5 rounded-full font-bold">
                {orders.length}
              </span>
            </button>
          </div>
        </div>

        {/* ----------------- 1. تبويب الداشبورد والمنتج ----------------- */}
        {activeTab === 'dashboard' && (
          <form onSubmit={handleSaveDashboard} className="space-y-6">
            {saveNotice && (
              <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl text-center font-bold">
                ✅ تم حفظ جميع التعديلات بنجاح وتحديث المتجر!
              </div>
            )}

            {/* إعدادات المتجر العامة */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
              <h2 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3">🏪 إعدادات المتجر</h2>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">اسم المتجر</label>
                <input
                  type="text"
                  value={settings.store_name || ''}
                  onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                  placeholder="مثال: لَمْعَة ستور"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            {/* بيانات المنتج المعروض */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
              <h2 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3">📦 بيانات المنتج</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">اسم المنتج</label>
                  <input
                    type="text"
                    required
                    value={product.name || ''}
                    onChange={(e) => setProduct({ ...product, name: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">سعر البيع (ج.م)</label>
                  <input
                    type="number"
                    required
                    value={product.price || ''}
                    onChange={(e) => setProduct({ ...product, price: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">السعر الأصلي قبل الخصم</label>
                  <input
                    type="number"
                    value={product.original_price || ''}
                    onChange={(e) => setProduct({ ...product, original_price: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">وصف ومميزات المنتج</label>
                <textarea
                  rows="3"
                  value={product.description || ''}
                  onChange={(e) => setProduct({ ...product, description: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                ></textarea>
              </div>

              {/* معرض الصور */}
              <div className="space-y-3 pt-2">
                <label className="block text-sm font-bold text-slate-700">صور المنتج (روابط مباشرة)</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="ضع رابط الصورة هنا..."
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                  <button
                    type="button"
                    onClick={addImage}
                    className="px-5 py-3 bg-slate-800 text-white font-bold rounded-xl text-sm hover:bg-slate-900"
                  >
                    + إضافة صورة
                  </button>
                </div>
                <div className="flex flex-wrap gap-3 pt-2">
                  {product.images?.map((img, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 left-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* الألوان */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="show_colors"
                    checked={product.show_colors || false}
                    onChange={(e) => setProduct({ ...product, show_colors: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600"
                  />
                  <label htmlFor="show_colors" className="text-sm font-bold text-slate-700 cursor-pointer">
                    تفعيل خيارات الألوان للمنتج
                  </label>
                </div>

                {product.show_colors && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="اسم اللون (مثال: أسود، أزرق)"
                        value={newColorName}
                        onChange={(e) => setNewColorName(e.target.value)}
                        className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                      />
                      <input
                        type="color"
                        value={newColorCode}
                        onChange={(e) => setNewColorCode(e.target.value)}
                        className="w-12 h-10 p-1 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={addColor}
                        className="px-4 py-2 bg-slate-700 text-white text-xs font-bold rounded-xl"
                      >
                        إضافة لون
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {product.colors?.map((c, idx) => (
                        <span key={idx} className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold">
                          <span className="w-3 h-3 rounded-full border" style={{ backgroundColor: c.code }}></span>
                          <span>{c.name}</span>
                          <button type="button" onClick={() => removeColor(idx)} className="text-red-500 font-bold ml-1">✕</button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* المقاسات */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="show_sizes"
                    checked={product.show_sizes || false}
                    onChange={(e) => setProduct({ ...product, show_sizes: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600"
                  />
                  <label htmlFor="show_sizes" className="text-sm font-bold text-slate-700 cursor-pointer">
                    تفعيل خيارات المقاسات للمنتج
                  </label>
                </div>

                {product.show_sizes && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="المقاس (مثال: XL, L, 42)"
                        value={newSize}
                        onChange={(e) => setNewSize(e.target.value)}
                        className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                      />
                      <button
                        type="button"
                        onClick={addSize}
                        className="px-4 py-2 bg-slate-700 text-white text-xs font-bold rounded-xl"
                      >
                        إضافة مقاس
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {product.sizes?.map((s, idx) => (
                        <span key={idx} className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold">
                          <span>{s}</span>
                          <button type="button" onClick={() => removeSize(idx)} className="text-red-500 font-bold ml-1">✕</button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* زر الحفظ العائم */}
            <div className="sticky bottom-4 z-20">
              <button
                type="submit"
                disabled={saveLoading}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg rounded-2xl shadow-xl transition disabled:opacity-50"
              >
                {saveLoading ? 'جاري حفظ التعديلات...' : '💾 حفظ جميع التعديلات في المتجر'}
              </button>
            </div>
          </form>
        )}

        {/* ----------------- 2. تبويب إدارة الطلبات ----------------- */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {/* شريط البحث والفلترة */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="بحث بالاسم أو رقم الهاتف أو المحافظة..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-600"
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 cursor-pointer"
              >
                <option value="all">كل الحالات</option>
                <option value="جديد">جديد</option>
                <option value="تم التأكيد">تم التأكيد</option>
                <option value="تم الشحن">تم الشحن</option>
                <option value="تم التوصيل">تم التوصيل</option>
                <option value="ملغي">ملغي</option>
              </select>

              <button
                type="button"
                onClick={fetchOrders}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm"
              >
                🔄 تحديث
              </button>
            </div>

            {/* شريط الحذف الجماعي العائم */}
            {selectedOrderIds.length > 0 && (
              <div className="bg-emerald-950 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center justify-between border border-emerald-800">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-xs">
                    {selectedOrderIds.length}
                  </span>
                  <span className="font-bold text-sm sm:text-base">طلبات محددة</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedOrderIds([])}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold"
                  >
                    إلغاء التحديد
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteBulk}
                    disabled={isDeletingBulk}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow disabled:opacity-50 flex items-center gap-1.5"
                  >
                    🗑️ {isDeletingBulk ? 'جاري الحذف...' : `حذف المحدد (${selectedOrderIds.length})`}
                  </button>
                </div>
              </div>
            )}

            {/* جدول الطلبات */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              {ordersLoading ? (
                <div className="p-12 text-center text-slate-500 font-bold">جاري تحميل الطلبات...</div>
              ) : filteredOrders.length === 0 ? (
                <div className="p-12 text-center text-slate-400 font-bold">لا توجد طلبات مطابقة</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-black">
                        <th className="p-4 w-12 text-center">
                          <input
                            type="checkbox"
                            checked={isAllSelected}
                            onChange={handleSelectAll}
                            className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                            title="تحديد الكل"
                          />
                        </th>
                        <th className="p-4">العميل</th>
                        <th className="p-4">الهاتف</th>
                        <th className="p-4">المحافظة / العنوان</th>
                        <th className="p-4">تفاصيل الطلب</th>
                        <th className="p-4">المبلغ</th>
                        <th className="p-4">الحالة</th>
                        <th className="p-4">التاريخ</th>
                        <th className="p-4 text-center">إجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {filteredOrders.map((order) => {
                        const isSelected = selectedOrderIds.includes(order.id);
                        return (
                          <tr
                            key={order.id}
                            className={`transition hover:bg-slate-50/80 ${
                              isSelected ? 'bg-emerald-50/60' : ''
                            }`}
                          >
                            <td className="p-4 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleSelectRow(order.id)}
                                className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                              />
                            </td>
                            <td className="p-4 font-bold text-slate-900">{order.customer_name}</td>
                            <td className="p-4 font-semibold text-slate-700" dir="ltr">
                              {order.phone}
                            </td>
                            <td className="p-4 text-slate-600 text-xs max-w-xs truncate" title={order.address}>
                              <span className="font-bold text-slate-800">{order.governorate}</span> - {order.address}
                            </td>
                            <td className="p-4 text-xs font-medium text-slate-700 max-w-xs">
                              <div className="line-clamp-2">{order.product_name}</div>
                              {(order.selected_color || order.selected_size) && (
                                <div className="text-[11px] text-slate-500 mt-0.5">
                                  {order.selected_color !== '-' && `اللون: ${order.selected_color} `}
                                  {order.selected_size !== '-' && `المقاس: ${order.selected_size}`}
                                </div>
                              )}
                            </td>
                            <td className="p-4 font-black text-emerald-600">
                              {order.total_amount || order.total_price} ج.م
                            </td>
                            <td className="p-4">
                              <select
                                value={order.status || 'جديد'}
                                onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                className="text-xs font-bold p-1.5 rounded-lg border border-slate-200 bg-white cursor-pointer"
                              >
                                <option value="جديد">جديد</option>
                                <option value="تم التأكيد">تم التأكيد</option>
                                <option value="تم الشحن">تم الشحن</option>
                                <option value="تم التوصيل">تم التوصيل</option>
                                <option value="ملغي">ملغي</option>
                              </select>
                            </td>
                            <td className="p-4 text-xs text-slate-400">
                              {new Date(order.created_at).toLocaleDateString('ar-EG', {
                                month: 'numeric',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="p-4 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteSingle(order.id)}
                                className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition"
                                title="حذف الطلب"
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

      </div>
    </div>
  );
}
