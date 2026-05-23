import { CarDetailsPanel } from './CarDetailsPanel';
import { TaxiActiveOrderPanel } from './TaxiActiveOrderPanel';

export function MapPanelsStack() {
  return (
    <div className="map-panels-stack">
      <TaxiActiveOrderPanel />
      <CarDetailsPanel />
    </div>
  );
}
