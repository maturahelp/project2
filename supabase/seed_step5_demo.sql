-- Майстор24 — Step 5 DEMO seed data (verified майстори + services/hours + one review).
-- Safe to re-run: uses upserts / on conflict do nothing.
-- Requires migration 20260706140000_maistor_display_name.sql first.

insert into public.maistor_profiles (user_id, slug, display_name, bio, categories, base_city, verified, rating_avg, rating_count) values ('2a3451c3-1f92-4f75-9211-b27ad742cf42', 'ivan-elektrov', 'Иван Електров', 'Опитен майстор с дългогодишен опит. Качество и коректност.', array['Електротехник', 'Осветление'], 'София', true, 4.8, 12) on conflict (user_id) do update set verified = excluded.verified, display_name = excluded.display_name, categories = excluded.categories, base_city = excluded.base_city, rating_avg = excluded.rating_avg, rating_count = excluded.rating_count;
delete from public.services where maistor_id = '2a3451c3-1f92-4f75-9211-b27ad742cf42';
insert into public.services (maistor_id, title, description, price_from, price_unit, duration_min) values ('2a3451c3-1f92-4f75-9211-b27ad742cf42', 'Електротехник — стандартна услуга', 'Оглед и консултация на място.', 40, 'лв/час', 60);
insert into public.services (maistor_id, title, description, price_from, price_unit, duration_min) values ('2a3451c3-1f92-4f75-9211-b27ad742cf42', 'Електротехник — спешна услуга', 'Реакция в рамките на деня.', 60, 'лв/час', 90);
delete from public.working_hours where maistor_id = '2a3451c3-1f92-4f75-9211-b27ad742cf42';
insert into public.working_hours (maistor_id, weekday, start_time, end_time) values ('2a3451c3-1f92-4f75-9211-b27ad742cf42', 1, '09:00', '18:00');
insert into public.working_hours (maistor_id, weekday, start_time, end_time) values ('2a3451c3-1f92-4f75-9211-b27ad742cf42', 2, '09:00', '18:00');
insert into public.working_hours (maistor_id, weekday, start_time, end_time) values ('2a3451c3-1f92-4f75-9211-b27ad742cf42', 3, '09:00', '18:00');
insert into public.working_hours (maistor_id, weekday, start_time, end_time) values ('2a3451c3-1f92-4f75-9211-b27ad742cf42', 4, '09:00', '18:00');
insert into public.working_hours (maistor_id, weekday, start_time, end_time) values ('2a3451c3-1f92-4f75-9211-b27ad742cf42', 5, '09:00', '18:00');

insert into public.maistor_profiles (user_id, slug, display_name, bio, categories, base_city, verified, rating_avg, rating_count) values ('a6c45d59-98c1-4680-80fb-7bddbe250b30', 'georgi-vodata', 'Георги Водата', 'Опитен майстор с дългогодишен опит. Качество и коректност.', array['Водопроводчик'], 'Пловдив', true, 4.5, 8) on conflict (user_id) do update set verified = excluded.verified, display_name = excluded.display_name, categories = excluded.categories, base_city = excluded.base_city, rating_avg = excluded.rating_avg, rating_count = excluded.rating_count;
delete from public.services where maistor_id = 'a6c45d59-98c1-4680-80fb-7bddbe250b30';
insert into public.services (maistor_id, title, description, price_from, price_unit, duration_min) values ('a6c45d59-98c1-4680-80fb-7bddbe250b30', 'Водопроводчик — стандартна услуга', 'Оглед и консултация на място.', 35, 'лв/час', 60);
insert into public.services (maistor_id, title, description, price_from, price_unit, duration_min) values ('a6c45d59-98c1-4680-80fb-7bddbe250b30', 'Водопроводчик — спешна услуга', 'Реакция в рамките на деня.', 55, 'лв/час', 90);
delete from public.working_hours where maistor_id = 'a6c45d59-98c1-4680-80fb-7bddbe250b30';
insert into public.working_hours (maistor_id, weekday, start_time, end_time) values ('a6c45d59-98c1-4680-80fb-7bddbe250b30', 1, '09:00', '18:00');
insert into public.working_hours (maistor_id, weekday, start_time, end_time) values ('a6c45d59-98c1-4680-80fb-7bddbe250b30', 2, '09:00', '18:00');
insert into public.working_hours (maistor_id, weekday, start_time, end_time) values ('a6c45d59-98c1-4680-80fb-7bddbe250b30', 3, '09:00', '18:00');
insert into public.working_hours (maistor_id, weekday, start_time, end_time) values ('a6c45d59-98c1-4680-80fb-7bddbe250b30', 4, '09:00', '18:00');
insert into public.working_hours (maistor_id, weekday, start_time, end_time) values ('a6c45d59-98c1-4680-80fb-7bddbe250b30', 5, '09:00', '18:00');

