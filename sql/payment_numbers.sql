-- أرقام التحويل (انستا باي / فودافون كاش) اللي بتظهر للتاجر في صفحة الاشتراكات والرصيد
-- بتتخزن في platform_kv تحت المفتاح payment_numbers، والتاجر لازم يقدر يقراه.
begin;
drop policy if exists "kv read allowed keys" on public.platform_kv;
create policy "kv read allowed keys" on public.platform_kv
  for select to authenticated
  using (key in ('theme_colors', 'commission_usd', 'payment_instructions', 'payment_numbers', 'payment_whatsapp', 'terms_text'));
commit;
