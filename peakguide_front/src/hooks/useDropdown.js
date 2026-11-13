import { useEffect, useRef, useState } from "react";

export function useDropdown() {
	const [open, setOpen] = useState(false);
	const wrapRef = useRef(null);

	// close on outside click
	useEffect(() => {
		function onDown(e) {
			if (!wrapRef.current) return;
			if (!wrapRef.current.contains(e.target)) setOpen(false);
		}
		window.addEventListener("pointerdown", onDown);
		return () => window.removeEventListener("pointerdown", onDown);
	}, []);

	// close on Escape
	useEffect(() => {
		function onKey(e) {
			if (e.key === 'Escape' && wrapRef.current?.contains(document.activeElement)) {
        setOpen(false);
        wrapRef.current.querySelector('button')?.focus();
      }
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);

	return { open, setOpen, wrapRef };
}
