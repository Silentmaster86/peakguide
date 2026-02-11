import { useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import AdminTools from "./AdminTools";
import AdminPeaksSection from "../features/adminPeaks/AdminPeaksSection";

export default function PanelPage({ lang = "pl" }) {
	const { user, status } = useAuth();
	const t = useMemo(() => getLabels(lang), [lang]);

	const [msg, setMsg] = useState("");
	const [email, setEmail] = useState(user?.email || "");
	const [sent, setSent] = useState(false);

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
					</div>
				</div>
			</section>

			{isAdmin && (
				<>
					<AdminTools
						t={t}
						onAddNearby={() => alert("TODO: Admin form — Add Nearby Peak")}
						onAddTrail={() => alert("TODO: Admin form — Add Trail")}
						onAddPoi={() => alert("TODO: Admin form — Add POI")}
					/>
					{/* New: CRUD peaks */}
					<div style={{ marginTop: 12 }}>
						<AdminPeaksSection lang={lang} />
					</div>
				</>
			)}

			{!isAdmin && (
				<section style={card}>
					<h2 style={h2}>{t.contributeTitle}</h2>
					<p style={p}>{t.contributeText}</p>

					{sent ? (
						<div style={okBox}>{t.sentOk}</div>
					) : (
						<form
							onSubmit={(e) => {
								e.preventDefault();
								setSent(true);
							}}
							style={{ display: "grid", gap: 10, marginTop: 12 }}
						>
							<label style={label}>
								{t.yourEmail}
								<input
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									style={input}
									placeholder='you@example.com'
								/>
							</label>

							<label style={label}>
								{t.message}
								<textarea
									value={msg}
									onChange={(e) => setMsg(e.target.value)}
									style={{ ...input, minHeight: 110, resize: "vertical" }}
									placeholder={t.messagePh}
								/>
							</label>

							<button type='submit' style={btn}>
								{t.send}
							</button>

							<div style={mutedNote}>{t.contactNote}</div>
						</form>
					)}
				</section>
			)}
		</div>
	);
}

