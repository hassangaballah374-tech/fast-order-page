-- =====================================================================
-- SPIKE — قاعدة بيانات لوحة التاجر (Merchants)
-- شغّله في Supabase > SQL Editor بعد ملف spike-admin-rls.sql.
-- الجداول بادئتها mk_ عشان ما تتعارض مع orders/products الحاليين.
-- =====================================================================

-- ---------- 1) الجداول ----------
create table if not exists mk_stores (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null check (length(name) between 2 and 60),
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,40}$'),
  category text,
  color text not null default '#0a7f86' check (color ~ '^#[0-9a-fA-F]{6}$'),
  currency text not null default 'ج.م',
  domain text,
  free_ship_over numeric not null default 1000 check (free_ship_over >= 0),
  pay jsonb not null default '{"cod":true,"wallet":false,"card":false}',
  checkout_fields jsonb not null default '{"phone2":false,"email":false,"note":true}',
  pixels jsonb not null default '{}',
  upsell jsonb not null default '{"bundle":false,"free":true}',
  shipping jsonb not null default '[["القاهرة والجيزة",50],["الإسكندرية",60],["الدلتا",65],["القناة",70],["الصعيد",85],["سيناء والبحر الأحمر",110]]',
  onboarded boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists mk_products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references mk_stores(id) on delete cascade,
  name text not null check (length(name) between 1 and 120),
  price numeric not null check (price >= 0),
  cost numeric not null default 0 check (cost >= 0),
  stock integer not null default 0 check (stock >= 0),
  variants text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists mk_orders (
  id bigint generated always as identity (start with 1001) primary key,
  store_id uuid not null references mk_stores(id) on delete cascade,
  customer_name text not null,
  phone text not null check (phone ~ '^01[0-9]{9}$'),
  governorate text,
  address text,
  note text,
  subtotal numeric not null,
  discount numeric not null default 0,
  shipping_fee numeric not null default 0,
  total numeric not null,
  cost numeric not null default 0,
  coupon_code text,
  is_duplicate boolean not null default false,
  status text not null default 'pending' check (status in ('pending','confirmed','shipped','delivered','returned')),
  created_at timestamptz not null default now()
);

create table if not exists mk_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id bigint not null references mk_orders(id) on delete cascade,
  product_id uuid references mk_products(id) on delete set null,
  name text not null, price numeric not null, cost numeric not null default 0,
  qty integer not null check (qty between 1 and 50)
);

create table if not exists mk_carts (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references mk_stores(id) on delete cascade,
  customer_name text, phone text not null check (phone ~ '^01[0-9]{9}$'),
  value numeric not null default 0, items integer not null default 1,
  recovered boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists mk_coupons (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references mk_stores(id) on delete cascade,
  code text not null check (code ~ '^[A-Z0-9_-]{3,20}$'),
  pct integer not null check (pct between 1 and 90),
  uses integer not null default 0,
  active boolean not null default true,
  unique (store_id, code)
);

create index if not exists mk_orders_store_idx on mk_orders (store_id, created_at desc);
create index if not exists mk_orders_phone_idx on mk_orders (store_id, phone, status);
create index if not exists mk_products_store_idx on mk_products (store_id);
create index if not exists mk_carts_store_idx on mk_carts (store_id, created_at desc);

-- ---------- 2) دالة مساعدة (تتفادى حلقة RLS) ----------
create or replace function public.my_store_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select id from mk_stores where owner_id = auth.uid();
$$;
revoke all on function public.my_store_ids() from public, anon;
grant execute on function public.my_store_ids() to authenticated;

-- ---------- 3) الصلاحيات على مستوى الأعمدة ----------
revoke all on mk_stores, mk_products, mk_orders, mk_order_items, mk_carts, mk_coupons from anon, authenticated;
grant select on mk_stores, mk_orders, mk_order_items, mk_carts, mk_coupons, mk_products to authenticated;
grant update (name, slug, category, color, currency, domain, free_ship_over, pay, checkout_fields, pixels, upsell, shipping, onboarded) on mk_stores to authenticated;
grant insert, update, delete on mk_products to authenticated;
grant update (status) on mk_orders to authenticated;          -- التاجر يغيّر الحالة فقط، لا الأسعار
grant update (recovered) on mk_carts to authenticated;
grant delete on mk_carts to authenticated;
grant insert, delete on mk_coupons to authenticated;
grant update (code, pct, active) on mk_coupons to authenticated;

