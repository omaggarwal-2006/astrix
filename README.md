# astrix

# LANDFALL &bull; Autonomous Health Architecture
**NASA Space Apps Challenge 2026** &bull; *Challenge: Health Monitoring Software*  
**Live Application:** [https://omaggarwal-2006.github.io/astrix/](https://omaggarwal-2006.github.io/astrix/)

> *"The ground can't be in the loop in real time on the way to Mars, so the astronaut has to be. LANDFALL makes every astronaut their own first responder."*

---

## 1. Project Overview
LANDFALL is an offline-capable web application built for astronauts on a 180-day Mars transit. When communication latencies reach up to 22 minutes one-way (44 minutes round-trip), real-time telemedicine from Earth is physically impossible. 

LANDFALL gives the crew autonomous medical self-sufficiency by:
1. **Gathering** daily biomarkers and body map readings evaluated against the astronaut's calibrated personal baseline (not Earth population averages).
2. **Evaluating** landing-day physiological fitness (bone density, aerobic & muscle power, cardiovascular regulation, balance, and sleep continuity) using published NASA Human Research Program rates.
3. **Acting** through delay-aware triage that routes health anomalies to Self-Care, the Crew Medical Officer (CMO), or store-and-forward telemetry packets for ground flight surgeons.

*Disclaimer: Illustrative model, not a clinical predictor. Synthetic data.*

---

## 2. Team Split & Architecture
- **Om (UI Lead):** Frontend user interface, instrument-panel chassis styling, Mission Ribbon scrubber, 5-tab views, Chart.js trends, SVG body map, What-If slider, service worker, and adapter integration layer (`index.html`, `css/style.css`, `main.js`, `adapter.js`).
- **Tanishk (Physiological Engine):** Longitudinal data generator, alert logic, and multi-dimensional landing forecast engine.
- **Teammate 3 (DTN Queue & Triage):** Telemetry pipeline (`pipeline.js`), triage decision engine (`triage.js`), FNV-1a checksum packet builder (`packet.js`), store-and-forward queue (`queue.js`), and cited research sources (`sources.js`).

---

## 3. How to Run Locally

Because LANDFALL uses modern ES Modules, browsers require an HTTP server (browser security restricts ES module imports over direct `file://` URLs):

1. **Option A (VS Code Live Server - Recommended):**
   - Open the project folder in VS Code.
   - Install the **Live Server** extension (by Ritwick Dey).
   - Right-click `index.html` &rarr; click **"Open with Live Server"**.
2. **Option B (Python Localhost Server):**
   - In terminal/PowerShell, run:
     ```bash
     python -m http.server 8080
     ```
   - Open **[http://localhost:8080](http://localhost:8080)** in your browser.

---

## 4. 100% Offline Capability (Service Worker)
LANDFALL includes a built-in Service Worker (`sw.js`). After the first visit over HTTP/HTTPS, all assets, local Barlow fonts, and Chart.js bundles are cached locally. You can turn off Wi-Fi or disconnect from the internet and the application will remain fully functional.

---

## 5. Team Contract & Handoff
All data exchange interfaces and shapes are documented in [`CONTRACT.md`](CONTRACT.md).
- Teammate logic modules live in the root (`pipeline.js`, `queue.js`, `packet.js`, `triage.js`, `sources.js`).
- Tanishk's engine outputs are wired cleanly through `adapter.js`.
