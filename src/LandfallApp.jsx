import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, Shield, AlertTriangle, ArrowRight, RotateCw, Play, Pause,
  Radio, CheckCircle2, ChevronRight, RefreshCw, ZoomIn, Eye, Heart,
  Thermometer, Wind, Volume2, Award, Zap, Compass, Info, Terminal, Copy,
  Check, X, FileText, Send, Clock
} from "lucide-react";

// ============================================================================
// 1. DETERMINISTIC PRNG (Mulberry32) & 180-DAY DATASET GENERATOR
// ============================================================================
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateMissionDataset() {
  const prng = mulberry32(20261114);
  const dataset = [];

  for (let d = 1; d <= 180; d++) {
    const isBaseline = d <= 14;
    const isDay40Shock = d >= 40 && d <= 43;
    const isCascade = d >= 44 && d <= 55;
    const isDay49Peak = d === 49;
    const isCo2Spike = d >= 95 && d <= 98;

    let noise = 58.0 + (prng() - 0.5) * 2;
    let workload = 5.2 + (prng() - 0.5) * 0.8;
    let co2 = 2400 + Math.floor((prng() - 0.5) * 200);
    let sleepHours = 7.4 + (prng() - 0.5) * 0.4;
    let rhr = 62.0 + (prng() - 0.5) * 1.5;
    let mood = 7.8 + (prng() - 0.5) * 0.4;
    let stress = 3.5 + (prng() - 0.5) * 0.6;
    let exerciseMin = 90 + Math.floor((prng() - 0.5) * 8);
    const symptoms = [];

    if (isDay40Shock) {
      noise = 68.5;
      workload = 8.5;
      sleepHours = 5.1;
      stress = 6.2;
      symptoms.push("fatigue");
    } else if (isCascade) {
      noise = 66.0;
      workload = 7.8;
      sleepHours = 5.1 + (prng() - 0.5) * 0.2;
      mood = 4.8 + (prng() - 0.5) * 0.4;
      stress = 7.9 + (prng() - 0.5) * 0.4;
      rhr = 69.5 + (prng() - 0.5) * 1.0;
      exerciseMin = 42;
      symptoms.push("fatigue", "headache");
    } else if (isCo2Spike) {
      co2 = 4750;
      symptoms.push("headache");
    }

    dataset.push({
      day: d,
      vitals: { restingHR: +rhr.toFixed(1), bpSys: 118, bpDia: 76, bodyTemp: 36.6 },
      sleep: { hours: +sleepHours.toFixed(1), quality: isCascade ? 4.1 : 8.2, mood: +mood.toFixed(1), stress: +stress.toFixed(1), workload: +workload.toFixed(1) },
      musculoskeletal: { exerciseMinutes: exerciseMin },
      cabin: { co2, noise: +noise.toFixed(1), temp: 21.5, humidity: 44 },
      radiation: { daily: 0.32, cumulative: +(d * 0.32).toFixed(1) },
      symptoms
    });
  }
  return dataset;
}

const MISSION_DATA = generateMissionDataset();

// 11 Anatomical Body Regions
const REGIONS = [
  { id: "head_neuro", name: "Head & Neuro-Ocular", baseLossRate: 0.65, systems: "Vestibular balance, circadian rhythm, neuro-ocular (SANS)" },
  { id: "chest_cardio", name: "Chest & Cardio-Immune", baseLossRate: 0.55, systems: "Autonomic baroreflex, resting HR drift, immune lymphatics" },
  { id: "core_spine", name: "Core & Lumbar Spine", baseLossRate: 0.95, systems: "Spinal elongation, core posture, disc spacing" },
  { id: "left_arm", name: "Left Arm", baseLossRate: 0.35, systems: "Humerus/radius bone, bicep grip endurance" },
  { id: "right_arm", name: "Right Arm", baseLossRate: 0.35, systems: "Humerus/radius bone, bicep grip endurance" },
  { id: "left_hand", name: "Left Hand & Wrist", baseLossRate: 0.25, systems: "Carpals, metacarpals, fine-motor dexterity" },
  { id: "right_hand", name: "Right Hand & Wrist", baseLossRate: 0.25, systems: "Carpals, metacarpals, fine-motor dexterity" },
  { id: "left_leg", name: "Left Leg (Femur/Tibia)", baseLossRate: 1.35, systems: "Weight-bearing trabecular bone, quadricep & soleus volume" },
  { id: "right_leg", name: "Right Leg (Femur/Tibia)", baseLossRate: 1.35, systems: "Weight-bearing trabecular bone, quadricep & soleus volume" },
  { id: "left_foot", name: "Left Foot & Ankle", baseLossRate: 1.15, systems: "Calcaneus mineral density, plantar mechanoreceptors" },
  { id: "right_foot", name: "Right Foot & Ankle", baseLossRate: 1.15, systems: "Calcaneus mineral density, plantar mechanoreceptors" }
];

// 4 Exploded Tissue Layers
const TISSUE_SPECS = {
  BONE: {
    name: "Bones & Mineral Lattice",
    lossDelta: -0.4,
    mechanism: "Microgravity osteoclast resorption without axial skeletal loading (NASA HRP 1.0-1.5%/mo).",
    procedure: "Single-leg heel-rise stability, axial resistance tolerance, calcaneal acoustic velocity check.",
    escalation: "If bone integrity drops < 92.0%, escalate to Crew Medical Officer for ARED-II load recalibration."
  },
  MUSCLE: {
    name: "Muscle & Contractile Fibers",
    lossDelta: -0.2,
    mechanism: "Slow-twitch postural fiber atrophy due to unweighted limb mechanics.",
    procedure: "Isometric quadriceps/calf maximum voluntary contraction and fine pedal motor check.",
    escalation: "If muscle integrity drops < 92.0%, schedule CMO evaluation and cycle ergometer surge."
  },
  SKIN: {
    name: "Dermal & Epidermal Barrier",
    lossDelta: +0.6,
    mechanism: "Friction from suit pressure garments and low humidity cabin stress.",
    procedure: "Palpate palmar/plantar cutaneous integrity, inspect friction erythema, verify hydration.",
    escalation: "Manage via Self-Care topical barrier regimens. Escalate to CMO if lesions worsen."
  },
  VASCULAR_NERVE: {
    name: "Vascular & Sensorimotor",
    lossDelta: -0.1,
    mechanism: "Cephalad fluid redistribution and altered baroreceptor compliance.",
    procedure: "Standing vs supine BP delta, check lower-limb venous pooling, verify proprioceptive balance.",
    escalation: "If orthostatic intolerance persists, escalate to Flight Surgeon for G-suit protocol."
  }
};

