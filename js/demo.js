/**
 * LANDFALL - Judge Demo Runner & Title Screen (demo.js)
 * 1. Title Screen on first load (3 verbs: Gather, Evaluate, Act + pitch line)
 * 2. 30-second automated narrated walkthrough (Days 35 to 60) for NASA judges
 */

(function(window) {
  'use strict';

  let demoRunning = false;
  let demoInterval = null;

  const LANDFALL_DEMO = {
    init() {
      this.initTitleScreen();
    },

    initTitleScreen() {
      const modal = document.getElementById('title-screen-modal');
      const btnStart = document.getElementById('btn-start-mission');

      if (!modal || !btnStart) return;

      // Check if user has already dismissed title screen during this session
      const dismissed = sessionStorage.getItem('landfall_title_dismissed');
      if (dismissed === 'true') {
        modal.style.display = 'none';
      } else {
        modal.style.display = 'flex';
      }

      btnStart.addEventListener('click', () => {
        modal.classList.add('fade-out');
        setTimeout(() => {
          modal.style.display = 'none';
        }, 400);
        sessionStorage.setItem('landfall_title_dismissed', 'true');
      });
    },

    play() {
      if (demoRunning) {
        this.stop();
        return;
      }

      demoRunning = true;
      const btnPlay = document.getElementById('btn-play-demo');
      if (btnPlay) {
        btnPlay.textContent = 'Stop demo';
        btnPlay.classList.add('active');
      }

      // Start at Day 35
      window.LandfallState.setDay(35);
      window.activateTab('today');
      this.showCaption("Day 35: Nominal baseline cruise. 7.4h sleep, calm vitals, full 1.5h exercise adherence.");

      let currentStepDay = 35;

      demoInterval = setInterval(() => {
        currentStepDay += 1;
        window.LandfallState.setDay(currentStepDay);

        if (currentStepDay === 40) {
          window.activateTab('today');
          this.showCaption("Day 40: Acute sleep collapse (4.2h)! Headache reported. Cabin CO2 spikes to 5200 ppm. 'Check scrubber first' rule triggers.");
        } else if (currentStepDay === 44) {
          window.activateTab('trends');
          this.showCaption("Day 44 (Evaluate): Trends tab reveals 5-day continuous divergence from personal baseline. Sleep and mood decline.");
        } else if (currentStepDay === 48) {
          window.activateTab('forecast');
          this.showCaption("Day 48 (Evaluate): Landing-day forecast projections degrade to caution/red based on published NASA loss rates.");
        } else if (currentStepDay === 52) {
          // Demonstrate What-If slider recovery
          const slider = document.getElementById('forecast-adherence-slider');
          if (slider) {
            slider.value = 1.5;
            slider.dispatchEvent(new Event('input'));
          }
          this.showCaption("Day 52: Countermeasures engaged. Moving What-If exercise slider demonstrates physiological recovery before landing.");
        } else if (currentStepDay === 56) {
          window.activateTab('act');
          this.showCaption("Day 56 (Act): Comm delay is over 3 minutes. Ground cannot direct in real time. Triage assigns resolution to Crew Medical Officer.");
          const btnSend = document.getElementById('btn-send-packet');
          if (btnSend) btnSend.click();
        } else if (currentStepDay >= 60) {
          this.stop();
          this.showCaption("Demo sequence completed: Gathered baseline drift, evaluated landing-day risk, acted autonomously across the delay.");
          setTimeout(() => {
            this.hideCaption();
          }, 5000);
        }
      }, 1000); // 25 seconds total run time across 25 transit days
    },

    stop() {
      demoRunning = false;
      if (demoInterval) clearInterval(demoInterval);
      const btnPlay = document.getElementById('btn-play-demo');
      if (btnPlay) {
        btnPlay.textContent = 'Play 30-second demo';
        btnPlay.classList.remove('active');
      }
    },

    showCaption(text) {
      const toast = document.getElementById('demo-caption');
      const textEl = document.getElementById('demo-caption-text');
      if (toast && textEl) {
        textEl.textContent = text;
        toast.classList.add('visible');
      }
    },

    hideCaption() {
      const toast = document.getElementById('demo-caption');
      if (toast) {
        toast.classList.remove('visible');
      }
    }
  };

  window.LANDFALL_DEMO = LANDFALL_DEMO;
})(window);
