<script setup lang="ts">
/**
 * `bfCard` — the slot-based card shell, and the inheritance root of the whole
 * card family.
 *
 * Evolves `components/wireframe/wfCard.vue` (issue 20 / gh#29). That file is
 * frozen (D2) and is not touched here; its structure is reproduced, its two
 * undocumented halves are written down, and one prop is added.
 *
 * Six typed wrappers (#30–#35) and the row variant (#36) each render this as
 * their own root, and it stays public for direct slot use — a page that has a
 * card-shaped thing no wrapper covers composes it here rather than growing an
 * eighth wrapper.
 *
 * Presentational-only (BRIEF D8): one prop in, four slots (default, `kicker`,
 * `chips`, `media`), nothing else. No `queryCollection`, no store, no data
 * composable. (`kicker` is the row's slot — see "No label sits above a
 * heading" below. A column card that fills it gets the label at the end of
 * its text block, on the meta voice, rather than above its title.)
 *
 * ## The family, in one place (Sep 2026)
 *
 * Every visual decision the seven wrappers share is made in this file's
 * stylesheet and nowhere else: the white surface on `--shadow-card`, one
 * hover (a small lift, the deeper shadow, the title underlining, the picture
 * easing in inside its frame) for any card whose heading is a link, the
 * condensed navy title, the muted meta line under it, the excerpt on the
 * body ramp, the chips on the bottom edge. The chip row declares
 * `data-chip-tone="neutral"`, so an untoned chip a call site drops into it
 * still reads as the family's navy pill (`bfChip`'s tone axis).
 *
 * **Media is a group decision, not a card's.** A wrapper renders its media
 * slot only when its row carries an image, so no card shows an empty box —
 * but a grid that mixed picture cards and text cards stretched the text ones
 * to the picture ones' height, leaving a hollow of white between excerpt and
 * chips. So the grids (`bfGridInsights`, `bfGridProjects`) show thumbnails
 * only when **every** row they render has one, and otherwise none. Two rules
 * in this stylesheet back that up for the card groups a page composes by
 * hand: a group led by a full-width picture card reads as a lead and a list
 * (the cards after it drop their pictures), and a group that still mixes the
 * two stops stretching its cards (see "Mixed groups" below).
 *
 * **No label sits above a heading.** A curated prefix split out of a title
 * ("Documentary", "Latest Issue" — `utils/headingKicker.ts`) is a run on the
 * meta line under it, `DOCUMENTARY · JUL 2026`, never an eyebrow. The column
 * wrappers render that line themselves as `.bf-card__meta`; the `kicker`
 * slot is the row modifier's, which sets it in the same run after the title.
 *
 * ## The card is an `<li>`
 *
 * From inclusive-components.design/cards/, and inherited unchanged from
 * `wfCard.vue`: a group of cards is a **list**, so every card group is a
 * `<ul>` and every card is an `<li>` inside it. That is what tells a
 * screen-reader user how many cards there are before they walk them, and it is
 * why this component renders the `<li>` itself rather than leaving it to seven
 * call sites to remember.
 *
 * The list markup is the caller's other half of the bargain: `bfCard` cannot
 * render its own parent. `.grid` and `.switcher` are the two compositions the
 * grids (#42) put a card group on, and `base/reset.css`'s `ul[class]` rule
 * already strips the marker, margin and padding from any `<ul>` carrying one.
 *
 * ## Heading first in the DOM; media first on the screen
 *
 * `wfCard.vue`'s comment states the rule and this file keeps it: the heading
 * (with its link) comes **first in source order**, so heading-navigation lands
 * at the start of the card and not in the middle of a chip row. Every card
 * then reads, in DOM and on screen alike, title → meta → excerpt → chips, the
 * chips pinned to the card's bottom edge (Paper node 1B-0). Only the media
 * box is pulled above the heading visually with CSS `order: -1`, never by
 * reordering the markup. The row modifier alone puts its chips back in front
 * of the line (`order: -2`).
 *
 * The two orders are allowed to disagree there because nothing moved is
 * focusable or is a reading-order dependency: the media box is decorative or
 * `alt`-described, and the one interactive thing in a default card is the
 * heading link itself, which is first either way. (A
 * card that puts a *focusable* control in the chips slot would create a
 * tab-order/visual-order mismatch — WCAG 2.4.3 — which is why the wrappers
 * that need one, e.g. an external CTA, put it in the default slot.)
 *
 * ## The stretched link
 *
 * The heading link's `::before` is absolutely positioned over the whole card,
 * so the entire card is its hit area and no "Read more" CTA is needed — one
 * link per card, whose accessible name is the heading text rather than the
 * word "more" repeated twenty times down a grid.
 *
 * `::before` rather than `::after` since gh#36 / #138: `external-link.css`
 * paints its `↗` marker on `a[data-external]::after` at a *lower*
 * specificity, so an overlay on `::after` silently erased the marker on every
 * card heading link in the system. See D-27.1 in the stylesheet below.
 *
 * Three consequences, all handled in the stylesheet below and asserted by
 * probe 20:
 *
 * 1. the card must be a containing block (`position: relative`);
 * 2. any *other* link in the card has to be raised above the overlay or it
 *    becomes unclickable;
 * 3. the focus ring has to move to the card, because an `outline` is drawn
 *    around the anchor's own boxes and not around its `::before` — leaving the
 *    ring on the heading text would mark a hit area the size of a card with an
 *    indicator the size of a line of text.
 *
 * Known trade-off, inherited: the overlay blocks text selection inside a card.
 * `wireframe.css` records the same note. The swap is the redundant-click JS
 * (with a selection check); it is not made here because nothing has asked for
 * it and the JS version is only equivalent when scripting runs.
 *
 * ## `span`
 *
 * The one prop, and the one thing that is new (D4). `span="full"` renders
 * `data-span="full"`, and a rule in this file's `@layer components` block —
 * not an inline style, and not a hand-pinned column count — makes the card
 * take the whole row: `grid-column: 1 / -1`.
 *
 * `1 / -1` rather than `span 2`, for the reason `wireframe.css` gives: the
 * grid it lands in is `auto-fill`, so the column count is a function of the
 * container width. `span 2` overflows the moment the grid collapses to one
 * column; `1 / -1` is the whole row at every count. D9 additionally forbids
 * any `bf-*` file from shipping a hand-pinned column template, which is the
 * other way this could have been written and the wrong one. (The literal
 * property name is deliberately absent from this file: the spec's acceptance
 * greps for it.)
 *
 * Before this prop the attribute was written by hand at the one call site that
 * needed it (`wfCardProduct.vue:23`). It stays valid to write it by hand —
 * `$attrs` carries it to the same `<li>` — but a typo'd `data-span="Full"` now
 * has a typed alternative that a build can catch.
 */
