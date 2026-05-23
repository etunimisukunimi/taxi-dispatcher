type MobileDrawerControlsProps = {
  fleetOpen: boolean;
  shopOpen: boolean;
  onToggleFleet: () => void;
  onToggleShop: () => void;
};

function MenuIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M2.5 4.5h13M2.5 9h13M2.5 13.5h13"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ShopIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M3.5 6.5 4.8 3.5h8.4l1.3 3M4.5 6.5h9"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 6.5v7.5a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V6.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MobileDrawerControls({
  fleetOpen,
  shopOpen,
  onToggleFleet,
  onToggleShop,
}: MobileDrawerControlsProps) {
  return (
    <div className="mobile-drawer-controls">
      <button
        type="button"
        className={`mobile-drawer-toggle${fleetOpen ? ' mobile-drawer-toggle--active' : ''}`}
        aria-label={fleetOpen ? 'Закрыть автопарк' : 'Открыть автопарк'}
        aria-expanded={fleetOpen}
        onClick={onToggleFleet}
      >
        <span className="mobile-drawer-toggle__icon">
          <MenuIcon />
        </span>
        <span className="mobile-drawer-toggle__label">Автопарк</span>
      </button>
      <button
        type="button"
        className={`mobile-drawer-toggle${shopOpen ? ' mobile-drawer-toggle--active' : ''}`}
        aria-label={shopOpen ? 'Закрыть магазин' : 'Открыть магазин'}
        aria-expanded={shopOpen}
        onClick={onToggleShop}
      >
        <span className="mobile-drawer-toggle__icon">
          <ShopIcon />
        </span>
        <span className="mobile-drawer-toggle__label">Магазин</span>
      </button>
    </div>
  );
}
