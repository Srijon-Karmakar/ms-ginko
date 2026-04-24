create extension if not exists pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE app_role AS ENUM ('customer', 'admin');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reservation_status') THEN
    CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
  ELSE
    ALTER TYPE reservation_status ADD VALUE IF NOT EXISTS 'completed';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'table_shape') THEN
    CREATE TYPE table_shape AS ENUM ('rect-wide', 'rect-mid', 'rect-tall', 'round');
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
  table_id text,
  guest_name text not null,
  guest_email text,
  phone text not null,
  party_size integer not null,
  reservation_date date not null,
  reservation_time time not null,
  special_request text,
  status reservation_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  cancelled_at timestamptz,
  completed_at timestamptz
);

create table if not exists public.restaurant_tables (
  id text primary key,
  label text not null unique,
  capacity integer not null check (capacity between 1 and 20),
  zone text not null check (zone in ('window', 'center', 'patio')),
  shape table_shape not null,
  layout_x numeric(5,2) not null check (layout_x >= 0 and layout_x <= 100),
  layout_y numeric(5,2) not null check (layout_y >= 0 and layout_y <= 100),
  layout_width numeric(5,2) not null check (layout_width > 0 and layout_width <= 100),
  layout_height numeric(5,2) not null check (layout_height > 0 and layout_height <= 100),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.reservations
  add column if not exists table_id text,
  add column if not exists guest_email text,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists cancelled_at timestamptz,
  add column if not exists completed_at timestamptz;

alter table if exists public.reservations
  drop constraint if exists reservations_table_id_fkey,
  add constraint reservations_table_id_fkey
    foreign key (table_id)
    references public.restaurant_tables(id);

alter table if exists public.reservations
  alter column status set default 'pending',
  alter column updated_at set default now();

alter table if exists public.reservations
  drop constraint if exists reservations_party_size_check;

alter table if exists public.reservations
  add constraint reservations_party_size_check check (party_size between 1 and 6);

insert into public.restaurant_tables (
  id,
  label,
  capacity,
  zone,
  shape,
  layout_x,
  layout_y,
  layout_width,
  layout_height,
  active
)
values
  ('t1', 'Table 1', 4, 'window', 'rect-wide', 18, 81, 20, 12, true),
  ('t2', 'Table 2', 4, 'window', 'rect-wide', 17, 49, 20, 11, true),
  ('t3', 'Table 3', 4, 'window', 'rect-wide', 18, 21, 18, 12, true),
  ('t4', 'Table 4', 2, 'center', 'rect-mid', 40, 21, 13, 11, true),
  ('t5', 'Table 5', 2, 'center', 'rect-mid', 57, 21, 11, 11, true),
  ('t6', 'Table 6', 6, 'center', 'round', 47, 56, 14, 14, true),
  ('t7', 'Table 7', 6, 'patio', 'rect-tall', 82, 40, 18, 48, true),
  ('t8', 'Table 8', 6, 'patio', 'rect-wide', 73, 80, 22, 12, true),
  ('t9', 'Table 9', 4, 'center', 'rect-mid', 37, 82, 14, 10, true),
  ('t10', 'Table 10', 2, 'center', 'rect-mid', 60, 82, 10, 9, true)
on conflict (id) do update set
  label = excluded.label,
  capacity = excluded.capacity,
  zone = excluded.zone,
  shape = excluded.shape,
  layout_x = excluded.layout_x,
  layout_y = excluded.layout_y,
  layout_width = excluded.layout_width,
  layout_height = excluded.layout_height,
  active = excluded.active,
  updated_at = now();

update public.reservations
set table_id = lower((regexp_match(coalesce(special_request, ''), '\[table=([a-z0-9_-]+)\]', 'i'))[1])
where table_id is null
  and special_request is not null
  and regexp_match(coalesce(special_request, ''), '\[table=([a-z0-9_-]+)\]', 'i') is not null;

do $$
begin
  if not exists (select 1 from public.reservations where table_id is null) then
    alter table public.reservations alter column table_id set not null;
  end if;
end;
$$;

create table if not exists public.reservation_settings (
  id smallint primary key default 1 check (id = 1),
  opening_time time not null default '10:00',
  closing_time time not null default '22:00',
  slot_interval_minutes integer not null default 30 check (slot_interval_minutes in (15, 30, 60)),
  max_party_size integer not null default 6 check (max_party_size between 1 and 20),
  max_advance_days integer not null default 30 check (max_advance_days between 1 and 365),
  total_capacity integer not null default 24 check (total_capacity > 0),
  timezone text not null default 'Asia/Kolkata',
  updated_at timestamptz not null default now()
);

insert into public.reservation_settings (
  id,
  opening_time,
  closing_time,
  slot_interval_minutes,
  max_party_size,
  max_advance_days,
  total_capacity,
  timezone
)
values (1, '10:00', '22:00', 30, 6, 30, 24, 'Asia/Kolkata')
on conflict (id) do update set
  opening_time = excluded.opening_time,
  closing_time = excluded.closing_time,
  slot_interval_minutes = excluded.slot_interval_minutes,
  max_party_size = excluded.max_party_size,
  max_advance_days = excluded.max_advance_days,
  total_capacity = excluded.total_capacity,
  timezone = excluded.timezone,
  updated_at = now();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

DROP TRIGGER IF EXISTS reservations_touch_updated_at ON public.reservations;
create trigger reservations_touch_updated_at
before update on public.reservations
for each row
execute procedure public.touch_updated_at();

DROP TRIGGER IF EXISTS reservation_settings_touch_updated_at ON public.reservation_settings;
create trigger reservation_settings_touch_updated_at
before update on public.reservation_settings
for each row
execute procedure public.touch_updated_at();

DROP TRIGGER IF EXISTS restaurant_tables_touch_updated_at ON public.restaurant_tables;
create trigger restaurant_tables_touch_updated_at
before update on public.restaurant_tables
for each row
execute procedure public.touch_updated_at();

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

create or replace function public.mark_past_reservations_completed()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.reservations
  set status = 'completed',
      completed_at = coalesce(completed_at, now()),
      updated_at = now()
  where status = 'confirmed'
    and (
      reservation_date < current_date
      or (reservation_date = current_date and reservation_time < current_time)
    );
end;
$$;

create or replace function public.seats_booked_at_slot(
  p_reservation_date date,
  p_reservation_time time,
  p_ignore_reservation_id uuid default null
)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(r.party_size), 0)::integer
  from public.reservations r
  where r.reservation_date = p_reservation_date
    and r.reservation_time = p_reservation_time
    and r.status in ('pending', 'confirmed')
    and (p_ignore_reservation_id is null or r.id <> p_ignore_reservation_id);
