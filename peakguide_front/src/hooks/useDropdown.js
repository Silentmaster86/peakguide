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

	// Close when keyboard or programmatic focus leaves the popup group.
	useEffect(() => {
		if (!open) return;
		function onFocus(e) {
			if (!wrapRef.current?.contains(e.target)) setOpen(false);
		}
		window.addEventListener('focusin', onFocus);
		return () => window.removeEventListener('focusin', onFocus);
	}, [open]);

	// Start native Tab navigation at the trigger before removing popup items.
	// Escape restores the trigger; Tab/Shift+Tab continue outside the popup.
	useEffect(() => {
		if (!open) return;
		function onKey(e) {
			if (['Escape', 'Tab'].includes(e.key) && wrapRef.current?.contains(document.activeElement)) {
				if (e.key === 'Escape') e.preventDefault();
        setOpen(false);
        wrapRef.current.querySelector('button')?.focus({preventScroll: true});
      }
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open]);

	function onTriggerKeyDown(e) {
		if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
			e.preventDefault();
			setOpen(true);
		}
	}

	return { open, setOpen, wrapRef, onTriggerKeyDown };
}
