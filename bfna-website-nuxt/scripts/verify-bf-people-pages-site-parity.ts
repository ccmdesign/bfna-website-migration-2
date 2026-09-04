/**
 * Parity check — issue 13 / gh#22: `useBfPeople`, `useBfPages`, `useBfSite`.
 *
 *   npx tsx scripts/verify-bf-people-pages-site-parity.ts
 *
 * The vitest substitution. The harness on `dev` is broken and pre-existing
 * (residual #86), and this issue's acceptance must not depend on it, so the
 * equivalent-strength check is this script plus the probe page at
 * `/bf-probe/13-composables-people-pages-site` (spec Decisions; gh#20/gh#21
 * precedent).
 *
 * ## What it actually proves
 *
 * Not "the composable returns what I wrote" — that is what the probe renders.
 * This script runs **`useWfContent`'s own predicates** over the wireframe
 * snapshots in `src/assets/wireframe-data/` and the **`bf-*` derivations** over
 * the normalised documents in `content/bf/`, then asserts the two produce
 * identical slug sequences. A passing run therefore means the port is faithful
 * to the wireframe, which is the only thing worth asserting: the wireframe
 * layer is the specification (BRIEF §1).
 *
 * The predicates below are transcribed from `useWfContent.ts:255-267` and the
 * derivations from the three composables. Neither side imports the other — the
 * composables are Nuxt modules with `~` aliases and auto-imported
 * `queryCollection` / `useAsyncData`, so they cannot run outside the app. The
 * transcription is the point of comparison, not a shortcut around it.
 *
 * It also covers the one thing the probe cannot take from real content: the
 * unpublished branch of the announcement gate. The shipped singleton is
 * `status: 'published'`, so the negative branch is asserted against synthetic
 * records.
 *
 * Exit code 0 = every check passed; 1 = at least one failed (each printed).
 */
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const wfDir = join(appRoot, 'src/assets/wireframe-data')
const bfDir = join(appRoot, 'content/bf')

const readJson = <T>(path: string): T => JSON.parse(readFileSync(path, 'utf8')) as T

/** Every `*.json` document in one `content/bf/<collection>/` directory. */
const readCollection = <T>(name: string): T[] =>
  readdirSync(join(bfDir, name))
    .filter(f => f.endsWith('.json'))
    .sort()
    .map(f => readJson<T>(join(bfDir, name, f)))

/* ---------------------------------------------------------------- shapes -- */

interface WfPerson { slug: string, name: string, job_title?: string | null, board?: boolean }
interface BfPerson { slug: string, name: string, job_title: string | null, board: boolean }
interface WfPage { slug: string, heading?: string | null }
interface BfPage { slug: string, heading: string | null }
interface WfAnnouncement { status?: string | null, message?: string | null }
interface BfAnnouncement { status: string | null, message: string | null }
interface Menu { label: string, items?: { label: string }[] }

/* ------------------------------------------------------------ assertions -- */

let failures = 0

const check = (label: string, actual: unknown, expected: unknown) => {
  // Wrapped in an array so `undefined` serialises to `[null]` rather than to
  // the value `undefined` — otherwise two absent operands compare equal and the
  // check passes vacuously.
  const ok = JSON.stringify([actual]) === JSON.stringify([expected])
  if (!ok) failures++
  console.log(`${ok ? 'pass' : 'FAIL'}  ${label}`)
  if (!ok) {
    console.log(`      expected ${JSON.stringify(expected) ?? 'undefined'}`)
    console.log(`      actual   ${JSON.stringify(actual) ?? 'undefined'}`)
  }
}

/* ------------------------------------------------------------ predicates -- */

/** `useWfContent.ts:263` — the Board predicate, raw. */
const wfIsBoard = (p: WfPerson) => Boolean(p.board) || /board/i.test(p.job_title ?? '')
/** `useWfContent.ts:264` — the Team predicate: the regex half only. */
const wfIsTeam = (p: { job_title?: string | null }) => !/board/i.test(p.job_title ?? '')
/** `useWfContent.ts:265` — alphabetical by last name. */
const byLastName = (a: { name: string }, b: { name: string }) =>
  (a.name.split(' ').at(-1) ?? '').localeCompare(b.name.split(' ').at(-1) ?? '')
/** `useWfContent.ts:267` / `useBfSite.publishedAnnouncement` — the publish gate. */
const gate = <T extends { status?: string | null }>(d: T | null | undefined) =>
  (d?.status === 'published' ? d : undefined)

const slugs = (list: { slug: string }[]) => list.map(p => p.slug)

/* ---------------------------------------------------------------- people -- */

console.log('\n— people: useWfContent vs useBfPeople —')

const wfPeople = readJson<{ people: WfPerson[] }>(join(wfDir, 'people.json')).people
const bfPeople = readCollection<BfPerson>('people')

