# 19 — bf-skip-link

Componentise the visually-hidden-until-focus skip link as `bfSkipLink`, and
formalise `[data-external]` as a documented, shared marker.

## Context

Depends on 02. Blocks 46 (site-shell layout wires `bfSkipLink` first in
DOM). This is one of the four permitted bundled issues (BRIEF §5.5 —
`bfSkipLink` + the `[data-external]` marker are internal to one concern and
demoed together). Builds from `.wf-skip-link`
(`bfna-website-nuxt/public/css/wireframe.css` lines 148-159) and
`[data-external]` (same file, lines 140-146,
`.wireframe a[data-external]::after { content: " ↗"; }`), already used by
`bfButton` (15) and `bfChip` (16) via their own `external` props. Provenance:
BF-161, BF-162; v2 §2 Level 1 rows 6-7.

## Scope

- New `bfna-website-nuxt/src/components/bf/SkipLink.vue` (`<bfSkipLink>`).
  Props: `target?: string = '#main'`. Slot: `default` (label text, e.g.
  "Skip to content" — same copy as `layouts/wireframe.vue:6`). Renders
  `<a :href="target" class="…">` visually hidden until `:focus`, matching
  `.wf-skip-link`'s behaviour (`left: -999px` unfocused, `left: 0` +
  visible background/padding on `:focus`) but via `--_bf-skip-link-*`
  tokens instead of the wireframe's raw `#222`/`#fff` literals.
- Formalise `[data-external]` as a documented style hook: add a small
  `isExternal(href: string): boolean` helper next to `utils/format.ts`
  (issue 10) — e.g. `bfna-website-nuxt/src/utils/link.ts` — that
  `bfButton`/`bfChip`/`bfCard*` can share instead of each re-implementing
  an ad-hoc "is this URL external" check. Base rule: an absolute URL
  (`^https?://` or protocol-relative) whose host differs from the site's
  own is external; a relative path or `#anchor` is not.
- Add the `::after { content: " ↗" }` marker rule for `[data-external]` in
  the `bf-*` component layer (`@layer components`), token-driven sizing
  instead of the wireframe's `font-size: 0.8em` literal (fine to keep
  `0.8em` if no token exists for "slightly smaller than surrounding text"
  — record that call in Decisions if so).
- Demo page shows `bfSkipLink` as the first focusable element AND at least
  one external anchor carrying the marker, together (BRIEF §5.5 bundling
  rule).

## Out of scope

- An external-link **component** — `[data-external]` stays an attribute
  marker per the inventory finding, not a wrapped component.
- Wiring `bfSkipLink` into the actual site-shell layout — that's issue 46
  ("skip link first in DOM" is 46's acceptance criterion, not this one's).
- Any new colour — the focus-visible background/text-colour pair reuses
  whatever semantic tokens `bfButton`'s primary variant already
  established (issue 15), not a new literal duplicating `#222`/`#fff`.
- Any edit under `pages/wireframes/` or `components/wireframe/`.

## Styling

