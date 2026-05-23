import { useMapEvents } from 'react-leaflet';
import { useGameStore } from '../../store/gameStore';

/** Сброс выбранного заказа и такси при клике по карте (не по маркеру). */
export function MapClickHandler() {
  const selectOrder = useGameStore((s) => s.selectOrder);
  const selectTaxi = useGameStore((s) => s.selectTaxi);
  const selectOffice = useGameStore((s) => s.selectOffice);
  const selectGarage = useGameStore((s) => s.selectGarage);

  useMapEvents({
    click: () => {
      selectOrder(null);
      selectTaxi(null);
      selectOffice(null);
      selectGarage(null);
    },
  });

  return null;
}
