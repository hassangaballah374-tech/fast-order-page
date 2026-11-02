-- سمعة العميل عبر كل متاجر سبايك (أرقام مجمّعة فقط: بدون أسماء متاجر ولا تفاصيل طلبات).
-- آمنة لو اتشغلت أكتر من مرة. شغّلها في Supabase → SQL Editor.
create index if not exists orders_phone_status_idx on public.orders (customer_phone, status);

-- 1) داخلية (للسيرفر فقط): إحصاء لأرقام بدون أي فحص صلاحيات
create or replace function public.network_risk_for(p_phones text[])
returns table(phone text, total int, delivered int, returned int, cancelled int, stores int, bad_stores int)
language sql stable security definer set search_path = public as $$
  select o.customer_phone::text,
         count(*)::int,
         (count(*) filter (where o.status = 'delivered'))::int,
         (count(*) filter (where o.status = 'returned'))::int,
         (count(*) filter (where o.status = 'cancelled'))::int,
         count(distinct o.store_id)::int,
         (count(distinct o.store_id) filter (where o.status = 'returned'))::int
  from public.orders o
  where o.customer_phone = any(p_phones)
  group by o.customer_phone
$$;
revoke all on function public.network_risk_for(text[]) from public, anon, authenticated;
grant execute on function public.network_risk_for(text[]) to service_role;

-- 2) للوحة التاجر: التاجر يسأل بس عن أرقام موجودة في طلبات متجره (الأدمن يسأل عن أي رقم)
create or replace function public.network_risk(p_phones text[])
returns table(phone text, total int, delivered int, returned int, cancelled int, stores int, bad_stores int)
language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null then return; end if;
  return query
    select r.* from public.network_risk_for(
      coalesce((
        select array_agg(distinct x)
        from unnest(p_phones[1:300]) as x
        where public.is_spike_admin()
           or exists (select 1 from public.orders m where m.store_id::text = auth.uid()::text and m.customer_phone = x)
      ), '{}'::text[])
    ) r;
end $$;
revoke all on function public.network_risk(text[]) from public, anon;
grant execute on function public.network_risk(text[]) to authenticated;
