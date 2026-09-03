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
 * Presentational-only (D8): one prop in, nothing out. No data access.
 */
import type { MenuItem } from '~/types/bf-contracts'

defineOptions({ name: 'BfNavMenuLink' })

defineProps<{ item: MenuItem }>()
</script>

<template>
  <!--
    `$attrs` falls through to whichever branch renders (single root either way),
    so a caller's `class` reaches the anchor. No `inheritAttrs: false` — this is
    not a wrapper around a base component.
  -->
  <NuxtLink
    v-if="item.to"
    :to="item.to"
    class="bf-nav__item"
  >
    <strong v-if="item.strong">{{ item.label }}</strong>
    <template v-else>{{ item.label }}</template>
  </NuxtLink>
  <a
    v-else
    class="bf-nav__item"
    :href="item.href ?? '#'"
    data-external
  >{{ item.label }}</a>
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
