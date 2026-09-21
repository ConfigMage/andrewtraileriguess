# Current state

## Status: local MVP implemented, Vercel project linked, deployment pending

As of 2026-09-21, the frontend application builds and runs locally. Required concept controls, procedural shell, section view, real sidewall cutouts, placement warnings, history, autosave, named saves, and JSON format are implemented. Git was initialized locally with main and the user-provided GitHub repository as origin. The remote advertised no branches or tags before the initial push.

## Vercel deployment preparation

- The signed-in CLI user reported `configmage`. A Vercel project named `trailer-design-lab` was created under `chris-solario-s-projects` and linked locally. The local `.vercel` directory is ignored by Git.
- `.vercelignore` allowlists only `src/`, `index.html`, `package.json`, `package-lock.json`, `tsconfig.json`, and `vite.config.ts` for CLI upload. A search of those files found no environment variable references or common secret markers.
- The installed global Vercel CLI 39.2.2 could not upload because the endpoint requires 47.2.2 or later. `npx --yes vercel@latest --version` returned 59.24.0.
- A preview upload with the current CLI was rejected by automatic approval review before deployment because the exact destination and source transfer need user confirmation. No preview or production URL exists yet. Do not treat the linked project as a completed deployment.
- After explicit confirmation of the destination and upload, deploy a preview with the current CLI, verify the hosted app and its section/opening rendering, then deploy to production if authorized.

## GitHub handoff

- Target repository: https://github.com/ConfigMage/andrewtraileriguess.git.
- Git was initialized after the MVP build. Networked Git commands under the Windows user need a per-command safe.directory setting because the sandbox service identity owns .git. No global Git trust setting was changed.
- The GitHub CLI reported an invalid token. Git push uses Git Credential Manager and must be checked independently.

## Verification completed

- Runtime: Node 24.11.0 and npm 11.6.1.
- `npm run typecheck`: pass.
- `npm run lint`: pass.
- `npm run test`: 10 tests passed. Coverage includes units, profile envelopes, invalid dimensions, cutout mesh triangles, placement rules, JSON errors and round trip, undo gesture, redo clearing, replacement undo, and invalid replacement preservation.
- `npm run build`: pass. Vite 8.2.2 emitted `dist/`. Its reporter warned that the JavaScript chunk is above 500 kB.
- Codex in-app browser, local Vite dev site: inspected the rendered default model; all 12 nose/roof combinations kept a canvas and workspace; minimum and maximum dimensions rendered; 0/25/50/75/100 section positions worked; solid, ribbed, honeycomb, and lattice patterns were visually inspected. Side doors/windows showed through holes in normal, transparent, and section views. Direct scene selection, warning creation, undo, metric switch, named save/load, autosave after refresh, and malformed import recovery were exercised.
- Codex in-app browser, production preview at port 4173: default scene and section rendering visually checked. Driver/passenger camera views, orbit drag, wheel zoom, and Fit reset were inspected. At a 768 by 900 viewport, the panels began collapsed and the Body parameters toggle opened its panel. Ctrl+Z undid a focused-page edit and left a design edit intact when a numeric input had focus.

Browser screenshots were displayed in the task during inspection, but this browser tool did not persist screenshot files. The observed UI states and exact results are recorded in [ACCEPTANCE.md](ACCEPTANCE.md). Browser checks are not a substitute for human usability or hardware testing.

## Known limits and remaining checks

- No full keyboard-only navigation, screen-reader, contrast measurement, or human accessibility review has been done.
- WebGL-unavailable and blocked/quota storage states are handled in code but were not induced in a browser.
- JSON export and valid import are covered by deterministic round-trip tests. Their full browser download/upload path was not exercised; malformed import was exercised in the browser.
- No sustained frame-rate or memory-growth measurement on a representative laptop. The geometry uses many cells; the production bundle warning and performance should be revisited if the app grows.
- The section cut colors are visible, but physical wall thickness is naturally small at whole-trailer scale. The thickness legend shows exact concept values. Representative structure lines are not engineered infill.
- Wheel wells and chassis are visual approximations. No manufacturing requirements, material properties, axle ratings, or regulatory inputs have been supplied.
- Optional estimate, exploded view, second section direction, and GLTF export were deferred.

## Next practical actions

1. Perform keyboard-only and screen-reader review and correct any failures.
2. Exercise blocked storage, WebGL failure, valid JSON browser import/export, and sustained interaction on target hardware.
3. If future manufacturing data arrives, define a separate validated requirements layer before adding estimates or production export.