import type { CardBaseProps } from '~/types/bf-contracts'

defineOptions({ name: 'BfCard' })

/**
 * No `withDefaults`. `span` has no default — its absence *is* the default
 * card, and giving it a runtime one would put a `data-span` attribute on every
 * card in the site to say nothing.
 */
defineProps<CardBaseProps>()

/**
 * The `<li>` itself, so the dev-time guard below can look at what it was put
 * inside. Never rendered as an attribute; `$attrs` is untouched by it.
 */
const root = ref<HTMLLIElement | null>(null)

/**
 * A card is a list item, and a list item outside a list is neither valid HTML
 * nor announced as one of N — the whole reason this component renders an `<li>`
 * rather than a `<div>`. `bfCard` cannot render its own parent, so the rule is
 * the caller's half of the bargain and this is where it is checked: once, here,
 * instead of in seven wrappers and three grids that each have to remember it.
 *
 * A dev-time `console.warn`, never a silent fallback and never a thrown
 * error, and `import.meta.dev` keeps the whole thing out of the production
 * bundle.
 *
 * `role="list"` is accepted alongside `<ul>` / `<ol>`: it is how an author
 * restores list semantics to a container that lost them, and it is a correct
 * answer here.
 */
if (import.meta.dev) {
  onMounted(() => {
    const parent = root.value?.parentElement
    if (!parent) return

    const isList =
      parent.tagName === 'UL'
      || parent.tagName === 'OL'
      || parent.getAttribute('role') === 'list'

    if (!isList) {
      console.warn(
        '[bfCard] renders an <li> and must be a direct child of a <ul>, an <ol> '
        + `or a role="list" container. Found <${parent.tagName.toLowerCase()}>.`
      )
    }
  })
}
</script>