insert into public.maistor_profiles (user_id, slug, display_name, bio, categories, base_city, verified, rating_avg, rating_count) values ('a9446206-a391-4bb5-ab44-f1a7d6264b0e', 'petar-boyadzhiev', 'Петър Бояджиев', 'Опитен майстор с дългогодишен опит. Качество и коректност.', array['Бояджия', 'Мазилки'], 'София', true, 4.2, 5) on conflict (user_id) do update set verified = excluded.verified, display_name = excluded.display_name, categories = excluded.categories, base_city = excluded.base_city, rating_avg = excluded.rating_avg, rating_count = excluded.rating_count;
delete from public.services where maistor_id = 'a9446206-a391-4bb5-ab44-f1a7d6264b0e';
insert into public.services (maistor_id, title, description, price_from, price_unit, duration_min) values ('a9446206-a391-4bb5-ab44-f1a7d6264b0e', 'Бояджия — стандартна услуга', 'Оглед и консултация на място.', 25, 'лв/час', 60);
insert into public.services (maistor_id, title, description, price_from, price_unit, duration_min) values ('a9446206-a391-4bb5-ab44-f1a7d6264b0e', 'Бояджия — спешна услуга', 'Реакция в рамките на деня.', 45, 'лв/час', 90);
delete from public.working_hours where maistor_id = 'a9446206-a391-4bb5-ab44-f1a7d6264b0e';
insert into public.working_hours (maistor_id, weekday, start_time, end_time) values ('a9446206-a391-4bb5-ab44-f1a7d6264b0e', 1, '09:00', '18:00');
insert into public.working_hours (maistor_id, weekday, start_time, end_time) values ('a9446206-a391-4bb5-ab44-f1a7d6264b0e', 2, '09:00', '18:00');
insert into public.working_hours (maistor_id, weekday, start_time, end_time) values ('a9446206-a391-4bb5-ab44-f1a7d6264b0e', 3, '09:00', '18:00');
insert into public.working_hours (maistor_id, weekday, start_time, end_time) values ('a9446206-a391-4bb5-ab44-f1a7d6264b0e', 4, '09:00', '18:00');
insert into public.working_hours (maistor_id, weekday, start_time, end_time) values ('a9446206-a391-4bb5-ab44-f1a7d6264b0e', 5, '09:00', '18:00');

insert into public.maistor_profiles (user_id, slug, display_name, bio, categories, base_city, verified, rating_avg, rating_count) values ('e9f0cf21-e892-438e-8284-1f7094d5f131', 'mariya-klimatik', 'Мария Климатик', 'Опитен майстор с дългогодишен опит. Качество и коректност.', array['Климатици'], 'Варна', true, 5.0, 3) on conflict (user_id) do update set verified = excluded.verified, display_name = excluded.display_name, categories = excluded.categories, base_city = excluded.base_city, rating_avg = excluded.rating_avg, rating_count = excluded.rating_count;
delete from public.services where maistor_id = 'e9f0cf21-e892-438e-8284-1f7094d5f131';
insert into public.services (maistor_id, title, description, price_from, price_unit, duration_min) values ('e9f0cf21-e892-438e-8284-1f7094d5f131', 'Климатици — стандартна услуга', 'Оглед и консултация на място.', 60, 'лв/час', 60);
insert into public.services (maistor_id, title, description, price_from, price_unit, duration_min) values ('e9f0cf21-e892-438e-8284-1f7094d5f131', 'Климатици — спешна услуга', 'Реакция в рамките на деня.', 80, 'лв/час', 90);
delete from public.working_hours where maistor_id = 'e9f0cf21-e892-438e-8284-1f7094d5f131';
insert into public.working_hours (maistor_id, weekday, start_time, end_time) values ('e9f0cf21-e892-438e-8284-1f7094d5f131', 1, '09:00', '18:00');
insert into public.working_hours (maistor_id, weekday, start_time, end_time) values ('e9f0cf21-e892-438e-8284-1f7094d5f131', 2, '09:00', '18:00');
insert into public.working_hours (maistor_id, weekday, start_time, end_time) values ('e9f0cf21-e892-438e-8284-1f7094d5f131', 3, '09:00', '18:00');
insert into public.working_hours (maistor_id, weekday, start_time, end_time) values ('e9f0cf21-e892-438e-8284-1f7094d5f131', 4, '09:00', '18:00');
insert into public.working_hours (maistor_id, weekday, start_time, end_time) values ('e9f0cf21-e892-438e-8284-1f7094d5f131', 5, '09:00', '18:00');

