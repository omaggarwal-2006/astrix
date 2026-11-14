import { verifyPacket } from "./packet.js";
import { CONFIG } from "./config.js";

const KEY = "landfall_queue";
const useLS = typeof window !== "undefined" && !!window.localStorage;
let memory = "[]";
const listeners = [];

// Demo settings: speedup=100 matlab 600 s ka delay ~12 s mein dikhega
export const config = { ...CONFIG.queue };   // mutable copy: tests and the demo may change it

let link = { available: true, delay_s: 600 };
let queue = load();

function load() {
  const raw = useLS ? window.localStorage.getItem(KEY) : memory;
  const q = raw ? JSON.parse(raw) : [];
  // Reload ke baad adhoore packets dobara bhejne ke liye QUEUED kar do
  q.forEach(e => {
    if (e.packet.status === "TRANSMITTED" || e.packet.status === "FAILED") e.packet.status = "QUEUED";
  });
  return q;
}

function save() {
  const raw = JSON.stringify(queue);
  if (useLS) window.localStorage.setItem(KEY, raw); else memory = raw;
  listeners.forEach(cb => cb(queue));
}

export function onChange(cb) { listeners.push(cb); }
export function getQueue() { return queue; }

export function enqueue(packet) {
  queue.push({ packet, attempts: 0, ground_reply: null });
  save();
  processQueue();
}

// Reset ke liye: queue khaali karo (in-flight timers purane entries par chalte rahenge, queue par asar nahi)
export function clearQueue() {
  queue = [];
  save();
}

export function setLink(newLink) {
  link = newLink;
  processQueue();
}

function processQueue() {
  if (!link.available) return;                      // link band: packets QUEUED mein ruke rahenge
  queue.forEach(e => { if (e.packet.status === "QUEUED") transmit(e); });
}

function transmit(entry) {
  entry.packet.status = "TRANSMITTED";
  entry.attempts += 1;
  save();

  const ackMs = (link.delay_s * 2 * 1000) / config.speedup;   // jaane + wapas aane ka time
  setTimeout(() => {
    if (!verifyPacket(entry.packet)) {                        // checksum fail: reject, retry nahi
      entry.packet.status = "FAILED";
      entry.ground_reply = "Rejected: checksum mismatch";
      save();
      return;
    }
    if (Math.random() < config.failRate) {                    // random failure, phir auto retry
      entry.packet.status = "FAILED";
      save();
      setTimeout(() => {
        entry.packet.status = "QUEUED";
        save();
        processQueue();
      }, config.retryMs);
      return;
    }
    entry.packet.status = "ACKNOWLEDGED";
    entry.ground_reply = groundReply(entry.packet);
    save();
  }, ackMs);
}

function groundReply(p) {
  return `Ground: received ${p.packet_id} (${p.priority}). Advice: ${p.countermeasure}. Review in 48 h.`;
}

processQueue();