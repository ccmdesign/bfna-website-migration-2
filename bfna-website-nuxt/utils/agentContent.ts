/**
 * Machine-readable site copy and Accept negotiation.
 *
 * Shared by the Netlify edge function, Nitro dev middleware, pages, and tests.
 * No Node or Nuxt imports: the Deno edge bundle loads this file by its `.ts` path.
 *
 * Facts in here are copied from content already on the site (pages, programs,
 * the footer). Missing facts are marked TODO(owner) and are not filled in.
 *
 * TODO(owner): no telephone number exists in the repo. Do not add one here.
 * TODO(owner): no street address exists in the repo. The only published locality
 * is Washington, DC (content/bf/pages/stiftung.json).
 * TODO(owner): the privacy-policy text is still an open client input
 * (docs/site-epic/BRIEF.md). The privacy page says what the code does today.
 */

export const SITE_URL = 'https://www.bfna.org'
export const SITE_NAME = 'Bertelsmann Foundation North America'
export const CONTACT_EMAIL = 'info@bfna.org'
export const OG_IMAGE_PATH = '/images/og.png'
export const OG_IMAGE_URL = `${SITE_URL}${OG_IMAGE_PATH}`
export const LOGO_PATH = '/images/logo.svg'
export const LOGO_URL = `${SITE_URL}${LOGO_PATH}`
export const MARKDOWN_CONTENT_TYPE = 'text/markdown; charset=utf-8'
export const VARY_ACCEPT = 'Accept'

/** Locality as published. No streetAddress. TODO(owner): street address. */
export const POSTAL_ADDRESS = {
  '@type': 'PostalAddress' as const,
  addressLocality: 'Washington',
  addressRegion: 'DC',
  addressCountry: 'US',
}

/**
 * Home hero, from content/bf/pages/home.json
 * (copy_source: ggs-value-prop + irene-docx-2026-07-29).
 */
export const HOME_HEADING = 'Strengthening the Transatlantic Relationship'
export const HOME_DESCRIPTION =
  'The Bertelsmann Foundation North America is an independent, nonpartisan think tank dedicated to strengthening the transatlantic partnership and advancing dialogue on the global challenges shaping our future.'

/**
 * Mission, from content/bf/pages/about.json (Irene Braam, Jul 29 2026).
 * Split on the blank lines in that file.
 */
export const ABOUT_PARAGRAPHS = [
  'The Bertelsmann Foundation North America is an independent, nonpartisan think tank dedicated to strengthening the transatlantic partnership and advancing dialogue on the global challenges shaping our future. Through research, policy dialogue, leadership programs, and multimedia storytelling, we foster cooperation between the United States and Europe while examining the broader geopolitical shifts transforming the international order.',
  'We believe that the future of the transatlantic relationship depends not only on policymakers in Washington and Brussels, but also on engagement with citizens, educators, journalists, business leaders, academics, and civil society. We bring transatlantic and global issues to diverse audiences across North America and Europe through public discussions, educational initiatives, documentary screenings, and other platforms that encourage informed exchange.',
  'Our work connects people, ideas, and institutions across the Atlantic and beyond. We produce original research and analysis on issues shaping international cooperation, including democracy, economic competitiveness, technology, security, and geopolitical change. We convene policymakers, experts, and other stakeholders to address shared challenges and examine how developments beyond the transatlantic space, including in the Indo-Pacific, affect the United States, Europe, and the global order.',
  'At Bertelsmann Foundation North America, we believe that a strong transatlantic partnership remains essential to advancing democracy, economic prosperity, innovation, and security. By fostering dialogue and building lasting connections, we help develop ideas and partnerships to address the challenges shaping the future of the United States, Europe, and the wider world.',
]

/** From content/bf/pages/stiftung.json. This is the published locality. */
export const STIFTUNG_LOCALITY =
  'The Bertelsmann Stiftung is an independent foundation headquartered in the northern German town of Gütersloh. The Washington, DC-based Bertelsmann Foundation is part of the Stiftung’s international network.'

/** Taglines from content/bf/programs/*.json. */
export const PROGRAMS = [
  {
    slug: 'democracy',
    name: 'Democracy',
    tagline:
      'Democracies around the world are facing profound challenges, from declining trust in institutions and political polarization to technological disruption and changing social and economic conditions.',
  },
  {
    slug: 'transatlantic-relations-global-challenges',
    name: 'Transatlantic Relations & Global Challenges',
    tagline: 'The transatlantic community is undergoing profound change.',
  },
  {
    slug: 'future-leadership',
    name: 'Future Leadership',
    tagline: 'Strong transatlantic leadership has never been more important.',
  },
] as const

