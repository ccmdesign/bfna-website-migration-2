---
title: BFNA Agent Readiness - Plan
type: feat
date: 2026-10-04
artifact_contract: ce-unified-plan/v1
product_contract_source: shared-task
execution: code
---

# BFNA Agent Readiness - Plan

## Goal Capsule

**Objective:** Make the public BFNA site accurately discoverable and useful to search engines and AI agents without changing ordinary browser rendering, leaking preview deployments into indexes, or adding new typecheck failures.

**Means:** Generate first-party Markdown and discovery artifacts from the committed content snapshot, negotiate Markdown at Netlify's edge, add complete SEO/structured data, and publish a real privacy route with verified contact facts (KTD1–KTD8).

**Authority hierarchy:** `../shared-task.md` and its linked `../final-prompt.md` and `../known-pitfalls.md` are the product contract. This plan is the implementation authority. Existing repository conventions win for details not settled by either. Owner TODOs below are deferred factual/legal review, not permission to weaken the testable requirements.

**Stop conditions:** Stop and ask the owner if Netlify's UI build base is no longer `bfna-website-nuxt`, if the deployed publish directory is not `.output/public`, if the production domain is no longer `https://www.bfna.org`, or if counsel supplies privacy facts that conflict with the proposed copy. Do not edit `.github/typecheck-baseline.txt` or use `node .github/typecheck-gate.mjs --write`.

**Execution profile:** Implement in the dependency order below. Keep the generated artifacts out of git. This plan does not authorize a push or PR.

## Product Contract

### Summary

The BFNA Nuxt static site will expose canonical metadata, Organization/WebSite/Article JSON-LD, readable Markdown twins for every public content route, `sitemap.xml`, `llms.txt`, a generated crawler policy, content-negotiated Markdown responses, preview noindex headers, a standalone useful 404, and a substantive privacy page. Legacy privacy and contact URLs will resolve in one redirect hop.

### Problem Frame

The current site has only page titles, a minimal static `robots.txt`, no sitemap or agent guidance, no machine-readable entity/article data, no Markdown representation, and no real privacy route. The footer privacy link is a dead `#`, the About contact address is placeholder text, and the preview `/contact` and `/privacy` paths currently return 404. Netlify preview deploys also have no repository-controlled noindex policy.

### Requirements

#### Public discovery and representations

- R1. Every real public BFNA route has a stable production canonical URL plus description, Open Graph, and Twitter metadata; utility routes remain excluded from discovery.
- R2. The homepage emits truthful Organization and WebSite JSON-LD, and each insight detail page emits truthful Article JSON-LD using only available content fields.
- R3. Each public content route has a readable build-generated Markdown twin, while `/search`, `/docs/**`, and `/wireframes/**` have none.
- R4. A request explicitly accepting `text/markdown` with quality greater than zero receives the twin with `Content-Type: text/markdown; charset=utf-8`; ordinary HTML requests are unchanged.
- R5. Markdown and HTML variants append `Accept` to `Vary` without discarding existing values, and missing Markdown twins return a useful Markdown 404 with HTTP 404.
- R6. `sitemap.xml`, `llms.txt`, and `robots.txt` are generated from the same public-route inventory; sitemap `lastmod` comes only from valid content publish dates.
- R7. Direct unknown HTML paths retain HTTP 404 and render a useful standalone page with navigation and discovery links.

#### Deployment safety

- R8. Netlify preview and branch deploys send `X-Robots-Tag: noindex, nofollow`; production does not receive that header.
- R9. The Edge Function is registered once, does not recursively fetch itself, excludes twins/assets/utility paths, and preserves the existing Netlify UI build base of `bfna-website-nuxt`.
- R10. Generated deploy artifacts are never committed.

#### Privacy and legacy compatibility

- R11. `/privacy` is a prerendered, substantive, navigable policy page based on currently verifiable site behavior and the production BFNA policy, with uncertain legal/operational facts marked for owner review in source comments rather than shown as guesses.
- R12. The footer links to `/privacy`, the visible About contact block uses BFNA's verified Washington, DC address, `/privacy-policy` redirects directly to `/privacy`, and `/contact` redirects directly to `/about#contact`.

#### Quality gates

- R13. The implementation introduces zero new typecheck diagnostic signatures relative to `.github/typecheck-baseline.txt` and passes the existing build, route, link, and redirect checks.
- R14. Automated tests cover negotiation, exclusions, output generation, structured data, malformed dates, preview headers, and 404 behavior using repository-correct import paths.

### Acceptance Examples

- AE1 (R4, R5). `Accept: text/html, text/markdown;q=0` returns the ordinary HTML response; `Accept: text/markdown;q=0.7, text/html` returns Markdown; `*/*` alone does not opt into Markdown.
- AE2 (R5). An origin response with `Vary: Accept-Encoding` becomes `Vary: Accept-Encoding, Accept`; an existing `accept` token is not duplicated.
- AE3 (R3, R6). `/insights/example` produces `/insights/example.md` with headings and paragraph breaks, while `/search.md`, `/docs/*.md`, and `/wireframes/*.md` do not exist or appear in discovery files.
- AE4 (R6). A content date of `2025-02-24` becomes sitemap `lastmod`; `null`, `2025-02-30`, free text, or a timestamp is omitted rather than guessed or replaced with file mtime.
- AE5 (R8). `CONTEXT=deploy-preview npx nuxt generate` creates `_headers`; `CONTEXT=production` and an unset `CONTEXT` do not.
- AE6 (R11, R12). `/privacy` builds and contains meaningful policy text; `/privacy-policy` reaches it in one 301; `/contact` reaches `/about#contact` in one 301.

### Scope Boundaries

In scope are public BFNA routes backed by `content/bf/**`, site-wide SEO, Netlify static deployment behavior, legacy redirects, privacy content, and tests/gates. `/docs/**`, `/wireframes/**`, and `/search` remain functional but are excluded from Markdown, sitemap, and agent discovery. Existing frozen wireframe rendering must not change.

The API/docs portion of the source specification is not applicable: this repository exposes no public BFNA API or agent-callable service. `server/api/component-docs/**` supports the internal design-system viewer, so OpenAPI, API error schemas, MCP/tool adapters, and agent API onboarding are not to be added.

No analytics product, consent manager, form backend, CMS model, or legal retention system is introduced. The existing About form is non-submitting; do not imply otherwise in public copy.

## Planning Contract

### Repository Baseline

- Nuxt 4.2.0 is configured in `bfna-website-nuxt/src/nuxt.config.ts`; SSR and static generation are already active. Explicit prerender routes come from `content/bf/{programs,insights,projects}` plus top-level routes and frozen wireframes.
- The content snapshot currently contains 7 pages, 3 programs, 371 insights, 38 projects, 13 people, and 1 announcement. Insight/page records can carry `publish_date`; the project and program schemas do not.
- `bfna-website-nuxt/src/layouts/bf-default.vue` owns the public-site head defaults and stylesheet. Public pages currently set only a title.
- `bfna-website-nuxt/server/utils/legacy-redirect-rules.ts` is the redirect source of truth. `npm run redirects:generate` writes tracked `bfna-website-nuxt/public/_redirects` and the generated slug map.
- There is no current `netlify.toml`. The authoritative task states Netlify's UI base is `bfna-website-nuxt`; preserve the UI command and publish settings by not restating them.
- CI runs `npx nuxt generate`, not `npm run generate`, then route and link checks. The current typecheck gate passes with exactly 90 pre-existing diagnostics across 28 signatures.
- Production's policy is `https://www.bfna.org/privacy-policy/`. The verified contact address is Bertelsmann Foundation North America, 1108 16th St, NW, Washington, DC 20036; the official office listing also gives `+1-202-384-1980`.

### Key Technical Decisions

- KTD1. Use one typed route inventory for prerendering and artifact generation, derived synchronously from committed content filenames. This prevents sitemap/twin drift from the deployed route set.
- KTD2. Generate deploy-only artifacts from Nitro's `prerender:done` hook into `.output/public`; do not write generated twins or discovery files into `src/public` or tracked `public`.
- KTD3. Serve prebuilt twins with `context.next(new Request(markdownUrl, request))`, never same-site `fetch()`. The request targets an excluded `.md` path, so it does not restart the Edge Function chain.
- KTD4. Register the Edge Function exactly once in root `netlify.toml`; do not also export inline `config`.
- KTD5. Put global SEO defaults in a composable invoked by `bf-default`, and page-specific values in the public page components. Pure URL/schema builders remain framework-independent and directly unit-testable.
- KTD6. Overwrite the generated empty Nuxt `404.html` after prerender with a static semantic fallback. Do not modify `src/error.vue`, avoiding overlap with the separate insights/404-title work noted in PR #295.
- KTD7. Model privacy as `content/bf/pages/privacy.json` and render it with the normal BF page components so the HTML page and generated Markdown share one source.
- KTD8. Generate `_headers` only when Netlify defines a non-production `CONTEXT`; an unset context is local development, not implicitly a preview.

