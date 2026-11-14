/**
 * LANDFALL - Sources tab: disclaimer, sources, sample-vs-real table, assumptions (src/ui/tabs/sources.js)
 * Moved from main.js unchanged during the repo restructure (docs/22-MIGRATION.md).
 */

import { SOURCES, ASSUMPTIONS, DISCLAIMER } from "../../core/sources.js";

// -------------------------------------------------------------
// STEP 6: SOURCES TAB & HONESTY
// -------------------------------------------------------------
export function renderSourcesTab() {
  const container = document.getElementById('sources-content-view');
  if (!container) return;

  let html = `
    <!-- Disclaimer -->
    <div style="background: var(--hull); border: 1px solid var(--hull-line); border-radius: 4px; padding: 20px; margin-bottom: 24px;">
      <h3 style="font-family: var(--font-heading); font-size: 20px; color: var(--nominal-teal); margin-bottom: 6px;">Operational Disclaimer</h3>
      <p style="font-size: 16px; color: var(--starlight); line-height: 1.5;">${DISCLAIMER}</p>
    </div>

    <!-- NASA Hazard Principle: Two separate sentences, no quotes -->
    <div style="background: #090E17; border-left: 3px solid var(--nominal-teal); padding: 16px 20px; margin-bottom: 24px; border-radius: 2px;">
      <p style="font-size: 15.5px; color: var(--starlight); line-height: 1.5; margin-bottom: 6px;">
        NASA human research identifies that microgravity hazards can feed off one another.
      </p>
      <p style="font-size: 15.5px; color: var(--starlight-dim); line-height: 1.5;">
        In LANDFALL, our design links environmental cabin sensor readings directly to crew physiological symptoms.
      </p>
    </div>

    <!-- What Exists and What Gap LANDFALL Fills -->
    <div style="background: var(--hull); border: 1px solid var(--hull-line); border-radius: 4px; padding: 20px; margin-bottom: 24px;">
      <h3 style="font-family: var(--font-heading); font-size: 20px; color: var(--starlight); margin-bottom: 12px;">What Exists and What Gap LANDFALL Fills</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; font-size: 14.5px;">
        <div style="background: #060A10; padding: 12px; border-radius: 4px; border: 1px solid var(--hull-line);">
          <strong style="color: var(--earthlight);">ARCHeR & NASA HRP:</strong> Focuses on algorithmic diagnosis under Earth physician supervision. LANDFALL closes the gap by assuming Earth is out-of-the-loop and enabling autonomous triage.
        </div>
        <div style="background: #060A10; padding: 12px; border-radius: 4px; border: 1px solid var(--hull-line);">
          <strong style="color: var(--earthlight);">Standard Measures:</strong> Collects post-flight biomarker baselines. LANDFALL puts baselines to active longitudinal use on transit day.
        </div>
        <div style="background: #060A10; padding: 12px; border-radius: 4px; border: 1px solid var(--hull-line);">
          <strong style="color: var(--earthlight);">Immune Biomarkers:</strong> Spaceflight studies reveal subclinical viral reactivation. LANDFALL models dormant HSV-1 reactivation under high stress and sleep collapse.
        </div>
        <div style="background: #060A10; padding: 12px; border-radius: 4px; border: 1px solid var(--hull-line);">
          <strong style="color: var(--earthlight);">Tempus Pro & Wearables:</strong> Stream vitals to ground. LANDFALL routes data across DTN store-and-forward architecture with simulated speed-of-light delay.
        </div>
      </div>
    </div>

    <!-- Official NASA Literature Sources -->
    <h3 style="font-family: var(--font-heading); font-size: 20px; color: var(--starlight); margin-bottom: 12px;">Official NASA Sources &amp; Literature</h3>
    <div style="margin-bottom: 28px;">
  `;

  SOURCES.forEach(s => {
    html += `
      <div style="background: var(--hull); border: 1px solid var(--hull-line); border-radius: 4px; padding: 14px 18px; margin-bottom: 10px;">
        <div style="display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 4px;">
          <strong style="font-family: var(--font-heading); font-size: 16.5px; color: var(--starlight);">${s.title}</strong>
          <a href="${s.url}" target="_blank" rel="noopener noreferrer" style="color: var(--earthlight); font-size: 14px; text-decoration: none;">
            NASA Link &nearr;
          </a>
        </div>
        <p style="font-size: 14.5px; color: var(--starlight-dim);">${s.supports}</p>
      </div>
    `;
  });

  html += `
    </div>

    <!-- Contract Data Integrity (Sample vs Real) -->
    <div style="background: var(--hull); border: 1px solid var(--hull-line); border-radius: 4px; padding: 20px; margin-bottom: 24px;">
      <h3 style="font-family: var(--font-heading); font-size: 20px; color: var(--starlight); margin-bottom: 8px;">Data Integrity: Sample vs Production Modules</h3>
      <table class="gonogo-table" style="font-size: 14.5px;">
        <thead>
          <tr>
            <th>Module</th>
            <th>Author</th>
            <th>Status</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>src/core/</code>: <code>pipeline.js</code>, <code>queue.js</code>, <code>packet.js</code>, <code>triage.js</code>, <code>sources.js</code></td>
            <td>Raghav</td>
            <td><span class="status-badge status-nominal"><span class="shape-circle"></span> Real code</span></td>
            <td>Core DTN queuing, FNV-1a checksums, triage logic</td>
          </tr>
          <tr>
            <td><code>index.html</code>, <code>src/ui/</code>, <code>src/app/</code>, <code>assets/css/</code></td>
            <td>Om (UI Lead)</td>
            <td><span class="status-badge status-nominal"><span class="shape-circle"></span> Production</span></td>
            <td>The View From The Ship frontend, canvas, accessibility</td>
          </tr>
          <tr>
            <td><code>src/data/sample-data.js</code></td>
            <td>Interim</td>
            <td><span class="status-badge status-caution"><span class="shape-triangle"></span> Synthetic sample</span></td>
            <td>180-day baseline data simulating Day 40 sleep collapse story</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h3 style="font-family: var(--font-heading); font-size: 20px; color: var(--starlight); margin-bottom: 12px;">Modelling Assumptions (ASSUMPTIONS)</h3>
    <ul style="padding-left: 24px; font-size: 15.5px; color: #CAD5D4; line-height: 1.6; margin-bottom: 24px;">
  `;

  ASSUMPTIONS.forEach(a => {
    html += `<li style="margin-bottom: 8px;">${a}</li>`;
  });

  html += `</ul>`;
  container.innerHTML = html;
}