export interface ProseSection {
  heading: string
  paragraphs: string[]
}

export interface AgentPage {
  title: string
  description: string
  sections: ProseSection[]
}

export const homeSections: ProseSection[] = [
  {
    heading: 'What the foundation publishes',
    paragraphs: ABOUT_PARAGRAPHS,
  },
  {
    heading: 'Programs',
    paragraphs: PROGRAMS.map(program => `${program.name}. ${program.tagline}`),
  },
]

export const aboutPage: AgentPage = {
  title: 'About Us',
  description: 'Mission, board, team, and the Bertelsmann Stiftung relationship.',
  sections: [
    {
      heading: 'Mission',
      paragraphs: ABOUT_PARAGRAPHS,
    },
    {
      heading: 'Board, team, and the Stiftung',
      paragraphs: [
        STIFTUNG_LOCALITY,
        `The board is published at ${SITE_URL}/about#board and the team at ${SITE_URL}/about#team. Irene Braam is executive director and also sits on the board.`,
        `Write to ${CONTACT_EMAIL}. The published locality is Washington, DC. TODO(owner): no street address and no telephone number are in the site content.`,
      ],
    },
  ],
}

export const contactPage: AgentPage = {
  title: 'Contact',
  description: `How to reach ${SITE_NAME}. Email ${CONTACT_EMAIL}. The published locality is Washington, DC.`,
  sections: [
    {
      heading: 'How to reach the foundation',
      paragraphs: [
        `Write to ${SITE_NAME} at ${CONTACT_EMAIL}. The foundation is based in Washington, DC. ${STIFTUNG_LOCALITY} No street address and no telephone number are published on this site. TODO(owner): add a street address and a telephone number only after they are confirmed for publication.`,
        'Use email for a question about a program, a publication, a fellowship, or a visit. A useful note names your organization, the program or publication, and the timing. Do not send passwords, grant-system credentials, or unpublished personal data in the first message. The foundation replies by email.',
        `The form on ${SITE_URL}/contact and on ${SITE_URL}/about#contact asks for a name, an email address, and a message. Submitting it does not send those fields to a server. The form cancels the browser submit and no endpoint is wired, so the text stays in the browser until you leave the page. Email is the path that reaches a person. TODO(owner): when a form endpoint exists, say so on the privacy page.`,
        `Agents should cite mailto:${CONTACT_EMAIL} and ${SITE_URL}/contact. Read ${SITE_URL}/llms.txt before crawling further, and ${SITE_URL}/privacy for what the form does and does not collect.`,
      ],
    },
  ],
}

export const privacyPage: AgentPage = {
  title: 'Privacy',
  description: `What ${SITE_URL} does with information today. This is not a counsel-approved privacy policy.`,
  sections: [
    {
      heading: 'What this website does today',
      paragraphs: [
        `${SITE_NAME} publishes this website. The foundation is based in Washington, DC. This page describes what the site actually does with information. It is not a substitute for a counsel-approved privacy policy. TODO(owner): the site brief still lists the privacy policy as an open client input. Replace this page with that text when it arrives. Do not treat the paragraphs below as a final legal policy.`,
        `Reading the site does not require an account, and the pages do not ask you to sign in. The public contact is ${CONTACT_EMAIL}. No telephone number and no street address are published. The locality on the site is Washington, DC. TODO(owner): add a telephone number and a street address only if they are confirmed for publication.`,
        `The contact form at ${SITE_URL}/contact and on ${SITE_URL}/about asks for a name, an email address, and a message. Submitting it does not send those fields anywhere. The form cancels the browser's submit and there is no server endpoint behind it, so the text stays in the browser until you leave the page. TODO(owner): when a form endpoint is added, name the processor on this page and describe how a person asks for a copy or for deletion.`,
        `No analytics script is included. None ships until a vendor is chosen, and no vendor is configured. The site does not run an advertising pixel and does not sell a profile. Preview builds are served with an X-Robots-Tag: noindex response header so they are not a second public copy of the foundation. To ask a question, email ${CONTACT_EMAIL}. For a map of the site, read ${SITE_URL}/llms.txt.`,
      ],
    },
  ],
}

