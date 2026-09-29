'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function AdminPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const { data: sData } = await supabase.from('store_settings').select('*').eq('id', 1).maybeSingle();
      if (sData) setStoreSettings(sData);

      const { data: pData } = await supabase.from('products').select('*').order('created_at', { ascending: false }).limit(1);
      if (pData && pData.length > 0) setProduct(pData[0]);

      const { data: oData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (oData) setOrders(oData);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  const handleSave = async (e) => {
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
          images: product.images,
          video_url: product.video_url,
          show_colors: product.show_colors,
          colors: product.colors,
          show_sizes: product.show_sizes,
          sizes: product.sizes,
        }).eq('id', product.id);
      } else {
        const { data: newP } = await supabase.from('products').insert([product]).select().single();
        if (newP) setProduct(newP);
      }
      alert('تم حفظ البيانات بنجاح');
    } catch (err) {
      alert('خطأ أثناء الحفظ: ' + err.message);
    }
    setSaving(false);
  };

  const deleteOrder = async (id) => {
    if (!confirm('حذف هذا الطلب؟')) return;
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (!error) setOrders((prev) => prev.filter((o) => o.id !== id));
  };

  const updateStatus = async (id, status) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (!error) setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <p>جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <h1 className="text-2xl font-black">لوحة تحكم المتجر</h1>
          <button onClick={fetchData} className="px-4 py-2 bg-slate-800 rounded-xl text-sm">تحديث</button>
        </div>

        {/* إعدادات المتجر والمنتج */}
        <form onSubmit={handleSave} className="bg-slate-800 p-6 rounded-2xl space-y-4">
          <h2 className="text-lg font-bold text-emerald-400">بيانات المتجر والمنتج</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">اسم المتجر</label>
              <input
                type="text"
                value={storeSettings.store_name || ''}
                onChange={(e) => setStoreSettings({ ...storeSettings, store_name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">اسم المنتج</label>
              <input
                type="text"
                value={product.name || ''}
                onChange={(e) => setProduct({ ...product, name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">سعر البيع</label>
              <input
                type="number"
                value={product.price || ''}
                onChange={(e) => setProduct({ ...product, price: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded-xl text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">الوصف</label>
            <textarea
              rows="3"
              value={product.description || ''}
              onChange={(e) => setProduct({ ...product, description: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded-xl text-sm"
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 font-bold rounded-xl text-sm"
          >
            {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
          </button>
        </form>

        {/* جدول الطلبات */}
        <div className="bg-slate-800 p-6 rounded-2xl space-y-4">
          <h2 className="text-lg font-bold text-emerald-400">الطلبات المسجلة ({orders.length})</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 text-xs">
                  <th className="p-3">العميل</th>
                  <th className="p-3">الهاتف</th>
                  <th className="p-3">المحافظة / العنوان</th>
                  <th className="p-3">المبلغ</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3">حذف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="p-3 font-bold">{o.customer_name}</td>
                    <td className="p-3 font-mono">{o.phone}</td>
                    <td className="p-3 text-xs">{o.governorate} - {o.address}</td>
                    <td className="p-3 font-bold text-emerald-400">{o.total_amount || o.total_price} ج.م</td>
                    <td className="p-3">
                      <select
                        value={o.status || 'جديد'}
                        onChange={(e) => updateStatus(o.id, e.target.value)}
                        className="bg-slate-900 border border-slate-700 p-1 rounded-lg text-xs"
                      >
                        <option value="جديد">جديد</option>
                        <option value="تم التأكيد">تم التأكيد</option>
                        <option value="تم الشحن">تم الشحن</option>
                        <option value="تم التوصيل">تم التوصيل</option>
                        <option value="ملغي">ملغي</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <button onClick={() => deleteOrder(o.id)} className="text-red-400 text-xs">حذف</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
