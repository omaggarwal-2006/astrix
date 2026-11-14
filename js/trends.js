/**
 * LANDFALL - Trends Tab (trends.js)
 * Implements the "Evaluate" verb for longitudinal telemetry:
 * 1. 180-day Chart.js multi-parameter line charts: Sleep, Mood, Heart Rate
 * 2. Visual Personal Baseline reference guides
 * 3. Active day cursor annotation
 * 4. Plain-language clinical summary beneath each chart
 */

(function(window) {
  'use strict';

  let sleepChartInstance = null;
  let moodChartInstance = null;
  let hrChartInstance = null;

  const TrendsUI = {
    init() {
      this.bindEvents();
      this.render();
    },

    bindEvents() {
      if (window.LandfallState) {
        window.LandfallState.subscribe((day) => {
          this.updateCharts(day);
        });
      }
    },

    render() {
      const day = window.LandfallState ? window.LandfallState.currentDay : 40;
      this.createSleepChart(day);
      this.createMoodChart(day);
      this.createHrChart(day);
      this.updateSummaries(day);
    },

    updateCharts(day) {
      if (!window.Chart) return;
      this.updateChartHighlight(sleepChartInstance, day);
      this.updateChartHighlight(moodChartInstance, day);
      this.updateChartHighlight(hrChartInstance, day);
      this.updateSummaries(day);
    },

    updateChartHighlight(chart, day) {
      if (!chart) return;
      // Dataset 2 is the active day highlight point
      const dataPoints = chart.data.datasets[0].data;
      const activePoint = new Array(180).fill(null);
      activePoint[day - 1] = dataPoints[day - 1];
      chart.data.datasets[2].data = activePoint;
      chart.update('none'); // Update smoothly without full animation
    },

    createSleepChart(activeDay) {
      const canvas = document.getElementById('chart-trend-sleep');
      if (!canvas || !window.Chart || !window.DataEngine) return;

      const history = window.DataEngine.getHistory('sleep');
      const labels = history.map(h => `D${h.day}`);
      const values = history.map(h => h.value);
      const baselineValues = history.map(h => h.baseline);

      const activePoint = new Array(180).fill(null);
      activePoint[activeDay - 1] = values[activeDay - 1];

      const ctx = canvas.getContext('2d');
      if (sleepChartInstance) sleepChartInstance.destroy();

      sleepChartInstance = new window.Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Recorded sleep (hours)',
              data: values,
              borderColor: '#2F8F83',
              borderWidth: 2,
              pointRadius: 0,
              tension: 0.25,
              fill: {
                target: 'origin',
                above: 'rgba(47, 143, 131, 0.08)'
              }
            },
            {
              label: 'Calibrated baseline (7.4h)',
              data: baselineValues,
              borderColor: 'rgba(230, 235, 234, 0.55)',
              borderWidth: 1.5,
              borderDash: [5, 5],
              pointRadius: 0,
              fill: false
            },
            {
              label: 'Active day reading',
              data: activePoint,
              borderColor: '#E3A21A',
              backgroundColor: '#E3A21A',
              pointRadius: 6,
              pointHoverRadius: 8,
              showLine: false
            }
          ]
        },
        options: this.getCommonChartOptions('Hours', 3.0, 9.0)
      });
    },

    createMoodChart(activeDay) {
      const canvas = document.getElementById('chart-trend-mood');
      if (!canvas || !window.Chart || !window.DataEngine) return;

      const history = window.DataEngine.getHistory('mood');
      const labels = history.map(h => `D${h.day}`);
      const values = history.map(h => h.value);
      const baselineValues = history.map(h => h.baseline);

      const activePoint = new Array(180).fill(null);
      activePoint[activeDay - 1] = values[activeDay - 1];

      const ctx = canvas.getContext('2d');
      if (moodChartInstance) moodChartInstance.destroy();

      moodChartInstance = new window.Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Mood & resilience score',
              data: values,
              borderColor: '#38BDF8',
              borderWidth: 2,
              pointRadius: 0,
              tension: 0.25,
              fill: {
                target: 'origin',
                above: 'rgba(56, 189, 248, 0.08)'
              }
            },
            {
              label: 'Baseline (4.2)',
              data: baselineValues,
              borderColor: 'rgba(230, 235, 234, 0.55)',
              borderWidth: 1.5,
              borderDash: [5, 5],
              pointRadius: 0,
              fill: false
            },
            {
              label: 'Active day reading',
              data: activePoint,
              borderColor: '#E3A21A',
              backgroundColor: '#E3A21A',
              pointRadius: 6,
              showLine: false
            }
          ]
        },
        options: this.getCommonChartOptions('Score 1-5', 1.0, 5.0)
      });
    },

    createHrChart(activeDay) {
      const canvas = document.getElementById('chart-trend-hr');
      if (!canvas || !window.Chart || !window.DataEngine) return;

      const history = window.DataEngine.getHistory('heartRate');
      const labels = history.map(h => `D${h.day}`);
      const values = history.map(h => h.value);
      const baselineValues = history.map(h => h.baseline);

      const activePoint = new Array(180).fill(null);
      activePoint[activeDay - 1] = values[activeDay - 1];

      const ctx = canvas.getContext('2d');
      if (hrChartInstance) hrChartInstance.destroy();

      hrChartInstance = new window.Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Resting heart rate (bpm)',
              data: values,
              borderColor: '#E3A21A',
              borderWidth: 2,
              pointRadius: 0,
              tension: 0.25,
              fill: {
                target: 'origin',
                above: 'rgba(227, 162, 26, 0.08)'
              }
            },
            {
              label: 'Baseline (64 bpm)',
              data: baselineValues,
              borderColor: 'rgba(230, 235, 234, 0.55)',
              borderWidth: 1.5,
              borderDash: [5, 5],
              pointRadius: 0,
              fill: false
            },
            {
              label: 'Active day reading',
              data: activePoint,
              borderColor: '#C8322B',
              backgroundColor: '#C8322B',
              pointRadius: 6,
              showLine: false
            }
          ]
        },
        options: this.getCommonChartOptions('BPM', 50, 95)
      });
    },

    getCommonChartOptions(yUnit, yMin, yMax) {
      return {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.06)' },
            ticks: {
              color: '#8E9F9D',
              maxTicksLimit: 12,
              font: { size: 10, family: 'Barlow' }
            }
          },
          y: {
            min: yMin,
            max: yMax,
            grid: { color: 'rgba(255, 255, 255, 0.08)' },
            ticks: {
              color: '#8E9F9D',
              font: { size: 10, family: 'Barlow' }
            },
            title: {
              display: true,
              text: yUnit,
              color: '#8E9F9D',
              font: { size: 11, family: 'Barlow Semi Condensed' }
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: '#E6EBEA',
              boxWidth: 12,
              font: { size: 11, family: 'Barlow' }
            }
          },
          tooltip: {
            backgroundColor: '#091520',
            titleColor: '#E6EBEA',
            bodyColor: '#E6EBEA',
            borderColor: '#1E374E',
            borderWidth: 1
          }
        }
      };
    },

    // Plain-Language Summaries Under Each Chart
    updateSummaries(day) {
      const dayData = window.StorageManager ? window.StorageManager.getDay(day) : null;
      if (!dayData) return;

      const v = dayData.vitals;
      const sleepEl = document.getElementById('trend-summary-sleep');
      const moodEl = document.getElementById('trend-summary-mood');
      const hrEl = document.getElementById('trend-summary-hr');

      if (sleepEl) {
        if (day >= 40 && day <= 50) {
          const runDays = day - 39;
          sleepEl.textContent = `Sleep ${v.sleepHours} h vs baseline 7.4 h, ${runDays} days running (acute collapse window).`;
          sleepEl.className = 'plain-summary alarm';
        } else if (v.sleepHours < 6.5) {
          sleepEl.textContent = `Sleep ${v.sleepHours} h vs baseline 7.4 h, mild deficit accumulated.`;
          sleepEl.className = 'plain-summary caution';
        } else {
          sleepEl.textContent = `Sleep ${v.sleepHours} h vs baseline 7.4 h, nominal physiological continuity.`;
          sleepEl.className = 'plain-summary nominal';
        }
      }

      if (moodEl) {
        if (day >= 40 && day <= 55) {
          moodEl.textContent = `Mood ${v.mood} / 5.0 vs baseline 4.2, stress elevation correlated with sleep deficit.`;
          moodEl.className = 'plain-summary caution';
        } else {
          moodEl.textContent = `Mood ${v.mood} / 5.0 vs baseline 4.2, cognitive stability nominal.`;
          moodEl.className = 'plain-summary nominal';
        }
      }

      if (hrEl) {
        if (v.heartRate > 70) {
          hrEl.textContent = `Heart rate ${v.heartRate} bpm vs baseline 64 bpm, resting drift secondary to fatigue.`;
          hrEl.className = 'plain-summary caution';
        } else {
          hrEl.textContent = `Heart rate ${v.heartRate} bpm vs baseline 64 bpm, stable autonomic tone.`;
          hrEl.className = 'plain-summary nominal';
        }
      }
    }
  };

  window.TrendsUI = TrendsUI;
})(window);
