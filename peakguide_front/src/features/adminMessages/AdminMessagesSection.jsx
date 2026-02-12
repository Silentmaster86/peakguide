import { useEffect, useMemo, useState } from "react";
import {
	adminDeleteMessage,
	adminFetchMessages,
	adminSetMessageStatus,
} from "../../api/messages";

export default function AdminMessagesSection() {
	const [items, setItems] = useState([]);
	const [status, setStatus] = useState("idle"); // idle | loading | success | error
	const [error, setError] = useState(null);

	const [filter, setFilter] = useState("all"); // all | new | archived
	const [busyId, setBusyId] = useState(null);

	async function load() {
		setStatus("loading");
		setError(null);
		try {
			const data = await adminFetchMessages();
			setItems(Array.isArray(data.items) ? data.items : []);
			setStatus("success");
		} catch (e) {
			setError(e?.message || "Load failed");
			setStatus("error");
		}
	}

	useEffect(() => {
		load();
	}, []);

	const filtered = useMemo(() => {
		if (filter === "all") return items;
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
		if (!confirm("Delete this message permanently?")) return;
		try {
			setBusyId(id);
			await adminDeleteMessage(id);
			await load();
		} finally {
			setBusyId(null);
		}
	}

	return (
		<section>
			<div style={headRow}>
				<h2 style={{ margin: 0 }}>Admin • Messages</h2>

				<div style={filtersRow}>
					<FilterBtn active={filter === "all"} onClick={() => setFilter("all")}>
						All
					</FilterBtn>
					<FilterBtn active={filter === "new"} onClick={() => setFilter("new")}>
						New
					</FilterBtn>
					<FilterBtn
						active={filter === "archived"}
						onClick={() => setFilter("archived")}
					>
						Archived
					</FilterBtn>

					<span style={countPill}>{filtered.length}</span>
				</div>
			</div>

			{status === "loading" && <div style={note}>Loading…</div>}
			{status === "error" && <div style={errBox}>{error}</div>}

			{status === "success" && filtered.length === 0 && (
				<div style={note}>No messages.</div>
			)}

			{status === "success" && filtered.length > 0 && (
				<div style={{ display: "grid", gap: 10 }}>
					{filtered.map((m) => {
						const isBusy = busyId === m.id;
						const dateLabel = m.created_at
							? new Date(m.created_at).toLocaleString()
							: "—";

						return (
							<div key={m.id} style={card}>
								<div style={metaRow}>
									<div style={{ fontWeight: 1000 }}>{m.email}</div>
									<div style={muted}>{dateLabel}</div>
									<div style={{ marginLeft: "auto" }}>
										<span
											style={m.status === "archived" ? pillArchived : pillNew}
										>
											{m.status}
										</span>
									</div>
								</div>

								<div style={body}>{m.message}</div>

								<div style={actionsRow}>
									{m.status !== "archived" ? (
										<ActionBtn
											disabled={isBusy}
											onClick={() => setMsgStatus(m.id, "archived")}
										>
											{isBusy ? "…" : "Archive"}
										</ActionBtn>
									) : (
										<ActionBtn
											disabled={isBusy}
											onClick={() => setMsgStatus(m.id, "new")}
										>
											{isBusy ? "…" : "Mark as new"}
										</ActionBtn>
									)}

									<div style={{ flex: 1 }} />

									<DangerBtn disabled={isBusy} onClick={() => onDelete(m.id)}>
										{isBusy ? "…" : "Delete"}
									</DangerBtn>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</section>
	);
}

/* ---------- tiny UI bits ---------- */

function FilterBtn({ active, children, ...props }) {
	return (
		<button
			type='button'
			{...props}
			style={{
				...btn,
				...(active ? btnActive : null),
			}}
		>
			{children}
		</button>
	);
}

function ActionBtn({ children, ...props }) {
	return (
		<button type='button' {...props} style={btn}>
			{children}
		</button>
	);
}

function DangerBtn({ children, ...props }) {
	return (
		<button
			type='button'
			{...props}
			style={{
				...btn,
				borderColor: "rgba(239,68,68,0.35)",
				background: "rgba(239,68,68,0.10)",
			}}
		>
			{children}
		</button>
	);
}

/* ---------- styles ---------- */

const headRow = {
	display: "flex",
	alignItems: "center",
	justifyContent: "space-between",
	gap: 12,
	flexWrap: "wrap",
	marginBottom: 12,
};

const filtersRow = {
	display: "flex",
	alignItems: "center",
	gap: 8,
	flexWrap: "wrap",
};

const countPill = {
	display: "inline-flex",
	alignItems: "center",
	justifyContent: "center",
	minWidth: 34,
	height: 28,
	padding: "0 10px",
	borderRadius: 999,
	border: "1px solid var(--border)",
	background: "color-mix(in srgb, var(--menu-bg) 70%, transparent)",
	fontWeight: 1000,
};

const note = {
	color: "var(--muted)",
	fontWeight: 800,
	padding: "6px 0",
};

const errBox = {
	padding: 12,
	borderRadius: 14,
	border: "1px solid rgba(255,99,71,0.35)",
	background: "rgba(255,99,71,0.10)",
	fontWeight: 900,
};

const card = {
	border: "1px solid var(--border)",
	borderRadius: 16,
	padding: 12,
	background: "var(--menu-bg)",
	boxShadow: "var(--shadow-soft)",
};

const metaRow = {
	display: "flex",
	gap: 10,
	flexWrap: "wrap",
	alignItems: "center",
};

const muted = { color: "var(--muted)", fontWeight: 800 };

const body = { marginTop: 8, lineHeight: 1.6 };

const actionsRow = {
	marginTop: 10,
	display: "flex",
	gap: 10,
	alignItems: "center",
};

const pillBase = {
	display: "inline-flex",
	alignItems: "center",
	padding: "4px 10px",
	borderRadius: 999,
	borderWidth: 1,
	borderStyle: "solid",
	fontWeight: 1000,
	fontSize: 12,
};

const pillNew = {
	...pillBase,
	borderColor: "rgba(34,197,94,0.35)",
	background: "rgba(34,197,94,0.10)",
};

const pillArchived = {
	...pillBase,
	borderColor: "rgba(148,163,184,0.35)",
	background: "rgba(148,163,184,0.10)",
};

const btn = {
	borderWidth: 1,
	borderStyle: "solid",
	borderColor: "var(--border)",
	background: "var(--btn-bg)",
	color: "var(--text)",
	padding: "9px 12px",
	borderRadius: 12,
	cursor: "pointer",
	fontWeight: 900,
};

const btnActive = {
	background: "color-mix(in srgb, var(--primary) 18%, transparent)",
	borderColor: "color-mix(in srgb, var(--primary) 30%, var(--border))",
};
