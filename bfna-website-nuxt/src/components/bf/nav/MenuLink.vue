<script setup lang="ts">
/**
 * One menu item — internal child of `bfNav` (issue 35 / gh#44).
 *
 * Evolves `src/components/wireframe/wfMenuLink.vue`, which is frozen (D2) and
 * was read, not edited. The render is the same three-way branch:
 *
 * | `item` shape | element |
 * |---|---|
 * | `to` | `<NuxtLink :to>` — a route |
 * | `to` + `strong` | the same, label wrapped in `<strong>` |
 * | `href` (or neither) | `<a :href data-external>` |
 *
 * ## Why this is not `components/bf/MenuLink.vue`
 *
 * It is internal to one component, and BRIEF §5 rule 5 names `bfNav` + its
 * menu-link and dropdown children as one of the four permitted bundles. It
 * lives under `bf/nav/` and is imported **by relative path** from `Nav.vue`
 * and `Dropdown.vue` rather than by auto-import name — see the registration
 * note in `Nav.vue`. `bfFooter` (#45) imports it the same way, which is the
 * reason the file is a component at all rather than inlined markup: the two
 * chrome surfaces must render `MenuItem` data identically, which is exactly
 * what `wfMenuLink`'s own comment says about its pair.
 *
 * ## `data-external` is the marker, not a class
 *
 * `components/external-link.css` (issue 19 / gh#28) styles `a[data-external]`
 * with the wireframe's own `" ↗"` affordance. The attribute is emitted on the
 * `href` branch unconditionally, matching `wfMenuLink` — inside a nav dropdown
 * an `href` **is** the off-site branch, because every internal destination
 * arrives as `to`. The nav's own top-level links are the case where internal
 * and external `href`s both occur, and `Nav.vue` gates the marker on
 * `m.external` there rather than here.
 *
 * ## Focus
 *
 * No focus rule of its own. `base/focus.css` (#146) declares `:focus-visible`
 * in `@layer defaults` for every element, links included, and this component
 * has no reason to override it. That is the whole point of #146: the six atoms
 * that each shipped a private copy of those three declarations no longer need
 * to.
 *
 * ## The trailing arrow is split off the label (a11y epic, gh#221)
 *
 * One menu label ends in a bare `→` — `"All Projects →"`, in the Projects
 * group, rendered into both the nav dropdown and the footer. An arrow inside
 * link text is a plain text node, so it is read out as part of the link's
 * accessible name ("all projects rightwards arrow"). The repo already has the
 * fix: `CardProject.vue:194` wraps its `↗` in `<span aria-hidden="true">`
 * (a11y BRIEF D27).
 *
 * The difference here is that the glyph is **data**, not markup. It arrives in
 * `src/assets/bf-data/menus.json`, which is *generated* by
 * `scripts/normalise-wireframe-data.ts` from `useWfContent.ts`'s `MENUS` — so
 * editing the JSON would be undone by the next normalise run, and editing the
 * source would edit the frozen wireframe chrome (BF-217 D2). The split
 * therefore happens at render, here, where the label becomes markup: the
 * trailing arrow and the space in front of it move into an `aria-hidden` span,
 * the rest of the label stays a text node, and nothing about the paint changes.
 *
 * Deliberately a *trailing* match only. An arrow in the middle of a label would
 * be carrying meaning rather than decorating a "go here" affordance, and
 * silently hiding it would be the opposite of this fix.
 *
 * Presentational-only (D8): one prop in, nothing out. No data access.
 */
import { computed } from 'vue'
import type { MenuItem } from '~/types/bf-contracts'
import { newTabAttrs } from '~/utils/link'

defineOptions({ name: 'BfNavMenuLink' })

const props = defineProps<{ item: MenuItem }>()

/** A run of arrow glyphs at the very end of a label, with any space before it. */
const TRAILING_ARROW = /\s*[←↑→↓↖↗↘↙«»]+$/u

const label = computed(() => {
  const raw = props.item.label
  const match = TRAILING_ARROW.exec(raw)
  return match === null
    ? { text: raw, marker: '' }
    : { text: raw.slice(0, match.index), marker: match[0] }
})
</script>

<template>
  <!--
    `$attrs` falls through to whichever branch renders (single root either way),
    so a caller's `class` reaches the anchor. No `inheritAttrs: false` — this is
    not a wrapper around a base component.
  -->
  <!--
    Each branch keeps the label text and its trailing-arrow span on **one
    source line**, for the reason `CardProject.vue:187-193` records: Vue's
    whitespace condensing would otherwise eat the separation between the last
    word and the marker. Here the space is carried inside the span (it is part
    of the matched `marker`), so it is hidden along with the glyph and no
    stray space is left in the accessible name either.
  -->
  <NuxtLink
    v-if="item.to"
    :to="item.to"
    class="bf-nav__item"
  >
    <strong v-if="item.strong">{{ label.text }}<span v-if="label.marker" aria-hidden="true">{{ label.marker }}</span></strong>
    <template v-else>{{ label.text }}<span v-if="label.marker" aria-hidden="true">{{ label.marker }}</span></template>
  </NuxtLink>
  <a
    v-else
    class="bf-nav__item"
    :href="item.href ?? '#'"
    data-external
    v-bind="newTabAttrs(item.href)"
  >{{ label.text }}<span v-if="label.marker" aria-hidden="true">{{ label.marker }}</span></a>
</template>

<style scoped>
/*
  No `:not()` anywhere in this file (D-20.5, gh#29): `postcss-preset-env`
  mis-lowers a `:not()` containing a complex selector and silently breaks the
  rule. There is nothing here that needs a negation.
*/
@layer components {
  .bf-nav__item {
    /*
      Declared in the rule, not bound inline through a `cssVars` computed — the
      `bfMedia` lesson (gh#26): a component that writes its own custom
      properties inline is no more overridable than one writing flat
      declarations inline, because an ordinary consumer rule cannot outrank an
      inline style. This component emits no inline `style` at all.

      Inherited from `.bf-nav`, with a fallback so the item is still legible if
      a consumer mounts it outside a nav (the footer, #45, will do exactly
      that).
    */
    color: var(--_bf-nav-link-color, var(--color-text));

    /*
      The wireframe's `.wireframe .wf-nav a { text-decoration: none }` with its
      `:hover` underline. Undecorated links are only acceptable where the
      surrounding chrome makes the affordance unmissable — a nav bar and a
      footer column both qualify, which is the judgement the frozen skin already
      made and this inherits rather than relitigates.
    */
    text-decoration: none;
  }

  .bf-nav__item:hover {
    text-decoration: underline;
  }
}
</style>
