// Seed annotations for the ccm-feedback widget (wireframe layout only).
// These carry the reviewer notes that used to live in .wf-note boxes on the
// wireframe pages — anchored to the same sections via [data-label] selectors.
// Merged into localStorage (ccm-feedback:bfna-wireframes) by layouts/wireframe.vue.

interface SeedArgs {
  path: string
  label: string
  message: string
  status?: 'todo' | 'review' | 'done' | 'question'
  snippet?: string
}

let n = 0
const rec = ({ path, label, message, status = 'todo', snippet }: SeedArgs) => ({
  id: `wf-seed-${String(++n).padStart(3, '0')}`,
  projectName: 'bfna-wireframes',
  message,
  authorName: 'Claude — wireframe annotations',
  url: path,
  path,
  viewport: '1280x800',
  userAgent: 'seed',
  createdAt: '2026-07-31T12:00:00.000Z',
  status,
  kind: 'target' as const,
  cssSelector: `[data-label="${label}"]`,
  xpath: '',
  textSnippet: snippet ?? label,
  elementTag: 'section',
  textPrefix: '',
  textSuffix: '',
  fingerprint: '',
  neighborText: '',
  // Fractions of the anchored element's rect (0–1), not percentages
  xPct: 0.05,
  yPct: 0.02,
  wPct: 0.9,
  hPct: 0.1
})

const AREA_PATHS = ['/wireframes/democracy', '/wireframes/transatlantic-relations-global-challenges', '/wireframes/future-leadership']

