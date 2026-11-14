/**
 * LANDFALL - NASA Sources & Evidence Base (sources.js)
 * Master catalog of peer-reviewed NASA Human Research Program (HRP) resources.
 * Supports inline citation links and the comprehensive Sources and Honesty tab.
 */

(function(window) {
  'use strict';

  const NASASources = {
    // A) The Five Hazards of Human Spaceflight
    hazardsOverview: {
      id: 'HAZARDS_OVERVIEW',
      title: 'Hazards of Human Spaceflight',
      publisher: 'NASA Human Research Program',
      url: 'https://www.nasa.gov/hrp/hazards/',
      interconnectionIdea: 'The hazards feed off one another, so LANDFALL links cabin readings to physiological symptoms.'
    },

    hazards: [
      {
        id: 'HAZARD_RADIATION',
        title: 'Space Radiation',
        hazardName: 'Radiation',
        publisher: 'NASA HRP',
        url: 'https://www.nasa.gov/hrp/hazard-space-radiation/',
        supports: 'Running radiation dose total (accumulated mSv), tracked and explained, not forecast.',
        featureMapping: 'Today Tab -> Radiation Monitoring Panel'
      },
      {
        id: 'HAZARD_ISOLATION',
        title: 'Isolation and Confinement',
        hazardName: 'Isolation',
        publisher: 'NASA HRP',
        url: 'https://www.nasa.gov/hrp/hazard-isolation-and-confinement/',
        supports: 'Mood, sleep duration, and workload daily check-in tracking.',
        featureMapping: 'Today Tab Check-in & Trends Tab (Mood/Sleep)'
      },
      {
        id: 'HAZARD_DISTANCE',
        title: 'Distance from Earth',
        hazardName: 'Distance',
        publisher: 'NASA HRP',
        url: 'https://www.nasa.gov/hrp/hazard-distance-from-earth/',
        supports: 'Delay-aware triage and store-and-forward packet. Framed around astronaut self-sufficiency.',
        featureMapping: 'Act Tab -> Autonomous Triage & Packet Transmission'
      },
      {
        id: 'HAZARD_GRAVITY',
        title: 'Gravity Fields',
        hazardName: 'Microgravity',
        publisher: 'NASA HRP',
        url: 'https://www.nasa.gov/hrp/hazard-gravity-fields/',
        supports: 'Landing-day bone mineral density, muscle strength, and neurovestibular balance forecast.',
        featureMapping: 'Forecast Tab -> Landing Readiness Projections'
      },
      {
        id: 'HAZARD_ENVIRONMENT',
        title: 'Hostile/Closed Environments',
        hazardName: 'Environment',
        publisher: 'NASA HRP',
        url: 'https://www.nasa.gov/hrp/hazard-hostile-closed-environments/',
        supports: 'Cabin environmental panel (CO2, temperature, noise) and immune activation panel.',
        featureMapping: 'Today Tab -> Cabin Environmental & Immune Panels'
      }
    ],

    // B) The HRP Clinical Risks
    risks: [
      {
        id: 'RISK_IMMUNE',
        title: 'Risk of Altered Immune System Responses',
        publisher: 'NASA HRP',
        url: 'https://www.nasa.gov/reference/risk-of-altered-immune-system-responses/',
        supports: 'Immune panel: rash, cold sores (HSV-1), fever, fatigue plus temperature and stress. Spaceflight stress can awaken dormant viruses, causing rashes.',
        featureMapping: 'Today Tab -> Immune Status Panel'
      },
      {
        id: 'RISK_SENSORIMOTOR',
        title: 'Risk of Altered Sensorimotor and Vestibular Function',
        publisher: 'NASA HRP',
        url: 'https://www.nasa.gov/reference/risk-of-altered-sensorimotor-and-vestibular-function/',
        supports: 'Balance forecast projection and dizziness/motion sickness symptom tracking.',
        featureMapping: 'Forecast Tab -> Neurovestibular Balance Gauge'
      },
      {
        id: 'RISK_CARDIO',
        title: 'Risk of Cardiovascular Adaptations',
        publisher: 'NASA HRP',
        url: 'https://www.nasa.gov/reference/risk-of-cardiovascular-adaptations/',
        supports: 'Heart rate and blood pressure drift against astronaut personal baseline.',
        featureMapping: 'Today Tab Check-in & Trends Tab (Heart Rate)'
      },
      {
        id: 'RISK_FITNESS',
        title: 'Risk of Reduced Cardiorespiratory and Musculoskeletal Fitness',
        publisher: 'NASA HRP',
        url: 'https://www.nasa.gov/reference/risk-of-reduced-cardiorespiratory-and-musculoskeletal-fitness/',
        supports: 'Exercise what-if slider: 10-12% average strength and aerobic loss, 1.5 hours of daily exercise as full-adherence setting. (Note: verify on source page).',
        featureMapping: 'Forecast Tab -> Aerobic/Muscle Projection & What-If Slider'
      },
      {
        id: 'RISK_BONE',
        title: 'Risk of Spaceflight-Induced Bone Changes',
        publisher: 'NASA HRP',
        url: 'https://www.nasa.gov/reference/risk-of-spaceflight-induced-bone-changes/',
        supports: 'Bone forecast: 1.0-1.5% bone density loss per month on 4-6 month missions without countermeasure. (Note: verify on source page).',
        featureMapping: 'Forecast Tab -> Bone Mineral Density Gauge'
      },
      {
        id: 'RISK_SANS',
        title: 'Risk of Spaceflight-Associated Neuro-ocular Syndrome (SANS)',
        publisher: 'NASA HRP',
        url: 'https://www.nasa.gov/reference/risk-of-spaceflight-associated-neuro-ocular-syndrome-sans/',
        supports: 'Weekly vision and headache check. Explicit clinical rule: wording is strictly "report to the flight surgeon", never an autonomous diagnosis.',
        featureMapping: 'Today Tab Symptoms & Act Tab Triage Protocol'
      },
      {
        id: 'RISK_BEHAVIORAL',
        title: 'Risk of Adverse Behavioral Conditions and Psychiatric Disorders',
        publisher: 'NASA HRP',
        url: 'https://www.nasa.gov/reference/risk-of-behavioral-conditions-and-psychiatric-disorders/',
        supports: 'Mood & cognitive resilience longitudinal tracking.',
        featureMapping: 'Today Tab Check-in & Trends Tab (Mood)'
      },
      {
        id: 'RISK_SLEEP',
        title: 'Risk from Inadequate Sleep and Irregular Schedules',
        publisher: 'NASA HRP',
        url: 'https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/',
        supports: 'Sleep trend and the Day-40 circadian sleep collapse sequence.',
        featureMapping: 'Trends Tab (Sleep) & Day 40 Event Marker'
      },
      {
        id: 'RISK_RADIATION_CANCER',
        title: 'Risk of Radiation-Induced Cancers',
        publisher: 'NASA HRP',
        url: 'https://www.nasa.gov/reference/risk-of-radiation-induced-cancers/',
        supports: 'Cumulative career radiation dose total and threshold tracking.',
        featureMapping: 'Today Tab -> Cumulative Radiation Counter'
      },
      {
        id: 'RISK_OPS_SUPPORT',
        title: 'Risk of Inadequate Systems Operations Support',
        publisher: 'NASA HRP',
        url: 'https://www.nasa.gov/reference/risk-of-inadequate-systems-operations-support/',
        supports: 'The Act tab self-sufficiency philosophy when speed-of-light comm delay precludes real-time ground flight surgeon support.',
        featureMapping: 'Act Tab -> Autonomous Triage & Decision Routing'
      }
    ],

    // C) Ongoing HRP Research & Prior Art Gap
    ongoingResearch: [
      {
        id: 'RESEARCH_ARCHER',
        title: 'ARCHeR (Astronaut Well-Being, Activity and Sleep on Artemis II)',
        publisher: 'NASA',
        url: 'https://www.nasa.gov/reference/archer/',
        existsWhat: 'Sleep and activity monitoring during lunar flyby missions.',
        gapLANDFALL: 'LANDFALL takes activity data and projects functional landing-day readiness.'
      },
      {
        id: 'RESEARCH_STANDARD_MEASURES',
        title: 'Standard Measures & Artemis II Standard Measures',
        publisher: 'NASA HRP',
        url: 'https://www.nasa.gov/reference/standard-measures/',
        urlSecondary: 'https://www.nasa.gov/reference/artemis-ii-standard-measures/',
        existsWhat: 'Consistent physiological and psychological measurements collected for research.',
        gapLANDFALL: 'LANDFALL adapts standard measures into an astronaut-operable daily check-in that evaluates drift from personal baseline.'
      },
      {
        id: 'RESEARCH_IMMUNE_BIOMARKERS',
        title: 'Immune Biomarkers Study',
        publisher: 'NASA HRP',
        url: 'https://www.nasa.gov/reference/immune-biomarkers/',
        existsWhat: 'Laboratory-based blood and saliva analysis of deep space immune dysregulation.',
        gapLANDFALL: 'LANDFALL translates subclinical immune risks into an actionable daily symptom checklist (e.g. cold sore viral reactivation).'
      },
      {
        id: 'RESEARCH_TEMPUS_PRO',
        title: 'Tempus Pro Telemedicine System',
        publisher: 'NASA HRP / Commercial',
        url: 'https://www.nasa.gov/reference/tempus-pro/',
        existsWhat: 'Commercial telemedicine device that integrates health data for real-time ground diagnoses.',
        gapLANDFALL: 'Tempus Pro depends on a fast, near-instantaneous link. LANDFALL solves the deep-space reality where transmission latency requires autonomous local triage.'
      },
      {
        id: 'RESEARCH_ZERO_T2',
        title: 'Zero T2 (Exercise Without a Treadmill)',
        publisher: 'NASA HRP',
        url: 'https://www.nasa.gov/reference/zero-t2/',
        existsWhat: 'Evaluates alternate aerobic exercise protocols when heavy treadmills are unavailable.',
        gapLANDFALL: 'Directly validates our interactive exercise What-If adherence simulation.'
      },
      {
        id: 'RESEARCH_ROADMAP',
        title: 'NASA Human Research Roadmap',
        publisher: 'NASA HRP',
        url: 'https://humanresearchroadmap.nasa.gov/',
        existsWhat: 'The master architecture of human spaceflight risks, evidence, and knowledge gaps.',
        gapLANDFALL: 'Primary architectural reference guide for deep-space autonomous healthcare.'
      }
    ],

    // Gap Analysis Summary
    gapAnalysisStatement: {
      summary: 'Wearable baselines, research digital twins, and telemedicine exist today. LANDFALL uniquely joins personal-baseline drift detection, a landing-day predictive forecast, and delay-aware autonomous triage with store-and-forward telemetry packets.',
      honestyNote: 'We could not verify that nobody in human spaceflight has combined all three, so we do not claim total originality. LANDFALL is an operational decision-support prototype built on published NASA research.'
    },

    // D) Canadian Space Agency (CSA) Radiation Reference
    csaRadiation: {
      id: 'CSA_RADIATION_REFERENCE',
      title: 'Radiation in Space (Neutron Fraction & Dosimetry)',
      publisher: 'Canadian Space Agency (CSA)',
      url: 'https://www.asc-csa.gc.ca/eng/iss/radiation.asp',
      note: 'Supports the radiation panel (neutrons account for ~30% of ISS radiation dose). NASA does not endorse non-U.S. websites; cited for comparative space agency radiation measurement context only.'
    },

    // E) Communication Delay Figures
    // Rules: NASA pages do not state explicit transit latency curves.
    // Display "source pending" until triage teammate adds a verified citation. Never present uncited figures as facts.
    commDelayFigures: {
      iss: {
        location: 'International Space Station (LEO)',
        nominalDelayText: '~1.5 to 2 seconds',
        citationStatus: 'source pending',
        citationNote: 'Speed-of-light propagation in low Earth orbit. Triage teammate citation pending.'
      },
      moon: {
        location: 'Lunar Orbit / Artemis Base Camp',
        nominalDelayText: '~2.6 to 3 seconds',
        citationStatus: 'source pending',
        citationNote: 'Average Earth-Moon distance 384,400 km / c. Triage teammate citation pending.'
      },
      marsTransit: {
        location: 'Mars Hohmann Transit (Earth -> Mars)',
        nominalDelayText: 'Scales from 02m 08s (Day 40) to 12m 30s+ (Landing Day)',
        citationStatus: 'source pending',
        citationNote: 'Orbital transfer trajectory radio latency curve. Triage teammate citation pending in triage.js.'
      }
    }
  };

  window.NASASources = NASASources;
})(window);
