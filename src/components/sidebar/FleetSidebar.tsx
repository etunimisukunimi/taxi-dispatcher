import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { FleetGaragesTab } from './FleetGaragesTab';
import { FleetOfficesTab } from './FleetOfficesTab';

type FleetTab = 'garages' | 'offices';

type FleetSidebarProps = {
  mobile?: boolean;
  open?: boolean;
  onClose?: () => void;
};

export function FleetSidebar({
  mobile = false,
  open = true,
  onClose,
}: FleetSidebarProps) {
  const [tab, setTab] = useState<FleetTab>('garages');
  const selectedOfficeId = useGameStore((s) => s.selectedOfficeId);
  const selectedGarageId = useGameStore((s) => s.selectedGarageId);

  useEffect(() => {
    if (selectedOfficeId) setTab('offices');
  }, [selectedOfficeId]);

  useEffect(() => {
    if (selectedGarageId) setTab('garages');
  }, [selectedGarageId]);

  const className = [
    'fleet-sidebar',
    mobile ? 'fleet-sidebar--mobile' : '',
    mobile && open ? 'fleet-sidebar--open' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <aside
      className={className}
      aria-hidden={mobile && !open}
      data-tutorial="fleet-sidebar"
    >
      <div className="shop-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'garages'}
          className={`shop-tab${tab === 'garages' ? ' shop-tab--active' : ''}`}
          onClick={() => setTab('garages')}
        >
          Автопарки
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'offices'}
          className={`shop-tab${tab === 'offices' ? ' shop-tab--active' : ''}`}
          onClick={() => setTab('offices')}
        >
          Офисы
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
      <div className="fleet-sidebar__content">
        {tab === 'garages' ? <FleetGaragesTab /> : <FleetOfficesTab />}
      </div>
    </aside>
  );
}
