import { useGameStore } from '../../store/gameStore';
import { OfficeCard } from './OfficeCard';

export function FleetOfficesTab() {
  const offices = useGameStore((s) => s.offices);

  return (
    <div className="shop-sidebar__list">
      {offices.length === 0 ? (
        <p className="fleet-tab-empty">Нет офисов</p>
      ) : (
        offices.map((office) => <OfficeCard key={office.id} office={office} />)
      )}
    </div>
  );
}
