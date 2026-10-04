# Agent-readiness implementation plan (BFNA Nuxt v2)

Planning document only. Implement exactly this. Do not open work on PR #295's branch `cursor/a11y-final-issues-fb39`. Branch from `dev`. The site package is `bfna-website-nuxt/`. Netlify project `bfna-site-v2`, UI base directory `bfna-website-nuxt`. There is no `netlify.toml` today. `npm run generate` is `node ./contentImporter.js && nuxt generate`. CI does **not** run that script; `.github/workflows/verify.yml` runs `npx nuxt generate` from `bfna-website-nuxt/`.

Scanned host: `https://dev-preview--bfna-site-v2.netlify.app` (branch deploy, Netlify `CONTEXT=branch-deploy`). Canonical origin for every machine-readable URL is `https://www.bfna.org`, overridable with `NUXT_PUBLIC_SITE_URL`. Never use `URL`, `DEPLOY_URL`, or `DEPLOY_PRIME_URL` for canonicals, sitemap locs, JSON-LD, or `llms.txt` links. Those are the preview host.

## CI typecheck baseline — stay under it

`.github/workflows/verify.yml` does not require `npm run typecheck` to exit 0. It runs `node .github/typecheck-gate.mjs`, which merges `npx nuxt typecheck` and `npm run typecheck:scripts` and compares **signatures** `<file>\t<TS-code>\t<count>` to `.github/typecheck-baseline.txt`.

- Baseline total at time of writing: **90** diagnostics (the comment in that file).
- A new `(file, code)` pair, or a higher count on an existing pair, fails the gate.
- A lower count passes. Do not regenerate the baseline (`--write`) to hide a new error. Do not add rows.
- `src/nuxt.config.ts` already has `TS2307`×3, `TS2353`×1, `TS2591`×1, `TS7006`×5. Adding code there must not increase those counts or introduce a new code.
- `nuxt typecheck` covers `src/**` and `server/**` (Nitro auto-imports such as `defineEventHandler` / `defineNitroPlugin` already typecheck in `server/middleware/redirects.ts`). New server files must be clean.
- `typecheck:scripts` is `tsc -p tsconfig.scripts.json` (`strict`, `include: scripts/**/*.ts`). It follows relative imports. New scripts must import with extensionless relative paths, the same way `scripts/generate-legacy-redirects.ts` imports `../server/utils/legacy-redirect-rules`.
- `netlify/edge-functions/**` is not in either project unless a script imports it. Put shared pure functions in a file the script imports, so `tsc` checks them.
- Before pushing the implementation, from the repo root:

```bash
node .github/typecheck-gate.mjs
```

Expected: exit 0 and `PASS — no new type errors.` Observed total may be less than 90. It must not be a new signature.

Prior PRs #296 and #297 failed this gate. Treat any new `error TS` line as a stop.

## Facts the copy must use (do not invent the rest)

| Fact | Source | Use |
|---|---|---|
| Name | `titleTemplate` in `src/layouts/bf-default.vue`: "Bertelsmann Foundation North America". Footer copyright line: "Bertelsmann Foundation." | JSON-LD `name`, `llms.txt` H1, privacy heading |
| Description | `content/bf/pages/home.json` `excerpt` (same sentence as `description`) | JSON-LD `description`, homepage meta description, `llms.txt` blockquote |
| About body | `content/bf/pages/about.json` `excerpt` / `description` | About is already a page. Do not rewrite it |
| Washington, DC | `content/bf/pages/stiftung.json`: "The Washington, DC-based Bertelsmann Foundation" | `PostalAddress` locality/region/country only |
| Street address on the contact band | `src/components/bf/ContactSection.vue` default `address`: `[street address — Directus contact singleton]` | **Not a fact.** Do not put that string in JSON-LD, privacy copy, or `llms.txt` |
| Email | Contact band default `email`: `info@bfna.org` (`about.vue` renders `<bfContactSection id="contact" />` with defaults) | `contactPoint.email`, privacy contact |
| Phone | absent | omit `telephone`. `TODO(owner)` in a code comment only |
| Social URLs that are real | `src/components/bf/Footer.vue` `socials`: LinkedIn, Instagram, Facebook, YouTube, Vimeo | `sameAs` |
| Bluesky | `url: '#bluesky-profile-url'` with an in-file note that Irene still owes the real URL | omit from `sameAs` and from privacy copy |
| Logo | inline SVG in `src/components/bf/Logo.vue`. No raster logo in the repo. `src/public/favicon/site.webmanifest` points at `/android-chrome-96x96.png`, which is **not** in the tree | publish the existing SVG as a static file (below). Do not reference the missing PNG |
| Analytics, GTM, Netlify Forms, cookie banner | no matches under `bfna-website-nuxt/src` or `server/` | privacy page says these are not present |
| Contact form | `ContactSection.vue`: `@submit.prevent`, no `fetch`, no `data-netlify`, comment "No submission, deliberately" | privacy page says the form does not send |
| Fonts | `src/public/css/tokens/fonts.css` imports Newsreader, IBM Plex Sans, Material Icons from `fonts.googleapis.com` / `fonts.gstatic.com`. `nuxt.config.ts` `app.head` also links Material Symbols | privacy page names those |
| Images | `nuxt.config.ts` `image.domains`: `bfna.simplyas.com` | privacy page names that host |
| Production privacy URL | `https://www.bfna.org/privacy-policy/` (HTML). A PDF also exists at `src/public/files/Privacy-Policy.pdf` | redirect the HTML path. Do not treat the PDF as the scanner page |
| `/docs`, `server/api/component-docs/[component].get.ts` | design-system catalog | not a public API |

`TODO(owner)` markers go in code comments and the PR body. Never render the characters `TODO` on a page (pitfall 8).

## Which directory ships

