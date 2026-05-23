import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { CarShopTab } from '../shop/CarShopTab';
import { OfficeStaffTab } from '../shop/OfficeStaffTab';
import { RealEstateTab } from '../shop/RealEstateTab';
import { GarageUpgradesTab } from '../shop/GarageUpgradesTab';
import { TaxiUpgradesTab } from '../shop/TaxiUpgradesTab';

type ShopSidebarProps = {
  mobile?: boolean;
  open?: boolean;
  onClose?: () => void;
};

export function ShopSidebar({
  mobile = false,
  open = true,
  onClose,
}: ShopSidebarProps) {
  const selectedTaxiId = useGameStore((s) => s.selectedTaxiId);
  const selectedOfficeId = useGameStore((s) => s.selectedOfficeId);
  const selectedGarageId = useGameStore((s) => s.selectedGarageId);

  const shellClass = [
    'shop-sidebar',
    mobile ? 'shop-sidebar--mobile' : '',
    mobile && open ? 'shop-sidebar--open' : '',
  ]
    .filter(Boolean)
    .join(' ');

  if (selectedTaxiId) {
    return (
      <aside className={shellClass} aria-hidden={mobile && !open}>
        <div className="shop-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected
            className="shop-tab shop-tab--active shop-tab--solo"
          >
            Улучшения
          </button>
          {onClose && (
            <button
              type="button"
              className="mobile-drawer__close"
              aria-label="Закрыть"
              onClick={onClose}
            >
              ×
            </button>
          )}
        </div>
        <div className="shop-sidebar__content">
          <TaxiUpgradesTab />
        </div>
      </aside>
    );
  }

  if (selectedOfficeId) {
    return (
      <aside className={shellClass} aria-hidden={mobile && !open}>
        <div className="shop-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected
            className="shop-tab shop-tab--active shop-tab--solo"
          >
            Сотрудники
          </button>
          {onClose && (
            <button
              type="button"
              className="mobile-drawer__close"
              aria-label="Закрыть"
              onClick={onClose}
            >
              ×
            </button>
          )}
        </div>
        <div className="shop-sidebar__content">
          <OfficeStaffTab />
        </div>
      </aside>
    );
  }

  if (selectedGarageId) {
    return (
      <aside className={shellClass} aria-hidden={mobile && !open}>
        <div className="shop-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected
            className="shop-tab shop-tab--active shop-tab--solo"
          >
            Улучшения
          </button>
          {onClose && (
            <button
              type="button"
              className="mobile-drawer__close"
              aria-label="Закрыть"
              onClick={onClose}
            >
              ×
            </button>
          )}
        </div>
        <div className="shop-sidebar__content">
          <GarageUpgradesTab />
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={shellClass}
      aria-hidden={mobile && !open}
      data-tutorial="shop-sidebar"
    >
      <ShopDefaultTabs onClose={onClose} />
    </aside>
  );
}

function ShopDefaultTabs({ onClose }: { onClose?: () => void }) {
  const [tab, setTab] = useState<'cars' | 'real_estate'>('cars');

  return (
    <>
      <div className="shop-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'cars'}
          className={`shop-tab${tab === 'cars' ? ' shop-tab--active' : ''}`}
          onClick={() => setTab('cars')}
        >
          Автосалон
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'real_estate'}
          className={`shop-tab${tab === 'real_estate' ? ' shop-tab--active' : ''}`}
          onClick={() => setTab('real_estate')}
        >
          Недвижимость
        </button>
        {onClose && (
          <button
            type="button"
            className="mobile-drawer__close"
            aria-label="Закрыть"
            onClick={onClose}
          >
            ×
          </button>
        )}
      </div>
      <div className="shop-sidebar__content">
        {tab === 'cars' ? <CarShopTab /> : <RealEstateTab />}
      </div>
    </>
  );
}
