# 18 — bf-time

New atom `bfTime`: a proper `<time datetime>` element with a human label,
closing the v1 "date display" gap.

## Context

Depends on 02 (scaffold), 10 (`format.ts`'s `monthYear`). Blocks 21
(`bfCardInsight`), 27 (`bfCardRow`), 29 (`bfByline`), 55 (Archive template).
Builds from nothing existing — no `wfTime`/date component exists in the
wireframe layer. Where dates render today it's bare inline text (e.g.
`archive.vue`'s per-year `<time>` markup, per as-built-wireframe-inventory
§F "By year" row: `wfChip + NuxtLink + time`) — this closes that gap.
Provenance: BF-160; v2 §2 Level 1 row 5 ("new").

## Scope

- New `bfna-website-nuxt/src/components/bf/Time.vue` (`<bfTime>`).
- Props: `date: string` (ISO string, required), `format?: string`
  (reserved for a future non-default formatter; only the default path is
  built here — no new formatting logic beyond `monthYear`).
- Renders `<time :datetime="isoString">{{ label }}</time>` where `label`
  defaults to `monthYear(date)` from `bfna-website-nuxt/src/utils/format.ts`
  (issue 10).
- Null/invalid-date handling: if `date` is `null`, `undefined`, empty
  string, or `new Date(date)` is `Invalid Date`, render **nothing** (no
  `<time>` element at all) rather than a `<time>` with `datetime="Invalid
  Date"` or a visible "Invalid Date" label.
- Unit tests (`src/tests/components/bf-time.spec.ts` or wherever the
  existing component-test convention lives) covering: a valid ISO date
  string, an empty string, and `null`.

## Out of scope

- Relative-time formatting ("3 days ago") — no wireframe evidence, not
  built.
- Timezone handling — dates are used as-is (date-only or already-UTC
  strings from the source data), no timezone conversion logic.
- i18n / non-`en-US` locales — `monthYear` is hardcoded `'en-US'` in
  `format.ts` per its existing port (issue 10), not extended here.
- Any edit under `pages/wireframes/` or `components/wireframe/`.

## Styling

