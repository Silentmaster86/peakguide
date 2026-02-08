import { useState } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import AuthShell from "../components/AuthShell";
import { Field, TextInput, PrimaryBtn } from "../components/AuthFormBits";

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
	const authed = status === "authed";

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
			// handled in context
		}
	}

	if (authed) return <Navigate to='/panel' replace />;

	return (
		<AuthShell
			title='Rejestracja'
			error={localError || error}
			footer={
				<>
					Masz konto? <Link to='/login'>Logowanie</Link>
				</>
			}
		>
			<form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
				<Field label='Imię'>
					<TextInput
						value={firstName}
						onChange={(e) => setFirstName(e.target.value)}
					/>
				</Field>

				<Field label='Nazwisko (opcjonalnie)'>
					<TextInput
						value={lastName}
						onChange={(e) => setLastName(e.target.value)}
					/>
				</Field>

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
						autoComplete='new-password'
						placeholder='min. 6 znaków'
					/>
				</Field>

				<PrimaryBtn type='submit' disabled={busy}>
					{busy ? "..." : "Utwórz konto"}
				</PrimaryBtn>
			</form>
		</AuthShell>
	);
}
