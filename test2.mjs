import { sampleAlert } from "./src/sample_alert.js";
import { triage } from "./src/triage.js";
import { buildPacket, verifyPacket } from "./src/packet.js";

const ctx = {
  missionDay: 40,
  current: { sleep_h: 5.1, mood: 4 },
  baseline: { sleep_h: 7.4, mood: 7 },
  trend7: [6.8, 6.5, 6.0, 5.8, 5.5, 5.3, 5.1],
  trend30: [7.4, 7.3, 7.4, 7.2, 6.9, 6.1, 5.1],
  cabin: { co2: 1800, temp: 23, noise: 52 },
  countermeasure: "Fix sleep schedule, reduce evening workload, review CO2 scrubber"
};

const decision = triage(sampleAlert, { onboardSupport: true, link: { available: true, delay_s: 600 } });
const packet = buildPacket(sampleAlert, decision, ctx, 1);

console.log(packet);
console.log("Size (bytes):", JSON.stringify(packet).length);
console.log("Valid:", verifyPacket(packet));

packet.readings.sleep_h = 8;          // tampering
console.log("Valid after tampering:", verifyPacket(packet));