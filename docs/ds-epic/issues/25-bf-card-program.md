# 25 — `bfCardProgram` — typed program card (fixes inline-shape defect)

One-line objective: port `wfCardProgram.vue` to a typed `bfCard` wrapper,
**fixing** the as-built defect where it declared an ad-hoc inline prop shape
instead of the real `Program` entity type.

## Context

Depends on 20 (`bfCard`). Builds from
`src/components/wireframe/wfCardProgram.vue`. Consumed by 47 (home
"Programs" switcher). Provenance: BF-200; as-built §E. **Known defect being
fixed here**: `wfCardProgram.vue` declares `program: {slug, name, tagline?,
short?}` inline instead of importing `WfProgram`, and its caller
(`index.vue:61-66`) hand-builds a matching ad-hoc object rather than passing
a real `WfProgram`. `bfCardProgram` must not repeat this — it imports the
real `Program` type from issue 09's schema.

## Scope

- File: `src/components/bf/CardProgram.vue` → `<bfCardProgram>`.
- Props:
  ```ts
  interface Props {
    program: Program   // zod-inferred type from issue 09 (bfPrograms schema) — NOT an inline {slug,name,tagline?,short?} shape
  }
  ```
- `inheritAttrs: false`, `<bfCard v-bind="$attrs">` root.
- Renders: `<h3><NuxtLink :to="\`/${program.slug}\`">{{ program.name
  }}</NuxtLink></h3>`, conditional `<p>{{ program.tagline }}</p>`.
- The `Program` schema (issue 09) carries `name`/`intro`/`image`/`tagline`
  per the as-built `WfProgram` type (`heading → name` rename already applied
  by the normaliser, issue 07) — `tagline` **is** a real schema field (see
  Decisions): the normaliser derives it as the first sentence of `intro`,
  so this component reads `program.tagline` directly and does no derivation
  of its own (D8 presentational-only).

## Out of scope

- The programs-row layout on the home page (issue 47).
- Adding fields to the program schema (issue 09 owns the schema).
- No edits under `pages/wireframes/` or `components/wireframe/` (D2).

## Styling

- No new CSS variables; reuses `bfCard`'s hooks.

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
test -f src/components/bf/CardProgram.vue
grep -q "program: Program" src/components/bf/CardProgram.vue
grep -Lq "slug: string, name: string" src/components/bf/CardProgram.vue
```
The typecheck must **fail** if a caller passes the old inline
`{slug,name,tagline?,short?}` shape (verified by a throwaway type-error
probe removed before commit, or by `tsc --noEmit` against a scratch caller
using the wrong shape). Probe page `src/pages/bf-probe/25-bf-card-program.vue`
renders all 3 real programs from `bfPrograms`:
```bash
grep -c "wf-card\|bf-card" .output/public/bf-probe/25-bf-card-program/index.html
```
Fails today (no `bf/CardProgram.vue`), passes once done.

## Decisions

- **Program.tagline**: the canonical `Program` shape carries a required
  `tagline: string`, derived by the normaliser (issue 07) as the first
  sentence of `intro`, schema'd in issue 09. This component reads it as a
  plain field — no derivation here. Same decision recorded in issues 07
  and 09.

_Runner appends here._
