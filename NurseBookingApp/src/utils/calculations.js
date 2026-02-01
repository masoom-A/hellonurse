import { DISTANCE, DURATION, FEES } from '../config/pricingConfig';

// ─── Distance (Haversine) ────────────────────────────────────────────────────
// Returns distance in km as a number (not string)
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // raw number, rounding handled by caller
};

// ─── Billable Distance ───────────────────────────────────────────────────────
// Subtracts the free radius defined in pricingConfig
export const calculateBillableDistance = (distanceKm) => {
  return Math.max(0, distanceKm - DISTANCE.freeRadiusKm);
};

// ─── Billable Duration ───────────────────────────────────────────────────────
// Subtracts the included hours defined in pricingConfig
export const calculateBillableDuration = (durationHours) => {
  return Math.max(0, durationHours - DURATION.includedHours);
};

// ─── Total Price ─────────────────────────────────────────────────────────────
// Takes the full breakdown object from pricingEngine and computes the final total.
// Calculation order (matches backend design):
//   1. coreCost        = baseFare + distanceFare + durationFare
//   2. afterExperience = coreCost × experienceMultiplier
//   3. afterSurge      = afterExperience × surgeMultiplier
//   4. tax             = afterSurge × taxRate
//   5. total           = afterSurge + emergencySurcharge + tax + platformFee
export const calculateTotalPrice = ({
  baseFare = 0,
  distanceFare = 0,
  durationFare = 0,
  experienceMultiplier = 1.0,
  surgeMultiplier = 1.0,
  emergencySurcharge = 0,
}) => {
  const coreCost = baseFare + distanceFare + durationFare;
  const afterExperience = coreCost * experienceMultiplier;
  const afterSurge = afterExperience * surgeMultiplier;
  const tax = afterSurge * FEES.taxRate;
  const total = afterSurge + emergencySurcharge + tax + FEES.platformFee;

  return {
    coreCost,
    afterExperience,
    afterSurge,
    tax,
    platformFee: FEES.platformFee,
    total
  };
};