export default function AdminTools({ t, onAddNearby, onAddTrail, onAddPoi }) {
	return (
		<section id='admin' style={card}>
			<h2 style={h2}>{t.adminTools}</h2>

			<div style={grid3}>
				<ToolCard
					title={t.addNearbyTitle}
					text={t.addNearbyText}
					cta={t.open}
					onClick={onAddNearby}
				/>
				<ToolCard
					title={t.addTrailTitle}
					text={t.addTrailText}
					cta={t.open}
					onClick={onAddTrail}
				/>
				<ToolCard
					title={t.addPoiTitle}
					text={t.addPoiText}
					cta={t.open}
					onClick={onAddPoi}
				/>
			</div>

			<div style={mutedNote}>{t.adminNote}</div>
		</section>
	);
}

function ToolCard({ title, text, cta, onClick }) {
	return (
		<article style={toolCard}>
			<div style={{ fontWeight: 1000 }}>{title}</div>
			<div style={{ color: "var(--muted)", marginTop: 8, lineHeight: 1.6 }}>
				{text}
			</div>
			<button type='button' onClick={onClick} style={{ ...btn, marginTop: 12 }}>
				{cta}
			</button>
		</article>
	);
}

/* --- styles: skopiowane z PanelPage, żeby wyglądało identycznie --- */

const card = {
	border: "1px solid var(--border)",
	borderRadius: 22,
	padding: 16,
	background: "var(--menu-bg)",
	boxShadow: "var(--shadow-soft)",
	marginBottom: 14,
};

const h2 = { margin: "0 0 10px", fontSize: 16, letterSpacing: "-0.2px" };

const grid3 = {
	display: "grid",
	gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
	gap: 12,
	marginTop: 12,
};

const toolCard = {
	border: "1px solid rgba(255,255,255,0.12)",
	borderRadius: 18,
	padding: 14,
	background: "color-mix(in srgb, var(--menu-bg) 60%, transparent)",
};

const btn = {
	border: "1px solid var(--btn-border)",
	background: "var(--btn-bg)",
	color: "var(--text)",
	padding: "10px 12px",
	borderRadius: 12,
	cursor: "pointer",
	fontWeight: 1000,
};

const mutedNote = { marginTop: 12, color: "var(--muted)", fontWeight: 800 };
