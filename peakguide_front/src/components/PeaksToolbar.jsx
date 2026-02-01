// PeaksToolbar.jsx
// Small toolbar for /peaks: search + range filter + sorting.
// Designed to be minimal and match your existing UI tokens.

export default function PeaksToolbar({
	q,
	setQ,
	range,
	setRange,
	sort,
	setSort,
	ranges,
	lang,
	urlRangeSlug, // optional: if present, URL filter overrides local range select
}) {
	const isUrlLocked = Boolean(urlRangeSlug);

	return (
		<div style={wrap}>
			{/* Search */}
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

			{/* Range */}
			<label style={field}>
				<span style={label}>
					{lang === "pl" ? "Pasma" : "Ranges"}
					{isUrlLocked ? (
						<span style={hint}>
							{lang === "pl" ? " (ustawione z linku)" : " (set by URL)"}
						</span>
					) : null}
				</span>

				<select
					value={isUrlLocked ? "all" : range}
					onChange={(e) => setRange(e.target.value)}
					style={select}
					disabled={isUrlLocked}
					aria-disabled={isUrlLocked}
					title={
						isUrlLocked
							? lang === "pl"
								? "Filtr pasma jest ustawiony w URL"
								: "Range filter is set in URL"
							: ""
					}
				>
					<option value='all'>
						{lang === "pl" ? "Wszystkie pasma" : "All ranges"}
					</option>

					{ranges?.map((r) => (
						<option key={r.slug} value={r.slug}>
							{r.name}
						</option>
					))}
				</select>
			</label>

			{/* Sort */}
			<label style={fieldSmall}>
				<span style={label}>{lang === "pl" ? "Sortuj" : "Sort"}</span>
				<select
					value={sort}
					onChange={(e) => setSort(e.target.value)}
					style={select}
				>
					<option value='elev_desc'>
						{lang === "pl" ? "Wysokość: ↓" : "Elevation: ↓"}
					</option>
					<option value='elev_asc'>
						{lang === "pl" ? "Wysokość: ↑" : "Elevation: ↑"}
					</option>
					<option value='name_asc'>
						{lang === "pl" ? "Nazwa: A→Z" : "Name: A→Z"}
					</option>
					<option value='name_desc'>
						{lang === "pl" ? "Nazwa: Z→A" : "Name: Z→A"}
					</option>
				</select>
			</label>
		</div>
	);
}

/* ----------------------------- styles ------------------------------ */

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

const fieldSmall = {
	display: "grid",
	gap: 6,
	minWidth: 180,
	flex: "0 1 200px",
};

const label = {
	fontSize: 12,
	color: "var(--text)",
	fontWeight: 800,
	letterSpacing: "0.2px",
};

const hint = {
	marginLeft: 6,
	fontSize: 11,
	fontWeight: 900,
	color: "var(--muted)",
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
