import { expect, it } from 'vitest';
import { preparePeakPayload } from './validation';
const valid = { slug: 'test-peak', range_id: '1', elevation_m: '1000', latitude: '', longitude: '', i18n: { pl: { name: 'Test' }, en: { name: '' } } };
it('preserves missing coordinates and omits empty translations instead of inventing slug names', () => {
  expect(preparePeakPayload(valid)).toMatchObject({ latitude: null, longitude: null, range_id: 1, elevation_m: 1000, i18n: { pl: { name: 'Test' } } });
  expect(preparePeakPayload(valid).i18n.en).toBeUndefined();
});
it.each([{ elevation_m: '' }, { elevation_m: 'no' }, { range_id: '1.5' }, { latitude: '91', longitude: '20' }, { latitude: '50', longitude: '' }, { longitude: '181', latitude: '50' }, { i18n: {} }, { i18n: { pl: { description: 'No name' } } }])('rejects invalid data: %j', (change) => {
  expect(() => preparePeakPayload({ ...valid, ...change })).toThrow();
});
