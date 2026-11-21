"""Generate an ASCII-only, guarded repair for Windows PowerShell UTF-8 mojibake."""
import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT / 'docs/catalogue/utf8-repair'


def mojibake(value):
    if value is None:
        return None
    # Windows CP1252 preserves its five undefined byte values as C1 controls.
    return ''.join(bytes([b]).decode('cp1252') if b not in (0x81, 0x8d, 0x8f, 0x90, 0x9d) else chr(b)
                   for b in value.encode('utf-8'))


def payload():
    batches = []
    for number in ('02', '03', '04'):
        records = json.loads((ROOT / f'docs/catalogue/batch-{number}/records.json').read_text(encoding='utf-8'))
        items = []
        for record in records:
            body = record['body']
            fields = {k: body.get(k) for k in ('start_point_name', 'end_point_name')} if record['kind'] == 'trail' else {}
            texts = body['i18n']
            items.append({'kind': record['kind'], 'peak_slug': body['peak_slug'],
                          'key': body['slug'] if record['kind'] == 'trail' else body['source_url'],
                          'fields': fields, 'broken_fields': {k: mojibake(v) for k, v in fields.items()},
                          'i18n': texts, 'broken_i18n': {lang: {k: mojibake(v) for k, v in text.items()} for lang, text in texts.items()}})
        batches.append({'key': f'kgp-{number}', 'lock': int(number), 'items': items})
    return batches


READ = """
 if entry->>'kind'='trail' then
  perform 1 from public.trails where id=saved_id for update;
  perform 1 from public.trails_i18n ti where ti.trail_id=saved_id order by ti.lang for update;
  select jsonb_build_object('row',to_jsonb(t),'i18n',coalesce((select jsonb_agg(to_jsonb(i) order by i.lang) from public.trails_i18n i where trail_id=t.id),'[]')) into actual from public.trails t where id=saved_id for update of t;
 else
  perform 1 from public.pois where id=saved_id for update;
  perform 1 from public.pois_i18n pi where pi.poi_id=saved_id order by pi.lang for update;
  select jsonb_build_object('row',to_jsonb(p),'i18n',coalesce((select jsonb_agg(to_jsonb(i) order by i.lang) from public.pois_i18n i where poi_id=p.id),'[]')) into actual from public.pois p where id=saved_id for update of p;
 end if;
"""


