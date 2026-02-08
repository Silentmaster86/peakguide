import { Link } from "react-router-dom";

export default function AuthShell({
	title,
	subtitle,
	error,
	children,
	footer,
}) {
	return (
		<div style={wrap}>
			<section style={card}>
				<div style={{ marginBottom: 12 }}>
					<h1 style={h1}>{title}</h1>
					{subtitle ? <div style={sub}>{subtitle}</div> : null}
				</div>

				{error ? <div style={errorBox}>{error}</div> : null}

				{children}

				{footer ? <div style={footerRow}>{footer}</div> : null}
			</section>

			<div style={backRow}>
				<Link to='/' style={backLink}>
					← PeakGuide
				</Link>
			</div>
		</div>
	);
}

const wrap = {
	maxWidth: 520,
	margin: "44px auto",
	padding: 16,
};

const card = {
	border: "1px solid var(--border)",
	borderRadius: 22,
	padding: 16,
	background: "var(--menu-bg)",
	boxShadow: "var(--shadow-soft)",
};

const h1 = { margin: 0, letterSpacing: "-0.4px" };
const sub = {
	marginTop: 6,
	color: "var(--muted)",
	fontWeight: 800,
	lineHeight: 1.5,
};

const errorBox = {
	margin: "12px 0",
	padding: 12,
	borderRadius: 14,
	border: "1px solid rgba(239,68,68,0.25)",
	background: "rgba(239,68,68,0.06)",
	fontWeight: 900,
};

const footerRow = { marginTop: 12, color: "var(--muted)", fontWeight: 800 };

const backRow = { marginTop: 12, textAlign: "center" };
const backLink = {
	color: "var(--muted)",
	textDecoration: "none",
	fontWeight: 900,
};
