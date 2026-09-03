# Plan — gh#34 / issue 25: `bfCardProgram`

**Spec:** [`docs/ds-epic/issues/25-bf-card-program.md`](../ds-epic/issues/25-bf-card-program.md) ·
**Issue:** [gh#34](https://github.com/ccmdesign/bfna-website-migration-2/issues/34) ·
**Epic:** [BF-217](https://app.plane.so/ccm-design/browse/BF-217/)

Written inline by the item-runner (the `ce-plan` fallback the runner template allows),
because the four wrappers before it (#30–#33) settled the contract this one follows and the
only genuinely new decision here is the hub route — which the brief has already resolved.

## Approach

The fifth typed wrapper over `bfCard`, and the smallest: one entity prop, a linked name, a
tagline paragraph. It is written against D-21.1's contract rather than re-deciding it —
`inheritAttrs: false`, a root of `<bfCard v-bind="$attrs">`, the **entity** as the prop, no
`<style>` block, presentational-only (BRIEF D8), and `headingLevel` from the shared
`CardWrapperProps` (#128).

The point of the issue is the **defect it fixes**. `wfCardProgram.vue:4` declares

```ts
program: { slug: string, name: string, tagline?: string | null, short?: string | null }
```

— an ad-hoc shape, not the entity — and its caller (`pages/wireframes/index.vue:61-66`)
hand-builds an object to match, deriving `tagline` in the page. `bfCardProgram` imports
`Program` from `~/types/bf-contracts` (zod-inferred from `bfProgramSchema`, issue 09) and
reads `program.tagline` as the plain field the normaliser (issue 07) already wrote. No
derivation in the component, and the `short` field does not exist on `Program` and is not
resurrected.

## Files

| File | Change |
|---|---|
| `bfna-website-nuxt/src/components/bf/CardProgram.vue` | **new** — the wrapper |
| `bfna-website-nuxt/src/pages/bf-probe/25-bf-card-program.vue` | **new** — the probe, `layout: 'bf-probe'` |
| `docs/ds-epic/issues/25-bf-card-program.md` | Decisions appended |
| `docs/plans/gh34-plan.md` | this file |

Nothing else. No schema edit (issue 09 owns it), no home-page row (issue 47), and nothing
under `pages/wireframes/`, `components/wireframe/`, `layouts/wireframe.vue` or
`public/css/wireframe.css` (D2).

## Decisions this plan makes

1. **The href is `/${program.slug}`** — the top-level programme hub of §7's route table,
   not the wireframe's `/wireframes/${slug}`. The three slugs are final and named in BRIEF
   §8: `democracy`, `transatlantic-relations-global-challenges`, `future-leadership`. The
   route file itself is issue 48's; `failOnError: false` in the prerender config means an
   unresolved link is not a build failure, and probe 22 already links `/projects/<slug>`
   ahead of that template for the same reason.
2. **`tagline` is rendered unconditionally-ish.** `bfProgramSchema` types it as a required
   non-nullable `z.string()`, so the frozen source's `v-if="program.tagline"` becomes a
   guard against the **empty string** rather than against `null` — kept, because an empty
   `<p>` still contributes a `gap` in `bfCard`'s flex column.
3. **No media slot.** The spec's Scope lists a heading and a tagline and nothing else; the
   schema carries an `image`, but the programs row (issue 47) is a text switcher in the
   wireframe. Adding a `media` prop no caller asks for fails BRIEF §5's rule of three.
4. **The #130 guard applies**: a blank `name` renders no heading and therefore no link, so
   the card can never become a card-sized anchor with no accessible name. Dev-time
   `console.warn`, as in the four wrappers before it.

## Test strategy

- Probe at `src/pages/bf-probe/25-bf-card-program.vue` under `layouts/bf-probe.vue`,
  following the #109 DOM convention (`[data-probe-verdict]` root,
  `[data-probe-row][data-ok]` rows). It queries `bfPrograms` itself (the component fetches
  nothing) and renders **all three real documents** in a `<ul class="switcher" data-gap="m">`
  — parity with `pages/wireframes/index.vue:21-24`.
- Load-bearing assertions: all 3 rows render; each heading is the row's `name` verbatim and
  each `<p>` its `tagline` verbatim; **each anchor's `href` is `/<slug>` for the three real
  slugs**, and none of them is `/wireframes/…`; the stretched `::after` overlay resolves and
  the card corner hit-tests to the anchor; `headingLevel` 2/3/4; blank name → no heading and
  no link; `$attrs` (class merge, `data-*`, the `span` prop) reach the base `<li>`; the
  wrapper adds no element and no class of its own.
- The **type** half of the acceptance (`typecheck must fail on the old inline shape`) is
  asserted structurally rather than by a throwaway error file: `Program` is imported as a
  type and the prop is annotated `program: Program`, greppable, and a `computed<Program[]>`
  assignability check in the probe fails to compile if the schema drifts. A file that must
  *fail* typecheck cannot be committed to a repo whose gate is "no new errors" (the
  TYPECHECK GATE) — recorded in the spec's Decisions.
- Gates: TYPECHECK GATE (baseline 178, no new errors, zero in `src/components/bf|types`),
  `npx nuxt generate` exit 0, `npx tsx scripts/check-probes.ts --only 25`, the full
  `npx tsx scripts/check-probes.ts`, and the wireframe byte-identity diff printing nothing.

## Risks

- **A hub route that does not exist yet.** Mitigated above; the probe asserts the `href`
  string, which is the contract, rather than a successful navigation.
- **The `switcher` limit rule.** `composition/switcher.css` uses
  `:nth-last-child(n + var(--_switcher-limit))`, which is invalid CSS (`var()` is not
  permitted in an `An+B`) and is dropped by the parser. Pre-existing, in a frozen-by-consumption
  composition file, and irrelevant at three children — noted, not touched, and the probe
  derives nothing from it: it asserts the three cards sit on one flex row by measuring their
  `offsetTop`, not by trusting the stylesheet.
- **Vitest is not available** (broken on `dev`, residual #86). The probe plus `check-probes.ts`
  is the substitute, recorded in the spec's Decisions.