function getLabels(lang) {
	const dict = {
		pl: {
			loadingSession: "Ładowanie sesji…",
			panelTitle: "Panel",
			signedInAs: "Zalogowano jako:",
			adminPill: "ADMIN",

			adminTools: "Narzędzia admina",
			addNearbyTitle: "Dodaj szczyt (Nearby)",
			addNearbyText: "Dodaj nowy ciekawy szczyt do listy (is_korona=false).",
			addTrailTitle: "Dodaj szlak",
			addTrailText: "Dodaj realny szlak do wybranego szczytu.",
			addPoiTitle: "Dodaj POI",
			addPoiText: "Dodaj parking, schronisko, punkt widokowy itp.",
			open: "Otwórz",
			adminNote:
				"Tip: później podepniemy tu formularze CRUD + walidację + i18n.",

			contributeTitle: "Chcesz dodać coś do PeakGuide?",
			contributeText:
				"Jeśli znasz ciekawy szczyt, fajny szlak albo przydatny punkt (parking/schronisko/POI) — napisz do mnie. Zweryfikuję dane i dodam do aplikacji 🙂",
			yourEmail: "Twój email",
			message: "Wiadomość",
			messagePh: "Np. nazwa szczytu + link do mapy/źródła + krótki opis…",
			send: "Wyślij",
			sentOk: "Dzięki! Wiadomość zapisana (TODO: podepniemy wysyłkę).",
			contactNote:
				"Na start może być nawet mailto, a później zrobimy endpoint /contact.",
		},

		en: {
			loadingSession: "Loading session…",
			panelTitle: "Panel",
			signedInAs: "Signed in as:",
			adminPill: "ADMIN",

			adminTools: "Admin tools",
			addNearbyTitle: "Add a nearby peak",
			addNearbyText: "Add a new interesting peak (is_korona=false).",
			addTrailTitle: "Add a trail",
			addTrailText: "Create a real hiking trail for a selected peak.",
			addPoiTitle: "Add a POI",
			addPoiText: "Add parking, huts, viewpoints and more.",
			open: "Open",
			adminNote: "Tip: later we’ll wire CRUD forms + validation + i18n here.",

			contributeTitle: "Want to contribute to PeakGuide?",
			contributeText:
				"If you know a great peak, trail, or a useful place (parking/hut/POI) — message me. I’ll verify the data and add it to the app 🙂",
			yourEmail: "Your email",
			message: "Message",
			messagePh: "E.g. peak name + map/source link + short description…",
			send: "Send",
			sentOk: "Thanks! Message saved (TODO: we’ll connect sending).",
			contactNote: "For now you can use mailto; later we’ll add /contact API.",
		},

		ua: {
			loadingSession: "Завантаження сесії…",
			panelTitle: "Панель",
			signedInAs: "Ви увійшли як:",
			adminPill: "ADMIN",

			adminTools: "Інструменти адміністратора",
			addNearbyTitle: "Додати вершину (Nearby)",
			addNearbyText: "Додайте нову цікаву вершину (is_korona=false).",
			addTrailTitle: "Додати маршрут",
			addTrailText: "Створіть реальний маршрут для вибраної вершини.",
			addPoiTitle: "Додати POI",
			addPoiText: "Додайте парковку, притулок, оглядовий пункт тощо.",
			open: "Відкрити",
			adminNote: "Порада: пізніше підключимо форми CRUD + валідацію + i18n.",

			contributeTitle: "Хочете додати щось до PeakGuide?",
			contributeText:
				"Якщо ви знаєте цікаву вершину, маршрут або корисне місце (парковка/притулок/POI) — напишіть мені. Я перевірю дані й додам їх у застосунок 🙂",
			yourEmail: "Ваш email",
			message: "Повідомлення",
			messagePh:
				"Напр. назва вершини + посилання на мапу/джерело + короткий опис…",
			send: "Надіслати",
			sentOk: "Дякую! Повідомлення збережено (TODO: підключимо відправку).",
			contactNote: "Поки що можна mailto, а потім зробимо endpoint /contact.",
		},

		zh: {
			loadingSession: "正在加载会话…",
			panelTitle: "面板",
			signedInAs: "当前登录：",
			adminPill: "ADMIN",

			adminTools: "管理员工具",
			addNearbyTitle: "添加 Nearby 山峰",
			addNearbyText: "添加一个新的推荐山峰（is_korona=false）。",
			addTrailTitle: "添加路线",
			addTrailText: "为指定山峰添加真实徒步路线。",
			addPoiTitle: "添加 POI",
			addPoiText: "添加停车场、山屋、观景点等实用地点。",
			open: "打开",
			adminNote: "提示：后续会接入 CRUD 表单 + 校验 + i18n。",

			contributeTitle: "想为 PeakGuide 提供内容？",
			contributeText:
				"如果你知道不错的山峰、路线或实用地点（停车/山屋/POI）— 给我留言。我会核实信息并添加到应用中 🙂",
			yourEmail: "你的邮箱",
			message: "留言",
			messagePh: "例如：山峰名称 + 地图/来源链接 + 简短说明…",
			send: "发送",
			sentOk: "谢谢！信息已保存（TODO：后续接入真正发送）。",
			contactNote: "先用 mailto 也行，之后我们会做 /contact API。",
		},
	};

	return dict[lang] || dict.pl;
}

/* ---------------- styles ---------------- */

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

const mutedNote = { marginTop: 12, color: "var(--muted)", fontWeight: 800 };

const okBox = {
	marginTop: 12,
	padding: 12,
	borderRadius: 14,
	border: "1px solid rgba(34,197,94,0.25)",
	background: "rgba(34,197,94,0.08)",
	fontWeight: 900,
};
