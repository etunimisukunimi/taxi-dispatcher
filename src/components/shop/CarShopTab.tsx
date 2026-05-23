import { useMemo, useState } from 'react';
import {
  CAR_CLASS_LABELS,
  CAR_CLASS_ORDER,
  CAR_INFO_ASSETS,
  type CarClass,
} from '../../config/carAssets';
import { getCarPrice } from '../../config/gameBalance';
import {
  countTaxisInGarage,
  garagesWithSpace,
  getGarageCapacity,
} from '../../game/garage';
import { useGameStore } from '../../store/gameStore';
import { formatMoney } from '../../utils/format';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { ShopItemCard } from './ShopItemCard';

const BUY_CONFIRM_MESSAGE = 'Вы уверены, что хотите приобрести?';

export function CarShopTab() {
  const money = useGameStore((s) => s.money);
  const garages = useGameStore((s) => s.garages);
  const fleet = useGameStore((s) => s.fleet);
  const buyCar = useGameStore((s) => s.buyCar);

  const availableGarages = useMemo(
    () => garagesWithSpace(garages, fleet),
    [garages, fleet],
  );

  const [selectedGarageId, setSelectedGarageId] = useState<string | null>(null);
  const garageId =
    selectedGarageId && availableGarages.some((g) => g.id === selectedGarageId)
      ? selectedGarageId
      : (availableGarages[0]?.id ?? null);

  const [pendingClass, setPendingClass] = useState<CarClass | null>(null);
  const hasSpace = availableGarages.length > 0;

  return (
    <>
      <div className="shop-sidebar__list">
        {hasSpace && availableGarages.length > 1 && (
          <label className="shop-garage-select">
            <span className="shop-garage-select__label">Купить в:</span>
            <select
              className="shop-garage-select__input"
              value={garageId ?? ''}
              onChange={(e) => setSelectedGarageId(e.target.value)}
            >
              {availableGarages.map((g) => {
                const count = countTaxisInGarage(fleet, g.id);
                const cap = getGarageCapacity(g.tier);
                return (
                  <option key={g.id} value={g.id}>
                    {g.name} ({count}/{cap})
                  </option>
                );
              })}
            </select>
          </label>
        )}

        {!hasSpace && (
          <p className="shop-sidebar__hint">Нет свободных мест в гаражах</p>
        )}

        {CAR_CLASS_ORDER.map((carClass) => {
          const price = getCarPrice(carClass);
          const canBuy = hasSpace && garageId && money >= price;
          return (
            <ShopItemCard
              key={carClass}
              iconSrc={CAR_INFO_ASSETS[carClass]}
              title={CAR_CLASS_LABELS[carClass]}
              subtitle={formatMoney(price)}
              actionLabel="Купить"
              disabled={!canBuy}
              onAction={() => setPendingClass(carClass)}
            />
          );
        })}
      </div>

      <ConfirmDialog
        open={pendingClass !== null}
        message={BUY_CONFIRM_MESSAGE}
        onConfirm={() => {
          if (pendingClass && garageId) {
            void buyCar(pendingClass, garageId);
          }
          setPendingClass(null);
        }}
        onCancel={() => setPendingClass(null)}
      />
    </>
  );
}
