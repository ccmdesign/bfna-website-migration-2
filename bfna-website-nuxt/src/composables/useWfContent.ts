// Wireframe-only content access. Reads the CONSOLIDATED dataset snapshot
// (single source of truth built by the Backend/Front 1 session) so wireframe
// pages show REAL content in the NEW taxonomy. Not for production pages.
// Naming per Irene (Jul 31): 3 top-level PROGRAMS, each containing PROJECTS.
// Refresh the snapshot with:
//   cp _process/scoping/inventory/data/*.json bfna-website-nuxt/src/assets/wireframe-data/
import insightsData from '~/assets/wireframe-data/insights.json'
import projectsData from '~/assets/wireframe-data/projects.json'
import programsData from '~/assets/wireframe-data/programs.json'
import peopleData from '~/assets/wireframe-data/people.json'
import pagesData from '~/assets/wireframe-data/pages.json'
import announcementsData from '~/assets/wireframe-data/announcements.json'

export interface WfInsight {
  slug: string
  heading: string | null
  subheading: string | null
  excerpt: string | null
  content: string | null
  authors: string[]
  image: string | null
  video_url: string | null
  download: string | null
  external_url: string | null
  publish_date: string | null
  format: string | null
  program: string | null
  projects: string[]          // M2M project slugs (real, from consolidated data)
  archived: boolean | null
  evergreen: boolean | null
}

export interface WfProject {
  slug: string
  heading: string
  excerpt: string | null
  description: string | null  // Irene Jul 29 docx copy (via dataset)
  kind: string | null         // e.g. research-initiative, podcast-series
  program: string | null
  external_url: string | null
  image: string | null
  parent_project: string | null
  archived?: boolean | null        // active-tier flag (BF-149)
  exclude_from_grid?: boolean | null  // BF-149: keep off the program project grid (e.g. podcasts)
  external_only?: boolean | null   // BF-149: lives off-site — surfaced as a product band, not a grid card
  microsite_cta?: string | null  // dataset copy for the external-CTA section
  participation?: { title: string, ctas: string[] } | null  // dataset draft copy (GGS participation path)
  pending?: string            // open-question chip (Q6/Q7)
}

export interface WfProgram {
  slug: string
  name: string
  intro: string | null        // \n\n-separated paragraphs
  image: string | null
}

// Menu item shared by the top bar dropdowns and the footer columns
export interface WfMenuItem {
  label: string
  to?: string
  href?: string
  external?: boolean
  strong?: boolean
}

// A top-level menu: either a dropdown (has `items`) or a plain external/internal
// link (has `href`/`to`, no `items`) — the pruned-nav "plain button" case.
export interface WfMenu {
  label: string
  items?: WfMenuItem[]
  to?: string
  href?: string
  external?: boolean
}

export interface WfPerson {
  slug: string
  name: string
  job_title: string | null
  bio: string | null
  image: string | null
}

// ---- Snapshot access -------------------------------------------------------

const insights = (insightsData as { items: WfInsight[] }).items
const highlightItems = (insightsData as unknown as { featured: (WfInsight & { bucket?: string })[] }).featured
const projectsRaw = (projectsData as { items: WfProject[], pending_copy: string[] }).items

const active = insights
  .filter(i => !i.archived)
  .sort((a, b) => (b.publish_date ?? '').localeCompare(a.publish_date ?? ''))
const archivedItems = insights
  .filter(i => i.archived)
  .sort((a, b) => (b.publish_date ?? '').localeCompare(a.publish_date ?? ''))

const PROGRAMS: WfProgram[] = (programsData as { items: { slug: string, heading: string, intro: string | null, image: string | null }[] }).items
  .map(a => ({ slug: a.slug, name: a.heading, intro: a.intro, image: a.image }))

// Copy-pending chips: Transponder (Q6) and Documentaries (Q7 — row is a CCM
// draft in projects.json, sourced from bfnadocs.org, pending Irene review)
const PENDING: Record<string, string> = { 'transponder-magazine': 'Q6', 'bfna-documentaries': 'Q7' }

const projectsAll: WfProject[] = [
  ...projectsRaw.map(p => PENDING[p.slug] ? { ...p, pending: PENDING[p.slug] } : p)
]
const topProjects = projectsAll.filter(p => !p.parent_project)

