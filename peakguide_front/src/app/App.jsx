import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "../pages/HomePage";
import Navbar from "../components/Navbar";
import PeaksPage from "../pages/PeaksPage";
import PeakDetailsPage from "../pages/PeakDetailsPage";
import RangesPage from "../pages/RangesPage";
import RangeDetailsPage from "../pages/RangeDetailsPage";
import Footer from "../components/Footer";
import AboutPage from "../pages/AboutPage";

export default function App() {
	const [lang, setLang] = useState(
		() => localStorage.getItem("peakguide_lang") || "pl",
	);

	// Supported UI languages (even if DB doesn't have all translations yet)
	const SUPPORTED_LANGS = new Set(["pl", "en", "ua", "zh"]);
	const safeLang = SUPPORTED_LANGS.has(lang) ? lang : "pl";

	useEffect(() => {
		const titles = {
			pl: "Korona Gór Polski i nie tylko — Przewodnik",
			en: "Crown of Poland's Mountains & more — PeakGuide",
			ua: "Корона гір Польщі та більше — Путівник",
			zh: "波兰山峰王冠及更多 — 高峰指南",
		};

		document.title = titles[safeLang] || titles.pl;
		document.documentElement.lang = safeLang;
		document.documentElement.dataset.lang = safeLang;

		// Persist user's choice (save the raw UI choice)
		localStorage.setItem("peakguide_lang", lang);
	}, [lang, safeLang]);

	return (
		<div style={layout}>
			<div style={page}>
				<Navbar lang={safeLang} uiLang={lang} setUiLang={setLang} />

				{/* This wrapper makes footer stick to the bottom when content is short */}
				<div style={contentCol}>
					<main style={main}>
						<Routes>
							<Route path='/' element={<HomePage lang={safeLang} />} />

							<Route path='/peaks' element={<PeaksPage lang={safeLang} />} />
							<Route
								path='/peaks/:slug'
								element={<PeakDetailsPage lang={safeLang} />}
							/>

							<Route path='/ranges' element={<RangesPage lang={safeLang} />} />
							<Route
								path='/ranges/:slug'
								element={<RangeDetailsPage lang={safeLang} />}
							/>
							<Route path='/about' element={<AboutPage lang={safeLang} />} />
						</Routes>
					</main>

					<Footer lang={safeLang} />
				</div>
			</div>
		</div>
	);
}

const layout = {
	minHeight: "100vh",
	padding: 18,
	background: "transparent",
	color: "var(--text)",
	fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
	display: "flex",
};

const page = {
	width: "100%",
	maxWidth: 1140,
	margin: "0 auto",
	background: "var(--surface)",
	border: "1px solid var(--border)",
	borderRadius: 22,
	padding: 18,
	boxShadow: "var(--shadow)",
	display: "flex",
	flexDirection: "column",
	minHeight: "calc(100vh - 36px)", // padding top+bottom in layout (18 + 18)
};

const contentCol = {
	display: "flex",
	flexDirection: "column",
	flex: 1,
};

const main = {
	maxWidth: 1040,
	margin: "0 auto",
	width: "100%",
	padding: "10px 0 24px",
	flex: 1, // <-- this is the key for sticky footer
};
