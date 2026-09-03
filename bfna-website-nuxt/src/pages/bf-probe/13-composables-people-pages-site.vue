<script setup lang="ts">
/**
 * Probe — issue 13 / gh#22: `useBfPeople`, `useBfPages`, `useBfSite`.
 *
 * Dev-only route, never linked from nav. Kept in place for later issues to
 * regression-check against (only the final cutover issue removes `bf-probe/`).
 *
 * This is a **parity test**, not a restatement of the implementation: every
 * expected value below was computed offline from
 * `src/assets/wireframe-data/people.json` / `pages.json` /
 * `announcements.json` through `useWfContent`'s own predicates (the board OR,
 * the team regex, the last-name comparator, the `status === 'published'`
 * gate), then hard-coded here. If the composables ever stop agreeing with the
 * wireframe composable they are porting, this page renders FAIL.
 *
 * What it proves:
 *
 *  1. The issue's own acceptance — Board and Team over a **union of 13**,
 *     `aboutPage()` resolving, and the announcement gate returning `undefined`
 *     when the record is not published.
 *  2. Board is **4**, not the 3 this issue's spec prose states, and Team is 10:
 *     the two lists are not a partition. `irene-braam` is in both (Executive
 *     Director in Team, flagged onto the Board), `wilhelm-friedrich-uhr` is
 *     Board-only ("Executive **Board** and COO" matches the title regex).
 *     Issue 08's Decisions settled this when the flag was materialised.
 *  3. `teamMembers()` order, asserted as the **full slug sequence**, not a
 *     count.
 *  4. All 7 `bfPages` documents reachable through `pageBySlug`, the three
 *     named accessors resolving to real copy.
 *  5. `useBfSite` reads menus from the typed `menus.json` module (issue 08),
 *     not a 7th collection, and its exported `publishedAnnouncement` gate is
 *     exercised on **both** branches — the shipped singleton is published, so
 *     the negative branch is asserted against synthetic records.
 *
 * (The vitest harness on `dev` is broken and pre-existing — residual #86 — so
 * acceptance is this page, rendered by `npx nuxt generate` against the real
 * content database, plus `npx tsx scripts/verify-bf-people-pages-site-parity.ts`.
 * Recorded in the spec's Decisions, per gh#20/gh#21 precedent.)
 */
import type { Page, Person } from '~/types/bf-contracts'
import { useBfPeople } from '~/composables/data/useBfPeople'
import { useBfPages } from '~/composables/data/useBfPages'
import { useBfSite, publishedAnnouncement } from '~/composables/data/useBfSite'

defineOptions({ name: 'BfProbe13ComposablesPeoplePagesSite' })

definePageMeta({ layout: false })

useHead({
  title: 'bf-probe 13 — useBfPeople / useBfPages / useBfSite',
  // `layout: false` bypasses the only layout that sets these, so set them here:
  // `lang` for WCAG 3.1.1, `noindex` because probes are dev-only scaffolding.
  htmlAttrs: { lang: 'en' },
  meta: [{ name: 'robots', content: 'noindex' }],
  link: [{ rel: 'stylesheet', href: '/css/styles.css' }]
})

/** One asserted value: what it is, what it must be, what it actually is. */
interface Check {
  label: string
  expected: number | string
  actual: number | string
}

const { people, boardMembers, teamMembers } = await useBfPeople()
const { pageBySlug, aboutPage, stiftungPage, homePage } = await useBfPages()
const { announcement, menus } = await useBfSite()

const slugs = (list: Person[]) => list.map(p => p.slug).join(',')

/**
 * gh#91 — a list member hands back a **copy**: mutating what one call returned
 * cannot change what the next call returns.
 *
 * `b !== a` proves a new array came back; `b[0] === a.at(-1)` proves the second
 * call still starts at the element the first one did, i.e. the `.reverse()`
 * landed on the caller's copy and not on shared state — here the
 * `useAsyncData` payload behind `people()` and the module singleton behind
 * `menus()`, the two the review of gh#22 named.
 */
const isCopySafe = <T>(read: () => T[]) => {
  const a = read()
  if (a.length < 2) return false
  a.reverse()
  const b = read()
  return b !== a && b[0] === a.at(-1)
}

// Assignability checks, not casts: if a composable and the exported entity
// types drift apart, `nuxt typecheck` fails here rather than in a page.
const about: Page | undefined = aboutPage()
const irene: Person | undefined = people().find(p => p.slug === 'irene-braam')

