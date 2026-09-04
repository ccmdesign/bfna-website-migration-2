# gh#229 — a11y-104 `form-error-semantics`

Row 104 of the accessibility pass-1 index. Epic: <https://app.plane.so/ccm-design/browse/BF-219/>.
Brief: [`docs/a11y-epic/BRIEF.md`](../a11y-epic/BRIEF.md) (§3 gates, §4 D23/D29/D32, §5, §7).

## The defect, as measured

The audit (BRIEF §0, "Contact form") read the rendered `/about`:

| Measured | Value |
|---|---|
| `required` on all three controls | `false` |
| `aria-required` on all three controls | `null` |
| `aria-describedby` | `null` |
| `aria-invalid` | `null` |
| `novalidate` on the `<form>` | absent |
| status region in the band | none |

`bfFormField` already implements every one of those correctly
(`FormField.vue:124-150` computes `hintId` / `errorId` / `describedBy` / `invalid`;
`FormField.vue:246-259` binds `:required`, `:aria-describedby`, `:aria-invalid` on both control
branches; `FormField.vue:236-243` marks the visual `*` `aria-hidden`). The call site
(`ContactSection.vue:184-263`) uses none of it — and says so in its own comment at
`ContactSection.vue:216-219`.

## Approach

**Use the component from the call site. Do not reimplement it.** One gap is genuinely in the
component and is fixed there: `FormField.vue:270`'s error `<p>` is associated by
`aria-describedby` but carries no `role="alert"`, so an error that appears *after* submit is not
announced unless focus happens to return to the field.

### 1. `src/components/bf/FormField.vue` — one attribute

`role="alert"` on the error `<p>`. It is `v-if="error"`, so the element is mounted only when there
is something to announce — an always-mounted `role="alert"` would fire on page load, which is the
thing D29 exists to avoid for the *status* case and which is worse for an assertive region.
No change to `describedBy`, `invalid`, `hintId` or `errorId`: they are correct.

### 2. `src/components/bf/ContactSection.vue` — the wiring

- `novalidate` on the `<form>`. Load-bearing here specifically: `ContactSection.vue:232` is
  `type="email"`, so without it the UA's own validation bubble fires *before* the `submit` event.
  That bubble is not the `aria-describedby` target, is not `role="alert"`, is announced
  inconsistently across UA/AT pairs, and vanishes on the next keystroke.
- `required` on all three fields. `bfFormField` turns that into native `required` on the control
  (which is what reaches the accessibility tree) plus the `aria-hidden` `*` marker it already
  draws. No `aria-required` is written: the native attribute is the mapping, and a redundant
  `aria-required="true"` beside it is a second statement of the same fact.
- Two new props, so the error and outcome plumbing is *wired* without this row inventing
  behaviour (see the scope boundary below):
  - `errors?: { name?: string, email?: string, message?: string }`, default `() => ({})`, bound
    `:error="errors.name"` etc. on the three fields. Named optional properties rather than a
    `Record`, so `noUncheckedIndexedAccess` does not widen the value to `string | undefined` at a
    site that would then need a cast (the same reasoning the file already records at
    `ContactSection.vue:135-148` for the three refs).
  - `status?: string`, default `''`, rendered into one always-mounted `role="status"` region.