### High-Level Technical Design

```text
content/bf/** ──> route/content inventory ──> Nuxt prerender routes
                         │
                         └─ prerender:done ─> .output/public
                                              ├─ **/*.md
                                              ├─ sitemap.xml
                                              ├─ llms.txt
                                              ├─ robots.txt
                                              ├─ 404.html
                                              └─ _headers (Netlify nonprod only)

browser request ──> Edge Function ── HTML Accept ──> context.next() ──> HTML
                              └─ Markdown Accept ──> context.next(rewritten .md request)
                                                         ├─ twin found ─> Markdown
                                                         └─ missing ────> Markdown 404
```

This is a responsibility map, not a substitute for the exact implementation contracts below.

### Output Structure

```text
netlify.toml
bfna-website-nuxt/
├── content/bf/pages/privacy.json
├── netlify/edge-functions/markdown.ts
├── scripts/
│   ├── generate-agent-artifacts.ts
│   ├── verify-agent-artifacts.ts
│   └── lib/agent-routes.ts
├── src/
│   ├── composables/useBfSeo.ts
│   ├── pages/privacy.vue
│   ├── utils/{site-url,structured-data}.ts
│   └── tests/
│       ├── agent/{agent-artifacts,markdown-edge}.spec.ts
│       └── utils/seo.spec.ts
└── .output/public/                 # generated, ignored, never committed
    ├── **/*.md
    ├── sitemap.xml
    ├── llms.txt
    ├── robots.txt
    ├── 404.html
    └── _headers                    # non-production Netlify contexts only
```

### Exact Risky Implementations

The following blocks are implementation specifications, not sketches. The implementer may make formatting-only adjustments, but must preserve their signatures and behavioral contracts.

#### Netlify Edge Function

Create `bfna-website-nuxt/netlify/edge-functions/markdown.ts`:

```ts
import type { Context } from '@netlify/edge-functions'

const MARKDOWN_TYPE = 'text/markdown'

export const acceptsMarkdown = (accept: string | null): boolean => {
  if (!accept) return false

  return accept.split(',').some((range) => {
    const [rawType, ...rawParameters] = range.split(';')
    if (rawType?.trim().toLowerCase() !== MARKDOWN_TYPE) return false

    let quality = 1
    for (const parameter of rawParameters) {
      const [rawName, rawValue] = parameter.split('=', 2)
      if (rawName?.trim().toLowerCase() !== 'q') continue
      const parsed = Number(rawValue?.trim())
      quality = Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : 0
    }

    return quality > 0
  })
}

export const appendVary = (headers: Headers, token: string): void => {
  const values = (headers.get('vary') ?? '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean)

  if (!values.some(value => value.toLowerCase() === token.toLowerCase())) {
    values.push(token)
  }

  headers.set('vary', values.join(', '))
}

export const markdownPathFor = (pathname: string): string => {
  if (pathname === '/') return '/index.md'
  return `${pathname.replace(/\/+$/, '')}.md`
}

const markdownNotFound = (pathname: string): Response => {
  const headers = new Headers({ 'content-type': `${MARKDOWN_TYPE}; charset=utf-8` })
  appendVary(headers, 'Accept')

  return new Response(
    `# Page not found\n\nNo Markdown representation exists for \`${pathname}\`.\n\n- [BFNA home](/)\n- [Sitemap](/sitemap.xml)\n- [AI guidance](/llms.txt)\n`,
    { status: 404, headers },
  )
}

export default async function markdown(
  request: Request,
  context: Context,
): Promise<Response> {
  const wantsMarkdown = acceptsMarkdown(request.headers.get('accept'))

  if (!wantsMarkdown) {
    const response = await context.next()
    const headers = new Headers(response.headers)
    appendVary(headers, 'Accept')
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
  }

  const requestedUrl = new URL(request.url)
  const markdownUrl = new URL(markdownPathFor(requestedUrl.pathname), requestedUrl)
  markdownUrl.search = ''

  // context.next avoids a new Edge Function request chain. The target also
  // matches netlify.toml's /*.md excludedPath as a second recursion guard.
  const response = await context.next(new Request(markdownUrl, request))
  if (response.status === 404) return markdownNotFound(requestedUrl.pathname)

  const headers = new Headers(response.headers)
  headers.set('content-type', `${MARKDOWN_TYPE}; charset=utf-8`)
  appendVary(headers, 'Accept')
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}
```

Do not use `fetch(markdownUrl)`, do not return `new URL(...)`, and do not add an inline `export const config`. The first two start a new request chain; the last would create a second registration surface.

Create root `netlify.toml` exactly as follows. Omitting `command` and `publish` is intentional: those remain owned by the existing Netlify UI settings, while `base` preserves the known monorepo base.

```toml
[build]
  base = "bfna-website-nuxt"

[[edge_functions]]
  function = "markdown"
  path = "/*"
  excludedPath = [
    "/*.md",
    "/*.xml",
    "/*.txt",
    "/*.ico",
    "/*.png",
    "/*.jpg",
    "/*.jpeg",
    "/*.gif",
    "/*.svg",
    "/*.webp",
    "/*.avif",
    "/*.pdf",
    "/_nuxt/*",
    "/_ipx/*",
    "/.netlify/*",
    "/images/*",
    "/css/*",
    "/css-legacy/*",
    "/favicon/*",
    "/files/*",
    "/component-docs/*",
    "/docs",
    "/docs/*",
    "/wireframes",
    "/wireframes/*",
    "/search",
    "/search/*"
  ]
```

#### Route inventory and build-time artifacts

Create `bfna-website-nuxt/scripts/lib/agent-routes.ts`. It is the only public-route inventory and replaces the local `collectionSlugs`/`prerenderRoutes` declarations in `src/nuxt.config.ts`:

```ts
import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'

export const SITE_ORIGIN = 'https://www.bfna.org'
export const EXCLUDED_DISCOVERY_PREFIXES = ['/docs', '/wireframes', '/search'] as const

const collectionSlugs = (projectRoot: string, collection: string): string[] => {
  try {
    return readdirSync(resolve(projectRoot, 'content/bf', collection), { withFileTypes: true })
      .filter(entry => entry.isFile() && entry.name.endsWith('.json'))
      .map(entry => entry.name.replace(/\.json$/, ''))
      .sort()
  } catch {
    return []
  }
}

export const publicContentRoutes = (projectRoot: string): string[] => [
  '/',
  '/about',
  '/archive',
  '/insights',
  '/projects',
  '/privacy',
  ...collectionSlugs(projectRoot, 'programs').map(slug => `/${slug}`),
  ...collectionSlugs(projectRoot, 'insights').map(slug => `/insights/${slug}`),
  ...collectionSlugs(projectRoot, 'projects').map(slug => `/projects/${slug}`),
]

export const prerenderRoutes = (projectRoot: string): string[] => [
  ...publicContentRoutes(projectRoot),
  '/search',
  '/wireframes',
  '/wireframes/about',
  '/wireframes/archive',
  '/wireframes/insights',
  '/wireframes/projects',
  '/wireframes/search',
]

export const isDiscoverableRoute = (route: string): boolean =>
  !EXCLUDED_DISCOVERY_PREFIXES.some(prefix => route === prefix || route.startsWith(`${prefix}/`))

export const markdownOutputPath = (route: string): string =>
  route === '/' ? 'index.md' : `${route.replace(/^\//, '').replace(/\/$/, '')}.md`
```

Create `bfna-website-nuxt/scripts/generate-agent-artifacts.ts`. Keep the IO wrapper and pure render helpers exported so tests do not need to spawn a full build:

```ts
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  SITE_ORIGIN,
  isDiscoverableRoute,
  markdownOutputPath,
  publicContentRoutes,
} from './lib/agent-routes'
import { validPublishDate } from '../src/utils/publish-date'

export { validPublishDate } from '../src/utils/publish-date'

type JsonRecord = Record<string, unknown>

export interface AgentDocument {
  route: string
  title: string
  description: string
  body: string
  publishDate?: string
}

const text = (value: unknown): string => typeof value === 'string' ? value.trim() : ''

const decodeEntities = (value: string): string => value
  .replaceAll('&amp;', '&')
  .replaceAll('&lt;', '<')
  .replaceAll('&gt;', '>')
  .replaceAll('&quot;', '"')
  .replaceAll('&#39;', "'")
  .replaceAll('&nbsp;', ' ')

