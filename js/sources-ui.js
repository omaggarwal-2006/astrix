/**
 * LANDFALL - Sources and Honesty UI (sources-ui.js)
 * Dynamically builds the interactive NASA evidence base, hazard-to-feature matrix,
 * risk mappings, ongoing research gap analysis, and delay verification statuses.
 */

(function(window) {
  'use strict';

  const SourcesUI = {
    init() {
      this.render();
    },

    render() {
      const src = window.NASASources;
      if (!src) return;

      this.renderHazardsMatrix(src);
      this.renderRisksTable(src);
      this.renderOngoingResearch(src);
      this.renderCommDelayVerification(src);
      this.renderCsaSection(src);
    },

    renderHazardsMatrix(src) {
      const container = document.getElementById('sources-hazards-container');
      if (!container) return;

      let html = `
        <div class="hazard-overview-banner">
          <p><strong>NASA Hazard Principle:</strong> <em>"${src.hazardsOverview.interconnectionIdea}"</em></p>
          <a href="${src.hazardsOverview.url}" target="_blank" rel="noopener noreferrer" class="nasa-ext-link">
            Open NASA HRP Hazards Overview &rarr;
          </a>
        </div>
        <div class="hazards-cards-grid">
      `;

      src.hazards.forEach(h => {
        html += `
          <div class="hazard-card">
            <div class="hazard-card-header">
              <span class="hazard-pill">${h.hazardName}</span>
              <a href="${h.url}" target="_blank" rel="noopener noreferrer" class="nasa-cite-link" title="Open official NASA page">
                NASA HRP &nearr;
              </a>
            </div>
            <h4 class="hazard-title">${h.title}</h4>
            <p class="hazard-supports"><strong>Supported in LANDFALL:</strong> ${h.supports}</p>
            <div class="hazard-route">
              <span class="route-label">Interface Route:</span>
              <span class="route-val">${h.featureMapping}</span>
            </div>
          </div>
        `;
      });

      html += '</div>';
      container.innerHTML = html;
    },

    renderRisksTable(src) {
      const tbody = document.getElementById('sources-risks-tbody');
      if (!tbody) return;

      let html = '';
      src.risks.forEach(r => {
        html += `
          <tr>
            <td>
              <strong style="color: var(--screen-text);">${r.title}</strong>
              <div style="margin-top: 4px;">
                <a href="${r.url}" target="_blank" rel="noopener noreferrer" class="nasa-cite-link">
                  NASA Reference Page &nearr;
                </a>
              </div>
            </td>
            <td>${r.supports}</td>
            <td><span class="feature-tag">${r.featureMapping}</span></td>
          </tr>
        `;
      });

      tbody.innerHTML = html;
    },

    renderOngoingResearch(src) {
      const container = document.getElementById('sources-research-container');
      if (!container) return;

      let html = `
        <div class="gap-statement-callout">
          <h4>What Exists and What Gap LANDFALL Fills</h4>
          <p>${src.gapAnalysisStatement.summary}</p>
          <p style="font-size: 12.5px; color: var(--screen-dim); margin-top: 6px;">
            <em>Honesty Declaration: ${src.gapAnalysisStatement.honestyNote}</em>
          </p>
        </div>
        <div class="research-cards-grid">
      `;

      src.ongoingResearch.forEach(item => {
        html += `
          <div class="research-card">
            <div class="research-header">
              <span class="research-name">${item.title}</span>
              <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="nasa-cite-link">NASA Source &nearr;</a>
            </div>
            <div class="research-body">
              <p><strong>What Exists Today:</strong> ${item.existsWhat}</p>
              <p style="margin-top: 4px;"><strong>LANDFALL's Operational Integration:</strong> ${item.gapLANDFALL}</p>
            </div>
          </div>
        `;
      });

      html += '</div>';
      container.innerHTML = html;
    },

    renderCommDelayVerification(src) {
      const container = document.getElementById('sources-delay-container');
      if (!container) return;

      const del = src.commDelayFigures;
      let html = `
        <div class="delay-verification-card">
          <div class="delay-note-header">
            <span class="shape-triangle"></span>
            <strong>Communication Delay Physics &bull; Citation Integrity Status</strong>
          </div>
          <p style="font-size: 13px; color: #CAD5D4; margin: 8px 0 12px 0;">
            NASA's human research pages do not specify exact Hohmann transit radio latency curves. To maintain academic and competition integrity, all delay calculations are marked with verified or pending status:
          </p>
          <div class="delay-status-grid">
            <div class="delay-status-item">
              <span class="delay-location">${del.iss.location}</span>
              <div class="delay-figure num">${del.iss.nominalDelayText}</div>
              <span class="status-badge status-caution">${del.iss.citationStatus.toUpperCase()}</span>
              <p class="delay-item-note">${del.iss.citationNote}</p>
            </div>
            <div class="delay-status-item">
              <span class="delay-location">${del.moon.location}</span>
              <div class="delay-figure num">${del.moon.nominalDelayText}</div>
              <span class="status-badge status-caution">${del.moon.citationStatus.toUpperCase()}</span>
              <p class="delay-item-note">${del.moon.citationNote}</p>
            </div>
            <div class="delay-status-item">
              <span class="delay-location">${del.marsTransit.location}</span>
              <div class="delay-figure num">${del.marsTransit.nominalDelayText}</div>
              <span class="status-badge status-caution">${del.marsTransit.citationStatus.toUpperCase()}</span>
              <p class="delay-item-note">${del.marsTransit.citationNote}</p>
            </div>
          </div>
        </div>
      `;

      container.innerHTML = html;
    },

    renderCsaSection(src) {
      const container = document.getElementById('sources-csa-container');
      if (!container) return;

      const csa = src.csaRadiation;
      container.innerHTML = `
        <div class="csa-citation-card">
          <div class="csa-header">
            <strong>${csa.title}</strong>
            <span class="status-badge status-nominal">${csa.publisher}</span>
          </div>
          <p style="font-size: 13px; color: #CAD5D4; margin: 6px 0;">
            ${csa.note}
          </p>
          <a href="${csa.url}" target="_blank" rel="noopener noreferrer" class="nasa-cite-link">
            Open Canadian Space Agency Radiation Page &nearr;
          </a>
        </div>
      `;
    }
  };

  window.SourcesUI = SourcesUI;
})(window);