insert into public.maistor_profiles (user_id, slug, display_name, bio, categories, base_city, verified, rating_avg, rating_count) values ('44e4a645-240e-4bfe-8fb1-47b0373cd516', 'stoyan-darvodelski', 'Стоян Дърводелски', 'Опитен майстор с дългогодишен опит. Качество и коректност.', array['Дърводелец', 'Мебели'], 'Пловдив', true, 4.7, 20) on conflict (user_id) do update set verified = excluded.verified, display_name = excluded.display_name, categories = excluded.categories, base_city = excluded.base_city, rating_avg = excluded.rating_avg, rating_count = excluded.rating_count;
delete from public.services where maistor_id = '44e4a645-240e-4bfe-8fb1-47b0373cd516';
insert into public.services (maistor_id, title, description, price_from, price_unit, duration_min) values ('44e4a645-240e-4bfe-8fb1-47b0373cd516', 'Дърводелец — стандартна услуга', 'Оглед и консултация на място.', 50, 'лв/час', 60);
insert into public.services (maistor_id, title, description, price_from, price_unit, duration_min) values ('44e4a645-240e-4bfe-8fb1-47b0373cd516', 'Дърводелец — спешна услуга', 'Реакция в рамките на деня.', 70, 'лв/час', 90);
delete from public.working_hours where maistor_id = '44e4a645-240e-4bfe-8fb1-47b0373cd516';
insert into public.working_hours (maistor_id, weekday, start_time, end_time) values ('44e4a645-240e-4bfe-8fb1-47b0373cd516', 1, '09:00', '18:00');
insert into public.working_hours (maistor_id, weekday, start_time, end_time) values ('44e4a645-240e-4bfe-8fb1-47b0373cd516', 2, '09:00', '18:00');
insert into public.working_hours (maistor_id, weekday, start_time, end_time) values ('44e4a645-240e-4bfe-8fb1-47b0373cd516', 3, '09:00', '18:00');
insert into public.working_hours (maistor_id, weekday, start_time, end_time) values ('44e4a645-240e-4bfe-8fb1-47b0373cd516', 4, '09:00', '18:00');
insert into public.working_hours (maistor_id, weekday, start_time, end_time) values ('44e4a645-240e-4bfe-8fb1-47b0373cd516', 5, '09:00', '18:00');

insert into public.maistor_profiles (user_id, slug, display_name, bio, categories, base_city, verified, rating_avg, rating_count) values ('448c5378-9074-4eb9-b36c-cba29baa1e60', 'nikolay-plochki', 'Николай Плочки', 'Опитен майстор с дългогодишен опит. Качество и коректност.', array['Плочкаджия'], 'София', true, 4.0, 4) on conflict (user_id) do update set verified = excluded.verified, display_name = excluded.display_name, categories = excluded.categories, base_city = excluded.base_city, rating_avg = excluded.rating_avg, rating_count = excluded.rating_count;
delete from public.services where maistor_id = '448c5378-9074-4eb9-b36c-cba29baa1e60';
insert into public.services (maistor_id, title, description, price_from, price_unit, duration_min) values ('448c5378-9074-4eb9-b36c-cba29baa1e60', 'Плочкаджия — стандартна услуга', 'Оглед и консултация на място.', 45, 'лв/час', 60);
insert into public.services (maistor_id, title, description, price_from, price_unit, duration_min) values ('448c5378-9074-4eb9-b36c-cba29baa1e60', 'Плочкаджия — спешна услуга', 'Реакция в рамките на деня.', 65, 'лв/час', 90);
delete from public.working_hours where maistor_id = '448c5378-9074-4eb9-b36c-cba29baa1e60';
insert into public.working_hours (maistor_id, weekday, start_time, end_time) values ('448c5378-9074-4eb9-b36c-cba29baa1e60', 1, '09:00', '18:00');
insert into public.working_hours (maistor_id, weekday, start_time, end_time) values ('448c5378-9074-4eb9-b36c-cba29baa1e60', 2, '09:00', '18:00');
insert into public.working_hours (maistor_id, weekday, start_time, end_time) values ('448c5378-9074-4eb9-b36c-cba29baa1e60', 3, '09:00', '18:00');
insert into public.working_hours (maistor_id, weekday, start_time, end_time) values ('448c5378-9074-4eb9-b36c-cba29baa1e60', 4, '09:00', '18:00');
insert into public.working_hours (maistor_id, weekday, start_time, end_time) values ('448c5378-9074-4eb9-b36c-cba29baa1e60', 5, '09:00', '18:00');

