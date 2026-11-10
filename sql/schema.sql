-- Scan: Supabase schema
-- Supabase SQL Editor에서 실행

create extension if not exists postgis;

create table if not exists stores (
  id              bigint generated always as identity primary key,
  kakao_id        text unique not null,
  name_ko         text not null,
  name_en         text,
  category        text,
  lat             double precision not null,
  lng             double precision not null,
  -- lat/lng에서 자동 생성 (직접 입력하지 않음)
  geom            geography(Point, 4326)
                  generated always as (st_setsrid(st_makepoint(lng, lat), 4326)::geography) stored,
  google_place_id text,
  rating          numeric(2, 1),
  review_count    integer,
  info            jsonb not null default '{}'::jsonb,  -- 대표 메뉴, 비건 단계, 리뷰 요약, 다국어 텍스트 등
  is_curated      boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists stores_geom_idx on stores using gist (geom);

-- 주변 가게 후보: 거리순, 기본 15개 (max_count로 최대 50)
drop function if exists nearby_stores(double precision, double precision, double precision);
drop function if exists nearby_stores(double precision, double precision, double precision, integer);

create or replace function nearby_stores(
  lat double precision,
  lng double precision,
  radius_m double precision default 150,
  max_count integer default 15
)
returns table (
  id         bigint,
  name_ko    text,
  name_en    text,
  category   text,
  lat        double precision,
  lng        double precision,
  distance_m double precision,
  info       jsonb,
  is_curated boolean
)
language sql
stable
as $$
  with p as (
    select st_setsrid(st_makepoint(nearby_stores.lng, nearby_stores.lat), 4326)::geography as g
  )
  select s.id, s.name_ko, s.name_en, s.category, s.lat, s.lng,
         st_distance(s.geom, p.g) as distance_m,
         s.info, s.is_curated
  from stores s, p
  where st_dwithin(s.geom, p.g, nearby_stores.radius_m)
  order by s.geom <-> p.g
  limit least(greatest(coalesce(nearby_stores.max_count, 15), 1), 50);
$$;

-- RLS: 공개 읽기만 허용, 쓰기는 service_role(수집 스크립트)만
alter table stores enable row level security;

drop policy if exists "stores public read" on stores;
create policy "stores public read" on stores for select using (true);
