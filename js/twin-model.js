/**
 * LANDFALL 2.0 - Deterministic Digital Twin Physiological & Gamification Engine (js/twin-model.js)
 * Implements:
 * 1. 11-Region Anatomical Digital Twin Baseline & Current Integrity Math
 * 2. 4 Exploded Tissue Layers (Bone, Muscle, Skin, Vascular/Neural)
 * 3. Storyline Checkpoints (Days 1-14 baseline, Day 40 sleep collapse, Day 44-55 cascade, Day 49 9-day drift, Day 95-98 CO2 spike)
 * 4. Sober Gamification XP (0-1000), Tiers I/II/III, Quests, Discovery Badges
 * 5. Fictional Astronaut Profile: "Cmdr. A. Vance (fictional synthetic profile)"
 */

export const ASTRONAUT_PROFILE = {
  name: "Cmdr. A. Vance",
  type: "Fictional synthetic astronaut profile",
  baselineLockDays: "Days 1\u201314 calibrated pre-flight baseline",
  crewRole: "Mission Commander / Payload Specialist",
  mission: "Ares-VI Mars Transit"
};

export const BODY_REGIONS = [
  { id: "head_neuro", name: "Head & Neuro-Ocular", category: "upper", systems: "Vestibular balance, sleep/circadian rhythm, neuro-ocular (SANS)" },
  { id: "chest_cardio", name: "Chest & Cardio-Immune", category: "upper", systems: "Resting HR drift, BP response, respiratory, immune lymph nodes" },
  { id: "core_spine", name: "Core & Lumbar Spine", category: "axial", systems: "Spinal disc elongation, core musculature, metabolic/nutrition" },
  { id: "left_arm", name: "Left Arm", category: "upper", systems: "Humerus, radius/ulna, biceps/triceps strength, dermal barrier" },
  { id: "right_arm", name: "Right Arm", category: "upper", systems: "Humerus, radius/ulna, biceps/triceps strength, dermal barrier" },
  { id: "left_hand", name: "Left Hand & Wrist", category: "upper", systems: "Carpals, metacarpals, phalanges, fine-motor grip and skin" },
  { id: "right_hand", name: "Right Hand & Wrist", category: "upper", systems: "Carpals, metacarpals, phalanges, fine-motor grip and skin" },
  { id: "left_leg", name: "Left Leg (Femur/Tibia)", category: "lower", systems: "Weight-bearing bone density, quadriceps/calf volume, perfusion" },
  { id: "right_leg", name: "Right Leg (Femur/Tibia)", category: "lower", systems: "Weight-bearing bone density, quadriceps/calf volume, perfusion" },
  { id: "left_foot", name: "Left Foot & Ankle", category: "lower", systems: "Calcaneus bone density, plantar mechanoreceptors, arch tendons" },
  { id: "right_foot", name: "Right Foot & Ankle", category: "lower", systems: "Calcaneus bone density, plantar mechanoreceptors, arch tendons" }
];

export const TISSUE_LAYERS = ["BONE", "MUSCLE", "SKIN", "VASCULAR_NERVE"];

/**
 * Computes regional integrity percentage relative to 100.0% personal baseline
 * Formula: IntegrityPct = clamp(100.0 - lossPct, 50.0, 100.0)
 */
