import { useEffect, useRef, useState } from 'react';

export default function NavDropdown({ label, items, align = 'right' }) {
	const [open, setOpen] = useState(false);
	const wrapRef = useRef(null);
	const isSmall = window.innerWidth <= 529;

	useEffect(() => {
		function onDown(e) {
			if (!wrapRef.current) return;
			if (!wrapRef.current.contains(e.target)) setOpen(false);
		}

		window.addEventListener('pointerdown', onDown);
		return () => window.removeEventListener('pointerdown', onDown);
	}, []);

	useEffect(() => {
		function onKey(e) {
			if (e.key === 'Escape') setOpen(false);
		}

		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
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
				<span style={{ opacity: 0.95 }}>{label}</span>
				<span aria-hidden='true' style={{ opacity: 0.75 }}>
					▾
				</span>
			</button>

			{open && (
				<div
					style={{
						...styles.menu,
						...(isSmall ? styles.menuFixed : align === 'left' ? styles.left : styles.right),
					}}
					role='menu'
				>
					{items.map((it) => {
						if (it.type === 'sep') {
							return <div key={it.key} style={styles.sep} />;
						}

						if (it.disabled) {
							return (
								<div key={it.key} style={styles.disabledItem} title={it.tip}>
									<span style={styles.itemLabel}>{it.label}</span>

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
								<span style={styles.itemLabel}>{it.label}</span>
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
	wrap: {
		position: 'relative',
		display: 'inline-flex',
		minWidth: 0,
	},

	btn: {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		height: 'var(--nav-pill-h)',
		padding: '0 var(--nav-pill-px)',
		borderRadius: 999,
		border: '1px solid var(--border)',
		fontSize: 'var(--nav-pill-fs)',
		background: 'var(--btn-bg)',
		color: 'var(--text)',
		boxShadow: 'var(--shadow-soft)',
		fontWeight: 900,
		cursor: 'pointer',
		userSelect: 'none',
		whiteSpace: 'nowrap',
	},

	menu: {
		position: 'absolute',
		display: 'grid',
		gap: 8,
		top: 'calc(100% + 8px)',
		minWidth: 220,
		width: 'max-content',
		maxWidth: 'min(320px, calc(100vw - 24px))',
		maxHeight: 'min(70vh, 420px)',
		overflowY: 'auto',
		borderRadius: 16,
		border: '1px solid var(--border)',
		background: 'var(--menu-bg)',
		boxShadow: 'var(--shadow)',
		backdropFilter: 'blur(14px)',
		WebkitBackdropFilter: 'blur(14px)',
		padding: 8,
		zIndex: 999,
	},

	right: {
		right: 0,
		left: 'auto',
	},

	left: {
		left: 0,
		right: 'auto',
	},

	item: {
		display: 'flex',
		flexDirection: 'column',
		gap: 3,
		padding: '10px 12px',
		borderRadius: 12,
		textDecoration: 'none',
		color: 'var(--text)',
		background: 'var(--surface-2)',
		border: '1px solid var(--border)',
	},

	itemLabel: {
		fontWeight: 900,
		lineHeight: 1.15,
	},

	sub: {
		fontSize: 12,
		color: 'var(--muted)',
		lineHeight: 1.25,
	},

	disabledItem: {
		display: 'flex',
		alignItems: 'center',
		gap: 8,
		padding: '10px 12px',
		borderRadius: 12,
		color: 'var(--primary)',
		cursor: 'not-allowed',
		userSelect: 'none',
		background: 'color-mix(in srgb, var(--primary) 10%, var(--surface-2))',
		border: '1px solid color-mix(in srgb, var(--primary) 22%, var(--border))',
	},

	pill: {
		marginLeft: 'auto',
		fontSize: 11,
		fontWeight: 1000,
		padding: '4px 8px',
		borderRadius: 999,
		border: '1px solid rgba(217,119,6,0.25)',
		background: 'rgba(95, 53, 5, 0.8)',
		color: 'rgba(255, 209, 128, 1)',
		whiteSpace: 'nowrap',
	},

	sep: {
		height: 1,
		background: 'var(--border)',
		margin: '4px 2px',
		borderRadius: 99,
	},

	menuFixed: {
		position: 'fixed',
		top: 96,
		left: 12,
		right: 12,
		width: 'auto',
		minWidth: 'auto',
		maxWidth: 'none',
		zIndex: 9999,
	},
};
