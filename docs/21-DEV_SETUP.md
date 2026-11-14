# 21 · Developer Setup and Runbook

## Run the app

**Windows, one click:** double-click `launch.bat` in the repo root. It picks a free port (8080–8090), starts a server with Python (or `npx http-server`), and opens the browser.

**Any OS:**

```bash
python -m http.server 8080
```

Then open <http://localhost:8080>.

Opening `index.html` directly (`file://`) does **not** work: browsers block ES module imports from files.

## Run the tests and checks

No install step: `package.json` has scripts only. Node 22 or newer.

```bash
npm test
```

Runs the unit and integration tests in `tests/unit/` and `tests/integration/` with Node's built-in runner.

```bash
npm run test:smoke
```

Checks that the 16 UI features exist in the markup and source. It doesn't test behaviour.

```bash
npm run check
```

Fails if `src/sw-manifest.js` is out of date or a doc link is broken. CI runs all three on every push and pull request.

## After adding, moving or deleting a file the browser loads

```bash
npm run build:sw
```

Regenerates the service worker's list of files to cache offline. Commit the updated `src/sw-manifest.js`.

## Run the evaluation (once built)

```bash
node eval/run-eval.mjs --seeds 200
```

Writes `eval/results.json` and `eval/results.md`. Commit both before recording a demo.

## Get the engine branch locally

```bash
git fetch origin
```

```bash
git switch -c feat/engine-merge origin/main
```

```bash
git merge origin/engine-ml
```

The branch only adds files under `engine/`, so conflicts should be rare. Check that `engine/model.json` loads by opening the app and running `LandfallML.modelInfo()` in the browser console.

## Common problems

| Symptom | Cause | Fix |
|---|---|---|
| Blank page, console says module blocked | Opened with `file://` | Use `launch.bat` or a server |
| Old code still running after an edit | Service worker cache | Hard refresh (Ctrl+Shift+R); or DevTools → Application → Service workers → Unregister; bump `CACHE_NAME` in `sw.js` for releases |
| Queue shows hundreds of packets | Old v1 data in `localStorage` from before `19fbcdc` | Press Reset, or run `localStorage.clear()` in the console |
| Title screen won't close | Script error before the handler loaded | Check the console; the inline handler in `index.html` should still close it |
| `pip install -r engine/ml/requirements.txt` fails | File saved as UTF-16 with a BOM | Re-save as UTF-8; trim to the packages the scripts import |
| Port 8080 in use | Another server running | `launch.bat` tries 8081–8090 automatically |

## Reset everything

In the app: **Reset** button. In the console:

```js
localStorage.clear(); location.reload();
```

## Before you open a pull request

- [ ] `npm test`, `npm run test:smoke` and `npm run check` pass.
- [ ] App loads with no console errors on days 1, 40, 44, 90, 180.
- [ ] If you changed a shape or threshold: [18-DATA_MODEL.md](18-DATA_MODEL.md) and [20-DECISIONS.md](20-DECISIONS.md) updated.
- [ ] If you moved a requirement: [00-STATUS.md](00-STATUS.md) updated.
- [ ] No new hard-coded threshold, delay or dose value outside `src/core/config.js`.
