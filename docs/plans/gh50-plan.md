# Plan — gh#50 / issue 41 · `bfNotice`

**Issue:** [#50](https://github.com/ccmdesign/bfna-website-migration-2/issues/50) ·
**Spec:** [`docs/ds-epic/issues/41-bf-notice.md`](../ds-epic/issues/41-bf-notice.md) ·
**Epic:** [BF-217](https://app.plane.so/ccm-design/browse/BF-217/) ·
**Branch:** `feature/gh50-bfnotice` off `dev`

Written inline by the item-runner (the sanctioned fallback for STEP 1) rather than
through `ce-plan`, to keep the whole item inside one turn.

## 1. What ships

| File | Change |
|---|---|
| `bfna-website-nuxt/src/types/bf-contracts.ts` | add `NoticeVariant` union + `NoticeProps` (BRIEF §5 rule 11 — shared types live here and nowhere else) |
| `bfna-website-nuxt/src/components/bf/Notice.vue` | new — `<bfNotice>` |
| `bfna-website-nuxt/src/pages/bf-probe/41-bf-notice.vue` | new probe, `layout: 'bf-probe'`, harness DOM convention |
| `docs/ds-epic/issues/41-bf-notice.md` | append the Decisions section |
| `docs/plans/gh50-plan.md` | this file |

Nothing else. No wireframe file is read-write; `search.vue` and `insights/[slug].vue`
are read as the parity source only (D2 / DoD-4).

## 2. Approach

**Contract.** `variant?: 'note' | 'info' | 'warning'` (default `'note'`) and
`announced?: boolean` (default `false`), plus the default slot. Root is a single
`<div class="bf-notice" :data-variant="variant" :role="announced ? 'status' : undefined">`,
so `$attrs` falls through on its own (`inheritAttrs` left at its default — one root,
nothing to choose between).

`role="status"` is opt-in, never inferred. The wf source carries no signal for it: the
distinction is behavioural (does this message appear at runtime in response to user
action?), so it is a prop. `undefined` rather than `null` for the off case — Vue drops
the attribute entirely, and an empty `role=""` is not the same thing.

**Variants come from tokens that already exist.** Post-issue-06 the semantic layer
carries `--color-warning` (yellow), `--color-info` (navy) and the neutral
`--color-base-*` family, each with the generated `-super-light` (tint-11) and `-dark`
(shade-40) derivatives. So the "distinct warning token" the spec worries about *does*
exist and no gap needs recording — that finding goes in Decisions.

Three variables per variant, exactly as the spec names them:

| variant | `--_bf-notice-bg` | `--_bf-notice-border` | `--_bf-notice-color` |
|---|---|---|---|
| `note` (default) | `--color-base-super-light` | `--color-base-light` | `--color-text` |
| `info` | `--color-info-super-light` | `--color-info` | `--color-info-dark` |
| `warning` | `--color-warning-super-light` | `--color-warning-dark` | `--color-warning-dark` |

`warning`'s border is the `-dark` step, not the mid-tone: `--color-warning` on its own
tint-11 ground measures ≈1.7:1, below the 3:1 WCAG 1.4.11 non-text floor, so the
mid-tone would be a decorative edge rather than a distinguishing one. `info`'s mid-tone
measures ≈9.7:1 and is kept.

**No colour literal, no primitive.** Every value above is a semantic token
(BRIEF §5 rule 2). The spec's `grep -Lq "#[0-9a-fA-F]\{3,6\}"` is satisfied by
construction, and re-expressed as a verified check (see §4).

**Structure of the rule.** One `.bf-notice` rule declaring the three defaults plus the
box, then one `[data-variant="…"]` rule per non-default variant redeclaring only the
triplet. Inside `@layer components`. No `:not()` anywhere (D-20.5), no inline `:style`
binding (the `bfMedia` lesson, gh#26 — a declaration a consumer cannot outrank).

**Monospace is dropped.** See Decisions; the notice inherits the body font.

## 3. Probe — `/bf-probe/41-bf-notice`

Follows `docs/decisions/probe-harness.md`: `<main class="probe" data-probe="41"
:data-probe-verdict>`, one `[data-probe-row][data-ok]` per assertion, PENDING until
`onMounted` finishes, `setTimeout` safety net so a wedged walk fails loudly.

All four instances mount **side by side** (unlike probe 33 — nothing here renders an
`<h1>`), so the prerendered HTML holds `data-variant="warning"` and the announced
instance at once.

Rows:

1. all three variants render, each with its own `data-variant`; the default is `note`.
2. `role="status"` on the announced instance **only** — the other three carry no `role`
   attribute at all.
3. the three variants' resolved `background-color`, `border-*-color` and `color` are
   pairwise **different** (a variant that is not visibly distinct fails here, not the eye).
4. contrast: text-on-background ≥ 4.5:1 and border-on-background ≥ 3:1 for each variant,
   computed from the resolved `rgb()` triples with a WCAG 2.1 relative-luminance
   function written in the probe. Reported as numbers, not just pass/fail.
5. the same four contrast measurements repeated inside a wrapper forced to
   `color-scheme: dark` — the stack ships one colourway, so the resolved pairs must be
   identical, which is the honest form of "passes AA in dark mode" here (Decisions).
6. the default slot renders its content; the component adds no wrapper element.
7. `.bf-notice` rules live in `@layer components` in the live CSSOM.
8. the component emits no inline `style` of its own; `$attrs` reaches the root and
   merges with, rather than replaces, `bf-notice`.
9. no `bf-*` rule on the page uses `:not()` with a complex selector (D-20.5).
10. the notice is **not** monospace — the resolved `font-family` equals the body's.

## 4. Verification (what actually gates the PR)

The spec's acceptance block is rewritten where its literal text is unrunnable, and the
substitutions are recorded in Decisions (test-harness rule; D-37.5):

- `npm run typecheck` → the epic's **typecheck gate**: baseline `178` errors on `dev`;
  after must be `≤ 178` and zero of them under `src/(components/bf|types|composables/bf)`
  or `content.config`.
- `grep -Lq "#[0-9a-fA-F]\{3,6\}"` → `-L` prints *files without* the match and `-q`
  suppresses output, so the two flags cancel and the line exits 0 on any input, matching
  or not. Replaced with a real negative assertion (`grep -Eq … && exit 1`).
- `grep -q 'data-variant="warning"' .output/public/…/index.html` → kept, and backed by
  the runtime probe rows above.
- `npx nuxt generate` exits 0.
- `npx tsx scripts/check-probes.ts --only 41` **and** the full run exit 0.
- wireframe byte-identity: `git diff --stat` over the four frozen paths prints nothing,
  cumulatively from the pre-epic base SHA.

## 5. Risks

| Risk | Mitigation |
|---|---|
| `color-mix()` in the tint/shade tokens resolves lazily; a probe that string-compares would read `color-mix(…)` rather than a colour | every colour row reads `getComputedStyle`, which resolves to `rgb()` / `oklab()`; the contrast helper parses whatever comes back through a canvas-free `rgb()` path and fails loudly on an unparseable value rather than passing |
| `warning`'s yellow family is light; a naive triplet fails AA | the table above was pre-computed by hand and is re-measured at runtime by rows 4–5 |
| Probe route missing from prerender | `nuxt.config.ts` enumerates `pages/bf-probe/` from disk (gh#28) — nothing to add |
| Consumers (46 / 50 / 54) not in this issue | out of scope by the spec; this issue ships the component and its probe only |
