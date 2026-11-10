-- العمولة 0.02 دولار للطلب، وبتتخصم فقط لما الطلب يتحوّل لحالة «تم التسليم» (مرة واحدة لكل طلب).
-- شغّله مرة واحدة في Supabase → SQL Editor (آمن لو اتشغّل أكتر من مرة).
-- الطلبات اللي اتخصمت قبل كده (عند التسجيل) ليها صف في commission_ledger، فمش هتتخصم تاني.

-- 1) دالة الخصم لطلب واحد: تستهلك طلب مجاني أو تخصم العمولة من الرصيد أو تعدّيه لو اشتراك شهري ساري
create or replace function public.bill_delivered_order(p_store text, p_order_no bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  sp public.store_profiles;
  c numeric;
  kvc text;
  monthly boolean;
  k text;
  amt numeric := 0;
begin
  -- قفل صف التاجر عشان تسليمين في نفس اللحظة ما يخصموش مرتين
  perform 1 from public.store_profiles where user_id::text = p_store for update;

  if exists (
    select 1 from public.commission_ledger
    where store_id = p_store and order_no = p_order_no and kind in ('commission', 'free', 'monthly')
  ) then
    return;
  end if;

  select * into sp from public.store_profiles where user_id::text = p_store;
  if not found then return; end if;

  select value into kvc from public.platform_kv where key = 'commission_usd';
  c := coalesce(sp.commission_usd, nullif(kvc, '')::numeric, 0.02);
  monthly := sp.subscription_ends_at is not null and sp.subscription_ends_at > now();

  if monthly then
    k := 'monthly';
  elsif coalesce(sp.free_orders_left, 0) > 0 then
    k := 'free';
  else
    k := 'commission';
    amt := least(c, coalesce(sp.wallet_balance_usd, 0));
  end if;

  update public.store_profiles set
    free_orders_left = case when k = 'free' then free_orders_left - 1 else free_orders_left end,
    wallet_balance_usd = case when k = 'commission' then greatest(coalesce(wallet_balance_usd, 0) - c, 0) else wallet_balance_usd end
  where user_id::text = p_store;

  insert into public.commission_ledger (store_id, order_no, kind, amount_usd) values (p_store, p_order_no, k, amt);
end;
$$;
revoke all on function public.bill_delivered_order(text, bigint) from public, anon, authenticated;

-- 2) عند تسجيل الطلب: عدّاد الطلبات والإشعارات بس (من غير خصم). ولو اتسجّل مباشرة «تم التسليم» بنخصم.
create or replace function public.on_order_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  sp public.store_profiles;
begin
  select * into sp from public.store_profiles where user_id::text = new.store_id;

  update public.store_profiles set orders_used = coalesce(orders_used, 0) + 1 where user_id::text = new.store_id;

  insert into public.platform_notifications (audience, kind, title, body, data) values
    ('admin', 'new_order', 'طلب جديد #' || coalesce(new.order_no::text, ''), coalesce(sp.store_name, new.store_id) || ' · ' || coalesce(new.customer_name, '') || ' · ' || coalesce(new.total_price::text, '0'), jsonb_build_object('store_id', new.store_id, 'order_no', new.order_no)),
    (new.store_id, 'new_order', 'طلب جديد #' || coalesce(new.order_no::text, ''), coalesce(new.customer_name, '') || ' · ' || coalesce(new.total_price::text, '0'), jsonb_build_object('order_no', new.order_no));

  if new.status = 'delivered' then
    perform public.bill_delivered_order(new.store_id::text, new.order_no);
  end if;
  return new;
end;
$$;

-- 3) عند تحويل الطلب إلى «تم التسليم»: نخصم العمولة
create or replace function public.on_order_delivered()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.bill_delivered_order(new.store_id::text, new.order_no);
  return new;
end;
$$;

drop trigger if exists trg_order_delivered on public.orders;
create trigger trg_order_delivered
  after update of status on public.orders
  for each row
  when (new.status = 'delivered' and old.status is distinct from 'delivered')
  execute function public.on_order_delivered();

-- 4) العمولة الافتراضية للمنصة = 0.02 (عمولة التاجر الخاصة لو متحددة بتفضل زي ما هي)
do $$
begin
  insert into public.platform_kv (key, value) values ('commission_usd', '0.02')
  on conflict (key) do update set value = excluded.value;
exception when others then
  raise notice 'ماقدرتش أحدّث العمولة تلقائياً، غيّرها لـ 0.02 من لوحة الأدمن ← الفوترة';
end $$;
