export function triage(alert, ctx) {
    // ctx = { onboardSupport: true/false, link: { available: true/false, delay_s: number } }
    const score = alert.severity
      + (alert.persisted_days >= 5 ? 1 : 0)
      + (alert.worsening ? 1 : 0);
  
    let path;
    if (score <= 1) path = "SELF_CARE";
    else if (score <= 3) path = ctx.onboardSupport ? "CREW_MEDICAL_OFFICER" : "FLIGHT_SURGEON";
    else path = "FLIGHT_SURGEON";
  
    let delivery;
    if (!ctx.link.available) delivery = "QUEUE_OFFLINE";
    else if (ctx.link.delay_s < 300) delivery = "LIVE_CALL";
    else delivery = "SEND_PACKET";
    if (path === "SELF_CARE") delivery = "NONE";
  
    return {
      path,
      delivery,
      score,
      emergency: alert.severity === 3,
      why: `Score ${score}: severity ${alert.severity}, ${alert.persisted_days} days, ${alert.worsening ? "worsening" : "stable"}`
    };
  }