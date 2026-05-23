import { useState } from 'react';
import { getGarageAsset, getOfficeAsset } from '../../config/propertyAssets';
import {
  REAL_ESTATE_BALANCE,
  getGaragePrice,
  getOfficePrice,
} from '../../config/realEstateBalance';
import { canAddGarage } from '../../game/garage';
import { OFFICE_TIER_STAFF_HINTS } from '../../config/staffBalance';
import type { GarageTier, OfficeTier } from '../../types/game';
import { useGameStore } from '../../store/gameStore';
import { formatMoney } from '../../utils/format';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { ShopItemCard } from './ShopItemCard';

const GARAGE_TIERS: GarageTier[] = ['garage_5', 'garage_10', 'garage_15'];
const OFFICE_TIERS: OfficeTier[] = [
  'office_small',
  'office_medium',
  'office_large',
];

const BUY_CONFIRM_MESSAGE = 'Вы уверены, что хотите купить?';
const MAX_GARAGES_HINT =
  'Вы достигли максимального количества гаражей.';

export function RealEstateTab() {
  const money = useGameStore((s) => s.money);
  const garages = useGameStore((s) => s.garages);
  const buyGarage = useGameStore((s) => s.buyGarage);
  const buyOffice = useGameStore((s) => s.buyOffice);

  const canBuyGarage = canAddGarage(garages);
  const [pendingGarageTier, setPendingGarageTier] = useState<GarageTier | null>(
    null,
  );
  const [pendingOfficeTier, setPendingOfficeTier] = useState<OfficeTier | null>(
    null,
  );

  return (
    <>
      <div className="shop-sidebar__list real-estate-tab">
        <section className="real-estate-section">
          <h3 className="real-estate-section__title">Купить гараж</h3>
          {GARAGE_TIERS.map((tier) => {
            const price = getGaragePrice(tier);
            const upkeep = REAL_ESTATE_BALANCE.garageUpkeepPerDay[tier];
            const label = REAL_ESTATE_BALANCE.garageTierLabels[tier];
            const atMaxGarages = !canBuyGarage;
            const disabled = atMaxGarages || money < price;

            return (
              <ShopItemCard
                key={tier}
                iconSrc={getGarageAsset(tier)}
                title={label}
                subtitle={formatMoney(price)}
                stats={<span>Расходы {formatMoney(upkeep)}/день</span>}
                actionLabel="Купить"
                disabled={disabled}
                disabledHint={atMaxGarages ? MAX_GARAGES_HINT : undefined}
                titleHint="Плюс содержание машин: зарплата водителя и топливо зависят от класса."
                onAction={() => setPendingGarageTier(tier)}
              />
            );
          })}
        </section>

        <section className="real-estate-section">
          <h3 className="real-estate-section__title">Купить офис</h3>
          {OFFICE_TIERS.map((tier) => {
            const price = getOfficePrice(tier);
            const upkeep = REAL_ESTATE_BALANCE.officeUpkeepPerDay[tier];
            const label = REAL_ESTATE_BALANCE.officeTierLabels[tier];
            const disabled = money < price;

            return (
              <ShopItemCard
                key={tier}
                iconSrc={getOfficeAsset(tier)}
                title={label}
                subtitle={formatMoney(price)}
                stats={<span>Расходы {formatMoney(upkeep)}/день</span>}
                actionLabel="Купить"
                titleHint={OFFICE_TIER_STAFF_HINTS[tier]}
                disabled={disabled}
                onAction={() => setPendingOfficeTier(tier)}
              />
            );
          })}
        </section>
      </div>

      <ConfirmDialog
        open={pendingGarageTier !== null}
        message={BUY_CONFIRM_MESSAGE}
        onConfirm={() => {
          if (pendingGarageTier) buyGarage(pendingGarageTier);
          setPendingGarageTier(null);
        }}
        onCancel={() => setPendingGarageTier(null)}
      />

      <ConfirmDialog
        open={pendingOfficeTier !== null}
        message={BUY_CONFIRM_MESSAGE}
        onConfirm={() => {
          if (pendingOfficeTier) buyOffice(pendingOfficeTier);
          setPendingOfficeTier(null);
        }}
        onCancel={() => setPendingOfficeTier(null)}
      />
    </>
  );
}
