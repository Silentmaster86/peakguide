import { expect, it } from 'vitest';
import { messageValidation } from './messageValidation';
it.each(['@', 'a@', 'a b@example.com', 'a@example'])('rejects malformed email %s', (email) => {
  expect(messageValidation({ email, message: 'Hello there' })).toBe('emailError');
});
it('requires 5–5000 trimmed characters', () => {
  expect(messageValidation({ email: 'a@example.com', message: ' abcd ' })).toBe('messageError');
  expect(messageValidation({ email: 'a@example.com', message: 'abcde' })).toBeNull();
  expect(messageValidation({ email: 'a@example.com', message: 'x'.repeat(5001) })).toBe('messageError');
});
