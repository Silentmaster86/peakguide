"""Build guarded, ASCII-only SQL for the 28 reviewed KGP practical cards.

No network/database writes. Database scripts require the existing practical schema;
preflight is read-only. Unknown facilities remain SQL NULL.
"""
import argparse
import hashlib
import json
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT / 'docs/catalogue/kgp-practical-01'
LANGS = {'pl', 'en', 'ua', 'zh'}
EXPECTED = {'waligora','sleza','lysica','skopiec','chelmiec','sniezka','wielka-sowa',
 'szczeliniec-wielki','snieznik','skalnik','rudawiec','orlica','jagodna','kowadlo',
 'klodzka-gora','biskupia-kopa','babia-gora','tarnica','turbacz','radziejowa',
 'lubomir','mogielica','czupel','skrzyczne','wysoka-pieniny','rysy','lackowa','wysoka-kopa'}

def load():
    rows = json.loads((FOLDER / 'records.json').read_text(encoding='utf-8'))
    assert len(rows) == 28 and {r['peak_slug'] for r in rows} == EXPECTED
    assert len({r['expected_trail']['id'] for r in rows}) == 28
    assert len({r['expected_trail']['slug'] for r in rows}) == 28
    checks = {r['url']: r for r in json.loads((FOLDER/'source-checks.json').read_text())}
    for r in rows:
        assert set(r['i18n']) == LANGS
        assert r['access']['active'] is True
        assert r['access']['source_url'] in {e['url'] for e in r['evidence']}
        assert all(r['access'][k] is None for k in ['address','postcode','latitude','longitude'])
        for lang, v in r['i18n'].items():
            assert all(isinstance(v[k], str) and v[k].strip() for k in ['directions','public_transport','warnings'])
            assert r['expected_trail']['start_point_name'] in v['directions']
            assert not any(bad in ''.join(v.values()) for bad in ['BiaÅ','Ð','ä»','ï¼','Ã³','\ufffd'])
        for e in r['evidence']:
            assert checks[e['url']]['status'] == 200
            assert urlparse(checks[e['url']]['resolved_url']).hostname == urlparse(e['url']).hostname
        for p in r['parking']:
            assert set(p['i18n']) == LANGS and p['row']['active'] is True
            assert all(p['row'][k] is None for k in ['latitude','longitude','capacity','toilets','overnight_allowed'])
            assert p['row']['source_url'] in {e['url'] for e in r['evidence']}
            for v in p['i18n'].values():
                assert all(isinstance(v[k],str) and v[k].strip() for k in ['name','description','notes','fee_info'])
    assert sum(len(r['parking']) for r in rows) == 9
    return rows

