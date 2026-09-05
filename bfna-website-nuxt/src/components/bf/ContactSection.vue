<script setup lang="ts">
/**
 * `bfContactSection` — the contact band: a form beside a visit-us block.
 *
 * Evolves `components/wireframe/wfContactSection.vue` (frozen, D2 — read for
 * parity, never edited), whose whole body is:
 *
 * ```vue
 * <wf-section label="Contact" layout="switcher" gap="l">
 *   <form class="stack" data-gap="s" @submit.prevent>
 *     <h2>Contact</h2>
 *     <p><a href="mailto:info@bfna.org">info@bfna.org</a></p>
 *     <label class="stack" data-gap="2xs">Name<input type="text"></label>
 *     <label class="stack" data-gap="2xs">Email<input type="email"></label>
 *     <label class="stack" data-gap="2xs">Message<textarea rows="4" /></label>
 *     <div><button type="submit" class="wf-button" data-variant="primary">Send message</button></div>
 *   </form>
 *   <div class="stack" data-gap="s">
 *     <h2>Visit us</h2>
 *     <p>Bertelsmann Foundation North America</p>
 *     <p>[street address — Directus contact singleton]</p>
 *   </div>
 * </wf-section>
 * ```
 *
 * Element for element, that shape is kept. What changes is that the three
 * hand-rolled `<label><input></label>` pairs become `bfFormField`s inside a
 * `bfFormGroup`, and that every string the wf source hardcodes now arrives as
 * a prop — with the wf literal as the default, so the band renders at parity
 * from props alone.
 *
 * ## The keep-vs-decompose decision, resolved
 *
 * `component-inventory-v2.md` §5 / §4 E4 left this open: keep
 * `bfContactSection` as **one** component — which is what was actually built —
 * or decompose it into `bfSection` + `bfFormField` per v1's original plan.
 *
 * **Resolved: keep it as one component, with the form composed internally from
 * the field molecules.** The two halves of the open call are not in tension
 * once the question is asked at the right altitude. "Decompose" was never a
 * request to delete this band; it was a request that the *form* stop being
 * hardcoded markup. Composing `bfFormGroup` + three `bfFormField` inside a
 * component that still exists satisfies that request in full, and keeping the
 * band means the page that mounts it writes one tag instead of re-deriving a
 * two-column form-beside-address layout at every call site. Written out in the
 * spec's Decisions section (D-44.1), which is half this issue's acceptance.
 *
 * ## The three refs are UI state, not data (D8)
 *
 * `bfFormField` is a controlled component: `modelValue` in,
 * `update:modelValue` out, and it never holds the string itself — deliberately,
 * so that a caller that wants debouncing or a draft store owns that decision.
 * *Something* has to hold it, and for a band with no submit target that
 * something is here: three `ref('')`s, one per control.
 *
 * That is not a D8 violation. D8 forbids a `bf-*` component reading content —
 * `queryCollection`, a data composable, a store. Nothing here reads anything;
 * the refs are the transient contents of three text boxes, which have no
 * meaning outside this band and no source outside the keyboard. Every word of
 * *copy* still arrives as a prop.
 *
 * ## No submission, deliberately
 *
 * `@submit.prevent` and nothing else. No endpoint exists (spec § Out of
 * scope), so there is no action, no method, no `fetch`, no success or error
 * state, and no spam protection — and no validation either: `bfFormField`'s
 * `error` is caller-supplied and nothing here supplies one, so no field turns
 * red on its own. `.prevent` is load-bearing rather than decorative: without
 * it a submit would navigate to the current URL with an empty query string,
 * discarding whatever the visitor had typed. Probe 44 clicks the button and
 * asserts the page did not navigate.
 *
 * ## The accessible error plumbing is wired, the behaviour still is not (gh#229)
 *
 * The audit measured this band's three controls as `required: false`,
 * `aria-required: null`, `aria-describedby: null`, `aria-invalid: null`, the
 * `<form>` with no `novalidate` and the band with no status region — while
 * `bfFormField` implemented every one of those correctly and this call site
 * used none of it (a11y BRIEF §0, "Contact form").
 *
 * gh#229 wires the call site. It does **not** add behaviour: there is still no
 * submit handler, no `fetch` and no validation, because the endpoint is
 * site-epic #72's. What changes is that the *semantics* are now complete and a
 * handler, when it lands, has somewhere to put its output — `errors` and
 * `status` below — rather than needing this template edited again.
 *
 * `novalidate` on the `<form>` is the one piece that is not merely plumbing.
 * The email field is `type="email"`, so without it the user agent's own
 * constraint bubble fires *before* the `submit` event: a message that is not
 * the `aria-describedby` target, is not a live region, is announced
 * inconsistently across UA/AT pairs and disappears on the next keystroke. With
 * it, the only error surface is `bfFormField`'s — one `<p>`, referenced by
 * `aria-describedby`, carrying `role="alert"`.
 *
 * The controls carry `name` attributes (`name`, `email`, `message`) through
 * `$attrs`. Nothing reads them today; they are what a form's controls are
 * called, and the day an endpoint lands the band already speaks `FormData`.
 *
 * ## Styling: two rules, and both are subtractions
 *
 * No new CSS variable and no colour of any kind. The first rule neutralises
 * `base/forms.css`'s `fieldset { margin-bottom: var(--space-m) }` — see the
 * `<style>` block for why it is neutralised here rather than fixed there. The
 * second (gh#229) takes the user agent's 1em start margin off the status
 * region, which renders empty in every state this component currently has.
 */
