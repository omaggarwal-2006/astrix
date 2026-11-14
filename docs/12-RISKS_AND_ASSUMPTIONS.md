# 12 · Risks, Assumptions and Honest Limits

## Assumptions
1. Telemetry is synthetic; real physiological data is noisier.
2. Triage thresholds (sleep, mood, CO2, 10 s live delay, 5-day persistence) are team assumptions, not clinical guidelines.
3. Exercise-adherence response curve is an assumption.
4. Comm delay in the demo follows a simple linear model by mission day.
5. Ground link and flight surgeon replies are simulated.
6. Checksum (FNV-1a) is integrity-only, not cryptographic security.

## Risks and mitigations
| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| Integration breaks between three codebases | High | Medium | Contract v2.0, early merge, shared test scenario |
| Time runs out for video/submission | High | Medium | Freeze features by Day 5; MVP cut line in 04-MVP.md |
| UI does not show queue/FAILED/Retry | High | Medium | Om adds queue panel; Raghav supplies example code |
| NASA figures wrong or unverified | Medium | Medium | Open NTRS pages, update sources, keep labels honest |
| Judges see it as "just a dashboard" | High | Medium | Lead demo with forecast + delay-aware triage + queue |
| Overclaiming novelty | Medium | Medium | Related Work slide; "integrated prototype" wording |
| Medical misinterpretation | Medium | Low | Disclaimers, "illustrative, not clinical" |
| Browser/localStorage issues in demo | Medium | Low | Test on two browsers; reset script; backup video |
| Merge conflicts | Low | Medium | Separate branches and files per owner |
| Team availability | Medium | Medium | Daily sync, documented ownership |

## What LANDFALL is not
- Not a medical device, not validated, not a diagnosis or treatment tool.
- Not novel in each component; novelty is in the integration and the delay-aware framing.

## Realism
Global win odds are very low (≈0.05 % historically for winners); aim for a polished local win and global nomination.

## Future work (mention in deck only)
Radiation exposure tracking, wearables ingestion, multi-crew view, signed/encrypted packets, real DTN (BPv7) transport, clinician-validated thresholds, ML-assisted anomaly scoring with explanations.
