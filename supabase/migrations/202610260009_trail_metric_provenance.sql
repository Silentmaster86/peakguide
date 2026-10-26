-- Add provenance fields for trail metrics.
-- These fields store the source and verification date independently
-- for distance, elevation gain and estimated route time.

begin;

alter table public.trails
  add column if not exists distance_source_url text,
  add column if not exists distance_verified_at timestamptz,
  add column if not exists elevation_gain_source_url text,
  add column if not exists elevation_gain_verified_at timestamptz,
  add column if not exists time_source_url text,
  add column if not exists time_verified_at timestamptz;

commit;