// A project earns a card in a PROGRAM PAGE grid only when it's an active, on-site
// project (BF-145 / Aug 4 call). Excluded: archived tiers, rows flagged out of the
// grid (BF-149 `exclude_from_grid` — e.g. the Bridging/Wisdom podcasts), external-only
// products (Transponder, shown as its own band), and any leftover `kind: podcast` row.
// The all-projects index keeps using the unfiltered `projectsByProgram`, so this only
// prunes the program-page grid — reusable across every program page ([area].vue).
const inProjectGrid = (p: WfProject) =>
  !p.archived && !p.exclude_from_grid && !p.external_only && p.kind !== 'podcast'

// Homepage + nav curation (IA decision, not data): flagship projects
const FEATURED_SLUGS = ['transatlantic-barometer', 'transatlantic-periscope', 'how-to-fix-democracy', 'the-bertelsmann-foundation-fellowship']
// bfna-documentaries removed (BF-142): Documentaries is now a dedicated external
// nav button (bfnadocs.org) with NO on-site landing page.
const NAV_SLUGS = ['transatlantic-barometer', 'transatlantic-periscope', 'range', 'how-to-fix-democracy', 'the-bertelsmann-foundation-fellowship', 'transponder-magazine']

// Single source for site menus — top bar and footer render the SAME structure.
// "Projects" per Irene's wording (Q1); dropdown = flagships only, links go to
// on-site project pages (Q4 resolved) — external ↗ lives on the page CTA.
const MENUS: WfMenu[] = [
  { label: 'About', items: [
    { label: 'Mission', to: '/wireframes/about' },
    { label: 'Board of Directors', to: '/wireframes/about#board' },
    { label: 'Team', to: '/wireframes/about#team' },
    { label: 'Bertelsmann Stiftung', href: '#', external: true },
    { label: 'Contact', to: '/wireframes/about#contact' }
  ] },
  { label: 'Programs', items: PROGRAMS.map(a => ({ label: a.name, to: `/wireframes/${a.slug}` })) },
  { label: 'Projects', items: [
    ...NAV_SLUGS.map(s => projectsAll.find(p => p.slug === s)!).filter(Boolean)
      .map(p => ({ label: p.heading, to: `/wireframes/projects/${p.slug}` })),
    { label: 'All Projects →', to: '/wireframes/projects', strong: true }
  ] },
  { label: 'Insights', items: [
    { label: 'All Insights', to: '/wireframes/insights' },
    { label: 'Articles', to: '/wireframes/insights?format=article' },
    { label: 'Reports', to: '/wireframes/insights?format=report' },
    { label: 'Videos', to: '/wireframes/insights?format=video' },
    { label: 'Infographics', to: '/wireframes/insights?format=infographic' },
    { label: 'Archive', to: '/wireframes/archive', strong: true }
  ] },
  // Pruned-nav plain buttons (BF-142): external links, no dropdowns, no landing pages.
  // NOTE: podcast-platform URL is a PLACEHOLDER — Irene to supply the real one.
  { label: 'Podcasts', href: '#podcast-platform-url', external: true },
  { label: 'Documentaries', href: 'https://bfnadocs.org', external: true }
]

const people = (peopleData as { people: WfPerson[] }).people
const wfPages = (pagesData as { items: { slug: string, heading: string, description: string | null }[] }).items
const aboutPage = wfPages.find(p => p.slug === 'about')
const stiftungPage = wfPages.find(p => p.slug === 'stiftung')
const homePage = wfPages.find(p => p.slug === 'home')
const announcement = (announcementsData as { items: { message: string, url: string, status: string } }).items

const FORMAT_LABELS: Record<string, string> = {
  article: 'Article',
  report: 'Report',
  video: 'Video',
  infographic: 'Infographic'
}

const KIND_LABELS: Record<string, string> = {
  'research-initiative': 'Research Initiative',
  'research-documentary-project': 'Research & Documentary Project',
  'research-multimedia-initiative': 'Research & Multimedia Initiative',
  'data-visualization-project': 'Data & Visualization Project',
  'data-analysis-platform': 'Data & Analysis Platform',
  'interactive-multimedia-platform': 'Interactive Multimedia Platform',
  'geopolitical-forecasting-platform': 'Geopolitical Forecasting Platform',
  'podcast-series': 'Podcast Series',
  'podcast': 'Podcast',
  'fellowship': 'Fellowship Program'
}

