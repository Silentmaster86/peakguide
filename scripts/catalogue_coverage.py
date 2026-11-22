"""Read-only audit of PUBLIC tourist rows. Never reads profiles or auth tables."""
import argparse
import csv
import json
import os
from pathlib import Path
from datetime import datetime, timezone
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen

LANGUAGES = {'pl', 'en', 'ua', 'zh'}
TABLES = {
    'peaks': 'id,slug,active,is_korona,latitude,longitude,elevation_m,peaks_i18n(lang,name),mountain_ranges(slug,countries(code))',
    'trails': 'id,peak_id,slug,active,gpx_url,route_geometry,trails_i18n(lang,name)',
    'pois': 'id,peak_id,active,pois_i18n(lang,name)',
    'trail_access': 'id,trail_id,active,trail_access_i18n(lang)',
    'trail_parking': 'id,trail_id,active,trail_parking_i18n(lang)',
}


def fetch_rows(url, key, table, opener=urlopen):
    if table not in TABLES:
        raise ValueError('Only public tourist tables are allowed')
    rows, offset = [], 0
    while True:
        query = urlencode({'select': TABLES[table], 'order': 'id.asc', 'limit': 500, 'offset': offset})
        req = Request(url.rstrip('/') + '/rest/v1/' + table + '?' + query,
                      headers={'apikey': key, 'Authorization': 'Bearer ' + key})
        with opener(req, timeout=40) as response:
            page = json.load(response)
        if not isinstance(page, list):
            raise ValueError('Expected a row array')
        rows.extend(page)
        if not page:
            return rows
        # Do not assume the server honoured the requested page size.
        offset += len(page)


def coordinates_present(row):
    try:
        lat, lon = row.get('latitude'), row.get('longitude')
        if isinstance(lat, bool) or isinstance(lon, bool):
            return False
        return -90 <= float(lat) <= 90 and -180 <= float(lon) <= 180
    except (ValueError, TypeError):
        return False


def missing_languages(rows, table):
    return sorted(LANGUAGES - {t['lang'] for r in rows for t in r.get(table + '_i18n', [])})


def audit(data):
    active = {table: [r for r in data[table] if r.get('active', True)] for table in TABLES}
    result = []
    for peak in sorted(active['peaks'], key=lambda r: r['slug']):
        trails = [r for r in active['trails'] if r['peak_id'] == peak['id']]
        pois = [r for r in active['pois'] if r['peak_id'] == peak['id']]
        trail_ids = {r['id'] for r in trails}
        access = [r for r in active['trail_access'] if r['trail_id'] in trail_ids]
        parking = [r for r in active['trail_parking'] if r['trail_id'] in trail_ids]
        gaps = []
        for label, rows in [('trails', trails), ('pois', pois), ('access', access), ('parking', parking)]:
            if not rows:
                gaps.append(label)
        incomplete = []
        for table, rows in [('peaks', [peak]), ('trails', trails), ('pois', pois),
                            ('trail_access', access), ('trail_parking', parking)]:
            for row in rows:
                missing = missing_languages([row], table)
                if missing:
                    incomplete.append({'table': table, 'id': row['id'], 'missing': missing})
        if incomplete:
            gaps.append('translations')
        if not coordinates_present(peak):
            gaps.append('coordinates')
        if trails and not any(t.get('route_geometry') and t.get('gpx_url') for t in trails):
            gaps.append('mapped_trail_with_gpx')
        result.append({
            'id': peak['id'], 'slug': peak['slug'], 'kgp': bool(peak.get('is_korona')),
            'country': ((peak.get('mountain_ranges') or {}).get('countries') or {}).get('code'),
            'range': (peak.get('mountain_ranges') or {}).get('slug'),
            'name': next((t['name'] for t in peak.get('peaks_i18n', []) if t['lang'] == 'pl'), peak['slug']),
            'trails': len(trails), 'mapped_trails': sum(bool(t.get('route_geometry')) for t in trails),
            'trails_with_gpx_and_geometry': sum(bool(t.get('route_geometry') and t.get('gpx_url')) for t in trails),
            'pois': len(pois), 'access_cards': len(access), 'parking_cards': len(parking),
            'gaps': gaps, 'incomplete_translations': incomplete,
            'trails_needing_geometry_or_gpx': [t['slug'] for t in trails if not (t.get('route_geometry') and t.get('gpx_url'))],
        })
    return {
        'observed_at': datetime.now(timezone.utc).isoformat(),
        'scope': 'Public active rows only; counts do not establish source quality, route accuracy or completeness of amenities.',
        'summary': {
            'active_peaks': len(result), 'kgp': sum(p['kgp'] for p in result),
            'outside_kgp': sum(not p['kgp'] for p in result),
            'outside_kgp_without_trails': sum(not p['kgp'] and not p['trails'] for p in result),
            'outside_kgp_without_pois': sum(not p['kgp'] and not p['pois'] for p in result),
            'outside_kgp_without_access': sum(not p['kgp'] and not p['access_cards'] for p in result),
            'outside_kgp_without_parking': sum(not p['kgp'] and not p['parking_cards'] for p in result),
        }, 'peaks': result,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--url', required=True)
    parser.add_argument('--key-env', default='SUPABASE_ANON_KEY')
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    parsed = urlparse(args.url)
    if parsed.scheme != 'https' or not parsed.hostname or parsed.username or parsed.password or parsed.query or parsed.fragment:
        parser.error('Use an HTTPS project URL without credentials, query or fragment')
    key = os.environ.get(args.key_env)
    if not key:
        parser.error('Public anon key is missing from the named environment variable')
    try:
        report = audit({table: fetch_rows(args.url, key, table) for table in TABLES})
    except Exception as error:
        # Never echo provider response bodies, credentials or raw request headers.
        raise SystemExit('Public audit failed: ' + type(error).__name__) from None
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    with args.output.with_suffix('.csv').open('w', encoding='utf-8-sig', newline='') as file:
        fields = ['slug', 'name', 'country', 'range', 'kgp', 'trails', 'mapped_trails', 'pois', 'access_cards', 'parking_cards', 'gaps']
        writer = csv.DictWriter(file, fieldnames=fields)
        writer.writeheader()
        for row in report['peaks']:
            writer.writerow({k: '; '.join(row[k]) if k == 'gaps' else row[k] for k in fields})
    print(json.dumps(report['summary']))


if __name__ == '__main__':
    main()