`bfna-website-nuxt/public/css` is a symlink to `../src/public/css`. `public/_redirects` lives only in the app-root `public/`. `src/public/robots.txt` and `src/public/favicon.ico` live only under `src/public/`.

`verify.yml` records that a real Chrome navigation 404s `/favicon.ico`. The Oct 4 scan 404s `/robots.txt`. Those two files are in `src/public` and not in app-root `public/`. The directory Nuxt copies into `.output/public` is **`bfna-website-nuxt/public`** (rootDir), not `src/public`. gh#66 writes `_redirects` there and expects `.output/public/_redirects` after generate.

Confirm once, before adding files:

```bash
cd bfna-website-nuxt
npx nuxt generate
test -f .output/public/_redirects && echo ROOT_REDIRECTS_OK
test ! -f .output/public/robots.txt && echo STUB_ROBOTS_NOT_COPIED
test ! -f .output/public/favicon.ico && echo FAVICON_NOT_COPIED
```

Expected: all three echoes. If `robots.txt` or `favicon.ico` **is** in `.output/public`, stop and treat `src/public` as a second source that also copies: the hook below still overwrites `.output/public/robots.txt` at the end, so the stub cannot win. Do not hand-edit `_redirects`.

Committed static file (the logo) goes in `bfna-website-nuxt/public/logo.svg`. Generated files (`sitemap.xml`, `llms.txt`, `robots.txt`, `*.md`, `_headers`) are written only to `.output/public` by the Nitro hook. `.output` is already gitignored (`bfna-website-nuxt/.gitignore`). Do not also write them into `public/` or `src/public/`. Do not commit them.

Delete `bfna-website-nuxt/src/public/robots.txt` (the `User-Agent: *` / `Disallow:` stub from 2025). It does not ship today; deleting it stops a later public-dir change from resurrecting a second robots file.

## Pitfalls and the rule that avoids each

1. **508 loop.** Edge signature is `export default async (request: Request, context) => …`. Pass through with `context.next()`. Never `fetch` the incoming URL, and never `fetch` any same-site URL with `Accept: text/markdown`. Register the function only in `netlify.toml`. No `export const config`. `excludedPath` includes the markdown twins and assets. If a `*.md` request still hits the function, serve it with `context.next()` and **return**. Do not rewrite a `*.md` path (that is the loop).
2. **Accept and Vary.** Split `Accept` on commas, honor `q`, treat `q=0` as not acceptable. On every response the function builds, append `Accept` to the existing `Vary` list. Never `headers.set('vary', 'Accept')` when `Vary` is already set.
3. **noindex.** Do not add `[[headers]]` or `[context.production.headers]` / `[context.deploy-preview.headers]` / `[context.branch-deploy.headers]`. Netlify ignores per-context header tables in `netlify.toml`. Write `.output/public/_headers` from the build when `process.env.CONTEXT` is set and is not `production`. `dev-preview` is a branch deploy, so `CONTEXT` is `branch-deploy`. Also set `X-Robots-Tag` on responses the function itself constructs, using `context.deploy.context`, so a synthetic body does not drop the tag. Never emit the tag when the context is `production` or unset (local and CI).
4. **netlify.toml must not retarget the build.** One file, `bfna-website-nuxt/netlify.toml`, containing only `[[edge_functions]]`. No `[build]`, no `command`, no `publish`, no `base`. The UI already has base `bfna-website-nuxt`, build `npm run generate`, publish `.output/public`.
5. **No committed generated output.** Hook writes into `.output/public` only. Delete the robots stub. Do not commit twins, sitemap, llms, or `_headers`.
6. **Readable markdown.** Join paragraphs with `\n\n`. Do not `.replace(/\s+/g, ' ')`.
7. **lastmod.** Parse `publish_date` as `YYYY-MM-DD` and reject impossible calendar dates. Omit `<lastmod>` otherwise. Do not call `stat` or use `mtime`.
8. **JSON-LD facts.** Washington, DC from the Stiftung sentence. `logo` is an absolute URL to the SVG you add. No placeholder street, no invented email, no phone, no Bluesky, no visible `TODO`.
9. **Layouts.** New page uses `definePageMeta({ layout: 'bf-default' })` only. Do not wrap the page in `<NuxtLayout>`. `error.vue` is the one file that must keep `<NuxtLayout name="bf-default">` (it is not a route). Do not edit `error.vue`.
10. **Typecheck.** See the baseline section. Tests import `../server/...` or `../netlify/...` relatively.
11. **robots / sitemap / llms.** `Disallow: /docs/`, `/wireframes/`, `/search`. Those prefixes are absent from `sitemap.xml` and from `llms.txt`.
12. **PR #295.** Do not edit `src/error.vue` (404 title, #231) or the `useHead({ title })` call in `src/pages/insights/[slug].vue`. SEO is a plugin. 404 HTML text is injected by the edge function into the empty shell, not by changing `error.vue`.

## File list