export const readableMarkdown = (value: unknown): string => {
  const source = text(value).replaceAll('\r\n', '\n')
  return decodeEntities(source)
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|section|article|h[1-6]|li|blockquote)>/gi, '\n\n')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<[^>]+>/g, '')
    .split('\n')
    .map(line => line.replace(/[ \t]+$/g, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

const readJson = async (path: string): Promise<JsonRecord> =>
  JSON.parse(await readFile(path, 'utf8')) as JsonRecord

const contentPathFor = (projectRoot: string, route: string): string | undefined => {
  if (route === '/') return resolve(projectRoot, 'content/bf/pages/home.json')
  if (['/about', '/archive', '/privacy'].includes(route)) {
    return resolve(projectRoot, `content/bf/pages/${route.slice(1)}.json`)
  }
  if (route === '/insights' || route === '/projects') return undefined
  if (route.startsWith('/insights/')) {
    return resolve(projectRoot, `content/bf/insights/${route.split('/').at(-1)}.json`)
  }
  if (route.startsWith('/projects/')) {
    return resolve(projectRoot, `content/bf/projects/${route.split('/').at(-1)}.json`)
  }
  return resolve(projectRoot, `content/bf/programs/${route.slice(1)}.json`)
}

const documentFromRecord = (route: string, record: JsonRecord): AgentDocument => {
  const title = text(record.heading) || text(record.title) || text(record.name) || 'Bertelsmann Foundation North America'
  const description = text(record.excerpt) || text(record.subheading) || text(record.intro)
  const body = readableMarkdown(record.content) || readableMarkdown(record.description) || readableMarkdown(record.intro) || description
  return { route, title, description, body, publishDate: validPublishDate(record.publish_date) }
}

export const loadAgentDocuments = async (projectRoot: string): Promise<AgentDocument[]> => {
  const routes = publicContentRoutes(projectRoot).filter(isDiscoverableRoute)
  const records = await Promise.all(routes.map(async (route): Promise<AgentDocument> => {
    const path = contentPathFor(projectRoot, route)
    if (path) return documentFromRecord(route, await readJson(path))

    const collection = route === '/insights' ? 'insights' : 'projects'
    const detailRoutes = routes.filter(candidate => candidate.startsWith(`/${collection}/`))
    const title = collection === 'insights' ? 'Insights' : 'Projects'
    const links = await Promise.all(detailRoutes.map(async (detailRoute) => {
      const detailPath = contentPathFor(projectRoot, detailRoute)!
      const detail = documentFromRecord(detailRoute, await readJson(detailPath))
      return `- [${detail.title}](${detailRoute})${detail.description ? ` — ${detail.description}` : ''}`
    }))
    return { route, title, description: `Explore BFNA ${title.toLowerCase()}.`, body: links.join('\n') }
  }))
  return records
}

export const renderMarkdownDocument = (document: AgentDocument): string => [
  `# ${document.title}`,
  document.description,
  document.body,
  `Source: ${SITE_ORIGIN}${document.route === '/' ? '/' : document.route}`,
].filter(Boolean).join('\n\n') + '\n'

const xmlEscape = (value: string): string => value
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&apos;')

export const renderSitemap = (documents: AgentDocument[]): string => [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...documents.map(document => [
    '  <url>',
    `    <loc>${xmlEscape(`${SITE_ORIGIN}${document.route === '/' ? '/' : document.route}`)}</loc>`,
    ...(document.publishDate ? [`    <lastmod>${document.publishDate}</lastmod>`] : []),
    '  </url>',
  ].join('\n')),
  '</urlset>',
  '',
].join('\n')

export const renderLlms = (documents: AgentDocument[]): string => {
  const programs = documents.filter(document => !['/', '/about', '/archive', '/privacy', '/insights', '/projects'].includes(document.route) && !document.route.startsWith('/insights/') && !document.route.startsWith('/projects/'))
  const latestInsights = documents
    .filter(document => document.route.startsWith('/insights/'))
    .sort((left, right) => (right.publishDate ?? '').localeCompare(left.publishDate ?? ''))
    .slice(0, 10)
  const projects = documents.filter(document => document.route.startsWith('/projects/')).slice(0, 10)
  const link = (document: AgentDocument): string =>
    `- [${document.title}](${document.route})${document.description ? ` — ${document.description}` : ''}`
  return [
    '# Bertelsmann Foundation North America',
    '',
    '> BFNA is a nonpartisan think tank in Washington, DC focused on transatlantic policy challenges.',
    '',
    '## When to use this site',
    '',
    'Use BFNA for its published analysis, projects, programs, and organizational information. Prefer each page\'s Markdown representation by sending `Accept: text/markdown`; cite the canonical HTML URL as the source.',
    '',
    '## Start here',
    '',
    '- [About](/about)',
    '- [Insights](/insights)',
    '- [Projects](/projects)',
    '- [Privacy](/privacy)',
    '',
    '## Programs',
    '',
    ...programs.map(link),
    '',
    '## Latest insights',
    '',
    ...latestInsights.map(link),
    '',
    '## Selected projects',
    '',
    ...projects.map(link),
    '',
    '## Discovery',
    '',
    '- [XML sitemap](/sitemap.xml)',
    '- [Crawler policy](/robots.txt)',
    '',
  ].join('\n')
}

const robotGroup = (agent: string): string[] => [
  `User-agent: ${agent}`,
  'Allow: /',
  'Disallow: /docs/',
  'Disallow: /wireframes/',
  'Disallow: /search',
  '',
]

export const renderRobots = (): string => [
  ...robotGroup('*'),
  ...robotGroup('GPTBot'),
  ...robotGroup('ChatGPT-User'),
  ...robotGroup('ClaudeBot'),
  ...robotGroup('PerplexityBot'),
  `Sitemap: ${SITE_ORIGIN}/sitemap.xml`,
  '',
].join('\n')

export const renderNotFoundHtml = (): string => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Page not found | Bertelsmann Foundation North America</title><link rel="stylesheet" href="/css/styles.css"></head>
<body><main id="main-content"><h1>Page not found</h1><p>The page you requested does not exist or may have moved. Continue with BFNA's current analysis, projects, and organization information.</p><nav aria-label="Recovery links"><ul><li><a href="/">BFNA home</a></li><li><a href="/insights">Insights</a></li><li><a href="/projects">Projects</a></li><li><a href="/sitemap.xml">Sitemap</a></li><li><a href="/llms.txt">AI guidance</a></li></ul></nav></main></body></html>
`

export const generateAgentArtifacts = async (
  projectRoot: string,
  outputRoot: string,
  context = process.env.CONTEXT,
): Promise<void> => {
  const documents = await loadAgentDocuments(projectRoot)

  await Promise.all(documents.map(async (document) => {
    const outputPath = resolve(outputRoot, markdownOutputPath(document.route))
    await mkdir(dirname(outputPath), { recursive: true })
    await writeFile(outputPath, renderMarkdownDocument(document), 'utf8')
  }))

  await Promise.all([
    writeFile(resolve(outputRoot, 'sitemap.xml'), renderSitemap(documents), 'utf8'),
    writeFile(resolve(outputRoot, 'llms.txt'), renderLlms(documents), 'utf8'),
    writeFile(resolve(outputRoot, 'robots.txt'), renderRobots(), 'utf8'),
    writeFile(resolve(outputRoot, '404.html'), renderNotFoundHtml(), 'utf8'),
  ])

  if (context && context !== 'production') {
    await writeFile(resolve(outputRoot, '_headers'), '/*\n  X-Robots-Tag: noindex, nofollow\n', 'utf8')
  } else {
    await rm(resolve(outputRoot, '_headers'), { force: true })
  }
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : ''
if (invokedPath === fileURLToPath(import.meta.url)) {
  const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  await generateAgentArtifacts(projectRoot, resolve(projectRoot, '.output/public'))
}
```

In `bfna-website-nuxt/src/nuxt.config.ts`, import `generateAgentArtifacts` and `prerenderRoutes`, remove the duplicated collection scanner/array, set `nitro.prerender.routes` from the shared function, keep crawling enabled explicitly, and hook generation only after successful prerender:

```ts
import { generateAgentArtifacts } from '../scripts/generate-agent-artifacts'
import { prerenderRoutes } from '../scripts/lib/agent-routes'

// inside defineNuxtConfig
nitro: {
  prerender: {
    crawlLinks: true,
    failOnError: false,
    routes: prerenderRoutes(projectRoot),
  },
  hooks: {
    'prerender:done': async () => {
      await generateAgentArtifacts(projectRoot, resolve(projectRoot, '.output/public'))
    },
  },
},
```

Do not use filesystem mtimes anywhere. A missing or invalid date means no `<lastmod>` and no Article `datePublished`.

#### Site URLs, SEO, and structured data

Add `runtimeConfig.public.siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://www.bfna.org'` in `src/nuxt.config.ts`.

Create the browser-safe shared validator `bfna-website-nuxt/src/utils/publish-date.ts`:

```ts
export const validPublishDate = (value: unknown): string | undefined => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined
  const [year, month, day] = value.split('-').map(Number)
  if (year === undefined || month === undefined || day === undefined) return undefined
  const parsed = new Date(Date.UTC(year, month - 1, day))
  if (
    parsed.getUTCFullYear() !== year
    || parsed.getUTCMonth() !== month - 1
    || parsed.getUTCDate() !== day
  ) return undefined
  return value
}
```

Create `bfna-website-nuxt/src/utils/site-url.ts`:

```ts
export const normalizeSiteOrigin = (value: string): string => value.replace(/\/+$/, '')

export const canonicalUrl = (origin: string, path: string): string => {
  const cleanPath = path === '/' ? '/' : `/${path.replace(/^\/+|\/+$/g, '')}`
  return new URL(cleanPath, `${normalizeSiteOrigin(origin)}/`).toString()
}

export const absoluteAssetUrl = (origin: string, value?: string): string => {
  if (!value) return canonicalUrl(origin, '/images/bfna-og.jpg')
  return new URL(value, `${normalizeSiteOrigin(origin)}/`).toString()
}
```

Create `bfna-website-nuxt/src/utils/structured-data.ts` with these exported builders. Omit optional properties instead of emitting empty strings or invented data:

```ts
import { absoluteAssetUrl, canonicalUrl } from './site-url'

export const BFNA_NAME = 'Bertelsmann Foundation North America'

export const organizationJsonLd = (origin: string) => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${canonicalUrl(origin, '/')}#organization`,
  name: BFNA_NAME,
  url: canonicalUrl(origin, '/'),
  description: 'The Bertelsmann Foundation North America is an independent, nonpartisan think tank dedicated to strengthening the transatlantic partnership and advancing dialogue on the global challenges shaping our future.',
  logo: absoluteAssetUrl(origin, '/images/bfna-og.jpg'),
  email: 'info@bfna.org',
  telephone: '+1-202-384-1980',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '1108 16th St, NW',
    addressLocality: 'Washington',
    addressRegion: 'DC',
    postalCode: '20036',
    addressCountry: 'US',
  },
  sameAs: [
    'https://www.linkedin.com/company/bertelsmann-foundation-north-america-inc.',
    'https://www.instagram.com/bertelsmannfoundation/',
    'https://www.facebook.com/BertelsmannFoundation/',
    'https://www.youtube.com/channel/UCZZdgI5F7KjUCW0fCKUOAAg',
    'https://vimeo.com/bfna',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'general inquiries',
    email: 'info@bfna.org',
    telephone: '+1-202-384-1980',
  },
})

