import unittest
from generate_verified_coords import validate, sql_for


class CoordinateImportTests(unittest.TestCase):
    def record(self):
        return {'slug': 'test-peak', 'wikidata_id': 'Q123', 'country_code': 'PL',
                'latitude': 50, 'longitude': 20, 'previous_latitude': None,
                'previous_longitude': None, 'verified_by': 'test fixture',
                'verified_at': '2026-11-07', 'sources': ['https://example.org/test-fixture']}

    def test_foreign_homonym_is_rejected(self):
        row = dict(self.record(), latitude=55.935833, longitude=110.099167)
        self.assertTrue(validate([row]))

    def test_unreviewed_missing_duplicate_and_invalid_records(self):
        self.assertTrue(validate([]))
        for patch in [{'verified_by': ''}, {'wikidata_id': ''}, {'latitude': float('nan')},
                      {'slug': "x';drop table peaks;--"}, {'sources': []}]:
            with self.subTest(patch=patch):
                self.assertTrue(validate([dict(self.record(), **patch)]))
        self.assertTrue(validate([self.record(), self.record()]))

    def test_sql_guards_against_stale_values_and_never_changes_elevation(self):
        sql = sql_for([self.record()])
        self.assertIn('latitude is not distinct from null', sql)
        self.assertIn('st_makepoint(20, 50)', sql)
        self.assertNotIn('elevation_m', sql)
        self.assertIn('raise exception', sql)


if __name__ == '__main__':
    unittest.main()
