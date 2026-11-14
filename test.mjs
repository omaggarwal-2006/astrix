import { sampleAlert } from "./sample_alert.js";
import { triage } from "./triage.js";

console.log(triage(sampleAlert, { onboardSupport: true, link: { available: true, delay_s: 600 } }));
console.log(triage(sampleAlert, { onboardSupport: true, link: { available: false, delay_s: 0 } }));