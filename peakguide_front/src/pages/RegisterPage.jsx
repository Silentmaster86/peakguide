import { useMemo, useState } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import AuthShell from "../components/AuthShell";
import { Field, TextInput, PrimaryBtn } from "../components/AuthFormBits";

function isEmail(v) {
	return /^\S+@\S+\.\S+$/.test(v);
}

export default function RegisterPage({ lang = "pl" }) {
	const t = useMemo(() => getLabels(lang), [lang]);

	const { register, error, status } = useAuth();
	const nav = useNavigate();

	const busy = status === "loading";
	const authed = status === "authed";

	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [localError, setLocalError] = useState("");

	async function onSubmit(e) {
		e.preventDefault();
		setLocalError("");

		if (firstName.trim().length < 2) return setLocalError(t.errFirst);
		if (!isEmail(email)) return setLocalError(t.errEmail);
		if (!password || password.length < 6) return setLocalError(t.errPass);

		try {
			await register({ email, password, firstName, lastName });
			nav("/panel", { replace: true });
		} catch {
			// handled in context
		}
	}

	if (authed) return <Navigate to='/panel' replace />;

	return (
		<AuthShell
			title={t.title}
			subtitle={t.subtitle}
			error={localError || error}
			footer={
				<>
					{t.haveAccount} <Link to='/login'>{t.login}</Link>
				</>
			}
		>
			<form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
				<div style={grid2}>
					<Field label={t.firstName}>
						<TextInput
							value={firstName}
							onChange={(e) => setFirstName(e.target.value)}
							placeholder={t.firstPh}
							autoComplete='given-name'
						/>
					</Field>

					<Field label={t.lastName}>
						<TextInput
							value={lastName}
							onChange={(e) => setLastName(e.target.value)}
							placeholder={t.lastPh}
							autoComplete='family-name'
						/>
					</Field>
				</div>

				<Field label={t.email}>
					<TextInput
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						autoComplete='email'
						inputMode='email'
						placeholder={t.emailPh}
					/>
				</Field>

				<Field label={t.password}>
					<TextInput
						type='password'
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						autoComplete='new-password'
						placeholder={t.passPh}
					/>
				</Field>

				<PrimaryBtn type='submit' disabled={busy}>
					{t.submit}
				</PrimaryBtn>

				<div style={{ marginTop: 6 }}>
					<Link
						to='/'
						style={{
							color: "var(--muted)",
							fontWeight: 900,
							textDecoration: "none",
						}}
					>
						{t.backHome}
					</Link>
				</div>
			</form>
		</AuthShell>
	);
}

/* ---------------- i18n ---------------- */

function getLabels(lang) {
	const dict = {
		pl: {
			title: "Rejestracja",
			subtitle: "Utwórz konto i przejdź do panelu.",
			firstName: "Imię",
			lastName: "Nazwisko (opcjonalnie)",
			email: "Email",
			password: "Hasło",
			submit: "Utwórz konto",
			haveAccount: "Masz konto?",
			login: "Logowanie",
			backHome: "Powrót",
			firstPh: "Przemysław",
			lastPh: "Pietkun",
			emailPh: "you@example.com",
			passPh: "••••••••",
			errFirst: "Imię min. 2 znaki.",
			errEmail: "Podaj poprawny email.",
			errPass: "Hasło min. 6 znaków.",
		},
		en: {
			title: "Register",
			subtitle: "Create an account and go to your panel.",
			firstName: "First name",
			lastName: "Last name (optional)",
			email: "Email",
			password: "Password",
			submit: "Create account",
			haveAccount: "Already have an account?",
			login: "Sign in",
			backHome: "Back",
			firstPh: "John",
			lastPh: "Smith",
			emailPh: "you@example.com",
			passPh: "••••••••",
			errFirst: "First name must be at least 2 characters.",
			errEmail: "Enter a valid email.",
			errPass: "Password must be at least 6 characters.",
		},
		ua: {
			title: "Реєстрація",
			subtitle: "Створіть акаунт і перейдіть до панелі.",
			firstName: "Ім'я",
			lastName: "Прізвище (необов'язково)",
			email: "Email",
			password: "Пароль",
			submit: "Створити акаунт",
			haveAccount: "Вже є акаунт?",
			login: "Вхід",
			backHome: "Назад",
			firstPh: "Ім'я",
			lastPh: "Прізвище",
			emailPh: "you@example.com",
			passPh: "••••••••",
			errFirst: "Ім'я мін. 2 символи.",
			errEmail: "Введіть коректний email.",
			errPass: "Пароль мін. 6 символів.",
		},
		zh: {
			title: "注册",
			subtitle: "创建账号并进入面板。",
			firstName: "名",
			lastName: "姓（可选）",
			email: "邮箱",
			password: "密码",
			submit: "创建账号",
			haveAccount: "已有账号？",
			login: "登录",
			backHome: "返回",
			firstPh: "名",
			lastPh: "姓",
			emailPh: "you@example.com",
			passPh: "••••••••",
			errFirst: "名字至少 2 个字符。",
			errEmail: "请输入正确的邮箱。",
			errPass: "密码至少 6 个字符。",
		},
	};

	return dict[lang] || dict.pl;
}

/* ---------------- styles ---------------- */

const grid2 = {
	display: "grid",
	gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
	gap: 10,
};
