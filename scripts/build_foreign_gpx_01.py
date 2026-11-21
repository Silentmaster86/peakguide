"""Build ASCII-only, guarded geometry upgrades for the first two foreign trails."""
import argparse
from datetime import datetime, timedelta
import hashlib
import json
import math
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT / 'docs/catalogue/foreign-gpx-01'
FIELDS = ['route_geometry', 'gpx_url', 'geometry_source_url', 'geometry_verified_at']


def load_changes():
    changes = json.loads((FOLDER / 'changes.json').read_text(encoding='utf-8'))
    assert [(c['id'], c['slug'], c['peak_id']) for c in changes] == [
        (8, 'hoverla-mountain-trail', 148), (10, 'krivan-tri-studnicky-loop', 150)]
    for c in changes:
        assert set(c['after']) == set(FIELDS)
        assert all(c['before']['row'][k] is None for k in FIELDS)
        assert [i['lang'] for i in c['before']['i18n']] == ['en', 'pl', 'ua', 'zh']
        g = c['after']['route_geometry']
        assert g['type'] == 'MultiLineString' and len(g['coordinates']) == c['source']['segments']
        assert sum(map(len, g['coordinates'])) == c['source']['points']
        for line in g['coordinates']:
            assert len(line) >= 2
            for p in line:
                assert len(p) == 2 and all(math.isfinite(v) for v in p)
                assert -180 <= p[0] <= 180 and -90 <= p[1] <= 90
        assert c['after']['gpx_url'] == c['source']['gpx_url']
    return changes


READ = """
 perform 1 from public.trails where id=saved_id for update;
 perform 1 from public.trails_i18n i where i.trail_id=saved_id order by i.lang collate "C" for update;
 select jsonb_build_object('row',to_jsonb(t),'i18n',coalesce((select jsonb_agg(to_jsonb(i) order by i.lang collate "C") from public.trails_i18n i where i.trail_id=t.id),'[]')) into actual from public.trails t where t.id=saved_id;
"""
HEADER = """-- Geometry only. ASCII-only SQL. Read README.md and keep a backup before applying.
begin;
set local lock_timeout='5s';
do $upgrade$
declare changes jsonb=$changes$PAYLOAD$changes$::jsonb;
 receipt jsonb; entry jsonb; change jsonb; actual jsonb; expected jsonb; previous jsonb;
 result jsonb='[]'::jsonb; saved_id bigint;
begin
 perform pg_advisory_xact_lock(251121,1);
 if to_regclass('peakguide_private.catalogue_batch_receipts') is null then raise exception 'Catalogue receipt table missing; review required'; end if;
 select snapshot into receipt from peakguide_private.catalogue_batch_receipts where batch_key='foreign-gpx-01' for update;
"""
VERIFY_RECEIPT = """
 if jsonb_typeof(receipt)<>'array' or jsonb_array_length(receipt)<>2 then raise exception 'Incomplete foreign GPX receipt'; end if;
 if (select count(distinct e->>'id') from jsonb_array_elements(receipt) e)<>2 then raise exception 'Duplicate foreign GPX receipt entries'; end if;
 for entry in select value from jsonb_array_elements(receipt) loop
 saved_id=(entry->>'id')::bigint;
 if not exists(select from jsonb_array_elements(changes) c where (c->>'id')::bigint=saved_id and c->>'slug'=entry->>'slug') then raise exception 'Unexpected foreign GPX receipt identity'; end if;
""" + READ + """
 if actual is distinct from entry->'snapshot' then raise exception 'Upgraded trail changed: %',saved_id; end if;
 end loop;
"""


