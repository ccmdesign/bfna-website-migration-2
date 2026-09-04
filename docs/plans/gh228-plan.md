# gh#228 — a11y-103 composite-widget roles

Row 103 of [`docs/a11y-epic/issues.md`](../a11y-epic/issues.md). Brief:
[`docs/a11y-epic/BRIEF.md`](../a11y-epic/BRIEF.md) (§3 gates, §4 D23/D30/D32, §5, §7).
Epic: <https://app.plane.so/ccm-design/browse/BF-219/>.

Two independent fixes, both structural (D23/D32: no colour, font, size, weight,
letter-spacing, line-height, radius or shadow changes anywhere in this diff).

---

## Fix 1 — `bfFilterBar`: the roving tabindex goes, `role="group"` stays

### The defect, as measured on `/insights`

- Two `div[role="group"]` containers (`FilterBar.vue:241-242`), seven `bfChip` toggle
  buttons between them (4 formats, 3 programs).
- `tabindex` per group is `0 / -1 / -1 / -1` — `FilterBar.vue:259`,
  `:tabindex="index === activeIndex ? 0 : -1"`.
- Arrow/Home/End handling at `FilterBar.vue:181-219`.
- `aria-pressed` on every chip (`Chip.vue:321`).

ARIA APG scopes roving tabindex to **composite widgets** — `toolbar`, `radiogroup`,
`listbox`, `grid`, `menubar`, `tablist`, `tree`. `group` is not one of them. So today six
of seven chips are out of the tab order with no role telling assistive technology that a
different navigation contract is in force, and the arrow keys that replace Tab are
undiscoverable.

### The decision: **drop the roving tabindex** (option 2 of the two named in D30)

Not `role="toolbar"`. Four reasons, in order of weight:

