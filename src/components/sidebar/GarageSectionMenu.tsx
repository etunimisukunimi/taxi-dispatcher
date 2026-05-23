import { useEffect, useRef, useState } from 'react';
import { getGarageSellRefund } from '../../config/realEstateBalance';
import { useGameStore } from '../../store/gameStore';
import { formatMoney } from '../../utils/format';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { PromptDialog } from '../ui/PromptDialog';

const SELL_GARAGE_CONFIRM =
  'При продаже гаража все машины в нём будут удалены. Продолжить?';

type GarageSectionMenuProps = {
  garageId: string;
  onClose: () => void;
};

export function GarageSectionMenu({ garageId, onClose }: GarageSectionMenuProps) {
  const garages = useGameStore((s) => s.garages);
  const renameGarage = useGameStore((s) => s.renameGarage);
  const sellGarage = useGameStore((s) => s.sellGarage);

  const garage = garages.find((g) => g.id === garageId);
  const menuRef = useRef<HTMLDivElement>(null);
  const [confirmSell, setConfirmSell] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);

  const canSell = garages.length > 1;
  const refund = garage ? getGarageSellRefund(garage.tier) : 0;

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (renameOpen || confirmSell) return;
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [onClose, renameOpen, confirmSell]);

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
        <button
          type="button"
          className="car-card-menu__item car-card-menu__item--danger"
          disabled={!canSell}
          title={!canSell ? 'Нельзя продать последний гараж' : undefined}
          onClick={() => canSell && setConfirmSell(true)}
        >
          Продать ({formatMoney(refund)})
        </button>
      </div>

      <PromptDialog
        open={renameOpen}
        title="Имя гаража"
        defaultValue={garage?.name ?? ''}
        onConfirm={(name) => {
          renameGarage(garageId, name);
          setRenameOpen(false);
          onClose();
        }}
        onCancel={() => {
          setRenameOpen(false);
          onClose();
        }}
      />

      <ConfirmDialog
        open={confirmSell}
        message={SELL_GARAGE_CONFIRM}
        onConfirm={() => {
          sellGarage(garageId);
          setConfirmSell(false);
          onClose();
        }}
        onCancel={() => setConfirmSell(false)}
      />
    </>
  );
}
