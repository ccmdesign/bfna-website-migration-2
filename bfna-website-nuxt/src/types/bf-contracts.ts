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
 * `default` paints `--color-text`; `white` paints `--color-text-inverse` (the
 * semantic alias added in gh#101; it was the `--color-white` primitive until
 * then) and is for dark grounds only — the lower band of the mark is an
 * inverted shape, so on a light ground the white variant is invisible
 * (inherited from `LogoWhite.vue`). Pair it with `--color-surface-inverse`.
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

/**
 * Visual variant of `bfButton`.
 *
 * `primary` is the filled treatment — the `bf-*` reading of
 * `.wf-button[data-variant="primary"]`. `default` is the base: bordered,
 * unfilled, and the value the component falls back to, so a caller that
 * passes no variant gets the wireframe's plain button.
 */
export type ButtonVariant = 'primary' | 'default'

/**
 * Props of `bfButton`.
 *
 * The element is resolved from the props rather than chosen by the caller:
 * `disabled` wins outright and renders `<button disabled>` (neither `<a>` nor
 * `NuxtLink` supports a native `disabled`, and a disabled-looking but still
 * clickable, still focusable link is the failure this avoids); otherwise `to`
 * renders `NuxtLink`, `href` renders `<a>`, and neither renders `<button>`.
 *
 * `size` is deliberately an open `string`, as the spec types it. The component
 * recognises `'s' | 'm' | 'l'`, mapping them onto the existing Utopia type
 * steps; any other value — and no value at all — inherits the surrounding font
 * size, which is what `.wf-button`'s `font: inherit` does. Because the padding
 * is expressed in `em`, the whole box scales with that one declaration.
 */
export interface ButtonProps {
  /** Internal route. Renders `NuxtLink`. A string path or a route-location object. */
  to?: string | Record<string, unknown>
  /** URL. Renders `<a href>`. Ignored when `to` is set. */
  href?: string
  /** Marks an `href` as leaving the site: renders the `[data-external]` hook. */
  external?: boolean
  /** Filled (`primary`) or bordered (`default`, the base). */
  variant?: ButtonVariant
  /** Type step. `'s' | 'm' | 'l'` are recognised; anything else inherits. */
  size?: string
  /** Renders a non-interactive, non-focusable `<button disabled>`, whatever `to`/`href` say. */
  disabled?: boolean
}

/**
 * Props of `bfChip`.
 *
 * Like `ButtonProps`, the element is resolved from the props rather than
 * chosen by the caller — but here the priority is `toggle` first, because
 * only a real `<button>` can carry the toggle contract. `NuxtLink` navigates
 * when activated and a `<span>` cannot take focus at all, so neither can be
 * an `aria-pressed` control. `toggle` therefore wins outright; passing it
 * alongside `to`/`href` is a caller mistake, and those props are ignored.
 *
 * With no `toggle`, `to` renders `NuxtLink`, `href` renders `<a>`, and
 * neither renders a `<span>` — the same three-way branch the wireframe chip
 * already demonstrates.
 *
 * `active` and `modelValue` are the same visual state reached two ways.
 * `active` is a **presentational** flag for the three non-interactive modes:
 * the chip looks selected and emits nothing. `modelValue` is the toggle
 * mode's `v-model` half: it drives both `aria-pressed` and the same selected
 * styling, and activation emits `update:modelValue` with the negated value.
 * In toggle mode `active` is ignored; outside it `modelValue` is.
 *
 * There is deliberately no `size` or `variant`. A chip is one size — its
 * padding is `em`-relative, so a caller changes the box by changing the font
 * size — and its only variable input is the selected state, which is why this
 * component ships a `[data-active]` rule instead of a `cssVars` style binding.
 */
export interface ChipProps {
  /** Internal route. Renders `NuxtLink`. A string path or a route-location object. */
  to?: string | Record<string, unknown>
  /** URL. Renders `<a href>`. Ignored when `to` is set. */
  href?: string
  /** Marks an `href` as leaving the site: renders the `[data-external]` hook. */
  external?: boolean
  /** Selected styling for the span/link/anchor modes. Visual only — no emit. */
  active?: boolean
  /** Renders `<button type="button" aria-pressed>`, whatever `to`/`href` say. */
  toggle?: boolean
  /** The `v-model` half of toggle mode. Drives `aria-pressed` and the selected styling. */
  modelValue?: boolean
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
