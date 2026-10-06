'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function SuperAdminPage() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingStore, setEditingStore] = useState(null);
  const [durationMonths, setDurationMonths] = useState(1);
  const [paymentAmount, setPaymentAmount] = useState('');

  useEffect(() => {
    loadStores();
  }, []);

  async function loadStores() {
    setLoading(true);
    const { data, error } = await supabase.from('store_profiles').select('*').order('created_at', { ascending: false });
    if (!error && data) setStores(data);
    setLoading(false);
  }

  const handleActivate = async (store) => {
    const months = parseInt(durationMonths) || 1;
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + months);

    const payload = {
      is_active: true,
      subscription_ends_at: expiry.toISOString(),
      amount_paid: Number(paymentAmount) || Number(store.amount_paid) || 0,
    };

    const { error } = await supabase.from('store_profiles').update(payload).eq('id', store.id);
    if (!error) {
      alert(`✅ تم تفعيل متجر ${store.store_name} لمدة ${months} شهر بنجاح!`);
      setEditingStore(null);
      loadStores();
    } else {
      alert('خطأ أثناء التفعيل: ' + error.message);
    }
  };

  const handleDeactivate = async (storeId) => {
    if (!confirm('هل تريد تعطيل هذا المتجر الآن؟')) return;
    const { error } = await supabase.from('store_profiles').update({ is_active: false }).eq('id', storeId);
    if (!error) loadStores();
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-bold">جاري تحميل لوحة الإدارة العليا...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 sm:p-10" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-black text-white">⚡ لوحة الإدارة العليا (Super Admin)</h1>
            <p className="text-xs text-slate-400 mt-1">التحكم في اشتراكات التجار والمبالغ المحولة وتفعيل المتاجر</p>
          </div>
          <button onClick={loadStores} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold">
            🔄 تحديث البيانات
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {stores.map((s) => {
            const isExpired = !s.subscription_ends_at || new Date(s.subscription_ends_at) < new Date();
            const isActive = s.is_active && !isExpired;

            return (
              <div key={s.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-white text-lg">{s.store_name}</span>
                    <span className="text-xs text-slate-500 font-mono">({s.store_slug})</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {isActive ? 'نشط ويعمل' : 'معطل / بانتظار التجديد'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 flex flex-wrap gap-4 pt-1">
                    <span>صاحب المتجر: <strong className="text-slate-200">{s.owner_name || 'غير محدد'}</strong></span>
                    <span>الهاتف: <strong className="text-slate-200 font-mono" dir="ltr">{s.phone || 'غير مسجل'}</strong></span>
                    <span>المبلغ المحول: <strong className="text-emerald-400">{s.amount_paid || 0} ج.م</strong></span>
                    <span>تاريخ الانتهاء: <strong className="text-amber-400 font-mono">{s.subscription_ends_at ? new Date(s.subscription_ends_at).toLocaleDateString('ar-EG') : 'لم يفعل بعد'}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setEditingStore(s); setPaymentAmount(s.amount_paid || ''); }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md"
                  >
                    تجديد / تفعيل الاشتراك
                  </button>
                  {isActive && (
                    <button onClick={() => handleDeactivate(s.id)} className="px-3 py-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-xl text-xs font-bold">
                      تعطيل المتجر
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {editingStore && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-white border-b border-slate-800 pb-3">
              تفعيل اشتراك: {editingStore.store_name}
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
              <button onClick={() => setEditingStore(null)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold">
                إلغاء
              </button>
              <button onClick={() => handleActivate(editingStore)} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold">
                تأكيد وحفظ التفعيل 🚀
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
