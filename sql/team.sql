-- حسابات فريق العمل: التاجر يدعو موظف بإيميله ويحدد صلاحياته (طلبات / منتجات).
-- السياسات هنا "إضافية": ما بتغيّرش أي سياسة موجودة، بس بتسمح للموظف المدعو. شغّله مرة واحدة في Supabase ← SQL Editor.
create table if not exists public.store_staff (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null,
  staff_email text not null,
  perms text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (owner_id, staff_email),
  constraint store_staff_perms_ok check (perms <@ array['orders','products']::text[]),
  constraint store_staff_email_lc check (staff_email = lower(staff_email))
);
create index if not exists store_staff_owner_idx on public.store_staff (owner_id);
create index if not exists store_staff_email_idx on public.store_staff (staff_email);
alter table public.store_staff enable row level security;

drop policy if exists store_staff_owner on public.store_staff;
create policy store_staff_owner on public.store_staff for all to authenticated
  using (owner_id = auth.uid()::text) with check (owner_id = auth.uid()::text);
-- الموظف يشوف دعواته هو (عشان اللوحة تعرف إنه موظف في متجر)
drop policy if exists store_staff_self on public.store_staff;
create policy store_staff_self on public.store_staff for select to authenticated
  using (staff_email = lower(coalesce(auth.jwt() ->> 'email', '')));

-- هل المستخدم الحالي موظف مفعّل بصلاحية p_perm في المتجر p_store؟ (لازم إيميله يكون مؤكَّد)
create or replace function public.is_staff(p_store text, p_perm text)
returns boolean language sql stable security definer set search_path = public, auth as $$
  select exists (
    select 1 from public.store_staff s
    join auth.users u on u.id = auth.uid()
    where s.owner_id = p_store and s.active and p_perm = any (s.perms)
      and s.staff_email = lower(u.email) and u.email_confirmed_at is not null
  );
$$;
revoke all on function public.is_staff(text, text) from public, anon;
grant execute on function public.is_staff(text, text) to authenticated;

-- الطلبات: صلاحية orders
drop policy if exists orders_staff_select on public.orders;
create policy orders_staff_select on public.orders for select to authenticated using (public.is_staff(store_id::text, 'orders'));
drop policy if exists orders_staff_update on public.orders;
create policy orders_staff_update on public.orders for update to authenticated
  using (public.is_staff(store_id::text, 'orders')) with check (public.is_staff(store_id::text, 'orders'));

-- المنتجات: صلاحية products
drop policy if exists products_staff_select on public.products;
create policy products_staff_select on public.products for select to authenticated
  using (public.is_staff(store_id::text, 'products') or public.is_staff(store_id::text, 'orders'));
drop policy if exists products_staff_update on public.products;
create policy products_staff_update on public.products for update to authenticated
  using (public.is_staff(store_id::text, 'products')) with check (public.is_staff(store_id::text, 'products'));

-- قراءة بيانات المتجر والإعدادات (عشان اللوحة تفتح)
drop policy if exists store_profiles_staff_select on public.store_profiles;
create policy store_profiles_staff_select on public.store_profiles for select to authenticated
  using (public.is_staff(user_id::text, 'orders') or public.is_staff(user_id::text, 'products'));
drop policy if exists store_config_staff_select on public.store_config;
create policy store_config_staff_select on public.store_config for select to authenticated
  using (public.is_staff(store_id::text, 'orders') or public.is_staff(store_id::text, 'products'));
