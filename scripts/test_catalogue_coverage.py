import io
import json
import unittest
from urllib.parse import parse_qs, urlparse
from catalogue_coverage import TABLES, audit, fetch_rows


def texts(table, missing=None):
    return {table + '_i18n': [{'lang': lang, 'name': 'Test'} for lang in ['pl', 'en', 'ua', 'zh'] if lang != missing]}


class CoverageTest(unittest.TestCase):
    def test_active_relations_and_each_translation_are_checked(self):
        data = {table: [] for table in TABLES}
        data['peaks'] = [dict(id=1, slug='one', active=True, is_korona=False, latitude=0, longitude=0, **texts('peaks')),
                         dict(id=2, slug='hidden', active=False)]
        data['trails'] = [dict(id=3, peak_id=1, slug='first', active=True, route_geometry={}, gpx_url=None, **texts('trails')),
                          dict(id=4, peak_id=1, slug='second', active=True, route_geometry={'type': 'LineString'}, gpx_url='https://example.org/a.gpx', **texts('trails', 'zh')),
                          dict(id=5, peak_id=1, slug='hidden', active=False)]
        data['pois'] = [dict(id=6, peak_id=1, active=False)]
        data['trail_access'] = [dict(id=7, trail_id=5, active=True)]
        result = audit(data)
        peak = result['peaks'][0]
        self.assertEqual(len(result['peaks']), 1)
        self.assertEqual(peak['trails'], 2)
        self.assertEqual(peak['access_cards'], 0)
        self.assertEqual(peak['gaps'], ['pois', 'access', 'parking', 'translations'])
        self.assertEqual(peak['incomplete_translations'], [{'table': 'trails', 'id': 4, 'missing': ['zh']}])
        self.assertEqual(peak['trails_needing_geometry_or_gpx'], ['first'])
        self.assertEqual(result['summary']['outside_kgp_without_pois'], 1)

    def test_server_page_limit_does_not_truncate_report(self):
        calls = []
        def opener(req, timeout):
            offset = int(parse_qs(urlparse(req.full_url).query)['offset'][0])
            calls.append(offset)
            return io.BytesIO(json.dumps([{'id': offset + 1}] if offset < 3 else []).encode())
        self.assertEqual(len(fetch_rows('https://example.org', 'public', 'peaks', opener)), 3)
        self.assertEqual(calls, [0, 1, 2, 3])
        with self.assertRaises(ValueError):
            fetch_rows('https://example.org', 'public', 'profiles', opener)

    def test_no_data_is_not_complete_and_invalid_coordinates_are_flagged(self):
        data = {table: [] for table in TABLES}
        data['peaks'] = [dict(id=1, slug='empty', active=True, latitude=None, longitude=None)]
        self.assertEqual(audit(data)['peaks'][0]['gaps'], ['trails', 'pois', 'access', 'parking', 'translations', 'coordinates'])


if __name__ == '__main__':
    unittest.main()
