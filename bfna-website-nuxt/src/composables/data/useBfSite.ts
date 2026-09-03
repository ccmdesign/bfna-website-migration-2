/**
 * `useBfSite` — the site-chrome surface of `useWfContent`: the banner
 * announcement and the nav/footer menu structure.
 *
 * Issue 13 / gh#22. The one composable of the six that is **not** a pure
 * `queryCollection` wrapper, and deliberately so — both exceptions are BRIEF §6
 * decisions, not shortcuts:
 *
 * 1. **The publish gate stays here.** `bfAnnouncements` stores the singleton
 *    verbatim, `status` included; `announcement()` applies the
 *    `status === 'published'` test that `useWfContent.ts:267` applies. Issue
 *    08's Decisions: *"The `status === 'published'` gate stays in the
 *    composable (issue 13), per BRIEF §6."*
 * 2. **Menus are a module, not a collection.** The normaliser emits the
 *    hardcoded `MENUS` structure as `src/assets/bf-data/menus.json`, and
 *    `src/assets/bf-data/menus.ts` is the hand-authored typed accessor over it
 *    (issue 08). `menus()` re-exports that array. Reading it as a 7th
 *    `@nuxt/content` collection is exactly what BRIEF §6 forbids — the
 *    collection count is fixed at six.
 *
 * ## Who may call this (D8)
 *
 * **The layout, and only the layout** — `layouts/wireframe.vue`'s `bf-*`
 * successor, wired in issue 46. `bfNav` and `bfFooter` receive `menus` as a
 * **prop**; a `bf-*` component that imports this file is a D8 defect and the
 * spec's own acceptance greps for it.
 *
 * ## Why plain values, not refs
 *
 * `useAsyncData` has already resolved when this composable returns, and both
 * sources are build-time static, so the members are unwrapped to plain values
 * — what makes a page port a one-liner (issue 11 precedent).
 */
import type { Announcement, Menu } from '~/types/bf-contracts'
import { menus as bfMenus } from '~/assets/bf-data/menus'

/**
 * The publish gate, as a pure function: the document back when it is
 * published, `undefined` otherwise (a missing document included).
 *
 * Extracted rather than inlined because the shipped singleton **is**
 * published, so the negative branch is unreachable from real content and the
 * acceptance would otherwise have nothing to assert against. The probe calls
 * this export directly with synthetic unpublished records;
 * `scripts/verify-bf-people-pages-site-parity.ts` cannot import a Nuxt module
 * and transcribes the gate alongside its other transcribed predicates. Together
 * they are the vitest substitution for residual #86.
 *
 * Generic in the document type so a caller keeps the collection item's own
 * fields instead of being widened to `Announcement`.
 */
export const publishedAnnouncement = <T extends Pick<Announcement, 'status'>>(
  doc: T | null | undefined
): T | undefined => (doc?.status === 'published' ? doc : undefined)

export const useBfSite = async () => {
  const { data } = await useAsyncData('bf-announcement', () =>
    queryCollection('bfAnnouncements').first()
  )

  /** The single stored document, gate not yet applied. Internal. */
  const doc = data.value

  return {
    /**
     * The banner announcement, or `undefined` when it is not published —
     * `useWfContent.ts:267`. Callers render the banner on a defined value and
     * nothing at all otherwise; there is no "draft" state on the site.
     */
    announcement: () => publishedAnnouncement(doc),
    /**
     * The nav/footer menu structure, from the typed `menus.json` module. Static
     * across the whole site; the layout passes it down as a prop (D8).
     */
    menus: (): Menu[] => bfMenus
  }
}
