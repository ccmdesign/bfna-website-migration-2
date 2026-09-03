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

### D-25.1 — the heading links to `/<slug>`, the hub route, and it is dangling today

The frozen source writes `/wireframes/${program.slug}`. `bfCardProgram` writes
`/${program.slug}` — the top-level programme hub of BRIEF §7's route table. The
three slugs are final and named in BRIEF §8 ("resolved"): `democracy`,
`transatlantic-relations-global-challenges`, `future-leadership`, and probe 25
asserts all three **by name** rather than by count, so a normaliser that renamed
one fails a check instead of passing a "3 rows rendered" one.

`pages/[program].vue` is issue 48's file, so these hrefs resolve to nothing
today. That is deliberate and it is the same footing `bfCardProject` (#31)
links `/projects/<slug>` on ahead of its own template:
`nitro.prerender.failOnError` is `false`, so an unresolved link is not a build
failure, and the probe asserts the **href string** — which is the contract this
issue owns — rather than a successful navigation, which belongs to 48.

### D-25.2 — no media slot, though `Program` carries an `image`

`bfProgramSchema` has `image: z.string().nullable()` and all three rows carry
one. The card renders none: the spec's Scope is a linked name and a tagline, the
frozen slot is a text `switcher`, and the one consumer (issue 47's home
"Programs" band) asks for nothing more. Adding a `media` prop no caller needs
fails BRIEF §5's rule of three, and `bfCardProject` already shows what the
opt-in looks like if 47 ever wants it. Probe 25 asserts the absence
(`.bf-card__media` count is 0) **and** that the assertion is not vacuous (all
three rows really do carry an image), so a later issue that adds media has to
change a named check rather than quietly satisfy an empty one.

### D-25.3 — the tagline `v-if` survives, with a narrower job

`wfCardProgram.vue:11` guards the paragraph with `v-if="program.tagline"`
because its inline shape typed the field `string | null | undefined`. The
schema types it as a **required** non-nullable `z.string()`, so the guard is not
redundant — it is now an *empty-string* guard, and worth keeping: an empty `<p>`
is still a flex child of `bfCard`'s column and still contributes a `gap`, which
reads as a programme card mysteriously taller than its neighbours. Probe 25
exercises the branch with a derived `tagline: ''` row.

### D-25.4 — the "typecheck must fail on the old shape" acceptance, as run

The spec asks that `npm run typecheck` **fail** if a caller passes the old
inline `{slug,name,tagline?,short?}` object, "verified by a throwaway type-error
probe removed before commit". A file that must fail typecheck cannot be
committed to this epic, whose gate is *no new errors* against a 178-error
baseline (the orchestrator's TYPECHECK GATE after #10, residual #71) — a
committed failing file would raise the count and fail the gate for every issue
after this one. The check was therefore run **throwaway and not committed**, and
is replaced in the standing acceptance by two committed structural assertions:

1. `program: Program`, imported as a type from `~/types/bf-contracts` and
   greppable in the source — the spec's own `grep -q "program: Program"`;
2. `const programs = computed<Program[]>(…)` in probe 25 over the live
   `queryCollection('bfPrograms')` result — an **assignability** check that
   stops compiling if `bfProgramSchema` and the `Program` type ever drift,
   which is the failure the throwaway probe was aiming at from the other side.

The throwaway run itself, quoted from the run rather than paraphrased: a scratch
page at `src/pages/bf-probe/zz-scratch-wrong-shape.vue` passing the wireframe's
ad-hoc object literal (`{ slug, name, short, tagline }`) to `<bfCardProgram>`
took the error count from 178 to **179**, the one new error being

```
src/pages/bf-probe/zz-scratch-wrong-shape.vue(11,40): error TS2739: Type
'{ slug: string; name: string; short: string; tagline: string; }' is missing the
following properties from type '{ slug: string; name: string; tagline: string;
intro: string | null; image: string | null; }': intro, image
```

The file was deleted before the commit and the count returned to 178. Worth
noting *which* error it is: `TS2739` on the **missing** `intro` and `image`, not
an excess-property complaint about `short` — the old shape fails because it is
not the entity, which is the stronger of the two reasons and the one that keeps
holding as the schema grows. Recorded here rather than as a committed file, per
the runner's substitution rule.

**Related substitution (residual #86):** the vitest harness on `dev` is broken
and pre-existing, so no unit test was written. Probe 25 plus
`npx tsx scripts/check-probes.ts --only 25` (51 rows, all green) is the
equivalent-strength check, run alongside the full 17-probe suite (715 rows).

### D-25.5 — the acceptance grep and the doc comment that would have broken it

The spec greps this file to prove it does **not** declare the inline shape. The
component's header comment documents the defect it fixes, and quoting the
declaration verbatim there would have failed that grep — a check on the
comments, not on the code, which is exactly the complaint #115 fixed for
`verify-bf-chip.ts` / `verify-bf-button.ts` by running their greps over
comment-stripped source. Here the comment was **abbreviated** instead
(`{ slug, name, tagline?, short? }`, the form the issue body itself uses), so
the spec's literal command passes as written and no deviation is needed. The
comment-stripped variant was run as well and also reports zero.

### Verification run (gh#34)

| Gate | Result |
|---|---|
| TYPECHECK GATE | baseline **178** `error TS` on `dev`; **178** after — no new errors. Errors matching `src/(components/bf\|types\|composables/bf)\|content.config`: **0** |
| `npx nuxt generate` | exits 0, 888 routes prerendered, `/bf-probe/25-bf-card-program` among them |
| `npx tsx scripts/check-probes.ts --only 25` | PASS — 51/51 rows |
| `npx tsx scripts/check-probes.ts` | PASS — 17 probes, 715 rows, 0 failures |
| Wireframe byte-identity (vs `dev` and vs the pre-epic base `f757a64`) | prints nothing, including `useWfContent.ts` and `assets/wireframe-data` |
| No new colour | this issue ships no `<style>` block in either new component file; the probe's scoped block uses `--space-*` and the existing `--color-error` only |
