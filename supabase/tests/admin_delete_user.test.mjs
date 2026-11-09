import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDeleteUserHandler } from '../functions/admin-delete-user/handler.mjs';

const CALLER = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
const TARGET = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
const ORIGIN = 'https://peak-guide.netlify.app';

function fixture(options = {}) {
  const calls = [];
  const client = {
    auth: {
      getUser: async (token) => {
        calls.push(['verify', token]);
        return options.identity || { data: { user: { id: CALLER } }, error: null };
      },
      admin: { deleteUser: async (id) => {
        calls.push(['delete', id]);
        if (options.throwOnDelete) throw new Error('secret-server-detail');
        return options.deletion || { data: { user: { id } }, error: null };
      } },
    },
    from: (table) => {
      calls.push(['table', table]);
      return { select: (columns) => {
        calls.push(['columns', columns]);
        return { eq: (column, id) => {
          calls.push(['profile', column, id]);
          return { maybeSingle: async () => options.profile || { data: { role: 'admin', is_admin: true }, error: null } };
        } };
      } };
    },
  };
  const handler = createDeleteUserHandler({
    allowedOrigins: new Set([ORIGIN]),
    getClient: () => {
      if (options.missingConfig) throw new Error('secret-config');
      return client;
    },
  });
  return { handler, calls };
}

function request({ method = 'POST', origin = ORIGIN, token = 'Bearer valid-token',
  contentType = 'application/json', body = JSON.stringify({ userId: TARGET }) } = {}) {
  const headers = new Headers();
  if (origin !== null) headers.set('origin', origin);
  if (token !== null) headers.set('authorization', token);
  if (contentType !== null) headers.set('content-type', contentType);
  return new Request('https://example.supabase.co/functions/v1/admin-delete-user', {
    method, headers, ...(method === 'POST' ? { body } : {}),
  });
}

for (const [name, override, status] of [
  ['missing token', { token: null }, 401],
  ['wrong authentication scheme', { token: 'Basic abc' }, 401],
  ['untrusted origin', { origin: 'https://attacker.example' }, 403],
  ['wrong method', { method: 'GET' }, 405],
  ['wrong content type', { contentType: 'text/plain' }, 415],
  ['malformed JSON', { body: '{' }, 400],
  ['invalid UUID', { body: '{"userId":"all"}' }, 400],
  ['array payload', { body: '[{"userId":"x"}]' }, 400],
  ['null payload', { body: 'null' }, 400],
  ['oversized body', { body: 'x'.repeat(4097) }, 413],
]) {
  test(`rejects ${name} before accessing Auth or database`, async () => {
    const { handler, calls } = fixture();
    assert.equal((await handler(request(override))).status, status);
    assert.deepEqual(calls, []);
  });
}

test('preflight is allowed only for the configured origin and never deletes', async () => {
  const { handler, calls } = fixture();
  const response = await handler(request({ method: 'OPTIONS', token: null }));
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('access-control-allow-origin'), ORIGIN);
  assert.deepEqual(calls, []);
});

for (const [name, options, status] of [
  ['invalid JWT', { identity: { data: { user: null }, error: { message: 'invalid' } } }, 401],
  ['unconfirmed identity', { identity: { data: {} } }, 401],
  ['ordinary user despite claimed admin payload', { profile: { data: { role: 'user', is_admin: false } } }, 403],
  ['inconsistent role', { profile: { data: { role: 'user', is_admin: true } } }, 403],
  ['inconsistent flag', { profile: { data: { role: 'admin', is_admin: false } } }, 403],
  ['missing profile', { profile: { data: null } }, 403],
  ['failed profile read', { profile: { data: null, error: { message: 'private details' } } }, 503],
  ['missing server configuration', { missingConfig: true }, 503],
]) {
  test(`fails closed for ${name}`, async () => {
    const { handler, calls } = fixture(options);
    const response = await handler(request({ body: JSON.stringify({ userId: TARGET, role: 'admin', is_admin: true }) }));
    assert.equal(response.status, status);
    assert.equal(calls.some(([action]) => action === 'delete'), false);
    assert.doesNotMatch(await response.text(), /private details|secret/);
  });
}

test('rejects self-deletion including uppercase UUID', async () => {
  const { handler, calls } = fixture();
  const response = await handler(request({ body: JSON.stringify({ userId: CALLER.toUpperCase() }) }));
  assert.equal(response.status, 403);
  assert.equal((await response.json()).error, 'SELF_DELETE_FORBIDDEN');
  assert.equal(calls.some(([action]) => action === 'delete'), false);
});

test('verifies identity and current profile before deleting exactly the requested Auth account', async () => {
  const { handler, calls } = fixture();
  const response = await handler(request());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, userId: TARGET });
  assert.deepEqual(calls, [['verify', 'valid-token'], ['table', 'profiles'], ['columns', 'role,is_admin'],
    ['profile', 'id', CALLER], ['delete', TARGET]]);
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

for (const [name, options, status] of [
  ['database protection rejects deletion', { deletion: { error: { message: 'sensitive SQL' } } }, 409],
  ['missing account', { deletion: { error: { status: 404 } } }, 404],
  ['unconfirmed deletion', { deletion: { data: { user: {} } } }, 502],
  ['network failure', { throwOnDelete: true }, 503],
]) {
  test(`never reports success or falls back to deleting profiles when ${name}`, async () => {
    const { handler, calls } = fixture(options);
    const response = await handler(request());
    assert.equal(response.status, status);
    const text = await response.text();
    assert.doesNotMatch(text, /sensitive SQL|secret-server-detail|"ok":true/);
    assert.equal(calls.filter(([action]) => action === 'delete').length, 1);
  });
}

test('a non-browser request still requires an authenticated administrator', async () => {
  const { handler, calls } = fixture();
  assert.equal((await handler(request({ origin: null, token: null }))).status, 401);
  assert.deepEqual(calls, []);
});
