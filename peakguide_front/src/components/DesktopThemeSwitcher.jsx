import { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "ui_theme_mode"; // "system" | "light" | "dark"

export default function DesktopThemeSwitcher({ lang = "pl", compact = false }) {
	const t = useMemo(() => getLabels(lang), [lang]);
	const [open, setOpen] = useState(false);
	const [mode, setMode] = useState(readStoredMode());
	const wrapRef = useRef(null);

	// apply theme + persist
	useEffect(() => {
		applyThemeMode(mode);
		safeStorageSet(STORAGE_KEY, mode);
	}, [mode]);

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
			if (e.key === "Escape") setOpen(false);
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);

	const options = [
		{ value: "system", label: t.system, icon: "🖥️" },
		{ value: "light", label: t.light, icon: "☀️" },
		{ value: "dark", label: t.dark, icon: "🌙" },
	];

	const current = options.find((o) => o.value === mode) || options[0];

	return (
		<div ref={wrapRef} style={styles.wrap} id='desktop-theme-switcher'>
			<button
				type='button'
				style={styles.btn}
				onClick={() => setOpen((v) => !v)}
				aria-haspopup='listbox'
				aria-expanded={open}
				aria-label={t.aria}
			>
				<span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
					<span aria-hidden='true'>{current.icon}</span>
					{!compact ? (
						<span style={styles.btnText}>{current.label}</span>
					) : null}
				</span>
				<span aria-hidden='true' style={{ opacity: 0.8 }}>
					▾
				</span>
			</button>

			{open && (
				<div style={styles.menu} role='listbox' aria-label={t.aria}>
					{options.map((o) => {
						const active = o.value === mode;
						return (
							<button
								key={o.value}
								type='button'
								role='option'
								aria-selected={active}
								onClick={() => {
									setMode(o.value);
									setOpen(false);
								}}
								style={{
									...styles.item,
									...(active ? styles.itemActive : null),
								}}
							>
								<span aria-hidden='true'>{o.icon}</span>
								<span style={{ fontWeight: 900 }}>{o.label}</span>
								{active ? (
									<span style={{ marginLeft: "auto", opacity: 0.85 }}>✓</span>
								) : null}
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}

/* ---------- storage helpers (no eslint no-empty issues) ---------- */

function safeStorageGet(key) {
	try {
		return localStorage.getItem(key);
	} catch (e) {
		// ignore (storage might be blocked)
		return null;
	}
}

function safeStorageSet(key, value) {
	try {
		localStorage.setItem(key, value);
	} catch (e) {
		// ignore (storage might be blocked)
	}
}

/* ---------- theme engine (Option A: CSS handles system) ---------- */

function readStoredMode() {
	const raw = safeStorageGet(STORAGE_KEY);
	if (raw === "light" || raw === "dark" || raw === "system") return raw;
	return "system";
}

function applyThemeMode(mode) {
	const root = document.documentElement;

	if (mode === "system") {
		root.removeAttribute("data-theme");
		return;
	}

	root.setAttribute("data-theme", mode); // "light" | "dark"
}

/* ---------- labels + styles ---------- */

function getLabels(lang) {
	const dict = {
		pl: { aria: "Motyw", system: "System", light: "Jasny", dark: "Ciemny" },
		en: { aria: "Theme", system: "System", light: "Light", dark: "Dark" },
		ua: { aria: "Тема", system: "Система", light: "Світла", dark: "Темна" },
		zh: { aria: "主题", system: "系统", light: "浅色", dark: "深色" },
	};
	return dict[lang] || dict.pl;
}

const styles = {
	wrap: { position: "relative" },

	btn: {
		display: "inline-flex",
		alignItems: "center",
		justifyContent: "center",
		gap: 10,
		height: "var(--nav-pill-h)",
		padding: "0 var(--nav-pill-px)",
		borderRadius: 999,
		border: "1px solid var(--border)",
		fontSize: "var(--nav-pill-fs)",
		background: "var(--tollbar-bg)",
		color: "var(--text)",
		boxShadow: "var(--shadow-soft)",
		fontWeight: 900,
		cursor: "pointer",
	},

	btnText: { fontSize: 13, opacity: 0.9 },

	menu: {
		position: "absolute",
		right: 0,
		top: "calc(100% + 8px)",
		minWidth: 180,
		borderRadius: 14,
		border: "1px solid var(--border)",
		background: "var(--btn-bg)",
		boxShadow: "var(--shadow-soft)",
		overflow: "hidden",
		backdropFilter: "blur(10px)",
		padding: 6,
		zIndex: 50,
	},

	item: {
		width: "100%",
		display: "flex",
		alignItems: "center",
		gap: 10,
		padding: "10px 10px",
		borderRadius: 12,
		border: "1px solid transparent",
		background: "transparent",
		cursor: "pointer",
		color: "var(--text)",
	},

	itemActive: {
		border: "1px solid rgba(31,122,79,0.22)",
		background: "rgba(31,122,79,0.08)",
	},
};
