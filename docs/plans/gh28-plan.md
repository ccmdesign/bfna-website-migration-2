# Plan — gh#28 / issue 19: `bfSkipLink` + the `[data-external]` marker

**Spec:** [`docs/ds-epic/issues/19-bf-skip-link.md`](../ds-epic/issues/19-bf-skip-link.md) ·
**Issue:** [gh#28](https://github.com/ccmdesign/bfna-website-migration-2/issues/28) ·
**Epic:** [BF-217](https://app.plane.so/ccm-design/browse/BF-217/)

Written by the item-runner (the sanctioned `ce-plan` fallback: the plan is short,
the spec is unambiguous, and a detached planning agent is the failure mode the
runner contract warns about).

## Approach

Two small things, bundled because the brief names this bundle (§5.5) and because
the probe has to demo them together.

### 1. `bfSkipLink` — `src/components/bf/SkipLink.vue`

- Props: `target?: string` defaulting to `'#main'` (typed in
  `src/types/bf-contracts.ts` as `SkipLinkProps`, per BRIEF §5 rule 11).
- Renders exactly one `<a :href="target" class="bf-skip-link">` with a default
  slot for the label. Nothing else — no wrapper, so `$attrs` has one destination
  and the element can be the first focusable one wherever it is placed.
- Visually hidden until `:focus`, reproducing `.wf-skip-link`'s behaviour
  (`position:absolute; left:-999px` → `left:0` plus padding, ground and
  `z-index` on focus) but from tokens: `--_bf-skip-link-bg` /
  `--_bf-skip-link-color` default to the same semantic pair `bfButton`'s primary
  variant established (`--color-primary` / `--color-text-inverse`), never the
  `#222`/`#fff` literals.
- `:focus`, not `:focus-visible`: a skip link exists for the keyboard user and
  must appear on every focus, including a programmatic one.
- `@layer components`, in a `<style scoped>` block, matching every other atom.

### 2. The `[data-external]` marker

- `src/utils/link.ts` — a plain TS module next to `format.ts`, no Vue/Nuxt
  imports: `isExternal(href, siteHosts = SITE_HOSTS)` plus the exported
  `SITE_HOSTS` constant. Base rule straight from the spec: an absolute
  `http(s)://` or protocol-relative URL whose host differs from the site's own is
  external; a relative path, a bare `#anchor`, an empty value and any other
  scheme are not.
- `src/public/css/components/external-link.css` — the marker rule
  (`a[data-external]::after { content: " ↗" }`) inside `@layer components`,
  imported from `styles.css`'s Components Layer block. A **shared** stylesheet,
  not a scoped one: the attribute is emitted by `bfButton`, `bfChip` and every
  future `bfCard*`, and a scoped rule in one component cannot reach the others.
- `bfButton` / `bfChip` are **not** modified. They already emit
  `:data-external="external || undefined"`; the probe confirms the marker lands
  on their output.

### 3. Probe — `src/pages/bf-probe/19-bf-skip-link.vue`

Under `layouts/bf-probe.vue`, following `docs/decisions/probe-harness.md`
(`[data-probe-verdict]` root, `[data-probe-row][data-ok]` rows).

The load-bearing part is a **real keyboard Tab**, not a programmatic `.focus()`.
`scripts/check-probes.ts` gains one additive, opt-in hook: when a probe's root
carries `data-probe-keys="Tab,Enter"` — an attribute bound reactively, so it
appears only after hydration and acts as the handshake — the harness dispatches
those keys through CDP `Input.dispatchKeyEvent`. Trusted events, so Tab performs
genuine sequential focus navigation and Enter genuinely activates the link. No
other probe carries the attribute, so nothing else changes.

The probe then asserts, from listeners registered in `onMounted`:

1. the first Tab from a fresh document lands on the `bf-skip-link` — i.e. it is
   the first focusable element, measured rather than assumed;
2. while focused it is **visible**: on-screen bounding box, `left` no longer off
   the viewport, a painted ground, a `z-index` above the page;
3. unfocused it is off-screen and does not affect layout;
4. Enter moves focus to the target (`#main`, `tabindex="-1"`) and sets the hash;
5. `isExternal` over a table of real cases from the snapshots;
6. the `↗` marker actually renders on an external `<a>` — read from
   `::after`'s computed `content` — and does **not** render on internal ones,
   including on `bfButton`/`bfChip` output;
7. the marker rule is inside `@layer components` in the live CSSOM.

## Files

| File | Change |
|---|---|
| `src/components/bf/SkipLink.vue` | new |
| `src/types/bf-contracts.ts` | `SkipLinkProps` added |
| `src/utils/link.ts` | new — `isExternal`, `SITE_HOSTS` |
| `src/public/css/components/external-link.css` | new |
| `src/public/css/styles.css` | one `@import` |
| `src/pages/bf-probe/19-bf-skip-link.vue` | new probe |
| `scripts/check-probes.ts` | additive `data-probe-keys` hook |
| `docs/ds-epic/issues/19-bf-skip-link.md` | Decisions appended |

## Test strategy

The vitest harness on `dev` is broken and pre-existing (residual #86), so
acceptance is the probe harness, per the gh#20–#27 precedent:

```bash
cd bfna-website-nuxt
npx nuxt typecheck        # gate: no NEW errors vs the 178-error dev baseline
npx nuxt generate         # exits 0
npx tsx scripts/check-probes.ts --only 19
npx tsx scripts/check-probes.ts          # every earlier probe still green
npx tsx scripts/verify-bf-button.ts && npx tsx scripts/verify-bf-chip.ts
test -f src/components/bf/SkipLink.vue && test -f src/utils/link.ts
```

Plus the epic-wide wireframe byte-identity diff, which must print nothing.

## Risks

| Risk | Mitigation |
|---|---|
| The CDP key hook changes behaviour for other probes | Opt-in by attribute; no other probe declares it, and the full harness run proves it. |
| Tab lands somewhere else because a focusable element precedes the link | That is exactly what row 1 measures — the probe fails rather than lying. |
| Fragment navigation does not move focus | The target needs `tabindex="-1"`; the probe gives it one and the Decisions record it as a requirement on the shell layout (#55). |
| The shared marker rule reaches `/wireframes` | Same `content` value as the frozen skin's own rule, so nothing moves; wireframe **source** is untouched, which is what DoD-4 checks. |
| A new colour sneaks in via the focus ground | Both hooks default to tokens `bfButton` already established; no literal is typed. |
