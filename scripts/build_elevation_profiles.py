"""Build reviewed elevation profiles offline; never query or write Supabase."""
import argparse
import hashlib
import json
import math
from pathlib import Path
import urllib.request
import xml.etree.ElementTree as ET

from build_foreign_gpx_01 import semantic_gpx_hash

ROOT = Path(__file__).resolve().parents[1]
REVIEW = ROOT / 'docs/catalogue/elevation-profiles/review.json'
OUTPUT = ROOT / 'peakguide_front/src/features/elevation/data'
CATALOGUE_BATCHES = {'nonkgp-01', 'nonkgp-05', 'nonkgp-06', 'nonkgp-07', 'nonkgp-08'}


def samples_hash(segments):
    return hashlib.sha256(json.dumps(segments, separators=(',', ':'), allow_nan=False).encode()).hexdigest()


def finite(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def distance(a, b):
    lon1, lat1, lon2, lat2 = map(math.radians, [a[0], a[1], b[0], b[1]])
    h = math.sin((lat2-lat1)/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin((lon2-lon1)/2)**2
    return 6371000 * 2 * math.asin(min(1, math.sqrt(h)))


def profile_samples(segments):
    if not isinstance(segments, list) or not segments or any(not isinstance(s, list) for s in segments) or sum(map(len, segments)) > 20000:
        raise ValueError('Invalid segment count')
    output, height_values, total, usable_pair = [], [], 0.0, False
    discontinuities = False
    for i, segment in enumerate(segments):
        if not isinstance(segment, list) or len(segment) < 2:
            raise ValueError('A segment needs two points')
        converted = []
        for j, point in enumerate(segment):
            if not isinstance(point, list) or len(point) != 3 or not all(finite(n) for n in point[:2]) or not -180 <= point[0] <= 180 or not -90 <= point[1] <= 90:
                raise ValueError('Invalid coordinates')
            height = point[2]
            if height is not None and (not finite(height) or not -500 <= height <= 10000):
                raise ValueError('Invalid elevation')
            if j:
                total += distance(segment[j-1], point)
                usable_pair |= height is not None and segment[j-1][2] is not None and point[:2] != segment[j-1][:2]
            if height is not None:
                height_values.append(height)
            converted.append([*point, round(total, 3)])
        if i and segments[i-1][-1][:2] != segment[0][:2]:
            discontinuities = True
        output.append(converted)
    if not usable_pair or round(total, 3) <= 0:
        raise ValueError('No connected elevation samples')
    return {'segments': output, 'distance_m': round(total, 3), 'min_m': min(height_values), 'max_m': max(height_values),
            'point_count': sum(map(len, segments)), 'height_count': len(height_values), 'has_discontinuities': discontinuities}


def source_samples(raw, adaptation):
    if len(raw) > 2_000_000 or b'<!DOCTYPE' in raw.upper() or b'<!ENTITY' in raw.upper():
        raise ValueError('Invalid GPX input')
    root = ET.fromstring(raw)
    if root.tag.split('}')[-1] != 'gpx':
        raise ValueError('Not GPX')
    segments = []
    for segment in root.findall('.//{*}trkseg'):
        line = []
        for point in segment.findall('{*}trkpt'):
            value = point.findtext('{*}ele')
            line.append([float(point.attrib['lon']), float(point.attrib['lat']), float(value) if value is not None and value.strip() else None])
        segments.append(line)
    if adaptation == 'reverse_all':
        segments = [list(reversed(s)) for s in reversed(segments)]
    elif adaptation != 'none':
        raise ValueError('Unreviewed adaptation')
    return segments


def generate():
    rows = json.loads(REVIEW.read_text(encoding='utf-8'))
    files, index, parents = {}, {}, {}
    for row in rows:
        batch = row.get('catalogue_batch')
        if batch not in CATALOGUE_BATCHES:
            raise ValueError('Unreviewed catalogue batch')
        parent = ROOT / 'docs/catalogue' / batch
        if batch not in parents:
            trails = {r['body']['slug']: r['body'] for r in json.loads((parent/'records.json').read_text(encoding='utf-8')) if r['kind'] == 'trail'}
            source_reviews = {r['peak_slug']: r for r in json.loads((parent/'geometry-review.json').read_text(encoding='utf-8'))}
            peaks = {r['slug']: r for r in json.loads((parent/'peaks.json').read_text(encoding='utf-8'))}
            parents[batch] = trails, source_reviews, peaks
        trails, source_reviews, peaks = parents[batch]
        slug, samples = row['trail_slug'], row['segments']
        if slug in index or slug not in trails or row['peak_slug'] not in source_reviews or row['peak_slug'] not in peaks:
            raise ValueError('Duplicate or unknown trail')
        trail, source = trails[slug], source_reviews[row['peak_slug']]
        if samples_hash(samples) != row['samples_sha256']:
            raise ValueError('Elevation samples changed; review required')
        peak_id = peaks[row['peak_slug']]['id']
        if peak_id != row['peak_id'] or source.get('peak_id', peak_id) != row['peak_id'] or trail['peak_slug'] != row['peak_slug']:
            raise ValueError('Peak identity changed')
        for key in ['gpx_url', 'geometry_source_url']:
            if trail[key] != row[key]:
                raise ValueError('Trail identity changed: ' + key)
        if row['source_url'] != source.get('source_url', source.get('source_page')):
            raise ValueError('Source page changed')
        for key in ['source_gpx', 'source_semantic_sha256', 'time_policy', 'adaptation']:
            if source[key] != row[key]:
                raise ValueError('Source review changed: ' + key)
        if [[p[:2] for p in s] for s in samples] != trail['route_geometry']['coordinates']:
            raise ValueError('Source geometry changed')
        if row['peak_slug'] == 'lysina':
            local = (parent/'routes/lysina-pcim-kudlacze-wejscie.gpx').read_bytes()
            if source_samples(local, 'none') != samples:
                raise ValueError('Local GPX changed')
        value = {key: row[key] for key in ['trail_slug', 'peak_slug', 'peak_id', 'gpx_url', 'geometry_source_url', 'source_url', 'reviewed_at', 'samples_sha256']}
        value.update(profile_samples(samples))
        files[slug+'.json'] = json.dumps(value, ensure_ascii=False, separators=(',', ':'), allow_nan=False)+'\n'
        index[slug] = {key: row[key] for key in ['peak_id', 'gpx_url', 'geometry_source_url']}
    files['index.json'] = json.dumps(index, ensure_ascii=False, indent=2)+'\n'
    return files


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    parser.add_argument('--check-sources', action='store_true')
    args = parser.parse_args()
    for name, content in generate().items():
        path = OUTPUT/name
        if args.check:
            if not path.exists() or path.read_text(encoding='utf-8') != content:
                raise SystemExit('Stale profile: '+str(path))
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content, encoding='utf-8')
    if args.check_sources:
        for row in json.loads(REVIEW.read_text(encoding='utf-8')):
            request = urllib.request.Request(row['source_gpx'], headers={'User-Agent':'PeakGuide/1.0 GPX review'})
            with urllib.request.urlopen(request, timeout=30) as response:
                raw = response.read(2_000_001)
            samples = source_samples(raw, row['adaptation'])
            if semantic_gpx_hash(raw, row['time_policy']) != row['source_semantic_sha256'] or samples != row['segments']:
                raise SystemExit('Provider changed: '+row['trail_slug'])
            print('Source matches coordinates and elevations: '+row['trail_slug'])


if __name__ == '__main__':
    main()
