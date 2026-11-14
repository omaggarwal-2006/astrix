# astrix

# LANDFALL &bull; Autonomous Health Architecture
**NASA Space Apps Challenge 2026** &bull; *Challenge: Health Monitoring Software*

> *"The ground can't be in the loop in real time on the way to Mars, so the astronaut has to be. LANDFALL makes every astronaut their own first responder."*

---

## 1. Quick Start (How to Run)
LANDFALL is 100% self-contained and operates completely offline with **zero build steps, zero npm packages, and zero CDN calls**.

### In Your Browser
- **Option A (Localhost server):** Open **[http://localhost:8080](http://localhost:8080)** in Chrome, Edge, or Firefox.
- **Option B (Direct file opening):** Double-click `index.html` directly from File Explorer.

---

## 2. Team Split & Swapping Placeholders
This repository is organized so UI and Engine work in parallel without collisions:
- **UI Files (Om):** `index.html`, `css/style.css`, and `js/*.js`
- **Engine Files (Tanishk):** Drop into `/engine/` (`data.js`, `forecast.js`, `whatif.js`)
- **Triage Files (Teammate 3):** Drop into `/triage/` (`triage.js`, `packet.js`)
- **Placeholders:** Currently in `/placeholders/` adhering to [`CONTRACT.md`](CONTRACT.md).

### How to Swap Placeholders for Real Files:
When Tanishk and Teammate 3 deliver their files, drop them into `/engine/` and `/triage/`, then change the 4 script tags in `index.html`:
```html
<!-- Before (Placeholders) -->
<script src="placeholders/data.js"></script>
<script src="placeholders/forecast.js"></script>
<script src="placeholders/triage.js"></script>
<script src="placeholders/packet.js"></script>

<!-- After (Real Engine & Triage Modules) -->
<script src="engine/data.js"></script>
<script src="engine/forecast.js"></script>
<script src="triage/triage.js"></script>
<script src="triage/packet.js"></script>
```

### How to Pull Teammate Changes Without Losing Your Work:
Before your teammates push, or before you start editing, pull the latest changes:
```bash
git pull --rebase origin main
```
Because their code lives in `/engine/` and `/triage/` and your code lives in `/js/` and `/css/`, Git will merge changes cleanly without conflicts.

---

## 3. NASA HRP Foundation & Citations
Every feature in LANDFALL directly reflects the NASA Human Research Program (HRP):
- **5 Hazards of Human Spaceflight:** Space radiation, Isolation & confinement, Distance from Earth, Gravity fields, and Hostile/closed environments.
- **10 HRP Clinical Risks:** Immune dysregulation, Sensorimotor/vestibular balance, Cardiovascular adaptation, Bone mineral density, Aerobic fitness, SANS (reporting protocol), Sleep deficiency, Behavioral health, Space radiation carcinogenesis, and System autonomy.
- **Ongoing HRP Research Mapped:** ARCHeR (Artemis II), Standard Measures, Immune Biomarkers, Tempus Pro (telemedicine gap), and Zero T2 exercise.
- See `js/sources.js` and the in-app **Sources and Honesty** tab for the complete literature catalog.

---

## 4. Offline Verification Check
To verify full offline performance for NASA judges:
1. Turn off your Wi-Fi or disconnect network cables.
2. Hard reload `http://localhost:8080` or double-click `index.html`.
3. All fonts (local Barlow woff2), charts (local Chart.js), dials, body maps, and triage simulators will render seamlessly.
