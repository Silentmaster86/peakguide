import { useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { sendMessage } from "../api/messages";
import AdminTools from "./AdminTools";
import AdminPeaksSection from "../features/adminPeaks/AdminPeaksSection";
import AdminUsersSection from "../features/adminUsers/AdminUsersSection";
import AdminMessagesSection from "../features/adminMessages/AdminMessagesSection";

const ADMIN_TABS = ["messages", "peaks", "users", "tools"];
const SAFE_LANGS = new Set(["pl", "en", "ua", "zh"]);

export default function PanelPage({ lang = "pl" }) {
	const { user, status } = useAuth();
	const safeLang = SAFE_LANGS.has(lang) ? lang : "pl";
	const t = useMemo(() => getLabels(safeLang), [safeLang]);

	const [adminTab, setAdminTab] = useState("messages");
	const isAdmin = !!user?.is_admin;

	if (status === "loading") {
		return <div style={{ padding: 16 }}>{t.loadingSession}</div>;
	}

	return (
		<div style={{ padding: 12 }}>
			<section style={card}>
				<div style={headRow}>
					<div>
						<h1 style={{ margin: 0 }}>{t.panelTitle}</h1>
						<div style={{ color: "var(--muted)", marginTop: 6 }}>
							{t.signedInAs} <b>{user?.display_name || user?.email}</b>
							{isAdmin ? <span style={pill}>{t.adminPill}</span> : null}
						</div>

						<div
							style={{
								marginTop: 10,
								display: "flex",
								gap: 10,
								flexWrap: "wrap",
							}}
						>
							<span style={chip}>Email: {user?.email || "—"}</span>
						</div>
					</div>
				</div>
			</section>

			{isAdmin ? (
				<section style={card}>
					<div style={tabsRow}>
						{ADMIN_TABS.map((tab) => (
							<button
								key={tab}
								type='button'
								onClick={() => setAdminTab(tab)}
								style={{
									...tabBtn,
									...(adminTab === tab ? tabBtnActive : null),
								}}
							>
								{tab === "messages"
									? "Messages"
									: tab === "peaks"
										? "Peaks"
										: tab === "users"
											? "Users"
											: "Tools"}
							</button>
						))}
					</div>

					<div style={{ marginTop: 12 }}>
						{adminTab === "messages" && <AdminMessagesSection lang={lang} />}
						{adminTab === "peaks" && <AdminPeaksSection lang={safeLang} />}
						{adminTab === "users" && <AdminUsersSection lang={safeLang} />}
						{adminTab === "tools" && (
							<AdminTools
								t={t}
								onAddNearby={() => alert("TODO: Admin form — Add Nearby Peak")}
								onAddTrail={() => alert("TODO: Admin form — Add Trail")}
								onAddPoi={() => alert("TODO: Admin form — Add POI")}
							/>
						)}
					</div>
				</section>
			) : (
				<UserContactBox t={t} user={user} />
			)}
		</div>
	);
}

/* --- user form box as a seperate component --- */
function UserContactBox({ t, user }) {
	const [msg, setMsg] = useState("");
	const [email, setEmail] = useState(user?.email || "");
	const [sent, setSent] = useState(false);
	const [loading, setLoading] = useState(false);
	const [err, setErr] = useState(null);

	async function handleSubmit(e) {
		e.preventDefault();
		setErr(null);

		const cleanEmail = String(email || "").trim();
		const cleanMsg = String(msg || "").trim();

		if (!cleanEmail || !cleanEmail.includes("@")) {
			setErr("Podaj poprawny email.");
			return;
		}
		if (!cleanMsg) {
			setErr("Wiadomość nie może być pusta.");
			return;
		}

		try {
			setLoading(true);
			await sendMessage({ email: cleanEmail, message: cleanMsg });
			setSent(true);
		} catch (e2) {
			setErr(e2?.message || "Send failed");
		} finally {
			setLoading(false);
		}
	}

	return (
		<section style={card}>
			<h2 style={h2}>{t.contributeTitle}</h2>
			<p style={p}>{t.contributeText}</p>

			{sent ? (
				<div style={okBox}>{t.sentOk}</div>
			) : (
				<form
					onSubmit={handleSubmit}
					style={{ display: "grid", gap: 10, marginTop: 12 }}
				>
					<label style={label}>
						{t.yourEmail}
						<input
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							style={input}
							placeholder='you@example.com'
							disabled={loading}
						/>
					</label>

					<label style={label}>
						{t.message}
						<textarea
							value={msg}
							onChange={(e) => setMsg(e.target.value)}
							style={{ ...input, minHeight: 110, resize: "vertical" }}
							placeholder={t.messagePh}
							disabled={loading}
						/>
					</label>

					{err ? <div style={errBox}>{err}</div> : null}

					<button
						type='submit'
						style={{ ...btn, opacity: loading ? 0.8 : 1 }}
						disabled={loading}
					>
						{loading ? "Sending..." : t.send}
					</button>

					<div style={mutedNote}>{t.contactNote}</div>
				</form>
			)}
		</section>
	);
}

/* ---------------- labels + styles ---------------- */

function getLabels(lang) {
	const dict = {
		pl: {
			loadingSession: "Ładowanie sesji…",
			panelTitle: "Panel",
			signedInAs: "Zalogowano jako:",
			adminPill: "ADMIN",

			/* --- admin tools --- */
			adminTools: "Narzędzia admina",
			addTrailTitle: "Dodaj szlak",
			addTrailText: "Dodaj realny szlak do wybranego szczytu.",
			addPoiTitle: "Dodaj POI",
			addPoiText:
				"Dodaj parking, schronisko, punkt widokowy lub inne przydatne miejsce.",
			open: "Otwórz",
			adminNote: "Tip: tutaj podepniemy formularze CRUD + walidację + i18n.",

			/* --- user contact --- */
			contributeTitle: "Chcesz dodać coś do PeakGuide?",
			contributeText:
				"Jeśli znasz ciekawy szczyt, fajny szlak albo przydatny punkt (parking/schronisko/POI) — napisz do mnie. Wiadomość trafi do zakładki Messages (admin).",
			yourEmail: "Twój email",
			message: "Wiadomość",
			messagePh: "Np. nazwa szczytu + link do mapy/źródła + krótki opis…",
			send: "Wyślij",
			sentOk: "Dzięki! Wiadomość wysłana ✅",
			contactNote: "Wiadomość trafia do panelu admina (zakładka Messages).",
		},

		en: {
			loadingSession: "Loading session…",
			panelTitle: "Panel",
			signedInAs: "Signed in as:",
			adminPill: "ADMIN",

			adminTools: "Admin tools",
			addTrailTitle: "Add trail",
			addTrailText: "Create a real hiking trail for a selected peak.",
			addPoiTitle: "Add POI",
			addPoiText: "Add parking, huts, viewpoints and other useful places.",
			open: "Open",
			adminNote: "Here we’ll connect real CRUD forms + validation + i18n.",

			contributeTitle: "Want to contribute to PeakGuide?",
			contributeText:
				"If you know a great peak, trail or useful place (parking/hut/POI) — send me a message. It will appear in the admin Messages tab.",
			yourEmail: "Your email",
			message: "Message",
			messagePh: "E.g. peak name + map/source link + short description…",
			send: "Send",
			sentOk: "Thanks! Message sent ✅",
			contactNote: "Your message goes directly to the admin panel.",
		},

		ua: {
			loadingSession: "Завантаження сесії…",
			panelTitle: "Панель",
			signedInAs: "Ви увійшли як:",
			adminPill: "ADMIN",

			adminTools: "Інструменти адміністратора",
			addTrailTitle: "Додати маршрут",
			addTrailText: "Створіть реальний маршрут для вибраної вершини.",
			addPoiTitle: "Додати POI",
			addPoiText: "Додайте парковку, притулок, оглядовий пункт тощо.",
			open: "Відкрити",
			adminNote: "Тут ми підключимо форми CRUD + валідацію + i18n.",

			contributeTitle: "Хочете додати щось до PeakGuide?",
			contributeText:
				"Якщо ви знаєте цікаву вершину, маршрут або корисне місце (парковка/притулок/POI) — надішліть повідомлення. Воно з’явиться у вкладці Messages (адмін).",
			yourEmail: "Ваш email",
			message: "Повідомлення",
			messagePh:
				"Напр. назва вершини + посилання на мапу/джерело + короткий опис…",
			send: "Надіслати",
			sentOk: "Дякую! Повідомлення надіслано ✅",
			contactNote: "Повідомлення надходить до панелі адміністратора.",
		},

		zh: {
			loadingSession: "正在加载会话…",
			panelTitle: "面板",
			signedInAs: "当前登录：",
			adminPill: "ADMIN",

			adminTools: "管理员工具",
			addTrailTitle: "添加路线",
			addTrailText: "为指定山峰添加真实徒步路线。",
			addPoiTitle: "添加 POI",
			addPoiText: "添加停车场、山屋、观景点等实用地点。",
			open: "打开",
			adminNote: "这里会接入真正的 CRUD 表单 + 校验 + i18n。",

			contributeTitle: "想为 PeakGuide 提供内容？",
			contributeText:
				"如果你知道不错的山峰、路线或实用地点（停车/山屋/POI）— 请留言。信息会出现在管理员的 Messages 标签页。",
			yourEmail: "你的邮箱",
			message: "留言",
			messagePh: "例如：山峰名称 + 地图/来源链接 + 简短说明…",
			send: "发送",
			sentOk: "谢谢！消息已发送 ✅",
			contactNote: "你的消息会发送到管理员面板。",
		},
	};

	return dict[lang] || dict.pl;
}

const card = {
	border: "1px solid var(--border)",
	borderRadius: 22,
	padding: 16,
	background: "var(--menu-bg)",
	boxShadow: "var(--shadow-soft)",
	marginBottom: 14,
};

const headRow = {
	display: "flex",
	gap: 12,
	alignItems: "flex-start",
	justifyContent: "space-between",
	flexWrap: "wrap",
};

const h2 = { margin: "0 0 10px", fontSize: 16, letterSpacing: "-0.2px" };
const p = { margin: 0, lineHeight: 1.7 };

const btn = {
	border: "1px solid var(--btn-border)",
	background: "var(--btn-bg)",
	color: "var(--text)",
	padding: "10px 12px",
	borderRadius: 12,
	cursor: "pointer",
	fontWeight: 1000,
};

const label = { display: "grid", gap: 6, fontWeight: 900 };

const input = {
	border: "1px solid var(--border)",
	background: "var(--btn-bg)",
	color: "var(--text)",
	borderRadius: 12,
	padding: "10px 12px",
	outline: "none",
};

const pill = {
	display: "inline-flex",
	alignItems: "center",
	marginLeft: 10,
	padding: "4px 10px",
	borderRadius: 999,
	border: "1px solid rgba(31,122,79,0.28)",
	background: "color-mix(in srgb, var(--primary) 16%, transparent)",
	fontWeight: 1000,
	fontSize: 12,
};

const chip = {
	display: "inline-flex",
	alignItems: "center",
	padding: "6px 10px",
	borderRadius: 999,
	border: "1px solid var(--border)",
	background: "color-mix(in srgb, var(--menu-bg) 60%, transparent)",
	fontWeight: 800,
	fontSize: 12,
};

const mutedNote = { marginTop: 12, color: "var(--muted)", fontWeight: 800 };

const okBox = {
	marginTop: 12,
	padding: 12,
	borderRadius: 14,
	border: "1px solid rgba(34,197,94,0.25)",
	background: "rgba(34,197,94,0.08)",
	fontWeight: 900,
};

const errBox = {
	padding: 10,
	borderRadius: 12,
	border: "1px solid rgba(255,80,80,0.25)",
	background: "rgba(255,80,80,0.08)",
	color: "var(--text)",
	fontWeight: 800,
};

const tabsRow = {
	display: "flex",
	gap: 10,
	flexWrap: "wrap",
};

const tabBtn = {
	border: "1px solid var(--border)",
	background: "var(--btn-bg)",
	color: "var(--text)",
	padding: "8px 12px",
	borderRadius: 999,
	cursor: "pointer",
	fontWeight: 900,
};

const tabBtnActive = {
	background: "color-mix(in srgb, var(--primary) 18%, transparent)",
	border: "1px solid color-mix(in srgb, var(--primary) 30%, var(--border))",
};
