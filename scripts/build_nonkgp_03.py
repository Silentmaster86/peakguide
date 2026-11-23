"""Offline, ASCII-only import of five reviewed non-KGP trail/POI pairs."""
import argparse
import hashlib
import json
import math
import urllib.request
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor
from build_foreign_gpx_01 import semantic_gpx_hash
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT / 'docs/catalogue/nonkgp-03'
KEY = 'nonkgp-03'
FIELDS = {
 'trail': ['peak_id','slug','start_point_name','end_point_name','distance_km','elevation_gain_m','time_min','difficulty','route_type','active','source_url','last_verified_at','map_url','gpx_url','distance_source_url','distance_verified_at','elevation_gain_source_url','elevation_gain_verified_at','time_source_url','time_verified_at','route_geometry','geometry_source_url','geometry_verified_at'],
 'poi': ['peak_id','trail_id','type_id','latitude','longitude','active','source_url','last_verified_at','website_url','google_maps_url'],
}


def payload():
    peaks = json.loads((FOLDER/'peaks.json').read_text(encoding='utf-8'))
    records = json.loads((FOLDER/'records.json').read_text(encoding='utf-8'))
    assert {p['id'] for p in peaks} == {61,62,64,71,72}
    assert all(not p['is_korona'] and p['active'] for p in peaks)
    assert len(records) == 10
    for kind in FIELDS:
        rows = [r for r in records if r['kind'] == kind]
        assert {r['body']['peak_slug'] for r in rows} == {p['slug'] for p in peaks} and len(rows) == 5
    for row in records:
        assert set(row['body']['i18n']) == {'pl','en','ua','zh'}
        assert all(t['name'].strip() and t['description'].strip() for t in row['body']['i18n'].values())
        body=row['body']
        assert body['source_url'].startswith('https://')
        if row['kind']=='trail':
            assert body['route_type']=='point-to-point' and body['difficulty'] is None
            assert body['route_geometry']['type']=='MultiLineString'
            lines=body['route_geometry']['coordinates']
            assert lines and sum(map(len,lines))<=20000
            assert all(len(line)>=2 for line in lines)
            assert all(len(p)==2 and all(isinstance(v,(int,float)) and math.isfinite(v) for v in p) and 14<p[0]<25 and 48<p[1]<55 for line in lines for p in line)
            assert all(a[-1]==b[0] for a,b in zip(lines,lines[1:]))
            assert body['distance_km']>0 and body['elevation_gain_m']>=0 and body['time_min']>0
        else:
            assert body['trail_id'] is None and body['type_slug'] in {'shelter','viewpoint','attraction','transport'}
    return {'version':1, 'peaks':peaks, 'records':records, 'ranges':[{'id':17,'slug':'beskid-zywiecki'},{'id':18,'slug':'bieszczady-zachodnie'},{'id':22,'slug':'beskid-wyspowy'}]}


