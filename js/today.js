/**
 * LANDFALL - Today Tab (today.js)
 * Implements the "Gather" verb:
 * 1. Landing Readiness Dial (Hero) with orchestrated initial sweep
 * 2. Daily check-in form with LocalStorage persistence
 * 3. Baseline Ratio Radar Chart (flat ring at 1.0)
 * 4. Clickable SVG Body Map (head, chest, torso, arms, legs)
 * 5. Cabin Environmental Panel (with "Check the scrubber first" rule)
 * 6. Immune Status Panel
 * 7. Cumulative Radiation Total (Tracked, not forecast)
 */

(function(window) {
  'use strict';

  let radarChartInstance = null;
  let activeBodyPart = 'head';

  const TodayUI = {
    init() {
      this.bindEvents();
      this.render();
      this.animateDialInitial();
    },

    bindEvents() {
      // Subscribe to global mission day changes
      if (window.LandfallState) {
        window.LandfallState.subscribe((day) => {
          this.render();
        });
      }

      // Check-in form submit
      const form = document.getElementById('daily-checkin-form');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleFormSubmit();
        });
      }

      // Body Map Part Clicks
      const bodyParts = document.querySelectorAll('.body-part');
      bodyParts.forEach(part => {
        part.addEventListener('click', () => {
          const partId = part.getAttribute('data-part');
          this.selectBodyPart(partId);
        });
        part.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const partId = part.getAttribute('data-part');
            this.selectBodyPart(partId);
          }
        });
      });
    },

    getCurrentData() {
      const day = window.LandfallState ? window.LandfallState.currentDay : 40;
      const data = window.StorageManager ? window.StorageManager.getDay(day) : null;
      const baseline = window.DataEngine ? window.DataEngine.getBaseline() : null;
      return { day, data, baseline };
    },

    render() {
      const { day, data, baseline } = this.getCurrentData();
      if (!data || !baseline) return;

      this.updateDial(day, data, baseline);
      this.populateForm(data);
      this.renderRadarChart(data, baseline);
      this.updateBodyMap(data);
      this.updateCabinPanel(data);
      this.updateImmunePanel(data);
      this.updateRadiationPanel(data);
    },

    // 1. Landing Readiness Dial
    updateDial(day, data, baseline) {
      const forecast = window.ForecastEngine 
        ? window.ForecastEngine.calculateLandingReadiness(day, 1.5)
        : { overallReadinessScore: 84, overallStatus: 'nominal' };

      const score = forecast.overallReadinessScore;
      const status = forecast.overallStatus;
      const daysToLanding = 180 - day;

      const scoreEl = document.getElementById('dial-readiness-score');
      const statusWord = document.getElementById('dial-status-word');
      const statusShape = document.getElementById('dial-status-shape');
      const daysEl = document.getElementById('dial-days-to-landing');
      const meterBar = document.getElementById('dial-meter-bar');

      if (scoreEl) scoreEl.textContent = `${score}%`;
      if (daysEl) daysEl.textContent = `${daysToLanding} days`;

      // Status text + shape (never color alone)
      if (statusWord && statusShape) {
        if (status === 'nominal') {
          statusWord.textContent = 'Nominal Function';
          statusWord.className = 'status-badge status-nominal';
          statusShape.innerHTML = '<span class="shape-circle" title="Nominal condition"></span>';
        } else if (status === 'caution') {
          statusWord.textContent = 'Caution: Drift Detected';
          statusWord.className = 'status-badge status-caution';
          statusShape.innerHTML = '<span class="shape-triangle" title="Caution warning"></span>';
        } else {
          statusWord.textContent = 'Alarm: Urgent Countermeasures';
          statusWord.className = 'status-badge status-alarm';
          statusShape.innerHTML = '<span class="shape-octagon" title="Critical alarm"></span>';
        }
      }

      if (meterBar) {
        // SVG circle stroke-dashoffset or width
        const offset = 283 - (283 * (score / 100));
        meterBar.style.strokeDashoffset = offset;
        meterBar.setAttribute('stroke', status === 'nominal' ? 'var(--scrubber-teal)' : (status === 'caution' ? 'var(--caution-amber)' : 'var(--alarm-red)'));
      }
    },

    animateDialInitial() {
      const meterBar = document.getElementById('dial-meter-bar');
      if (meterBar) {
        meterBar.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(0.2, 0.9, 0.3, 1)';
      }
    },

    // 2. Check-In Form
    populateForm(data) {
      const v = data.vitals || {};
      const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val !== undefined ? val : '';
      };

      setVal('checkin-hr', v.heartRate);
      setVal('checkin-sys', v.bloodPressure ? v.bloodPressure.systolic : 116);
      setVal('checkin-dia', v.bloodPressure ? v.bloodPressure.diastolic : 76);
      setVal('checkin-temp', v.temperature);
      setVal('checkin-sleep', v.sleepHours);
      setVal('checkin-mood', v.mood);
      setVal('checkin-exercise', v.exerciseMinutes);

      // Symptoms checkboxes
      const symptoms = data.symptoms || [];
      document.querySelectorAll('.symptom-check').forEach(chk => {
        chk.checked = symptoms.includes(chk.value);
      });
    },

    handleFormSubmit() {
      const { day } = this.getCurrentData();
      const getNum = (id) => parseFloat(document.getElementById(id).value) || 0;

      const symptoms = [];
      document.querySelectorAll('.symptom-check:checked').forEach(chk => {
        symptoms.push(chk.value);
      });

      const updated = {
        vitals: {
          heartRate: getNum('checkin-hr'),
          bloodPressure: {
            systolic: getNum('checkin-sys'),
            diastolic: getNum('checkin-dia')
          },
          temperature: getNum('checkin-temp'),
          sleepHours: getNum('checkin-sleep'),
          mood: getNum('checkin-mood'),
          exerciseMinutes: getNum('checkin-exercise')
        },
        symptoms
      };

      if (window.StorageManager) {
        window.StorageManager.saveCheckIn(day, updated);
      }

      this.render();

      const btn = document.getElementById('btn-save-checkin');
      if (btn) {
        const original = btn.textContent;
        btn.textContent = "Check-in logged";
        btn.classList.add('saved');
        setTimeout(() => {
          btn.textContent = original;
          btn.classList.remove('saved');
        }, 1800);
      }
    },

    // 3. Baseline Ratio Radar Chart (1.0 = Flat Ring)
    renderRadarChart(data, baseline) {
      const canvas = document.getElementById('radar-baseline-chart');
      if (!canvas || !window.Chart) return;

      const v = data.vitals || {};
      // Calculate ratios relative to astronaut's own baseline
      // Flat ring at 1.0 means exactly equal to personal baseline
      const sleepRatio = +(v.sleepHours / baseline.sleepHours).toFixed(2);
      // Invert HR ratio so elevation represents divergence from 1.0
      const hrRatio = +(v.heartRate / baseline.heartRate).toFixed(2);
      const moodRatio = +(v.mood / baseline.mood).toFixed(2);
      const exerciseRatio = +(v.exerciseMinutes / baseline.exerciseMinutes).toFixed(2);
      const bpRatio = +((v.bloodPressure ? v.bloodPressure.systolic : 116) / baseline.bloodPressure.systolic).toFixed(2);
      const tempRatio = +(v.temperature / baseline.temperature).toFixed(2);

      const labels = [
        'Sleep hours',
        'Heart rate',
        'Mood & resilience',
        'Exercise load',
        'Blood pressure',
        'Core temp'
      ];

      const currentValues = [sleepRatio, hrRatio, moodRatio, exerciseRatio, bpRatio, tempRatio];
      const baselineValues = [1.0, 1.0, 1.0, 1.0, 1.0, 1.0];

      if (radarChartInstance) {
        radarChartInstance.data.datasets[0].data = currentValues;
        radarChartInstance.update();
        return;
      }

      const ctx = canvas.getContext('2d');
      radarChartInstance = new window.Chart(ctx, {
        type: 'radar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Today vs Baseline (Ratio)',
              data: currentValues,
              backgroundColor: 'rgba(47, 143, 131, 0.25)',
              borderColor: '#2F8F83',
              borderWidth: 2,
              pointBackgroundColor: '#2F8F83',
              pointRadius: 4
            },
            {
              label: 'Personal Baseline (1.0)',
              data: baselineValues,
              borderColor: 'rgba(230, 235, 234, 0.65)',
              borderWidth: 1.5,
              borderDash: [4, 4],
              pointRadius: 0,
              fill: false
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            r: {
              min: 0.4,
              max: 1.6,
              ticks: {
                stepSize: 0.2,
                color: '#8E9F9D',
                backdropColor: 'transparent',
                font: { size: 10, family: 'Barlow' }
              },
              grid: {
                color: 'rgba(255, 255, 255, 0.12)'
              },
              angleLines: {
                color: 'rgba(255, 255, 255, 0.12)'
              },
              pointLabels: {
                color: '#E6EBEA',
                font: { size: 11, family: 'Barlow Semi Condensed', weight: 600 }
              }
            }
          },
          plugins: {
            legend: {
              display: true,
              position: 'bottom',
              labels: {
                color: '#E6EBEA',
                boxWidth: 12,
                font: { size: 11, family: 'Barlow' }
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `${context.dataset.label}: ${context.raw}x baseline`;
                }
              }
            }
          }
        }
      });
    },

    // 4. Clickable SVG Body Map
    updateBodyMap(data) {
      const drift = data.bodyMapDrift || {};
      const parts = ['head', 'chest', 'torso', 'arms', 'legs'];

      parts.forEach(p => {
        const pathEl = document.getElementById(`body-${p}`);
        const status = drift[p] || 'nominal';
        if (pathEl) {
          pathEl.setAttribute('data-status', status);
          if (status === 'nominal') {
            pathEl.style.fill = '#2F8F83';
          } else if (status === 'caution') {
            pathEl.style.fill = '#E3A21A';
          } else {
            pathEl.style.fill = '#C8322B';
          }
        }
      });

      this.renderBodyPartDetails(activeBodyPart, data);
    },

    selectBodyPart(partId) {
      activeBodyPart = partId;
      document.querySelectorAll('.body-part').forEach(p => {
        p.classList.toggle('selected', p.getAttribute('data-part') === partId);
      });
      const { data } = this.getCurrentData();
      if (data) {
        this.renderBodyPartDetails(partId, data);
      }
    },

    renderBodyPartDetails(partId, data) {
      const detailContainer = document.getElementById('body-part-readout');
      if (!detailContainer) return;

      const v = data.vitals || {};
      const status = (data.bodyMapDrift && data.bodyMapDrift[partId]) || 'nominal';
      const titles = {
        head: 'Head & Neurosensory',
        chest: 'Chest, Pulmonary & Cardio',
        torso: 'Torso & Visceral Cavity',
        arms: 'Upper Limbs & Grip',
        legs: 'Lower Limbs & Calcaneus'
      };

      let infoText = '';
      if (partId === 'head') {
        infoText = `Headache: ${data.symptoms.includes('headache') ? 'Reported' : 'None'}. Sleep debt: ${(7.4 - v.sleepHours).toFixed(1)}h deficit. Pupillary reflex nominal.`;
      } else if (partId === 'chest') {
        infoText = `Heart rate: ${v.heartRate} bpm. BP: ${v.bloodPressure.systolic}/${v.bloodPressure.diastolic} mmHg. Respiration: 14 breaths/min.`;
      } else if (partId === 'torso') {
        infoText = `Core temperature: ${v.temperature}°C. Visceral blood distribution adjusted to microgravity fluid shift.`;
      } else if (partId === 'arms') {
        infoText = `Grip strength retention: 94%. Skin integrity nominal, no erythema or petechiae.`;
      } else if (partId === 'legs') {
        infoText = `Soleus muscle tone retention: 88%. Heel bone mineral density monitored. Daily exercise: ${v.exerciseMinutes} mins.`;
      }

      detailContainer.innerHTML = `
        <div class="body-detail-header">
          <strong>${titles[partId]}</strong>
          <span class="status-badge status-${status}">${status.toUpperCase()}</span>
        </div>
        <p class="body-detail-text">${infoText}</p>
      `;
    },

    // 5. Cabin Panel (with "Check the scrubber first" rule)
    updateCabinPanel(data) {
      const c = data.cabin || {};
      const symptoms = data.symptoms || [];

      const co2El = document.getElementById('cabin-co2-val');
      const tempEl = document.getElementById('cabin-temp-val');
      const noiseEl = document.getElementById('cabin-noise-val');
      const alertBox = document.getElementById('scrubber-alert-box');

      if (co2El) co2El.textContent = `${c.co2 || 2800} ppm`;
      if (tempEl) tempEl.textContent = `${c.temperature || 21.5} °C`;
      if (noiseEl) noiseEl.textContent = `${c.noise || 58} dBA`;

      // Rule check: Headache + high CO2 (>=4500 ppm)
      const hasHeadache = symptoms.includes('headache');
      const highCO2 = (c.co2 || 0) >= 4500;

      if (alertBox) {
        if (hasHeadache && highCO2) {
          alertBox.style.display = 'flex';
          alertBox.innerHTML = `
            <span class="shape-triangle" aria-hidden="true"></span>
            <div>
              <strong>Headache plus high CO2: check the scrubber first.</strong>
              <div style="font-size: 12px; margin-top: 2px;">
                Hypercapnia suspected (${c.co2} ppm). Amine Bed scrubber canister may be saturated before prescribing analgesics.
              </div>
            </div>
          `;
        } else {
          alertBox.style.display = 'none';
        }
      }
    },

    // 6. Immune Status Panel
    updateImmunePanel(data) {
      const im = data.immune || {};
      const setIndicator = (id, active) => {
        const el = document.getElementById(id);
        if (el) {
          el.className = `immune-item ${active ? 'active-warning' : 'nominal'}`;
        }
      };

      setIndicator('immune-rash', im.rash);
      setIndicator('immune-cold-sore', im.coldSore);
      setIndicator('immune-fever', im.fever);
      setIndicator('immune-fatigue', im.fatigue);

      const stressEl = document.getElementById('immune-stress-val');
      if (stressEl) stressEl.textContent = `${im.stressScore || 2.2} / 5.0`;
    },

    // 7. Cumulative Radiation Total (Tracked, not forecast)
    updateRadiationPanel(data) {
      const rad = data.radiation || {};
      const dailyEl = document.getElementById('rad-daily-val');
      const cumEl = document.getElementById('rad-cum-val');
      const percentEl = document.getElementById('rad-limit-percent');

      // NASA Career Astronaut Limit reference ~ 600 mSv
      const cum = rad.cumulativeDose || 59.2;
      const pct = Math.round((cum / 600) * 100);

      if (dailyEl) dailyEl.textContent = `${rad.dailyDose || 1.48} mSv/d`;
      if (cumEl) cumEl.textContent = `${cum} mSv`;
      if (percentEl) percentEl.textContent = `${pct}% career threshold`;
    }
  };

  window.TodayUI = TodayUI;
})(window);