const board = boardMembers()
const team = teamMembers()
const union = new Set([...board, ...team].map(p => p.slug))

const live = announcement()

const checks: Check[] = [
  // --- the acceptance: the 13-person split -------------------------------
  { label: 'people().length', expected: 13, actual: people().length },
  { label: 'boardMembers().length', expected: 4, actual: board.length },
  { label: 'teamMembers().length', expected: 10, actual: team.length },
  {
    label: 'board ∪ team = 13 people (the acceptance)',
    expected: 13,
    actual: union.size
  },
  {
    label: '  …and the union is everyone',
    expected: 'true',
    actual: String(people().every(p => union.has(p.slug)))
  },
  // 4 + 10 = 14 entries over 13 people: the lists are not a partition.
  { label: 'board + team entries (Irene counted twice)', expected: 14, actual: board.length + team.length },

  // --- the board list, by the stored flag ---------------------------------
  // Asserted as the full sequence, unsorted — this is the order `/about#board`
  // will render, and it must equal the order `useWfContent` produces from
  // `people.json`.
  {
    label: 'boardMembers() slugs, in render order',
    expected: 'irene-braam,liz-mohn,stephen-f-szabo,wilhelm-friedrich-uhr',
    actual: slugs(board)
  },
  {
    label: '  …wilhelm-friedrich-uhr, matched on his job title',
    expected: 'Executive Board and Chief Operating Officer',
    actual: board.find(p => p.slug === 'wilhelm-friedrich-uhr')?.job_title ?? 'undefined'
  },

  // --- the asymmetry the client asked for ---------------------------------
  {
    label: 'irene-braam is in BOTH lists',
    expected: 'true',
    actual: String(board.some(p => p.slug === 'irene-braam') && team.some(p => p.slug === 'irene-braam'))
  },
  {
    label: '  …as Executive Director, not a board title',
    expected: 'Executive Director',
    actual: irene?.job_title ?? 'undefined'
  },
  {
    label: 'wilhelm-friedrich-uhr is Board-only',
    expected: 'true',
    actual: String(!team.some(p => p.slug === 'wilhelm-friedrich-uhr'))
  },
  // The three the Team filter drops — asserted by name, so a normaliser change
  // to `job_title` shows up here rather than silently resizing the list.
  {
    label: 'teamMembers() drops exactly the 3 board *titles*',
    expected: 'liz-mohn,stephen-f-szabo,wilhelm-friedrich-uhr',
    actual: people().filter(p => !team.includes(p)).map(p => p.slug).join(',')
  },

  // --- the acceptance: alphabetical by last name, full sequence -----------
  {
    label: 'teamMembers() order',
    expected: 'margaret-belford,irene-braam,samuel-george,faith-g-gray,megan-long,courtney-flynn-martino,ma-a-ocvirk,marshall-reid,anthony-t-silberfeld,zachary-stoor',
    actual: slugs(team)
  },
  {
    label: '  …last names ascending',
    expected: 'true',
    actual: String(team.every((p, n, a) =>
      n === 0 || (a[n - 1]!.name.split(' ').at(-1) ?? '').localeCompare(p.name.split(' ').at(-1) ?? '') <= 0))
  },
  {
    label: '  …a null job_title stays in Team (ma-a-ocvirk)',
    expected: 'true',
    actual: String(team.some(p => p.slug === 'ma-a-ocvirk'))
  },

  // --- the acceptance: aboutPage() resolving -------------------------------
  { label: 'aboutPage() is defined', expected: 'true', actual: String(about !== undefined) },
  { label: 'aboutPage().slug', expected: 'about', actual: about?.slug ?? 'undefined' },
  { label: 'aboutPage().heading', expected: 'About Us', actual: about?.heading ?? 'undefined' },
  {
    label: '  …carries real body copy, not a stub',
    expected: 'true',
    actual: String((about?.description ?? '').length > 1000)
  },
  {
    label: '  …and the full 19-field passthrough (legacy present)',
    expected: 'true',
    actual: String(about !== undefined && 'legacy' in about && 'copy_source' in about)
  },
  { label: 'stiftungPage().slug', expected: 'stiftung', actual: stiftungPage()?.slug ?? 'undefined' },
  { label: 'homePage().slug', expected: 'home', actual: homePage()?.slug ?? 'undefined' },
  {
    label: 'pageBySlug() reaches all 7 documents',
    expected: 'true',
    actual: String(['about', 'stiftung', 'home', 'insights', 'projects', 'archive', 'archive-banner']
      .every(s => pageBySlug(s) !== undefined))
  },
  {
    label: "pageBySlug('not-a-page') is undefined",
    expected: 'true',
    actual: String(pageBySlug('not-a-page') === undefined)
  },

  // --- the acceptance: the announcement gate, both branches ---------------
  // The shipped singleton is published, so the live call must return it…
  { label: 'announcement() is defined (record is published)', expected: 'true', actual: String(live !== undefined) },
  { label: '  …status', expected: 'published', actual: live?.status ?? 'undefined' },
  {
    label: '  …heading',
    expected: 'Bertelsmann Foundation Fellowship 2026',
    actual: live?.heading ?? 'undefined'
  },
  // …and the negative branch is asserted against synthetic records, because
  // real content cannot reach it.
  {
    label: "gate(status: 'draft') is undefined",
    expected: 'true',
    actual: String(publishedAnnouncement({ ...live, status: 'draft' }) === undefined)
  },
  {
    label: 'gate(status: null) is undefined',
    expected: 'true',
    actual: String(publishedAnnouncement({ status: null }) === undefined)
  },
  {
    label: "gate(status: 'Published') is undefined — exact match",
    expected: 'true',
    actual: String(publishedAnnouncement({ status: 'Published' }) === undefined)
  },
  {
    label: 'gate(undefined) is undefined',
    expected: 'true',
    actual: String(publishedAnnouncement(undefined) === undefined)
  },

  // --- menus: the typed module, not a 7th collection ----------------------
  { label: 'menus().length', expected: 6, actual: menus().length },
  {
    label: 'menus() labels',
    expected: 'About,Programs,Projects,Insights,Podcasts,Documentaries',
    actual: menus().map(m => m.label).join(',')
  },
  {
    label: '  …every entry is a link or a parent of items',
    expected: 'true',
    actual: String(menus().every(m => (m.items?.length ?? 0) > 0 || Boolean(m.to) || Boolean(m.href)))
  },

  // --- gh#91: the unfiltered members hand back copies ----------------------
  {
    label: 'people() / menus() survive a caller reversing them (gh#91)',
    expected: 'true',
    actual: String(isCopySafe(people) && isCopySafe(menus))
  }
]

