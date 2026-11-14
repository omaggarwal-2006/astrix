import { triage } from "./triage.js";
import { buildPacket } from "./packet.js";
import { enqueue, setLink, getQueue } from "./queue.js";

let seq = getQueue().length;   // purani queue ke baad se numbering

// UI preview ke liye: agla packet number (bina queue mein daale)
export function peekNextSeq() { return seq + 1; }

// env = { onboardSupport: true/false, link: { available, delay_s } }
export function handleAlert(alert, ctx, env) {
  setLink(env.link);
  const decision = triage(alert, env);

  let packet = null;
  if (decision.delivery === "SEND_PACKET" || decision.delivery === "QUEUE_OFFLINE") {
    seq += 1;
    packet = buildPacket(alert, decision, ctx, seq);
    enqueue(packet);
  }
  return { decision, packet };   // packet null = self-care ya live call, koi packet nahi
}