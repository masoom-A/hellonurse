import { calculateDistance, calculateBillableDistance } from './calculations';
import { DISTANCE } from '../config/pricingConfig';

// ─── Average nurse travel speed assumptions (km/h) ──────────────────────────
// Emergency nurses are assumed faster (priority routing, urgency)
// All others use standard urban speed
const TRAVEL_SPEEDS = {
  default: 20,    // ~20 km/h in Indian urban traffic
  Emergency: 30   // slightly faster, priority assumption
};

// ─── Main entry point ────────────────────────────────────────────────────────
// Input:  patientLocation  { lat, lng }
//         nurseLocation    { lat, lng }
//         serviceType      string (optional, defaults to 'default' speed)
//
// Output: {
//           distanceKm:         raw distance (rounded to 1 decimal)
//           billableDistanceKm: after free radius subtracted
//           etaMinutes:         estimated nurse arrival time in minutes
//         }
export const calculateDistanceAndETA = (patientLocation, nurseLocation, serviceType = '') => {
  const { lat: pLat, lng: pLng } = patientLocation;
  const { lat: nLat, lng: nLng } = nurseLocation;

  // Raw distance
  const rawKm = calculateDistance(pLat, pLng, nLat, nLng);
  const distanceKm = Math.round(rawKm * 10) / 10; // 1 decimal

  // Billable distance (free radius subtracted)
  const billableDistanceKm = Math.round(calculateBillableDistance(rawKm) * 10) / 10;

  // ETA: distance / speed, converted to minutes, rounded up
  const speedKmh = TRAVEL_SPEEDS[serviceType] || TRAVEL_SPEEDS.default;
  const etaMinutes = Math.ceil((rawKm / speedKmh) * 60);

  return {
    distanceKm,
    billableDistanceKm,
    etaMinutes
  };
};

// ─── Format helpers (for display) ───────────────────────────────────────────
export const formatDistance = (km) => {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)} km`;
};

export const formatETA = (minutes) => {
  if (minutes < 1) return '< 1 min';
  if (minutes >= 60) {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  }
  return `${minutes} min`;
};