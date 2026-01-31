import { useEffect, useState } from "react";

export function useMedia(query) {
	const [matches, setMatches] = useState(() => {
		if (typeof window === "undefined") return false;
		return window.matchMedia?.(query)?.matches ?? false;
	});

	useEffect(() => {
		const mql = window.matchMedia?.(query);
		if (!mql) return;

		const onChange = () => setMatches(mql.matches);
		onChange();

		mql.addEventListener?.("change", onChange);
		return () => mql.removeEventListener?.("change", onChange);
	}, [query]);

	return matches;
}
