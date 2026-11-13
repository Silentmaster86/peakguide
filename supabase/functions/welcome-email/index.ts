import { createClient } from 'npm:@supabase/supabase-js@2.107.0';
import nodemailer from 'npm:nodemailer@10.4.0';
import { createWelcomeEmailHandler } from './handler.mjs';
import { createGmailSender } from './gmail.mjs';

const secret = Deno.env.get('WELCOME_WORKER_SECRET');
const url = Deno.env.get('SUPABASE_URL');
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const enabled = Deno.env.get('WELCOME_EMAIL_ENABLED') === 'true';
let sendMail: ((message: { to: string; subject: string; html: string; text: string; replyTo: string }) => Promise<void>) | undefined;
try {
  sendMail = createGmailSender({
    gmailUser: Deno.env.get('GMAIL_USER'),
    appPassword: Deno.env.get('GMAIL_APP_PASSWORD'),
    createTransport: nodemailer.createTransport,
  });
} catch { /* Leave delivery disabled when credentials are missing. */ }
const handler = createWelcomeEmailHandler({
  secret, enabled,
  getClient: () => createClient(url!, serviceKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  }),
  sendMail,
});
Deno.serve(request => {
  if (enabled && (!sendMail || !url || !serviceKey)) return new Response('{"error":"SMTP_NOT_CONFIGURED"}', {
    status: 503, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
  return handler(request);
});
