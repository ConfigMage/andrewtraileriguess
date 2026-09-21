# Autonomous kickoff: Parametric Trailer Design Lab

Act as lead developer, product designer, and technical architect. Build the working MVP specified in docs/REQUIREMENTS.md. This is an implementation task, not a request for another plan.

## First actions

Read AGENTS.md and all project docs. Inspect the actual directory and any existing source code before creating files. Preserve this scaffold and unrelated user changes. Confirm the available runtime and tooling. Verify compatible stable frontend dependencies using official documentation, then record the selected versions and Node requirement. Use npm and one package-lock.json unless the existing project already uses another package manager.

Follow docs/BUILD-PLAN.md. Record initial contracts and sensible defaults in docs/DECISIONS.md, then proceed without waiting for approval of ordinary design choices. Resolve ambiguities within the established concept and document the assumption. Ask only if essential missing information prevents safe progress; continue independent work meanwhile.

## Required outcome

Deliver a static web application that opens directly into a polished 3D design workspace. Generate the shell procedurally, with live dimensions, four nose profiles, three roof profiles, simplified single/tandem chassis, and solid/ribbed/honeycomb/lattice conceptual wall structures. Provide a prominent working section slider that exposes meaningful thickness and structure.

Include selectable, editable side doors and windows with real visual openings and geometry-conflict warnings. Provide presets, camera shortcuts, visualization controls, units, undo/redo, local persistence, and validated versioned JSON import/export. Implement the detailed behavior and recovery requirements in docs/REQUIREMENTS.md and verify docs/ACCEPTANCE.md.

Prioritize correctness of geometry, section inspection, opening placement, and usable controls over decorative polish. Do not replace hard features with labels, nonfunctional buttons, or a prebuilt trailer model. If direct dragging is fragile, use reliable constrained handles/numeric positioning and document the choice.

Keep geometric measurements, design-rule assumptions, and illustrative estimates visibly distinct. A Prototype Estimate panel, exploded view, a second section direction, and GLTF export are secondary. Do not implement unsupported manufacturing or certification claims.

## Execution and handoff

Implement in slices, but continue through the full required MVP. Debug ordinary failures autonomously. Keep documentation current so another session can resume without this conversation. Do not mark unchecked requirements complete.

Run typecheck, lint, unit tests, and the production build. Exercise the actual UI in a browser where tooling permits. Check profile changes, section boundaries, visible opening cutouts, unit switching, selection, history, persistence, and malformed imports. Record screenshots or other evidence paths and test results, including failures.

Replace the scaffold README with accurate project setup and usage instructions while keeping a concise document index. Document the actual commands, dependencies, supported scope, geometry approximations, performance observations, and remaining checks.

Finish with a working local app, production build output, a cleanly documented implementation, and a concise report of changes, checks, limitations, and how to run it. If an external blocker prevents a requirement, state the exact blocker and remaining work instead of claiming the MVP is complete. Public deployment is not part of this task.
