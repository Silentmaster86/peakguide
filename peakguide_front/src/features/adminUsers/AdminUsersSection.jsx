import { useEffect, useState } from 'react';
import { adminDeleteUser, adminFetchUsers, adminToggleAdmin } from './api';
import { useMedia } from '../../hooks/useMedia';

export default function AdminUsersSection() {
	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(true);
	const isMobile = useMedia('(max-width: 1000px)');

	async function load() {
		setLoading(true);
		const data = await adminFetchUsers();
		setUsers(data.items || []);
		setLoading(false);
	}

	useEffect(() => {
		const fetchUsers = async () => {
			setLoading(true);
			const data = await adminFetchUsers();
			setUsers(data.items || []);
			setLoading(false);
		};
		fetchUsers();
	}, []);

	async function deleteUser(id, email) {
		const ok = window.confirm(`Na pewno usunąć usera?\n\n${email}`);
		if (!ok) return;

		await adminDeleteUser(id);
		await load();
	}

	async function toggleAdmin(id) {
		await adminToggleAdmin(id);
		await load();
	}

	return (
		<section style={{ marginTop: 40 }}>
			<h2>Admin • Users</h2>

			{loading && <p>Loading users…</p>}

			{!loading && isMobile && (
				<div style={cardsList}>
					{users.map((u) => (
						<div key={u.id} style={userCard}>
							<div style={userEmail}>{u.email}</div>
							<div style={userName}>{u.display_name || '-'}</div>

							<div style={metaGrid}>
								<span>Admin: {u.is_admin ? 'Yes' : 'No'}</span>
								<span>Active: {u.active ? 'Yes' : 'No'}</span>
							</div>

							<div style={cardActions}>
								<button style={btn} onClick={() => toggleAdmin(u.id)}>
									{u.is_admin ? 'Remove admin' : 'Make admin'}
								</button>

								<button
									style={btnDanger}
									onClick={() => deleteUser(u.id, u.email)}
									disabled={u.is_admin}
								>
									Delete
								</button>
							</div>
						</div>
					))}
				</div>
			)}

			{!loading && !isMobile && (
				<div style={tableScroll}>
					<table style={table}>
						<thead>
							<tr>
								<th style={th}>Email</th>

								<th style={th}>Name</th>

								<th style={th}>Created</th>

								<th style={th}>Admin</th>

								<th style={th}>Active</th>

								<th style={th}>Action</th>
							</tr>
						</thead>

						<tbody>
							{users.map((u) => (
								<tr key={u.id}>
									<td style={td}>{u.email}</td>

									<td style={td}>{u.display_name}</td>

									<td style={td}>
										{u.created_at
											? new Date(u.created_at).toLocaleString()
											: '-'}
									</td>

									<td style={td}>{u.is_admin ? 'Yes' : 'No'}</td>

									<td style={td}>{u.active ? 'Yes' : 'No'}</td>

									<td style={actionCell}>
										<button style={btn} onClick={() => toggleAdmin(u.id)}>
											{u.is_admin ? 'Remove admin' : 'Make admin'}
										</button>

										<button
											style={btn}
											onClick={() => deleteUser(u.id, u.email)}
											disabled={u.is_admin}
											title={
												u.is_admin
													? 'Najpierw zdejmij admina'
													: 'Usuń użytkownika'
											}
										>
											Delete
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</section>
	);
}

// -------------- styles ---------------//

const tableScroll = {
	width: '100%',
	maxWidth: '100%',
	overflowX: 'auto',
	WebkitOverflowScrolling: 'touch',
	border: '1px solid var(--border)',
	borderRadius: 16,
	background: 'var(--surface-2)',
};

const table = {
	width: '100%',
	minWidth: 760,
	borderCollapse: 'collapse',
};

const th = {
	padding: '12px 10px',
	textAlign: 'left',
	borderBottom: '1px solid var(--border)',
	fontSize: 13,
	whiteSpace: 'nowrap',
};

const td = {
	padding: '12px 10px',
	borderBottom: '1px solid rgba(255,255,255,0.08)',
	fontSize: 13,
	verticalAlign: 'top',
};

const actionCell = {
	...td,
	display: 'flex',
	gap: 8,
	flexWrap: 'wrap',
};

const btn = {
	border: '1px solid var(--border)',
	borderRadius: 10,
	background: 'var(--btn-bg)',
	color: 'var(--text)',
	padding: '8px 10px',
	fontWeight: 900,
	cursor: 'pointer',
};

const cardsList = {
	display: 'grid',
	gap: 10,
	width: '100%',
};

const userCard = {
	border: '1px solid var(--border)',
	borderRadius: 16,
	padding: 12,
	background: 'var(--surface-2)',
	boxShadow: 'var(--shadow-soft)',
	display: 'grid',
	gap: 8,
};

const userEmail = {
	fontWeight: 1000,
	fontSize: 13,
	wordBreak: 'break-word',
};

const userName = {
	color: 'var(--muted)',
	fontWeight: 800,
};

const metaGrid = {
	display: 'grid',
	gridTemplateColumns: '1fr 1fr',
	gap: 8,
	fontSize: 12,
	color: 'var(--muted)',
	fontWeight: 800,
};

const cardActions = {
	display: 'flex',
	gap: 8,
	flexWrap: 'wrap',
};

const btnDanger = {
	...btn,
	border: '1px solid rgba(239,68,68,0.35)',
};