const wfBoard = wfPeople.filter(wfIsBoard)
const wfTeam = wfPeople.filter(wfIsTeam).sort(byLastName)
// The bf side: `board` is the stored whole-OR flag; Team stays the regex filter.
const bfBoard = bfPeople.filter(p => p.board)
const bfTeam = bfPeople.filter(wfIsTeam).sort(byLastName)

check('people() — count', bfPeople.length, wfPeople.length)
check('people() — count is 13', bfPeople.length, 13)
check('people() — slug set', slugs(bfPeople).sort(), slugs(wfPeople).sort())

check('boardMembers() — slugs match the wireframe predicate', slugs(bfBoard), slugs(wfBoard))
check('boardMembers() — resolves 4, not the spec prose\'s 3', bfBoard.length, 4)
check('boardMembers() — includes wilhelm-friedrich-uhr (regex on "Executive Board…")',
  bfBoard.some(p => p.slug === 'wilhelm-friedrich-uhr'), true)

check('teamMembers() — slugs and ORDER match the wireframe', slugs(bfTeam), slugs(wfTeam))
check('teamMembers() — resolves 10', bfTeam.length, 10)
check('teamMembers() — sorted by last name',
  bfTeam.every((p, i, a) => i === 0 || byLastName(a[i - 1]!, p) <= 0), true)

// The asymmetry: not a partition. Irene is in both, Wilhelm in Board only.
check('irene-braam is in BOTH lists',
  [bfBoard.some(p => p.slug === 'irene-braam'), bfTeam.some(p => p.slug === 'irene-braam')],
  [true, true])
check('wilhelm-friedrich-uhr is Board-only',
  [bfBoard.some(p => p.slug === 'wilhelm-friedrich-uhr'), bfTeam.some(p => p.slug === 'wilhelm-friedrich-uhr')],
  [true, false])
check('board + team = 14 entries…', bfBoard.length + bfTeam.length, 14)
check('…over a union of 13 people (the acceptance)',
  new Set([...bfBoard, ...bfTeam].map(p => p.slug)).size, 13)
check('…and the union is every person',
  [...new Set([...bfBoard, ...bfTeam].map(p => p.slug))].sort(), slugs(wfPeople).sort())

// Both halves of the stored OR are load-bearing (issue 08's Decisions).
check('stored `board` == the wireframe OR, person by person',
  bfPeople.map(p => p.board),
  bfPeople.map(p => wfIsBoard(wfPeople.find(w => w.slug === p.slug)!)))

/* ----------------------------------------------------------------- pages -- */

console.log('\n— pages: useWfContent vs useBfPages —')

const wfPages = readJson<{ items: WfPage[] }>(join(wfDir, 'pages.json')).items
const bfPages = readCollection<BfPage>('pages')
const bfPageBySlug = (slug: string) => bfPages.find(p => p.slug === slug)
const wfPageBySlug = (slug: string) => wfPages.find(p => p.slug === slug)

check('pageBySlug() — reachable slug set', slugs(bfPages).sort(), slugs(wfPages).sort())
check('pageBySlug() — 7 documents', bfPages.length, 7)

for (const [member, slug] of [['aboutPage', 'about'], ['stiftungPage', 'stiftung'], ['homePage', 'home']] as const) {
  check(`${member}() resolves`, bfPageBySlug(slug) !== undefined, true)
  check(`${member}() — heading matches the wireframe`,
    bfPageBySlug(slug)?.heading, wfPageBySlug(slug)?.heading ?? null)
}

check('pageBySlug() — unknown slug is undefined', bfPageBySlug('not-a-page') === undefined, true)
check('pageBySlug() — reaches the non-accessor pages too',
  ['insights', 'projects', 'archive', 'archive-banner'].every(s => bfPageBySlug(s) !== undefined), true)

/* ------------------------------------------------------ site: the gate ---- */

console.log('\n— site: the publish gate and the menus module —')

const wfAnnouncement = readJson<{ items: WfAnnouncement }>(join(wfDir, 'announcements.json')).items
const bfAnnouncement = readCollection<BfAnnouncement>('announcements')[0]

check('bfAnnouncements holds exactly one document', readCollection('announcements').length, 1)
check('announcement() — message matches the wireframe',
  gate(bfAnnouncement)?.message, gate(wfAnnouncement)?.message)
check('announcement() — defined for the shipped (published) record',
  gate(bfAnnouncement) !== undefined, gate(wfAnnouncement) !== undefined)

// The branch real content cannot reach: the shipped singleton IS published.
check('gate(status: "draft") is undefined', gate({ ...bfAnnouncement, status: 'draft' }), undefined)
check('gate(status: null) is undefined', gate({ ...bfAnnouncement, status: null }), undefined)
check('gate(status: "Published") is undefined — exact match, not case-folded',
  gate({ ...bfAnnouncement, status: 'Published' }), undefined)
check('gate(undefined) is undefined', gate(undefined), undefined)
check('gate(null) is undefined', gate(null), undefined)

const menus = readJson<Menu[]>(join(appRoot, 'src/assets/bf-data/menus.json'))
check('menus() — a bare array, not an envelope', Array.isArray(menus), true)

