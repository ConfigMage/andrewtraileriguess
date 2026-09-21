# Architecture

Status: implemented baseline as of 2026-09-21.

## Data flow and boundaries

`src/model/types.ts` defines the version-1 design document and prototype bounds. `validation.ts` validates candidate designs and dimensions. `units.ts` converts meters only at input and output boundaries. `profiles.ts` defines nose half-width and roof height for geometry, rules, and measurements. `rules.ts` computes stable warning codes. `serialization.ts` handles versioned JSON and file limits. `presets.ts` supplies the four concept presets.

`src/store/designStore.ts` owns the active design, 50-step undo history, gesture transactions, selected opening, view controls, autosave, and named saves. React controls issue edits to that store. View preferences and selection are transient; only the design is exported. Import, load, reset, and preset replacements are undoable. Autosave uses `trailer-lab-active-v1`, named saves use `trailer-lab-saves-v1`, and storage failures leave the current in-memory design usable.

`src/scene/geometry.ts` creates disposable Three.js buffer geometries. `TrailerScene.tsx` owns rendering, camera, lighting, mesh disposal, and the section clip plane. The scene does not own dimension or placement formulas. Materials, selection frames, chassis, dimension labels, and representative structure lines are presentation objects.

## Coordinate and shape contract

X increases front to rear. Y increases upward. Positive Z is passenger side; negative Z is driver side. The body origin is front center at the underside of the floor. Meters are canonical. Side opening X is the front edge, and opening Y is its bottom edge above the top of the floor. The model group translates upward by the clearance value. Body height ends at the roof crown, so curved roof rise lowers the sidewall top without increasing the exterior height.

The side half-width starts at a profile-dependent fraction and reaches full width after 27% of body length. The roof envelope is sampled over 16 width divisions. Body surfaces are sampled along 56 base length divisions plus exact opening boundaries. Sidewall cells inside door or window rectangles are omitted. Adjacent exposed cell faces form hole reveals, while faces between solid cells are omitted so transparency does not show artificial seams. The floor, roof, and front/rear closures are slabs. Invalid overlapping openings render as a union of omitted cells and remain editable with warnings.

Section mode clips the body at the chosen X and adds explicit cross-section geometry for floor, wall, and roof slabs. The caps omit wall where the plane intersects an opening. The selected structure is represented by interior wall line work, with sparse ribs, hexagons, or diagonals. Structure segments are clipped away inside openings. The line work is illustrative and is not used to derive strength, mass, or material volume. Transparent mode reveals it more clearly. The wheel well is a visual half-circle and trim over the simplified chassis, not a chassis interface specification.

## Rules and measurements

`ruleWarnings` reports `BOUNDARY`, `BELOW_FLOOR`, `ROOF_OVERFLOW`, `WHEEL_WELL`, `OVERLAP`, `SPACING`, and `WALL_THICKNESS`. It consumes the same opening bounds and sidewall roof line used by rendering. It returns actual and target values where applicable. The editable `designRules` values are concept assumptions. They are not validated manufacturing or safety limits.

Body dimensions are direct document values. Tongue-inclusive overall length adds a fixed 1.20 m. Wheel-inclusive width adds 0.34 m to body width based on the displayed chassis. The approximate interior floor area integrates the nose half-width minus wall inset using 100 midpoint samples. Surface area, shell volume, mass, cost, and fabrication time are not reported.


## Print planning slice

src/model/printPlanning.ts validates a separate machine setup and calculates axis-aligned fit and one-extrusion-width checks. The setup uses meters internally and is stored under trailer-lab-print-setup-v1 by src/store/printStore.ts. It is not part of the version-1 trailer design, undo history, named designs, or JSON export. Invalid saved setup falls back to blank values; storage write failure leaves the current setup in memory and displays a notice.

The fit check compares the unrotated shell body length, maximum body width, and exterior body height with user-entered usable build dimensions. Its reference box starts at the shell's front center and floor underside, in the same translated group as the body. The check excludes chassis, tongue, support material, tool access, and rotation. Wall, roof, and floor thickness are compared separately with one user-entered extrusion width. Passing these arithmetic checks does not establish printability, strength, or a validated machine profile. No machine defaults are assumed.
## Recovery and future seams

JSON is capped at 1 MB and 40 openings. Import validates a plain object before replacing state, rejects unknown schema versions, and has an explicit migration entry function. Corrupt autosave loads the Adventure Prototype and shows a notice. Browser storage exceptions are caught. A WebGL2 precheck shows a text fallback while other controls remain available. Generated meshes are memoized by design dependencies and disposed when replaced.

The version-1 format is the only implemented exporter. GLTF, STL, STEP, printer jobs, engineering analysis, and estimates need separate contracts and validation before implementation. The production Vite bundle currently emits one 1.14 MB JavaScript chunk before gzip. No device-specific frame rate or memory budget has been established.
