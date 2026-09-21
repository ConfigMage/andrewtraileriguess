# Sources and provenance

The user's referenced ChatGPT conversation was Trailer Tool Ideas, conversation ID 6ab17bda-18f4-83e8-9341-037867281f90. The selected direction was the Parametric Trailer Shell Designer with a little of the Interactive Trailer Configurator.

The conversation was retrieved on 2026-09-21. Its detailed build prompt was available through the beginning of section 36 (Demo Data); the retrieval tool truncated the remainder of that message. This package consolidates the visible requirements rather than claiming to reproduce the original prompt verbatim. Architecture clarifications and delivery/checklist documents are scaffold additions. They are labeled as such in DECISIONS.md where material.

Official Codex guidance checked for project instructions: [Custom instructions with AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md). Root AGENTS.md carries durable guidance and links to the longer task documents. No approval overrides or machine-specific Codex configuration are included.

The earlier conversation's package-version statements were not adopted as current facts. Verify runtime and package compatibility from official project documentation at implementation time.

## Dependency verification on 2026-09-21

- [React versions](https://react.dev/versions) reported React 19 as current. [React Three Fiber installation](https://r3f.docs.pmnd.rs/getting-started/installation) states Fiber 9 pairs with React 19.
- [Vite 8 release guidance](https://vite.dev/blog/announcing-vite8) states Node 20.19+ or 22.12+ and confirms Vite 8 is stable. [Vitest 4 guide](https://v4.vitest.dev/guide/) requires Vite 6+ and Node 20+.
- [Vite React plugin changelog](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/CHANGELOG.md) says plugin-react 6 supports Vite 8 and drops Vite 7 support. npm also rejected plugin-react 5 with Vite 8 during installation, and installation succeeded after pinning plugin-react 6.
- [drei releases](https://github.com/pmndrs/drei/releases) identified 10.7 as the stable release line; 11 was alpha at verification. Exact pinned package versions were resolved through npm and recorded in `package-lock.json`.

## Print setup check on 2026-09-21

- [Prusa Knowledge Base: Modeling with 3D printing in mind](https://help.prusa3d.com/article/modeling-with-3d-printing-in-mind_164135?product=core-one-plus) explains that features thinner than one perimeter are not printable in its FFF context and that orientation and support needs matter. The app therefore uses one user-entered extrusion width as a minimal sanity check, not a guarantee of printability or strength. No Prusa nozzle size or process setting was copied as a trailer default.