export const WF_FEEDBACK_SEED = [
  // Homepage
  rec({ path: '/wireframes', label: 'Insights', message: 'Featured strip = first 4 of the 8 `featured` records in the consolidated dataset (texts per Irene’s Jul 23 email); below it, the 6 most recent active insights. Note: the latest 6 skew Transatlantic Relations — editorial mix may need a curation rule.' }),
  rec({ path: '/wireframes', label: 'Subscribe CTA', message: 'Wired to Mailchimp (Q13) — real signup form replaces the current external link (today: bfna.us20.list-manage.com, per static-content.json).', status: 'question' }),

  // Focus-area hubs (same template, 3 paths)
  ...AREA_PATHS.flatMap(path => [
    rec({ path, label: 'Projects in this area', message: 'Projects from projects.json (consolidated dataset); descriptions from Irene’s Jul 29 docx via the dataset. Sub-projects (parent_project set) are never listed here. Aug 3: CEPI 2010/2011 were top-level rows in the dataset — nested under `cepi` (parent row doesn’t exist yet; backend must create it or archive the two cohort pages).' }),
    rec({ path, label: 'Recent insights', message: 'Live from content.json: all active insights for this area (up to 9 shown). Archived items reachable via the labeled toggle, never shown by default (GGS 3-year rule; archive ≠ delete).' })
  ]),

  // Projects index
  rec({ path: '/wireframes/projects', label: 'Projects index', message: 'Projects = top-level rows of projects.json (parent_project null). BFNA Documentaries is stubbed — in the dataset’s pending_copy but has no row in any source (Q7); Transponder copy also pending (Q6). "Pending re-tag" group at the bottom = projects whose new program is unresolved (Q3).', status: 'question' }),

  // Fellowship (representative on-site project page)
  rec({ path: '/wireframes/projects/the-bertelsmann-foundation-fellowship', label: 'Project overview', message: 'Overview is the real CMS excerpt from content.json (981 chars) — components must tolerate real-length copy, not lorem.' }),
  rec({ path: '/wireframes/projects/the-bertelsmann-foundation-fellowship', label: 'Participation path', message: 'Participation title + CTA draft copy now lives in the dataset: `participation` field added (Aug 3) to all 18 top-level projects.json rows (Fellowship: "Become a Fellow" / Apply / Nominate; external platforms: "Use the platform"; others: "Follow this project"). Drafts are CCM placeholders — eligibility/timeline copy still needed from Irene/program team. Backend export should adopt the field.', status: 'review' }),
  rec({ path: '/wireframes/projects/the-bertelsmann-foundation-fellowship', label: 'Outcomes / alumni', message: 'Real class pages from content.json — the ~21 legacy "Class of 20XX"/Participants pages are absorbed here as cohort sections (pending Irene), not separate site pages.' }),
  rec({ path: '/wireframes/projects/the-bertelsmann-foundation-fellowship', label: 'Related insights', message: 'Now REAL M2M: insights carry `projects` slugs in the consolidated dataset — the old heading-match hack is gone. Cohort chips come from parent_project children (18 real pages).' }),

  // Barometer (representative microsite project page)
  rec({ path: '/wireframes/projects/transatlantic-barometer', label: 'Project overview', message: 'Overview is the real CMS excerpt from content.json — components must tolerate real-length copy, not lorem.' }),
  rec({ path: '/wireframes/projects/transatlantic-barometer', label: 'Microsite CTA', message: 'Q4 resolved (Claudio, Jul 31): thin on-site page with the microsite as primary CTA — clear external signaling per GGS.' }),
  rec({ path: '/wireframes/projects/transatlantic-barometer', label: 'Participation path', message: 'GGS requirement: every project page states a participation path with a specific CTA — no "Learn More".' }),

  // Insights feed
  rec({ path: '/wireframes/insights', label: 'Filters', message: 'Filters are live against the consolidated dataset (format × program × include-archive via query params). Archived results labeled inline (GGS: tier-aware feeds). 193 legacy "article|report" items count as Article pending the split; 52 items still carry RE-TAG/PENDING-Q3 areas and match no area filter.' }),

  // Insight detail (representative)
  rec({ path: '/wireframes/insights/from-idea-to-impact', label: 'Body', message: 'The italic lead is the real CMS summary (GGS: clear descriptive summary on every page, enforced by a required field — doubles as the AI/SEO description). Article body renders below with prose.css styles.' }),
  rec({ path: '/wireframes/insights/from-idea-to-impact', label: 'Related insights', message: 'Relationship insight → program → project is explicit on the page AND in schema.org Article markup (Front 4) — the taxonomy is the AI-readability play.' }),

  // Archive
  rec({ path: '/wireframes/archive', label: 'Archive index', message: 'Chronological by year; a curated "notable past work" strip would sit at the top if Q10 lands on curation. Evergreen exemptions (Q9) pull items out of this index entirely.', status: 'question' }),
  rec({ path: '/wireframes/archive', label: 'By year', message: 'Real counts per year from content.json. Every item keeps its URL and stays indexed (AI SEO requirement) — item pages carry the archive banner.' }),

  // About
  rec({ path: '/wireframes/about', label: 'Board of Directors', message: 'Board + Team now render real people.json rows (17 people; board = job_title contains "Board": Liz Mohn, Stephen F. Szabo, Wilhelm-Friedrich Uhr). Full board roster likely longer — dataset only has Directus/Contentful people.', status: 'review' }),

  // ---- Draft copy moved off the pages (anything not in content.json) ----
  rec({ path: '/wireframes', label: 'Hero', message: 'Hero renders the `home` row added to pages.json (Aug 3): GGS value prop ("Strengthening the Transatlantic Relationship") + the opening line of Irene’s Jul 29 About Us copy as the dek. No dedicated hero copy exists in any email/doc — placeholder until Irene confirms. Backend export should adopt this row.', status: 'review' }),
  rec({ path: '/wireframes', label: 'Programs', snippet: 'Our Programs', message: 'Card taglines = first sentence of each program intro from programs.json (Irene’s Jul 29 copy). Full intros render on the hub pages.', status: 'review' }),
  rec({ path: '/wireframes', label: 'Subscribe CTA', message: 'Subscribe copy is the current site’s ("Subscribe to receive our updates & newsletters" / "Enter your email and customize your preferences.", static-content.json). Fine to keep or rewrite with Irene.' }),
  rec({ path: '/wireframes/democracy', label: 'Hub intro', message: 'Intro is the real programs.json copy (Irene Jul 29 docx via the consolidated dataset).', status: 'review' }),
  rec({ path: '/wireframes/transatlantic-relations-global-challenges', label: 'Hub intro', message: 'Intro is the real programs.json copy (Irene Jul 29 docx via the consolidated dataset).', status: 'review' }),
  rec({ path: '/wireframes/future-leadership', label: 'Hub intro', message: 'Intro is the real programs.json copy (Irene Jul 29 docx via the consolidated dataset).', status: 'review' }),
  rec({ path: '/wireframes/projects', label: 'Projects index', message: 'Intro line now lives in the dataset: `projects` row added to pages.json (Aug 3), rendered under the h1. Copy is still the CCM draft ("Every BFNA project, grouped by program.") — pending Irene review.', status: 'review' }),
  rec({ path: '/wireframes/insights', label: 'Insights feed', message: 'Intro line now lives in the dataset: `insights` row added to pages.json (Aug 3), rendered under the h1. Copy is still the CCM draft ("Analysis, reports, videos, and infographics from across our work.") — pending Irene review. Backend export should adopt the row.', status: 'review' }),
  rec({ path: '/wireframes/archive', label: 'Archive index', message: 'Intro line now lives in the dataset: `archive` row added to pages.json (Aug 3), rendered under the h1. Copy is still the CCM draft (GGS archive ≠ delete policy) — pending Irene review.', status: 'review' }),
  rec({ path: '/wireframes/projects/transatlantic-barometer', label: 'Microsite CTA', message: 'CTA copy now lives in the dataset: `microsite_cta` field added (Aug 3) to all 6 external projects in projects.json (+ Documentaries stub) — "The complete experience lives on the {project} microsite." Backend export should adopt the field.', status: 'review' }),
  rec({ path: '/wireframes/insights/the-crossroads', label: 'Archive banner', message: 'Banner microcopy now lives in the dataset: `archive-banner` row added to pages.json (Aug 3) with a {date} placeholder — rendered on every archived insight. Copy pending Irene review.', status: 'review' }),

  // ---- Meta removed from the pages entirely (chips, counts, provenance) ----
  rec({ path: '/wireframes', label: 'Programs', snippet: 'Our Programs', message: 'Q1 RESOLVED (Irene email, Jul 31): the 3 top-level areas are "Programs"; the things within them are "Projects" (BFNA internal language, clarified with GGS). Labels flipped site-wide same day. Live counts at snapshot: Democracy 13 active insights · 4 projects; Transatlantic Relations & Global Challenges 66 · 8; Future Leadership 7 · 3.', status: 'review' }),
  rec({ path: '/wireframes/projects/bfna-documentaries', label: 'Project overview', message: 'CCM DRAFT copy (Aug 3): real `bfna-documentaries` row added to projects.json, description drafted from the bfnadocs.org About page in the site’s project-description voice (~490 chars, 2 paragraphs, 37 films / 3 series). Q7 remains open — Irene must approve or replace this draft.', status: 'review' }),
  rec({ path: '/wireframes/about', label: 'Mission', message: 'About Us now renders pages.json (Irene’s Jul 29 copy via the consolidated dataset, 4 paragraphs). The old site’s five "what we do" bullet statements are NOT in the dataset and were dropped from this page — confirm drop, or add them to the dataset.', status: 'review' }),
  rec({ path: '/wireframes/about', label: 'Bertelsmann Stiftung', message: 'Renders the `stiftung` row added to pages.json (Aug 3) — Irene’s replacement text from Megan’s Jul 30 email, incl. the new Executive Board (Dr. Brigitte Mohn, Prof. Dr. Andreas Pinkwart, Wilhelm-Friedrich Uhr). Photo kept, old "image film" link removed per Irene. Backend export should adopt this row.', status: 'done' }),
  rec({ path: '/wireframes/insights/from-idea-to-impact', label: 'Insight header', message: 'Byline shows "[author]" because the author is empty in legacy data for this item — the CMS must enforce author as a required field (applies to titles/summaries too, per GGS).' }),

  // Moved off the search page (was an on-page wf-note; Claudio, Jul 31)
  rec({ path: '/wireframes/search', label: 'Search', message: 'Live title/summary search over all 451 content.json records — stands in for the real search (Front 4), which covers all content types and is tier-aware.' })
  // All 39 seeds reviewed & resolved by Claudio (Aug 4) — ship as done. In-source
  // statuses above are kept as the historical record; new seeds must set their own.
].map(a => ({ ...a, status: 'done' as const }))
