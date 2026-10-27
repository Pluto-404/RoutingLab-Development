-- RoutingLab Sprint 5: Run once inside Supabase SQL Editor.
-- Security model: client is never allowed to choose its own teacher role.
create extension if not exists pgcrypto;
create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text not null default 'Siswa',
 role text not null default 'siswa' check (role in ('siswa','guru')),
 created_at timestamptz not null default now()
);
create table if not exists public.classes (
 id uuid primary key default gen_random_uuid(),
 name text not null check (length(name) between 2 and 100),
 code text not null unique,
 teacher_id uuid not null references public.profiles(id),
 created_at timestamptz not null default now()
);
create table if not exists public.class_memberships (
 class_id uuid not null references public.classes(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 joined_at timestamptz not null default now(),
 primary key (class_id,user_id)
);
create table if not exists public.user_progress (
 user_id uuid not null references public.profiles(id) on delete cascade,
 activity text not null check (activity in ('materi','visualisasi','miniLab','troubleshooting','evaluasi','cliLab')),
 percent integer not null check (percent between 0 and 100),
 updated_at timestamptz not null default now(),
 primary key (user_id,activity)
);
create or replace function public.create_profile_on_signup() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
 insert into public.profiles(id,full_name,role)
 values(new.id, coalesce(nullif(left(trim(new.raw_user_meta_data->>'full_name'),100),''),'Siswa'),'siswa')
 on conflict (id) do nothing;
 return new;
end $$;
drop trigger if exists routinglab_new_user on auth.users;
create trigger routinglab_new_user after insert on auth.users for each row execute function public.create_profile_on_signup();
-- Reconcile previously created accounts; every account is student by default.
insert into public.profiles(id,full_name,role)
select id,coalesce(nullif(left(trim(raw_user_meta_data->>'full_name'),100),''),'Siswa'),'siswa'
from auth.users on conflict (id) do nothing;

alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.class_memberships enable row level security;
alter table public.user_progress enable row level security;

-- Profiles readable only by owner; classroom-roster access will be added in later sprint.
drop policy if exists profile_read_self on public.profiles;
create policy profile_read_self on public.profiles for select to authenticated using (id=(select auth.uid()));
-- No client writes to profiles: teacher promotion must happen in SQL admin tools.

drop policy if exists teacher_classes on public.classes;
create policy teacher_classes on public.classes for select to authenticated using (teacher_id=(select auth.uid()));
-- Student can see only classes explicitly joined; security-definer function below handles code joins.
drop policy if exists student_classes on public.classes;
create policy student_classes on public.classes for select to authenticated using (
 exists(select 1 from public.class_memberships m where m.class_id=classes.id and m.user_id=(select auth.uid()))
);
drop policy if exists membership_self_read on public.class_memberships;
create policy membership_self_read on public.class_memberships for select to authenticated using(user_id=(select auth.uid()));
-- Membership writes solely by secure RPC.
drop policy if exists progress_self_read on public.user_progress;
create policy progress_self_read on public.user_progress for select to authenticated using(user_id=(select auth.uid()));
drop policy if exists progress_self_insert on public.user_progress;
create policy progress_self_insert on public.user_progress for insert to authenticated with check (
 user_id=(select auth.uid()) and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='siswa')
);
drop policy if exists progress_self_update on public.user_progress;
create policy progress_self_update on public.user_progress for update to authenticated
 using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
-- IMPORTANT: these progress values are self-reported DEMO practice only, not trusted grades.
create or replace function public.create_class(p_name text) returns text
language plpgsql security definer set search_path='' as $$
declare new_code text; who uuid;
begin
 who:=auth.uid();
 if who is null or not exists(select 1 from public.profiles where id=who and role='guru') then
  raise exception 'Hanya akun guru yang bisa membuat kelas';
 end if;
 if length(trim(coalesce(p_name,''))) < 2 or length(trim(p_name))>100 then
  raise exception 'Nama kelas harus 2–100 karakter';
 end if;
 new_code := upper(encode(extensions.gen_random_bytes(6),'hex'));
 insert into public.classes(name,code,teacher_id) values(trim(p_name),new_code,who);
 return new_code;
end $$;
create or replace function public.join_class(p_code text) returns void
language plpgsql security definer set search_path='' as $$
declare cid uuid; who uuid;
begin
 who:=auth.uid();
 if who is null or not exists(select 1 from public.profiles where id=who and role='siswa') then
  raise exception 'Hanya siswa yang dapat bergabung ke kelas';
 end if;
 select id into cid from public.classes where code=upper(trim(coalesce(p_code,'')));
 if cid is null then raise exception 'Kode kelas tidak ditemukan'; end if;
 insert into public.class_memberships(class_id,user_id) values(cid,who) on conflict do nothing;
end $$;
revoke all on function public.create_class(text) from public,anon;
revoke all on function public.join_class(text) from public,anon;
grant execute on function public.create_class(text) to authenticated;
grant execute on function public.join_class(text) to authenticated;
-- Teachers bootstrap manually (after signup) in SQL Editor:
-- update public.profiles set role='guru' where id='UUID_GURU_DARI_AUTH_USERS';
