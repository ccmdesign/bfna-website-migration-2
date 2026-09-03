/**
 * `useBfProjects` — the project surface of `useWfContent`, backed by the
 * `bfProjects` content collection instead of the wireframe JSON snapshot.
 *
 * Issue 12 / gh#21. Thin by design, exactly like `useBfInsights` (issue 11):
 * one `queryCollection('bfProjects').all()` inside `useAsyncData`, then
 * `.filter()` / `.sort()`. **No synthesis lives here** — every curation flag
 * these members read is a stored field materialised by the build-time
 * normaliser in issue 07:
 *
 * | `useWfContent` derivation | stored field |
 * |---|---|
 * | `inProjectGrid(p)` (l.127-128) | `grid_eligible` |
 * | `GRID_ORDER` + `gridSort` (l.132-141) | `grid_order` |
 * | `FEATURED_SLUGS` membership (l.144) | `featured` |
 * | `NAV_SLUGS` membership (l.148) | `nav` |
 * | `PENDING` chips (l.113-114) | `pending` |
 *
 * Member names and signatures match `useWfContent` exactly, so porting a page
 * is a one-line swap:
 *
 * ```diff
 * - const { projects, projectBySlug } = useWfContent()
 * + const { projects, projectBySlug } = await useBfProjects()
 * ```
 *
 * ## Top-level vs. children
 *
 * The collection holds all **38** documents. 18 are top-level; the other 20
 * are cohort/year pages nested through the `parent_project` M2O self-relation
 * (`class-of-*` under the Fellowship, `cepi-*` under CEPI, the year pages
 * under Summer Enrichment). `useWfContent` keeps two arrays for this —
 * `projectsAll` and `topProjects` — and so does this composable: every list
 * member is top-level, while `projectBySlug` and `projectChildren` search all
 * 38. That split is `useWfContent`'s, reproduced, not invented here.
 *
 * ## Why the two slug arrays are still here
 *
 * Issue 07's Decisions, verbatim: *"Curation order is not stored.
 * `FEATURED_SLUGS`/`NAV_SLUGS` order the homepage and nav lists today; issue
 * 09's schema declares only `featured`/`nav` booleans, so the ordering
 * constants belong to the composables in issue 12."* — i.e. this file.
 *
 * They are **ordering keys only**. The stored flag selects the set; the array
 * merely sorts it, and a document is never included because it appears in an
 * array. Add a slug to `nav` in the normaliser and it shows up here whether or
 * not it is listed below (appended, in collection order). `GRID_ORDER` is not
 * re-declared at all — that one *is* stored, as `grid_order`.
 *
 * ## Why plain arrays, not refs
 *
 * `useAsyncData` has already resolved when this composable returns, and the
 * collection is build-time static content, so the members are unwrapped to
 * plain values — what makes the swap above a one-liner (issue 11 precedent).
 *
 * Formatting (`kindLabel`, `paragraphs`, …) is not re-derived here — it lives
 * in `~/utils/format` (issue 10) and is called by pages.
 */
import type { Project } from '~/types/bf-contracts'

/**
 * Homepage curation order — `useWfContent.ts:144`. Sorts `featuredProjects()`;
 * the stored `featured` flag is what selects it.
 */
const FEATURED_SLUGS = [
  'transatlantic-barometer',
  'transatlantic-periscope',
  'how-to-fix-democracy',
  'the-bertelsmann-foundation-fellowship'
]

/**
 * Nav curation order — `useWfContent.ts:148`. Sorts `navProjects()`; the stored
 * `nav` flag is what selects it.
 */
const NAV_SLUGS = [
  'transatlantic-barometer',
  'transatlantic-periscope',
  'range',
  'how-to-fix-democracy',
  'the-bertelsmann-foundation-fellowship'
]

/**
 * Order `list` by `slugs`, appending anything unlisted in its existing order.
 * Never filters: a flagged document with no curated position still ships.
 */
