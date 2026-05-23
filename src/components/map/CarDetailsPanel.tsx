import {
  formatGarageServiceRemaining,
  formatGameTime,
} from '../../utils/format';
import {
  formatTaxiTitle,
  getTaxiStatusLabel,
} from '../../game/tripDisplay';
import { useGameStore } from '../../store/gameStore';

export function CarDetailsPanel() {
  const selectedTaxiId = useGameStore((s) => s.selectedTaxiId);
  const fleet = useGameStore((s) => s.fleet);
  const gameTimeMs = useGameStore((s) => s.gameTimeMs);
  const timeScaleMode = useGameStore((s) => s.timeScaleMode);
  const sendTaxiToGarage = useGameStore((s) => s.sendTaxiToGarage);

  const taxi = fleet.find((t) => t.id === selectedTaxiId);
  if (!taxi) return null;

  const statusLabel = getTaxiStatusLabel(taxi, gameTimeMs);
  const wearPercent = taxi.wearPercent ?? 0;
  const canSendToGarage =
    taxi.status === 'free' && !taxi.isBroken && !taxi.assignedOrderId;
  const inGarage = taxi.status === 'in_garage';

  return (
    <div className="car-details-panel">
      <h3 className="car-details-panel__title">{formatTaxiTitle(taxi)}</h3>
      <dl className="car-details-panel__list">
        <dt>Статус</dt>
        <dd>{statusLabel}</dd>
        <dt>Уровень вождения</dt>
        <dd>{taxi.driver.skillLevel}</dd>
        <dt>Усталость</dt>
        <dd>{Math.round(taxi.driver.fatigue)}%</dd>
        <dt>Износ</dt>
        <dd>{Math.round(wearPercent)}%</dd>
        {inGarage && taxi.garageUntilGameMs > gameTimeMs && (
          <>
            <dt>Выезд</dt>
            <dd>
              {formatGameTime(taxi.garageUntilGameMs)} (
              {formatGarageServiceRemaining(
                gameTimeMs,
                taxi.garageUntilGameMs,
                timeScaleMode,
              )}
              )
            </dd>
          </>
        )}
      </dl>
      {canSendToGarage && (
        <button
          type="button"
          className="btn btn--outline btn--block car-details-panel__action"
          onClick={() => sendTaxiToGarage(taxi.id)}
        >
          Отправить в гараж
        </button>
      )}
    </div>
  );
}
