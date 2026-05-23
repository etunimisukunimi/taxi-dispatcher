import { useState } from 'react';
import { CAR_INFO_ASSETS } from '../../config/carAssets';
import { GAME_BALANCE, getRepairCost } from '../../config/gameBalance';
import { getServiceCost } from '../../config/wearBalance';
import { getRepairCostMultiplierForGarage } from '../../game/garageStaff';
import { hasStaffRole } from '../../game/staff';
import {
  formatTaxiTitle,
  getCarPrimaryAction,
  getTaxiStatusLabel,
} from '../../game/tripDisplay';
import { useGameStore } from '../../store/gameStore';
import type { TaxiUnit } from '../../types/game';
import {
  formatGarageServiceRemaining,
  formatGameTime,
  formatMoney,
} from '../../utils/format';
import { ConfirmDialog } from '../ui/ConfirmDialog';

import { CarCardMenu } from './CarCardMenu';

const CANCEL_ORDER_MESSAGE =
  'Вы уверены, что хотите отменить заказ?';

type CarCardProps = {
  taxi: TaxiUnit;
  selected: boolean;
};

export function CarCard({ taxi, selected }: CarCardProps) {
  const selectTaxi = useGameStore((s) => s.selectTaxi);
  const repairTaxi = useGameStore((s) => s.repairTaxi);
  const serviceTaxi = useGameStore((s) => s.serviceTaxi);
  const garages = useGameStore((s) => s.garages);
  const sendTaxiToBreak = useGameStore((s) => s.sendTaxiToBreak);
  const sendTaxiToGarage = useGameStore((s) => s.sendTaxiToGarage);
  const endBreak = useGameStore((s) => s.endBreak);
  const forceTaxiFree = useGameStore((s) => s.forceTaxiFree);
  const money = useGameStore((s) => s.money);
  const gameTimeMs = useGameStore((s) => s.gameTimeMs);
  const timeScaleMode = useGameStore((s) => s.timeScaleMode);
  const offices = useGameStore((s) => s.offices);

  const [confirmFree, setConfirmFree] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const statusLabel = getTaxiStatusLabel(taxi, gameTimeMs);
  const primaryAction = getCarPrimaryAction(taxi);
  const title = formatTaxiTitle(taxi);

  const garage = garages.find((g) => g.id === taxi.garageId);
  const repairMult = garage
    ? getRepairCostMultiplierForGarage(garage)
    : 1;
  const repairCost = Math.round(getRepairCost(taxi.carClass) * repairMult);
  let serviceCost = getServiceCost(repairCost);
  if (garage?.upgrades?.tireService) {
    serviceCost = Math.round(serviceCost * 0.8);
  }
  const canRepair = taxi.isBroken && money >= repairCost;
  const canService =
    taxi.needsService && !taxi.isBroken && money >= serviceCost;
  const wearPercent = taxi.wearPercent ?? 0;

  const hasDispatcher = hasStaffRole(offices, 'dispatcher');
  const atZeroFatigueOnBreak =
    taxi.status === 'on_break' && taxi.driver.fatigue === 0;
  const canEndBreak =
    taxi.status === 'on_break' &&
    taxi.driver.fatigue <= GAME_BALANCE.fatigueEndBreakThreshold &&
    !(atZeroFatigueOnBreak && hasDispatcher);
  const canSendToGarage =
    taxi.status === 'free' && !taxi.isBroken && !taxi.assignedOrderId;
  const inGarage = taxi.status === 'in_garage';
  const garageRemaining =
    inGarage && taxi.garageUntilGameMs > gameTimeMs
      ? formatGarageServiceRemaining(
          gameTimeMs,
          taxi.garageUntilGameMs,
          timeScaleMode,
        )
      : null;
  const handlePrimaryClick = () => {
    switch (primaryAction.kind) {
      case 'free':
        if (primaryAction.needsConfirm) {
          setConfirmFree(true);
        } else {
          forceTaxiFree(taxi.id);
        }
        break;
      case 'break':
        sendTaxiToBreak(taxi.id);
        break;
      case 'endBreak':
        endBreak(taxi.id);
        break;
      default:
        break;
    }
  };

  const showPrimaryButton =
    primaryAction.kind !== 'none' || taxi.status === 'on_break';

  return (
    <>
      <article
        className={`car-card ${selected ? 'car-card--selected' : ''} ${taxi.isBroken || taxi.needsService ? 'car-card--broken' : ''}`}
        onClick={() => selectTaxi(taxi.id)}
      >
        <div className="car-card__head">
          <img
            src={CAR_INFO_ASSETS[taxi.carClass]}
            alt=""
            className="car-card__icon"
          />
          <div className="car-card__head-text">
            <div className="car-card__title">{title}</div>
            <div className="car-card__status">{statusLabel}</div>
          </div>
          <button
            type="button"
            className="car-card__menu-btn"
            aria-label="Настройки"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
          >
            ⋯
          </button>
          {menuOpen && (
            <CarCardMenu
              taxiId={taxi.id}
              currentGarageId={taxi.garageId}
              onClose={() => setMenuOpen(false)}
            />
          )}
        </div>

        <div className="car-card__stats">
          <span>Уровень {taxi.driver.skillLevel}</span>
          <span>Усталость {Math.round(taxi.driver.fatigue)}%</span>
          <span>Износ {Math.round(wearPercent)}%</span>
        </div>
        {inGarage && (
          <p className="car-card__hint">
            Обслуживание в гараже
            {taxi.garageUntilGameMs > 0
              ? ` · выезд в ${formatGameTime(taxi.garageUntilGameMs)}`
              : ''}
            {garageRemaining ? ` · осталось ${garageRemaining}` : ''}
          </p>
        )}
        {taxi.status === 'on_break' && !canEndBreak && (
          <p className="car-card__hint">
            {atZeroFatigueOnBreak
              ? 'Отдохнул — ждёт диспетчера'
              : `Отдыхает… ${Math.round(taxi.driver.fatigue)}%`}
          </p>
        )}
        {taxi.needsService && !taxi.isBroken && (
          <p className="car-card__hint car-card__hint--broken">
            Требуется техобслуживание
          </p>
        )}
        {taxi.isBroken && (
          <p className="car-card__hint car-card__hint--broken">
            Требуется ремонт
          </p>
        )}
        <div className="car-card__fatigue">
          <div
            className="car-card__fatigue-fill"
            style={{ width: `${taxi.driver.fatigue}%` }}
          />
        </div>
        <div className="car-card__fatigue car-card__wear">
          <div
            className="car-card__wear-fill"
            style={{ width: `${wearPercent}%` }}
          />
        </div>

        {!inGarage && (
          <div className="car-card__actions" onClick={(e) => e.stopPropagation()}>
            {showPrimaryButton &&
              (primaryAction.kind === 'endBreak' ? (
                <button
                  type="button"
                  className="btn btn--accent btn--block car-card__primary-btn"
                  disabled={!canEndBreak}
                  onClick={handlePrimaryClick}
                >
                  {primaryAction.label || 'Вернуть в строй'}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn--outline"
                  disabled={primaryAction.kind === 'none'}
                  onClick={handlePrimaryClick}
                >
                  {primaryAction.label || 'Вернуть в строй'}
                </button>
              ))}
            {canSendToGarage && (
              <button
                type="button"
                className={`btn btn--outline${taxi.needsService ? ' btn--accent' : ''}`}
                onClick={() => sendTaxiToGarage(taxi.id)}
              >
                Отправить в гараж
              </button>
            )}
          </div>
        )}

        {taxi.needsService && !taxi.isBroken && (
          <div
            className="car-card__upgrade"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="btn btn--accent btn--block"
              disabled={!canService}
              onClick={() => serviceTaxi(taxi.id)}
            >
              Техобслуживание ({formatMoney(serviceCost)})
            </button>
          </div>
        )}
        {taxi.isBroken && (
          <div
            className="car-card__upgrade"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="btn btn--accent btn--block"
              disabled={!canRepair}
              onClick={() => repairTaxi(taxi.id)}
            >
              Починить ({formatMoney(repairCost)})
            </button>
          </div>
        )}
      </article>

      <ConfirmDialog
        open={confirmFree}
        message={CANCEL_ORDER_MESSAGE}
        onConfirm={() => {
          forceTaxiFree(taxi.id);
          setConfirmFree(false);
        }}
        onCancel={() => setConfirmFree(false)}
      />
    </>
  );
}
