import { useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { OrderPopup } from './OrderPopup';

export function OrderDetailsPanel() {
  const selectedOrderId = useGameStore((s) => s.selectedOrderId);
  const allOrders = useGameStore((s) => s.orders);
  const selectOrder = useGameStore((s) => s.selectOrder);
  const acceptOrder = useGameStore((s) => s.acceptOrder);
  const rejectOrder = useGameStore((s) => s.rejectOrder);

  const order = useMemo(
    () =>
      allOrders.find(
        (o) => o.id === selectedOrderId && o.status === 'pending',
      ),
    [allOrders, selectedOrderId],
  );

  if (!order) return null;

  return (
    <div className="order-details-panel">
      <button
        type="button"
        className="order-details-panel__close"
        aria-label="Закрыть"
        onClick={() => selectOrder(null)}
      >
        ×
      </button>
      <OrderPopup
        order={order}
        onAccept={() => void acceptOrder(order.id)}
        onReject={() => {
          rejectOrder(order.id);
          selectOrder(null);
        }}
      />
    </div>
  );
}
