import { create } from 'zustand';
import type { CityBounds, CityId } from '../config/cities';
import { getPlayBounds } from '../config/gameBounds';
import { clearSession } from '../config/sessionStorage';
import {
  GAME_BALANCE,
  getCarPrice,
  getRepairCost,
  getUpgradeCost,
} from '../config/gameBalance';
import {
  getBrandingPrice,
  getChildSeatPrice,
  getLpgPrice,
  getPetCarrierPrice,
  getTaxiFareMultiplier,
} from '../config/taxiUpgradesBalance';
import {
  GARAGE_UPGRADE_LABELS,
  getGarageUpgradePrice,
} from '../config/garageUpgradesBalance';
import {
  RATING_BALANCE,
  getRatingSpawnIntervalMultiplier,
} from '../config/ratingBalance';
import {
  WEAR_BALANCE,
  getBreakdownWearMultiplier,
  getServiceCost,
} from '../config/wearBalance';
import {
  getStaffHireCost,
  getStaffUpgradeCost,
  STAFF_ROLE_LABELS,
} from '../config/staffBalance';
import { rollBreakdownAfterTrip } from '../game/breakdown';
import {
  getDispatcherAcceptChance,
  getOrderSpawnIntervalMultiplier,
  findTaxisForDispatcherEndBreak,
  canUpgradeStaff,
  canHireStaffRole,
  createStaffMember,
  getStaffMemberById,
  hasStaffRole,
} from '../game/staff';
import {
  canHireGarageMechanic,
  canUpgradeGarageMechanic,
  createGarageMechanic,
  getBreakdownChanceMultiplierForGarage,
  getRepairCostMultiplierForGarage,
  resetGarageMechanicIdCounter,
} from '../game/garageStaff';
import {
  getGarageMechanicHireCost,
  getGarageMechanicUpgradeCost,
  getGarageServiceDurationGameMs,
  getWearAfterGarageService,
} from '../config/garageServiceBalance';
import { calcDailyExpenses } from '../game/dailyExpenses';
import { getGameDayIndex } from '../game/gameTime';
import type { CarClass } from '../config/carAssets';
import { createTaxiUnit } from '../game/createTaxi';
import {
  applyTripFatigue,
  calcTripFatigueGain,
  canUpgradeDriver,
  shouldBreakAfterTrip,
} from '../game/fatigue';
import { applyRatingDelta } from '../game/rating';
import { applyTripWear } from '../game/wear';
import { getWorldModifiers, pickWeatherForDay } from '../game/modifiers';
import { createDailyEvent } from '../game/events';
import { calcOrderFare } from '../config/gameBalance';
import {
  assignOrderToTaxi,
  buildTaxiRoute,
  findNearestEligibleTaxi,
} from '../game/dispatch';
import { generateOrder } from '../game/orderGenerator';
import { ensureFleetOnRoad as ensureFleetOnRoadPositions } from '../game/ensureFleetOnRoad';
import { snapTaxiToRoad } from '../game/ensureFleetOnRoad';
import { randomRoadPoint } from '../game/randomRoadPoint';
import { randomFallbackPosition } from '../game/idleBehavior';
import { TUTORIAL_STEPS } from '../config/tutorialSteps';
import type {
  FinanceEntry,
  GameEvent,
  Garage,
  GarageTier,
  GarageUpgradeKind,
  Office,
  OfficeTier,
  Order,
  TaxiUnit,
  OfficeStaffRole,
  TimeScaleMode,
  TripToast,
  TutorialPhase,
  Weather,
} from '../types/game';
import { formatMoney } from '../utils/format';
import {
  carPurchaseLabel,
  createFinanceEntry,
} from '../game/financeLedger';
import { REAL_ESTATE_BALANCE } from '../config/realEstateBalance';
import {
  getGaragePrice,
  getGarageSellRefund,
  getOfficePrice,
  getOfficeSellRefund,
} from '../config/realEstateBalance';
import {
  canAddGarage,
  createGarage,
  garageHasSpace,
} from '../game/garage';
import { createOffice, defaultOfficeName } from '../game/office';
import { resetGarageIdCounter } from '../game/garage';
import { resetTaxiIdCounter } from '../game/createTaxi';
import { clearSimulationGeometryCache, deleteSimulationGeometry, setSimulationGeometry } from '../game/simulationGeometryCache';
import { buildRouteGeometry } from '../game/carSimulation';
import {
  loadStoredMapStyleId,
  storeMapStyleId,
  type MapStyleId,
} from '../config/mapStyles';

clearSession();