export const websiteJsonLd = (origin: string) => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${canonicalUrl(origin, '/')}#website`,
  url: canonicalUrl(origin, '/'),
  name: BFNA_NAME,
  publisher: { '@id': `${canonicalUrl(origin, '/')}#organization` },
  inLanguage: 'en-US',
})

interface ArticleInput {
  path: string
  headline: string
  description: string
  image?: string
  publishDate?: string
  authors?: string[]
}

export const articleJsonLd = (origin: string, input: ArticleInput) => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: input.headline,
  description: input.description,
  image: absoluteAssetUrl(origin, input.image),
  ...(input.publishDate ? { datePublished: input.publishDate } : {}),
  ...(input.authors?.length ? { author: input.authors.map(name => ({ '@type': 'Person', name })) } : {}),
  publisher: { '@id': `${canonicalUrl(origin, '/')}#organization` },
  mainEntityOfPage: canonicalUrl(origin, input.path),
  inLanguage: 'en-US',
})
```

Create `bfna-website-nuxt/src/composables/useBfSeo.ts` with the following implementation. It uses `route.path` rather than `fullPath`, gives schema scripts stable keys, and escapes `<` inside serialized data so content cannot terminate the script element. It intentionally does not set `<title>` because existing page `useHead` calls and the layout `titleTemplate` own it.

```ts
import { computed, toValue } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import { absoluteAssetUrl, canonicalUrl } from '~/utils/site-url'
import { BFNA_NAME } from '~/utils/structured-data'

type Schema = Record<string, unknown>

interface SchemaEntry {
  key: string
  data: MaybeRefOrGetter<Schema | undefined>
}

interface BfSeoOptions {
  title: MaybeRefOrGetter<string>
  description: MaybeRefOrGetter<string>
  image?: MaybeRefOrGetter<string | undefined>
  type?: 'website' | 'article'
  robots?: MaybeRefOrGetter<string | undefined>
  schemas?: SchemaEntry[]
}

const serializeSchema = (value: Schema): string =>
  JSON.stringify(value).replace(/</g, '\\u003c')

export const useBfSeo = (options: BfSeoOptions): void => {
  const route = useRoute()
  const config = useRuntimeConfig()
  const origin = computed(() => String(config.public.siteUrl || 'https://www.bfna.org'))
  const canonical = computed(() => canonicalUrl(origin.value, route.path))
  const title = computed(() => toValue(options.title))
  const fullTitle = computed(() => title.value === BFNA_NAME ? BFNA_NAME : `${title.value} | ${BFNA_NAME}`)
  const description = computed(() => toValue(options.description))
  const image = computed(() => absoluteAssetUrl(origin.value, options.image ? toValue(options.image) : undefined))
  const robots = computed(() => options.robots ? toValue(options.robots) : undefined)

  useSeoMeta({
    description: () => description.value,
    robots: () => robots.value,
    ogTitle: () => fullTitle.value,
    ogDescription: () => description.value,
    ogType: options.type ?? 'website',
    ogUrl: () => canonical.value,
    ogImage: () => image.value,
    twitterCard: 'summary_large_image',
    twitterTitle: () => fullTitle.value,
    twitterDescription: () => description.value,
    twitterImage: () => image.value,
  })

  useHead(() => ({
    link: [{ key: 'canonical', rel: 'canonical', href: canonical.value }],
    script: (options.schemas ?? []).flatMap((entry) => {
      const data = toValue(entry.data)
      return data
        ? [{ key: entry.key, type: 'application/ld+json', innerHTML: serializeSchema(data) }]
        : []
    }),
  }))
}
```

In `src/layouts/bf-default.vue`, add these imports and call after the existing `useHead` block. Page calls made later in setup override matching meta tags. Default image is `/images/bfna-og.jpg` and default OG type is `website`.

```ts
import { useBfSeo } from '~/composables/useBfSeo'
import { BFNA_NAME } from '~/utils/structured-data'

useBfSeo({
  title: BFNA_NAME,
  description: 'The Bertelsmann Foundation North America is an independent, nonpartisan think tank dedicated to strengthening the transatlantic partnership and advancing dialogue on the global challenges shaping our future.',
})
```

In `src/pages/index.vue`, add the homepage schemas after `home` is resolved:

```ts
import { useBfSeo } from '~/composables/useBfSeo'
import { organizationJsonLd, websiteJsonLd, BFNA_NAME } from '~/utils/structured-data'

const runtimeConfig = useRuntimeConfig()
const siteOrigin = computed(() => String(runtimeConfig.public.siteUrl || 'https://www.bfna.org'))

useBfSeo({
  title: BFNA_NAME,
  description: () => home?.excerpt ?? home?.description ?? 'Bertelsmann Foundation North America',
  schemas: [
    { key: 'bfna-organization', data: computed(() => organizationJsonLd(siteOrigin.value)) },
    { key: 'bfna-website', data: computed(() => websiteJsonLd(siteOrigin.value)) },
  ],
})
```

In `src/pages/insights/[slug].vue`, add Article SEO after `insight` is resolved. This uses the actual `authors: string[]` field and omits an unparseable date:

```ts
import { useBfSeo } from '~/composables/useBfSeo'
import { articleJsonLd } from '~/utils/structured-data'
import { validPublishDate } from '~/utils/publish-date'

const runtimeConfig = useRuntimeConfig()
const siteOrigin = computed(() => String(runtimeConfig.public.siteUrl || 'https://www.bfna.org'))
const insightPath = computed(() => `/insights/${insight?.slug ?? String(route.params.slug)}`)
const articleSchema = computed(() => insight ? articleJsonLd(siteOrigin.value, {
  path: insightPath.value,
  headline: insight.heading,
  description: insight.excerpt ?? insight.content ?? insight.heading,
  image: insight.image ?? undefined,
  publishDate: validPublishDate(insight.publish_date),
  authors: insight.authors.length ? insight.authors : undefined,
}) : undefined)