export function getRegionIntegrity(regionId, day, whatIf = {}) {
  const adherence = whatIf.exerciseHours !== undefined ? Math.min(1.0, whatIf.exerciseHours / 1.5) : 0.8;
  const targetBoost = (whatIf.targetedRegionBoost && whatIf.targetedRegionBoost[regionId]) || 0;
  const vitD = whatIf.nutritionVitD ? 0.3 : 0;
  const sleepProt = whatIf.noiseAndSleepProtocol ? 0.5 : 0;

  // Baseline window (Days 1-14) is locked at 100%
  if (day <= 14) {
    return {
      currentPct: 100.0,
      baselinePct: 100.0,
      lossPct: 0.0,
      projectedDay180Pct: 100.0,
      status: "nominal",
      shape: "circle",
      word: "NOMINAL"
    };
  }

  // Weight-bearing lower extremities and axial spine lose more under microgravity
  const isLower = ["left_leg", "right_leg", "left_foot", "right_foot"].includes(regionId);
  const isSpine = regionId === "core_spine";
  const isHead = regionId === "head_neuro";
  const isChest = regionId === "chest_cardio";

  // Base physiological loss rate per month (30 days)
  let baseLossPerMonth = 0.4; // Upper extremities (~0.4%/mo)
  if (isLower) baseLossPerMonth = 1.25; // Lower limbs: NASA HRP 1.0 - 1.5%/mo
  if (isSpine) baseLossPerMonth = 0.95; // Spine disc deconditioning
  if (isHead) baseLossPerMonth = 0.70;  // Circadian & neuro-ocular strain
  if (isChest) baseLossPerMonth = 0.60; // Cardiovascular deconditioning

  // Storyline acute drift factors
  let storyPenalty = 0;
  if (day >= 40 && day <= 55) {
    // Days 40-55: Acute sleep collapse & cascade
    if (isHead) storyPenalty += 4.5 * Math.max(0, 1 - Math.abs(day - 49) / 10);
    if (isChest) storyPenalty += 2.0 * Math.max(0, 1 - Math.abs(day - 49) / 10);
    if (isLower) storyPenalty += 1.8 * Math.max(0, 1 - Math.abs(day - 49) / 10);
  }
  if (day >= 95 && day <= 98) {
    // Days 95-98: CO2 spike (4750 ppm)
    if (isHead) storyPenalty += 2.8;
  }

  // Countermeasure mitigation factor (0.0 = unmitigated, up to 0.75 mitigation)
  const mitigation = Math.min(0.85, (adherence * 0.65) + vitD + sleepProt + (targetBoost * 0.05));
  const effectiveLossPerMonth = baseLossPerMonth * (1.0 - mitigation);

  const monthsElapsed = (day - 14) / 30;
  const cumulativeLoss = (effectiveLossPerMonth * monthsElapsed) + storyPenalty;
  const currentPct = +(Math.max(50.0, Math.min(100.0, 100.0 - cumulativeLoss))).toFixed(1);
  const lossPct = +(100.0 - currentPct).toFixed(1);

  // Projected Day 180 under current what-if settings
  const totalMonths = (180 - 14) / 30;
  const projectedLoss = effectiveLossPerMonth * totalMonths;
  const projectedDay180Pct = +(Math.max(50.0, Math.min(100.0, 100.0 - projectedLoss))).toFixed(1);

  // Thresholds: >= 96.0% nominal, 92.0-95.9% drift, < 92.0% critical
  let status = "nominal";
  let shape = "circle";
  let word = "NOMINAL";
  if (currentPct < 92.0) {
    status = "alarm";
    shape = "diamond";
    word = "CRITICAL";
  } else if (currentPct < 96.0) {
    status = "caution";
    shape = "triangle";
    word = "DRIFT";
  }

  return {
    currentPct,
    baselinePct: 100.0,
    lossPct,
    projectedDay180Pct,
    status,
    shape,
    word
  };
}

/**
 * Computes exploded tissue layer status for a specific region
 */
