export function Field({ label, children }) {
	return (
		<label style={field}>
			<div style={lab}>{label}</div>
			{children}
		</label>
	);
}

export function TextInput(props) {
	return <input {...props} style={{ ...input, ...(props.style || {}) }} />;
}

export function TextArea(props) {
	return <textarea {...props} style={{ ...input, ...(props.style || {}) }} />;
}

export function PrimaryBtn({ children, ...props }) {
	return (
		<button {...props} style={{ ...btn, ...(props.style || {}) }}>
			{children}
		</button>
	);
}

const field = { display: "grid", gap: 6 };
const lab = { fontWeight: 1000, fontSize: 13, color: "var(--muted)" };

const input = {
	border: "1px solid var(--border)",
	background: "var(--btn-bg)",
	color: "var(--text)",
	borderRadius: 12,
	padding: "10px 12px",
	outline: "none",
};

const btn = {
	border: "1px solid var(--btn-border)",
	background: "var(--btn-bg)",
	color: "var(--text)",
	padding: "10px 12px",
	borderRadius: 12,
	cursor: "pointer",
	fontWeight: 1000,
};
