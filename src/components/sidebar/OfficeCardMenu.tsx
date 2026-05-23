import { useEffect, useRef, useState } from 'react';
import { getOfficeSellRefund } from '../../config/realEstateBalance';
import { useGameStore } from '../../store/gameStore';
import { formatMoney } from '../../utils/format';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { PromptDialog } from '../ui/PromptDialog';

type OfficeCardMenuProps = {
  officeId: string;
  onClose: () => void;
};

export function OfficeCardMenu({ officeId, onClose }: OfficeCardMenuProps) {
  const offices = useGameStore((s) => s.offices);
  const renameOffice = useGameStore((s) => s.renameOffice);
  const sellOffice = useGameStore((s) => s.sellOffice);

  const office = offices.find((o) => o.id === officeId);
  const menuRef = useRef<HTMLDivElement>(null);
  const [confirmSell, setConfirmSell] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);

  const refund = office ? getOfficeSellRefund(office.tier) : 0;

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
          onClick={() => setConfirmSell(true)}
        >
          Продать ({formatMoney(refund)})
        </button>
      </div>

      <PromptDialog
        open={renameOpen}
        title="Имя офиса"
        defaultValue={office?.name ?? ''}
        onConfirm={(name) => {
          renameOffice(officeId, name);
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
        message="Продать офис?"
        onConfirm={() => {
          sellOffice(officeId);
          setConfirmSell(false);
          onClose();
        }}
        onCancel={() => setConfirmSell(false)}
      />
    </>
  );
}
