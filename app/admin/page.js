'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // حالات التحديد المتعدد
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setOrders(data);
    }
    setLoading(false);
  }

  // فلترة الطلبات حسب البحث والحالة
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      (order.customer_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (order.phone || '').includes(search) ||
      (order.governorate || '').toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // دوال التحديد المتعدد
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = filteredOrders.map((o) => o.id);
      setSelectedOrderIds(allIds);
    } else {
      setSelectedOrderIds([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // حذف طلب واحد منفرد
  const handleDeleteSingle = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا الطلب نهائياً؟')) return;

    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (!error) {
      setOrders((prev) => prev.filter((o) => o.id !== id));
      setSelectedOrderIds((prev) => prev.filter((item) => item !== id));
    } else {
      alert('حدث خطأ أثناء الحذف: ' + error.message);
    }
  };

  // حذف جميع الطلبات المحددة دفعة واحدة
  const handleDeleteBulk = async () => {
    if (selectedOrderIds.length === 0) return;

    const count = selectedOrderIds.length;
    if (!confirm(`هل أنت متأكد من حذف ${count} طلب/طلبات محددة نهائياً؟`)) return;

    setIsDeletingBulk(true);
    const { error } = await supabase
      .from('orders')
      .delete()
      .in('id', selectedOrderIds);

    if (!error) {
      setOrders((prev) => prev.filter((o) => !selectedOrderIds.includes(o.id)));
      setSelectedOrderIds([]);
    } else {
      alert('حدث خطأ أثناء الحذف الجماعي: ' + error.message);
    }
    setIsDeletingBulk(false);
  };

  // تعديل حالة الطلب
  const handleStatusChange = async (id, newStatus) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', id);

    if (!error) {
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
      );
    }
  };

  const isAllSelected =
    filteredOrders.length > 0 && selectedOrderIds.length === filteredOrders.length;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-4 sm:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* الرأس */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">إدارة الطلبات</h1>
            <p className="text-sm text-slate-500 mt-1">
              إجمالي الطلبات المسجلة: <strong className="text-emerald-600 font-extrabold">{orders.length}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchOrders}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition flex items-center gap-2 border border-slate-200"
            >
              🔄 تحديث
            </button>
          </div>
        </div>

        {/* شريط البحث والفلترة */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="بحث بالاسم أو رقم الهاتف أو المحافظة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-600 focus:bg-white transition"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-emerald-600 cursor-pointer"
          >
            <option value="all">كل الحالات</option>
            <option value="جديد">جديد</option>
            <option value="تم التأكيد">تم التأكيد</option>
            <option value="تم الشحن">تم الشحن</option>
            <option value="تم التوصيل">تم التوصيل</option>
            <option value="ملغي">ملغي</option>
          </select>
        </div>

        {/* شريط التحكم العائم بالحذف المتعدد عند تحديد طلبات */}
        {selectedOrderIds.length > 0 && (
          <div className="bg-emerald-950 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center justify-between animate-fade-in border border-emerald-800">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-xs">
                {selectedOrderIds.length}
              </span>
              <span className="font-bold text-sm sm:text-base">طلبات محددة</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedOrderIds([])}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition"
              >
                إلغاء التحديد
              </button>
              <button
                onClick={handleDeleteBulk}
                disabled={isDeletingBulk}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow transition disabled:opacity-50 flex items-center gap-1.5"
              >
                🗑️ {isDeletingBulk ? 'جاري الحذف...' : `حذف المحدد (${selectedOrderIds.length})`}
              </button>
            </div>
          </div>
        )}

        {/* جدول الطلبات */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500 font-bold">جاري تحميل الطلبات...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-bold">لا توجد طلبات مطابقة</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-black uppercase">
                    <th className="p-4 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
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
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
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
                            className="text-xs font-bold p-1.5 rounded-lg border border-slate-200 bg-white cursor-pointer focus:outline-none"
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
                            onClick={() => handleDeleteSingle(order.id)}
                            className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition"
                            title="حذف هذا الطلب"
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
    </div>
  );
}
