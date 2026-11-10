import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWelcomeEmailHandler, smtpFailureOutcome } from '../functions/welcome-email/handler.mjs';
const secret = 'test-worker-secret-with-at-least-32-chars';
const id = '11111111-1111-4111-8111-111111111111';
const user = { id, email: 'recipient@example.test', email_confirmed_at: '2026-01-01', user_metadata: { locale: 'en' } };
function setup({ enabled = true, job = true, lookup = { data: { user } }, sendError, finishError, claimError } = {}) {
  const sent = [], calls = [];
  const client = {
    rpc: async (name, args) => {
      calls.push({ name, args });
      if (name === 'claim_welcome_email') return { data: job ? [{ user_id: id, claim_token: 'lease' }] : [], error: claimError };
      return { data: !finishError, error: finishError };
    },
    auth: { admin: { getUserById: async requested => { assert.equal(requested, id); return lookup; } } },
  };
  const handler = createWelcomeEmailHandler({ secret, enabled, getClient: () => client,
    sendMail: async message => { sent.push(message); if (sendError) throw sendError; },
  });
  const request = (headers = { 'x-welcome-secret': secret }) => new Request('https://test.invalid', {
    method: 'POST', headers, body: JSON.stringify({ to: 'attacker@example.test', locale: 'zh' }),
  });
  return { handler, request, sent, calls };
}
for (const headers of [{}, { Authorization: 'Bearer user-jwt' }, { 'x-welcome-secret': 'wrong' }]) {
  test('untrusted caller cannot claim jobs or send mail: '+JSON.stringify(headers), async () => {
    const s = setup(); assert.equal((await s.handler(s.request(headers))).status, 401);
    assert.equal(s.calls.length, 0); assert.equal(s.sent.length, 0);
  });
}
test('rejects methods, paused worker leaves queue untouched', async () => {
  const s = setup({ enabled: false });
  assert.equal((await s.handler(new Request('https://test.invalid'))).status,405);
  assert.equal((await (await s.handler(s.request())).json()).status,'paused');
  assert.equal(s.calls.length,0);
});
test('selects recipient/language from verified Auth record, ignoring body; applies Reply-To', async () => {
  const s = setup(); assert.equal((await s.handler(s.request())).status,200);
  assert.equal(s.sent[0].to,user.email); assert.equal(s.sent[0].locale,'en');
  assert.equal(s.sent[0].replyTo,'przemyslaw.pietkun@gmail.com');
  assert.equal(s.calls[1].args.p_outcome,'sent');
  assert.equal(s.calls[1].args.p_claim_token,'lease');
});
for (const invalid of [{ ...user, email_confirmed_at: null }, { ...user, is_anonymous: true }, { ...user, email: 'victim@example.test,attacker@example.test' }, { ...user, id: 'other' }]) {
  test('does not send when account is unconfirmed, anonymous, mismatched or malformed '+JSON.stringify(invalid), async () => {
    const s = setup({ lookup: { data: { user: invalid } } });
    await s.handler(s.request()); assert.equal(s.sent.length,0);
    assert.equal(s.calls[1].args.p_outcome,'cancelled');
  });
}
test('deleted account is cancelled; transient Auth error is retried before any send', async () => {
  for (const status of [404,503]) {
    const s = setup({ lookup: { error: { status } } }); await s.handler(s.request());
    assert.equal(s.sent.length,0); assert.equal(s.calls[1].args.p_outcome,status===404?'cancelled':'retry');
  }
});
for (const [error,outcome] of [[{ responseCode:421 },'retry'],[{ responseCode:550 },'failed'],[{ code:'ETIMEDOUT' },'uncertain']]) {
  test('SMTP failure outcome '+outcome,async () => {
    const s = setup({ sendError:error }); await s.handler(s.request());
    assert.equal(s.calls[1].args.p_outcome,outcome);
    assert.equal(smtpFailureOutcome(error),outcome);
  });
}
test('successful send followed by failed receipt is not sent again in the same invocation',async () => {
  const s = setup({ finishError: new Error('db offline private message') });
  const response = await s.handler(s.request());
  assert.equal(response.status,503); assert.equal(s.sent.length,1);
  assert.ok(!(await response.text()).includes('private'));
});
test('empty queue and queue error never send',async () => {
  for (const args of [{ job:false },{ claimError: new Error('db') }]) {
    const s=setup(args); await s.handler(s.request()); assert.equal(s.sent.length,0);
  }
});

import { createGmailSender } from '../functions/welcome-email/gmail.mjs';
test('Gmail adapter requires TLS, applies real message headers, accepts only confirmed delivery', async () => {
  let options, envelope;
  const send = createGmailSender({ gmailUser:'owner@gmail.com',appPassword:'abcd efgh ijkl mnop',
    createTransport: config => { options=config; return { sendMail:async mail => { envelope=mail; return { accepted:['recipient@example.test'] }; } }; },
  });
  await send({ to:'recipient@example.test',replyTo:'owner@gmail.com',subject:'Hello',html:'<p>Hello</p>',text:'Hello' });
  assert.equal(options.host,'smtp.gmail.com'); assert.equal(options.port,465); assert.equal(options.secure,true);
  assert.equal(options.auth.pass,'abcdefghijklmnop'); assert.equal(options.disableFileAccess,true); assert.equal(options.disableUrlAccess,true);
  assert.deepEqual(envelope.replyTo,[{ address:'owner@gmail.com' }]);
  assert.equal(envelope.from.address,'owner@gmail.com');
  const reject = createGmailSender({ gmailUser:'owner@gmail.com',appPassword:'test',createTransport:()=>({ sendMail:async()=>({ accepted:[] }) }) });
  await assert.rejects(reject({ to:'recipient@example.test' }),/not confirmed/);
});
test('invalid Gmail sender configuration never initializes SMTP', () => {
  assert.throws(()=>createGmailSender({ gmailUser:'owner@gmail.com\nBcc:attacker@example.test',appPassword:'test',createTransport:()=>assert.fail() }));
});
