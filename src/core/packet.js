// Chhota integrity check (FNV-1a hash)
function checksum(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(16);
  }
  
  export function buildPacket(alert, decision, ctx, seq) {
    const body = {
      packet_id: `PKT-${String(seq).padStart(4, "0")}`,
      mission_ts: ctx.missionDay,
      priority: ["LOW", "MEDIUM", "HIGH", "CRITICAL"][alert.severity],
      anomaly: alert.reason,
      readings: ctx.current,
      baseline: ctx.baseline,
      trend_7d: ctx.trend7,
      trend_30d: ctx.trend30,
      cabin: ctx.cabin,
      countermeasure: ctx.countermeasure
    };
    return { ...body, checksum: checksum(JSON.stringify(body)), status: "QUEUED" };
  }
  
  // Receiver side: packet badla toh nahi, ye check karta hai
  export function verifyPacket(packet) {
    const { checksum: c, status, ...body } = packet;
    return c === checksum(JSON.stringify(body));
  }