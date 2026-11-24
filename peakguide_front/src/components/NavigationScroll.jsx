import { useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

// BrowserRouter does not provide data-router ScrollRestoration. Keep positions
// per history entry, including query-only filter entries, rather than per URL.
export default function NavigationScroll() {
  const location = useLocation();
  const navigation = useNavigationType();
  const positions = useRef(new Map());
  const previous = useRef(null);

  useLayoutEffect(() => {
    const original = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => { window.history.scrollRestoration = original; };
  }, []);

  useLayoutEffect(() => {
    const old = previous.current;
    previous.current = location;
    const saved = positions.current.get(location.key);
    const samePage = old?.pathname === location.pathname && old?.hash === location.hash;
    const restoreAnchor = location.hash && !(navigation === 'POP' && saved);
    let restoring = navigation === 'POP' || Boolean(location.hash) || !samePage;
    let frame;
    let observer;
    let timer;

    const remember = () => {
      if (restoring) return;
      positions.current.set(location.key, { x: window.scrollX, y: window.scrollY });
      if (positions.current.size > 100) positions.current.delete(positions.current.keys().next().value);
    };
    const finish = () => {
      restoring = false;
      observer?.disconnect();
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      remember();
    };
    const restore = () => {
      if (!restoring) return;
      let top = navigation === 'POP' ? saved?.y || 0 : 0;
      let left = navigation === 'POP' ? saved?.x || 0 : 0;
      if (restoreAnchor) {
        let id;
        try { id = decodeURIComponent(location.hash.slice(1)); } catch { finish(); return; }
        const target = document.getElementById(id);
        if (!target) return;
        const nav = document.getElementById('main-nav');
        top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - (nav?.getBoundingClientRect().height || 0) - 12);
        left = 0;
      }
      window.scrollTo({ top, left, behavior: 'instant' });
      // Anchors can move as catalogue content loads. For Back/Forward, wait
      // through late catalogue layout changes (native scroll anchoring can move it).
      if (!restoreAnchor && !(navigation === 'POP' && saved) && Math.abs(window.scrollY - top) < 2) finish();
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(restore);
    };
    window.addEventListener('scroll', remember, { passive: true });
    // User intent always wins over deferred restoration.
    for (const event of ['wheel', 'touchstart', 'pointerdown', 'keydown']) window.addEventListener(event, finish, { passive: true });
    if (restoring) {
      observer = new ResizeObserver(schedule);
      const content = document.getElementById('main-content');
      if (content) observer.observe(content);
      const nav = document.getElementById('main-nav');
      if (nav) observer.observe(nav);
      timer = setTimeout(finish, 5000);
      restore();
      if (!samePage && navigation !== 'POP' && !location.hash) content?.focus({ preventScroll: true });
    } else remember();
    return () => {
      observer?.disconnect();
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      window.removeEventListener('scroll', remember);
      for (const event of ['wheel', 'touchstart', 'pointerdown', 'keydown']) window.removeEventListener(event, finish);
    };
  }, [location, navigation]);

  return null;
}
