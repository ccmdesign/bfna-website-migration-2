/**
 * `useBfPeople` — the people surface of `useWfContent`, backed by the
 * `bfPeople` content collection instead of the wireframe JSON snapshot.
 *
 * Issue 13 / gh#22. Thin by design, exactly like `useBfInsights` (issue 11) and
 * `useBfProjects` (issue 12): one `queryCollection('bfPeople').all()` inside
 * `useAsyncData`, then `.filter()` / `.sort()`. **No synthesis lives here** —
 * the `board` flag these members read is a stored field materialised by the
 * build-time normaliser in issue 08.
 *
 * Member names and signatures match `useWfContent` exactly, so porting a page
 * is a one-line swap:
 *
 * ```diff
 * - const { boardMembers, teamMembers } = useWfContent()
 * + const { boardMembers, teamMembers } = await useBfPeople()
 * ```
 *
 * ## Why Board (4) + Team (10) is 14 entries over 13 people
 *
 * The two lists are **not** a partition, and reproducing that is the whole job
 * of this file. `useWfContent` runs two different predicates:
 *
 * | list | `useWfContent` | here |
 * |---|---|---|
 * | Board (l.263) | `p.board \|\| /board/i.test(p.job_title ?? '')` | the stored `board` flag |
 * | Team (l.264) | `!/board/i.test(p.job_title ?? '')` | the same regex, unported |
 *
 * The normaliser stored the **whole OR** as `board`, so `boardMembers()` is a
 * flag read. The Team filter is the **regex half only** and stays a
 * composable-side filter — issue 08's Decisions say so in as many words: *"the
 * Team list stays a composable-side filter (issue 13), it is not inverted from
 * `board`."*
 *
 * That asymmetry is deliberate, and it is the client's:
 *
 * - `irene-braam` — raw `board: true`, job title "Executive Director" — appears
 *   in **both** lists. She joins the Board while staying Executive Director in
 *   Team (Irene, Aug 5 widget feedback; `useWfContent.ts:261-262`).
 * - `wilhelm-friedrich-uhr` — "Executive **Board** and Chief Operating Officer"
 *   — matches the regex, so he is Board-only.
 *
 * Board resolves **4** (`irene-braam`, `liz-mohn`, `stephen-f-szabo`,
 * `wilhelm-friedrich-uhr`), Team **10**, and their **union** is all 13. The
 * spec's "3" predates issue 08 running the predicate against real data; see
 * this issue's Decisions.
 *
 * ## Why plain arrays, not refs
 *
 * `useAsyncData` has already resolved when this composable returns, and the
 * collection is build-time static content, so the members are unwrapped to
 * plain values — what makes the swap above a one-liner (issue 11 precedent).
 */
import type { Person } from '~/types/bf-contracts'

/**
 * Last name = the final whitespace-delimited token of `name`, byte-for-byte
 * `useWfContent.ts:265`'s `name.split(' ').at(-1)`. Crude on purpose: parity
 * with the wireframe beats a smarter parse, and every one of the 13 names is a
 * plain "First … Last".
 */
const lastName = (p: Person) => p.name.split(' ').at(-1) ?? ''

export const useBfPeople = async () => {
  const { data } = await useAsyncData('bf-people', () =>
    queryCollection('bfPeople').all()
  )

  /** All 13 documents, collection order. */
  const all: Person[] = data.value ?? []

  return {
    /**
     * Everyone, unfiltered — `useWfContent.people()`.
     *
     * A fresh array per call (gh#91): `all` **is** the `useAsyncData` payload,
     * so returning it directly would let a caller's `people().sort()` reorder
     * the cached value for every other consumer in the same render. The
     * filtered members below were already safe for the reason documented on
     * `teamMembers`.
     */
    people: () => [...all],
    /**
     * The Board list. Reads the stored flag; the OR that produced it ran once,
     * in the normaliser. 4 documents.
     */
    boardMembers: () => all.filter(p => p.board),
    /**
     * The Team list, alphabetical by last name (Irene, Aug 5). Drops only the
     * people whose **job title** says Board, so the Executive Director stays.
     * 10 documents.
     *
     * `.filter()` already returns a fresh array, so sorting it in place cannot
     * reach `all` (the gh#21 precedent).
     */
    teamMembers: () =>
      all
        .filter(p => !/board/i.test(p.job_title ?? ''))
        .sort((a, b) => lastName(a).localeCompare(lastName(b)))
  }
}
