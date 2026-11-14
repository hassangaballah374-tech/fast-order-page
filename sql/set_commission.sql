-- ضبط عمولة المنصة الافتراضية على 0.02 دولار (الشاشات بتقرأها من platform_kv.commission_usd).
-- عمولة التاجر الخاصة (store_profiles.commission_usd) بتفضل زي ما هي.
insert into public.platform_kv (key, value, updated_at) values ('commission_usd', '0.02', now())
on conflict (key) do update set value = '0.02', updated_at = now();

-- تحقق: القيمة الحالية + المتاجر اللي ليها عمولة خاصة (لو عايز تمسحها خلّيها null)
select key, value from public.platform_kv where key = 'commission_usd';
select user_id, store_name, commission_usd from public.store_profiles where commission_usd is not null order by store_name;
