import { useEffect, useRef, useState } from 'react';
import {
  countTaxisInGarage,
  garageHasSpace,
  getGarageCapacity,
} from '../../game/garage';
import { useGameStore } from '../../store/gameStore';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { GaragePickerDialog } from '../ui/GaragePickerDialog';
import { PromptDialog } from '../ui/PromptDialog';

const FIRE_CONFIRM = 'Вы уверены, что хотите уволить водителя?';

type CarCardMenuProps = {
  taxiId: string;
  currentGarageId: string;
  onClose: () => void;
};

export function CarCardMenu({
  taxiId,
  currentGarageId,
  onClose,
}: CarCardMenuProps) {
  const fireTaxi = useGameStore((s) => s.fireTaxi);
  const renameTaxi = useGameStore((s) => s.renameTaxi);
  const moveTaxiToGarage = useGameStore((s) => s.moveTaxiToGarage);
  const garages = useGameStore((s) => s.garages);
  const fleet = useGameStore((s) => s.fleet);
  const taxi = fleet.find((t) => t.id === taxiId);

  const menuRef = useRef<HTMLDivElement>(null);
  const [confirmFire, setConfirmFire] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);

  const otherGarages = garages.filter((g) => g.id !== currentGarageId);
  const canMove =
    taxi &&
    otherGarages.length > 0 &&
    taxi.status !== 'to_pickup' &&
    taxi.status !== 'on_trip';

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (renameOpen || moveOpen || confirmFire) return;
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [onClose, renameOpen, moveOpen, confirmFire]);

  const moveOptions = otherGarages.map((g) => {
    const count = countTaxisInGarage(fleet, g.id);
    const capacity = getGarageCapacity(g.tier);
    return {
      garage: g,
      label: `${g.name} (${count}/${capacity})`,
      disabled: !garageHasSpace(g, fleet),
    };
  });

  return (
    <>
      <div ref={menuRef} className="car-card-menu" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="car-card-menu__item"
          onClick={() => setRenameOpen(true)}
        >
          Переименовать
        </button>
        {canMove && (
          <button
            type="button"
            className="car-card-menu__item"
            onClick={() => setMoveOpen(true)}
          >
            Перегнать в гараж
          </button>
        )}
        <button
          type="button"
          className="car-card-menu__item car-card-menu__item--danger"
          onClick={() => setConfirmFire(true)}
        >
          Уволить
        </button>
      </div>

      <PromptDialog
        open={renameOpen}
        title="Имя водителя"
        defaultValue=""
        onConfirm={(name) => {
          renameTaxi(taxiId, name);
          setRenameOpen(false);
          onClose();
        }}
        onCancel={() => {
          setRenameOpen(false);
          onClose();
        }}
      />

      <GaragePickerDialog
        open={moveOpen}
        options={moveOptions}
        onSelect={(garageId) => {
          moveTaxiToGarage(taxiId, garageId);
          setMoveOpen(false);
          onClose();
        }}
        onCancel={() => {
          setMoveOpen(false);
          onClose();
        }}
      />

      <ConfirmDialog
        open={confirmFire}
        message={FIRE_CONFIRM}
        onConfirm={() => {
          fireTaxi(taxiId);
          setConfirmFire(false);
          onClose();
        }}
        onCancel={() => setConfirmFire(false)}
      />
    </>
  );
}
