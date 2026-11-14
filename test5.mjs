import { sampleAlert } from "./src/sample_alert.js";
import { handleAlert } from "./src/pipeline.js";
import { onChange, setLink, config } from "./src/queue.js";
import { LINK_PRESETS } from "./src/sources.js";

config.failRate = 0;
config.speedup = 600;
onChange(q => console.log("  queue:", q.map(e => `${e.packet.packet_id} ${e.packet.status}`).join(" | ")));

const ctx = {
  missionDay: 40, current: { sleep_h: 5.1 }, baseline: { sleep_h: 7.4 },
  trend7: [6.8, 6.5, 6.0, 5.8, 5.5, 5.3, 5.1], trend30: [7.4, 7.3, 7.4, 7.2, 6.9, 6.1, 5.1],
  cabin: { co2: 1800 }, countermeasure: "Fix sleep schedule, review CO2 scrubber"
};
const link = { available: true, delay_s: LINK_PRESETS.MARS_MID.delay_s };

console.log("1) serious alert, Mars average link");
let r = handleAlert(sampleAlert, ctx, { onboardSupport: true, link });
console.log("  ->", r.decision.path, r.decision.delivery, r.packet?.packet_id);

console.log("2) mild alert");
r = handleAlert({ ...sampleAlert, id: "A-002", severity: 0, persisted_days: 1, worsening: false },
                ctx, { onboardSupport: true, link });
console.log("  ->", r.decision.path, r.decision.delivery, r.packet);

console.log("3) serious alert, link down");
r = handleAlert({ ...sampleAlert, id: "A-003" }, ctx,
                { onboardSupport: true, link: { available: false, delay_s: 750 } });
console.log("  ->", r.decision.path, r.decision.delivery, r.packet?.packet_id);

setTimeout(() => { console.log("--- link wapas aaya ---"); setLink(link); }, 4000);