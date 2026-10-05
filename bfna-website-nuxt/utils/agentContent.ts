/**
 * Machine-readable site copy, Accept negotiation, the public API, and the MCP card.
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
export const OG_IMAGE_PATH = '/images/logo.svg'
export const OG_IMAGE_URL = `${SITE_URL}${OG_IMAGE_PATH}`
export const MARKDOWN_CONTENT_TYPE = 'text/markdown; charset=utf-8'
export const JSON_CONTENT_TYPE = 'application/json; charset=utf-8'
export const VARY_ACCEPT = 'Accept'
export const MCP_PROTOCOL_VERSION = '2025-06-18'
export const MCP_PATH = '/.well-known/mcp'
export const MCP_SESSION_ID = 'bfna-public'

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
    heading: HOME_HEADING,
    paragraphs: [HOME_DESCRIPTION],
  },
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

export const developersPage: AgentPage = {
  title: 'Bertelsmann Foundation North America API',
  description: 'Public read-only HTTP API. No API key. Authentication: none.',
  sections: [
    {
      heading: 'Authentication',
      paragraphs: [
        `The ${SITE_NAME} API is public and read-only. Authentication: none. There is no API key, no account, and no OAuth flow. Every operation in ${SITE_URL}/openapi.json is an unauthenticated GET. POST, PUT, PATCH, and DELETE return a JSON error with code method_not_allowed.`,
      ],
    },
    {
      heading: 'Endpoints',
      paragraphs: [
        `GET ${SITE_URL}/api/v1/organization returns the name, canonical URL, email, and the Washington, DC locality. operationId: getOrganization.`,
        `GET ${SITE_URL}/api/v1/navigation returns the public sections (programs, work, trust, developer). An optional section query filters the list. Allowed values: programs, work, trust, developer. operationId: listNavigation.`,
        `GET ${SITE_URL}/api/v1/health returns {"status":"ok"}. operationId: getHealth.`,
        `An unknown path under /api returns HTTP 404 and a JSON body with error.code, error.message, and error.hint. The hint points at ${SITE_URL}/openapi.json. The design-system pages under /docs, the /wireframes prototype, and /search are not part of this API.`,
      ],
    },
    {
      heading: 'Example requests',
      paragraphs: [
        `curl -sS -H 'Accept: application/json' ${SITE_URL}/api/v1/organization`,
        `curl -sS -H 'Accept: application/json' '${SITE_URL}/api/v1/navigation?section=programs'`,
        `curl -sS -i -X POST ${SITE_URL}/api/v1/organization`,
        `The machine-readable description is ${SITE_URL}/openapi.json. A Model Context Protocol endpoint with Streamable HTTP lives at ${SITE_URL}${MCP_PATH}: POST a JSON-RPC initialize request. Agents should read ${SITE_URL}/llms.txt first.`,
      ],
    },
  ],
}

const PAGES: Record<string, AgentPage> = {
  '/about': aboutPage,
  '/contact': contactPage,
  '/privacy': privacyPage,
  '/developers': developersPage,
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
  for (const section of homeSections) {
    parts.push(`## ${section.heading}`, '', ...section.paragraphs.flatMap(paragraph => [paragraph, '']))
  }
  parts.push(
    '## Where to go next',
    '',
    `- [About](${SITE_URL}/about)`,
    `- [Contact](${SITE_URL}/contact)`,
    `- [Privacy](${SITE_URL}/privacy)`,
    `- [Insights](${SITE_URL}/insights)`,
    `- [Projects](${SITE_URL}/projects)`,
    `- [Developer API](${SITE_URL}/developers)`,
    `- [OpenAPI](${SITE_URL}/openapi.json)`,
    `- [llms.txt](${SITE_URL}/llms.txt)`,
    '',
  )
  return `${parts.join('\n').trim()}\n`
}

export const llmsTxt = `# ${SITE_NAME}

> ${SITE_NAME} is an independent, nonpartisan think tank based in Washington, DC. The site publishes research, programs, and projects on the transatlantic relationship. Canonical host: ${SITE_URL}. Public contact: ${CONTACT_EMAIL}.

When to use this: reach for ${SITE_NAME} when the job is citing or briefing the foundation's published work on democracy, transatlantic relations and global challenges, or future leadership, including the Bertelsmann Foundation Fellowship. An agent should call this site when a user asks what the foundation works on, who is on the board or team, how to contact it, or how to read the public API. Fetch ${SITE_URL}/llms.txt first. Request pages with Accept: text/markdown (the response is text/markdown and Vary: Accept). HTML is the response for Accept: text/html, for a browser Accept header, for */*, and when the Accept header is missing. Cite ${SITE_URL}/contact and mailto:${CONTACT_EMAIL} for inquiries. Do not invent a phone number or a street address. The published locality is Washington, DC. Do not use /docs (internal design system), /wireframes (review prototype), or /search as sources. This site is not a fit for legal advice, donation processing, or the Bertelsmann Stiftung's Gütersloh operations beyond the relationship described on ${SITE_URL}/about.

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

