import { sampleAlert } from "./sample_alert.js";
import { triage } from "./triage.js";
import { buildPacket } from "./packet.js";
import { enqueue, setLink, onChange, config } from "./queue.js";

config.failRate = 0;        // pehle bina failure ke dekho
config.speedup = 600;       // 600 s delay ~ 2 s ka ACK

onChange(q => console.log(q.map(e => `${e.packet.packet_id} ${e.packet.status}`).join(" | ")));

const ctx = {
  missionDay: 40, current: { sleep_h: 5.1 }, baseline: { sleep_h: 7.4 },
  trend7: [6.8, 6.5, 6.0, 5.8, 5.5, 5.3, 5.1], trend30: [7.4, 7.3, 7.4, 7.2, 6.9, 6.1, 5.1],
  cabin: { co2: 1800 }, countermeasure: "Fix sleep schedule, review CO2 scrubber"
};

setLink({ available: false, delay_s: 600 });                       // link band
const decision = triage(sampleAlert, { onboardSupport: true, link: { available: false, delay_s: 600 } });
enqueue(buildPacket(sampleAlert, decision, ctx, 1));

setTimeout(() => {
  console.log("--- link wapas aaya ---");
  setLink({ available: true, delay_s: 600 });
}, 1500);