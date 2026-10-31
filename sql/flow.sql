-- ============================================================
-- الفانل الكامل (Upsell / Downsell / صفحات بين الخطوات) + إحصائيات كل خطوة
-- شغّله مرة واحدة في Supabase → SQL Editor (آمن لو اتشغّل أكتر من مرة)
-- ============================================================

-- 1) جدول الفانلات (الخطوات متخزنة كـ JSON مرتّب)
create table if not exists public.store_flows (
  id uuid primary key default gen_random_uuid(),
  store_id text not null,
  name text not null default '',
  slug text not null,
  enabled boolean not null default true,
  steps jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, slug)
);
alter table public.store_flows enable row level security;
drop policy if exists store_flows_owner on public.store_flows;
create policy store_flows_owner on public.store_flows for all to authenticated
  using (store_id = auth.uid()::text) with check (store_id = auth.uid()::text);

-- 2) إحصائيات كل خطوة (يوم بيوم)
create table if not exists public.store_flow_stats (
  store_id text not null,
  flow_id text not null,
  step_id text not null,
  day date not null default ((now() at time zone 'Africa/Cairo')::date),
  views int not null default 0,
  passes int not null default 0,
  declines int not null default 0,
  revenue numeric not null default 0,
  primary key (store_id, flow_id, step_id, day)
);
alter table public.store_flow_stats enable row level security;
drop policy if exists store_flow_stats_owner on public.store_flow_stats;
create policy store_flow_stats_owner on public.store_flow_stats for select to authenticated
  using (store_id = auth.uid()::text);

-- 3) تسجيل حدث لخطوة (السيرفر فقط، مش متاحة للمتصفح)
create or replace function public.bump_flow_step(
  p_store text, p_flow text, p_step text, p_view int, p_pass int, p_decline int, p_revenue numeric
) returns void language sql security definer set search_path = public as $$
  insert into public.store_flow_stats (store_id, flow_id, step_id, day, views, passes, declines, revenue)
  values (p_store, p_flow, p_step, (now() at time zone 'Africa/Cairo')::date,
          greatest(coalesce(p_view,0),0), greatest(coalesce(p_pass,0),0), greatest(coalesce(p_decline,0),0), greatest(coalesce(p_revenue,0),0))
  on conflict (store_id, flow_id, step_id, day) do update set
    views = public.store_flow_stats.views + excluded.views,
    passes = public.store_flow_stats.passes + excluded.passes,
    declines = public.store_flow_stats.declines + excluded.declines,
    revenue = public.store_flow_stats.revenue + excluded.revenue;
$$;
revoke all on function public.bump_flow_step(text,text,text,int,int,int,numeric) from public, anon, authenticated;
grant execute on function public.bump_flow_step(text,text,text,int,int,int,numeric) to service_role;

-- 4) إضافة منتج Upsell لنفس الطلب بضغطة واحدة (ذرّية: بتقفل صف الطلب وبتمنع التكرار)
create or replace function public.append_order_item(
  p_store text, p_token text, p_step text, p_item jsonb, p_add numeric, p_cost numeric, p_free_over numeric
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  o record;
  new_items jsonb; new_sub numeric; new_ship numeric; new_total numeric;
begin
  select * into o from public.orders where store_id::text = p_store and public_token = p_token for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  if o.status is distinct from 'pending' then return jsonb_build_object('ok', false, 'reason', 'status'); end if;
  if o.created_at < now() - interval '2 hours' then return jsonb_build_object('ok', false, 'reason', 'expired'); end if;
  if exists (select 1 from jsonb_array_elements(coalesce(o.items, '[]'::jsonb)) e where e->>'flow_step' = p_step) then
    return jsonb_build_object('ok', true, 'already', true, 'order_no', o.order_no, 'total', o.total_price);
  end if;
  new_items := coalesce(o.items, '[]'::jsonb) || jsonb_build_array(p_item);
  new_sub := coalesce(o.subtotal, 0) + p_add;
  new_ship := coalesce(o.shipping_cost, 0);
  if p_free_over > 0 and (new_sub - coalesce(o.discount, 0)) >= p_free_over then new_ship := 0; end if;
  new_total := greatest(0, new_sub - coalesce(o.discount, 0) + new_ship + coalesce(o.cod_fee, 0));
  update public.orders
     set items = new_items, subtotal = new_sub, shipping_cost = new_ship, total_price = new_total,
         cost_total = coalesce(cost_total, 0) + coalesce(p_cost, 0)
   where id = o.id;
  return jsonb_build_object('ok', true, 'order_no', o.order_no, 'total', new_total, 'added', p_add);
end $$;
revoke all on function public.append_order_item(text,text,text,jsonb,numeric,numeric,numeric) from public, anon, authenticated;
grant execute on function public.append_order_item(text,text,text,jsonb,numeric,numeric,numeric) to service_role;