## Developer

- [Developer API](${SITE_URL}/developers): Authentication, endpoints, and example requests. No API key.
- [OpenAPI](${SITE_URL}/openapi.json): Operation ids, parameters, and response schemas.
- [Organization](${SITE_URL}/api/v1/organization): JSON record for the foundation.
- [Navigation](${SITE_URL}/api/v1/navigation): Public section list.
- [MCP](${SITE_URL}${MCP_PATH}): Streamable HTTP handshake.

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
- Call the public read-only API or the MCP endpoint for structured fields.

Do not use this site for legal advice, donation processing, design-system component documentation, the wireframe prototype, or a telephone number. TODO(owner): no phone number is published.

## How an agent should call this site

1. Read ${SITE_URL}/llms.txt before crawling further.
2. Request a page with \`Accept: text/markdown\`. The same URL returns HTML for \`Accept: text/html\`, for a browser Accept header, for \`*/*\`, and when Accept is absent. Markdown responses use \`Content-Type: text/markdown\` and \`Vary: Accept\`.
3. Prefer these URLs: ${SITE_URL}/ , ${SITE_URL}/about , ${SITE_URL}/contact , ${SITE_URL}/privacy , ${SITE_URL}/insights , ${SITE_URL}/projects , ${SITE_URL}/developers .
4. Send inquiries to mailto:${CONTACT_EMAIL} or ${SITE_URL}/contact . The contact form does not submit to a server.
5. Do not invent a telephone number or a street address. The published locality is Washington, DC. The published contact is ${CONTACT_EMAIL}.
6. For structured data, GET ${SITE_URL}/api/v1/organization or read ${SITE_URL}/openapi.json. Errors are JSON objects with error.code, error.message, and error.hint.
7. On a 404, follow the links in the Markdown error to ${SITE_URL}/llms.txt or ${SITE_URL}/sitemap.xml .
8. Skip /docs, /wireframes, and /search. They are disallowed in robots.txt and omitted from the sitemap and from this file's link lists.
`

