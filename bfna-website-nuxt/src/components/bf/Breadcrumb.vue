<script setup lang="ts">
/**
 * `bfBreadcrumb` — the breadcrumb trail.
 *
 * Builds from `components/wireframe/wfBreadcrumb.vue` (frozen, D2). That file
 * is eight lines long and correct about the one thing that is hardest to add
 * later — it is a `<nav aria-label="Breadcrumb">`, a real landmark with a real
 * name — and wrong about everything inside it:
 *
 * ```vue
 * <span v-if="i"> / </span>
 * ```
 *
 * The separator is a **text node**, and the crumbs are not a list. So a screen
 * reader walking the wireframe's trail hears *"Breadcrumb navigation, Home,
 * slash, Democracy, slash, Rule of Law"* — three announcements of a punctuation
 * mark that carries no information, and no "list, 3 items" to tell the listener
 * how deep they are or where they are in the trail.
 *
 * `bfBreadcrumb` keeps the landmark and replaces the inside of it:
 *
 * | | `wfBreadcrumb` | here |
 * |---|---|---|
 * | Structure | bare inline nodes | `<ol role="list">` → `<li>` |
 * | Separator | `<span> / </span>` in the DOM | `li + li::before`, `content: "/" / ""` |
 * | Current page | any item lacking `to` | the **last** item, always |
 * | `Crumb` type | a local `WfCrumb`, exported from the SFC | imported from contracts |
 *
 * ## The separator is CSS, and its alternative text is empty
 *
 * Both halves of that sentence are load-bearing, and the second one is the part
 * that is easy to get wrong. Moving the slash from a text node to a `::before`
 * is **not** by itself enough to keep it out of the accessible name: generated
 * content is concatenated into the name computation in Chrome, so
 * `content: "/"` would reproduce the wireframe's defect exactly, only somewhere
 * a reviewer is far less likely to look for it.
 *
 * `content: "/" / ""` — the alt-text form — declares the string to paint and,
 * after the solidus, the alternative text to expose: none. The glyph is drawn;
 * the accessibility tree never sees it. Probe 28 asserts this from the **live
 * CSSOM**, not from the source, so a build step that drops the alt half fails
 * the run rather than quietly shipping a slash into every screen reader.
 *
 * ## `aria-current` is about position, not about `to`
 *
 * The wireframe conflates two different questions — *"is this crumb a link?"*
 * and *"is this crumb the page I am on?"* — by answering both with
 * `v-if="c.to"`. They come apart the moment a caller passes a trail whose last
 * node happens to carry a route (a hub that is also a page, a canonical
 * self-link), and the wireframe then renders a breadcrumb with **no current
 * item at all**.
 *
 * Here they are separate:
 *
 * - **The last crumb is never a link.** It is the page the user is already on;
 *   a link to here is a link to nowhere. It renders as a `<span
 *   aria-current="page">` whether or not it carries a `to`.
 * - **A non-final crumb is a link exactly when it has a `to`**, and never
 *   carries `aria-current` — a trail has one current page, not several.
 *
 * ## Empty in, nothing out
 *
 * `items: []` renders no element at all — not an empty `<nav>`. A landmark is
 * announced by its name before its contents are read, so an empty one costs a
 * screen-reader user an announcement and a navigation to discover that there
 * was nothing there. The same reasoning as `bfTime`'s absent-date branch
 * (gh#27): the honest render of nothing is nothing.
 *
 * Presentational-only (BRIEF D8): one prop in, nothing else. No route
 * derivation — every `wfPageHeader` call site in the wireframe pages already
 * pre-builds its `crumbs` array, and pages keep that job (spec §Out of scope).
 * No data access, no store, no composable.
 */
import type { Crumb } from '~/types/bf-contracts'

defineOptions({ name: 'BfBreadcrumb' })

/**
 * Local and unexported, by design — a divergence from the
 * `XProps`-in-`bf-contracts.ts` shape of the fourteen atoms before this one,
 * and a deliberate one.
 *
 * BRIEF §5 rule 11 forbids a component declaring a **shared** type inline, and
 * the type that is shared here is `Crumb`: it is what `bfPageHeader` (#38) and
 * every page that builds a trail will hold, and it is imported from contracts
 * rather than redeclared — which is precisely what `wfBreadcrumb` does wrong
 * (`WfCrumb`, a shared type declared and exported inside an SFC). `Props`
 * itself is shared with nobody; it cannot even be imported. The spec designs
 * the props this way and its acceptance greps this file for `Crumb[]`.
 */
interface Props {
  /** The trail, root first. The **last** entry is the current page. */
  items: Crumb[]
}

const props = defineProps<Props>()

/**
 * One pass over `items`, so the two questions the template asks — *link?* and
 * *current?* — are answered once, here, next to each other, rather than as two
 * index comparisons buried in `v-if`s where they can drift apart.
 *
 * `current` is positional (`i === last`); `link` is `to && !current`. There is
 * no arrangement of props that makes an element both.
 */