SCHEMA = """
 -- No DDL/grants/policy changes. A schema mismatch stops the entire transaction.
 if to_regclass('peakguide_private.catalogue_batch_receipts') is null then
  raise exception 'Catalogue receipt table missing; review required'; end if;
 for tbl in select unnest(array['trail_access','trail_access_i18n','trail_parking','trail_parking_i18n']) loop
  if not exists(select from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname=tbl and c.relkind='r' and c.relrowsecurity) then
   raise exception 'Required practical table with RLS missing: %',tbl; end if;
 end loop;
 -- Both client roles must remain subject to RLS; no client execution of this package.
 if exists(select from pg_roles where rolname in ('anon','authenticated') and (rolsuper or rolbypassrls)) then raise exception 'Client role bypasses RLS'; end if;
 for tbl in select unnest(array['trail_access','trail_parking']) loop
  if not exists(select from pg_attribute a left join pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum
    where a.attrelid=to_regclass('public.'||tbl) and a.attname='id' and a.atttypid='bigint'::regtype and (a.attidentity<>'' or d.adbin is not null)) then
   raise exception 'Expected generated bigint practical ID missing: %',tbl; end if;
 end loop;
 lock table public.trail_access,public.trail_access_i18n,public.trail_parking,public.trail_parking_i18n in share row exclusive mode;
"""
HEADER = """-- Owner-only, ASCII-only SQL. Read README.md; retain a database backup.
begin;
set local lock_timeout='5s';
set local timezone='UTC';
do $practical$
declare changes jsonb=$data$PAYLOAD$data$::jsonb;
 receipt jsonb; item jsonb; p jsonb; txt jsonb; entry jsonb; actual jsonb;
 result jsonb='[]'::jsonb; tid bigint; aid bigint; pid bigint; tbl text;
 ref record; linked boolean; ids bigint[];
begin
 if current_user in ('anon','authenticated') then raise exception 'Owner execution required'; end if;
 perform pg_advisory_xact_lock(261122,1);
"""
READ = """
 select jsonb_build_object(
  'access',coalesce((select jsonb_agg(jsonb_build_object('row',to_jsonb(a),'i18n',
    coalesce((select jsonb_agg(to_jsonb(i) order by lang collate "C") from public.trail_access_i18n i where i.access_id=a.id),'[]'::jsonb)) order by a.id)
    from public.trail_access a where a.trail_id=tid),'[]'::jsonb),
  'parking',coalesce((select jsonb_agg(jsonb_build_object('row',to_jsonb(park_row),'i18n',
    coalesce((select jsonb_agg(to_jsonb(i) order by lang collate "C") from public.trail_parking_i18n i where i.parking_id=park_row.id),'[]'::jsonb)) order by park_row.id)
    from public.trail_parking park_row where park_row.trail_id=tid),'[]'::jsonb)) into actual;
"""
IDENTITY = """
 perform 1 from public.trails t join public.peaks k on k.id=t.peak_id
  where t.id=tid and t.slug=item->'expected_trail'->>'slug'
   and t.peak_id=(item->'expected_trail'->>'peak_id')::bigint
   and t.start_point_name is not distinct from item->'expected_trail'->>'start_point_name'
   and t.end_point_name is not distinct from item->'expected_trail'->>'end_point_name'
   and t.active and k.active and k.is_korona and k.slug=item->>'peak_slug' for update of t,k;
 if not found then raise exception 'Reviewed route identity changed: %',item->'expected_trail'->>'slug'; end if;
"""
RECEIPT_CHECK = """
 if receipt->>'manifest_sha256'<>'HASH' or receipt->>'version'<>'1'
  or jsonb_typeof(receipt->'records')<>'array' or jsonb_array_length(receipt->'records')<>28
  or (select count(distinct v->>'trail_id') from jsonb_array_elements(receipt->'records') v)<>28 then
  raise exception 'Incomplete or different KGP practical receipt'; end if;
 for item in select value from jsonb_array_elements(changes) loop
  tid=(item->'expected_trail'->>'id')::bigint;
  select value into entry from jsonb_array_elements(receipt->'records') where (value->>'trail_id')::bigint=tid;
  if entry is null then raise exception 'KGP practical receipt identity missing'; end if;
""" + IDENTITY + READ + """
  if actual is distinct from entry->'snapshot' then raise exception 'Practical records changed: %',tid; end if;
 end loop;
"""

