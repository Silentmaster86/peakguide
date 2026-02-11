import { useEffect, useMemo, useState } from "react";
import {
	adminCreatePeak,
	adminDeletePeak,
	adminFetchPeaks,
	adminUpdatePeak,
} from "./api";

const LANGS = ["pl", "en", "ua", "zh"];

function emptyI18n() {
	return LANGS.reduce((acc, l) => {
		acc[l] = { name: "", short_description: "", description: "", tips: "" };
		return acc;
	}, {});
}

// Ensures i18n always has all languages (prevents crash when backend returns partial)
function normalizeI18n(i18n) {
	const base = emptyI18n();
	if (!i18n || typeof i18n !== "object") return base;
	for (const l of LANGS) {
		base[l] = { ...base[l], ...(i18n[l] || {}) };
	}
	return base;
}

function cls(...x) {
	return x.filter(Boolean).join(" ");
}

function Badge({ tone = "neutral", children }) {
	return (
		<span className={cls("ap-badge", `ap-badge--${tone}`)}>{children}</span>
	);
}

function Field({ label, hint, children }) {
	return (
		<label className='ap-field'>
			<span className='ap-label'>
				{label}
				{hint ? <span className='ap-hint'>{hint}</span> : null}
			</span>
			{children}
		</label>
	);
}

function TextInput(props) {
	return <input {...props} className={cls("ap-input", props.className)} />;
}

function TextArea(props) {
	return (
		<textarea {...props} className={cls("ap-textarea", props.className)} />
	);
}

function Toggle({ checked, onChange, label }) {
	return (
		<label className='ap-toggle'>
			<input type='checkbox' checked={checked} onChange={onChange} />
			<span className='ap-toggle__ui' aria-hidden='true' />
			<span>{label}</span>
		</label>
	);
}

function IconBtn({ children, ...props }) {
	return (
		<button
			{...props}
			className={cls("ap-btn", "ap-btn--ghost", props.className)}
		>
			{children}
		</button>
	);
}

function PrimaryBtn({ children, ...props }) {
	return (
		<button
			{...props}
			className={cls("ap-btn", "ap-btn--primary", props.className)}
		>
			{children}
		</button>
	);
}

function SubtleBtn({ children, ...props }) {
	return (
		<button
			{...props}
			className={cls("ap-btn", "ap-btn--subtle", props.className)}
		>
			{children}
		</button>
	);
}

function DangerBtn({ children, ...props }) {
	return (
		<button
			{...props}
			className={cls("ap-btn", "ap-btn--danger", props.className)}
		>
			{children}
		</button>
	);
}