<template>
  <!--
    `inheritAttrs` is left at its default: this is the base, not a wrapper, so
    `class`, `style` and every `data-*` a caller passes falls through to this
    `<li>` untouched. That is what lets `bfCardInsight` (#30) compose
    `class="bf-card | stack"` from outside without `bfCard` knowing the word
    `stack` exists — and what lets a wrapper keep writing the raw
    `data-span="full"` the way `wfCardProduct.vue` does.

    `:data-span="span"` renders nothing when the prop is absent (Vue omits an
    attribute bound to `undefined`), so the default card's markup is exactly
    `wfCard.vue`'s. When a wrapper passes both the prop and a fallthrough
    `data-span`, the fallthrough is merged last and wins; both spell the same
    value, so the two can only agree.
  -->
  <li ref="root" class="bf-card" :data-span="span">
    <!--
      Heading stays the first content in the DOM. The picture is a later
      sibling pulled above this block with `order`.

      `__text` is the part that grows — it takes the slack an equal-height row
      gives the card — so the chips, a fixed-height sibling after it, sit on
      the bottom edge. The picture never grows.
    -->
    <div class="bf-card__copy">
      <div class="bf-card__text">
        <slot />

        <!--
          The row modifier's label, set after the title in the meta run.
          Last in the DOM and never pulled above the heading: a column card
          writes its own `.bf-card__meta` line under the title instead.
        -->
        <p v-if="$slots.kicker" class="bf-card__kicker kicker">
          <slot name="kicker" />
        </p>
      </div>

      <!--
        Chip gap is Paper's 8px (`gap-2`) on every card: `--space-2xs`.
        `data-chip-tone` is `bfChip`'s container hook — an untoned chip in
        this row takes the neutral pill, so a call site that never heard of
        `tone` (the search results row) still matches the family.
      -->
      <div
        v-if="$slots.chips"
        class="bf-card__chips | cluster"
        data-gap="2xs"
        data-chip-tone="neutral"
      >
        <slot name="chips" />
      </div>
    </div>

    <div v-if="$slots.media" class="bf-card__media">
      <slot name="media" />
    </div>
  </li>
</template>

<!--
  Deliberately **unscoped**, unlike `bfButton` / `bfMedia` / `bfSkipLink`,
  which each style only their own root element.

  Slot content is compiled in the *parent's* scope and carries the parent's
  `data-v-…` id, never this component's. So a `scoped` block here would emit
  `.bf-card h3 a[data-v-card]::after` — a selector that cannot match a heading
  the caller passed in, which is every heading this component will ever hold.
  The stretched link, the `> time` date and the raised non-heading links
  all style slotted DOM, so the block has to be global.

  (`:slotted()` would compile the same rules against a slot-scope id. It is
  narrower and it is real, but it only reaches *direct* slot children, and the
  heading link is a grandchild of the slot in every wrapper. Not worth the
  footgun for a component whose every selector is already `.bf-card`-prefixed.)

  `@layer components` must survive into the built stylesheet — see the note in
  `Button.vue`: `postcss-preset-env`'s cascade-layers polyfill used to flatten
  these blocks into unlayered rules that then outranked every layer. The
  feature is off in `nuxt.config.ts`, and probe 20 reads the live CSSOM so a
  regression fails loudly rather than silently.
-->
<style>
@layer components {
  .bf-card {
    /*
      Defaults for the hooks, declared in the rule rather than bound inline
      through a computed `cssVars`. The spec sketches a `cssVars` binding, but
      this component has no styling props to source one from — it would always
      be empty, and an always-inline custom property is exactly as
      un-overridable as an inline `aspect-ratio` was in `wfMedia.vue` (gh#26).
      Declared here, a consumer outranks any of them with an ordinary rule.

      The surface (Paper node 1B-0, as tuned since): white, no border, the
      card elevation pair from `tokens/semantic-misc.css`, the large radius.
      `--border-radius-l` is the fallback while `--border-radius-xl` is new.
    */
    --_bf-card-padding: var(--space-m);
    /* Media to copy. Paper's half card opens 24px there; `--space-s` is 20. */
    --_bf-card-gap: var(--space-s);
    --_bf-card-radius: var(--border-radius-xl, var(--border-radius-l));
    --_bf-card-bg: var(--color-surface-page);
    --_bf-card-shadow: var(--shadow-card);
    --_bf-card-shadow-hover: var(--shadow-card-hover);
    /* How far a linked card rises under the pointer. */
    --_bf-card-lift: calc(-1 * var(--space-3xs));
    --_bf-card-title-color: var(--color-accent);
    --_bf-card-focus-color: var(--color-text);
    --_bf-card-link-z-index: 1;
    /*
      One motion for the family: an exponential ease-out, short enough that a
      pointer sweeping a grid does not leave a wake.
    */
    --_bf-card-motion: 240ms cubic-bezier(0.16, 1, 0.3, 1);

    /* The containing block for the heading link's stretched `::before`. */
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--_bf-card-gap);

    /*
      No `block-size: 100%`. A card is a grid or switcher item, and both
      stretch their items to the row by default — but only while the item's
      block size is `auto`. A percentage opted the card out of the stretch in
      the flex-based `.switcher`, which is why the three home programme cards
      stood at three different heights.

      `base/typography.css` sets `li { margin-bottom: 0.5em }` in
      `@layer defaults`, which this beats from `components`. Zeroing it makes
      the group's `gap` the single source of card spacing, so row gaps equal
      column gaps whatever the column count.
    */
    margin-block: 0;
    padding: var(--_bf-card-padding);
    border-radius: var(--_bf-card-radius);
    background-color: var(--_bf-card-bg);
    box-shadow: var(--_bf-card-shadow);

    /*
      Redundant while `display: flex` holds (a flex container is no longer a
      list item, so no marker box is generated) and stated anyway, so the card
      stays marker-free if a consumer re-declares `display`. `ul[class]` in
      `base/reset.css` covers the group; this covers the item.
    */
    list-style: none;
    transition:
      transform var(--_bf-card-motion),
      box-shadow var(--_bf-card-motion);
  }

  /*
    The copy block — text, then chips — takes whatever height the row gives
    the card, and inside it the text block grows. That is what pins the chip
    row to the card's bottom edge in an equal-height grid: the excerpt region
    absorbs the slack, the chips sit last.
  */
  .bf-card__copy {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    gap: var(--space-xs);
    min-block-size: 0;
  }

  /*
    Title stack is 4px (`gap-1`): kicker, title, date. The excerpt opens that
    up with its own margin below.
  */
  .bf-card__text {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    gap: var(--space-3xs);
    min-block-size: 0;
  }

  .bf-card__chips {
    flex-shrink: 0;
  }

  /*
    ## A pending marker — `.bf-card__pending`

    Not a chip. A chip is taxonomy — what a piece is, whose it is — and a
    marker that says content is still owed (the Transponder's "External link
    pending Q6", `bfCardProduct`) set in the same filled pill read as one
    more category beside "Magazine". It sits in the chip row, because that
    is where the card says what it is and is not, but as an open placeholder:
    no fill, a dashed hairline in the text's own colour, sentence case in the
    body's light italic. The wireframe's `[data-pending]` flag is the same
    idea in the frozen skin.

    `currentcolor` throughout, so it is the card's ink on the white card and
    white over the full-width card's photograph and scrim, where the copy is
    inverted — no colour of its own to measure. The chip's size and height,
    so the row keeps one line box.
  */
  .bf-card__pending {
    display: inline-flex;
    align-items: center;
    max-inline-size: 100%;
    padding: var(--space-3xs) var(--space-xs);
    border: var(--border-width-thin) dashed currentcolor;
    border-radius: var(--radius-pill);
    font-family: var(--font-family-ui);
    font-size: max(var(--size--2), 0.75rem);
    font-style: italic;
    font-weight: var(--font-weight-light);
    line-height: 1.1;
  }

  /*
    ## Media

    Rendered only when the data carries an image — every wrapper guards the
    slot on its row's `image`, and the grids switch it off for a whole group
    unless every row has one — so there is no empty-box state to style. The
    box is content-sized (`flex: none`): it used to share the row's slack
    with the copy, and an equal-height grid stretched it past its picture,
    leaving a grey band under the image. The ground is only ever seen while
    a large original is still arriving.

    Visual order, the CSS half of "heading first in the DOM". Never markup
    order — see the component comment.
  */
  .bf-card__media {
    display: flex;
    flex: none;
    order: -1;
    overflow: hidden;
    border-radius: var(--border-radius-m);
    background-color: var(--color-base-super-light);
  }

  .bf-card__media .bf-media {
    flex: 1 1 auto;
    min-block-size: 0;
    object-fit: cover;
    transition: transform var(--_bf-card-motion);
  }

  /*
    ## Type

    Title: IBM Plex Sans Condensed 400 in navy, on `--leading-display` — the
    Paper spec. Named `:is(h2, h3, h4)` because heading level belongs to the
    page outline (#128). The anchor inherits colour and weight: it would
    otherwise take `base/typography.css`'s 300 and — because NuxtLink renders
    `class=""`, which `a:not([class])` does not match — the UA's link blue.
  */
  .bf-card :is(h2, h3, h4) {
    flex-shrink: 0;
    color: var(--_bf-card-title-color);
    font-family: var(--font-family-condensed);
    font-size: var(--size-1);
    font-weight: var(--font-weight-normal);
    letter-spacing: var(--tracking-condensed);
    line-height: var(--leading-display);
    text-wrap: balance;
  }

  .bf-card :is(h2, h3, h4) a {
    color: inherit;
    font-weight: inherit;
    text-decoration-line: none;
    text-decoration-thickness: var(--border-width-thin);
    text-underline-offset: 0.18em;
  }

  /*
    The meta line follows the title: small semibold capitals in the muted
    navy, with the chips' tracking so the card has one label voice. Paper
    sets it at 12px, a notch above the 11px chips; `--size--2` holds at
    11.1px on the fluid scale, so the step is floored at 0.75rem rather than
    letting the one fact every card carries shrink to chip size.

    It is the bare date (`> time`, so a `<time>` inside an excerpt is not
    restyled), or — when a wrapper split a curated prefix out of the title —
    a `.bf-card__meta` run of prefix and date. The row's `kicker` slot takes
    the same voice. The global `.kicker` it also carries (blue, condensed,
    bold, 16px) sits in `@layer defaults`, which this layer outranks.
  */
  .bf-card__text > time,
  .bf-card__text > .bf-card__meta,
  .bf-card p.bf-card__kicker {
    flex-shrink: 0;
    margin: 0;
    color: var(--color-text-muted);
    font-family: var(--font-family-ui);
    font-size: max(var(--size--2), 0.75rem);
    font-weight: var(--font-weight-semibold);
    letter-spacing: var(--tracking-caps);
    line-height: 1;
    text-transform: uppercase;
  }

  /*
    `DOCUMENTARY · JUL 2026`. A wrapping flex run, so a long prefix on a
    narrow card breaks between its facts rather than inside one. The dot is
    drawn, and named empty for assistive tech (`/ ""`), so a screen reader
    reads the two facts and not "middle dot". `* + *`, so a row without a
    date (`bfTime` renders nothing) carries no stray separator.
  */
  .bf-card__meta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3xs);
  }

  .bf-card__meta > * + *::before {
    content: "·" / "";
    margin-inline-end: var(--space-3xs);
  }

  /*
    Excerpt. Paper sets it at 18px against the title's 27; the fluid body
    step reaches 20px at desktop, which flattens that ratio, so the excerpt
    rides the ramp and stops at 18. On a phone that is the ramp's own 16px.
    The space above it is Paper's 16px (`--space-xs`, net of the stack gap).
  */
  .bf-card__text > p:not(.kicker) {
    margin-block-start: calc(var(--space-xs) - var(--space-3xs));
    color: var(--color-text);
    font-family: var(--font-family-ui);
    font-size: min(var(--size-0), 1.125rem);
    font-weight: var(--font-weight-light);
    line-height: var(--leading-body);
  }

  /*
    Media cards: more air between the picture-led title stack and the
    excerpt, and the excerpt clamps at four lines so a row of media cards
    keeps one rhythm whatever each excerpt's length.
  */
  .bf-card:has(> .bf-card__media) .bf-card__text > p:not(.kicker) {
    display: -webkit-box;
    overflow: hidden;
    margin-block-start: calc(var(--space-s) - var(--space-3xs));
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 4;
    line-clamp: 4;
  }

  /*
    ## The full-width card — `span="full"`

    The "special" card inside a card grid — the Transponder issue leading the
    homepage Insights grid. `1 / -1` is the whole row at every column count,
    so it cannot overflow when an `auto-fill` grid collapses to one column;
    `span 2` could and did.

    Two layouts, chosen by the card's **own** width through a container query
    rather than by the viewport, because the card's width is what decides
    whether copy fits over the picture:

    - narrow (the default): a media card like its neighbours — picture, then
      copy on white. At 375px the old overlay squeezed the copy into half of a
      300px card, one word per line, and pushed a chip out of the card.
    - wide (`>= 48rem` of card): the picture fills the card and the copy sits
      over its bottom-end corner on a scrim.

    The card is a one-column grid in both, so the wide layout can stack the
    two in one cell. Padding moves onto the children for the same reason: a
    container query styles the container's descendants, never the container.
  */
  .bf-card[data-span="full"] {
    display: grid;
    grid-column: 1 / -1;
    gap: 0;
    padding: 0;
    container-type: inline-size;
  }

  .bf-card[data-span="full"] .bf-card__media {
    margin: var(--_bf-card-padding) var(--_bf-card-padding) 0;
  }

  .bf-card[data-span="full"] .bf-card__copy {
    padding: var(--_bf-card-gap) var(--_bf-card-padding) var(--_bf-card-padding);
  }

  /* No picture: nothing sits above the copy, so it takes the full padding. */
  .bf-card[data-span="full"] .bf-card__copy:only-child {
    padding-block-start: var(--_bf-card-padding);
  }

  /*
    …and its text keeps a reading measure. A lone project on a program hub
    leads its row as a full-span text card, and its excerpt ran the whole
    1100px row, ~150 characters a line. 75ch of the excerpt's own size is
    the long end of a comfortable line; the chips below keep the card's
    full width, on the same left edge.
  */
  .bf-card[data-span="full"] .bf-card__copy:only-child .bf-card__text {
    max-inline-size: 75ch;
  }

  @container (min-width: 48rem) {
    .bf-card[data-span="full"] .bf-card__media {
      position: relative;
      grid-area: 1 / 1;
      margin: 0;
      border-radius: inherit;
    }

    .bf-card[data-span="full"] .bf-card__media .bf-media {
      block-size: 100%;
    }

    /*
      Dark scrim from the corner the type sits in (bottom-end). Same token as
      the hero media layer so white type clears 4.5:1 over the photograph.
    */
    .bf-card[data-span="full"] .bf-card__media::after {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(
        to top left,
        var(--color-scrim) 0%,
        color-mix(in srgb, var(--color-scrim) 72%, transparent) 42%,
        transparent 72%
      );
      pointer-events: none;
    }

    .bf-card[data-span="full"]:has(> .bf-card__media) .bf-card__copy {
      z-index: 1;
      flex: none;
      grid-area: 1 / 1;
      place-self: end end;
      inline-size: 50%;
      padding: var(--_bf-card-padding);
      gap: var(--space-s);
      color: var(--color-text-inverse);
    }

    /*
      Over media, type is white — `semantic-colors.css`'s scrim rule: no
      programme or muted colour survives the scrim as text. The meta line
      goes white with the title for the same reason.
    */
    .bf-card[data-span="full"]:has(> .bf-card__media) :is(h2, h3, h4),
    .bf-card[data-span="full"]:has(> .bf-card__media) .bf-card__text > *,
    .bf-card[data-span="full"]:has(> .bf-card__media) p.bf-card__kicker {
      color: var(--color-text-inverse);
    }

    /*
      Over the photograph the excerpt is whole; there is room for it. Plain
      `> p`, which also reaches the kicker harmlessly: it undoes only a clamp
      the kicker never had, and it keeps the ban on new `:not()` (D-20.5).
      Same specificity as the clamp rule above, and later, so it wins.
    */
    .bf-card[data-span="full"]:has(> .bf-card__media) .bf-card__text > p {
      display: block;
      -webkit-line-clamp: unset;
      line-clamp: none;
    }
  }

  /*
    ## A lead and a list

    A group led by a full-width picture card — the Transponder issue on the
    homepage — gives the picture to the lead, and the cards after it read
    text-only. The first card under the magazine was its own latest issue,
    and the curation carries the same cover under a second asset id, so at
    375px the two stacked as the same picture twice in a row; no `src`
    comparison can see that. Dropping one picture would have left a text
    card beside a picture card, which is the hollow a group must not have
    (see the component comment). So the whole list goes text-only, the
    grid stays uniform, and the lead is the band's one image.

    `display: none` on the box, because the wrapper cannot know its
    neighbours and the page composes this group by hand. `bfMedia` loads
    lazily, and a lazy image that is never rendered is never fetched.
    The excerpt then sets as on any text card: whole, and at the text
    card's spacing, undoing the media-card clamp above at a higher
    specificity. Plain `> p`, as in the overlay block, to keep the ban on
    new `:not()`.
  */
  .bf-card[data-span="full"]:has(> .bf-card__media) ~ .bf-card > .bf-card__media {
    display: none;
  }

  .bf-card[data-span="full"]:has(> .bf-card__media) ~ .bf-card .bf-card__text > p {
    display: block;
    margin-block-start: calc(var(--space-xs) - var(--space-3xs));
    -webkit-line-clamp: unset;
    line-clamp: none;
  }

  /*
    ## Mixed groups

    The grids never mix — they decide media for the whole group — but a
    page that composes its own card list could, the day one of its rows
    loses its image. A text card (its copy is the card's only child) beside
    a picture card would then stretch to the picture card's height and pin
    its chips under a hollow. Such a group stops stretching instead: ragged
    bottoms, chips straight after the excerpt, no empty box. Nothing on the
    site matches this today; it is the guard, not the design.
  */
  :is(ul, ol):has(> .bf-card > .bf-card__media):has(> .bf-card > .bf-card__copy:only-child) {
    align-items: start;
  }

  /*
    ## The row modifier — `.bf-card-row` (`bfCardRow`, gh#36 / issue 27)

    The dense list row used by search results and the archive accordion:
    chips, linked heading, then kicker and date on **one line**, wrapping
    gracefully rather than stacking — and, below 36rem of row, stacked in
    the same order so every title starts at the left edge.

    It lives here, in the base's own stylesheet, rather than in a stylesheet of
    its own. It is a *modifier of this card* and every declaration below undoes
    exactly one thing a rule above declared — a second file would have to
    re-specify them from outside, and would race this block for each.

    A **class** rather than a `data-*` attribute, unlike `data-span="full"`.
    `span` is a value out of a closed set and reads as a state; "this card is a
    row" is a kind, and a kind is what a class is for. It also gives #43 and
    #55 a name to hang their container rules on (`.bf-search__results
    .bf-card-row`) without either of them learning an attribute private to this
    file. `bfCardRow` renders it; `$attrs` merges a caller's own classes
    alongside rather than replacing it.

    Every selector below is written `.bf-card.bf-card-row` — (0,2,x) — so the
    modifier outranks the base rule it overrides on specificity rather than on
    source order.

    **Flat, not floating** (Sep 2026). A list of 256 archive rows was 256
    shadowed, rounded cards, each shadow cut off by the next — a stack of
    tiles rather than an index. A row is a line: no ground, no shadow, no
    radius, and a hairline under it. The list's own `gap` is the space above
    each line; the row's bottom padding is the space above the rule.

    Tokens only. No new colour, and no `:not()` anywhere — D-20.5 (#29) bans
    `:not()` around a complex selector, and this modifier needs none.
  */
  .bf-card.bf-card-row {
    /*
      The spec's hook, defaulting to the `xs` Utopia step — the same gap
      `archive.vue:17`'s `class="cluster" data-gap="xs"` resolves to, which is
      the hand-built markup this component replaces.
    */
    --_bf-card-row-gap: var(--space-xs);

    /*
      The row is its own query container, so it can choose between one line
      and a stacked row by the width it actually has (see "Narrow rows"
      below) rather than by the viewport.
    */
    container: bf-card-row / inline-size;

    /*
      One line, not a stack. `wrap` — never `nowrap` — is what makes the row
      degrade into two or three lines at narrow widths instead of overflowing
      its container. That is the spec's "wraps gracefully" clause, and it is
      why the heading gets no `white-space` and no fixed-width column here or
      anywhere: a 980-character heading has to wrap *inside* the row.

      `baseline` rather than `center`: the chip, the heading and the date are
      three runs of text at three different sizes; aligning their boxes'
      centres would leave three visibly different text baselines on one line.

      The hook is the gap along the line. Between wrapped lines it is the
      step below, so a title and the meta line under it stay one group.
    */
    flex-flow: row wrap;
    align-items: baseline;
    gap: var(--space-2xs) var(--_bf-card-row-gap);
    padding: 0 0 var(--space-xs);
    border-block-end: var(--border-width-thin) solid var(--color-base-super-light);
    border-radius: 0;
    background-color: transparent;
    box-shadow: none;
  }

  /*
    The copy and text wrappers dissolve, so the heading, the date, the kicker
    and the chip cluster are all items of the one wrapping line.
  */
  .bf-card.bf-card-row .bf-card__copy,
  .bf-card.bf-card-row .bf-card__text {
    display: contents;
  }

  /*
    The row puts its chips back in front, and sets the kicker after the
    title as the first half of the meta run: chips, title, kicker · date,
    then anything else a caller adds — the one-line excerpt a search row
    carries (see "The row's excerpt" below). The kicker is last in the DOM,
    so every item of `__text` takes an explicit place; the heading keeps DOM
    order's lead either way.
  */
  .bf-card.bf-card-row .bf-card__chips {
    order: -2;
  }

  .bf-card.bf-card-row .bf-card__text > * {
    order: 3;
  }

  .bf-card.bf-card-row .bf-card__text > :is(h2, h3, h4) {
    order: 0;
  }

  .bf-card.bf-card-row .bf-card__text > p.bf-card__kicker {
    order: 1;
  }

  .bf-card.bf-card-row .bf-card__text > time {
    order: 2;
  }

  /*
    `TRANSPONDER ISSUE #4 · JUN 2023`: the kicker and the date are two items
    of the line, so the separator is drawn on the date, named empty for
    assistive tech, and the gap between the two is taken back to the meta
    line's own spacing. Both only when both are present.
  */
  .bf-card.bf-card-row:has(.bf-card__text > time) p.bf-card__kicker {
    margin-inline-end: calc(var(--space-3xs) - var(--_bf-card-row-gap));
  }

  .bf-card.bf-card-row:has(p.bf-card__kicker) .bf-card__text > time::before {
    content: "·" / "";
    margin-inline-end: var(--space-3xs);
  }

  /*
    The heading may shrink in a row. The base rule's `flex-shrink: 0` keeps a
    column card's title from being squeezed, but on a wrapping row it holds a
    long title at its max-content width — wider than the row — instead of
    wrapping it inside the row as this block's contract says.

    And it starts from nothing and takes the line's slack (`1 1 0`). With an
    `auto` basis a long title was measured at its max-content width, did not
    fit beside the chips, and dropped to a line of its own — so at 1280 the
    archive's longest titles started at the left edge and the rest after
    their chips, the same alternation the narrow rows had. From a zero basis
    every title fits beside its chips and wraps inside its own box, and the
    meta run it pushes ahead of it lines up down the list's end edge.
  */
  .bf-card.bf-card-row :is(h2, h3, h4) {
    flex: 1 1 0;
  }

  /*
    ## The chip track — `--_bf-card-row-chips-min`

    A wide row is one line, chips then title, so the chips' width sets where
    each title begins, and a list mixing `ARTICLE` and `INFOGRAPHIC ·
    ARCHIVE` starts its titles at different x. A list that wants one title
    edge gives the chip cluster a floor as wide as the widest set its rows
    can carry, and the cluster becomes a fixed track (`flex: none`).

    The floor is a measurement of a list's own labels, so the list sets it:
    `/search` 12.5rem, `/archive` 7rem. Read with a fallback rather than
    declared on the row, so it inherits — a list sets it once on itself, not
    on every row. Unset, the floor is 0 and the cluster keeps its content
    width, as before.

    `width > 36rem` is the exact complement of the narrow-row query below,
    so at no width do the two layouts both apply: a stacked row already
    starts every title at the left edge.
  */
  @container bf-card-row (width > 36rem) {
    .bf-card.bf-card-row .bf-card__chips {
      flex: none;
      min-inline-size: var(--_bf-card-row-chips-min, 0);
    }

    /*
      A row's excerpt (below) can start on the title column rather than
      under the chips: `--_bf-card-row-excerpt-indent`, the chip floor plus
      the row's gap, set by the list beside the floor. Unset, it is 0, and
      the line starts at the row's edge. The kicker is handed back its own
      zero, one class more specific.
    */
    .bf-card.bf-card-row .bf-card__text > p {
      margin-inline-start: var(--_bf-card-row-excerpt-indent, 0);
    }

    .bf-card.bf-card-row .bf-card__text > p.bf-card__kicker {
      margin-inline-start: 0;
    }
  }

  /*
    ## The row's excerpt

    A row that carries a paragraph — a search result's excerpt, so
    "Disrupting Democracy" and "Disrupting Democracy | Italy" can be told
    apart before either is opened — sets it as a line of its own under the
    title and meta run, clamped to one line: a hint of what the piece is,
    not a second reading of it. One step under the card excerpt and in the
    secondary ink, so the title and the date stay the row's first facts.

    Written as every `<p>` of the row, then the kicker handed back its own
    layout, rather than as a `:not(.kicker)` (D-20.5 bans new `:not()`).
    The kicker rule is one class more specific, so it wins in any order.
  */
  .bf-card.bf-card-row .bf-card__text > p {
    display: -webkit-box;
    flex-basis: 100%;
    overflow: hidden;
    margin-block-start: 0;
    color: var(--color-base-light);
    font-size: min(var(--size-0), 1rem);
    line-height: var(--leading-body);
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    line-clamp: 1;
  }

  .bf-card.bf-card-row .bf-card__text > p.bf-card__kicker {
    display: block;
    flex-basis: auto;
    overflow: visible;
    color: var(--color-text-muted);
    font-size: max(var(--size--2), 0.75rem);
    line-height: 1;
    -webkit-line-clamp: unset;
    line-clamp: none;
  }

  /*
    ## Narrow rows

    Below 36rem of row the one line cannot hold chips, title and date
    together, and letting it wrap where it fell gave two layouts that
    alternated by title length down a 256-row index: a short title beside
    its chips, a long one under them, the date on the title line or on its
    own. The eye lost the title's left edge from one row to the next.

    So a narrow row stacks the same items in the same order, always:
    chips on one line, the title on the next from the left edge, the meta
    run under it — the card family's title-then-meta order. Wider rows keep
    the single line above.
  */
  @container bf-card-row (max-width: 36rem) {
    .bf-card.bf-card-row .bf-card__chips,
    .bf-card.bf-card-row .bf-card__text > :is(h2, h3, h4) {
      flex-basis: 100%;
    }
  }

  /*
    The stretched link. `:is(h2, h3, h4)` rather than the frozen skin's bare
    `h3`, because heading level is a function of the page's outline (BRIEF §5
    rule 9 — sequential levels, one `h1`) and a card in a section under an `h2`
    correctly holds an `h3` while the same card under an `h3` holds an `h4`.
    `:is()` takes the specificity of its most specific argument, so this is
    (0,1,2) — identical to what `.wf-card h3 a::after` scored.

    The overlay is positioned against the **card**, and only works while
    nothing between the card and the anchor is itself positioned. A
    `.bf-card * { position: relative }` rule (Sep 2026) made every heading its
    own containing block and shrank the hit area of every card in the site to
    its title text; it is gone, and nothing in this block positions a
    descendant of the card except the anchors raised further down.

    ## Why `::before` and not `::after` (D-27.1, gh#138)

    The frozen skin, and this file until gh#36, painted the overlay on
    `::after`. That collided with `components/external-link.css`, which paints
    the external marker through `a[data-external]::after` at (0,1,1). This
    selector scores (0,1,2), both live in `@layer components`, so the card's
    empty `content` won and **no `bfCard` heading link could ever show its
    `↗`** — the defect #138 records, measured (not merely asserted) by probe
    26.

    Moving the overlay to `::before` frees `::after` for the marker, which then
    applies unopposed. Nothing else changes: the overlay is
    `position: absolute`, so it is out of flow and generates no inline box in
    the anchor's text — `::before` and `::after` differ only in the tree
    position of a box that has been taken out of the tree.

    The overlay stays anonymous either way: it has no text, so it adds nothing
    to any accessible name.
  */
  .bf-card :is(h2, h3, h4) a::before {
    content: "";
    position: absolute;
    inset: 0;
  }

  /*
    ## Hover and focus — one treatment for the family

    Only a card that goes somewhere responds, so the selector requires the
    heading link: a person card and the unlinked product card stay still (an
    affordance on something that does not go anywhere is a lie).

    The card rises a few pixels onto the deeper shadow, the title underlines,
    and a picture eases in by 3% inside its own clipped frame. It replaces a
    5% scale that pushed each card over its neighbours' gutter and a media
    shift that lifted pictures 80px out of the card, over the section heading
    above it. Keyboard focus gets the same title underline, so the two ways
    of arriving at a card read alike.
  */
  .bf-card:has(:is(h2, h3, h4) a):hover {
    z-index: 1;
    box-shadow: var(--_bf-card-shadow-hover);
    transform: translateY(var(--_bf-card-lift));
  }

  .bf-card:has(:is(h2, h3, h4) a):hover :is(h2, h3, h4) a,
  .bf-card :is(h2, h3, h4) a:focus-visible {
    text-decoration-line: underline;
  }

  .bf-card:has(:is(h2, h3, h4) a):hover .bf-card__media .bf-media {
    transform: scale(1.03);
  }

  /* A row is a line in a list: it underlines, and does not rise. */
  .bf-card.bf-card-row:has(:is(h2, h3, h4) a):hover {
    box-shadow: none;
    transform: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .bf-card,
    .bf-card__media .bf-media {
      transition: none;
    }

    .bf-card:has(:is(h2, h3, h4) a):hover,
    .bf-card:has(:is(h2, h3, h4) a):hover .bf-card__media .bf-media {
      transform: none;
    }
  }

  /*
    The focus indicator belongs to the card, not to the heading text. An
    `outline` is painted around an element's own boxes and not around its
    `::before`, so a ring left on the anchor would mark a line of text as the
    focus target of a hit area the size of the whole card (WCAG 2.4.7, and the
    2.4.11 focus-appearance intent). Two rings, as gh#24 established: the
    `outline` survives forced-colors mode, where `box-shadow` is dropped, and
    `--outline-focus` supplies the halo. The outline follows the card's
    radius, so on a borderless white card the ring is the card's own edge,
    drawn in ink.
  */
  .bf-card:has(:is(h2, h3, h4) a:focus-visible) {
    outline: var(--border-width-medium) solid var(--_bf-card-focus-color);
    outline-offset: var(--border-width-medium);
    box-shadow: var(--outline-focus);
  }

  /*
    …and only then is the anchor's own ring dropped, so a browser that cannot
    evaluate `:has()` keeps the indicator it already had rather than losing
    every visible focus state on every card. The guard is the same condition
    the rule above depends on.
  */
  @supports selector(:has(*)) {
    .bf-card :is(h2, h3, h4) a:focus-visible {
      outline: none;
    }
  }

  /*
    Any other link in a card stays clickable above the overlay — an external
    CTA, a chip that is a link, a "listen" button. Without this the stretched
    `::before` swallows it and the card silently has one link.

    Written as raise-everything-then-exempt-the-heading rather than the obvious
    `a:not(:is(h2, h3, h4) a)`, and the reason is not style. `postcss-preset-env`
    lowers a `:not()` holding a **complex** selector, and it lowers this one
    *wrongly*: `a:not(:is(h2, h3, h4) a)` ships as
    `a:not(h2):not(h3):not(h4)` — which every anchor satisfies. The heading link
    would then be `position: relative` itself, become the containing block for
    its own `::before`, and shrink the card-sized hit area down to the width of
    the heading text. Silent, and invisible to a source grep. Probe 20 asserts
    the heading anchor's computed `position` is `static` for exactly this
    reason.

    The exemption below wins on specificity — (0,1,2) against (0,1,1) — and
    `:is()` in this position expands to three plain descendant selectors, which
    is lossless.
  */
  .bf-card a {
    position: relative;
    z-index: var(--_bf-card-link-z-index);
  }

  .bf-card :is(h2, h3, h4) a {
    position: static;
    z-index: auto;
  }
}
</style>
