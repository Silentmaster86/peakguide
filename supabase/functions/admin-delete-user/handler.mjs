// Web-standard handler shared by Deno and the offline Node test suite.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_BODY_BYTES = 4096;

async function readBody(request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('INVALID_BODY');
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new Error('BODY_TOO_LARGE');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}

export function createDeleteUserHandler({ getClient, allowedOrigins }) {
  return async function handle(request) {
    const origin = request.headers.get('origin');
    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Vary': 'Origin',
    };
    const respond = (status, body) => new Response(JSON.stringify(body), { status, headers });
    const fail = (status, code) => respond(status, { error: code });
    if (origin && !allowedOrigins.has(origin)) return fail(403, 'ORIGIN_NOT_ALLOWED');
    if (origin) headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Headers'] = 'authorization, apikey, content-type, x-client-info';
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST') {
      headers.Allow = 'POST, OPTIONS';
      return fail(405, 'METHOD_NOT_ALLOWED');
    }
    const authorization = request.headers.get('authorization') || '';
    const match = authorization.match(/^Bearer\s+(\S+)$/i);
    if (!match) return fail(401, 'AUTH_REQUIRED');
    if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
      return fail(415, 'JSON_REQUIRED');
    }
    let body;
    try {
      body = await readBody(request);
    } catch (error) {
      return fail(error.message === 'BODY_TOO_LARGE' ? 413 : 400, 'INVALID_BODY');
    }
    if (!body || Array.isArray(body) || typeof body.userId !== 'string' || !UUID.test(body.userId)) {
      return fail(400, 'INVALID_USER_ID');
    }
    const userId = body.userId.toLowerCase();
    try {
      const client = getClient();
      // Verify with Auth. Never trust decoded JWT payload, metadata or request roles.
      const { data: identity, error: identityError } = await client.auth.getUser(match[1]);
      if (identityError || !identity?.user?.id) return fail(401, 'AUTH_REQUIRED');
      const callerId = identity.user.id.toLowerCase();
      const { data: profile, error: profileError } = await client.from('profiles')
        .select('role,is_admin').eq('id', callerId).maybeSingle();
      if (profileError) return fail(503, 'AUTHORIZATION_UNAVAILABLE');
      if (profile?.role !== 'admin' || profile?.is_admin !== true) return fail(403, 'ADMIN_REQUIRED');
      if (userId === callerId) return fail(403, 'SELF_DELETE_FORBIDDEN');
      // Delete through Auth, not profiles. Its FK cascade and migrations 012 +
      // protect_peakguide_admin enforce the last-admin invariant in the database.
      const { data, error } = await client.auth.admin.deleteUser(userId);
      if (error) return fail(error.status === 404 || error.code === 'user_not_found' ? 404 : 409,
        error.status === 404 || error.code === 'user_not_found' ? 'USER_NOT_FOUND' : 'DELETE_FAILED');
      if (data?.user?.id?.toLowerCase() !== userId) return fail(502, 'DELETE_UNCONFIRMED');
      return respond(200, { ok: true, userId });
    } catch {
      // Do not return SDK errors, database details or credentials to the client.
      return fail(503, 'SERVICE_UNAVAILABLE');
    }
  };
}