defineOptions({ name: 'BfContactSection' })

/**
 * Every string the wf source hardcodes.
 *
 * Declared locally rather than in `src/types/bf-contracts.ts`: BRIEF §5 rule 11
 * governs **shared** types, and nothing outside this file names this shape —
 * the same call `bfCtaSection` (gh#49), `bfPageHeader` (gh#47) and the six card
 * wrappers already make. The spec writes it as `interface Props` too.
 *
 * The defaults are the wf literals, so `<bfContactSection />` with no props at
 * all renders the band the wireframe was approved at. They are placeholders in
 * the D5 sense — real contact copy lands when the Directus contact singleton
 * does, and it lands as props, not as edits here.
 */
interface Props {
  /**
   * The address the `mailto:` link points at, and its own visible text.
   *
   * One prop for both halves on purpose: an anchor whose text says one address
   * and whose `href` sends mail to another is a defect that no reader can see,
   * and splitting them into two props is an invitation to write it.
   */
  email?: string
  /**
   * The form column's heading, and the `<legend>` naming the control group.
   *
   * Also one prop for both, and for the reason the spec's own example
   * (`<bfFormGroup legend="Contact">` under a `Contact` heading) implies: the
   * `<h2>` names the column in the document outline and the `<legend>` names
   * the same set of controls in the accessibility tree. Two props would let
   * them drift, and a group whose name contradicts the heading above it is
   * worse than one that merely repeats it.
   */
  heading?: string
  /** The right column's heading. */
  visitHeading?: string
  /**
   * The street address, rendered as its own paragraph under the organisation
   * name. Absent renders no `<p>` at all — not an empty one, which would still
   * take a gap in the stack.
   */
  address?: string
  /**
   * Per-field error messages, keyed by the control's `name` (gh#229).
   *
   * Caller-supplied, exactly as `bfFormField.error` is: this band runs no
   * validation and never writes into this object. Passing one turns that field
   * into `aria-invalid="true"` with an `aria-describedby` pointing at a
   * `role="alert"` `<p>` carrying the string — the plumbing `bfFormField`
   * already had and this call site did not use.
   *
   * Three named optional properties rather than a `Record<string, string>`.
   * The fields are fixed and known at compile time, so an index signature buys
   * nothing and costs the `noUncheckedIndexedAccess` widening the three refs
   * below already document — and named keys mean a typo in a caller's object
   * is a typecheck error rather than an error message that silently never
   * renders.
   */
  errors?: ContactErrors
  /**
   * The outcome of a submission, announced by the band's `role="status"`
   * region (gh#229).
   *
   * Empty is the idle state, and the region is mounted anyway — D29: a live
   * region that is `display: none` (or absent) while idle is not in the
   * accessibility tree when the text arrives, so the announcement is lost.
   * Nothing here sets it; the handler site-epic #72 adds will.
   */
  status?: string
}

