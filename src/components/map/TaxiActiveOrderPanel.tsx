import { getOrderClassLabel } from '../../game/orderLabels';
import { hasActiveOrder } from '../../game/tripDisplay';
import { useGameStore } from '../../store/gameStore';
import {
  formatDistance,
  formatMoney,
  formatTripEtaRemaining,
} from '../../utils/format';

export function TaxiActiveOrderPanel() {
  const selectedTaxiId = useGameStore((s) => s.selectedTaxiId);
  const fleet = useGameStore((s) => s.fleet);
  const orders = useGameStore((s) => s.orders);
  const timeScaleMode = useGameStore((s) => s.timeScaleMode);

  const taxi = fleet.find((t) => t.id === selectedTaxiId);
  if (!taxi || !taxi.assignedOrderId || !hasActiveOrder(taxi)) {
    return null;
  }

  const order = orders.find(
    (o) => o.id === taxi.assignedOrderId && o.status === 'assigned',
  );
  if (!order) return null;

  const leftM = Math.max(0, taxi.distanceM - taxi.progressM);
  const phaseLabel =
    taxi.status === 'to_pickup'
      ? 'К клиенту'
      : taxi.tripPhase === 'with_passenger'
        ? 'С пассажиром'
        : 'На заказе';

  return (
    <div className="taxi-active-order-panel">
      <h4 className="taxi-active-order-panel__title">Текущий заказ</h4>
      <dl className="taxi-active-order-panel__list">
        <dt>Класс</dt>
        <dd>{getOrderClassLabel(order)}</dd>
        <dt>Тариф</dt>
        <dd>{formatMoney(order.fare)}</dd>
        <dt>Фаза</dt>
        <dd>{phaseLabel}</dd>
        <dt>Откуда</dt>
        <dd>{order.fromLabel}</dd>
        <dt>Куда</dt>
        <dd>{order.toLabel}</dd>
        <dt>Осталось</dt>
        <dd>
          {formatDistance(leftM)} ·{' '}
          {formatTripEtaRemaining(leftM, taxi.driver, timeScaleMode)}
        </dd>
      </dl>
    </div>
  );
}
