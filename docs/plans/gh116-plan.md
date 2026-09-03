# Plan — gh#116 · 15c Probe layout: CUBE-only layout for all bf-probe pages

**Issue:** [gh#116](https://github.com/ccmdesign/bfna-website-migration-2/issues/116) —
promoted residual [#113](https://github.com/ccmdesign/bfna-website-migration-2/issues/113),
with [#103](https://github.com/ccmdesign/bfna-website-migration-2/issues/103),
[#107](https://github.com/ccmdesign/bfna-website-migration-2/issues/107),
[#108](https://github.com/ccmdesign/bfna-website-migration-2/issues/108) folded in.
**Epic:** [BF-217](https://app.plane.so/ccm-design/browse/BF-217/) ·
**Spec:** the issue body (no spec file).

## What the measurement actually found

The issue body says probes render "under the default layout". They do not — every probe
already declares `definePageMeta({ layout: false })` and links `/css/styles.css` itself.
The defect #113 measured is real, but its source is **inside the CUBE stack**, not in
`css-legacy/`:

`src/public/css/base/typography.css` closes its `@layer defaults { … }` block at **line 83**
and then continues with 30 more lines of **unlayered** rules — among them

```css
p, li, input, button, a { font-weight: 100 }
```

Unlayered author rules outrank every cascade layer, so `.bf-chip { font: inherit }` in
`@layer components` loses on the `<a>` and `<button>` branches and wins on the `<span>`
branch (which the selector does not match): 400 vs 100, exactly as #113 measured. A scan of
every file `styles.css` composes finds **no other unlayered region** in the stack.

So the layout alone cannot make the acceptance true. Closing that layer block is the fix,
and it is in bounds: `public/css/**` is the CUBE stack, not the legacy CSS the cutover
retires (`public/css-legacy/**`, untouched here).

## Approach

1. **`src/public/css/base/typography.css`** — move the `@layer defaults` closing brace to
   the end of the file so the tail (`a:visited`, list margins, `li`, `blockquote`, the
   `font-weight: 100` rule, `strong`) is layered. Indent the moved block; no declaration
   changes. This is the #113 fix.
2. **`src/public/css/tokens/semantic-colors.css`** — add `--color-surface-page: var(--color-white)`
   beside the existing `--color-surface-inverse` pair. Alias of a primitive already in the
   graph; no new colour value (#107).
3. **`src/layouts/bf-probe.vue` (new)** — the CUBE-only probe shell:
   - `useHead` emits the bare `@layer` order statement as an **inline `<style>` with
     `tagPriority: 'critical'`**, so it is the first layer-defining thing the browser sees
     even under `nuxt dev`, where Vite injects SFC styles independently of the `<link>`
     (#108's latent case), then links `/css/styles.css` — whose own first line is the same
     statement, followed by reset/defaults/tokens/themes/composition/components/utils in
     the order that file composes them. Linking the composer rather than re-listing its
     `@import`s is deliberate: a duplicated list drifts the first time `styles.css` gains a
     file, and drift is the failure mode this issue exists to prevent.
   - No legacy stylesheet, and nothing from `nuxt.config`'s `css:` (which is empty — every
     entry is commented out) or from `default.vue` / `legacy-base.vue` can reach a probe,
     because a page's layout is the only injector left. Recorded in Decisions.
   - `htmlAttrs.lang` + `robots: noindex`, previously repeated in all eight probes.
   - Ground: `:global(html) { background-color: var(--color-surface-page) }`.
   - Template is a bare `<slot />` with **no wrapper element**: every probe page already
     roots itself in `<main class="probe">`, which the harness reads
     (`[data-probe-verdict]`), and nesting a second `<main>` would be invalid HTML and an
     a11y regression. The issue's "minimal `<main>`" is satisfied by the page's own.
4. **All eight `src/pages/bf-probe/*.vue`** — `definePageMeta({ layout: 'bf-probe' })`;
   drop the now-duplicated `htmlAttrs` / `robots` / `link` head entries and the
   `:global(html)` ground blocks. Keep each page's `title`.
5. **Probes 15 and 16** — measure the frozen wireframe reference inside a declarative
   same-origin `srcdoc` iframe instead of an in-document `.wireframe` box, so the probe
   document links **only** the CUBE stack. Two things improve, not just the letter of the
   acceptance: `wireframe.css`'s `html:has(.wireframe), body:has(.wireframe) { background }`
   rule currently reaches outside `.wireframe` and would outrank the layout's ground; and
   the reference is now measured in a document with nothing else in it. `srcdoc` is
   rendered in the template, so `probe-15-wf-button` / `probe-16-wf-chip` still appear in
   the prerendered HTML that `verify-bf-button.ts` and `verify-bf-chip.ts` grep.
6. **Probe 16** — put `fontWeight` back into the cross-mode comparison (#113 asked for
   exactly this) and add three rows for this issue's own acceptance: the `@layer` order
   statement is present **and in the declared order** (#108), and every stylesheet the
   document links is part of the CUBE stack.
7. **`docs/decisions/probe-harness.md`** — append the layout rule so future probes inherit
   it, plus a Decisions section for this issue.

## Test strategy

The vitest harness on `dev` is broken and pre-existing (residual #86), so acceptance is the
probe pages plus the machine harness, per the #109 convention:

```
cd bfna-website-nuxt
npx nuxt generate                       # exit 0
npx tsx scripts/check-probes.ts --only 16
npx tsx scripts/check-probes.ts         # all eight, exit 0
npx tsx scripts/verify-bf-chip.ts ; npx tsx scripts/verify-bf-button.ts ; npx tsx scripts/verify-bf-logo.ts
```

Gates: typecheck ≤ 178 baseline errors and 0 in `src/components/bf|types|composables/bf`;
wireframe source byte-identity vs `f757a64` empty.

## Risks

| Risk | Mitigation |
|---|---|
| Layering `typography.css`'s tail changes **wireframe** rendering — `wireframe.css`'s `@layer overrides` rules now outrank rules that used to be unlayered | Its two deliberately-unlayered rules (`ul.grid > li`, `.wf-footer ul.stack > li`) still win, being unlayered themselves. Source byte-identity is unaffected. Verified by regenerating and re-running every probe. |
| Iframe measurement differs from in-document measurement (inherited `font-size`) | `.wf-chip` sizes itself in `rem` and `.wf-button` inherits the 16px root both sides. Probe 15 keeps its explicit "measured at the same font size" row, which fails loudly if this is wrong. |
| Removing `layout: false` changes the prerendered HTML the `verify-bf-*.ts` scripts grep | All three run in verification. |