| Path | Action |
|---|---|
| `bfna-website-nuxt/netlify/edge-functions/negotiate.ts` | create. Pure functions. No Node builtins, no npm imports |
| `bfna-website-nuxt/netlify/edge-functions/markdown.ts` | create. The edge function. Full source below |
| `bfna-website-nuxt/netlify.toml` | create. Edge registration only |
| `bfna-website-nuxt/server/utils/write-agent-files.ts` | create. Build step: sitemap, llms, robots, markdown twins, `_headers` |
| `bfna-website-nuxt/server/plugins/agent-files.ts` | create. `prerender:done` → `writeAgentFiles()` |
| `bfna-website-nuxt/scripts/check-agent-readiness.ts` | create. Assertions. Relative imports |
| `bfna-website-nuxt/public/logo.svg` | create. The `<svg>` already in `src/components/bf/Logo.vue`, unchanged paths |
| `bfna-website-nuxt/src/plugins/seo.ts` | create. Canonical, og, JSON-LD. No `title` |
| `bfna-website-nuxt/src/pages/privacy.vue` | create |
| `bfna-website-nuxt/src/components/bf/Footer.vue` | one attribute: Privacy `href="#"` → `href="/privacy"` |
| `bfna-website-nuxt/src/nuxt.config.ts` | add `/privacy` to `prerenderRoutes`; set `runtimeConfig.public.siteUrl` |
| `bfna-website-nuxt/server/utils/legacy-redirect-rules.ts` | two exact 301s, then regenerate |
| `bfna-website-nuxt/public/_redirects` | regenerated by `npm run redirects:generate`. Do not edit by hand |
| `bfna-website-nuxt/server/utils/legacy-slug-map.ts` | regenerated by the same command. Do not edit by hand |
| `bfna-website-nuxt/src/public/robots.txt` | delete |
| `.github/workflows/verify.yml` | one step, after install, before the typecheck gate: `npx tsx scripts/check-agent-readiness.ts` |
| `src/error.vue`, `src/pages/insights/[slug].vue` | do not touch |
| OpenAPI, MCP, `/.well-known/mcp` | do not create |

`package.json` `generate` stays `node ./contentImporter.js && nuxt generate`. The hook runs inside `nuxt generate`, so both Netlify (`npm run generate`) and CI (`npx nuxt generate`) emit the files. Do not shell out a second time.

## 1 and 2 — Markdown negotiation and markdown 404s

Static hosting cannot vary on `Accept`. One edge function does both checks.

Homepage HTML is `.output/public/index.html` (`check-routes.ts` resolves `about/index.html`, `insights/<slug>/index.html`). Twins are **siblings of the route, not `index.md` inside the directory**:

| Request path | Twin file under `.output/public` |
|---|---|
| `/` | `index.md` |
| `/about` and `/about/` | `about.md` |
| `/insights` | `insights.md` |
| `/insights/<slug>` | `insights/<slug>.md` |
| `/projects`, `/projects/<slug>` | same pattern |
| `/<program>` | `<program>.md` |
| `/archive`, `/privacy` | `archive.md`, `privacy.md` |

No twins for `/search`, `/docs/**`, `/wireframes/**`, `/_nuxt/**`, or files with an asset extension.

`negotiate.ts` exports `wantsMarkdown`, `markdownTwinPath`, `markdown404Body`, `injectNotFoundHtml`.

`wantsMarkdown(header: string | null): boolean`

- null or empty → false
- split on `,`
- each part: type before `;`, parameters after
- `q` defaults to 1; if present and not a finite number, treat as 0
- drop any type whose `q` is 0 (this is the `q=0` rule)
- markdown type is `text/markdown` (also accept `text/x-markdown`)
- html type is `text/html` or `application/xhtml+xml`
- no markdown type left → false
- no html type left → true
- markdown wins only when its `q` is **strictly greater** than html's `q`
- tie (browser-style `text/html, text/markdown` or both omitted) → false, so HTML behavior does not change

`markdownTwinPath(pathname: string): string`

- strip one trailing slash except for `/`
- `/` → `/index.md`
- otherwise `pathname + '.md'`

`markdown404Body(): string` — this exact text (it is longer than 20 characters and names the three links):

```markdown
# Page not found

That page does not exist, or its address has changed.

- [Home](/)
- [Sitemap](/sitemap.xml)
- [llms.txt](/llms.txt)
```

`injectNotFoundHtml(html: string): string`

- If `html` already includes `Page not found`, return it unchanged.
- Otherwise replace the first empty `__nuxt` div. The shell documented in `src/error.vue` is `<div id="__nuxt"></div>` with `data-ssr="false"`. After the confirmation generate, open `.output/public/404.html` and match the **actual** empty tag, including whatever attributes it has. Replacement inner HTML:

```html
<main id="main"><h1>Page not found</h1><p>That page does not exist, or its address has changed.</p><p><a href="/">Home</a> · <a href="/sitemap.xml">Sitemap</a> · <a href="/llms.txt">llms.txt</a></p></main>
```

- Inject **inside** `#__nuxt`, not after it. `data-ssr="false"` means the client replaces that node's children on boot (`error.vue`'s own note; `PRERENDER_NO_SSR_ROUTES`). Curl sees the text. A browser that runs JS ends on the existing `bfEmptyState` ("Page not found" / "That page does not exist, or its address has changed." / "Back to home"). Do not add a second visible block outside `#__nuxt` or the hydrated page shows both.
- If the pattern does not match, return `html` unchanged and fix the pattern against the real file before shipping. Do not edit `error.vue` to try to SSR the 404. Nitro forces `noSSR` on `/404.html`; adding the route to `prerenderRoutes` does not change that (`error.vue` lines 54–69).

### `netlify.toml` (entire file)

```toml
# UI owns the build. Do not add [build], command, publish, or base.
# Base directory in the Netlify UI: bfna-website-nuxt
# Build command: npm run generate
# Publish directory: .output/public
# Headers are not here. Netlify has no per-context [[headers]] support;
# noindex is written to .output/public/_headers by the prerender hook.

[[edge_functions]]
  function = "markdown"
  path = "/*"
  excludedPath = [
    "/*.md",
    "/*/*.md",
    "/_nuxt/*",
    "/_ipx/*",
    "/css/*",
    "/images/*",
    "/favicon/*",
    "/component-docs/*",
    "/files/*",
    "/*.css",
    "/*.js",
    "/*.mjs",
    "/*.svg",
    "/*.png",
    "/*.jpg",
    "/*.jpeg",
    "/*.webp",
    "/*.gif",
    "/*.ico",
    "/*.woff",
    "/*.woff2",
    "/*.ttf",
    "/*.xml",
    "/*.txt",
    "/*.map",
    "/*.json"
  ]
```

