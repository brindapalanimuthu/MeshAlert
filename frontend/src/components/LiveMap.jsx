import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import './LiveMap.css';

// Fix default marker icons not loading with Vite's bundling
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const SEVERITY_COLORS = {
  Low: '#2F9E8F',
  Medium: '#E8A33D',
  High: '#E88F6F',
  Critical: '#D94F4F',
};

function LiveMap({ incidents = [], resources = [], center = [11.0168, 76.9558], zoom = 12 }) {
  const incidentsWithLocation = incidents.filter((i) => i.location?.lat != null && i.location?.lng != null);
  const resourcesWithLocation = resources.filter((r) => r.location?.lat != null && r.location?.lng != null);

  return (
    <div className="live-map">
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} className="live-map__container">
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {incidentsWithLocation.map((inc) => (
          <Circle
            key={`inc-${inc.id || inc.clientId}`}
            center={[inc.location.lat, inc.location.lng]}
            radius={250}
            pathOptions={{
              color: SEVERITY_COLORS[inc.severity] || SEVERITY_COLORS.Medium,
              fillColor: SEVERITY_COLORS[inc.severity] || SEVERITY_COLORS.Medium,
              fillOpacity: 0.35,
            }}
          >
            <Popup>
              <strong>{inc.type}</strong> · {inc.severity}
              <br />
              {inc.description}
            </Popup>
          </Circle>
        ))}

        {resourcesWithLocation.map((res) => (
          <Marker key={`res-${res.id || res.clientId}`} position={[res.location.lat, res.location.lng]}>
            <Popup>
              <strong>{res.type}</strong>
              <br />
              {res.description}
              {res.quantity && <><br />Qty: {res.quantity}</>}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default LiveMap;