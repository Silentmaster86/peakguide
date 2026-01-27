import { useEffect, useState } from "react";

export function useMediaQuery(query) {
  // Initialize from the current media query match
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    // Guard for non-browser environments
    if (typeof window === "undefined") return;

    const mql = window.matchMedia(query);

    // Update only when the value actually changes
    const update = () => {
      setMatches((prev) => {
        const next = mql.matches;
        return prev === next ? prev : next;
      });
    };

    // Subscribe to changes (modern API)
    mql.addEventListener("change", update);

    // Sync once in case query changed and state is out of date
    update();

    return () => {
      mql.removeEventListener("change", update);
    };
  }, [query]);

  return matches;
}