/**
 * The shape of `Props.errors`.
 *
 * Declared locally, not in `src/types/bf-contracts.ts`, for the reason the
 * `Props` docblock above already gives: BRIEF §5 rule 11 governs **shared**
 * types, and nothing outside this file names this shape.
 */
interface ContactErrors {
  /** The Name field's error, or absent for "no error". */
  name?: string
  /** The Email field's error. */
  email?: string
  /** The Message field's error. */
  message?: string
}

withDefaults(defineProps<Props>(), {
  email: 'info@bfna.org',
  heading: 'Contact',
  visitHeading: 'Visit us',
  address: '[street address — Directus contact singleton]',
  /*
    A factory, because an object default shared across every instance of a
    component is the classic mutable-default bug — and `''` for the status, not
    `undefined`, so the region renders an empty text node rather than nothing
    at all.
  */
  errors: () => ({}),
  status: ''
})

/**
 * The three control values.
 *
 * One `ref` each rather than one `reactive` object keyed by field name: the
 * fields are fixed and known at compile time, so a record buys nothing and
 * costs an index signature that `noUncheckedIndexedAccess` widens to
 * `string | undefined` — which is not a legal `v-model` target for a prop typed
 * `string` (probe 34 hit exactly that and wrote the pair out by hand).
 *
 * The `…Value` suffix is not decoration: a bare `const email` in
 * `<script setup>` shadows the `email` **prop** of the same name for the whole
 * template, so `{{ email }}` in the mailto link would render the empty contents
 * of the input instead of the address. Two of the three collide that way.
 */
const nameValue = ref('')
const emailValue = ref('')
const messageValue = ref('')
</script>

