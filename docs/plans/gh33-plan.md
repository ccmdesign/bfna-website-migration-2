# Plan — gh#33 / issue 24: `bfCardPerson` + the modal decision

**Issue:** [gh#33](https://github.com/ccmdesign/bfna-website-migration-2/issues/33) ·
**Spec:** [`docs/ds-epic/issues/24-bf-card-person.md`](../ds-epic/issues/24-bf-card-person.md) ·
**Epic:** [BF-217](https://app.plane.so/ccm-design/browse/BF-217/)

Written inline by the item-runner (the `ce-plan` fallback the runner template
allows) — the research it needed was already done in-turn: the spec, BRIEF §5/§8,
`wfCardPerson.vue`, `bf/Card.vue`, `bf/Media.vue`, `bf/CardFeatured.vue`,
`types/bf-contracts.ts`, `composition/grid.css`, the 13 `bfPeople` documents and
`docs/decisions/probe-harness.md`.

## Approach

The fourth typed wrapper over `bfCard`, and the first **non-interactive** one.
It follows the contract settled by #30–#32 exactly — `inheritAttrs: false`, a
root of `<bfCard v-bind="$attrs">`, one whole-entity prop, the shared
`headingLevel` from `CardWrapperProps`, no `<style>` block — and diverges in one
respect that is the whole point of the issue: **it renders no link**.

That divergence is not a gap to be filled later in this issue. The open
BF-174 question (modal vs. detail page vs. bio expander) is **resolved as
"ship unlinked"** and written into the spec's Decisions section as D-24.1, per
the orchestrator's ruling. Nothing interactive is built here.

Because there is no anchor, three properties of the base come for free and are
asserted rather than assumed:

- `bfCard`'s stretched `::after` is selected by `.bf-card :is(h2,h3,h4) a::after`
  — with no `a`, the pseudo-element never generates and there is no card-sized
  hit area;
- `.bf-card:has(:is(h2,h3,h4) a):hover` and the `:focus-visible` sibling never
  match, so the card takes no hover or focus treatment;
- the card is **not focusable** — nothing in it is a tab stop.

The #130 unnamed-stretched-link hazard is therefore structurally absent, not
merely handled: there is no link that could lack a name.

## Files

| File | Change |
|---|---|
| `bfna-website-nuxt/src/components/bf/CardPerson.vue` | **new** — the wrapper. `person: Person` + `headingLevel`, heading as `<component :is="'h'+headingLevel">` with **no `NuxtLink`**, `<p>{{ person.job_title ?? '—' }}</p>`, `#media` → `<bfMedia :src="person.image" alt="" ratio="1/1" />`. No `<style>`. |
| `bfna-website-nuxt/src/pages/bf-probe/24-bf-card-person.vue` | **new** — probe under `layout: 'bf-probe'`, `[data-probe-verdict]` root + `[data-probe-row][data-ok]` rows (#109). |
| `docs/ds-epic/issues/24-bf-card-person.md` | Decisions section: D-24.1 (the BF-174 ruling), D-24.2 (acceptance substitution), D-24.3 (the `—` fallback is real data). |
| `docs/plans/gh33-plan.md` | this file. |

No shared type is added: `Person` and `CardWrapperProps` both already exist in
`src/types/bf-contracts.ts`. No CSS file is touched, so BRIEF §5 rule 2 (no new
colour) and D-20.5 (no `:not()` with a complex selector) hold vacuously.

## Probe design

Real documents, queried by the **page** (the component fetches nothing — BRIEF D8):

- the **board four** — `irene-braam`, `liz-mohn`, `stephen-f-szabo`,
  `wilhelm-friedrich-uhr` (`board === true`) — plus a **team member**
  (`board === false`), in one `<ul class="grid" data-min-width="l">`.
  `l` = a 300px floor: under the 1200px `.container` and the harness's pinned
  1280×1024 viewport that resolves to exactly **3 columns** (4 × 300 exceeds
  1200 before any gap is added; 3 × 300 + 2 gaps fits). Both the resolved
  `--_grid-min-width` and the computed track count are asserted, so a viewport
  change fails with its cause named.
- `ma-a-ocvirk` carries `job_title: null` in the real data — the `—` fallback is
  exercised by a **real row**, not a synthetic one.
- every row carries an `image`, so the placeholder branch is exercised by one
  derived row (`{ ...row, image: null }`), the same technique probe 23 uses for
  its `heading: null` case.

Load-bearing assertions: 1/1 ratio on every portrait; `alt=""` declared not
omitted; placeholder is the `aria-hidden` `<div>`; the `—` fallback text;
h2/h3/h4 from `headingLevel`; **zero anchors anywhere in the card region**; no
`::after` content on any heading; nothing in a card is focusable
(`document.activeElement` unchanged after a `.focus()` attempt on the card and a
tab-order enumeration of the card region); the wrapper owns no DOM and `$attrs`
(incl. the `span` prop) reach the base.

## Test strategy

`npm run typecheck` cannot be the gate (`dev` carries ~178 legacy errors — the
baseline measured before any edit here is **178**); the gate is *no new errors*
plus zero errors in `src/components/bf|src/types|src/composables/bf|content.config`.
The spec's acceptance also names `grep -Lq` / a `.output` grep; the harness
run replaces the eyeball half:

```bash
cd bfna-website-nuxt
npx nuxt generate                              # exits 0
npx tsx scripts/check-probes.ts --only 24      # exits 0
npx tsx scripts/check-probes.ts                # full suite, exits 0
```

The vitest harness on `dev` is broken and pre-existing (residual #86); no test
here depends on it.

## Risks

1. **Scope creep back into BF-174.** Mitigation: the decision is recorded first,
   in the spec, and the probe asserts *absence* of a link — a future modal would
   fail this probe loudly rather than sliding in.
2. **A three-column grid that resolves to two.** Mitigation: assert the resolved
   floor *and* the track count; the arithmetic is written down above.
3. **`grep -Lq` in the spec's acceptance is a no-op as written** (`-L` prints
   filenames, `-q` suppresses output, so it exits 0 either way). Substituted
   with an explicit `! grep -q NuxtLink` and recorded as D-24.2.
4. **Prerender of the new probe route.** `nuxt.config.ts` enumerates
   `src/pages/bf-probe/` from disk (gh#28), so the route is seeded with no edit.
