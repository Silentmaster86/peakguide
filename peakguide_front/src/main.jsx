import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./app/App.jsx";
import "./index.css";
import { AuthProvider } from "./auth/AuthContext.jsx";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

import icon2x from "leaflet/dist/images/marker-icon-2x.png";
import icon from "leaflet/dist/images/marker-icon.png";
import shadow from "leaflet/dist/images/marker-shadow.png";

// ✅ FIX: Leaflet marker icons in Vite/Netlify + SPA routes (/peaks/:slug)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
	iconRetinaUrl: icon2x,
	iconUrl: icon,
	shadowUrl: shadow,
});

ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<BrowserRouter>
			<AuthProvider>
				<App />
			</AuthProvider>
		</BrowserRouter>
	</React.StrictMode>,
);