useBfSeo({
  title: () => insight?.heading ?? 'Insight',
  description: () => insight?.excerpt ?? insight?.content ?? 'BFNA insight',
  image: () => insight?.image ?? undefined,
  type: 'article',
  schemas: [{ key: 'bfna-article', data: articleSchema }],
})
```

Invoke `useBfSeo` once in `src/layouts/bf-default.vue` with the site default description, then override it with real page content in these files:

- `src/pages/index.vue`: home description plus Organization and WebSite schema.
- `src/pages/about.vue`: About heading/intro.
- `src/pages/[program].vue`: program name/tagline/image.
- `src/pages/archive.vue`: archive description.
- `src/pages/insights/index.vue`: insights listing description.
- `src/pages/insights/[slug].vue`: heading/excerpt/image, `og:type=article`, and Article schema; validate `publish_date` with the shared strict date helper and pass author names only when present.
- `src/pages/projects/index.vue`: projects listing description.
- `src/pages/projects/[slug].vue`: project heading/description/image.
- `src/pages/privacy.vue`: privacy description.
- `src/pages/search.vue`: keep it outside discovery and add `robots=noindex,follow`; do not generate Article/site schema.

Every page component continues to rely on Nuxt's automatic layout. Do not add `<NuxtLayout>`; `definePageMeta({ layout: 'bf-default' })` is sufficient. `src/error.vue` is the intentional exception and must remain unchanged.

#### Privacy page and legacy routes

Create `bfna-website-nuxt/content/bf/pages/privacy.json` with the same 19-field page schema as the other page records. Put the substantive Markdown-lite policy body in `description`, use a concise summary in `excerpt`, and use a null `publish_date` until the owner supplies an effective date. The content must accurately cover: site operator/legal entity; the verified postal/email contact; information a visitor voluntarily supplies; basic hosting/security logs without asserting a retention duration; third-party embedded or linked services currently present (Google Fonts/Material Symbols, YouTube, Vimeo, LinkedIn, Instagram, Facebook); purposes and legal bases in plain language; sharing with service providers and as required by law; visitor choices/rights subject to applicable law; security limits; external links; policy changes; and contact. It must not claim that the non-submitting About form stores data or that unverified analytics/cookie products are active. JSON cannot carry comments, so record unresolved review notes only in the Owner TODOs section of this plan or a nearby TypeScript comment; never place TODO text in the rendered policy.

```json
{
  "slug": "privacy",
  "heading": "Privacy Policy",
  "subheading": "How Bertelsmann Foundation North America handles information on this website.",
  "excerpt": "This policy explains the limited information that may be processed when you visit bfna.org or contact Bertelsmann Foundation North America.",
  "description": "## Who we are\n\nThis website is operated by Bertelsmann Foundation (North America), Inc., also known as Bertelsmann Foundation North America (BFNA), an independent, nonpartisan think tank. You can contact us at info@bfna.org or at 1108 16th St, NW, Washington, DC 20036.\n\n## Information processed when you use this site\n\nWhen you visit the site, our hosting and security providers may process technical information needed to deliver and protect it, such as your IP address, browser and device information, requested pages, timestamps, and diagnostic or security logs.\n\nIf you contact BFNA by email or another channel, we process the information you choose to provide, such as your name, contact details, message, and any attachments, so that we can respond. The contact fields displayed on the About page do not currently submit information through this website.\n\n## How and why we use information\n\nWe use information as needed to operate, secure, diagnose, and improve the website; respond to inquiries; maintain records of our communications; comply with legal obligations; and protect BFNA, our visitors, and others. Depending on the circumstances and applicable law, this processing may be based on our legitimate interests, steps requested before entering an agreement, consent, or a legal obligation.\n\n## Services, embeds, and external links\n\nThe site loads Google-hosted fonts or icons and may link to or embed content from services such as YouTube and Vimeo. BFNA also links to its pages on LinkedIn, Instagram, Facebook, YouTube, and Vimeo. Those providers may receive technical information when their resources load or when you follow a link, and their own privacy policies govern their processing. External sites are not controlled by BFNA.\n\n## Sharing and retention\n\nWe may share information with vendors that host, secure, maintain, or otherwise support the website and our communications, subject to appropriate contractual obligations. We may also disclose information when required by law or when reasonably necessary to protect rights, safety, and security. We keep information only as long as reasonably necessary for the purposes described here and to meet legal, accounting, or reporting obligations.\n\n## Your choices and rights\n\nDepending on where you live and the law that applies, you may have rights to ask for access to, correction of, deletion of, restriction of, or an objection to certain processing of your personal information, and to withdraw consent where consent is the basis for processing. You may also have the right to complain to a relevant data-protection authority. To make a request, email info@bfna.org. We may need to verify your identity and may retain information where the law permits or requires it.\n\n## Security\n\nBFNA uses reasonable administrative and technical measures intended to protect information. No website or transmission method is completely secure, so we cannot guarantee absolute security.\n\n## Changes to this policy\n\nWe may update this policy as the site or our practices change. The current version will be posted on this page.\n\n## Contact\n\nQuestions or privacy requests may be sent to info@bfna.org or Bertelsmann Foundation North America, 1108 16th St, NW, Washington, DC 20036.",
  "authors": [],
  "image": null,
  "video_url": null,
  "download": null,
  "external_url": null,
  "publish_date": null,
  "bucket": "page",
  "format": null,
  "kind": null,
  "program": null,
  "archived": false,
  "evergreen": true,
  "copy_source": "bfna.org/privacy-policy reviewed 2026-10-04; owner and counsel review required",
  "legacy": null
}
```

Create `bfna-website-nuxt/src/pages/privacy.vue`:

```vue
<script setup lang="ts">
import { useBfPages } from '~/composables/data/useBfPages'

/*
 * TODO(owner): Have counsel approve this policy and supply its effective date.
 * TODO(owner): Confirm processors, log retention, transfer language, and
 * whether Netlify Analytics, Netlify Forms, or consent tooling is enabled.
 * These review notes must remain source-only and must not render as policy text.
 */

definePageMeta({ layout: 'bf-default' })

const { pageBySlug } = await useBfPages()
const page = pageBySlug('privacy')

if (!page) {
  throw createError({ statusCode: 404, statusMessage: 'Privacy policy not found' })
}

useHead({ title: page.heading })
useBfSeo({
  title: page.heading,
  description: page.subheading || 'How Bertelsmann Foundation North America handles information on this website.',
})
</script>

<template>
  <bfPageHeader
    label="Privacy"
    :crumbs="[{ label: 'Home', to: '/' }, { label: 'Privacy' }]"
    :heading="page.heading"
    :tagline="page.subheading"
  />
  <bfSection measure="narrow">
    <div class="stack" data-gap="m">
      <bfProse :content="page.description" />
      <p>Questions about this policy may be sent to <a href="mailto:info@bfna.org">info@bfna.org</a>.</p>
    </div>
  </bfSection>