export const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  description: HOME_DESCRIPTION,
  url: SITE_URL,
  logo: OG_IMAGE_URL,
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
- [Developer API](${SITE_URL}/developers)
- [Home](${SITE_URL}/)
`
}

export interface ApiErrorBody {
  error: {
    code: string
    message: string
    hint: string
  }
}

export function apiError(code: string, message: string, hint: string): ApiErrorBody {
  return { error: { code, message, hint } }
}

const API_HINT = `Read ${SITE_URL}/openapi.json for getOrganization, listNavigation, and getHealth. Developer docs: ${SITE_URL}/developers.`

export interface NavLink {
  section: 'programs' | 'work' | 'trust' | 'developer'
  title: string
  url: string
  description: string
}

export const NAV_LINKS: NavLink[] = [
  ...PROGRAMS.map(program => ({
    section: 'programs' as const,
    title: program.name,
    url: `${SITE_URL}/${program.slug}`,
    description: program.tagline,
  })),
  {
    section: 'work',
    title: 'Insights',
    url: `${SITE_URL}/insights`,
    description: 'Research, analysis, and multimedia.',
  },
  {
    section: 'work',
    title: 'Projects',
    url: `${SITE_URL}/projects`,
    description: 'Flagship projects, including the fellowship, RANGE, and the Transatlantic Barometer.',
  },
  {
    section: 'trust',
    title: 'About',
    url: `${SITE_URL}/about`,
    description: 'Mission, board, team, and the Stiftung relationship.',
  },
  {
    section: 'trust',
    title: 'Contact',
    url: `${SITE_URL}/contact`,
    description: `Email ${CONTACT_EMAIL}. Locality: Washington, DC.`,
  },
  {
    section: 'trust',
    title: 'Privacy',
    url: `${SITE_URL}/privacy`,
    description: 'What the site collects today.',
  },
  {
    section: 'developer',
    title: 'Developer API',
    url: `${SITE_URL}/developers`,
    description: 'Authentication, endpoints, and example requests. No API key.',
  },
  {
    section: 'developer',
    title: 'OpenAPI',
    url: `${SITE_URL}/openapi.json`,
    description: 'Operation ids, typed parameters, and response schemas.',
  },
]

export const NAV_SECTIONS = ['programs', 'work', 'trust', 'developer'] as const

export interface OrganizationDocument {
  name: string
  url: string
  email: string
  description: string
  address: {
    addressLocality: string
    addressRegion: string
    addressCountry: string
  }
}

export function organizationDocument(): OrganizationDocument {
  return {
    name: SITE_NAME,
    url: SITE_URL,
    email: CONTACT_EMAIL,
    description: HOME_DESCRIPTION,
    address: {
      addressLocality: POSTAL_ADDRESS.addressLocality,
      addressRegion: POSTAL_ADDRESS.addressRegion,
      addressCountry: POSTAL_ADDRESS.addressCountry,
    },
  }
}

export function healthDocument(): { status: 'ok'; service: string } {
  return { status: 'ok', service: SITE_NAME }
}

export function navigationDocument(section: string | null): { links: NavLink[] } {
  const links = section ? NAV_LINKS.filter(link => link.section === section) : NAV_LINKS
  return { links }
}

export interface DirectHttpResult {
  status: number
  body: string | null
  headers: Record<string, string>
}

const JSON_HEADERS: Record<string, string> = {
  'content-type': JSON_CONTENT_TYPE,
}

export function apiResult(method: string, pathname: string, section: string | null): DirectHttpResult | null {
  const path = normalizePath(pathname)
  if (path !== '/api' && !path.startsWith('/api/')) return null

  if (method !== 'GET' && method !== 'HEAD') {
    return {
      status: 405,
      body: JSON.stringify(apiError(
        'method_not_allowed',
        `${method} is not allowed on ${path}.`,
        `${API_HINT} Use GET.`,
      )),
      headers: { ...JSON_HEADERS, allow: 'GET, HEAD' },
    }
  }

  if (path === '/api/v1/organization') {
    return { status: 200, body: `${JSON.stringify(organizationDocument())}\n`, headers: JSON_HEADERS }
  }
  if (path === '/api/v1/health') {
    return { status: 200, body: `${JSON.stringify(healthDocument())}\n`, headers: JSON_HEADERS }
  }
  if (path === '/api/v1/navigation') {
    if (section && !NAV_SECTIONS.includes(section as typeof NAV_SECTIONS[number])) {
      return {
        status: 400,
        body: JSON.stringify(apiError(
          'invalid_section',
          `section must be one of ${NAV_SECTIONS.join(', ')}.`,
          API_HINT,
        )),
        headers: JSON_HEADERS,
      }
    }
    return {
      status: 200,
      body: `${JSON.stringify(navigationDocument(section))}\n`,
      headers: JSON_HEADERS,
    }
  }

  return {
    status: 404,
    body: JSON.stringify(apiError(
      'not_found',
      `No API resource is published at ${path}.`,
      API_HINT,
    )),
    headers: JSON_HEADERS,
  }
}

export const mcpServerCard = {
  protocolVersion: MCP_PROTOCOL_VERSION,
  serverInfo: {
    name: SITE_NAME,
    title: SITE_NAME,
    version: '1.0.0',
  },
  description: `Public read-only tools for ${SITE_NAME}. No authentication. Locality: Washington, DC. Contact: ${CONTACT_EMAIL}.`,
  documentationUrl: `${SITE_URL}/developers`,
  transport: {
    type: 'streamable-http',
    endpoint: MCP_PATH,
  },
  capabilities: {
    tools: { listChanged: false },
  },
  authentication: {
    required: false,
    schemes: [] as string[],
  },
}

const MCP_TOOLS = [
  {
    name: 'get_organization',
    description: `Return the public ${SITE_NAME} record: name, canonical URL, email, description, and the Washington, DC locality. No telephone or street address is published.`,
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'list_public_pages',
    description: 'List public sections of the site. Optional section filter: programs, work, trust, or developer. Does not include /docs, /wireframes, or /search.',
    inputSchema: {
      type: 'object',
      properties: {
        section: {
          type: 'string',
          enum: [...NAV_SECTIONS],
          description: 'Limit the list to one section.',
        },
      },
      additionalProperties: false,
    },
  },
]

const MCP_CORS: Record<string, string> = {
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'Mcp-Session-Id',
}

function jsonRpcResult(id: unknown, result: unknown): string {
  return JSON.stringify({ jsonrpc: '2.0', id, result })
}

function jsonRpcError(id: unknown, code: number, message: string): string {
  return JSON.stringify({
    jsonrpc: '2.0',
    id,
    error: { code, message, data: { hint: `POST an initialize request to ${SITE_URL}${MCP_PATH}. See ${SITE_URL}/developers.` } },
  })
}

export function mcpResult(input: { method: string; body: string | null }): DirectHttpResult | null {
  const method = input.method.toUpperCase()
  if (method === 'OPTIONS') {
    return {
      status: 204,
      body: null,
      headers: {
        ...MCP_CORS,
        'access-control-allow-methods': 'GET, POST, DELETE, OPTIONS',
        'access-control-allow-headers': 'content-type, accept, mcp-session-id, mcp-protocol-version, last-event-id',
        'access-control-max-age': '86400',
      },
    }
  }
  if (method === 'GET' || method === 'HEAD') {
    return {
      status: 200,
      body: `${JSON.stringify(mcpServerCard, null, 2)}\n`,
      headers: { ...JSON_HEADERS, ...MCP_CORS },
    }
  }
  if (method === 'DELETE') {
    return { status: 204, body: null, headers: MCP_CORS }
  }
  if (method !== 'POST') {
    return {
      status: 405,
      body: jsonRpcError(null, -32601, `${method} is not allowed on ${MCP_PATH}.`),
      headers: { ...JSON_HEADERS, ...MCP_CORS, allow: 'GET, POST, DELETE, OPTIONS, HEAD' },
    }
  }

  let message: unknown
  try {
    message = JSON.parse(input.body || '')
  } catch {
    return {
      status: 400,
      body: jsonRpcError(null, -32700, 'Parse error'),
      headers: { ...JSON_HEADERS, ...MCP_CORS },
    }
  }
  if (!message || typeof message !== 'object' || Array.isArray(message)) {
    return {
      status: 400,
      body: jsonRpcError(null, -32600, 'Invalid Request'),
      headers: { ...JSON_HEADERS, ...MCP_CORS },
    }
  }
  const record = message as { id?: unknown; method?: unknown; params?: unknown }
  const id = record.id ?? null
  const rpcMethod = typeof record.method === 'string' ? record.method : ''
  const hasId = Object.prototype.hasOwnProperty.call(record, 'id')

  if (rpcMethod === 'notifications/initialized' || rpcMethod.startsWith('notifications/')) {
    return { status: 202, body: null, headers: MCP_CORS }
  }

  if (rpcMethod === 'initialize') {
    return {
      status: 200,
      body: jsonRpcResult(id, {
        protocolVersion: MCP_PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: SITE_NAME, version: '1.0.0' },
        instructions: `Public read-only tools for ${SITE_NAME}. No authentication. Use get_organization and list_public_pages. Contact ${CONTACT_EMAIL}. Locality: Washington, DC. Do not invent a phone number.`,
      }),
      headers: { ...JSON_HEADERS, ...MCP_CORS, 'mcp-session-id': MCP_SESSION_ID },
    }
  }

  if (rpcMethod === 'ping') {
    return {
      status: 200,
      body: jsonRpcResult(id, {}),
      headers: { ...JSON_HEADERS, ...MCP_CORS },
    }
  }

  if (rpcMethod === 'tools/list') {
    return {
      status: 200,
      body: jsonRpcResult(id, { tools: MCP_TOOLS }),
      headers: { ...JSON_HEADERS, ...MCP_CORS },
    }
  }

  if (rpcMethod === 'tools/call') {
    const params = (record.params && typeof record.params === 'object') ? record.params as { name?: unknown; arguments?: unknown } : {}
    const name = typeof params.name === 'string' ? params.name : ''
    const args = (params.arguments && typeof params.arguments === 'object') ? params.arguments as { section?: unknown } : {}
    if (name === 'get_organization') {
      return {
        status: 200,
        body: jsonRpcResult(id, {
          content: [{ type: 'text', text: JSON.stringify(organizationDocument()) }],
          isError: false,
        }),
        headers: { ...JSON_HEADERS, ...MCP_CORS },
      }
    }
    if (name === 'list_public_pages') {
      const section = typeof args.section === 'string' ? args.section : null
      if (section && !NAV_SECTIONS.includes(section as typeof NAV_SECTIONS[number])) {
        return {
          status: 200,
          body: jsonRpcResult(id, {
            content: [{ type: 'text', text: `section must be one of ${NAV_SECTIONS.join(', ')}.` }],
            isError: true,
          }),
          headers: { ...JSON_HEADERS, ...MCP_CORS },
        }
      }
      return {
        status: 200,
        body: jsonRpcResult(id, {
          content: [{ type: 'text', text: JSON.stringify(navigationDocument(section)) }],
          isError: false,
        }),
        headers: { ...JSON_HEADERS, ...MCP_CORS },
      }
    }
    return {
      status: 200,
      body: jsonRpcResult(id, {
        content: [{ type: 'text', text: `Unknown tool ${name}. Tools: get_organization, list_public_pages.` }],
        isError: true,
      }),
      headers: { ...JSON_HEADERS, ...MCP_CORS },
    }
  }

  if (!hasId) return { status: 202, body: null, headers: MCP_CORS }

  return {
    status: 200,
    body: jsonRpcError(id, -32601, `Method not found: ${rpcMethod || '(missing)'}`),
    headers: { ...JSON_HEADERS, ...MCP_CORS },
  }
}

export const openapiDocument = {
  openapi: '3.1.0',
  info: {
    title: `${SITE_NAME} API`,
    version: '1.0.0',
    description: `Public read-only API for ${SITE_NAME}, a think tank based in Washington, DC. Authentication: none. No API key. Contact: ${CONTACT_EMAIL}.`,
  },
  servers: [{ url: SITE_URL, description: 'Canonical host' }],
  paths: {
    '/api/v1/organization': {
      get: {
        operationId: 'getOrganization',
        summary: 'Organization record',
        description: `Name, canonical URL, email, description, and the Washington, DC locality for ${SITE_NAME}. No telephone or street address is published.`,
        responses: {
          '200': {
            description: 'The organization record.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Organization' },
              },
            },
          },
          '405': { $ref: '#/components/responses/MethodNotAllowed' },
        },
      },
    },
    '/api/v1/navigation': {
      get: {
        operationId: 'listNavigation',
        summary: 'Public section list',
        description: 'Public programs, work, trust, and developer links. Does not include /docs, /wireframes, or /search.',
        parameters: [
          {
            name: 'section',
            in: 'query',
            required: false,
            description: 'Filter the list to one section.',
            schema: { type: 'string', enum: [...NAV_SECTIONS] },
          },
        ],
        responses: {
          '200': {
            description: 'Matching links.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Navigation' },
              },
            },
          },
          '400': { $ref: '#/components/responses/InvalidSection' },
          '405': { $ref: '#/components/responses/MethodNotAllowed' },
        },
      },
    },
    '/api/v1/health': {
      get: {
        operationId: 'getHealth',
        summary: 'Health check',
        description: 'Returns status ok when the API document is being served.',
        responses: {
          '200': {
            description: 'The service is serving this document.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Health' },
              },
            },
          },
          '405': { $ref: '#/components/responses/MethodNotAllowed' },
        },
      },
    },
  },
  components: {
    schemas: {
      Organization: {
        type: 'object',
        required: ['name', 'url', 'email', 'description', 'address'],
        properties: {
          name: { type: 'string' },
          url: { type: 'string', format: 'uri' },
          email: { type: 'string', format: 'email' },
          description: { type: 'string' },
          address: { $ref: '#/components/schemas/PostalAddress' },
        },
      },
      PostalAddress: {
        type: 'object',
        required: ['addressLocality', 'addressRegion', 'addressCountry'],
        properties: {
          addressLocality: { type: 'string' },
          addressRegion: { type: 'string' },
          addressCountry: { type: 'string' },
        },
      },
      NavLink: {
        type: 'object',
        required: ['section', 'title', 'url', 'description'],
        properties: {
          section: { type: 'string', enum: [...NAV_SECTIONS] },
          title: { type: 'string' },
          url: { type: 'string', format: 'uri' },
          description: { type: 'string' },
        },
      },
      Navigation: {
        type: 'object',
        required: ['links'],
        properties: {
          links: { type: 'array', items: { $ref: '#/components/schemas/NavLink' } },
        },
      },
      Health: {
        type: 'object',
        required: ['status', 'service'],
        properties: {
          status: { type: 'string', const: 'ok' },
          service: { type: 'string' },
        },
      },
      Error: {
        type: 'object',
        required: ['error'],
        properties: {
          error: {
            type: 'object',
            required: ['code', 'message', 'hint'],
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              hint: { type: 'string' },
            },
          },
        },
      },
    },
    responses: {
      MethodNotAllowed: {
        description: 'This API is read-only. Use GET.',
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/Error' } },
        },
      },
      InvalidSection: {
        description: 'The section query is not one of the published values.',
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/Error' } },
        },
      },
    },
  },
}

export function openapiJson(): string {
  return `${JSON.stringify(openapiDocument, null, 2)}\n`
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

export function classifyAgentRequest(input: {
  method: string
  pathname: string
  accept: string | null | undefined
}): AgentDecision {
  if (input.method !== 'GET' && input.method !== 'HEAD') return { action: 'delegate' }
  if (isStaticAsset(input.pathname)) return { action: 'delegate' }
  const path = normalizePath(input.pathname)
  if (path === MCP_PATH || path === '/api' || path.startsWith('/api/')) return { action: 'delegate' }
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
