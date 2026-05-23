import L from 'leaflet';
import { CircleMarker, Marker, Polyline } from 'react-leaflet';
import { getCarRouteColor } from '../config/carColors';
import type { CityBounds } from '../config/cities';
import {
  DROPOFF_MARKER_COLOR,
  DROPOFF_MARKER_SVG,
  PICKUP_MARKER_COLOR,
  PICKUP_MARKER_SVG,
} from '../config/tripPointMarkers';
import { getTripDisplayMode, isTaxiVisibleOnMap } from '../game/tripDisplay';
import type { TaxiUnit } from '../types/game';
import { clampToBounds, isValidLatLng } from '../utils/zoneClip';

function toPositions(points: { lat: number; lng: number }[]): [number, number][] {
  return points.map((p) => [p.lat, p.lng]);
}

function createTripPointIcon(kind: 'start' | 'end'): L.DivIcon {
  const svg = kind === 'start' ? PICKUP_MARKER_SVG : DROPOFF_MARKER_SVG;
  return L.divIcon({
    className: 'trip-point-icon',
    html: `<div class="trip-point-marker">${svg}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

type CarTripLayerProps = {
  taxi: TaxiUnit;
  bounds: CityBounds;
};

export function CarTripLayer({ taxi, bounds }: CarTripLayerProps) {
  if (!isTaxiVisibleOnMap(taxi)) return null;
  const mode = getTripDisplayMode(taxi);
  if (mode === 'hidden') return null;

  const color = getCarRouteColor(taxi.id);
  const positions = toPositions(taxi.routePoints).filter(
    ([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng),
  );

  const from = taxi.pickupPoint
    ? clampToBounds(taxi.pickupPoint, bounds)
    : null;
  const to = taxi.dropoffPoint
    ? clampToBounds(taxi.dropoffPoint, bounds)
    : null;

  if (positions.length < 2) return null;

  const isPickupLeg = mode === 'to_pickup';

  return (
    <>
      <Polyline
        positions={positions}
        pathOptions={{
          color,
          weight: isPickupLeg ? 3 : 4,
          opacity: isPickupLeg ? 0.55 : 0.72,
          dashArray: isPickupLeg ? '8 6' : undefined,
          lineCap: 'round',
          lineJoin: 'round',
          interactive: false,
        }}
      />
      {from && isValidLatLng(from) && (
        <>
          <CircleMarker
            center={[from.lat, from.lng]}
            radius={5}
            pathOptions={{
              color: PICKUP_MARKER_COLOR,
              fillColor: PICKUP_MARKER_COLOR,
              fillOpacity: 0.35,
              weight: 2,
            }}
          />
          <Marker
            position={[from.lat, from.lng]}
            icon={createTripPointIcon('start')}
            zIndexOffset={420}
          />
        </>
      )}
      {!isPickupLeg && to && isValidLatLng(to) && (
        <>
          <CircleMarker
            center={[to.lat, to.lng]}
            radius={5}
            pathOptions={{
              color: DROPOFF_MARKER_COLOR,
              fillColor: DROPOFF_MARKER_COLOR,
              fillOpacity: 0.2,
              weight: 2,
              dashArray: '4 3',
            }}
          />
          <Marker
            position={[to.lat, to.lng]}
            icon={createTripPointIcon('end')}
            zIndexOffset={420}
          />
        </>
      )}
    </>
  );
}
