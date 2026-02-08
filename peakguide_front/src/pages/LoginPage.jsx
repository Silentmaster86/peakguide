import { useMemo, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

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
			// error obsłużony w context
		}
	}

	return (
		<div style={{ maxWidth: 520, margin: "40px auto", padding: 16 }}>
			<h1>Logowanie</h1>

			{(localError || error) && (
				<div
					style={{
						padding: 12,
						border: "1px solid #f00",
						borderRadius: 8,
						margin: "12px 0",
					}}
				>
					{localError || error}
				</div>
			)}

			<form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
				<label>
					Email
					<input
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						autoComplete='email'
					/>
				</label>

				<label>
					Hasło
					<input
						type='password'
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						autoComplete='current-password'
					/>
				</label>

				<button type='submit' disabled={busy}>
					{busy ? "Loguję…" : "Zaloguj"}
				</button>
			</form>

			<p style={{ marginTop: 12 }}>
				Nie masz konta? <Link to='/register'>Zarejestruj się</Link>
			</p>
		</div>
	);
}
