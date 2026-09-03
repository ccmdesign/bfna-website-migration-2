/**
 * Shared prop contracts for the `bf-*` design system.
 *
 * Single home for every shared TS type used by `bf-*` components
 * (EPIC brief §5 rule 11). Later issues intersect these with the
 * zod-inferred entity types (issue 09). No `bf-*` component may
 * declare a shared type inline.
 *
 * Field shapes mirror their `wf-*` counterparts — `WfCta`
 * (`wfCtaSection.vue`), `WfCrumb` (`wfBreadcrumb.vue`),
 * `WfMenuItem` / `WfMenu` (`useWfContent.ts`) — same fields, `bf`-side
 * names, no `Wf` prefix. Types only: this module ships no runtime code.
 */

/** Grid-slot modifier shared by every card. `span: 'full'` renders as `data-span="full"`. */
export interface CardBaseProps {
  span?: 'full'
}

/** One breadcrumb node. `to` omitted marks the current (non-linked) page. */
export interface Crumb {
  label: string
  to?: string | Record<string, unknown>
}

/** A call to action. Use `to` for internal routes, `href` for external targets. */
export interface Cta {
  label: string
  to?: string
  href?: string
  external?: boolean
  primary?: boolean
}

/** One option in a filter control. `key` is the value, `label` the visible text. */
export interface Filter {
  key: string
  label: string
}

/** A single navigation or footer link. */
export interface MenuItem {
  label: string
  to?: string
  href?: string
  external?: boolean
  strong?: boolean
}

/** A navigation group. Either a link itself (`to` / `href`) or a parent of `items`. */
export interface Menu {
  label: string
  items?: MenuItem[]
  to?: string
  href?: string
  external?: boolean
}

/** One row of search results, as rendered by the search template. */
export interface SearchResultRow {
  slug: string
  heading: string
  to: string
  chip: string
  archived?: boolean
  date?: string
  score: number
}
