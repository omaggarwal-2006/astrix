import { SOURCES, NUMBERS, LINK_PRESETS, ASSUMPTIONS, DISCLAIMER } from "./src/sources.js";

console.log("Sources:", SOURCES.length);
console.log("Bone loss:", NUMBERS.bone_loss_pct_per_month);
console.log("Mars far delay (s):", LINK_PRESETS.MARS_FAR.delay_s);
console.log("Assumptions:", ASSUMPTIONS.length);
console.log(DISCLAIMER);