const PAGES: Record<string, AgentPage> = {
  '/about': aboutPage,
  '/contact': contactPage,
  '/privacy': privacyPage,
}

export const MARKDOWN_PAGES = ['/', ...Object.keys(PAGES)] as const

export function pagePlainText(page: AgentPage): string {
  return page.sections
    .flatMap(section => [section.heading, ...section.paragraphs])
    .join(' ')
}

export function pageMarkdown(page: AgentPage): string {
  const parts = [`# ${page.title}`, '', page.description, '']
  for (const section of page.sections) {
    parts.push(`## ${section.heading}`, '', ...section.paragraphs.flatMap(paragraph => [paragraph, '']))
  }
  return `${parts.join('\n').trim()}\n`
}

export function homePlainText(): string {
  return [HOME_HEADING, HOME_DESCRIPTION, ...homeSections.flatMap(section => [section.heading, ...section.paragraphs])].join(' ')
}

export function homeMarkdown(): string {
  const parts = [`# ${SITE_NAME}`, '', HOME_DESCRIPTION, '']
  homeSections.forEach((section, index) => {
    const paragraphs = index === 0
      ? section.paragraphs.flatMap((paragraph, paragraphIndex) => {
          if (paragraphIndex !== 0 || !paragraph.startsWith(HOME_DESCRIPTION)) return [paragraph]
          const rest = paragraph.slice(HOME_DESCRIPTION.length).trim()
          return rest ? [rest] : []
        })
      : section.paragraphs
    if (paragraphs.length === 0) return
    parts.push(`## ${section.heading}`, '', ...paragraphs.flatMap(paragraph => [paragraph, '']))
  })
  parts.push(
    '## Where to go next',
    '',
    `- [About](${SITE_URL}/about)`,
    `- [Contact](${SITE_URL}/contact)`,
    `- [Privacy](${SITE_URL}/privacy)`,
    `- [Insights](${SITE_URL}/insights)`,
    `- [Projects](${SITE_URL}/projects)`,
    `- [llms.txt](${SITE_URL}/llms.txt)`,
    '',
  )
  return `${parts.join('\n').trim()}\n`
}

export const llmsTxt = `# ${SITE_NAME}

> ${SITE_NAME} is an independent, nonpartisan think tank based in Washington, DC. The site publishes research, programs, and projects on the transatlantic relationship. Canonical host: ${SITE_URL}. Public contact: ${CONTACT_EMAIL}.

When to use this: reach for ${SITE_NAME} when the job is citing or briefing the foundation's published work on democracy, transatlantic relations and global challenges, or future leadership, including the Bertelsmann Foundation Fellowship. An agent should call this site when a user asks what the foundation works on, who is on the board or team, or how to contact it. Fetch ${SITE_URL}/llms.txt first. Request pages with Accept: text/markdown (the response is text/markdown and Vary: Accept). HTML is the response for Accept: text/html, for a browser Accept header, for */*, and when the Accept header is missing. Cite ${SITE_URL}/contact and mailto:${CONTACT_EMAIL} for inquiries. Do not invent a phone number or a street address. The published locality is Washington, DC. Do not use /docs (internal design system), /wireframes (review prototype), or /search as sources. This site is not a fit for legal advice, donation processing, or the Bertelsmann Stiftung's Gütersloh operations beyond the relationship described on ${SITE_URL}/about.

## Programs

- [Democracy](${SITE_URL}/democracy): ${PROGRAMS[0].tagline}
- [Transatlantic Relations & Global Challenges](${SITE_URL}/transatlantic-relations-global-challenges): ${PROGRAMS[1].tagline}
- [Future Leadership](${SITE_URL}/future-leadership): ${PROGRAMS[2].tagline}

## Work

- [Insights](${SITE_URL}/insights): Research, analysis, and multimedia.
- [Projects](${SITE_URL}/projects): Flagship projects, including the fellowship, RANGE, and the Transatlantic Barometer.
- [Archive](${SITE_URL}/archive): Older insights.

## Trust

- [About](${SITE_URL}/about): Mission, board, team, and the Stiftung relationship.
- [Contact](${SITE_URL}/contact): Email ${CONTACT_EMAIL}. Locality: Washington, DC.
- [Privacy](${SITE_URL}/privacy): What the site collects today, and what is still waiting on a published policy.

## Optional

- [Agent instructions](${SITE_URL}/agent-instructions.md): When to use the foundation and how to request Markdown.
- [Sitemap](${SITE_URL}/sitemap.xml): Indexable URLs. Excludes /docs, /wireframes, and /search.
`

