export default function PeaksToolbar({
	q,
	setQ,
	range,
	setRange,
	ranges,
	lang,
}) {
	return (
		<div style={wrap}>
			<label style={field}>
				<span style={label}>{lang === "pl" ? "Szukaj" : "Search"}</span>
				<input
					value={q}
					onChange={(e) => setQ(e.target.value)}
					placeholder={
						lang === "pl" ? "np. Rysy, Tarnica..." : "e.g. Rysy, Tarnica..."
					}
					style={input}
				/>
			</label>

			<label style={field}>
				<span style={label}>{lang === "pl" ? "Pasma" : "Ranges"}</span>
				<select
					value={range}
					onChange={(e) => setRange(e.target.value)}
					style={select}
				>
					<option value=''>
						{lang === "pl" ? "Wszystkie pasma" : "All ranges"}
					</option>
					{ranges?.map((r) => (
						<option key={r.slug} value={r.slug}>
							{r.name}
						</option>
					))}
				</select>
			</label>
		</div>
	);
}

const wrap = {
	display: "flex",
	gap: 12,
	flexWrap: "wrap",
	alignItems: "end",
	justifyContent: "flex-start",
	flex: "1 1 520px",
	minWidth: 280,
};

const field = {
	display: "grid",
	gap: 6,
	minWidth: 220,
	flex: "1 1 260px",
};

const label = {
	fontSize: 12,
	color: "var(--text)",
	fontWeight: 800,
	letterSpacing: "0.2px",
};

const input = {
	height: 42,
	padding: "0 12px",
	borderRadius: 14,
	border: "1px solid var(--border)",
	background: "var(--surface)",
	color: "var(--toolbar-text)",
	fontWeight: 900,
	boxShadow: "var(--shadow-soft)",
	outline: "none",
};

const select = {
	height: 42,
	padding: "0 12px",
	borderRadius: 14,
	border: "1px solid var(--border)",
	background: "var(--surface)",
	color: "var(--toolbar-text)",
	boxShadow: "var(--shadow-soft)",
	outline: "none",
};
