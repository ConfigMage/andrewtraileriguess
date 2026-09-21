# Acceptance evidence

Evidence date: 2026-09-21. Commands ran in `C:\Project\FredricksonTrailerideaIguess`. Browser observations used the Codex in-app browser on local Vite dev and production preview. Screenshots were visually inspected in the task but not written to disk by that browser tool.

| Check | Evidence and actual result | Status |
| --- | --- | --- |
| Typecheck, lint, tests, build | `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`. All passed; 10 tests. Build gave a large-chunk warning. | Pass |
| Lockfile | `npm ls --depth=0` resolved all pinned packages; `npm ci --dry-run --offline --ignore-scripts --no-audit --no-fund` completed. | Pass |
| Units and parameters | Tests covered conversion stability, rounding carry, nonfinite and impossible dimensions. Browser switch showed 16 ft as 4.88 m without altering the model. Minimum and maximum body parameters rendered. | Pass |
| Profiles | Tests established distinct sampled nose widths and roof side heights. Browser selected all 12 combinations; canvas remained mounted. Flat and teardrop/rounded appearances were visually inspected. | Pass with limited visual sampling |
| Section and structures | Browser swept 0, 25, 50, 75, 100%; normal and transparent section views inspected. Four structures selected and visually inspected. Cap follows opening intersection; clean transparent shell after removal of internal cell faces. | Pass for inspected states |
| Camera and chassis | Production preview driver view showed the driver window and reversed front direction; passenger view showed the door and three windows. Single and tandem chassis rendered in minimum/default designs. Orbit drag, wheel zoom, and Fit reset were exercised. Right-button pan was not exercised. | Partial |
| Tablet layout | Production preview was inspected at 768 by 900. The scene remained visible, side panels began collapsed, and the Body parameters toggle opened its panel below the scene. The temporary viewport override was reset. | Pass |
| Openings and rules | Geometry test found zero passenger wall triangles inside a selected window. Browser showed through holes, direct 3D door selection, duplicate increasing opening count to five, and delete restoring four. Moving door to 3.05 m produced `WHEEL_WELL` and `OVERLAP`; undo restored zero warnings. Deterministic tests covered all listed conflict codes except wall-thickness warning. | Pass |
| History | Browser undo restored door position. Tests covered one drag transaction, redo clear, replacement undo, and invalid state preservation. In production preview, Ctrl+Z undid a structure edit when the page was focused; Ctrl+Z in a numeric input left the design edit intact. | Pass for tested paths |
| Save, load, autosave | Browser saved `Browser QA`, changed structure, loaded it back to ribbed, changed to lattice, refreshed, and observed lattice restored. Tests covered invalid replacement preservation. Blocked/quota storage was not induced. | Partial |
| JSON files | Tests covered version-1 round trip, malformed JSON, unsupported version, size limit, and duplicate IDs. Browser malformed file import showed `Import failed. Current design kept` while the design remained visible. Valid browser upload and download were not checked. | Partial |
| Recovery and accessibility | Code prechecks WebGL2, validates candidates, catches storage errors, provides labeled controls and visible focus. No forced WebGL failure, browser storage denial, screen-reader, keyboard-only, or measured contrast check. | Unverified manual gate |
| Production preview | `npm run preview` at 127.0.0.1:4173 showed the Adventure model and section in a browser. | Pass |
| Performance | No sustained interaction, memory-growth, or FPS measurement. | Unverified |
| Repository state | `git status --short` reported `fatal: not a git repository`; no Git diff was available. Generated `node_modules/` and `dist/` are ignored by the scaffold `.gitignore`. | Not applicable |

## Requirement map

| IDs | Implementation | Remaining evidence |
| --- | --- | --- |
| R01-R03 | Workspace, dimensions, units | Full keyboard review |
| R04-R06 | Procedural profiles, chassis, structure patterns | Full human visual review of every combination |
| R07 | Front-to-rear section caps and slider | Target-hardware performance |
| R08-R10 | Real sidewall cutouts, inspector, numeric placement, rules | Extended invalid-placement interaction |
| R11-R15 | Measurements, four presets, camera, visualization, studio scene | Right-button pan and human presentation review |
| R16-R19 | Selection, history, persistence, versioned JSON | Storage denial and full file UI round trip |
| R20 | Recovery branches and labeled controls | Forced WebGL failure and accessibility audit |

Passing automated checks does not establish engineering approval or complete the remaining manual gates.