const orderBySlugs = (list: Project[], slugs: string[]) => {
  const rank = (p: Project) => {
    const i = slugs.indexOf(p.slug)
    return i === -1 ? slugs.length : i
  }
  return [...list].sort((a, b) => rank(a) - rank(b))
}

export const useBfProjects = async () => {
  const { data } = await useAsyncData('bf-projects', () =>
    queryCollection('bfProjects').all()
  )

  /** All 38 documents, cohort/year children included — `projectsAll`. */
  const all: Project[] = data.value ?? []

  /** The 18 top-level projects — `topProjects`. Every list member reads this. */
  const top = all.filter(p => !p.parent_project)

  return {
    /**
     * Top-level projects only; children reach the site through their parent.
     *
     * A fresh array per call (gh#91): `top` backs every other list member, so
     * handing it out directly would let one caller's `.sort()` reorder what the
     * next consumer sees. The filtered members were already safe — `.filter()`
     * allocates before `.sort()` runs.
     */
    projects: () => [...top],
    /**
     * Top-level projects in one program. `program` is the display **name**
     * (`'Democracy'`), not a slug — the same value `useWfContent` takes. The
     * all-projects index uses this unfiltered list, grid pruning is separate.
     */
    projectsByProgram: (program: string) => top.filter(p => p.program === program),
    /**
     * The program-page grid: active, on-site projects in the client's order.
     *
     * Both halves are stored. `grid_eligible` is the normaliser's copy of
     * `inProjectGrid` (drops archived tiers, `exclude_from_grid` rows, external
     * -only products and leftover `kind: 'podcast'` rows). `grid_order` is its
     * copy of the `GRID_ORDER` rank, with `GRID_ORDER_FALLBACK (1_000_000) +
     * <index in the snapshot's items array>` for any slug the client did not
     * place — so ascending order puts ranked slugs first in the declared order
     * and the rest behind them in snapshot order, which is what `gridSort` did.
     * That fallback is a real ordinal, not a sentinel: gh#89 replaced the
     * `Number.MAX_SAFE_INTEGER` tie this comment used to describe, because
     * `queryCollection` returns file-stem order and a tie would have rendered
     * unplaced programs alphabetically. Nothing is re-derived here; this is
     * still a filter and a sort.
     */
    gridProjectsByProgram: (program: string) =>
      // `.filter()` already returns a fresh array, so sorting it in place
      // cannot reach `top`.
      top.filter(p => p.program === program && p.grid_eligible)
        .sort((a, b) => a.grid_order - b.grid_order),
    /**
     * External-only "products" inside a program (The Transponder today):
     * rendered as their own band on the program page, not as grid cards.
     */
    productsByProgram: (program: string) =>
      top.filter(p => p.program === program && p.external_only),
    /** Every external-only product, across programs — the homepage band. */
    allProducts: () => top.filter(p => p.external_only),
    /**
     * Projects whose program is still a `RE-TAG` placeholder (Q3), shown as
     * their own group on the all-projects index. Archived rows are excluded —
     * they live in the archive. Empty today: 100 Questions is archived.
     */
    projectsPendingRetag: () =>
      top.filter(p => (p.program ?? '').startsWith('RE-TAG') && !p.archived),
    /** Any project by slug, **children included** — this backs the detail route. */
    projectBySlug: (slug: string) => all.find(p => p.slug === slug),
    /**
     * Cohort/year pages nested under `slug`, `heading` descending — newest
     * cohort first ("Class of 2026" before "Class of 2010").
     */
    projectChildren: (slug: string) =>
      all
        .filter(p => p.parent_project === slug)
        .sort((a, b) => (b.heading ?? '').localeCompare(a.heading ?? '')),
    /** The 5 nav-curated projects, in nav order. */
    navProjects: () => orderBySlugs(all.filter(p => p.nav), NAV_SLUGS),
    /** The 4 flagship projects of the homepage strip, in curated order. */
    featuredProjects: () => orderBySlugs(all.filter(p => p.featured), FEATURED_SLUGS)
  }
}