type GameState = {
  sessionSetupComplete: boolean;
  cityId: CityId;
  customZoneBounds: CityBounds | null;
  money: number;
  garages: Garage[];
  offices: Office[];
  fleet: TaxiUnit[];
  orders: Order[];
  gameTimeMs: number;
  timeScaleMode: TimeScaleMode;
  selectedTaxiId: string | null;
  selectedOfficeId: string | null;
  selectedGarageId: string | null;
  selectedOrderId: string | null;
  networkError: boolean;
  lastOrderSpawnGameMs: number;
  lastExpenseGameDay: number;
  dailyExpenseBanner: number | null;
  financeLedger: FinanceEntry[];
  financePanelOpen: boolean;
  tripToasts: TripToast[];
  mapStyleId: MapStyleId;
  parkRating: number;
  weather: Weather;
  activeEvent: GameEvent | null;
  eventBanner: string | null;
  tutorialPhase: TutorialPhase;
  tutorialStepIndex: number;

  setTimeScaleMode: (m: TimeScaleMode) => void;
  clearEventBanner: () => void;
  setMapStyleId: (id: MapStyleId) => void;
  completeSessionSetup: (
    cityId: CityId,
    customBounds: CityBounds | null,
  ) => void;
  startTutorialTour: () => void;
  skipTutorial: () => void;
  nextTutorialStep: () => void;
  clearDailyExpenseBanner: () => void;
  openFinancePanel: () => void;
  closeFinancePanel: () => void;
  tickGameTime: (deltaGameMs: number) => void;
  selectTaxi: (id: string | null) => void;
  selectOffice: (id: string | null) => void;
  selectGarage: (id: string | null) => void;
  selectOrder: (id: string | null) => void;
  setFleet: (fleet: TaxiUnit[]) => void;
  setOrders: (orders: Order[]) => void;
  setNetworkError: (v: boolean) => void;
  updateTaxi: (id: string, patch: Partial<TaxiUnit>) => void;
  updateFleet: (updates: Array<{ id: string; patch: Partial<TaxiUnit> }>) => void;

  acceptOrder: (orderId: string) => Promise<boolean>;
  rejectOrder: (orderId: string) => void;
  sendTaxiToBreak: (taxiId: string) => void;
  sendTaxiToGarage: (taxiId: string) => void;
  cancelOrderAndBreak: (taxiId: string) => void;
  forceTaxiFree: (taxiId: string) => void;
  endBreak: (taxiId: string) => void;
  upgradeDriver: (taxiId: string) => boolean;
  buyCar: (carClass: CarClass, garageId: string) => Promise<boolean>;
  buyGarage: (tier: GarageTier) => boolean;
  sellGarage: (garageId: string) => boolean;
  renameGarage: (garageId: string, name: string) => void;
  moveTaxiToGarage: (taxiId: string, targetGarageId: string) => boolean;
  buyOffice: (tier: OfficeTier) => boolean;
  sellOffice: (officeId: string) => boolean;
  renameOffice: (officeId: string, name: string) => void;
  trySpawnOrder: () => Promise<void>;
  completeTrip: (taxiId: string) => void;
  repairTaxi: (taxiId: string) => boolean;
  serviceTaxi: (taxiId: string) => boolean;
  buyGarageUpgrade: (garageId: string, kind: GarageUpgradeKind) => boolean;
  fireTaxi: (taxiId: string) => boolean;
  renameTaxi: (taxiId: string, name: string) => void;
  ensureFleetOnRoad: () => Promise<void>;
  pruneTripToasts: () => void;
  buyTaxiUpgrade: (
    taxiId: string,
    upgrade: 'childSeat' | 'petCarrier' | 'lpg' | 'branding',
  ) => boolean;
  hireStaff: (officeId: string, role: OfficeStaffRole) => boolean;
  upgradeStaff: (officeId: string, staffId: string) => boolean;
  hireGarageMechanic: (garageId: string) => boolean;
  upgradeGarageMechanic: (garageId: string) => boolean;
  runStaffAutomation: () => void;
  resetProgress: () => void;
  addDebugMoney: (amount: number) => void;
};

let tripToastCounter = 0;

function pruneExpiredToasts(toasts: TripToast[]): TripToast[] {
  const now = Date.now();
  return toasts.filter((t) => t.expiresAtMs > now);
}

function pushTripToast(
  taxiId: string,
  text: string,
  position: import('../types/game').LatLng,
): TripToast {
  tripToastCounter += 1;
  return {
    id: `toast-${tripToastCounter}`,
    taxiId,
    text,
    position,
    expiresAtMs: Date.now() + 5000,
  };
}

function appendLedger(
  ledger: FinanceEntry[],
  entry: FinanceEntry,
): FinanceEntry[] {
  return [...ledger, entry];
}

function createStarterGarage(): Garage {
  return createGarage(
    REAL_ESTATE_BALANCE.initialGarageTier,
    REAL_ESTATE_BALANCE.initialGarageName,
  );
}

function releaseOrdersForTaxis(
  orders: Order[],
  fleet: TaxiUnit[],
  removedTaxiIds: Set<string>,
): Order[] {
  const orderIdsToRelease = new Set<string>();
  for (const taxi of fleet) {
    if (
      removedTaxiIds.has(taxi.id) &&
      taxi.assignedOrderId &&
      (taxi.status === 'to_pickup' ||
        taxi.status === 'on_trip' ||
        taxi.status === 'routing')
    ) {
      orderIdsToRelease.add(taxi.assignedOrderId);
    }
  }
  if (orderIdsToRelease.size === 0) return orders;
  return orders.map((o) =>
    orderIdsToRelease.has(o.id) && o.status === 'assigned'
      ? { ...o, status: 'pending' as const }
      : o,
  );
}

function initialGame(cityId: CityId, customZoneBounds: CityBounds | null) {
  const starterGarage = createStarterGarage();
  const bounds = getPlayBounds(cityId, customZoneBounds);
  const pos = randomFallbackPosition(bounds);
  return {
    garages: [starterGarage],
    offices: [] as Office[],
    fleet: [createTaxiUnit('econom', starterGarage.id, pos, cityId)],
  };
}

const initial = initialGame('kazan', null);

const START_GAME_TIME_MS = 8 * 60 * 60 * 1000;

function createFreshGameState(
  cityId: CityId,
  customZoneBounds: CityBounds | null,
) {
  const game = initialGame(cityId, customZoneBounds);
  return {
    money: GAME_BALANCE.startMoney,
    garages: game.garages,
    offices: game.offices,
    fleet: game.fleet,
    orders: [] as Order[],
    gameTimeMs: START_GAME_TIME_MS,
    timeScaleMode: 1 as TimeScaleMode,
    selectedTaxiId: null,
    selectedOfficeId: null,
    selectedGarageId: null,
    selectedOrderId: null,
    networkError: false,
    lastOrderSpawnGameMs: 0,
    lastExpenseGameDay: getGameDayIndex(START_GAME_TIME_MS),
    dailyExpenseBanner: null,
    financeLedger: [] as FinanceEntry[],
    financePanelOpen: false,
    tripToasts: [] as TripToast[],
    parkRating: RATING_BALANCE.startRating,
    weather: 'clear' as Weather,
    activeEvent: null as GameEvent | null,
    eventBanner: null as string | null,
  };
}

