import { useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import AuthShell from "../components/AuthShell";
import { Field, TextInput, PrimaryBtn } from "../components/AuthFormBits";

function isEmail(v) {
	return /^\S+@\S+\.\S+$/.test(v);
}

export default function LoginPage() {
	const { login, error, status } = useAuth();
	const nav = useNavigate();
	const loc = useLocation();

	const from = useMemo(
		() => loc.state?.from?.pathname || "/panel",
		[loc.state],
	);

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [localError, setLocalError] = useState("");

	const busy = status === "loading";
	const authed = status === "authed";

	async function onSubmit(e) {
		e.preventDefault();
		setLocalError("");

		if (!isEmail(email)) return setLocalError("Podaj poprawny email.");
		if (!password || password.length < 6)
			return setLocalError("Hasło min. 6 znaków.");

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
			title='Logowanie'
			error={localError || error}
			footer={
				<>
					Nie masz konta? <Link to='/register'>Rejestracja</Link>
				</>
			}
		>
			<form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
				<Field label='Email'>
					<TextInput
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						autoComplete='email'
						placeholder='you@example.com'
					/>
				</Field>

				<Field label='Hasło'>
					<TextInput
						type='password'
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						autoComplete='current-password'
						placeholder='••••••••'
					/>
				</Field>

				<PrimaryBtn type='submit' disabled={busy}>
					{busy ? "..." : "Zaloguj"}
				</PrimaryBtn>
			</form>
		</AuthShell>
	);
}
