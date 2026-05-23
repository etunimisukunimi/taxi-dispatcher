import { useEffect, useState } from 'react';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useOrderSpawner } from '../../hooks/useOrderSpawner';
import { useSimulation } from '../../hooks/useSimulation';
import { useStaffAutomation } from '../../hooks/useStaffAutomation';
import { useGameStore } from '../../store/gameStore';
import { GameHud } from '../hud/GameHud';
import { MapPanelsStack } from '../map/MapPanelsStack';
import { OrderDetailsPanel } from '../map/OrderDetailsPanel';
import { GameMap } from '../GameMap';
import { FleetSidebar } from '../sidebar/FleetSidebar';
import { ShopSidebar } from '../sidebar/ShopSidebar';
import { MobileDrawerControls } from './MobileDrawerControls';
import { GameTutorial } from '../tutorial/GameTutorial';

const MOBILE_LAYOUT_QUERY = '(max-width: 768px)';

export function GameLayout() {
  useSimulation();
  useOrderSpawner();
  useStaffAutomation();

  const isMobile = useMediaQuery(MOBILE_LAYOUT_QUERY);
  const selectedTaxiId = useGameStore((s) => s.selectedTaxiId);
  const selectedOfficeId = useGameStore((s) => s.selectedOfficeId);
  const selectedGarageId = useGameStore((s) => s.selectedGarageId);
  const [fleetOpen, setFleetOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);

  useEffect(() => {
    void useGameStore.getState().ensureFleetOnRoad();
    const interval = window.setInterval(() => {
      useGameStore.getState().pruneTripToasts();
    }, 400);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setFleetOpen(false);
      setShopOpen(false);
      return;
    }
    if (selectedTaxiId || selectedOfficeId || selectedGarageId) {
      setFleetOpen(true);
      setShopOpen(true);
    } else {
      setFleetOpen(false);
      setShopOpen(false);
    }
  }, [isMobile, selectedTaxiId, selectedOfficeId, selectedGarageId]);

  const closeDrawers = () => {
    setFleetOpen(false);
    setShopOpen(false);
  };

  const layoutClass = [
    'game-layout',
    isMobile ? 'game-layout--mobile' : '',
    isMobile && fleetOpen ? 'game-layout--fleet-open' : '',
    isMobile && shopOpen ? 'game-layout--shop-open' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={layoutClass}>
      <GameHud />
      <div className="game-layout__body">
        {isMobile && (fleetOpen || shopOpen) && (
          <button
            type="button"
            className="mobile-drawer-backdrop"
            aria-label="Закрыть меню"
            onClick={closeDrawers}
          />
        )}
        {isMobile && (
          <MobileDrawerControls
            fleetOpen={fleetOpen}
            shopOpen={shopOpen}
            onToggleFleet={() => setFleetOpen((v) => !v)}
            onToggleShop={() => setShopOpen((v) => !v)}
          />
        )}
        <FleetSidebar
          mobile={isMobile}
          open={!isMobile || fleetOpen}
          onClose={isMobile ? () => setFleetOpen(false) : undefined}
        />
        <div className="game-layout__map" data-tutorial="map">
          <GameMap />
          <OrderDetailsPanel />
          <MapPanelsStack />
        </div>
        <ShopSidebar
          mobile={isMobile}
          open={!isMobile || shopOpen}
          onClose={isMobile ? () => setShopOpen(false) : undefined}
        />
      </div>
      <GameTutorial
        isMobile={isMobile}
        onMobileFleetOpen={setFleetOpen}
        onMobileShopOpen={setShopOpen}
      />
    </div>
  );
}