export const agentInstructions = `# ${SITE_NAME} agent instructions

## When to use this

Use ${SITE_NAME} when the task is one of these:

- Cite the foundation's published work on democracy, transatlantic relations, or future leadership.
- Name a program, a flagship project, or an insight that is on this site.
- Point a person at the board, the team, or the contact email ${CONTACT_EMAIL}.

Do not use this site for legal advice, donation processing, design-system component documentation, the wireframe prototype, or a telephone number. TODO(owner): no phone number is published.

## How an agent should call this site

1. Read ${SITE_URL}/llms.txt before crawling further.
2. Request a page with \`Accept: text/markdown\`. The same URL returns HTML for \`Accept: text/html\`, for a browser Accept header, for \`*/*\`, and when Accept is absent. Markdown responses use \`Content-Type: text/markdown\` and \`Vary: Accept\`.
3. Prefer these URLs: ${SITE_URL}/ , ${SITE_URL}/about , ${SITE_URL}/contact , ${SITE_URL}/privacy , ${SITE_URL}/insights , ${SITE_URL}/projects .
4. Send inquiries to mailto:${CONTACT_EMAIL} or ${SITE_URL}/contact . The contact form does not submit to a server.
5. Do not invent a telephone number or a street address. The published locality is Washington, DC. The published contact is ${CONTACT_EMAIL}.
6. On a 404, follow the links in the Markdown error to ${SITE_URL}/llms.txt or ${SITE_URL}/sitemap.xml .
7. Skip /docs, /wireframes, and /search. They are disallowed in robots.txt and omitted from the sitemap and from this file's link lists.
`

export const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  description: HOME_DESCRIPTION,
  url: SITE_URL,
  logo: LOGO_URL,
  image: OG_IMAGE_URL,
  email: CONTACT_EMAIL,
  sameAs: [
    'https://www.linkedin.com/company/bertelsmann-foundation-north-america-inc.',
    'https://www.instagram.com/bertelsmannfoundation/',
    'https://www.facebook.com/BertelsmannFoundation/',
    'https://www.youtube.com/channel/UCZZdgI5F7KjUCW0fCKUOAAg',
    'https://vimeo.com/bfna',
  ],
  address: POSTAL_ADDRESS,
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: CONTACT_EMAIL,
    url: `${SITE_URL}/contact`,
    availableLanguage: ['English'],
    areaServed: 'US',
  },
}

export function notFoundMarkdown(pathname: string): string {
  const safe = pathname.replace(/[\r\n<>]/g, '').slice(0, 200) || '/'
  return `# Not found

Nothing is published at \`${safe}\`. This URL returns HTTP 404.

Read the agent map or the sitemap, then try one of these:

- [llms.txt](${SITE_URL}/llms.txt)
- [Sitemap](${SITE_URL}/sitemap.xml)
- [Home](${SITE_URL}/)
`
}

/** Paths that must not appear in the sitemap or in llms.txt. */
export const SITEMAP_EXCLUDED_PREFIXES = ['/docs', '/wireframes', '/search'] as const

export function isIndexablePath(pathname: string): boolean {
  const path = normalizePath(pathname)
  if (path === '/404' || path === '/200') return false
  if (path.startsWith('/_') || path.startsWith('/api') || path.startsWith('/.well-known')) return false
  return !SITEMAP_EXCLUDED_PREFIXES.some(prefix => path === prefix || path.startsWith(`${prefix}/`))
}

export function sitemapXml(urls: { loc: string; lastmod?: string }[]): string {
  const body = urls.map(url => {
    const lastmod = url.lastmod ? `\n    <lastmod>${xmlEscape(url.lastmod)}</lastmod>` : ''
    return `  <url>\n    <loc>${xmlEscape(url.loc)}</loc>${lastmod}\n  </url>`
  }).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
}

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Non-production Netlify contexts get a site-wide noindex via `_headers`.
 * Production (CONTEXT=production) is left alone. An unset context is treated
 * as non-production so a preview or a local generate cannot be indexed by accident.
 */