<template>
  <!--
    One root — `bfSection` — so this component's `$attrs` has exactly one
    destination and `bfSection`'s own allow-list decides what of it reaches the
    DOM. A caller's `class` merges with `bf-contact-section` and `bf-section`
    rather than replacing either.

    `label`, `layout` and `gap` are the three arguments the wf source passes,
    unchanged: `label="Contact"` lands as `data-label`, `switcher` puts the two
    columns side by side and stacks them under the primitive's own threshold,
    and `gap="l"` is the rhythm between them. `heading` is deliberately NOT
    passed to `bfSection` — the wf source puts its two `<h2>`s inside the two
    columns, one each, and a band-level heading would render a third above both.
  -->
  <bfSection
    class="bf-contact-section"
    label="Contact"
    layout="switcher"
    gap="l"
  >
    <!--
      Left column. `.stack` with `data-gap="s"` — the wf source's own
      composition and its own value.

      `@submit.prevent` with no handler expression: the modifier is the whole
      behaviour. Writing `@submit.prevent="() => {}"` would be the same thing
      with a function nobody calls; writing `@submit="onSubmit"` and calling
      `preventDefault()` inside would move a one-word guarantee into a body
      someone can later add a `fetch` to without changing the template.

      `novalidate` (gh#229) — see the § in the header block. It suppresses the
      user agent's own constraint bubble so that the only error surface is the
      one that is properly associated and properly announced. It does NOT
      remove the constraints: `required` still reaches the accessibility tree
      on every control, and `type="email"` still reports its validity through
      the constraint-validation API for the handler site-epic #72 adds.
    -->
    <form
      class="bf-contact-section__form | stack"
      data-gap="s"
      novalidate
      @submit.prevent
    >
      <h2 class="bf-contact-section__heading">{{ heading }}</h2>

      <!--
        NO class on the anchor, and that is load-bearing rather than an
        omission. `base/reset.css` and `base/typography.css` both style links
        through `a:not([class])` — `color: currentcolor`, then
        `color: var(--link-color, …)` and `text-decoration: none`. Giving this
        anchor a BEM class takes it out of both selectors, and it falls back to
        the user agent's own link blue and underline: a colour that is in no
        token and that the wireframe's own `<a href="mailto:info@bfna.org">`
        never had. Probe 44 compares this anchor's resolved colour against a
        bare classless reference anchor, so re-adding a class fails a row
        rather than changing a colour quietly.
      -->
      <p><a :href="`mailto:${email}`">{{ email }}</a></p>

      <!--
        The group. `legend` is bound to the same `heading` prop the `<h2>`
        above renders — see `Props.heading`.

        The three fields are `bfFormField`s, which is the half of the
        keep-vs-decompose decision that says "composed from the field
        molecules": each renders a `<label for>` explicitly associated with its
        control, which is the association the wf source's wrapping `<label>`
        made implicitly and would have lost the moment anything came between the
        two.

        `v-model` on each, over the three refs above.

        `required` on all three (gh#229). A contact form with an optional
        message is not a contact form, and the accessibility half is the point:
        `bfFormField` binds it as the **native** attribute on the control,
        which is what maps to the required state in the accessibility tree. No
        `aria-required` is written beside it — the native attribute IS the
        mapping, and a redundant `aria-required="true"` is a second copy of one
        fact that can later disagree with the first. The visible `*` marker
        `bfFormField` draws is already `aria-hidden` (`FormField.vue:236-243`),
        so nothing hears "star" on top of "required".

        `:error` on all three, bound to the caller's `errors` object. Still no
        `hint`. Nothing here supplies an error — the default is `{}` — so no
        field turns red on a judgement nobody made; what changed is that a
        caller with a judgement to report now has somewhere to report it, and
        `aria-invalid` / `aria-describedby` / `role="alert"` follow from
        `bfFormField` without another edit here.
      -->
      <bfFormGroup :legend="heading" class="bf-contact-section__fields">
        <bfFormField
          v-model="nameValue"
          label="Name"
          type="text"
          name="name"
          autocomplete="name"
          required
          :error="errors.name"
        />
        <bfFormField
          v-model="emailValue"
          label="Email"
          type="email"
          name="email"
          autocomplete="email"
          required
          :error="errors.email"
        />
        <!--
          `rows="4"` is the wf source's value, and it needs no prop of its own:
          `bfFormField` puts `$attrs` on the control, so it lands on the
          `<textarea>` where it means something.
        -->
        <bfFormField
          v-model="messageValue"
          label="Message"
          type="textarea"
          name="message"
          :rows="4"
          required
          :error="errors.message"
        />
      </bfFormGroup>

      <!--
        The wrapping `<div>` is the wf source's and is load-bearing: a bare
        button as a direct child of a `.stack` — a flex column with the default
        `align-items: stretch` — is stretched to the full column width. The
        `<div>` takes the stretch and the button sits at its content width.

        `type="submit"` reaches the `<button>` through `$attrs`: `bfButton`
        writes `type="button"` *before* `v-bind="$attrs"` precisely so a caller
        that needs a submit control gets one (its own source comment names this
        component). Probe 44 asserts the rendered `type`, rather than trusting
        that comment.

        The status region lives in this `<div>`, next to the control whose
        outcome it reports, and that placement is load-bearing twice over
        (gh#229):

        1. **D29 — always mounted, never `display: none`.** The `<p>` is
           rendered unconditionally with `status` empty by default, so the live
           region is in the accessibility tree *before* there is anything to
           announce. A `v-if` here would defeat the whole point: an element
           inserted at the same moment its text arrives is announced by fewer
           AT/UA pairs than one that was already there and changed.
        2. **It must not be a `.stack` child.** `.bf-contact-section__form` is
           a flex column with `gap: var(--space-s)`, and flex gap is applied
           between items whatever their size — so an empty `<p>` placed
           directly in the form would add one `--space-s` of vertical space to
           the column while rendering nothing. Inside this `<div>`, an empty
           `<p>` is a zero-height block in normal flow and the layout is
           byte-identical to before (D23 / DoD-A10: this row changes nothing a
           sighted user can see).

        `role="status"` alone — no `aria-live`, no `aria-atomic`. The role
        already implies `aria-live="polite"` and `aria-atomic="true"`, and this
        is the idiom `bfResultCount` uses and `check-routes.ts` already asserts
        for it (gh#226).
      -->
      <div>
        <bfButton type="submit" variant="primary">Send message</bfButton>
        <p class="bf-contact-section__status" role="status">{{ status }}</p>
      </div>
    </form>

    <!--
      Right column, the wf source's block: heading, the organisation's name,
      the street address.

      The organisation's name stays a literal while the address is a prop, and
      that asymmetry is the spec's: `email` and `address` are the two strings it
      names as placeholders "until the Directus contact singleton exists". The
      foundation's own name is not pending content — this component ships as
      part of the Bertelsmann Foundation North America's site — so making it a
      prop would offer a caller a decision that has no second answer.
    -->
    <div class="bf-contact-section__visit | stack" data-gap="s">
      <h2>{{ visitHeading }}</h2>
      <p>Bertelsmann Foundation North America</p>
      <p v-if="address">{{ address }}</p>
    </div>
  </bfSection>
</template>

<!--
  Deliberately **unscoped**, the `bfCard` (gh#41) and `bfFormGroup` (gh#43)
  precedent.

  The one rule below targets the `<fieldset>` that `bfFormGroup` renders. Vue's
  scoped CSS does stamp a child component's *root* element with this
  component's scope id, so a `scoped` block would in fact match it today — but
  only for as long as the fieldset stays `bfFormGroup`'s root element, which is
  a fact about another component's template that nothing here can hold still. A
  rule anchored on this component's own block class costs nothing to make
  global and cannot be broken from outside.

  `@layer components` must survive into the built stylesheet — see the note in
  `Button.vue`; `postcss-preset-env`'s cascade-layer polyfill would otherwise
  flatten it into an unlayered rule that outranks every layer (gh#101). Probe 44
  reads the live CSSOM for this rule's layer membership.

  No `:not()` appears below, complex-selector or otherwise (D-20.5, gh#29), no
  colour of any kind (BRIEF §5 rule 2, DoD-6), and no new custom property (the
  spec's own styling requirement) — the single declaration is a zero.
-->
<style>
@layer components {
  /*
    Residual #155, neutralised locally.

    `base/forms.css` gives EVERY `<fieldset>` a `margin-bottom: var(--space-m)`
    in `@layer defaults`. Inside this band that margin is added to the bottom of
    the group, below the last field and above the submit row — so the form
    column carries a gap the `.stack` did not ask for and the `gap="l"` between
    the two columns is not the only rhythm on the page.

    It is fixed HERE and not THERE on purpose. `forms.css` is a defaults-layer
    file serving every `<fieldset>` in the app — when this was written, that
    included the ones rendered under `layouts/legacy-base.vue`, since retired
    by gh#67. Changing it is a defaults-layer decision that wants a sweep of the
    remaining fieldsets first, which is out of scope for a component issue (the
    residual says exactly this, and gh#43 declined it for the same reason).
    Neutralising it locally leaves that decision open and leaves every other
    fieldset rendering as it does today.

    `margin-block-end`, not `margin-bottom`: this file is logical-property
    throughout, and the two cascade together — the logical and physical
    longhands map to one computed value, resolved by the cascade, and
    `@layer components` outranks `@layer defaults`. Probe 44 measures the
    fieldset's computed `margin-bottom` rather than trusting that.
  */
  .bf-contact-section fieldset {
    margin-block-end: 0;
  }

  /*
    The status region's start margin, zeroed (gh#229).

    `base/reset.css:81-92` zeroes `margin-block-end` on `p` and deliberately
    leaves the user agent's `margin-block-start: 1em` alone — that inherited
    1em is the site's paragraph rhythm and this row does not touch it. But the
    status region renders an EMPTY string in the idle state, which is every
    state until site-epic #72 ships a submit handler, and an empty `<p>` with a
    1em start margin is 1em of vertical space added to the submit row for a box
    that draws nothing. DoD-A10 / D23: this row changes nothing a sighted user
    can see, so the margin comes off.

    `margin-block-start`, not `margin-top`, and no colour, size, weight or
    radius anywhere in this rule — the declaration is a zero, like the fieldset
    rule above it. What the spacing should be *when a message is present* is a
    design decision belonging to whoever ships the behaviour; leaving it at 0
    declines to make it here.

    `:empty` is deliberately NOT used to scope this to the idle state. Vue
    renders `{{ status }}` as a text node whose data is the empty string, and
    whether an element containing one matches `:empty` is a Selectors-4
    behaviour that differs across engines — exactly the kind of thing the
    WebKit list-role note in `Breadcrumb.vue:238-240` warns about.
  */
  .bf-contact-section__status {
    margin-block-start: 0;
  }
}
</style>
