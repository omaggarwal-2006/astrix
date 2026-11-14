/**
 * LANDFALL - Trend charts (Chart.js): sleep, mood, heart rate (src/ui/components/trend-chart.js)
 * Moved from main.js unchanged during the repo restructure (docs/22-MIGRATION.md).
 */

import { AppState } from "../../app/state.js";
import { getReadings } from "../../core/adapter.js";

export function initTrendChartButtons() {
  const btnSleep = document.getElementById('btn-chart-sleep');
  const btnMood = document.getElementById('btn-chart-mood');
  const btnHr = document.getElementById('btn-chart-hr');

  const showChart = (chartKey) => {
    AppState.activeTrendChart = chartKey;
    [btnSleep, btnMood, btnHr].forEach(b => {
      if (b) b.classList.remove('active');
    });

    const wrapSleep = document.getElementById('chart-wrap-sleep');
    const wrapMood = document.getElementById('chart-wrap-mood');
    const wrapHr = document.getElementById('chart-wrap-hr');

    if (wrapSleep) wrapSleep.style.display = chartKey === 'sleep' ? 'block' : 'none';
    if (wrapMood) wrapMood.style.display = chartKey === 'mood' ? 'block' : 'none';
    if (wrapHr) wrapHr.style.display = chartKey === 'hr' ? 'block' : 'none';

    if (chartKey === 'sleep' && btnSleep) btnSleep.classList.add('active');
    if (chartKey === 'mood' && btnMood) btnMood.classList.add('active');
    if (chartKey === 'hr' && btnHr) btnHr.classList.add('active');

    renderTrendLines(AppState.currentDay);
  };

  if (btnSleep) btnSleep.addEventListener('click', () => showChart('sleep'));
  if (btnMood) btnMood.addEventListener('click', () => showChart('mood'));
  if (btnHr) btnHr.addEventListener('click', () => showChart('hr'));
}

export function renderTrendLines(activeDay) {
  if (!window.Chart) return;

  drawRestyledTrend('trend-sleep-chart', 'sleep_h', 7.4, 3.0, 9.0, 'Hours', activeDay);
  drawRestyledTrend('trend-mood-chart', 'mood', 4.2, 1.0, 5.0, 'Score (1-5)', activeDay);
  drawRestyledTrend('trend-hr-chart', 'hr_bpm', 64, 50, 95, 'BPM', activeDay);

  const sumEl = document.getElementById('plain-chart-summary');
  if (sumEl) {
    const readings = getReadings(activeDay).vitals;
    if (AppState.activeTrendChart === 'sleep') {
      if (activeDay >= 40 && activeDay <= 52) {
        sumEl.textContent = `Day ${activeDay}: Sleep dropped to ${readings.sleep_h} h vs baseline 7.4 h. Circadian disruption alert active.`;
        sumEl.style.color = '#FFAAA3';
      } else {
        sumEl.textContent = `Day ${activeDay}: Sleep is ${readings.sleep_h} h, steady with personal baseline.`;
        sumEl.style.color = 'var(--starlight)';
      }
    } else if (AppState.activeTrendChart === 'mood') {
      if (activeDay >= 43 && activeDay <= 55) {
        sumEl.textContent = `Day ${activeDay}: Mood score declined to ${readings.mood} / 5.0 secondary to chronic sleep debt.`;
        sumEl.style.color = '#E8A93A';
      } else {
        sumEl.textContent = `Day ${activeDay}: Behavioral health score is ${readings.mood} / 5.0, within expected nominal range.`;
        sumEl.style.color = 'var(--starlight)';
      }
    } else {
      sumEl.textContent = `Day ${activeDay}: Resting heart rate is ${readings.hr_bpm} bpm vs personal baseline 64 bpm. Stable autonomic regulation.`;
      sumEl.style.color = 'var(--starlight)';
    }
  }
}

export function drawRestyledTrend(canvasId, key, baseVal, yMin, yMax, yUnit, activeDay) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const days = Array.from({ length: 180 }, (_, i) => i + 1);
  const values = days.map(d => getReadings(d).vitals[key]);
  const baseline = new Array(180).fill(baseVal);
  const activePoint = new Array(180).fill(null);
  activePoint[activeDay - 1] = values[activeDay - 1];

  if (AppState.trendCharts[canvasId]) {
    AppState.trendCharts[canvasId].data.datasets[0].data = values; // picks up logged check-ins
    AppState.trendCharts[canvasId].data.datasets[2].data = activePoint;
    AppState.trendCharts[canvasId].update('none');
    return;
  }

  const ctx = canvas.getContext('2d');
  AppState.trendCharts[canvasId] = new window.Chart(ctx, {
    type: 'line',
    data: {
      labels: days.map(d => `D${d}`),
      datasets: [
        {
          label: 'Recorded Value',
          data: values,
          borderColor: '#3FB59A',
          borderWidth: 1.5,
          pointRadius: 0,
          tension: 0.15
        },
        {
          label: 'Personal Baseline',
          data: baseline,
          borderColor: '#243044',
          borderWidth: 1.5,
          borderDash: [4, 4],
          pointRadius: 0
        },
        {
          label: 'Active Mission Day',
          data: activePoint,
          borderColor: '#E8A93A',
          backgroundColor: '#E8A93A',
          pointRadius: 5,
          showLine: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      scales: {
        x: {
          grid: { color: 'rgba(36, 48, 68, 0.4)' },
          ticks: { color: '#9FAAA8', maxTicksLimit: 12, font: { size: 12 } }
        },
        y: {
          min: yMin,
          max: yMax,
          grid: { color: 'rgba(36, 48, 68, 0.4)' },
          ticks: { color: '#9FAAA8', font: { size: 12 } },
          title: { display: true, text: yUnit, color: '#9FAAA8', font: { size: 13 } }
        }
      },
      plugins: {
        legend: { labels: { color: '#E8E4D8', font: { size: 13 } } }
      }
    }
  });
}
