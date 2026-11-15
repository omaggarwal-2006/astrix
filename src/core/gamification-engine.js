/**
 * LANDFALL v3.0 - Gamification & Progression Engine (src/core/gamification-engine.js)
 * Manages astronaut XP, mission readiness levels, achievement badges, and streak mechanics.
 * Pure logic module with zero DOM dependencies for reliable testing.
 */

export const RANKS = [
  { level: 1, title: 'Mission Cadet', minXP: 0, maxXP: 500 },
  { level: 2, title: 'Flight Specialist', minXP: 500, maxXP: 1500 },
  { level: 3, title: 'CMO Certified', minXP: 1500, maxXP: 3500 },
  { level: 4, title: 'Deep Space Veteran', minXP: 3500, maxXP: 7000 },
  { level: 5, title: 'Commander Readiness', minXP: 7000, maxXP: 10000 },
];

export const BADGES = [
  {
    id: 'cardiac_guardian',
    name: 'Cardiac Guardian',
    icon: '🫀',
    desc: 'Monitor cardiovascular telemetry and sync resting HR',
    check: (state) => (state.hrHistoryCount || 0) >= 5,
  },
  {
    id: 'bone_defender',
    name: 'Bone Defender',
    icon: '🦴',
    desc: 'Maintain cancellous bone mineral density with ARED loads',
    check: (state) => state.boneScanCount >= 1,
  },
  {
    id: 'neuro_sharp',
    name: 'Neuro Sharp',
    icon: '🧠',
    desc: 'Track and preserve circadian neuro-ocular integrity',
    check: (state) => state.selectedRegions?.includes('head_neuro'),
  },
  {
    id: 'immune_sentinel',
    name: 'Immune Sentinel',
    icon: '🛡️',
    desc: 'Verify white blood cell & multiplex serum immune levels',
    check: (state) => state.selectedRegions?.includes('chest_cardio'),
  },
  {
    id: 'iron_astronaut',
    name: 'Iron Astronaut',
    icon: '🏋️',
    desc: 'Execute 1.5 h/day countermeasure exercise regimen',
    check: (state) => (state.exerciseHours || 0) >= 1.5,
  },
  {
    id: 'dtn_specialist',
    name: 'DTN Specialist',
    icon: '📡',
    desc: 'Dispatch store-and-forward telemetry packet through delay',
    check: (state) => (state.packetsSent || 0) >= 1,
  },
  {
    id: 'lab_master',
    name: 'Lab Master',
    icon: '🔬',
    desc: 'Perform high-res ultrasonic elastography scans',
    check: (state) => (state.scansCompleted || 0) >= 3,
  },
  {
    id: 'anomaly_hunter',
    name: 'Anomaly Hunter',
    icon: '🎯',
    desc: 'Investigate Day 40 circadian & cabin hypercapnia shift',
    check: (state) => (state.currentDay || 0) >= 40,
  },
  {
    id: 'mars_approach',
    name: 'Mars Approach',
    icon: '🚀',
    desc: 'Navigate past transit midpoint (Day 90+)',
    check: (state) => (state.currentDay || 0) >= 90,
  },
  {
    id: 'landing_ready',
    name: 'Landing Ready',
    icon: '⭐',
    desc: 'Arrive at Mars insertion with Tier I Mission Readiness',
    check: (state) => (state.currentDay || 0) >= 180 && (state.readinessXP || 0) >= 850,
  },
];

export const XP_REWARDS = {
  DAILY_CHECKIN: 50,
  EXERCISE_LOG: 100,
  TISSUE_SCAN: 40,
  PACKET_TRANSMIT: 75,
  ANOMALY_RESOLVE: 120,
  REGION_EXPLORE: 25,
  SCENARIO_TEST: 30,
};

export class GamificationEngine {
  constructor(initialData = {}) {
    this.xp = initialData.xp || 750; // starts with calibrated baseline XP
    this.streak = initialData.streak || 5;
    this.unlockedBadges = new Set(initialData.unlockedBadges || ['cardiac_guardian']);
    this.selectedRegions = new Set(initialData.selectedRegions || []);
    this.scansCompleted = initialData.scansCompleted || 1;
    this.packetsSent = initialData.packetsSent || 0;
    this.hrHistoryCount = initialData.hrHistoryCount || 6;
    this.boneScanCount = initialData.boneScanCount || 1;
  }

  getRank() {
    for (let i = RANKS.length - 1; i >= 0; i--) {
      if (this.xp >= RANKS[i].minXP) {
        const cur = RANKS[i];
        const next = RANKS[i + 1] || null;
        const progressPct = next
          ? Math.min(100, Math.max(0, ((this.xp - cur.minXP) / (cur.maxXP - cur.minXP)) * 100))
          : 100;
        return {
          level: cur.level,
          title: cur.title,
          xp: this.xp,
          minXP: cur.minXP,
          maxXP: cur.maxXP,
          progressPct: +progressPct.toFixed(1),
          nextTitle: next ? next.title : 'MAX',
        };
      }
    }
    return { level: 1, title: RANKS[0].title, xp: this.xp, progressPct: 0, nextTitle: RANKS[1].title };
  }

  awardXP(type, bonus = 0) {
    const base = XP_REWARDS[type] || 20;
    const gained = base + bonus;
    this.xp += gained;
    return { gained, totalXP: this.xp, rank: this.getRank() };
  }

  recordRegionVisit(regionId) {
    if (!this.selectedRegions.has(regionId)) {
      this.selectedRegions.add(regionId);
      return this.awardXP('REGION_EXPLORE');
    }
    return null;
  }

  recordScan() {
    this.scansCompleted++;
    this.boneScanCount++;
    return this.awardXP('TISSUE_SCAN');
  }

  recordPacket() {
    this.packetsSent++;
    return this.awardXP('PACKET_TRANSMIT');
  }

  checkNewBadges(context = {}) {
    const newlyUnlocked = [];
    const evaluationState = {
      xp: this.xp,
      streak: this.streak,
      scansCompleted: this.scansCompleted,
      packetsSent: this.packetsSent,
      hrHistoryCount: this.hrHistoryCount,
      boneScanCount: this.boneScanCount,
      selectedRegions: Array.from(this.selectedRegions),
      currentDay: context.currentDay || 40,
      exerciseHours: context.exerciseHours !== undefined ? context.exerciseHours : 1.5,
      readinessXP: context.readinessXP || 880,
    };

    BADGES.forEach(badge => {
      if (!this.unlockedBadges.has(badge.id)) {
        if (badge.check(evaluationState)) {
          this.unlockedBadges.add(badge.id);
          newlyUnlocked.push(badge);
        }
      }
    });

    return newlyUnlocked;
  }

  getBadgeStatus() {
    return BADGES.map(b => ({
      ...b,
      unlocked: this.unlockedBadges.has(b.id),
    }));
  }

  getLeaderboard() {
    return [
      { callsign: 'CDR A. Vance', role: 'Mission Commander', score: this.xp + 120, tier: 'Tier I', active: true },
      { callsign: 'FE-1 M. Kowalski', role: 'Flight Engineer', score: 1820, tier: 'Tier I', active: false },
      { callsign: 'MS-1 Dr. Rodriguez', role: 'Crew Medical Officer', score: 1640, tier: 'Tier II', active: false },
      { callsign: 'MS-2 L. Chen', role: 'Science Specialist', score: 1490, tier: 'Tier II', active: false },
    ];
  }
}
