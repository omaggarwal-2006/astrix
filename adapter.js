/**
 * LANDFALL - Adapter Layer (adapter.js)
 * Isolates sample and engine data from the UI.
 * When Tanishk delivers /engine modules, only this file is updated.
 */

import { generateAlertsForDay, generateForecastForDay, generateDayReadings, BASELINE_READINGS } from "./sample/sample_data.js";

/**
 * Returns active health alerts for a specific transit day
 * Shape: Alert: { id, metric, baseline, current, z, persisted_days, worsening, severity, reason }
 */
export function getAlerts(day) {
  return generateAlertsForDay(day);
}

/**
 * Returns landing-day physiological forecast dimensions
 * Shape: Forecast: { dimension, landing: { low, mid, high }, status, confidence, assumptions[] }
 */
export function getForecast(day, exerciseHours = 1.2) {
  return generateForecastForDay(day, exerciseHours);
}

/**
 * Returns daily telemetry vitals, symptoms, cabin, immune, and radiation
 */
export function getReadings(day) {
  return generateDayReadings(day);
}

/**
 * Returns astronaut's calibrated personal baseline
 */
export function getBaseline() {
  return { ...BASELINE_READINGS };
}

/**
 * Single function mapping severity to color, text label, and visual shape
 * Assumptions:
 * - 0 / 'nominal': Nominal (Green #2F8F83, circle)
 * - 1 / 'mild': Mild deviation (Teal/Green #2F8F83, circle)
 * - 2 / 'caution': Caution (Amber #E3A21A, triangle)
 * - 3 / 'alarm': Critical alarm (Red #C8322B, octagon)
 */
export function mapSeverity(severity) {
  if (severity === 3 || severity === "alarm" || severity === "critical" || severity === "CRITICAL") {
    return {
      color: "var(--alarm-red)",
      status: "alarm",
      label: "Alarm",
      shapeClass: "shape-octagon",
      priority: "CRITICAL"
    };
  } else if (severity === 2 || severity === "caution" || severity === "moderate" || severity === "HIGH" || severity === "MEDIUM") {
    return {
      color: "var(--caution-amber)",
      status: "caution",
      label: "Caution",
      shapeClass: "shape-triangle",
      priority: "HIGH"
    };
  } else if (severity === 1 || severity === "low" || severity === "LOW") {
    return {
      color: "var(--scrubber-teal)",
      status: "nominal",
      label: "Mild drift",
      shapeClass: "shape-circle",
      priority: "LOW"
    };
  } else {
    return {
      color: "var(--scrubber-teal)",
      status: "nominal",
      label: "Nominal",
      shapeClass: "shape-circle",
      priority: "NOMINAL"
    };
  }
}
