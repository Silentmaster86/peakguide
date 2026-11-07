import { expect, it } from 'vitest';
import { authRedirect } from './authRedirect';
it('preserves path, query and fragment for an internal destination', () => {
  expect(authRedirect({ pathname: '/panel', search: '?tab=messages', hash: '#new' })).toBe('/panel?tab=messages#new');
});
it.each(['https://evil.example/', '//evil.example/', '/\\evil.example/', 'javascript:alert(1)'])('rejects an external destination: %s', (path) => {
  expect(authRedirect(path)).toBe('/panel');
});
