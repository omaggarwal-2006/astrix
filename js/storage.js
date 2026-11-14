/**
 * LANDFALL - Storage Manager (storage.js)
 * Manages localStorage persistence for daily check-ins and seeded telemetry.
 */

(function(window) {
  'use strict';

  const STORAGE_KEY = 'landfall_transit_dataset_v1';
  const CHECKIN_KEY = 'landfall_custom_checkins_v1';

  const StorageManager = {
    init() {
      if (!localStorage.getItem(STORAGE_KEY)) {
        this.seedDemoData();
      }
    },

    seedDemoData() {
      // DataEngine initializes the dataset
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ seededAt: new Date().toISOString() }));
      localStorage.removeItem(CHECKIN_KEY);
    },

    getDay(dayNumber) {
      const day = parseInt(dayNumber, 10);
      const baseDay = window.DataEngine ? window.DataEngine.getDay(day) : null;
      if (!baseDay) return null;

      // Check for user-saved overrides
      const customCheckins = this.getCustomCheckins();
      if (customCheckins[day]) {
        const custom = customCheckins[day];
        baseDay.vitals = { ...baseDay.vitals, ...custom.vitals };
        if (custom.symptoms) baseDay.symptoms = custom.symptoms;
      }
      return baseDay;
    },

    saveCheckIn(dayNumber, checkInData) {
      const day = parseInt(dayNumber, 10);
      const customCheckins = this.getCustomCheckins();
      customCheckins[day] = checkInData;
      localStorage.setItem(CHECKIN_KEY, JSON.stringify(customCheckins));

      if (window.DataEngine) {
        window.DataEngine.saveCheckIn(day, checkInData);
      }
    },

    getCustomCheckins() {
      try {
        const raw = localStorage.getItem(CHECKIN_KEY);
        return raw ? JSON.parse(raw) : {};
      } catch (e) {
        return {};
      }
    },

    resetAll() {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(CHECKIN_KEY);
      this.seedDemoData();
    }
  };

  StorageManager.init();
  window.StorageManager = StorageManager;
})(window);
