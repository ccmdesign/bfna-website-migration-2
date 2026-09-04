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
  bfPageLegacySchema,
  bfEntityLegacySchema,
  bfProjectAkaSchema
} from '../../content.config'

/** Grid-slot modifier shared by every card. `span: 'full'` renders as `data-span="full"`. */
export interface CardBaseProps {
  span?: 'full'
}

/**
 * The heading level a card wrapper renders its title at.
 *
 * Exactly the three levels `bfCard`'s stylesheet supports. D-20.4 widened
 * every selector in that base — the stretched `::after`, the `:has()` hover
 * and focus rules, the `position: static` exemption — from the frozen skin's
 * bare `h3` to `:is(h2, h3, h4)`, and this union is the other half of that
 * decision: the same three levels, named once, so a wrapper cannot ask for a
 * level the base does not style.
 *
 * Not a `number`. `headingLevel="5"` would typecheck, render an `<h5>` the
 * base's selectors do not match, and silently ship a card whose entire hit
 * area and focus indicator are gone — the failure mode `TimeFormat`'s comment
 * describes for a silently-ignored `string` prop, with a worse consequence.
 */
export type CardHeadingLevel = 2 | 3 | 4

/**
 * Props shared by every typed card wrapper — `bfCardInsight`,
 * `bfCardProject`, and the four that follow (#32–#36).
 *
 * One member, and the reason it exists is [#128]: heading level is a function
 * of the **page outline**, not of the component. The same card correctly holds
 * an `h3` in a section under an `h2` and an `h4` in one under an `h3`
 * (BRIEF §5 rule 9 — one `h1`, sequential levels). Before this the wrappers
 * hard-coded `<h3>`, so a card placed in a subsection — which the templates in
 * #47/#49/#50/#51/#52 do — emitted a level jump that no probe looked for.
 *
 * ## Why this is separate from `CardBaseProps`
 *
 * They look like they should merge and they must not. `span` is `bfCard`'s own
 * prop and is deliberately **undeclared** on the wrappers (D-21.2): it falls
 * into `$attrs`, and `v-bind`ing `$attrs` onto a component matches it against
 * that component's declared props, so it arrives at the base as a prop without
 * six wrappers redeclaring a one-member union. `headingLevel` cannot travel
 * that road — `bfCard` renders no heading at all, so there is nothing on the
 * base for it to match — and the wrapper is the only thing that can act on it.
 * Two interfaces, two audiences.
 *
 * ## Why the default lives in each wrapper
 *
 * The type says a level is optional; `withDefaults(…, { headingLevel: 3 })` in
 * each wrapper says which one you get. `3` is the no-change value — it is what
 * every wrapper hard-coded and what every existing call site renders — so
 * adopting this prop moves no pixel until a caller asks it to.
 *
 * [#128]: https://github.com/ccmdesign/bfna-website-migration-2/issues/128
 */