def generate(rows):
    payload = json.dumps(rows,ensure_ascii=True,separators=(',',':'))
    sha=hashlib.sha256(payload.encode('ascii')).hexdigest()
    assert '$data$' not in payload and '$practical$' not in payload
    header=HEADER.replace('PAYLOAD',payload)+SCHEMA+"\n select snapshot into receipt from peakguide_private.catalogue_batch_receipts where batch_key='kgp-practical-01' for update;\n"
    receipt_check=RECEIPT_CHECK.replace('HASH',sha)
    apply=header+" if receipt is not null then\n"+receipt_check+" raise notice 'KGP practical package already applied; unchanged'; return; end if;\n"
    apply+=" for item in select value from jsonb_array_elements(changes) loop\n tid=(item->'expected_trail'->>'id')::bigint;\n"+IDENTITY+READ+"""
 if actual<>jsonb_build_object('access','[]'::jsonb,'parking','[]'::jsonb) then
  raise exception 'Existing practical records (including inactive) require review: %',tid; end if;
 insert into public.trail_access(trail_id,address,postcode,latitude,longitude,google_maps_url,public_transport_url,source_url,last_verified_at,active)
 select tid,x.address,x.postcode,x.latitude,x.longitude,x.google_maps_url,x.public_transport_url,x.source_url,x.last_verified_at,x.active
 from jsonb_populate_record(null::public.trail_access,item->'access') x returning id into aid;
 for txt in select jsonb_build_object('lang',key)||value from jsonb_each(item->'i18n') loop
  insert into public.trail_access_i18n(access_id,lang,directions,public_transport,warnings)
  values(aid,txt->>'lang',txt->>'directions',txt->>'public_transport',txt->>'warnings');
 end loop;
 for p in select value from jsonb_array_elements(item->'parking') loop
  insert into public.trail_parking(trail_id,slug,address,postcode,latitude,longitude,map_url,source_url,is_primary,paid,toilets,overnight_allowed,capacity,last_verified_at,active)
  select tid,x.slug,x.address,x.postcode,x.latitude,x.longitude,x.map_url,x.source_url,x.is_primary,x.paid,x.toilets,x.overnight_allowed,x.capacity,x.last_verified_at,x.active
  from jsonb_populate_record(null::public.trail_parking,p->'row') x returning id into pid;
  for txt in select jsonb_build_object('lang',key)||value from jsonb_each(p->'i18n') loop
   insert into public.trail_parking_i18n(parking_id,lang,name,description,notes,fee_info,opening_info)
   values(pid,txt->>'lang',txt->>'name',txt->>'description',txt->>'notes',txt->>'fee_info',txt->>'opening_info');
  end loop;
 end loop;
"""+READ+"""
 -- Ensure triggers/defaults did not alter the submitted public content.
 if jsonb_array_length(actual->'access')<>1 or
  (actual->'access'->0->'row')-array['id','trail_id','created_at','updated_at'] is distinct from
  to_jsonb(jsonb_populate_record(null::public.trail_access,item->'access'))-array['id','trail_id','created_at','updated_at'] then
  raise exception 'Unexpected access content after insert: %',tid; end if;
 if (select jsonb_object_agg(v->>'lang',v-array['lang','access_id','created_at','updated_at']) from jsonb_array_elements(actual->'access'->0->'i18n') v) is distinct from item->'i18n' then
  raise exception 'Unexpected access translations: %',tid; end if;
 if jsonb_array_length(actual->'parking')<>jsonb_array_length(item->'parking') then raise exception 'Unexpected parking count'; end if;
 for p in select value from jsonb_array_elements(item->'parking') loop
  select value into entry from jsonb_array_elements(actual->'parking') where value->'row'->>'slug'=p->'row'->>'slug';
  if entry is null or (entry->'row')-array['id','trail_id','created_at','updated_at'] is distinct from
   to_jsonb(jsonb_populate_record(null::public.trail_parking,p->'row'))-array['id','trail_id','created_at','updated_at'] or
   (select jsonb_object_agg(v->>'lang',v-array['lang','parking_id','created_at','updated_at']) from jsonb_array_elements(entry->'i18n') v) is distinct from p->'i18n' then
   raise exception 'Unexpected parking content: %',tid; end if;
 end loop;
 result=result||jsonb_build_array(jsonb_build_object('trail_id',tid,'snapshot',actual));
 end loop;
 insert into peakguide_private.catalogue_batch_receipts(batch_key,snapshot)
 values('kgp-practical-01',jsonb_build_object('version',1,'manifest_sha256','HASH','records',result));
 raise notice 'Added 28 access cards and 9 parking cards, each in four languages';
end $practical$;
commit;
"""
    apply=apply.replace('HASH',sha)
    rollback=header+" if receipt is null then raise notice 'KGP practical package not applied'; return; end if;\n"+receipt_check+"""
 -- Refuse to delete practical cards used by unrelated records, including CASCADE FKs.
 for tbl in select unnest(array['trail_access','trail_parking']) loop
  select array_agg((v->'row'->>'id')::bigint) into ids
   from jsonb_array_elements(receipt->'records') r,
   lateral jsonb_array_elements(r->'snapshot'->(case tbl when 'trail_access' then 'access' else 'parking' end)) v;
  for ref in select c.conrelid::regclass relation,a.attname column_name,c.conkey,c.confkey,c.confrelid
   from pg_constraint c join pg_attribute a on a.attrelid=c.conrelid and a.attnum=c.conkey[1]
   where c.contype='f' and c.confrelid=to_regclass('public.'||tbl)
    and c.conrelid<>to_regclass('public.'||tbl||'_i18n') loop
   if cardinality(ref.conkey)<>1 or cardinality(ref.confkey)<>1 or
    (select attname from pg_attribute where attrelid=ref.confrelid and attnum=ref.confkey[1])<>'id' then
    raise exception 'Complex practical relationship requires rollback review'; end if;
   execute format('select exists(select from %s where %I=any($1))',ref.relation,ref.column_name) into linked using ids;
   if linked then raise exception 'Practical cards referenced by %; rollback refused',ref.relation; end if;
  end loop;
 end loop;
 for entry in select value from jsonb_array_elements(receipt->'records') loop
  tid=(entry->>'trail_id')::bigint;
  delete from public.trail_access_i18n where access_id in (select id from public.trail_access where trail_id=tid);
  delete from public.trail_parking_i18n where parking_id in (select id from public.trail_parking where trail_id=tid);
  delete from public.trail_access where trail_id=tid;
  delete from public.trail_parking where trail_id=tid;
"""+READ+"""
  if actual<>jsonb_build_object('access','[]'::jsonb,'parking','[]'::jsonb) then raise exception 'Rollback did not remove package cards'; end if;
 end loop;
 delete from peakguide_private.catalogue_batch_receipts where batch_key='kgp-practical-01';
 raise notice 'Removed only unchanged cards from KGP practical package';
end $practical$;
commit;
"""
    targets=json.dumps([{'peak_slug':r['peak_slug'],**r['expected_trail'],'expected_parking':len(r['parking'])} for r in rows],ensure_ascii=True,separators=(',',':'))
    cte="with targets as (select value e from jsonb_array_elements($targets$"+targets+"$targets$::jsonb))\n"
    verify=cte+"""select e->>'peak_slug' peak_slug,t.slug,
 (select count(*) from public.trail_access a where a.trail_id=t.id and a.active) access_cards,
 (select count(*) from public.trail_access_i18n i join public.trail_access a on a.id=i.access_id where a.trail_id=t.id and a.active) access_translations,
 (select count(*) from public.trail_parking p where p.trail_id=t.id and p.active) parking_cards,
 (e->>'expected_parking')::integer expected_parking_cards,
 (select count(*) from public.trail_parking_i18n i join public.trail_parking p on p.id=i.parking_id where p.trail_id=t.id and p.active) parking_translations,
 t.active and k.active and k.is_korona and k.slug=e->>'peak_slug' and t.peak_id=(e->>'peak_id')::bigint
  and t.start_point_name is not distinct from e->>'start_point_name' and t.end_point_name is not distinct from e->>'end_point_name' route_identity_matches
from targets left join public.trails t on t.id=(e->>'id')::bigint and t.slug=e->>'slug'
 left join public.peaks k on k.id=t.peak_id order by e->>'peak_slug';
"""
    preflight=cte+"""select e->>'peak_slug' peak_slug,e->>'slug' expected_trail,
 t.id is not null and t.peak_id=(e->>'peak_id')::bigint and t.active and k.active and k.is_korona and k.slug=e->>'peak_slug'
  and t.start_point_name is not distinct from e->>'start_point_name' and t.end_point_name is not distinct from e->>'end_point_name' route_identity_matches,
 (select count(*) from public.trail_access a where a.trail_id=t.id) existing_access_including_inactive,
 (select count(*) from public.trail_parking p where p.trail_id=t.id) existing_parking_including_inactive
from targets left join public.trails t on t.id=(e->>'id')::bigint and t.slug=e->>'slug'
 left join public.peaks k on k.id=t.peak_id order by e->>'peak_slug';
-- Schema metadata only. No secrets or personal records.
select c.relname table_name,c.relrowsecurity rls,a.attname column_name,
 format_type(a.atttypid,a.atttypmod) data_type,a.attnotnull not_null,
 pg_get_expr(d.adbin,d.adrelid) column_default,a.attidentity identity_kind
from pg_class c join pg_namespace n on n.oid=c.relnamespace
join pg_attribute a on a.attrelid=c.oid and a.attnum>0 and not a.attisdropped
left join pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum
where n.nspname='public' and c.relname in ('trail_access','trail_access_i18n','trail_parking','trail_parking_i18n')
order by c.relname,a.attnum;
"""
    return {'apply.sql':apply,'rollback.sql':rollback,'verify.sql':verify,'preflight.sql':preflight}

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');args=parser.parse_args()
    for name,content in generate(load()).items():
        assert content.isascii(),name
        if args.check:assert (FOLDER/name).read_text(encoding='ascii')==content, f'Regenerate {name}'
        else:(FOLDER/name).write_text(content,encoding='ascii')
    print('KGP practical: 28 access / 112 translations; 9 parking / 36 translations; ASCII SQL reproducible')
if __name__=='__main__':main()
