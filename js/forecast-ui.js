/**
 * LANDFALL - Forecast UI (forecast-ui.js)
 * Implements the "Evaluate" verb for mission landing day projections:
 * 1. Organ & physiological readiness projections with low/mid/high confidence intervals
 * 2. Real-time What-If slider (0.0 to 1.5 hours daily exercise adherence)
 * 3. Exact NASA published rate citations inline
 * 4. Dynamic adaptive countermeasure checklist
 */

(function(window) {
  'use strict';

  let currentAdherence = 1.2; // default adherence (hrs/day)

  const ForecastUI = {
    init() {
      this.bindEvents();
      this.render();
    },

    bindEvents() {
      // What-if exercise adherence slider
      const slider = document.getElementById('forecast-adherence-slider');
      const valDisplay = document.getElementById('forecast-adherence-val');

      if (slider) {
        slider.addEventListener('input', (e) => {
          currentAdherence = parseFloat(e.target.value);
          if (valDisplay) valDisplay.textContent = `${currentAdherence.toFixed(1)} hrs/day`;
          this.render();
        });
      }

      // Sync with master mission day scrubber
      if (window.LandfallState) {
        window.LandfallState.subscribe(() => {
          this.render();
        });
      }
    },

    render() {
      const day = window.LandfallState ? window.LandfallState.currentDay : 40;
      if (!window.ForecastEngine) return;

      const forecast = window.ForecastEngine.calculateLandingReadiness(day, currentAdherence);
      this.renderOverallCard(forecast);
      this.renderMetricCards(forecast.metrics);
      this.renderCountermeasures(forecast.recommendedCountermeasures);
    },

    renderOverallCard(forecast) {
      const scoreEl = document.getElementById('forecast-score-val');
      const statusBadge = document.getElementById('forecast-overall-status');
      const landingDaysEl = document.getElementById('forecast-landing-days');

      if (scoreEl) scoreEl.textContent = `${forecast.overallReadinessScore}%`;
      if (landingDaysEl) landingDaysEl.textContent = `${forecast.daysToLanding} days`;

      if (statusBadge) {
        const status = forecast.overallStatus;
        statusBadge.className = `status-badge status-${status}`;
        statusBadge.textContent = status === 'nominal' 
          ? 'Fit for Mars landing operations' 
          : (status === 'caution' ? 'Caution: Countermeasures required' : 'Critical: Impaired landing capability');
      }
    },

    renderMetricCards(metrics) {
      const container = document.getElementById('forecast-metrics-grid');
      if (!container) return;

      const keys = ['boneDensity', 'aerobicAndMuscle', 'cardiovascular', 'neurovestibularBalance', 'sleepDebt', 'cognitiveMood'];
      let html = '';

      keys.forEach(k => {
        const m = metrics[k];
        if (!m) return;

        const shapeClass = m.status === 'nominal' ? 'shape-circle' : (m.status === 'caution' ? 'shape-triangle' : 'shape-octagon');
        const shapeTitle = m.status.toUpperCase();

        html += `
          <div class="forecast-plate" data-status="${m.status}">
            <div class="forecast-plate-top">
              <span class="forecast-metric-title">${m.title}</span>
              <span class="status-badge status-${m.status}">
                <span class="${shapeClass}" title="${shapeTitle}"></span>
                ${m.status.toUpperCase()}
              </span>
            </div>

            <div class="forecast-value-row">
              <span class="forecast-big-num num">${m.projectedRetention}%</span>
              <div class="forecast-range-box">
                <span class="range-label">Range (95% CI):</span>
                <span class="range-val num">${m.low}% &ndash; ${m.high}%</span>
              </div>
            </div>

            <div class="forecast-rate-desc">
              ${m.rateDescription}
            </div>

            <div class="forecast-citation-box">
              <span class="cite-label">NASA SOURCE:</span>
              <a href="${m.citationUrl || 'https://www.nasa.gov/hrp/risks/'}" target="_blank" rel="noopener noreferrer" class="cite-text" style="color: #9BB0AF; text-decoration: none;">
                ${m.citation} &nearr;
              </a>
            </div>
          </div>
        `;
      });

      container.innerHTML = html;
    },

    renderCountermeasures(countermeasures) {
      const listContainer = document.getElementById('countermeasures-list');
      if (!listContainer) return;

      let html = '';
      countermeasures.forEach(c => {
        html += `
          <div class="countermeasure-item ${c.active ? 'active-recommended' : 'dormant'}">
            <div class="cm-header">
              <input type="checkbox" id="cm-${c.id}" class="cm-checkbox" ${c.active ? 'checked' : ''}>
              <label for="cm-${c.id}" class="cm-title">
                ${c.name}
              </label>
              <span class="cm-badge ${c.active ? 'badge-active' : 'badge-standby'}">
                ${c.active ? 'Active prescription' : 'Standby protocol'}
              </span>
            </div>
            <p class="cm-detail">${c.detail}</p>
            <span class="cm-cite">Authority: ${c.citation}</span>
          </div>
        `;
      });

      listContainer.innerHTML = html;
    }
  };

  window.ForecastUI = ForecastUI;
})(window);
