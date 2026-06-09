import { useEffect, useMemo, useState } from 'react';

export default function DropdownMenu({
	open,
	wrapRef,
	items = [],
	ariaLabel,
	minWidth = 200,
	onSelect,
}) {
	const [mode, setMode] = useState('anchor-right');

	useEffect(() => {
		if (!open) return;
		if (!wrapRef?.current) return;

		const updatePosition = () => {
			const rect = wrapRef.current.getBoundingClientRect();
			const viewport = window.innerWidth;
			const menuWidth = Math.min(Math.max(minWidth, 220), viewport - 24);

			const canOpenRight = rect.left + menuWidth <= viewport - 12;
			const canOpenLeft = rect.right - menuWidth >= 12;

			if (viewport <= 430) {
				setMode('fixed');
			} else if (canOpenRight) {
				setMode('anchor-left');
			} else if (canOpenLeft) {
				setMode('anchor-right');
			} else {
				setMode('fixed');
			}
		};

		updatePosition();

		window.addEventListener('resize', updatePosition);
		window.addEventListener('scroll', updatePosition, true);

		return () => {
			window.removeEventListener('resize', updatePosition);
			window.removeEventListener('scroll', updatePosition, true);
		};
	}, [open, wrapRef, minWidth]);

	const menuStyle = useMemo(() => {
		const base = {
			...styles.menu,
			minWidth,
			width: minWidth,
		};

		if (mode === 'fixed') {
			return {
				...base,
				...styles.fixed,
			};
		}

		if (mode === 'anchor-left') {
			return {
				...base,
				...styles.anchorLeft,
			};
		}

		return {
			...base,
			...styles.anchorRight,
		};
	}, [mode, minWidth]);

	if (!open) return null;

	return (
		<div style={menuStyle} role='listbox' aria-label={ariaLabel}>
			{items.map((it) => {
				if (it.type === 'sep') {
					return <div key={it.key} style={styles.sep} />;
				}

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
						title={it.tip || ''}
					>
						{it.icon ? <span aria-hidden='true'>{it.icon}</span> : null}

						{it.badge ? <span style={styles.badge}>{it.badge}</span> : null}

						<span style={styles.label}>{it.label}</span>

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
		position: 'absolute',
		top: 'calc(100% + 8px)',
		zIndex: 9999,
		maxWidth: 'calc(100vw - 24px)',
		maxHeight: 'min(70vh, 420px)',
		overflowY: 'auto',
		background: 'var(--menu-bg)',
		border: '1px solid var(--border)',
		borderRadius: 16,
		boxShadow: 'var(--shadow)',
		padding: 8,
		backdropFilter: 'blur(14px)',
		WebkitBackdropFilter: 'blur(14px)',
	},

	anchorLeft: {
		left: 0,
		right: 'auto',
	},

	anchorRight: {
		right: 0,
		left: 'auto',
	},

	fixed: {
		position: 'fixed',
		top: 96,
		left: 12,
		right: 12,
		width: 'auto',
		minWidth: 'auto',
		maxWidth: 'none',
	},

	item: {
		width: '100%',
		display: 'flex',
		alignItems: 'center',
		gap: 10,
		padding: '10px 10px',
		borderRadius: 12,
		border: '1px solid transparent',
		background: 'transparent',
		cursor: 'pointer',
		color: 'var(--text)',
		textAlign: 'left',
	},

	itemActive: {
		border: '1px solid color-mix(in srgb, var(--primary) 26%, var(--border))',
		background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
	},

	itemDisabled: {
		cursor: 'not-allowed',
		opacity: 0.75,
		background: 'var(--surface-2)',
	},

	badge: {
		minWidth: 44,
		height: 34,
		display: 'grid',
		placeItems: 'center',
		textAlign: 'center',
		fontWeight: 1000,
		padding: '0 8px',
		borderRadius: 10,
		background: 'var(--btn-bg)',
		border: '1px solid var(--btn-border)',
		color: 'var(--text)',
		lineHeight: 1,
		fontSize: 16,
		flex: '0 0 auto',
	},

	label: {
		fontWeight: 900,
		minWidth: 0,
		whiteSpace: 'nowrap',
		overflow: 'hidden',
		textOverflow: 'ellipsis',
	},

	sub: {
		marginLeft: 'auto',
		fontSize: 12,
		opacity: 0.72,
		lineHeight: 1.1,
		whiteSpace: 'nowrap',
		flex: '0 0 auto',
	},

	pill: {
		marginLeft: 'auto',
		fontSize: 11,
		fontWeight: 1000,
		padding: '4px 8px',
		borderRadius: 999,
		border: '1px solid rgba(217,119,6,0.25)',
		background: 'rgba(217,119,6,0.10)',
		color: 'rgba(217,119,6,0.95)',
		whiteSpace: 'nowrap',
	},

	check: {
		marginLeft: 8,
		opacity: 0.9,
		flex: '0 0 auto',
	},

	sep: {
		height: 1,
		background: 'var(--border)',
		margin: '6px 6px',
		borderRadius: 99,
	},
};
