/* شركات الشحن المتاحة للتسجيل اليدوي (رقم التتبع بتكتبه أنت). بوسطة ليها ربط API تلقائي منفصل. */
export const MANUAL_COURIERS = [
  { id: 'aramex', name: 'أرامكس (Aramex)' },
  { id: 'jt', name: 'J&T Express' },
  { id: 'mylerz', name: 'ميلرز (Mylerz)' },
  { id: 'egyptpost', name: 'البريد المصري' },
  { id: 'bosta', name: 'بوسطة (تسجيل يدوي)' },
  { id: 'own', name: 'مندوب خاص / شركة أخرى' },
];
export const courierName = (id) => MANUAL_COURIERS.find((c) => c.id === id)?.name || id || '';