-- ---------- 4) RLS ----------
alter table mk_stores enable row level security;
alter table mk_products enable row level security;
alter table mk_orders enable row level security;
alter table mk_order_items enable row level security;
alter table mk_carts enable row level security;
alter table mk_coupons enable row level security;

create policy mk_stores_own_select on mk_stores for select to authenticated using (owner_id = auth.uid());
create policy mk_stores_own_update on mk_stores for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

do $$
declare t text;
begin
  foreach t in array array['mk_products','mk_carts','mk_coupons'] loop
    execute format('create policy %I on %I for all to authenticated using (store_id in (select public.my_store_ids())) with check (store_id in (select public.my_store_ids()))', t || '_own', t);
  end loop;
end $$;

create policy mk_orders_own_select on mk_orders for select to authenticated using (store_id in (select public.my_store_ids()));
create policy mk_orders_own_update on mk_orders for update to authenticated
  using (store_id in (select public.my_store_ids())) with check (store_id in (select public.my_store_ids()));
create policy mk_items_own_select on mk_order_items for select to authenticated
  using (order_id in (select id from mk_orders where store_id in (select public.my_store_ids())));

-- قراءة الإدارة العليا (يحتاج is_admin() من spike-admin-rls.sql)
do $$
declare t text;
begin
  foreach t in array array['mk_stores','mk_products','mk_orders','mk_order_items','mk_carts','mk_coupons'] loop
    execute format('create policy %I on %I for select to authenticated using (public.is_admin())', t || '_admin_read', t);
  end loop;
end $$;

-- ---------- 5) إنشاء المتجر (للتاجر المسجل) ----------
create or replace function public.mk_create_store(p_name text, p_slug text, p_cat text, p_color text)
returns mk_stores language plpgsql security definer set search_path = public as $$
declare s mk_stores;
begin
  if auth.uid() is null then raise exception 'auth'; end if;
  insert into mk_stores (owner_id, name, slug, category, color, onboarded)
  values (auth.uid(), left(trim(p_name), 60), lower(trim(p_slug)), p_cat, coalesce(p_color, '#0a7f86'), true)
  on conflict (owner_id) do update
    set name = excluded.name, slug = excluded.slug, category = excluded.category, color = excluded.color, onboarded = true
  returning * into s;
  return s;
end $$;
revoke all on function public.mk_create_store(text, text, text, text) from public, anon;
grant execute on function public.mk_create_store(text, text, text, text) to authenticated;

-- ---------- 6) واجهة المتجر العامة (بدون تسجيل دخول) ----------
create or replace function public.mk_storefront(p_slug text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'store', jsonb_build_object('name', s.name, 'slug', s.slug, 'color', s.color, 'currency', s.currency,
      'pay', s.pay, 'fields', s.checkout_fields, 'pixels', s.pixels, 'free_ship_over', s.free_ship_over,
      'shipping', s.shipping, 'upsell', s.upsell),
    'products', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'name', p.name, 'price', p.price,
      'stock', p.stock, 'variants', p.variants) order by p.created_at desc)
      from mk_products p where p.store_id = s.id and p.active), '[]'::jsonb))
  from mk_stores s where s.slug = lower(p_slug) and s.is_active;
$$;

