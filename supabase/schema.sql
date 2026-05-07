create extension if not exists pgcrypto;

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  invite_code varchar(6) not null unique,
  host_name varchar(50) not null,
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  nickname varchar(50) not null,
  is_host boolean not null default false,
  available_dates date[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists participants_room_nickname_unique
  on public.participants (room_id, lower(nickname));

create index if not exists participants_room_id_idx
  on public.participants (room_id);
