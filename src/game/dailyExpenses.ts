import { GAME_BALANCE } from '../config/gameBalance';
import { calcGarageUpgradesUpkeepPerDay } from '../config/garageUpgradesBalance';
import { getTaxiFuelMultiplier } from '../config/taxiUpgradesBalance';
import { REAL_ESTATE_BALANCE } from '../config/realEstateBalance';
import type { Garage, Office, TaxiUnit } from '../types/game';
import { calcGarageMechanicSalaryPerDay } from './garageStaff';
import { calcOfficeStaffSalariesPerDay } from './staff';

/** Зарплата водителя + топливо по классу машины */
export function getTaxiDailyOperatingCost(taxi: TaxiUnit): number {
  const upgrades = taxi.upgrades ?? {
    childSeat: false,
    petCarrier: false,
    lpg: false,
    branding: false,
  };
  const fuelMult = getTaxiFuelMultiplier(upgrades, taxi.carClass);
  const fuel = Math.round(
    GAME_BALANCE.fuelPerCarPerDay[taxi.carClass] * fuelMult,
  );
  return GAME_BALANCE.salaryPerDriverPerDay + fuel;
}

export function calcGarageRentPerDay(garage: Garage): number {
  return REAL_ESTATE_BALANCE.garageUpkeepPerDay[garage.tier];
}

/** Содержание машин в гараже (водители + топливо по классу) */
export function calcGarageFleetOperatingPerDay(
  garage: Garage,
  fleet: TaxiUnit[],
): number {
  let total = 0;
  for (const taxi of fleet) {
    if (taxi.garageId !== garage.id) continue;
    total += getTaxiDailyOperatingCost(taxi);
  }
  return total;
}

export { calcGarageUpgradesUpkeepPerDay } from '../config/garageUpgradesBalance';

/** Расходы гаража + автопарк + содержание улучшений + механик */
export function calcGarageDailyExpense(garage: Garage, fleet: TaxiUnit[]): number {
  return (
    calcGarageRentPerDay(garage) +
    calcGarageFleetOperatingPerDay(garage, fleet) +
    calcGarageUpgradesUpkeepPerDay(garage) +
    calcGarageMechanicSalaryPerDay(garage)
  );
}

export function calcGaragesDailyExpense(
  garages: Garage[],
  fleet: TaxiUnit[],
): number {
  let total = 0;
  for (const garage of garages) {
    total += calcGarageDailyExpense(garage, fleet);
  }
  return total;
}

export function calcOfficeRentPerDay(office: Office): number {
  return REAL_ESTATE_BALANCE.officeUpkeepPerDay[office.tier];
}

/** Расходы офиса + ФОТ сотрудников */
export function calcOfficeDailyExpense(office: Office): number {
  return calcOfficeRentPerDay(office) + calcOfficeStaffSalariesPerDay(office);
}

export function calcOfficesDailyExpense(offices: Office[]): number {
  let total = 0;
  for (const office of offices) {
    total += calcOfficeDailyExpense(office);
  }
  return total;
}

/** Суточные расходы: гаражи (помещение + автопарк), офисы (помещение + ФОТ) */
export function calcDailyExpenses(
  fleet: TaxiUnit[],
  garages: Garage[],
  offices: Office[],
): number {
  return (
    calcGaragesDailyExpense(garages, fleet) + calcOfficesDailyExpense(offices)
  );
}
