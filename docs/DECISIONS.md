# Decisions and assumptions

## Initial decisions

| Decision | Rationale | Status |
| --- | --- | --- |
| Frontend-only static application | Keeps a practical MVP deployable and usable without accounts or infrastructure. | Established requirement |
| Procedural shell plus limited configurator | Matches the selected idea: shell exploration with doors/windows. | Established requirement |
| Section before optional features | Internal structure inspection is the signature interaction. | Established requirement |
| Meter-based model, metric/imperial boundaries | Avoids mixed-unit geometry and repeated conversion drift. | Scaffold decision |
| Height is exterior body height | Resolves earlier interior/exterior wording; baseline follows the detailed build prompt. | Scaffold clarification |
| Real visual cutouts required | Section inspection must not reveal an intact wall behind a window sticker. | Scaffold clarification |
| No preselected package versions | Implementation must verify compatible stable packages and record a lockfile. | Scaffold decision |
| No engineering-approved values | Printer/material/process requirements are unknown. | Established constraint |

## Resolve during implementation without routine approval

Document parameter limits, roof/nose shape algorithms, opening coordinate semantics, side orientation, skin/core visualization details, cutout technique, history limits, local save storage layout, maximum file/opening sizes, and measured performance assumptions. Geometry ranges are prototype limits, not regulatory limits.

## 2026-09-21 implementation contracts

### Decide first: Slice 0

- Contracts: X runs from front to rear, Y is up, positive Z is passenger side. Body origin is the front center of the floor underside. Canonical meters. Opening X is its front edge; vertical position is the lower edge above the top of the floor.
- Included: typed version-1 document, centralized limits, units, Vite setup. Excluded: scene geometry.
- Acceptance: boot, unit and schema tests, compatible dependency install.
- Dependency selection: Node 24.11.0 observed. React 19 with React Three Fiber 9 follows official Fiber compatibility guidance. Vite 8 requires Node 20.19+ or 22.12+. Exact installed versions are locked in package-lock.json. npm registry access is restricted in this workspace, so use cached stable packages where possible.
- Initial npm resolution caught a Vite 8 and plugin-react 5 peer mismatch. Corrected to plugin-react 6, the release line intended for Vite 8.

### Decide first: Slice 1

- Contracts: body length excludes a 1.20 m tongue. Roof rise stays inside the exterior body height. Sidewall width follows the same nose function for rendering and validation.
- Included: mesh generators, dimensional controls, profiles, chassis, orbit and camera presets. Excluded: certification and structural calculations.
- Acceptance: all profile options produce distinct geometry and min/max inputs remain valid.

### Decide first: Slice 2

- Contracts: a front-to-rear clip plane removes geometry past the selected X. At the cut, explicitly generated wall, roof, and floor cross-sections show thickness. Structure is representative, not a material volume model.
- Included: section and four conceptual structures. Excluded: production slicing.
- Acceptance: section endpoints and middle remain visible and explainable.

### Decide first: Slice 3

- Contracts: wall surface cells are omitted inside opening rectangles; reveal surfaces line the hole. Invalid overlaps stay editable and show warnings. Direct dragging is deferred in favor of reliable numeric and range positioning.
- Included: side openings, selection, duplicate/delete, shared geometry rules. Excluded: front/rear openings.
- Acceptance: visible through holes, selection edits, all rule categories.

### Decide first: Slice 4

- Contracts: bounded 50-step history; range gestures begin on pointer down and commit on pointer up. Import, reset, preset, and load are undoable replacements. Autosave and named saves use separate localStorage keys; failed storage access preserves memory state. JSON limit 1 MB and 40 openings.
- Included: history, persistence, presets, versioned JSON. Excluded: cloud saves.
- Acceptance: deterministic round trips, error recovery, and history tests.

### Decide first: Slice 5

- Contracts: dimensions are geometric facts; shape and spacing rules are configurable concept assumptions. Browser checks must be recorded separately from code checks.
- Included: workspace layout, dimension overlays, keyboard/accessibility pass, final verification. Excluded: optional exporters.
- Acceptance: required checks and honest remaining manual checks.

### Decide first: Slice 6

- Contracts: optional estimates only follow stable core geometry and must state unvalidated inputs.
- Included: documentation of deferral. Excluded: mass and production estimates until inputs are supplied.
- Acceptance: deferral is explicit.

## Future business inputs, not MVP blockers

Actual trailer use, printer build envelope, polymer properties, deposition process, structural targets, chassis interface, joining process, and applicable engineering/regulatory review remain unknown. Do not invent answers. Keep the configurability needed to incorporate them later.

## 2026-09-21 implementation result

