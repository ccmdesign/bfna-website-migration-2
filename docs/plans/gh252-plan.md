# gh#252 — wire `data-program` onto the programme, insight and project routes

Issue: https://github.com/ccmdesign/bfna-website-migration-2/issues/252
Parent plan: `docs/plans/bf220-design-phase-wave-1-plan.md` §"Apply the hook", §4
Tokens it activates: `docs/decisions/gh251-programme-colour-tokens.md`
Epic: https://app.plane.so/ccm-design/browse/BF-220/

Written by the runner rather than `ce-plan`, for the same reason `gh67-plan.md`
records: the whole decision surface is three files and one placement question,
and the research (token source order, `useHead` shape, the three programme
resolutions already present in the pages, the dead `theme` enum's import graph)
was done in-turn. Re-deriving it inside a planning skill would produce the same
list at the cost of a second full pass. The runner brief names this file as the
documented fallback.

## The settled mapping is not in scope

`css-legacy/global.css:274-289` maps `.democracy` → yellow and
`.politics-society` → green, the reverse of the hues #251 shipped. That conflict
is closed: `gh251-programme-colour-tokens.md` §"Addendum — mapping ratified
2026-09-04" records that the reassignment was put to the client with the
correction costed and **the shipped mapping was deliberately kept**. This issue
consumes that mapping and does not restate, re-derive or revisit it.

    democracy                                  → teal
    future-leadership                          → red
    transatlantic-relations-global-challenges  → amber/ochre

## Approach

### 1. Where the attribute goes: `<html>`, via `useHead`

The constraint is that pages render no wrapper element — `bf-default.vue`'s
`<main class="stack" data-gap="xl">` is each page's own stack, and a `<div>`
here collapses the bands into one stack child. Every one of the three pages
carries that comment verbatim at the top of its `<template>`.

The two permitted placements are not equivalent:

- **Outermost `bfSection`/`bfPageHeader`.** The custom property inherits to that
  band's descendants and to nothing else. On `/democracy` the Projects and
  Insights bands below the header would resolve the neutral `:root` navy — three
  bands, two colours. That is not the mechanism #251 built.
- **`<html>`, via `useHead({ htmlAttrs })`.** One attribute, set above the
  landmark, recolouring everything below it. This is production's actual
  mechanism as `semantic-colors.css:186-192` describes it ("one custom property,
  set high in the tree, recolours every component below it"), and it needs no
  element that does not already exist.

`<html>` it is. The specificity tie this creates was anticipated and is already
handled: `:root` and `[data-program="x"]` have equal specificity, both live in
`@layer tokens`, and `semantic-colors.css:239-244` states that the neutral
default is declared **first on purpose** so the programme block wins when the
attribute lands on `<html>` itself. Source order is verified, not assumed —
`:root` at 245, `[data-program="democracy"]` at 249.

`<body>` was considered and rejected: it works, but it makes the neutral default
unreachable-in-practice rather than genuinely a fallback, and it disagrees with
the comment the token file already ships.

### 2. A composable owns the placement decision once

New: `src/composables/useProgramTheme.ts`.

```ts
useProgramTheme(program?.slug)
```

Three call sites would otherwise carry three copies of §1's rationale and three
chances to disagree about the element. The composable is imported explicitly,
matching `ccmCard.vue:58`'s `import { useSlugify } from '~/composables/useSlugify'`
— pages import composables by path in this repo, they do not rely on the
auto-import.

Two things it owns beyond the `useHead` call:

- **The guard.** The argument is validated with `isProgramSlug` from
  `~/utils/bf-programs`, the same build-time glob over `content/bf/programs/*.json`
  that `pages/[program].vue`'s route `validate` uses. Anything else — including
  the 52 insights whose stored `program` is a migration signal
  (`PENDING-Q3 (Digital World retired)` and friends) — resolves to no attribute
  and therefore to the neutral `:root` default. The content collection is the
  single source of the three slugs; `src/types/directus.ts:75`'s `theme` enum is
  not consulted (see §5).
- **Absence, explicitly.** The `htmlAttrs` key is spread in only when there is a
  slug, rather than passing `undefined` and trusting unhead's normalisation to
  drop it. One less framework behaviour to depend on for the fallback case that
  the acceptance tests.

D8 holds: a page may call a composable, a `bf-*` component may not. All three
call sites are pages.

### 3. The three call sites

Each page already resolves its programme; none needs a new query.

| page | source | change |
| --- | --- | --- |
| `src/pages/[program].vue` | `program` from `programBySlug(route.params.program)` | add `useProgramTheme(program?.slug)` |
| `src/pages/insights/[slug].vue` | `program` row already resolved at :92 by name-match against `programs()` | add `useProgramTheme(program?.slug)` |
| `src/pages/projects/[slug].vue` | resolves only `programName` at :138 | resolve the **row** first, derive `programName` off it, then `useProgramTheme(program?.slug)` |

The projects page is the only one that changes an existing binding. Today it
does `programs().find(p => p.name === project.program)?.name`; it becomes a
`find` to the row plus `?.name`, which is character-for-character what
`insights/[slug].vue:92-97` already does. `chips` keeps reading `programName`, so
the rendered chip is unchanged.

Insight and project pages resolve through the stored display **name** because
that is what the data carries; the guard then converts the matched row's slug.
No page keys off a raw stored string.

### 4. Fallback is by omission, not by a written default

`/about`, `/search`, `/insights`, `/projects`, `/`, `/archive` and every
`[...slug]` page never call `useProgramTheme`, so `<html>` carries no
`data-program` and `:root` answers. Nothing is added to those pages. The two the
acceptance names get browser evidence rather than an argument.

The case worth testing beyond those two is a detail page whose stored programme
is *not* one of the three — the guard's own path. One of the 52 mis-tagged
insights covers it.

### 5. The stale `theme` enum — reported, not deleted

`src/types/directus.ts:75` types `Product.theme` as
`'politics-society' | 'democracy' | 'digital-world' | 'future-leadership' | 'default'`
— the old four-topic taxonomy. Nothing in this change reads it. It is also
genuinely dead: the only file that ever imported `~/types/directus` is
`src/utils/directus.ts`, whose entire body is commented out, so no module
imports the types file at all.

Per the runner brief: say so, and file a residual to remove it. Deleting a types
module in a wiring issue is scope the issue did not ask for.

## Test strategy

Local gates, all four from the acceptance:

- `npm run check:contrast` — expected **exit 1** on the single allowlisted
  `white on --color-yellow` row that #251 deliberately kept; `npm run
  check:contrast:ci` (`--allow-known`, what `verify.yml` runs) must be green.
  This change touches no token file, so both verdicts must match `dev` exactly.
- `npm run validate:tokens` — green, with the standing "Layer order may not be
  optimal" warning (residual #266).
- `npm run lint:css` — 422 pre-existing errors on `dev`. Assert the count is
  unchanged; this change adds no CSS.
- `npx nuxt generate && npx tsx scripts/check-routes.ts` — every BRIEF §7 route
  hydrates, says nothing at `error` level, and has exactly one `<h1>`.
- `npm run typecheck` — baseline is 90 diagnostics. Assert no new ones.
  `typecheck:scripts` fails identically on unmodified `dev` (`@types/node`
  missing); ignore.

Browser, against `nuxt dev`, because this is the first item in the wave whose
change is observable:

1. `data-program` present and correct on `/democracy`, `/future-leadership`,
   `/transatlantic-relations-global-challenges` — read off
   `document.documentElement`.
2. `getComputedStyle(document.documentElement).getPropertyValue('--color-program')`
   resolves to three **different** values across those routes, matching #251's
   measured hexes (`#027A8D`, `#CF4457`, `#A3680F`), and to the neutral
   `#003C5C` on `/about` and `/search`.
3. An insight detail page with a real programme carries the attribute; one of
   the 52 mis-tagged rows does not.
4. **Client-side navigation, both directions.** Programme A → programme B must
   change the value, and programme → `/about` must remove the attribute. This is
   the one behaviour that a fresh page load cannot prove, and it is where an
   `htmlAttrs` entry that fails to dispose would show up.
5. No visual regression. Nothing consumes `--color-program` yet (#253 is the
   first consumer), so all three programme pages must screenshot **unchanged**
   from `dev`.
6. No console errors; `documentElement.scrollWidth === clientWidth`.

## Risks

- **`useHead` disposal on route change.** If unhead does not remove the
  `htmlAttrs` entry when the page unmounts, a stale programme colour follows the
  reader onto `/about`. Test 4 exists for exactly this and is the one test that
  can fail in a way the file review cannot catch. unhead 3.2.3 tracks the
  attributes it added and diffs them; the test confirms it rather than trusting
  it.
- **Page-component reuse between two programme routes.** All three pages already
  read `route.params` non-reactively at setup, so a route change that reused the
  component instance would already render the wrong programme's *content* — a
  pre-existing property of these pages, not something this change introduces.
  Test 4's A → B leg measures it either way.
- **The specificity tie.** Verified by source order in the shipped file and by
  test 2, not by inspection alone. If a later token file ever re-declares
  `--hsl-program` at `:root` after this block, the programme scope silently
  loses. Nothing does today.
- **The attribute now spans nav and footer, not just `<main>`.** That is
  production's behaviour and the mechanism #251 describes, but it means #253's
  consumers must be chosen deliberately — a token consumed in `bfNav` would
  recolour site chrome per route. Out of scope here; nothing consumes the tokens
  yet.

## Out of scope

- The programme colour mapping (§"The settled mapping is not in scope").
- Any consumer of `--color-program*` — that is #253.
- The `:root` default and the on-dark tier shipping unmeasured (residual #264).
- `--hsl-yellow`'s allowlisted contrast failure (residual #263).
- Deleting `src/types/directus.ts` / `src/utils/directus.ts` (§5, new residual).
