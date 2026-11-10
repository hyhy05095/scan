-- Scan: 인식 로그 (사진은 저장하지 않음)
-- Supabase SQL Editor에서 실행. sql/schema.sql(stores) 이후에 실행할 것.

create table if not exists scan_logs (
  id                 bigint generated always as identity primary key,
  created_at         timestamptz not null default now(),
  lat                double precision not null,
  lng                double precision not null,
  accuracy           double precision,
  sign_text          text,
  store_id           bigint references stores(id) on delete set null,  -- 모델이 고른 가게 (none이면 null)
  confidence         real,
  user_corrected     boolean not null default false,                   -- 사용자가 후보 화면에서 직접 고름
  corrected_store_id bigint references stores(id) on delete set null,  -- 사용자가 고른 가게
  lang               text
);

create index if not exists scan_logs_created_at_idx on scan_logs (created_at desc);

-- RLS 켜고 정책은 만들지 않음 → anon/authenticated는 읽기·쓰기 불가, 서버의 secret(service role) 키로만 접근
alter table scan_logs enable row level security;
