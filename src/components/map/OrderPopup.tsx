import {
  findNearestEligibleTaxi,
  getNearestPickupDistanceM,
  getOrderAcceptBlockReason,
  getOrderPreviewFare,
} from '../../game/dispatch';
import { getDistrictLabel } from '../../game/districts';
import { getOrderClassLabel } from '../../game/orderLabels';
import { BtnWithHint } from '../ui/BtnWithHint';
import { useGameStore } from '../../store/gameStore';
import type { Order } from '../../types/game';
import { GAME_BALANCE } from '../../config/gameBalance';
import {
  formatDistance,
  formatEtaDisplay,
  formatMoney,
  formatTripEtaRemaining,
} from '../../utils/format';

type OrderPopupProps = {
  order: Order;
  onAccept: () => void;
  onReject: () => void;
};

export function OrderPopup({ order, onAccept, onReject }: OrderPopupProps) {
  const fleet = useGameStore((s) => s.fleet);
  const cityId = useGameStore((s) => s.cityId);
  const timeScaleMode = useGameStore((s) => s.timeScaleMode);
  const districtLabel = order.districtId
    ? getDistrictLabel(order.districtId, cityId)
    : null;

  const pickupDist = getNearestPickupDistanceM(fleet, order);
  const nearestTaxi = findNearestEligibleTaxi(fleet, order.from, order);
  const previewFare = getOrderPreviewFare(order, fleet);
  const canAccept = pickupDist !== null;
  const acceptBlockReason = getOrderAcceptBlockReason(fleet, order);
  const acceptTooltip =
    !canAccept && acceptBlockReason
      ? `Вы не можете принять этот заказ, поскольку у вас нет ${acceptBlockReason}`
      : undefined;

  const tripEta = nearestTaxi
    ? formatTripEtaRemaining(
        order.distanceM,
        nearestTaxi.driver,
        timeScaleMode,
      )
    : formatEtaDisplay(
        order.distanceM,
        GAME_BALANCE.baseSpeedMps,
        timeScaleMode,
      );
  const pickupEta =
    pickupDist !== null && nearestTaxi
      ? formatTripEtaRemaining(
          pickupDist,
          nearestTaxi.driver,
          timeScaleMode,
        )
      : '—';

  return (
    <div className="order-popup">
      <div className="order-popup__class">{getOrderClassLabel(order)}</div>
      {districtLabel && (
        <p className="order-popup__district">{districtLabel}</p>
      )}
      <p className="order-popup__fare">{formatMoney(previewFare)}</p>

      <dl className="order-popup__details">
        <dt>Откуда</dt>
        <dd>{order.fromLabel}</dd>
        <dt>Куда</dt>
        <dd>{order.toLabel}</dd>
        <dt>Время в пути</dt>
        <dd>{tripEta}</dd>
        <dt>До ближайшего такси</dt>
        <dd>
          {pickupDist !== null
            ? `${formatDistance(pickupDist)} · ${pickupEta}`
            : 'Нет подходящих машин'}
        </dd>
        <dt>Дистанция</dt>
        <dd>{formatDistance(order.distanceM)}</dd>
      </dl>

      <div className="order-popup__actions">
        <BtnWithHint
          hint={acceptTooltip}
          hintVariant="accent"
          className="btn btn--accent order-popup__accept-btn"
          disabled={!canAccept}
          onClick={onAccept}
        >
          Принять
        </BtnWithHint>
        <button type="button" className="btn btn--outline" onClick={onReject}>
          Отклонить
        </button>
      </div>
    </div>
  );
}