/*
 * Deep menu parity. Two of the six groups — Programs and Projects — are
 * *derived* in `useWfContent.ts:161,165-167` from `PROGRAMS` and
 * `NAV_SLUGS.filter(inProjectGrid)`, so they can drift with the project data
 * without anyone editing a menu. Asserting only the 6 top-level labels (issue
 * 08's acceptance) would not catch that, and this issue is review checkpoint 1.
 *
 * So `MENUS` (`useWfContent.ts:153-186`) is transcribed here with those two
 * groups re-derived from the wireframe snapshots through the wireframe's own
 * predicates, then every `to` is rewritten `/wireframes/x` → `/x` — the one
 * transformation the normaliser applies, since the `bf-*` site serves these
 * routes at the root (BRIEF §7).
 */
interface WfProject {
  slug: string
  heading: string
  kind?: string | null
  archived?: boolean | null
  exclude_from_grid?: boolean | null
  external_only?: boolean | null
  external_url?: string | null
  parent_project?: string | null
}

const wfProjects = readJson<{ items: WfProject[] }>(join(wfDir, 'projects.json')).items
const wfPrograms = readJson<{ items: { slug: string, heading: string }[] }>(join(wfDir, 'programs.json')).items

/** `useWfContent.ts:127-128`. */
const inProjectGrid = (p: WfProject) =>
  !p.archived && !p.exclude_from_grid && !p.external_only && p.kind !== 'podcast'
/** `useWfContent.ts:148`. */
const NAV_SLUGS = [
  'transatlantic-barometer',
  'transatlantic-periscope',
  'range',
  'how-to-fix-democracy',
  'the-bertelsmann-foundation-fellowship'
]

const expectedMenus = [
  { label: 'About', items: [
    { label: 'Mission', to: '/wireframes/about' },
    { label: 'Board of Directors', to: '/wireframes/about#board' },
    { label: 'Team', to: '/wireframes/about#team' },
    { label: 'Bertelsmann Stiftung', href: '#', external: true },
    { label: 'Contact', to: '/wireframes/about#contact' }
  ] },
  { label: 'Programs', items: wfPrograms.map(a => ({ label: a.heading, to: `/wireframes/${a.slug}` })) },
  { label: 'Projects', items: [
    ...NAV_SLUGS.map(s => wfProjects.find(p => p.slug === s)!).filter(Boolean).filter(inProjectGrid)
      .map(p => ({ label: p.heading, to: `/wireframes/projects/${p.slug}` })),
    { label: 'All Projects →', to: '/wireframes/projects', strong: true }
  ] },
  { label: 'Insights', items: [
    { label: 'All Insights', to: '/wireframes/insights' },
    { label: 'Articles', to: '/wireframes/insights?format=article' },
    { label: 'Reports', to: '/wireframes/insights?format=report' },
    { label: 'Videos', to: '/wireframes/insights?format=video' },
    { label: 'Infographics', to: '/wireframes/insights?format=infographic' },
    {
      label: 'Transponder Magazine',
      href: wfProjects.find(p => p.slug === 'transponder-magazine')?.external_url ?? '#transponder-magazine-url',
      external: true
    },
    { label: 'Archive', to: '/wireframes/archive', strong: true }
  ] },
  { label: 'Podcasts', href: '#podcast-platform-url', external: true },
  { label: 'Documentaries', href: 'https://bfnadocs.org', external: true }
]

/**
 * The one rewrite: `/wireframes/insights?format=video` → `/insights?format=video`.
 *
 * Constrained to `object` rather than to `{ to?: string }` (residual #104, which
 * put `scripts/**` under `tsc` and surfaced this): the expected menu shape is a
 * union, and its *group* members — `{ label, items }` — carry no `to` at all.
 * A `{ to?: string }` constraint makes those a weak-type mismatch, so the call
 * below did not compile. The property is read through a narrowing cast instead,
 * which is what the runtime check on the next line was already doing.
 */
const deWireframe = <T extends object>(node: T): T => {
  const to = (node as { to?: string }).to
  return to ? { ...node, to: to.replace(/^\/wireframes/, '') } : node
}

check('menus() — top-level labels',
  menus.map(m => m.label), expectedMenus.map(m => m.label))
check('menus() — every entry is a link or a parent of items',
  menus.every(m => (m.items?.length ?? 0) > 0 || 'to' in m || 'href' in m), true)

for (const [i, expected] of expectedMenus.entries()) {
  check(`menus()[${i}] "${expected.label}" — full group, items and all`,
    menus[i],
    { ...deWireframe(expected), ...(expected.items ? { items: expected.items.map(deWireframe) } : {}) })
}
check('menus() — no /wireframes route leaked through',
  JSON.stringify(menus).includes('/wireframes'), false)

/* ---------------------------------------------------------------- verdict -- */

console.log(`\n${failures === 0 ? 'PASS' : `FAIL — ${failures} check(s)`}`)
process.exit(failures === 0 ? 0 : 1)
