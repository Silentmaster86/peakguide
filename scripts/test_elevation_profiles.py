import copy
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import build_elevation_profiles as profiles


class ElevationProfilesTest(unittest.TestCase):
    def test_geodesic_distance_zero_and_negative_elevations(self):
        value = profiles.profile_samples([[[0, 0, -10], [0, .01, 0], [0, .02, 20]]])
        self.assertAlmostEqual(value['distance_m'], 2223.899, places=2)
        self.assertEqual(value['min_m'], -10)
        self.assertEqual(value['segments'][0][1][2], 0)
        self.assertEqual(value['height_count'], 3)

    def test_disconnected_segments_do_not_invent_connectors(self):
        first = [[0, 0, 100], [0, .01, 150]]
        second = [[100, 50, 700], [100, 50.01, 800]]
        value = profiles.profile_samples([first, second])
        self.assertTrue(value['has_discontinuities'])
        self.assertEqual(value['segments'][1][0][3], value['segments'][0][-1][3])
        self.assertLess(value['distance_m'], 2300)

    def test_missing_heights_keep_distance_and_are_not_zero_filled(self):
        value = profiles.profile_samples([[[0, 0, 10], [0, .01, 20], [0, .02, None], [0, .03, 40]]])
        self.assertIsNone(value['segments'][0][2][2])
        self.assertEqual(value['height_count'], 3)
        self.assertAlmostEqual(value['distance_m'], 3335.848, places=2)

    def test_rejects_nonfinite_invalid_and_absent_elevations(self):
        for data in [[], [None], [[[0, 0, None], [0, .01, None]]], [[[0, 0, 10], [0, .01, None]]], [[[0, 0, True], [0, .01, 20]]], [[[181, 0, 10], [0, .01, 20]]], [[[0, 0, float('nan')], [0, .01, 20]]]]:
            with self.subTest(data=data), self.assertRaises(ValueError):
                profiles.profile_samples(data)

    def test_flat_real_samples_are_valid(self):
        value = profiles.profile_samples([[[0, 0, 100], [0, .01, 100]]])
        self.assertEqual(value['min_m'], value['max_m'])

    def test_gpx_preserves_reverse_direction_segments_and_missing_samples(self):
        raw = b'<gpx xmlns="http://www.topografix.com/GPX/1/1"><trk><trkseg><trkpt lon="1" lat="2"><ele>0</ele></trkpt><trkpt lon="1.1" lat="2.1"/></trkseg><trkseg><trkpt lon="3" lat="4"><ele>-10</ele></trkpt><trkpt lon="3.1" lat="4.1"><ele>40</ele></trkpt></trkseg></trk></gpx>'
        result = profiles.source_samples(raw, 'reverse_all')
        self.assertEqual(result[0], [[3.1, 4.1, 40], [3, 4, -10]])
        self.assertEqual(result[1], [[1.1, 2.1, None], [1, 2, 0]])
        with self.assertRaises(ValueError):
            profiles.source_samples(b'<!DOCTYPE gpx><gpx/>', 'none')

    def test_reviewed_assets_match_offline_generator(self):
        generated = profiles.generate()
        self.assertEqual(len(generated), 12)
        for name, content in generated.items():
            self.assertEqual((profiles.OUTPUT/name).read_text(encoding='utf-8'), content)
        rows = [json.loads(content) for name, content in generated.items() if name != 'index.json']
        self.assertEqual(sum(r['height_count'] for r in rows), 1525)
        self.assertTrue(all(r['point_count'] == r['height_count'] for r in rows))

    def test_source_or_geometry_edits_need_review(self):
        original = json.loads(profiles.REVIEW.read_text(encoding='utf-8'))
        for change in ['samples', 'geometry', 'identity', 'source']:
            rows = copy.deepcopy(original)
            if change == 'samples':
                rows[0]['segments'][0][0][2] += 1
            elif change == 'geometry':
                rows[0]['segments'][0][0][0] += .001
                rows[0]['samples_sha256'] = profiles.samples_hash(rows[0]['segments'])
            elif change == 'identity':
                rows[0]['peak_id'] = 999
            else:
                rows[0]['source_semantic_sha256'] = 'changed'
            with tempfile.TemporaryDirectory() as folder:
                path = Path(folder)/'review.json'
                path.write_text(json.dumps(rows), encoding='utf-8')
                with patch.object(profiles, 'REVIEW', path), self.assertRaises(ValueError):
                    profiles.generate()

    def test_catalogue_family_and_source_cannot_be_swapped(self):
        original = json.loads(profiles.REVIEW.read_text(encoding='utf-8'))
        for change in ['wrong_batch', 'unreviewed_batch', 'wrong_gpx']:
            rows = copy.deepcopy(original)
            row = next(r for r in rows if r['peak_slug'] == 'stog-izerski')
            if change == 'wrong_batch':
                row['catalogue_batch'] = 'nonkgp-06'
            elif change == 'unreviewed_batch':
                row['catalogue_batch'] = '../nonkgp-05'
            else:
                row['source_gpx'] = next(r['source_gpx'] for r in rows if r['peak_slug'] == 'wiezyca')
            with tempfile.TemporaryDirectory() as folder:
                path = Path(folder)/'review.json'
                path.write_text(json.dumps(rows), encoding='utf-8')
                with patch.object(profiles, 'REVIEW', path), self.assertRaises(ValueError):
                    profiles.generate()
