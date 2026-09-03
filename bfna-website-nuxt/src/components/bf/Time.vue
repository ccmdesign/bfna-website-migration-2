<script setup lang="ts">
/**
 * `bfTime` — a real `<time datetime>` element with a human label.
 *
 * Builds from nothing. There is no `wfTime`: where the wireframe layer shows a
 * date it emits bare inline markup — `pages/wireframes/archive.vue:20` and
 * `components/wireframe/wfCardInsight.vue:25` both write
 * `<time>{{ monthYear(i.publish_date) }}</time>`, a `<time>` element with **no
 * `datetime` attribute at all**. That is the gap this atom closes, and it is
 * worth being precise about what the gap costs: a `<time>` without `datetime`
 * is, to every machine that reads the page, an ordinary `<span>` that happens
 * to be spelled differently.
 *
 * ## The one rule
 *
 * **The text node is for a human, the `datetime` attribute is for a machine,
 * and the machine one is never allowed to be wrong.**
 *
 * Everything below follows from that sentence.
 *
 * ## 1. `datetime` is rebuilt, never echoed
 *
 * The obvious implementation — `:datetime="date"` — is wrong, and quietly so.
 * `Date` parses a great deal that HTML does not accept as a datetime value
 * (`'March 5, 2022'`, `'12/17/2014'`), so echoing the prop ships an invalid
 * attribute for every such input while the visible label looks perfect. The
 * value is therefore derived from the *parsed* date:
 *
 * | input | `datetime` | why |
 * |---|---|---|
 * | `'2014-12-17'` — date-only | `'2014-12-17'`, verbatim | already a *valid date string* in HTML. Re-emitting `toISOString()` would invent a midnight-UTC precision the source never had. |
 * | anything else parseable | `parsed.toISOString()` | a *valid global date-and-time string*. |
 *
 * ## 2. The label may drift from the attribute. That is the point
 *
 * `monthYear` (`utils/format.ts`, ported verbatim from the frozen wireframe
 * composable in gh#19) parses a date-only string as **UTC midnight** and renders
 * it through `toLocaleDateString` in the **runtime's local zone**. West of
 * Greenwich, `'2014-08-01'` — a real row, the `argentina` insight — therefore
 * labels as *Jul 2014*.
 *
 * That behaviour is documented and deliberately preserved by `format.ts`; it is
 * not this issue's to change, and the spec puts timezone handling out of scope.
 * But it is exactly why the split matters. The label may shift by one month at a
 * month boundary; the `datetime` attribute stays `2014-08-01`, which is what a
 * crawler, a screen reader and a sort key actually read. Asserted on
 * `/bf-probe/18-bf-time`.
 *
 * ## 3. Invalid input renders nothing — no element, not an empty one
 *
 * `null`, `undefined`, `''`, whitespace and anything `new Date()` cannot parse
 * all render **no element at all**. Not a `<time>` with `datetime="Invalid
 * Date"`, not a `<time>` with an empty label, not an empty `<time>` waiting to
 * be styled by a rule that assumes content.
 *
 * This is the common path, not an edge case: 20 of the 371 rows in
 * `content/bf/insights/` carry `publish_date: null`. A card that renders a bare
 * `<time></time>` for each of them inherits a phantom gap wherever its layout
 * uses `gap` — the element is still a flex/grid item.
 *
 * Presentational-only (BRIEF D8): props in, nothing else. No data access, no
 * store, no `queryCollection`.
 */
import { monthYear } from '~/utils/format'
import type { TimeFormat, TimeProps } from '~/types/bf-contracts'

defineOptions({ name: 'BfTime' })

const props = withDefaults(defineProps<TimeProps>(), {
  format: 'monthYear'
})

/**
 * A *valid date string* in HTML's own grammar: `YYYY-MM-DD`, nothing else.
 * Anchored at both ends, so `'2014-12-17T09:00'` correctly falls through to the
 * full-timestamp branch instead of being truncated.
 */
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

/**
 * The trimmed input, or `''` when there is nothing usable. Trimming first means
 * `' '` is treated as absent rather than handed to `new Date()`, which would
 * reach the same verdict by a longer route.
 */
const raw = computed(() => props.date?.trim() ?? '')

/**
 * `null` whenever the input is absent or unparseable — the single source of
 * truth for the `v-if`, the attribute and the label alike, so the three can
 * never disagree about whether this date exists.
 */
const parsed = computed<Date | null>(() => {
  if (!raw.value) return null
  const d = new Date(raw.value)
  return Number.isNaN(d.getTime()) ? null : d
})

/**
 * The machine-readable value. Always a valid HTML datetime value when it is a
 * string at all — that is the issue's acceptance criterion, stated as code.
 */
const isoValue = computed(() => {
  const d = parsed.value
  if (!d) return null
  return DATE_ONLY.test(raw.value) ? raw.value : d.toISOString()
})

/**
 * The formatter table. One member today; `format` exists so that adding a
 * second is a line here plus a member on `TimeFormat`, rather than a new prop
 * and a new branch at every call site.
 *
 * Keyed by the union type, so a member added to `TimeFormat` without an entry
 * here is a compile error rather than a runtime `undefined`.
 */
const FORMATTERS: Record<TimeFormat, (date: string) => string> = {
  monthYear
}

/** The visible label. Only ever read when `parsed` is non-null. */
const label = computed(() =>
  parsed.value ? FORMATTERS[props.format](raw.value) : ''
)
</script>

<template>
  <!--
    One root, no `inheritAttrs: false` — this is a base atom, not a wrapper, so
    `class`, `style`, `data-*` and any `aria-*` a consumer needs fall straight
    through to the `<time>`.

    The `v-if` is on `isoValue`, not on `date`: the guard and the attribute are
    then provably the same decision, so there is no arrangement of props that
    renders the element without a valid `datetime` on it.
  -->
  <time
    v-if="isoValue"
    class="bf-time"
    :datetime="isoValue"
  >{{ label }}</time>
</template>

<style scoped>
@layer components {
  /*
   * One declaration, and the spec's "no CSS-variable hook needed" is honoured:
   * no custom property, no token, no colour. `<time>` inherits the surrounding
   * typography, which is what a date in a card footer or a byline should do.
   *
   * `nowrap` is here because the label is a two-token string — `Mar 2024` — and
   * the slots this atom was built for (card footers, `bfByline`, the archive's
   * per-year rows) are the narrowest columns on the site. A date broken across
   * two lines reads as two facts.
   */
  .bf-time {
    white-space: nowrap;
  }
}
</style>
