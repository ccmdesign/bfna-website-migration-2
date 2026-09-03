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

import type { z } from 'zod'
import type {
  bfInsightSchema,
  bfProjectSchema,
  bfProgramSchema,
  bfPersonSchema,
  bfPageSchema,
  bfAnnouncementSchema,
  bfPageLegacySchema
} from '../../content.config'

/** Grid-slot modifier shared by every card. `span: 'full'` renders as `data-span="full"`. */
export interface CardBaseProps {
  span?: 'full'
}

/**
 * Colourway of the `bfLogo` wordmark.
 *
 * `default` paints `--color-text`; `white` paints `--color-white` and is for
 * dark grounds only — the lower band of the mark is an inverted shape, so on a
 * light ground the white variant is invisible (inherited from `LogoWhite.vue`).
 */
export type LogoVariant = 'default' | 'white'

/**
 * Props of `bfLogo`.
 *
 * Size is deliberately **not** a prop: it is the CSS custom property
 * `--_bf-logo-size` (block-size, default `1.25rem`), set by the consumer
 * through `style` / a parent rule, so a caller can size the mark responsively
 * without a prop per breakpoint.
 */
export interface LogoProps {
  variant?: LogoVariant
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

/* -------------------------------------------------------------------------
 * Entity types — inferred from the `bf*` collection schemas (issue 09 / gh#18)
 * -------------------------------------------------------------------------
 * The zod schemas live in `content.config.ts`, next to the collections they
 * validate. They are re-exported here as inferred types so every `bf-*`
 * component, composable and page has exactly one import site for entity
 * shapes: `import type { Insight } from '~/types/bf-contracts'`.
 *
 * The import below is type-only, so this module still ships no runtime code
 * and no `@nuxt/content` runtime reaches the client bundle.
 */
/** One insight document, as stored in the `bfInsights` collection (371 rows). */
export type Insight = z.infer<typeof bfInsightSchema>

/** One project document, as stored in the `bfProjects` collection (38 rows). */
export type Project = z.infer<typeof bfProjectSchema>

/** One program document, as stored in the `bfPrograms` collection (3 rows). */
export type Program = z.infer<typeof bfProgramSchema>

/** One person document, as stored in the `bfPeople` collection (13 rows). */
export type Person = z.infer<typeof bfPersonSchema>

/** One static-page document, as stored in the `bfPages` collection (7 rows). */
export type Page = z.infer<typeof bfPageSchema>

/** The site-wide announcement — `bfAnnouncements` holds exactly one document. */
export type Announcement = z.infer<typeof bfAnnouncementSchema>

/** A `Page`'s provenance pointer into the legacy Directus records. */
export type PageLegacyRef = z.infer<typeof bfPageLegacySchema>
