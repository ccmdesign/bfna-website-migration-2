/**
 * `useBfPrograms` — the program registry of `useWfContent`, backed by the
 * `bfPrograms` content collection instead of the wireframe JSON snapshot.
 *
 * Issue 12 / gh#21. The smallest composable in the family: three documents, no
 * filtering, one sort. `useWfContent` builds `PROGRAMS` by mapping the
 * snapshot's `heading` to `name`; that rename is now the normaliser's
 * (issue 07), and `tagline` — the first sentence of `intro`, derived there per
 * issues 07 / 09 / 25 — arrives as a stored field too. So this file only
 * reads.
 *
 * Ordering is the normaliser's too, since gh#180: the snapshot's array position
 * arrives as a stored `order`, and this file's only job beyond reading is the one
 * ascending sort on it.
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
   * All three programs in the client's curated order — Democracy, Transatlantic
   * Relations & Global Challenges, Future Leadership — carried across the move
   * to per-file documents by the normaliser's stored `order` (gh#180).
   *
   * Sorted **once**, here, on the stored key: `queryCollection` hands back
   * file-stem (alphabetical) order, which put Future Leadership second on the
   * home Programs band where the wireframe puts it third. Exactly what
   * `useBfProjects` does with `grid_order` (gh#89) — the composable compares a
   * materialised ordinal, it never re-derives the ordering (D3).
   */
  const all: Program[] = [...(data.value ?? [])].sort((a, b) => a.order - b.order)

  return {
    /**
     * All three, in `order` — a fresh array per call (gh#91), so a caller's
     * in-place `.sort()` cannot reorder the `useAsyncData` payload for every
     * other consumer in the same render.
     */
    programs: () => [...all],
    /** One program by slug, or `undefined` — backs the `/{program}` hub route. */
    programBySlug: (slug: string) => all.find(p => p.slug === slug)
  }
}