- Exact pinned versions are in `package.json` and `package-lock.json`: React and React DOM 19.2.8, Three.js 0.181.2, React Three Fiber 9.6.1, drei 10.7.7, Zustand 5.0.14, Vite 8.2.2, TypeScript 5.9.3, Vitest 4.1.11. The chosen Vite and plugin-react 6 lines are compatible. Node 24.11.0 was used; the declared supported range is Node 20.19+ or Node 22.12+.
- Prototype parameter bounds are centralized in `src/model/types.ts`. They are UI and geometry safety bounds, not road or printer requirements. The body origin, sides, and opening coordinates follow the Slice 0 block above.
- Nose samples: flat full width, rounded 78% starting half-width, wedge 34%, teardrop 28%, each reaching full half-width at 27% body length. Roof rises are zero, up to 0.10 m, or up to 0.31 m; all fit inside exterior body height.
- Cutouts use omitted wall surface cells and exposed neighbor faces. This avoids a CSG dependency and permits invalid overlap to remain editable. Transparent rendering initially showed internal cell seams; the geometry was corrected to omit hidden faces. Roof top/bottom normals are analytic for smooth appearance.
- Section uses a Three.js clipping plane plus custom cap geometry. Lighting shadows are disabled during section so clipped-away parts do not leave a false full-body shadow. The structure pattern is representative line work on inner walls. The pattern does not imply actual rib size, cell density, or strength.
- Positioning uses constrained sliders and exact numeric fields. Direct 3D dragging was deferred because reliable selection and atomic history are more important for this MVP.
- Prototype chassis uses a 1.20 m tongue, frame rails, wheels, and visual half-circle wheel wells. Overall width adds 0.34 m for the displayed wheels. The wheel zone rule is conceptual and configurable.
- The default Adventure door and first window were moved away from the tandem wheel zone after a deterministic test found a warning in the initial positions. The current default has zero placement warnings.
- History is 50 steps. Range pointer gestures commit one step; import, reset, preset, and load replace the design as one undoable step. Text inputs keep their own shortcuts. Autosave and named saves have separate keys.
- Optional estimates were deferred because density, process, cost, and deposition assumptions are unknown. Adding demonstration values would weaken the separation between geometry and unvalidated manufacturing assumptions.

## 2026-09-21 Vercel preparation

- This frontend-only Vite project needs no application server or runtime secrets on Vercel. The CLI project was named `trailer-design-lab` under `chris-solario-s-projects` to keep this app separate from other projects in the account.
- Use `.vercelignore` as a source upload allowlist. Build from the six required paths listed there, excluding planning documents and local development artifacts.
- The global Vercel CLI 39.2.2 is below the deployment endpoint's required 47.2.2. Use a current CLI through `npx --yes vercel@latest` without changing application dependencies.
- Automatic approval review blocked the attempted preview upload pending explicit confirmation of the account, project, and source payload. Deployment and hosted verification remain open.

## Decision log template

Date / decision / alternatives considered / reason / affected contract / validation evidence.

## 2026-09-21 print setup slice

- Machine build dimensions and extrusion width are optional user inputs. Blank values produce no overall fit conclusion. The input limits of 100 m for each build dimension and 200 mm for extrusion width protect the UI from corrupt or extreme values; they are not printer specifications.
- Fit is an axis-aligned comparison in the shown shell orientation. Allowing automatic rotation would obscure print orientation, support needs, and assembly decisions that the MVP does not model. The build box is a visual reference aligned with the shell floor underside.
- The one-width check flags only thickness below the entered extrusion width. It does not infer perimeter count, supported overhang, layer adhesion, or strength. Prusa's modeling guidance identifies features thinner than one perimeter as a slicing risk, but real outcomes depend on the machine and slicer.
- Machine setup is separate from the design document so exporting or loading a trailer does not silently attach local printer assumptions to it. The setup persists in a separate browser key, is not undoable with design history, and can be cleared explicitly.
- Section measurement remains the next proposed slice after user review. No section inspector was added here.

## 2026-09-21 print-fit wording correction

- User feedback showed that Print setup and Components & print suggested automatic part generation. The interface now names the feature a one-piece whole-shell fit check and states that it does not split the shell.
- A panel and seam planner is a distinct future slice. It must place cuts around openings, report actual part bounds, and define a joint strategy before claiming to create printable components. A simple color change or box overlay cannot satisfy that goal.

## 2026-09-21 build-volume panel plan

- The planner uses the entered usable build length for X, build height for Y, and build width for Z. This preserves the shown shell orientation and avoids implying an optimized print orientation. It divides the six surface families and reports each planned section's conservative axis-aligned envelope, while keeping machine setup outside design JSON and undo history.
- Openings are voids in wall sections. Opening edge coordinates become preferred cut landmarks, but small machine dimensions or other nearby openings can force cuts through an opening span. The UI flags those openings instead of claiming a resolved frame or joint.
- The panel preview cap is 5,000 sections. A preflight lower-bound estimate blocks pathological tiny volumes before allocating a grid; recursive curved-surface refinement also stops at the cap. These are application performance limits, not printer requirements.
- Seam lines, a selected bounds box, and a clipped selected shell surface patch provide a visual inspection aid. They are not independent watertight components. No joint geometry, kerf, tolerances, print orientation search, support analysis, material behavior, or STL/STEP export was added.
- The default 0.256 m cube case generates 946 planned sections in the Adventure design, making assembly complexity visible. Reducing the count by changing printer volume or trailer geometry is a design exploration choice; no manufacturing recommendation is inferred from the count alone.
