# Project guidance

## Purpose and authority

Build Trailer Design Lab: a desktop-first, browser-based parametric trailer shell designer with section inspection and configurable doors/windows. Read docs/REQUIREMENTS.md as the feature contract. Read docs/CURRENT-STATE.md and docs/DECISIONS.md before continuing work. The kickoff task lives in CODEX-KICKOFF.md.

## Working agreements

- Take ownership of authorized implementation, debugging, testing, and documentation. Make ordinary technical decisions and record their rationale. Do not stop at a plan or empty scaffold.
- Work in the slices in docs/BUILD-PLAN.md, continuing through them without routine approval pauses. Before each slice, record a short Decide first block with its contracts, scope, and acceptance gates.
- Preserve existing user work. Inspect the repository before scaffolding into it. Do not run a generator that erases these files.
- Use evidence-driven troubleshooting. Explicitly correct an earlier theory when evidence disproves it.
- Do not use em dashes in code comments, documentation, UI copy, or other authored writing.
- Keep communication straightforward. Distinguish verified behavior, configurable assumptions, estimates, and untested behavior.
- Do not deploy publicly, purchase services, or change global security/approval settings as part of the local build.
- Update current state, architecture, decisions, and acceptance evidence as implementation progresses. Preserve failures and unresolved checks.

## Product and architecture boundaries

- Frontend only: Vite, React, TypeScript, Three.js, React Three Fiber, drei, Zustand, localStorage, and Vitest. Verify current stable compatibility from official documentation before choosing versions.
- Use a procedurally generated shell, not a prebuilt trailer model. Keep geometry and rule calculations separate from React.
- Use meters internally; convert only at input/output boundaries. Display unit changes must not mutate the design.
- Keep schema validation, geometry, estimates, configurable design rules, and scene presentation in separate modules.
- Section view is a core feature. Show meaningful wall, roof, and floor thickness and the selected conceptual structure.
- Doors and windows must correspond to actual visible shell openings, including in section/transparency views. Surface stickers alone are insufficient.
- No engineering certification, structural strength, roadworthiness, axle rating, or authoritative manufacturing claims. There are no validated manufacturing requirements at project start.
- No accounts, backend, payments, analytics, production slicing, or printer control. Optional features must not delay required features.

## Verification and completion

Create scripts for dev, build, preview, typecheck, lint, and test. Use meaningful deterministic tests for units, parameter validation, geometry rules, import/export, and estimates. Test history transaction behavior and recovery paths.

Run the actual typecheck, lint, test suite, and production build. Inspect the app in a real browser when available and collect visual evidence for the section and opening features. A passing build does not prove the rendered geometry works. Mark unavailable browser or manual checks as unverified.

Before handoff, review git diff and git status --short when this is a Git repository, exclude generated or unrelated files, and update docs/CURRENT-STATE.md. Report what works, verification results, known failures, optional deferrals, and remaining manual checks. Never fabricate test results.
