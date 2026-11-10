import assert from 'node:assert/strict';
import nodemailer from 'npm:nodemailer@10.4.0';
import { createGmailSender } from '../functions/welcome-email/gmail.mjs';
import { renderEmail } from '../templates/account-emails/render.mjs';

for (const locale of ['pl','en','uk','zh']) {
  Deno.test(`Nodemailer MIME ${locale}: real Reply-To and UTF-8 alternatives, no network`, async () => {
    let mime = '';
    const send = createGmailSender({
      gmailUser:'owner@gmail.com', appPassword:'local-test-only',
      createTransport: (options: Record<string, unknown>) => {
        const transport = nodemailer.createTransport({ ...options, streamTransport:true,buffer:true,newline:'unix' });
        return { sendMail: async (message: Record<string, unknown>) => {
          const result = await transport.sendMail(message);
          mime = result.message.toString();
          return { accepted:['recipient@example.test'] };
        } };
      },
    });
    const message = renderEmail('welcome',locale);
    assert.ok(message.replyTo);
    await send({ to:'recipient@example.test',...message,replyTo:message.replyTo });
    assert.match(mime,/Reply-To: przemyslaw\.pietkun@gmail\.com/);
    assert.match(mime,/To: recipient@example\.test/);
    assert.match(mime,/Content-Type: multipart\/alternative/);
    assert.match(mime,/Content-Type: text\/html; charset=utf-8/);
    assert.match(mime,/Content-Type: text\/plain; charset=utf-8/);
    assert.ok(!mime.includes('local-test-only'));
  });
}