export function getTissueIntegrity(regionId, layer, day, whatIf = {}) {
  const reg = getRegionIntegrity(regionId, day, whatIf);
  const basePct = reg.currentPct;

  let delta = 0;
  let mechanism = "";
  let procedure = "";
  let escalation = "";

  if (layer === "BONE") {
    delta = regionId.includes("leg") || regionId.includes("foot") ? -1.2 : 0.4;
    mechanism = "Microgravity unloads trabecular bone matrix, increasing osteoclast resorption (NASA HRP 1.0\u20131.5%/mo).";
    procedure = "Inspect single-leg heel-rise stability, axial resistance tolerance, and calcaneal acoustic velocity.";
    escalation = "If bone integrity drops < 92.0%, escalate to Crew Medical Officer for ARED-II load recalibration.";
  } else if (layer === "MUSCLE") {
    delta = regionId.includes("leg") ? -0.8 : -0.2;
    mechanism = "Slow-twitch postural fiber atrophy (soleus and gastrocnemius) secondary to lack of gravitational resistance.";
    procedure = "Assess isometric quadriceps/calf maximum voluntary contraction and fine pedal motor control.";
    escalation = "If muscle integrity drops < 92.0%, schedule CMO evaluation and cycle ergometer resistance surge.";
  } else if (layer === "SKIN") {
    delta = 1.0;
    mechanism = "Cabin atmospheric low humidity and friction from suit pressure garments stress epidermal barrier.";
    procedure = "Palpate palmar/plantar cutaneous integrity, inspect for friction erythema, and verify topical hydration.";
    escalation = "Manage via Self-Care topical barrier regimens. Escalate to CMO if bacterial/fungal skin lesions arise.";
  } else if (layer === "VASCULAR_NERVE") {
    delta = regionId.includes("head") ? -1.8 : 0.2;
    mechanism = "Cephalad fluid redistribution and reduced autonomic baroreflex buffering upon orthostatic stress.";
    procedure = "Measure standing vs supine BP delta, check for lower-limb venous pooling, and verify proprioceptive balance.";
    escalation = "If severe orthostatic intolerance is noted during landing prep, escalate to Flight Surgeon for G-suit protocol.";
  }

  const currentPct = +(Math.max(50.0, Math.min(100.0, basePct + delta))).toFixed(1);
  const lossPct = +(100.0 - currentPct).toFixed(1);

  let status = "nominal";
  let shape = "circle";
  let word = "NOMINAL";
  if (currentPct < 92.0) {
    status = "alarm";
    shape = "diamond";
    word = "CRITICAL";
  } else if (currentPct < 96.0) {
    status = "caution";
    shape = "triangle";
    word = "DRIFT";
  }

  return {
    layer,
    regionId,
    currentPct,
    baselinePct: 100.0,
    lossPct,
    mechanism,
    procedure,
    escalation,
    status,
    shape,
    word
  };
}

/**
 * Calculates Sober Gamification XP (0-1000) & Rank Tier
 * 60% weighted 6 landing dimensions + 25% countermeasure adherence + 15% completed scans
 */
export function calculateCrewReadinessXP(forecastList, whatIf, completedScansCount = 3) {
  if (!forecastList || forecastList.length === 0) return { xp: 850, tier: "TIER I \u2014 OPTIMAL LANDING READINESS", shape: "circle" };

  const avgMid = forecastList.reduce((acc, f) => acc + f.landing.mid, 0) / forecastList.length;
  const dimsScore = (avgMid / 100) * 600; // 0 to 600 points (60%)

  const adherenceFraction = Math.min(1.0, (whatIf.exerciseHours ?? 1.2) / 1.5);
  const adherenceScore = adherenceFraction * 250; // 0 to 250 points (25%)

  const scansFraction = Math.min(1.0, completedScansCount / 5);
  const scansScore = scansFraction * 150; // 0 to 150 points (15%)

  const totalXP = Math.round(Math.max(0, Math.min(1000, dimsScore + adherenceScore + scansScore)));

  let tier = "TIER I \u2014 OPTIMAL LANDING READINESS";
  let shape = "circle";
  let status = "nominal";

  if (totalXP < 650) {
    tier = "TIER III \u2014 FLIGHT SURGEON ESCALATION";
    shape = "diamond";
    status = "alarm";
  } else if (totalXP < 850) {
    tier = "TIER II \u2014 ELEVATED DRIFT WATCH";
    shape = "triangle";
    status = "caution";
  }

  return {
    xp: totalXP,
    tier,
    shape,
    status,
    breakdown: {
      dimensions: Math.round(dimsScore),
      adherence: Math.round(adherenceScore),
      scans: Math.round(scansScore)
    }
  };
}