</template>
```

The component prop names above match the repository's current `bfPageHeader`, `bfSection`, and `bfProse` contracts. Do not introduce a second Markdown renderer. Update the page-count comments in both `src/composables/data/useBfPages.ts` and `src/types/bf-contracts.ts` from seven to eight.

Modify `src/components/bf/Footer.vue` so Privacy is `<NuxtLink to="/privacy">Privacy</NuxtLink>`. Keep Terms as its existing placeholder unless a real policy is supplied; do not invent a Terms page. Modify `src/components/bf/ContactSection.vue` to replace `[street address — Directus contact singleton]` with `1108 16th St, NW, Washington, DC 20036` and retain `info@bfna.org`.

Add to `LEGACY_REDIRECT_EXACT` in `src/server/utils/legacy-redirect-rules.ts`:

```ts
'/contact': '/about#contact',
'/privacy-policy': '/privacy',
```

Run `npm run redirects:generate`. Commit the resulting `public/_redirects` change. `src/server/utils/legacy-slug-map.ts` is regenerated by the command but should have no semantic diff for these exact rules; do not stage it if unchanged.

#### Gitignore and non-production headers

Delete `bfna-website-nuxt/src/public/robots.txt`; it is superseded by the generated deploy artifact. Append these explicit defense-in-depth entries to `bfna-website-nuxt/.gitignore` even though `/.output` is already ignored:

```gitignore
# Agent-readiness artifacts are generated into .output/public.
/.output/public/**/*.md
/.output/public/sitemap.xml
/.output/public/llms.txt
/.output/public/robots.txt
/.output/public/_headers
```

The generator code above is the complete `_headers` implementation. Do not put `[context.deploy-preview.headers]` or equivalent header blocks in `netlify.toml`; Netlify does not support that shape. Do not commit `_headers`.

### Type Safety Contract

The implementer must finish with no new typecheck signatures. The current gate passes with 90 existing diagnostics across 28 signatures; a lower count is acceptable, a new signature is not.

- Add `@netlify/edge-functions` and `@types/node` to `devDependencies` with `npm install -D`, committing `package.json` and `package-lock.json`. Do not hand-edit the lockfile.
- Do not add `netlify/**/*.ts` to `tsconfig.scripts.json`: that project intentionally has no DOM library. `src/tests/agent/markdown-edge.spec.ts` imports the Edge Function directly, so Nuxt's app typecheck follows and checks it with the Fetch/DOM globals available.
- Use `import type { Context }` so no Netlify package is pulled into the Deno runtime bundle merely for a type.
- Keep generator records as `Record<string, unknown>` and narrow every external field before use. Do not spread untyped JSON into schema objects.
- Do not use non-null assertions except where the preceding route branch proves a path exists; prefer explicit guards.
- Use `innerHTML` for Unhead JSON-LD script entries, not `children`.
- Do not add new Node imports to Nuxt page/component code. Node-only helpers stay under `scripts/**`; browser-safe date/SEO helpers stay under `src/utils/**`.
- When sharing strict date validation with client code, extract a browser-safe `src/utils/publish-date.ts` and import it from both callers rather than importing the Node generator into a Vue page.
- Keep `useRuntimeConfig().public.siteUrl` narrowed/coerced to `string`; Nuxt runtime config inference must not leak `unknown` into `URL`.
- Tests import source using the paths below. A wrong `../../scripts` path would create new `TS2307` diagnostics and silently miss the code under test.
- Never update `.github/typecheck-baseline.txt` for this work.

## Implementation Units

### U1. Establish the shared public-route and artifact pipeline

**Requirements:** R3, R6, R7, R8, R10, R13.

**Files:**

- Create `bfna-website-nuxt/scripts/lib/agent-routes.ts`.
- Create `bfna-website-nuxt/scripts/generate-agent-artifacts.ts`.
- Create `bfna-website-nuxt/scripts/verify-agent-artifacts.ts`.
- Modify `bfna-website-nuxt/src/nuxt.config.ts`.
- Modify `bfna-website-nuxt/package.json`.
- Modify `bfna-website-nuxt/package-lock.json`.
- Modify `bfna-website-nuxt/.gitignore`.
- Delete `bfna-website-nuxt/src/public/robots.txt`.

**Approach:** Implement KTD1, KTD2, KTD6, and KTD8 with the exact code above. `verify-agent-artifacts.ts` should inspect `.output/public` after generation and fail with precise messages if any expected twin is missing, an excluded twin exists, discovery files are too small or contain excluded URLs, required robot directives are absent, Markdown has collapsed paragraph boundaries, the static 404 lacks its required links/text, or `_headers` disagrees with `CONTEXT`. Add `check:agent-artifacts` to `package.json` and run it in CI immediately after `npx nuxt generate`.

**Test scenarios:** Valid and invalid dates; root and nested twin paths; paragraph/heading preservation; all public routes represented exactly once; exclusions absent; sitemap escaped and no mtime fallback; `llms.txt` contains usage guidance and only real links; production/unset context omits `_headers`; preview context creates it; static 404 contains semantic recovery content.

### U2. Add and register Markdown negotiation

**Requirements:** R4, R5, R9, R13, R14.

**Files:**

- Create `bfna-website-nuxt/netlify/edge-functions/markdown.ts`.
- Create `netlify.toml`.
- Modify `bfna-website-nuxt/package.json` and `bfna-website-nuxt/package-lock.json` as part of U1.

**Approach:** Implement KTD3 and KTD4 with the exact Edge Function and TOML above. Keep the full path exclusions and the `/*.md` recursion guard. Preserve status, status text, body stream, and all origin headers except the intentional content type/Vary changes.

**Test scenarios:** No Accept; browser `*/*`; `text/markdown` in mixed case; default q; q=0; decimal positive q; invalid/out-of-range q; multiple ranges; existing Vary absent/present/mixed-case; root and trailing-slash rewrites; query removed from static twin lookup; successful twin; missing twin Markdown 404; non-404 error status preserved; `context.next` receives a rewritten Request and global `fetch` is never called.

### U3. Add canonical SEO and structured data

**Requirements:** R1, R2, R13, R14.

**Files:**

- Create `bfna-website-nuxt/src/utils/site-url.ts`.
- Create `bfna-website-nuxt/src/utils/structured-data.ts`.
- Create `bfna-website-nuxt/src/utils/publish-date.ts`.
- Create `bfna-website-nuxt/src/composables/useBfSeo.ts`.
- Modify `bfna-website-nuxt/src/layouts/bf-default.vue`.
- Modify `bfna-website-nuxt/src/pages/index.vue`.
- Modify `bfna-website-nuxt/src/pages/about.vue`.
- Modify `bfna-website-nuxt/src/pages/[program].vue`.
- Modify `bfna-website-nuxt/src/pages/archive.vue`.
- Modify `bfna-website-nuxt/src/pages/search.vue`.
- Modify `bfna-website-nuxt/src/pages/insights/index.vue`.
- Modify `bfna-website-nuxt/src/pages/insights/[slug].vue`.
- Modify `bfna-website-nuxt/src/pages/projects/index.vue`.
- Modify `bfna-website-nuxt/src/pages/projects/[slug].vue`.
- Modify `bfna-website-nuxt/src/nuxt.config.ts`.

**Approach:** Implement KTD5 and the exact builders above. Use `route.path`, never `route.fullPath`, for canonical URLs. Ensure the existing title template remains the only title suffix owner. Exclude the footer's placeholder Bluesky URL from `sameAs`.

**Test scenarios:** Root/nested/trailing-slash canonical URLs; absolute and relative image URLs; Organization exact name/address/email/phone/logo/social profiles; Website publisher reference; Article with and without valid date/authors/image; query strings absent from canonical; search noindex; JSON-LD script keys do not duplicate across layout/page calls.

### U4. Publish privacy and repair public contact paths

**Requirements:** R11, R12, R13.

**Files:**

- Create `bfna-website-nuxt/content/bf/pages/privacy.json`.
- Create `bfna-website-nuxt/src/pages/privacy.vue`.
- Modify `bfna-website-nuxt/src/composables/data/useBfPages.ts`.
- Modify `bfna-website-nuxt/src/types/bf-contracts.ts` (page-count comment only).
- Modify `bfna-website-nuxt/src/components/bf/Footer.vue`.
- Modify `bfna-website-nuxt/src/components/bf/ContactSection.vue`.
- Modify `bfna-website-nuxt/src/server/utils/legacy-redirect-rules.ts`.
- Modify generated `bfna-website-nuxt/public/_redirects`.

**Approach:** Implement KTD7. Base policy wording on verified behavior and production policy categories, while leaving uncertain dates/processors/retention to owner TODOs. Generate redirects from the source table; never hand-edit only `_redirects`.

**Test scenarios:** Privacy page content record passes schema and prerenders; footer link is routable; mail link is usable; verified address renders with no placeholder; both redirects are 301 and one hop; targets exist in `.output/public`; no existing redirect rule regresses.

### U5. Add focused tests and CI verification

**Requirements:** R13, R14.

**Files:**

- Create `bfna-website-nuxt/src/tests/agent/markdown-edge.spec.ts`.
- Create `bfna-website-nuxt/src/tests/agent/agent-artifacts.spec.ts`.
- Create `bfna-website-nuxt/src/tests/utils/seo.spec.ts`.
- Modify `.github/workflows/verify.yml`.
- Modify `bfna-website-nuxt/package.json` to add `test:agent` and `check:agent-artifacts` scripts.

**Approach:** Use Vitest and existing test configuration. The exact source imports from `src/tests/agent/*.spec.ts` are:

```ts
import markdown, { acceptsMarkdown, appendVary, markdownPathFor } from '../../../netlify/edge-functions/markdown'
import { generateAgentArtifacts, readableMarkdown, renderLlms, renderRobots, renderSitemap, validPublishDate } from '../../../scripts/generate-agent-artifacts'
import { isDiscoverableRoute, markdownOutputPath } from '../../../scripts/lib/agent-routes'
```

The exact imports from `src/tests/utils/seo.spec.ts` are:

```ts
import { absoluteAssetUrl, canonicalUrl, normalizeSiteOrigin } from '../../utils/site-url'
import { articleJsonLd, organizationJsonLd, websiteJsonLd } from '../../utils/structured-data'
```

Implement `bfna-website-nuxt/src/tests/agent/markdown-edge.spec.ts` as follows (additional cases may be table-driven, but none of these assertions may be removed):

```ts
import { afterEach, describe, expect, it, vi } from 'vitest'
import markdown, { acceptsMarkdown, appendVary, markdownPathFor } from '../../../netlify/edge-functions/markdown'

type EdgeContext = Parameters<typeof markdown>[1]

const contextWith = (next: (request?: Request) => Promise<Response>): EdgeContext =>
  ({ next } as unknown as EdgeContext)

afterEach(() => vi.restoreAllMocks())

describe('Markdown Accept negotiation', () => {
  it.each([
    [null, false],
    ['*/*', false],
    ['text/markdown', true],
    ['TEXT/MARKDOWN; Q=0.5', true],
    ['text/html, text/markdown;q=0', false],
    ['text/markdown;q=bogus, text/html', false],
    ['text/markdown;q=1.1', false],
  ])('parses %s', (accept, expected) => {
    expect(acceptsMarkdown(accept)).toBe(expected)
  })

  it('appends Accept to Vary without replacing or duplicating values', () => {
    const headers = new Headers({ vary: 'Accept-Encoding' })
    appendVary(headers, 'Accept')
    appendVary(headers, 'accept')
    expect(headers.get('vary')).toBe('Accept-Encoding, Accept')
  })

  it('maps root, nested, and trailing-slash paths', () => {
    expect(markdownPathFor('/')).toBe('/index.md')
    expect(markdownPathFor('/about')).toBe('/about.md')
    expect(markdownPathFor('/insights/example/')).toBe('/insights/example.md')
  })
})

