# Plan — gh#37 / issue 28 — `bfBreadcrumb`

**Spec (authoritative):** [`docs/ds-epic/issues/28-bf-breadcrumb.md`](../ds-epic/issues/28-bf-breadcrumb.md) ·
**Issue:** [gh#37](https://github.com/ccmdesign/bfna-website-migration-2/issues/37) ·
**Epic:** [BF-217](https://app.plane.so/ccm-design/browse/BF-217/)

> `ce-plan` in pipeline mode was not invoked. The spec already fixes the file
> path, the prop shape, the markup, the styling hook and the acceptance
> commands, so a planning pass had no open question to resolve, and the runner
> template names writing this file directly as the sanctioned fallback. Cost of
> the elevated-model planning round was not worth a plan that would restate the
> spec.

## Approach

One presentational atom plus one probe. No contract change: `Crumb` already
exists in `src/types/bf-contracts.ts:315` (`{ label: string, to?: string |
Record<string, unknown> }`), landed by issue 02 / gh#11.

`wfBreadcrumb.vue` renders a flat `<nav>` of alternating `<span> / </span>`
separators and links — no list markup at all, and the separator is a **text
node**, so a screen reader reads "slash" between every crumb. `bfBreadcrumb`
keeps the landmark and replaces everything inside it:

| | `wfBreadcrumb` | `bfBreadcrumb` |
|---|---|---|
| Structure | `<nav>` + bare inline nodes | `<nav>` → `<ol role="list">` → `<li>` |
| Separator | `<span> / </span>` text node | `li + li::before`, with `content: "/" / ""` |
| Current page | plain `<span>` for any item lacking `to` | `<span aria-current="page">` on the **last** item, always |
| Type | local `export interface WfCrumb` | imported `Crumb` |

### Decisions taken here (appended to the spec's Decisions section)

1. **`aria-current` marks the last item, not "any item without `to`".** The
   spec says so explicitly, and the issue's acceptance says the last crumb is
   not a link. So the final crumb renders as a `<span aria-current="page">`
   even when it carries a `to`; a non-final crumb without a `to` renders as a
   plain `<span>` with no `aria-current`. Exactly one `aria-current` per trail,
   always on the last `<li>` — asserted on the probe.
2. **Local `interface Props`, not a `BreadcrumbProps` in `bf-contracts.ts`.**
   Divergence from the `XProps`-in-contracts shape of the 14 earlier atoms, and
   deliberate: the spec designs the props this way and its acceptance greps for
   `Crumb[]` **in the component file**. BRIEF §5 rule 11 forbids declaring a
   *shared* type inline; `Props` is not shared (unexported, unimportable), and
   the one type a consumer needs — `Crumb` — is imported from contracts, which
   is the rule's actual target.
3. **Empty `items` renders nothing at all**, not an empty `<nav>`. An empty
   landmark is announced by name and then found to contain nothing.
4. **`role="list"` on the `<ol>`.** `list-style: none` strips list semantics in
   Safari/VoiceOver; the explicit role restores them. Redundant elsewhere,
   harmless everywhere.
5. **Separator colour = `--color-neutral-tint-60`**, an existing semantic shade
   token. No new colour, no primitive, no literal.

### The separator and the accessibility tree

A CSS `::before` is *not* automatically excluded from the accessible name — in
Chrome, generated content is concatenated into it, so `content: "/"` alone
would reproduce the exact defect this component exists to fix, only harder to
see. The alt-text form `content: "/" / ""` gives the pseudo-element an empty
alternative text, which removes it from the a11y tree while leaving it painted.
That is the load-bearing line in the stylesheet.

## Files

| File | Action |
|---|---|
| `bfna-website-nuxt/src/components/bf/Breadcrumb.vue` | new — the component |
| `bfna-website-nuxt/src/pages/bf-probe/28-bf-breadcrumb.vue` | new — the probe |
| `docs/ds-epic/issues/28-bf-breadcrumb.md` | append to Decisions |
| `docs/plans/gh37-plan.md` | this file |

Nothing else. `src/types/bf-contracts.ts` is **not** edited (`Crumb` is already
right). `src/nuxt.config.ts` is **not** edited — probe routes are enumerated
from disk since gh#28.

## Test strategy

The vitest harness on `dev` is broken and pre-existing (residual #86), so
acceptance is the probe under the gh#109 harness, per the gh#20–#27 precedent.

Probe `/bf-probe/28-bf-breadcrumb` renders **1-, 2-, 3- and 4-crumb** trails
(the spec names 1 and 4; the issue names 2, 3 and 4 — the union is cheap), plus
three shape cases: a trail whose last crumb *does* carry a `to`, a trail with a
non-final crumb lacking a `to`, and an empty trail. Rows assert:

- one `<nav aria-label="Breadcrumb">` per trail, wrapping exactly one `<ol>`;
- `<li>` count equals crumb count, for each of 1/2/3/4;
- `aria-current="page"` appears exactly once per trail, on the **last** `<li>`,
  and on a `<span>` rather than an `<a>`;
- the last crumb is never a link — including when it carries a `to`;
- every non-final crumb with a `to` is an `<a href>`; without one, a `<span>`
  with no `aria-current`;
- **no separator character is a DOM text node** — `nav.textContent` is exactly
  the concatenated labels;
- the separator *is* painted: `::before` on `li + li` resolves non-`none`,
  and is `none` on the first `<li>`;
- the `::before` carries empty alt text, so it is out of the accessible name;
- the empty trail renders zero elements;
- `.bf-breadcrumb` rules live in `@layer components` in the live CSSOM;
- the component emits no inline `style`, and `$attrs` falls through to the
  `<nav>`.

Gates, all run in `bfna-website-nuxt/`:

```bash
npx nuxt typecheck   # ≤ 178 baseline; 0 in src/components/bf|types|composables/bf
npx nuxt generate
npx tsx scripts/check-probes.ts --only 28
npx tsx scripts/check-probes.ts
test -f src/components/bf/Breadcrumb.vue
grep -q 'Crumb\[\]' src/components/bf/Breadcrumb.vue
grep -q 'aria-label="Breadcrumb"' .output/public/bf-probe/28-bf-breadcrumb/index.html
grep -q 'aria-current="page"'    .output/public/bf-probe/28-bf-breadcrumb/index.html
```

plus the wireframe byte-identity diff, which must print nothing.

## Risks

| Risk | Mitigation |
|---|---|
| `content: "/" / ""` mangled by the CSS pipeline | The probe reads the **live CSSOM** `content` of the `::before`, not the source, so a build that drops the alt-text half fails the run rather than shipping a slash into every screen reader. |
| A grep-shaped acceptance passing on a comment | The `Crumb[]` occurrence is the props declaration itself, in code. Noted because the harness hardening in gh#115 found exactly that failure mode. |
| `aria-current` on the last item conflicting with "links for every item that has `to`" | Resolved above (decision 1) in favour of the spec and the issue's stated acceptance: last crumb is never a link. |
| A probe added to `pages/bf-probe/` not reaching `.output/public` | Fixed since gh#28 — routes are seeded into `nitro.prerender.routes` from disk. Verified by the `--only 28` run. |
