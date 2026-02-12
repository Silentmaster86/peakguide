import { useEffect, useState } from "react";
import { adminFetchUsers, adminToggleAdmin } from "./api";

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
		load();
	}, []);

	async function toggleAdmin(id) {
		await adminToggleAdmin(id);
		await load();
	}

	return (
		<section style={{ marginTop: 40 }}>
			<h2>Admin • Users</h2>

			{loading && <p>Loading users…</p>}

			{!loading && (
				<table style={{ width: "100%", marginTop: 20 }}>
					<thead>
						<tr>
							<th>Email</th>
							<th>Name</th>
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
								<td>{u.is_admin ? "Yes" : "No"}</td>
								<td>{u.active ? "Yes" : "No"}</td>
								<td>
									<button onClick={() => toggleAdmin(u.id)}>
										{u.is_admin ? "Remove admin" : "Make admin"}
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