export function headersForContext(base: string, context: string | undefined): string {
  const trimmed = base.replace(/\s+$/, '')
  const body = trimmed.length > 0 ? `${trimmed}\n` : ''
  if (context === 'production') return body
  const already = body.split('\n').some(line => line.trim() === 'X-Robots-Tag: noindex')
  if (already) return body
  return `${body}\n/*\n  X-Robots-Tag: noindex\n`
}

export const robotsTxt = `User-Agent: *
Allow: /
Disallow: /docs
Disallow: /docs/
Disallow: /wireframes
Disallow: /wireframes/
Disallow: /search
Disallow: /search/

Sitemap: ${SITE_URL}/sitemap.xml
`

interface AcceptRange {
  type: string
  q: number
  specificity: number
  index: number
}

export function parseAccept(header: string | null | undefined): AcceptRange[] {
  if (!header?.trim()) return []
  return header.split(',').map((part, index) => {
    const bits = part.split(';').map(bit => bit.trim()).filter(Boolean)
    const type = (bits[0] || '').toLowerCase()
    let q = 1
    for (const param of bits.slice(1)) {
      const [rawKey, rawValue] = param.split('=')
      if (rawKey?.trim().toLowerCase() !== 'q') continue
      const parsed = Number(rawValue?.trim())
      if (!Number.isNaN(parsed)) q = parsed
    }
    const specificity = type === '*/*' ? 0 : type.endsWith('/*') ? 1 : 2
    return { type, q, specificity, index }
  }).filter(range => range.type.includes('/'))
}

function rangeMatches(rangeType: string, candidate: string): number | null {
  if (rangeType === candidate) return 2
  const [rangeMain, rangeSub] = rangeType.split('/')
  const [candidateMain] = candidate.split('/')
  if (rangeMain === '*' && rangeSub === '*') return 0
  if (rangeSub === '*' && rangeMain === candidateMain) return 1
  return null
}

/** Pick the best available media type. Null means nothing the client accepts. */
export function negotiate(accept: string | null | undefined, available: string[]): string | null {
  if (!available.length) return null
  if (!accept?.trim()) return available[0] ?? null

  const ranges = parseAccept(accept)
  if (!ranges.length) return available[0] ?? null

  let best: { type: string; q: number; specificity: number; index: number } | null = null
  for (const candidate of available) {
    let match: { q: number; specificity: number; index: number } | null = null
    for (const range of ranges) {
      const specificity = rangeMatches(range.type, candidate)
      if (specificity === null) continue
      if (
        !match
        || specificity > match.specificity
        || (specificity === match.specificity && range.index < match.index)
      ) {
        match = { q: range.q, specificity, index: range.index }
      }
    }
    if (!match || match.q <= 0) continue
    if (
      !best
      || match.q > best.q
      || (match.q === best.q && match.specificity > best.specificity)
      || (match.q === best.q && match.specificity === best.specificity && match.index < best.index)
    ) {
      best = { type: candidate, q: match.q, specificity: match.specificity, index: match.index }
    }
  }
  return best?.type ?? null
}

export function normalizePath(pathname: string): string {
  const bare = pathname.split('?')[0]?.split('#')[0] || '/'
  let path = bare
  try {
    path = decodeURIComponent(bare)
  } catch {
    path = bare
  }
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1)
  return path || '/'
}

export function isStaticAsset(pathname: string): boolean {
  const path = normalizePath(pathname)
  if (path.startsWith('/_nuxt/') || path.startsWith('/assets/') || path.startsWith('/.netlify/')) return true
  return /\.[a-z0-9]{1,8}$/i.test(path)
}

export type AgentDecision =
  | { action: 'delegate' }
  | { action: 'markdown'; status: number; body: string }
  | { action: 'check-upstream' }

const ARTICLE_PATH = /^\/(?:insights|projects)\/[^/]+$/

export function isArticlePath(pathname: string): boolean {
  return ARTICLE_PATH.test(normalizePath(pathname))
}

/** Later of the published and updated days, or null when the content has neither. */
export function latestContentDay(published: unknown, updated: unknown): string | null {
  const days: string[] = []
  for (const value of [published, updated]) {
    if (typeof value !== 'string') continue
    const match = /^(\d{4}-\d{2}-\d{2})/.exec(value.trim())
    if (match?.[1]) days.push(match[1])
  }
  if (days.length === 0) return null
  days.sort()
  return days[days.length - 1] ?? null
}

