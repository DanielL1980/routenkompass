import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadowUrl from 'leaflet/dist/images/marker-shadow.png';

// Leaflet-Standardicon manuell setzen (Vite bundelt Bild-Assets anders als CRA)
const standardIcon = L.icon({
  iconUrl,
  shadowUrl: iconShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const BRANDENBURG_ZENTRUM = [52.4, 12.5];

function KlickHandler({ onKartenklick }) {
  useMapEvents({
    click(e) {
      onKartenklick(e.latlng);
    },
  });
  return null;
}

// Leaflet-Karte mit interaktiven Wegpunkten (verschiebbar/hinzufuegbar) und Routen-Geometrie
export default function KarteAnzeige({ wegpunkte, route, onWegpunktVerschieben, onWegpunktHinzufuegen }) {
  const routenLinie = route?.geometrie?.coordinates?.map(([lng, lat]) => [lat, lng]) || [];

  const zentrum =
    wegpunkte.length > 0 ? [wegpunkte[0].lat, wegpunkte[0].lng] : BRANDENBURG_ZENTRUM;

  return (
    <div className="h-[400px] overflow-hidden rounded-lg sm:h-[500px]">
      <MapContainer center={zentrum} zoom={9} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {routenLinie.length > 0 && (
          <Polyline positions={routenLinie} pathOptions={{ color: '#1e40af', weight: 4 }} />
        )}

        {wegpunkte.map((wp, index) => (
          <Marker
            key={`${wp.address}-${index}`}
            position={[wp.lat, wp.lng]}
            icon={standardIcon}
            draggable
            eventHandlers={{
              dragend: (e) => onWegpunktVerschieben(index, e.target.getLatLng()),
            }}
          >
            <Popup>
              <strong>{wp.address}</strong>
              <br />
              {wp.reason}
            </Popup>
          </Marker>
        ))}

        <KlickHandler onKartenklick={onWegpunktHinzufuegen} />
      </MapContainer>
    </div>
  );
}
