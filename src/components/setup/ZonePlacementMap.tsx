import L from 'leaflet';
import { useMemo, useState } from 'react';
import { MapContainer, Marker, Rectangle, TileLayer } from 'react-leaflet';
import { getCity, type CityBounds } from '../../config/cities';
import { boundsFromCenter } from '../../config/gameBounds';
import { getMapStyle } from '../../config/mapStyles';

import 'leaflet/dist/leaflet.css';

const PLACEMENT_MIN_ZOOM = 9;
const PLACEMENT_MAX_ZOOM = 15;

const dragHandleIcon = L.divIcon({
  className: 'zone-placement-handle',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

type ZonePlacementMapProps = {
  initialCenter: [number, number];
  onConfirm: (bounds: CityBounds) => void;
  onBack: () => void;
};

export function ZonePlacementMap({
  initialCenter,
  onConfirm,
  onBack,
}: ZonePlacementMapProps) {
  const [center, setCenter] = useState<[number, number]>(initialCenter);
  const bounds = useMemo(() => boundsFromCenter(center), [center]);
  const mapStyle = getMapStyle('positron');
  const city = getCity('kazan');

  return (
    <div className="zone-placement">
      <MapContainer
        center={initialCenter}
        zoom={11}
        minZoom={PLACEMENT_MIN_ZOOM}
        maxZoom={PLACEMENT_MAX_ZOOM}
        className="zone-placement__map"
        zoomControl
        scrollWheelZoom
        touchZoom
        doubleClickZoom
        dragging
      >
        <TileLayer
          attribution={mapStyle.attribution}
          url={mapStyle.url}
          subdomains="abcd"
          maxZoom={city.maxZoom}
        />
        <Rectangle
          bounds={bounds}
          pathOptions={{
            color: '#3d8bfd',
            weight: 2.5,
            opacity: 0.95,
            fillColor: '#3d8bfd',
            fillOpacity: 0.12,
            dashArray: '10 6',
          }}
        />
        <Marker
          position={center}
          draggable
          icon={dragHandleIcon}
          eventHandlers={{
            drag: (e) => {
              const pos = e.target.getLatLng();
              setCenter([pos.lat, pos.lng]);
            },
            dragend: (e) => {
              const pos = e.target.getLatLng();
              setCenter([pos.lat, pos.lng]);
            },
          }}
        />
      </MapContainer>

      <div className="zone-placement__hint">
        Перетащите маркер, чтобы сместить игровую зону на карте
      </div>

      <div className="zone-placement__actions">
        <button type="button" className="btn btn--ghost" onClick={onBack}>
          Назад
        </button>
        <button
          type="button"
          className="btn btn--accent"
          onClick={() => onConfirm(bounds)}
        >
          Зафиксировать зону
        </button>
      </div>
    </div>
  );
}
