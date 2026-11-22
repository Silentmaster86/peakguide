"""Refresh the weather allowlist using only public active peak coordinates."""
import argparse
import json
import math
import os
from pathlib import Path
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen


def locations_from_rows(rows):
    result = {}
    for row in rows:
        lat, lon, height = (row.get(k) for k in ('latitude', 'longitude', 'elevation_m'))
        if any(not isinstance(v, (int, float)) or isinstance(v, bool) or not math.isfinite(v) for v in (lat, lon, height)):
            continue
        if -90 <= lat <= 90 and -180 <= lon <= 180 and -500 <= height <= 9000:
            result[row['slug']] = {'latitude': lat, 'longitude': lon, 'elevation_m': height}
    if not result:
        raise ValueError('No valid public locations; keep the previous manifest')
    return dict(sorted(result.items()))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--url', required=True)
    args = parser.parse_args()
    url = urlparse(args.url)
    if url.scheme != 'https' or not url.hostname or url.username or url.password or url.query or url.fragment:
        parser.error('Use an HTTPS project URL without credentials')
    key = os.environ.get('SUPABASE_ANON_KEY')
    if not key:
        parser.error('Set SUPABASE_ANON_KEY to the public anon key')
    rows, offset = [], 0
    try:
        while True:
            query = urlencode({'select':'slug,latitude,longitude,elevation_m','active':'eq.true','order':'id.asc','limit':500,'offset':offset})
            req = Request(args.url.rstrip('/') + '/rest/v1/peaks?' + query, headers={'apikey':key})
            with urlopen(req, timeout=40) as response:
                page = json.load(response)
            if not isinstance(page, list):
                raise ValueError('Expected public rows')
            if not page:
                break
            rows.extend(page)
            offset += len(page)
        data = locations_from_rows(rows)
    except Exception as error:
        raise SystemExit('Refresh failed: ' + type(error).__name__) from None
    output = Path(__file__).resolve().parents[1] / 'peakguide_front/netlify/functions/lib/peak-locations.json'
    output.write_text(json.dumps(data, indent=2) + '\n', encoding='utf-8')
    print('Public forecast locations:', len(data))


if __name__ == '__main__':
    main()
