-- nearby_stores v2: max_count 파라미터 추가 (기본 15, 최대 50)
-- Supabase SQL Editor에서 실행. 기존 3인자 함수를 지우고 4인자로 다시 만든다.
-- 3인자로 호출하던 코드(max_count 생략)는 그대로 동작한다.

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