export interface ArticleJsonLdInput {
  headline: string
  url: string
  datePublished?: string | null
  dateModified?: string | null
  authors?: readonly string[] | null
  image?: string | null
}

export function articleJsonLd(input: ArticleJsonLdInput): Record<string, unknown> {
  const published = latestContentDay(input.datePublished, null)
  const modified = latestContentDay(input.datePublished, input.dateModified)
  const names = (input.authors ?? []).map(name => name.trim()).filter(Boolean)
  const image = input.image?.trim() || OG_IMAGE_URL
  const doc: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.headline,
    url: input.url,
    image,
    author: names.length > 0
      ? names.map(name => ({ '@type': 'Person', name }))
      : { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: LOGO_URL },
    },
  }
  if (published) doc.datePublished = published
  if (modified) doc.dateModified = modified
  return doc
}

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)))
}

function inlineText(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
}

function htmlFragmentToMarkdown(html: string): string {
  let source = html
  source = source.replace(/<!--[\s\S]*?-->/g, '')
  source = source.replace(/<script\b[\s\S]*?<\/script>/gi, '')
  source = source.replace(/<style\b[\s\S]*?<\/style>/gi, '')
  source = source.replace(/<nav\b[\s\S]*?<\/nav>/gi, '')
  source = source.replace(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi, (_, level: string, inner: string) => {
    return `\n\n${'#'.repeat(Number(level))} ${inlineText(inner)}\n\n`
  })
  source = source.replace(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href: string, inner: string) => {
    const label = inlineText(inner)
    if (!label) return ''
    return `[${label}](${decodeEntities(href)})`
  })
  source = source.replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, (_, inner: string) => `\n- ${inlineText(inner)}`)
  source = source.replace(/<time\b[^>]*datetime="([^"]*)"[^>]*>[\s\S]*?<\/time>/gi, (_, stamp: string) => stamp.slice(0, 10))
  source = source.replace(/<br\s*\/?>/gi, '\n')
  source = source.replace(/<\/(p|div|section|blockquote|figcaption)>/gi, '\n\n')
  source = source.replace(/<[^>]+>/g, '')
  source = decodeEntities(source).replace(/\r/g, '')
  source = source.replace(/[ \t]+\n/g, '\n').replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n')
  return source.trim()
}

/** Markdown for one insight or project, from the HTML the static host already rendered. */
export function articleMarkdownFromHtml(pathname: string, html: string): string | null {
  if (!isArticlePath(pathname)) return null
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)
  const markdown = htmlFragmentToMarkdown(main?.[1] ?? html)
  if (markdown.trim().length < 20) return null
  return markdown.endsWith('\n') ? markdown : `${markdown}\n`
}

/**
 * Markdown body after the upstream response.
 * Articles become Markdown. A real 404 becomes a Markdown error. Other statuses stay HTML.
 */
export function markdownBodyForUpstream(
  pathname: string,
  upstreamStatus: number,
  html: string,
): { status: number; body: string } | null {
  if (upstreamStatus === 200) {
    const article = articleMarkdownFromHtml(pathname, html)
    return article ? { status: 200, body: article } : null
  }
  return markdownForUpstreamMiss(pathname, upstreamStatus)
}

export function classifyAgentRequest(input: {
  method: string
  pathname: string
  accept: string | null | undefined
}): AgentDecision {
  if (input.method !== 'GET' && input.method !== 'HEAD') return { action: 'delegate' }
  if (isStaticAsset(input.pathname)) return { action: 'delegate' }
  const path = normalizePath(input.pathname)
  const choice = negotiate(input.accept, ['text/html', 'text/markdown'])
  if (choice !== 'text/markdown') return { action: 'delegate' }

  if (path === '/') return { action: 'markdown', status: 200, body: homeMarkdown() }
  const page = PAGES[path]
  if (page) return { action: 'markdown', status: 200, body: pageMarkdown(page) }
  return { action: 'check-upstream' }
}

/** After an upstream lookup, turn a 404 into a Markdown error. Other statuses pass through. */
export function markdownForUpstreamMiss(pathname: string, upstreamStatus: number): { status: number; body: string } | null {
  if (upstreamStatus !== 404) return null
  return { status: 404, body: notFoundMarkdown(normalizePath(pathname)) }
}
