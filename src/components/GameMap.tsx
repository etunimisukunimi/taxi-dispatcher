import L from 'leaflet';
import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { getCity, type CityBounds, type CityId } from '../config/cities';
import { selectPlayBounds, selectPlayCenter } from '../config/gameBounds';
import {
  getEffectiveMapStyleId,
  getMapStyle,
} from '../config/mapStyles';
import { useGameStore } from '../store/gameStore';
import { CarMarker } from './CarMarker';
import { CarTripLayer } from './CarTripLayer';
import { GameZoneHighlight } from './GameZoneHighlight';
import { MapClickHandler } from './map/MapClickHandler';
import { OrderMarker } from './map/OrderMarker';
import { TripToastLayer } from './map/TripToastLayer';

import 'leaflet/dist/leaflet.css';

function MapBoundsController({
  cityId,
  bounds,
}: {
  cityId: CityId;
  bounds: CityBounds;
}) {
  const map = useMap();
  const city = getCity(cityId);

  const fitCity = () => {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const padding: L.PointExpression = isMobile ? [24, 24] : [40, 40];
    map.fitBounds(bounds, {
      padding,
      maxZoom: city.defaultZoom,
    });
  };

  const boundsKey = useMemo(
    () =>
      `${bounds[0][0]},${bounds[0][1]},${bounds[1][0]},${bounds[1][1]}`,
    [bounds],
  );
  const lastFittedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    map.setMaxBounds(bounds);
    map.setMinZoom(city.minZoom);
    map.setMaxZoom(city.maxZoom);
    map.options.maxBoundsViscosity = 1;

    if (lastFittedKeyRef.current !== boundsKey) {
      lastFittedKeyRef.current = boundsKey;
      fitCity();
    }

    let timeout: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(timeout);
      timeout = setTimeout(fitCity, 150);
    };

    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, [map, bounds, boundsKey, city.defaultZoom, city.minZoom, city.maxZoom]);

  return null;
}

export function GameMap() {
  const cityId = useGameStore((s) => s.cityId);
  const bounds = useGameStore(selectPlayBounds);
  const center = useGameStore(selectPlayCenter);
  const effectiveStyleId = useGameStore((s) =>
    getEffectiveMapStyleId(s.gameTimeMs, s.mapStyleId),
  );
  const mapStyle = getMapStyle(effectiveStyleId);
  const city = getCity(cityId);
  const fleet = useGameStore((s) => s.fleet);
  const allOrders = useGameStore((s) => s.orders);
  const orders = useMemo(
    () => allOrders.filter((o) => o.status === 'pending'),
    [allOrders],
  );

  return (
    <div className={`game-map game-map--${mapStyle.id}`}>
      <MapContainer
        key={cityId}
        center={center}
        zoom={city.defaultZoom}
        minZoom={city.minZoom}
        maxZoom={city.maxZoom}
        maxBounds={bounds}
        maxBoundsViscosity={1}
        className="game-map__leaflet"
        zoomControl
        scrollWheelZoom
        touchZoom
        doubleClickZoom
        dragging
      >
        <TileLayer
          key={effectiveStyleId}
          attribution={mapStyle.attribution}
          url={mapStyle.url}
          subdomains="abcd"
          maxZoom={city.maxZoom}
        />
        <MapBoundsController cityId={cityId} bounds={bounds} />
        <MapClickHandler />
        {orders.map((order) => (
          <OrderMarker key={order.id} order={order} />
        ))}
        {fleet.map((taxi) => (
          <CarTripLayer key={`route-${taxi.id}`} taxi={taxi} bounds={bounds} />
        ))}
        <GameZoneHighlight bounds={bounds} />
        <TripToastLayer bounds={bounds} />
        {fleet.map((taxi) => (
          <CarMarker key={taxi.id} taxi={taxi} bounds={bounds} />
        ))}
      </MapContainer>
    </div>
  );
}
