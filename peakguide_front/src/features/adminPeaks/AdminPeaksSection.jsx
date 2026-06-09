// src/admin/components/AdminPeaksSection.jsx

import { useEffect, useMemo, useState } from 'react';
import { fetchRanges } from '../../api/peakguide';
import {
	adminCreatePeak,
	adminDeletePeak,
	adminFetchPeaks,
	adminUpdatePeak,
} from './api';

const LANGS = ['pl', 'en', 'ua', 'zh'];

function emptyI18n() {
	return LANGS.reduce((acc, l) => {
		acc[l] = { name: '', short_description: '', description: '', tips: '' };
		return acc;
	}, {});
}

function normalizeI18n(i18n) {
	const base = emptyI18n();
	if (!i18n || typeof i18n !== 'object') return base;
	for (const l of LANGS) base[l] = { ...base[l], ...(i18n[l] || {}) };
	return base;
}

function cls(...x) {
	return x.filter(Boolean).join(' ');
}

function Badge({ tone = 'neutral', children }) {
	return (
		<span className={cls('ap-badge', `ap-badge--${tone}`)}>{children}</span>
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
	return <input {...props} className={cls('ap-input', props.className)} />;
}

function TextArea(props) {
	return (
		<textarea {...props} className={cls('ap-textarea', props.className)} />
	);
}

function Select(props) {
	return <select {...props} className={cls('ap-input', props.className)} />;
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

function Button({ children, variant = 'ghost', ...props }) {
	return (
		<button
			{...props}
			className={cls('ap-btn', `ap-btn--${variant}`, props.className)}
		>
			{children}
		</button>
	);
}

export default function AdminPeaksSection({ lang = 'pl' }) {
	const [q, setQ] = useState('');
	const [status, setStatus] = useState('idle');
	const [error, setError] = useState(null);
	const [items, setItems] = useState([]);
	const [ranges, setRanges] = useState([]);
	const [subranges, setSubranges] = useState([]);

	const [open, setOpen] = useState(false);
	const [mode, setMode] = useState('create');
	const [saving, setSaving] = useState(false);
	const [editId, setEditId] = useState(null);
	const [activeLangTab, setActiveLangTab] = useState('pl');

	const [form, setForm] = useState(() => ({
		slug: '',
		range_id: '',
		subrange_id: '',
		elevation_m: 0,
		latitude: '',
		longitude: '',
		difficulty: '',
		best_season: '',
		cover_image_url: '',
		is_korona: true,
		active: true,
		i18n: emptyI18n(),
	}));

	const busy = status === 'loading';

	async function load() {
		setStatus('loading');
		setError(null);

		try {
			const data = await adminFetchPeaks({ lang, q });
			setItems(Array.isArray(data.items) ? data.items : []);
			setStatus('success');
		} catch (e) {
			setError(e?.message || 'Load failed');
			setStatus('error');
		}
	}

	useEffect(() => {
		load();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [lang]);

	useEffect(() => {
		(async () => {
			try {
				const data = await fetchRanges({ lang });
				setRanges(Array.isArray(data) ? data : []);
			} catch {
				setRanges([]);
			}
		})();
	}, [lang]);

	useEffect(() => {
		(async () => {
			if (!form.range_id) {
				setSubranges([]);
				return;
			}

			try {
				const res = await fetch(
					`/api/subranges?range_id=${encodeURIComponent(form.range_id)}&lang=${encodeURIComponent(lang)}`,
				);

				if (!res.ok) {
					setSubranges([]);
					return;
				}

				const data = await res.json();
				setSubranges(Array.isArray(data) ? data : []);
			} catch {
				setSubranges([]);
			}
		})();
	}, [form.range_id, lang]);

	const filtered = useMemo(() => items, [items]);

	const rangeNameById = useMemo(() => {
		const map = new Map();
		for (const r of ranges) {
			if (r?.id != null)
				map.set(String(r.id), r.name || r.slug || String(r.id));
		}
		return map;
	}, [ranges]);

	function getRangeLabel(r) {
		return (
			r.range_name ??
			r.range_slug ??
			(r.range_id ? rangeNameById.get(String(r.range_id)) : null) ??
			r.range_id ??
			'—'
		);
	}

	function resetFormForCreate() {
		setForm({
			slug: '',
			range_id: '',
			subrange_id: '',
			elevation_m: 0,
			latitude: '',
			longitude: '',
			difficulty: '',
			best_season: '',
			cover_image_url: '',
			is_korona: true,
			active: true,
			i18n: emptyI18n(),
		});
		setActiveLangTab('pl');
	}

	function openCreate() {
		setMode('create');
		setEditId(null);
		resetFormForCreate();
		setOpen(true);
	}

	function openEdit(row) {
		setMode('edit');
		setEditId(row.id);

		setForm({
			slug: row.slug || '',
			range_id: row.range_id ? String(row.range_id) : '',
			subrange_id: row.subrange_id || '',
			elevation_m: row.elevation_m || 0,
			latitude: row.latitude ?? '',
			longitude: row.longitude ?? '',
			difficulty: row.difficulty ?? '',
			best_season: row.best_season ?? '',
			cover_image_url: row.cover_image_url ?? '',
			is_korona: !!row.is_korona,
			active: !!row.active,
			i18n: normalizeI18n(row.i18n),
		});

		setActiveLangTab('pl');
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
			latitude: form.latitude === '' ? null : Number(form.latitude),
			longitude: form.longitude === '' ? null : Number(form.longitude),
			cover_image_url: form.cover_image_url?.trim() || null,
			i18n: normalizeI18n(form.i18n),
		};

		try {
			setSaving(true);

			if (mode === 'create') await adminCreatePeak(payload);
			else await adminUpdatePeak(editId, payload);

			setOpen(false);
			await load();
		} catch (e2) {
			alert(e2?.message || 'Save failed');
		} finally {
			setSaving(false);
		}
	}

	async function onDelete(id) {
		if (!confirm('Delete this peak?')) return;

		try {
			await adminDeletePeak(id);
			await load();
		} catch (e) {
			alert(e?.message || 'Delete failed');
		}
	}

	return (
		<section className='ap-wrap'>
			<style>{css}</style>

			<header className='ap-head'>
				<div className='ap-titleRow'>
					<h2 className='ap-title'>Admin • Peaks</h2>

					<Button type='button' variant='primary' onClick={openCreate}>
						+ Add peak
					</Button>
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
							placeholder='Search slug/name...'
							aria-label='Search peaks'
						/>

						<Button type='submit' variant='subtle' disabled={busy}>
							{busy ? 'Loading...' : 'Search'}
						</Button>

						<Button
							type='button'
							variant='ghost'
							onClick={() => setQ('')}
							title='Clear'
							aria-label='Clear search'
						>
							✕
						</Button>
					</div>

					<div className='ap-meta'>
						{status === 'error' ? (
							<div className='ap-alert ap-alert--error'>
								<strong>Error:</strong> {error}
							</div>
						) : status === 'loading' ? (
							<div className='ap-alert ap-alert--info'>Loading peaks...</div>
						) : (
							<div className='ap-alert ap-alert--ok'>
								Showing <strong>{filtered.length}</strong> result(s)
							</div>
						)}
					</div>
				</form>
			</header>

			<div className='ap-card'>
				<div className='ap-desktopTable'>
					<div className='ap-tableWrap'>
						<table className='ap-table'>
							<thead>
								<tr>
									<th>Name</th>
									<th>Slug</th>
									<th>Elev</th>
									<th>Range</th>
									<th>Korona</th>
									<th>Active</th>
									<th>Actions</th>
								</tr>
							</thead>

							<tbody>
								{filtered.map((r) => (
									<tr key={r.id}>
										<td className='ap-strong'>{r.name || '—'}</td>
										<td className='ap-mono'>{r.slug}</td>
										<td>{r.elevation_m ?? '—'}</td>
										<td>{getRangeLabel(r)}</td>
										<td>
											<Badge tone={r.is_korona ? 'brand' : 'neutral'}>
												{r.is_korona ? 'Yes' : 'No'}
											</Badge>
										</td>
										<td>
											<Badge tone={r.active ? 'ok' : 'warn'}>
												{r.active ? 'Yes' : 'No'}
											</Badge>
										</td>
										<td className='ap-actions'>
											<Button
												type='button'
												variant='subtle'
												onClick={() => openEdit(r)}
											>
												Edit
											</Button>
											<Button
												type='button'
												variant='danger'
												onClick={() => onDelete(r.id)}
											>
												Delete
											</Button>
										</td>
									</tr>
								))}

								{status === 'success' && filtered.length === 0 && (
									<tr>
										<td colSpan={7} className='ap-empty'>
											No results
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</div>

				<div className='ap-mobileCards'>
					{filtered.map((r) => (
						<article key={r.id} className='ap-mobileCard'>
							<div className='ap-mobileTop'>
								<div>
									<h3>{r.name || '—'}</h3>
									<p>{getRangeLabel(r)}</p>
								</div>

								{r.elevation_m ? (
									<span className='ap-height'>⛰️ {r.elevation_m} m</span>
								) : null}
							</div>

							<div className='ap-mobileInfo'>
								<span>
									<strong>Slug:</strong> {r.slug}
								</span>
							</div>

							<div className='ap-mobileBadges'>
								<Badge tone={r.is_korona ? 'brand' : 'neutral'}>
									{r.is_korona ? 'Korona' : 'Not Korona'}
								</Badge>
								<Badge tone={r.active ? 'ok' : 'warn'}>
									{r.active ? 'Active' : 'Inactive'}
								</Badge>
							</div>

							<div className='ap-mobileActions'>
								<Button
									type='button'
									variant='subtle'
									onClick={() => openEdit(r)}
								>
									Edit
								</Button>
								<Button
									type='button'
									variant='danger'
									onClick={() => onDelete(r.id)}
								>
									Delete
								</Button>
							</div>
						</article>
					))}

					{status === 'success' && filtered.length === 0 ? (
						<div className='ap-empty'>No results</div>
					) : null}
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
									{mode === 'create' ? 'Add Peak' : 'Edit Peak'}
								</h3>
								<p className='ap-modalSub'>
									Manage base fields + translations.
								</p>
							</div>

							<Button type='button' onClick={() => !saving && setOpen(false)}>
								✕
							</Button>
						</div>

						<form onSubmit={onSave} className='ap-form'>
							<div className='ap-grid ap-grid--3'>
								<Field label='Slug'>
									<TextInput
										value={form.slug}
										onChange={(e) => setForm({ ...form, slug: e.target.value })}
										required
									/>
								</Field>

								<Field label='Range' hint='required'>
									<Select
										value={form.range_id ? String(form.range_id) : ''}
										onChange={(e) =>
											setForm({ ...form, range_id: e.target.value })
										}
										required
									>
										<option value='' disabled>
											Select range...
										</option>

										{ranges.map((r) => (
											<option key={r.id} value={String(r.id)}>
												{r.name}
											</option>
										))}
									</Select>
								</Field>

								<Field label='Subrange' hint='optional'>
									<Select
										value={form.subrange_id || ''}
										onChange={(e) =>
											setForm({ ...form, subrange_id: e.target.value })
										}
										disabled={!subranges.length}
									>
										<option value=''>
											{subranges.length ? 'Select subrange...' : 'No subranges'}
										</option>

										{subranges.map((s) => (
											<option key={s.id} value={String(s.id)}>
												{s.name}
											</option>
										))}
									</Select>
								</Field>

								<Field label='Elevation'>
									<TextInput
										type='number'
										value={form.elevation_m}
										onChange={(e) =>
											setForm({ ...form, elevation_m: e.target.value })
										}
									/>
								</Field>

								<Field label='Latitude'>
									<TextInput
										value={form.latitude}
										onChange={(e) =>
											setForm({ ...form, latitude: e.target.value })
										}
									/>
								</Field>

								<Field label='Longitude'>
									<TextInput
										value={form.longitude}
										onChange={(e) =>
											setForm({ ...form, longitude: e.target.value })
										}
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
									/>
								</Field>

								<Field label='Best season'>
									<TextInput
										value={form.best_season}
										onChange={(e) =>
											setForm({ ...form, best_season: e.target.value })
										}
									/>
								</Field>

								<Field label='Cover image URL'>
									<TextInput
										value={form.cover_image_url}
										onChange={(e) =>
											setForm({ ...form, cover_image_url: e.target.value })
										}
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

								<Button
									type='button'
									onClick={() => setOpen(false)}
									disabled={saving}
								>
									Cancel
								</Button>

								<Button type='submit' variant='primary' disabled={saving}>
									{saving ? 'Saving...' : mode === 'create' ? 'Create' : 'Save'}
								</Button>
							</div>

							<div className='ap-divider' />

							<div className='ap-tabs'>
								<h4>Translations</h4>

								<div className='ap-tabRow'>
									{LANGS.map((l) => (
										<button
											key={l}
											type='button'
											className={cls(
												'ap-tab',
												activeLangTab === l && 'is-active',
											)}
											onClick={() => setActiveLangTab(l)}
										>
											{l.toUpperCase()}
										</button>
									))}
								</div>
							</div>

							<div className='ap-i18nCard'>
								<div className='ap-grid ap-grid--2'>
									<Field label='Name'>
										<TextInput
											value={form.i18n[activeLangTab]?.name || ''}
											onChange={(e) =>
												setI18nField(activeLangTab, 'name', e.target.value)
											}
										/>
									</Field>

									<Field label='Short description'>
										<TextArea
											rows={3}
											value={form.i18n[activeLangTab]?.short_description || ''}
											onChange={(e) =>
												setI18nField(
													activeLangTab,
													'short_description',
													e.target.value,
												)
											}
										/>
									</Field>
								</div>

								<Field label='Description'>
									<TextArea
										rows={5}
										value={form.i18n[activeLangTab]?.description || ''}
										onChange={(e) =>
											setI18nField(activeLangTab, 'description', e.target.value)
										}
									/>
								</Field>

								<Field label='Tips'>
									<TextArea
										rows={4}
										value={form.i18n[activeLangTab]?.tips || ''}
										onChange={(e) =>
											setI18nField(activeLangTab, 'tips', e.target.value)
										}
									/>
								</Field>
							</div>
						</form>
					</div>
				</div>
			)}
		</section>
	);
}

const css = `
.ap-wrap {
	display: grid;
	gap: 12px;
	color: var(--text);
}

.ap-head {
	display: grid;
	gap: 10px;
}

.ap-titleRow {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	flex-wrap: wrap;
}

.ap-title {
	margin: 0;
	font-size: 20px;
	letter-spacing: -0.3px;
}

.ap-spacer {
	flex: 1;
}

.ap-toolbar {
	display: grid;
	grid-template-columns: 1fr auto;
	gap: 10px;
	align-items: center;
}

.ap-search {
	display: flex;
	gap: 8px;
	align-items: center;
	flex-wrap: wrap;
	min-width: 0;
}

.ap-search .ap-input {
	max-width: 280px;
}

.ap-meta {
	min-width: 180px;
}

.ap-alert {
	border: 1px solid var(--border);
	background: var(--menu-bg);
	border-radius: 12px;
	padding: 9px 12px;
	font-size: 13px;
	box-shadow: var(--shadow-soft);
}

.ap-alert--error {
	border-color: rgba(239,68,68,.35);
	background: rgba(239,68,68,.10);
}

.ap-alert--info {
	border-color: rgba(59,130,246,.28);
	background: rgba(59,130,246,.10);
}

.ap-alert--ok {
	border-color: rgba(34,197,94,.28);
	background: rgba(34,197,94,.10);
}

.ap-card {
	border: 1px solid var(--border);
	background: color-mix(in srgb, var(--menu-bg) 88%, transparent);
	border-radius: 18px;
	overflow: hidden;
	box-shadow: var(--shadow-soft);
}

.ap-tableWrap {
	width: 100%;
	overflow-x: auto;
	-webkit-overflow-scrolling: touch;
}

.ap-table {
	width: 100%;
	min-width: 820px;
	border-collapse: separate;
	border-spacing: 0;
	font-size: 13px;
}

.ap-table th,
.ap-table td {
	padding: 12px;
	border-bottom: 1px solid var(--border);
	vertical-align: middle;
}

.ap-table th {
	background: color-mix(in srgb, var(--btn-bg) 78%, transparent);
	font-weight: 1000;
	text-align: left;
}

.ap-table tbody tr:nth-child(odd) {
	background: color-mix(in srgb, var(--surface-2) 60%, transparent);
}

.ap-actions {
	display: flex;
	gap: 8px;
	white-space: nowrap;
}

.ap-strong {
	font-weight: 950;
}

.ap-mono {
	font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	font-size: 12px;
}

.ap-empty {
	padding: 18px !important;
	text-align: center;
	color: var(--muted);
	font-weight: 900;
}

.ap-mobileCards {
	display: none;
}

.ap-mobileCard {
	border: 1px solid var(--border);
	background: color-mix(in srgb, var(--btn-bg) 82%, transparent);
	border-radius: 16px;
	padding: 12px;
	display: grid;
	gap: 10px;
	box-shadow: var(--shadow-soft);
}

.ap-mobileTop {
	display: flex;
	justify-content: space-between;
	gap: 10px;
	align-items: flex-start;
}

.ap-mobileTop h3 {
	margin: 0;
	font-size: 16px;
	line-height: 1.2;
}

.ap-mobileTop p {
	margin: 5px 0 0;
	color: var(--muted);
	font-size: 13px;
}

.ap-height {
	border: 1px solid rgba(34,197,94,.35);
	background: rgba(34,197,94,.12);
	color: var(--primary);
	border-radius: 999px;
	padding: 6px 9px;
	font-weight: 1000;
	font-size: 12px;
	white-space: nowrap;
}

.ap-mobileInfo {
	font-size: 13px;
	color: var(--muted);
	word-break: break-word;
}

.ap-mobileBadges,
.ap-mobileActions {
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
}

.ap-btn {
	border: 1px solid var(--border);
	background: var(--btn-bg);
	color: var(--text);
	border-radius: 12px;
	padding: 9px 12px;
	cursor: pointer;
	font-size: 13px;
	font-weight: 900;
	box-shadow: var(--shadow-soft);
}

.ap-btn--primary {
	background: rgba(34,197,94,.14);
	border-color: rgba(34,197,94,.32);
}

.ap-btn--subtle {
	background: rgba(59,130,246,.12);
	border-color: rgba(59,130,246,.25);
}

.ap-btn--danger {
	background: rgba(239,68,68,.10);
	border-color: rgba(239,68,68,.28);
}

.ap-input,
.ap-textarea {
	width: 100%;
	border: 1px solid var(--border);
	background: var(--btn-bg);
	color: var(--text);
	border-radius: 12px;
	padding: 10px 12px;
	outline: none;
	font-size: 13px;
}

.ap-field {
	display: grid;
	gap: 6px;
}

.ap-label {
	font-size: 12px;
	font-weight: 900;
	color: var(--muted);
	display: flex;
	gap: 8px;
}

.ap-hint {
	opacity: .75;
	font-weight: 700;
}

.ap-badge {
	display: inline-flex;
	align-items: center;
	padding: 4px 8px;
	border-radius: 999px;
	font-size: 12px;
	font-weight: 900;
	border: 1px solid var(--border);
	background: rgba(148,163,184,.10);
}

.ap-badge--brand {
	border-color: rgba(59,130,246,.32);
	background: rgba(59,130,246,.12);
}

.ap-badge--ok {
	border-color: rgba(34,197,94,.32);
	background: rgba(34,197,94,.12);
}

.ap-badge--warn {
	border-color: rgba(245,158,11,.32);
	background: rgba(245,158,11,.12);
}

.ap-backdrop {
	position: fixed;
	inset: 0;
	background: rgba(0,0,0,.55);
	backdrop-filter: blur(5px);
	display: grid;
	place-items: center;
	padding: 14px;
	z-index: 1000;
}

.ap-modal {
	width: min(980px, 100%);
	max-height: min(86vh, 920px);
	overflow: auto;
	background: var(--menu-bg);
	color: var(--text);
	border: 1px solid var(--border);
	border-radius: 18px;
	padding: 16px;
	box-shadow: var(--shadow);
}

.ap-modalHead {
	display: flex;
	justify-content: space-between;
	gap: 12px;
	align-items: flex-start;
	margin-bottom: 14px;
}

.ap-modalTitle {
	margin: 0;
	font-size: 20px;
}

.ap-modalSub {
	margin: 4px 0 0;
	color: var(--muted);
	font-size: 13px;
}

.ap-form {
	display: grid;
	gap: 12px;
}

.ap-grid {
	display: grid;
	gap: 10px;
}

.ap-grid--3 {
	grid-template-columns: repeat(3, minmax(0, 1fr));
}

.ap-grid--2 {
	grid-template-columns: repeat(2, minmax(0, 1fr));
}

.ap-row {
	display: flex;
	gap: 12px;
	align-items: center;
	flex-wrap: wrap;
}

.ap-divider {
	height: 1px;
	background: var(--border);
	margin: 6px 0;
}

.ap-toggle {
	display: inline-flex;
	align-items: center;
	gap: 10px;
	cursor: pointer;
	font-size: 13px;
	font-weight: 900;
}

.ap-toggle input {
	display: none;
}

.ap-toggle__ui {
	width: 42px;
	height: 24px;
	border-radius: 999px;
	border: 1px solid var(--border);
	background: rgba(148,163,184,.16);
	position: relative;
}

.ap-toggle__ui::after {
	content: "";
	width: 18px;
	height: 18px;
	border-radius: 50%;
	background: white;
	position: absolute;
	top: 50%;
	left: 3px;
	transform: translateY(-50%);
	transition: left .15s ease;
}

.ap-toggle input:checked + .ap-toggle__ui {
	background: rgba(34,197,94,.22);
	border-color: rgba(34,197,94,.38);
}

.ap-toggle input:checked + .ap-toggle__ui::after {
	left: 21px;
}

.ap-tabs {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 10px;
	flex-wrap: wrap;
}

.ap-tabs h4 {
	margin: 0;
}

.ap-tabRow {
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
}

.ap-tab {
	border: 1px solid var(--border);
	background: var(--btn-bg);
	color: var(--text);
	border-radius: 999px;
	padding: 7px 10px;
	cursor: pointer;
	font-weight: 900;
}

.ap-tab.is-active {
	background: rgba(34,197,94,.14);
	border-color: rgba(34,197,94,.32);
}

.ap-i18nCard {
	border: 1px solid var(--border);
	background: color-mix(in srgb, var(--btn-bg) 80%, transparent);
	border-radius: 16px;
	padding: 12px;
	display: grid;
	gap: 10px;
}

@media (max-width: 900px) {
	.ap-grid--3,
	.ap-grid--2 {
		grid-template-columns: 1fr;
	}
}

@media (max-width: 768px) {
	.ap-toolbar {
		grid-template-columns: 1fr;
	}

	.ap-search .ap-input {
		max-width: none;
	}

	.ap-meta {
		min-width: 0;
	}

	.ap-desktopTable {
		display: none;
	}

	.ap-mobileCards {
		display: grid;
		gap: 12px;
		padding: 12px;
	}

	.ap-card {
		background: transparent;
		border: none;
		box-shadow: none;
		overflow: visible;
	}
}

@media (max-width: 425px) {
	.ap-titleRow {
		align-items: flex-start;
	}

	.ap-title {
		font-size: 18px;
		max-width: 145px;
	}

	.ap-btn {
		padding: 8px 10px;
		font-size: 12px;
	}

	.ap-mobileTop {
		display: grid;
	}

	.ap-height {
		width: fit-content;
	}

	.ap-modal {
		padding: 12px;
		border-radius: 16px;
	}

	.ap-backdrop {
		padding: 8px;
	}
}
`;