def generate(changes):
    payload = json.dumps(changes, ensure_ascii=True, separators=(',', ':'))
    assert '$changes$' not in payload
    header = HEADER.replace('PAYLOAD', payload)
    apply = header + " if receipt is not null then\n" + VERIFY_RECEIPT + """
 raise notice 'Foreign GPX upgrade already applied; unchanged'; return;
 end if;
 for change in select value from jsonb_array_elements(changes) loop
 saved_id=(change->>'id')::bigint;
 perform 1 from public.peaks where id=(change->>'peak_id')::bigint and slug=change->>'peak_slug' and active for update;
 if not found then raise exception 'Reviewed peak missing or changed: %',change->>'peak_slug'; end if;
""" + READ + """
 -- Parse the reviewed public snapshot through the actual table types (dates/numerics).
 select jsonb_build_object('row',to_jsonb(jsonb_populate_record(null::public.trails,change->'before'->'row')),
  'i18n',(select jsonb_agg(to_jsonb(jsonb_populate_record(null::public.trails_i18n,v)) order by (v->>'lang') collate "C") from jsonb_array_elements(change->'before'->'i18n') v)) into expected;
 -- Ignore only the parent version timestamp, allowing a safe reapply after our rollback.
 -- All actual content, relationships, translations and geometry fields must still match.
 if actual is null or jsonb_set(actual,'{row}',(actual->'row')-'updated_at') is distinct from jsonb_set(expected,'{row}',(expected->'row')-'updated_at') then
  raise exception 'Reviewed trail changed: %',change->>'slug';
 end if;
 previous=actual;
 update public.trails set route_geometry=change->'after'->'route_geometry',gpx_url=change->'after'->>'gpx_url',geometry_source_url=change->'after'->>'geometry_source_url',geometry_verified_at=(change->'after'->>'geometry_verified_at')::timestamptz where id=saved_id;
""" + READ + """
 if actual->'i18n' is distinct from previous->'i18n' or
  ((actual->'row')-array['route_geometry','gpx_url','geometry_source_url','geometry_verified_at','updated_at']) is distinct from
  ((previous->'row')-array['route_geometry','gpx_url','geometry_source_url','geometry_verified_at','updated_at']) then raise exception 'Unexpected non-geometry change: %',saved_id; end if;
 result=result||jsonb_build_array(jsonb_build_object('kind','trail','id',saved_id,'slug',change->>'slug','before',previous,'snapshot',actual));
 end loop;
 insert into peakguide_private.catalogue_batch_receipts(batch_key,snapshot) values('foreign-gpx-01',result);
 raise notice 'Added full source GPX geometry to Hoverla and Krivan; existing content retained';
end $upgrade$;
commit;
"""
    rollback = header + """
 if receipt is null then raise notice 'Foreign GPX upgrade not applied'; return; end if;
""" + VERIFY_RECEIPT + """
 for entry in select value from jsonb_array_elements(receipt) loop
 saved_id=(entry->>'id')::bigint;
 update public.trails set route_geometry=nullif(entry->'before'->'row'->'route_geometry','null'::jsonb),gpx_url=entry->'before'->'row'->>'gpx_url',geometry_source_url=entry->'before'->'row'->>'geometry_source_url',geometry_verified_at=(entry->'before'->'row'->>'geometry_verified_at')::timestamptz where id=saved_id;
""" + READ + """
 if jsonb_set(actual,'{row}',(actual->'row')-'updated_at') is distinct from jsonb_set(entry->'before','{row}',(entry->'before'->'row')-'updated_at') then raise exception 'Unexpected rollback content: %',saved_id; end if;
 end loop;
 delete from peakguide_private.catalogue_batch_receipts where batch_key='foreign-gpx-01';
 raise notice 'Removed only the two foreign GPX geometry upgrades';
end $upgrade$;
commit;
"""
    # Verify only relevant properties; later legitimate text edits are not overwritten.
    checks = [{'id': c['id'], 'slug': c['slug'], 'after': c['after']} for c in changes]
    verify = """-- Read-only: before and after this upgrade. No private user data.
with expected as (select value e from jsonb_array_elements($expected$""" + json.dumps(checks, ensure_ascii=True, separators=(',', ':')) + """$expected$::jsonb))
select e->>'slug' slug,t.id,t.active,t.route_type,t.distance_km,t.time_min,t.elevation_gain_m,
 t.route_geometry is not null has_geometry,t.gpx_url,t.geometry_source_url,t.geometry_verified_at,
 t.route_geometry=e->'after'->'route_geometry' geometry_matches_review,
 t.gpx_url=e->'after'->>'gpx_url' gpx_matches_review,
 (select array_agg(i.lang order by i.lang collate "C") from public.trails_i18n i where trail_id=t.id) languages,
 exists(select from peakguide_private.catalogue_batch_receipts where batch_key='foreign-gpx-01') upgrade_applied
from expected left join public.trails t on t.id=(e->>'id')::bigint and t.slug=e->>'slug'
order by e->>'slug';
"""
    return {'apply.sql': apply, 'rollback.sql': rollback, 'verify.sql': verify}


def semantic_gpx_hash(raw, time_policy):
    tree = ET.fromstring(raw, parser=ET.XMLParser(target=ET.TreeBuilder(insert_comments=True)))
    if time_policy == 'mapa_relative_export_times':
        assert tree.attrib.get('creator') == 'https://mapa-turystyczna.pl'
        ns = {'g': 'http://www.topografix.com/GPX/1/1'}
        stamp = tree.find('g:metadata/g:time', ns)
        assert stamp is not None and stamp.text, 'Missing expected export timestamp'
        base = datetime.fromisoformat(stamp.text)
        assert base.tzinfo is not None
        # The planner shifts every timestamp with the export time. Preserve all
        # relative timing, coordinates, elevation, attribution and comments.
        times = [e for e in tree.iter() if isinstance(e.tag, str) and e.tag.split('}')[-1] == 'time']
        for element in times:
            value = datetime.fromisoformat(element.text)
            assert value.tzinfo is not None
            element.text = str((value - base) // timedelta(microseconds=1))
    else:
        assert time_policy == 'none'
    canonical = ET.canonicalize(ET.tostring(tree, encoding='unicode'), strip_text=True, with_comments=True)
    return hashlib.sha256(canonical.encode('utf-8')).hexdigest()


def check_sources(changes):
    for c in changes:
        req = urllib.request.Request(c['source']['gpx_url'], headers={'User-Agent': 'Mozilla/5.0'})
        raw = urllib.request.urlopen(req, timeout=30).read()
        assert semantic_gpx_hash(raw, c['source']['time_policy']) == c['source']['semantic_sha256'], f"Provider content changed: {c['slug']}"
        tree = ET.fromstring(raw)
        ns = {'g': 'http://www.topografix.com/GPX/1/1'}
        lines = [[[float(p.attrib['lon']), float(p.attrib['lat'])] for p in seg.findall('g:trkpt', ns)]
                 for seg in tree.findall('g:trk/g:trkseg', ns)]
        assert lines == c['after']['route_geometry']['coordinates'], c['slug']
        print(f"Source GPX matches every coordinate and semantic fingerprint: {c['slug']}")


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    parser.add_argument('--check-sources', action='store_true')
    args = parser.parse_args()
    changes = load_changes()
    for name, text in generate(changes).items():
        assert text.isascii()
        path = FOLDER / name
        if args.check:
            assert path.read_text(encoding='ascii') == text, f'Stale {path}'
        else:
            path.write_text(text, encoding='ascii')
    if args.check_sources:
        check_sources(changes)
