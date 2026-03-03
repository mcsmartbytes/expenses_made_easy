/**
 * Centralized IRS mileage rate constants.
 * Update this file each year when the IRS publishes new rates.
 */

export const IRS_MILEAGE_RATES: Record<number, number> = {
  2024: 0.67,
  2025: 0.70,
  2026: 0.725,
};

const CURRENT_YEAR = new Date().getFullYear();

/** Returns the IRS standard mileage rate for the current year (e.g. 0.725) */
export function getCurrentMileageRate(): number {
  return IRS_MILEAGE_RATES[CURRENT_YEAR] ?? IRS_MILEAGE_RATES[2026];
}

/** Returns the rate formatted for display (e.g. "$0.725") */
export function getCurrentMileageRateDisplay(): string {
  return `$${getCurrentMileageRate().toFixed(3).replace(/0$/, '')}`;
}

/** Returns the rate for a specific year, falling back to current year rate */
export function getMileageRate(year: number): number {
  return IRS_MILEAGE_RATES[year] ?? getCurrentMileageRate();
}