- The status region: `<p class="bf-contact-section__status" role="status">{{ status }}</p>`,
  placed **inside the existing submit-row `<div>`**, after the button. Two reasons: D29 wants the
  region mounted in the idle state with empty text (never `display: none`), and the submit row's
  `<div>` is already a plain block, so an empty `<p>` inside it occupies no space and adds no
  `.stack` gap — an empty `<p>` as a direct child of `.bf-contact-section__form | stack` would add
  one `--space-s` gap and change the layout, which D23 does not permit.
  `role="status"` alone, with no `aria-live` and no `aria-atomic` beside it — the idiom
  `bfResultCount` (gh#226) already uses and which `check-routes.ts:2773` already asserts.

### 3. `scripts/check-routes.ts` — the gate (BRIEF §5)

One new whole-build group, `contact form semantics (gh#229)`, registered alongside gh#217/#218/
#220/#221/#222/#224/#225/#226/#227/#228 and disturbing none of them. Two halves:

**Runtime, on `/about`, read from the hydrated page:**
1. exactly one `<form>` inside `.bf-contact-section`, and it reports `noValidate === true`;
2. exactly three controls in that form, in DOM order `name`, `email`, `message`;
3. each control: `required === true` (or `aria-required="true"` — either mapping satisfies the
   row), a real `<label for>` that resolves to it and whose computed `display` is not `none`,
   and `autocomplete` unchanged on the first two;
4. each control, error-free: `aria-invalid` is `null` — the component contract is
   "`'true'` or nothing, never `'false'`" (`FormField.vue:149-153`);
5. every id in any `aria-describedby` present on a control resolves to an element in the document
   (vacuously true today, and the row that catches a dangling reference the day an error is
   supplied);
6. exactly one `[role="status"]` in the band; it is mounted, its computed `display` is not `none`
   and its `visibility` is not `hidden`, and its text is **empty** on load — the region must exist
   without announcing anything at page load.

**Source, because the error path cannot be exercised without behaviour this row may not add:**
7. `ContactSection.vue` binds `:error` on all three `bfFormField`s;
8. `FormField.vue`'s error `<p>` carries `role="alert"` and `:id="errorId"`, and both control
   branches bind `:aria-describedby="describedBy"` and `:aria-invalid="invalid"`.

Rows 7–8 are labelled as source reads, not as measured runtime facts (BRIEF §5: never assert a
value you did not measure).

## Demonstrating the associations without wiring behaviour

The form is knowingly unwired (`@submit.prevent` with no handler); making it send is site-epic
#72. So the associations are demonstrated the way the issue's acceptance asks — by **planting** an
`error` value and reading the result — rather than by producing one:

- In the browser (STEP 6a): with `nuxt dev` running, temporarily edit `ContactSection.vue` to pass
  a literal `error` on the Name field, let HMR apply it, and read `aria-invalid`,
  `aria-describedby`, the resolved element's text, and its `role`. Then revert the plant and
  confirm the attributes are gone again.
- In CI: rows 7–8 above assert the wiring exists; row 5 asserts any reference that *does* appear
  resolves.

## Verification

```bash
cd bfna-website-nuxt
npm ci
npm run typecheck            # signature set in .github/typecheck-baseline.txt, baseline 90
npx nuxt generate            # NEVER `npm run generate`
npx tsx scripts/check-routes.ts
npx tsx scripts/check-links.ts
```

Negative test of the new group: remove `novalidate` and the `role="status"` region, re-run
`check-routes.ts --only`-less, confirm the group goes red on exactly those rows, restore.

## Out of scope, deliberately

- **Behaviour.** No submit handler, no `fetch`, no Netlify Forms wiring, no validation logic.
  Site-epic #72 owns it. This row ships the semantics and the two props a handler will bind to.
- **The focus ring.** `public/css/base/forms.css:34-40` writes `outline: none` and replaces it with
  an 80 %-transparent box-shadow. That is a focus-*appearance* decision (D32) and now belongs to
  BF-220 #250. `forms.css` is not touched.
- **Colour, type, radius, shadow** (D23 / DoD-A10). The `*` marker and the error `<p>` are styled
  by rules that already exist in `FormField.vue`; no token is added or changed.
- **The `<legend>` / `<h2>` duplication.** `ContactSection.vue:106-117` records why both carry the
  same string. This row does not touch it, and does not make it worse.
- **BF-220's files.** `Hero.vue`, `PageHeader.vue`, `Prose.vue`, `base/typography.css`,
  `public/images/hero/**` — a concurrent epic owns them and none is needed here.

## Risks

| Risk | Mitigation |
|---|---|
| The empty status `<p>` adds a `.stack` gap and changes the layout (D23) | It is placed inside the submit-row `<div>`, not as a `.stack` child. Confirmed in the browser before the PR. |
| Making all three fields `required` renders three `*` markers — a visible change | It is a semantic marker, not a colour/type/spacing decision; `FormField.vue` already draws it and already hides it from the accessible name. D23 forbids colour and type, not the appearance of a required marker. |
| `role="alert"` on an error that is present at first render announces on load | The `<p>` is `v-if="error"` and nothing supplies an error on `/about`, so it is not in the initial DOM. The gate asserts the region count and the status region's emptiness on load. |
| The new gate collides with gh#226/#227's `<form>` and `role="status"` counts | Both are scoped to `/search`; this group is scoped to `/about` and to `.bf-contact-section`. |
| `npx nuxt generate` needs Directus | It does not — only `npm run generate` runs the importer. Content is committed under `content/bf`. |
