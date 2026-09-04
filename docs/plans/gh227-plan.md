# gh#227 — a11y-102 `search` landmark and a real `<form>` on `/search`

Row 102 of [`docs/a11y-epic/issues.md`](../a11y-epic/issues.md). Brief:
[`docs/a11y-epic/BRIEF.md`](../a11y-epic/BRIEF.md) (§3 gates, D23/D30/D32, §5, §7).
Epic: <https://app.plane.so/ccm-design/browse/BF-219/>.

## The defect, as measured

On `/search`, before this change:

- `document.querySelectorAll('[role=search],search').length === 0` — there is no search
  landmark, so a screen-reader user cannot jump to the search region by landmark.
- `document.querySelectorAll('form').length === 0` — the query control is a bare
  `<input type="search">` with no form owner, so pressing <kbd>Enter</kbd> in it does
  nothing at all. There is no keyboard affordance that says "this is a search".
- `src/components/bf/SearchShell.vue:252` — the root is `<div class="bf-search-shell | stack">`.

What is already correct and must survive untouched:

- `SearchShell.vue:260-268` renders the control through `bfFormField`, which emits a real
  visible `<label for>`/`id` pair. Measured accessible name on `/search`:
  *"Search insights, projects and people"* (the `label` prop `pages/search.vue:420` passes).
  **No `aria-label`, no placeholder-as-label.**
- The live filtering: `@update:query` → `pages/search.vue:187 onQuery` → `go({ q }, true)`,
  a `navigateTo(..., { replace: true })` after the shell's 250 ms debounce.
