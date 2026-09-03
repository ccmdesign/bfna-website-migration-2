# Plan — gh#27 / issue 18: `bfTime`

**Spec:** [`docs/ds-epic/issues/18-bf-time.md`](../ds-epic/issues/18-bf-time.md) ·
**Issue:** [gh#27](https://github.com/ccmdesign/bfna-website-migration-2/issues/27) ·
**Epic:** [BF-217](https://app.plane.so/ccm-design/browse/BF-217/) ·
**Branch:** `feature/gh27-bftime` off `dev`

> Written inline by the item-runner rather than through `ce-plan`, following the
> gh#26 precedent: a runner stalled inside a skill invocation on gh#25 and the
> runner contract says a degraded inline step beats a stranded item. The scope
> here is one ~40-line atom with a fully-written spec, so the plan is the cheap
> part.

## Approach

`bfTime` builds from nothing — there is no `wfTime`. Where the wireframes show a
date they emit bare inline `<time>` markup (`archive.vue`'s per-year rows). The
atom closes that gap with one rule:

> **The label is for a human, the `datetime` attribute is for a machine, and the
> machine one is never allowed to be wrong.**

Everything else follows from that.

### 1. Two derived values, one guard

```
parsed   = new Date(date)                      // null/''/undefined → invalid
isValid  = date is a non-empty string && !Number.isNaN(parsed.getTime())
```

`isValid` gates the whole template with `v-if`. An invalid input renders **no
element at all** — not a `<time>` with `datetime="Invalid Date"`, not a `<time>`
with an empty label. 20 of the 371 real insight rows have `publish_date: null`,
so this is the common path, not an edge case.

### 2. `datetime` is normalised, never passed through

The acceptance is "the rendered `datetime` attribute is always a valid ISO value
whenever the element renders". Echoing the raw prop would break that the moment a
caller hands over something `Date` can parse but HTML cannot (`'March 5, 2022'`).
So the attribute is rebuilt from the parsed date:

| input | `datetime` | why |
|---|---|---|
| `'2014-12-17'` (date-only) | `'2014-12-17'` verbatim | a *valid date string* in HTML; re-emitting `toISOString()` would invent a midnight-UTC precision the source never had |
| anything else parseable | `parsed.toISOString()` | a *valid global date-and-time string* |

Both branches are valid `<time datetime>` values per HTML. The date-only branch
is matched with `/^\d{4}-\d{2}-\d{2}$/` on the trimmed input.

**This is also where the component earns its keep.** `monthYear` parses a
date-only string as UTC midnight and renders it in the runtime's local zone, so
`'2014-08-01'` (a real row — `argentina`) labels as *Jul 2014* west of Greenwich.
That behaviour is deliberately preserved by `format.ts` and is not this issue's
to change — but the `datetime` attribute stays `2014-08-01`, exactly right, and
that is the value a crawler, a screen reader and a sort key read.

### 3. `format` is a one-member union, not a bare `string`

The spec reserves `format?: string` for a future non-default formatter and builds
only the `monthYear` path. A `string` prop that is silently ignored is a trap:
`format="long"` would typecheck, render `monthYear`, and tell nobody. Typed as
`TimeFormat = 'monthYear'` the reservation is kept — the prop exists, defaults to
`'monthYear'`, and a later issue widens the union — while a wrong value is a
compile error instead of silence. Recorded in the spec's Decisions section as a
deliberate narrowing.

### 4. Styling

The spec says the base build needs no CSS-variable hook, and it gets none. One
declaration ships, in `@layer components`: `white-space: nowrap`, so `Mar 2024`
cannot break across two lines in the narrow card footers this atom was built for.
No token, no colour, no custom property.

## Files

| File | Change |
|---|---|
| `bfna-website-nuxt/src/types/bf-contracts.ts` | add `TimeFormat` + `TimeProps` (BRIEF §5 rule 11) |
| `bfna-website-nuxt/src/components/bf/Time.vue` | new — the component |
| `bfna-website-nuxt/src/pages/bf-probe/18-bf-time.vue` | new — the probe, `layout: 'bf-probe'` |
| `docs/ds-epic/issues/18-bf-time.md` | append to **Decisions** only |
| `docs/plans/gh27-plan.md` | this file |

Nothing under `pages/wireframes/`, `components/wireframe/`, `layouts/wireframe.vue`
or `public/css/wireframe.css` is touched (D2 / DoD-4).

## Test strategy

The spec's acceptance names `npx vitest run src/tests/components/bf-time.spec.ts`.
The vitest harness on `dev` is broken and pre-existing (residual
[#86](https://github.com/ccmdesign/bfna-website-migration-2/issues/86)) and the
runner contract forbids depending on it, so the equivalent-strength substitute is
the probe under the `#109` harness — the same substitution gh#20–#26 made.

The probe is **stronger** than the named unit test, not weaker: it renders the
real component through the real cascade and asserts on the real DOM, and it covers
the three named cases plus four the spec did not name.

| case | input | asserted |
|---|---|---|
| valid, real | `'2014-12-17'` (`12-days-of-christmas-in-europe`) | renders; `datetime="2014-12-17"`; label `Dec 2014` |
| valid, real, oldest | `'2007-05-27'` (`the-crossroads`) | renders; label `May 2007` |
| valid, real, newest | `'2026-07-21'` (`the-nuclear-option`) | renders; label `Jul 2026` |
| **month boundary, real** | `'2014-08-01'` (`argentina`) | renders; `datetime` still `2014-08-01` though the label may read `Jul 2014` |
| date **and time** | `'2023-11-07T09:30:00.000Z'` | `datetime` is the full ISO timestamp |
| non-ISO but parseable | `'March 5, 2022'` | `datetime` normalised to ISO, not echoed |
| **empty string** (spec) | `''` | renders **nothing** |
| **`null`** (spec, 20 real rows) | `null` | renders **nothing** |
| `undefined` | `undefined` | renders **nothing** |
| garbage | `'not-a-date'` | renders **nothing** |

Plus five invariants over the whole page: every rendered element is a `<time>`;
every rendered `datetime` survives `Date.parse` without `NaN`; the string
`Invalid Date` appears nowhere in any attribute or text; `$attrs` falls through;
`.bf-time` is inside `@layer components` in the live CSSOM.

Label assertions use only mid-month dates, so no timezone the harness might run
in can decide the verdict. The one boundary date is asserted on its `datetime`,
which is timezone-invariant by construction.

## Verification

```bash
cd bfna-website-nuxt
npx nuxt typecheck 2>&1 | grep -cE 'error TS'      # ≤ 178 baseline, and 0 in bf/types
npx nuxt generate                                   # exits 0
npx tsx scripts/check-probes.ts --only 18           # exits 0
npx tsx scripts/check-probes.ts                     # every probe, exits 0
git diff --stat dev...HEAD -- <the four frozen wf paths>   # prints nothing
```

## Risks

| Risk | Mitigation |
|---|---|
| Harness timezone shifts a month-boundary label and reds the probe | no label row uses a boundary date; the boundary case is asserted on `datetime` only |
| `v-if="false"` still emits a comment node, so "renders nothing" could be read as "renders something" | the rows count `time` elements and query by `[data-probe-case]`, both of which a comment node cannot satisfy |
| Narrowing `format` to a union breaks a future caller | it is the *permissive* direction that breaks callers; widening a union is source-compatible. Recorded in Decisions. |
| `date` typed `string \| null` vs the spec's `date: string` | the prop stays **required** (no `?`); only its value is nullable, which is what the 20 null rows and the spec's own null clause require |