describe('Markdown Edge Function', () => {
  it('passes HTML through with status, body, headers, and an appended Vary', async () => {
    const next = vi.fn(async () => new Response('<h1>HTML</h1>', {
      status: 203,
      headers: { vary: 'Accept-Encoding', 'x-origin': 'yes' },
    }))
    const response = await markdown(
      new Request('https://example.test/about', { headers: { accept: 'text/html,*/*' } }),
      contextWith(next),
    )
    expect(next).toHaveBeenCalledWith()
    expect(response.status).toBe(203)
    expect(await response.text()).toBe('<h1>HTML</h1>')
    expect(response.headers.get('x-origin')).toBe('yes')
    expect(response.headers.get('vary')).toBe('Accept-Encoding, Accept')
  })

  it('rewrites a Markdown request through context.next and never self-fetches', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    let downstreamRequest: Request | undefined
    const next = vi.fn(async (request?: Request) => {
      downstreamRequest = request
      return new Response('# About', { headers: { etag: 'fixture' } })
    })
    const response = await markdown(
      new Request('https://example.test/about?campaign=x', { headers: { accept: 'text/markdown' } }),
      contextWith(next),
    )
    expect(downstreamRequest?.url).toBe('https://example.test/about.md')
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(response.headers.get('content-type')).toBe('text/markdown; charset=utf-8')
    expect(response.headers.get('etag')).toBe('fixture')
    expect(await response.text()).toBe('# About')
  })

  it('returns a useful Markdown 404 when the twin is missing', async () => {
    const response = await markdown(
      new Request('https://example.test/not-real', { headers: { accept: 'text/markdown' } }),
      contextWith(async () => new Response('origin miss', { status: 404 })),
    )
    expect(response.status).toBe(404)
    expect(response.headers.get('content-type')).toBe('text/markdown; charset=utf-8')
    const body = await response.text()
    expect(body).toContain('# Page not found')
    expect(body).toContain('[BFNA home](/)')
    expect(body).toContain('[Sitemap](/sitemap.xml)')
    expect(body).toContain('[AI guidance](/llms.txt)')
  })
})
```

Implement `bfna-website-nuxt/src/tests/agent/agent-artifacts.spec.ts` with direct pure-helper coverage and one filesystem integration fixture:

```ts
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, describe, expect, it } from 'vitest'
import { generateAgentArtifacts, readableMarkdown, renderLlms, renderRobots, renderSitemap, validPublishDate } from '../../../scripts/generate-agent-artifacts'
import { isDiscoverableRoute, markdownOutputPath } from '../../../scripts/lib/agent-routes'

const temporaryRoots: string[] = []
afterEach(async () => Promise.all(temporaryRoots.splice(0).map(path => rm(path, { recursive: true, force: true }))))

const page = (slug: string, heading: string, publishDate: string | null = null) => ({
  slug, heading, subheading: `${heading} summary`, excerpt: `${heading} excerpt`,
  description: `## ${heading} section\n\nFirst paragraph.\n\nSecond paragraph.`, authors: [],
  image: null, video_url: null, download: null, external_url: null,
  publish_date: publishDate, bucket: 'page', format: null, kind: null,
  program: null, archived: false, evergreen: true, copy_source: 'test', legacy: null,
})

describe('agent artifact renderers', () => {
  it('validates calendar dates strictly and never accepts timestamps', () => {
    expect(validPublishDate('2025-02-24')).toBe('2025-02-24')
    expect(validPublishDate('2025-02-30')).toBeUndefined()
    expect(validPublishDate('2025-02-24T00:00:00Z')).toBeUndefined()
    expect(validPublishDate(null)).toBeUndefined()
  })

  it('preserves readable headings and paragraph breaks', () => {
    expect(readableMarkdown('<h2>Heading</h2><p>One.</p><p>Two.</p>'))
      .toBe('Heading\n\nOne.\n\nTwo.')
  })

  it('renders valid lastmod only and excludes utility routes', () => {
    const documents = [
      { route: '/', title: 'Home', description: 'Home', body: 'Body', publishDate: '2025-02-24' },
      { route: '/about', title: 'About', description: 'About', body: 'Body' },
    ]
    const sitemap = renderSitemap(documents)
    expect(sitemap).toContain('<lastmod>2025-02-24</lastmod>')
    expect(sitemap.match(/<lastmod>/g)).toHaveLength(1)
    expect(renderLlms(documents)).toContain('## When to use this site')
    expect(renderRobots()).toContain('Disallow: /docs/')
    expect(renderRobots()).toContain('Disallow: /wireframes/')
    expect(renderRobots()).toContain('Disallow: /search')
    expect(isDiscoverableRoute('/docs/button')).toBe(false)
    expect(isDiscoverableRoute('/insights/example')).toBe(true)
    expect(markdownOutputPath('/')).toBe('index.md')
  })

  it('writes twins/discovery/404 and scopes _headers to non-production', async () => {
    const root = await mkdtemp(join(tmpdir(), 'bfna-agent-'))
    temporaryRoots.push(root)
    const content = join(root, 'content/bf/pages')
    const output = join(root, '.output/public')
    await mkdir(content, { recursive: true })
    await Promise.all([
      writeFile(join(content, 'home.json'), JSON.stringify(page('home', 'Home', '2025-02-24'))),
      writeFile(join(content, 'about.json'), JSON.stringify(page('about', 'About'))),
      writeFile(join(content, 'archive.json'), JSON.stringify(page('archive', 'Archive'))),
      writeFile(join(content, 'privacy.json'), JSON.stringify(page('privacy', 'Privacy'))),
    ])

    await generateAgentArtifacts(root, output, 'deploy-preview')
    expect(await readFile(join(output, 'index.md'), 'utf8')).toContain('\n\nFirst paragraph.\n\nSecond paragraph.')
    expect(await readFile(join(output, 'sitemap.xml'), 'utf8')).not.toContain('/search')
    expect(await readFile(join(output, 'llms.txt'), 'utf8')).toContain('## When to use this site')
    expect(await readFile(join(output, '404.html'), 'utf8')).toContain('Page not found')
    expect(await readFile(join(output, '_headers'), 'utf8')).toContain('X-Robots-Tag: noindex, nofollow')

    await generateAgentArtifacts(root, output, 'production')
    await expect(readFile(join(output, '_headers'), 'utf8')).rejects.toMatchObject({ code: 'ENOENT' })
  })
})
```

Implement `bfna-website-nuxt/src/tests/utils/seo.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { absoluteAssetUrl, canonicalUrl, normalizeSiteOrigin } from '../../utils/site-url'
import { articleJsonLd, organizationJsonLd, websiteJsonLd } from '../../utils/structured-data'

