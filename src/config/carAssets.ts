import businessImg from '../assets/busuiness.png';
import businessInfoImg from '../assets/busuiness_info.png';
import comfortImg from '../assets/comfort.png';
import comfortInfoImg from '../assets/comfort_info.png';
import comfortPlusImg from '../assets/comfort_plus.png';
import comfortPlusInfoImg from '../assets/comfort_plus_info.png';
import economImg from '../assets/econom.png';
import economInfoImg from '../assets/econom_info.png';
import premierImg from '../assets/premier.png';
import premierInfoImg from '../assets/premier_info.png';

export type CarClass =
  | 'econom'
  | 'comfort'
  | 'comfort_plus'
  | 'premier'
  | 'business';

export const CAR_CLASS_ORDER: CarClass[] = [
  'econom',
  'comfort',
  'comfort_plus',
  'business',
  'premier',
];

export const CAR_CLASS_LABELS: Record<CarClass, string> = {
  econom: 'Эконом',
  comfort: 'Комфорт',
  comfort_plus: 'Комфорт+',
  premier: 'Премьер',
  business: 'Бизнес',
};

export const CAR_CLASS_ASSETS: Record<CarClass, string> = {
  econom: economImg,
  comfort: comfortImg,
  comfort_plus: comfortPlusImg,
  premier: premierImg,
  business: businessImg,
};

export const CAR_INFO_ASSETS: Record<CarClass, string> = {
  econom: economInfoImg,
  comfort: comfortInfoImg,
  comfort_plus: comfortPlusInfoImg,
  premier: premierInfoImg,
  business: businessInfoImg,
};

export function getCarClassByIndex(index: number): CarClass {
  return CAR_CLASS_ORDER[index % CAR_CLASS_ORDER.length];
}

export function getCarClassRank(carClass: CarClass): number {
  return CAR_CLASS_ORDER.indexOf(carClass);
}

/** Машина может взять заказ, если её класс >= требуемого */
export function isCarClassAtLeast(
  taxiClass: CarClass,
  requiredClass: CarClass,
): boolean {
  return getCarClassRank(taxiClass) >= getCarClassRank(requiredClass);
}
