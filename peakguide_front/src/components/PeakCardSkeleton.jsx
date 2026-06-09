export default function PeakCardSkeleton() {
	return (
		<div style={card} aria-hidden='true'>
			<div style={row}>
				<div style={{ flex: 1 }}>
					<div
						style={{ ...shimmer, height: 18, width: "70%", marginBottom: 10 }}
					/>
					<div style={{ ...shimmer, height: 12, width: "40%" }} />
				</div>
				<div style={{ ...shimmer, height: 30, width: 90, borderRadius: 999 }} />
			</div>

			<div style={{ display: "flex", gap: 8, marginTop: 14 }}>
				<div
					style={{ ...shimmer, height: 26, width: 140, borderRadius: 999 }}
				/>
				<div
					style={{ ...shimmer, height: 26, width: 160, borderRadius: 999 }}
				/>
			</div>
		</div>
	);
}

const card = {
	border: '1px solid color-mix(in srgb, var(--primary) 14%, var(--border))',
	borderRadius: 18,
	padding: 14,
	background: 'var(--surface-2)',
	boxShadow: 'var(--shadow-soft)',
};

const row = {
	display: 'flex', justifyContent: 'space-between', gap: 12
};

const shimmer = {
	background:
		'linear-gradient(90deg, color-mix(in srgb, var(--surface-2) 80%, transparent), color-mix(in srgb, var(--primary) 12%, var(--surface-2)), color-mix(in srgb, var(--surface-2) 80%, transparent))',
	backgroundSize: '200% 100%',
	animation: 'shimmer 1.2s infinite',
	borderRadius: 10,
};
