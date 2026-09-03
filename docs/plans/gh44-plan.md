# Plan — gh#44 / issue 35: `bfNav` (+ internal `MenuLink`, `Dropdown`)

**Spec:** [`docs/ds-epic/issues/35-bf-nav.md`](../ds-epic/issues/35-bf-nav.md) ·
**Epic:** [BF-217](https://app.plane.so/ccm-design/browse/BF-217/) ·
**Branch:** `feature/gh44-bfnav-internal-menu-link` off `dev`

## Approach

Three new SFCs plus one probe page. The whole point of the issue is the D8
fix: `wfNav.vue` calls `useWfContent()` inside the component; `bfNav` takes
`menus: Menu[]` as a prop and its two children take theirs from `bfNav`.
`Menu` / `MenuItem` already exist in `src/types/bf-contracts.ts` (issue 02),
so no type is added.

Structural parity with the three frozen wf files, read but never edited:

| wf source | bf successor | change |
|---|---|---|
| `wfNav.vue` | `components/bf/Nav.vue` | `menus` prop instead of `useWfContent()`; `<bfLogo>` instead of `<strong>BFNA</strong>`; `/search` instead of `/wireframes/search` |
| `wfNavDropdown.vue` | `components/bf/nav/Dropdown.vue` | native `<details>` + `closeSiblings` kept; **adds** Esc-to-close with focus return to `<summary>` |
| `wfMenuLink.vue` | `components/bf/nav/MenuLink.vue` | identical render; `MenuItem` type from `bf-contracts` |

## Files

- `bfna-website-nuxt/src/components/bf/Nav.vue` — new. `<bfNav>`.
- `bfna-website-nuxt/src/components/bf/nav/MenuLink.vue` — new, internal child.
- `bfna-website-nuxt/src/components/bf/nav/Dropdown.vue` — new, internal child.
- `bfna-website-nuxt/src/pages/bf-probe/35-bf-nav.vue` — new probe.
- `docs/ds-epic/issues/35-bf-nav.md` — Decisions appended.
- No other file is touched. `nuxt.config.ts` is **not** edited (see Decisions).

## Key design calls

1. **Registration.** `components/bf` is configured `pathPrefix: false,
   prefix: 'bf'`, so the two children would auto-import as `<bfMenuLink>` and
   `<bfDropdown>` — top-level-looking names in the `bf` namespace for things
   that are internal to one component. `Nav.vue` imports both by **explicit
   relative path** (`./nav/MenuLink.vue`, `./nav/Dropdown.vue`), which is what
   the spec asks for and what makes the pair reusable from `bfFooter` (#45)
   without depending on the auto-import naming.
2. **Esc.** `@keydown.esc` on the `<details>` (which is in the event path of
   both the summary and every link inside the panel), closing it and
   `.focus()`-ing the `<summary>`. Native `<details>` has no Esc behaviour —
   this is the one piece of script the component adds beyond `closeSiblings`.
3. **Responsive collapse — container query, not a media query.** The wireframe
   uses `@media (max-width: 768px)` to flow the panels statically. A
   `@container` at the same width on `.bf-nav` is behaviourally identical for a
   full-bleed header, is honest about what it actually depends on (the nav's
   own width), and — the deciding reason — is *measurable in the probe*, which
   runs at one fixed 1280px viewport. Recorded in Decisions.
4. **No new colour.** `--_bf-nav-bg` → `--color-surface-page`,
   `--_bf-nav-link-color` → `--color-text`, rules → `--color-neutral-tint-20`
   / `--color-neutral-shade-05`. All existing semantic tokens.
5. **Focus.** `base/focus.css` (#146) supplies `:focus-visible` for links and
   `<summary>` from `@layer defaults`. No local ring is declared — the probe
   asserts the global rule reaches the nav's controls.
6. **No `:not()`** anywhere (D-20.5). Open-state branch is `[open]`.

## Test strategy

Probe `src/pages/bf-probe/35-bf-nav.vue`, `layout: 'bf-probe'`, harness DOM
convention (`data-probe`, `data-probe-verdict`, `data-probe-row`/`data-ok`).
Hand-written `fixtureMenus`: one plain internal link, two dropdowns, one
external link — plus a fifth entry proving `to` and `href` branches.

Asserted:

- renders one entry per `menus` item, right element per branch; `<bfLogo>`
  links `/`; search entry links `/search`.
- **only one open at a time** — open A, open B, A closed (`checkVisibility()`,
  never a bounding rect — D-31.6).
- **Esc closes and refocuses the `<summary>`** — driven by real CDP keys
  (`data-probe-keys="Enter,Escape"`), `isTrusted` asserted.
- **Enter/Space toggle** the summary natively.
- **mobile reflow** — a second nav inside a 375px container: panels
  `position: static`, no horizontal overflow.
- cascade layer membership, zero inline `style`, `$attrs` fallthrough.
- zero `aria-expanded` / `role="button"` (the browser owns disclosure ARIA).

Acceptance commands (`bfna-website-nuxt/`):

```bash
npx nuxt typecheck   # gate: ≤ baseline 178; 0 in src/components/bf|types|composables/bf|content.config
npx nuxt generate
npx tsx scripts/check-probes.ts --only 35
npx tsx scripts/check-probes.ts
grep -L "useWfContent\|queryCollection" src/components/bf/Nav.vue src/components/bf/nav/*.vue
grep -q "menus: Menu\[\]" src/components/bf/Nav.vue
```

Plus the frozen-source diff, which must print nothing.

## Risks

| Risk | Mitigation |
|---|---|
| `container-type: inline-size` implies layout containment — could it break the header's `position: sticky` or clip the absolutely-positioned panel? | Containment is `layout style inline-size`, **not** paint, so nothing clips; the panel's containing block is `.bf-nav__group` (`position: relative`), not the header. The probe asserts computed `position: sticky` on `.bf-nav` and that an open panel overflows the header box. |
| Auto-import still registers `<bfMenuLink>`/`<bfDropdown>` globally | Harmless today (no top-level `bf/MenuLink.vue` or `bf/Dropdown.vue` exists, and `issues.md` plans none). Not relied upon. Recorded. |
| Esc handler swallowing Esc from unrelated widgets | Handler is on the `<details>`, fires only when the event path includes it, and no-ops when the element is already closed. |
| The `toggle` event is async, so a synchronous read after a key press reads the old state | Assertions run from a `keyup` listener plus a `setTimeout` beat, as probes 30/31 do. |