describe('BFNA SEO helpers', () => {
  it('normalizes origins, route slashes, and assets', () => {
    expect(normalizeSiteOrigin('https://www.bfna.org/')).toBe('https://www.bfna.org')
    expect(canonicalUrl('https://www.bfna.org/', '/insights/example/')).toBe('https://www.bfna.org/insights/example')
    expect(absoluteAssetUrl('https://www.bfna.org', '/images/example.jpg')).toBe('https://www.bfna.org/images/example.jpg')
  })

  it('uses the verified Organization facts and only real social profiles', () => {
    const schema = organizationJsonLd('https://www.bfna.org')
    expect(schema.address).toMatchObject({
      streetAddress: '1108 16th St, NW', addressLocality: 'Washington',
      addressRegion: 'DC', postalCode: '20036', addressCountry: 'US',
    })
    expect(schema.email).toBe('info@bfna.org')
    expect(schema.logo).toBe('https://www.bfna.org/images/bfna-og.jpg')
    expect(schema.sameAs).not.toContain('#bluesky-profile-url')
    expect(websiteJsonLd('https://www.bfna.org').publisher).toEqual({ '@id': 'https://www.bfna.org/#organization' })
  })

  it('omits unavailable Article facts rather than inventing them', () => {
    const minimal = articleJsonLd('https://www.bfna.org', {
      path: '/insights/example', headline: 'Example', description: 'Summary',
    })
    expect(minimal).not.toHaveProperty('datePublished')
    expect(minimal).not.toHaveProperty('author')

    const complete = articleJsonLd('https://www.bfna.org', {
      path: '/insights/example', headline: 'Example', description: 'Summary',
      publishDate: '2025-02-24', authors: ['Example Author'], image: '/images/example.jpg',
    })
    expect(complete).toMatchObject({
      datePublished: '2025-02-24',
      author: [{ '@type': 'Person', name: 'Example Author' }],
      mainEntityOfPage: 'https://www.bfna.org/insights/example',
    })
  })
})
```

Use a typed minimal `Context` stub whose `next` captures the optional `Request`; cast only the stub boundary to `Context`, not production code. Spy on `globalThis.fetch` and assert zero calls. The explicit `@types/node` dependency supports the filesystem integration fixture without adding missing-module diagnostics.

In `.github/workflows/verify.yml`, keep the existing order, add a `Agent-readiness tests` step running `npm run test:agent` before the typecheck gate, and add `npm run check:agent-artifacts` immediately after Build. Extend the existing link/route checks only where their current architecture cleanly supports privacy, sitemap, and 404 assertions; do not duplicate the entire new verifier.

Add these exact `package.json` scripts:

```json
"test:agent": "vitest run src/tests/agent/markdown-edge.spec.ts src/tests/agent/agent-artifacts.spec.ts src/tests/utils/seo.spec.ts",
"check:agent-artifacts": "tsx scripts/verify-agent-artifacts.ts"
```

**Test scenarios:** All U1–U4 scenarios, plus the repository-correct import resolution itself and a fixture generation run that compares actual files rather than only pure renderer strings.

## Verification Contract

Run from the repository root unless a command begins with `cd bfna-website-nuxt`.

1. Confirm only intended implementation files are dirty: `git status --short` and `git diff --check`. Expected: no generated `.output` paths appear and no whitespace errors.
2. Install deterministically after dependency changes: `cd bfna-website-nuxt && npm ci`. Expected: clean install on Node 24.
3. Run focused tests: `cd bfna-website-nuxt && npm run test:agent`. Expected: all tests pass.
4. Run existing relevant tests: `cd bfna-website-nuxt && npx vitest run`. Expected: no regression; document any unrelated baseline failure rather than weakening tests.
5. Run the required type gate: `node .github/typecheck-gate.mjs`. Expected: PASS and zero new signatures. Do not require the raw diagnostic count to remain 90 because adding `@types/node` may reduce it.
6. Check redirect sources and generated output: `cd bfna-website-nuxt && npm run redirects:generate && npm run redirects:check && npm run redirects:verify`. Expected: both checks pass; `/privacy-policy /privacy 301` and `/contact /about#contact 301` are present once; all targets resolve.
7. Generate without importing Directus: `cd bfna-website-nuxt && npx nuxt generate`. Expected: exit 0; never use `npm run generate` in CI or verification because it pulls Directus.
8. Verify generated artifacts: `cd bfna-website-nuxt && npm run check:agent-artifacts`. Expected: a twin for every public content route; no utility twins; sitemap/llms/robots/404 valid; no `_headers` with unset `CONTEXT`.
9. Verify preview headers: `cd bfna-website-nuxt && CONTEXT=deploy-preview npx nuxt generate && test -f .output/public/_headers && grep -F 'X-Robots-Tag: noindex, nofollow' .output/public/_headers`. Expected: all commands succeed. Then run `CONTEXT=production npx nuxt generate && test ! -e .output/public/_headers`; expected success. The generator must remove a stale `_headers` before deciding not to write it, otherwise back-to-back builds can leave preview state in production.
10. Inspect representative content: `sed -n '1,80p' bfna-website-nuxt/.output/public/index.md`, one insight twin, `sitemap.xml`, `llms.txt`, `robots.txt`, and `404.html`. Expected: readable paragraph breaks, canonical production URLs, no `/docs`, `/wireframes`, or `/search`, and no generated timestamps/mtimes.
11. Run route and link gates against generated output: `cd bfna-website-nuxt && npm run check:routes`, then run the following exact link-check sequence. Expected: both pass, `/privacy` is 200 with meaningful content, an unknown path is 404, and the footer has no broken Privacy link.

    ```sh
    cd bfna-website-nuxt
    npx --yes serve@14 --no-clipboard --no-port-switching -l 3000 .output/public >/tmp/bfna-agent-serve.log 2>&1 &
    BFNA_SERVE_PID=$!
    for i in $(seq 1 30); do curl -sf -o /dev/null http://localhost:3000/ && break; sleep 1; done
    npm run check:links
    BFNA_LINK_STATUS=$?
    kill "$BFNA_SERVE_PID" 2>/dev/null || true
    exit "$BFNA_LINK_STATUS"
    ```
12. Run the contrast gates already required by CI: `cd bfna-website-nuxt && npm run check:contrast:self-check && npm run check:contrast:ci`. Expected: both pass under the known-failure policy.
13. With Netlify CLI or a deploy preview, request variants:
    - `curl -i -H 'Accept: text/html' URL/insights/SLUG` -> 200 HTML and `Vary` contains Accept.
    - `curl -i -H 'Accept: text/markdown' URL/insights/SLUG` -> 200 `text/markdown`, readable body, same visible URL.
    - `curl -i -H 'Accept: text/markdown;q=0, text/html' URL/insights/SLUG` -> HTML.
    - `curl -i -H 'Accept: text/markdown' URL/not-real` -> 404 Markdown with home/sitemap/llms links.
    - `curl -i URL/not-real` -> 404 HTML with useful text.
    - `curl -IL URL/privacy-policy` and `curl -IL URL/contact` -> exactly one 301 before a 200 target.
    - On a preview deploy, any HTML response includes `X-Robots-Tag: noindex, nofollow`; production does not.
14. Inspect built homepage and one insight HTML for one canonical link, complete description/OG/Twitter fields, Organization/WebSite JSON-LD on home, Article JSON-LD on insight, the verified address, and no placeholder Bluesky value.
15. Final cleanliness: `git status --short --ignored`. Expected: `.output/` is ignored; no generated twins/discovery files are staged; tracked source/lock/redirect changes only.

## Definition of Done

- Every requirement R1–R14 is demonstrated by an automated test or an exact verification step above.
- The typecheck gate passes without baseline edits or new diagnostic signatures.
- CI's current generate, route, link, contrast, and redirect behavior remains green, with the agent-artifact verifier added after build.
- Public browser HTML is unchanged except intentional SEO, address, footer, privacy, and 404 improvements.
- Markdown negotiation handles q=0, Vary, missing twins, exclusions, and no-recursion behavior exactly as specified.
- All generated artifacts are derived from committed content, readable, internally consistent, and absent from the git diff.
- Production indexing remains enabled; non-production Netlify contexts are noindex.
- No abandoned experiment, duplicate route inventory, inline Edge registration, static `src/public/robots.txt`, or obsolete generation path remains.

## Owner TODOs

These do not block implementation unless counsel changes a factual statement used by the page:

- TODO(owner): Have counsel approve the updated privacy wording and supply an effective/last-updated date; until then keep `publish_date: null` and do not invent a date.
- TODO(owner): Confirm actual hosting/security-log retention periods, international-transfer language, and the current list of processors before publishing specifics.
- TODO(owner): Confirm whether Netlify Analytics, Netlify Forms, or any consent/cookie tooling is enabled outside this repository; describe it only if verified.
- TODO(owner): Replace `#bluesky-profile-url` in the footer when the official Bluesky profile is known. It remains excluded from JSON-LD `sameAs` until then.
- TODO(owner): Confirm whether a Terms page is planned; leave the current placeholder unchanged rather than creating unsupported legal copy.
- TODO(owner): Reconfirm the Netlify UI build command and publish directory after merging `netlify.toml`; the file deliberately preserves only `base = "bfna-website-nuxt"`.

## Not-Applicable Findings

- Public API/OpenAPI/MCP/tool coverage is not applicable. The only server API code supports internal component documentation and is excluded from public agent discovery.
- `/docs/**` is an internal design-system surface, not public BFNA documentation; it remains live but disallowed and excluded.
- `/wireframes/**` is a frozen prototype required by existing tests; it remains live but disallowed and excluded.
- `/search` is client-side utility functionality, not an indexable content source; it remains live, noindex, and excluded from Markdown/sitemap/llms.
- There is no verified analytics script, production form submission endpoint, authentication flow, payment system, or user account data model in this repository. The privacy copy must not manufacture any of them.
- PR #295's insights/404 title changes are separate. This work adds Article metadata around existing insight data and replaces only generated `.output/public/404.html`; it does not edit `src/error.vue` or rework existing title strings.

## Sources and Evidence

- Product contract: `../shared-task.md`, `../final-prompt.md`, and `../known-pitfalls.md`.
- Production policy: `https://www.bfna.org/privacy-policy/`.
- Verified office address: `https://www.bertelsmann-stiftung.de/en/about-us/who-we-are/offices-1`.
- Netlify Edge Function signature, `context.next`, request rewrite, and registration behavior: `https://docs.netlify.com/build/edge-functions/api/` and `https://docs.netlify.com/build/edge-functions/declarations/`.
- Repository evidence: `bfna-website-nuxt/src/nuxt.config.ts`, `content/bf/**`, `src/pages/**`, `src/layouts/bf-default.vue`, `src/components/bf/{Footer,ContactSection}.vue`, `server/utils/legacy-redirect-rules.ts`, `scripts/**`, `.github/workflows/verify.yml`, `.github/typecheck-gate.mjs`, and current tests.
