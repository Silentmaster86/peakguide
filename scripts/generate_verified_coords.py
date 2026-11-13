#!/usr/bin/env python3
"""Validate an explicitly reviewed identity registry; never connect to a database.

Default: JSON review report on stdout. SQL requires --write-sql PATH and a valid
--manifest PATH. Original SQL/name-search scripts are preserved under _archive.
"""
import argparse
import json
import math
import re
from pathlib import Path
from urllib.parse import urlparse

BOUNDS = {'PL': (49, 55, 14, 24.2), 'GB': (49.8, 61, -8.7, 2),
          'SK': (47.7, 49.7, 16.8, 22.6), 'UA': (44, 52.5, 22, 40.5),
          'CN': (18, 54, 73, 135)}


def number(value):
    return not isinstance(value, bool) and isinstance(value, (int, float)) and math.isfinite(value)


def validate(records):
    issues, seen = [], set()
    if not isinstance(records, list) or not records:
        return ['Manifest must contain at least one independently reviewed record.']
    for index, row in enumerate(records):
        slug = row.get('slug', '')
        prefix = f'{index}: {slug}'
        if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', slug) or slug in seen:
            issues.append(f'{prefix}: invalid or duplicate slug')
        seen.add(slug)
        if not re.fullmatch(r'Q[1-9][0-9]*', row.get('wikidata_id', '')):
            issues.append(f'{prefix}: explicit Wikidata identity required')
        if not row.get('verified_by') or not re.fullmatch(r'\d{4}-\d{2}-\d{2}', row.get('verified_at', '')):
            issues.append(f'{prefix}: reviewer and verification date required')
        sources = row.get('sources', [])
        if not sources or any(urlparse(url).scheme != 'https' or not urlparse(url).netloc for url in sources):
            issues.append(f'{prefix}: HTTPS evidence sources required')
        bounds = BOUNDS.get(row.get('country_code'))
        lat, lon = row.get('latitude'), row.get('longitude')
        if not bounds or not number(lat) or not number(lon) or not (bounds[0] <= lat <= bounds[1] and bounds[2] <= lon <= bounds[3]):
            issues.append(f'{prefix}: coordinates outside country review bounds')
        for field in ['previous_latitude', 'previous_longitude']:
            if field not in row or (row[field] is not None and not number(row[field])):
                issues.append(f'{prefix}: current database value required: {field}')
    return issues


def sql_for(records):
    errors = validate(records)
    if errors:
        raise ValueError('; '.join(errors))
    lines = ['-- Reviewed coordinates only. Elevations are deliberately unchanged.', 'begin;']
    for row in records:
        lat, lon = row['latitude'], row['longitude']
        old_lat = 'null' if row['previous_latitude'] is None else str(row['previous_latitude'])
        old_lon = 'null' if row['previous_longitude'] is None else str(row['previous_longitude'])
        lines.append(f"""do $$ begin
  update public.peaks set latitude = {lat}, longitude = {lon},
    geom = st_setsrid(st_makepoint({lon}, {lat}), 4326)
  where slug = '{row['slug']}' and latitude is not distinct from {old_lat}
    and longitude is not distinct from {old_lon};
  if not found then raise exception 'Missing or changed peak: {row['slug']}'; end if;
end $$;""")
    return '\n'.join(lines + ['commit;', ''])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--manifest', type=Path)
    parser.add_argument('--write-sql', type=Path)
    args = parser.parse_args()
    records = json.loads(args.manifest.read_text()) if args.manifest else []
    issues = validate(records)
    print(json.dumps({'records': len(records), 'issues': issues, 'sql_generated': bool(args.write_sql and not issues)}, ensure_ascii=False, indent=2))
    if args.write_sql:
        if issues:
            parser.error('SQL not written: resolve all review issues first.')
        # Refuse to overwrite an existing file, including a previously reviewed SQL.
        with args.write_sql.open('x') as output:
            output.write(sql_for(records))


if __name__ == '__main__':
    main()
