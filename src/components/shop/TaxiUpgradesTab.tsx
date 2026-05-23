import { CAR_INFO_ASSETS } from '../../config/carAssets';
import { GAME_BALANCE, getUpgradeCost } from '../../config/gameBalance';
import { UPGRADE_ASSETS } from '../../config/upgradeAssets';
import {
  getBrandingPrice,
  getChildSeatPrice,
  getLpgPrice,
  getPetCarrierPrice,
} from '../../config/taxiUpgradesBalance';
import { canUpgradeDriver } from '../../game/fatigue';
import { formatTaxiTitle } from '../../game/tripDisplay';
import { useGameStore } from '../../store/gameStore';
import { formatMoney } from '../../utils/format';
import { TooltipHint } from '../ui/TooltipHint';

const CHILD_SEAT_HINT =
  'Позволяет принимать заказы с детским креслом. Такие заявки встречаются реже, но оплачиваются выше.';
const PET_CARRIER_HINT =
  'Позволяет перевозить животных. Такие заявки встречаются реже обычных.';
const LPG_HINT =
  'Снижает расход топлива на 40% (только для класса Эконом).';
const BRANDING_HINT =
  'Реклама на кузове — +10% к оплате поездок этой машины.';
const DRIVING_COURSES_DESC =
  'Водитель медленнее устаёт и быстрее ориентируется в городе — поездки занимают меньше времени.';