No CSS-variable hook needed — `<time>` inherits surrounding typography, no
component-scoped style. If any spacing/inline-flow styling is added, use
`--_bf-time-*` per the naming convention, but the base build needs none.

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
test -f src/components/bf/Time.vue   # today: fails
npx vitest run src/tests/components/bf-time.spec.ts   # today: file doesn't exist, fails
```
Plus: unit tests cover a valid date, an empty string, and `null`; the
rendered `datetime` attribute is always a valid ISO value whenever the
element renders at all (per the issues.md `verify` column).

## Decisions

Appended by the item-runner for [gh#27](https://github.com/ccmdesign/bfna-website-migration-2/issues/27).
Plan: [`docs/plans/gh27-plan.md`](../../plans/gh27-plan.md).

### D-18.1 — `datetime` is rebuilt from the parsed date, never echoed from the prop

The spec says "renders `<time :datetime="isoString">`" without saying where
`isoString` comes from, and the obvious reading — bind the prop straight through
— fails the spec's own acceptance ("the rendered `datetime` attribute is always
a valid ISO value whenever the element renders"). `Date` parses a great deal
that HTML does not accept as a datetime value: `'March 5, 2022'`, `'12/17/2014'`.
Echoing those ships an invalid attribute while the visible label looks perfect —
the worst kind of defect, because nothing on screen says anything is wrong.

So the attribute is derived from the parsed date:

| input | `datetime` | why |
|---|---|---|
| `'2014-12-17'` — matches `/^\d{4}-\d{2}-\d{2}$/` | `'2014-12-17'`, verbatim | already a *valid date string* in HTML. Re-emitting `toISOString()` would invent a midnight-UTC precision the source never had. |
| anything else parseable | `parsed.toISOString()` | a *valid global date-and-time string*. |

The `v-if` is on the derived value rather than on `date`, so the guard and the
attribute are provably the same decision: there is no arrangement of props that
renders the element without a valid `datetime` on it.

### D-18.2 — the label may drift from the attribute at a month boundary; that is deliberate

`monthYear` (`utils/format.ts`, gh#19) parses a date-only string as **UTC
midnight** and formats it in the **runtime's local zone**, so west of Greenwich
`'2014-08-01'` — the real `argentina` insight — labels as *Jul 2014*. That is
documented, deliberately-preserved behaviour of the port, and this issue puts
timezone handling out of scope, so it is not changed here.

It is, however, the clearest argument for deriving the attribute separately: the
label may shift by a month, and the `datetime` stays `2014-08-01`, which is what
a crawler, a screen reader and a sort key read. Asserted on the probe — the
attribute pinned exactly, the label allowed to be either month.

**Consequence for later issues.** Anything that needs a date to *agree* with its
label (a visible "published on" line, a sort that a reader can check by eye)
should fix `monthYear`'s parse, not work around `bfTime`. That is a `format.ts`
change and belongs to its own issue.

### D-18.3 — `format` is a one-member union, not a bare `string`

The spec reserves `format?: string` for a future non-default formatter and
builds only the `monthYear` path. Shipped literally, that is a trap: a caller
writing `format="long"` typechecks, renders `monthYear` anyway, and is told
nothing.

Typed as `TimeFormat = 'monthYear'` in `src/types/bf-contracts.ts`, the
reservation is kept in full — the prop exists, it defaults to `'monthYear'`, and
the component dispatches through a `Record<TimeFormat, …>` table so adding a
formatter is one line plus one union member — while a value that does not exist
yet is a compile error instead of silence. Widening a union is source-compatible,
so this narrowing cannot break a later call site. A deliberate deviation from the
spec's literal `string`.

### D-18.4 — `date` is required but nullable (`string | null`)

The spec says `date` is required and separately requires the component to handle
`null`. Both are honoured: the prop key has no `?`, so omitting it is a call-site
error, and its value type admits `null`, because **20 of the 371 rows in
`content/bf/insights/` carry `publish_date: null`**. `undefined` is not typeable
and is still guarded at runtime — an untyped data path can produce one — and the
probe exercises it through a single deliberate cast.

### D-18.5 — invalid input renders no element, and the reason is layout, not just semantics

`null`, `undefined`, `''`, whitespace and unparseable strings render nothing at
all. Beyond the semantic argument the spec makes, there is a layout one: an empty
`<time></time>` is still a flex and grid item, so a card list with 20 dateless
rows would inherit a phantom `gap` at each of them. "Render nothing" has to mean
no element, not an empty one.

### D-18.6 — one style property, exposed as `--_bf-time-white-space`

One declaration ships, inside `@layer components`. The label is a two-token
string (`Mar 2024`) and the slots this atom was built for — card footers,
`bfByline` (29), the archive's per-year rows (55) — are the narrowest columns on
the site; a date broken across two lines reads as two facts. No token, no
colour, no typography: `<time>` inherits the surrounding type, as the spec's
Styling section says it should.

It is exposed as a custom property rather than declared flat, because that
section states the rule directly: *"if any spacing/inline-flow styling is added,
use `--_bf-time-*` per the naming convention"*. `white-space` **is** inline-flow
behaviour, so it takes the hook. A consumer whose slot is wide enough to want
wrapping — a prose byline, a one-column mobile footer — re-declares the property
instead of fighting a flat declaration with `!important`.

    .bf-time {
      --_bf-time-white-space: nowrap;

      white-space: var(--_bf-time-white-space);
    }

**The default lives in that rule, not in a `cssVars` binding** — the gh#26
lesson from `bfMedia`, which is only half-learned if it is remembered as "put it
in a custom property". A component that writes its own property inline on every
instance is no more overridable than one that writes the plain declaration
inline, because the cascade can see neither. `bfTime` has no styling prop and so
emits no inline `style` at all, which is itself asserted on the probe alongside
a consumer `@layer components` rule flipping `nowrap` → `normal` and a row
confirming the override does not leak back onto the other instances.

This was caught in the runner's own STEP 3 review of the diff, where the first
cut shipped a flat `white-space: nowrap`, and applied in STEP 4.

### D-18.7 — test substitution: the probe, not vitest (residual #86)

The spec's acceptance names
`npx vitest run src/tests/components/bf-time.spec.ts`. The vitest harness on
`dev` is broken and pre-existing ([#86](https://github.com/ccmdesign/bfna-website-migration-2/issues/86)),
and the runner contract forbids acceptance depending on it. The
equivalent-strength substitute is `src/pages/bf-probe/18-bf-time.vue` under the
[#109](https://github.com/ccmdesign/bfna-website-migration-2/issues/109) harness
— the same substitution gh#20–#26 made:

```bash
cd bfna-website-nuxt
npx nuxt generate
npx tsx scripts/check-probes.ts --only 18     # 42/42 rows
npx tsx scripts/check-probes.ts               # 10 probes, 344 rows
```

The probe is stronger than the named unit test, not weaker: it renders the real
component through the real cascade and asserts on the real DOM, and it covers the
three cases the spec names (a valid date, `''`, `null`) plus eight more — the
oldest and newest real rows, a real month-boundary row, a full timestamp, a
non-ISO but `Date`-parseable string, `undefined`, whitespace and garbage.

**Real dates, not invented ones.** Every valid case except the two format probes
is an actual `publish_date` from the snapshot, named with its slug on the page:
`2014-12-17` (`12-days-of-christmas-in-europe`), `2007-05-27` (`the-crossroads`,
oldest), `2026-07-21` (`the-nuclear-option`, newest), `2014-08-01` (`argentina`,
the month boundary).

**Timezone discipline in the probe.** The harness runs in whatever zone the
machine is set to, so no label row uses a date that can shift across a month
boundary — every asserted label is mid-month, or a timestamp far enough from
midnight to survive ±14h. The one boundary date is asserted on its `datetime`
only, and its label is asserted to be one of the two months it can legitimately
format to.

### D-18.8 — gate readings

| Gate | Reading |
|---|---|
| Typecheck baseline on `dev` | 178 `error TS` |
| Typecheck after this change | 178 — no new errors |
| `src/(components/bf\|types\|composables/bf)` + `content.config` errors | 0 |
| `npx nuxt generate` | exit 0, 818 routes |
| `check-probes.ts --only 18` | exit 0, 42/42 rows |
| `check-probes.ts` (all) | exit 0, 10 probes, 344 rows |
| Frozen `wf-*` source diff (branch and cumulative from the pre-epic SHA) | empty |
| New colour literals or `--color-*` tokens | none |