export const useGameStore = create<GameState>((set, get) => ({
  sessionSetupComplete: false,
  cityId: 'kazan',
  customZoneBounds: null,
  money: GAME_BALANCE.startMoney,
  garages: initial.garages,
  offices: initial.offices,
  fleet: initial.fleet,
  orders: [],
  gameTimeMs: 8 * 60 * 60 * 1000,
  timeScaleMode: 1,
  selectedTaxiId: null,
  selectedOfficeId: null,
  selectedGarageId: null,
  selectedOrderId: null,
  networkError: false,
  lastOrderSpawnGameMs: 0,
  lastExpenseGameDay: getGameDayIndex(8 * 60 * 60 * 1000),
  dailyExpenseBanner: null,
  financeLedger: [],
  financePanelOpen: false,
  tripToasts: [],
  mapStyleId: loadStoredMapStyleId(),
  parkRating: RATING_BALANCE.startRating,
  weather: 'clear',
  activeEvent: null,
  eventBanner: null,
  tutorialPhase: null,
  tutorialStepIndex: 0,

  setTimeScaleMode: (m) => set({ timeScaleMode: m }),

  clearEventBanner: () => set({ eventBanner: null }),

  setMapStyleId: (id) => {
    storeMapStyleId(id);
    set({ mapStyleId: id });
  },

  completeSessionSetup: (cityId, customBounds) => {
    const game = initialGame(cityId, customBounds);
    set({
      sessionSetupComplete: true,
      cityId,
      customZoneBounds: customBounds,
      garages: game.garages,
      offices: game.offices,
      fleet: game.fleet,
      orders: [],
      money: GAME_BALANCE.startMoney,
      gameTimeMs: START_GAME_TIME_MS,
      lastOrderSpawnGameMs: 0,
      lastExpenseGameDay: getGameDayIndex(START_GAME_TIME_MS),
      parkRating: RATING_BALANCE.startRating,
      selectedTaxiId: null,
      selectedOfficeId: null,
      selectedGarageId: null,
      selectedOrderId: null,
      tutorialPhase: 'intro',
      tutorialStepIndex: 0,
    });
  },

  startTutorialTour: () =>
    set({ tutorialPhase: 'tour', tutorialStepIndex: 0 }),

  skipTutorial: () => set({ tutorialPhase: null, tutorialStepIndex: 0 }),

  nextTutorialStep: () => {
    const idx = get().tutorialStepIndex;
    if (idx >= TUTORIAL_STEPS.length - 1) {
      set({ tutorialPhase: null, tutorialStepIndex: 0 });
    } else {
      set({ tutorialStepIndex: idx + 1 });
    }
  },

  clearDailyExpenseBanner: () => set({ dailyExpenseBanner: null }),

  openFinancePanel: () => set({ financePanelOpen: true }),

  closeFinancePanel: () => set({ financePanelOpen: false }),

  resetProgress: () => {
    resetTaxiIdCounter();
    resetGarageIdCounter();
    resetGarageMechanicIdCounter();
    clearSimulationGeometryCache();
    const { mapStyleId, cityId, customZoneBounds } = get();
    set({ ...createFreshGameState(cityId, customZoneBounds), mapStyleId });
    void get().ensureFleetOnRoad();
  },

  addDebugMoney: (amount) =>
    set((s) => ({ money: s.money + Math.max(0, amount) })),

  pruneTripToasts: () =>
    set((s) => {
      const tripToasts = pruneExpiredToasts(s.tripToasts);
      return tripToasts.length === s.tripToasts.length ? s : { tripToasts };
    }),

  ensureFleetOnRoad: async () => {
    const s = get();
    if (s.fleet.length === 0) return;
    set({
      fleet: s.fleet.map((t) => ({ ...t, positionReady: false })),
    });
    const bounds = getPlayBounds(s.cityId, s.customZoneBounds);
    const fleet = await ensureFleetOnRoadPositions(
      get().fleet,
      s.cityId,
      bounds,
    );
    set({ fleet });
  },

  tickGameTime: (deltaGameMs) =>
    set((s) => {
      const gameTimeMs = s.gameTimeMs + deltaGameMs;
      const newDay = getGameDayIndex(gameTimeMs);
      let money = s.money;
      let lastExpenseGameDay = s.lastExpenseGameDay;
      let dailyExpenseBanner = s.dailyExpenseBanner;
      let financeLedger = s.financeLedger;

      let weather = s.weather;
      let activeEvent = s.activeEvent;
      let eventBanner = s.eventBanner;
      let parkRating = s.parkRating;

      if (
        newDay > lastExpenseGameDay &&
        (s.fleet.length > 0 || s.garages.length > 0 || s.offices.length > 0)
      ) {
        const expense = calcDailyExpenses(s.fleet, s.garages, s.offices);
        money = Math.max(0, money - expense);
        dailyExpenseBanner = expense;
        lastExpenseGameDay = newDay;
        financeLedger = appendLedger(
          financeLedger,
          createFinanceEntry(
            gameTimeMs,
            -expense,
            'daily_expense',
            'Расходы на содержание',
          ),
        );
        weather = pickWeatherForDay();
        activeEvent = createDailyEvent(gameTimeMs);
        eventBanner = activeEvent.label;
      }

      if (activeEvent && activeEvent.endsAtGameMs <= gameTimeMs) {
        activeEvent = null;
      }

      const orders = s.orders.filter(
        (o) => o.status !== 'pending' || o.expiresAt > gameTimeMs,
      );

      let fleet = s.fleet;
      let fleetChanged = false;
      fleet = fleet.map((t) => {
        if (t.status !== 'in_garage' || gameTimeMs < t.garageUntilGameMs) {
          return t;
        }
        const garage = s.garages.find((g) => g.id === t.garageId);
        const mechanicLevel = garage?.mechanic?.level ?? 0;
        fleetChanged = true;
        return {
          ...t,
          status: 'free' as const,
          garageUntilGameMs: 0,
          wearPercent: getWearAfterGarageService(mechanicLevel),
          needsService: false,
          idleLeg: null,
          idleUntilGameMs: gameTimeMs,
          routePoints: [t.position],
          progressM: 0,
        };
      });

      const patch: Partial<GameState> = {
        gameTimeMs,
        money,
        lastExpenseGameDay,
        dailyExpenseBanner,
        financeLedger,
        weather,
        activeEvent,
        eventBanner,
        parkRating,
      };
      if (orders.length !== s.orders.length) {
        patch.orders = orders;
      }
      if (fleetChanged) {
        patch.fleet = fleet;
      }
      return patch;
    }),

  selectTaxi: (id) =>
    set({
      selectedTaxiId: id,
      selectedOfficeId: id ? null : get().selectedOfficeId,
      selectedGarageId: id ? null : get().selectedGarageId,
    }),
  selectOffice: (id) =>
    set({
      selectedOfficeId: id,
      selectedTaxiId: id ? null : get().selectedTaxiId,
      selectedGarageId: id ? null : get().selectedGarageId,
    }),
  selectGarage: (id) =>
    set({
      selectedGarageId: id,
      selectedTaxiId: id ? null : get().selectedTaxiId,
      selectedOfficeId: id ? null : get().selectedOfficeId,
    }),
  selectOrder: (id) => set({ selectedOrderId: id }),
  setFleet: (fleet) => set({ fleet }),
  setOrders: (orders) => set({ orders }),
  setNetworkError: (v) => set({ networkError: v }),

  updateTaxi: (id, patch) =>
    set((s) => ({
      fleet: s.fleet.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    })),

  updateFleet: (updates: Array<{ id: string; patch: Partial<TaxiUnit> }>) => {
    if (updates.length === 0) return;
    set((s) => {
      const patchById = new Map(updates.map((u) => [u.id, u.patch]));
      return {
        fleet: s.fleet.map((t) => {
          const patch = patchById.get(t.id);
          return patch ? { ...t, ...patch } : t;
        }),
      };
    });
  },

  rejectOrder: (orderId) =>
    set((s) => ({
      parkRating: applyRatingDelta(
        s.parkRating,
        -RATING_BALANCE.rejectPenalty,
      ),
      orders: s.orders.filter((o) => o.id !== orderId),
      selectedOrderId:
        s.selectedOrderId === orderId ? null : s.selectedOrderId,
    })),

  acceptOrder: async (orderId) => {
    const s = get();
    const order = s.orders.find((o) => o.id === orderId && o.status === 'pending');
    if (!order) return false;

    const taxi = findNearestEligibleTaxi(s.fleet, order.from, order);
    if (!taxi) return false;

    const baseFare =
      order.fare > 0
        ? order.fare
        : calcOrderFare(order.distanceM, taxi.carClass);
    const fare = Math.round(
      baseFare *
        getTaxiFareMultiplier(
          taxi.upgrades ?? {
            childSeat: false,
            petCarrier: false,
            lpg: false,
            branding: false,
          },
        ),
    );
    const assigned = assignOrderToTaxi(taxi, order);
    deleteSimulationGeometry(taxi.id);
    set((state) => ({
      fleet: state.fleet.map((t) => (t.id === taxi.id ? assigned : t)),
      orders: state.orders.map((o) =>
        o.id === orderId
          ? { ...o, status: 'assigned' as const, fare }
          : o,
      ),
      selectedOrderId: null,
    }));

    const playBounds = getPlayBounds(s.cityId, s.customZoneBounds);
    let startPos = taxi.position;
    let routePatch = await buildTaxiRoute(
      assigned,
      startPos,
      order.from,
      playBounds,
    );

    if (!routePatch) {
      const snapped = await snapTaxiToRoad(taxi.position, s.cityId, playBounds);
      if (snapped) {
        get().updateTaxi(taxi.id, {
          position: snapped,
          routePoints: [snapped],
          routeFrom: snapped,
          routeTo: snapped,
        });
        startPos = snapped;
        routePatch = await buildTaxiRoute(
          assigned,
          startPos,
          order.from,
          playBounds,
        );
      }
    }

    if (!routePatch) {
      get().setNetworkError(true);
      set((state) => ({
        fleet: state.fleet.map((t) =>
          t.id === taxi.id
            ? {
                ...t,
                status: 'free',
                tripPhase: null,
                assignedOrderId: null,
                pickupPoint: null,
                dropoffPoint: null,
              }
            : t,
        ),
        orders: state.orders.map((o) =>
          o.id === orderId ? { ...o, status: 'pending' as const } : o,
        ),
      }));
      return false;
    }

    get().setNetworkError(false);
    const routePoints = routePatch.routePoints ?? [];
    if (routePoints.length >= 2) {
      setSimulationGeometry(taxi.id, buildRouteGeometry(routePoints));
    }
    get().updateTaxi(taxi.id, {
      ...routePatch,
      status: 'to_pickup',
      tripPhase: 'to_pickup',
    });
    return true;
  },

  sendTaxiToBreak: (taxiId) =>
    set((s) => ({
      fleet: s.fleet.map((t) =>
        t.id === taxiId &&
          !t.isBroken &&
          t.status !== 'on_trip' &&
          t.status !== 'to_pickup'
          ? {
              ...t,
              status: 'on_break' as const,
              tripPhase: null,
              assignedOrderId: null,
              pickupPoint: null,
              dropoffPoint: null,
              routePoints: [t.position],
              progressM: 0,
              idleLeg: 'stand',
              idleUntilGameMs: s.gameTimeMs + 30_000,
            }
          : t,
      ),
    })),

  sendTaxiToGarage: (taxiId) => {
    const s = get();
    const taxi = s.fleet.find((t) => t.id === taxiId);
    if (
      !taxi ||
      taxi.isBroken ||
      taxi.status !== 'free' ||
      taxi.assignedOrderId
    ) {
      return;
    }
    const garage = s.garages.find((g) => g.id === taxi.garageId);
    const mechanicLevel = garage?.mechanic?.level ?? 0;
    const until = s.gameTimeMs + getGarageServiceDurationGameMs(mechanicLevel);
    deleteSimulationGeometry(taxiId);
    set({
      fleet: s.fleet.map((t) =>
        t.id === taxiId
          ? {
              ...t,
              status: 'in_garage' as const,
              tripPhase: null,
              assignedOrderId: null,
              pickupPoint: null,
              dropoffPoint: null,
              routePoints: [t.position],
              progressM: 0,
              idleLeg: 'stand',
              idleUntilGameMs: until,
              garageUntilGameMs: until,
            }
          : t,
      ),
    });
  },

  forceTaxiFree: (taxiId) => {
    const taxi = get().fleet.find((t) => t.id === taxiId);
    const orderId = taxi?.assignedOrderId;
    deleteSimulationGeometry(taxiId);
    set((s) => ({
      fleet: s.fleet.map((t) =>
        t.id === taxiId
          ? {
              ...t,
              status: 'free' as const,
              tripPhase: null,
              assignedOrderId: null,
              pickupPoint: null,
              dropoffPoint: null,
              routePoints: [t.position],
              progressM: 0,
              idleLeg: null,
              idleUntilGameMs: s.gameTimeMs,
              pickupLegDistanceM: 0,
            }
          : t,
      ),
      orders: s.orders.map((o) =>
        orderId && o.id === orderId && o.status === 'assigned'
          ? { ...o, status: 'pending' as const }
          : o,
      ),
    }));
  },

  cancelOrderAndBreak: (taxiId) => {
    const taxi = get().fleet.find((t) => t.id === taxiId);
    const orderId = taxi?.assignedOrderId;
    deleteSimulationGeometry(taxiId);
    set((s) => ({
      fleet: s.fleet.map((t) =>
        t.id === taxiId
          ? {
              ...t,
              status: 'on_break' as const,
              tripPhase: null,
              assignedOrderId: null,
              pickupPoint: null,
              dropoffPoint: null,
              routePoints: [t.position],
              progressM: 0,
              idleLeg: 'stand',
              idleUntilGameMs: s.gameTimeMs + 30_000,
            }
          : t,
      ),
      orders: s.orders.map((o) =>
        orderId && o.id === orderId && o.status === 'assigned'
          ? { ...o, status: 'pending' as const }
          : o,
      ),
    }));
  },

  endBreak: (taxiId) =>
    set((s) => ({
      fleet: s.fleet.map((t) => {
        if (t.id !== taxiId || t.status !== 'on_break') return t;
        if (
          t.driver.fatigue === 0 &&
          hasStaffRole(s.offices, 'dispatcher')
        ) {
          return t;
        }
        if (t.driver.fatigue > GAME_BALANCE.fatigueEndBreakThreshold) {
          return t;
        }
        return {
          ...t,
          status: 'free' as const,
          idleLeg: null,
          idleUntilGameMs: s.gameTimeMs,
        };
      }),
    })),

  upgradeDriver: (taxiId) => {
    const s = get();
    const taxi = s.fleet.find((t) => t.id === taxiId);
    if (!taxi || !canUpgradeDriver(taxi.driver.skillLevel)) return false;

    const cost = getUpgradeCost(taxi.driver.skillLevel);
    if (s.money < cost) return false;

    set({
      money: s.money - cost,
      financeLedger: appendLedger(
        s.financeLedger,
        createFinanceEntry(
          s.gameTimeMs,
          -cost,
          'driver_upgrade',
          'Прокачка водителя',
        ),
      ),
      fleet: s.fleet.map((t) =>
        t.id === taxiId
          ? {
              ...t,
              driver: {
                ...t.driver,
                skillLevel: t.driver.skillLevel + 1,
              },
            }
          : t,
      ),
    });
    return true;
  },

  buyCar: async (carClass, garageId) => {
    const s = get();
    const garage = s.garages.find((g) => g.id === garageId);
    if (!garage || !garageHasSpace(garage, s.fleet)) return false;

    const price = getCarPrice(carClass);
    if (price <= 0 || s.money < price) return false;

    const playBounds = getPlayBounds(s.cityId, s.customZoneBounds);
    let pos = null;
    for (let attempt = 0; attempt < 15; attempt++) {
      pos = await randomRoadPoint(playBounds);
      if (pos) break;
    }
    if (!pos) {
      set({ networkError: true });
      return false;
    }

    set({
      money: s.money - price,
      financeLedger: appendLedger(
        s.financeLedger,
        createFinanceEntry(
          s.gameTimeMs,
          -price,
          'car_purchase',
          carPurchaseLabel(carClass),
        ),
      ),
      fleet: [
        ...s.fleet,
        createTaxiUnit(carClass, garageId, pos, s.cityId),
      ],
    });
    void get().ensureFleetOnRoad();
    return true;
  },

  buyGarage: (tier) => {
    const s = get();
    if (!canAddGarage(s.garages)) return false;
    const price = getGaragePrice(tier);
    if (s.money < price) return false;

    const name = REAL_ESTATE_BALANCE.garageTierLabels[tier];
    const garage = createGarage(tier, name);

    set({
      money: s.money - price,
      garages: [...s.garages, garage],
      financeLedger: appendLedger(
        s.financeLedger,
        createFinanceEntry(
          s.gameTimeMs,
          -price,
          'garage_purchase',
          `Покупка: ${name}`,
        ),
      ),
    });
    return true;
  },

  sellGarage: (garageId) => {
    const s = get();
    if (s.garages.length <= 1) return false;
    const garage = s.garages.find((g) => g.id === garageId);
    if (!garage) return false;

    const removedIds = new Set(
      s.fleet.filter((t) => t.garageId === garageId).map((t) => t.id),
    );
    const refund = getGarageSellRefund(garage.tier);
    const orders = releaseOrdersForTaxis(s.orders, s.fleet, removedIds);

    set({
      money: s.money + refund,
      garages: s.garages.filter((g) => g.id !== garageId),
      fleet: s.fleet.filter((t) => t.garageId !== garageId),
      orders,
      selectedTaxiId:
        s.selectedTaxiId && removedIds.has(s.selectedTaxiId)
          ? null
          : s.selectedTaxiId,
      selectedGarageId:
        s.selectedGarageId === garageId ? null : s.selectedGarageId,
      financeLedger: appendLedger(
        s.financeLedger,
        createFinanceEntry(
          s.gameTimeMs,
          refund,
          'garage_sale',
          `Продажа: ${garage.name}`,
        ),
      ),
    });
    return true;
  },

  renameGarage: (garageId, name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    set((s) => ({
      garages: s.garages.map((g) =>
        g.id === garageId ? { ...g, name: trimmed } : g,
      ),
    }));
  },

  moveTaxiToGarage: (taxiId, targetGarageId) => {
    const s = get();
    const taxi = s.fleet.find((t) => t.id === taxiId);
    const target = s.garages.find((g) => g.id === targetGarageId);
    if (!taxi || !target || taxi.garageId === targetGarageId) return false;
    if (taxi.status === 'to_pickup' || taxi.status === 'on_trip') return false;
    if (!garageHasSpace(target, s.fleet)) return false;

    set({
      fleet: s.fleet.map((t) =>
        t.id === taxiId ? { ...t, garageId: targetGarageId } : t,
      ),
    });
    return true;
  },

  buyOffice: (tier) => {
    const s = get();
    const price = getOfficePrice(tier);
    if (s.money < price) return false;

    const office = createOffice(tier, defaultOfficeName(tier));

    set({
      money: s.money - price,
      offices: [...s.offices, office],
      financeLedger: appendLedger(
        s.financeLedger,
        createFinanceEntry(
          s.gameTimeMs,
          -price,
          'office_purchase',
          `Покупка: ${office.name}`,
        ),
      ),
    });
    return true;
  },

  sellOffice: (officeId) => {
    const s = get();
    const office = s.offices.find((o) => o.id === officeId);
    if (!office) return false;

    const refund = getOfficeSellRefund(office.tier);

    set({
      money: s.money + refund,
      offices: s.offices.filter((o) => o.id !== officeId),
      selectedOfficeId:
        s.selectedOfficeId === officeId ? null : s.selectedOfficeId,
      financeLedger: appendLedger(
        s.financeLedger,
        createFinanceEntry(
          s.gameTimeMs,
          refund,
          'office_sale',
          `Продажа: ${office.name}`,
        ),
      ),
    });
    return true;
  },

  renameOffice: (officeId, name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    set((s) => ({
      offices: s.offices.map((o) =>
        o.id === officeId ? { ...o, name: trimmed } : o,
      ),
    }));
  },

  trySpawnOrder: async () => {
    const s = get();
    const pending = s.orders.filter((o) => o.status === 'pending').length;
    if (pending >= GAME_BALANCE.maxPendingOrders) return;
    const mods = getWorldModifiers(
      s.gameTimeMs,
      s.weather,
      s.parkRating,
      s.activeEvent,
    );
    const spawnInterval = Math.max(
      30_000,
      Math.round(
        (GAME_BALANCE.orderSpawnIntervalGameMs *
          getOrderSpawnIntervalMultiplier(s.offices) *
          getRatingSpawnIntervalMultiplier(s.parkRating) *
          mods.spawnIntervalMult) /
          mods.eventSpawnMult,
      ),
    );
    if (s.gameTimeMs - s.lastOrderSpawnGameMs < spawnInterval) {
      return;
    }

    const playBounds = getPlayBounds(s.cityId, s.customZoneBounds);
    const order = await generateOrder(
      s.cityId,
      s.gameTimeMs,
      s.fleet,
      {
        classBias: mods.classBias,
        maxRouteM: mods.maxRouteM,
        eventDistrictId: mods.eventDistrictId,
      },
      playBounds,
    );
    if (!order) {
      set({ networkError: true });
      return;
    }

    set((state) => ({
      orders: [...state.orders, order],
      lastOrderSpawnGameMs: state.gameTimeMs,
      networkError: false,
    }));
  },

  completeTrip: (taxiId) => {
    const s = get();
    const taxi = s.fleet.find((t) => t.id === taxiId);
    if (!taxi || !taxi.assignedOrderId) return;

    deleteSimulationGeometry(taxiId);

    const order = s.orders.find((o) => o.id === taxi.assignedOrderId);
    const mods = getWorldModifiers(
      s.gameTimeMs,
      s.weather,
      s.parkRating,
      s.activeEvent,
    );
    const garage = s.garages.find((g) => g.id === taxi.garageId);
    const upgrades = taxi.upgrades ?? {
      childSeat: false,
      petCarrier: false,
      lpg: false,
      branding: false,
    };

    const tripDistanceM = order?.distanceM ?? taxi.distanceM;
    const totalDistanceM =
      (taxi.pickupLegDistanceM > 0 ? taxi.pickupLegDistanceM : 0) + tripDistanceM;

    const baseFare =
      order && order.fare > 0
        ? order.fare
        : order
          ? calcOrderFare(order.distanceM, taxi.carClass)
          : 0;
    const fare = Math.round(baseFare * getTaxiFareMultiplier(upgrades));

    const fatigueGain = calcTripFatigueGain(
      totalDistanceM,
      taxi.driver.skillLevel,
      mods.fatigueMult,
    );
    const updatedDriver = applyTripFatigue(
      taxi.driver,
      totalDistanceM,
      mods.fatigueMult,
    );
    const goBreak = shouldBreakAfterTrip(updatedDriver);

    const wearResult = applyTripWear(
      taxi,
      totalDistanceM,
      mods.wearMult,
      garage,
    );

    let breakdownMult = garage
      ? getBreakdownChanceMultiplierForGarage(garage)
      : 1;
    if (garage?.upgrades?.tireService) {
      breakdownMult *= 1 - WEAR_BALANCE.tireServiceBreakdownReduction;
    }
    const wearBreakMult = getBreakdownWearMultiplier(wearResult.wearPercent);
    const brokeDown =
      !goBreak &&
      !wearResult.needsService &&
      rollBreakdownAfterTrip(breakdownMult, wearBreakMult);

    let parkRating = applyRatingDelta(
      s.parkRating,
      RATING_BALANCE.tripCompleteGain + mods.ratingBonusPerTrip,
    );
    if (brokeDown) {
      parkRating = applyRatingDelta(parkRating, -RATING_BALANCE.breakdownPenalty);
    }

    const dropoff = taxi.dropoffPoint ?? taxi.position;
    const toastText =
      fare > 0
        ? `Заказ завершён. +${formatMoney(fare)} · +${fatigueGain}% усталости`
        : `+${fatigueGain}% усталости`;
    const toast = pushTripToast(taxiId, toastText, dropoff);

    set({
      money: s.money + fare,
      parkRating,
      tripToasts: [...pruneExpiredToasts(s.tripToasts), toast],
      financeLedger: appendLedger(
        s.financeLedger,
        createFinanceEntry(s.gameTimeMs, fare, 'trip_income', 'Заказ'),
      ),
      orders: s.orders.filter((o) => o.id !== taxi.assignedOrderId),
      fleet: s.fleet.map((t) =>
        t.id === taxiId
          ? {
              ...t,
              status: goBreak ? ('on_break' as const) : ('free' as const),
              tripPhase: null,
              assignedOrderId: null,
              pickupPoint: null,
              dropoffPoint: null,
              driver: updatedDriver,
              progressM: 0,
              routePoints: [t.dropoffPoint ?? t.position],
              position: t.dropoffPoint ?? t.position,
              idleLeg: null,
              idleUntilGameMs: s.gameTimeMs,
              pickupLegDistanceM: 0,
              wearPercent: wearResult.wearPercent,
              needsService: wearResult.needsService,
              isBroken: brokeDown,
            }
          : t,
      ),
    });
  },

  repairTaxi: (taxiId) => {
    const s = get();
    const taxi = s.fleet.find((t) => t.id === taxiId);
    if (!taxi || !taxi.isBroken) return false;

    const garage = s.garages.find((g) => g.id === taxi.garageId);
    const repairMult = garage
      ? getRepairCostMultiplierForGarage(garage)
      : 1;
    const cost = Math.round(getRepairCost(taxi.carClass) * repairMult);
    if (s.money < cost) return false;

    set({
      money: s.money - cost,
      financeLedger: appendLedger(
        s.financeLedger,
        createFinanceEntry(
          s.gameTimeMs,
          -cost,
          'repair',
          'Ремонт автомобиля',
        ),
      ),
      fleet: s.fleet.map((t) =>
        t.id === taxiId
          ? {
              ...t,
              isBroken: false,
              status: 'free' as const,
              idleLeg: null,
              idleUntilGameMs: s.gameTimeMs,
            }
          : t,
      ),
    });
    return true;
  },

  serviceTaxi: (taxiId) => {
    const s = get();
    const taxi = s.fleet.find((t) => t.id === taxiId);
    if (!taxi || !taxi.needsService || taxi.isBroken) return false;

    const garage = s.garages.find((g) => g.id === taxi.garageId);
    let cost = getServiceCost(getRepairCost(taxi.carClass));
    if (garage?.upgrades?.tireService) {
      cost = Math.round(cost * (1 - WEAR_BALANCE.tireServiceCostReduction));
    }
    if (s.money < cost) return false;

    set({
      money: s.money - cost,
      financeLedger: appendLedger(
        s.financeLedger,
        createFinanceEntry(
          s.gameTimeMs,
          -cost,
          'service',
          'Техобслуживание',
        ),
      ),
      fleet: s.fleet.map((t) =>
        t.id === taxiId
          ? {
              ...t,
              needsService: false,
              wearPercent: 0,
              status: 'free' as const,
              idleLeg: null,
              idleUntilGameMs: s.gameTimeMs,
            }
          : t,
      ),
    });
    return true;
  },

  buyGarageUpgrade: (garageId, kind) => {
    const s = get();
    const garage = s.garages.find((g) => g.id === garageId);
    if (!garage) return false;
    const upgrades = garage.upgrades ?? { carWash: false, tireService: false };
    if (upgrades[kind]) return false;

    const price = getGarageUpgradePrice(kind);
    if (s.money < price) return false;

    set({
      money: s.money - price,
      financeLedger: appendLedger(
        s.financeLedger,
        createFinanceEntry(
          s.gameTimeMs,
          -price,
          'garage_upgrade',
          GARAGE_UPGRADE_LABELS[kind],
        ),
      ),
      garages: s.garages.map((g) =>
        g.id === garageId
          ? {
              ...g,
              upgrades: { ...upgrades, [kind]: true },
            }
          : g,
      ),
    });
    return true;
  },

  fireTaxi: (taxiId) => {
    const s = get();
    const taxi = s.fleet.find((t) => t.id === taxiId);
    if (!taxi) return false;

    const orderId = taxi.assignedOrderId;

    set({
      fleet: s.fleet.filter((t) => t.id !== taxiId),
      orders: s.orders.map((o) =>
        orderId && o.id === orderId && o.status === 'assigned'
          ? { ...o, status: 'pending' as const }
          : o,
      ),
      selectedTaxiId: s.selectedTaxiId === taxiId ? null : s.selectedTaxiId,
    });
    return true;
  },

  renameTaxi: (taxiId, name) =>
    set((s) => ({
      fleet: s.fleet.map((t) =>
        t.id === taxiId ? { ...t, driverName: name.trim() } : t,
      ),
    })),

  buyTaxiUpgrade: (taxiId, upgrade) => {
    const s = get();
    const taxi = s.fleet.find((t) => t.id === taxiId);
    if (!taxi) return false;
    const upgrades = taxi.upgrades ?? {
      childSeat: false,
      petCarrier: false,
      lpg: false,
      branding: false,
    };
    if (upgrades[upgrade]) return false;
    if (upgrade === 'lpg' && taxi.carClass !== 'econom') return false;

    const price =
      upgrade === 'childSeat'
        ? getChildSeatPrice()
        : upgrade === 'petCarrier'
          ? getPetCarrierPrice()
          : upgrade === 'lpg'
            ? getLpgPrice()
            : getBrandingPrice();
    if (s.money < price) return false;

    const label =
      upgrade === 'childSeat'
        ? 'Детское кресло'
        : upgrade === 'petCarrier'
          ? 'Переноска для животных'
          : upgrade === 'lpg'
            ? 'ГБО'
            : 'Брендинг';

    set({
      money: s.money - price,
      financeLedger: appendLedger(
        s.financeLedger,
        createFinanceEntry(s.gameTimeMs, -price, 'taxi_upgrade', label),
      ),
      fleet: s.fleet.map((t) =>
        t.id === taxiId
          ? {
              ...t,
              upgrades: { ...upgrades, [upgrade]: true },
            }
          : t,
      ),
    });
    return true;
  },

  hireStaff: (officeId, role) => {
    const s = get();
    const office = s.offices.find((o) => o.id === officeId);
    if (!office || !canHireStaffRole(office, role)) return false;

    const cost = getStaffHireCost(role);
    if (s.money < cost) return false;

    const member = createStaffMember(role);

    set({
      money: s.money - cost,
      financeLedger: appendLedger(
        s.financeLedger,
        createFinanceEntry(
          s.gameTimeMs,
          -cost,
          'staff_hire',
          `Найм: ${STAFF_ROLE_LABELS[role]}`,
        ),
      ),
      offices: s.offices.map((o) =>
        o.id === officeId ? { ...o, staff: [...o.staff, member] } : o,
      ),
    });
    return true;
  },

  hireGarageMechanic: (garageId) => {
    const s = get();
    const garage = s.garages.find((g) => g.id === garageId);
    if (!garage || !canHireGarageMechanic(garage)) return false;

    const cost = getGarageMechanicHireCost();
    if (s.money < cost) return false;

    set({
      money: s.money - cost,
      financeLedger: appendLedger(
        s.financeLedger,
        createFinanceEntry(
          s.gameTimeMs,
          -cost,
          'staff_hire',
          'Найм: механик гаража',
        ),
      ),
      garages: s.garages.map((g) =>
        g.id === garageId
          ? { ...g, mechanic: createGarageMechanic() }
          : g,
      ),
    });
    return true;
  },

  upgradeGarageMechanic: (garageId) => {
    const s = get();
    const garage = s.garages.find((g) => g.id === garageId);
    if (!garage || !canUpgradeGarageMechanic(garage) || !garage.mechanic) {
      return false;
    }

    const cost = getGarageMechanicUpgradeCost(garage.mechanic.level);
    if (s.money < cost) return false;

    set({
      money: s.money - cost,
      financeLedger: appendLedger(
        s.financeLedger,
        createFinanceEntry(
          s.gameTimeMs,
          -cost,
          'staff_upgrade',
          `Механик гаража · ур. ${garage.mechanic.level + 1}`,
        ),
      ),
      garages: s.garages.map((g) =>
        g.id === garageId && g.mechanic
          ? {
              ...g,
              mechanic: { ...g.mechanic, level: g.mechanic.level + 1 },
            }
          : g,
      ),
    });
    return true;
  },

  upgradeStaff: (officeId, staffId) => {
    const s = get();
    const office = s.offices.find((o) => o.id === officeId);
    if (!office) return false;
    const member = getStaffMemberById(office, staffId);
    if (!member || !canUpgradeStaff(member.level)) return false;

    const cost = getStaffUpgradeCost(member.level);
    if (s.money < cost) return false;

    set({
      money: s.money - cost,
      financeLedger: appendLedger(
        s.financeLedger,
        createFinanceEntry(
          s.gameTimeMs,
          -cost,
          'staff_upgrade',
          `${STAFF_ROLE_LABELS[member.role]} · ур. ${member.level + 1}`,
        ),
      ),
      offices: s.offices.map((o) =>
        o.id === officeId
          ? {
              ...o,
              staff: o.staff.map((m) =>
                m.id === staffId ? { ...m, level: m.level + 1 } : m,
              ),
            }
          : o,
      ),
    });
    return true;
  },

  runStaffAutomation: () => {
    const s = get();
    const acceptChance = getDispatcherAcceptChance(s.offices);
    if (acceptChance <= 0) return;

    const endBreakIds = findTaxisForDispatcherEndBreak(s.fleet).map((t) => t.id);
    let fleet = s.fleet;
    if (endBreakIds.length > 0 && Math.random() < acceptChance) {
      const taxiId = endBreakIds[Math.floor(Math.random() * endBreakIds.length)]!;
      fleet = fleet.map((t) =>
        t.id === taxiId
          ? {
              ...t,
              status: 'free' as const,
              idleLeg: null,
              idleUntilGameMs: s.gameTimeMs,
            }
          : t,
      );
    }

    const pending = s.orders.filter((o) => o.status === 'pending');
    if (pending.length === 0) {
      if (fleet !== s.fleet) set({ fleet });
      return;
    }

    if (Math.random() >= acceptChance) {
      if (fleet !== s.fleet) set({ fleet });
      return;
    }

    const order = pending[Math.floor(Math.random() * pending.length)]!;
    const taxi = findNearestEligibleTaxi(fleet, order.from, order);
    if (!taxi) {
      if (fleet !== s.fleet) set({ fleet });
      return;
    }

    if (fleet !== s.fleet) {
      set({ fleet });
    }
    void get().acceptOrder(order.id);
  },
}));