export function TaxiUpgradesTab() {
  const selectedTaxiId = useGameStore((s) => s.selectedTaxiId);
  const fleet = useGameStore((s) => s.fleet);
  const money = useGameStore((s) => s.money);
  const buyTaxiUpgrade = useGameStore((s) => s.buyTaxiUpgrade);
  const upgradeDriver = useGameStore((s) => s.upgradeDriver);

  const taxi = fleet.find((t) => t.id === selectedTaxiId);
  if (!taxi) {
    return (
      <p className="shop-sidebar__hint shop-sidebar__list">
        Выберите машину на карте или в списке слева.
      </p>
    );
  }

  const upgrades = taxi.upgrades ?? {
    childSeat: false,
    petCarrier: false,
    lpg: false,
    branding: false,
  };
  const childPrice = getChildSeatPrice();
  const petPrice = getPetCarrierPrice();
  const lpgPrice = getLpgPrice();
  const brandingPrice = getBrandingPrice();
  const hasChild = upgrades.childSeat;
  const hasPet = upgrades.petCarrier;
  const hasLpg = upgrades.lpg;
  const hasBranding = upgrades.branding;
  const isEconom = taxi.carClass === 'econom';

  const childMoneyHint =
    !hasChild && money < childPrice
      ? `Недостаточно средств (${formatMoney(childPrice)})`
      : undefined;

  const petMoneyHint =
    !hasPet && money < petPrice
      ? `Недостаточно средств (${formatMoney(petPrice)})`
      : undefined;

  const upgradeCost = getUpgradeCost(taxi.driver.skillLevel);
  const atMaxLevel = !canUpgradeDriver(taxi.driver.skillLevel);
  const canPayCourses =
    !taxi.isBroken && !atMaxLevel && money >= upgradeCost;
  const coursesDisabledTitle = atMaxLevel
    ? undefined
    : taxi.isBroken
      ? 'Сначала нужно отремонтировать машину'
      : money < upgradeCost
        ? `Недостаточно средств (${formatMoney(upgradeCost)})`
        : undefined;

  return (
    <div className="shop-sidebar__list">
      <p className="shop-sidebar__hint">{formatTaxiTitle(taxi)}</p>

      <article className="car-card car-card--shop">
        <div className="car-card__head">
          <img
            src={UPGRADE_ASSETS.childSeat}
            alt=""
            className="car-card__icon"
          />
          <div className="car-card__head-text">
            <div className="car-card__title car-card__title--with-hint">
              Детское кресло
              <TooltipHint
                text={CHILD_SEAT_HINT}
                variant="surface"
                className="tooltip-hint--inline tooltip-hint--compact"
              />
            </div>
            <div className="car-card__status">
              {hasChild ? 'Установлено' : 'Не установлено'}
            </div>
          </div>
        </div>
        {!hasChild ? (
          <div
            className={
              childMoneyHint
                ? 'car-card__actions car-card__actions--with-hint'
                : 'car-card__actions'
            }
          >
            <button
              type="button"
              className="btn btn--accent btn--block shop-item-card__action-btn"
              disabled={money < childPrice}
              title={childMoneyHint}
              onClick={() => buyTaxiUpgrade(taxi.id, 'childSeat')}
            >
              {`Купить · ${formatMoney(childPrice)}`}
            </button>
            {childMoneyHint ? (
              <TooltipHint
                text={childMoneyHint}
                variant="accent"
                className="tooltip-hint--inline tooltip-hint--compact shop-item-card__action-hint"
              />
            ) : null}
          </div>
        ) : null}
      </article>

      <article className="car-card car-card--shop">
        <div className="car-card__head">
          <img
            src={UPGRADE_ASSETS.petCarrier}
            alt=""
            className="car-card__icon"
          />
          <div className="car-card__head-text">
            <div className="car-card__title car-card__title--with-hint">
              <span className="car-card__title-text">Переноска для животных</span>
              <TooltipHint
                text={PET_CARRIER_HINT}
                variant="surface"
                className="tooltip-hint--inline tooltip-hint--compact"
              />
            </div>
            <div className="car-card__status">
              {hasPet ? 'Установлено' : 'Не установлено'}
            </div>
          </div>
        </div>
        {!hasPet ? (
          <div
            className={
              petMoneyHint
                ? 'car-card__actions car-card__actions--with-hint'
                : 'car-card__actions'
            }
          >
            <button
              type="button"
              className="btn btn--accent btn--block shop-item-card__action-btn"
              disabled={money < petPrice}
              title={petMoneyHint}
              onClick={() => buyTaxiUpgrade(taxi.id, 'petCarrier')}
            >
              {`Купить · ${formatMoney(petPrice)}`}
            </button>
            {petMoneyHint ? (
              <TooltipHint
                text={petMoneyHint}
                variant="accent"
                className="tooltip-hint--inline tooltip-hint--compact shop-item-card__action-hint"
              />
            ) : null}
          </div>
        ) : null}
      </article>

      {isEconom && (
        <article className="car-card car-card--shop">
          <div className="car-card__head">
            <img
              src={CAR_INFO_ASSETS.econom}
              alt=""
              className="car-card__icon"
            />
            <div className="car-card__head-text">
              <div className="car-card__title car-card__title--with-hint">
                ГБО
                <TooltipHint
                  text={LPG_HINT}
                  variant="surface"
                  className="tooltip-hint--inline tooltip-hint--compact"
                />
              </div>
              <div className="car-card__status">
                {hasLpg ? 'Установлено' : 'Не установлено'}
              </div>
            </div>
          </div>
          {!hasLpg && (
            <div className="car-card__actions">
              <button
                type="button"
                className="btn btn--accent btn--block"
                disabled={money < lpgPrice}
                onClick={() => buyTaxiUpgrade(taxi.id, 'lpg')}
              >
                {`Купить · ${formatMoney(lpgPrice)}`}
              </button>
            </div>
          )}
        </article>
      )}

      <article className="car-card car-card--shop">
        <div className="car-card__head">
          <img
            src={CAR_INFO_ASSETS[taxi.carClass]}
            alt=""
            className="car-card__icon"
          />
          <div className="car-card__head-text">
            <div className="car-card__title car-card__title--with-hint">
              Брендинг
              <TooltipHint
                text={BRANDING_HINT}
                variant="surface"
                className="tooltip-hint--inline tooltip-hint--compact"
              />
            </div>
            <div className="car-card__status">
              {hasBranding ? 'Установлено' : 'Не установлено'}
            </div>
          </div>
        </div>
        {!hasBranding && (
          <div className="car-card__actions">
            <button
              type="button"
              className="btn btn--accent btn--block"
              disabled={money < brandingPrice}
              onClick={() => buyTaxiUpgrade(taxi.id, 'branding')}
            >
              {`Купить · ${formatMoney(brandingPrice)}`}
            </button>
          </div>
        )}
      </article>

      <article className="car-card car-card--shop">
        <div className="car-card__head">
          <img
            src={CAR_INFO_ASSETS[taxi.carClass]}
            alt=""
            className="car-card__icon"
          />
          <div className="car-card__head-text">
            <div className="car-card__title">Курсы вождения</div>
            <div className="car-card__status">
              {atMaxLevel
                ? `Максимальный уровень (${GAME_BALANCE.maxSkillLevel})`
                : `Уровень ${taxi.driver.skillLevel}`}
            </div>
          </div>
        </div>
        <p className="shop-card__meta">{DRIVING_COURSES_DESC}</p>
        <div className="car-card__actions">
          <button
            type="button"
            className="btn btn--accent btn--block"
            disabled={atMaxLevel || !canPayCourses}
            title={coursesDisabledTitle}
            onClick={() => upgradeDriver(taxi.id)}
          >
            {atMaxLevel
              ? 'Максимальный уровень'
              : `Оплатить курсы вождения · ${formatMoney(upgradeCost)}`}
          </button>
        </div>
      </article>
    </div>
  );
}
