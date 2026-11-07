import { expect, it } from 'vitest';
import { elevationStats } from './elevationStats';
it('does not turn missing elevations into a zero-metre summit', () => {
  expect(elevationStats([{ elevation_m: null }, { elevation_m: '' }, { elevation_m: 1200 }])).toEqual({ count: 3, minElev: 1200, maxElev: 1200 });
  expect(elevationStats([{ elevation_m: null }])).toEqual({ count: 1, minElev: null, maxElev: null });
});
it('retains a legitimate zero and numeric database strings', () => {
  expect(elevationStats([{ elevation_m: 0 }, { elevation_m: '123' }])).toEqual({ count: 2, minElev: 0, maxElev: 123 });
});
