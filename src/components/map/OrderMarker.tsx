import L from 'leaflet';
import { useEffect, useMemo, useRef } from 'react';
import { Marker } from 'react-leaflet';
import {
  applyOrderMarkerTimerDom,
  createOrderMarkerHtml,
  orderExpiryProgress,
  ORDER_MARKER_SIZE,
} from './OrderExpiryRing';
import { useGameStore } from '../../store/gameStore';
import type { Order } from '../../types/game';

function createOrderIcon(html: string): L.DivIcon {
  return L.divIcon({
    className: 'order-marker-icon',
    html,
    iconSize: [ORDER_MARKER_SIZE, ORDER_MARKER_SIZE],
    iconAnchor: [ORDER_MARKER_SIZE / 2, ORDER_MARKER_SIZE / 2],
  });
}

type OrderMarkerProps = {
  order: Order;
};

export function OrderMarker({ order }: OrderMarkerProps) {
  const gameTimeMs = useGameStore((s) => s.gameTimeMs);
  const selectedOrderId = useGameStore((s) => s.selectedOrderId);
  const selectOrder = useGameStore((s) => s.selectOrder);

  const markerRef = useRef<L.Marker>(null);
  const selected = selectedOrderId === order.id;

  const progress = orderExpiryProgress(
    order.createdAt,
    order.expiresAt,
    gameTimeMs,
  );

  const markerClass = order.requiredClass ?? 'econom';

  /** Иконка не пересоздаётся каждый кадр — таймер обновляем через DOM */
  const icon = useMemo(
    () => createOrderIcon(createOrderMarkerHtml(1, false, markerClass)),
    [order.id, markerClass],
  );

  useEffect(() => {
    const el = markerRef.current?.getElement();
    if (el) {
      applyOrderMarkerTimerDom(el, progress, selected);
    }
  }, [progress, selected, order.id]);

  return (
    <Marker
      ref={markerRef}
      position={[order.from.lat, order.from.lng]}
      icon={icon}
      zIndexOffset={selected ? 650 : 600}
      eventHandlers={{
        click: (e) => {
          L.DomEvent.stopPropagation(e);
          selectOrder(order.id);
        },
      }}
    />
  );
}