-- ---------- 7) تسجيل طلب (الأسعار والمخزون والخصم والشحن تُحسب هنا لا من المتصفح) ----------
create or replace function public.mk_place_order(
  p_slug text, p_name text, p_phone text, p_gov text, p_address text, p_note text,
  p_items jsonb, p_coupon text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_store mk_stores; v_it jsonb; v_pr mk_products; v_q int;
  v_sub numeric := 0; v_cost numeric := 0; v_ship numeric; v_disc numeric := 0; v_pct int;
  v_oid bigint; v_dup boolean; v_lines jsonb := '[]'::jsonb;
begin
  select * into v_store from mk_stores where slug = lower(p_slug) and is_active;
  if not found then raise exception 'المتجر غير متاح'; end if;
  if p_phone !~ '^01[0-9]{9}$' then raise exception 'رقم الهاتف غير صحيح'; end if;
  if length(trim(coalesce(p_name, ''))) < 2 or length(trim(coalesce(p_address, ''))) < 5 then raise exception 'بيانات ناقصة'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 30 then raise exception 'السلة فارغة'; end if;
  if (select count(*) from mk_orders where store_id = v_store.id and phone = p_phone and created_at > now() - interval '1 hour') >= 5
    then raise exception 'محاولات كثيرة، حاول لاحقًا'; end if;

  for v_it in select value from jsonb_array_elements(p_items) loop
    v_q := least(greatest(coalesce((v_it ->> 'qty')::int, 1), 1), 50);
    update mk_products set stock = stock - v_q
      where id = (v_it ->> 'product_id')::uuid and store_id = v_store.id and active and stock >= v_q
      returning * into v_pr;
    if not found then raise exception 'منتج غير متوفر بالكمية المطلوبة'; end if;
    v_sub := v_sub + v_pr.price * v_q;
    v_cost := v_cost + v_pr.cost * v_q;
    v_lines := v_lines || jsonb_build_object('pid', v_pr.id, 'name', v_pr.name, 'price', v_pr.price, 'cost', v_pr.cost, 'qty', v_q);
  end loop;

  if p_coupon is not null and length(p_coupon) > 0 then
    update mk_coupons set uses = uses + 1
      where store_id = v_store.id and code = upper(trim(p_coupon)) and active returning pct into v_pct;
    if found then v_disc := round(v_sub * v_pct / 100.0, 2); end if;
  end if;

  select (z ->> 1)::numeric into v_ship from jsonb_array_elements(v_store.shipping) z
    where (z ->> 0) ilike '%' || replace(trim(coalesce(p_gov, '')), '%', '') || '%' and length(trim(coalesce(p_gov, ''))) > 1 limit 1;
  v_ship := coalesce(v_ship, 70);
  if coalesce((v_store.upsell ->> 'free')::boolean, false) and (v_sub - v_disc) >= v_store.free_ship_over then v_ship := 0; end if;

  select exists (select 1 from mk_orders where store_id = v_store.id and phone = p_phone and status = 'pending'
    and created_at > now() - interval '24 hours') into v_dup;

  insert into mk_orders (store_id, customer_name, phone, governorate, address, note, subtotal, discount, shipping_fee, total, cost, coupon_code, is_duplicate)
  values (v_store.id, left(trim(p_name), 80), p_phone, left(p_gov, 40), left(p_address, 300), left(p_note, 300),
          v_sub, v_disc, v_ship, v_sub - v_disc + v_ship, v_cost, nullif(upper(trim(coalesce(p_coupon, ''))), ''), v_dup)
  returning id into v_oid;

  insert into mk_order_items (order_id, product_id, name, price, cost, qty)
  select v_oid, (l ->> 'pid')::uuid, l ->> 'name', (l ->> 'price')::numeric, (l ->> 'cost')::numeric, (l ->> 'qty')::int
  from jsonb_array_elements(v_lines) l;

  return jsonb_build_object('order_id', v_oid, 'total', v_sub - v_disc + v_ship, 'shipping', v_ship, 'discount', v_disc);
end $$;

-- ---------- 8) تتبّع السلة المتروكة ----------
create or replace function public.mk_track_cart(p_slug text, p_name text, p_phone text, p_value numeric, p_items int)
returns void language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  select id into v_id from mk_stores where slug = lower(p_slug) and is_active;
  if v_id is null or p_phone !~ '^01[0-9]{9}$' then return; end if;
  delete from mk_carts where store_id = v_id and phone = p_phone and not recovered;
  insert into mk_carts (store_id, customer_name, phone, value, items)
  values (v_id, left(p_name, 80), p_phone, greatest(p_value, 0), greatest(coalesce(p_items, 1), 1));
end $$;

revoke all on function public.mk_storefront(text), public.mk_place_order(text,text,text,text,text,text,jsonb,text), public.mk_track_cart(text,text,text,numeric,int) from public;
grant execute on function public.mk_storefront(text), public.mk_place_order(text,text,text,text,text,text,jsonb,text), public.mk_track_cart(text,text,text,numeric,int) to anon, authenticated;

-- ---------- 9) إشعار لحظي بالطلبات الجديدة ----------
do $$ begin alter publication supabase_realtime add table mk_orders; exception when duplicate_object then null; end $$;

-- =====================================================================
-- من صفحة المتجر العامة استدعِ فقط:
--   supabase.rpc('mk_storefront', { p_slug })
--   supabase.rpc('mk_place_order', { p_slug, p_name, p_phone, p_gov, p_address, p_note, p_items: [{product_id, qty}], p_coupon })
--   supabase.rpc('mk_track_cart', { p_slug, p_name, p_phone, p_value, p_items })
-- =====================================================================
