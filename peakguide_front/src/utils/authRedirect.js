export function authRedirect(from, origin = window.location.origin) {
  const path = typeof from === 'string'
    ? from
    : `${from?.pathname || '/panel'}${from?.search || ''}${from?.hash || ''}`;
  try {
    if (!path.startsWith('/') || path.startsWith('//')) return '/panel';
    const url = new URL(path, origin);
    return url.origin === origin ? `${url.pathname}${url.search}${url.hash}` : '/panel';
  } catch {
    return '/panel';
  }
}
