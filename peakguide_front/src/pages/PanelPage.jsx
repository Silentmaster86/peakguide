import { useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { sendMessage } from '../api/messages';
import AdminTools from './AdminTools';
import AdminPeaksSection from '../features/adminPeaks/AdminPeaksSection';
import AdminUsersSection from '../features/adminUsers/AdminUsersSection';
import AdminMessagesSection from '../features/adminMessages/AdminMessagesSection';

const ADMIN_TABS = ['messages', 'peaks', 'users', 'tools'];
const SAFE_LANGS = new Set(['pl', 'en', 'ua', 'zh']);

export default function PanelPage({ lang = 'pl' }) {
	const { user, status } = useAuth();
	const safeLang = SAFE_LANGS.has(lang) ? lang : 'pl';
	const t = useMemo(() => getLabels(safeLang), [safeLang]);

	const [adminTab, setAdminTab] = useState('messages');
	const isAdmin = !!user?.is_admin;
	const displayName = user?.display_name || user?.displayName || user?.email || '—';

	if (status === 'loading') {
		return <div style={styles.loading}>{t.loadingSession}</div>;
	}

	return (
		<div style={styles.page}>
			<section style={styles.card}>
				<div style={styles.headRow}>
					<div style={styles.userBlock}>
						<h1 style={styles.title}>{t.panelTitle}</h1>

						<div style={styles.signedLine}>
							{t.signedInAs} <b>{displayName}</b>
							{isAdmin ? <span style={styles.pill}>{t.adminPill}</span> : null}
						</div>

						<div style={styles.chipRow}>
							<span style={styles.chip}>{user?.email || '—'}</span>
						</div>
					</div>
				</div>
			</section>

			{isAdmin ? (
				<section style={styles.card}>
					<div style={styles.tabsRow}>
						{ADMIN_TABS.map((tab) => (
							<button
								key={tab}
								type='button'
								onClick={() => setAdminTab(tab)}
								style={{
									...styles.tabBtn,
									...(adminTab === tab ? styles.tabBtnActive : null),
								}}
							>
								{t.tabs[tab]}
							</button>
						))}
					</div>

					<div style={styles.adminContent}>
						{adminTab === 'messages' && (
							<AdminMessagesSection lang={safeLang} />
						)}
						{adminTab === 'peaks' && <AdminPeaksSection lang={safeLang} />}
						{adminTab === 'users' && <AdminUsersSection lang={safeLang} />}
						{adminTab === 'tools' && (
							<AdminTools
								t={t}
								onAddNearby={() => alert('TODO: Admin form — Add Nearby Peak')}
								onAddTrail={() => alert('TODO: Admin form — Add Trail')}
								onAddPoi={() => alert('TODO: Admin form — Add POI')}
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

function UserContactBox({ t, user }) {
	const [msg, setMsg] = useState('');
	const [email, setEmail] = useState(user?.email || '');
	const [sent, setSent] = useState(false);
	const [loading, setLoading] = useState(false);
	const [err, setErr] = useState(null);

	async function handleSubmit(e) {
		e.preventDefault();
		setErr(null);

		const cleanEmail = String(email || '').trim();
		const cleanMsg = String(msg || '').trim();

		if (!cleanEmail || !cleanEmail.includes('@')) {
			setErr(t.emailError);
			return;
		}

		if (!cleanMsg) {
			setErr(t.messageError);
			return;
		}

		try {
			setLoading(true);
			await sendMessage({ email: cleanEmail, message: cleanMsg });
			setSent(true);
		} catch (e2) {
			setErr(e2?.message || 'Send failed');
		} finally {
			setLoading(false);
		}
	}

	return (
		<section style={styles.card}>
			<h2 style={styles.h2}>{t.contributeTitle}</h2>
			<p style={styles.p}>{t.contributeText}</p>

			{sent ? (
				<div style={styles.okBox}>{t.sentOk}</div>
			) : (
				<form onSubmit={handleSubmit} style={styles.form}>
					<label style={styles.label}>
						{t.yourEmail}
						<input
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							style={styles.input}
							placeholder='you@example.com'
							disabled={loading}
						/>
					</label>

					<label style={styles.label}>
						{t.message}
						<textarea
							value={msg}
							onChange={(e) => setMsg(e.target.value)}
							style={styles.textarea}
							placeholder={t.messagePh}
							disabled={loading}
						/>
					</label>

					{err ? <div style={styles.errBox}>{err}</div> : null}

					<button
						type='submit'
						style={{
							...styles.btn,
							opacity: loading ? 0.75 : 1,
							cursor: loading ? 'not-allowed' : 'pointer',
						}}
						disabled={loading}
					>
						{loading ? t.sending : t.send}
					</button>

					<div style={styles.mutedNote}>{t.contactNote}</div>
				</form>
			)}
		</section>
	);
}

/* ---------------- labels + styles ---------------- */

function getLabels(lang) {
	const dict = {
		pl: {
			loadingSession: 'Ładowanie sesji…',
			panelTitle: 'Panel',
			signedInAs: 'Zalogowano jako:',
			adminPill: 'ADMIN',

			/* --- admin tools --- */
			adminTools: 'Narzędzia admina',
			addTrailTitle: 'Dodaj szlak',
			addTrailText: 'Dodaj realny szlak do wybranego szczytu.',
			addPoiTitle: 'Dodaj POI',
			addPoiText:
				'Dodaj parking, schronisko, punkt widokowy lub inne przydatne miejsce.',
			open: 'Otwórz',
			adminNote: 'Tip: tutaj podepniemy formularze CRUD + walidację + i18n.',

			/* --- user contact --- */
			contributeTitle: 'Chcesz dodać coś do PeakGuide?',
			contributeText:
				'Jeśli znasz ciekawy szczyt, fajny szlak albo przydatny punkt (parking/schronisko/POI) — napisz do mnie. Wiadomość trafi do zakładki Messages (admin).',
			yourEmail: 'Twój email',
			message: 'Wiadomość',
			messagePh: 'Np. nazwa szczytu + link do mapy/źródła + krótki opis…',
			send: 'Wyślij',
			sentOk: 'Dzięki! Wiadomość wysłana ✅',
			contactNote: 'Wiadomość trafia do panelu admina (zakładka Messages).',

			tabs: {
				messages: 'Wiadomości',
				peaks: 'Szczyty',
				users: 'Użuykownicy',
				tools: 'Narzedzia',
			},
			emailError: 'Podaj poprawny email.',
			messageError: 'Wiadomość nie może być pusta.',
			sending: 'Wysyłanie...',
		},

		en: {
			loadingSession: 'Loading session…',
			panelTitle: 'Panel',
			signedInAs: 'Signed in as:',
			adminPill: 'ADMIN',

			adminTools: 'Admin tools',
			addTrailTitle: 'Add trail',
			addTrailText: 'Create a real hiking trail for a selected peak.',
			addPoiTitle: 'Add POI',
			addPoiText: 'Add parking, huts, viewpoints and other useful places.',
			open: 'Open',
			adminNote: 'Here we’ll connect real CRUD forms + validation + i18n.',

			contributeTitle: 'Want to contribute to PeakGuide?',
			contributeText:
				'If you know a great peak, trail or useful place (parking/hut/POI) — send me a message. It will appear in the admin Messages tab.',
			yourEmail: 'Your email',
			message: 'Message',
			messagePh: 'E.g. peak name + map/source link + short description…',
			send: 'Send',
			sentOk: 'Thanks! Message sent ✅',
			contactNote: 'Your message goes directly to the admin panel.',

			tabs: {
				messages: 'Messages',
				peaks: 'Peaks',
				users: 'Users',
				tools: 'Tools',
			},
			emailError: 'Please enter a valid email.',
			messageError: 'Message cannot be empty.',
			sending: 'Sending...',
		},

		ua: {
			loadingSession: 'Завантаження сесії…',
			panelTitle: 'Панель',
			signedInAs: 'Ви увійшли як:',
			adminPill: 'ADMIN',

			adminTools: 'Інструменти адміністратора',
			addTrailTitle: 'Додати маршрут',
			addTrailText: 'Створіть реальний маршрут для вибраної вершини.',
			addPoiTitle: 'Додати POI',
			addPoiText: 'Додайте парковку, притулок, оглядовий пункт тощо.',
			open: 'Відкрити',
			adminNote: 'Тут ми підключимо форми CRUD + валідацію + i18n.',

			contributeTitle: 'Хочете додати щось до PeakGuide?',
			contributeText:
				'Якщо ви знаєте цікаву вершину, маршрут або корисне місце (парковка/притулок/POI) — надішліть повідомлення. Воно з’явиться у вкладці Messages (адмін).',
			yourEmail: 'Ваш email',
			message: 'Повідомлення',
			messagePh:
				'Напр. назва вершини + посилання на мапу/джерело + короткий опис…',
			send: 'Надіслати',
			sentOk: 'Дякую! Повідомлення надіслано ✅',
			contactNote: 'Повідомлення надходить до панелі адміністратора.',
		},

		zh: {
			loadingSession: '正在加载会话…',
			panelTitle: '面板',
			signedInAs: '当前登录：',
			adminPill: 'ADMIN',

			adminTools: '管理员工具',
			addTrailTitle: '添加路线',
			addTrailText: '为指定山峰添加真实徒步路线。',
			addPoiTitle: '添加 POI',
			addPoiText: '添加停车场、山屋、观景点等实用地点。',
			open: '打开',
			adminNote: '这里会接入真正的 CRUD 表单 + 校验 + i18n。',

			contributeTitle: '想为 PeakGuide 提供内容？',
			contributeText:
				'如果你知道不错的山峰、路线或实用地点（停车/山屋/POI）— 请留言。信息会出现在管理员的 Messages 标签页。',
			yourEmail: '你的邮箱',
			message: '留言',
			messagePh: '例如：山峰名称 + 地图/来源链接 + 简短说明…',
			send: '发送',
			sentOk: '谢谢！消息已发送 ✅',
			contactNote: '你的消息会发送到管理员面板。',
		},
	};

	return dict[lang] || dict.pl;
}
// --------------------- styles -----------------//

const styles = {
	page: {
		display: 'grid',
		gap: 14,
		width: '100%',
		maxWidth: '100%',
		minWidth: 0,
		overflow: 'hidden',
	},

	loading: {
		padding: 16,
		color: 'var(--muted)',
		fontWeight: 900,
	},

	card: {
		width: '100%',
		maxWidth: '100%',
		minWidth: 0,
		overflow: 'hidden',
		border: '1px solid color-mix(in srgb, var(--primary) 14%, var(--border))',
		borderRadius: 22,
		padding: 16,
		background: 'var(--surface)',
		color: 'var(--text)',
		boxShadow: 'var(--shadow-soft)',
	},

	headRow: {
		display: 'flex',
		gap: 12,
		alignItems: 'flex-start',
		justifyContent: 'space-between',
		flexWrap: 'wrap',
		minWidth: 0,
	},

	userBlock: {
		minWidth: 0,
	},

	title: {
		margin: 0,
		fontSize: 28,
		letterSpacing: '-0.6px',
		lineHeight: 1.1,
	},

	signedLine: {
		color: 'var(--muted)',
		marginTop: 8,
		lineHeight: 1.5,
	},

	chipRow: {
		marginTop: 10,
		display: 'flex',
		gap: 10,
		flexWrap: 'wrap',
		minWidth: 0,
	},

	pill: {
		display: 'inline-flex',
		alignItems: 'center',
		marginLeft: 10,
		padding: '4px 10px',
		borderRadius: 999,
		border: '1px solid color-mix(in srgb, var(--primary) 35%, var(--border))',
		background: 'color-mix(in srgb, var(--primary) 16%, transparent)',
		color: 'var(--text)',
		fontWeight: 1000,
		fontSize: 12,
	},

	chip: {
		display: 'inline-flex',
		alignItems: 'center',
		maxWidth: '100%',
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
		padding: '7px 11px',
		borderRadius: 999,
		border: '1px solid var(--border)',
		background: 'var(--btn-bg)',
		color: 'var(--text)',
		fontWeight: 850,
		fontSize: 12,
	},

	tabsRow: {
		display: 'flex',
		gap: 8,
		flexWrap: 'wrap',
		minWidth: 0,
	},

	tabBtn: {
		border: '1px solid var(--border)',
		background: 'var(--btn-bg)',
		color: 'var(--text)',
		padding: '8px 12px',
		borderRadius: 999,
		cursor: 'pointer',
		fontWeight: 900,
		boxShadow: 'var(--shadow-soft)',
	},

	tabBtnActive: {
		background: 'color-mix(in srgb, var(--primary) 18%, transparent)',
		border: '1px solid color-mix(in srgb, var(--primary) 42%, var(--border))',
	},

	adminContent: {
		marginTop: 14,
		minWidth: 0,
		overflowX: 'auto',
	},

	h2: {
		margin: '0 0 10px',
		fontSize: 18,
		letterSpacing: '-0.2px',
	},

	p: {
		margin: 0,
		lineHeight: 1.7,
		color: 'var(--muted)',
	},

	form: {
		display: 'grid',
		gap: 12,
		marginTop: 14,
	},

	label: {
		display: 'grid',
		gap: 6,
		fontWeight: 900,
		minWidth: 0,
	},

	input: {
		width: '100%',
		minWidth: 0,
		border: '1px solid var(--border)',
		background: 'var(--btn-bg)',
		color: 'var(--text)',
		borderRadius: 12,
		padding: '10px 12px',
		outline: 'none',
		font: 'inherit',
		fontSize: 12,
	},

	textarea: {
		width: '100%',
		minWidth: 0,
		minHeight: 110,
		resize: 'vertical',
		border: '1px solid var(--border)',
		background: 'var(--btn-bg)',
		color: 'var(--text)',
		borderRadius: 12,
		padding: '10px 12px',
		outline: 'none',
		font: 'inherit',
		lineHeight: 1.5,
	},

	btn: {
		border: '1px solid color-mix(in srgb, var(--primary) 38%, var(--border))',
		background: 'color-mix(in srgb, var(--primary) 16%, var(--btn-bg))',
		color: 'var(--text)',
		padding: '11px 12px',
		borderRadius: 12,
		fontWeight: 1000,
		boxShadow: 'var(--shadow-soft)',
	},

	mutedNote: {
		marginTop: 4,
		color: 'var(--muted)',
		fontWeight: 800,
		fontSize: 13,
		lineHeight: 1.5,
	},

	okBox: {
		marginTop: 12,
		padding: 12,
		borderRadius: 14,
		border: '1px solid rgba(34,197,94,0.25)',
		background: 'rgba(34,197,94,0.08)',
		fontWeight: 900,
	},

	errBox: {
		padding: 10,
		borderRadius: 12,
		border: '1px solid rgba(255,80,80,0.25)',
		background: 'rgba(255,80,80,0.08)',
		color: 'var(--text)',
		fontWeight: 800,
	},
};