export default function AdminPeaksSection({ lang = "pl" }) {
	const [q, setQ] = useState("");
	const [status, setStatus] = useState("idle");
	const [error, setError] = useState(null);
	const [items, setItems] = useState([]);

	const [open, setOpen] = useState(false);
	const [mode, setMode] = useState("create"); // create | edit
	const [saving, setSaving] = useState(false);

	const [form, setForm] = useState(() => ({
		slug: "",
		range_id: "",
		subrange_id: "",
		elevation_m: 0,
		latitude: "",
		longitude: "",
		difficulty: "",
		best_season: "",
		cover_image_url: "",
		is_korona: true,
		active: true,
		i18n: emptyI18n(),
	}));

	const [editId, setEditId] = useState(null);
	const [activeLangTab, setActiveLangTab] = useState("pl");

	async function load() {
		setStatus("loading");
		setError(null);
		try {
			const data = await adminFetchPeaks({ lang, q });
			setItems(Array.isArray(data.items) ? data.items : []);
			setStatus("success");
		} catch (e) {
			setError(e?.message || "Load failed");
			setStatus("error");
		}
	}

	useEffect(() => {
		load();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [lang]);

	const filtered = useMemo(() => items, [items]);

	function resetFormForCreate() {
		setForm({
			slug: "",
			range_id: "",
			subrange_id: "",
			elevation_m: 0,
			latitude: "",
			longitude: "",
			difficulty: "",
			best_season: "",
			cover_image_url: "",
			is_korona: true,
			active: true,
			i18n: emptyI18n(),
		});
		setActiveLangTab("pl");
	}

	function openCreate() {
		setMode("create");
		setEditId(null);
		resetFormForCreate();
		setOpen(true);
	}

	function openEdit(row) {
		setMode("edit");
		setEditId(row.id);
		setForm({
			slug: row.slug || "",
			range_id: row.range_id || "",
			subrange_id: row.subrange_id || "",
			elevation_m: row.elevation_m || 0,
			latitude: row.latitude ?? "",
			longitude: row.longitude ?? "",
			difficulty: row.difficulty ?? "",
			best_season: row.best_season ?? "",
			cover_image_url: row.cover_image_url ?? "",
			is_korona: !!row.is_korona,
			active: !!row.active,
			i18n: normalizeI18n(row.i18n),
		});
		setActiveLangTab("pl");
		setOpen(true);
	}

	function setI18nField(langKey, key, value) {
		setForm((prev) => ({
			...prev,
			i18n: {
				...prev.i18n,
				[langKey]: { ...prev.i18n[langKey], [key]: value },
			},
		}));
	}

	async function onSave(e) {
		e.preventDefault();
		if (saving) return;

		const payload = {
			...form,
			range_id: String(form.range_id),
			subrange_id: form.subrange_id ? String(form.subrange_id) : null,
			elevation_m: Number(form.elevation_m),
			latitude: form.latitude === "" ? null : Number(form.latitude),
			longitude: form.longitude === "" ? null : Number(form.longitude),
			cover_image_url: form.cover_image_url?.trim()
				? form.cover_image_url.trim()
				: null,
			i18n: normalizeI18n(form.i18n),
		};

		try {
			setSaving(true);
			if (mode === "create") await adminCreatePeak(payload);
			else await adminUpdatePeak(editId, payload);
			setOpen(false);
			await load();
		} catch (e2) {
			alert(e2?.message || "Save failed");
		} finally {
			setSaving(false);
		}
	}

	async function onDelete(id) {
		if (!confirm("Delete this peak?")) return;
		try {
			await adminDeletePeak(id);
			await load();
		} catch (e) {
			alert(e?.message || "Delete failed");
		}
	}

	const busy = status === "loading";

	return (
		<section className='ap-wrap'>
			{/* Local styles for this section */}
			<style>{css}</style>

			<header className='ap-head'>
				<div className='ap-titleRow'>
					<h2 className='ap-title'>Admin • Peaks</h2>
					<div className='ap-spacer' />
					<PrimaryBtn type='button' onClick={openCreate}>
						+ Add peak
					</PrimaryBtn>
				</div>

				<form
					className='ap-toolbar'
					onSubmit={(e) => {
						e.preventDefault();
						load();
					}}
				>
					<div className='ap-search'>
						<TextInput
							value={q}
							onChange={(e) => setQ(e.target.value)}
							placeholder='Search slug/name…'
							aria-label='Search peaks'
						/>
						<SubtleBtn type='submit' disabled={busy}>
							{busy ? "Loading…" : "Search"}
						</SubtleBtn>
						<IconBtn
							type='button'
							onClick={() => {
								setQ("");
								// keep current list; user can hit Search
							}}
							title='Clear'
							aria-label='Clear search'
						>
							✕
						</IconBtn>
					</div>

					<div className='ap-meta'>
						{status === "error" ? (
							<div className='ap-alert ap-alert--error'>
								<strong>Error:</strong> {error}
							</div>
						) : status === "loading" ? (
							<div className='ap-alert ap-alert--info'>Loading peaks…</div>
						) : (
							<div className='ap-alert ap-alert--ok'>
								Showing <strong>{filtered.length}</strong> result(s)
							</div>
						)}
					</div>
				</form>
			</header>

			<div className='ap-card'>
				<div className='ap-tableWrap'>
					<table className='ap-table'>
						<thead>
							<tr>
								<th>Name</th>
								<th>Slug</th>
								<th className='ap-num'>Elev</th>
								<th>Range</th>
								<th>Korona</th>
								<th>Active</th>
								<th className='ap-actions'>Actions</th>
							</tr>
						</thead>
						<tbody>
							{filtered.map((r) => (
								<tr key={r.id}>
									<td className='ap-strong'>{r.name || "—"}</td>
									<td className='ap-mono'>{r.slug}</td>
									<td className='ap-num'>{r.elevation_m ?? "—"}</td>
									<td>{r.range_name ?? r.range_slug ?? r.range_id ?? "—"}</td>
									<td>
										{r.is_korona ? (
											<Badge tone='brand'>Yes</Badge>
										) : (
											<Badge tone='neutral'>No</Badge>
										)}
									</td>
									<td>
										{r.active ? (
											<Badge tone='ok'>Yes</Badge>
										) : (
											<Badge tone='warn'>No</Badge>
										)}
									</td>
									<td className='ap-actions'>
										<SubtleBtn type='button' onClick={() => openEdit(r)}>
											Edit
										</SubtleBtn>
										<DangerBtn type='button' onClick={() => onDelete(r.id)}>
											Delete
										</DangerBtn>
									</td>
								</tr>
							))}

							{status === "success" && filtered.length === 0 && (
								<tr>
									<td colSpan={7} className='ap-empty'>
										No results
									</td>
								</tr>
							)}

							{status !== "success" && (
								<tr>
									<td colSpan={7} className='ap-empty'>
										{status === "loading" ? "Loading…" : "—"}
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>

			{open && (
				<div
					role='dialog'
					aria-modal='true'
					className='ap-backdrop'
					onClick={() => !saving && setOpen(false)}
				>
					<div className='ap-modal' onClick={(e) => e.stopPropagation()}>
						<div className='ap-modalHead'>
							<div>
								<h3 className='ap-modalTitle'>
									{mode === "create" ? "Add Peak" : "Edit Peak"}
								</h3>
								<p className='ap-modalSub'>
									Manage base fields + translations (PL/EN/UA/ZH).
								</p>
							</div>

							<IconBtn
								type='button'
								onClick={() => !saving && setOpen(false)}
								aria-label='Close modal'
								title='Close'
							>
								✕
							</IconBtn>
						</div>

						<form onSubmit={onSave} className='ap-form'>
							<div className='ap-grid ap-grid--3'>
								<Field label='Slug'>
									<TextInput
										value={form.slug}
										onChange={(e) => setForm({ ...form, slug: e.target.value })}
										placeholder='e.g. rysy'
										required
									/>
								</Field>

								<Field label='Range ID' hint='required'>
									<TextInput
										value={form.range_id}
										onChange={(e) =>
											setForm({ ...form, range_id: e.target.value })
										}
										placeholder='e.g. 1'
										required
									/>
								</Field>

								<Field label='Subrange ID' hint='optional'>
									<TextInput
										value={form.subrange_id}
										onChange={(e) =>
											setForm({ ...form, subrange_id: e.target.value })
										}
										placeholder='e.g. 12'
									/>
								</Field>

								<Field label='Elevation (m)'>
									<TextInput
										type='number'
										value={form.elevation_m}
										onChange={(e) =>
											setForm({ ...form, elevation_m: e.target.value })
										}
										placeholder='e.g. 2499'
										min={0}
									/>
								</Field>

								<Field label='Latitude' hint='optional'>
									<TextInput
										value={form.latitude}
										onChange={(e) =>
											setForm({ ...form, latitude: e.target.value })
										}
										placeholder='e.g. 49.1794'
									/>
								</Field>

								<Field label='Longitude' hint='optional'>
									<TextInput
										value={form.longitude}
										onChange={(e) =>
											setForm({ ...form, longitude: e.target.value })
										}
										placeholder='e.g. 20.0881'
									/>
								</Field>
							</div>

							<div className='ap-grid ap-grid--3'>
								<Field label='Difficulty'>
									<TextInput
										value={form.difficulty}
										onChange={(e) =>
											setForm({ ...form, difficulty: e.target.value })
										}
										placeholder='easy | moderate | hard'
									/>
								</Field>

								<Field label='Best season'>
									<TextInput
										value={form.best_season}
										onChange={(e) =>
											setForm({ ...form, best_season: e.target.value })
										}
										placeholder='spring/summer/autumn/winter'
									/>
								</Field>

								<Field label='Cover image URL'>
									<TextInput
										value={form.cover_image_url}
										onChange={(e) =>
											setForm({ ...form, cover_image_url: e.target.value })
										}
										placeholder='https://…'
									/>
								</Field>
							</div>

							<div className='ap-row'>
								<Toggle
									checked={form.is_korona}
									onChange={(e) =>
										setForm({ ...form, is_korona: e.target.checked })
									}
									label='Korona'
								/>
								<Toggle
									checked={form.active}
									onChange={(e) =>
										setForm({ ...form, active: e.target.checked })
									}
									label='Active'
								/>
								<div className='ap-spacer' />
								<SubtleBtn
									type='button'
									onClick={() => setOpen(false)}
									disabled={saving}
								>
									Cancel
								</SubtleBtn>
								<PrimaryBtn type='submit' disabled={saving}>
									{saving ? "Saving…" : mode === "create" ? "Create" : "Save"}
								</PrimaryBtn>
							</div>

							<div className='ap-divider' />

							{/* Translations */}
							<div className='ap-translations'>
								<div className='ap-tabs'>
									<div className='ap-tabsLeft'>
										<h4 className='ap-h4'>Translations</h4>
										<span className='ap-pill'>PL / EN / UA / ZH</span>
									</div>

									<div
										className='ap-tabRow'
										role='tablist'
										aria-label='Language tabs'
									>
										{LANGS.map((l) => (
											<button
												key={l}
												type='button'
												className={cls(
													"ap-tab",
													activeLangTab === l && "is-active",
												)}
												onClick={() => setActiveLangTab(l)}
												role='tab'
												aria-selected={activeLangTab === l}
											>
												{l.toUpperCase()}
											</button>
										))}
									</div>
								</div>

								<div className='ap-i18nCard'>
									<div className='ap-i18nHeader'>
										<span className='ap-i18nTitle'>
											{activeLangTab.toUpperCase()} content
										</span>
										<span className='ap-i18nHint'>
											Fill at least “name” for this language.
										</span>
									</div>

									<div className='ap-grid ap-grid--2'>
										<Field label='Name'>
											<TextInput
												value={form.i18n[activeLangTab]?.name || ""}
												onChange={(e) =>
													setI18nField(activeLangTab, "name", e.target.value)
												}
												placeholder={`${activeLangTab} name`}
											/>
										</Field>

										<Field label='Short description'>
											<TextArea
												rows={3}
												value={
													form.i18n[activeLangTab]?.short_description || ""
												}
												onChange={(e) =>
													setI18nField(
														activeLangTab,
														"short_description",
														e.target.value,
													)
												}
												placeholder={`${activeLangTab} short_description`}
											/>
										</Field>
									</div>

									<div className='ap-grid ap-grid--1'>
										<Field label='Description'>
											<TextArea
												rows={5}
												value={form.i18n[activeLangTab]?.description || ""}
												onChange={(e) =>
													setI18nField(
														activeLangTab,
														"description",
														e.target.value,
													)
												}
												placeholder={`${activeLangTab} description`}
											/>
										</Field>

										<Field label='Tips'>
											<TextArea
												rows={4}
												value={form.i18n[activeLangTab]?.tips || ""}
												onChange={(e) =>
													setI18nField(activeLangTab, "tips", e.target.value)
												}
												placeholder={`${activeLangTab} tips`}
											/>
										</Field>
									</div>
								</div>
							</div>
						</form>
					</div>
				</div>
			)}
		</section>
	);
}
/*-----------------------------styles-----------------------------*/
const css = `
/* ====== Theme-ish tokens (works with light/dark/system) ====== */
.ap-wrap{
  display:grid;
  gap:12px;
  color: var(--text);
}

.ap-head{ display:grid; gap:10px; }

.ap-titleRow{ display:flex; align-items:center; gap:12px; }
.ap-title{ margin:0; font-size: 18px; letter-spacing: .2px; }
.ap-spacer{ flex:1; }

.ap-toolbar{
  display:flex;
  gap:10px;
  align-items:center;
  flex-wrap:wrap;
}

.ap-search{ display:flex; gap:8px; align-items:center; flex-wrap:wrap; }

.ap-meta{ margin-left:auto; min-width: 240px; }

.ap-alert{
  border: 1px solid var(--border);
  background: var(--menu-bg);
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 13px;
  box-shadow: var(--shadow-soft);
}
.ap-alert--error{
  border-color: rgba(185,28,28,.28);
  background: rgba(185,28,28,.10);
}
.ap-alert--info{
  border-color: rgba(59,130,246,.28);
  background: rgba(59,130,246,.10);
}
.ap-alert--ok{
  border-color: rgba(34,197,94,.28);
  background: rgba(34,197,94,.10);
}

/* ====== Table card ====== */
.ap-card{
  border:1px solid var(--border);
  background: var(--btn-bg);
  border-radius: 16px;
  overflow:hidden;
  box-shadow: var(--shadow-soft);
  isolation: isolate;
}
.ap-tableWrap{ overflow:auto; }

.ap-table{
  width:100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 13px;
  min-width: 820px;
  background: transparent;
}

.ap-table thead th{
  position: sticky;
  top: 0;
  background: var(--menu-bg);
  backdrop-filter: blur(10px);
  text-align:left;
  padding: 12px 12px;
  border-bottom: 1px solid var(--border);
  font-weight: 650;
  z-index: 2;
}

.ap-table tbody td{
  padding: 12px 12px;
  border-bottom: 1px solid rgba(15,23,42,.10);
  vertical-align: middle;
}

/* delikatne paski – zależne od theme */
.ap-table tbody tr:nth-child(odd){
  background: rgba(15,23,42,.03);
}
html[data-theme="dark"] .ap-table tbody tr:nth-child(odd){
  background: rgba(226,232,240,.04);
}

.ap-table tbody tr:hover{
  background: rgba(15,23,42,.05);
}
html[data-theme="dark"] .ap-table tbody tr:hover{
  background: rgba(226,232,240,.06);
}

.ap-num{ text-align:right; font-variant-numeric: tabular-nums; }
.ap-actions{ text-align:right; white-space:nowrap; }
.ap-strong{ font-weight: 650; }
.ap-mono{ font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }

.ap-empty{
  padding: 18px 12px !important;
  opacity: .75;
  text-align:center;
  color: var(--muted);
}

/* ====== Buttons ====== */
.ap-btn{
  border: 1px solid var(--border);
  background: var(--btn-bg);
  color: var(--text);
  border-radius: 12px;
  padding: 9px 12px;
  cursor:pointer;
  transition: transform .05s ease, background .15s ease, border-color .15s ease;
  font-size: 13px;
  box-shadow: var(--shadow-soft);
}
.ap-btn:hover{
  background: rgba(31,122,79,.10);
  border-color: rgba(31,122,79,.22);
}
.ap-btn:active{ transform: translateY(1px); }
.ap-btn:disabled{ opacity: .55; cursor:not-allowed; }

.ap-btn--primary{
  background: rgba(34,197,94,.14);
  border-color: rgba(34,197,94,.26);
}
.ap-btn--primary:hover{
  background: rgba(34,197,94,.20);
  border-color: rgba(34,197,94,.34);
}

.ap-btn--subtle{
  background: rgba(59,130,246,.12);
  border-color: rgba(59,130,246,.22);
}
.ap-btn--subtle:hover{
  background: rgba(59,130,246,.18);
  border-color: rgba(59,130,246,.30);
}

.ap-btn--danger{
  background: rgba(185,28,28,.10);
  border-color: rgba(185,28,28,.22);
}
.ap-btn--danger:hover{
  background: rgba(185,28,28,.16);
  border-color: rgba(185,28,28,.30);
}

.ap-btn--ghost{ padding: 9px 10px; }

/* ====== Inputs ====== */
.ap-input, .ap-textarea{
  width:100%;
  border: 1px solid var(--border);
  background: var(--btn-bg);
  color: var(--text);
  border-radius: 12px;
  padding: 10px 12px;
  outline: none;
  transition: border-color .15s ease, background .15s ease;
  font-size: 13px;
}
.ap-input:focus, .ap-textarea:focus{
  border-color: rgba(59,130,246,.38);
  background: rgba(255,255,255,.92);
}
html[data-theme="dark"] .ap-input:focus,
html[data-theme="dark"] .ap-textarea:focus{
  background: rgba(15,23,42,.86);
}

.ap-field{ display:grid; gap: 6px; }
.ap-label{
  font-size: 12px;
  opacity: .86;
  display:flex;
  gap: 8px;
  align-items: baseline;
}
.ap-hint{ color: var(--muted); font-weight: 500; font-size: 11px; }

/* ====== Badges ====== */
.ap-badge{
  display:inline-flex;
  align-items:center;
  gap:6px;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 12px;
  border: 1px solid var(--border);
  background: rgba(15,23,42,.04);
}
html[data-theme="dark"] .ap-badge{
  background: rgba(226,232,240,.06);
}

.ap-badge--brand{ border-color: rgba(59,130,246,.26); background: rgba(59,130,246,.10); }
.ap-badge--ok{ border-color: rgba(34,197,94,.22); background: rgba(34,197,94,.10); }
.ap-badge--warn{ border-color: rgba(245,158,11,.22); background: rgba(245,158,11,.10); }
.ap-badge--neutral{ border-color: var(--border); }

/* ====== Modal ====== */
.ap-backdrop{
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.55);
  backdrop-filter: blur(4px);
  display: grid;
  place-items: center;
  padding: 16px;
  z-index: 1000;
}
.ap-modal{
  width: min(980px, 100%);
  max-height: min(86vh, 920px);
  overflow: auto;
  background: var(--menu-bg);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 16px;
  box-shadow: var(--shadow);
  z-index: 1001;
}
.ap-modalHead{
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--menu-bg);
  padding-bottom: 10px;
}

.ap-modalTitle{ margin:0; font-size: 18px; }
.ap-modalSub{ margin:4px 0 0; color: var(--muted); font-size: 13px; }

.ap-form{ display:grid; gap: 12px; }

.ap-grid{ display:grid; gap: 10px; }
.ap-grid--3{ grid-template-columns: repeat(3, minmax(0, 1fr)); }
.ap-grid--2{ grid-template-columns: repeat(2, minmax(0, 1fr)); }
.ap-grid--1{ grid-template-columns: 1fr; }

@media (max-width: 900px){
  .ap-grid--3{ grid-template-columns: 1fr; }
  .ap-grid--2{ grid-template-columns: 1fr; }
}

.ap-row{ display:flex; gap: 12px; align-items:center; flex-wrap: wrap; }

.ap-divider{
  height:1px;
  background: var(--border);
  margin: 6px 0;
}

/* ====== Toggle ====== */
.ap-toggle{ display:inline-flex; align-items:center; gap: 10px; user-select:none; cursor:pointer; font-size: 13px; }
.ap-toggle input{ display:none; }
.ap-toggle__ui{
  width: 42px;
  height: 24px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: rgba(15,23,42,.06);
  position: relative;
  transition: background .15s ease, border-color .15s ease;
}
html[data-theme="dark"] .ap-toggle__ui{ background: rgba(226,232,240,.08); }

.ap-toggle__ui::after{
  content:"";
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(255,255,255,.92);
  position: absolute;
  top: 50%;
  left: 3px;
  transform: translateY(-50%);
  transition: left .15s ease;
}
.ap-toggle input:checked + .ap-toggle__ui{
  background: rgba(34,197,94,.16);
  border-color: rgba(34,197,94,.30);
}
.ap-toggle input:checked + .ap-toggle__ui::after{ left: 21px; }

/* ====== Tabs / i18n ====== */
.ap-translations{ display:grid; gap: 10px; }
.ap-tabs{ display:flex; align-items:center; gap: 12px; flex-wrap: wrap; }
.ap-tabsLeft{ display:flex; align-items:center; gap: 10px; }
.ap-h4{ margin:0; font-size: 14px; }

.ap-pill{
  font-size: 12px;
  color: var(--muted);
  border: 1px solid var(--border);
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(15,23,42,.04);
}
html[data-theme="dark"] .ap-pill{ background: rgba(226,232,240,.06); }

.ap-tabRow{ margin-left:auto; display:flex; gap: 8px; flex-wrap: wrap; }
.ap-tab{
  border: 1px solid var(--border);
  background: var(--btn-bg);
  color: var(--text);
  border-radius: 999px;
  padding: 7px 10px;
  cursor: pointer;
  font-size: 12px;
}
.ap-tab.is-active{
  background: rgba(59,130,246,.14);
  border-color: rgba(59,130,246,.28);
}

.ap-i18nCard{
  border: 1px solid var(--border);
  background: rgba(15,23,42,.03);
  border-radius: 16px;
  padding: 12px;
}
html[data-theme="dark"] .ap-i18nCard{ background: rgba(226,232,240,.05); }

.ap-i18nHeader{ display:flex; justify-content: space-between; gap: 12px; margin-bottom: 10px; flex-wrap: wrap; }
.ap-i18nTitle{ font-weight: 700; }
.ap-i18nHint{ color: var(--muted); font-size: 12px; }
`;