`/*.md` is one segment (`/index.md`, `/about.md`). `/*/*.md` is the insight and project twins. There is no third segment in the public routes.

### Edge function — full file `netlify/edge-functions/markdown.ts`

```ts
import { injectNotFoundHtml, markdown404Body, markdownTwinPath, wantsMarkdown } from './negotiate.ts'

interface EdgeContext {
  next: () => Promise<Response>
  deploy?: { context?: string }
}

const SKIP_PREFIXES = ['/docs', '/wireframes']

function skipped(pathname: string): boolean {
  if (pathname === '/search' || pathname.startsWith('/search/')) return true
  return SKIP_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

function appendVary(headers: Headers): void {
  const current = headers.get('vary')
  const parts = current ? current.split(',').map(part => part.trim()).filter(Boolean) : []
  if (!parts.some(part => part.toLowerCase() === 'accept')) parts.push('Accept')
  headers.set('vary', parts.join(', '))
}

function applyNoindex(headers: Headers, deployContext: string | undefined): void {
  if (deployContext && deployContext !== 'production') {
    headers.set('x-robots-tag', 'noindex, nofollow')
  }
}

function pass(response: Response, headers: Headers): Response {
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  })
}

export default async (request: Request, context: EdgeContext) => {
  const url = new URL(request.url)
  const path = url.pathname

  // *.md is excluded in netlify.toml. This branch is the brake if a twin
  // request still arrives: serve the file, do not rewrite, do not fetch.
  if (path.endsWith('.md')) {
    const response = await context.next()
    const headers = new Headers(response.headers)
    headers.set('content-type', 'text/markdown; charset=utf-8')
    headers.delete('content-length')
    appendVary(headers)
    applyNoindex(headers, context.deploy?.context)
    return pass(response, headers)
  }

  const response = await context.next()
  const headers = new Headers(response.headers)
  headers.delete('content-length')
  appendVary(headers)
  applyNoindex(headers, context.deploy?.context)

  if (!wantsMarkdown(request.headers.get('accept'))) {
    if (response.status !== 404) return pass(response, headers)
    const html = await response.text()
    headers.set('content-type', 'text/html; charset=utf-8')
    return new Response(injectNotFoundHtml(html), { status: 404, headers })
  }

  if (response.status === 404) {
    headers.set('content-type', 'text/markdown; charset=utf-8')
    return new Response(markdown404Body(), { status: 404, headers })
  }

  if (skipped(path)) return pass(response, headers)

  // The page exists. Load the prebuilt twin.
  // Accept is text/plain on purpose. Accept: text/markdown on this same host
  // re-enters the function and Netlify returns 508.
  // Do not fetch(request.url). Do not return new URL() after context.next();
  // the chain has already run. excludedPath keeps the twin fetch out of this
  // function. A rewrite via `return new URL()` would also force the rewrite
  // status path and cannot carry this 404 branch.
  const twin = await fetch(new URL(markdownTwinPath(path), request.url), {
    headers: { accept: 'text/plain' }
  })
  if (!twin.ok) return pass(response, headers)

  headers.set('content-type', 'text/markdown; charset=utf-8')
  return new Response(await twin.text(), { status: 200, headers })
}
```

`negotiate.ts` must not import Node or `@netlify/edge-functions`. Duplicate nothing into the function file except the `SKIP` / header helpers above.

## 3, 4, 8, 11 — sitemap, llms.txt, robots, when-to-use

`server/plugins/agent-files.ts`:

```ts
import { writeAgentFiles } from '../utils/write-agent-files'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('prerender:done', async () => {
    await writeAgentFiles()
  })
})
```

`defineNitroPlugin` is a Nitro auto-import, same pattern as `defineEventHandler` in `server/middleware/redirects.ts`. Do not add a type assertion to silence an error. If it does not resolve, the import that already typechecks in this repo is the one to copy from a generated Nitro reference — do not add `any`, and do not add a baseline row.

`writeAgentFiles()` resolves output as `resolve(dirname(fileURLToPath(import.meta.url)), '../../.output/public')` and content as `../../content/bf`. Do not use `process.cwd()`.

### Site URL

```ts
const siteUrl = (process.env.NUXT_PUBLIC_SITE_URL || 'https://www.bfna.org').replace(/\/$/, '')
```

### Routes to emit

Read directories with `readdirSync`. Same stems `nuxt.config.ts` `collectionSlugs` uses (`.json` files, stem = slug).

Include:

- `/`
- `/about`
- `/archive`
- `/insights`
- `/projects`
- `/privacy`
- `/${programSlug}` for each file in `content/bf/programs` (today: `democracy`, `future-leadership`, `transatlantic-relations-global-challenges`)
- `/insights/${slug}` for each file in `content/bf/insights`
- `/projects/${slug}` for each file in `content/bf/projects`

Exclude anything whose path is or starts with `/docs`, `/wireframes`, `/search`. Do not list people (there is no `/people` page; `/people` 301s to `/about#team`).

### Sitemap

