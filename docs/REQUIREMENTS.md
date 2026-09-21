# MVP requirements

## Intent and scope

Working name: Trailer Design Lab. Explore full-size printed trailer body concepts without assuming a known printer, polymer, chassis specification, or validated manufacturing process. Combine a parametric shell designer with limited customer-style configuration.

Separate four categories in the interface and data: geometric facts, configurable design assumptions, illustrative estimates, and validated requirements. Initially the last category is empty. Shape names such as aerodynamic describe appearance, not proven drag reduction.

## Required capabilities

| ID | Capability | Required behavior |
| --- | --- | --- |
| R01 | Workspace | Open directly into a dominant interactive 3D viewport, with parameters left, selection inspector right, toolbar above, and dimensions/status below. Desktop first; collapse side panels on tablets. Phone use may be limited. |
| R02 | Dimensions | Live sliders plus numeric input for body length, width, height, ground clearance, wall thickness, roof thickness, floor thickness. Centralized documented bounds and cross-field validation. |
| R03 | Units | Imperial and metric display/input; one canonical meter-based design. No geometry drift when switching units. |
| R04 | Profiles | Four genuinely distinct procedural noses: flat, rounded, aerodynamic/wedge, teardrop-inspired. Three roofs: flat, slight arch, rounded. Modular generators. |
| R05 | Chassis | Simplified frame rails, tongue/A-frame, coupler, wheels, wheel wells, and selectable single/tandem axles. Visual representation only. |
| R06 | Structures | Solid, ribbed, honeycomb, lattice. Expose representative internal structure in section; avoid populating every wall with thousands of cells. Label conceptual structure honestly. |
| R07 | Section | Prominent SECTION VIEW toggle and front-to-rear plane slider. At least one polished direction exposing shell thickness, roof, floor, structure, and openings. No unexplained hollow or uncapped visual slice. |
| R08 | Openings | Add entry doors and rectangular windows on driver/passenger sides. Select in 3D and edit in inspector. Doors: side, width, height, horizontal position. Windows: those fields plus vertical position. Duplicate and delete. |
| R09 | Placement | Constrain to the chosen wall. Prefer direct dragging if reliable; constrained handles and numeric positioning are an acceptable fallback. Immediate feedback. Openings must visibly penetrate the shell. |
| R10 | Rules | Warn for boundary overflow, opening overlap, wheel-well intersection, below-floor placement, roof/profile overflow, and insufficient spacing. Rules are configurable and separate from UI. |
| R11 | Information | Live overall length/width, body height, estimated interior floor area, wall thickness, structure type, door/window counts. Distinguish overall bounds from body bounds. Surface area and shell volume only with a documented reliable calculation or explicit approximation label. |
| R12 | Presets | Compact approximately 12 ft; Adventure 16 ft; Family 20 ft; Blank/Custom neutral 18 ft. No real brands. Include a polished Adventure Prototype with wedge nose, slight arch, tandem chassis, passenger door, multiple windows, honeycomb walls. |
| R13 | Camera | Orbit, pan, zoom, reset, fit; Perspective, Driver side, Passenger side, Front, Rear, Top shortcuts. Smooth transitions when practical. |
| R14 | Visualization | Toggles for chassis, dimensions, grid, section, transparency, internal structure. Useful body length/width/height dimension lines. Editable shell color. |
| R15 | Presentation | Neutral studio environment, soft and directional lighting, shadows, ground, subtle grid, reasonable materials. Modern technical workstation with restrained accents, optional default dark mode. No campground or generic dashboard styling. |
| R16 | Selection | Subtle hover and selection feedback for doors, windows, shell. Inspector follows selection. Axle/wheel selection is optional. |
| R17 | History | Undo/redo dimensions, profiles, structure, opening add/delete/move/resize. Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z. One meaningful transaction per drag or slider gesture, bounded history. Do not hijack text-editing shortcuts. |
| R18 | Local storage | Autosave active design across refresh, named local Save/Load, New/Reset. Handle corrupt data, blocked storage, and quota failures without losing the current in-memory design. |
| R19 | Design files | Export/import versioned JSON with metadata, body, chassis, openings, material, and designRules. Validate before replacing state. Migration entry point, explicit unsupported-version errors. |
| R20 | Recovery/accessibility | Recover from unavailable WebGL, malformed JSON, corrupt persistence, and impossible parameters. Labels, keyboard-operable controls, visible focus, contrast, semantic buttons, icon tooltips, and numeric alternatives to sliders. |

## Baseline design assumptions

Suggested neutral defaults: body length 18 ft (5.4864 m), width 8 ft (2.4384 m), body exterior height 8 ft 6 in (2.5908 m), wall 28 mm, roof 35 mm, floor 45 mm, ground clearance 18 in (0.4572 m). These are concept defaults, not validated specifications.

Define body height from underside of the body floor to the highest roof point. Ground clearance means ground to underside of body floor in this prototype, not minimum clearance of every chassis part. Label this explicitly. Record how curved roof rise fits inside the exterior height. Keep tongue-inclusive overall length distinct from body length. Opening coordinates refer to the physical outer side-wall envelope and must use the same profile as rendering.

## Optional after required features pass

- Prototype Estimate panel with user-editable density, cost/kg, infill ratio, deposition rate. Show approximate printed mass, raw material cost, and deposition-only hours. Keep calculations in their own module and test deterministic cases. Use the visible label: Conceptual estimate - not validated manufacturing data. Leave unknown assumptions unset or label demonstration values. Never imply total production time or total trailer mass.
- Exploded view separating outer shell, inner layer, floor, roof, chassis.
- Second section direction, smooth camera transitions, axle selection, GLTF visualization export.

## Explicit exclusions

No structural certification, stress analysis, regulatory compliance, axle/tongue load calculations, production-ready STL/STEP, printer control, toolpaths, backend, accounts, payments, analytics, full interior planner, wiring/plumbing channels, or commercial price quote. Future exporter boundaries may be documented without nonfunctional export buttons. JSON export is mandatory.