READ = '''
 if entry->>'kind'='trail' then
  perform 1 from public.trails where id=saved_id for update;
  perform 1 from public.trails_i18n where trail_id=saved_id order by lang collate "C" for update;
  select jsonb_build_object('row',to_jsonb(t),'i18n',coalesce((select jsonb_agg(to_jsonb(i) order by i.lang collate "C") from public.trails_i18n i where i.trail_id=t.id),'[]')) into actual from public.trails t where t.id=saved_id;
 else
  perform 1 from public.pois where id=saved_id for update;
  perform 1 from public.pois_i18n where poi_id=saved_id order by lang collate "C" for update;
  select jsonb_build_object('row',to_jsonb(p),'i18n',coalesce((select jsonb_agg(to_jsonb(i) order by i.lang collate "C") from public.pois_i18n i where i.poi_id=p.id),'[]')) into actual from public.pois p where p.id=saved_id;
 end if;
'''
CHECK_PARENTS = '''
 for identity in select value from jsonb_array_elements(manifest->'peaks') loop
  select to_jsonb(p) into actual from public.peaks p where id=(identity->>'id')::bigint for update;
  if actual is null then raise exception 'Reviewed peak missing: %',identity->>'slug'; end if;
  select jsonb_object_agg(k,actual->k) into projected from jsonb_object_keys(identity) k;
  expected=identity;
  if projected is distinct from expected then raise exception 'Reviewed peak identity changed: %',identity->>'slug'; end if;
 end loop;
 for identity in select value from jsonb_array_elements(manifest->'ranges') loop
  if not exists(select from public.mountain_ranges where id=(identity->>'id')::bigint and slug=identity->>'slug') then raise exception 'Reviewed range changed'; end if;
 end loop;
'''
CHECK_RECEIPT = '''
 if receipt->>'manifest_sha256' is distinct from manifest_hash or receipt->>'version' is distinct from '1'
    or jsonb_typeof(receipt->'records') is distinct from 'array' or jsonb_array_length(receipt->'records')<>10
    or (select count(distinct (e->>'kind',e->>'id')) from jsonb_array_elements(receipt->'records') e)<>10
    or (select count(distinct (e->>'kind',e->>'peak_id')) from jsonb_array_elements(receipt->'records') e)<>10
 then raise exception 'Incomplete or different non-KGP receipt'; end if;
 for entry in select value from jsonb_array_elements(receipt->'records') loop
  if entry->>'kind' is null or entry->>'kind' not in ('trail','poi') or not exists(select from jsonb_array_elements(manifest->'peaks') p where p->>'id'=entry->>'peak_id') then raise exception 'Unexpected receipt identity'; end if;
  saved_id=(entry->>'id')::bigint;
''' + READ + '''
  if actual is distinct from entry->'snapshot' then raise exception 'Imported record changed: % %',entry->>'kind',saved_id; end if;
 end loop;
'''
DEPENDENCIES = '''
 -- Refuse destructive CASCADE / SET NULL effects, including future referencing tables.
 -- Translation children are owned snapshots and have already been checked in full.
 for entry in select value from jsonb_array_elements(receipt->'records') loop
  saved_id=(entry->>'id')::bigint;
  target=case when entry->>'kind'='trail' then 'public.trails'::regclass else 'public.pois'::regclass end;
  for reference in
   select ns.nspname schema_name,cl.relname table_name,b.attname column_name
   from pg_constraint c
   join pg_class cl on cl.oid=c.conrelid join pg_namespace ns on ns.oid=cl.relnamespace
   join pg_attribute a on a.attrelid=c.confrelid and a.attname='id'
   join pg_attribute b on b.attrelid=c.conrelid and b.attnum=c.conkey[array_position(c.confkey,a.attnum)]
   where c.contype='f' and c.confrelid=target and a.attnum=any(c.confkey)
    and c.conrelid<>case when entry->>'kind'='trail' then 'public.trails_i18n'::regclass else 'public.pois_i18n'::regclass end
  loop
   execute format('select exists(select from %I.%I where %I=$1)',reference.schema_name,reference.table_name,reference.column_name) into linked using saved_id;
   if linked then raise exception 'Dependent records in %.%; rollback refused',reference.schema_name,reference.table_name; end if;
  end loop;
 end loop;
'''