`application/xml` at `.output/public/sitemap.xml`.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://www.bfna.org/about</loc></url>
</urlset>
```

- `loc` is `siteUrl + path`. Escape `&`, `<`, `>`.
- `<lastmod>` only from `publish_date` on that document, via:

```ts
export function lastmod(value: string | null | undefined): string | undefined {
  if (!value) return undefined
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim())
  if (!match) return undefined
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return undefined
  }
  return `${match[1]}-${match[2]}-${match[3]}`
}
```

Insight and project documents have `publish_date` only on insights (`content/bf/insights/*.json`, field `publish_date`, example `2024-02-26` on `zeitenwende-the-next-era-of-german-security.json`). Projects and pages use `null` or omit it. Omit `<lastmod>` for those. Do not invent one and do not use file mtime.

### robots.txt (full text the hook writes)

```text
User-agent: *
Allow: /
Disallow: /docs/
Disallow: /wireframes/
Disallow: /search

User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Amazonbot
Allow: /

User-agent: CCBot
Allow: /

Sitemap: https://www.bfna.org/sitemap.xml
```

`Sitemap:` uses `siteUrl`, not a hardcoded host, if `NUXT_PUBLIC_SITE_URL` is set. One robots file for every deploy. Preview noindex is the header, not `Disallow: /` — a disallow baked into the file would ship to production too.

### llms.txt

Spec shape: H1, a blockquote of at least a real paragraph, then link sections. The file must be longer than 100 characters and must not be only a heading.

```markdown
# Bertelsmann Foundation North America

> The Bertelsmann Foundation North America is an independent, nonpartisan think tank dedicated to strengthening the transatlantic partnership and advancing dialogue on the global challenges shaping our future.

## When to use this site

Use this site when you need Bertelsmann Foundation North America research on the transatlantic relationship, democracy, or US-European cooperation. Read /democracy for the democracy program, /transatlantic-relations-global-challenges for geopolitical and economic change, and /future-leadership for the fellowship and leadership work. Read /insights/<slug> for a single article, video, or report, and /projects/<slug> for a program such as RANGE or the Transatlantic Barometer. Read /about for the mission, board, team, and the contact email info@bfna.org. Read /privacy for what this website collects. This site is not an API and it has no developer portal; /docs is an internal design system and is out of scope.

## Programs

- [Democracy](https://www.bfna.org/democracy): <tagline from content/bf/programs/democracy.json>
- [Transatlantic Relations & Global Challenges](https://www.bfna.org/transatlantic-relations-global-challenges): <tagline>
- [Future Leadership](https://www.bfna.org/future-leadership): <tagline>

## Projects

<one bullet per project whose JSON has nav === true or featured === true, heading as the link text, excerpt as the description, href siteUrl + /projects/ + slug. Skip a row with an empty heading.>

## Insights

<the 10 insights with a parseable publish_date, sorted descending, heading as link text, excerpt or the first paragraph of content as the description. Skip empty headings.>

## Organization

- [About](https://www.bfna.org/about): Mission, board, team, and contact.
- [Contact](https://www.bfna.org/about#contact): Email info@bfna.org. The form on that band does not submit.
- [Privacy](https://www.bfna.org/privacy): What this website does with personal information.
- [Insights index](https://www.bfna.org/insights): All insights.
- [Projects index](https://www.bfna.org/projects): All projects.
- [Archive](https://www.bfna.org/archive): Archived work.
```

The blockquote is the `excerpt` string from `content/bf/pages/home.json`, not a paraphrase. Taglines are the `tagline` fields. Do not add `/docs`. The `## When to use this site` heading must stay so `grep -i -A5 'when to use'` matches.

### Markdown twins

For each included route, write the twin path from `markdownTwinPath`. Body:

```markdown
# <heading>

<blocks>

Canonical: <siteUrl><path>
```

Heading source: home → `content/bf/pages/home.json` `heading` ("Strengthening the Transatlantic Relationship") plus a line with the site name. About, archive, insights index, projects index → the matching `content/bf/pages/<slug>.json` `heading`. Privacy → `Privacy`. Program → `name`. Insight and project → `heading`.

`blocks` is `description` or `intro` or `content` or `excerpt`, in that order, first non-empty. Keep paragraph breaks:

```ts
export function blocks(value: string | null | undefined): string {
  if (!value) return ''
  let text = value.replace(/\r\n/g, '\n')
  if (/<[a-z][\s\S]*>/i.test(text)) {
    text = text
      .replace(/<\s*br\s*\/?>/gi, '\n')
      .replace(/<\/\s*(p|div|h[1-6]|li|blockquote)\s*>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
  }
  return text.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
}
```

Insight bodies are the `content` field (markdown-lite or legacy HTML). Do not collapse them to one line. A twin with an empty body still has the H1 and the canonical line.

### noindex build step — full function

```ts
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs'

/** Netlify CONTEXT: production | deploy-preview | branch-deploy | dev. Unset locally and in CI. */
export function writeNoindexHeaders(outputDir: string): void {
  mkdirSync(outputDir, { recursive: true })
  const file = `${outputDir}/_headers`
  const markdown = [
    '# Generated by server/utils/write-agent-files.ts. Do not commit.',
    '/*.md',
    '  Content-Type: text/markdown; charset=utf-8',
    '  Vary: Accept, Accept-Encoding',
    '/*/*.md',
    '  Content-Type: text/markdown; charset=utf-8',
    '  Vary: Accept, Accept-Encoding',
    ''
  ].join('\n')
  writeFileSync(file, markdown)
  const context = process.env.CONTEXT
  if (context && context !== 'production') {
    appendFileSync(file, [
      '/*',
      '  X-Robots-Tag: noindex, nofollow',
      ''
    ].join('\n'))
  }
}
```

Call `writeNoindexHeaders(outputDir)` at the end of `writeAgentFiles()`.

- Production (`CONTEXT=production`): `_headers` has the markdown `Content-Type` and `Vary` only. No `X-Robots-Tag`.
- Branch deploy `dev-preview` and deploy previews: the `/*` block is appended.
- CI and laptops (`CONTEXT` unset): no `X-Robots-Tag`. That is correct. CI does not publish.
- Do not put this table in `netlify.toml`.
- `Vary` on twins that the function does not see (a direct `GET /index.md`, which is `excludedPath`) still lists `Accept`. The value includes `Accept-Encoding` so the static rule does not drop compression. The function path still **appends** rather than replacing, which is the case the last review failed.

## 5 and 9 — JSON-LD

`public/logo.svg`: copy the `<svg>` from `src/components/bf/Logo.vue` (same `viewBox`, same paths, `fill="currentColor"`). Add `xmlns="http://www.w3.org/2000/svg"`. This is a source asset, committed. URL: `${siteUrl}/logo.svg`.

`src/plugins/seo.ts` runs on every page. It must **not** set `title` or `titleTemplate` (those stay in `bf-default` and the pages, including the two files PR #295 edits).

Skip the whole plugin when:

- `useError().value` is set (the 404 shell; do not canonicalise a missing path)
- path is `/docs` or starts with `/docs/` or `/wireframes`

Otherwise `useSeoMeta` / `useHead`:

- `link: [{ rel: 'canonical', href: siteUrl + path }]` with `path` = `/` or the route path without a trailing slash and without a query
- `og:url` the same absolute URL
- `og:type` = `article` only when the path matches `/insights/<one segment>`, else `website`
- `og:title` = the document heading when the plugin resolved one, else `Bertelsmann Foundation North America`. Do not read the page's `useHead` title; look up content the same way the pages do (`useBfPages`, `useBfInsights`, `useBfPrograms`, `useBfProjects` — explicit imports from `~/composables/data/...`, they are async and return plain values). Homepage (`/`) uses the layout default name, matching `index.vue` which sets no title on purpose.
- `description` and `og:description`: home `excerpt`; about / archive / index pages from the page document `excerpt` or first paragraph of `description`; insight `excerpt` or first paragraph of `content`; project `excerpt`; program `tagline`; privacy the first sentence of the privacy page (constant shared with the page, not a second wording)
- `og:image` = the document `image` when it is an `https://` URL, else `${siteUrl}/logo.svg`
- `<html lang="en">` is already set in `nuxt.config.ts` `app.head`. Do not remove it and do not set a conflicting lang.

Homepage only (`path === '/'`), one `application/ld+json` script whose `innerHTML` is `JSON.stringify` of:

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "name": "Bertelsmann Foundation North America",
      "url": "https://www.bfna.org",
      "logo": "https://www.bfna.org/logo.svg",
      "description": "<home.json excerpt>",
      "email": "info@bfna.org",
      "sameAs": [
        "https://www.linkedin.com/company/bertelsmann-foundation-north-america-inc.",
        "https://www.instagram.com/bertelsmannfoundation/",
        "https://www.facebook.com/BertelsmannFoundation/",
        "https://www.youtube.com/channel/UCZZdgI5F7KjUCW0fCKUOAAg",
        "https://vimeo.com/bfna"
      ],
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Washington",
        "addressRegion": "DC",
        "addressCountry": "US"
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "general inquiries",
        "email": "info@bfna.org"
      }
    },
    {
      "@type": "WebSite",
      "name": "Bertelsmann Foundation North America",
      "url": "https://www.bfna.org"
    }
  ]
}
```

`url`, `logo`, and `WebSite.url` use `siteUrl`. No `streetAddress`, no `postalCode`, no `telephone`. Comment at the top of the plugin:

```ts
// TODO(owner): street address, postal code, and phone are not in v2 content.
// The contact band still renders the Directus placeholder, which is not an address.
// Bluesky in the footer is #bluesky-profile-url and is omitted from sameAs.
// Legal name on the production privacy page is "Bertelsmann Foundation (North America), Inc.";
// v2 copy does not use the Inc. form. Confirm before adding it.
```

Insight routes with a resolved document and a non-null `heading`, a second JSON-LD `Article`:

- `headline` = `heading`
- `url` = canonical
- `description` = the same description string
- `datePublished` = `lastmod(publish_date)` when defined, else omit the key
- `author` = `authors.filter(Boolean).map(name => ({ '@type': 'Person', name }))` when the array is non-empty, else omit. 268 insight rows have an empty `authors` array (`bf-contracts.ts`). Do not write "BFNA" as the author.
- `image` = `image` when it is an `https://` URL, else omit

`useHead` script entry: `{ type: 'application/ld+json', key: 'bf-jsonld', innerHTML: json }`. Two scripts need two keys (`bf-jsonld-org`, `bf-jsonld-article`) so Unhead does not drop one.

## 6 — Metadata

Covered by the plugin plus the existing `app.head` `htmlAttrs.lang` and the existing per-page `useHead({ title })`. Do not add a second title on the homepage. Do not add `robots: noindex` to `useHead` — that would ship in the HTML of the production deploy. Preview noindex is the response header only.

Canonical host is always `siteUrl`, including when the request host is `dev-preview--bfna-site-v2.netlify.app`.

`nuxt.config.ts` `runtimeConfig` is currently `public: {}`. Replace that empty object with:

```ts
runtimeConfig: {
  public: {
    siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://www.bfna.org'
  }
}
```

The plugin reads `useRuntimeConfig().public.siteUrl` and strips one trailing slash. If this line adds a new `error TS` signature on `src/nuxt.config.ts`, revert it and read `process.env.NUXT_PUBLIC_SITE_URL` inside the plugin with the same default. Do not widen the baseline.

## 7 — Privacy, contact, legacy redirect

`/about` already exists and includes `#contact`. The scanner already accepted About and Contact. Do not add `pages/contact.vue` (a second contact form, and a second layout risk).

`/contact` is not a page today (`pages/[program].vue` 404s unknown one-segment slugs). The spec's curl loop requests `/contact` and wants the final status 200. Add a generated redirect, not a page:

In `LEGACY_REDIRECT_EXACT` inside `server/utils/legacy-redirect-rules.ts`:

```ts
'/contact': '/about#contact',
'/privacy-policy': '/privacy',
'/privacy-policy/': '/privacy',
```

`/privacy-policy/` is the production URL (`https://www.bfna.org/privacy-policy/`). The Nitro middleware strips one trailing slash before matching, but production static hosting uses `public/_redirects`, and that file does not. Both keys are required. Then:

```bash
cd bfna-website-nuxt
npm run redirects:generate
npm run redirects:check
```

Expected: `redirects:check` exit 0. Commit the regenerated `public/_redirects` and `server/utils/legacy-slug-map.ts`. Do not edit them by hand.

`src/pages/privacy.vue`:

```vue
<script setup lang="ts">
defineOptions({ name: 'PrivacyPage' })
definePageMeta({ layout: 'bf-default' })
useHead({ title: 'Privacy' })
</script>
```

No `<NuxtLayout>`. No `<style>`. Template follows `about.vue`: `bfPageHeader` with crumbs `[{ label: 'Home', to: '/' }, { label: 'Privacy' }]`, heading `Privacy`, then one `bfSection` of paragraphs. Visible copy (keep it; it is over 500 characters and only states repo facts):

> The Bertelsmann Foundation North America publishes this website as a static collection of pages about its research, programs, projects, and insights.
>
> The site does not run an analytics script, a tag manager, an advertising pixel, or a cookie banner. Nothing in the repository records a visit.
>
> The contact form on the About page asks for a name, an email address, and a message. Submitting it does not send those fields anywhere: the form cancels the submit and there is no form endpoint. To reach the Foundation, email info@bfna.org, the address shown on that page.
>
> Pages load fonts from Google (Newsreader, IBM Plex Sans, and Material Symbols) and load images from bfna.simplyas.com. Your browser requests those hosts while it draws the page. Footer links leave this site for LinkedIn, Instagram, Facebook, YouTube, and Vimeo.
>
> To ask what information the Foundation holds about you, or to ask for a correction, email info@bfna.org.

Add the `TODO(owner)` comment from the JSON-LD section to this file as well, plus: the production HTML policy at `/privacy-policy/` makes GDPR, cookie, and retention claims this repo does not implement; do not paste that policy over this page until the owner confirms it. Do not link `/files/Privacy-Policy.pdf`. The PDF is at `src/public/files/Privacy-Policy.pdf` and that tree does not ship (same reason `/favicon.ico` 404s).

`prerenderRoutes` in `src/nuxt.config.ts`: add `'/privacy'` next to `'/about'`. The footer link also lets `crawlLinks` find it; the explicit entry is what keeps it aligned with the redirect target check.

`Footer.vue` line that is now `href="#"` on "Privacy Policy": change only that attribute to `href="/privacy"`. Leave the wireframe footer alone.

## 10 — API findings (no code)

Not applicable. Say so in the PR. `/docs` and `server/api/component-docs/[component].get.ts` are the internal design-system catalog (`parseComponentDocs`). Do not add OpenAPI, a JSON error API, an MCP server, `/.well-known/mcp`, a sandbox, or a homepage link to `/docs`.

Out of scope, no code: "netlify" brand/discoverability. Those hits come from the `netlify.app` preview host. Canonicals, JSON-LD `url`, `og:url`, and sitemap locs all use `https://www.bfna.org`, which is the hygiene those findings asked for.

## Tests — `scripts/check-agent-readiness.ts`

Import from `../netlify/edge-functions/negotiate` (no `.ts` suffix). Assert, then `process.exit(1)` on the first failure:

| Input | Expected |
|---|---|
| `wantsMarkdown(null)` | false |
| `wantsMarkdown('text/html')` | false |
| `wantsMarkdown('text/markdown')` | true |
| `wantsMarkdown('text/markdown;q=0, text/html')` | false |
| `wantsMarkdown('text/html;q=0.8, text/markdown;q=0.2')` | false |
| `wantsMarkdown('text/html;q=0.5, text/markdown;q=0.9')` | true |
| `wantsMarkdown('text/markdown, text/html')` | false |
| `lastmod('2024-02-26')` | `'2024-02-26'` |
| `lastmod('2024-02-31')` | `undefined` |
| `lastmod('February 26, 2024')` | `undefined` |
| `lastmod(null)` | `undefined` |
| `blocks('One.\n\nTwo.')` | contains `\n\n` |
| `markdown404Body()` | length ≥ 20, includes `/sitemap.xml` and `/llms.txt` and `/` |
| `injectNotFoundHtml('<div id="__nuxt"></div>')` | contains `Page not found` and `href="/llms.txt"` |
| a built sitemap string from a tiny fixture | contains `https://www.bfna.org/privacy`, does not contain `/docs`, `/wireframes`, or `/search` |
| `writeNoindexHeaders` with `CONTEXT` unset | file has `Content-Type: text/markdown` and no `X-Robots-Tag` |
| `CONTEXT=branch-deploy` | file also has `X-Robots-Tag: noindex, nofollow` |
| `CONTEXT=production` | no `X-Robots-Tag` |

The header tests should write to `os.tmpdir()`, not the repo. Restore `process.env.CONTEXT` in a `finally`.

Add to `verify.yml` after `npm ci`, working-directory already `bfna-website-nuxt`:

```yaml
      - name: Agent-readiness unit checks
        run: npx tsx scripts/check-agent-readiness.ts
```

## Order of work

1. From `dev`, confirm the three `test -f` echoes in "Which directory ships". Do not start until `ROOT_REDIRECTS_OK` is true.
2. Add `negotiate.ts` and `scripts/check-agent-readiness.ts`. Run `npx tsx scripts/check-agent-readiness.ts` (exit 0) and `node .github/typecheck-gate.mjs` (PASS). The header tests can land with the writer in step 3 if splitting the commit; the Accept tests must exist before the edge function.
3. Add `write-agent-files.ts`, `server/plugins/agent-files.ts`, and the verify.yml step. Run `npx nuxt generate` (not `npm run generate` — no Directus credentials). Expect `.output/public/sitemap.xml`, `llms.txt`, `robots.txt`, `index.md`, `about.md`, `privacy.md` absent until step 6, `insights/<some-slug>.md` containing a blank line, and `_headers` **without** `X-Robots-Tag` because `CONTEXT` is unset. `grep -i -A5 'when to use' .output/public/llms.txt` prints the section. `grep docs .output/public/sitemap.xml` prints nothing.
4. Add `markdown.ts` and `netlify.toml` exactly as above. No second registration.
5. Add `public/logo.svg` and `src/plugins/seo.ts`. Run the typecheck gate again.
6. Add `privacy.vue`, the footer href, `/privacy` in `prerenderRoutes`, the three redirect keys, `npm run redirects:generate`. Delete `src/public/robots.txt`.
7. `npm run redirects:check` exit 0. `npx nuxt generate` exit 0. `node .github/typecheck-gate.mjs` PASS. `npx tsx scripts/check-agent-readiness.ts` exit 0.
8. Route and link gates, from `bfna-website-nuxt`, after that generate:

```bash
npx tsx scripts/check-routes.ts
npx --yes serve@14 --no-clipboard --no-port-switching -l 3000 .output/public
npx tsx scripts/check-links.ts
```

`check-routes` needs the headless Chrome shell CI uses (`CHROME_PATH`). Expect the existing DoD-A9 lang row to stay green (privacy is a normal prerendered page; `app.head` sets `lang`). Expect `/privacy` 200 from the static server. The edge function does **not** run under `serve`. Do not fail the task because `curl -H 'Accept: text/markdown' http://127.0.0.1:3000/` returns HTML. That curl is a deploy check.

9. Deploy preview (Netlify, branch deploy or deploy preview, not production). Then:

```bash
ORIGIN=https://<preview-host>

curl -sS -D- -o /tmp/md-home.txt -H 'Accept: text/markdown' "$ORIGIN/"
curl -sS -D- -o /tmp/html-home.txt -H 'Accept: text/html' "$ORIGIN/"
curl -sS -D- -o /tmp/md-404.txt -H 'Accept: text/markdown' "$ORIGIN/some-path-that-does-not-exist"
curl -sS -D- -o /tmp/html-404.txt -H 'Accept: text/html' "$ORIGIN/some-path-that-does-not-exist"
curl -sS -D- -o /tmp/sitemap.xml "$ORIGIN/sitemap.xml"
curl -sS -D- -o /tmp/llms.txt "$ORIGIN/llms.txt"
curl -sS -D- -o /tmp/robots.txt "$ORIGIN/robots.txt"
for p in about contact privacy; do curl -sS -L -o /dev/null -w "$p %{http_code}\n" "$ORIGIN/$p"; done
curl -sS -L "$ORIGIN/llms.txt" | grep -i -A5 'when to use'
```

Expected:

| Check | Result |
|---|---|
| Markdown homepage | final status 200, `content-type` includes `text/markdown`, `vary` includes `accept` (any case), body starts with `#` and is not HTML |
| HTML homepage | final status 200, `content-type` includes `text/html`, body contains `<html` and does not contain `text/markdown` as the content type. `vary` includes `accept`. Page still shows the existing hero |
| Markdown 404 | final status **404** (not 200), `content-type` includes `text/markdown`, body includes `Page not found`, `/sitemap.xml`, and `/llms.txt` |
| HTML 404 | final status 404, body includes `Page not found` and `href="/"` even with JS off |
| Neither curl | status 508 |
| sitemap | 200, `application/xml` or `text/xml`, contains `https://www.bfna.org/privacy`, does not contain `/docs` or `/wireframes` or `/search` |
| llms.txt | 200, body is the markdown, not the homepage HTML, length > 100, `when to use` section present |
| robots.txt | 200, contains `Disallow: /docs/`, `Disallow: /wireframes/`, `Disallow: /search`, and `Sitemap: https://www.bfna.org/sitemap.xml` |
| Preview responses | `x-robots-tag` includes `noindex` |
| about, contact, privacy | `200` each. `contact` is the redirect to `/about#contact` (curl `-L` ends on `/about`). Privacy HTML text is longer than 500 characters |
| Homepage HTML | `<html lang="en">`, `<link rel="canonical" href="https://www.bfna.org/">` or `https://www.bfna.org`, `og:image`, `og:type` = `website`, a JSON-LD `Organization` with `contactPoint` and `address` |
| An insight with `authors` and `publish_date` | JSON-LD `Article` with `datePublished` and `author` |
| An insight with `"authors": []` | no invented author |

Production deploy (`CONTEXT=production`) must not send `X-Robots-Tag: noindex`. Say that in the PR so nobody "fixes" the preview by baking noindex into the HTML.

## PR text the implementer should use

Against `dev`. Reference #295 as related, not as the base. Do not push to `cursor/a11y-final-issues-fb39`.

State:

- Per finding, what changed (sections 1–9 above).
- Not applicable: OpenAPI, JSON error API, MCP, public API, sandbox, homepage link to `/docs`. Reason: design-system docs only.
- No code for the "netlify" discoverability findings.
- Preview noindex is a generated `_headers` block plus the edge header, only when `CONTEXT !== 'production'`. Canonicals stay on `https://www.bfna.org`.
- `TODO(owner)` list: street address, postal code, phone, Bluesky URL, whether the legal name includes "Inc.", whether the production `/privacy-policy/` text should replace the v2 page, retention period. None of these are visible on the site.
- `/contact` is a 301 to `/about#contact`, not a new page.
- 404 titles were not edited, so #295's #231 work is untouched. Rebase if `error.vue` or `insights/[slug].vue` conflicts; do not re-apply a title change.
