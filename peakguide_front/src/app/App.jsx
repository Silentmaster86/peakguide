import { lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import Navbar from '../components/Navbar';

const PeaksPage = lazy(() => import('../pages/PeaksPage'));
const PeakDetailsPage = lazy(() => import('../pages/PeakDetailsPage'));
const RangesPage = lazy(() => import('../pages/RangesPage'));
const RangeDetailsPage = lazy(() => import('../pages/RangeDetailsPage'));
const TrailsPage = lazy(() => import('../pages/TrailsPage'));

import Footer from '../components/Footer';
const AboutPage = lazy(() => import('../pages/AboutPage'));

const LoginPage = lazy(() => import('../pages/LoginPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('../pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../pages/ResetPasswordPage'));
const PanelPage = lazy(() => import('../pages/PanelPage'));
import { ProtectedRoute } from '../auth/ProtectedRoute';


export default function App() {
	const [lang, setLang] = useState(
		() => localStorage.getItem('peakguide_lang') || 'pl',
	);

	// Supported UI languages (even if DB doesn't have all translations yet)
	const SUPPORTED_LANGS = new Set(['pl', 'en', 'ua', 'zh']);
	const safeLang = SUPPORTED_LANGS.has(lang) ? lang : 'pl';

	useEffect(() => {
		const htmlLang = safeLang === 'ua' ? 'uk' : safeLang;		
		document.documentElement.lang = htmlLang;
		document.documentElement.dataset.lang = safeLang;

		// Persist user's choice (save the raw UI choice)
		localStorage.setItem('peakguide_lang', lang);
	}, [lang, safeLang]);

	return (
		<div style={layout}>
			<div style={page}>
				<a className='skip-link' href='#main-content'>{({ pl: 'Przejdź do treści', en: 'Skip to content', ua: 'Перейти до вмісту', zh: '跳到正文' })[safeLang]}</a>
				<Navbar lang={safeLang} uiLang={lang} setUiLang={setLang} />

				{/* This wrapper makes footer stick to the bottom when content is short */}
				<div style={contentCol}>
					<main id='main-content' tabIndex={-1} style={main}><Suspense fallback={<p role='status'>{({ pl: 'Ładowanie…', en: 'Loading…', ua: 'Завантаження…', zh: '加载中…' })[safeLang]}</p>}>
						<Routes>
							<Route path='/' element={<HomePage lang={safeLang} />} />

							<Route path='/peaks' element={<PeaksPage lang={safeLang} />} />
							<Route
								path='/peaks/:slug'
								element={<PeakDetailsPage lang={safeLang} />}
							/>

							<Route path='/trails' element={<TrailsPage lang={safeLang} />} />

							<Route path='/ranges' element={<RangesPage lang={safeLang} />} />
							<Route
								path='/ranges/:slug'
								element={<RangeDetailsPage lang={safeLang} />}
							/>
							<Route path='/about' element={<AboutPage lang={safeLang} />} />

							{/* AUTH */}
							<Route path='/login' element={<LoginPage lang={safeLang} />} />
							<Route path='/forgot-password' element={<ForgotPasswordPage lang={safeLang} />} />
							<Route path='/reset-password' element={<ResetPasswordPage lang={safeLang} />} />
							<Route
								path='/register'
								element={<RegisterPage lang={safeLang} />}
							/>

							<Route element={<ProtectedRoute />}>
								<Route path='/panel' element={<PanelPage lang={safeLang} />} />
							</Route>
							<Route
								path='*'
								element={<div style={{ padding: 16 }}>404</div>}
							/>
						</Routes>
					</Suspense></main>
					<Footer lang={safeLang} />
				</div>
			</div>
		</div>
	);
}

const layout = {
	minHeight: '95vh',
	padding: 14,
	background: 'transparent',
	color: 'var(--text)',
	fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
	display: 'flex',
};

const page = {
	width: '90vw',
	margin: '0 auto',
	background: 'color-mix(in srgb, var(--menu-bg) 70%, transparent)',
	border: 'none',
	borderRadius: 22,
	padding: 18, // extra space for box shadow
	boxShadow: 'var(--shadow)',
	display: 'flex',
	flexDirection: 'column',
	minHeight: 'calc(95vh - 36px)', // 36px = padding 18px top + 18px bottom
};

const contentCol = {
	display: 'flex',
	flexDirection: 'column',
	flex: 1,
};

const main = {
	width: '100%',
	padding: '10px 0 24px',
	flex: 1,
};
