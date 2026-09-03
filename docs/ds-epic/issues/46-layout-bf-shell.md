# 46 — layout-bf-shell — Site shell layout

One-line objective: build `src/layouts/bf-default.vue`, the single layout every
`/` route mounts, wrapping `bfSkipLink` + `bfNav` + `bfFooter` + a conditional
`bfNotice` announcement band around `<main id="main">`.

## Context

Depends on #35 (`bfNav`), #36 (`bfFooter`), #19 (`bfSkipLink`), #41
(`bfNotice`), #13 (`useBfSite` — announcement + menus). Every template issue
(#47–#56) depends on this one. Descends from `src/layouts/wireframe.vue`
(top-bar → hero slot → `<main class="stack" data-gap="xl">` → default slot →
footer) — same skeleton, `bf-*` components, real routes instead of
`/wireframes/*`. Provenance: BF-194; v2 §2 Level 4 "Site shell layout".

## Scope

- New file `src/layouts/bf-default.vue` only.
- Structure, in DOM order (skip link must be the first focusable element —
  matches `layouts/wireframe.vue`'s `<a href="#wf-main" class="wf-skip-link">`
  placement before `<wf-nav />`):
  1. `<bf-skip-link target="#main" />`
  2. `<bf-nav :menus="menus" />`
  3. conditional announcement band: `<bf-notice v-if="announcement" variant="…">` wrapping `announcement.message` linked to `announcement.url` — sourced from `useBfSite().announcement` (single doc, gated on `status === 'published'` inside the composable per BRIEF §6/D3, not re-checked here)
  4. `<main id="main" class="stack" data-gap="xl"><slot /></main>`
  5. `<bf-footer :menus="menus" />`
- Data: `const { menus, announcement } = useBfSite()` — **this layout is the
  only data reader in the view tree (D8)**. `menus` is
  `src/assets/bf-data/menus.json` (typed, from #08/#13), passed as the
  `menus` prop to both `bfNav` and `bfFooter` — neither component calls a
  composable itself.
- `useHead` for `htmlAttrs.lang`, base `<title>` template, no `noindex`
  (wireframe layout sets `noindex`; production layout must not).
- No hero slot — templates (#47–#56) each own their full section list,
  including any `wf-page-header`/`wf-hero`-equivalent as their first section;
  the shell provides no named slot for it (simpler contract than
  `layouts/wireframe.vue`'s `#hero` slot, since every `bf-*` page composes its
  own header component inline).

## Out of scope

- No edits under `pages/wireframes/**` or `components/wireframe/**` — any
  such edit fails the epic (DoD-4).
- Any page content — pages fill `<slot />`, this issue ships no page.
- The subscribe band — removed per D2, never re-added here.
- Route registration for any `/` page (#47–#56's job).
- `src/layouts/wireframe.vue` is not touched or shared.

## Styling

- Tokens: existing Utopia space scale (`--space-xl` for the `<main>` stack
  gap, matching `layouts/wireframe.vue`). No new colour.
- Composition primitives: `.stack` on `<main>`, `data-gap="xl"`.
- This layout owns no component-level CSS variables (`--_bf-*`) itself — it
  only arranges `bf-*` components, each of which owns its own tokens.
- `@layer` order unaffected — no new layer content here.

## Acceptance / verification

```bash
cd bfna-website-nuxt && npm run typecheck
cd bfna-website-nuxt && npx nuxt generate   # NEVER `npm run generate` (runs contentImporter.js — needs Directus secrets not in this checkout)
```

Issue-specific:
```bash
# A probe page at src/pages/bf-probe/46-layout-bf-shell.vue (using `layout: 'bf-default'`)
# renders nav, footer, and a skip link targeting #main; delete the probe once
# the first real template (#47) exists and covers this route.
grep -n "queryCollection\|useBf" bfna-website-nuxt/src/components/bf/**/*.vue   # must return nothing — no bf-* component reads data (D8)
grep -rn "wireframe" bfna-website-nuxt/src/layouts/bf-default.vue              # must return nothing — confirms no accidental wf-* import
```

## Decisions

**D-46.1 — the layout `await`s `useBfSite()` at the top level, and that is safe.**
`useBfSite` is `async` (it wraps `useAsyncData`), so the shell's setup is async.
`NuxtLayout` renders its child inside a `<Suspense>`
(`nuxt/dist/app/components/nuxt-layout.js`), which is the same boundary that makes an
`await` legal in a page's `setup`. Confirmed by `npx nuxt generate` prerendering 973
routes with the probe route among them, not by reading alone.

**D-46.2 — the import is explicit, not auto.** Nuxt auto-imports `composables/*` and
`composables/*/index.*`; `useBfSite` lives at `composables/data/useBfSite.ts`, one level
deeper. `import { useBfSite } from '~/composables/data/useBfSite'`, exactly as probe 13
does it.

**D-46.3 — the announcement is `variant="info"`, not `note` or `warning`, and it is not
`announced`.** It is site-wide information, and `bfNotice`'s `info` colourway is the one
whose boundary measures ≈9.7:1 (gh#50). `announced` stays `false` because the band is
present at first render and never toggles — a live region that is never updated is noise
in the accessibility tree (`bfNotice`'s own contract).

**D-46.4 — the link wraps the message.** The shipped announcement's `message` *is* the
call to action ("APPLY NOW | …"), so a trailing "read more" would be a second, weaker
accessible name for the same destination. `url` is nullable in `bfAnnouncementSchema`, so
the band degrades to plain text when there is no link.

**D-46.5 — the band sits outside `<main>`.** It is site chrome, not page content: a
template's `.stack` rhythm must not have to know whether an announcement is running this
week. Probe 46 asserts it (`main.contains(band) === false`).

**D-46.6 — `<main tabindex="-1">`.** Half of the skip link, and the half that lives here:
a browser handling a fragment navigation focuses the target only when it is focusable, and
otherwise merely sets the sequential-navigation starting point — leaving `activeElement` on
`<body>`, which reads to a screen-reader user as nothing having happened. `main:focus {
outline: none }` goes with it, so a mouse user who clicks the page body does not grow a ring
around the whole document.

**D-46.7 — no `#hero` slot.** Every `bf-*` template (#47–#56) composes its own header
component as its first section. One fewer named slot is one fewer way for a page to be
half-filled.

---

### Folded residuals

**#103 (P1) — the `@layer` order statement now reaches real routes.** `src/nuxt.config.ts`'s
`css: []` is empty and there is no `src/app.vue`, so a route's **layout is the only
stylesheet injector**. `bf-default` links `/css/styles.css` (whose first line is the order
statement) *and* restates `@layer …;` inline with `tagPriority: 'critical'`, which is the
`bf-probe` precedent: under `nuxt dev` Vite injects each SFC `<style>` independently of the
`<link>`, so a component's own `@layer components { … }` can otherwise be the first `@layer`
the browser sees and silently make `components` the **weakest** layer. Verified in the
generated HTML — the statement is the first `<style>` in `<head>`, ahead of every component
chunk. `layouts/legacy-base.vue` was **not** touched: it injects the three `css-legacy/*`
files for the routes the legacy stack still serves, and those are #58's to retire.

**#107 (P3) — no second token was minted; `--color-surface-page` is the counterpart of
`--color-surface-inverse`.** This is a deliberate deviation from the runner brief, which
asked for `--color-surface: var(--color-white)`. gh#116 had already landed
`--color-surface-page: var(--color-white)` in `tokens/semantic-colors.css` and repointed
probes 03/14/15 off the `--color-white` primitive (checked: the only surviving mention, in
probe 14, is a row asserting that the alias *resolves to* the primitive — which is the point
of that row). That file's own comment reserves the bare `--color-surface` name for a future
*component* surface so the two cannot collide. Minting it now would be two semantic names
for one paint, with nothing to tell a later author which to reach for. What #107 was still
missing is the **consumer**: `bf-default` paints `html` and `body` from
`--color-surface-page` + `--color-text` inside `@layer overrides`, and pins
`color-scheme: light` (the token set has one colourway; without it a dark-mode visitor gets
UA chrome, scrollbars and form controls painted dark around a light page). Both `html` and
`body` are painted, because `html`'s background propagates to the canvas only while `body`
declares none — and `base/typography.css` does declare one.

**#108 (P3) — probe 46 asserts layer ORDER, not membership.** Two rows, because either alone
is weak:
1. the declared sequence read out of `CSSLayerStatementRule.nameList` in the live CSSOM —
   the DOM's own view of `@layer a, b, c;`, which a statement that failed to parse or that
   arrived after a layer was already created would not produce;
2. a **behavioural** corroboration: `.probe__cascade` gets `border-block-start: 3px` in
   `@layer overrides` and `1px` in `@layer components` **declared later in source order**,
   and the row reads `3px`. Without the order statement the browser orders layers by first
   appearance — which in this build is `overrides` (the shell's `html` paint) before
   `components` — so `1px` would win and the row would fail. The two together are what
   "order, not membership" means.

**#164 (P3) — `bfSection` now exposes an accessible name.** `src/components/bf/Section.vue`
gains a `useId()`-derived `headingId` on the `<h2>` and `:aria-labelledby` on the
`<section>`, **only** when `heading` is present. A bare `<section>` is not a landmark:
`region` is one of the roles HTML-AAM gates on an accessible name, so a band that rendered a
visible heading and wired nothing to it was a generic container that never appeared in the
landmark list. Three deliberate choices: `undefined` rather than `''` when there is no
heading (an idref naming nothing is worse than no name); `label` does **not** become the name
(it renders as `data-label`, not as text, and naming a landmark from something no sighted
user can see is a WCAG 2.5.3 trap); and `v-bind="rootAttrs"` stays last, so a call site's own
`aria-labelledby` still wins. One row added to probe 39 asserting both the positive and the
negative.

---

### Acceptance substitutions and refinements

**The D8 grep is run code-only.** The spec's
`grep -n "queryCollection\|useBf" src/components/bf/**/*.vue` matches **15 pre-existing
JSDoc lines** on `dev` in which a component *documents* that it does no such thing
("Presentational-only (BRIEF D8): … no `queryCollection`, no store"). Those comments are the
rule being honoured, not broken, and deleting them to satisfy a grep would remove the record
of the decision. The check actually run, and the one later issues should use, drops comment
lines:

```bash
grep -rn "queryCollection\|useBf" src/components/bf | grep -vE ':[0-9]+: *(\*|//)'   # empty
```

**`grep -rn "wireframe" src/layouts/bf-default.vue` is empty** — the spec's literal check.
The frozen review layer is referred to obliquely throughout the file ("the frozen `wf-*`
shell") so that the grep stays a meaningful test of "no accidental `wf-*` import" rather
than something a prose mention silently breaks.

**Typecheck gate (residual #71 / orchestrator decision after #10):** baseline on `dev` was
**178** `error TS`; after this issue it is **178**, with **0** in
`src/(components/bf|types|composables/bf)` or `content.config`. `Check.expected/actual` in
probe 46 is typed `string | number | boolean` rather than the `string | number` the older
probes use, because several rows here assert a predicate and the comparison is
`String(a) === String(b)` anyway.

**Vitest (residual #86):** no vitest test was added — the harness on `dev` is broken and
pre-existing. The substitution is probe 46's 27 runtime rows plus the one added to probe 39,
all run by `npx tsx scripts/check-probes.ts`, which exits 0 only when every probe reports
PASS with zero failing rows.
