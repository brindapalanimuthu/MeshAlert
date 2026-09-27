import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import type { Incident, Resource } from '@/db/localDB';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const SEVERITY_COLORS: Record<string, string> = {
  Low: '#668d80',
  Medium: '#d2b36b',
  High: '#ad5d57',
  Critical: '#47282f',
};

interface LiveMapProps {
  incidents?: Incident[];
  resources?: Resource[];
  center?: [number, number];
  zoom?: number;
}

export default function LiveMap({
  incidents = [],
  resources = [],
  center = [11.0168, 76.9558],
  zoom = 12,
}: LiveMapProps) {
  const incidentsWithLocation = incidents.filter(
    (i) => i.location?.lat != null && i.location?.lng != null
  );
  const resourcesWithLocation = resources.filter(
    (r) => r.location && r.location.lat != null && r.location.lng != null
  );

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-ink-200/70 shadow-lg shadow-ink-900/5 animate-card-rise dark:border-ink-700/50 dark:shadow-black/30">
      <MapContainer center={center} zoom={zoom} scrollWheelZoom className="z-0 h-[480px] w-full">
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {incidentsWithLocation.map((inc) => (
          <Circle
            key={`inc-${inc.id || inc.clientId}`}
            center={[inc.location.lat!, inc.location.lng!]}
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
          <Marker
            key={`res-${res.id || res.clientId}`}
            position={[res.location!.lat!, res.location!.lng!]}
          >
            <Popup>
              <strong>{res.type}</strong>
              <br />
              {res.description}
              {res.quantity && (
                <>
                  <br />
                  Qty: {res.quantity}
                </>
              )}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
