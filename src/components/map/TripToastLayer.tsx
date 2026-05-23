import L from 'leaflet';
import { Marker } from 'react-leaflet';
import type { CityBounds } from '../../config/cities';
import { useGameStore } from '../../store/gameStore';
import { clampToBounds, isValidLatLng } from '../../utils/zoneClip';

const TOAST_MAX_WIDTH = 300;
const TOAST_CHAR_WIDTH = 6.8;
const TOAST_H_PADDING = 20;
const TOAST_LINE_HEIGHT = 18;
const TOAST_V_PADDING = 14;

function estimateToastSize(text: string): { width: number; height: number } {
  const innerMax = TOAST_MAX_WIDTH - TOAST_H_PADDING;
  const charsPerLine = Math.max(12, Math.floor(innerMax / TOAST_CHAR_WIDTH));
  const lineCount = Math.max(1, Math.ceil(text.length / charsPerLine));
  const longestLine = Math.min(
    charsPerLine,
    text.length - (lineCount - 1) * charsPerLine || text.length,
  );
  const width = Math.min(
    TOAST_MAX_WIDTH,
    Math.ceil(longestLine * TOAST_CHAR_WIDTH + TOAST_H_PADDING),
  );
  const height = TOAST_V_PADDING + lineCount * TOAST_LINE_HEIGHT;
  return { width, height };
}

function createToastIcon(text: string): L.DivIcon {
  const { width, height } = estimateToastSize(text);
  return L.divIcon({
    className: 'trip-toast-icon',
    html: `<div class="trip-toast">${text}</div>`,
    iconSize: [width, height],
    iconAnchor: [width / 2, height + 8],
  });
}

type TripToastLayerProps = {
  bounds: CityBounds;
};

export function TripToastLayer({ bounds }: TripToastLayerProps) {
  const tripToasts = useGameStore((s) => s.tripToasts);

  return (
    <>
      {tripToasts.map((toast) => {
        const pos = clampToBounds(toast.position, bounds);
        if (!isValidLatLng(pos)) return null;

        return (
          <Marker
            key={toast.id}
            position={[pos.lat, pos.lng]}
            icon={createToastIcon(toast.text)}
            zIndexOffset={1200}
            interactive={false}
          />
        );
      })}
    </>
  );
}
