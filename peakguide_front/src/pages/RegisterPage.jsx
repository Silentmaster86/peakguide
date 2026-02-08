import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function isEmail(v) {
	return /^\S+@\S+\.\S+$/.test(v);
}

export default function RegisterPage() {
	const { register, error, status } = useAuth();
	const nav = useNavigate();

	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [localError, setLocalError] = useState("");

	const busy = status === "loading";

	async function onSubmit(e) {
		e.preventDefault();
		setLocalError("");

		if (firstName.trim().length < 2) return setLocalError("Imię min. 2 znaki.");
		if (!isEmail(email)) return setLocalError("Podaj poprawny email.");
		if (!password || password.length < 6)
			return setLocalError("Hasło min. 6 znaków.");

		try {
			await register({ email, password, firstName, lastName });
			nav("/panel", { replace: true });
		} catch {
			// error w context
		}
	}

	return (
		<div style={{ maxWidth: 520, margin: "40px auto", padding: 16 }}>
			<h1>Rejestracja</h1>

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
					Imię
					<input
						value={firstName}
						onChange={(e) => setFirstName(e.target.value)}
					/>
				</label>

				<label>
					Nazwisko (opcjonalnie)
					<input
						value={lastName}
						onChange={(e) => setLastName(e.target.value)}
					/>
				</label>

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
						autoComplete='new-password'
					/>
				</label>

				<button type='submit' disabled={busy}>
					{busy ? "Tworzę konto…" : "Utwórz konto"}
				</button>
			</form>

			<p style={{ marginTop: 12 }}>
				Masz konto? <Link to='/login'>Zaloguj się</Link>
			</p>
		</div>
	);
}
