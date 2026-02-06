import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

// Vite needs explicit URLs for Leaflet marker assets:
import marker2x from "leaflet/dist/images/marker-icon-2x.png";
import marker1x from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// FIX: Default icons Leaflet on production (Netlify/Vite)
const DefaultIcon = L.icon({
	iconRetinaUrl: marker2x,
	iconUrl: marker1x,
	shadowUrl: markerShadow,
	iconSize: [25, 41],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
	shadowSize: [41, 41],
});

export default function PeakMap({ name, lat, lon }) {
	const latitude = Number(lat);
	const longitude = Number(lon);

	const ok =
		Number.isFinite(latitude) &&
		Number.isFinite(longitude) &&
		Math.abs(latitude) <= 90 &&
		Math.abs(longitude) <= 180;

	if (!ok) return null;

	const center = [latitude, longitude];

	return (
		<div
			style={{
				height: 320,
				width: "100%",
				borderRadius: 18,
				overflow: "hidden",
			}}
		>
			<MapContainer
				center={center}
				zoom={13}
				scrollWheelZoom={false}
				style={{ height: "100%", width: "100%" }}
			>
				<TileLayer
					attribution='&copy; OpenStreetMap contributors'
					url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
				/>
				<Marker position={center}>
					<Popup>
						<b>{name}</b>
						<div style={{ fontSize: 12 }}>
							{latitude.toFixed(6)}, {longitude.toFixed(6)}
						</div>

						<a
							href={`https://www.google.com/maps?q=${latitude},${longitude}`}
							target='_blank'
							rel='noreferrer'
							style={{ fontSize: 12, display: "inline-block", marginTop: 6 }}
						>
							Open in Google Maps
						</a>
					</Popup>
				</Marker>
			</MapContainer>
		</div>
	);
}
