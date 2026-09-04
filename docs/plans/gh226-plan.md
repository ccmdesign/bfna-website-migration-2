# gh#226 — extract the always-mounted count line into `bfResultCount`

Row 101 of [`docs/a11y-epic/issues.md`](../a11y-epic/issues.md). Type: atom.
Brief: [`docs/a11y-epic/BRIEF.md`](../a11y-epic/BRIEF.md) — §3 gates, D23/D27/D29/D32, §5, §7.

## 1. What exists, and why it is already right

`src/components/bf/SearchShell.vue:294-301` renders the count line:

```vue
<p class="bf-search-shell__count" data-bf-search-shell="count" role="status">
  <strong>{{ resultCount }}</strong> {{ countLabel }}<template v-if="query"> for “{{ query }}”</template>, ranked by relevance
</p>
```

Three properties, all load-bearing and all documented in that file's own block
comment (`SearchShell.vue:106-113`) and at the markup (`:288-293`):

1. It is **never `v-if`-ed**. A live region that enters the DOM already holding
   its message is not reliably announced, so the element persists in every
   state — including zero results — and only its text changes.
2. `role="status"` **alone**, not `role="status" aria-live="polite"`. The role
   carries the implicit `aria-live="polite"` / `aria-atomic="true"`; writing
   both invites them to drift.
3. The *query clause* is dropped when there is no query, not the whole line.
   `0 results for “”` is a sentence nobody wrote.