- `bfResultCount` (gh#226) and the `[data-bf-search-shell="count"]` hook `pages/search.vue`
  addresses by name.

## Approach

### 1. The root becomes `<search role="search">`

`SearchShell.vue`'s single root changes tag only:

```html
<search class="bf-search-shell | stack" role="search" data-gap="m">
```

`role="search"` **alongside** the element, not instead of it: `<search>` is mapped to the
`search` role by every engine that knows the element, and by none that does not — the
explicit role is the floor for the engines that do not, and it is what makes the assertion
below true on either. One element carries the role, so the page gets exactly **one**
landmark; the top bar's search entry is an ordinary `<a href="/search">` link, not a second
search region, so no duplicate is created.

**Vue 3.5.40 does not know the `<search>` tag.** Measured, not assumed:
`require('@vue/shared').isHTMLTag('search') === false`, and
`@vue/compiler-dom` compiles `<search>` to `resolveComponent("search")` — which still
*renders* `<search>` (the resolver falls back to the tag name) but logs
`Failed to resolve component: search` on every dev render. The fix is the one Vue's own
warning names: `vue.compilerOptions.isCustomElement` in `nuxt.config.ts`, matching `search`
and nothing else. With it, both the DOM and the SSR compiler emit a plain element
(`createElementBlock("search", …)` / `_push('<search…>')`) — byte-identical to what a
native tag would produce. The predicate is scoped to the one tag and carries a comment
saying to delete it when Vue's tag table catches up.

### 2. The control goes inside a real `<form>`

```html
<form class="bf-search-shell__form" @submit.prevent="onSubmit">
  <bfFormField … />           <!-- unchanged, label and all -->
  <button type="submit" class="bf-search-shell__submit | visually-hidden" tabindex="-1">
    Search
  </button>
</form>
```

- **`@submit.prevent`** — the default action is cancelled, so <kbd>Enter</kbd> never causes a
  full page navigation. `onSubmit` clears the pending debounce timer and publishes the draft
  immediately, so the query the reader just typed lands in `route.query` on the same tick
  instead of 250 ms later.
- **No `action` attribute.** `bfSearchShell` is presentational (D8): it does not know the
  route it is mounted on, and `pages/search.vue` owns the URL. Hard-coding `/search` here
  would put a route inside an organism that has none; passing it as a prop would change the
  pinned `SearchShellProps` contract for a no-JS fallback the rest of this prerendered SPA
  does not offer anywhere else. Stated here rather than left as an omission.
- **The submit control is `visually-hidden` (D23/D32).** Pass 1 changes nothing a sighted
  user can see (BRIEF §1). A *visible* search button is a design decision — which variant,
  which size, which side of the field — and therefore a pass-2 row, not this one. The hidden
  button still does the two jobs the acceptance asks of it: it is the form's **default
  button**, which is what gives <kbd>Enter</kbd> a defined result, and it is a named
  `submit` control in the accessibility tree.
- **`tabindex="-1"` on it.** A focusable control that renders nothing is an invisible tab
  stop, which is a WCAG 2.4.7 failure of its own. Removing it from the tab order costs
  nothing here: <kbd>Enter</kbd> in the field submits without it (HTML implicit submission,
  and the button is still the default button), and the control stays in the accessibility
  tree for a virtual-cursor user. Recorded as a residual for pass 2 to promote to a visible
  button if the design phase wants one.
- **`.visually-hidden` is the shared utility** in `src/public/css/utils/utils.css:98`
  (gh#219), consumed exactly as `bf/LoadMore.vue:271` consumes it (D27). No new rule, no new
  token, no new colour.

### 3. Layout risk from the two new block boxes

Both `<search>` and `<form>` default to `display: block`, i.e. the same box the `<div>` drew.

- The root: `.stack` and `.stack > *` are **class**-based rules
  (`public/css/composition/stack.css:2,10,14`), not tag-based, so swapping `div` → `search`
  changes no rule that matches. `<search>` has no UA margin or padding.
- The form: it becomes the stack's *first* child, so `.stack > * + *`'s margin still falls
  between the same visible boxes as before. `.bf-form-field`'s own root rule
  (`FormField.vue:290`) declares no block margin, so nothing that `.stack > * { margin-block: 0 }`
  was previously zeroing is un-zeroed by the extra wrapper.
- The submit button is `position: absolute` and clipped by the utility, so it contributes no
  box at all.

Expected net layout delta: **zero**. Verified in the browser by measuring the field's and the
results list's bounding boxes before and after (STEP 6).

## Files

| File | Change |
|---|---|
| `bfna-website-nuxt/src/components/bf/SearchShell.vue` | root → `<search role="search">`; `<form @submit.prevent>` around the field; visually-hidden `type="submit"` button; `onSubmit` (flush + publish); block-comment §Accessibility updated |
| `bfna-website-nuxt/src/nuxt.config.ts` | `vue.compilerOptions.isCustomElement` for the one tag Vue 3.5 does not know |
| `bfna-website-nuxt/scripts/check-routes.ts` | new `searchLandmarkRows` gate group (brief §5) |
| `docs/plans/gh227-plan.md` | this file |

**Not touched:** `src/pages/insights/index.vue`; `pages/search.vue`'s `@layer overrides`
`display: none` at `:466-471` (that is **#233**); `Hero.vue`, `PageHeader.vue`, `Prose.vue`,
`public/css/base/typography.css`, `public/images/hero/**` (BF-220 is landing on those);
`/wireframes/**` and everything else site-epic DoD-4 byte-guards.

## The CI assertion (brief §5)

A new group in `scripts/check-routes.ts`, modelled on gh#226's `resultCountRows` — its own
CDP target, its own hydration wait, its own non-vacuity row. Driven with **real input
events**, never `el.click()` and never a programmatic `.focus()` (BRIEF §5).

On `/search`:

1. Exactly one `[role="search"], search` element on the page.
2. That element is the shell root: `<search>`, `role="search"`, `.bf-search-shell`.
3. Exactly one `<form>` on the page, and no `<form>` nested inside another.
4. The search input's **form owner** is that form (`input.form === theForm`), which is the
   fact <kbd>Enter</kbd> actually depends on — `form.contains(input)` alone would pass for an
   input that a `form=` attribute had re-owned elsewhere.
5. The input still has a real `<label for>` whose text is *"Search insights, projects and
   people"* and whose computed `display` is not `none` — the visible label survives.
6. The form has exactly one `[type="submit"]` control.
7. **Live filtering still works**: a real mouse click to focus the field, `Input.insertText`,
   no <kbd>Enter</kbd>; within the debounce window plus margin `location.search` carries
   `q=`.
8. **A real <kbd>Enter</kbd> keypress submits, and nothing reloads**: a page-lifetime marker
   set on `window` before the keypress survives it (a full navigation would clear it), the
   form fired exactly **one** `submit` event, that event's default was **prevented**, and the
   URL carries the typed query.
9. Non-vacuity: the probe actually found and focused the input, so rows 7–8 are not passing
   against a page they never touched.

**Negative test before commit**: revert the `<form>` in a scratch build and confirm rows 3, 4,
6 and 8 go red; revert `role="search"` and confirm rows 1 and 2 go red. Recorded in the issue
journal.

## Verification

```bash
cd bfna-website-nuxt
npm ci
npm run typecheck        # signature set unchanged vs .github/typecheck-baseline.txt (90)
npx nuxt generate        # NEVER `npm run generate` — needs Directus secrets
npx tsx scripts/check-routes.ts
npx tsx scripts/check-links.ts
```

Plus the browser pass on `env NUXT_IMAGE_PROVIDER=none npx nuxt dev`: landmark count, form
ownership, visible label, a real <kbd>Enter</kbd> keypress, live filtering on typing, and the
before/after bounding boxes of the field and the results list.