def generate():
    data=payload()
    serialized=json.dumps(data,ensure_ascii=True,separators=(',',':'))
    assert '$manifest$' not in serialized and '$batch$' not in serialized
    digest=hashlib.sha256(serialized.encode()).hexdigest()
    header='''-- Reviewed non-KGP data. Read README.md; keep a current backup. Project owner only.
-- ASCII-only SQL; Unicode is encoded inside JSON. No network calls.
begin;
set local lock_timeout='5s';
set local timezone='UTC';
create schema if not exists peakguide_private;
create table if not exists peakguide_private.catalogue_batch_receipts(batch_key text primary key,snapshot jsonb not null,created_at timestamptz not null default now());
alter table peakguide_private.catalogue_batch_receipts enable row level security;
revoke all on peakguide_private.catalogue_batch_receipts from public,anon,authenticated;
do $batch$
declare manifest jsonb=$manifest$'''+serialized+'''$manifest$::jsonb;
 manifest_hash text='''+"'"+digest+"'"+''';
 receipt jsonb; identity jsonb; entry jsonb; body jsonb; actual jsonb; projected jsonb; expected jsonb;
 records jsonb='[]'; peak bigint; saved_id bigint; tr_lang text; tr jsonb;
 trail public.trails%rowtype; poi public.pois%rowtype; target regclass; reference record; linked boolean;
begin
 perform pg_advisory_xact_lock(251122,3);
 if to_regprocedure('public.admin_save_trail(bigint,jsonb,timestamptz)') is null then raise exception 'Apply catalogue migration 014 first'; end if;
 select snapshot into receipt from peakguide_private.catalogue_batch_receipts where batch_key='nonkgp-03' for update;
'''
    apply=header+CHECK_PARENTS+" if receipt is not null then\n"+CHECK_RECEIPT+" raise notice 'Non-KGP package already applied; unchanged'; return; end if;\n"
    apply+='''
 for identity in select value from jsonb_array_elements(manifest->'peaks') loop
  if exists(select from public.trails where peak_id=(identity->>'id')::bigint)
   or exists(select from public.pois where peak_id=(identity->>'id')::bigint) then raise exception 'Existing catalogue content; review required: %',identity->>'slug'; end if;
 end loop;
 for entry in select value from jsonb_array_elements(manifest->'records') loop
  body=entry->'body';
  select id into peak from public.peaks where slug=body->>'peak_slug' and active for update;
  if peak is null then raise exception 'Reviewed peak missing'; end if;
  body=body||jsonb_build_object('peak_id',peak);
  if entry->>'kind'='trail' then
   if exists(select from public.trails where slug=body->>'slug') then raise exception 'Trail slug already exists'; end if;
   trail=jsonb_populate_record(null::public.trails,body);
'''
    for kind,fields in FIELDS.items():
        table='trails' if kind=='trail' else 'pois'
        if kind=='poi':
            apply+='''
  else
   if (select count(*) from public.poi_types where slug=body->>'type_slug')<>1 then raise exception 'POI type missing or ambiguous'; end if;
   body=body||jsonb_build_object('type_id',(select id from public.poi_types where slug=body->>'type_slug'));
   poi=jsonb_populate_record(null::public.pois,body);
'''
        apply+=f"   insert into public.{table} ({','.join(fields)}) values ({','.join(kind+'.'+f for f in fields)}) returning id into saved_id;\n"
        extra='notes' if kind=='trail' else 'tips'
        apply+=f"   for tr_lang,tr in select key,value from jsonb_each(body->'i18n') loop\n    insert into public.{table}_i18n({kind}_id,lang,name,description,{extra}) values(saved_id,tr_lang,tr->>'name',tr->>'description',tr->>'{extra}'); end loop;\n"
    apply+='''
  end if;
''' + READ + '''
  records=records||jsonb_build_array(jsonb_build_object('kind',entry->>'kind','id',saved_id,'peak_id',peak,'snapshot',actual));
 end loop;
 insert into peakguide_private.catalogue_batch_receipts(batch_key,snapshot)values('nonkgp-03',jsonb_build_object('version',1,'manifest_sha256',manifest_hash,'records',records));
 raise notice 'Added five trails and five POIs in five languages; preserved all peak fields';
end $batch$;
commit;
'''
    rollback=header+" if receipt is null then raise notice 'Non-KGP package not applied'; return; end if;\n"+CHECK_PARENTS+CHECK_RECEIPT+DEPENDENCIES+'''
 for entry in select value from jsonb_array_elements(receipt->'records') loop
  if entry->>'kind'='poi' then delete from public.pois_i18n where poi_id=(entry->>'id')::bigint; delete from public.pois where id=(entry->>'id')::bigint; end if;
 end loop;
 for entry in select value from jsonb_array_elements(receipt->'records') loop
  if entry->>'kind'='trail' then delete from public.trails_i18n where trail_id=(entry->>'id')::bigint; delete from public.trails where id=(entry->>'id')::bigint; end if;
 end loop;
 delete from peakguide_private.catalogue_batch_receipts where batch_key='nonkgp-03';
 raise notice 'Removed only nonkgp-03 records';
end $batch$;
commit;
'''
    # The selected columns compare through actual PostgreSQL types, including dates and numerics.
    trail_fields='array['+','.join("'"+f+"'" for f in FIELDS['trail'])+']'
    poi_fields='array['+','.join("'"+f+"'" for f in FIELDS['poi'])+']'
    verify='''-- Read-only before/after import. Uses the existing catalogue receipt table.
with manifest as (select $manifest$'''+serialized+'''$manifest$::jsonb m),
expected as (select p, (select r->'body' from jsonb_array_elements(m->'records') r where r->>'kind'='trail' and r->'body'->>'peak_slug'=p->>'slug') tb,
 (select r->'body' from jsonb_array_elements(m->'records') r where r->>'kind'='poi' and r->'body'->>'peak_slug'=p->>'slug') pb
 from manifest,jsonb_array_elements(m->'peaks') p)
select e.p->>'slug' peak_slug, mr.slug range_slug,
 (select count(*) from public.trails where peak_id=p.id and active) trails,
 (select count(*) from public.pois where peak_id=p.id and active) pois,
 case when t.route_geometry is not null then 1 else 0 end mapped_trails,
 (select array_agg(lang order by lang collate "C") from public.trails_i18n where trail_id=t.id) trail_languages,
 (select array_agg(lang order by lang collate "C") from public.pois_i18n where poi_id=poi.id) poi_languages,
 coalesce((select jsonb_object_agg(k,to_jsonb(p)->k) from jsonb_object_keys(e.p) k)=e.p
 and mr.slug=(select r->>'slug' from manifest,jsonb_array_elements(m->'ranges') r where (r->>'id')::bigint=p.range_id)
 and not exists(select from unnest('''+trail_fields+''') k where to_jsonb(t)->k is distinct from to_jsonb(jsonb_populate_record(null::public.trails,e.tb||jsonb_build_object('peak_id',p.id)))->k)
 and not exists(select from unnest('''+poi_fields+''') k where to_jsonb(poi)->k is distinct from to_jsonb(jsonb_populate_record(null::public.pois,e.pb||jsonb_build_object('peak_id',p.id,'type_id',ty.id)))->k)
 and (select jsonb_object_agg(lang,jsonb_build_object('name',name,'description',description,'notes',notes)) from public.trails_i18n where trail_id=t.id)=e.tb->'i18n'
 and (select jsonb_object_agg(lang,jsonb_build_object('name',name,'description',description,'tips',tips)) from public.pois_i18n where poi_id=poi.id)=e.pb->'i18n',false) review_matches,
 exists(select from peakguide_private.catalogue_batch_receipts where batch_key='nonkgp-03' and snapshot->>'manifest_sha256'='''+"'"+digest+"'"+''' and snapshot->>'version'='1') package_applied
from expected e left join public.peaks p on p.id=(e.p->>'id')::bigint and p.slug=e.p->>'slug'
left join public.mountain_ranges mr on mr.id=p.range_id
left join public.trails t on t.peak_id=p.id and t.slug=e.tb->>'slug'
left join public.poi_types ty on ty.slug=e.pb->>'type_slug'
left join public.pois poi on poi.peak_id=p.id and poi.source_url=e.pb->>'source_url' and poi.type_id=ty.id
order by e.p->>'slug';
'''
    return {'apply.sql':apply,'rollback.sql':rollback,'verify.sql':verify}


