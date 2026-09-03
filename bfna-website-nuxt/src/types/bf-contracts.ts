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
  /**
   * Selected styling for the span/link/anchor modes. No emit — but not visual
   * only: it also carries a non-colour cue and, on the two interactive
   * branches, `aria-current` (gh#117 / #112).
   */
  active?: boolean
  /** Renders `<button type="button" aria-pressed>`, whatever `to`/`href` say. */
  toggle?: boolean
  /**
   * The `v-model` half of toggle mode. Drives `aria-pressed` and the selected
   * styling. Optional on purpose: left unbound the chip owns the state itself
   * and still emits on every activation (gh#117 / #111).
   */
  modelValue?: boolean
}

/**
 * Props of `bfMedia`.
 *
 * The two branches are decided by `src` alone, exactly as `wfMedia.vue`
 * decides them: a `src` renders the real image, no `src` renders the
 * crosshatch placeholder box. There is no `variant` prop and no way to ask
 * for the placeholder while holding a `src` — "no image yet" is a fact about
 * the data, not a presentation choice.
 *
 * `ratio` is deliberately **optional with no runtime default**. The default
 * (`16 / 9`, the same one `wfMedia.vue` ships) lives in the component's
 * `--_bf-media-ratio` declaration in `@layer components`, so an instance that
 * passes no `ratio` can be re-proportioned by a consumer's own stylesheet —
 * a class, an ancestor, `:has()`. An instance that *does* pass one gets the
 * property inline, which a consumer overrides through `style` on the
 * component (`$attrs` merges last and wins).
 *
 * That split is the reason this component exists. `wfMedia.vue` wrote
 * `aspect-ratio` into an inline `style` string, which no consumer rule can
 * outrank at any specificity, so the full-width Transponder card could not be
 * given the taller ratio its slot wanted.
 *
 * `alt` is required whenever `src` is set (BRIEF §5 rule 9). Omitting it is a
 * dev-time `console.warn`, not a silent `alt=""`; an explicit `alt=""` is the
 * decorative declaration and passes silently.
 */
export interface MediaProps {
  /** Image URL. Absent (or null) renders the placeholder box instead. */
  src?: string | null
  /**
   * Alternative text. Required whenever `src` is set; pass `''` deliberately
   * for a decorative image. Ignored on the placeholder branch, which is
   * `aria-hidden` — there is no content there to describe.
   */
  alt?: string | null
  /**
   * CSS `aspect-ratio` value for the box, e.g. `'16/9'`, `'3/2'`, `'1/1'`.
   * Omit it to inherit the component default and stay overridable from a
   * consumer stylesheet.
   */
  ratio?: string
}

/**
 * Which formatter `bfTime` uses for its visible label.
 *
 * A one-member union today, not a bare `string`. The spec reserves a `format`
 * prop for a future non-default formatter and builds only the `monthYear`
 * path — and a `string` prop that is silently ignored is a trap: `format="long"`
 * would typecheck, render `monthYear` anyway, and tell nobody. As a union the
 * reservation is kept (the prop exists, a later issue adds a member) while a
 * value that does not exist yet is a compile error instead of silence.
 *
 * Widening a union is source-compatible, so adding `'day'` or `'full'` later
 * breaks no existing call site.
 */
export type TimeFormat = 'monthYear'

/**
 * Props of `bfTime`.
 *
 * The atom's whole contract is a split between two audiences: the text node is
 * for a human, the `datetime` attribute is for a machine, and the machine one
 * is never allowed to be wrong. So `datetime` is **rebuilt from the parsed
 * date**, never echoed from `date` — a caller handing over `'March 5, 2022'`
 * (which `Date` parses and HTML does not accept) gets a normalised ISO value,
 * not an invalid attribute.
 *
 * `date` is **required but nullable**. Required because a date component with
 * no date is a call-site mistake worth catching; nullable because 20 of the 371
 * real insight rows carry `publish_date: null` and the spec's own null clause
 * demands the component take it. `null`, `undefined`, `''` and anything
 * `new Date()` cannot parse all render **nothing at all** — no element, rather
 * than a `<time>` reading `Invalid Date`.
 */
export interface TimeProps {
  /**
   * The date to render. An ISO date-only string (`'2014-12-17'`) or any string
   * `Date` can parse. `null`, `''` and unparseable input render no element.
   */
  date: string | null
  /**
   * Which label formatter to use. Only `'monthYear'` exists today, and it is
   * the default; the prop is the reservation for a second one.
   */
  format?: TimeFormat
}

/**
 * Props of `bfSkipLink`.
 *
 * One prop, because the atom is one anchor. The label is the default slot, not
 * a prop, so a caller can put an icon or a `<span>` in it without the component
 * growing a second way to say the same thing.
 */
export interface SkipLinkProps {
  /**
   * The fragment the link jumps to. Defaults to `'#main'` — the id the site
   * shell (issue 46/#55) puts on its `<main>` landmark.
   *
   * A fragment, not a route: this is an in-page jump by definition, so it is
   * rendered on a plain `<a href>` and never on a `NuxtLink`.
   *
   * **The target must be focusable for focus to actually move.** A browser
   * moves focus on fragment navigation only when the target can take it, so the
   * landmark carries `tabindex="-1"`. That is the shell layout's job, not this
   * component's — an atom cannot reach across the page to the element it names.
   */
  target?: string
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
