// src/components/PriceEstimator.js
// Live price breakdown card — rendered on BookingScreen after service + location are selected.
//
// Props:
//   pricing   object | null  — the full pricing object returned by pricingEngine.calculate()
//   loading   boolean        — show a skeleton/placeholder while pricing is being calculated
//
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '../utils/formatters';
import { COLORS } from '../constants/colors';

const PriceEstimator = ({ pricing = null, loading = false }) => {
  // ─── Loading state ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="wallet-outline" size={20} color={COLORS.primary} />
          <Text style={styles.headerText}>Price Estimate</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loadingText}>Calculating price...</Text>
        </View>
      </View>
    );
  }

  // ─── Nothing to show yet ─────────────────────────────────────────────────
  if (!pricing || !pricing.breakdown) return null;

  const { breakdown } = pricing;

  // Conditionally visible lines
  const hasSurge = breakdown.surgeMultiplier > 1.0;
  const hasEmergency = breakdown.emergencySurcharge > 0;
  const hasDistance = breakdown.distanceFare > 0;
  const hasDuration = breakdown.durationFare > 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="wallet-outline" size={20} color={COLORS.primary} />
        <Text style={styles.headerText}>Price Estimate</Text>
      </View>

      {/* Core cost lines */}
      <Row
        label={`Base Fare (${breakdown.baseFare !== undefined ? pricing.inputs.serviceType : ''})`}
        value={breakdown.baseFare}
      />

      {hasDistance && (
        <Row
          label={`Distance (${pricing.inputs.billableDistanceKm} km)`}
          value={breakdown.distanceFare}
        />
      )}

      {hasDuration && (
        <Row
          label={`Duration (${pricing.inputs.billableDurationHours} hr${pricing.inputs.billableDurationHours > 1 ? 's' : ''} extra)`}
          value={breakdown.durationFare}
        />
      )}

      {/* Divider before multipliers */}
      <View style={styles.divider} />

      {/* Experience multiplier — always shown, ties back to nurse card */}
      <Row
        icon="person-outline"
        iconColor={COLORS.primary}
        label={`${breakdown.experienceLabel} Nurse (${breakdown.experienceMultiplier}x)`}
        value={breakdown.afterExperience}
        highlight
      />

      {/* Surge — conditionally shown */}
      {hasSurge && (
        <Row
          icon="flash-outline"
          iconColor={COLORS.warning}
          label={`${breakdown.surgeLabel} (${breakdown.surgeMultiplier}x)`}
          value={breakdown.afterSurge}
          highlight
        />
      )}

      {/* Emergency surcharge — conditionally shown */}
      {hasEmergency && (
        <Row
          icon="alert-circle-outline"
          iconColor={COLORS.danger}
          label="Emergency Surcharge"
          value={breakdown.emergencySurcharge}
          highlight
        />
      )}

      {/* Divider before fees */}
      <View style={styles.divider} />

      {/* Tax & Platform Fee */}
      <Row label="Tax (10%)" value={breakdown.tax} muted />
      <Row label="Platform Fee" value={breakdown.platformFee} muted />

      {/* Divider before total */}
      <View style={styles.divider} />

      {/* Total */}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{formatCurrency(pricing.clientEstimate)}</Text>
      </View>
    </View>
  );
};

// ─── Reusable row component ──────────────────────────────────────────────────
// Props:
//   label        string
//   value        number
//   icon         string | null    — Ionicon name (optional)
//   iconColor    string | null    — icon color
//   highlight    boolean          — slightly bolder text for multiplier lines
//   muted        boolean          — lighter color for fee lines
const Row = ({ label, value, icon = null, iconColor = null, highlight = false, muted = false }) => (
  <View style={styles.row}>
    <View style={styles.rowLeft}>
      {icon && <Ionicons name={icon} size={16} color={iconColor} style={styles.rowIcon} />}
      <Text style={[styles.rowLabel, highlight && styles.rowLabelHighlight, muted && styles.rowLabelMuted]}>
        {label}
      </Text>
    </View>
    <Text style={[styles.rowValue, highlight && styles.rowValueHighlight, muted && styles.rowValueMuted]}>
      {formatCurrency(value)}
    </Text>
  </View>
);

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray[800],
  },

  // Loading
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.gray[500],
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: COLORS.gray[200],
    marginVertical: 12,
  },

  // Row
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowIcon: {
    marginRight: 6,
  },
  rowLabel: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  rowLabelHighlight: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[800],
  },
  rowLabelMuted: {
    fontSize: 13,
    color: COLORS.gray[400],
  },
  rowValue: {
    fontSize: 14,
    color: COLORS.gray[700],
  },
  rowValueHighlight: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[800],
  },
  rowValueMuted: {
    fontSize: 13,
    color: COLORS.gray[400],
  },

  // Total
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray[800],
  },
  totalValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
});

export default PriceEstimator;