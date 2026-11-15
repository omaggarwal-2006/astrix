export const SOURCES = [
    { id: "nasa_hazards", title: "NASA HRP: 5 Hazards of Human Spaceflight",
      url: "https://www.nasa.gov/hrp/hazards/",
      supports: "Five hazards; Mars gravity about 3/8 of Earth's; self-sufficiency needed far from Earth" },
    { id: "nasa_risks", title: "NASA HRP: Risks of Human Spaceflight",
      url: "https://www.nasa.gov/hrp/risks/",
      supports: "17 risks incl. bone, fitness, sleep, behavioral, immune, SANS" },
    { id: "nasa_bone", title: "NASA: Risk of Spaceflight-Induced Bone Changes",
      url: "https://www.nasa.gov/reference/risk-of-spaceflight-induced-bone-changes/",
      supports: "1-1.5% bone density loss per month on 4-6 month missions; resistive exercise helps" },
    { id: "nasa_fitness", title: "NASA: Risk of Reduced Cardiorespiratory and Musculoskeletal Fitness",
      url: "https://www.nasa.gov/reference/risk-of-reduced-cardiorespiratory-and-musculoskeletal-fitness/",
      supports: "10-12% average strength/aerobic loss; 12-38% of crew lose over 20%; 1.5 h exercise per day" },
    { id: "csa_radiation", title: "CSA: Monitoring Radiation for Astronaut Health",
      url: "https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp",
      supports: "Neutrons are about 30% of ISS radiation; CANS continuous monitor" },
    { id: "nasa_delay", title: "NASA NTRS: Assessment of the State of Communication Delay Research (Beyond LEO)",
      url: "https://ntrs.nasa.gov/citations/20250000703",
      supports: "Lunar one-way latency 3-14 s; Mars up to 44 min round trip" },
    { id: "nasa_ascend", title: "NASA NTRS: Communication Delays, Disruptions and Blackouts for Crewed Mars Missions",
      url: "https://ntrs.nasa.gov/api/citations/20220013418/downloads/ASCEND-Communication%20Delays%2C%20Disruptions%2C%20and%20Blackouts%20for%20Crewed%20Mars%20Missions.pdf",
      supports: "Delay = Earth-body distance / speed of light, over the Earth-Mars synodic cycle" },
    { id: "nasa_lsds7", title: "NASA LSDA / OSDR: LSDS-7 Complete Blood Count",
      url: "https://osdr.nasa.gov/",
      supports: "Longitudinal astronaut hematology, WBC shifts, and red cell indices in microgravity" },
    { id: "nasa_lsds8", title: "NASA LSDA / OSDR: LSDS-8 Comprehensive Metabolic Panel & Cytokines",
      url: "https://osdr.nasa.gov/",
      supports: "Serum electrolytes, calcium resorption, BUN renal markers, and EvePanel cytokine assays" }
  ];
  
  export const NUMBERS = {
    bone_loss_pct_per_month: { low: 1.0, high: 1.5, source: "nasa_bone" },
    fitness_loss_pct_avg:    { low: 10, high: 12, source: "nasa_fitness" },
    crew_losing_over_20pct:  { low: 12, high: 38, source: "nasa_fitness" },
    exercise_hours_per_day:  { value: 1.5, source: "nasa_fitness" },
    iss_neutron_share_pct:   { value: 30, source: "csa_radiation" }
  };
  
  // Link presets for the UI selector (delay_s = ONE-WAY, seconds)
  export const LINK_PRESETS = {
    MOON:      { label: "Moon (light-time only)",   delay_s: 1.3,  note: "384,400 km / c; real systems may see 3-14 s (nasa_delay)" },
    MARS_NEAR: { label: "Mars, closest",            delay_s: 180,  note: "about 3 min one-way" },
    MARS_MID:  { label: "Mars, average",            delay_s: 750,  note: "about 12.5 min one-way" },
    MARS_FAR:  { label: "Mars, farthest",           delay_s: 1320, note: "about 22 min one-way; up to 44 min round trip (nasa_delay)" }
  };
  
  // Hamari apni assumptions: NASA ke pages mein ye numbers nahi hain
  export const ASSUMPTIONS = [
    "Triage score = severity + (persisted 5+ days) + (worsening). Thresholds are our design choice, not NASA values.",
    "LIVE_CALL if one-way delay is under 10 s (src/core/config.js), otherwise store-and-forward packet. Our design choice (decision D-01).",
    "Effect of exercise adherence on bone/muscle loss is modelled with an assumed curve; NASA pages give no such factor.",
    "NASA bone rate is for 4-6 month missions; extending it to a 6-9 month transit is an extrapolation.",
    "Personal baseline = first 14 days of the synthetic dataset; real baselines need pre-flight measurements.",
    "All mission data in this demo is synthetic.",
    "Ground reply in the DTN queue is simulated, and delays are sped up for the demo."
  ];
  
  export const DISCLAIMER =
    "LANDFALL is decision support, not diagnosis. Forecasts are an illustrative model built on published NASA rates, not a clinical predictor.";