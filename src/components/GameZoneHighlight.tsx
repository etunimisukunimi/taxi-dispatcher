import { useLayoutEffect, useRef, useState } from 'react';
import { Polygon, Rectangle, useMap } from 'react-leaflet';
import type { CityBounds } from '../config/cities';

export const GAME_ZONE_MASK_COLOR = '#e4e8ec';

const ZONE_MASK_PANE = 'gameZoneMask';

const MASK_FILL = {
  stroke: false,
  fillColor: GAME_ZONE_MASK_COLOR,
  fillOpacity: 1,
} as const;

function masksOutsideBounds(bounds: CityBounds): [number, number][][] {
  const [[south, west], [north, east]] = bounds;
  const minLat = -85;
  const maxLat = 85;
  const minLng = -180;
  const maxLng = 180;

  return [
    [[north, minLng], [maxLat, minLng], [maxLat, maxLng], [north, maxLng]],
    [[minLat, minLng], [south, minLng], [south, maxLng], [minLat, maxLng]],
    [[south, minLng], [north, minLng], [north, west], [south, west]],
    [[south, east], [north, east], [north, maxLng], [south, maxLng]],
  ];
}

type GameZoneHighlightProps = {
  bounds: CityBounds;
};

export function GameZoneHighlight({ bounds }: GameZoneHighlightProps) {
  const map = useMap();
  const [paneReady, setPaneReady] = useState(false);
  const paneInitRef = useRef(false);
  const masks = masksOutsideBounds(bounds);

  useLayoutEffect(() => {
    if (paneInitRef.current) return;
    if (!map.getPane(ZONE_MASK_PANE)) {
      map.createPane(ZONE_MASK_PANE);
    }
    const pane = map.getPane(ZONE_MASK_PANE);
    if (pane) {
      pane.style.zIndex = '450';
      pane.style.pointerEvents = 'none';
    }
    paneInitRef.current = true;
    setPaneReady(true);
  }, [map]);

  if (!paneReady) {
    return (
      <Rectangle
        bounds={bounds}
        pathOptions={{
          color: '#3d8bfd',
          weight: 2.5,
          opacity: 0.95,
          fillColor: '#3d8bfd',
          fillOpacity: 0.04,
          dashArray: '10 6',
        }}
        interactive={false}
      />
    );
  }

  return (
    <>
      {masks.map((ring, index) => (
        <Polygon
          key={index}
          pane={ZONE_MASK_PANE}
          positions={ring}
          pathOptions={MASK_FILL}
          interactive={false}
        />
      ))}
      <Rectangle
        bounds={bounds}
        pathOptions={{
          color: '#3d8bfd',
          weight: 2.5,
          opacity: 0.95,
          fillColor: '#3d8bfd',
          fillOpacity: 0.04,
          dashArray: '10 6',
        }}
        interactive={false}
      />
    </>
  );
}
