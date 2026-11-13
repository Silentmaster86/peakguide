import { expect, it } from 'vitest';
import { countLabel, formatDuration } from './format';
it('uses Polish and Ukrainian plural rules, including one and few', () => {
  expect(countLabel(1, 'peaks', 'pl')).toBe('1 szczyt');
  expect(countLabel(2, 'ranges', 'pl')).toBe('2 pasma');
  expect(countLabel(12, 'peaks', 'pl')).toBe('12 szczytów');
  expect(countLabel(21, 'peaks', 'ua')).toBe('21 вершина');
});
it('formats shorter walks and Chinese time units without a zero-hour prefix', () => {
  expect(formatDuration(30, 'pl')).toBe('30 min');
  expect(formatDuration(90, 'zh')).toBe('1 小时 30 分钟');
  expect(formatDuration(null)).toBe('—');
});
