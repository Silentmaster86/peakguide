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
	border: "1px solid rgba(255,255,255,0.10)",
	borderRadius: 18,
	padding: 14,
	background: "rgba(255, 255, 255, 0.62)",
	boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
};

const row = { display: "flex", justifyContent: "space-between", gap: 12 };

const shimmer = {
	background:
		"linear-gradient(90deg, rgba(222, 54, 54, 0.72), rgba(143, 108, 108, 0.82), rgba(210, 194, 194, 0.87))",
	backgroundSize: "200% 100%",
	animation: "shimmer 1.2s infinite",
	borderRadius: 10,
};
