# 21 · Developer Setup and Runbook

## Run the app

**Windows, one click:** double-click `launch.bat` in the repo root. It picks a free port (8080–8090), starts a server with Python (or `npx http-server`), and opens the browser.

**Any OS:**

```bash
python -m http.server 8080
```

Then open <http://localhost:8080>.

Opening `index.html` directly (`file://`) does **not** work: browsers block ES module imports from files.

## Run the tests

```bash
node --test tests/
```

Until `tests/` holds real tests, the current checks are:

```bash
node tests/ui-check.mjs
```

```bash
node test5.mjs
```

`tests/ui-check.mjs` only checks that strings exist in the source files. A pass doesn't mean the feature works.

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

- [ ] `node --test tests/` passes.
- [ ] App loads with no console errors on days 1, 40, 44, 90, 180.
- [ ] If you changed a shape or threshold: [18-DATA_MODEL.md](18-DATA_MODEL.md) and [20-DECISIONS.md](20-DECISIONS.md) updated.
- [ ] If you moved a requirement: [00-STATUS.md](00-STATUS.md) updated.
- [ ] No new hard-coded threshold, delay or dose value outside `core/config.js`.
