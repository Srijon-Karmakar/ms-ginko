create extension if not exists pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE app_role AS ENUM ('customer', 'admin');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reservation_status') THEN
    CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed', 'cancelled');
  END IF;
END;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role app_role not null default 'customer',
  created_at timestamptz not null default now()
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  category text not null,
  price numeric(10,2) not null check (price >= 0),
  is_vegetarian boolean not null default false,
  is_active boolean not null default true
);

create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image_url text not null,
  alt_text text not null,
  sort_order integer not null default 0
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_name text not null,
  rating integer not null check (rating between 1 and 5),
  quote text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  guest_name text not null,
  phone text not null,
  party_size integer not null check (party_size between 1 and 12),
  reservation_date date not null,
  reservation_time time not null,
  special_request text,
  status reservation_status not null default 'pending',
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();

create or replace function public.is_admin(user_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = user_uuid
      and p.role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.menu_items enable row level security;
alter table public.gallery_items enable row level security;
alter table public.reviews enable row level security;
alter table public.contact_messages enable row level security;
alter table public.reservations enable row level security;

DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins update profiles" ON public.profiles;

create policy "Users view own profile"
on public.profiles
for select
using (auth.uid() = id);

create policy "Admins view all profiles"
on public.profiles
for select
using (public.is_admin(auth.uid()));

create policy "Admins update profiles"
on public.profiles
for update
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Public read menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Admin manage menu items" ON public.menu_items;

create policy "Public read menu items"
on public.menu_items
for select
using (is_active = true);

create policy "Admin manage menu items"
on public.menu_items
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Public read gallery" ON public.gallery_items;
DROP POLICY IF EXISTS "Admin manage gallery" ON public.gallery_items;

create policy "Public read gallery"
on public.gallery_items
for select
using (true);

create policy "Admin manage gallery"
on public.gallery_items
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Public read reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admin manage reviews" ON public.reviews;

create policy "Public read reviews"
on public.reviews
for select
using (true);

create policy "Admin manage reviews"
on public.reviews
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Public can insert contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins view contact messages" ON public.contact_messages;

create policy "Public can insert contact messages"
on public.contact_messages
for insert
with check (true);

create policy "Admins view contact messages"
on public.contact_messages
for select
using (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users view own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users create own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users update own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Admins manage reservations" ON public.reservations;

create policy "Users view own reservations"
on public.reservations
for select
using (auth.uid() = user_id);

create policy "Users create own reservations"
on public.reservations
for insert
with check (auth.uid() = user_id);

create policy "Users update own reservations"
on public.reservations
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Admins manage reservations"
on public.reservations
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

insert into public.menu_items (name, description, category, price, is_vegetarian)
values
  ('Charred Broccolini', 'Smoked sesame, lemon salt, crispy shallots.', 'small-plates', 12, true),
  ('Ginko Bruschetta', 'Heirloom tomatoes, basil oil, sourdough crunch.', 'small-plates', 11, true),
  ('Forest Truffle Risotto', 'Arborio rice, parmesan cloud, roasted mushrooms.', 'mains', 26, true),
  ('Seared Citrus Salmon', 'Orange glaze, fennel slaw, herb potatoes.', 'mains', 29, false),
  ('Firewood Lamb Cutlets', 'House jus, roasted garlic mash, microgreens.', 'chef-specials', 38, false),
  ('Ms Ginko Signature Pasta', 'Chili butter, basil foam, parmesan shards.', 'chef-specials', 31, false),
  ('Vanilla Bean Creme Brulee', 'Caramel crack top, candied orange zest.', 'desserts', 10, true),
  ('Dark Chocolate Mousse', '70% cacao, berry compote, almond crumble.', 'desserts', 11, true),
  ('Smoked Negroni', 'Classic bitter profile with orange smoke.', 'beverages', 15, true),
  ('Cold Brew Tonic', 'Single origin cold brew, tonic, citrus peel.', 'beverages', 8, true)
on conflict do nothing;

insert into public.gallery_items (title, image_url, alt_text, sort_order)
values
  ('Dining Hall', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80', 'Warmly lit fine-dining interior', 1),
  ('Signature Dish', 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1600&q=80', 'Chef plated gourmet dish', 2),
  ('Chef Counter', 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1600&q=80', 'Chef preparing meals in open kitchen', 3)
on conflict do nothing;

insert into public.reviews (reviewer_name, rating, quote)
values
  ('Aarav Patel', 5, 'One of the most balanced tasting menus I have had in years.'),
  ('Lea Martin', 5, 'The signature pasta is worth planning the evening around.'),
  ('Nina Walker', 4, 'Perfect date-night spot with attentive service and pacing.')
on conflict do nothing;

-- Promote your own account to admin after first login:
-- update public.profiles set role = 'admin' where id = '<your-auth-user-id>';
