import { REAL_ESTATE_BALANCE } from '../config/realEstateBalance';
import type { Office, OfficeTier } from '../types/game';

let officeCounter = 0;

export function createOffice(tier: OfficeTier, name: string): Office {
  officeCounter += 1;
  return {
    id: `office-${officeCounter}`,
    name,
    tier,
    staff: [],
  };
}

export function defaultOfficeName(tier: OfficeTier): string {
  return REAL_ESTATE_BALANCE.officeTierLabels[tier];
}
