import type { LatLng } from '../types/game';

const STREETS = [
  'Баумана',
  'Пушкина',
  'Московская',
  'Декабристов',
  'Татарстан',
  'Сибирский тракт',
  'Амирхана',
  'Хади Такташа',
  'Карбышева',
  'Чистопольская',
];

const DISTRICTS = [
  'Центр',
  'Вахитовский',
  'Московский',
  'Ново-Савиновский',
  'Приволжский',
  'Советский',
  'Кировский',
];

function hashCoord(value: number, seed: number): number {
  const x = Math.sin(value * 12.9898 + seed * 78.233) * 43758.5453;
  return Math.abs(x - Math.floor(x));
}

export function formatAddress(point: LatLng): string {
  const streetIdx = Math.floor(hashCoord(point.lat, 1) * STREETS.length);
  const districtIdx = Math.floor(hashCoord(point.lng, 2) * DISTRICTS.length);
  const house = 1 + Math.floor(hashCoord(point.lat + point.lng, 3) * 120);
  return `ул. ${STREETS[streetIdx]}, ${house} · ${DISTRICTS[districtIdx]}`;
}