This row **extracts** that, verbatim (D27 — reuse the repo's own idiom). It
does not redesign it.

`.bf-search-shell__count` has **no CSS rule anywhere in `SearchShell.vue`'s
`<style scoped>`** — the block styles `__results`, `__meter`, `__rank` and
`__bar` and nothing else. So the extraction carries no declaration across, and
D23/D32 is satisfied by construction: there is no colour, size, weight,
spacing, radius or shadow to move.

## 2. The atom's API

New file `src/components/bf/ResultCount.vue` → auto-imports as `<bfResultCount>`
(`nuxt.config.ts:269-273`, `prefix: 'bf'`, `pathPrefix: false`).
New interface `ResultCountProps` in `src/types/bf-contracts.ts` (BRIEF §5 —
shared types live there).

| prop | type | default | meaning |
|---|---|---|---|
| `count` | `number \| null` | `null` | How many results. **`null` renders an empty region** — the acceptance criterion. |
| `noun` | `string` | `'result'` | Singular noun. `bfResultCount` pluralises with a trailing `s`. |
| `nounPlural` | `string` | `undefined` | Explicit plural, for a noun `+ 's'` gets wrong. |
| `query` | `string` | `''` | When non-empty, appends ` for “<query>”`. Dropped when empty. |
| `suffix` | `string` | `''` | The trailing clause. `bfSearchShell` passes `', ranked by relevance'`. |

Root is a `<p class="bf-result-count" role="status">`; `$attrs` falls through to
it (`inheritAttrs` at its default, single root), so a consumer's `class` and
`data-*` merge rather than replace — the `bfSearchShell` root idiom.

**`count: null` renders a `<p role="status">` with no text nodes.** Not
`v-if`-ed, not `display: none`, not `visibility: hidden`, not `hidden` — every
one of those removes the region from the accessibility tree, which is the exact
defect D29 exists to forbid and #233 exists to fix on `/search`.

The component writes **no `<style>` block at all.** Nothing to style: the
extracted markup had no rule, and inventing one here would be a D23 violation.

## 3. `bfSearchShell` becomes the first consumer

`SearchShell.vue:294-301` is replaced by:

```vue
<bfResultCount
  class="bf-search-shell__count"
  data-bf-search-shell="count"
  :count="resultCount"
  :query="query"
  suffix=", ranked by relevance"
/>
```

`countLabel` (`SearchShell.vue:227`) is deleted — the atom owns the
pluralisation now.

**Behaviourally unchanged** means all four of these hold after the change:

| invariant | why it matters | how it is proved |
|---|---|---|
| The class `bf-search-shell__count` is still on the element | nothing styles it today, but it is the published hook | rendered DOM on `/search?q=…` |
| `data-bf-search-shell="count"` is still on the element | `search.vue:467-470` addresses it; losing it would silently un-hide the idle region and *look* like #233 was done | rendered DOM, idle and queried |
| `role="status"`, no `aria-live`, no `aria-atomic` | property 2 above | rendered DOM |
| The text is character-identical | `N result(s)[ for “q”], ranked by relevance` | asserted against a regex in `check-routes.ts`, and diffed by eye against `dev` in the browser |

## 4. The CI gate (BRIEF §5 — every issue adds an assertion)

New group `result-count region (gh#226)` in `scripts/check-routes.ts`, run once
against the built site in its own CDP target, the shape `gh#224`/`gh#225` use.

Rows, all of which **pass on this branch**:

1. `/search?q=democracy` — the region is mounted, is the *only*
   `[data-bf-search-shell="count"]` on the page, and carries `role="status"`.
2. …and its computed `display` is **not** `none`, and it is not
   `visibility: hidden` and carries no `hidden` attribute. *(This is D29's
   condition, asserted in the state this row owns.)*
3. …and it carries **no** `aria-live` and **no** `aria-atomic` attribute — the
   role-alone rule, which an extraction is exactly the moment someone "helpfully"
   breaks.
4. …and its text matches `/^\d+ results? for “…”, ranked by relevance$/` with a
   non-zero count — the extraction preserved the sentence.
5. `/search` idle — the region is **still mounted in the DOM** and still carries
   `role="status"`. This is what the extraction must not regress. Its computed
   `display` is *reported, not failed*: it is `none` today because
   `search.vue:466-471` says so, and removing that override is **#233's**, not
   this row's. The row prints the value so #233 has the before-measurement.

Row 5 is the honest version of the acceptance criterion's `/search` idle
sentence. Writing it as a failure here would be a gate that cannot pass, which
§5 forbids.

**Negative test:** before committing the gate, each of rows 1-4 is confirmed to
*fail* when the corresponding property is broken by hand in a scratch build
(drop the `data-` hook; add `aria-live`; change the suffix), and row 5 is
confirmed to fail when the atom is `v-if`-ed. Recorded in the PR body.

## 5. Scope boundary

- **Not touched:** `src/pages/insights/index.vue`, `src/pages/search.vue`.
  Wiring them, and deleting `search.vue`'s `display: none`, is **#233**.
- **Not touched (BF-220 is landing on the same `dev`):**
  `components/bf/Hero.vue`, `PageHeader.vue`, `Prose.vue`,
  `public/css/base/typography.css`, `public/css/images/hero/**`.
- **Not touched (byte-guarded, site-epic DoD-4 / BRIEF §7):** `/wireframes/**`,
  `layouts/wireframe.vue`, `components/wireframe/**`, `public/css/wireframe.css`,
  `assets/wireframe-data`.
- **One CSS tree:** `bfna-website-nuxt/public/css` is a symlink to
  `../src/public/css`. Nothing here writes CSS at all, so the question does not
  arise.

## 6. Risks

| risk | mitigation |
|---|---|
| The extraction silently drops `data-bf-search-shell="count"`, un-hiding the idle count on `/search` — a *visible* regression that looks like progress | gate row 5 asserts the hook is still addressable and prints the computed `display`; browser check on idle `/search` |
| Vue whitespace handling changes the rendered sentence (`condense` drops whitespace-only text nodes that contain a newline) | the interpolations and their separating spaces stay on **one line** in the atom's template, as they are today; gate row 4 asserts the exact sentence |
| An "improvement" adds `aria-live`/`aria-atomic` alongside the role | gate row 3 |
| `resultCount` is a required `number` on `SearchShellProps`, so `bfSearchShell` never exercises the `null` branch | the branch is the atom's contract for #233 and is documented as such; it is exercised at the type level (`count?: number \| null`) and by the empty-region markup, not by a route that does not exist yet |
| Typecheck baseline (90, a `(file, TS-code, count)` signature set) shifts | new code is fully typed; `npm run typecheck` is run before the PR and the signature set is expected untouched |
