import { useState } from 'react';
import type { Garage, TaxiUnit } from '../../types/game';
import { CarCard } from './CarCard';
import { GarageCard } from './GarageCard';

type GarageSectionProps = {
  garage: Garage;
  fleet: TaxiUnit[];
  selectedTaxiId: string | null;
};

export function GarageSection({
  garage,
  fleet,
  selectedTaxiId,
}: GarageSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const taxis = fleet.filter((t) => t.garageId === garage.id);

  return (
    <section className="fleet-garage-section">
      <GarageCard
        garage={garage}
        fleet={fleet}
        expanded={expanded}
        onToggleExpand={() => setExpanded((v) => !v)}
      />
      <div
        className={`fleet-garage-section__collapse${expanded ? ' fleet-garage-section__collapse--open' : ''}`}
      >
        <div className="fleet-garage-section__collapse-inner">
          {taxis.length === 0 ? (
            <p className="fleet-garage-section__empty">Нет машин</p>
          ) : (
            <div className="fleet-garage-section__cards">
              {taxis.map((taxi) => (
                <CarCard
                  key={taxi.id}
                  taxi={taxi}
                  selected={selectedTaxiId === taxi.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