export interface CardWrapperProps {
  /**
   * The heading element the wrapper renders — `2`, `3` or `4`, as
   * `<component :is="`h${headingLevel}`">`. Defaults to `3`.
   *
   * Set it from the *page*, matching the section the card group sits in. A
   * card under an `h2` section heading takes the default; one in a subsection
   * whose heading is an `h3` takes `4`.
   */
  headingLevel?: CardHeadingLevel
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
 * Props of `bfFilterBar` (issue 30 / gh#39).
 *
 * A multi-select facet row: one `bfChip[toggle]` per entry in `filters`, with
 * `modelValue` holding the **`key`s** of the selected ones.
 *
 * `Filter['key']`, not a bare `string`, on purpose. The spec's prose says the
 * component toggles "its `value`" in and out of the array; the `Filter`
 * contract above — which the spec itself points at, and which is older than
 * that sentence — names the field `key`. The alias makes the relationship
 * checkable rather than conventional: rename `Filter.key` and every consumer
 * of this array is re-typed with it. It is still assignable from `string`, so
 * a page reading its facets out of a route query needs no cast.
 *
 * The array is **replaced, never mutated** — the component emits a new one on
 * every toggle, so a consumer holding the old array (a history stack, a
 * `watch` on identity) sees a real change.
 */
export interface FilterBarProps {
  /** The facets to render, in display order. One toggle chip each. */
  filters: Filter[]
  /**
   * The selected `Filter['key']`s. A key not present in `filters` renders no
   * chip but survives every round trip untouched — pages own their filter
   * vocabulary, and this component must not silently drop part of it.
   */
  modelValue: Array<Filter['key']>
  /**
   * The group's accessible name (`aria-label` on `role="group"`).
   *
   * Defaults to the generic `"Filters"`, which is the spec's instruction and
   * is only ever right for a bar that is alone on its page. Two bars sharing
   * one page — the search template's Program and Format facets, which is the
   * call site this component exists for — must each pass their own name, or
   * a screen-reader user hears the same group twice.
   */
  label?: string
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
 * `alt` is required, full stop (BRIEF §5 rule 9; a11y BRIEF D25). Omitting it
 * is a **typecheck error**, not a dev-time warning and not a silent `alt=""`;
 * an explicit `alt=""` is the decorative declaration and passes silently.
 *
 * Required on the prop rather than on the `src`-bearing branch alone, because
 * `defineProps<T>()` cannot make one prop's requiredness depend on another's
 * value and a discriminated union would cost every call site a cast. The
 * placeholder branch ignores the value it is handed — it is `aria-hidden`, so
 * there is nothing there to describe (gh#222).
 */
export interface MediaProps {
  /** Image URL. Absent (or null) renders the placeholder box instead. */
  src?: string | null
  /**
   * Alternative text. **Required** — pass `''` deliberately for a decorative
   * image, and a real string for one that carries information. Ignored on the
   * placeholder branch, which is `aria-hidden` — there is no content there to
   * describe.
   *
   * Not `string | null`: `null` is the shape the content layer will use for
   * "no string written yet" (#234 / D28), and accepting it here would let that
   * absence reach an `alt` attribute as `""` — the same silent decorative
   * claim this contract exists to prevent.
   */
  alt: string
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
 * Props of `bfByline` — the article byline.
 *
 * ## `author` is a string, and the caller does the joining
 *
 * The real field is `Insight['authors']: string[]`, and the obvious contract is
 * therefore an array. It is deliberately not one. A byline that accepts an
 * array has to own the join — which separator, which conjunction, an Oxford
 * comma or not, what "et al." threshold — and every one of those is an
 * editorial decision that belongs to the page, not to a presentational
 * molecule. The frozen wireframe already made the call at the call site
 * (`insights/[slug].vue:8`: `insight.authors.join(', ')`), and this contract
 * keeps it there.
 *
 * ## `date` is optional *and* nullable
 *
 * The spec types it `string`. It is widened here to `string | null` because
 * the value that will be passed is `Insight['publish_date']`, which
 * `content.config.ts` declares `z.string().nullable()` — 20 of the 371 rows
 * are `null` — and because `bfTime`, which receives it, already types its own
 * `date` the same way. Widening an optional prop is source-compatible; the
 * narrow version would have made every call site write `?? undefined`.
 *
 * ## What an empty `author` means
 *
 * **268 of the 371 real insight rows carry an empty `authors` array.** The
 * empty case is the ordinary path, not an edge case, and the component's
 * answer to it is the same one `bfTime` gives an unparseable date: an empty or
 * whitespace-only `author` renders no `By …` text, and a byline with neither a
 * usable author nor a usable date renders **no element at all** rather than an
 * empty flex container that contributes a phantom `gap` to its parent. The
 * wireframe's literal `By [author]` placeholder is a data-gap marker and is
 * never rendered.
 *
 * ## No relationship to the footer credit
 *
 * This is the *article* byline. The similarly-named organism under
 * `src/components/ds/organisms/` is a copyright/attribution line for the page
 * footer, is unrelated in purpose, and is left untouched by gh#38. They do not
 * collide: Nuxt registers them under distinct names (see
 * `docs/ds-epic/issues/29-bf-byline.md` § Decisions).
 */
export interface BylineProps {
  /**
   * The author line, already joined. `'Anthony T. Silberfeld'`, or
   * `'Courtney Flynn Martino, Brandon Bohrn'` — never an array.
   */
  author: string
  /**
   * ISO date string, handed straight to `bfTime`, which owns every question
   * about parsing it and about what a `datetime` attribute may contain.
   */
  date?: string | null
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

/**
 * Props of `bfAccordion`.
 *
 * Two props, and neither of them is state. The component is a *skin* over a
 * native `<details>`/`<summary>`, so the open/closed question is answered by
 * the DOM element itself, exactly as it is on a page with no JavaScript at all
 * — which is why there is no `modelValue`, no `expanded`, and no `update:open`
 * event here to keep in sync with it.
 */
export interface AccordionProps {
  /**
   * The summary text — a plain string, not a slot.
   *
   * The wireframe's archive page writes `<summary><strong>{{ y.year }}</strong>
   * ({{ y.items.length }})</summary>`, and the caller (issue 55) composes that
   * `'2024 (17)'` string before passing it in. A richer summary — a count as a
   * real badge with its own markup — would be a `summary` slot, added as a
   * **second** occurrence under the rule of three, not speculatively now.
   */
  label: string
  /**
   * The **initial** open state, mapped straight onto the `open` content
   * attribute. Not a two-way binding and not tracked afterwards: once the
   * browser has toggled the element the DOM property and this prop disagree,
   * and that is correct — the user's interaction is the source of truth, and
   * nothing re-renders the node to overwrite it.
   *
   * A caller wanting *controlled* disclosure wants a different component; this
   * one deliberately declines to grow one, because the value of native
   * `<details>` is that its keyboard contract and its tab-order behaviour are
   * the browser's job rather than ours.
   */
  open?: boolean
}

/**
 * Props of `bfLoadMore`.
 *
 * Five props and one event, and **none of them is pagination state**. The
 * component never learns what a page is, never slices an array and never holds
 * a cursor: the caller keeps its own `visible` ref exactly as
 * `pages/wireframes/insights/index.vue` does today (`visible += 24`) and
 * increments it in the `@load` handler. Everything here is a question the
 * caller has already answered and is passing down as a rendered fact.
 */
export interface LoadMoreProps {
  /**
   * Is there anything left to load? The caller's `filtered.length > visible`,
   * computed by the caller.
   *
   * `false` removes the button — the wireframe's own behaviour, where the whole
   * `<p>` carries `v-if="filtered.length > visible"` and the control simply is
   * not there once everything is on the page. It does **not** remove the live
   * region when the caller is announcing counts; see `visibleCount`.
   */
  hasMore: boolean
  /**
   * A load is in flight. Renders the button `disabled`, so it cannot be
   * double-fired.
   *
   * Optional and, for the insights feed, never set: that caller slices a
   * build-time-static array synchronously, so there is no flight to be in. It
   * exists for a caller that fetches.
   */
  loading?: boolean
  /**
   * The button's label. Defaults to `'Load more'`.
   *
   * The wireframe writes a richer string — `Load more (128 remaining)` — and
   * the remainder in it is the caller's arithmetic, not this component's, so
   * the caller composes that string and passes it whole. There is deliberately
   * no `remaining` prop and no template to interpolate: two ways to say the
   * same thing is one way too many.
   */
  label?: string
  /**
   * How many items are on the page right now, and how many exist in total.
   *
   * Together they drive one visually-hidden `aria-live="polite"` region —
   * *"Showing 48 of 354 items"* — which is the only reason a sighted-mouse
   * interaction pattern like this is usable with a screen reader at all:
   * without it, activating the button appends items far below the control and
   * announces nothing whatsoever.
   *
   * **Both or neither.** With either omitted the component announces nothing,
   * which is the spec's default and the configuration in which `hasMore=false`
   * renders literally nothing — no element at all.
   *
   * With both supplied, the region **outlives the button**: at `hasMore=false`
   * the button is removed and the region is not. A live region only announces a
   * mutation observed inside a region that was already in the accessibility
   * tree, so a region removed in the same tick as its final update announces
   * nothing on the load that matters most — the last one, where the control
   * also vanishes. The region is `position: absolute` and clipped, so it
   * occupies no space and paints no pixel either way.
   */
  visibleCount?: number
  /** @see {@link LoadMoreProps.visibleCount} — both or neither. */
  totalCount?: number
}

/**
 * The rank `bfEmptyState` renders its heading at (residual #173).
 *
 * Includes `1`, unlike {@link CardHeadingLevel}, because `1` is the **default**
 * and the whole existing contract: an empty state is what a page shows
 * *instead of* its content, so its heading is the page's `<h1>`. The other
 * three exist for the case #173 found — a block shown *inside* a populated
 * page whose header already owns the `h1`, where a second one is a WCAG
 * violation rather than a style choice.
 */
export type EmptyStateHeadingLevel = 1 | 2 | 3 | 4

/**
 * Props of `bfEmptyState` — and therefore of `bfNotFound`, which is the same
 * component under a second auto-import name, not a second contract.
 *
 * Five props and a default slot, for a block whose whole job is to be the
 * *only* thing on a page: a 404, a hub with nothing published in it yet, a
 * search that matched nothing. It is deliberately not a general-purpose
 * message panel — the heading is the tell. At its default rank this component
 * can be used once per page (BRIEF §5 rule 9), which is exactly the constraint
 * an empty *state* wants and exactly the wrong one for an inline notice.
 */
export interface EmptyStateProps {
  /**
   * The page heading, rendered as the one `<h1>`. Required, and there is no
   * default: *"Unknown program"*, *"Insight not found in content.json"* and
   * *"Unknown project"* are three different sentences at the three call sites
   * this replaces, and a component that invented a fourth generic one would
   * make every caller worse.
   */
  heading: string
  /**
   * An optional sentence under the heading. Absent by default — none of the
   * three wireframe call sites writes one; it exists for the 404 route
   * (issue 56) and the empty-results states (48/50/52), which have something
   * more to say than the heading alone.
   */
  message?: string
  /**
   * The back link's visible text and destination. **Both or neither.** With
   * one of the two supplied the link is not rendered at all, rather than
   * emitting an anchor with no accessible name (`backLabel` missing) or a
   * label that goes nowhere (`backTo` missing) — the same failure #130 named
   * for the card wrappers, at a smaller scale.
   *
   * `backTo` is a router destination, handed to `NuxtLink`'s `to`. The link is
   * a plain `NuxtLink`, not a `bfButton`: the wireframe block writes a bare
   * link with no `.wf-button`, and a way back out of a dead end is navigation,
   * not a primary call to action.
   */
  backLabel?: string
  /** @see {@link EmptyStateProps.backLabel} — both or neither. */
  backTo?: string
  /**
   * The heading's rank. Defaults to `1` (residual #173).
   *
   * The default is what every call site written before #173 relies on, so it
   * is `1` rather than the card wrappers' `3`: this component's contract is
   * "the page's heading", and only a caller that knows its page already has an
   * `h1` — an empty *results* band under a `bfPageHeader`, `bfSearchShell`'s
   * no-matches branch — may lower it.
   *
   * Lowering the rank changes the element and nothing else. There is no
   * corresponding size change: the type scale is `@layer defaults`' business,
   * and a caller that wants a smaller heading is asking for a different
   * component.
   */
  headingLevel?: EmptyStateHeadingLevel
  /**
   * Announce the block to assistive technology when it appears.
   *
   * `true` renders `role="status"` (an implicit `aria-live="polite"` region);
   * `false` — the default — renders no `role` attribute at all. Deliberately
   * the same name, the same type, the same default and the same rendered
   * binding as {@link NoticeProps.announced} (`Notice.vue:111`): two
   * components that make the same decision should not make it two ways
   * (a11y BRIEF D27).
   *
   * **Opt-in, never inferred.** The distinction is behavioural, not
   * structural. A block present at first render that never changes — a
   * prerendered "nothing here yet" band — is not a live region: an
   * `aria-live` element that is never updated is noise in the accessibility
   * tree, and its text is read by the document pass anyway. A block *swapped
   * in* after a user action — the error page a client-side navigation lands
   * on, a results list that a filter emptied — replaces the page's content
   * silently unless it is announced. Nothing in the markup tells the two
   * apart, so the caller says which it is.
   *
   * The announcement is the element itself, always mounted and carrying its
   * own text (a11y BRIEF D29). It is never a hidden node toggled into view:
   * `display: none` takes an element out of the accessibility tree, which
   * silences the region it was meant to be.
   */
  announced?: boolean
}

/**
 * Props of `bfHero` — the homepage hero band.
 *
 * Two optional strings and a default slot, which is the whole contract: the
 * copy is data (`pages.json`'s `home` row supplies both) and the actions vary
 * per call site, so they arrive as slot content rather than as a prop-shaped
 * list of links.
 *
 * Both props are `string | null` rather than `string | undefined`, because
 * that is what the caller has: the home page passes `home?.heading` straight
 * out of a content record whose absent fields are `null`, and a contract that
 * only accepted `undefined` would push a `?? undefined` onto every call site
 * for no gain.
 *
 * There is deliberately **no heading-rank prop**. `bfHero` renders the page's
 * `<h1>`, unconditionally and un-negotiably — the same reasoning as
 * `bfEmptyState` (gh#42) and the opposite of the card wrappers (#128), which
 * take one precisely because several appear on one page. A hero appears once,
 * at the top, and is what the page is about; a caller that wants this shape
 * lower down wants `bfPageHeader` (issue 38) or a section heading, not a
 * second `h1`. BRIEF §5 rule 9 is then satisfied by construction rather than
 * by every caller remembering.
 */
export interface HeroProps {
  /**
   * The page heading, rendered as the one `<h1>`. Optional and nullable to
   * match the data, but the `<h1>` element itself is **not** conditional: a
   * hero with no heading is a caller bug, and an empty `<h1>` is the honest
   * render of it. Dropping the element instead would leave the page silently
   * without a top-rank heading, which is the worse failure of the two.
   */
  heading?: string | null
  /**
   * A standfirst under the heading, capped at the `normal` measure. Absent or
   * `null` renders no `<p>` at all — not an empty one.
   */
  description?: string | null
  /**
   * A photograph behind the band. gh#253.
   *
   * **Prefer a root-relative local path** — `/images/hero/homepage.jpg`.
   * `bfMedia` routes those through `NuxtImg` and gets a real srcset, and
   * hands an absolute `https://` URL to the browser untouched with none
   * (`bfMedia`'s `isAbsolute` predicate), so a Directus URL here is a silent
   * performance regression rather than an error.
   *
   * Absent or `null` and the band paints nothing at all — no scrim, no
   * `data-scrim`, no colour — which is exactly what it did before this prop
   * existed.
   */
  image?: string | null
  /**
   * The photograph's alternative text, `''` by default because a hero image
   * is normally decorative: the `<h1>` carries the meaning and describing the
   * scenery would announce it ahead of the page's own name. Pass a real
   * string for a photograph that genuinely carries information.
   */
  imageAlt?: string
  /**
   * Which scrim treatment the band wears. Ignored without an `image`.
   */
  scrim?: ScrimMode
}

/**
 * The two scrim treatments, on one `data-scrim` attribute. gh#253.
 *
 * - `full` — a flat `--color-scrim` (navy at 0.70) over the whole band. The
 *   default, and the bold dark treatment: 0.70 is the first alpha at which
 *   white clears 4.5:1 over a blown-out white photograph.
 * - `panel` — `--color-scrim-panel` (0.94) as a near-opaque column behind the
 *   copy, photograph uncovered either side.
 *
 * Shared by `HeroProps` and `bfPageHeader`'s local prop bag, which is why it
 * is declared here rather than inline in either (BRIEF §5 rule 11).
 */
export type ScrimMode = 'full' | 'panel'

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

/**
 * An `Insight`'s or `Project`'s provenance pointer into the legacy records
 * (gh#151 / BF-218 F2) — the old-URL source issue #57's cutover redirect map
 * is built from.
 *
 * Deliberately not `PageLegacyRef`: insight/project rows carry a
 * `product_type` pages do not, and their `id` is a contentful `string` as
 * often as a directus `number`, where every page row's is `null`. Same idea,
 * two value domains, two types (D-151.3).
 */
export type EntityLegacyRef = z.infer<typeof bfEntityLegacySchema>

/** One former slug of a `Project`, kept so #57 can redirect the old URL. */
export type ProjectAka = z.infer<typeof bfProjectAkaSchema>

/* -------------------------------------------------------------------------
 * Card wrappers that arrive after the entity types
 * ------------------------------------------------------------------------- */

/**
 * The union `bfCardRow` accepts.
 *
 * Named here rather than written inline in `CardRow.vue` because it is a
 * shared shape by construction: issue 43 (`bfSearchShell`) and issue 55 (the
 * `/archive` accordion) both build arrays of it to feed the row, and a union
 * spelled three times drifts in three directions. BRIEF §5 rule 11.
 *
 * The two members have no discriminant field of their own — neither schema
 * carries a `type` or `__typename` — so the component narrows structurally.
 * See `isInsight` in `CardRow.vue` for which field does the work and why the
 * obvious candidate does not.
 */
export type CardRowItem = Insight | Project

/**
 * Props of `bfCardRow` — the dense list row.
 *
 * `item` is the whole entity, never a handful of extracted fields, for the
 * same reason `bfCardInsight` takes an `Insight`: the caller has the row, the
 * component knows what a row looks like, and a `heading` + `to` + `chip` +
 * `date` prop list is a second, undeclared schema that drifts from the first.
 * It is also what lets one `v-for` over a mixed array render both entity
 * types, which is this component's whole reason to exist.
 *
 * `variant` is deliberately an open `string`, exactly as the spec types it.
 * There is no `wf-*` precedent to name values from — the wireframe left this
 * row un-componentised — so a union invented here would be a guess with a
 * compile error attached. It renders as `data-variant` and styles nothing on
 * its own; the two real consumers (#43, #55) are what will name its values,
 * and widening a `string` to a union later is the cheap direction.
 *
 * This is the one place in the `bf-*` set where an open `string` is right, and
 * it is the opposite call from `TimeFormat`: there, a silently-ignored value
 * would render the wrong *content*; here, an unrecognised `variant` renders an
 * inert attribute that changes nothing, which is a visible no-op rather than a
 * lie.
 */
export interface CardRowProps extends CardWrapperProps {
  /** One `bfInsights` **or** one `bfProjects` row. Passed whole. */
  item: CardRowItem
  /** Presentation hint, rendered as `data-variant`. Styles nothing by itself. */
  variant?: string
}

/**
 * Props of `bfFormField` — one labelled control, and nothing else.
 *
 * Builds from the three hand-rolled idioms in `wfContactSection.vue:8-10`:
 *
 * ```html
 * <label class="stack" data-gap="2xs">Name<input type="text"></label>
 * <label class="stack" data-gap="2xs">Email<input type="email"></label>
 * <label class="stack" data-gap="2xs">Message<textarea rows="4" /></label>
 * ```
 *
 * Three near-identical blocks whose association is *implicit* — the control is
 * a descendant of the label, which is valid HTML and is also the arrangement
 * that quietly stops working the moment anything is added between them, and
 * that gives the hint and the error text nowhere to attach. This contract
 * replaces it with an explicit `for`/`id` pair plus the two ARIA references a
 * described, invalid control needs.
 *
 * **No validation and no submission.** `hint` and `error` are caller-supplied
 * strings; nothing here computes whether a value is valid, and there is no
 * `form` element and no `@submit` (spec § Out of scope — that is issue 44's).
 */
export interface FormFieldProps {
  /**
   * The visible label text, and the control's accessible name.
   *
   * A string rather than a slot. The three wireframe occurrences are bare text
   * nodes (`Name`, `Email`, `Message`), so there is no second, richer case to
   * generalise from — and a slot here would put arbitrary markup inside the
   * element whose text content *is* the accessible name, which is the failure
   * `bfAccordion` avoided at `::marker` and `bfBreadcrumb` at its separator.
   */
  label: string
  /**
   * The control's value. Paired with `update:modelValue`, so `v-model` works.
   *
   * Required, not optional-with-a-default: a text control's value is `''` when
   * empty, and a component that accepted `undefined` would be choosing between
   * an uncontrolled input and a controlled one on a per-render basis. The
   * caller owns the state; this component never holds it.
   */
  modelValue: string
  /**
   * The control to render. `'textarea'` renders a `<textarea>`; anything else
   * becomes `<input :type="type">`. Defaults to `'text'`.
   *
   * Deliberately an open `string`, exactly as the spec types it — the same
   * call as `CardRowProps.variant` and for the same reason. The HTML input
   * type list is the platform's, not this design system's, and a union
   * invented here would reject `'tel'` or `'url'` with a compile error on
   * behalf of a rule nobody wrote. An unrecognised value degrades the way the
   * platform already degrades it: an unknown `type` renders as `text`.
   *
   * `'checkbox'` and `'radio'` are **not** in scope. Their value is a
   * `checked` boolean, not a string, so they do not fit this contract and
   * would need their own; the wireframe contains neither.
   */
  type?: string
  /**
   * Marks the control `required`.
   *
   * The **attribute** is what reaches the accessibility tree; the visual `*`
   * the component renders alongside the label is `aria-hidden`, so it is not
   * read out as punctuation inside the accessible name.
   */
  required?: boolean
  /**
   * Supporting text, referenced from the control's `aria-describedby`.
   *
   * A hint is not an error and does not become one: both may be present at
   * once, and when they are, **both** ids appear in `aria-describedby`,
   * space-separated per the ARIA spec, hint first.
   */
  hint?: string
  /**
   * An error message, referenced from `aria-describedby` and accompanied by
   * `aria-invalid="true"` on the control.
   *
   * Caller-supplied. Setting it is the *only* thing that puts the control in
   * its invalid state — this component runs no validation and reads no
   * `:invalid` pseudo-class, so a caller that has not decided a field is wrong
   * never gets a red control for free.
   */
  error?: string
}

/**
 * Props of `bfFormGroup` — a `<fieldset>`/`<legend>` around a set of fields.
 *
 * One prop, one slot. The group exists because a set of related controls needs
 * a *group* name in the accessibility tree, and `<fieldset>`/`<legend>` is the
 * only native construct that provides one; every ARIA re-implementation of it
 * (`role="group"` + `aria-labelledby`) is a strictly worse copy of what the
 * two elements already do.
 *
 * Spacing is the composition layer's, through `data-gap` on the root — not a
 * prop. See the gap hook in `FormGroup.vue` for why a components-layer value
 * would make that documented API inert.
 */
export interface FormGroupProps {
  /**
   * The group's name, rendered as the `<legend>`.
   *
   * Required and a string, for the same reason `label` is on the field: a
   * `<fieldset>` with no `<legend>` is a group with no accessible name, which
   * is worse than no group at all — it adds a boundary that a screen reader
   * announces and cannot describe.
   */
  legend: string
}

/**
 * The composition primitive `bfSection` lays its inner box out with.
 *
 * Exactly the four values `wfSection` accepts, unchanged — three CUBE
 * primitives plus an escape hatch:
 *
 * | value      | inner box            | what it is for                       |
 * |------------|----------------------|--------------------------------------|
 * | `stack`    | `center \| stack`     | the default: a column with a rhythm  |
 * | `switcher` | `center \| switcher`  | media beside text, stacking narrow   |
 * | `cluster`  | `center \| cluster`   | a row of small things that wraps     |
 * | `plain`    | `center`             | no primitive, and **no** `data-gap`  |
 *
 * There is deliberately **no `split` and no `video` value.** The inventory
 * asks `bfSection` to absorb the "split section" and "video section" variants
 * as `layout` options rather than as separate components, and the spec permits
 * recording that `switcher` already covers them if no `wf-*` evidence of
 * distinct markup exists. All 26 `wf-section` call sites under
 * `pages/wireframes/` were surveyed: one passes `layout="switcher"` (the
 * Bertelsmann Stiftung band on `about.vue` — media beside text, which *is* the
 * split shape), one passes `layout="plain"`, the rest take the `stack`
 * default, and no video band exists anywhere in the wireframe layer. Inventing
 * a `split` value would ship a synonym for `switcher`, and a `video` value
 * would ship a layout with nothing to lay out. See the spec's Decisions.
 */
export type SectionLayout = 'stack' | 'switcher' | 'cluster' | 'plain'

/**
 * Props of `bfSection` — the base band every template composes.
 *
 * Evolves `components/wireframe/wfSection.vue` (frozen, D2 — read, never
 * edited). The prop list is that component's, plus `fullWidth`; the two
 * behavioural changes are that `fullWidth` has real CSS behind it instead of
 * being the documented no-op it is upstream, and that no prop of this
 * interface can reach the DOM as an attribute (`inheritAttrs: false` plus a
 * filtered, explicit `v-bind="$attrs"` on the root — see `Section.vue`).
 *
 * Presentational-only (D8): props in, one slot, nothing out.
 */
export interface SectionProps {
  /**
   * The band's name. Rendered as `data-label` on the root `<section>` — the
   * hook the wireframe skin turns into a corner tag, kept here as a stable
   * identifier a template or a test can select a band by.
   *
   * Not an accessible name: a band that needs one gets `heading`, which is a
   * real `<h2>` in the document outline. `data-label` is invisible to the
   * accessibility tree by design.
   */
  label?: string
  /**
   * The band's heading, rendered as an `<h2>` when given and as no element at
   * all when not — `wfSection`'s own `v-if`, kept.
   *
   * The rank is fixed at 2 and there is no `headingLevel` prop, unlike the
   * card wrappers (#128). A section is a top-level division of a page whose
   * `<h1>` belongs to `bfHero` or `bfPageHeader`; a caller that wants a
   * deeper rank wants a heading inside the slot, not a differently-ranked
   * band. Fixing it here is what keeps BRIEF §5 rule 9's "sequential heading
   * levels" true by construction for every template that composes this.
   */
  heading?: string
  /**
   * Rhythm inside the band, as a step on the space scale (`3xs`…`3xl`).
   * Rendered as `data-gap` on the inner box and resolved entirely by
   * `@layer composition` — this component states no spacing value of its own.
   *
   * A `string` rather than a union of the nine steps, because that is
   * `wfSection`'s contract and because the composition layer degrades
   * gracefully: an unknown value simply leaves the primitive's default in
   * place. Ignored when `layout` is `plain`, which renders no primitive and
   * therefore no `data-gap`.
   */
  gap?: string
  /** Which composition primitive lays the inner box out. Default `stack`. */
  layout?: SectionLayout
  /**
   * Line-length cap for the inner box, as a step on the measure scale
   * (`narrow` | `normal` | `wide` | `full`). Rendered as `data-measure` and
   * honoured universally since issue 05, not only through `.center`.
   */
  measure?: string
  /**
   * Give the band its own vertical padding, from
   * `--_bf-section-padding-block`.
   *
   * A modifier class, **never** an inline `style="padding-block: …"`. The wf
   * source binds one, and that inline style is precisely the "junk on the
   * DOM" pattern this component exists to retire: an inline declaration also
   * cannot be outranked by an ordinary rule, so a consumer that wanted a
   * different band padding would have to escalate to `!important` (the
   * `bfMedia` lesson from gh#26).
   */
  padded?: boolean
  /**
   * Break the band out of its container to the viewport edge.
   *
   * **This is the defect this issue fixes.** `ccmSection` documents the prop
   * and ships no CSS for it, and `wfSection` carries the same shape; here it
   * is a real break-out rule in `@layer components`, hooked on
   * `--_bf-section-full-width`. See `Section.vue` for the rule and for the
   * `100vw`/scrollbar caveat.
   */
  fullWidth?: boolean
}

/**
 * Which of the three token triplets `bfNotice` paints itself with (issue 41).
 *
 * A closed union rather than a `string`, unlike `SectionProps['gap']`: those
 * degrade gracefully because the composition layer simply leaves a primitive's
 * default in place for an unknown value, whereas an unknown `variant` here
 * matches no `[data-variant]` rule and silently renders the `note` colourway
 * under a `data-variant` attribute that claims otherwise.
 */
export type NoticeVariant = 'note' | 'info' | 'warning'

/**
 * `bfNotice` — the notice / banner box (issue 41), componentising the raw
 * `.wf-note` used at `pages/wireframes/search.vue` (×2) and
 * `pages/wireframes/insights/[slug].vue` (frozen, D2 — read, never edited).
 *
 * Content is the default slot, not a prop: two of the three call sites carry
 * inline markup (a link in the archive banner), which a string prop could only
 * carry as `v-html`.
 */
export interface NoticeProps {
  /**
   * The colourway. Default `note` — the neutral, which is what all three
   * wireframe call sites render today.
   *
   * Every variant is drawn from semantic tokens that already exist
   * (`--color-base-*`, `--color-info*`, `--color-warning*`); the component
   * introduces no colour value of its own (BRIEF §5 rule 2).
   */
  variant?: NoticeVariant
  /**
   * Announce the notice to assistive technology when it appears.
   *
   * `true` renders `role="status"` (an implicit `aria-live="polite"` region);
   * `false` — the default — renders no `role` attribute at all.
   *
   * **Opt-in, never inferred.** The distinction is behavioural, not structural:
   * a notice that can appear at runtime in response to user action (the search
   * "no records matched" message) must be announced, while one present at first
   * render that never toggles (the semantic-search caveat, the insight archive
   * banner) must not — a live region that is never updated is noise in the
   * accessibility tree. Nothing in the markup distinguishes the two, so the
   * caller says which it is. See the spec's Decisions section for the call.
   */
  announced?: boolean
}

/* -------------------------------------------------------------------------
 * Grid organisms (issue 42 / gh#51)
 * ------------------------------------------------------------------------- */

/**
 * A `.grid` minimum track width — the six values `composition/grid.css` maps.
 *
 * | value | track floor |     | value | track floor |
 * |-------|-------------|-----|-------|-------------|
 * | `xs`  | 160px       |     | `l`   | 300px       |
 * | `s`   | 200px       |     | `xl`  | 400px       |
 * | `m`   | 240px (also the unset default) | | `2xl` | 500px |
 *
 * **Deliberately not `string`,** which is how issue 42's spec sketches the
 * prop. `grid.css` resolves the floor through six `[data-min-width="…"]`
 * attribute rules and nothing else, so a value outside this set writes an
 * attribute that matches no rule: the grid keeps the unset `240px` default and
 * lays out at a column count the caller did not ask for, with a
 * `data-min-width` in the DOM claiming otherwise. A union makes that a compile
 * error instead of a layout bug nobody looks for. Recorded as D-42.1.
 *
 * The values are keywords rather than lengths on purpose — the mapping is the
 * composition layer's to own (D9), so a floor can be retuned in one stylesheet
 * without touching a call site.
 */
export type GridMinWidth = 'xs' | 's' | 'm' | 'l' | 'xl' | '2xl'

/**
 * Props shared by `bfGridInsights` and `bfGridProjects` (issue 42 / gh#51) —
 * everything except the entity array and the per-row `extraChips` function.
 *
 * Both grids are thin data-in/cards-out organisms: a `<ul class="grid">` that
 * `v-for`s a typed card wrapper, fetching nothing (BRIEF D8). Their whole
 * configurable surface is this interface plus the array, which is why it is
 * worth naming once — the two components are built together under BRIEF §5
 * rule 5's named-bundle exception precisely because they are the same shape.
 */
export interface GridProps {
  /**
   * Column policy, as a track floor. Forwarded verbatim to the `<ul>`'s
   * `data-min-width`; the column count is resolved from it by `auto-fill` and
   * is **never authored** (D9 — no `bf-*` file may ship a hand-pinned
   * `grid-template-columns`).
   *
   * Each grid sets its own default to approximate the frozen `wf-*` source's
   * pinned column count at a desktop width — see D-42.2 for the arithmetic.
   */
  minWidth?: GridMinWidth
  /**
   * Character budget handed to every card's own `excerptLength`.
   *
   * Left unset it stays `undefined` and each card's default (`140`) applies,
   * rather than the grid restating a number that would then drift.
   */
  excerptLength?: number
  /**
   * The heading level every card in the grid renders its title at (#128).
   *
   * The grid is the only thing standing between a template's section heading
   * and the cards, so a template placing a grid inside a subsection has no
   * other way to reach `CardWrapperProps.headingLevel`. Forwarded, never
   * re-decided: unset here means unset on the card, where the `3` default is.
   */
  headingLevel?: CardHeadingLevel
}

/**
 * Props of `bfGridInsights` — THE insights grid, wrapping `bfCardInsight`.
 *
 * Ports `components/wireframe/wfGridInsights.vue` (frozen, D2), whose comment
 * records that this is the grid used *everywhere* insights are listed
 * (Claudio, Aug 3); the homepage's featured 2-col band is deliberately a
 * different grid and is not this component.
 */
export interface GridInsightsProps extends GridProps {
  /** The rows to render, in order. One `<li>` each, keyed on `slug`. */
  insights: Insight[]
  /**
   * Extra chips for one row, applied **per row by the grid**.
   *
   * A function here and a `string[]` on the card, which is the frozen source's
   * split (`:extra-chips="extraChips?.(i)"`) and the right one: only the caller
   * knows how to derive a programme or project name a row does not itself
   * carry, and only the grid has the row to derive it from. Returning
   * `undefined` for a row means that row gets no extra chips.
   */
  extraChips?: (i: Insight) => string[] | undefined
}

/**
 * Props of `bfGridProjects` — THE projects grid, wrapping `bfCardProject`.
 *
 * Ports `components/wireframe/wfGridProjects.vue` (frozen, D2), whose comment
 * records that the program pages and the all-projects index share this one
 * grid (Claudio, Aug 5) so the two views cannot drift apart in layout.
 *
 * No `extraChips` counterpart: `bfCardProject` derives its chips from the row
 * itself (`kind`, `external_url`, `pending`) and takes no extra-chip prop, so
 * there is nothing for a grid-level function to feed.
 */
export interface GridProjectsProps extends GridProps {
  /** The rows to render, in order. One `<li>` each, keyed on `slug`. */
  projects: Project[]
}

/* -------------------------------------------------------------------------
 * Search organism (issue 43 / gh#52)
 * ------------------------------------------------------------------------- */

/**
 * Props of `bfSearchShell` — the search UI shell.
 *
 * Five required props and three optional ones, and **not one of them is
 * derived inside the component**. The shell renders a query control, a facet
 * row, a count line, a result list and an empty state; ranking, indexing,
 * normalisation and the `/search` route belong to issue 54 (BRIEF D8). Every
 * number it paints — including the relevance meter's width — is read from a
 * value the page handed it.
 *
 * ## Why `resultCount` is a prop and not `results.length`
 *
 * They are different facts. The frozen `pages/wireframes/search.vue:49`
 * renders **twenty** rows (`results.slice(0, 20)`) under a count line that
 * reports the length of the *whole* ranked set. A shell that derived the count
 * from the array it was given would silently report "20 results" for a query
 * that matched four hundred, and no call site could correct it. So the page
 * says how many there are and, separately, hands over the ones to draw.
 *
 * ## Why `selectedFilters` is a prop and an event, not a `v-model` on state
 *
 * The same reason `bfFilterBar` takes one: on `/search` the selection lives in
 * `route.query` (issue 54's §Scope requires `/search?q=…` to deep-link), so a
 * component holding its own copy would be a second source of truth for a value
 * the URL already owns.
 */
export interface SearchShellProps extends Pick<CardWrapperProps, 'headingLevel'> {
  /**
   * The current query string, rendered into the search control.
   *
   * Controlled: the component keeps a *draft* of what has been typed so the
   * input stays responsive between debounce windows, but the prop is what the
   * draft is re-synchronised to whenever the page changes it (a cleared query,
   * a restored `?q=` on navigation). See the component for the resync rule.
   */
  query: string
  /**
   * The facet vocabulary, forwarded verbatim to `bfFilterBar`'s `filters`.
   *
   * One flat list, not the frozen wireframe's two hand-rolled rows. The
   * wireframe writes a programme row and a format row with the *same* markup
   * twice over; which facets exist, and whether they are one group or two, is
   * a page decision. This shell renders exactly the group it is given.
   */
  filters: Filter[]
  /** The selected facet keys. Forwarded to `bfFilterBar`'s `model-value`. */
  selectedFilters: string[]
  /**
   * The rows to draw, already ranked and already sliced by the page.
   *
   * Each row's `score` is expected in **0–1**, normalised by the page against
   * its own top score (the wireframe's `r.score / topScore`). The component
   * clamps rather than trusts — a score outside the range is a page bug that
   * must not become a meter wider than its track — but it never re-normalises,
   * because it cannot see the rows that were sliced away.
   */
  results: SearchResultRow[]
  /**
   * How many results the query matched **in total** — see the note above on
   * why this is not `results.length`.
   */
  resultCount: number
  /**
   * The search control's visible label and accessible name. Defaults to the
   * frozen wireframe's own `aria-label`, *"Semantic search"*.
   *
   * Visible, unlike the wireframe's, which is `aria-label` on a bare input:
   * `bfFormField` renders a real `<label for>`, so the name a screen reader
   * announces is the text a sighted user reads. A caller who wants it hidden
   * hides it with CSS rather than by deleting the element.
   */
  label?: string
  /** The search control's placeholder. Defaults to the wireframe's own. */
  placeholder?: string
  /**
   * The debounce window in milliseconds before `update:query` is emitted.
   * Defaults to 250.
   *
   * A prop rather than a constant because the emit boundary is now this
   * component's rather than a page-local `ref`'s: the frozen wireframe filters
   * an in-memory array on every keystroke, which is free, while issue 54's
   * page recomputes a ranking over ~400 documents, which is not. `0` disables
   * the timer entirely and emits synchronously.
   */
  debounceMs?: number
}

/* ---------------------------------------------------------------------------
 * Prose organism (issue 45 / gh#54)
 * ------------------------------------------------------------------------- */

/**
 * Props of `bfProse` — the body-string renderer.
 *
 * One prop, and deliberately only one. The component is a parser with a
 * template attached: it takes a body field and renders block-level text, and
 * every other decision a reader might expect it to expose belongs somewhere
 * else in the stack.
 *
 * ## Why there is no `headingLevel`
 *
 * Every typed card wrapper takes one (`CardWrapperProps.headingLevel`, gh#128)
 * because a card's heading rank depends on where the card is mounted. Prose is
 * different in kind: the ranks it emits are **inside a document outline the
 * body itself declares** — `##` means "a section of this body", `###` means "a
 * subsection of that" — so shifting them from the call site would flatten a
 * two-level outline into one level, or push a subsection to rank 4 with no
 * rank-3 parent. The body's own structure is the contract, and the page keeps
 * its single rank-1 heading by never letting this component emit one.
 *
 * ## Why there is no `measure`
 *
 * The line-length cap is the caller's, applied by the `bfSection` this renders
 * inside (`measure="narrow"` at every `wf-*` call site). See the component.
 */
export interface ProseProps {
  /**
   * The body, as a plain string, in either supported shape — markdown-lite or
   * legacy HTML. The component detects which from the content itself; there is
   * no format prop, because no call site knows the answer any more reliably
   * than `/<[a-z][^>]*>/i` does.
   *
   * Optional, and explicitly nullable: `data`-collection fields arrive as
   * `string | null | undefined` and a body that is missing is a normal state,
   * not a caller error. Both render **nothing** — no placeholder, no empty
   * `<p>` — since residual #186: 97 `bfInsights` rows and 3 `bfProjects` rows
   * store a null body (video and infographic items, where the media is the
   * body), and the frozen wireframe's `[body copy]` placeholder was reaching
   * readers on every one of them. The wireframe keeps its own placeholder (D2).
   */
  content?: string | null
}