CSS-variable hooks: `--_bf-skip-link-bg`, `--_bf-skip-link-color` (reuse
the same semantic tokens as `bfButton`'s primary variant — do not
duplicate the literal). `@layer components`. No new colour.

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
test -f src/components/bf/SkipLink.vue   # today: fails
test -f src/utils/link.ts                # today: fails
grep -c "isExternal" src/utils/link.ts   # after: >=1
grep -c "data-external" src/components/bf/SkipLink.vue   # after: >=1 (documents the marker in the same demo)
```
Plus: the skip link is the first focusable element on a probe page,
becomes visible on `:focus`, moves focus to the target on activation, and
an external anchor on the same probe page carries the `↗` marker (per the
issues.md `verify` column — manual/keyboard check).

## Decisions

_Appended by the gh#28 item-runner._

### D19-1 — the main landmark id is `main`, and it carries `tabindex="-1"`

`bfSkipLink`'s `target` defaults to `'#main'`, as the spec asks. Recorded here
because **issue 46 / #55 must use the same id**: a skip link whose href and
whose landmark disagree is worse than no skip link, and the two live in
different issues. The shell layout's element is therefore:

```html
<main id="main" tabindex="-1"> … </main>
```

The `tabindex="-1"` is not decoration. A browser handling a fragment navigation
moves focus to the target **only when the target is focusable**; otherwise it
sets the sequential-navigation starting point and leaves `document.activeElement`
on `<body>`, which reads to a screen-reader user as nothing having happened.
`bfSkipLink` is presentational and cannot reach across the page to add it, so it
belongs to the layout. Probe 19 asserts both halves — that the attribute is
there, and that a real Enter actually lands focus on the landmark — and also that
`tabindex="-1"` does **not** put the landmark into the tab order.

### D19-2 — the marker's `font-size` stays `0.8em`

The spec anticipated this and asked for the call to be recorded. The type scale
is Utopia's fluid steps (`--size--1` … `--size-6`), each a step of the *page's*
scale rather than a ratio of the surrounding text — so `--size--1` on a marker
inside a large heading would render it at body size, sometimes larger than the
text it annotates. There is no token meaning "slightly smaller than whatever
this sits in"; `em` is that expression. Kept as the wireframe wrote it, exposed
as `--_bf-external-marker-font-size` so a consumer can change it without editing
the rule.

### D19-3 — the marker is a shared stylesheet, not a scoped block

`src/public/css/components/external-link.css`, imported from `styles.css`'s
Components Layer. The attribute crosses components — `bfButton` and `bfChip`
emit it today, every `bfCard*` will, and templates write plain
`<a data-external>` by hand — and a scoped rule inside one component cannot
reach the others. Three copies of one rule would drift the first time one was
edited. `bfButton` and `bfChip` were **not** modified: they already emitted
`:data-external="external || undefined"`, and probe 19 confirms the marker lands
on their output unchanged.

Scoped to `a[data-external]`, matching the wireframe's own selector. The
attribute on a `<button>` is meaningless (a button navigates nowhere) and is
asserted to render nothing.

### D19-4 — `isExternal()` decides by host, offline, and returns `false` for non-http(s)

`src/utils/link.ts`, a plain TS module beside `format.ts` — no Vue, no Nuxt, and
deliberately no `window.location`: consulting it would make the answer differ
between the prerender and the hydrated page for the site's own absolute URLs,
which is a hydration mismatch rather than a feature. `SITE_HOSTS` is therefore a
constant, `['bfna.org', 'www.bfna.org']`.

Derived from the snapshots rather than declared: of the four `bfna`-shaped hosts
in `src/assets/wireframe-data/*.json`, only `www.bfna.org` (23 links) is this
site. `bfna.simplyas.com` (296 — the legacy CMS asset origin), `bfnadocs.org`
(7) and `greenideasbfna.org` (1) are separate properties, so they read as
external, which is what a reader following one experiences.

`mailto:` and `tel:` return `false`, following the spec's base rule to the
letter: they hand off to another *application*, not another website, and the
`↗` marker would misdescribe them. No wireframe link marks one external either.
A caller who wants the arrow there can still set `data-external` by hand.

### D19-5 — `:focus`, not `:focus-visible`

The one place in this system where that is the right choice. `:focus-visible` is
a heuristic and is false after a programmatic focus with no preceding keyboard
interaction; a skip link that stayed invisible in that case would be an element
holding focus that the user cannot see (WCAG 2.4.7). Every focus reveals it.

### D19-6 — `z-index: 100`, with no token to reach for

There is no z-index/elevation token in `tokens/semantic-misc.css` — only radii,
shadows, outlines, border widths and typography. Rather than invent a token
family in an atom's issue, the value is exposed as `--_bf-skip-link-z-index` and
defaults to `100` (the wireframe used a bare `20`). It is applied in **both**
states, not only on focus, so stacking is settled before the link appears. If a
later issue introduces an elevation scale, this hook is the single place to
point at it.

### D19-7 — acceptance substitutes the probe harness for vitest (residual #86)

The spec's acceptance names `npm run typecheck` and `npx nuxt generate`. Per the
orchestrator's standing decisions:

- **typecheck** is run as `npx nuxt typecheck` against the *no new errors* gate —
  `dev` carries 178 pre-existing `error TS`. Measured before: **178**. After:
  **178**, with **0** in `src/components/bf`, `src/types`, `src/composables/bf`
  or `content.config`.
- the runtime half of the acceptance ("the skip link is the first focusable
  element … becomes visible on focus … moves focus to the target … an external
  anchor carries the `↗` marker") is asserted by
  `src/pages/bf-probe/19-bf-skip-link.vue` under
  `npx tsx scripts/check-probes.ts --only 19` (57/57 rows) and the full
  `npx tsx scripts/check-probes.ts` (11 probes, 401 rows). The vitest harness on
  `dev` is broken and pre-existing, and was not touched.

### D19-8 — the probe presses **real** keys; the harness gained an opt-in hook

Every earlier probe answers its focus questions with `el.focus()`. That is the
right tool for "can this element take focus" and the wrong tool for the two
questions this issue raises: whether the skip link is what the *browser's*
sequential focus navigation reaches first, and whether a keyboard activation
moves focus to the target. Computing the tab order in JavaScript and calling it
verified would be marking one's own homework.

So `scripts/check-probes.ts` gained one additive hook: a probe whose root
carries `data-probe-keys="Tab,Enter"` gets those dispatched as **trusted** CDP
`Input.dispatchKeyEvent` events (with `Emulation.setFocusEmulationEnabled`, since
an unfocused headless document runs no focus navigation at all). The attribute is
bound reactively, so it appears only after hydration — which makes it the
handshake as well as the request. No other probe declares it and none was
affected; the full-suite run proves that. Documented in
`docs/decisions/probe-harness.md`.

### D19-9 — two collateral fixes, both pre-existing fragility this issue exposed

1. **Probe routes are now seeded for prerender** (`src/nuxt.config.ts`). Probes
   are linked from nowhere, so they reach the prerenderer only through Nuxt's
   `prerender.server` plugin, which hands the static route list to Nitro **ten
   at a time**, one batch per successfully rendered page — and a batch spliced
   during a render that ends in a 500 goes with that response. This app has three
   pre-existing prerender 500s (`/`, `/podcasts`, `/podcasts/`). Adding page 19
   shifted the batching and its HTML never reached `.output/public`, while probes
   03–18 did; the harness reported it as "does not follow the harness
   convention", which was not true. The routes are now enumerated from
   `src/pages/bf-probe/` at config load — the same rule `check-probes.ts` uses —
   so a probe added by a later issue needs no edit there.
2. **Probe 16's style-chunk row was over-pinned.** It expected exactly
   `16-bf-chip, bf-probe`, which held only while each atom's CSS happened to be
   inlined into the single page that used it. Probe 19 renders `bfChip`, so Vite
   split `Chip.css` into a shared chunk and the row failed on an entirely correct
   build — the #115 complaint (a check that breaks on a correct component is not
   a check) in a new place. It now reports every chunk *outside* an allow-list of
   the page, the layout and the `bf-*` atoms, so a `ccm*`, `ds/` or `legacy/`
   stylesheet arriving through `/_nuxt/` still fails it by name. Intent
   unchanged; brittleness removed.