export function useWfContent() {
  const bySlug = (slug: string) => insights.find(i => i.slug === slug)
  return {
    items: insights,
    active,
    archived: archivedItems,
    bySlug,
    activeByProgram: (program: string) => active.filter(i => i.program === program),
    archivedCountByProgram: (program: string) =>
      insights.filter(i => i.archived && i.program === program).length,
    // Homepage featured strip = insights.json `featured` (Directus highlights,
    // texts updated per Irene's Jul 23 email)
    highlights: () => highlightItems,
    // registries (consolidated dataset)
    programs: () => PROGRAMS,
    programBySlug: (slug: string) => PROGRAMS.find(a => a.slug === slug),
    projects: () => topProjects,
    projectsByProgram: (program: string) => topProjects.filter(p => p.program === program),
    // Program-page grid = active, on-site projects only (see `inProjectGrid`).
    // TR&GC resolves to the Aug 4 six; podcasts + external products drop out.
    gridProjectsByProgram: (program: string) =>
      topProjects.filter(p => p.program === program && inProjectGrid(p)),
    // External-only "products" within a program (e.g. The Transponder): rendered as
    // their own band on the program page, not as grid cards. Data-driven via
    // `external_only`, so any program can carry a product with no page edits.
    productsByProgram: (program: string) =>
      topProjects.filter(p => p.program === program && p.external_only),
    // Projects whose program is a RE-TAG placeholder (Q3) — shown as their
    // own group on the all-projects index so the open work stays visible
    projectsPendingRetag: () => topProjects.filter(p => (p.program ?? '').startsWith('RE-TAG')),
    projectBySlug: (slug: string) => projectsAll.find(p => p.slug === slug),
    // Cohort/year pages nested via parent_project (Directus M2O self-relation)
    projectChildren: (slug: string) =>
      projectsAll.filter(p => p.parent_project === slug)
        .sort((a, b) => (b.heading ?? '').localeCompare(a.heading ?? '')),
    // Real M2M: insights carry `projects` slugs in the consolidated data
    insightsForProject: (slug: string) => active.filter(i => i.projects?.includes(slug)),
    navProjects: () => NAV_SLUGS.map(s => projectsAll.find(p => p.slug === s)!).filter(Boolean),
    menus: () => MENUS,
    featuredProjects: () => FEATURED_SLUGS.map(s => projectsAll.find(p => p.slug === s)!).filter(Boolean),
    // people / page copy / announcement
    people: () => people,
    boardMembers: () => people.filter(p => /board/i.test(p.job_title ?? '')),
    teamMembers: () => people.filter(p => !/board/i.test(p.job_title ?? '')),
    aboutPage: () => aboutPage,
    stiftungPage: () => stiftungPage,
    homePage: () => homePage,
    pageBySlug: (slug: string) => wfPages.find(p => p.slug === slug),
    announcement: () => (announcement?.status === 'published' ? announcement : undefined),
    // formatting
    formatLabel: (f: string | null) => FORMAT_LABELS[(f ?? 'article').split('|')[0]] ?? 'Article',
    kindLabel: (k: string | null) => (k ? KIND_LABELS[k] ?? k : null),
    // Legacy excerpts sometimes carry HTML markup and entities
    plain: (s: string | null | undefined) =>
      (s ?? '')
        .replace(/<[^>]+>/g, '')
        .replace(/&[a-z#0-9]+;/gi, m =>
          ({ '&amp;': '&', '&nbsp;': ' ', '&rsquo;': '’', '&lsquo;': '‘', '&ldquo;': '“', '&rdquo;': '”', '&#8217;': '’', '&#8220;': '“', '&#8221;': '”', '&quot;': '"' })[m.toLowerCase()] ?? '')
        .trim(),
    paragraphs: (s: string | null | undefined) => (s ?? '').split('\n\n').filter(Boolean),
    monthYear: (d: string | null) =>
      d ? new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''
  }
}
