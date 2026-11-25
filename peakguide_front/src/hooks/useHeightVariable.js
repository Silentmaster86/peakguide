import { useCallback } from 'react';

// React 19 callback refs clean up when the element leaves the page. Measure the
// actual wrapped header instead of guessing its height for a viewport/language.
export function useHeightVariable(name) {
  return useCallback(node => {
    if (!node) return;
    const root = document.documentElement;
    const previous = root.style.getPropertyValue(name);
    const update = () => root.style.setProperty(name, `${node.getBoundingClientRect().height}px`);
    update();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    observer?.observe(node);
    window.addEventListener('resize', update);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', update);
      if (previous) root.style.setProperty(name, previous);
      else root.style.removeProperty(name);
    };
  }, [name]);
}
