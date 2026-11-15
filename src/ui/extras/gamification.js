/**
 * LANDFALL v3.0 - Gamification UI & Audio Synthesizer (src/ui/extras/gamification.js)
 * Mounts and renders XP progress, level badges, achievement showcases, and sound effects.
 */

import { GamificationEngine } from '../../core/gamification-engine.js';
import { $ } from '../dom.js';

export const GameState = new GamificationEngine();

// -------------------------------------------------------------
// Web Audio API Synthesizer (Zero external dependency, works offline)
// -------------------------------------------------------------
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx && typeof window !== 'undefined') {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playSound(type) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'zoom') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(680, now + 0.15);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'unlock') {
      // Arpeggio triumph chord
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, now + i * 0.06);
        g.gain.setValueAtTime(0.08, now + i * 0.06);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.3);
        o.start(now + i * 0.06);
        o.stop(now + i * 0.06 + 0.3);
      });
    } else if (type === 'xp') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.linearRampToValueAtTime(880, now + 0.1);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    }
  } catch {
    // Audio context may be blocked by browser autoplay policy before user gesture
  }
}

// -------------------------------------------------------------
// UI Toast Notifications
// -------------------------------------------------------------
export function showUnlockToast(title, name, icon = '🏆') {
  let toast = document.getElementById('game-unlock-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'game-unlock-toast';
    toast.className = 'game-unlock-toast';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `
    <div class="game-unlock-icon">${icon}</div>
    <div class="game-unlock-text">
      <span class="game-unlock-title">${title}</span>
      <span class="game-unlock-name">${name}</span>
    </div>
  `;

  toast.classList.add('show');
  playSound('unlock');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
}

// -------------------------------------------------------------
// Render Gamification Controls & Widgets
// -------------------------------------------------------------
export function renderGamificationHUD(containerEl) {
  if (!containerEl) return;
  const rank = GameState.getRank();
  const badges = GameState.getBadgeStatus();
  const leaderboard = GameState.getLeaderboard();

  containerEl.innerHTML = `
    <div class="game-rank-bar">
      <div class="game-level-badge">
        <span class="game-level-num">${rank.level}</span>
        <span class="game-level-lbl">LVL</span>
      </div>
      <div class="game-xp-track-wrap">
        <div class="game-xp-labels">
          <span class="game-rank-name">${rank.title}</span>
          <span class="game-xp-val">${rank.xp} / ${rank.maxXP} XP</span>
        </div>
        <div class="game-xp-bar-outer">
          <div class="game-xp-bar-inner" style="width: ${rank.progressPct}%;"></div>
        </div>
      </div>
      <div class="game-streak-pill" title="Daily Autonomous Health Adherence Streak">
        <span class="game-streak-flame">🔥</span>
        <span>${GameState.streak}d Streak</span>
      </div>
    </div>

    <!-- Collapsible Badges & Leaderboard Drawer -->
    <details class="glass-panel" style="padding: 12px 16px; margin-top: 10px;">
      <summary style="cursor: pointer; font-family: var(--font-heading); font-size: 14px; color: var(--text-2); display: flex; justify-content: space-between; align-items: center;">
        <span>🏆 Astronaut Achievements &amp; Crew Standing (${badges.filter(b => b.unlocked).length}/${badges.length})</span>
        <span style="font-size: 11px; color: var(--accent);">Expand &darr;</span>
      </summary>

      <div style="margin-top: 14px;">
        <h4 style="font-family: var(--font-heading); font-size: 13px; color: var(--text-3); text-transform: uppercase; margin: 0 0 8px 0;">
          Mission Badges
        </h4>
        <div class="game-badges-grid">
          ${badges.map(b => `
            <div class="game-badge-card ${b.unlocked ? '' : 'locked'}" title="${b.desc}">
              <div class="game-badge-icon">${b.icon}</div>
              <div class="game-badge-name">${b.name}</div>
              <div class="game-badge-desc">${b.desc}</div>
            </div>
          `).join('')}
        </div>

        <h4 style="font-family: var(--font-heading); font-size: 13px; color: var(--text-3); text-transform: uppercase; margin: 18px 0 6px 0;">
          Ares-VI Cooperative Crew Standing
        </h4>
        <table class="game-leaderboard-table">
          <tbody>
            ${leaderboard.map((c, i) => `
              <tr class="game-leaderboard-row ${c.active ? 'active-crew' : ''}">
                <td><strong>#${i + 1}</strong></td>
                <td>
                  <div style="font-weight: 600; color: var(--text);">${c.callsign}</div>
                  <div style="font-size: 11px; color: var(--text-3);">${c.role}</div>
                </td>
                <td><span class="pill ${c.tier === 'Tier I' ? 'ok' : 'warn'}">${c.tier}</span></td>
                <td><strong class="num">${c.score} XP</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </details>
  `;
}
