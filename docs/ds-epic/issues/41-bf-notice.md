# 41 — `bfNotice` — notice/banner

One-line objective: componentise the raw `.wf-note` box as `bfNotice`,
replacing three raw `<p class="wf-note">` usages.

## Context

Depends on 02 (`bf-scaffold`). Builds from `.wf-note` (`public/css/
wireframe.css` L114-121, "monospace reviewer/system-note box") used raw at
`search.vue` (×2, the semantic-search caveat + "No records matched") and
`insights/[slug].vue` (the archive banner). Consumed by 46 (site
announcement band — but see Out of scope below), 50 (insight-detail archive
banner), 54 (search empty-state note, via `bfSearchShell`/`bfEmptyState`
composition — record which). Provenance: BF-170.

## Scope

- File: `src/components/bf/Notice.vue` → `<bfNotice>`.
- Props:
  ```ts
  interface Props {
    variant?: 'note' | 'info' | 'warning'   // drawn only from existing semantic tokens
  }
  ```
  Default slot.
- Renders `<div class="bf-notice" :data-variant="variant" :role="
  announced ? 'status' : undefined"><slot /></div>` — `role="status"` when
  the message is announced dynamically (i.e. it can appear/disappear at
  runtime in response to user action, like the search "no results"
  message), a plain block otherwise (like a static archive banner that's
  present at initial render and never toggles). Since this distinction is
  behavioural, not prop-driven from the wf source, expose it as a prop
  (`announced?: boolean`, default `false`) rather than inferring it, and
  document in Decisions which of the three real call sites set it `true`.
- Three variants render **distinguishably using only existing semantic
  tokens** (no new colour) — note/info/warning map to whichever of
  `--color-primary`/`--color-warning`/`--color-neutral` etc. already exist
  post-issue-06 token cleanup; if a genuinely distinct "warning" semantic
  token does not exist yet, record that gap in Decisions rather than
  inventing one.

## Out of scope

- New colours for the variants (existing tokens only).
- Dismissal behaviour, toasts (no wireframe evidence).
- The site announcement band's own layout — issue 46's layout shell decides
  *whether* to wrap its announcement in `bfNotice` and how it's positioned;
  this issue only ships the notice component itself.
- No edits under `pages/wireframes/` or `components/wireframe/` (D2).

## Styling

- CSS variables `--_bf-notice-bg`, `--_bf-notice-border`, `--_bf-notice-
  color`, one triplet per variant, all referencing existing semantic
  tokens. Monospace font family is a stylistic choice ported from `.wf-
  note` — keep or drop per Decisions (the wf-* monospace look is
  deliberately "review note" styling, likely not appropriate for
  production chrome; record the call).

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
test -f src/components/bf/Notice.vue
grep -q "variant" src/components/bf/Notice.vue
grep -Lq "#[0-9a-fA-F]\{3,6\}" src/components/bf/Notice.vue
```
Probe page `src/pages/bf-probe/41-bf-notice.vue` renders all three variants
side by side:
```bash
grep -q 'data-variant="warning"' .output/public/bf-probe/41-bf-notice/index.html
```
Contrast passes AA in light and dark modes (manual/axe check, documented in
Decisions if no automated contrast tool is wired in). Component adds no
colour literal. Fails today (no `bf/Notice.vue`), passes once done.

## Decisions

_Runner appends here._
