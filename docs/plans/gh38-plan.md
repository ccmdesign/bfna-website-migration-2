# Plan — gh#38 / issue 29 — `bfByline` (+ the `ccmByLine` naming collision)

**Spec (authoritative):** [`docs/ds-epic/issues/29-bf-byline.md`](../ds-epic/issues/29-bf-byline.md) ·
**Issue:** [gh#38](https://github.com/ccmdesign/bfna-website-migration-2/issues/38) ·
**Epic:** [BF-217](https://app.plane.so/ccm-design/browse/BF-217/)

> `ce-plan` in pipeline mode was not invoked, on the same reasoning recorded in
> `gh37-plan.md`: the spec already fixes the file path, the prop shape, the
> markup, the styling hook and the acceptance commands, so a planning round had
> no open question to resolve and would have restated the spec at frontier-model
> cost. Writing this file directly is the sanctioned fallback in the runner
> template.

## Approach

One presentational molecule (`src/components/bf/Byline.vue` → `<bfByline>`), one
props interface in `src/types/bf-contracts.ts`, one probe at
`src/pages/bf-probe/29-bf-byline.vue`. No `wf-*` file is read from at runtime and
none is edited. `src/components/ds/organisms/ccmByLine.vue` is not touched.

`bfByline` composes `bfTime` (#27) for the date half and renders the author half
itself. It is props-only — no slot — per the spec.

## The naming collision, resolved

The two components never collide, and that is provable rather than assertable by
assurance. Nuxt's `scanComponents` builds a component's registered name by
walking the configured `prefix` against the *file name*, stopping as soon as the
two agree:

| file | dir config | registered name |
|---|---|---|
| `components/ds/organisms/ccmByLine.vue` | `prefix: 'ccm'`, `pathPrefix: false` | `CcmByLine` — the prefix is dropped because the file name already starts with it |
| `components/bf/Byline.vue` | `prefix: 'bf'`, `pathPrefix: false` | `BfByline` |

`.nuxt/components.d.ts` on `dev` already carries `CcmByLine` (line 33). The build
adds `BfByline`. Two distinct identifiers, two distinct kebab tags
(`ccm-by-line`, `bf-byline`), one registry.

Resolution, per the spec: **leave `ccmByLine.vue` completely untouched.**
`bfByline` is a net-new article byline with no relationship to the footer-credit
organism beyond a coincidental name similarity. Recorded verbatim in the spec's
Decisions section, and asserted three ways (below).

## Files

| File | Change |
|---|---|
| `bfna-website-nuxt/src/types/bf-contracts.ts` | add `BylineProps` |
| `bfna-website-nuxt/src/components/bf/Byline.vue` | **new** |
| `bfna-website-nuxt/src/pages/bf-probe/29-bf-byline.vue` | **new** |
| `docs/ds-epic/issues/29-bf-byline.md` | append Decisions |
| `docs/plans/gh38-plan.md` | this file |

## Contract

```ts
export interface BylineProps {
  author: string
  date?: string | null
}
```

`date` is widened from the spec's `string` to `string | null` because the real
data shape is `Insight['publish_date']: string | null` (`content.config.ts:69`)
and `bfTime` already types its own `date` as `string | null`. Widening an
optional prop is source-compatible; narrowing it would have forced every future
call site to write `insight.publish_date ?? undefined`.

## The missing-author case — the one real decision

The wireframe renders a literal placeholder:

```vue
<span v-if="insight.authors?.length">By {{ insight.authors.join(', ') }}</span>
<span v-else>By [author]</span>
```

`[author]` is a data-gap marker, not a design intent, and the gap is large:
**268 of the 371 rows in `content/bf/insights/` carry an empty `authors` array**
(103 carry one or two names). So the empty case is the common path, exactly as
`publish_date: null` was for `bfTime` (#27), and the resolution is the same one:

- **empty / whitespace author + a date** → the byline renders, carrying only the
  date. A dateline is a legitimate byline; `By ` with nothing after it is not.
- **empty author + no usable date** → **no element at all**. Not an empty `<p>`:
  `.bf-byline` is a flex container and its parent is usually a `.stack` or
  `.cluster`, so an empty paragraph inherits a phantom gap — the precise failure
  `bfTime` documents and avoids.
- **the string `[author]` is never rendered.** It does not survive contact with
  production data.

"A usable date" is decided with the same trim-then-`Date.parse` rule `bfTime`
applies, duplicated as one local computed rather than shared through
`utils/format.ts`, so no merged component is edited for this issue. The
duplication is not left on trust: the probe asserts, per case, that the
component's prediction and `bfTime`'s actual output agree, so a future drift
between the two fails the harness.

## Styling

`@layer components`, tokens only, no new colour, no `:not()` (D-20.5).

```css
.bf-byline {
  --_bf-byline-gap: var(--_cluster-space, var(--space-xs));

  gap: var(--_bf-byline-gap);
  align-items: baseline;
}
```

The hook chains *through* the composition layer's `--_cluster-space` rather than
around it. A flat `gap: var(--_bf-byline-gap)` in `@layer components` would
outrank `.cluster[data-gap]` in `@layer composition` and silently make
`data-gap` inert on this component — a trap for the next caller. Written this
way both routes work: `data-gap="s"` from a consumer flows through
`--_cluster-space` into the hook, and setting `--_bf-byline-gap` directly
overrides it.

`align-items: baseline` over `.cluster`'s `center`, on `bfCardRow`'s reasoning
(`Card.vue:330`): the author run and the date run may be set at different sizes,
and centring their boxes leaves two visibly different text baselines on one line.

## Test strategy

The vitest harness on `dev` is broken and pre-existing (residual #86), so
acceptance is the probe under the #109 harness, per the #20–#28 precedent.

1. `npx nuxt typecheck` — gate is **no new errors** vs. the 178-error baseline on
   `dev`, and **0** errors under `src/components/bf`, `src/types`,
   `src/composables/bf`, `content.config`.
2. `npx nuxt generate` exits 0.
3. `npx tsx scripts/check-probes.ts --only 29`, then the **full** run.
4. `grep -q "By " .output/public/bf-probe/29-bf-byline/index.html` — the spec's
   own prerender check.
5. Collision, three ways: `grep -q 'BfByline' .nuxt/components.d.ts` **and**
   `grep -q 'CcmByLine' .nuxt/components.d.ts` (distinct registered names);
   the probe renders `<ccmByLine />` beside `<bfByline>` and asserts both
   resolved to different elements; `git diff --stat -- src/components/ds/organisms/ccmByLine.vue`
   prints nothing.
6. Wireframe byte-identity vs. the pre-epic base SHA prints nothing.

### Substituted acceptance command

The spec's `grep -Lq "ccmByLine" src/components/bf/Byline.vue` is malformed:
`-q` overrides `-L`, so the command exits **0 when the pattern is present** —
the opposite of what it reads as. It is replaced by
`! grep -q "ccmByLine" src/components/bf/Byline.vue`, which is the check the
spec meant (the new component neither imports nor names the legacy organism),
and the substitution is recorded in the spec's Decisions section. The component
therefore refers to the legacy file by path and role, never by that identifier.

## Risks

| Risk | Mitigation |
|---|---|
| The duplicated date guard drifts from `bfTime`'s | Probe asserts prediction === actual rendering, per case |
| `data-gap` silently made inert by the component layer | The hook chains through `--_cluster-space`; probe asserts an override at `data-gap="l"` moves the resolved gap |
| A future reader conflates `bfByline` with `ccmByLine` | Spec Decisions section, this plan, and a probe section that renders both side by side |
| Probe route missing from `.output/public` | Routes are enumerated from disk into `nitro.prerender.routes` (gh#28) — no edit needed |

## Out of scope

Renaming or editing `ccmByLine.vue`; avatars; array-valued authors (the caller
joins); wiring the component into `insights/[slug].vue` (that is issue 50 — see
the Decisions note recommending it adopt this component).
