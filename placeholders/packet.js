/**
 * LANDFALL Placeholders - packet.js
 * Store-and-Forward Telemetry Packet Generator & Transmission Simulator
 * Models asynchronous deep-space store-and-forward communication
 */

(function(window) {
  'use strict';

  let packetCounter = 840;

  const PacketEngine = {
    /**
     * Build standard telemetry packet from active telemetry and triage state
     */
    buildPacket(dayNumber, telemetry, triageResult) {
      packetCounter += 1;
      const vitals = telemetry.vitals || {};
      const cabin = telemetry.cabin || {};
      const delaySec = triageResult.commDelaySeconds || 128;

      const packetId = `ARES6-MED-D${String(dayNumber).padStart(3, '0')}-${packetCounter}`;
      const now = new Date();
      const timestamp = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

      const dataSummary = [
        `HR: ${vitals.heartRate || 64} bpm`,
        `BP: ${vitals.bloodPressure ? vitals.bloodPressure.systolic + '/' + vitals.bloodPressure.diastolic : '116/76'} mmHg`,
        `Sleep: ${vitals.sleepHours || 7.4} h`,
        `Mood: ${vitals.mood || 4.2}/5`,
        `Cabin CO2: ${cabin.co2 || 2800} ppm`,
        `Cum. Rad: ${telemetry.radiation ? telemetry.radiation.cumulativeDose : 59.2} mSv`
      ].join(' | ');

      const trend = triageResult.flags.length > 0
        ? triageResult.flags.map(f => f.message).join(' ')
        : 'Telemetry operating within calibrated ±1σ personal baseline tolerances.';

      return {
        packetId,
        timestamp,
        transitDay: dayNumber,
        oneWayDelaySeconds: delaySec,
        dataSummary,
        trendAnalysis: trend,
        triageDecision: triageResult.triageLevel,
        urgency: triageResult.urgency,
        proposedAction: triageResult.proposedAction,
        status: 'QUEUED' // 'QUEUED' | 'TRANSMITTING' | 'ACKNOWLEDGED'
      };
    },

    /**
     * Simulate transmission of the packet with countdown
     */
    simulateTransmission(packet, onProgress, onComplete) {
      packet.status = 'TRANSMITTING';
      // In demo mode or UI, speed up actual seconds so astronaut/judge doesn't wait 10 actual minutes,
      // but show the real simulated flight countdown clearly!
      const totalSimSeconds = packet.oneWayDelaySeconds;
      let remainingSimSeconds = totalSimSeconds;
      const stepDuration = 200; // ms per tick
      const decrementPerTick = Math.max(1, Math.round(totalSimSeconds / 25)); // 25 ticks total (~5 seconds real-time)

      onProgress(packet, remainingSimSeconds);

      const timer = setInterval(() => {
        remainingSimSeconds -= decrementPerTick;
        if (remainingSimSeconds <= 0) {
          remainingSimSeconds = 0;
          clearInterval(timer);
          packet.status = 'ACKNOWLEDGED';
          onComplete(packet);
        } else {
          onProgress(packet, remainingSimSeconds);
        }
      }, stepDuration);

      return timer;
    }
  };

  window.PacketEngine = PacketEngine;
})(window);
