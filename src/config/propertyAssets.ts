import type { GarageTier, OfficeTier } from '../types/game';
import garage5Img from '../assets/garage_5_info.svg';
import garage10Img from '../assets/garage_10_info.svg';
import garage15Img from '../assets/garage_15_info.svg';
import officeSmallImg from '../assets/office_small_info.svg';
import officeMediumImg from '../assets/office_medium_info.svg';
import officeLargeImg from '../assets/office_large_info.svg';

export const GARAGE_ASSETS: Record<GarageTier, string> = {
  garage_5: garage5Img,
  garage_10: garage10Img,
  garage_15: garage15Img,
};

export const OFFICE_ASSETS: Record<OfficeTier, string> = {
  office_small: officeSmallImg,
  office_medium: officeMediumImg,
  office_large: officeLargeImg,
};

export function getGarageAsset(tier: GarageTier): string {
  return GARAGE_ASSETS[tier];
}

export function getOfficeAsset(tier: OfficeTier): string {
  return OFFICE_ASSETS[tier];
}
