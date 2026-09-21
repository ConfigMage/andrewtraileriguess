# Trailer Design Lab

Local, frontend-only concept workspace for a procedural trailer shell. Open the app to edit exterior dimensions, shape, thickness, conceptual structure, chassis, doors, and windows. The section slider exposes cut surfaces and a representative structure pattern. This is a design exploration tool, not an engineering or manufacturing validator.

## Run

Requires Node.js 20.19+ or 22.12+ and npm. Verified locally with Node 24.11.0 and npm 11.6.1.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite, usually `http://127.0.0.1:5173/`. For a production build:

```sh
npm run typecheck
npm run lint
npm run test
npm run build
npm run preview
```

The production preview usually opens at `http://127.0.0.1:4173/`. The build output is `dist/`; it is a static site and has not been publicly deployed.

## Use

- Drag the scene to orbit, right drag to pan, and scroll to zoom. Use the camera shortcuts for fixed views and Fit or Perspective for a reset.
- Change dimensions with a slider or its exact numeric field. Imperial fields use decimal feet. Thickness fields always use millimeters. Switching display units leaves the meter-based design unchanged.
- Choose SECTION VIEW and move its front-to-rear slider. The colored cut boundary shows the wall, floor, and roof slabs. Turn on Transparent to expose the conceptual interior pattern more clearly.
- Select a door or window in the scene or right-hand list. Edit its side, position, width, and height in the inspector. Use Duplicate and Delete as needed. The inspector and placement review show recoverable conflicts.
- Choose a preset, undo or redo edits, save and load named designs in this browser, or export and import version-1 JSON. Local autosave restores the active design after refresh. Import failures keep the current design.

## Scope and limits

Dimensions are geometric concept facts within prototype bounds. The roof rise fits inside the stated exterior body height. Ground clearance is measured from ground to the underside of the body floor. The tongue adds 1.20 m to body length. The wheel-inclusive width is based on the simplified visual chassis. Interior floor area integrates the narrowed nose and wall inset and is labeled approximate.

Four nose profiles and three roofs use sampled polygon surfaces. Cutouts are omitted from the sidewall mesh, with reveal faces around each hole. Section caps are generated at the slider plane. The solid, ribbed, honeycomb, and lattice patterns are visual concepts, not engineered infill. Wheel wells, axles, tongue, and rails are simplified visual geometry. Direct dragging of openings is not implemented; numeric fields and constrained range controls are the reliable positioning method.

This version has no stress analysis, axle rating, roadworthiness assessment, regulatory review, validated manufacturing requirement, material estimate, production export, backend, or account. Browser rendering and interaction were checked in the Codex in-app browser. WebGL-unavailable behavior, human usability, keyboard-only accessibility, and sustained performance on other hardware still need manual checking. See [acceptance evidence](docs/ACCEPTANCE.md).

## Project documents

- [Requirements](docs/REQUIREMENTS.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Decisions](docs/DECISIONS.md)
- [Build plan](docs/BUILD-PLAN.md)
- [Acceptance evidence](docs/ACCEPTANCE.md)
- [Current state](docs/CURRENT-STATE.md)
- [Sources](docs/SOURCES.md)
