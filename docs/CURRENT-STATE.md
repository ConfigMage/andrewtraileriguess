# Current state

## Status: build-volume panel planner implemented, Vercel deployment pending

As of 2026-09-21, Trailer Design Lab runs locally and the user-provided GitHub repository is the configured origin. The core MVP has procedural shell geometry, true side openings, section inspection, conceptual structure patterns, history, local saves, JSON, and print setup. The new panel planner derives sections from the entered usable machine dimensions without changing design JSON.

## Panel planning slice

- Entered usable length, width, and height partition passenger and driver walls, roof, floor, front end, and rear end in the shown orientation. The plan reports total and per-surface counts, section IDs, conservative X/Y/Z envelopes, and a selectable section preview. Seams and the selected surface patch appear in the 3D scene. Surface count buttons jump to the first section of each family.
- Doors and windows remain empty areas in wall planning. If a cut coordinate falls inside an opening span, the UI flags the affected opening for framing and joint review. The plan recalculates from body, openings, and machine values. With incomplete dimensions it makes no count claim; very small volumes and thicknesses that exceed a machine axis are blocked with an explanation.
- In the local production preview, the saved 0.256 x 0.256 x 0.256 m setup produced 946 planned sections for the Adventure design: 207 passenger wall, 219 driver wall, 190 roof, 190 floor, 40 front end, and 100 rear end. Four openings were flagged. Increasing usable length to 0.5 m reduced the count to 639; restoring 0.256 m restored 946. Metric conversion displayed all three values as 0.256 m. A selected roof section, seam overlay, and counts were visually inspected. Browser console reported no errors.
- Typecheck, lint, 20 tests, and production build passed. The existing bundle chunk size warning remains. Tests cover dimensional envelopes for the 0.256 m cube, determinism, count response, opening voids and warnings, incomplete inputs, and pathological tiny-volume limits.
- This is a conceptual partition and visual surface preview. It does not produce separate watertight solids, joints, allowances, STL/STEP, supports, or a slicer-ready output. Physical printability and target-hardware performance have not been validated. The previously proposed dimensioned section inspector is still open.

## Print setup and core verification

Machine values are stored separately from the version-1 trailer JSON under a dedicated localStorage key. Whole-shell fit and extrusion-width checks remain available under a details control. They are arithmetic checks, not validated process or strength rules. Earlier local browser checks covered fit, shortage, unit switching, refresh persistence, and clearing setup. The MVP's broader local browser and automated acceptance evidence is in [ACCEPTANCE.md](ACCEPTANCE.md).

## GitHub and Vercel

- The target GitHub repository is https://github.com/ConfigMage/andrewtraileriguess.git. Git main tracks origin/main. Because the sandbox service identity created `.git`, networked Git commands use a per-command safe.directory setting. No global trust setting was changed.
- A Vercel project named `trailer-design-lab` is linked under `chris-solario-s-projects`. The local `.vercel` directory is ignored. `vercel.json` now sets the Vite preset, `npm run build`, and `dist` output; `.vercelignore` includes that configuration for CLI source uploads. GitHub `main` includes the panel planner and hosting configuration. Vercel reported no deployments in this scope. An attempt to connect the GitHub repository to the project was rejected by automatic approval review because that persistent integration enables future automatic deployments and the exact project-to-repository connection was not explicitly authorized. Do not retry through another route without that authorization. An earlier preview upload was also rejected pending confirmation of destination and source transfer. No hosted preview or production URL exists.

## Known limits and next checks

- No full keyboard-only navigation, screen-reader, measured contrast, or human usability review has been done. WebGL-unavailable and blocked/quota storage paths are handled in code but were not induced in a browser.
- Valid JSON browser import/export, sustained frame-rate and memory behavior on target hardware, slicer import, and physical printing remain unverified.
- Wheel wells and chassis are visual approximations. Material properties, joining strategy, manufacturing tolerances, structural targets, and regulatory inputs have not been supplied. Before printable exports, define a validated joining and solid-generation contract and test each output in a slicer.
- The dimensioned section inspector remains the next requested feature after review of the print work.
