export default function AdminTools({ t, onAddNearby, onAddTrail, onAddPoi }) {
	return (
		<section style={wrap}>
			<div style={head}>
				<h2 style={h2}>{t.adminTools}</h2>
				<div style={sub}>{t.adminNote}</div>
			</div>

			<div style={grid}>
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

			<div style={soonBox}>
				<div style={{ fontWeight: 1000, marginBottom: 6 }}>Coming soon</div>
				<div style={{ color: "var(--muted)", lineHeight: 1.6 }}>
					Forms CRUD + walidacja + upload zdjęć + powiązania (peak →
					trails/POI).
				</div>
			</div>
		</section>
	);
}

function ToolCard({ title, text, cta, onClick }) {
	return (
		<article style={card}>
			<div style={cardTitle}>{title}</div>
			<div style={cardText}>{text}</div>
			<button type='button' onClick={onClick} style={btn}>
				{cta}
			</button>
		</article>
	);
}

const wrap = {
	display: "grid",
	gap: 12,
};

const head = {
	display: "flex",
	alignItems: "baseline",
	justifyContent: "space-between",
	gap: 12,
	flexWrap: "wrap",
};

const h2 = { margin: 0, fontSize: 16, letterSpacing: "-0.2px" };
const sub = { color: "var(--muted)", fontWeight: 800 };

const grid = {
	display: "grid",
	gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
	gap: 12,
};

const card = {
	border: "1px solid var(--border)",
	borderRadius: 18,
	padding: 14,
	background: "var(--menu-bg)",
	boxShadow: "var(--shadow-soft)",
	minHeight: 140,
	display: "grid",
	alignContent: "start",
	gap: 10,
};

const cardTitle = { fontWeight: 1000, fontSize: 14 };
const cardText = { color: "var(--muted)", lineHeight: 1.6, fontWeight: 800 };

const btn = {
	justifySelf: "start",
	border: "1px solid var(--btn-border)",
	background: "var(--btn-bg)",
	color: "var(--text)",
	padding: "10px 12px",
	borderRadius: 12,
	cursor: "pointer",
	fontWeight: 1000,
};

const soonBox = {
	marginTop: 6,
	border: "1px dashed color-mix(in srgb, var(--border) 70%, transparent)",
	borderRadius: 18,
	padding: 14,
	background: "color-mix(in srgb, var(--menu-bg) 70%, transparent)",
};
