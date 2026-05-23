import { CAR_CLASS_LABELS } from '../config/carAssets';
import type { Order } from '../types/game';

export function getOrderClassLabel(order: Order): string {
  const parts: string[] = [];
  if (order.requiresChildSeat) parts.push('Детское кресло');
  if (order.requiresPetCarrier) parts.push('Перевозка животных');
  if (order.requiredClass !== null) {
    parts.push(CAR_CLASS_LABELS[order.requiredClass]);
  }
  if (parts.length === 0) return 'Любой класс';
  return parts.join(' · ');
}

export function getOrderRequirementHint(order: Order): string | null {
  const parts: string[] = [];
  if (order.requiresChildSeat) {
    parts.push('нужно детское кресло в машине');
  }
  if (order.requiresPetCarrier) {
    parts.push('нужна переноска для животных');
  }
  if (order.requiredClass !== null) {
    parts.push(`класс «${CAR_CLASS_LABELS[order.requiredClass]}»`);
  }
  if (parts.length === 0) return null;
  return parts.join(', ');
}
