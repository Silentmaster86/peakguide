import { useEffect, useRef, useState } from "react";

export default function NavDropdown({ label, items, align = "right" }) {
	const [open, setOpen] = useState(false);
	const wrapRef = useRef(null);

	useEffect(() => {
		function onDown(e) {
			if (!wrapRef.current) return;
			if (!wrapRef.current.contains(e.target)) setOpen(false);
		}
		window.addEventListener("pointerdown", onDown);
		return () => window.removeEventListener("pointerdown", onDown);
	}, []);

	useEffect(() => {
		function onKey(e) {
			if (e.key === "Escape") setOpen(false);
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);

	return (
		<div ref={wrapRef} style={styles.wrap}>
			<button
				type='button'
				style={styles.btn}
				onClick={() => setOpen((v) => !v)}
				aria-haspopup='menu'
				aria-expanded={open}
			>
				<span style={{ opacity: 0.9 }}>{label}</span>
				<span aria-hidden='true' style={{ opacity: 0.8 }}>
					▾
				</span>
			</button>

			{open && (
				<div
					style={{
						...styles.menu,
						...(align === "left" ? styles.left : styles.right),
					}}
					role='menu'
				>
					{items.map((it) => {
						if (it.type === "sep")
							return <div key={it.key} style={styles.sep} />;

						if (it.disabled) {
							return (
								<div key={it.key} style={styles.disabledItem} title={it.tip}>
									<span style={{ fontWeight: 900 }}>{it.label}</span>
									{it.pill ? <span style={styles.pill}>{it.pill}</span> : null}
								</div>
							);
						}

						return (
							<a
								key={it.key}
								href={it.href}
								onClick={() => setOpen(false)}
								style={styles.item}
								role='menuitem'
							>
								<span style={{ fontWeight: 900 }}>{it.label}</span>
								{it.sub ? <span style={styles.sub}>{it.sub}</span> : null}
							</a>
						);
					})}
				</div>
			)}
		</div>
	);
}

const styles = {
	wrap: { position: "relative", display: "inline-flex" },

	btn: {
		display: "inline-flex",
		alignItems: "center",
		gap: 8,
		height: "var(--nav-pill-h)",
		padding: "0 var(--nav-pill-px)",
		borderRadius: 999,
		border: "1px solid var(--border)",
		fontSize: "var(--nav-pill-fs)",
		background: "rgba(255,255,255,0.55)",
		color: "var(--text)",
		boxShadow: "var(--shadow-soft)",
		fontWeight: 1000,
		cursor: "pointer",
		userSelect: "none",
	},

	menu: {
		position: "absolute",
		top: "calc(100% + 8px)",
		minWidth: 220,
		borderRadius: 14,
		border: "1px solid var(--border)",
		background: "var(--surface)",
		boxShadow: "var(--shadow-soft)",
		overflow: "hidden",
		backdropFilter: "blur(12px)",
		padding: 6,
		zIndex: 50,
	},

	right: { right: 0 },
	left: { left: 0 },

	item: {
		display: "flex",
		flexDirection: "column",
		gap: 2,
		padding: "10px 10px",
		borderRadius: 12,
		textDecoration: "none",
		color: "var(--text)",
	},

	sub: { fontSize: 12, opacity: 0.72, lineHeight: 1.25 },

	disabledItem: {
		display: "flex",
		alignItems: "center",
		gap: 8,
		padding: "10px 10px",
		borderRadius: 12,
		color: "var(--muted)",
		cursor: "not-allowed",
		userSelect: "none",
		background: "rgba(15,23,42,0.03)",
	},

	pill: {
		marginLeft: "auto",
		fontSize: 11,
		fontWeight: 1000,
		padding: "4px 8px",
		borderRadius: 999,
		border: "1px solid rgba(217,119,6,0.25)",
		background: "rgba(217,119,6,0.10)",
		color: "rgba(217,119,6,0.95)",
	},

	sep: {
		height: 1,
		background: "rgba(15,23,42,0.12)",
		margin: "6px 6px",
		borderRadius: 99,
	},
};
