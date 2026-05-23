import { CAR_CLASS_LABELS } from '../config/carAssets';
import { GAME_BALANCE } from '../config/gameBalance';
import { TAXI_STATUS_LABELS, type TaxiUnit } from '../types/game';
import { formatGameTime } from '../utils/format';

export type TripDisplayMode = 'hidden' | 'to_pickup' | 'with_passenger';

export function isTaxiVisibleOnMap(taxi: TaxiUnit): boolean {
  if (!taxi.positionReady) return false;
  if (taxi.status === 'routing' || taxi.status === 'in_garage') return false;
  return true;
}

export function getTripDisplayMode(taxi: TaxiUnit): TripDisplayMode {
  if (!isTaxiVisibleOnMap(taxi)) return 'hidden';
  if (taxi.status === 'to_pickup' && taxi.routePoints.length >= 2) {
    return 'to_pickup';
  }
  if (
    taxi.status === 'on_trip' &&
    taxi.tripPhase === 'with_passenger' &&
    taxi.routePoints.length >= 2
  ) {
    return 'with_passenger';
  }
  return 'hidden';
}

export function formatTaxiTitle(taxi: TaxiUnit): string {
  const base = CAR_CLASS_LABELS[taxi.carClass];
  const name = taxi.driverName.trim();
  return name ? `${base} (${name})` : base;
}

export function getTaxiStatusLabel(
  taxi: TaxiUnit,
  gameTimeMs?: number,
): string {
  if (taxi.isBroken) return 'Сломана';
  if (taxi.needsService) return 'Нужно ТО';
  if (taxi.status === 'to_pickup') return 'Едет на заказ';
  if (taxi.status === 'on_trip' && taxi.tripPhase === 'with_passenger') {
    return 'Едет по заказу';
  }
  if (taxi.status === 'in_garage' && taxi.garageUntilGameMs > 0) {
    const until = formatGameTime(taxi.garageUntilGameMs);
    if (gameTimeMs !== undefined && taxi.garageUntilGameMs <= gameTimeMs) {
      return TAXI_STATUS_LABELS.in_garage;
    }
    return `В гараже · выезд ${until}`;
  }
  return TAXI_STATUS_LABELS[taxi.status];
}

export function hasActiveOrder(taxi: TaxiUnit): boolean {
  return taxi.status === 'to_pickup' || taxi.status === 'on_trip';
}

export type CarPrimaryAction =
  | { kind: 'free'; label: 'Свободен'; needsConfirm: boolean }
  | { kind: 'break'; label: 'На обед'; needsConfirm: false }
  | { kind: 'endBreak'; label: 'Вернуть в строй'; needsConfirm: false }
  | { kind: 'none'; label: string; needsConfirm: false };

export function getCarPrimaryAction(taxi: TaxiUnit): CarPrimaryAction {
  if (taxi.isBroken || taxi.needsService) {
    return { kind: 'none', label: '', needsConfirm: false };
  }
  if (hasActiveOrder(taxi)) {
    return { kind: 'free', label: 'Свободен', needsConfirm: true };
  }
  if (taxi.status === 'free' && !taxi.isBroken) {
    return { kind: 'break', label: 'На обед', needsConfirm: false };
  }
  if (taxi.status === 'in_garage') {
    return { kind: 'none', label: '', needsConfirm: false };
  }
  if (taxi.status === 'on_break') {
    if (taxi.driver.fatigue <= GAME_BALANCE.fatigueEndBreakThreshold) {
      return {
        kind: 'endBreak',
        label: 'Вернуть в строй',
        needsConfirm: false,
      };
    }
    return { kind: 'none', label: 'Вернуть в строй', needsConfirm: false };
  }
  return { kind: 'none', label: '', needsConfirm: false };
}
