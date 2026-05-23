import type { CarClass } from '../config/carAssets';

export type LatLng = {
  lat: number;
  lng: number;
};

export type TaxiStatus =
  | 'free'
  | 'to_pickup'
  | 'on_trip'
  | 'on_break'
  | 'routing'
  | 'in_garage';

export type TripPhase = 'to_pickup' | 'with_passenger' | null;

export type OrderStatus = 'pending' | 'assigned' | 'completed';

export type Driver = {
  skillLevel: number;
  fatigue: number;
};

export type IdleLeg = 'stand' | 'drive' | null;

export type GarageTier = 'garage_5' | 'garage_10' | 'garage_15';
export type OfficeTier = 'office_small' | 'office_medium' | 'office_large';

export type GarageUpgradeKind = 'carWash' | 'tireService';

export type GarageUpgrades = {
  carWash: boolean;
  tireService: boolean;
};

export type GarageMechanic = {
  id: string;
  level: number;
};

export type Garage = {
  id: string;
  name: string;
  tier: GarageTier;
  upgrades: GarageUpgrades;
  mechanic: GarageMechanic | null;
};

export type OfficeStaffRole = 'dispatcher' | 'pr_manager';

/** @deprecated Используйте OfficeStaffRole для офиса */
export type StaffRole = OfficeStaffRole;

export type OfficeStaffMember = {
  id: string;
  role: OfficeStaffRole;
  level: number;
};

export type Office = {
  id: string;
  name: string;
  tier: OfficeTier;
  staff: OfficeStaffMember[];
};

export type TaxiUpgrades = {
  childSeat: boolean;
  petCarrier: boolean;
  lpg: boolean;
  branding: boolean;
};

export type TaxiUnit = {
  id: string;
  garageId: string;
  carClass: CarClass;
  driver: Driver;
  status: TaxiStatus;
  tripPhase: TripPhase;
  position: LatLng;
  bearingDeg: number;
  assignedOrderId: string | null;
  routePoints: LatLng[];
  routeFrom: LatLng;
  routeTo: LatLng;
  distanceM: number;
  progressM: number;
  pickupPoint: LatLng | null;
  dropoffPoint: LatLng | null;
  idleUntilGameMs: number;
  /** Игровое время (мс), когда машина выедет из гаража после обслуживания */
  garageUntilGameMs: number;
  idleLeg: IdleLeg;
  isBroken: boolean;
  needsService: boolean;
  wearPercent: number;
  pickupLegDistanceM: number;
  driverName: string;
  upgrades: TaxiUpgrades;
  /** false до успешной привязки к дороге (ensureFleetOnRoad) */
  positionReady: boolean;
};

export type Order = {
  id: string;
  from: LatLng;
  to: LatLng;
  fromLabel: string;
  toLabel: string;
  /** null = любой класс; иначе только указанный */
  requiredClass: CarClass | null;
  requiresChildSeat: boolean;
  requiresPetCarrier: boolean;
  fare: number;
  distanceM: number;
  tripDurationGameSec: number;
  createdAt: number;
  expiresAt: number;
  status: OrderStatus;
  districtId: string;
  /** Множитель к тарифу (премиум-заказы) */
  fareMultiplier: number;
};

export type RouteResult = {
  points: LatLng[];
  distanceM: number;
  from: LatLng;
  to: LatLng;
};

/** IRL = 1:1 с реальным временем; 1/2/4 = ускорение tycoon */
export type TimeScaleMode = 'irl' | 1 | 5 | 10;

/** null — обучение завершено или пропущено */
export type TutorialPhase = 'intro' | 'tour' | null;

export type FinanceEntryKind =
  | 'trip_income'
  | 'car_purchase'
  | 'driver_upgrade'
  | 'repair'
  | 'service'
  | 'daily_expense'
  | 'garage_purchase'
  | 'garage_sale'
  | 'garage_upgrade'
  | 'office_purchase'
  | 'office_sale'
  | 'taxi_upgrade'
  | 'staff_hire'
  | 'staff_upgrade';

export type Weather = 'clear' | 'rain' | 'snow';

export type GameEventId = 'concert' | 'road_work' | 'weekend_promo';

export type GameEvent = {
  id: GameEventId;
  label: string;
  endsAtGameMs: number;
  districtId?: string;
  spawnMult?: number;
  ratingBonusPerTrip?: number;
  maxRouteM?: number;
};

export type FinanceEntry = {
  id: string;
  gameDayIndex: number;
  gameTimeMs: number;
  amount: number;
  kind: FinanceEntryKind;
  label: string;
};

export type FinanceDayLine = {
  label: string;
  amount: number;
};

export type FinanceDayGroup = {
  gameDayIndex: number;
  lines: FinanceDayLine[];
  total: number;
};

export type TripToast = {
  id: string;
  taxiId: string;
  text: string;
  position: LatLng;
  expiresAtMs: number;
};

export const TAXI_STATUS_LABELS: Record<TaxiStatus, string> = {
  free: 'Свободен',
  to_pickup: 'Едет на заказ',
  on_trip: 'Едет по заказу',
  on_break: 'На обеде',
  routing: 'Маршрут…',
  in_garage: 'В гараже',
};
