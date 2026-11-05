/* قفل تمرير الصفحة بعدّاد مشترك: لو أكتر من نافذة (سلة جانبية + عرض مركّز) فتحوا مع بعض،
   التمرير بيرجع بس لما آخر واحدة تتقفل. كده مستحيل يفضل مقفول بالغلط. */
let n = 0;
let prev = '';
export function lockScroll() {
  if (typeof document === 'undefined') return () => {};
  if (n === 0) { prev = document.body.style.overflow; document.body.style.overflow = 'hidden'; }
  n += 1;
  let done = false;
  return () => {
    if (done) return;
    done = true;
    n = Math.max(0, n - 1);
    if (n === 0) document.body.style.overflow = prev;
  };
}
/* شبكة أمان: لو مفيش أي نافذة مفتوحة، تأكد إن التمرير شغال */
export function unlockIfIdle() {
  if (typeof document !== 'undefined' && n === 0 && document.body.style.overflow === 'hidden') document.body.style.overflow = '';
}
