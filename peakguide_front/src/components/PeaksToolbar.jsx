import { useEffect, useState } from "react";

export default function PeaksToolbar({
	q,
	setQ,
	range,
	setRange,
	sort,
	setSort,
	ranges,
	lang,
}) {
	const [localQ, setLocalQ] = useState(q || "");

	// Keep local input in sync when URL changes (e.g. back/forward)
	useEffect(() => {
		setLocalQ(q || "");
	}, [q]);

	// Debounce: push to URL after 300ms
	useEffect(() => {
		const t = setTimeout(() => {
			if ((q || "") !== (localQ || "")) setQ(localQ);
		}, 300);
		return () => clearTimeout(t);
	}, [localQ, q, setQ]);

	function clearSearch() {
		setLocalQ("");
		setQ(""); // immediately clears URL param
	}

	return (
		<div style={wrap}>
			{/* Search */}
			<label style={field}>
				<span style={label}>{lang === "pl" ? "Szukaj" : "Search"}</span>

				<div style={inputWrap}>
					<input
						value={localQ}
						onChange={(e) => setLocalQ(e.target.value)}
						placeholder={
							lang === "pl" ? "np. Rysy, Tarnica..." : "e.g. Rysy, Tarnica..."
						}
						style={input}
					/>

					{localQ?.trim() ? (
						<button
							type='button'
							onClick={clearSearch}
							style={clearX}
							aria-label={
								lang === "pl" ? "Wyczyść wyszukiwanie" : "Clear search"
							}
							title={lang === "pl" ? "Wyczyść" : "Clear"}
						>
							✕
						</button>
					) : null}
				</div>
			</label>

			{/* Range */}
			<label style={field}>
				<span style={label}>{lang === "pl" ? "Pasma" : "Ranges"}</span>
				<select
					value={range}
					onChange={(e) => setRange(e.target.value)}
					style={select}
				>
					<option value='all'>
						{lang === "pl" ? "Wszystkie pasma" : "All ranges"}
					</option>
					{(ranges || []).map((r) => (
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

const inputWrap = {
	position: "relative",
};

const input = {
	height: 42,
	width: "100%",
	padding: "0 38px 0 12px",
	borderRadius: 14,
	border: "1px solid var(--border)",
	background: "var(--surface)",
	color: "var(--toolbar-text)",
	fontWeight: 900,
	boxShadow: "var(--shadow-soft)",
	outline: "none",
};

const clearX = {
	position: "absolute",
	right: 8,
	top: "50%",
	transform: "translateY(-50%)",
	height: 28,
	width: 28,
	borderRadius: 10,
	border: "1px solid var(--border)",
	background: "var(--btn-bg)",
	color: "var(--muted)",
	cursor: "pointer",
	fontWeight: 1000,
	lineHeight: 1,
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
