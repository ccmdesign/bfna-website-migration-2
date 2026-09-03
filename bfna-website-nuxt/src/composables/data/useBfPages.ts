/**
 * `useBfPages` — the static page-copy surface of `useWfContent`, backed by the
 * `bfPages` content collection instead of the wireframe JSON snapshot.
 *
 * Issue 13 / gh#22. The thinnest of the six: one
 * `queryCollection('bfPages').all()` inside `useAsyncData` and a `.find()`.
 * **No synthesis lives here** — the normaliser (issue 08) already stripped and
 * decoded the HTML in `heading` / `subheading` / `excerpt` and passed
 * `description` through byte-identical as body copy.
 *
 * Member names and signatures match `useWfContent` exactly, so porting a page
 * is a one-line swap:
 *
 * ```diff
 * - const { aboutPage } = useWfContent()
 * + const { aboutPage } = await useBfPages()
 * ```
 *
 * ## The 7 documents
 *
 * `about`, `stiftung`, `home`, `insights`, `projects`, `archive`,
 * `archive-banner` — the copy decks behind the About page, the Stiftung block,
 * the homepage intro, the two index heads, and the archive band. `useWfContent`
 * exposes named accessors for only the first three (the ones a template reads
 * as a whole page) and reaches the rest through `pageBySlug`; this composable
 * exposes the same four members and no more. There is no list member because
 * `useWfContent` has none — nothing renders "all pages".
 *
 * Each document carries all 19 source fields, `copy_source` and `legacy`
 * included (issue 08's Decisions), so a template never has to go back to the
 * snapshot for a field this schema forgot.
 *
 * ## Why plain values, not refs
 *
 * `useAsyncData` has already resolved when this composable returns, and the
 * collection is build-time static content, so the members are unwrapped to
 * plain values — what makes the swap above a one-liner (issue 11 precedent).
 */
import type { Page } from '~/types/bf-contracts'

export const useBfPages = async () => {
  const { data } = await useAsyncData('bf-pages', () =>
    queryCollection('bfPages').all()
  )

  /** All 7 documents. */
  const all: Page[] = data.value ?? []

  /** The page with this slug, or `undefined` — `useWfContent.ts:266`. */
  const pageBySlug = (slug: string) => all.find(p => p.slug === slug)

  return {
    pageBySlug,
    /** `/about` — the mission copy, Team and Board bands hang off it. */
    aboutPage: () => pageBySlug('about'),
    /** The Bertelsmann Stiftung relationship block. */
    stiftungPage: () => pageBySlug('stiftung'),
    /** The homepage intro deck. */
    homePage: () => pageBySlug('home')
  }
}
