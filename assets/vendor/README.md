# Vendored third-party code

| File | Library | Version | Source | License |
|---|---|---|---|---|
| `chart.umd.min.js` | Chart.js | 4.4.4 | `https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.js` | MIT |

Vendored so the app works offline with no CDN. Loaded as a classic script before `src/main.js`, which exposes `window.Chart`.

**To do before submission:** copy the license file from the Chart.js 4.4.4 release (`LICENSE.md` in the `chartjs/Chart.js` repository) into this folder as `LICENSE-chartjs.md`. The MIT license requires the notice to ship with the code.
