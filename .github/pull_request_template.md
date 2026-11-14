## What this changes

<!-- One or two sentences. Link the requirement IDs from docs/03-PRD.md, e.g. T1, Q3. -->

## Checklist

- [ ] `npm test` passes
- [ ] `npm run check` passes (run `npm run build:sw` if you added, moved or deleted a runtime file)
- [ ] App loads via `launch.bat` with no console errors on days 1, 40 and 180
- [ ] Changed a shared shape or threshold? Updated `docs/18-DATA_MODEL.md`, `src/core/config.js` and a decision in `docs/20-DECISIONS.md`
- [ ] Moved a requirement? Updated `docs/00-STATUS.md` and `CONTRACT.md` Part A
- [ ] No new hard-coded threshold, delay or dose value outside `src/core/config.js`