1. **The repo already recorded the opposite decision about `toolbar`, with a reason.**
   `FilterBar.vue`'s own header says: *"Not `role="radiogroup"`, and not `role="toolbar"`:
   this is multi-select … and a toolbar implies a collection of different controls.
   `role="group"` + `aria-pressed` per chip is what a set of independent toggle buttons
   actually is."* Adopting `toolbar` now would overturn a written decision to keep a
   mechanism, when the cheaper move is to drop the mechanism and let the already-correct
   role stand. D27 (reuse the repo's own idiom) points the same way.
2. **The issue's acceptance is only satisfiable this way.** #228 requires *"arrow keys and
   Tab **both** reach every chip under it"*. Under a roving tabindex Tab reaches one chip
   per group, never all seven. Under a plain tab order both mechanisms reach all seven.
3. **D30 is "native first".** A native `<button>` in the document tab order needs no ARIA
   at all. `role="toolbar"` would be a new ARIA composite contract this epic then owns
   forever — including `aria-orientation`, wrap semantics and the APG requirement that
   every toolbar be labelled.
4. **The cost is five extra tab stops on two routes.** `/insights` goes from 2 stops to 7,
   `/search` likewise. The roving pattern was introduced to spare a keyboard user those
   stops; it did so by making six of seven chips unreachable by the only key that
   discovers a control. That is a bad trade for a facet row that *is* the primary
   interaction of the page it sits on.

### What changes

`src/components/bf/FilterBar.vue` only:

- Delete the `:tabindex="index === activeIndex ? 0 : -1"` binding on `bfChip`. Every chip
  reverts to a native `<button>`'s implicit `tabIndex === 0`.
- Delete `activeIndex` (its only consumer was that binding) and the `isSelected`-derived
  fallback branch it carried. `focusedIndex` stays — the arrow handler still needs to know
  where it is, and the `@focus` listener still writes it.
- Rewrite the two header sections that document the roving pattern, and the template
  comment at `:253-257`, to state the pattern that now ships and why.

### What deliberately does **not** change

- **The arrow / Home / End handler stays exactly as it is** (`FilterBar.vue:181-219`).
  It is now an *enhancement over* the tab order rather than a *replacement for* it, which
  is what makes "arrow keys and Tab both reach every chip" true. Scope discipline: #228
  asks about the role and the tab order, not the key set.
  One consequence is noted rather than fixed here: with the chips back in the normal tab
  order, `preventDefault()` on `ArrowUp`/`ArrowDown` (page scroll) and `Home`/`End`
  (document start/end) now takes keys from a user who is merely passing through, where
  before the composite owned them. Filed as a residual rather than changed silently.
- **`role="group"` and `:aria-label="label"`** on the container — with the roving tabindex
  gone the role is exactly right, and the name is what makes two facet rows on one page
  distinguishable.
- **`aria-labelledby` from the call site.** `insights/index.vue:303,305,314,316` wires
  each bar's accessible name to a visible caption (`Format:` / `Program:`), which wins over
  the component's `aria-label` by the ARIA name-computation order. This is the good
  pattern and the CI gate below asserts it survives.
- **`/search`** passes no caption and falls back to the generic `"Filters"` label. Left
  alone — pass-2 / #233-adjacent, per the row's scope note.
- **`aria-pressed`** — untouched; `Chip.vue` owns it and binds it after `$attrs`.

---

## Fix 2 — `bfAccordion`: `:open` becomes a two-way binding

### The defect

`Accordion.vue:75` binds `:open="open"` and the component declares no emit. The user's
native toggle therefore never reaches the parent: the parent's model and the DOM disagree
from the first click onward, and any parent render that *re-creates* the subtree (a keyed
list whose keys move, a `v-if`, a consumer that does not memoise) writes the initial state
back over the user's choice. WCAG 3.2.2 (On Input) — a change of state the user did not
ask for.

`src/pages/archive.vue:197-201` is the live consumer: eleven year groups, the newest one
open by default via `:open="year === years[0]"`, and nothing anywhere that can restore a
reader's choice.

### The approach — native stays native (D30)

No custom widget, no `aria-expanded`, no `v-show`, no key handlers. `<details>/<summary>`
keeps every guarantee it already gives (Enter/Space activation, closed content out of the
tab order). All that is added is the missing return channel:

`src/components/bf/Accordion.vue`

```ts
const emit = defineEmits<{ 'update:open': [value: boolean] }>()
const onToggle = (event: Event): void => {
  const el = event.currentTarget as HTMLDetailsElement | null
  if (el !== null) emit('update:open', el.open)
}
```

```html
<details class="bf-accordion" :open="open" @toggle="onToggle">
```

`update:open` + the existing `open` prop is `v-model:open` by convention, so a consumer
gets the two-way form for free without this component growing a second prop.

**No update loop.** The browser fires `toggle` only when the `open` *property* actually
changes. The emit carries the value the element already has, so the parent settles on the
same value; the re-render then writes `el.open = <same>`, which does not change the
property and therefore fires no second `toggle`.

`src/types/bf-contracts.ts` — `AccordionProps.open`'s doc comment currently asserts *"Not a
two-way binding and not tracked afterwards"*. Rewritten to describe what ships. The
interface shape does not change (`open?: boolean`), so no call site is forced to update and
the typecheck signature set does not move.

### The consumer

`src/pages/archive.vue` gains a per-year open map whose fallback is today's default:

```ts
const openYears = ref<Record<string, boolean>>({})
const isYearOpen = (year: ArchiveYear): boolean =>
  openYears.value[year.year] ?? (year === years.value[0])
const setYearOpen = (year: ArchiveYear, open: boolean): void => {
  openYears.value = { ...openYears.value, [year.year]: open }
}
```

```html
<bfAccordion
  v-for="year in years"
  :key="year.year"
  :label="`${year.year} (${year.items.length})`"
  :open="isYearOpen(year)"
  @update:open="(open: boolean) => setYearOpen(year, open)"
>
```

Keyed by `year.year` (a string, and already the `v-for` key) rather than by object
identity, so the record survives a `years` recomputation that produces fresh objects. The
`??` fallback means a year the reader has never touched still follows the frozen source's
`:open="y === years[0]"` rule, and the moment they touch one their choice outranks it.

---

## Verification

### New gate group in `scripts/check-routes.ts` (brief §5)

Added alongside the gates from gh#217/#220/#221/#222/#224/#225/#226/#227 — none of theirs
is touched. One new group, `filter-bar + accordion (gh#228)`, driven by **real key
events** (`Input.dispatchKeyEvent`), never `.focus()` or `.click()` (brief §5).

On `/insights`:

1. **Every chip is in the tab order** — `tabIndex >= 0` on all seven `[data-filter-key]`
   elements. *Red on `dev`: six are `-1`.*
2. **Role matches the tabindex pattern** — if any chip carries `tabIndex < 0` the
   container's role must be a composite role (`toolbar`/`radiogroup`/`listbox`/`grid`/
   `menubar`/`tablist`/`tree`); otherwise `group` is correct. *Red on `dev`: `group` +
   `-1`s.* This is the assertion that stays true whichever of D30's two options a future
   change picks — it forbids only the incoherent middle.
