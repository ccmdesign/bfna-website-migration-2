<script setup lang="ts">
/**
 * `bfResultCount` — the always-mounted result-count line (a11y epic, gh#226).
 *
 * Extracted from `bfSearchShell`, which held the only correct instance of this
 * pattern in the codebase (`SearchShell.vue:294-301`, added by residual #169)
 * and is now this atom's first consumer. Nothing was redesigned on the way out:
 * a11y BRIEF D27 says reuse the repo's own idiom rather than invent a variant,
 * and the idiom was already written, already commented and already correct.
 *
 * ## The one rule this component exists to hold (a11y BRIEF D29)
 *
 * **The region is mounted in every state, including the one with nothing to
 * say.**
 *
 * A `v-if`, `display: none`, `visibility: hidden` and the `hidden` attribute
 * all remove an element from the accessibility tree. A live region that is
 * inserted into that tree *already holding* its message announces nothing: the
 * mutation an assistive technology would have observed happened before there
 * was a region to observe it in. So "no count yet" renders this same
 * `<p role="status">` with **no text inside it**, and the first real count is a
 * text mutation inside a region that was already there.
 *
 * This is why the component is written as an atom at all rather than left
 * inline: three call sites in this epic need the same guarantee, and each one
 * that hand-rolls it is a place the guarantee can be quietly dropped by a
 * `v-if` that looks like a tidy-up.
 *
 * It is also the precise defect #233 fixes on `/search`, where `search.vue`'s
 * `@layer overrides` rule `display: none`-s this very element while the page is
 * idle — a page-level override this atom cannot defeat and does not try to. The
 * fix there is to pass `:count="null"` and delete the rule, and that is #233's
 * row, not this one's: nothing outside `bfSearchShell` consumes this component
 * yet.
 *
 * ## `role="status"` alone
 *
 * No `aria-live`, no `aria-atomic`. The role carries the implicit
 * `aria-live="polite"` and `aria-atomic="true"`, and writing all three invites
 * them to drift apart silently. `bfLoadMore` does write all three and says why
 * — it is a **visually hidden** region whose whole sentence must be re-read on
 * every change, and enough shipping AT combinations mishandle a role-implied
 * live region to make the redundancy worth it there. This one is visible text a
 * sighted user reads next to the results it counts, and it keeps the shell's
 * original spelling verbatim.
 *
 * ## Styling: there is none, on purpose
 *
 * `.bf-search-shell__count` carried **no rule at all** in `SearchShell.vue`'s
 * `<style scoped>` — that block styles `__results`, `__meter`, `__rank` and
 * `__bar` and nothing else. So this file writes no `<style>` block: there was
 * nothing to carry across, and this pass may not invent a colour, size, weight,
 * spacing, radius or shadow (a11y BRIEF D23/D32). `.bf-result-count` is a hook
 * for pass 2 and for a consumer, not a rule.
 *
 * `$attrs` falls through to the single root on its own (`inheritAttrs` left at
 * its default), so a caller's `class` merges with `bf-result-count` rather than
 * replacing it and a caller's `data-*` hook reaches the element — which is how
 * `bfSearchShell` keeps both `bf-search-shell__count` and
 * `data-bf-search-shell="count"` on the node after the extraction. The second
 * is load-bearing: `search.vue` addresses it by name.
 */
import type { ResultCountProps } from '~/types/bf-contracts'

defineOptions({ name: 'BfResultCount' })

const props = withDefaults(defineProps<ResultCountProps>(), {
  /*
   * `null`, not `0`. The idle state has *no* count to report; `0` is a real
   * count and reads "0 results", which is a failed search reported before one
   * was made. See the contract note in `bf-contracts.ts`.
   */
  count: null,
  noun: 'result',
  nounPlural: undefined,
  query: '',
  suffix: ''
})

/**
 * Is there a count to render?
 *
 * `Number.isFinite` rather than a truthiness test, for the reason
 * `LoadMore.vue`'s `announcement` gives: a legitimate count of `0` — a search
 * that ran and matched nothing — must still announce, and `!count` would
 * silence exactly that case. `NaN` and `Infinity` are page bugs and are treated
 * as "nothing to report" rather than painted as words.
 */
const hasCount = computed<boolean>(() => Number.isFinite(props.count))

/**
 * The noun, singular or plural — `bfSearchShell`'s own `countLabel`, moved.
 *
 * `nounPlural` when it was given, `noun + 's'` otherwise: right for `result`,
 * `item`, `insight` and `project`, and overridable for anything it is not.
 */
const label = computed<string>(() =>
  props.count === 1 ? props.noun : (props.nounPlural ?? `${props.noun}s`)
)
</script>

<template>
  <!--
    Never `v-if`-ed. The element is the live region, and it is in the DOM in
    every state — that is the whole component (D29; see the block comment).

    `role="status"` alone: it implies `aria-live="polite"` and
    `aria-atomic="true"`, and stating them alongside it only creates two things
    that can disagree.

    The interpolations and the single spaces between them stay on **one line**.
    Vue's default `whitespace: 'condense'` drops a whitespace-only text node
    that contains a newline, so breaking this line for readability would delete
    the space between the number and the noun and render "12results".
  -->
  <p class="bf-result-count" role="status">
    <template v-if="hasCount"><strong>{{ count }}</strong> {{ label }}<!--
      The query clause is dropped when there is no query, rather than the whole
      line: the region must persist, but “0 results for “”” is a sentence
      nobody wrote. The count itself stays — a consumer rendering an unfiltered
      list has a real number to report.
    --><template v-if="query"> for “{{ query }}”</template>{{ suffix }}</template>
  </p>
</template>
