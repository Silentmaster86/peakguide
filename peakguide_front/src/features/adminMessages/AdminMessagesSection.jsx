import { useEffect, useMemo, useState } from 'react';
import {
	adminDeleteMessage,
	adminFetchMessages,
	adminSetMessageStatus,
} from '../../api/messages';

export default function AdminMessagesSection() {
	const [items, setItems] = useState([]);
	const [status, setStatus] = useState('idle');
	const [error, setError] = useState(null);
	const [filter, setFilter] = useState('all');
	const [busyId, setBusyId] = useState(null);

	async function load() {
		setStatus('loading');
		setError(null);

		try {
			const data = await adminFetchMessages();
			setItems(Array.isArray(data.items) ? data.items : []);
			setStatus('success');
		} catch (e) {
			setError(e?.message || 'Load failed');
			setStatus('error');
		}
	}

	useEffect(() => {
		load();
	}, []);

	const filtered = useMemo(() => {
		if (filter === 'all') return items;
		return items.filter((m) => m.status === filter);
	}, [items, filter]);

	async function setMsgStatus(id, nextStatus) {
		try {
			setBusyId(id);
			await adminSetMessageStatus(id, nextStatus);
			await load();
		} finally {
			setBusyId(null);
		}
	}

	async function onDelete(id) {
		if (!confirm('Delete this message permanently?')) return;

		try {
			setBusyId(id);
			await adminDeleteMessage(id);
			await load();
		} finally {
			setBusyId(null);
		}
	}

	return (
		<section className='am-wrap'>
			<style>{css}</style>

			<header className='am-head'>
				<h2>Admin • Messages</h2>

				<div className='am-filters'>
					<FilterBtn active={filter === 'all'} onClick={() => setFilter('all')}>
						All
					</FilterBtn>

					<FilterBtn active={filter === 'new'} onClick={() => setFilter('new')}>
						New
					</FilterBtn>

					<FilterBtn
						active={filter === 'archived'}
						onClick={() => setFilter('archived')}
					>
						Archived
					</FilterBtn>

					<span className='am-count'>{filtered.length}</span>
				</div>
			</header>

			{status === 'loading' && (
				<div className='am-note'>Loading messages...</div>
			)}
			{status === 'error' && <div className='am-error'>{error}</div>}

			{status === 'success' && filtered.length === 0 && (
				<div className='am-note'>No messages.</div>
			)}

			{status === 'success' && filtered.length > 0 && (
				<div className='am-list'>
					{filtered.map((m) => {
						const isBusy = busyId === m.id;
						const dateLabel = m.created_at
							? new Date(m.created_at).toLocaleString()
							: '—';

						return (
							<article key={m.id} className='am-card'>
								<div className='am-top'>
									<div className='am-email'>{m.email}</div>

									<span
										className={
											m.status === 'archived'
												? 'am-pill am-pill--archived'
												: 'am-pill am-pill--new'
										}
									>
										{m.status}
									</span>
								</div>

								<div className='am-date'>{dateLabel}</div>

								<p className='am-message'>{m.message}</p>

								<div className='am-actions'>
									{m.status !== 'archived' ? (
										<ActionBtn
											disabled={isBusy}
											onClick={() => setMsgStatus(m.id, 'archived')}
										>
											{isBusy ? '...' : 'Archive'}
										</ActionBtn>
									) : (
										<ActionBtn
											disabled={isBusy}
											onClick={() => setMsgStatus(m.id, 'new')}
										>
											{isBusy ? '...' : 'Mark as new'}
										</ActionBtn>
									)}

									<DangerBtn disabled={isBusy} onClick={() => onDelete(m.id)}>
										{isBusy ? '...' : 'Delete'}
									</DangerBtn>
								</div>
							</article>
						);
					})}
				</div>
			)}
		</section>
	);
}

function FilterBtn({ active, children, ...props }) {
	return (
		<button
			type='button'
			{...props}
			className={active ? 'am-btn am-btn--active' : 'am-btn'}
		>
			{children}
		</button>
	);
}

function ActionBtn({ children, ...props }) {
	return (
		<button type='button' {...props} className='am-btn'>
			{children}
		</button>
	);
}

function DangerBtn({ children, ...props }) {
	return (
		<button type='button' {...props} className='am-btn am-btn--danger'>
			{children}
		</button>
	);
}

const css = `
.am-wrap {
	display: grid;
	gap: 12px;
	color: var(--text);
}

.am-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	flex-wrap: wrap;
}

.am-head h2 {
	margin: 0;
	font-size: 20px;
	letter-spacing: -0.3px;
}

.am-filters {
	display: flex;
	gap: 8px;
	align-items: center;
	flex-wrap: wrap;
}

.am-count {
	min-width: 34px;
	height: 32px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 0 10px;
	border-radius: 999px;
	border: 1px solid var(--border);
	background: color-mix(in srgb, var(--menu-bg) 80%, transparent);
	font-weight: 1000;
	box-shadow: var(--shadow-soft);
}

.am-list {
	display: grid;
	gap: 12px;
}

.am-card {
	border: 1px solid var(--border);
	border-radius: 18px;
	padding: 14px;
	background: color-mix(in srgb, var(--menu-bg) 88%, transparent);
	box-shadow: var(--shadow-soft);
	display: grid;
	gap: 8px;
	overflow: hidden;
}

.am-top {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 10px;
}

.am-email {
	font-weight: 1000;
	word-break: break-word;
	line-height: 1.35;
	min-width: 0;
}

.am-date {
	color: var(--muted);
	font-size: 12px;
	font-weight: 850;
}

.am-message {
	margin: 0;
	line-height: 1.6;
	color: var(--text);
	word-break: break-word;
}

.am-actions {
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
	justify-content: space-between;
	margin-top: 4px;
}

.am-btn {
	border: 1px solid var(--border);
	background: var(--btn-bg);
	color: var(--text);
	padding: 9px 12px;
	border-radius: 12px;
	cursor: pointer;
	font-weight: 900;
	box-shadow: var(--shadow-soft);
}

.am-btn--active {
	background: color-mix(in srgb, var(--primary) 18%, transparent);
	border-color: color-mix(in srgb, var(--primary) 38%, var(--border));
}

.am-btn--danger {
	border-color: rgba(239,68,68,0.35);
	background: rgba(239,68,68,0.10);
}

.am-pill {
	display: inline-flex;
	align-items: center;
	padding: 5px 9px;
	border-radius: 999px;
	border: 1px solid var(--border);
	font-size: 12px;
	font-weight: 1000;
	white-space: nowrap;
}

.am-pill--new {
	border-color: rgba(34,197,94,0.35);
	background: rgba(34,197,94,0.12);
	color: var(--primary);
}

.am-pill--archived {
	border-color: rgba(148,163,184,0.35);
	background: rgba(148,163,184,0.12);
	color: var(--muted);
}

.am-note {
	color: var(--muted);
	font-weight: 900;
	padding: 8px 0;
}

.am-error {
	padding: 12px;
	border-radius: 14px;
	border: 1px solid rgba(239,68,68,0.35);
	background: rgba(239,68,68,0.10);
	font-weight: 900;
}

button:disabled {
	opacity: 0.6;
	cursor: not-allowed;
}

@media (max-width: 425px) {
	.am-head {
		align-items: flex-start;
	}

	.am-head h2 {
		font-size: 18px;
	}

	.am-card {
		padding: 12px;
		border-radius: 16px;
	}

	.am-actions {
		display: grid;
		grid-template-columns: 1fr;
	}

	.am-btn {
		width: 100%;
	}
}
`;
