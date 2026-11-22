import unittest
from build_weather_locations import locations_from_rows


class WeatherLocationsTest(unittest.TestCase):
    def test_rejects_missing_and_invalid_coordinates_without_inventing_zero(self):
        rows = [{'slug':'equator','latitude':0,'longitude':0,'elevation_m':1},
                {'slug':'missing','latitude':None,'longitude':20,'elevation_m':1000},
                {'slug':'invalid','latitude':999,'longitude':20,'elevation_m':1000},
                {'slug':'boolean','latitude':True,'longitude':20,'elevation_m':1000}]
        self.assertEqual(list(locations_from_rows(rows)), ['equator'])
        with self.assertRaises(ValueError):
            locations_from_rows(rows[1:])


if __name__ == '__main__':
    unittest.main()