// 6 Landing-Day Forecast Dimensions
const FORECAST_DIMENSIONS = [
  { key: "bone", name: "Bone Mineral Density", publishedLoss: "1.0 - 1.5% / month (NASA HRP)", unit: "%", nominalFloor: 92 },
  { key: "muscle", name: "Aerobic & Muscle Strength", publishedLoss: "10 - 12% average loss", unit: "%", nominalFloor: 88 },
  { key: "cardio", name: "Cardiovascular Regulation", publishedLoss: "Resting HR drift + baroreflex", unit: "pts", nominalFloor: 85 },
  { key: "balance", name: "Sensorimotor & Balance", publishedLoss: "Neuro-vestibular adaptation", unit: "pts", nominalFloor: 82 },
  { key: "sleep", name: "Sleep & Circadian Alignment", publishedLoss: "Acoustic + circadian desynchrony", unit: "h/night", nominalFloor: 7.0 },
  { key: "behavioral", name: "Behavioral Health & Mood", publishedLoss: "Confinement & isolation fatigue", unit: "pts", nominalFloor: 80 }
];

// Simple FNV-1a Hash for Checksum
function fnv1a(str) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return ("0000000" + (hash >>> 0).toString(16)).substr(-8).toUpperCase();
}

// ============================================================================
// 2. MAIN APPLICATION: LANDFALL 2.0
// ============================================================================
export default function LandfallApp() {
  const [currentDay, setCurrentDay] = useState(49);
  const [isPlaying, setIsPlaying] = useState(false);
  const [envMode, setEnvMode] = useState("MARS");
  const [zoomLevel, setZoomLevel] = useState(0); // 0=Env, 1=Body, 2=Exploded, 3=MicroLab
  const [bodyOrientation, setBodyOrientation] = useState("FRONT");
  const [selectedRegionId, setSelectedRegionId] = useState("right_leg");
  const [selectedTissue, setSelectedTissue] = useState("BONE");
  const [evaSuitOpened, setEvaSuitOpened] = useState(false);
  const [activeTab, setActiveTab] = useState("ALERTS");
  const [toastMsg, setToastMsg] = useState(null);

  // Micro-Lab Live Controls State
  const [microAredKg, setMicroAredKg] = useState(180);
  const [microCyclePct, setMicroCyclePct] = useState(100);
  const [microVitD, setMicroVitD] = useState(true);

  // What-If Countermeasure Simulator State
  const [whatIf, setWhatIf] = useState({
    activePreset: "status_quo",
    exerciseMinutes: 42,
    noiseSleepProtocol: false,
    workloadCap: false,
    nutritionVitD: false
  });

  // DTN Telemetry Queue
  const [dtPackets, setDtPackets] = useState([
    {
      id: "DTN-MARS-SOL049-001",
      timestamp: "Day 49, 14:22:08 UTC",
      anomaly: "Sleep 5.1 h vs 7.4 h baseline (-31%), persisting 9 days",
      severity: "CRITICAL",
      pathway: "CREW MEDICAL OFFICER",
      latency: "14m 20s",
      status: "ACKNOWLEDGED",
      checksum: "8F9B2C1A",
      reply: "Flight Surgeon ACK: Confirm circadian entrainment + acoustic baffling protocol."
    }
  ]);
  const [isTransmitting, setIsTransmitting] = useState(false);

  // Timeline Auto-Advance Loop
  useEffect(() => {
    let timer;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentDay((prev) => (prev >= 180 ? 1 : prev + 1));
      }, 800);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  // Keyboard Escape Handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setZoomLevel((prev) => Math.max(0, prev - 1));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Current Day Record
  const dayRecord = MISSION_DATA[currentDay - 1] || MISSION_DATA[0];

  // Deterministic Regional Integrity Computation
  const computeRegionIntegrity = (regId, day, wIf) => {
    if (day <= 14) return 100.0;
    const reg = REGIONS.find((r) => r.id === regId) || REGIONS[0];
    const adherence = wIf.exerciseMinutes / 90.0;
    const mitigation = Math.min(0.85, adherence * 0.65 + (wIf.nutritionVitD ? 0.15 : 0) + (wIf.noiseSleepProtocol ? 0.1 : 0));
    const effectiveLossPerMo = reg.baseLossRate * (1 - mitigation);
    const months = (day - 14) / 30;

    let storyPenalty = 0;
    if (day >= 40 && day <= 55) {
      const dist = 1 - Math.abs(day - 49) / 10;
      if (dist > 0) {
        if (regId.includes("leg") || regId.includes("foot")) storyPenalty += 2.2 * dist;
        if (regId.includes("head")) storyPenalty += 3.8 * dist;
      }
    }
    const loss = effectiveLossPerMo * months + storyPenalty;
    return +Math.max(50.0, Math.min(100.0, 100.0 - loss)).toFixed(1);
  };

  const selectedRegion = REGIONS.find((r) => r.id === selectedRegionId) || REGIONS[7];
  const regionIntegrity = computeRegionIntegrity(selectedRegion.id, currentDay, whatIf);
  const lossPct = +(100.0 - regionIntegrity).toFixed(1);

  // Status Styling Generator
  const getStatusBadge = (pct) => {
    if (pct >= 96.0) return { color: "#10B981", bg: "rgba(16, 185, 129, 0.15)", text: "NOMINAL", icon: "●" };
    if (pct >= 92.0) return { color: "#F59E0B", bg: "rgba(245, 158, 11, 0.15)", text: "DRIFT", icon: "▲" };
    return { color: "#EF4444", bg: "rgba(239, 68, 68, 0.2)", text: "CRITICAL", icon: "◆" };
  };

  // Readiness XP (0 - 1000)
  const totalXP = useMemo(() => {
    const avgIntegrity = REGIONS.reduce((acc, r) => acc + computeRegionIntegrity(r.id, currentDay, whatIf), 0) / REGIONS.length;
    const adherenceScore = Math.min(1.0, whatIf.exerciseMinutes / 90.0) * 250;
    const baseScore = (avgIntegrity / 100) * 600;
    const bonus = whatIf.noiseSleepProtocol ? 150 : 50;
    return Math.round(baseScore + adherenceScore + bonus);
  }, [currentDay, whatIf]);

  // Environment Telemetry Config
  const envMeta = {
    MARS: { delay: "14m 20s DTN", gravity: "0.38 g", tag: "MARS TRANSIT", rad: "30.4 mSv" },
    ISS: { delay: "0.01s Live", gravity: "0.00 g", tag: "LEO ORBIT", rad: "12.8 mSv" },
    MOON: { delay: "1.3s Delay", gravity: "0.165 g", tag: "LUNAR ARTEMIS", rad: "21.6 mSv" },
    EVA_SUIT: { delay: "0.05s Relay", gravity: "Microgravity", tag: "DEEP SPACE EVA", rad: "1.4 mSv/hr" }
  }[envMode];

  // Preset Handlers
  const applyPreset = (presetKey) => {
    if (presetKey === "status_quo") {
      setWhatIf({ activePreset: "status_quo", exerciseMinutes: 42, noiseSleepProtocol: false, workloadCap: false, nutritionVitD: false });
      showToast("Applied Preset: Status Quo (Unmitigated)");
    } else if (presetKey === "nasa_full_protocol") {
      setWhatIf({ activePreset: "nasa_full_protocol", exerciseMinutes: 90, noiseSleepProtocol: true, workloadCap: true, nutritionVitD: true });
      showToast("Applied Preset: NASA Full Countermeasure Protocol (+150 XP)");
    } else if (presetKey === "high_stress_drift") {
      setWhatIf({ activePreset: "high_stress_drift", exerciseMinutes: 20, noiseSleepProtocol: false, workloadCap: false, nutritionVitD: false });
      showToast("Applied Preset: High-Stress Deconditioning Drift");
    }
  };

  // DTN Transmit Action
  const handleTransmitPacket = () => {
    setIsTransmitting(true);
    const newPacket = {
      id: `DTN-${envMode}-SOL${String(currentDay).padStart(3, "0")}-${String(dtPackets.length + 1).padStart(3, "0")}`,
      timestamp: `Day ${currentDay}, 16:45:00 UTC`,
      anomaly: currentDay >= 95 && currentDay <= 98 ? "CO₂ 4750 ppm > 4000 ppm threshold" : "Sleep 5.1 h vs 7.4 h baseline (-31%)",
      severity: currentDay >= 44 && currentDay <= 55 ? "CRITICAL" : "CAUTION",
      pathway: envMode === "ISS" ? "LIVE FLIGHT SURGEON" : "CREW MEDICAL OFFICER (DTN)",
      latency: envMeta.delay,
      status: "QUEUED",
      checksum: fnv1a(`PACKET-${currentDay}-${Date.now()}`),
      reply: null
    };

    setDtPackets((prev) => [newPacket, ...prev]);

    setTimeout(() => {
      setDtPackets((prev) =>
        prev.map((p) => (p.id === newPacket.id ? { ...p, status: "TRANSMITTED" } : p))
      );
    }, 1200);

    setTimeout(() => {
      setDtPackets((prev) =>
        prev.map((p) =>
          p.id === newPacket.id
            ? { ...p, status: "ACKNOWLEDGED", reply: "Earth Flight Surgeon ACK: Telemetry logged. Countermeasure approved." }
            : p
        )
      );
      setIsTransmitting(false);
      showToast("DTN Telemetry Packet Acknowledged by Ground!");
    }, 2800);
  };

  return (
    <div className="w-full h-screen bg-[#04070F] text-[#E8E4D8] font-sans flex flex-col overflow-hidden select-none">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-18 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-[#0C111B] border border-[#38BDF8] rounded text-[#38BDF8] text-sm shadow-[0_0_20px_rgba(56,189,248,0.3)] flex items-center gap-2"
          >
            <Zap className="w-4 h-4" /> {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* =====================================================================
          ZONE 1: TOP COMMAND TELEMETRY BAR (64px)
      ====================================================================== */}
      <header className="h-16 px-4 border-b border-[#243044] bg-[#0A1122]/90 backdrop-blur-md flex items-center justify-between z-40">
        
        {/* Brand & Environment Pills */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 pr-3 border-r border-[#243044]">
            <Compass className="w-5 h-5 text-[#38BDF8] animate-pulse" />
            <span className="font-bold tracking-wider text-base text-white">LANDFALL 2.0</span>
            <span className="text-xs px-2 py-0.5 rounded bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/30">
              SOL {String(currentDay).padStart(3, "0")} / 180
            </span>
          </div>

          <div className="flex items-center gap-1 bg-[#05070D] p-1 rounded-md border border-[#243044]">
            {["MARS", "ISS", "MOON", "EVA_SUIT"].map((mode) => (
              <button
                key={mode}
                onClick={() => { setEnvMode(mode); setZoomLevel(0); }}
                className={`px-2.5 py-1 text-xs rounded font-medium transition ${
                  envMode === mode ? "bg-[#38BDF8] text-[#04070F] shadow-[0_0_12px_rgba(56,189,248,0.4)]" : "text-[#CAD5D4] hover:text-white"
                }`}
              >
                {mode.replace("_", " ")}
              </button>
            ))}
          </div>

          {zoomLevel > 0 && (
            <button
              onClick={() => setZoomLevel(0)}
              className="text-xs px-2.5 py-1 rounded border border-[#243044] text-[#CAD5D4] hover:border-[#38BDF8] hover:text-[#38BDF8] flex items-center gap-1 transition"
            >
              <RotateCw className="w-3 h-3" /> Replay Entry
            </button>
          )}
        </div>

        {/* Kinematic Breadcrumb Navigation */}
        <div className="hidden md:flex items-center gap-1.5 text-xs">
          <button onClick={() => setZoomLevel(0)} className="text-[#5FA8D3] hover:underline">
            [{envMode}]
          </button>
          <ChevronRight className="w-3 h-3 text-[#243044]" />
          <button
            onClick={() => setZoomLevel(1)}
            className={`${zoomLevel === 1 ? "text-white font-bold" : "text-[#5FA8D3] hover:underline"}`}
          >
            Full-Body Twin
          </button>
          {zoomLevel >= 2 && (
            <>
              <ChevronRight className="w-3 h-3 text-[#243044]" />
              <button
                onClick={() => setZoomLevel(2)}
                className={`${zoomLevel === 2 ? "text-white font-bold" : "text-[#5FA8D3] hover:underline"}`}
              >
                {selectedRegion.name}
              </button>
            </>
          )}
          {zoomLevel === 3 && (
            <>
              <ChevronRight className="w-3 h-3 text-[#243044]" />
              <span className="text-[#38BDF8] font-bold">{selectedTissue} Micro-Lab</span>
            </>
          )}

          {zoomLevel > 0 && (
            <button
              onClick={() => setZoomLevel((prev) => Math.max(0, prev - 1))}
              className="ml-3 px-2 py-0.5 rounded bg-[#0C111B] border border-[#243044] text-[#CAD5D4] hover:border-[#38BDF8] text-[11px]"
            >
              Zoom Out (Esc)
            </button>
          )}
        </div>

        {/* Readiness XP & Delay Telemetry */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#0C111B] border border-[#243044] px-3 py-1 rounded-md text-xs">
            <Radio className="w-3.5 h-3.5 text-[#F59E0B] animate-pulse" />
            <span className="text-[#CAD5D4]">Comms Delay:</span>
            <span className="font-mono text-[#F59E0B] font-bold">{envMeta.delay}</span>
          </div>

          <div className="flex items-center gap-2 bg-[#0C111B] border border-[#243044] px-3 py-1 rounded-md text-xs">
            <Award className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>XP:</span>
            <span className="font-mono text-[#38BDF8] font-bold">{totalXP} / 1000</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
              totalXP >= 850 ? "bg-[#10B981]/20 text-[#10B981]" : totalXP >= 650 ? "bg-[#F59E0B]/20 text-[#F59E0B]" : "bg-[#EF4444]/20 text-[#EF4444]"
            }`}>
              {totalXP >= 850 ? "TIER I" : totalXP >= 650 ? "TIER II" : "TIER III"}
            </span>
          </div>
        </div>
      </header>

      {/* =====================================================================
          MAIN COCKPIT VIEWPORT (Zones 2, 3, 4)
      ====================================================================== */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ===================================================================
            ZONE 2: LEFT TELEMETRY & BASELINE RAIL (310px)
        ==================================================================== */}
        <aside className="w-[310px] border-r border-[#243044] bg-[#0A1122]/70 flex flex-col p-3 gap-3 overflow-y-auto">
          
          {/* Astronaut Profile Card */}
          <div className="p-3 bg-[#0C111B] border border-[#243044] rounded">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold text-white">Cmdr. A. Vance</span>
              <span className="text-[10px] text-[#CAD5D4] uppercase">Mission Cmdr</span>
            </div>
            <div className="text-[11px] text-[#CAD5D4]">14-Day Baseline Locked • Synthesized Twin</div>
            <div className="mt-2 pt-2 border-t border-[#243044]/60 flex justify-between text-xs font-mono">
              <span>Resting HR: <strong className="text-white">{dayRecord.vitals.restingHR} bpm</strong></span>
              <span>Sleep: <strong className="text-white">{dayRecord.sleep.hours}h</strong></span>
            </div>
          </div>

          {/* Body Region Quick-Jump List */}
          <div className="flex-1 p-3 bg-[#0C111B] border border-[#243044] rounded flex flex-col">
            <span className="text-xs font-bold text-[#CAD5D4] uppercase mb-2 tracking-wide">
              Anatomical Regions (11)
            </span>
            <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
              {REGIONS.map((r) => {
                const integ = computeRegionIntegrity(r.id, currentDay, whatIf);
                const badge = getStatusBadge(integ);
                return (
                  <button
                    key={r.id}
                    onClick={() => { setSelectedRegionId(r.id); setZoomLevel(2); }}
                    className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between border transition ${
                      selectedRegionId === r.id
                        ? "bg-[#38BDF8]/10 border-[#38BDF8] text-white"
                        : "bg-[#05070D] border-transparent hover:border-[#243044] text-[#CAD5D4]"
                    }`}
                  >
                    <span className="truncate pr-2">{r.name}</span>
                    <span className="font-mono font-bold" style={{ color: badge.color }}>
                      {integ}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cabin Environment Mini-Panel */}
          <div className="p-3 bg-[#0C111B] border border-[#243044] rounded text-xs space-y-2">
            <div className="flex justify-between items-center text-[#CAD5D4]">
              <span className="flex items-center gap-1.5"><Wind className="w-3.5 h-3.5" /> Cabin CO₂</span>
              <span className={`font-mono font-bold ${dayRecord.cabin.co2 >= 4500 ? "text-[#EF4444]" : "text-white"}`}>
                {dayRecord.cabin.co2} ppm
              </span>
            </div>
            <div className="flex justify-between items-center text-[#CAD5D4]">
              <span className="flex items-center gap-1.5"><Volume2 className="w-3.5 h-3.5" /> Acoustic Noise</span>
              <span className={`font-mono font-bold ${dayRecord.cabin.noise >= 65 ? "text-[#F59E0B]" : "text-white"}`}>
                {dayRecord.cabin.noise} dBA
              </span>
            </div>
            <div className="flex justify-between items-center text-[#CAD5D4]">
              <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> Cumulative Rad</span>
              <span className="font-mono font-bold text-white">{dayRecord.radiation.cumulative} mSv</span>
            </div>
          </div>

        </aside>

        {/* ===================================================================
            ZONE 3: CENTER INTERACTIVE KINEMATIC VIEWPORT (Flex 1)
        ==================================================================== */}
        <main className="flex-1 relative bg-[#04070F] overflow-hidden flex flex-col items-center justify-center">
          
          {/* Subtle Grid and Biometric Scanlines */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(11,19,43,0.5)_0%,transparent_80%)] pointer-events-none" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

          {/* Floating Back Pill */}
          {zoomLevel > 0 && (
            <button
              onClick={() => setZoomLevel((prev) => Math.max(0, prev - 1))}
              className="absolute top-4 left-4 z-30 px-3 py-1.5 rounded-full bg-[#0C111B]/80 border border-[#38BDF8]/40 text-[#38BDF8] text-xs flex items-center gap-1.5 hover:bg-[#38BDF8]/20 transition"
            >
              ← Zoom Out ({zoomLevel === 1 ? "To Orbit" : zoomLevel === 2 ? "To Body" : "To Tissues"})
            </button>
          )}

          {/* FRONT / BACK Toggle on Level 1 */}
          {zoomLevel === 1 && (
            <button
              onClick={() => setBodyOrientation((prev) => (prev === "FRONT" ? "BACK" : "FRONT"))}
              className="absolute top-4 right-4 z-30 px-3 py-1.5 rounded-full bg-[#0C111B]/80 border border-[#243044] text-[#CAD5D4] text-xs flex items-center gap-1.5 hover:text-white transition"
            >
              <RotateCw className="w-3 h-3" /> Rotate: {bodyOrientation}
            </button>
          )}

          {/* Kinematic Display Router */}
          <div className="w-full h-full flex items-center justify-center p-6">
            
            {/* LEVEL 0: ENVIRONMENT ENTRY SCENE */}
            {zoomLevel === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative w-full max-w-2xl h-[480px] bg-[#0C111B]/80 border border-[#243044] rounded-lg p-6 flex flex-col justify-between"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs text-[#38BDF8] font-mono tracking-widest uppercase">LEVEL 0 // APPROACH</span>
                    <h2 className="text-2xl font-bold text-white mt-1">
                      {envMode === "MARS" && "Mars Orbital Transit (Ares-VI)"}
                      {envMode === "ISS" && "Low Earth Orbit (ISS Med-Bay)"}
                      {envMode === "MOON" && "Artemis Shackleton Surface Dome"}
                      {envMode === "EVA_SUIT" && "NASA xEMU Extravehicular Spacesuit"}
                    </h2>
                  </div>
                  <div className="text-right text-xs font-mono space-y-1 text-[#CAD5D4]">
                    <div>GRAVITY: <strong className="text-white">{envMeta.gravity}</strong></div>
                    <div>RADIATION: <strong className="text-white">{envMeta.rad}</strong></div>
                  </div>
                </div>

                {/* Vector Environment Illustration */}
                <div className="flex-1 flex items-center justify-center relative my-4">
                  {envMode === "MARS" && (
                    <div className="relative w-56 h-56 rounded-full bg-gradient-to-tr from-[#7F1D1D] via-[#C2410C] to-[#EA580C] shadow-[0_0_40px_rgba(234,88,12,0.4)] flex items-center justify-center">
                      <div className="w-48 h-48 rounded-full border border-dashed border-white/20 animate-spin" />
                      <div className="absolute text-xs font-mono text-white/80">0.38 g DESCENT</div>
                    </div>
                  )}

                  {envMode === "ISS" && (
                    <div className="relative w-64 h-32 border border-[#38BDF8]/40 rounded bg-[#05070D]/80 flex items-center justify-around px-4">
                      <div className="w-16 h-8 bg-[#38BDF8]/20 border border-[#38BDF8] text-[10px] flex items-center justify-center">CUPOLA</div>
                      <div className="w-24 h-4 bg-[#F59E0B]/30 border border-[#F59E0B] text-[9px] flex items-center justify-center">SOLAR TRUSS</div>
                    </div>
                  )}

                  {envMode === "MOON" && (
                    <div className="relative w-60 h-36 rounded-t-full border-t-2 border-[#CAD5D4] bg-[#1F2937]/50 flex items-center justify-center">
                      <span className="text-xs text-[#CAD5D4] font-mono">SHACKLETON BASE</span>
                    </div>
                  )}

                  {envMode === "EVA_SUIT" && (
                    <div className="relative w-44 h-64 border-2 border-[#38BDF8]/40 rounded-3xl p-3 flex flex-col justify-between items-center bg-[#05070D]">
                      <div className="w-16 h-12 rounded-full border border-[#F59E0B] bg-[#F59E0B]/20 flex items-center justify-center text-[10px]">VISOR</div>
                      <div className="w-28 h-20 border border-[#38BDF8] text-[10px] flex items-center justify-center text-center">
                        HUT SHELL<br />{evaSuitOpened ? "[SPLIT OPEN]" : "[SEALED]"}
                      </div>
                      <div className="w-24 h-12 border border-white/20 text-[9px] flex items-center justify-center">BOOTS</div>
                    </div>
                  )}
                </div>

                {/* Entry Action CTA */}
                <div className="flex justify-between items-center pt-4 border-t border-[#243044]">
                  <span className="text-xs text-[#CAD5D4]">Initiate biometric scanning to monitor personal landing readiness.</span>
                  {envMode === "EVA_SUIT" ? (
                    <button
                      onClick={() => {
                        setEvaSuitOpened(true);
                        setTimeout(() => setZoomLevel(1), 700);
                      }}
                      className="px-4 py-2 bg-[#38BDF8] text-[#04070F] rounded font-bold text-xs hover:bg-[#7DD3FC] transition flex items-center gap-2"
                    >
                      Unseal & Open Suit →
                    </button>
                  ) : (
                    <button
                      onClick={() => setZoomLevel(1)}
                      className="px-4 py-2 bg-[#38BDF8] text-[#04070F] rounded font-bold text-xs hover:bg-[#7DD3FC] transition flex items-center gap-2"
                    >
                      Initiate Biometric Zoom →
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* LEVEL 1: FULL-BODY DIGITAL TWIN */}
            {zoomLevel === 1 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-center relative w-full h-full"
              >
                <div className="relative w-[340px] h-[520px] flex items-center justify-center">
                  
                  {/* Holographic Calibration Grid Ring */}
                  <div className="absolute inset-0 rounded-full border border-dashed border-[#38BDF8]/20 animate-spin" style={{ animationDuration: "60s" }} />

                  {/* SVG Full-Body Anatomy */}
                  <svg viewBox="0 0 420 760" className="w-full h-full filter drop-shadow-[0_0_15px_rgba(56,189,248,0.15)]">
                    
                    {/* Beating Heart X-Ray Underlay */}
                    <motion.circle
                      cx="210"
                      cy="245"
                      r="14"
                      fill="rgba(239, 68, 68, 0.4)"
                      stroke="#EF4444"
                      strokeWidth="2"
                      animate={{ scale: [1, 1.25, 1], opacity: [0.8, 1, 0.8] }}
                      transition={{ duration: 60 / dayRecord.vitals.restingHR, repeat: Infinity, ease: "easeInOut" }}
                    />

                    {/* 11 Anatomical Regions */}
                    {REGIONS.map((r) => {
                      const integ = computeRegionIntegrity(r.id, currentDay, whatIf);
                      const badge = getStatusBadge(integ);
                      const isSel = selectedRegionId === r.id;

                      let dPath = "";
                      if (r.id === "head_neuro") dPath = "M 210,45 C 175,45 168,75 168,105 C 168,135 180,152 210,152 C 240,152 252,135 252,105 C 252,75 245,45 210,45 Z";
                      else if (r.id === "chest_cardio") dPath = "M 155,165 L 265,165 L 278,285 L 142,285 Z";
                      else if (r.id === "core_spine") dPath = "M 144,290 L 276,290 L 265,390 L 155,390 Z";
                      else if (r.id === "left_arm") dPath = "M 138,170 L 98,275 L 82,370 L 108,375 L 126,285 L 150,195 Z";
                      else if (r.id === "right_arm") dPath = "M 282,170 L 322,275 L 338,370 L 312,375 L 294,285 L 270,195 Z";
                      else if (r.id === "left_hand") dPath = "M 80,375 L 65,420 L 88,430 L 106,380 Z";
                      else if (r.id === "right_hand") dPath = "M 340,375 L 355,420 L 332,430 L 314,380 Z";
                      else if (r.id === "left_leg") dPath = "M 158,396 L 202,396 L 195,540 L 186,655 L 145,655 L 152,535 Z";
                      else if (r.id === "right_leg") dPath = "M 218,396 L 262,396 L 268,535 L 275,655 L 234,655 L 225,540 Z";
                      else if (r.id === "left_foot") dPath = "M 144,660 L 186,660 L 190,710 L 130,710 Z";
                      else if (r.id === "right_foot") dPath = "M 234,660 L 276,660 L 290,710 L 230,710 Z";

                      return (
                        <path
                          key={r.id}
                          d={dPath}
                          fill={isSel ? "rgba(56, 189, 248, 0.4)" : badge.bg}
                          stroke={isSel ? "#38BDF8" : badge.color}
                          strokeWidth={isSel ? 3 : 1.8}
                          className="cursor-pointer transition hover:filter hover:brightness-125"
                          onClick={() => { setSelectedRegionId(r.id); setZoomLevel(2); }}
                        />
                      );
                    })}
                  </svg>
                </div>
              </motion.div>
            )}

            {/* LEVEL 2: REGION FOCUS & EXPLODED TISSUE DISTRIBUTION */}
            {zoomLevel === 2 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-4xl h-[490px] bg-[#0C111B]/90 border border-[#243044] rounded-lg p-5 flex flex-col justify-between"
              >
                <div className="flex justify-between items-center pb-3 border-b border-[#243044]">
                  <div>
                    <span className="text-xs text-[#38BDF8] font-mono">LEVEL 2 // TISSUE EXPLOSION</span>
                    <h3 className="text-xl font-bold text-white">{selectedRegion.name}</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold font-mono" style={{ color: getStatusBadge(regionIntegrity).color }}>
                      {regionIntegrity}% vs 100% Baseline (-{lossPct}%)
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-[#05070D] border border-[#243044]">
                      {getStatusBadge(regionIntegrity).text}
                    </span>
                  </div>
                </div>

                {/* 4 Exploded Tissue Cards */}
                <div className="grid grid-cols-2 gap-3 my-3">
                  {Object.entries(TISSUE_SPECS).map(([key, spec]) => {
                    const tissueInteg = +(regionIntegrity + spec.lossDelta).toFixed(1);
                    const badge = getStatusBadge(tissueInteg);
                    return (
                      <div
                        key={key}
                        onClick={() => { setSelectedTissue(key); setZoomLevel(3); }}
                        className="p-3 bg-[#05070D] border border-[#243044] hover:border-[#38BDF8] rounded cursor-pointer transition flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-sm text-white">{spec.name}</span>
                            <span className="font-mono text-xs font-bold" style={{ color: badge.color }}>
                              {tissueInteg}%
                            </span>
                          </div>
                          <p className="text-[11px] text-[#CAD5D4] leading-relaxed line-clamp-2">
                            {spec.mechanism}
                          </p>
                        </div>
                        <div className="mt-2 pt-2 border-t border-[#243044]/60 flex justify-between items-center text-[10px] text-[#38BDF8]">
                          <span>Click to launch micro-lab</span>
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="text-xs text-[#CAD5D4] flex justify-between items-center pt-2 border-t border-[#243044]">
                  <span>Tracked Systems: {selectedRegion.systems}</span>
                  <button onClick={() => setZoomLevel(1)} className="text-[#38BDF8] hover:underline">
                    ← Back to Full Body
                  </button>
                </div>
              </motion.div>
            )}

            {/* LEVEL 3: GAMIFIED TISSUE MICRO-LAB & COUNTERMEASURE SIMULATOR */}
            {zoomLevel === 3 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-4xl h-[500px] bg-[#0C111B]/95 border border-[#38BDF8]/40 rounded-lg p-5 flex flex-col justify-between"
              >
                <div className="flex justify-between items-center pb-3 border-b border-[#243044]">
                  <div>
                    <span className="text-xs text-[#38BDF8] font-mono">LEVEL 3 // CELLULAR MICRO-LAB</span>
                    <h3 className="text-xl font-bold text-white">{TISSUE_SPECS[selectedTissue].name} — {selectedRegion.name}</h3>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded bg-[#38BDF8]/20 border border-[#38BDF8] text-[#38BDF8] font-bold">
                    Root Cause Identified
                  </span>
                </div>

                {/* Split-View Before/After Microstructural Canvas */}
                <div className="grid grid-cols-2 gap-4 my-2">
                  <div className="bg-[#05070D] border border-[#243044] rounded p-3 text-center">
                    <span className="text-xs text-[#10B981] font-bold">PRE-FLIGHT BASELINE (100.0%)</span>
                    <div className="h-28 mt-2 flex items-center justify-center border border-dashed border-[#10B981]/30 rounded bg-[#10B981]/5">
                      <span className="text-xs font-mono text-[#10B981]">Dense Trabecular Matrix • Intact</span>
                    </div>
                  </div>
                  <div className="bg-[#05070D] border border-[#243044] rounded p-3 text-center">
                    <span className="text-xs text-[#F59E0B] font-bold">CURRENT SOL {currentDay} ({regionIntegrity}%)</span>
                    <div className="h-28 mt-2 flex items-center justify-center border border-dashed border-[#F59E0B]/30 rounded bg-[#F59E0B]/5">
                      <span className="text-xs font-mono text-[#F59E0B]">Trabecular Resorption Pores • Drift</span>
                    </div>
                  </div>
                </div>

                {/* Interactive Targeted Micro-Controls */}
                <div className="bg-[#05070D] border border-[#243044] rounded p-3">
                  <span className="text-xs font-bold text-white mb-2 block">Targeted Countermeasure Recalibration:</span>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="text-[#CAD5D4] block mb-1">ARED-II Axial Load:</label>
                      <input
                        type="range"
                        min="80"
                        max="240"
                        step="10"
                        value={microAredKg}
                        onChange={(e) => {
                          setMicroAredKg(+e.target.value);
                          showToast("+15 XP • ARED-II Axial Load Adjusted");
                        }}
                        className="w-full accent-[#38BDF8]"
                      />
                      <span className="text-[#38BDF8] font-mono">{microAredKg} kg</span>
                    </div>
                    <div>
                      <label className="text-[#CAD5D4] block mb-1">Cycle Ergometer Intensity:</label>
                      <input
                        type="range"
                        min="50"
                        max="140"
                        step="5"
                        value={microCyclePct}
                        onChange={(e) => {
                          setMicroCyclePct(+e.target.value);
                          showToast("+15 XP • Ergometer Resistance Surge");
                        }}
                        className="w-full accent-[#38BDF8]"
                      />
                      <span className="text-[#38BDF8] font-mono">{microCyclePct}%</span>
                    </div>
                    <div className="flex flex-col justify-center">
                      <label className="text-[#CAD5D4] block mb-1">Calcium / Vit-D Protocol:</label>
                      <button
                        onClick={() => {
                          setMicroVitD(!microVitD);
                          showToast("+20 XP • Vit-D Supplementation Toggled");
                        }}
                        className={`py-1 px-2 rounded text-xs border ${
                          microVitD ? "bg-[#10B981]/20 border-[#10B981] text-[#10B981]" : "bg-[#0C111B] border-[#243044] text-[#CAD5D4]"
                        }`}
                      >
                        {microVitD ? "Active (Optimal)" : "Inactive"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Procedure & Escalation Guidelines */}
                <div className="text-xs bg-[#05070D] p-2.5 rounded border border-[#243044] flex justify-between items-center">
                  <div className="space-y-0.5">
                    <div><strong>Procedure:</strong> {TISSUE_SPECS[selectedTissue].procedure}</div>
                    <div className="text-[#EF4444]"><strong>Escalation Threshold:</strong> {TISSUE_SPECS[selectedTissue].escalation}</div>
                  </div>
                  <button onClick={() => setZoomLevel(2)} className="text-[#38BDF8] hover:underline ml-4 whitespace-nowrap">
                    ← Back to Tissues
                  </button>
                </div>
              </motion.div>
            )}

          </div>

          {/* Floating 180-Day Mission Timeline Scrubber */}
          <div className="absolute bottom-4 left-6 right-6 h-14 bg-[#0C111B]/90 backdrop-blur-md border border-[#243044] rounded-lg px-4 flex items-center gap-4 z-30">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 rounded bg-[#38BDF8] text-[#04070F] hover:bg-[#7DD3FC] transition"
              title={isPlaying ? "Pause timeline" : "Play timeline"}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>

            <div className="flex-1 flex flex-col justify-center">
              <div className="flex justify-between text-[11px] font-mono text-[#CAD5D4] mb-1">
                <span>Day 1 (Earth Orbit)</span>
                <span className={currentDay === 40 ? "text-[#F59E0B] font-bold" : ""}>Day 40 (Sleep Shock)</span>
                <span className={currentDay === 49 ? "text-[#EF4444] font-bold" : ""}>Day 49 (Cascade Peak)</span>
                <span className={currentDay >= 95 && currentDay <= 98 ? "text-[#EF4444] font-bold" : ""}>Day 95 (CO₂ Spike)</span>
                <span>Day 180 (Mars Landing)</span>
              </div>
              <input
                type="range"
                min="1"
                max="180"
                value={currentDay}
                onChange={(e) => setCurrentDay(+e.target.value)}
                className="w-full accent-[#38BDF8] cursor-pointer"
              />
            </div>

            <div className="font-mono text-xs text-white min-w-[70px] text-right">
              SOL <strong>{currentDay}</strong> / 180
            </div>
          </div>

        </main>

        {/* ===================================================================
            ZONE 4: RIGHT ACTION, FORECAST & TRIAGE RAIL (360px)
        ==================================================================== */}
        <aside className="w-[360px] border-l border-[#243044] bg-[#0A1122]/70 flex flex-col overflow-hidden">
          
          {/* Navigation Tabs */}
          <div className="flex border-b border-[#243044] bg-[#05070D]">
            {[
              { id: "ALERTS", label: "Alerts" },
              { id: "FORECAST", label: "Forecast" },
              { id: "TRIAGE_DTN", label: "Triage & DTN" },
              { id: "GUIDE", label: "Guide" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition ${
                  activeTab === tab.id
                    ? "text-[#38BDF8] border-b-2 border-[#38BDF8] bg-[#0C111B]"
                    : "text-[#CAD5D4] hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 p-3.5 overflow-y-auto space-y-3">
            
            {/* TAB 1: ALERTS & QUESTS */}
            {activeTab === "ALERTS" && (
              <div className="space-y-3">
                <span className="text-xs font-bold text-[#CAD5D4] uppercase tracking-wide block">
                  Active Clinical Drift Alerts
                </span>

                {currentDay >= 40 && currentDay <= 55 && (
                  <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444]/40 rounded text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[#EF4444] font-bold">
                      <AlertTriangle className="w-4 h-4" /> CRITICAL: Neuro-Circadian Collapse
                    </div>
                    <p className="text-[#CAD5D4]">
                      Sleep 5.1 h vs baseline 7.4 h (-31%), persisting for {currentDay - 40} consecutive days.
                    </p>
                    <div className="text-[11px] text-[#F59E0B]">
                      <strong>Root Cause:</strong> Cabin acoustic harmonic (68.5 dBA) + high workload (8.5/10).
                    </div>
                  </div>
                )}

                {currentDay >= 95 && currentDay <= 98 && (
                  <div className="p-3 bg-[#F59E0B]/10 border border-[#F59E0B]/40 rounded text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[#F59E0B] font-bold">
                      <Wind className="w-4 h-4" /> CDRA Scrubber Saturation
                    </div>
                    <p className="text-[#CAD5D4]">
                      Cabin CO₂ spike: 4750 ppm (exceeds 4000 ppm threshold) correlated with headache.
                    </p>
                    <div className="text-[11px] text-[#10B981]">
                      <strong>Action:</strong> Check scrubber bed first before clinical escalation.
                    </div>
                  </div>
                )}

                {/* Gamified Quests */}
                <div className="p-3 bg-[#0C111B] border border-[#243044] rounded text-xs space-y-2">
                  <span className="font-bold text-white block">Active Countermeasure Quests:</span>
                  <div className="p-2 bg-[#05070D] border border-[#243044] rounded space-y-1.5">
                    <div className="font-medium text-[#38BDF8]">Quest: Acoustic Shielding & Circadian Sync</div>
                    <p className="text-[11px] text-[#CAD5D4]">Deploy acoustic sleep baffles and blue-enriched 460nm lighting entrainment.</p>
                    <button
                      onClick={() => {
                        setWhatIf((prev) => ({ ...prev, noiseSleepProtocol: !prev.noiseSleepProtocol }));
                        showToast(whatIf.noiseSleepProtocol ? "Acoustic Protocol Deactivated" : "+95 XP • Acoustic Shielding Protocol Active!");
                      }}
                      className={`w-full py-1 rounded text-xs font-bold border transition ${
                        whatIf.noiseSleepProtocol
                          ? "bg-[#10B981]/20 border-[#10B981] text-[#10B981]"
                          : "bg-[#38BDF8]/10 border-[#38BDF8] text-[#38BDF8] hover:bg-[#38BDF8]/20"
                      }`}
                    >
                      {whatIf.noiseSleepProtocol ? "Protocol Active ✓" : "Execute Protocol (+95 XP)"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: FORECAST & WHAT-IF PRESETS */}
            {activeTab === "FORECAST" && (
              <div className="space-y-3">
                <span className="text-xs font-bold text-[#CAD5D4] uppercase tracking-wide block">
                  Scenario Presets & Slider
                </span>

                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => applyPreset("status_quo")}
                    className={`py-1.5 px-2 rounded text-[11px] border font-medium ${
                      whatIf.activePreset === "status_quo" ? "bg-[#38BDF8] text-[#04070F] font-bold" : "bg-[#0C111B] border-[#243044] text-[#CAD5D4]"
                    }`}
                  >
                    Status Quo
                  </button>
                  <button
                    onClick={() => applyPreset("nasa_full_protocol")}
                    className={`py-1.5 px-2 rounded text-[11px] border font-medium ${
                      whatIf.activePreset === "nasa_full_protocol" ? "bg-[#10B981] text-[#04070F] font-bold" : "bg-[#0C111B] border-[#243044] text-[#CAD5D4]"
                    }`}
                  >
                    NASA Full
                  </button>
                  <button
                    onClick={() => applyPreset("high_stress_drift")}
                    className={`py-1.5 px-2 rounded text-[11px] border font-medium ${
                      whatIf.activePreset === "high_stress_drift" ? "bg-[#EF4444] text-white font-bold" : "bg-[#0C111B] border-[#243044] text-[#CAD5D4]"
                    }`}
                  >
                    High Stress
                  </button>
                </div>

                <div className="p-3 bg-[#0C111B] border border-[#243044] rounded text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[#CAD5D4]">Exercise Adherence:</span>
                    <span className="font-mono text-[#38BDF8] font-bold">{whatIf.exerciseMinutes} min/day</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="135"
                    step="5"
                    value={whatIf.exerciseMinutes}
                    onChange={(e) => setWhatIf({ ...whatIf, exerciseMinutes: +e.target.value })}
                    className="w-full accent-[#38BDF8]"
                  />
                  <span className="text-[10px] text-[#CAD5D4]">NASA Benchmark: 90 min/day on ARED-II</span>
                </div>

                {/* 6 Dimensions Landing Projections */}
                <span className="text-xs font-bold text-[#CAD5D4] uppercase tracking-wide block pt-2">
                  Landing Day 180 Flight Cones
                </span>
                <div className="space-y-2">
                  {FORECAST_DIMENSIONS.map((dim) => {
                    const adherenceBonus = (whatIf.exerciseMinutes / 90.0) * 8;
                    const baselineLoss = 14;
                    const proj = Math.min(100, Math.max(50, 100 - baselineLoss + adherenceBonus + (whatIf.noiseSleepProtocol ? 6 : 0)));
                    const badge = getStatusBadge(proj);
                    return (
                      <div key={dim.key} className="p-2.5 bg-[#0C111B] border border-[#243044] rounded text-xs space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-white">{dim.name}</span>
                          <span className="font-mono font-bold" style={{ color: badge.color }}>
                            {proj.toFixed(1)}{dim.unit}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-[#05070D] rounded overflow-hidden">
                          <div className="h-full rounded transition-all" style={{ width: `${proj}%`, backgroundColor: badge.color }} />
                        </div>
                        <span className="text-[10px] text-[#CAD5D4] block">{dim.publishedLoss}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: TRIAGE & DTN PACKET BUILDER */}
            {activeTab === "TRIAGE_DTN" && (
              <div className="space-y-3">
                <span className="text-xs font-bold text-[#CAD5D4] uppercase tracking-wide block">
                  Delay-Aware Triage Router
                </span>

                <div className="p-3 bg-[#0C111B] border border-[#243044] rounded text-xs space-y-2">
                  <div>
                    <span className="text-[10px] text-[#CAD5D4] block">Designated Treatment Authority:</span>
                    <span className="text-sm font-bold text-[#38BDF8] block">
                      {currentDay >= 44 && currentDay <= 55 ? "CREW MEDICAL OFFICER (CMO)" : "SELF-CARE PROTOCOL"}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#CAD5D4] leading-relaxed">
                    Propagation delay ({envMeta.delay}) exceeds real-time threshold. Autonomous onboard triage protocols supersede ground authorization.
                  </p>
                  <button
                    disabled={isTransmitting}
                    onClick={handleTransmitPacket}
                    className="w-full py-2 bg-[#38BDF8] text-[#04070F] font-bold text-xs rounded hover:bg-[#7DD3FC] transition flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" /> {isTransmitting ? "Transmitting across DTN..." : "Transmit DTN Bundle →"}
                  </button>
                </div>

                {/* Live DTN Packet Stream */}
                <span className="text-xs font-bold text-[#CAD5D4] uppercase tracking-wide block pt-2">
                  Store-and-Forward Telemetry Queue
                </span>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {dtPackets.map((pkt) => (
                    <div key={pkt.id} className="p-2.5 bg-[#0C111B] border border-[#243044] rounded text-xs space-y-1">
                      <div className="flex justify-between items-center font-mono text-[10px]">
                        <span className="text-[#38BDF8]">{pkt.id}</span>
                        <span className={`px-1.5 py-0.5 rounded ${
                          pkt.status === "ACKNOWLEDGED" ? "bg-[#10B981]/20 text-[#10B981]" : "bg-[#F59E0B]/20 text-[#F59E0B]"
                        }`}>
                          {pkt.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-white">{pkt.anomaly}</p>
                      {pkt.reply && (
                        <div className="text-[10px] text-[#10B981] pt-1 border-t border-[#243044]/60">
                          {pkt.reply}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: GUIDE & SCIENTIFIC CITATIONS */}
            {activeTab === "GUIDE" && (
              <div className="space-y-3 text-xs leading-relaxed text-[#CAD5D4]">
                <span className="text-xs font-bold text-white uppercase tracking-wide block">
                  Astronaut Self-Assessment Protocol
                </span>
                <p>
                  LANDFALL is designed for communication-denied interplanetary missions. When Earth round-trip latency reaches 44 minutes, every astronaut must become their own first responder.
                </p>
                <div className="p-3 bg-[#0C111B] border border-[#243044] rounded space-y-2">
                  <span className="font-bold text-white block">NASA Hazard Principle:</span>
                  <p>
                    NASA Space Flight Human System Standard (NASA-STD-3001) dictates autonomous crew capabilities during communications blackout.
                  </p>
                  <p>
                    When Earth communication latency exceeds operational response thresholds, onboard triage protocols supersede ground authorization.
                  </p>
                </div>
                <div className="p-3 bg-[#0C111B] border border-[#243044] rounded space-y-1">
                  <span className="font-bold text-white block">Published Literature Rates:</span>
                  <div>• Bone density loss: 1.0 – 1.5% / month without axial load (NASA HRP).</div>
                  <div>• Strength & aerobic endurance loss: 10 – 12% average without exercise.</div>
                  <div>• Daily exercise benchmark: 90 min/day on ARED-II.</div>
                </div>
                <div className="text-[10px] text-[#CAD5D4] text-center pt-2">
                  Illustrative model, not a clinical predictor. Synthetic data.
                </div>
              </div>
            )}

          </div>

        </aside>

      </div>

    </div>
  );
}
