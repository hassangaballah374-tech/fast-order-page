/* منطق التسعير بالعمولة (مشترك بين السيرفر ولوحة التاجر ولوحة الأدمن).
   كل طلب يخصم عمولة بالدولار من رصيد التاجر. الاشتراك الشهري الساري = طلبات بلا خصم. */
export const DEFAULT_COMMISSION = 0.03;
const n = (v) => Number(v) || 0;

/* عمولة المنصة الحالية (تُحمَّل مرة من الإعدادات في المتصفح) */
let PC = 0;
export const setPlatformCommission = (v) => { PC = n(v); };

export const commissionOf = (s, platform = PC) => {
  const own = s && s.commission_usd != null && s.commission_usd !== '' ? n(s.commission_usd) : 0;
  return own > 0 ? own : n(platform) > 0 ? n(platform) : DEFAULT_COMMISSION;
};
export const monthlyActive = (s) => !!(s && s.subscription_ends_at && new Date(s.subscription_ends_at).getTime() > Date.now());

/* الطلبات المتبقية: null = غير محدود (اشتراك شهري ساري) */
export const ordersLeft = (s, platform = PC) => (monthlyActive(s) ? null : Math.floor(n(s?.wallet_balance_usd) / commissionOf(s, platform) + 1e-9));
/* إجمالي الطلبات التي يغطيها كل ما شحنه التاجر */
export const ordersCovered = (s, platform = PC) => Math.floor(n(s?.wallet_topped_usd) / commissionOf(s, platform) + 1e-9);

/* inactive = لم يفعّله الأدمن، quota = الرصيد خلص، ok = يبيع */
export function storeStateOf(s, platform = PC) {
  if (!s || s.is_active !== true) return 'inactive';
  if (monthlyActive(s)) return 'ok';
  return n(s.wallet_balance_usd) + 1e-9 >= commissionOf(s, platform) ? 'ok' : 'quota';
}

export const toEgp = (usd, rate) => Math.round(n(usd) * n(rate) * 100) / 100;
export const usdFmt = (v) => `$${n(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const egpFmt = (v) => `${n(v).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ج.م`;
