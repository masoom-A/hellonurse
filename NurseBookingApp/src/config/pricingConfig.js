// src/config/pricingConfig.js
// Central pricing configuration — all constants live here.
// pricingVersion is bumped whenever any value changes.

export const PRICING_VERSION = 'v1';

// ─── Base Fares (₹) per service type ────────────────────────────────────────
// Keyed by the service name used in serviceTypes.js and BookingScreen.js
export const BASE_FARES = {
  'General Care': 300,
  'Elderly Care': 400,
  'Post-Surgery': 500,
  'Post Surgery Care': 500,   // alias used in BookingScreen service list
  'IV Therapy': 600,
  'Wound Care': 450,
  'Emergency': 800,
  'Home Care': 300,            // alias used in BookingScreen / PatientHomeScreen
  'Medication Management': 300 // alias, maps to General Care rate
};

// ─── Distance Pricing ────────────────────────────────────────────────────────
export const DISTANCE = {
  ratePerKm: 15,        // ₹ per km
  freeRadiusKm: 2       // first 2 km included in base fare
};

// ─── Duration Pricing ────────────────────────────────────────────────────────
export const DURATION = {
  ratePerHour: 25,      // ₹ per extra hour
  includedHours: 1      // first 1 hour included in base fare
};

// ─── Experience Tiers ────────────────────────────────────────────────────────
// Label shown on nurse card → multiplier applied to coreCost
export const EXPERIENCE_TIERS = {
  junior: {
    label: 'Junior',
    multiplier: 1.0,
    maxYears: 2          // 0–2 years
  },
  mid: {
    label: 'Mid-Level',
    multiplier: 1.2,
    maxYears: 5          // 3–5 years
  },
  senior: {
    label: 'Senior',
    multiplier: 1.5,
    maxYears: Infinity   // 6+ years
  }
};

// Helper: resolve years of experience → tier key
export const getExperienceTier = (yearsOfExperience) => {
  const yrs = Number(yearsOfExperience) || 0;
  if (yrs <= EXPERIENCE_TIERS.junior.maxYears) return 'junior';
  if (yrs <= EXPERIENCE_TIERS.mid.maxYears)    return 'mid';
  return 'senior';
};

// ─── Surge Windows ───────────────────────────────────────────────────────────
// Evaluated in order — first match wins.
// dayType: 'weekday' | 'weekend' | 'any'
export const SURGE_WINDOWS = [
  {
    label: 'Late Night',
    multiplier: 2.0,
    dayType: 'any',
    startHour: 22,   // 10:00 PM
    endHour: 6        // 6:00 AM (next day)
  },
  {
    label: 'Morning Rush',
    multiplier: 1.5,
    dayType: 'weekday',
    startHour: 7,     // 7:00 AM
    endHour: 9        // 9:00 AM
  },
  {
    label: 'Evening Rush',
    multiplier: 1.5,
    dayType: 'weekday',
    startHour: 17,    // 5:00 PM
    endHour: 20       // 8:00 PM
  },
  {
    label: 'Weekend Rush',
    multiplier: 1.8,
    dayType: 'weekend',
    startHour: 17,    // 5:00 PM
    endHour: 22       // 10:00 PM
  }
];

// ─── Emergency ───────────────────────────────────────────────────────────────
export const EMERGENCY = {
  surcharge: 300   // flat ₹300 add-on
};

// ─── Fees & Tax ──────────────────────────────────────────────────────────────
export const FEES = {
  platformFee: 50,    // flat ₹50
  taxRate: 0.10       // GST 10%
};