insert into public.maistor_profiles (user_id, slug, display_name, bio, categories, base_city, verified, rating_avg, rating_count) values ('c3eb19e2-0a5a-460c-bbe0-c7721659561a', 'dimitar-el', 'Димитър Ел', 'Опитен майстор с дългогодишен опит. Качество и коректност.', array['Електротехник'], 'Варна', true, 4.9, 15) on conflict (user_id) do update set verified = excluded.verified, display_name = excluded.display_name, categories = excluded.categories, base_city = excluded.base_city, rating_avg = excluded.rating_avg, rating_count = excluded.rating_count;
delete from public.services where maistor_id = 'c3eb19e2-0a5a-460c-bbe0-c7721659561a';
insert into public.services (maistor_id, title, description, price_from, price_unit, duration_min) values ('c3eb19e2-0a5a-460c-bbe0-c7721659561a', 'Електротехник — стандартна услуга', 'Оглед и консултация на място.', 42, 'лв/час', 60);
insert into public.services (maistor_id, title, description, price_from, price_unit, duration_min) values ('c3eb19e2-0a5a-460c-bbe0-c7721659561a', 'Електротехник — спешна услуга', 'Реакция в рамките на деня.', 62, 'лв/час', 90);
delete from public.working_hours where maistor_id = 'c3eb19e2-0a5a-460c-bbe0-c7721659561a';
insert into public.working_hours (maistor_id, weekday, start_time, end_time) values ('c3eb19e2-0a5a-460c-bbe0-c7721659561a', 1, '09:00', '18:00');
insert into public.working_hours (maistor_id, weekday, start_time, end_time) values ('c3eb19e2-0a5a-460c-bbe0-c7721659561a', 2, '09:00', '18:00');
insert into public.working_hours (maistor_id, weekday, start_time, end_time) values ('c3eb19e2-0a5a-460c-bbe0-c7721659561a', 3, '09:00', '18:00');
insert into public.working_hours (maistor_id, weekday, start_time, end_time) values ('c3eb19e2-0a5a-460c-bbe0-c7721659561a', 4, '09:00', '18:00');
insert into public.working_hours (maistor_id, weekday, start_time, end_time) values ('c3eb19e2-0a5a-460c-bbe0-c7721659561a', 5, '09:00', '18:00');