def gpx_lines(raw):
    root=ET.fromstring(raw)
    return [[[float(p.attrib['lon']),float(p.attrib['lat'])] for p in segment if p.tag.split('}')[-1]=='trkpt']
            for segment in root.iter() if segment.tag.split('}')[-1]=='trkseg']


def check_sources():
    reviews=json.loads((FOLDER/'geometry-review.json').read_text(encoding='utf-8'))
    trails={r['body']['peak_slug']:r['body'] for r in payload()['records'] if r['kind']=='trail'}
    def check(review):
        request=urllib.request.Request(review['source_gpx'],headers={'User-Agent':'Mozilla/5.0'})
        with urllib.request.urlopen(request,timeout=30) as response:raw=response.read(2_000_001)
        assert len(raw)<=2_000_000
        assert semantic_gpx_hash(raw,review['time_policy'])==review['source_semantic_sha256'], 'Provider changed: '+review['peak_slug']
        lines=gpx_lines(raw)
        if review['adaptation']=='reverse_all':lines=[list(reversed(line))for line in reversed(lines)]
        assert lines==trails[review['peak_slug']]['route_geometry']['coordinates']
        return 'Source matches all coordinates/elevations/relative times: '+review['peak_slug']
    with ThreadPoolExecutor(max_workers=4) as pool:
        for result in pool.map(check,reviews):print(result)


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check',action='store_true')
    parser.add_argument('--check-sources',action='store_true');args=parser.parse_args()
    for name,text in generate().items():
        assert text.isascii()
        path=FOLDER/name
        if args.check:
            if not path.exists() or path.read_text(encoding='utf-8')!=text:raise SystemExit('Regenerate '+str(path.relative_to(ROOT)))
        else:path.write_text(text,encoding='utf-8')
    if args.check_sources: check_sources()
    print('Checked' if args.check else 'Generated','nonkgp-03: five trail/POI pairs')


if __name__=='__main__':main()