const passed = computed(() => checks.filter(c => String(c.actual) === String(c.expected)).length)
const allPass = computed(() => checks.length > 0 && passed.value === checks.length)
</script>

<template>
  <main class="probe container">
    <h1>Probe 13 — <code>useBfPeople</code> / <code>useBfPages</code> / <code>useBfSite</code></h1>
    <p class="probe__lede">
      The people, page-copy and site-chrome surface of <code>useWfContent</code>,
      read back out of the <code>bfPeople</code>, <code>bfPages</code> and
      <code>bfAnnouncements</code> collections plus the
      <code>menus.json</code> module. Every expected value was computed offline
      from the wireframe snapshots through the wireframe composable's own
      predicates, so a passing row is parity with the wireframe, not agreement
      with the implementation.
    </p>

    <p
      class="probe__verdict"
      :data-state="allPass ? 'pass' : 'fail'"
      data-testid="probe-13-verdict"
    >
      {{ allPass ? 'PASS' : 'FAIL' }} — {{ passed }}/{{ checks.length }} checks
    </p>

    <table class="probe__table" data-testid="probe-13-table">
      <thead>
        <tr>
          <th scope="col">Check</th>
          <th scope="col">Expected</th>
          <th scope="col">Actual</th>
          <th scope="col">Result</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="c in checks"
          :key="c.label"
          :data-state="String(c.actual) === String(c.expected) ? 'pass' : 'fail'"
        >
          <td>{{ c.label }}</td>
          <td><code>{{ c.expected }}</code></td>
          <td><code>{{ c.actual }}</code></td>
          <td>{{ String(c.actual) === String(c.expected) ? 'pass' : 'fail' }}</td>
        </tr>
      </tbody>
    </table>
  </main>
</template>

<style scoped>
.probe {
  padding-block: var(--space-l, 2rem);
}

.probe__lede {
  max-inline-size: 75ch;
}

.probe__verdict {
  font-weight: 700;
}

.probe__verdict[data-state='fail'] {
  color: var(--color-error);
}

.probe__table {
  border-collapse: collapse;
  inline-size: 100%;
}

.probe__table th,
.probe__table td {
  border-block-end: 1px solid currentcolor;
  padding: 0.25rem 0.75rem 0.25rem 0;
  text-align: start;
}

.probe__table tr[data-state='fail'] {
  color: var(--color-error);
}
</style>
