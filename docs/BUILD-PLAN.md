# Build plan

Slices 0 through 5 and the user-selected print setup Slice 7 are implemented as of 2026-09-21, with manual verification gaps recorded in ACCEPTANCE.md. Optional estimate Slice 6 is deferred. These are execution checkpoints, not approval gates.

Before each slice record: Decide first: contracts, included scope, excluded scope, and acceptance evidence.

| Slice | Work | Exit gate |
| --- | --- | --- |
| 0 | Inspect workspace; verify dependencies/runtime; define schema, coordinates, bounds, defaults; create Vite/React/TypeScript app and scripts. | App boots, initial types and unit helpers tested; versions recorded. |
| 1 | Procedural shell, all nose/roof combinations, chassis, units and dimension controls; camera and base scene. | All profiles visibly differ; valid thickness and bounds; min/max parameters do not break meshes. |
| 2 | Section plane, thickness surfaces/caps, four structure representations. | Slider at front/middle/rear visibly exposes meaningful internals; no scene artifacts hiding missing features. |
| 3 | Door/window cutouts, selection/inspector, duplication/deletion, constrained positioning, rule results. | Actual openings and all conflict categories verified against shared geometry. |
| 4 | History, presets, local Save/Load/autosave, versioned JSON import/export and recovery. | Round trips, undo transactions, refresh restoration, corrupt storage/import recovery pass. |
| 5 | Dimension overlays, scene polish, responsive panels, keyboard/labels, sample design and complete acceptance run. | Required checks pass with recorded evidence or specific unverified blockers. |
| 6 | Optional estimate panel, then other secondary features only if useful and core remains stable. | Tests for any added calculations; optional deferrals explicitly documented. |

Create npm scripts: dev, build, preview, typecheck, lint, test (non-watch CI-capable). Add browser smoke automation if it meaningfully verifies critical flows. Do not create superficial tests that only mirror implementation.

At each exit update CURRENT-STATE.md and ACCEPTANCE.md with actual evidence. Before handoff run complete checks once against the final changes, inspect version-control state where available, and update README with verified run instructions.

## Slice 7: Print setup and fit check

### Decide first

- Contracts: Machine setup is separate from the version-1 trailer design and stored locally. Build dimensions use meters internally and the selected display unit at input and output. Extrusion width uses millimeters at input and meters internally. A fit result compares the shell's unrotated length, width, and exterior height against user-entered usable build dimensions. It excludes the chassis and tongue.
- Included: persistent user-entered build volume and extrusion width, per-axis fit results, a visible build-envelope reference in the 3D scene, and a single-extrusion-width sanity check for wall, roof, and floor thickness.
- Excluded: automatic rotation, panelization, support analysis, material strength, production slicing, estimates, printer control, and section measurement. Slice 5 section measurement follows user review.
- Acceptance: blank settings make no fit claim; valid and undersized envelopes produce the expected deterministic results; unit switching preserves canonical values; corrupt or blocked storage leaves the app usable; browser inspection confirms the reference box, warnings, and existing scene behavior; typecheck, lint, test, and build pass.

### Exit evidence

- Pure checks and storage recovery tests were added. The suite passed 15 tests across two files.
- Typecheck, lint, and production build passed. The existing large JavaScript chunk warning remains.
- Production preview showed blank setup without a fit claim; 30 x 10 x 11 ft produced a green box and fit result for the current Family design; 30 x 8 x 11 ft produced a width shortage and orange box; a 30 mm extrusion width flagged the 28 mm wall. Metric display converted the entered machine dimensions, refresh restored them, and the temporary values were cleared.
- Browser console reported no errors in this run. Full hardware and slicer validation remain open.
