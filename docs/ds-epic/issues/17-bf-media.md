# 17 — bf-media

Evolve `wfMedia` into `bfMedia`, swapping the raw `<img>` for `NuxtImg` and
the inline `--wf-ratio` style for a CSS-variable hook.

## Context

Depends on 02, 06. Blocks 21-27 (`bfCard*` wrappers all render media
through this), 37 (`bfHero` — not directly, no media prop there per
as-built), 44 (`bfContactSection` if it carries an image — check as-built,
none today). Builds from
`bfna-website-nuxt/src/components/wireframe/wfMedia.vue` (9 lines: `<img>`
when `src` set with an inline `aspect-ratio`/`object-fit` style, else a
`.wf-media` placeholder `<div>` with `--wf-ratio` inline). Provenance:
BF-159; as-built-wireframe-inventory.md §A.

## Scope

- New `bfna-website-nuxt/src/components/bf/Media.vue` (`<bfMedia>`).
- Props: `src?: string | null`, `alt?: string | null`, `ratio?: string =
  '16/9'` — same defaults as `wfMedia.vue`.
- When `src` is set: render `<NuxtImg :src="src" :alt="alt" loading="lazy">`
  (the module is installed — `@nuxt/image` is in `src/nuxt.config.ts`
  `modules:`) with explicit `width`/`height` (or `aspect-ratio` CSS)
  derived from the `ratio` prop so there is no cumulative layout shift —
  `object-fit: cover` via CSS, not an inline `style` string (replacing
  `wfMedia.vue:11`'s inline `style="aspect-ratio: …; object-fit: cover"`).
- When `src` is absent: render the placeholder `<div>`, ratio applied
  through `--_bf-media-ratio` (replacing `wfMedia.vue:12`'s inline
  `--wf-ratio` custom property — same mechanism, `--_bf-*` name).
- `alt` is **required** whenever `src` is set — enforce via a dev-time
  warning (Vue's `console.warn` in a `watchEffect`, or a prop validator) if
  `src` is truthy and `alt` is falsy; do not silently render `alt=""`.

## Out of scope

- Art direction, `<picture>` source sets, or a lightbox — none exists in
  the wireframe layer, none is built here.
- Editing `wfMedia.vue` or any of its 6 call sites — frozen (D2).
- No edits under `pages/wireframes/` or `components/wireframe/` (D2).
- Any new colour for the placeholder box — reuse whatever token/pattern the
  `.wf-media` crosshatch placeholder already implies is the intended
  "no image yet" treatment (a neutral/surface token), no new literal.

## Styling

Tokens: neutral/surface semantic token for the placeholder box background
(reuse existing, no new literal). CSS-variable hook: `--_bf-media-ratio`
(replaces `--wf-ratio`), bound via computed `cssVars`. `@layer components`.

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
test -f src/components/bf/Media.vue   # today: fails
grep -c "NuxtImg" src/components/bf/Media.vue        # after: >=1
grep -c "loading=\"lazy\"" src/components/bf/Media.vue   # after: >=1
grep -c "\-\-_bf-media-ratio" src/components/bf/Media.vue   # after: >=1
git diff --stat -- src/components/wireframe/wfMedia.vue   # must be empty
```
Plus: a probe page renders 1/1, 3/2, and 16/9 in both real-image and
placeholder states with no cumulative layout shift (per the issues.md
`verify` column — manual/Lighthouse CLS check).

## Decisions

_Runner appends here._

### D17.1 — the ratio default lives in CSS, not in `withDefaults`

The spec types the prop as `ratio?: string = '16/9'`. It is implemented as
`ratio?: string` with **no runtime default**, and `--_bf-media-ratio: 16 / 9`
declared in the `.bf-media` rule instead. The observable default is unchanged —
an instance with no `ratio` still renders 16/9, exactly as `wfMedia.vue` does.

The reason is the one this issue was opened for. Moving `aspect-ratio` out of
the inline `style` and into a custom property is only half a fix: if the
component *always* writes `--_bf-media-ratio` inline, a consumer stylesheet
still cannot outrank it, because an inline declaration beats every author rule
at every specificity. The full-width Transponder card would have been exactly
as stuck as it was with `wfMedia`. So:

| `ratio` | what the component emits | how a consumer overrides |
|---|---|---|
| omitted | nothing inline; `16 / 9` comes from the `.bf-media` rule | its own CSS rule (class, ancestor, `:has()`) **or** an inline `style` |
| passed | `style="--_bf-media-ratio: …"` from the computed `cssVars` | an inline `style` through `$attrs`, which Vue merges after the component's own binding and which therefore wins |

Both paths are asserted on the probe (`§ 4`), not assumed.

### D17.2 — no `width` / `height` attributes; the box is reserved by CSS

The issue body asks for "explicit dimensions to avoid layout shift"; the spec
allows "explicit `width`/`height` **or** `aspect-ratio` CSS". The CSS route is
taken. On `NuxtImg`, `width`/`height` are **resize modifiers** sent to the image
provider, not layout hints, so synthesising them from the `ratio` would make
every consumer silently request one fixed pixel size. `aspect-ratio` +
`inline-size: 100%` reserves the correct box before the bitmap arrives, while it
decodes, and if it never arrives — which is the whole of what CLS asks for here.

### D17.3 — acceptance substitutes the probe harness for vitest (residual #86)

The vitest harness on `dev` is broken and pre-existing, so the spec's
"manual/Lighthouse CLS check" is discharged instead by
`/bf-probe/17-bf-media` under `npx tsx scripts/check-probes.ts --only 17`
(harness decision gh#109). CLS is made machine-readable rather than eyeballed:
each of the six boxes has its **measured** `width / height` asserted against its
declared ratio within 1%, and the real and placeholder boxes at one ratio are
asserted to reserve the same height in equal-width columns. A box whose ratio
was not reserved fails both rows.

No `naturalWidth` assertion is written, deliberately. `nuxt generate` emits an
`/_ipx/…` URL with no server behind it, so the bitmap legitimately 404s in the
harness — which is precisely the condition the reserved box has to survive, and
a decode-dependent check would have been the flaky one.

### D17.4 — placeholder colours

`.wf-media` in the frozen skin is drawn with three literals (`#ccc` twice, a
light grey ground). BRIEF §5 rule 2 forbids a new literal and forbids reaching
for a primitive, so the same construction — a 1px border plus two full-diagonal
hairlines over a light ground — is rebuilt from `--color-base-super-light` and
`--color-light`, both already in `tokens/semantic-colors.css`. The probe
asserts the resolved paints rather than the source strings.

### D17.5 — `alt`

The dev-time warning fires when `alt` is **unspecified** (`== null`) alongside a
`src`, not when it is falsy. An explicit `alt=""` is the standard way to declare
an image decorative and is a legitimate answer; warning on it would train call
sites to ignore the warning. The placeholder branch carries `aria-hidden="true"`
— it is the absence of an image, not an image of an absence, so there is nothing
for a screen reader to describe.

### D17.6 — planning was done inline

`ce-plan` was not invoked. The first runner on this issue stalled inside a skill
invocation before doing any work, leaving an empty worktree and branch behind;
the plan was therefore written directly to `docs/plans/gh26-plan.md`, per the
runner rule that a degraded inline step beats a stranded item. Same for the
code review (`ce-code-review`), which was performed inline over
`git diff dev...HEAD`.
