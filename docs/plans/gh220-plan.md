# gh#220 — a11y-95 list-role-sweep

Row 95 of `docs/a11y-epic/issues.md`. Type: `fix`. Epic: BF-219.
DoD gate: **DoD-A4 — "Lists are lists"** (`docs/a11y-epic/BRIEF.md` §2).

## The defect

`bfna-website-nuxt/src/public/css/base/reset.css:95-103` strips the list affordances from
every classed list:

```css
ul[role="list"], ol[role="list"], ul[class], ol[class] {
  list-style: none;
  margin: 0;
  padding-inline-start: 0;
}
```

WebKit treats an author `list-style: none` as a statement that the element is no longer
meant as a list, and drops the implicit `list` role: VoiceOver stops announcing
"list, N items" and stops offering list navigation. Restating `role="list"` puts the
semantics back without putting the bullets back.

This is **not a new diagnosis** — it is already written twice in this repo, and D27 says to
copy the repo's own idiom rather than invent a variant:

- `src/components/bf/Breadcrumb.vue:238-240` — the CSS-side note.
- `src/components/bf/nav/Dropdown.vue:109-117` — the template-side note, from review
  finding gh#44 P2-1.

`src/pages/archive.vue:227` and `src/pages/projects/[slug].vue:349` apply the same
attribute. Six sites were missed.

## The six

| File | Element |
|---|---|
| `src/components/bf/GridInsights.vue:112` | `<ul class="grid">` — insight cards |
| `src/components/bf/GridProjects.vue:80` | `<ul class="grid">` — project cards |
| `src/components/bf/Footer.vue:151` | `<ul class="bf-footer__menus \| grid">` — menu columns |
| `src/components/bf/Footer.vue:183` | `<ul class="bf-footer__items">` — links inside a column |
| `src/components/bf/Footer.vue:198` | `<ul class="bf-footer__social \| cluster">` — also carries `aria-label="Social media"`, which an ARIA `list` role exposes and a genericised element does not |
| `src/components/bf/SearchShell.vue:312` | `<ol class="bf-search-shell__results \| stack">` — additionally sets its own `list-style: none` at `:441` |

**Explicitly not `Card.vue:260`.** An earlier draft of this row named seven files. `Card.vue`
is an `<li>` setting `list-style: none` on itself; an `<li>` is a `listitem`, not a `list`,
and `role="list"` there would be wrong.

## Approach

One attribute per element, plus one short comment per component pointing at the shared cause
(`reset.css`) — the `Dropdown.vue:109` idiom, not a restatement of the whole essay in six
places. Template-only: no CSS property is added, changed or removed, so D23 / D32 / DoD-A10
are satisfied by construction (`git diff` contains no colour, font, size, weight,
letter-spacing, line-height, radius or shadow).

## The new gate (brief §5 — "gates only grow")

`scripts/check-routes.ts` gains a **DoD-A4** assertion. Two halves, because the acceptance
sentence has two halves:

1. **Computed, per route.** `READ_PAGE` already runs in a real Chrome over the hydrated DOM.
   It gains a `lists` inventory: every `ul`/`ol` whose `getComputedStyle(el).listStyleType`
   is `none` and whose `role` attribute is unset. That is literally the acceptance
   condition — *computed*, not grepped, so a future stylesheet that strips a marker some
   other way is caught too.
2. **Whole-build, static.** The per-route set is 9-ish representative routes; the acceptance
   is phrased over `.output/public`. So a second gate scans every prerendered `*.html`
   for opening `<ul>`/`<ol>` tags that carry a `class` and no `role` — the exact selector
   `reset.css` matches — over the whole output, the way `langRows()` does for DoD-A9.

Half 2 is the cheap wide net, half 1 is the accurate one. Neither can pass vacuously: each
reports the number of lists it actually inspected, and a zero count is itself a failure row.

## Verification

- `npx nuxt generate` then `npx tsx scripts/check-routes.ts` — DoD-A4 rows green.
- **Negative test:** remove one of the six `role="list"` attributes, regenerate, confirm the
  gate goes red and names the route/file. Restore.
- Browser: on `/insights`, `/projects`, `/search?q=democracy` and a footer-bearing route,
  read back each list's computed `listStyleType`, its `role`, and its child count.

## What cannot be verified here — stated, not guessed

**The WebKit/VoiceOver behaviour this fixes is not verifiable in this environment.** There is
no Safari and no screen reader on this runner (brief §0.2). What is asserted is the
*structural* condition — every marker-less list carries `role="list"` — plus the repo's own
two written diagnoses of the underlying cause. The actual announcement is covered by the
manual screen-reader pass in brief §8, which is a Plane task, not this issue.

## Risks

- **The static half over-reaching.** `.output/public` also contains `/wireframes/**` (frozen
  by BF-217 D2, byte-guarded by site-epic DoD-4) and `/docs/**`. If either carries a classed
  list with no role, the whole-build gate fails on markup this issue is forbidden to touch.
  Measured against a real build before the gate is written; if they do, those trees are
  excluded by path with the exclusion stated in the gate's own comment.
- **`/search` prerenders with no results**, so `SearchShell.vue:312`'s `<ol>` is behind
  `v-if="results.length"` and does not appear in the static output. Its role is verified in
  the browser against `/search?q=…` instead, and that limit is recorded here rather than
  papered over.

## Not touched

`/wireframes/**`, `src/layouts/wireframe.vue`, `src/components/wireframe/**`,
`public/css/wireframe.css`, `src/assets/wireframe-data` (brief §7). No `components/ds/**`.
No typecheck-baseline paydown (site-epic #83 owns it).
