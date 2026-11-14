/**
 * LANDFALL Placeholders - triage.js
 * Delay-Aware Autonomous Triage Engine
 * Assigns health issues to: SELF_TREAT, CREW_MEDICAL_OFFICER, or FLIGHT_SURGEON
 * based on physiological baseline drift and speed-of-light radio delay.
 */

(function(window) {
  'use strict';

  const TriageEngine = {
    /**
     * Evaluate telemetry, symptoms, and communication delay
     */
    evaluate(dayNumber, telemetry, commDelaySeconds) {
      const day = parseInt(dayNumber, 10);
      const vitals = telemetry.vitals || {};
      const cabin = telemetry.cabin || {};
      const symptoms = telemetry.symptoms || [];
      const immune = telemetry.immune || {};

      const flags = [];
      let directGroundLink = false;
      let triageLevel = 'SELF_TREAT';
      let urgency = 'ROUTINE';
      let rationale = '';
      let proposedAction = '';

      // Rule 1: Headache + High Cabin CO2 (Hostile/Closed Environment Hazard)
      const hasHeadache = symptoms.includes('headache');
      const highCO2 = cabin.co2 >= 4500;
      if (hasHeadache && highCO2) {
        flags.push({
          id: 'HEADACHE_CO2_SCRUBBER',
          severity: 'caution',
          message: 'Headache plus high CO2: check the scrubber first.'
        });
      }

      // Rule 2: SANS Vision Symptom Protocol (NASA Risk of SANS)
      // Strict clinical rule: wording is strictly "Report to the flight surgeon", never an autonomous diagnosis
      if (symptoms.includes('eye_strain')) {
        flags.push({
          id: 'SANS_MONITORING',
          severity: 'caution',
          message: 'Visual acuity change reported. Protocol: report to the flight surgeon (not a local diagnosis).'
        });
      }

      // Rule 3: Sleep Collapse Evaluation (NASA Risk of Inadequate Sleep)
      if (vitals.sleepHours < 5.0) {
        flags.push({
          id: 'SLEEP_COLLAPSE',
          severity: 'alarm',
          message: `Acute sleep deficit: ${vitals.sleepHours}h recorded vs 7.4h calibrated baseline.`
        });
      } else if (vitals.sleepHours < 6.2) {
        flags.push({
          id: 'SLEEP_DEFICIT',
          severity: 'caution',
          message: `Sub-optimal sleep: ${vitals.sleepHours}h recorded (16% below baseline).`
        });
      }

      // Rule 4: Cabin CO2 Standalone Ceiling
      if (cabin.co2 >= 5000) {
        flags.push({
          id: 'CABIN_CO2_HIGH',
          severity: 'caution',
          message: `Cabin CO2 at ${cabin.co2} ppm (operational limit: 4500 ppm).`
        });
      }

      // Rule 5: Immune Activation (NASA Risk of Altered Immune System)
      if (immune.coldSore) {
        flags.push({
          id: 'IMMUNE_HSV_REACTIVATION',
          severity: 'caution',
          message: 'Subclinical immune dysregulation: dormant viral reactivation (cold sore) reported.'
        });
      }

      // Rule 6: Acute Cardio Decompensation (Immediate Red Flag)
      if (vitals.heartRate > 120 || (vitals.bloodPressure && vitals.bloodPressure.systolic > 160)) {
        flags.push({
          id: 'ACUTE_CARDIO_EVENT',
          severity: 'alarm',
          message: 'Acute cardiovascular distress: hypertensive threshold exceeded.'
        });
        directGroundLink = true;
      }

      // Triage Tier Selection considering Comm Delay & Self-Sufficiency Principle
      const roundTripMins = ((commDelaySeconds * 2) / 60).toFixed(1);

      if (directGroundLink) {
        triageLevel = 'FLIGHT_SURGEON';
        urgency = 'CRITICAL_EMERGENCY';
        rationale = `Critical physiological instability requires ground Flight Surgeon coordination. Direct emergency channel opened despite transit latency.`;
        proposedAction = 'Initiate immediate emergency medical kit protocol. Direct telemetry burst dispatched.';
      } else if (flags.some(f => f.severity === 'alarm') || flags.length >= 2) {
        if (commDelaySeconds > 180) {
          // Mars transit: Speed of light delay requires autonomous self-sufficiency
          triageLevel = 'CREW_MEDICAL_OFFICER';
          urgency = 'ELEVATED';
          rationale = `Complex multi-factor fatigue (sleep collapse + CO2 accumulation). One-way radio delay is ${Math.round(commDelaySeconds)}s (${roundTripMins}m round-trip; source pending), making real-time Houston guidance impossible. Per NASA self-sufficiency doctrine, Crew Medical Officer (CMO) handles in-flight intervention.`;
          proposedAction = 'CMO intervention: 1. Cycle Amine Bed scrubber. 2. Enforce 480nm evening circadian blackout. 3. Transmit store-and-forward telemetry packet for Flight Surgeon queue.';
        } else {
          // Short delay (LEO / ISS / Early Lunar): ground can consult
          triageLevel = 'FLIGHT_SURGEON';
          urgency = 'ELEVATED';
          rationale = `Compounding flags detected. Short transmission delay (${commDelaySeconds}s; source pending) enables near-real-time Ground Flight Surgeon tele-consultation.`;
          proposedAction = 'Transmit high-priority medical packet and wait for telemetry review from MCC-Houston.';
        }
      } else if (flags.length === 1) {
        triageLevel = 'SELF_TREAT';
        urgency = 'ROUTINE';
        rationale = `Single mild baseline deviation. Manageable with standard autonomous onboard crew procedures.`;
        proposedAction = 'Follow standard crew checklist countermeasure and log check-in tomorrow.';
      } else {
        triageLevel = 'SELF_TREAT';
        urgency = 'ROUTINE';
        rationale = 'All vitals and cabin environmental sensors align with nominal personal baseline.';
        proposedAction = 'Maintain standard exercise regimen (1.5 hrs/day) and scheduled sleep hygiene.';
      }

      return {
        triageLevel,
        urgency,
        directGroundLinkRequired: directGroundLink,
        rationale,
        flags,
        proposedAction,
        commDelaySeconds
      };
    }
  };

  window.TriageEngine = TriageEngine;
})(window);