3. **A real Tab walk reaches every chip** — a `focusin` recorder is installed, ~90 real
   `Tab` presses are dispatched from a fresh load, and the recorded order must contain all
   seven `data-filter-key` values. *Red on `dev`: two.*
4. **Labelling survives** — both containers resolve an accessible name through
   `aria-labelledby` to non-empty visible text, and the two names differ.
5. **`aria-pressed` survives** — present on all seven chips.
6. **Arrow keys still move focus** — a real `ArrowRight` from a chip focused by a real
   mouse press lands on the next chip.

On `/archive`:

7. **A real `Enter` on a `<summary>` opens its group** — Tab to the second summary, press
   Enter, `details.open === true`.
8. **The parent's model agrees with the DOM** — the value the parent passes for that
   accordion (`el.__vueParentComponent.vnode.props.open`, the same Vue-internals channel
   `READ_PAGE` already uses for `__vue_app__`) equals `details.open`. This is the two-way
   invariant stated as something observable: if the parent's model matches, no re-render or
   remount can write a different state back. *Red on `dev`: parent says `false`, DOM says
   `true`.*
9. **A parent re-render leaves it open** — a real `Enter` on a *third* summary (which,
   after the fix, is a genuine parent state change and so a genuine re-render of the whole
   `v-for`) must leave the second group open and the first group's state undisturbed.

### Repo gates

```bash
cd bfna-website-nuxt
npm ci
npm run typecheck            # signature set in .github/typecheck-baseline.txt, baseline 90 — must not move
npx nuxt generate            # NEVER `npm run generate`
npx tsx scripts/check-routes.ts
npx tsx scripts/check-links.ts
```

### Browser pass (STEP 6)

Real keys in a real browser on `env NUXT_IMAGE_PROVIDER=none npx nuxt dev`:
Tab order through the `/insights` facet region, arrow-key movement, `aria-pressed`
toggling and results actually updating, captions still naming each group; and on
`/archive`, Enter on a summary followed by a parent re-render.

---

## Risks

| Risk | Mitigation |
|---|---|
| Removing the roving tabindex adds five tab stops to `/insights` and `/search` | Accepted and argued above; it is the option D30 names and the only one that satisfies #228's acceptance verbatim |
| `focusedIndex` becomes stale once `activeIndex` is gone | It is only ever read by `focusChip`, which writes it, and by the `@focus` listener, which writes it. Nothing renders from it, so a stale value cannot reach the DOM |
| An update loop from the two-way `open` | `toggle` fires only on a real property change and the emit carries the current value — see above. The CI gate's step 9 exercises three consecutive toggles |
| `@toggle` does not bubble in some engines | It does not need to: the listener is on the `<details>` itself, not an ancestor |
| Touching a file BF-220 (gh#249-254) is landing | None of `Hero.vue`, `PageHeader.vue`, `Prose.vue`, `public/css/base/typography.css` or `public/images/hero/**` is in this diff |
| The typecheck signature set moves | `AccordionProps` keeps its shape; `defineEmits` on a component with none is additive. Checked before commit |