$$;

create or replace function public.is_valid_reservation_slot(
  p_reservation_date date,
  p_reservation_time time,
  p_party_size integer
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_settings public.reservation_settings%rowtype;
  v_open_minutes integer;
  v_close_minutes integer;
  v_time_minutes integer;
begin
  select * into v_settings
  from public.reservation_settings
  where id = 1;

  if not found then
    return false;
  end if;

  if p_party_size < 1 or p_party_size > v_settings.max_party_size then
    return false;
  end if;

  if p_reservation_date < current_date then
    return false;
  end if;

  if p_reservation_date > current_date + v_settings.max_advance_days then
    return false;
  end if;

  if p_reservation_time < v_settings.opening_time or p_reservation_time > v_settings.closing_time then
    return false;
  end if;

  v_open_minutes := extract(hour from v_settings.opening_time)::integer * 60
    + extract(minute from v_settings.opening_time)::integer;
  v_close_minutes := extract(hour from v_settings.closing_time)::integer * 60
    + extract(minute from v_settings.closing_time)::integer;
  v_time_minutes := extract(hour from p_reservation_time)::integer * 60
    + extract(minute from p_reservation_time)::integer;

  if v_time_minutes < v_open_minutes or v_time_minutes > v_close_minutes then
    return false;
  end if;

  if (v_time_minutes - v_open_minutes) % v_settings.slot_interval_minutes <> 0 then
    return false;
  end if;

  if p_reservation_date = current_date and p_reservation_time <= current_time then
    return false;
  end if;

  return true;
end;
$$;

create or replace function public.create_reservation(
  p_guest_name text,
  p_guest_email text,
  p_phone text,
  p_party_size integer,
  p_reservation_date date,
  p_reservation_time time,
  p_table_id text,
  p_special_request text default null
)
returns public.reservations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_settings public.reservation_settings%rowtype;
  v_table public.restaurant_tables%rowtype;
  v_booked integer;
  v_reservation public.reservations;
  v_slot_key text;
  v_table_slot_taken boolean;
begin
  if v_user_id is null then
    raise exception 'Authentication required.';
  end if;

  perform public.mark_past_reservations_completed();

  select * into v_settings
  from public.reservation_settings
  where id = 1;

  if not found then
    raise exception 'Reservation settings are not configured.';
  end if;

  if not public.is_valid_reservation_slot(p_reservation_date, p_reservation_time, p_party_size) then
    raise exception 'Selected date, time, or party size is invalid.';
  end if;

  select * into v_table
  from public.restaurant_tables
  where id = lower(trim(coalesce(p_table_id, '')))
    and active = true;

  if not found then
    raise exception 'Selected table does not exist.';
  end if;

  if p_party_size > v_table.capacity then
    raise exception 'Selected table capacity exceeded.';
  end if;

  v_slot_key := p_reservation_date::text || '|' || p_reservation_time::text;
  perform pg_advisory_xact_lock(hashtext(v_slot_key));
  perform pg_advisory_xact_lock(hashtext(v_slot_key || '|' || v_table.id));

  select exists (
    select 1
    from public.reservations r
    where r.reservation_date = p_reservation_date
      and r.reservation_time = p_reservation_time
      and r.table_id = v_table.id
      and r.status in ('pending', 'confirmed')
  ) into v_table_slot_taken;

  if v_table_slot_taken then
    raise exception 'Selected table is already booked for this slot.';
  end if;

  v_booked := public.seats_booked_at_slot(p_reservation_date, p_reservation_time, null);

  if v_booked + p_party_size > v_settings.total_capacity then
    raise exception 'No seats available for selected slot.';
  end if;

  insert into public.reservations (
    user_id,
    table_id,
    guest_name,
    guest_email,
    phone,
    party_size,
    reservation_date,
    reservation_time,
    special_request,
    status,
    created_at,
    updated_at,
    cancelled_at,
    completed_at
  )
  values (
    v_user_id,
    v_table.id,
    trim(p_guest_name),
    nullif(trim(coalesce(p_guest_email, '')), ''),
    trim(p_phone),
    p_party_size,
    p_reservation_date,
    p_reservation_time,
    nullif(trim(coalesce(p_special_request, '')), ''),
    'confirmed',
    now(),
    now(),
    null,
    null
  )
  returning * into v_reservation;

  return v_reservation;
end;
$$;

create or replace function public.update_reservation(
  p_reservation_id uuid,
  p_guest_name text,
  p_guest_email text,
  p_phone text,
  p_party_size integer,
  p_reservation_date date,
  p_reservation_time time,
  p_table_id text,
  p_special_request text default null
)
returns public.reservations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_settings public.reservation_settings%rowtype;
  v_table public.restaurant_tables%rowtype;
  v_existing public.reservations;
  v_booked integer;
  v_table_slot_taken boolean;
  v_updated public.reservations;
  v_old_slot_key text;
  v_new_slot_key text;
begin
  if v_user_id is null then
    raise exception 'Authentication required.';
  end if;

  perform public.mark_past_reservations_completed();

  select * into v_existing
  from public.reservations
  where id = p_reservation_id;

  if not found then
    raise exception 'Reservation not found.';
  end if;

  if v_existing.user_id <> v_user_id and not public.is_admin(v_user_id) then
    raise exception 'You do not have permission to update this reservation.';
  end if;

  if v_existing.status in ('cancelled', 'completed') then
    raise exception 'This reservation can no longer be updated.';
  end if;

  if not public.is_valid_reservation_slot(p_reservation_date, p_reservation_time, p_party_size) then
    raise exception 'Selected date, time, or party size is invalid.';
  end if;

  select * into v_table
  from public.restaurant_tables
  where id = lower(trim(coalesce(p_table_id, '')))
    and active = true;

  if not found then
    raise exception 'Selected table does not exist.';
  end if;

  if p_party_size > v_table.capacity then
    raise exception 'Selected table capacity exceeded.';
  end if;

  select * into v_settings
  from public.reservation_settings
  where id = 1;

  if not found then
    raise exception 'Reservation settings are not configured.';
  end if;

  v_old_slot_key := v_existing.reservation_date::text || '|' || v_existing.reservation_time::text;
  v_new_slot_key := p_reservation_date::text || '|' || p_reservation_time::text;

  if v_old_slot_key <= v_new_slot_key then
    perform pg_advisory_xact_lock(hashtext(v_old_slot_key));
    if v_new_slot_key <> v_old_slot_key then
      perform pg_advisory_xact_lock(hashtext(v_new_slot_key));
    end if;
  else
    perform pg_advisory_xact_lock(hashtext(v_new_slot_key));
    perform pg_advisory_xact_lock(hashtext(v_old_slot_key));
  end if;

  perform pg_advisory_xact_lock(hashtext(v_new_slot_key || '|' || v_table.id));

  select exists (
    select 1
    from public.reservations r
    where r.reservation_date = p_reservation_date
      and r.reservation_time = p_reservation_time
      and r.table_id = v_table.id
      and r.status in ('pending', 'confirmed')
      and r.id <> p_reservation_id
  ) into v_table_slot_taken;

  if v_table_slot_taken then
    raise exception 'Selected table is already booked for this slot.';
  end if;

  v_booked := public.seats_booked_at_slot(p_reservation_date, p_reservation_time, p_reservation_id);

  if v_booked + p_party_size > v_settings.total_capacity then
    raise exception 'No seats available for selected slot.';
  end if;

  update public.reservations
  set guest_name = trim(p_guest_name),
      table_id = v_table.id,
      guest_email = nullif(trim(coalesce(p_guest_email, '')), ''),
      phone = trim(p_phone),
      party_size = p_party_size,
      reservation_date = p_reservation_date,
      reservation_time = p_reservation_time,
      special_request = nullif(trim(coalesce(p_special_request, '')), ''),
      status = 'confirmed',
      cancelled_at = null,
      completed_at = null,
      updated_at = now()
  where id = p_reservation_id
  returning * into v_updated;

  return v_updated;
end;
$$;

create or replace function public.cancel_reservation(
  p_reservation_id uuid
)
returns public.reservations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_existing public.reservations;
  v_updated public.reservations;
begin
  if v_user_id is null then
    raise exception 'Authentication required.';
  end if;

  select * into v_existing
  from public.reservations
  where id = p_reservation_id;

  if not found then
    raise exception 'Reservation not found.';
  end if;

  if v_existing.user_id <> v_user_id and not public.is_admin(v_user_id) then
    raise exception 'You do not have permission to cancel this reservation.';
  end if;

  if v_existing.status in ('cancelled', 'completed') then
    raise exception 'This reservation can no longer be cancelled.';
  end if;

  update public.reservations
  set status = 'cancelled',
      cancelled_at = now(),
      updated_at = now()
  where id = p_reservation_id
  returning * into v_updated;

  return v_updated;
end;
$$;

create or replace function public.reschedule_reservation(
  p_reservation_id uuid,
  p_guest_name text,
  p_guest_email text,
  p_phone text,
  p_party_size integer,
  p_reservation_date date,
  p_reservation_time time,
  p_table_id text,
  p_special_request text default null
)
returns public.reservations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_existing public.reservations;
  v_new public.reservations;
begin
  if v_user_id is null then
    raise exception 'Authentication required.';
  end if;

  select *
  into v_existing
  from public.reservations
  where id = p_reservation_id
  for update;

  if not found then
    raise exception 'Reservation not found.';
  end if;

  if v_existing.user_id <> v_user_id and not public.is_admin(v_user_id) then
    raise exception 'You do not have permission to update this reservation.';
  end if;

  if v_existing.status in ('cancelled', 'completed') then
    raise exception 'This reservation can no longer be updated.';
  end if;

  update public.reservations
  set status = 'cancelled',
      cancelled_at = now(),
      updated_at = now()
  where id = p_reservation_id;

  select *
  into v_new
  from public.create_reservation(
    p_guest_name,
    p_guest_email,
    p_phone,
    p_party_size,
    p_reservation_date,
    p_reservation_time,
    p_table_id,
    p_special_request
  );

  return v_new;
end;
$$;

create or replace function public.get_slot_availability(
  p_reservation_date date,
  p_party_size integer default 2
)
returns table (
  slot_time time,
  available_seats integer,
  is_available boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_settings public.reservation_settings%rowtype;
  v_open_minutes integer;
  v_close_minutes integer;
  v_slot_minutes integer;
  v_slot_time time;
  v_booked integer;
  v_remaining integer;
  v_effective_party_size integer;
begin
  select * into v_settings
  from public.reservation_settings
  where id = 1;

  if not found or p_reservation_date is null then
    return;
  end if;

  if p_reservation_date < current_date then
    return;
  end if;

  if p_reservation_date > current_date + v_settings.max_advance_days then
    return;
  end if;

  v_effective_party_size := greatest(1, p_party_size);

  v_open_minutes := extract(hour from v_settings.opening_time)::integer * 60
    + extract(minute from v_settings.opening_time)::integer;
  v_close_minutes := extract(hour from v_settings.closing_time)::integer * 60
    + extract(minute from v_settings.closing_time)::integer;

  for v_slot_minutes in v_open_minutes..v_close_minutes by v_settings.slot_interval_minutes loop
    v_slot_time := make_time((v_slot_minutes / 60)::integer, (v_slot_minutes % 60)::integer, 0);
    v_booked := public.seats_booked_at_slot(p_reservation_date, v_slot_time, null);
    v_remaining := greatest(v_settings.total_capacity - v_booked, 0);

    slot_time := v_slot_time;
    available_seats := v_remaining;
    is_available :=
      v_remaining >= v_effective_party_size
      and v_effective_party_size <= v_settings.max_party_size
      and not (p_reservation_date = current_date and v_slot_time <= current_time);

    return next;
  end loop;
end;
$$;

create index if not exists reservations_user_date_idx
  on public.reservations (user_id, reservation_date, reservation_time);

create index if not exists reservations_slot_status_idx
  on public.reservations (reservation_date, reservation_time, status);

create index if not exists reservations_status_idx
  on public.reservations (status);

create index if not exists reservations_table_id_idx
  on public.reservations (table_id);

create unique index if not exists reservations_unique_active_table_slot_idx
  on public.reservations (reservation_date, reservation_time, table_id)
  where status in ('pending', 'confirmed');

revoke all on function public.create_reservation(text, text, text, integer, date, time, text, text) from public;
revoke all on function public.update_reservation(uuid, text, text, text, integer, date, time, text, text) from public;
revoke all on function public.reschedule_reservation(uuid, text, text, text, integer, date, time, text, text) from public;
revoke all on function public.cancel_reservation(uuid) from public;
revoke all on function public.get_slot_availability(date, integer) from public;
revoke all on function public.mark_past_reservations_completed() from public;

grant execute on function public.create_reservation(text, text, text, integer, date, time, text, text) to authenticated;
grant execute on function public.update_reservation(uuid, text, text, text, integer, date, time, text, text) to authenticated;
grant execute on function public.reschedule_reservation(uuid, text, text, text, integer, date, time, text, text) to authenticated;
grant execute on function public.cancel_reservation(uuid) to authenticated;
grant execute on function public.get_slot_availability(date, integer) to authenticated;
grant execute on function public.mark_past_reservations_completed() to authenticated;

alter table public.profiles enable row level security;
alter table public.menu_items enable row level security;
alter table public.gallery_items enable row level security;
alter table public.reviews enable row level security;
alter table public.contact_messages enable row level security;
alter table public.reservations enable row level security;
alter table public.reservation_settings enable row level security;
alter table public.restaurant_tables enable row level security;

DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins update profiles" ON public.profiles;

create policy "Users view own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "Admins view all profiles"
on public.profiles
for select
to authenticated
using (public.is_admin(auth.uid()));

create policy "Admins update profiles"
on public.profiles
for update
to authenticated
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
to authenticated
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
to authenticated
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
to authenticated
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
to authenticated
using (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users view own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users create own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users update own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Admins manage reservations" ON public.reservations;

create policy "Users view own reservations"
on public.reservations
for select
to authenticated
using (auth.uid() = user_id);

create policy "Admins manage reservations"
on public.reservations
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Authenticated read reservation settings" ON public.reservation_settings;
DROP POLICY IF EXISTS "Admins manage reservation settings" ON public.reservation_settings;

create policy "Authenticated read reservation settings"
on public.reservation_settings
for select
to authenticated
using (true);

create policy "Admins manage reservation settings"
on public.reservation_settings
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Authenticated read restaurant tables" ON public.restaurant_tables;
DROP POLICY IF EXISTS "Admins manage restaurant tables" ON public.restaurant_tables;

create policy "Authenticated read restaurant tables"
on public.restaurant_tables
for select
to authenticated
using (active = true or public.is_admin(auth.uid()));

create policy "Admins manage restaurant tables"
on public.restaurant_tables
for all
to authenticated
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
