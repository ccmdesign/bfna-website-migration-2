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
 * Presentational-only (BRIEF D8): one prop in, three slots, nothing else. No
 * `queryCollection`, no store, no data composable.
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
 * ## Heading first in the DOM, chips and media first on the screen
 *
 * `wfCard.vue`'s comment states the rule and this file keeps it: the heading
 * (with its link) comes **first in source order**, so heading-navigation lands
 * at the start of the card and not in the middle of a chip row. Chips and
 * media sit *after* it in the DOM and are pulled up visually with CSS `order`
 * — `-1` and `-2` — never by reordering the markup.
 *
 * The two orders are allowed to disagree here because nothing in the visual
 * order is focusable or is a reading-order dependency: chips are text, the
 * media box is decorative or `alt`-described, and the one interactive thing in
 * a default card is the heading link itself, which is first either way. (A
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
      The card body: heading first, then whatever the caller stacks under it
      (excerpt, `<time>`, a secondary link). Unnamed, because it is the card —
      the other two slots are the exceptions to it.
    -->
    <slot />

    <!--
      Rendered only when filled, so an empty card carries no empty flex child
      contributing a `gap` to the stack. `.cluster` with `data-gap="xs"` is
      `wfCard.vue`'s own choice, kept: chips wrap as a row and the gap comes
      from the composition layer rather than from this component.
    -->
    <div v-if="$slots.chips" class="bf-card__chips | cluster" data-gap="xs">
      <slot name="chips" />
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
  The stretched link, the `> time` baseline and the raised non-heading links
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

      No new colour (BRIEF §5 rule 2). `.wf-card`'s `#999` border and `#222`
      hover are the existing semantic pair `--color-base-light` /
      `--color-text`; neither `--color-surface` nor `--color-border` (which the
      spec names) exists in `tokens/semantic-colors.css`, and adding one is
      forbidden.
    */
    --_bf-card-padding: var(--space-s);
    --_bf-card-gap: var(--space-2xs);
    --_bf-card-border-width: var(--border-width-thin);
    --_bf-card-border-color: var(--color-base-light);
    --_bf-card-border: var(--_bf-card-border-width) solid var(--_bf-card-border-color);
    --_bf-card-focus-color: var(--color-text);
    --_bf-card-hover-color: var(--color-text);
    --_bf-card-link-z-index: 1;

    /* The containing block for the heading link's stretched `::before`. */
    position: relative;

    display: flex;
    flex-direction: column;
    gap: var(--_bf-card-gap);
    padding: var(--_bf-card-padding);
    border: var(--_bf-card-border);

    /*
      `base/typography.css` sets `li { margin-bottom: 0.5em }` in
      `@layer defaults`, which this beats from `components`. Zeroing it makes
      the group's `gap` the single source of card spacing, so row gaps equal
      column gaps whatever the column count — the bug the frozen skin fixes
      with an unlayered rule of its own.
    */
    margin-block: 0;

    /*
      Redundant while `display: flex` holds (a flex container is no longer a
      list item, so no marker box is generated) and stated anyway, so the card
      stays marker-free if a consumer re-declares `display`. `ul[class]` in
      `base/reset.css` covers the group; this covers the item.
    */
    list-style: none;
  }

  /*
    The "special" card inside a card grid — the Transponder issue leading the
    homepage Insights grid. `1 / -1` is the whole row at every column count, so
    it cannot overflow when an `auto-fill` grid collapses to one column;
    `span 2` could and did. The heavier border is what makes it read as special
    rather than merely wide, and it is a hook override rather than a second
    `border` declaration so a consumer can retune one without restating both.
  */
  .bf-card[data-span="full"] {
    grid-column: 1 / -1;
    --_bf-card-border-width: var(--border-width-medium);
  }

  /*
    Visual order, the CSS half of "heading first in the DOM". Never markup
    order — see the component comment.
  */
  .bf-card__media { order: -2; }
  .bf-card__chips { order: -1; }

  /*
    ## The row modifier — `.bf-card-row` (`bfCardRow`, gh#36 / issue 27)

    The dense list row used by search results and the archive accordion: chip,
    linked heading and date on **one line**, wrapping gracefully rather than
    stacking.

    It lives here, in the base's own stylesheet, rather than in a stylesheet of
    its own. It is a *modifier of this card* and every declaration below undoes
    exactly one thing a rule a few lines up declared — a second file would have
    had to re-specify `.bf-card__chips`'s `order` and `.bf-card > time`'s
    `margin` from outside, and would have raced this block for both.

    A **class** rather than a `data-*` attribute, unlike `data-span="full"`.
    `span` is a value out of a closed set and reads as a state; "this card is a
    row" is a kind, and a kind is what a class is for. It also gives #43 and
    #55 a name to hang their container rules on (`.bf-search__results
    .bf-card-row`) without either of them learning an attribute private to this
    file. `bfCardRow` renders it; `$attrs` merges a caller's own classes
    alongside rather than replacing it.

    Every selector below is written `.bf-card.bf-card-row` — (0,2,x) — so the
    modifier outranks the base rule it overrides on specificity rather than on
    source order. At (0,1,x) `.bf-card > time { margin-block-start: auto }`
    would tie with the row's zero and win on document order, which is a bug
    waiting for someone to reorder this block.

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
      One line, not a stack. `wrap` — never `nowrap` — is what makes the row
      degrade into two or three lines at narrow widths instead of overflowing
      its container. That is the spec's "wraps gracefully" clause, and it is
      why the heading gets no `white-space` and no fixed-width column here or
      anywhere: a 980-character heading has to wrap *inside* the row.
    */
    flex-direction: row;
    flex-wrap: wrap;

    /*
      `baseline` rather than `center`. The chip, the heading and the date are
      three runs of text at three different sizes; aligning their boxes'
      centres would leave three visibly different text baselines on one line.
    */
    align-items: baseline;

    gap: var(--_bf-card-row-gap);
  }

  /*
    `margin-block-start: auto` floats the date to a *column's* bottom edge, and
    that is what it does on every other card. On the cross axis of a row an
    auto margin overrides `align-items` outright and drops the `<time>` to the
    row's bottom edge, off the baseline everything else shares. Zeroed, the
    date sits on the line with the rest of the row.
  */
  .bf-card.bf-card-row > time {
    margin-block-start: 0;
  }

  /*
    Dates sit at the card's bottom edge so a row of cards of unequal text
    length still aligns its dates. `> time`, so a `<time>` inside an excerpt
    is not yanked to the floor.
  */
  .bf-card > time {
    margin-block-start: auto;
  }

  /*
    The stretched link. `:is(h2, h3, h4)` rather than the frozen skin's bare
    `h3`, because heading level is a function of the page's outline (BRIEF §5
    rule 9 — sequential levels, one `h1`) and a card in a section under an `h2`
    correctly holds an `h3` while the same card under an `h3` holds an `h4`.
    `:is()` takes the specificity of its most specific argument, so this is
    (0,1,2) — identical to what `.wf-card h3 a::after` scored.

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
    position of a box that has been taken out of the tree. Both pseudo-elements
    paint after the anchor's own background either way, and only these two
    exist, so the stacking within the anchor is unchanged too.

    The overlay stays anonymous either way: it has no text, so it adds nothing
    to any accessible name. Probe 20 asserts all three halves of this — the
    marker's `content` is non-empty, the overlay is on `::before`, and the card
    is still hit-testable over its whole area.
  */
  .bf-card :is(h2, h3, h4) a::before {
    content: "";
    position: absolute;
    inset: 0;
  }

  /*
    Hover feedback for a card that actually goes somewhere — `:has()` is what
    distinguishes it from a card that is only a container. Same construction as
    the frozen skin (border colour plus a one-pixel shadow ring that thickens
    the edge without moving the box), painted from tokens.
  */
  .bf-card:has(:is(h2, h3, h4) a):hover {
    --_bf-card-border-color: var(--_bf-card-hover-color);
    box-shadow: 0 0 0 var(--_bf-card-border-width) var(--_bf-card-hover-color);
  }

  /*
    The focus indicator belongs to the card, not to the heading text. An
    `outline` is painted around an element's own boxes and not around its
    `::before`, so a ring left on the anchor would mark a line of text as the
    focus target of a hit area the size of the whole card (WCAG 2.4.7, and the
    2.4.11 focus-appearance intent). Two rings, as gh#24 established: the
    `outline` survives forced-colors mode, where `box-shadow` is dropped, and
    `--outline-focus` supplies the halo.
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
