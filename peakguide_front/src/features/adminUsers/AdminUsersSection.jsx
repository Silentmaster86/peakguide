import { useEffect, useState } from "react";
import { adminDeleteUser, adminFetchUsers, adminToggleAdmin } from "./api";

export default function AdminUsersSection() {
	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(true);

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

			{!loading && (
				<table style={{ width: '100%', marginTop: 20 }}>
					<thead>
						<tr>
							<th>Email</th>
							<th>Name</th>
							<th>Created</th>
							<th>Admin</th>
							<th>Active</th>
							<th>Action</th>
						</tr>
					</thead>

					<tbody>
						{users.map((u) => (
							<tr key={u.id}>
								<td>{u.email}</td>
								<td>{u.display_name}</td>
								<td>
									{u.created_at ? new Date(u.created_at).toLocaleString() : '-'}
								</td>
								<td>{u.is_admin ? 'Yes' : 'No'}</td>
								<td>{u.active ? 'Yes' : 'No'}</td>
								<td>
									<button onClick={() => toggleAdmin(u.id)}>
										{u.is_admin ? 'Remove admin' : 'Make admin'}
									</button>

									<button
										onClick={() => deleteUser(u.id, u.email)}
										disabled={u.is_admin}
										title={
											u.is_admin
												? 'Najpierw zdejmij admina'
												: 'Usuń użytkownika'
										}
										style={{ marginLeft: 8 }}
									>
										Delete
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}
		</section>
	);
}
