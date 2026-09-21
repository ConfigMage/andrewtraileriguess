# Build plan

Slices 0 through 5 are implemented as of 2026-09-21, with manual verification gaps recorded in ACCEPTANCE.md. Slice 6 is deferred. These are execution checkpoints, not approval gates.

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
