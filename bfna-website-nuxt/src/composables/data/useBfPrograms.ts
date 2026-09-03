/**
 * `useBfPrograms` — the program registry of `useWfContent`, backed by the
 * `bfPrograms` content collection instead of the wireframe JSON snapshot.
 *
 * Issue 12 / gh#21. The smallest composable in the family: three documents, no
 * filtering, no ordering. `useWfContent` builds `PROGRAMS` by mapping the
 * snapshot's `heading` to `name`; that rename is now the normaliser's
 * (issue 07), and `tagline` — the first sentence of `intro`, derived there per
 * issues 07 / 09 / 25 — arrives as a stored field too. So this file only
 * reads.
 *
 * Naming, per Irene (Jul 31) and the epic's taxonomy decision: three top-level
 * **programs** (Democracy, Future Leadership, Transatlantic Relations & Global
 * Challenges), each containing **projects**. "Focus areas" is the outdated
 * label and appears nowhere here.
 *
 * ```diff
 * - const { programs, programBySlug } = useWfContent()
 * + const { programs, programBySlug } = await useBfPrograms()
 * ```
 *
 * Members are plain values, not refs, for the same reason as `useBfInsights`:
 * `useAsyncData` has resolved by the time this returns and the content is
 * build-time static, so a page port introduces no `.value`.
 */
import type { Program } from '~/types/bf-contracts'

export const useBfPrograms = async () => {
  const { data } = await useAsyncData('bf-programs', () =>
    queryCollection('bfPrograms').all()
  )

  /**
   * All three programs, in collection order. They carry no ordinal — the nav
   * and the homepage render them in the order they come back, which is what
   * `useWfContent` does with the snapshot array.
   */
  const all: Program[] = data.value ?? []

  return {
    programs: () => all,
    /** One program by slug, or `undefined` — backs the `/{program}` hub route. */
    programBySlug: (slug: string) => all.find(p => p.slug === slug)
  }
}
