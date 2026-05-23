import { useGameStore } from '../../store/gameStore';
import { GarageSection } from './GarageSection';

export function FleetGaragesTab() {
  const garages = useGameStore((s) => s.garages);
  const fleet = useGameStore((s) => s.fleet);
  const selectedTaxiId = useGameStore((s) => s.selectedTaxiId);

  return (
    <div className="shop-sidebar__list">
      {garages.map((garage) => (
        <GarageSection
          key={garage.id}
          garage={garage}
          fleet={fleet}
          selectedTaxiId={selectedTaxiId}
        />
      ))}
    </div>
  );
}
