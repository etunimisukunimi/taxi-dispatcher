import { useState } from 'react';
import { getCity, listCities, type CityId } from '../../config/cities';
import { useGameStore } from '../../store/gameStore';
import { ZonePlacementMap } from './ZonePlacementMap';

type SetupPhase = 'select' | 'custom';

export function CitySetupScreen() {
  const completeSessionSetup = useGameStore((s) => s.completeSessionSetup);
  const cities = listCities();
  const [cityId, setCityId] = useState<CityId>('kazan');
  const [phase, setPhase] = useState<SetupPhase>('select');

  if (phase === 'custom') {
    const city = getCity(cityId);
    return (
      <div className="city-setup city-setup--placement">
        <header className="city-setup__header">
          <h1 className="city-setup__title">Произвольное место</h1>
          <p className="city-setup__subtitle">
            Перетащите маркер, чтобы сместить игровую зону. После подтверждения
            границы нельзя изменить.
          </p>
        </header>
        <ZonePlacementMap
          initialCenter={city.center}
          onBack={() => setPhase('select')}
          onConfirm={(bounds) => completeSessionSetup(cityId, bounds)}
        />
      </div>
    );
  }

  return (
    <div className="city-setup">
      <div className="city-setup__card">
        <h1 className="city-setup__title">Таксопарк</h1>
        <p className="city-setup__subtitle">Выберите город для игры</p>

        <label className="city-setup__field">
          <span className="city-setup__label">Город</span>
          <select
            className="city-setup__select"
            value={cityId}
            onChange={(e) => setCityId(e.target.value as CityId)}
          >
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className="btn btn--accent city-setup__primary"
          onClick={() => completeSessionSetup(cityId, null)}
        >
          Начать игру
        </button>

        <button
          type="button"
          className="btn btn--ghost city-setup__secondary"
          onClick={() => setPhase('custom')}
        >
          Произвольное место
        </button>
      </div>
    </div>
  );
}
