import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

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
