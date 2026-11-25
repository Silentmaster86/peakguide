import { useEffect, useState } from 'react';

// A new key hides the previous result immediately; cleanup also cancels transport.
export function useWeatherResource(key, load) {
  const [result, setResult] = useState(null);
  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    let cancelled = false;
    load(controller.signal).then(data => {
      if (!controller.signal.aborted) setResult({ key, status: 'success', data });
    }).catch(error => {
      if (!cancelled) setResult({ key, status: 'error', error: typeof error?.code === 'string' ? error.code : 'unavailable' });
    }).finally(() => clearTimeout(timeout));
    return () => { cancelled = true; clearTimeout(timeout); controller.abort(); };
  }, [key, load]);
  if (!key) return { status: 'idle' };
  return result?.key === key ? result : { status: 'loading' };
}
