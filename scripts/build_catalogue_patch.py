"""Generate a reviewable, guarded SQL data patch; never connect to a database."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REVIEW = ROOT / 'docs/audit/2026-11-14'


def build(reverse=False):
    rows = json.loads((REVIEW / 'catalogue-changes.json').read_text())
    if reverse:
        rows = [{**r, 'before': r['after'], 'after': r['before']} for r in rows]
    payload = json.dumps(rows, ensure_ascii=False)
    return '''-- Reviewed public catalogue corrections. See docs/audit/2026-11-14/README.md.
-- Atomic: any missing/edited row aborts the entire patch. Re-running is a no-op.
-- Run only after reviewing the source evidence and taking a fresh backup.
begin;
set local lock_timeout = '5s';
do $patch$
declare
  change jsonb;
  current_row jsonb;
  comparable jsonb;
  applied integer := 0;
begin
  -- Anchor identities before touching translations; preserve existing URLs.
  perform 1 from public.peaks where id = 71 and slug = 'lakowa-wyspowy'
    and range_id = (select id from public.mountain_ranges where slug = 'beskid-wyspowy') for update;
  if not found then raise exception 'Lyżka identity changed; review required'; end if;
  perform 1 from public.peaks where id = 10 and slug = 'waligora' for update;
  if not found then raise exception 'Waligora identity changed; review required'; end if;
  for change in select value from jsonb_array_elements($data$''' + payload + '''$data$::jsonb) loop
    current_row := null;
    case change->>'table'
    when 'peaks' then
      select to_jsonb(p) into current_row from public.peaks p
      where id = (change->'key'->>'id')::bigint for update;
    when 'peaks_i18n' then
      select to_jsonb(p) into current_row from public.peaks_i18n p
      where peak_id = (change->'key'->>'peak_id')::bigint
        and lang = change->'key'->>'lang' for update;
    when 'trails_i18n' then
      select to_jsonb(t) into current_row from public.trails_i18n t
      where trail_id = (change->'key'->>'trail_id')::bigint
        and lang = change->'key'->>'lang' for update;
    else raise exception 'Unsupported table';
    end case;
    if current_row is null then raise exception 'Missing row: %', change->'key'; end if;
    select jsonb_object_agg(k, current_row->k) into comparable
      from jsonb_object_keys(change->'before') as keys(k);
    if comparable = change->'after' then continue; end if;
    if comparable is distinct from change->'before' then
      raise exception 'Row edited since review: % %', change->>'table', change->'key';
    end if;
    case change->>'table'
    when 'peaks' then
      update public.peaks set
        elevation_m = (change->'after'->>'elevation_m')::integer,
        latitude = (change->'after'->>'latitude')::numeric,
        longitude = (change->'after'->>'longitude')::numeric,
        geom = public.st_setsrid(public.st_makepoint(
          (change->'after'->>'longitude')::double precision,
          (change->'after'->>'latitude')::double precision), 4326)::public.geography
      where id = (change->'key'->>'id')::bigint;
    when 'peaks_i18n' then
      update public.peaks_i18n set description = change->'after'->>'description'
      where peak_id = (change->'key'->>'peak_id')::bigint and lang = change->'key'->>'lang';
    when 'trails_i18n' then
      update public.trails_i18n set notes = change->'after'->>'notes'
      where trail_id = (change->'key'->>'trail_id')::bigint and lang = change->'key'->>'lang';
    end case;
    applied := applied + 1;
  end loop;
  raise notice 'Catalogue rows updated: %', applied;
end $patch$;
commit;
'''


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    for name, reverse in [('apply.sql', False), ('rollback.sql', True)]:
        path = REVIEW / name
        text = build(reverse)
        if args.check:
            if not path.exists() or path.read_text() != text:
                raise SystemExit(f'Stale generated file: {path}')
        else:
            path.write_text(text)