insert into public.maistor_profiles (user_id, slug, display_name, bio, categories, base_city, verified, rating_avg, rating_count) values ('7feb1297-e816-452a-977a-25457d0e8692', 'elena-boya', 'Елена Боя', 'Опитен майстор с дългогодишен опит. Качество и коректност.', array['Бояджия'], 'София', true, 4.3, 6) on conflict (user_id) do update set verified = excluded.verified, display_name = excluded.display_name, categories = excluded.categories, base_city = excluded.base_city, rating_avg = excluded.rating_avg, rating_count = excluded.rating_count;
delete from public.services where maistor_id = '7feb1297-e816-452a-977a-25457d0e8692';
insert into public.services (maistor_id, title, description, price_from, price_unit, duration_min) values ('7feb1297-e816-452a-977a-25457d0e8692', 'Бояджия — стандартна услуга', 'Оглед и консултация на място.', 22, 'лв/час', 60);
insert into public.services (maistor_id, title, description, price_from, price_unit, duration_min) values ('7feb1297-e816-452a-977a-25457d0e8692', 'Бояджия — спешна услуга', 'Реакция в рамките на деня.', 42, 'лв/час', 90);
delete from public.working_hours where maistor_id = '7feb1297-e816-452a-977a-25457d0e8692';
insert into public.working_hours (maistor_id, weekday, start_time, end_time) values ('7feb1297-e816-452a-977a-25457d0e8692', 1, '09:00', '18:00');
insert into public.working_hours (maistor_id, weekday, start_time, end_time) values ('7feb1297-e816-452a-977a-25457d0e8692', 2, '09:00', '18:00');
insert into public.working_hours (maistor_id, weekday, start_time, end_time) values ('7feb1297-e816-452a-977a-25457d0e8692', 3, '09:00', '18:00');
insert into public.working_hours (maistor_id, weekday, start_time, end_time) values ('7feb1297-e816-452a-977a-25457d0e8692', 4, '09:00', '18:00');
insert into public.working_hours (maistor_id, weekday, start_time, end_time) values ('7feb1297-e816-452a-977a-25457d0e8692', 5, '09:00', '18:00');

insert into public.maistor_profiles (user_id, slug, display_name, bio, categories, base_city, verified, rating_avg, rating_count) values ('b7249517-d635-4a2a-8206-f82eb5e7af39', 'test-unverified', 'Тест Нередактиран', 'Опитен майстор с дългогодишен опит. Качество и коректност.', array['Електротехник'], 'София', false, 0, 0) on conflict (user_id) do update set verified = excluded.verified, display_name = excluded.display_name, categories = excluded.categories, base_city = excluded.base_city, rating_avg = excluded.rating_avg, rating_count = excluded.rating_count;
delete from public.services where maistor_id = 'b7249517-d635-4a2a-8206-f82eb5e7af39';
insert into public.services (maistor_id, title, description, price_from, price_unit, duration_min) values ('b7249517-d635-4a2a-8206-f82eb5e7af39', 'Електротехник — стандартна услуга', 'Оглед и консултация на място.', 30, 'лв/час', 60);
insert into public.services (maistor_id, title, description, price_from, price_unit, duration_min) values ('b7249517-d635-4a2a-8206-f82eb5e7af39', 'Електротехник — спешна услуга', 'Реакция в рамките на деня.', 50, 'лв/час', 90);
delete from public.working_hours where maistor_id = 'b7249517-d635-4a2a-8206-f82eb5e7af39';
insert into public.working_hours (maistor_id, weekday, start_time, end_time) values ('b7249517-d635-4a2a-8206-f82eb5e7af39', 1, '09:00', '18:00');
insert into public.working_hours (maistor_id, weekday, start_time, end_time) values ('b7249517-d635-4a2a-8206-f82eb5e7af39', 2, '09:00', '18:00');
insert into public.working_hours (maistor_id, weekday, start_time, end_time) values ('b7249517-d635-4a2a-8206-f82eb5e7af39', 3, '09:00', '18:00');
insert into public.working_hours (maistor_id, weekday, start_time, end_time) values ('b7249517-d635-4a2a-8206-f82eb5e7af39', 4, '09:00', '18:00');
insert into public.working_hours (maistor_id, weekday, start_time, end_time) values ('b7249517-d635-4a2a-8206-f82eb5e7af39', 5, '09:00', '18:00');

-- Review for the first майстор (needs a completed booking).
with b as (
  insert into public.bookings (maistor_id, client_id, service_id, status, start_at, end_at, contact_phone)
  values ('2a3451c3-1f92-4f75-9211-b27ad742cf42', 'c7fd5012-3f5c-46f3-b68f-dbd79d32282d', (select id from public.services where maistor_id = '2a3451c3-1f92-4f75-9211-b27ad742cf42' limit 1), 'completed', now() - interval '7 days', now() - interval '7 days' + interval '2 hours', '0888123456')
  returning id
)
insert into public.reviews (booking_id, maistor_id, client_id, rating, comment)
select b.id, '2a3451c3-1f92-4f75-9211-b27ad742cf42', 'c7fd5012-3f5c-46f3-b68f-dbd79d32282d', 5, 'Отличен майстор, дойде навреме и свърши перфектна работа!' from b
on conflict (booking_id) do nothing;
