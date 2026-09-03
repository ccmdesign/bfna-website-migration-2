<script setup lang="ts">
/**
 * `bfCtaSection` — the call-to-action band.
 *
 * Evolves `components/wireframe/wfCtaSection.vue` (frozen, D2 — read, never
 * edited). Three call sites, all in `pages/wireframes/projects/[slug].vue`:
 * the **Microsite CTA** band on the microsite template, and the
 * **Participation path** band on the microsite and the full template alike.
 *
 * Presentational-only (D8): props in, no slot, nothing out. Every word of copy
 * arrives as a prop, so it lives in the page or the dataset and never in here —
 * which is what lets the same band carry a project's own microsite pitch on one
 * template and a participation ladder on the next.
 *
 * ## The email-capture variant is gone, deliberately
 *
 * The wf source carries a second mode: a boolean prop that swaps the CTA row
 * for an email input plus a submit control, with the first CTA's label on the
 * button. **D2 killed it** — the subscribe band is not built anywhere in this
 * epic, and neither is the navigation's Subscribe control. So this component
 * declares no such prop, renders no such element, and captures no address.
 *
 * That is a *checked* deletion rather than an oversight. The spec's acceptance
 * greps this file for the word; probe 40 greps the rendered page for the
 * element and the `type="email"` input alike. Nothing below is a stub waiting
 * to grow the mode back: a band that collects an address has a different
 * contract, different validation, a different submit path and a different
 * privacy story, and none of that is in this epic to design.
 *
 * ## It composes `bfSection`; it does not extend it
 *
 * The band is `<bfSection :label gap="s" :heading>` — the three arguments the
 * wf source passes, no more. The prop names are `bfSection`'s as built in
 * gh#48, read out of `Section.vue` rather than assumed: `label` lands as
 * `data-label` on the root `<section>`, `heading` as the band's one `<h2>`, and
 * `gap` as `data-gap` on the inner box, where `@layer composition` resolves it.
 *
 * `padded` is **not** passed, because the wf source does not pass it. A CTA
 * band inherits the page's own band rhythm; `bfPageHeader` (gh#47) is the one
 * that asks for its own padding, and it does so because the wf source it
 * evolves asks for it.
 *
 * ## It composes `bfButton`; it does not re-decide the element
 *
 * The wf source picks the element itself — `NuxtLink` when `to` is set, an `<a>`
 * otherwise, with `href` defaulting to `'#'`. `bfButton` (gh#24) already states
 * that three-way branch once, for the whole system, so the CTAs are handed
 * straight to it: `to` → `NuxtLink`, `href` → `<a>` plus the `[data-external]`
 * marker when `external` is set, neither → `<button type="button">`.
 *
 * The last of those three is the one visible behaviour change, and it is
 * deliberate. Both Participation-path call sites pass `{ label }` alone — the
 * copy is a ladder of steps, not a set of destinations — which the wf source
 * renders as `<a href="#">`: an element that announces itself to a screen
 * reader as a link, takes the tab order as a link, and then goes nowhere but
 * the top of the page. A `<button>` with nothing bound is the honest render of
 * "an action whose target has not been decided yet", and it is the one the
 * dataset can grow a `to` into without the markup changing shape. No synthetic
 * `'#'` is invented here to paper over the difference; probe 40 asserts the
 * branch each of the three real call-site shapes lands on.
 *
 * ## Which CTA is primary
 *
 * `isPrimary` is the wf source's rule, condition for condition: the **first**
 * CTA is the primary one, and any entry may override that by setting `primary`
 * on itself. Only the return value differs — `bfButton` takes a typed `variant`
 * prop where the wf source wrote a raw `data-variant` attribute, so this
 * returns `'default'` where the wf source returned `undefined`, which renders
 * the identical bordered button.
 *
 * Note the rule is per entry and not "exactly one": a list whose second entry
 * sets `primary` gets two filled buttons, because the first entry's default is
 * unconditional. That is upstream's behaviour, kept — the call sites in this
 * epic pass at most one CTA each on the microsite band and none with an
 * override, so narrowing it here would be a change nobody asked for.
 *
 * ## Styling
 *
 * No `<style>` block at all, and therefore no new CSS variable — the spec's own
 * requirement, satisfied by construction rather than by inspection. Every
 * visual decision here belongs to `bfSection`'s hooks, `bfButton`'s hooks, or
 * `.cluster` in `@layer composition`. Probe 40 asserts that no rule anywhere in
 * the loaded CSS selects `bf-cta-section`.
 */
import type { ButtonVariant, Cta } from '~/types/bf-contracts'

defineOptions({ name: 'BfCtaSection' })

interface Props {
  /**
   * The band's name, passed through to `bfSection` as `data-label`. Not an
   * accessible name — that is `heading`'s job, and it is a real `<h2>`.
   */
  label?: string
  /** The band's heading, rendered by `bfSection` as its one `<h2>`. */
  heading?: string
  /**
   * The supporting line under the heading. Absent renders no `<p>` at all —
   * not an empty one, which would still take a gap in the stack.
   */
  message?: string
  /**
   * The actions, in reading order. GGS asks these to name what happens
   * ("Apply to the 2026 cohort"), never "Learn more"; that is a copy rule the
   * dataset keeps, and this component renders whatever it is given.
   */
  ctas?: Cta[]
}

withDefaults(defineProps<Props>(), {
  label: 'CTA',
  heading: undefined,
  message: undefined,
  ctas: () => []
})

/**
 * The wf source's rule, unchanged: first CTA is primary, an entry's own
 * `primary` overrides. `??` and not `||`, so an explicit `primary: false` on
 * the first entry really does demote it.
 */
const isPrimary = (c: Cta, idx: number): ButtonVariant =>
  (c.primary ?? idx === 0) ? 'primary' : 'default'
</script>

<template>
  <!--
    One root — `bfSection` — so this component's own `$attrs` has exactly one
    destination and `bfSection`'s allow-list decides what of it reaches the DOM.
    A caller's `class` merges with `bf-cta-section` and `bf-section` rather than
    replacing either.
  -->
  <bfSection
    class="bf-cta-section"
    :label="label"
    gap="s"
    :heading="heading"
  >
    <!--
      `data-measure="normal"`, resolved by `@layer composition`: the supporting
      line is prose and wants a line-length cap even inside a band that sets
      none of its own.
    -->
    <p
      v-if="message"
      class="bf-cta-section__message"
      data-measure="normal"
    >{{ message }}</p>

    <!--
      `.cluster` with `data-gap="s"` — the wf source's row, attribute for
      attribute. It wraps rather than scrolls, so a band with four CTAs on a
      narrow viewport stacks them instead of clipping any.

      `v-if="ctas.length"`: an empty list renders no row, so a heading-only band
      does not pay a `.stack` gap for an empty element.
    -->
    <div
      v-if="ctas.length"
      class="cluster bf-cta-section__actions"
      data-gap="s"
    >
      <!--
        `:key="c.label"` is the wf source's key and stays load-bearing: the
        entries carry no id, and the label is what distinguishes two actions in
        one band. Two identical labels in one list would be a copy bug first.
      -->
      <bfButton
        v-for="(c, idx) in ctas"
        :key="c.label"
        :to="c.to"
        :href="c.href"
        :external="c.external"
        :variant="isPrimary(c, idx)"
      >{{ c.label }}</bfButton>
    </div>
  </bfSection>
</template>
