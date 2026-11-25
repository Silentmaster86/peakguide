import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { parseCoordinates } from "../utils/coordinates";
import "leaflet/dist/leaflet.css";
import { mapIcon, mapLabels, poiKind } from "../features/map/presentation";

function position(lat, lon) {
  const coordinates = parseCoordinates(lat, lon);

  return coordinates ? [coordinates.lat, coordinates.lon] : null;
}

function mapLink(value, coords) {
  try {
    const url = new URL(value);
    if (["https:", "http:"].includes(url.protocol)) return url.href;
  } catch { /* Use verified numeric coordinates as fallback. */ }
  return `https://www.google.com/maps/search/?api=1&query=${coords[0]},${coords[1]}`;
}
function FitView({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 1) map.setView(points[0], 13, { animate: false });
    else if (points.length > 1) map.fitBounds(points, { padding: [40, 40], maxZoom: 14, animate: false });
  }, [map, points]);
  return null;
}
export default function PeakMap({ name, lat, lon, pois = [], lang = "pl" }) {
  const peakPosition = useMemo(() => position(lat, lon), [lat, lon]);
  const markers = useMemo(() => (Array.isArray(pois) ? pois : [])
    .filter((poi) => poi && poi.active !== false)
    .map((poi) => ({ ...poi, position: position(poi.latitude, poi.longitude) }))
    .filter((poi) => poi.position), [pois]);
  const points = useMemo(() => [peakPosition, ...markers.map((poi) => poi.position)].filter(Boolean), [peakPosition, markers]);
  const openMap = ({ pl: "Otwórz mapę", en: "Open map", ua: "Відкрити мапу", zh: "打开地图" })[lang] || "Open map";
  const ui = mapLabels(lang);
  if (!points.length) return null;
  return (
    <div style={{ height: 320, width: "100%", borderRadius: 18, overflow: "hidden", position: "relative", zIndex: 0 }}>
      <MapContainer center={points[0]} zoom={13} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <FitView points={points} />
        {peakPosition && <Marker position={peakPosition} icon={mapIcon('peak')} title={name} alt={name || ui.peak}>
          <Popup><b>{name}</b><div>{peakPosition.map((n) => n.toFixed(6)).join(", ")}</div><a href={mapLink(null, peakPosition)} target="_blank" rel="noopener noreferrer">{openMap}</a></Popup>
        </Marker>}
        {markers.map((poi) => <Marker key={poi.id} position={poi.position} icon={mapIcon(poiKind(poi))} title={poi.name} alt={poi.name || poi.type_name || ui[poiKind(poi)]}>
          <Popup>
            <b>{poi.name || poi.type_name || ui[poiKind(poi)]}</b>
            {poi.type_name && <div>{poi.type_name}</div>}
            {poi.description && <p style={{ whiteSpace: "pre-wrap" }}>{poi.description}</p>}
            <a href={mapLink(poi.google_maps_url, poi.position)} target="_blank" rel="noopener noreferrer">{openMap}</a>
          </Popup>
        </Marker>)}
      </MapContainer>
    </div>
  );
}
