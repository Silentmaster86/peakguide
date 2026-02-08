import { useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import AuthShell from "../components/AuthShell";
import { Field, TextInput, PrimaryBtn } from "../components/AuthFormBits";

function isEmail(v) {
	return /^\S+@\S+\.\S+$/.test(v);
}

export default function LoginPage({ lang = "pl" }) {
	const t = useMemo(() => getLabels(lang), [lang]);

	const { login, error, status } = useAuth();
	const nav = useNavigate();
	const loc = useLocation();

	const from = useMemo(
		() => loc.state?.from?.pathname || "/panel",
		[loc.state?.from?.pathname],
	);

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [localError, setLocalError] = useState("");

	const busy = status === "loading";
	const authed = status === "authed";

	async function onSubmit(e) {
		e.preventDefault();
		setLocalError("");

		if (!isEmail(email)) return setLocalError(t.errEmail);
		if (!password || password.length < 6) return setLocalError(t.errPass);

		try {
			await login({ email, password });
			nav(from, { replace: true });
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
					{t.noAccount} <Link to='/register'>{t.register}</Link>
				</>
			}
		>
			<form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
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
						autoComplete='current-password'
						placeholder={t.passPh}
					/>
				</Field>

				<PrimaryBtn type='submit' disabled={busy}>
					{/* zero kropek i “…” */}
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
			title: "Logowanie",
			subtitle: "Zaloguj się, aby wejść do panelu.",
			email: "Email",
			password: "Hasło",
			submit: "Zaloguj",
			noAccount: "Nie masz konta?",
			register: "Rejestracja",
			backHome: "Powrót",
			emailPh: "you@example.com",
			passPh: "••••••••",
			errEmail: "Podaj poprawny email.",
			errPass: "Hasło min. 6 znaków.",
		},
		en: {
			title: "Login",
			subtitle: "Sign in to access your panel.",
			email: "Email",
			password: "Password",
			submit: "Sign in",
			noAccount: "No account?",
			register: "Register",
			backHome: "Back",
			emailPh: "you@example.com",
			passPh: "••••••••",
			errEmail: "Enter a valid email.",
			errPass: "Password must be at least 6 characters.",
		},
		ua: {
			title: "Вхід",
			subtitle: "Увійдіть, щоб перейти до панелі.",
			email: "Email",
			password: "Пароль",
			submit: "Увійти",
			noAccount: "Немає акаунта?",
			register: "Реєстрація",
			backHome: "Назад",
			emailPh: "you@example.com",
			passPh: "••••••••",
			errEmail: "Введіть коректний email.",
			errPass: "Пароль мін. 6 символів.",
		},
		zh: {
			title: "登录",
			subtitle: "登录后进入面板。",
			email: "邮箱",
			password: "密码",
			submit: "登录",
			noAccount: "还没有账号？",
			register: "注册",
			backHome: "返回",
			emailPh: "you@example.com",
			passPh: "••••••••",
			errEmail: "请输入正确的邮箱。",
			errPass: "密码至少 6 个字符。",
		},
	};

	return dict[lang] || dict.pl;
}