const crumbs = computed(() =>
  props.items.map((crumb, i) => {
    const current = i === props.items.length - 1
    return {
      /*
       * Index-composed: two crumbs may legitimately share a label — a
       * `Projects / … / Projects` trail is unusual but not wrong — and
       * `wfBreadcrumb`'s `:key="c.label"` would silently collapse them.
       */
      key: `${i}-${crumb.label}`,
      label: crumb.label,
      current,
      to: !current && crumb.to ? crumb.to : null
    }
  })
)
</script>

<template>
  <!--
    `v-if` on the nav, not on the list: an empty trail contributes no landmark.

    `inheritAttrs` is left at its default. This is a base atom with a single
    root, so `class`, `style` and any `data-*` a consumer adds land on the
    `<nav>`, which is the element a consumer would want to reach.
  -->
  <nav
    v-if="crumbs.length"
    class="bf-breadcrumb"
    aria-label="Breadcrumb"
  >
    <!--
      `role="list"` on an `<ol>` is redundant markup that fixes a real bug:
      Safari removes list semantics from a list whose `list-style` is `none`,
      so without it VoiceOver announces the crumbs as loose text and the
      "list, 4 items" that justifies the `<ol>` never arrives. Harmless in
      every other engine.
    -->
    <ol class="bf-breadcrumb__list" role="list">
      <li
        v-for="c in crumbs"
        :key="c.key"
        class="bf-breadcrumb__item"
      >
        <!--
          A linked crumb. `NuxtLink` rather than a bare `<a>`: these are
          in-app routes, and `Crumb['to']` is typed to accept a route-location
          object as well as a path.
        -->
        <NuxtLink
          v-if="c.to"
          class="bf-breadcrumb__link"
          :to="c.to"
        >{{ c.label }}</NuxtLink>

        <!--
          Everything else: the last crumb (always, `to` or not) and any
          intermediate crumb the caller left unlinked. Only the last one is
          `aria-current` — `undefined` removes the attribute entirely rather
          than rendering `aria-current="false"`, which some ATs read aloud.
        -->
        <span
          v-else
          class="bf-breadcrumb__current"
          :aria-current="c.current ? 'page' : undefined"
        >{{ c.label }}</span>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
/*
  `@layer components` must survive into the built stylesheet — the note in
  `Button.vue` has the history: `postcss-preset-env`'s cascade-layers polyfill
  used to flatten these blocks into unlayered rules, which then outranked every
  layer. The feature is off in `nuxt.config.ts`; probe 28 reads the live CSSOM
  so a regression fails loudly.

  No negation pseudo-class anywhere in this file. D-20.5 (gh#29):
  `postcss-preset-env` mis-lowers a negation that contains a complex selector,
  silently breaking the rule. The "every item after the first" set is expressed as `li + li`, which
  needs no negation.
*/
@layer components {
  .bf-breadcrumb {
    /*
      Declared in the rule, not bound inline through a `cssVars` computed — the
      `bfMedia` lesson from gh#26. A component that writes its own custom
      properties inline on every instance is no more overridable than one that
      writes flat declarations inline, because an ordinary consumer rule cannot
      outrank an inline style. This component emits no inline `style` at all.
    */
    --_bf-breadcrumb-gap: var(--space-2xs);

    /*
      The glyph and its alternative text, as one value. A consumer overriding
      this must keep the ` / ""` half — that is what holds the separator out of
      the accessible name, and it is stated here so the next reader sees the
      two travelling together.
    */
    --_bf-breadcrumb-separator: "/" / "";

    /*
      An existing semantic shade token (`semantic-colors-shades-and-tints.css`,
      derived from `--color-neutral`). No new colour, no literal, and not a
      primitive — BRIEF §5 rule 2. The separator is muted relative to the
      labels because it is punctuation between facts, not a fact.
    */
    --_bf-breadcrumb-separator-color: var(--color-neutral-tint-60);
  }

  .bf-breadcrumb__list {
    /*
      A wrapping row. Breadcrumbs are the one component whose content length is
      set entirely by the caller's page titles, and a trail that overflows its
      container horizontally is unreachable rather than merely ugly.
    */
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--_bf-breadcrumb-gap);

    /*
      The UA's own list affordances, removed: the marker (the separator is the
      affordance here) and the indent that would push the trail off its
      leading edge. `role="list"` on the element restores the semantics this
      takes away in Safari.
    */
    list-style: none;
    margin: 0;
    padding-inline-start: 0;
  }

  .bf-breadcrumb__item {
    display: flex;
    align-items: baseline;
    gap: var(--_bf-breadcrumb-gap);
  }

  /*
    The separator. `li + li`, so it appears between crumbs and never before the
    first one — the wireframe's `v-if="i"` guard, moved into the selector where
    it costs no DOM.

    `content: "/" / ""` is the whole point of the component: painted, and
    absent from the accessibility tree. See the block comment at the top.
  */
  .bf-breadcrumb__item + .bf-breadcrumb__item::before {
    content: var(--_bf-breadcrumb-separator);
    color: var(--_bf-breadcrumb-separator-color);
  }
}
</style>