def generate():
    data = json.dumps(payload(), ensure_ascii=True, separators=(',', ':'))
    apply = """-- ASCII-only. Read README.md. Updates existing text and receipts; preserves IDs and geometry.
begin;
set local lock_timeout='5s';
do $repair$
declare batches jsonb=$data$""" + data + """$data$::jsonb;
 batch jsonb; receipt jsonb; refreshed jsonb; entry jsonb; actual jsonb; patch jsonb;
 text_row jsonb; key text; expected jsonb; broken jsonb; lang text; saved_id bigint;
 changed boolean; fixed_count integer=0;
begin
 if to_regclass('peakguide_private.catalogue_batch_receipts') is null then raise exception 'Import receipts missing'; end if;
 for batch in select value from jsonb_array_elements(batches) loop
  perform pg_advisory_xact_lock(251115,(batch->>'lock')::integer);
  select snapshot into receipt from peakguide_private.catalogue_batch_receipts where batch_key=batch->>'key' for update;
  if receipt is null or jsonb_typeof(receipt)<>'array' or jsonb_array_length(receipt)<>jsonb_array_length(batch->'items') then
   raise exception 'Missing or incomplete receipt: %',batch->>'key';
  end if;
  if (select count(distinct (e->>'kind',e->>'id')) from jsonb_array_elements(receipt) e)<>jsonb_array_length(receipt) then raise exception 'Duplicate receipt entries'; end if;
  refreshed='[]'::jsonb;
  for entry in select value from jsonb_array_elements(receipt) loop
   if entry->>'kind' not in ('trail','poi') then raise exception 'Unknown receipt kind'; end if;
   saved_id=(entry->>'id')::bigint;
""" + READ + """
   if actual is distinct from entry->'snapshot' then raise exception 'Imported record changed: % %',entry->>'kind',saved_id; end if;
   select value into patch from jsonb_array_elements(batch->'items')
    where value->>'kind'=entry->>'kind'
     and value->>'key'=case when entry->>'kind'='trail' then actual->'row'->>'slug' else actual->'row'->>'source_url' end
     and exists(select from public.peaks p where p.id=(actual->'row'->>'peak_id')::bigint and p.slug=value->>'peak_slug');
   if patch is null then raise exception 'Unexpected imported identity: % %',entry->>'kind',saved_id; end if;
   changed=false;
   for key,expected in select * from jsonb_each(patch->'fields') loop
    broken=patch->'broken_fields'->key;
    if actual->'row'->key is distinct from expected and actual->'row'->key is distinct from broken then raise exception 'Unexpected text field: % %',saved_id,key; end if;
    changed=changed or actual->'row'->key is distinct from expected;
   end loop;
   if jsonb_array_length(actual->'i18n')<>4 then raise exception 'Unexpected translation count: %',saved_id; end if;
   for text_row in select value from jsonb_array_elements(actual->'i18n') loop
    lang=text_row->>'lang';
    if not (patch->'i18n' ? lang) then raise exception 'Unexpected language: %',lang; end if;
    for key,expected in select * from jsonb_each(patch->'i18n'->lang) loop
     broken=patch->'broken_i18n'->lang->key;
     if text_row->key is distinct from expected and text_row->key is distinct from broken then raise exception 'Unexpected translation: % % %',saved_id,lang,key; end if;
     changed=changed or text_row->key is distinct from expected;
    end loop;
   end loop;
   if changed then
    if entry->>'kind'='trail' then
     update public.trails set start_point_name=patch->'fields'->>'start_point_name',end_point_name=patch->'fields'->>'end_point_name' where id=saved_id;
     update public.trails_i18n i set name=patch->'i18n'->i.lang->>'name',description=patch->'i18n'->i.lang->>'description',notes=patch->'i18n'->i.lang->>'notes' where trail_id=saved_id;
    else
     update public.pois_i18n i set name=patch->'i18n'->i.lang->>'name',description=patch->'i18n'->i.lang->>'description',tips=patch->'i18n'->i.lang->>'tips' where poi_id=saved_id;
    end if;
""" + READ + """
    fixed_count=fixed_count+1;
   end if;
   refreshed=refreshed||jsonb_build_array(jsonb_set(entry,'{snapshot}',actual));
  end loop;
  update peakguide_private.catalogue_batch_receipts set snapshot=refreshed where batch_key=batch->>'key';
 end loop;
 raise notice 'UTF-8 repair complete. Updated records: %',fixed_count;
end $repair$;
commit;
"""
    verify = """-- Read-only: compare all 46 imported records with canonical source text.
with batches as (select value b from jsonb_array_elements($data$""" + data + """$data$::jsonb)),
expected as (select b->>'key' batch_key,value e from batches cross join lateral jsonb_array_elements(b->'items')),
checks as (
 select batch_key,e->>'kind' kind,e->>'key' identity,
  case when e->>'kind'='trail' then t.id else o.id end id,
  case when e->>'kind'='trail' then
   t.start_point_name is not distinct from e->'fields'->>'start_point_name' and t.end_point_name is not distinct from e->'fields'->>'end_point_name'
   and (select count(*)=4 and bool_and(coalesce((to_jsonb(i)-'trail_id'-'lang')=e->'i18n'->i.lang,false)) from public.trails_i18n i where trail_id=t.id)
  else (select count(*)=4 and bool_and(coalesce((to_jsonb(i)-'poi_id'-'lang')=e->'i18n'->i.lang,false)) from public.pois_i18n i where poi_id=o.id) end exact_text_match
 from expected left join public.peaks p on p.slug=e->>'peak_slug'
 left join public.trails t on e->>'kind'='trail' and t.slug=e->>'key' and t.peak_id=p.id
 left join public.pois o on e->>'kind'='poi' and o.source_url=e->>'key' and o.peak_id=p.id
)
select batch_key, count(*) expected_records,count(id) found_records,
 count(*) filter(where exact_text_match is true) correct_text_records,
 coalesce(jsonb_agg(identity) filter(where id is null or exact_text_match is not true),'[]'::jsonb) remaining_issues
from checks group by batch_key order by batch_key;
"""
    return {'apply.sql': apply, 'verify.sql': verify}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    FOLDER.mkdir(parents=True, exist_ok=True)
    for name, text in generate().items():
        assert text.isascii()
        path = FOLDER / name
        if args.check:
            assert path.read_text(encoding='ascii') == text, f'Stale {path}'
        else:
            path.write_text(text, encoding='ascii')
