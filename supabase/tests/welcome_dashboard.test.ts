import assert from 'node:assert/strict';

Deno.test('dashboard bundle protects the endpoint and remains paused without opening a server', async () => {
  const keys = ['WELCOME_WORKER_SECRET', 'WELCOME_EMAIL_ENABLED'];
  const before = keys.map(key => Deno.env.get(key));
  const originalServe = Deno.serve;
  let captured: ((request: Request) => Response | Promise<Response>) | undefined;
  try {
    Deno.env.set(keys[0], 'dashboard-test-secret-at-least-32-characters');
    Deno.env.set(keys[1], 'false');
    Deno.serve = ((callback: typeof captured) => { captured = callback; return {}; }) as typeof Deno.serve;
    await import('../dashboard/welcome-email.ts');
    assert.ok(captured);
    const unauthorized = await captured(new Request('https://test.invalid', { method: 'POST' }));
    assert.equal(unauthorized.status, 401);
    const paused = await captured(new Request('https://test.invalid', {
      method: 'POST', headers: { 'x-welcome-secret': 'dashboard-test-secret-at-least-32-characters' },
    }));
    assert.deepEqual(await paused.json(), { status: 'paused' });
  } finally {
    Deno.serve = originalServe;
    keys.forEach((key, i) => before[i] === undefined ? Deno.env.delete(key) : Deno.env.set(key, before[i]!));
  }
});
