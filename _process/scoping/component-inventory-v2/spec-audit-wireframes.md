# Spec — as-built audit of the wireframe component layer (ANALYSIS)

## Objective
Produce a precise, structured inventory of what the wireframes ACTUALLY use
today, so it can be diffed against the v1 planned inventory. Value is the
CONCLUSION plus a well-structured file. Read-only on the repo.

## Scope — main checkout, branch `wireframes` (already checked out, do not switch)
Root: /Users/claudiomendonca/Documents/GitHub/ccmdesign/ccm-clients/bfna/bfna-website-migration-2/bfna-website-nuxt/src
- `components/wireframe/*.vue`            (all wf-* components)
- `layouts/wireframe.vue`
- `pages/wireframes/**/*.vue`
- `public/css/wireframe.css`              (lo-fi skin + wf-* primitives)
- `composables/useWfContent.ts`           (data surface the components consume)
- `public/css/` composition utilities actually referenced by the above
  (stack / cluster / grid / switcher / center / etc.) — usage only, don't audit
  the utility files themselves.
Out of scope: legacy components, src/directus, anything not reached from the
wireframe layout/pages.

## What to capture
A. **Components** — one entry per wf-* component: file · one-line purpose ·
   props (name:type:default) · slots · emits · child components used ·
   which pages/components use it (count + list) · variants expressed via
   props/data-attributes · notes on inheritance (base + typed wrapper pattern).
B. **CSS primitives** — every `.wf-*` class and `[data-*]` hook in
   wireframe.css: selector · purpose · which components/pages rely on it.
C. **Composition layer usage** — which Every-Layout primitives are used, with
   which data-gap / data-min-width / etc. values, and how often. Flag any
   place the same layout is hand-rolled with inline style instead.
D. **Inline / ad-hoc UI** — markup in pages or layout that behaves like a
   component but isn't one (repeated 2+ times, or clearly a candidate). Give
   file:line and a proposed component name.
E. **Data contracts** — for each component, the useWfContent type(s) it
   consumes (WfInsight, WfProject, WfPerson, …) and which fields it reads.
F. **Page → section map** — for each wireframe page: ordered list of sections
   (by data-label) and the component stack inside each.

## Deliverable
Write `_process/scoping/component-inventory-v2/as-built-wireframe-inventory.md`
with sections A–F above, tables where tabular. Be exhaustive on A/B/E; be
concise on C/D/F. Machine-checkable facts (counts, file:line) over prose.
Do NOT edit any other file.

## Verification (run before returning, report pass/fail)
- Count of `components/wireframe/*.vue` files == count of entries in section A.
- Every `.wf-[a-z_-]+` selector in wireframe.css appears in section B
  (`grep -oE '\.wf-[a-zA-Z0-9_-]+' public/css/wireframe.css | sort -u`).
- Every wf-* component has ≥1 usage listed, or is explicitly marked "unused".

## Return shape — a compact verdict, ≤ 12 lines
- counts: components / CSS primitives / ad-hoc candidates / pages
- the 3 most significant observations for a design-system iteration
- verification results (3 checks, pass/fail)
- residual risk or anything you could not resolve
- artifact: the file path
No essays. No pasted tables. The file carries the detail.
