/**
 * `useBfInsights` — the insight surface of `useWfContent`, backed by the
 * `bfInsights` content collection instead of the wireframe JSON snapshot.
 *
 * Issue 11 / gh#20. Thin by design: one `queryCollection('bfInsights').all()`
 * inside `useAsyncData` (the pattern `composables/data/useHighlights.ts`
 * already uses), then filter and sort. **No synthesis lives here** — every
 * rename, flag and bucket this composable reads (`featured`, `retired_news`,
 * `archived`, `program`, `projects`) is a stored field materialised by the
 * build-time normaliser in issue 07.
 *
 * Member names and signatures match `useWfContent` exactly, so porting a page
 * is a one-line swap:
 *
 * ```diff
 * - const { active, bySlug } = useWfContent()
 * + const { active, bySlug } = await useBfInsights()
 * ```
 *
 * ## The 371 / 354 split
 *
 * The collection holds **371** documents, not 354: the 354 body items plus 17
 * Directus *highlight* records — 8 `featured`, 9 `retired_news` — which have
 * no slug overlap with the items (issue 07's Decisions). `useWfContent` keeps
 * these apart too: its `items` is `insights.json.items` (354) and its
 * `highlights()` is `insights.json.featured` (8). So `items` here is the
 * documents carrying **neither** flag, and `active` + `archived` partition it
 * — 98 + 256 = 354. The 9 `retired_news` records are surfaced by no
 * `useWfContent` member and are therefore surfaced by none here.
 *
 * ## Why plain arrays, not refs
 *
 * `useAsyncData` has already resolved when this composable returns, and the
 * collection is build-time static content, so the members are unwrapped to
 * plain values. That is what makes the swap above a one-liner: no `.value` is
 * introduced into page code that used `useWfContent`.
 *
 * Formatting (`formatLabel`, `kindLabel`, `monthYear`, `paragraphs`) is not
 * re-derived here — it lives in `~/utils/format` (issue 10) and is called by
 * pages.
 *
 * ## Every list member hands back a copy
 *
 * `items`, `active` and `archived` are exposed as **getters** that spread the
 * private arrays, so a caller doing `active.sort()` or `items.reverse()`
 * mutates its own copy and cannot reach the `useAsyncData` payload, the other
 * members, or another consumer in the same render (gh#91, promoted residual of
 * gh#22). Getters rather than a single `[...]` at the return site because these
 * three are exposed as **values**, not functions — that is the `useWfContent`
 * shape pages destructure — so the copy has to be made per access. The private
 * consts stay closed over by `bySlug`, `activeByProgram`,
 * `archivedCountByProgram` and `insightsForProject`, which therefore always
 * read the un-mutated lists. The filtered members were already safe:
 * `.filter()` allocates before `.sort()` runs.
 */
import type { Insight } from '~/types/bf-contracts'

/**
 * Newest first, by `publish_date`. Byte-for-byte the comparator
 * `useWfContent` uses, kept in JS rather than delegated to `.order()` so that
 * documents with a null `publish_date` sort exactly as they do in the
 * wireframe (SQLite orders NULLs differently).
 */
const byPublishDateDesc = (a: Insight, b: Insight) =>
  (b.publish_date ?? '').localeCompare(a.publish_date ?? '')

export const useBfInsights = async () => {
  const { data } = await useAsyncData('bf-insights', () =>
    queryCollection('bfInsights').all()
  )

  /** All 371 documents, highlight records included. Internal. */
  const all: Insight[] = data.value ?? []

  /**
   * The 354 body items — the set `useWfContent.items` exposes. Collection
   * order: the documents carry no ordinal, and the only wireframe consumer of
   * `items` (`search.vue`) re-sorts by relevance score.
   */
  const items = all.filter(i => !i.featured && !i.retired_news)

  /** Non-archived items, `publish_date` descending. */
  const active = items.filter(i => !i.archived).sort(byPublishDateDesc)

  /** Archived items, `publish_date` descending. */
  const archived = items.filter(i => i.archived).sort(byPublishDateDesc)

  /**
   * First item with this slug. Two slugs appear twice among the 354 (issue
   * 07's cross-collection duplicates); `useWfContent` returns the first match
   * via `.find()` and so does this.
   */
  const bySlug = (slug: string) => items.find(i => i.slug === slug)

  return {
    // A fresh array per access (gh#91). Inside each getter the identifier
    // resolves to the private const above — an object literal's property names
    // create no binding — so this is a spread, not a recursive read.
    get items() {
      return [...items]
    },
    get active() {
      return [...active]
    },
    get archived() {
      return [...archived]
    },
    bySlug,
    /**
     * Active items in one program. `program` is the display **name**
     * (`'Democracy'`), not a slug — `[area].vue` calls this with `area.name`.
     */
    activeByProgram: (program: string) => active.filter(i => i.program === program),
    /** How many archived items one program holds — the archive-band counter. */
    archivedCountByProgram: (program: string) =>
      items.filter(i => i.archived && i.program === program).length,
    /**
     * The homepage featured strip: the 8 Directus highlight records the
     * normaliser flagged `featured`. Replaces `useWfContent`'s
     * `insights.json.featured` array lookup — same records, now stored rows.
     */
    highlights: () => all.filter(i => i.featured),
    /** Active items cross-referencing this project slug (the real M2M). */
    insightsForProject: (slug: string) => active.filter(i => i.projects?.includes(slug))
  }
}
