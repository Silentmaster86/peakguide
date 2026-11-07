import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./app/App.jsx";
import "./index.css";
import { AuthProvider } from "./auth/AuthContext.jsx";
import { HelmetProvider } from "react-helmet-async";

// React 19 hoists route metadata. Remove only the static HTML fallbacks.
document.querySelectorAll('[data-static-seo]').forEach((element) => element.remove());

ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<BrowserRouter>
			<AuthProvider>
				<HelmetProvider>
					<App />
				</HelmetProvider>
			</AuthProvider>
		</BrowserRouter>
	</React.StrictMode>,
);
