import { createClient } from 'npm:@supabase/supabase-js@2.107.0';
import { createDeleteUserHandler } from './handler.mjs';

const allowedOrigins = new Set(
  (Deno.env.get('ALLOWED_ORIGINS') || 'https://peak-guide.netlify.app')
    .split(',').map((origin) => origin.trim()).filter(Boolean),
);

Deno.serve(createDeleteUserHandler({
  allowedOrigins,
  getClient: () => {
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) throw new Error('Missing server configuration');
    // No caller Authorization override on the administrative client.
    return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  },
}));
