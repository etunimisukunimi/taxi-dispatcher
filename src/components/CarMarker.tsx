import L from 'leaflet';
import { useEffect, useMemo, useRef } from 'react';
import { Marker } from 'react-leaflet';
import { CAR_CLASS_ASSETS } from '../config/carAssets';
import type { CityBounds } from '../config/cities';
import { isTaxiVisibleOnMap } from '../game/tripDisplay';
import type { TaxiUnit } from '../types/game';
import { clampToBounds, isValidLatLng } from '../utils/zoneClip';
import { useGameStore } from '../store/gameStore';

const isTouchDevice =
  typeof window !== 'undefined' &&
  window.matchMedia('(pointer: coarse)').matches;

const BEARING_LERP = 0.14;

function lerpBearing(current: number, target: number, t: number): number {
  let diff = ((target - current + 540) % 360) - 180;
  return (current + diff * t + 360) % 360;
}

function createCarIcon(
  imageUrl: string,
  selected: boolean,
  broken: boolean,
): L.DivIcon {
  const size = isTouchDevice ? 52 : 46;
  const brokenClass = broken ? ' car-marker--broken' : '';
  const selectedClass = selected ? ' car-marker-wrap--selected' : '';
  return L.divIcon({
    className: 'car-marker-icon',
    html: `<div class="car-marker-wrap${selectedClass}" style="width:${size}px;height:${size}px">
      <div class="car-marker${brokenClass}" style="width:100%;height:100%;transform:rotate(0deg)">
        <img src="${imageUrl}" alt="" draggable="false" style="width:100%;height:100%;object-fit:contain;display:block" />
      </div>
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

type CarMarkerProps = {
  taxi: TaxiUnit;
  bounds: CityBounds;
};

export function CarMarker({ taxi, bounds }: CarMarkerProps) {
  const imageUrl = CAR_CLASS_ASSETS[taxi.carClass];
  const selectedTaxiId = useGameStore((s) => s.selectedTaxiId);
  const selectTaxi = useGameStore((s) => s.selectTaxi);
  const selectOrder = useGameStore((s) => s.selectOrder);
  const selected = selectedTaxiId === taxi.id;

  const markerRef = useRef<L.Marker>(null);
  const bearingVisualRef = useRef(taxi.bearingDeg);
  const bearingTargetRef = useRef(taxi.bearingDeg);

  const icon = useMemo(
    () => createCarIcon(imageUrl, selected, taxi.isBroken),
    [imageUrl, selected, taxi.isBroken],
  );

  useEffect(() => {
    bearingTargetRef.current = taxi.bearingDeg;
  }, [taxi.bearingDeg]);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const inner = markerRef.current
        ?.getElement()
        ?.querySelector('.car-marker') as HTMLElement | null;
      if (inner) {
        bearingVisualRef.current = lerpBearing(
          bearingVisualRef.current,
          bearingTargetRef.current,
          BEARING_LERP,
        );
        inner.style.transform = `rotate(${bearingVisualRef.current}deg)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [taxi.id]);

  useEffect(() => {
    const wrap = markerRef.current?.getElement()?.querySelector('.car-marker-wrap');
    if (wrap) {
      wrap.classList.toggle('car-marker-wrap--selected', selected);
    }
  }, [selected]);

  if (!isTaxiVisibleOnMap(taxi)) return null;

  const position = clampToBounds(taxi.position, bounds);
  if (!isValidLatLng(position)) return null;

  return (
    <Marker
      ref={markerRef}
      position={[position.lat, position.lng]}
      icon={icon}
      zIndexOffset={selected ? 520 : 500}
      eventHandlers={{
        click: (e) => {
          L.DomEvent.stopPropagation(e);
          selectOrder(null);
          selectTaxi(taxi.id);
        },
      }}
    />
  );
}
