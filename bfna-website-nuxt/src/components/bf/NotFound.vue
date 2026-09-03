<script lang="ts">
/**
 * `bfNotFound` — the second name of `bfEmptyState`, not a second component.
 *
 * This file has no template, no props and no style. It re-exports
 * `EmptyState.vue`'s default export, so Nuxt's `components/bf` scanner
 * registers `bfNotFound` as an auto-import name bound to **the same component
 * object**: `<bfNotFound>` and `<bfEmptyState>` are `===`, share one contract,
 * one stylesheet and one `.bf-empty-state` root. Probe 33 asserts that
 * identity rather than assuming it.
 *
 * ## Why an alias exists at all
 *
 * A 404 route reading `<bfNotFound heading="Page not found">` says what it
 * means, and the epic's own issue list names both. The alias costs three lines
 * and buys a call site that reads like the situation it handles.
 *
 * ## Why a re-export rather than a wrapper
 *
 * A wrapper — `<bfEmptyState v-bind="$attrs"><slot /></bfEmptyState>` — is the
 * obvious alternative and is worse in three ways that all bite later:
 *
 * 1. **The props contract forks.** A wrapper must restate every prop or lean
 *    on `$attrs`, and `$attrs` loses the types, the defaults and the `Boolean`
 *    casting. Two files then have to be kept in step, which is the duplication
 *    this issue exists to remove, moved one level up.
 * 2. **Slots have to be forwarded by hand**, and a forwarded default slot is
 *    not the same as the real one for scoped slots or for `useSlots()` checks.
 * 3. **It is a real extra component instance** in the tree, with its own
 *    render function and its own name in devtools and in error traces — so a
 *    reader debugging `bfNotFound` sees two frames for one block.
 *
 * The re-export has none of that: there is nothing here to drift.
 *
 * The default export is aliased through a named import rather than written as
 * `export { default } from './EmptyState.vue'`, because the SFC compiler looks
 * for a literal `export default` when it decides what the component of a
 * `<script>` block is, and a re-export declaration is not one.
 */
import EmptyState from './EmptyState.vue'

export default EmptyState
</script>
