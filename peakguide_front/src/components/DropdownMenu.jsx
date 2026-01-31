import { useEffect, useMemo, useState } from "react";

export default function DropdownMenu({
	open,
	wrapRef,
	items = [],
	ariaLabel,
	minWidth = 200,
	onSelect,
}) {
	const [align, setAlign] = useState("right");

	// auto align (don’t overflow viewport)
	useEffect(() => {
		if (!open) return;
		if (!wrapRef?.current) return;

		const rect = wrapRef.current.getBoundingClientRect();
		const approxMenuWidth = minWidth;
		const spaceRight = window.innerWidth - rect.right;
		const spaceLeft = rect.left;

		// if not enough room on right, flip to left
		if (spaceRight < approxMenuWidth && spaceLeft > approxMenuWidth)
			setAlign("left");
		else setAlign("right");
	}, [open, wrapRef, minWidth]);

	const menuStyle = useMemo(
		() => ({
			...styles.menu,
			minWidth,
			...(align === "right" ? styles.right : styles.left),
		}),
		[align, minWidth],
	);

	if (!open) return null;

	return (
		<div style={menuStyle} role='listbox' aria-label={ariaLabel}>
			{items.map((it) => {
				if (it.type === "sep") return <div key={it.key} style={styles.sep} />;

				const active = !!it.active;

				return (
					<button
						key={it.key}
						type='button'
						role='option'
						aria-selected={active}
						onClick={() => onSelect?.(it)}
						disabled={it.disabled}
						style={{
							...styles.item,
							...(active ? styles.itemActive : null),
							...(it.disabled ? styles.itemDisabled : null),
						}}
						title={it.tip || ""}
					>
						{it.icon ? <span aria-hidden='true'>{it.icon}</span> : null}

						{it.badge ? <span style={styles.badge}>{it.badge}</span> : null}

						<span style={{ fontWeight: 900 }}>{it.label}</span>

						{it.sub ? <span style={styles.sub}>{it.sub}</span> : null}

						{it.pill ? <span style={styles.pill}>{it.pill}</span> : null}

						{active ? <span style={styles.check}>✓</span> : null}
					</button>
				);
			})}
		</div>
	);
}

const styles = {
	menu: {
		position: "absolute",
		top: "calc(100% + 8px)",
		borderRadius: 14,
		border: "1px solid var(--btn-border)",
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
		textAlign: "left",
	},

	itemActive: {
		border: "1px solid rgba(31,122,79,0.22)",
		background: "rgba(31,122,79,0.08)",
	},

	itemDisabled: {
		cursor: "not-allowed",
		opacity: 0.75,
		background: "rgba(15,23,42,0.03)",
	},

	badge: {
		minWidth: 44,
		height: 34,
		display: "grid",
		placeItems: "center",
		textAlign: "center",
		fontWeight: 1000,
		padding: "0 8px",
		borderRadius: 10,
		background: "var(--btn-bg)",
		border: "1px solid var(--btn-border)",
		color: "var(--text)",
		lineHeight: 1,
		fontSize: 16, // <-- ważne dla flag
	},

	sub: {
		marginLeft: 8,
		fontSize: 12,
		opacity: 0.72,
		lineHeight: 1.1,
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

	check: { marginLeft: 10, opacity: 0.9 },

	sep: {
		height: 1,
		background: "rgba(15,23,42,0.12)",
		margin: "6px 6px",
		borderRadius: 99,
	},
};
