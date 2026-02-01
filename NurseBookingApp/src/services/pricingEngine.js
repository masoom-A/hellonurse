// src/services/pricingEngine.js
// Core pricing logic — single source of calculation truth for the client.
// The server (Cloud Function, Phase 6) will mirror this exact logic for validation.

import {
  PRICING_VERSION,
  BASE_FARES,
  DISTANCE,
  DURATION,
  EXPERIENCE_TIERS,
  SURGE_WINDOWS,
  EMERGENCY,
  FEES,
  getExperienceTier
} from '../config/pricingConfig';

import { calculateBillableDistance, calculateBillableDuration, calculateTotalPrice } from '../utils/calculations';

class PricingEngine {

  // ─── Main entry point ──────────────────────────────────────────────────────
  // Input: {
  //   serviceType:        string   — e.g. 'Elderly Care'
  //   distanceKm:         number   — raw distance from distanceCalculator
  //   durationHours:      number   — total session duration in hours
  //   nurseExperience:    number | string — yearsOfExperience OR tier key directly
  //   isEmergency:        boolean  — override for emergency surcharge
  //   scheduledTime:      Date | string | null — when the booking is for (null = now)
  // }
  //
  // Output: full pricing object (stored in Firestore + rendered by PriceEstimator)
  calculate({
    serviceType,
    distanceKm = 0,
    durationHours = 1,
    nurseExperience = 0,
    isEmergency = false,
    scheduledTime = null
  }) {
    // 1. Base fare
    const baseFare = this._getBaseFare(serviceType);

    // 2. Distance fare
    const billableDistanceKm = calculateBillableDistance(distanceKm);
    const distanceFare = billableDistanceKm * DISTANCE.ratePerKm;

    // 3. Duration fare
    const billableDurationHours = calculateBillableDuration(durationHours);
    const durationFare = billableDurationHours * DURATION.ratePerHour;

    // 4. Experience multiplier
    const experienceTierKey = this._resolveExperienceTier(nurseExperience);
    const experienceTier = EXPERIENCE_TIERS[experienceTierKey];
    const experienceMultiplier = experienceTier.multiplier;

    // 5. Surge multiplier
    const surgeTime = scheduledTime ? new Date(scheduledTime) : new Date();
    const surge = this._getSurge(surgeTime);
    const surgeMultiplier = surge.multiplier;
    const surgeLabel = surge.label; // null if no surge

    // 6. Emergency surcharge
    const emergencySurcharge =
      isEmergency || serviceType === 'Emergency' ? EMERGENCY.surcharge : 0;

    // 7. Run totals through calculateTotalPrice (strict 5-step order)
    const totals = calculateTotalPrice({
      baseFare,
      distanceFare,
      durationFare,
      experienceMultiplier,
      surgeMultiplier,
      emergencySurcharge
    });

    // ─── Build the full pricing object ───────────────────────────────────────
    return {
      pricingVersion: PRICING_VERSION,

      // Raw inputs — stored for auditing / server re-validation
      inputs: {
        serviceType,
        distanceKm: Math.round(distanceKm * 10) / 10,
        billableDistanceKm: Math.round(billableDistanceKm * 10) / 10,
        durationHours,
        billableDurationHours: billableDurationHours,
        nurseExperienceLevel: experienceTierKey,
        nurseExperienceMultiplier: experienceMultiplier,
        isEmergency,
        scheduledTime: surgeTime.toISOString()
      },

      // Line-by-line breakdown — rendered by PriceEstimator
      breakdown: {
        baseFare,
        distanceFare: Math.round(distanceFare * 100) / 100,
        durationFare,
        coreCost: totals.coreCost,
        experienceMultiplier,
        experienceLabel: experienceTier.label,   // 'Junior' | 'Mid-Level' | 'Senior'
        afterExperience: Math.round(totals.afterExperience * 100) / 100,
        surgeMultiplier,
        surgeLabel,                              // null when 1.0x — UI hides this line
        afterSurge: Math.round(totals.afterSurge * 100) / 100,
        emergencySurcharge,
        tax: Math.round(totals.tax * 100) / 100,
        platformFee: totals.platformFee
      },

      // Client estimate — server will validate against this at booking time
      clientEstimate: Math.round(totals.total * 100) / 100
    };
  }

  // ─── Base fare lookup ──────────────────────────────────────────────────────
  _getBaseFare(serviceType) {
    return BASE_FARES[serviceType] || BASE_FARES['General Care']; // fallback
  }

  // ─── Resolve experience tier ───────────────────────────────────────────────
  // Accepts either:
  //   - a number (yearsOfExperience from nurse doc) → resolves to tier key
  //   - a string that's already a tier key ('junior' | 'mid' | 'senior')
  _resolveExperienceTier(nurseExperience) {
    if (typeof nurseExperience === 'string' && EXPERIENCE_TIERS[nurseExperience]) {
      return nurseExperience;
    }
    return getExperienceTier(nurseExperience);
  }

  // ─── Surge calculation ─────────────────────────────────────────────────────
  // Evaluates SURGE_WINDOWS in order — first match wins.
  // Returns { multiplier, label } — label is null when no surge applies.
  _getSurge(date) {
    const hour = date.getHours();
    const day = date.getDay(); // 0 = Sun, 6 = Sat
    const isWeekend = day === 0 || day === 6;
    const dayType = isWeekend ? 'weekend' : 'weekday';

    for (const window of SURGE_WINDOWS) {
      // dayType check: 'any' matches both
      if (window.dayType !== 'any' && window.dayType !== dayType) continue;

      // Time range check — handles overnight wrap (e.g. 22:00–06:00)
      if (this._isInTimeWindow(hour, window.startHour, window.endHour)) {
        return { multiplier: window.multiplier, label: window.label };
      }
    }

    // No surge
    return { multiplier: 1.0, label: null };
  }

  // ─── Time window helper ────────────────────────────────────────────────────
  // Handles overnight ranges: startHour > endHour means it wraps past midnight
  _isInTimeWindow(currentHour, startHour, endHour) {
    if (startHour < endHour) {
      // Normal range: e.g. 7–9, 17–20
      return currentHour >= startHour && currentHour < endHour;
    }
    // Overnight range: e.g. 22–6 (Late Night)
    return currentHour >= startHour || currentHour < endHour;
  }
}

export default new PricingEngine();