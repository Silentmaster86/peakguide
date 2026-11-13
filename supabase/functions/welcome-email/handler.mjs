import { renderEmail } from '../../templates/account-emails/render.mjs';

const json = (status, value) => new Response(JSON.stringify(value), {
  status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
});

async function sameSecret(actual, expected) {
  // Hash first to compare fixed-size values. Never log credentials or user data.
  const encode = new TextEncoder();
  const [a, b] = await Promise.all([actual, expected].map(value =>
    crypto.subtle.digest('SHA-256', encode.encode(value))));
  const left = new Uint8Array(a), right = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < left.length; i++) diff |= left[i] ^ right[i];
  return diff === 0;
}

export function smtpFailureOutcome(error) {
  // An explicit SMTP rejection means Gmail did not accept delivery. A timeout
  // or lost connection after DATA can mean it did: hold for manual review.
  if (Number.isInteger(error?.responseCode) && error.responseCode >= 400 && error.responseCode < 500) return 'retry';
  if (Number.isInteger(error?.responseCode) && error.responseCode >= 500 && error.responseCode < 600) return 'failed';
  return 'uncertain';
}

export function createWelcomeEmailHandler({ secret, enabled, getClient, sendMail }) {
  return async request => {
    if (request.method !== 'POST') return json(405, { error: 'METHOD_NOT_ALLOWED' });
    if (!secret || secret.length < 32) return json(503, { error: 'NOT_CONFIGURED' });
    const supplied = request.headers.get('x-welcome-secret') || '';
    if (supplied.length > 512 || !await sameSecret(supplied, secret)) return json(401, { error: 'UNAUTHORIZED' });
    if (!enabled) return json(200, { status: 'paused' });
    // Never read an email address or message content from the request body.
    let client, job;
    try {
      client = getClient();
      const result = await client.rpc('claim_welcome_email');
      if (result.error) throw result.error;
      job = result.data?.[0];
    } catch {
      return json(503, { error: 'QUEUE_UNAVAILABLE' });
    }
    if (!job) return json(200, { status: 'empty' });

    const finish = async outcome => {
      const { data, error } = await client.rpc('finish_welcome_email', {
        p_user_id: job.user_id, p_claim_token: job.claim_token, p_outcome: outcome,
      });
      if (error || data !== true) throw new Error('Could not record outcome');
      return json(200, { status: outcome });
    };
    try {
      let lookup;
      try { lookup = await client.auth.admin.getUserById(job.user_id); }
      catch { return await finish('retry'); }
      if (lookup.error) return await finish(lookup.error.status === 404 ? 'cancelled' : 'retry');
      const user = lookup.data?.user;
      if (!user || user.id !== job.user_id || !user.email_confirmed_at || user.is_anonymous
          || typeof user.email !== 'string' || !/^[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+$/.test(user.email)) {
        return await finish('cancelled');
      }
      const message = renderEmail('welcome', user.user_metadata?.locale);
      let outcome;
      try {
        await sendMail({ to: user.email, ...message });
        outcome = 'sent';
      } catch (error) {
        outcome = smtpFailureOutcome(error);
      }
      return await finish(outcome);
    } catch {
      // Do not resend if SMTP succeeded but persisting the receipt failed.
      // The lease expires into 'uncertain', for an operator to inspect.
      return json(503, { error: 'DELIVERY_STATE_UNAVAILABLE' });
    }
  };
}
