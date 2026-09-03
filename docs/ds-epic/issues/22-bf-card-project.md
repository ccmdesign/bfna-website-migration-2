# 22 — `bfCardProject` — typed project card wrapper

One-line objective: port `wfCardProject.vue` to a typed `bfCard` wrapper
consuming the `Project` entity type, preserving the media/chips/pending
matrix.

## Context

Depends on 20 (`bfCard` base), 16 (`bfChip`), 17 (`bfMedia`). Builds from
`src/components/wireframe/wfCardProject.vue`. Consumed by 42
(`bfGridProjects`), 47 (home "Featured projects" band, `media chips=false`),
51 (`/projects` index). Provenance: BF-193.

## Scope

- File: `src/components/bf/CardProject.vue` → `<bfCardProject>`.
- Props:
  ```ts
  interface Props {
    project: Project           // zod-inferred type from issue 09 (bfProjects schema)
    media?: boolean             // default false
    mediaRatio?: string         // default '3/2'
    chips?: boolean             // default true
    excerptLength?: number      // default 140
  }
  ```
- `inheritAttrs: false`, `<bfCard v-bind="$attrs">` root.
- Heading: the heading ALWAYS links to `/projects/<slug>` (with ↗ when
  `external_url` is set). `pending` only adds the "Copy pending" chip —
  exactly as `wfCardProject.vue` does. There is no unlinked branch. External
  projects append the ↗ marker (`aria-hidden="true"> ↗`) after the heading
  text when `project.external_url` is set, and the link itself becomes an
  external anchor with the `[data-external]` marker from issue 19.
- Excerpt: `project.excerpt ?? project.description`, truncated to
  `excerptLength` with ellipsis (same rule as issue 21 — text arrives
  already plain from the normaliser).
- `#chips` slot (only when `chips` is true and at least one of kind/
  external/pending applies, matching `hasChips` in the wf source):
  `kindLabel(project.kind)` chip, `"External platform"` chip when
  `external_url` is set, `"Copy pending {project.pending}"` chip when
  `project.pending` is set.
- `#media` slot filled only when `media` is true: `<bfMedia :src=
  "project.image" alt="" :ratio="mediaRatio" />` (decorative — `alt=""`,
  matching the wf-* comment on why: the heading already names the
  destination).

## Out of scope

- The full-width product variant — that is `bfCardProduct` (issue 26), a
  separate wrapper, not a prop on this one.
- Grid/column layout (issue 42).
- No edits under `pages/wireframes/` or `components/wireframe/` (D2).

## Styling

- No new CSS variables beyond `bfCard`'s and `bfMedia`'s existing hooks.

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
test -f src/components/bf/CardProject.vue
grep -q "mediaRatio" src/components/bf/CardProject.vue
```
Probe page `src/pages/bf-probe/22-bf-card-project.vue` renders the
media × chips 2×2 matrix (media on/off × chips on/off) plus one project with
`external_url` set and one with `pending` set:
```bash
grep -q "↗" .output/public/bf-probe/22-bf-card-project/index.html
grep -q "data-external" .output/public/bf-probe/22-bf-card-project/index.html
```
Fails today (no `bf/CardProject.vue`), passes once done.

## Decisions

_Runner appends here._
