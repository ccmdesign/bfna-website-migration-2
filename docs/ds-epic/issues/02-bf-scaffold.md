# 02 — bf-scaffold

Create `src/components/bf/`, register it as an auto-import root with the
`bf` prefix, and ship the shared prop-contracts file every later component
issue intersects with.

## Context

Depends on 01 (docs amended first). Blocks every atom/molecule/organism/
template issue (03–56 all read `src/components/bf/` or `bf-contracts.ts`).
Builds from nothing new — mirrors the existing `ds/` auto-import entry in
`bfna-website-nuxt/src/nuxt.config.ts`. Provenance: v2 §2 "Level 1 — Atoms"
table (bf-* naming); E0 task 8 ("`bf-*` scaffolding: `src/components/bf/` +
auto-import prefix config").

## Scope

- `bfna-website-nuxt/src/nuxt.config.ts` — add one entry to the existing
  `components:` array (currently lines 117–144), following the exact shape
  already used for `ds/` (lines 118–122, which map `dsComponentDirs` to
  `{path, pathPrefix:false, prefix:'ccm'}`):
  ```ts
  {
    path: resolve(currentDir, 'components/bf'),
    pathPrefix: false,
    prefix: 'bf'
  }
  ```
  Insert it as its own array entry (not nested in `dsComponentDirs`) so
  `src/components/bf/Card.vue` auto-imports as `<bfCard>` and
  `src/components/bf/Button.vue` as `<bfButton>`.
- `bfna-website-nuxt/src/components/bf/` — new directory, initially empty
  except the throwaway probe below.
- `bfna-website-nuxt/src/types/bf-contracts.ts` — new file exporting the
  shared TS interfaces later issues intersect with entity types (per BRIEF
  §5.4 and digest ADR-1 "shared prop contracts as TS interfaces"):
  ```ts
  export interface CardBaseProps { span?: 'full' }
  export interface Crumb { label: string, to?: string | Record<string, unknown> }
  export interface Cta { label: string, to?: string, href?: string, external?: boolean, primary?: boolean }
  export interface Filter { key: string, label: string }
  export interface MenuItem { label: string, to?: string, href?: string, external?: boolean, strong?: boolean }
  export interface Menu { label: string, items?: MenuItem[], to?: string, href?: string, external?: boolean }
  export interface SearchResultRow { slug: string, heading: string, to: string, chip: string, archived?: boolean, date?: string, score: number }
  ```
  Field shapes mirror `WfCta` (`wfCtaSection.vue`), `WfCrumb`
  (`wfBreadcrumb.vue`), `WfMenuItem`/`WfMenu` (`useWfContent.ts` lines 69–85)
  — same fields, `bf`-side names, no `Wf` prefix.
- `src/components/bf/Probe.vue` — a one-line throwaway (`<template><span
  data-bf-probe>bf-probe ok</span></template>`) to prove auto-import in the
  same issue's PR, then **delete it before merge** (the file must not exist
  when this issue closes — the accept check below verifies).

## Out of scope

- Any real `bf-*` component (issues 14+).
- Any change to the `ds/`, `content/`, `docs/`, `templates/`, `legacy/`, or
  `wireframe/` entries already in the `components:` array — touch only the
  new array entry.
- Any edit under `pages/wireframes/` or `components/wireframe/`.

## Styling

N/A — no component markup or CSS ships in this issue; `bf-contracts.ts` is
pure TypeScript.

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
grep -n "prefix: 'bf'" src/nuxt.config.ts   # today: no match, fails; after: 1 match
test ! -f src/components/bf/Probe.vue       # probe deleted before merge
test -f src/types/bf-contracts.ts
```

## Decisions

_Runner appends here._
