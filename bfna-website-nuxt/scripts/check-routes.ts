/**
 * Route harness — gh#68, the successor to `check-probes.ts`.
 *
 *   npx nuxt generate
 *   npx tsx scripts/check-routes.ts              # every route in BRIEF §7
 *   npx tsx scripts/check-routes.ts --only /about
 *
 * ## Why this file has two names in its history
 *
 * It began as `scripts/check-probes.ts` (gh#109, residual #106): every `bf-*`
 * probe page ran its load-bearing assertions in `onMounted` and painted a
 * verdict nobody read, so half of every issue's acceptance ran only when a
 * human opened the page. gh#200 then bolted a **smoke set** onto it — eight
 * real routes, opened under a console gate — because #199 was a hydration
 * mismatch in the shared shell that no probe could ever have caught: a probe
 * composes `bf-probe`, not `bf-default`.
 *
 * gh#68 deletes `src/pages/bf-probe/` per BRIEF §5, which retires the probe
 * half entirely. What is left is the half that was always about the shipped
 * site, widened from eight routes to every route BRIEF §7 promises, plus the
 * checks the probes used to make on the site's behalf. gh#200 was deliberately
 * sequenced before the cutover so this gate would already exist at the commit
 * that most needs it; `check-probes.ts` even said so in a comment. This is that
 * commit.
 *
 * ## What each route must satisfy
 *
 * 1. **It hydrated.** `document.readyState === 'complete'` **and**
 *    `document.getElementById('__nuxt').__vue_app__` exists. The second half is
 *    load-bearing: a prerendered page whose entry chunk 404s stays as static
 *    HTML, looks perfect, and would pass a console-only check by having nothing
 *    to say.
 * 2. **It said nothing at `error` level.** Both channels are read, and neither
 *    is redundant — `Runtime.consoleAPICalled` for what the page says (Vue's
 *    `Hydration completed but contains mismatches.` lands here, and it is a
 *    `console.error` and nothing else: no build fails, no assertion breaks, and
 *    the page still looks right while Vue throws the server markup away), and
 *    `Log.entryAdded` for what the *browser* says (a 404 on a `/_nuxt/*.js`
 *    chunk, which the page never hears about).
 * 3. **Exactly one `<h1>`.** BRIEF §5 rule 9, WCAG 2.1 AA. Counted in the
 *    hydrated DOM rather than by grepping the HTML, so a heading a component
 *    renders only on the client is counted too.
 * 4. **Every `/_ipx/…` URL in its prerendered HTML has a file behind it**
 *    (gh#203) — `src` and `srcset` alike. `@nuxt/image` falls back to the `ipx`
 *    provider whenever `NUXT_IMAGE_PROVIDER` is unset, and `ipx` is a runtime
 *    image server this static deploy does not have. For a **local** source that
 *    is harmless: the prerenderer transforms the file and writes the result to
 *    disk, so the URL resolves. For a **remote** one it cannot — nothing is
 *    written, the URL returns `200 text/plain` from the SPA fallback, and the
 *    photo is simply broken. So the rule is existence, not absence: banning the
 *    substring would ban the image module itself, while requiring a file
 *    distinguishes the two cases exactly.
 *
 * ## What it reports without failing
 *
 * **Placeholder anchors.** `href="#…"` links that go nowhere — the site chrome
 * still carries `#podcast-platform-url`, `#transponder-magazine-url` and
 * `#bluesky-profile-url` because the real URLs are a content question waiting
 * on the client (#160, #82). They are listed on every run, by route and by
 * href, so they cannot be forgotten; they are **not** failures, because a gate
 * that fails on work assigned to somebody else is a gate people learn to skip.
 * A fragment that names a real element on the page is not reported at all — a
 * program hub's `#projects` and `/about#board` are working in-page links, and a
 * report that cried wolf about them would be one nobody read.
 *
 * ## The gates that are not per-route
 *
 * **DoD-3 — every §7 route is reachable from the menus.** BRIEF §2 requires
 * each route in §7 to be linked from `bfNav` or `bfFooter`, with no orphans.
 * Asserted from the *rendered* home page rather than from `menus.json`, because
 * the question is whether a visitor can get there: the two detail templates are
 * reachable one hop further on, from their own list page, which is how a
 * detail route is supposed to be reached and is checked as such.
 *
 * **The cascade-layer gate.** Every compiled stylesheet under
 * `.output/public/_nuxt/` that carries a `bf-*` component rule must keep it
 * inside an `@layer components { … }` block. This is residual #98 / gh#101:
 * `postcss-preset-env` at `stage: 1` enables a cascade-layers polyfill that
 * rewrites each SFC stylesheet in isolation, cannot see the layer-order
 * statement in `public/css/styles.css`, and flattens the `@layer components`
 * wrapper into unlayered rules — which outrank every layer, so a `utils` or
 * `overrides` rule could never outrank a component. `nuxt.config.ts` sets
 * `features: { 'cascade-layers': false }` for exactly that reason, and
 * `verify-bf-logo.ts` §7 used to be what stopped anyone turning it back on.
 * That script read a probe page and retired with the probes, so the guard moves
 * here — generalised from `.bf-logo` to every `bf-*` rule, which is strictly
 * stronger than what it replaces.
 *
 * **DoD-A9 — `lang` on every prerendered page** (a11y epic, gh#217). Every
 * `*.html` under `.output/public` must carry a non-empty `lang` on its `<html>`
 * element. Not a per-route row, because the route list above is the nine BRIEF
 * §7 routes and the acceptance is phrased over *every* prerendered route:
 * `/docs/**` renders `layouts/docs-layout.vue`, which makes no `useHead` call,
 * and shipped no `lang` at all while the declaration lived in the two layouts
 * that happened to set it. It now lives in `nuxt.config.ts` `app.head`, and this
 * gate is what stops it drifting back out.
 *
 * **DoD-A4 — lists are lists** (a11y epic, gh#220). Two halves, because the
 * acceptance sentence has two. The **per-route** half runs in the browser and
 * is the accurate one: every `ul`/`ol` in the hydrated DOM whose *computed*
 * `list-style-type` is `none` must carry `role="list"`. Computed, not grepped —
 * `public/css/base/reset.css` strips the marker from every `ul[class]`/
 * `ol[class]` today, but a component that reaches the same state some other way
 * (`SearchShell.vue` sets `list-style: none` on its own `<ol>`) is the same
 * defect and this notices it without being told. The **whole-build** half is
 * the wide net: every prerendered `*.html` is scanned for an opening
 * `<ul>`/`<ol>` that carries a `class` and no `role`, which is exactly the
 * selector `reset.css` matches, across all ~430 bf pages rather than the nine
 * the browser loop visits. Both rows print how many lists they inspected, so
 * neither can pass by finding nothing.
 *
 * Why the role is needed at all: WebKit treats an author `list-style: none` as
 * a statement that the element is no longer meant as a list and drops the
 * implicit `list` role, so VoiceOver stops announcing "list, N items" and stops
 * offering list navigation. That behaviour **is not verifiable from this
 * harness** — there is no Safari and no screen reader on the runner (a11y BRIEF
 * §0.2). What is asserted here is the structural condition only; the
 * announcement is the manual AT pass in BRIEF §8. The diagnosis is the repo's
 * own, written at `Breadcrumb.vue:238-240` and `nav/Dropdown.vue:109-117`.
 *
 * `/wireframes/**` and `/docs/**` are excluded from the whole-build half, and
 * the exclusion is a scope fact rather than a convenience: the wireframes are
 * frozen by BF-217 D2 and byte-guarded by site-epic DoD-4, so a gate that
 * failed on them would fail on markup no issue is allowed to change; `/docs/**`
 * renders `components/ds/**`, which a11y BRIEF §7 puts out of this epic pending
 * the site-epic #88 keep-or-delete call. Both are named in the row's own detail
 * string so the exclusion is visible on every run.
 *
 * **Decorative glyphs stay out of accessible names** (a11y epic, gh#221). Two
 * whole-build halves for one defect. In `.output/public/css/**`, every
 * `content:` that emits a literal glyph — or assembles one from a `var()` hook —
 * carries the `/ <string>` alternative-text form, the idiom this repo already
 * uses at `Breadcrumb.vue:207` and `nav/Dropdown.vue:189`. In the prerendered
 * HTML, no arrow glyph sits inside an `<a>`'s text unless it is inside an
 * `aria-hidden="true"` element, the idiom at `CardProject.vue:194`. The second
 * half is what makes the first trustworthy at the call sites: a glyph arriving
 * from `assets/bf-data/*.json` rather than from a template still fails. Neither
 * half claims anything about what a screen reader announces — there is no AT and
 * no WebKit on this runner (a11y BRIEF §0.2); the announcement is the manual
 * pass in BRIEF §8. `/wireframes/**` and `/docs/**` are excluded on the same
 * terms as DoD-A4, and `wireframe.css` and `css-legacy/` on the CSS side.
 *
 * **DoD-A3 (first half) — every `<img>` states an `alt`** (a11y epic, gh#222).
 * One whole-build row over the prerendered HTML: no `<img>` opening tag may
 * lack an `alt` attribute. It is the output-side half of a pair whose type-side
 * half is `MediaProps.alt` being required — gh#222 deleted the
 * `:alt="alt ?? ''"` coercion in `Media.vue` that had been marking every
 * unnamed content image decorative, and the compile error binds the call sites
 * this repo owns while this row binds anything that reaches the HTML another
 * way (Directus rich-text body content, a hand-written template). It asserts
 * **presence, not correctness**: whether a given `alt=""` is honest is a
 * content question — the strings are Irene's, #234 ships the field (a11y BRIEF
 * D28, §8), and the `alt`-duplicates-the-`h1` invariant is #110's. The row
 * prints the empty/non-empty split so the share still waiting on #234 is
 * visible on a green run. `/wireframes/**` and `/docs/**` are excluded on the
 * same terms as DoD-A4.
 *
 * **The error page announces, prerendered empty states do not** (a11y epic,
 * gh#224). `bfEmptyState` gains an `announced` prop rendering `role="status"`,
 * and both halves of it are asserted: the positive one drives a **client-side
 * navigation** to `/this-page-does-not-exist` through the running app's own
 * router — the case the prop exists for, and the only way to reach it, because
 * `nuxt generate` writes `error.vue` to `404.html` as a client-only shell
 * (`data-ssr="false"`, empty `#__nuxt`, no `<main>`), so there is nothing to
 * grep. The negative one is a whole-build read: no prerendered `.bf-empty-state`
 * carries `role="status"`, because a live region present at first paint that
 * never updates is noise in the accessibility tree, and that row is what stops
 * the prop's default being flipped to `true` later. Neither claims anything
 * about what a screen reader says (BRIEF §0.2, §8). `/search`'s
 * `display: none` count region is #233's, not this gate's.
 *
 * **DoD-A6 — "Load more" never drops focus to `<body>`** (a11y epic, gh#225).
 * `/insights` is opened in its own target and its "Load more" is driven to
 * exhaustion with real `Input.dispatchMouseEvent` press/release pairs — not
 * `el.click()`, and no programmatic `.focus()` anywhere, which BRIEF §5 rules
 * out as a measurement of focus. `document.activeElement !== document.body` is
 * asserted after every click; the exhausted button must still be mounted,
 * `aria-disabled="true"` and *not* natively `disabled` (a native one blurs the
 * focused element exactly as an unmount does); and the `role="status"` region
 * must still be mounted, not `display: none`, and reading `Showing N of N
 * items`. A non-vacuity row fails the group if the walk never found an
 * interactive button to click.
 *
 * **D29 — the result-count region is mounted and exposed** (a11y epic, gh#226).
 * `bfSearchShell`'s count line became the `bfResultCount` atom, and the
 * property that made it worth extracting is asserted on `/search?q=democracy`:
 * one `[data-bf-search-shell="count"]`, which is the atom and still carries the
 * shell's class, `role="status"` with **neither** `aria-live` nor
 * `aria-atomic`, not `display: none` / `visibility: hidden` / `[hidden]`, and
 * the sentence unchanged with its noun agreeing with its number. A non-vacuity
 * row fails the group if the probe's query matched nothing, because every row
 * above it would pass against an empty result set. Idle `/search` is read for
 * one thing only — the region is still **mounted** with `role="status"` — and
 * its computed `display` is printed rather than judged: it is `none` because
 * `pages/search.vue` says so, and removing that override is **#233's** row, not
 * this gate's.
 *
 * **The search landmark and its form** (a11y epic, gh#227). `/search` measured
 * zero `[role=search],search` elements and zero `<form>`s, so the region was
 * unreachable by landmark and Enter in the query field did nothing. The group
 * asserts the structure — exactly one landmark, and it is `bfSearchShell`'s
 * `<search role="search">.bf-search-shell` root; exactly one non-nested
 * `<form>`; the query input's form **owner** is that form (ownership, not
 * containment, is what implicit submission is defined against); the visible
 * `<label for>` survives; one `[type="submit"]` — and then drives it with real
 * input events: a mouse press to focus, `Input.insertText` with **no** Enter to
 * prove the debounced live filtering still writes `?q=`, then a real Enter
 * keypress that must fire exactly one `submit`, be `defaultPrevented`, leave a
 * `window` marker alive (a full navigation would clear it), carry the typed
 * text into the URL, and leave focus still in the query field (DoD-A6 on the
 * one transition this row adds). No `el.click()` and no programmatic `.focus()`
 * anywhere (a11y BRIEF §5). A non-vacuity row fails the group if the press
 * never focused the input.
 *
 * **Composite-widget roles and the two-way disclosure** (a11y epic, gh#228).
 * Two independent halves under one group.
 *
 * `/insights` measured a roving tabindex — `0/-1/-1/-1` per facet row — under a
 * plain `role="group"`, a role that declares no such contract, so six of the
 * seven chips were out of the tab order with nothing telling assistive
 * technology why. The gate asserts **coherence** rather than one shape: every
 * chip may be tabbable under any role, or chips may be `-1` **only** under a
 * role that owns a roving tabindex (`toolbar`, `radiogroup`, `listbox`, `grid`,
 * `menubar`, `tablist`, `tree`). That keeps both of D30's exits open and closes
 * the incoherent middle. On top of it: a **real Tab walk** — a `focusin`
 * recorder plus batches of real `Tab` presses from a fresh load — must reach
 * every chip; a real `ArrowRight` from a chip must still move focus; the two
 * bars' `aria-labelledby` must still resolve to different non-empty visible
 * captions (`insights/index.vue` wires them, and a roving-tabindex fix that
 * dropped them would be a net loss); and every chip must still carry
 * `aria-pressed`.
 *
 * `bfAccordion`'s `open` was a one-way binding with no emit, so a consumer
 * could not hold the reader's disclosure state and any render that re-created
 * the subtree wrote the initial state back over them (WCAG 3.2.2). The wiring
 * half is asserted from source — `Accordion.vue` must declare `update:open`
 * and listen for the native `toggle`, and `archive.vue` must bind the event —
 * because the runtime difference is not observable in a production build:
 * `__vueParentComponent` and `__vnode` are dev-only, and Vue's own vnode diff
 * skips an unchanged `open`, so a one-way binding and a two-way one behave
 * identically until something remounts. The behavioural half is still driven
 * with real keys and catches every regression that *is* observable: a real
 * `Enter` on the first `<summary>` must close it, a `Tab` (which only reaches
 * the second summary because the closed first band took its rows out of the
 * tab order — native `<details>`, D30) and a real `Enter` must open the second,
 * and then `Shift`+`Tab` back to the first summary and a third real `Enter` —
 * a genuine parent re-render once the binding is two-way — must leave the
 * second band open. That is the row that would catch an accordion fighting the
 * native toggle, or a two-way binding that loops or inverts.
 *
 * **DoD-A8 — the reduced-motion floor** (a11y epic, gh#218). The served
 * `.output/public/css/base/reset.css` must carry a `prefers-reduced-motion:
 * reduce` block that sets `@view-transition { navigation: none }` and caps
 * `transition-duration` and `animation-duration`. Read from the build output
 * rather than the source tree for the same reason as the cascade-layer gate:
 * `public/css` reaches the output through a copy step and a symlink, and a
 * source-tree grep would stay green through a build that shipped none of it.
 *
 * ## Known limit, stated rather than rediscovered
 *
 * Vue hydrates a `createStaticVNode` subtree by advancing the node pointer
 * without comparing its content, so a mismatch confined to compiler-hoisted
 * static markup emits nothing on any channel. Verified while gh#200 built this
 * gate: patching a static text node in a prerendered page produced silence,
 * patching the adjacent dynamic one produced the message. The gate catches
 * every mismatch that reaches a dynamic node, which is every mismatch #199 was
 * about.
 *
 * ## Exit contract
 *
 * `0` only when every route hydrated, carried exactly one `h1`, had no dangling
 * `/_ipx/` URL and logged no console error; when every §7 route is reachable
 * from the menus; when no compiled stylesheet lost its `@layer` wrapper; when
 * every prerendered page carries a non-empty `lang`; when the served
 * reset stylesheet carries the reduced-motion floor; when no marker-less
 * `ul`/`ol` is missing its `role="list"`, per route and across the build; and
 * when no decorative glyph — generated or literal — can reach an accessible
 * name.
 * Placeholder anchors are reported and do not affect the exit code. A route
 * that could not be evaluated is a **failure**, never a skip — a verification
 * that quietly downgrades itself to "PASS (1 skipped)" is exactly how a broken
 * page ships green.
 *
 * ## Driver
 *
 * Raw Chrome DevTools Protocol over Node's built-in global `WebSocket`, with no
 * new dependency. Playwright and Puppeteer are absent from `package.json`, and
 * `jsdom` — which is present — has no layout engine. The executable is resolved
 * from `$CHROME_PATH`, then the local `ms-playwright` cache, then Chrome /
 * Chromium / Edge. Rationale in `docs/decisions/probe-harness.md`.
 *
 * ## Flags
 *
 *   --only <route>     run a single route (`--only /about`). Skips every
 *                      whole-build gate below — they are statements about the
 *                      build, not about a route, and a one-route run is a
 *                      debugging tool rather than the gate.
 *   --timeout <ms>     per-route budget for reaching a hydrated state
 *   --port <n>         pin the static server port (default: a free one)
 *   --viewport <WxH>   layout viewport (default 1280x1024)
 *   --ignore-console   regex; console text matching it is not a failure
 *   --verbose          print every row, not just the failing ones
 */
import { spawn, type ChildProcess } from 'node:child_process'
import { createReadStream, existsSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { createServer, type Server } from 'node:http'
import { homedir, tmpdir } from 'node:os'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = join(appRoot, '.output/public')
const contentDir = join(appRoot, 'content/bf')
const builtCssDir = join(publicDir, '_nuxt')

/* ------------------------------------------------------------------ *
 * Arguments
 * ------------------------------------------------------------------ */
const argv = process.argv.slice(2)

const flag = (name: string): string | undefined => {
  const i = argv.indexOf(`--${name}`)
  if (i === -1) return undefined
  const value = argv[i + 1]
  if (value === undefined || value.startsWith('--')) {
    console.error(`--${name} needs a value`)
    process.exit(2)
  }
  return value
}

const num = (raw: string | undefined, fallback: number): number => {
  if (raw === undefined) return fallback
  const value = Number(raw)
  if (!Number.isFinite(value) || value < 0) {
    console.error(`expected a number, got "${raw}"`)
    process.exit(2)
  }
  return value
}

const only = flag('only')
const timeoutMs = num(flag('timeout'), 20_000)
const pinnedPort = num(flag('port'), 0)

/**
 * An escape hatch for console noise that is the *environment's*, not the
 * build's — the shell links one third-party stylesheet
 * (`fonts.googleapis.com`), and a gate with no way to say "not that one" turns
 * a network hiccup on someone's laptop into a merge blocker.
 *
 * Empty by default, so the committed behaviour is strict and reaching for this
 * is a visible act on a command line rather than a quiet default. Compiled
 * without flags on purpose: a `/g/` regex carries `lastIndex` between calls and
 * would match every *other* line.
 */
const ignoreConsole = (() => {
  const raw = flag('ignore-console')
  if (raw === undefined) return undefined
  try {
    return new RegExp(raw)
  } catch (error) {
    console.error(`--ignore-console is not a valid regex: ${(error as Error).message}`)
    process.exit(2)
  }
})()

/**
 * The layout viewport, set explicitly rather than inherited from the browser's
 * default window. A zero-size viewport — which some embedded browser panes
 * report — collapses the nav into a state where its links are not rendered at
 * all, which would fail the reachability gate on a build that is fine.
 */
const viewport = (() => {
  const raw = flag('viewport') ?? '1280x1024'
  const match = raw.match(/^(\d+)x(\d+)$/)
  if (!match) {
    console.error(`--viewport expects <width>x<height>, got "${raw}"`)
    process.exit(2)
  }
  return { width: Number(match[1]), height: Number(match[2]) }
})()
const verbose = argv.includes('--verbose')

if (!existsSync(publicDir)) {
  console.error(`No prerendered output at ${publicDir}.\nRun \`npx nuxt generate\` first (not \`npm run generate\` — that one needs Directus secrets).`)
  process.exit(1)
}

/* ------------------------------------------------------------------ *
 * The route set — BRIEF §7
 * ------------------------------------------------------------------ */
/** The document stems of one `content/bf/*` collection; the stem is the slug. */
const collectionSlugs = (collection: string): string[] => {
  try {
    return readdirSync(join(contentDir, collection), { withFileTypes: true })
      .filter(entry => entry.isFile() && entry.name.endsWith('.json'))
      .map(entry => entry.name.replace(/\.json$/, ''))
      .sort()
  } catch {
    return []
  }
}

/**
 * The first alphabetical child of `<dir>` in the prerendered output that is a
 * real page. Sorted, so two runs on the same build pick the same route and a
 * failure is reproducible from its own output; `index.html` rather than mere
 * directory existence, because `insights/` also holds `_payload.json` files.
 */
const firstPageUnder = (dir: string): string | undefined => {
  const root = join(publicDir, dir)
  if (!existsSync(root)) return undefined
  return readdirSync(root)
    .sort()
    .find(name => existsSync(join(root, name, 'index.html')))
}

/**
 * Every route BRIEF §7 promises, one representative per detail template.
 *
 * Deliberately not all 409 detail pages: opening each in a real browser would
 * take twenty minutes to re-assert one template. Their *existence* is the
 * prerender gate's job (`nuxt.config.ts` seeds them from the same content this
 * reads, and `verify-legacy-redirects.ts --targets` asserts every redirect
 * lands on a real file); their *rendering* is one template, exercised once.
 *
 * The two detail slugs come from `.output/public` rather than from a constant,
 * for the reason the probe list used to be read from disk: a hard-coded slug
 * rots the first time content moves, and it rots silently, as a 404 the gate
 * would then dutifully report as a console error on a build that is fine.
 */
const routeSet = ((): string[] => {
  const insight = firstPageUnder('insights')
  const project = firstPageUnder('projects')
  return [
    '/',
    ...collectionSlugs('programs').map(slug => `/${slug}`),
    '/insights',
    ...(insight === undefined ? [] : [`/insights/${insight}`]),
    '/projects',
    ...(project === undefined ? [] : [`/projects/${project}`]),
    '/about',
    '/search',
    '/archive'
  ]
})()

const routes = only === undefined ? routeSet : routeSet.filter(r => r === only)

if (routes.length === 0) {
  console.error(`--only ${only} matched no route. Available: ${routeSet.join(', ')}`)
  process.exit(2)
}

/* ------------------------------------------------------------------ *
 * Static server over .output/public
 * ------------------------------------------------------------------ */
const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8'
}

/** Resolve a request path inside `.output/public`, refusing to escape it. */
const resolveFile = (urlPath: string): string | undefined => {
  const clean = decodeURIComponent(urlPath.split('?')[0]!.split('#')[0]!)
  const candidate = resolve(publicDir, `.${clean}`)
  if (candidate !== publicDir && !candidate.startsWith(`${publicDir}/`)) return undefined

  for (const path of [candidate, join(candidate, 'index.html'), `${candidate}.html`]) {
    if (existsSync(path) && statSync(path).isFile()) return path
  }
  return undefined
}

const server: Server = createServer((req, res) => {
  const file = resolveFile(req.url ?? '/')
  if (!file) {
    res.writeHead(404, { 'content-type': 'text/plain' })
    res.end('not found')
    return
  }
  res.writeHead(200, {
    'content-type': MIME[extname(file).toLowerCase()] ?? 'application/octet-stream',
    'cache-control': 'no-store'
  })
  createReadStream(file).pipe(res)
})

const listen = (): Promise<number> =>
  new Promise((ok, fail) => {
    server.once('error', fail)
    server.listen(pinnedPort, '127.0.0.1', () => {
      const address = server.address()
      if (address === null || typeof address === 'string') {
        fail(new Error('static server bound to a non-TCP address'))
        return
      }
      ok(address.port)
    })
  })

/* ------------------------------------------------------------------ *
 * Chrome
 * ------------------------------------------------------------------ */
/** Newest-first, so a cache holding several builds picks the current one. */
const playwrightShells = (): string[] => {
  const cache = join(homedir(), 'Library/Caches/ms-playwright')
  const linux = join(homedir(), '.cache/ms-playwright')
  const roots = [cache, linux].filter(d => existsSync(d))
  const found: string[] = []
  for (const root of roots) {
    const dirs = readdirSync(root)
      .filter(d => d.startsWith('chromium_headless_shell-') || d.startsWith('chromium-'))
      .sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]))
    for (const d of dirs) {
      found.push(
        join(root, d, 'chrome-headless-shell-mac-arm64/chrome-headless-shell'),
        join(root, d, 'chrome-headless-shell-linux/chrome-headless-shell'),
        join(root, d, 'chrome-mac/Chromium.app/Contents/MacOS/Chromium'),
        join(root, d, 'chrome-linux/chrome')
      )
    }
  }
  return found
}

const chromeCandidates = (): string[] =>
  [
    process.env.CHROME_PATH,
    ...playwrightShells(),
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser'
  ].filter((p): p is string => typeof p === 'string' && p.length > 0)

const findChrome = (): string => {
  const tried = chromeCandidates()
  const hit = tried.find(p => existsSync(p))
  if (hit === undefined) {
    console.error(
      'No headless Chrome found. Set $CHROME_PATH to a Chrome/Chromium binary.\nTried:\n'
      + tried.map(p => `  ${p}`).join('\n')
    )
    process.exit(1)
  }
  return hit
}

const launchChrome = async (executable: string): Promise<{ child: ChildProcess, wsUrl: string, profile: string }> => {
  const profile = await mkdtemp(join(tmpdir(), 'bf-routes-chrome-'))
  const headlessShell = /headless-shell/.test(executable)
  const args = [
    ...(headlessShell ? [] : ['--headless=new']),
    '--remote-debugging-port=0',
    `--user-data-dir=${profile}`,
    '--window-size=1280,1024',
    '--disable-gpu',
    '--no-sandbox',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--disable-background-networking',
    '--disable-sync',
    '--disable-default-apps',
    '--hide-scrollbars',
    '--mute-audio',
    'about:blank'
  ]

  const child = spawn(executable, args, { stdio: ['ignore', 'ignore', 'pipe'] })

  const wsUrl = await new Promise<string>((ok, fail) => {
    let buffer = ''
    const timer = setTimeout(() => fail(new Error(`Chrome did not report a DevTools endpoint within 20s.\n${buffer.slice(-500)}`)), 20_000)
    child.stderr?.setEncoding('utf8')
    child.stderr?.on('data', (chunk: string) => {
      buffer += chunk
      const match = buffer.match(/DevTools listening on (ws:\/\/\S+)/)
      if (match) {
        clearTimeout(timer)
        ok(match[1]!)
      }
    })
    child.once('error', err => { clearTimeout(timer); fail(err) })
    child.once('exit', code => { clearTimeout(timer); fail(new Error(`Chrome exited with code ${code} before listening.\n${buffer.slice(-500)}`)) })
  })

  return { child, wsUrl, profile }
}

/* ------------------------------------------------------------------ *
 * Minimal CDP client (Node 24 ships a global WebSocket)
 * ------------------------------------------------------------------ */
type Pending = { ok: (value: unknown) => void, fail: (reason: Error) => void }

/** A CDP `RemoteObject`, in the one shape a console argument can arrive as. */
type RemoteObject = { value?: unknown, description?: string, unserializableValue?: string, type?: string }

/**
 * One `console.error(...)` call, flattened to a line.
 *
 * Deliberately lossy: primitives print as themselves, objects as the
 * `description` Chrome already computed (`Error: …`, `TypeError: …`), and
 * anything else as its type name. Deep-previewing an argument would need
 * `Runtime.getProperties` round-trips per object, and a gate whose failure
 * message needs three more protocol calls is a gate that fails while the
 * browser is dying.
 */
const describeConsoleArgs = (args: RemoteObject[]): string =>
  args
    .map(a =>
      a.value !== undefined
        ? String(a.value)
        : a.description ?? a.unserializableValue ?? `<${a.type ?? 'unknown'}>`
    )
    .join(' ')
    .trim()

class Cdp {
  private readonly socket: WebSocket
  private nextId = 1
  private readonly pending = new Map<number, Pending>()

  /**
   * Page-level exceptions, so a route that dies on load says why. Cleared
   * between routes — a note quoting the *previous* page's exception is worse
   * than no note at all.
   */
  exceptions: string[] = []

  /**
   * Console-level errors from the page under test (gh#200). Cleared between
   * pages for the same reason `exceptions` is.
   *
   * Deduplicated on the way in. Vue logs its hydration message once, but a
   * broken image in a 256-row list logs 256 identical lines, and a failure
   * report that is 256 copies of one sentence hides the second, different one.
   */
  consoleErrors: string[] = []

  /**
   * The page currently under test.
   *
   * Events carry the session they came from; without this the client would
   * attribute anything a *closing* target still flushes to whichever page is
   * opened next. `undefined` means "listening to nothing", which is the honest
   * state between pages.
   */
  watching: string | undefined

  private note(text: string): void {
    const clean = text.trim()
    if (clean === '') return
    if (ignoreConsole?.test(clean)) return
    if (!this.consoleErrors.includes(clean)) this.consoleErrors.push(clean)
  }

  private constructor(socket: WebSocket) {
    this.socket = socket
    this.socket.addEventListener('message', event => {
      const message = JSON.parse(String((event as MessageEvent).data)) as {
        id?: number
        result?: unknown
        error?: { message: string }
        method?: string
        sessionId?: string
        params?: Record<string, unknown>
      }
      if (typeof message.id === 'number') {
        const waiter = this.pending.get(message.id)
        this.pending.delete(message.id)
        if (!waiter) return
        if (message.error) waiter.fail(new Error(message.error.message))
        else waiter.ok(message.result)
        return
      }
      /* Only the page under test speaks; see `watching`. */
      if (this.watching !== undefined && message.sessionId !== this.watching) return

      if (message.method === 'Runtime.exceptionThrown') {
        const details = (message.params?.exceptionDetails ?? {}) as { text?: string, exception?: { description?: string } }
        this.exceptions.push(details.exception?.description ?? details.text ?? 'unknown exception')
        return
      }

      /* What the page says — Vue's hydration message arrives here (gh#200). */
      if (message.method === 'Runtime.consoleAPICalled') {
        const params = (message.params ?? {}) as { type?: string, args?: RemoteObject[] }
        if (params.type === 'error' || params.type === 'assert') {
          this.note(describeConsoleArgs(params.args ?? []))
        }
        return
      }

      /*
       * What the *browser* says — a 404 on a `/_nuxt/*.js` chunk, a blocked
       * subresource, a CSP violation. The page never hears about any of them,
       * so `Runtime.consoleAPICalled` alone would report a build with a missing
       * entry chunk as perfectly quiet.
       */
      if (message.method === 'Log.entryAdded') {
        const entry = ((message.params ?? {}).entry ?? {}) as { level?: string, text?: string, url?: string }
        if (entry.level === 'error') {
          this.note(`${entry.text ?? 'unknown log entry'}${entry.url === undefined ? '' : ` — ${entry.url}`}`)
        }
      }
    })
  }

  static connect(url: string): Promise<Cdp> {
    return new Promise((ok, fail) => {
      const socket = new WebSocket(url)
      socket.addEventListener('open', () => ok(new Cdp(socket)))
      socket.addEventListener('error', () => fail(new Error(`could not open a CDP socket at ${url}`)))
    })
  }

  /**
   * Every call is bounded. Without this a Chrome that dies mid-run leaves the
   * promise pending forever and the harness hangs instead of failing — the one
   * outcome a verification script must never have.
   */
  send<T = Record<string, unknown>>(method: string, params: Record<string, unknown> = {}, sessionId?: string): Promise<T> {
    const id = this.nextId++
    const frame: Record<string, unknown> = { id, method, params }
    if (sessionId) frame.sessionId = sessionId
    return new Promise<T>((ok, fail) => {
      const timer = setTimeout(() => {
        this.pending.delete(id)
        fail(new Error(`${method} did not answer within 30s — the browser is probably gone`))
      }, 30_000)
      this.pending.set(id, {
        ok: value => { clearTimeout(timer); (ok as (v: unknown) => void)(value) },
        fail: reason => { clearTimeout(timer); fail(reason) }
      })
      this.socket.send(JSON.stringify(frame))
    })
  }

  close(): void {
    this.socket.close()
  }
}

/* ------------------------------------------------------------------ *
 * The page-side reader
 * ------------------------------------------------------------------ */
/**
 * Has this route hydrated, and what does its DOM say?
 *
 * `readyState` alone is not enough and `__vue_app__` alone is not enough. Vue
 * sets `__vue_app__` on the mount container the moment the root `hydrate()`
 * call returns, and a prerendered page whose entry chunk 404s never gets that
 * far — it just sits there as static HTML, looking perfect and saying nothing,
 * which is precisely how it would pass a console-only check.
 *
 * The heading count and the link inventory are read in the same round trip:
 * they are questions about the *hydrated* DOM, and a second `Runtime.evaluate`
 * would only widen the window in which the page could change underneath them.
 */
const READ_PAGE = `(() => {
  const root = document.getElementById('__nuxt')
  const hydrated = document.readyState === 'complete' && !!(root && root.__vue_app__)
  const h1s = Array.from(document.querySelectorAll('h1')).map(el => (el.textContent || '').trim().slice(0, 80))
  const anchors = Array.from(document.querySelectorAll('a[href]'))
  return {
    hydrated,
    h1s,
    /*
      Absolute hrefs, so a relative link resolves the same way the browser
      would. \`href\` on an <a> element is already the resolved URL; the literal
      attribute is read separately because that is what a placeholder looks like
      in the source and what a reviewer would grep for.
    */
    links: anchors.map(a => {
      const href = a.getAttribute('href') || ''
      const id = href.startsWith('#') ? href.slice(1) : ''
      return {
        href,
        resolved: a.href,
        /*
          Does this fragment name something on the page? A real in-page anchor
          (\`#board\`, \`#team\`, a program hub's \`#projects\`) resolves to an
          element; a placeholder standing in for a URL nobody has supplied yet
          resolves to nothing. Asked here rather than in Node because only the
          hydrated document can answer it.
        */
        fragmentResolves: id !== '' && !!document.getElementById(id)
      }
    }),
    /*
      DoD-A4 (gh#220) — lists that no longer look like lists.

      Classified by the *computed* \`list-style-type\`, which is the acceptance
      condition verbatim and is strictly wider than the class-based scan the
      build gate runs: it catches a list whose marker was removed by a scoped
      component rule, by a utility, or by anything a future stylesheet invents,
      none of which a selector match on \`[class]\` would see.

      \`role\` is read as the literal attribute rather than as
      \`el.role\` — the IDL reflection is not in every engine this script may be
      pointed at, and the attribute is what the markup has to carry anyway.

      \`markerless\` is reported even when there are no offenders: a row that
      says "0 of 0" is a row that found nothing to check, and that is a
      different fact from a clean page.
    */
    lists: (() => {
      const all = Array.from(document.querySelectorAll('ul, ol'))
      const markerless = all.filter(el => getComputedStyle(el).listStyleType === 'none')
      return {
        total: all.length,
        markerless: markerless.length,
        offenders: markerless
          .filter(el => el.getAttribute('role') !== 'list')
          .map(el => {
            const cls = (el.getAttribute('class') || '').trim()
            const role = el.getAttribute('role')
            return el.tagName.toLowerCase()
              + (cls === '' ? '' : '.' + cls.split(/\\s+/).join('.'))
              + ' (' + el.children.length + ' items, role=' + (role === null ? 'unset' : role) + ')'
          })
      }
    })(),
    width: window.innerWidth
  }
})()`

type PageLink = { href: string, resolved: string, fragmentResolves: boolean }
type PageLists = { total: number, markerless: number, offenders: string[] }
type PageRead = { hydrated: boolean, h1s: string[], links: PageLink[], lists: PageLists, width: number }

const sleep = (ms: number) => new Promise(ok => setTimeout(ok, ms))

/* ------------------------------------------------------------------ *
 * The `/_ipx/` gate (gh#203) — see the header section of the same name
 * ------------------------------------------------------------------ */
/**
 * Every `/_ipx/…` URL a page references, from `src` and from `srcset` alike.
 *
 * `srcset` is not optional here: `NuxtImg` emits the same URL twice, once as
 * `src` and once inside `srcset="… 1x, … 2x"`, and a check that read only
 * `src` would go green on a page whose `srcset` still pointed at a dead
 * endpoint. Descriptors (` 1x`, ` 640w`) and the commas between candidates are
 * stripped by the character class, which stops at the first space, quote or
 * comma.
 */
const IPX_REFERENCES = /\/_ipx\/[^"'\s,)]+/g

/**
 * `route` → the file `resolveFile` would serve for it, read as text.
 * `undefined` when there is no such file, which the caller reports as its own
 * distinct failure rather than as a silent pass.
 */
const prerenderedHtml = (route: string): string | undefined => {
  const file = resolveFile(route)
  return file === undefined ? undefined : readFileSync(file, 'utf8')
}

/**
 * HTML character references, undone.
 *
 * gh#253. This gate reads the **raw prerendered HTML**, where an attribute
 * value is character-referenced by definition — so a URL carrying more than
 * one query parameter arrives as `/_ipx/w_320&amp;q_90/…` while the file the
 * build wrote is `_ipx/w_320&q_90/…`. Every `/_ipx/` URL in the repository had
 * exactly one modifier until a hero passed `sizes`, so no URL had ever
 * contained an `&` and the gate had never had to decode one; the first one
 * that did was reported as dangling with the file sitting on disk beside it.
 *
 * A false *failure* rather than a false pass, so it was never dangerous — but
 * it fails a build for a file that exists, and the next contributor to pass
 * `sizes` would have hit exactly the same wall. Five references is the whole
 * of the predefined set; anything numeric is out of scope for a URL a build
 * tool wrote.
 */
const HTML_ENTITIES: Readonly<Record<string, string>> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'"
}

const decodeHtmlEntities = (raw: string): string =>
  raw.replace(/&(?:amp|lt|gt|quot|#39);/g, m => HTML_ENTITIES[m] ?? m)

/** The `/_ipx/` URLs in `html` that no file in `.output/public` answers. */
const danglingIpx = (html: string): string[] => {
  const seen = new Set<string>()
  for (const raw of html.match(IPX_REFERENCES) ?? []) {
    /*
      Decode before resolving, and report the decoded form: the path a
      browser actually requests is the thing that either exists or does not,
      and a failure message quoting `&amp;` sends the reader looking for a
      file that was never going to be named that.
    */
    const url = decodeHtmlEntities(raw)
    if (resolveFile(url) === undefined) seen.add(url)
  }
  return [...seen]
}

/* ------------------------------------------------------------------ *
 * Placeholder anchors — reported, never failed
 * ------------------------------------------------------------------ */
/**
 * Fragments that are real markup rather than an unfinished link.
 *
 * `#main` is `bfSkipLink`'s target — excluded by name because the skip link is
 * rendered before `<main>` exists in some client-render orders. A bare `#` is
 * what `bfNav`'s disclosure triggers carry: they are buttons in behaviour and
 * their `href` is never followed. Every other fragment is judged by whether it
 * names an element on the page (`links[].fragmentResolves`), so a working
 * in-page anchor like `/about#board` is not reported and a placeholder is.
 * Today that leaves `#podcast-platform-url`, `#transponder-magazine-url` and
 * `#bluesky-profile-url` (#160, #82 — waiting on the client).
 */
const REAL_FRAGMENTS = new Set(['#main', '#'])

const placeholderHrefs = (links: PageLink[]): string[] => {
  const seen = new Set<string>()
  for (const { href, fragmentResolves } of links) {
    if (!href.startsWith('#')) continue
    if (REAL_FRAGMENTS.has(href)) continue
    /* A fragment that names a real element is a working in-page link, not an
       unfinished one — `/about#board`, a program hub's `#projects`. */
    if (fragmentResolves) continue
    seen.add(href)
  }
  return [...seen].sort()
}

/* ------------------------------------------------------------------ *
 * The cascade-layer gate (residual #98 / gh#101, re-homed here in gh#68)
 * ------------------------------------------------------------------ */
/**
 * CSS with string and comment contents masked out, so a brace inside either
 * cannot be mistaken for structure. Length is preserved, so every offset a
 * regex finds in the masked text is valid in the original.
 */
const maskLiterals = (raw: string): string => {
  let out = ''
  let i = 0
  while (i < raw.length) {
    const ch = raw[i]!
    if (ch === '"' || ch === "'") {
      out += ch
      i += 1
      while (i < raw.length && raw[i] !== ch) {
        if (raw[i] === '\\' && i + 1 < raw.length) { out += 'xx'; i += 2; continue }
        out += 'x'
        i += 1
      }
      if (i < raw.length) { out += ch; i += 1 }
      continue
    }
    if (ch === '/' && raw[i + 1] === '*') {
      const end = raw.indexOf('*/', i + 2)
      const stop = end === -1 ? raw.length : end + 2
      out += '/*' + 'x'.repeat(Math.max(0, stop - i - 4)) + (end === -1 ? '' : '*/')
      i = stop
      continue
    }
    out += ch
    i += 1
  }
  return out
}

/**
 * The concatenated bodies of every block in `raw` whose opening `… {` matches
 * `opener` — brace-matched over the masked text, sliced out of the original.
 *
 * `opener` must be a `/g/` regex ending at the `{`. Nested blocks are kept
 * whole, which is what both callers want: the cascade-layer gate needs the
 * rules inside `@layer components`, and the DoD-A8 gate below needs the
 * `@view-transition` *and* the `*` rule inside one `@media` block.
 */
const blockBodies = (raw: string, opener: RegExp): string[] => {
  const css = maskLiterals(raw)
  const bodies: string[] = []
  let match: RegExpExecArray | null
  opener.lastIndex = 0
  while ((match = opener.exec(css)) !== null) {
    let depth = 1
    let i = match.index + match[0].length
    const start = i
    while (i < css.length && depth > 0) {
      if (css[i] === '{') depth += 1
      else if (css[i] === '}') depth -= 1
      i += 1
    }
    bodies.push(raw.slice(start, depth === 0 ? i - 1 : css.length))
  }
  return bodies
}

/** The concatenated bodies of every `@layer components { … }` block in `raw`. */
const layerComponentsBody = (raw: string): string =>
  blockBodies(raw, /@layer\s+components\s*\{/g).join('\n')

/** A `bf-*` component class, with the letter→hyphen boundary respected. */
const BF_RULE = /\.bf-[a-z][\w-]*/

type Row = { label: string, ok: boolean, detail: string }

/**
 * Every compiled stylesheet carrying a `bf-*` rule keeps it inside
 * `@layer components`. See the header section for why this matters.
 */
const cascadeLayerRows = (): Row[] => {
  if (!existsSync(builtCssDir)) {
    return [{
      label: 'compiled stylesheets present',
      ok: false,
      detail: `expected ${builtCssDir} · actual missing`
    }]
  }

  const sheets = readdirSync(builtCssDir)
    .filter(f => f.endsWith('.css'))
    .map(f => ({ name: f, css: readFileSync(join(builtCssDir, f), 'utf8') }))
    .filter(s => BF_RULE.test(s.css))

  if (sheets.length === 0) {
    return [{
      label: 'a compiled stylesheet carries bf-* component rules',
      ok: false,
      detail: 'expected >= 1 · actual 0 — has the component CSS stopped being emitted?'
    }]
  }

  const unlayered = sheets.filter(s => !BF_RULE.test(layerComponentsBody(s.css)))

  return [
    {
      label: `a compiled stylesheet carries bf-* component rules (${sheets.length} do)`,
      ok: true,
      detail: `expected >= 1 · actual ${sheets.length}`
    },
    {
      label: 'every bf-* rule sits inside @layer components (postcss cascade-layers polyfill is off)',
      ok: unlayered.length === 0,
      detail: unlayered.length === 0
        ? `expected 0 unlayered · actual 0`
        : `expected 0 unlayered · actual ${unlayered.length}: ${unlayered.slice(0, 3).map(s => s.name).join(', ')}`
          + " — re-enabling postcss-preset-env's cascade-layers polyfill flattens the wrapper,"
          + ' and unlayered CSS outranks every layer (residual #98 / gh#101)'
    }
  ]
}

/* ------------------------------------------------------------------ *
 * DoD-A9 — `lang` is a config default (a11y epic, gh#217)
 * ------------------------------------------------------------------ */
/**
 * Every `*.html` file under `.output/public`, absolute paths, depth-first.
 *
 * `statSync` rather than the `Dirent`'s own `isFile()`/`isDirectory()`: a
 * symlink is *neither* of those, so a `Dirent`-only walk would skip a symlinked
 * page and never recurse into a symlinked directory — silently, which is the
 * one failure mode a gate must not have (see the header). `.output/public`
 * carries no symlinks today, but `bfna-website-nuxt/public/css` is one in the
 * source tree, so the shape is not hypothetical. `statSync` follows the link
 * and reports what is on the other end; `seen` stops a link that points at an
 * ancestor from looping forever.
 */
const prerenderedHtmlFiles = (dir: string, seen = new Set<string>()): string[] => {
  const real = realpathSync(dir)
  if (seen.has(real)) return []
  seen.add(real)

  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    let stat
    try {
      stat = statSync(path)
    } catch {
      /* a broken symlink is not a page; the link check owns dead targets */
      continue
    }
    if (stat.isDirectory()) out.push(...prerenderedHtmlFiles(path, seen))
    else if (stat.isFile() && entry.toLowerCase().endsWith('.html')) out.push(path)
  }
  return out
}

/**
 * The opening `<html …>` tag, and a `lang` attribute within one.
 *
 * Deliberately a tag match rather than a `lang="…"` search anywhere in the
 * document: `lang` appears on `<code lang>` samples and inside inlined payload
 * JSON, and a naive whole-file search would go green on a page whose root
 * element carries nothing. The three `LANG_ATTR` alternates are the three legal
 * quotings — double, single, bare.
 */
const HTML_OPEN_TAG = /<html\b([^>]*)>/i
const LANG_ATTR = /\blang\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/i

/**
 * DoD-A9: every prerendered page carries a non-empty `lang` on `<html>`.
 *
 * A whole-build gate rather than a per-route row, because the acceptance is
 * phrased over *every* prerendered route and the per-route loop above visits
 * only the nine §7 routes. `/docs/**` — whose layout makes no `useHead` call —
 * is precisely the family the narrower check could not see, and was shipping
 * `<html>` with no `lang` at all until gh#217 moved the declaration into
 * `nuxt.config.ts` `app.head`.
 *
 * WCAG 3.1.1 is Level A. A missing `lang` leaves assistive technology to guess
 * a pronunciation dictionary, and the guess is silent when it is wrong.
 */
const langRows = (): Row[] => {
  if (!existsSync(publicDir)) {
    return [{
      label: 'DoD-A9 — prerendered output present',
      ok: false,
      detail: `expected ${publicDir} · actual missing — run \`npx nuxt generate\` first`
    }]
  }

  const files = prerenderedHtmlFiles(publicDir)

  if (files.length === 0) {
    return [{
      label: 'DoD-A9 — the build emitted prerendered HTML',
      ok: false,
      detail: 'expected >= 1 *.html under .output/public · actual 0'
    }]
  }

  const offenders: string[] = []
  for (const file of files) {
    const open = HTML_OPEN_TAG.exec(readFileSync(file, 'utf8'))
    const attrs = open?.[1]
    const lang = attrs === undefined ? undefined : LANG_ATTR.exec(attrs)
    /* `?? ''` collapses the three quoting alternates; `.trim()` so `lang=" "`
       is the failure it plainly is rather than a technically-present value. */
    const value = (lang?.[2] ?? lang?.[3] ?? lang?.[4] ?? '').trim()
    if (open === null || value === '') offenders.push(file.slice(publicDir.length + 1))
  }

  return [{
    label: `DoD-A9 — every prerendered page has a non-empty lang on <html> (${files.length} scanned)`,
    ok: offenders.length === 0,
    detail: offenders.length === 0
      ? `expected 0 without lang · actual 0 of ${files.length}`
      : `expected 0 without lang · actual ${offenders.length} of ${files.length}: `
        + `${offenders.slice(0, 5).join(', ')}${offenders.length > 5 ? ', …' : ''}`
        + ' — set it once in nuxt.config.ts app.head.htmlAttrs, not per layout (gh#217)'
  }]
}

/* ------------------------------------------------------------------ *
 * DoD-A8 — the reduced-motion floor (a11y epic, gh#218)
 * ------------------------------------------------------------------ */
/**
 * DoD-A8: `public/css/**` carries a `prefers-reduced-motion: reduce` block that
 * turns the view transition off and caps transition and animation duration.
 *
 * Read from the **served** stylesheet under `.output/public`, not from the
 * source tree. The source is not what a visitor gets: `public/css` reaches the
 * output through a copy step (and through a symlink at
 * `bfna-website-nuxt/public/css`), and a gate that greps the file it can see on
 * disk would stay green through a build that shipped none of it. This is the
 * same reason `cascadeLayerRows()` reads `.output/public/_nuxt` rather than the
 * SFCs.
 *
 * Four assertions, not one, because the acceptance has four separable halves
 * and a single "does the string appear" row cannot say which one broke:
 * the file shipped, it has the block, the block neutralises `@view-transition`,
 * and the block caps both durations.
 *
 * Deliberately silent about *how* the durations are capped. `0.01ms` is what
 * `reset.css` writes and why is argued there; a later `1ms`, or a `transition:
 * none`, would satisfy DoD-A8 just as well, and a gate that pinned the exact
 * value would be asserting the implementation rather than the requirement.
 */
const REDUCED_MOTION_OPENER = /@media[^{]*\bprefers-reduced-motion\s*:\s*reduce[^{]*\{/g

const reducedMotionRows = (): Row[] => {
  const served = join(publicDir, 'css/base/reset.css')

  if (!existsSync(served)) {
    return [{
      label: 'DoD-A8 — the reset stylesheet shipped to .output/public',
      ok: false,
      detail: `expected ${served.slice(publicDir.length + 1)} in the build · actual missing`
        + ' — run `npx nuxt generate` first; if the build ran, the public/ copy step is broken'
    }]
  }

  const css = readFileSync(served, 'utf8')
  const guards = blockBodies(css, REDUCED_MOTION_OPENER)
  const body = guards.join('\n')

  const rows: Row[] = [{
    label: 'DoD-A8 — public/css/base/reset.css has a prefers-reduced-motion: reduce block',
    ok: guards.length > 0,
    detail: guards.length > 0
      ? `expected >= 1 · actual ${guards.length}`
      : 'expected >= 1 · actual 0 — the reduced-motion floor is the one thing a visitor'
        + ' with a vestibular disorder cannot add for themselves (WCAG 2.3.3)'
  }]

  if (guards.length === 0) return rows

  /* `navigation: none`, `navigation:none`, and the same inside a nested
     `@view-transition { … }` — the descriptor is what matters, not the shape
     of the whitespace around it. */
  const viewTransitionOff = /@view-transition\s*\{[^}]*\bnavigation\s*:\s*none\b/.test(body)
  rows.push({
    label: 'DoD-A8 — that block turns the view transition off',
    ok: viewTransitionOff,
    detail: viewTransitionOff
      ? 'expected @view-transition { navigation: none } · actual present'
      : 'expected @view-transition { navigation: none } inside the guard · actual absent'
        + ' — reset.css declares navigation: auto unguarded, so every navigation cross-fades'
  })

  /* The longhand is the requirement; the shorthands are the two other ways of
     meeting it (`transition: none` sets `transition-duration` to `0s`, and
     `animation: none` sets `animation-duration`). Each property accepts only
     the shorthand that actually resets it. */
  const caps = [
    { property: 'transition-duration', shorthand: /\btransition\s*:\s*none\b/ },
    { property: 'animation-duration', shorthand: /\banimation\s*:\s*none\b/ }
  ] as const

  for (const { property, shorthand } of caps) {
    const capped = new RegExp(`\\b${property}\\s*:`).test(body) || shorthand.test(body)
    rows.push({
      label: `DoD-A8 — that block caps ${property}`,
      ok: capped,
      detail: capped
        ? `expected ${property} to be set inside the guard · actual it is`
        : `expected ${property} (or the shorthand that resets it) inside the guard · actual absent`
    })
  }

  return rows
}

/* ------------------------------------------------------------------ *
 * DoD-A4 — lists are lists (gh#220)
 * ------------------------------------------------------------------ */
/**
 * An opening `<ul …>` / `<ol …>` tag, and the two attributes that decide it.
 *
 * A tag match rather than a whole-file search, for the reason `HTML_OPEN_TAG`
 * gives: `class=` and `role=` appear all over an inlined Nuxt payload, and a
 * naive search would go green on a page whose lists carry neither. The `role`
 * alternates are the three legal quotings, and the value has to be `list`
 * exactly — `role="presentation"` is the author saying the opposite.
 *
 * Both attribute patterns anchor on whitespace-or-tag-start rather than on
 * `\\b`, and that is the difference between a gate and a hole: `\\brole` matches
 * inside `data-role="list"` — `-` is a non-word character, so the boundary is
 * there — which would let a `data-role` attribute satisfy an ARIA requirement.
 * Review finding on this PR (gh#220 P2-1).
 */
const LIST_OPEN_TAG = /<(ul|ol)\b([^>]*)>/gi
const LIST_CLASS_ATTR = /(?:^|\s)class\s*=/i
const LIST_ROLE_IS_LIST = /(?:^|\s)role\s*=\s*(?:"\s*list\s*"|'\s*list\s*'|list(?=[\s>]|$))/i

/**
 * Prerendered trees this gate does not judge, and why. Stated as data rather
 * than buried in a condition so the row can print them: an exclusion nobody can
 * see on a green run is an exclusion that quietly widens.
 *
 * - `wireframes/` — frozen by BF-217 D2 and byte-guarded by site-epic DoD-4.
 *   It carries ~2,000 classed lists with no role. Failing on them would fail on
 *   markup no issue in this epic is permitted to change, and a gate that can
 *   only be satisfied by breaking a rule is a gate people learn to skip.
 * - `docs/` — renders `components/ds/**`, which a11y BRIEF §7 places outside
 *   this epic pending the site-epic #88 keep-or-delete call.
 */
const LIST_ROLE_SKIP = ['wireframes/', 'docs/']

/**
 * DoD-A4: no classed `ul`/`ol` in the prerendered output is missing
 * `role="list"`.
 *
 * The wide, static half of the gate — see the header section of the same name
 * for why there are two halves and what each one is for. This one matches the
 * `public/css/base/reset.css` selector (`ul[class]`, `ol[class]`) rather than a
 * computed style, because it reads files rather than a rendered page; the
 * browser row on each route is what covers the marker-less list that carries no
 * class at all.
 *
 * The count of lists inspected is part of the label. A build that emitted no
 * list at all, or a future refactor that renamed the trees this walks, would
 * otherwise report the same "0 offenders" as a build that is genuinely clean —
 * so a zero denominator is its own failure row rather than a silent pass.
 */
const listRoleRows = (): Row[] => {
  if (!existsSync(publicDir)) {
    return [{
      label: 'DoD-A4 — prerendered output present',
      ok: false,
      detail: `expected ${publicDir} · actual missing — run \`npx nuxt generate\` first`
    }]
  }

  const files = prerenderedHtmlFiles(publicDir)
    .map(file => file.slice(publicDir.length + 1))
    .filter(rel => !LIST_ROLE_SKIP.some(prefix => rel.startsWith(prefix)))

  const offenders: string[] = []
  let inspected = 0

  for (const rel of files) {
    const raw = readFileSync(join(publicDir, rel), 'utf8')
    let match: RegExpExecArray | null
    /* `LIST_OPEN_TAG` is `/g`, so `lastIndex` has to be reset per file or the
       second file would resume where the first left off. */
    LIST_OPEN_TAG.lastIndex = 0
    while ((match = LIST_OPEN_TAG.exec(raw)) !== null) {
      const [, tag, attrs] = match
      if (!LIST_CLASS_ATTR.test(attrs)) continue
      inspected++
      if (!LIST_ROLE_IS_LIST.test(attrs)) {
        const cls = /(?:^|\s)class\s*=\s*"([^"]*)"/i.exec(attrs)?.[1] ?? '?'
        offenders.push(`${rel} — <${tag.toLowerCase()} class="${cls}">`)
      }
    }
  }

  const scope = `${files.length} pages, excluding ${LIST_ROLE_SKIP.join(' and ')}`

  return [
    {
      label: `DoD-A4 — the build emitted classed lists to inspect (${scope})`,
      ok: inspected > 0,
      detail: inspected > 0
        ? `expected >= 1 classed ul/ol · actual ${inspected}`
        : 'expected >= 1 · actual 0 — either the build is empty or this walk no longer'
          + ' reaches the bf pages, and in both cases the row below would pass by'
          + ' finding nothing'
    },
    {
      label: `DoD-A4 — every classed ul/ol carries role="list" (${inspected} lists, ${scope})`,
      ok: offenders.length === 0,
      detail: offenders.length === 0
        ? `expected 0 without role="list" · actual 0 of ${inspected}`
        : `expected 0 without role="list" · actual ${offenders.length} of ${inspected}: `
          + `${offenders.slice(0, 5).join(' , ')}${offenders.length > 5 ? ' , …' : ''}`
          + ' — base/reset.css strips list-style from every ul[class]/ol[class] and WebKit'
          + ' drops the implicit list role when it does; restate role="list" on the element'
          + ' (gh#220, the idiom at nav/Dropdown.vue:109)'
    }
  ]
}

/* ------------------------------------------------------------------ *
 * DoD-A3 (first half) — every <img> states an alt (gh#222)
 * ------------------------------------------------------------------ */
/**
 * `alt` is not optional on an `<img>`. A missing attribute and `alt=""` are
 * different statements to a screen reader — the first is an undescribed image
 * announced by its filename, the second is the author declaring there is
 * nothing to describe — and until gh#222 the codebase could only make the
 * first by accident: `MediaProps.alt` was optional and `Media.vue` wrote
 * `:alt="alt ?? ''"`, so *every* call site that said nothing shipped the
 * decorative claim.
 *
 * gh#222 makes the omission a compile error. This is the other half of that
 * pair, and it is here because the type and the output can drift: an `<img>`
 * can reach the prerendered HTML without passing through `bfMedia` at all —
 * rich-text body HTML from Directus, a hand-written template, a future
 * component. The type gate binds the call sites this repo owns; this one binds
 * the build.
 *
 * It asserts **presence, not correctness**. Whether a given `alt=""` is honest
 * is a content question this harness cannot answer — the strings are Irene's
 * and #234 ships the field (a11y BRIEF D28, §8). The `alt`-duplicates-the-`h1`
 * invariant is #110's. So the row also prints the empty/non-empty split, which
 * is the number that shows how much of the site is still waiting on #234
 * rather than a number that can be made green by writing `alt=""` everywhere.
 *
 * `/wireframes/**` and `/docs/**` are excluded on exactly the terms DoD-A4
 * states: the wireframes are frozen by BF-217 D2 and byte-guarded by site-epic
 * DoD-4, and `/docs/**` renders `components/ds/**`, which a11y BRIEF §7 puts
 * outside this epic pending the site-epic #88 keep-or-delete call —
 * `ccmSection.vue:15,23` binds `:alt="imageLeftAlt"`, which emits no attribute
 * at all when the prop is unset.
 */
const IMG_OPEN_TAG = /<img\b([^>]*)>/gi

/**
 * Anchored on whitespace-or-tag-start rather than `\b`, for the reason
 * `LIST_ROLE_IS_LIST` gives: `\balt` matches inside `data-alt=` — `-` is a
 * non-word character, so the boundary is there — and a `data-alt` attribute
 * would then satisfy an ARIA requirement it has nothing to do with.
 *
 * **A valueless `alt` is a present `alt`.** Vue's SSR serialiser emits an
 * empty-string attribute in its shorthand form: `:alt="''"` renders
 * `<img … alt style=…>`, not `alt=""`. Measured on this build — all 23
 * `bfMedia` images on `/` and `/about` serialise that way. A pattern that
 * demanded `alt=` would therefore have reported every deliberately decorative
 * image on the site as an offender, which is the exact inverse of the defect
 * and would have been "fixed" by someone weakening the gate. So presence is
 * `alt` followed by `=`, whitespace, a self-closing slash, or end of the
 * attribute run — and the empty test accepts the same shorthand.
 */
const IMG_ALT_ATTR = /(?:^|\s)alt(?=\s*=|\s|\/|$)/i
const IMG_ALT_EMPTY = /(?:^|\s)alt(?:\s*=\s*(?:"\s*"|'\s*')|(?=\s|\/|$))/i

const IMG_ALT_SKIP = ['wireframes/', 'docs/']

const imageAltRows = (): Row[] => {
  if (!existsSync(publicDir)) {
    return [{
      label: 'DoD-A3 — prerendered output present',
      ok: false,
      detail: `expected ${publicDir} · actual missing — run \`npx nuxt generate\` first`
    }]
  }

  const files = prerenderedHtmlFiles(publicDir)
    .map(file => file.slice(publicDir.length + 1))
    .filter(rel => !IMG_ALT_SKIP.some(prefix => rel.startsWith(prefix)))

  const offenders: string[] = []
  let images = 0
  let empty = 0

  for (const rel of files) {
    const raw = readFileSync(join(publicDir, rel), 'utf8')
    let match: RegExpExecArray | null
    /* `/g`, so `lastIndex` has to be reset per file — see `listRoleRows`. */
    IMG_OPEN_TAG.lastIndex = 0
    while ((match = IMG_OPEN_TAG.exec(raw)) !== null) {
      const attrs = match[1] ?? ''
      images++
      if (!IMG_ALT_ATTR.test(attrs)) {
        const src = /(?:^|\s)src\s*=\s*"([^"]*)"/i.exec(attrs)?.[1] ?? '?'
        offenders.push(`${rel} — <img src="${src.slice(0, 64)}">`)
        continue
      }
      if (IMG_ALT_EMPTY.test(attrs)) empty++
    }
  }

  const scope = `${files.length} pages, excluding ${IMG_ALT_SKIP.join(' and ')}`

  return [
    {
      label: `DoD-A3 — the build emitted images to inspect (${scope})`,
      ok: images > 0,
      detail: images > 0
        ? `expected >= 1 <img> · actual ${images}`
        : 'expected >= 1 · actual 0 — either the build is empty or this walk no longer'
          + ' reaches the bf pages, and in both cases the row below would pass by'
          + ' finding nothing'
    },
    {
      label: `DoD-A3 — every <img> carries an alt attribute (${images} images, ${scope})`,
      ok: offenders.length === 0,
      detail: offenders.length === 0
        ? `expected 0 without alt · actual 0 of ${images}`
          + ` — ${empty} deliberately empty (decorative), ${images - empty} with text`
          + ' (the empty share is what #234 pays down; presence is what this row asserts)'
        : `expected 0 without alt · actual ${offenders.length} of ${images}: `
          + `${offenders.slice(0, 5).join(' , ')}${offenders.length > 5 ? ' , …' : ''}`
          + ' — a missing alt is announced as the filename, which is never what the author'
          + ' meant; state alt="" for a decorative image or real text for a content one'
          + ' (gh#222, MediaProps.alt is required)'
    }
  ]
}

/* ------------------------------------------------------------------ *
 * DoD-A7 — the visually-hidden utility (gh#219)
 * ------------------------------------------------------------------ */
/**
 * `.visually-hidden` exists, hides by clipping, and `bfLoadMore` uses it.
 *
 * Read from `.output/public/css/utils/utils.css` — the served copy — for the
 * same reason `reducedMotionRows()` gives: the stylesheet reaches the build
 * through a copy step and through the `bfna-website-nuxt/public/css` symlink,
 * so a grep over a source file could stay green through a build that shipped
 * none of it.
 *
 * The mechanism is the assertion, not the class name. Every live region this
 * epic adds (#224, #225, #226, #229) hangs off this one rule, and a
 * `display: none` or a `visibility: hidden` sneaking into it would take the
 * element out of the accessibility tree on every one of them at once — which
 * is the exact defect #233 exists to fix on `/search`, arrived at from the
 * other direction (D29). Five separable halves, five rows, so a failure says
 * which one broke: the rule exists, it is in `@layer utils`, it clips, it does
 * not hide, and `bfLoadMore` still carries the class.
 *
 * Deliberately silent about the clip *value* and about the box size.
 * `inset(50%)` on a 1×1 box is what the utility writes; a later `inset(100%)`,
 * or `rect(0 0 0 0)` alone, or a 2px box, would meet the requirement just as
 * well, and a gate pinning either would be asserting the implementation rather
 * than the requirement. The reason the utility's box is 1px and not zero — a
 * zero-sized element is not rendered, and an unrendered element is not in the
 * accessibility tree either — is argued at the rule itself, in
 * `public/css/utils/utils.css`, where the next person to change the value will
 * be standing.
 */
const VISUALLY_HIDDEN_OPENER = /(?:^|[},;/])\s*\.visually-hidden\s*\{/g

/** The same pattern without `/g`, so `.test()` carries no `lastIndex` state. */
const VISUALLY_HIDDEN_RULE = /(?:^|[},;/])\s*\.visually-hidden\s*\{/

const visuallyHiddenRows = (): Row[] => {
  const served = join(publicDir, 'css/utils/utils.css')

  if (!existsSync(served)) {
    return [{
      label: 'DoD-A7 — the utils stylesheet shipped to .output/public',
      ok: false,
      detail: `expected ${served.slice(publicDir.length + 1)} in the build · actual missing`
        + ' — run `npx nuxt generate` first; if the build ran, the public/ copy step is broken'
    }]
  }

  const css = readFileSync(served, 'utf8')
  const bodies = blockBodies(css, VISUALLY_HIDDEN_OPENER)

  const rows: Row[] = [{
    label: 'DoD-A7 — public/css/utils/utils.css declares .visually-hidden',
    ok: bodies.length > 0,
    detail: bodies.length > 0
      ? `expected >= 1 rule · actual ${bodies.length}`
      : 'expected >= 1 · actual 0 — every live region in this epic consumes this one'
        + ' utility; without it each component hand-rolls the clip again (gh#219)'
  }]

  if (bodies.length === 0) return rows

  /* Masked, so the rationale comment inside the rule — which names both
     `display: none` and `visibility: hidden` in order to reject them — cannot
     be read as a declaration by the two regexes below. */
  const body = maskLiterals(bodies.join('\n'))

  const inUtilsLayer = blockBodies(css, /@layer\s+utils\s*\{/g)
    .some(layer => VISUALLY_HIDDEN_RULE.test(maskLiterals(layer)))
  rows.push({
    label: 'DoD-A7 — .visually-hidden is in @layer utils',
    ok: inUtilsLayer,
    detail: inUtilsLayer
      ? 'expected @layer utils · actual it is'
      : 'expected the rule inside @layer utils · actual it is not — `utils` is declared'
        + ' after `components` in styles.css, and a utility outside it loses to any'
        + ' component rule that sets position or block-size on the same element'
  })

  const clips = /\bclip-path\s*:/.test(body) || /\bclip\s*:/.test(body)
  rows.push({
    label: 'DoD-A7 — .visually-hidden hides by clipping',
    ok: clips,
    detail: clips
      ? 'expected clip-path (or the legacy clip) · actual present'
      : 'expected clip-path (or the legacy clip) in the rule · actual absent'
  })

  const hides = /\bdisplay\s*:\s*none\b/.test(body)
    || /\bvisibility\s*:\s*hidden\b/.test(body)
  rows.push({
    label: 'DoD-A7 — .visually-hidden does not remove the element from the a11y tree',
    ok: !hides,
    detail: hides
      ? 'expected no display: none and no visibility: hidden · actual one of them is set'
        + ' — either removes the element from the accessibility tree, which silences every'
        + ' live region that consumes this utility (D29)'
      : 'expected no display: none and no visibility: hidden · actual neither is set'
  })

  /* The consumer. `bfLoadMore` is the component the utility was lifted out of,
     so a regression that deletes the class from its template — or restores the
     scoped copy — is the one this gate is most likely to meet. Read from the
     prerendered `/insights`, the route that renders it. */
  const insights = prerenderedHtml('/insights')
  if (insights === undefined) {
    rows.push({
      label: 'DoD-A7 — bfLoadMore consumes .visually-hidden on /insights',
      ok: false,
      detail: 'expected a prerendered /insights · actual missing — run `npx nuxt generate` first'
    })
    return rows
  }

  const consumes = /<span[^>]*\bclass="[^"]*\bvisually-hidden\b[^"]*"[^>]*\brole="status"/.test(insights)
    || /<span[^>]*\brole="status"[^>]*\bclass="[^"]*\bvisually-hidden\b[^"]*"/.test(insights)
  rows.push({
    label: 'DoD-A7 — bfLoadMore consumes .visually-hidden on /insights',
    ok: consumes,
    detail: consumes
      ? 'expected a role="status" span carrying the class · actual present'
      : 'expected a role="status" span carrying .visually-hidden in the prerendered /insights'
        + ' · actual absent — the count region is either unstyled (visible) or hidden by'
        + ' something other than the shared utility'
  })

  return rows
}

/* ------------------------------------------------------------------ *
 * Decorative glyphs stay out of accessible names (a11y epic, gh#221)
 * ------------------------------------------------------------------ */
/**
 * Two whole-build rows for one defect with two shapes: an arrow that decorates
 * a link ends up read aloud as part of that link's name.
 *
 * **CSS half.** A `content:` declaration on a `::before`/`::after` that emits a
 * literal glyph must carry the `/ <string>` alternative-text form. That form is
 * the standardised way to say "this generated content is decoration"; without
 * it the glyph is appended to the originating element's accessible name.
 * `components/external-link.css` was the site's highest-frequency instance —
 * `a[data-external]::after` fires on every external link — and is what gh#221
 * fixed. The idiom is the repo's own (a11y BRIEF D27): `Breadcrumb.vue:207`
 * ships `"/" / ""`, `nav/Dropdown.vue:189` ships `"▾" / ""`.
 *
 * Read from `.output/public/css/**` rather than the source tree, for the reason
 * `reducedMotionRows()` gives: `public/css` reaches the build through a copy
 * step and through the `bfna-website-nuxt/public/css` symlink, so a source-tree
 * grep can stay green through a build that shipped none of it.
 *
 * "Emits a literal glyph" means a quoted string in the value containing a
 * character outside printable ASCII. `content: attr(data-icon)`
 * (`utils/utils.css`) is not a literal and is not judged here; neither is
 * `content: ""`, which paints nothing.
 *
 * **HTML half.** No arrow glyph may sit inside an `<a>`'s text in the
 * prerendered output unless it is inside an `aria-hidden="true"` element. The
 * idiom, again the repo's own, is `CardProject.vue:194`. This half is the one
 * that makes the sweep trustworthy: a call site the grep missed, or a glyph
 * arriving from `assets/bf-data/*.json` rather than from a template, still
 * fails the build.
 *
 * ## What neither row asserts
 *
 * That a screen reader now stays silent on these glyphs. There is no assistive
 * technology and no WebKit on this runner (a11y BRIEF §0.2), so what is checked
 * is the computed CSS condition and the markup condition only. The announcement
 * is the manual AT pass in BRIEF §8. A row that claimed more than it measured
 * would be worse than no row.
 *
 * Both halves print how many things they inspected, so neither can pass by
 * finding nothing — the same denominator rule `listRoleRows()` states.
 */
const ARROW_GLYPHS = '←↑→↓↖↗↘↙«»'
const ARROW_IN_TEXT = new RegExp(`[${ARROW_GLYPHS}]`)

/** CSS comments, stripped before scanning — the prose quotes declarations. */
const CSS_COMMENT = /\/\*[\s\S]*?\*\//g
/** `content:` up to the declaration's end, `/g` so every rule in a file is seen. */
const CONTENT_DECL = /content\s*:\s*([^;}]+)/gi
/** A quoted string inside a `content` value that holds a non-ASCII character. */
const GLYPH_STRING = /(["'])((?:\\.|(?!\1)[^\\])*?[^\x20-\x7e](?:\\.|(?!\1)[^\\])*?)\1/
/** The alternative-text half: a `/` followed by a quoted string, at the end. */
const CONTENT_ALT_FORM = /\/\s*(["'])(?:\\.|(?!\1)[^\\])*\1\s*$/

/**
 * Served stylesheets this gate does not judge, stated as data so the row can
 * print them (`LIST_ROLE_SKIP`'s reasoning, same shape).
 *
 * - `wireframe.css` — the frozen skin, BF-217 D2 and site-epic DoD-4. Its
 *   `" ↗"` and `" ▾"` markers are markup no issue in this epic may touch.
 * - `css-legacy/` — the pre-migration stylesheets, not composed by
 *   `styles.css` and not shipped on a bf route.
 */
const GLYPH_CSS_SKIP = ['wireframe.css', 'css-legacy/']

/**
 * Prerendered trees the HTML half does not judge. Identical set and identical
 * reasoning to `LIST_ROLE_SKIP` — `wireframes/` is frozen and byte-guarded,
 * `docs/` renders `components/ds/**`, which a11y BRIEF §7 puts outside this
 * epic pending the site-epic #88 call.
 */
const ARROW_HTML_SKIP = ['wireframes/', 'docs/']

/** Every `*.css` under a directory, recursively. */
const cssFiles = (dir: string, out: string[] = []): string[] => {
  if (!existsSync(dir)) return out
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) cssFiles(full, out)
    else if (entry.name.endsWith('.css')) out.push(full)
  }
  return out
}

/**
 * An `<a>`'s inner HTML with every `aria-hidden="true"` subtree removed, then
 * with tags stripped and the arrow entities — numeric and named — decoded.
 *
 * Anchors cannot nest, so a non-greedy `<a…>…</a>` match is exact. The
 * `aria-hidden` removal is deliberately one level deep and non-nesting: every
 * instance in this codebase is a leaf `<span>` around a glyph, and a regex that
 * tried to balance arbitrary nesting would be the wrong tool. A nested case
 * would leave the inner glyph visible to the scan — the gate would report a
 * defect that is not one, which is the safe direction to be wrong in.
 */
const ARIA_HIDDEN_SUBTREE = /<([a-z][\w-]*)\b[^>]*\baria-hidden\s*=\s*(["'])\s*true\s*\2[^>]*>[\s\S]*?<\/\1\s*>/gi
const ANCHOR = /<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi
const TAGS = /<[^>]*>/g

const NAMED_ARROW_ENTITY: Record<string, string> = {
  larr: '←', uarr: '↑', rarr: '→', darr: '↓',
  nwarr: '↖', nearr: '↗', searr: '↘', swarr: '↙',
  laquo: '«', raquo: '»'
}

const linkText = (innerHtml: string): string =>
  innerHtml
    .replace(ARIA_HIDDEN_SUBTREE, '')
    .replace(TAGS, '')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)))
    /* Nuxt emits these glyphs as raw UTF-8 today, so the entity forms are
       belt-and-braces: a hand-written `&rarr;` in a template, or a future
       serialiser that escapes non-ASCII, must not be able to walk past a gate
       that only understands the literal character. */
    .replace(/&([a-z]+);/gi, (whole, name: string) => NAMED_ARROW_ENTITY[name.toLowerCase()] ?? whole)

const decorativeGlyphRows = (): Row[] => {
  const rows: Row[] = []

  /* ---- CSS half ---- */
  const cssRoot = join(publicDir, 'css')
  if (!existsSync(cssRoot)) {
    rows.push({
      label: 'gh#221 — served stylesheets present',
      ok: false,
      detail: `expected ${cssRoot} · actual missing — run \`npx nuxt generate\` first`
    })
  } else {
    const sheets = cssFiles(cssRoot)
      .map(file => file.slice(cssRoot.length + 1))
      .filter(rel => !GLYPH_CSS_SKIP.some(prefix => rel.startsWith(prefix)))

    const cssOffenders: string[] = []
    let glyphDecls = 0

    for (const rel of sheets) {
      /* Comments first. Every one of these stylesheets documents its own rules,
         and this file's prose quotes `content:` declarations verbatim — a scan
         that read them would flag the explanation of the fix as the defect. */
      const raw = readFileSync(join(cssRoot, rel), 'utf8').replace(CSS_COMMENT, '')
      let match: RegExpExecArray | null
      CONTENT_DECL.lastIndex = 0
      while ((match = CONTENT_DECL.exec(raw)) !== null) {
        const value = match[1].trim()
        /* Two ways a declaration can put a glyph on the page. A literal quoted
           string containing a non-ASCII character is the obvious one. The other
           is a `var()` hook: the glyph lives on the custom property, so this
           scan cannot see it and must not assume it is harmless — a `content`
           assembled from a hook is required to state its alternative text here,
           which is also what makes the hook safe to override. `attr()` values
           and `content: ""` are neither, and are not judged. */
        const fromHook = /\bvar\s*\(/.test(value)
        if (!fromHook && !GLYPH_STRING.test(value)) continue
        glyphDecls++
        if (!CONTENT_ALT_FORM.test(value)) {
          cssOffenders.push(`css/${rel} — content: ${value.slice(0, 60)}`)
        }
      }
    }

    const cssScope = `${sheets.length} served stylesheets, excluding ${GLYPH_CSS_SKIP.join(' and ')}`

    rows.push({
      label: `gh#221 — the build shipped glyph-emitting content declarations to inspect (${cssScope})`,
      ok: glyphDecls > 0,
      detail: glyphDecls > 0
        ? `expected >= 1 · actual ${glyphDecls}`
        : 'expected >= 1 · actual 0 — either the CSS never reached .output/public or this'
          + ' walk no longer finds it, and in both cases the row below would pass by'
          + ' finding nothing'
    })

    rows.push({
      label: `gh#221 — every glyph-emitting content: carries the / "" alt form (${glyphDecls} declarations, ${cssScope})`,
      ok: cssOffenders.length === 0,
      detail: cssOffenders.length === 0
        ? `expected 0 without the alt form · actual 0 of ${glyphDecls}`
        : `expected 0 without the alt form · actual ${cssOffenders.length} of ${glyphDecls}: `
          + `${cssOffenders.slice(0, 5).join(' , ')}${cssOffenders.length > 5 ? ' , …' : ''}`
          + ' — generated content with no alternative text is appended to the accessible'
          + ' name of the element that originates it; write `content: <value> / ""`'
          + ' (gh#221, the idiom at nav/Dropdown.vue:189 and Breadcrumb.vue:207)'
    })
  }

  /* ---- HTML half ---- */
  if (!existsSync(publicDir)) {
    rows.push({
      label: 'gh#221 — prerendered output present',
      ok: false,
      detail: `expected ${publicDir} · actual missing — run \`npx nuxt generate\` first`
    })
    return rows
  }

  const pages = prerenderedHtmlFiles(publicDir)
    .map(file => file.slice(publicDir.length + 1))
    .filter(rel => !ARROW_HTML_SKIP.some(prefix => rel.startsWith(prefix)))

  const htmlOffenders: string[] = []
  let anchors = 0

  for (const rel of pages) {
    const raw = readFileSync(join(publicDir, rel), 'utf8')
    let match: RegExpExecArray | null
    ANCHOR.lastIndex = 0
    while ((match = ANCHOR.exec(raw)) !== null) {
      anchors++
      const text = linkText(match[2])
      if (ARROW_IN_TEXT.test(text)) {
        htmlOffenders.push(`${rel} — <a>${text.trim().slice(0, 48)}</a>`)
      }
    }
  }

  const htmlScope = `${pages.length} pages, excluding ${ARROW_HTML_SKIP.join(' and ')}`

  rows.push({
    label: `gh#221 — the build emitted anchors to inspect (${htmlScope})`,
    ok: anchors > 0,
    detail: anchors > 0
      ? `expected >= 1 anchor · actual ${anchors}`
      : 'expected >= 1 · actual 0 — either the build is empty or this walk no longer'
        + ' reaches the bf pages, and in both cases the row below would pass by'
        + ' finding nothing'
  })

  rows.push({
    label: `gh#221 — no un-aria-hidden arrow glyph inside <a> text (${anchors} anchors, ${htmlScope})`,
    ok: htmlOffenders.length === 0,
    detail: htmlOffenders.length === 0
      ? `expected 0 bare arrows · actual 0 of ${anchors}`
      : `expected 0 bare arrows · actual ${htmlOffenders.length} of ${anchors}: `
        + `${htmlOffenders.slice(0, 5).join(' , ')}${htmlOffenders.length > 5 ? ' , …' : ''}`
        + ' — an arrow in link text is a plain text node and is read out as part of the'
        + ' link name; wrap it in <span aria-hidden="true"> (gh#221, the idiom at'
        + ' CardProject.vue:194)'
  })

  return rows
}

/* ------------------------------------------------------------------ *
 * The error page announces, prerendered empty states do not (gh#224)
 * ------------------------------------------------------------------ */
/**
 * `bfEmptyState` is the block a page renders **instead of** its content, and
 * until gh#224 it carried no `role` at all (a11y BRIEF §0, "Live regions").
 * On `error.vue` that is a real silence: a client-side navigation to a dead
 * route does not reload the document, so Vue Router swaps `<main>`'s subtree
 * for "Page not found" in place, the URL changes, and assistive technology is
 * told nothing — the user is left on what still sounds like the previous page.
 *
 * The fix is one opt-in prop, `announced`, rendering `role="status"` — the
 * shape `Notice.vue:94,111` already ships (BRIEF D27). This gate asserts both
 * halves, because asserting only the positive one would stay green for a
 * component that hard-coded the role and so made every prerendered empty state
 * a live region that never updates.
 *
 * ## Why this half has to run in the browser
 *
 * There is nothing to grep. `nuxt generate` writes `error.vue` to `404.html`
 * as a **client-only shell** — measured on this build: `data-ssr="false"`,
 * `<div id="__nuxt"></div>` empty, zero `<main>`. The error page exists only
 * after hydration, so a file-based row would either read an empty document or
 * would have to be weakened until it asserted nothing.
 *
 * So the positive half drives the case the row exists for, exactly as written:
 * load `/`, then push `/this-page-does-not-exist` through the app's **own**
 * router. `$router` is reached off `#__nuxt.__vue_app__`, the handle
 * `READ_PAGE` already uses to decide whether a route hydrated. No `Page.navigate`
 * — a hard load is a different scenario, and on this static server it would not
 * even reach the app (an unresolvable path is answered `404 text/plain`).
 *
 * ## Why the default matters as much as the fix
 *
 * `role="status"` is an implicit `aria-live="polite"` region. On content
 * present at first paint that never changes — measured on this build: 18
 * `insights/<slug>` pages prerender the "Insight not found" branch — the region
 * is announced for nothing and then sits in the accessibility tree for the life
 * of the page. The prop exists so the caller
 * states which case it is; the static row is what stops a later "just make it
 * always announce" from landing.
 *
 * ## What this does not assert
 *
 * That a screen reader speaks the block. There is no assistive technology on
 * this runner (a11y BRIEF §0.2); what is measured is the DOM condition. The
 * announcement itself is the manual AT pass in BRIEF §8.
 *
 * It also does not judge `/search`'s idle count region — `role="status"` under
 * `display: none`, and so out of the accessibility tree, a live region hidden
 * the wrong way. That is #233's defect and #233's gate; this one is scoped to
 * `bfEmptyState`.
 */
const ERROR_ROUTE = '/this-page-does-not-exist'

/**
 * Push the dead route through the running app's router and report what
 * `<main>` then contains.
 *
 * Read in one round trip, for `READ_PAGE`'s reason: these are questions about
 * one rendered state, and a second `Runtime.evaluate` only widens the window in
 * which the page can change underneath them.
 *
 * `[role="status"]` rather than a class or a tag on the counting row: what is
 * asserted is the accessibility-tree condition, not which component satisfied
 * it. `[aria-live]` is counted alongside and **reported, not asserted** — it is
 * context for a failure ("there is a live region here, spelled the other way"),
 * not an alternative that passes. `role="status"` is what is required, because
 * it is what the prop emits and what the idiom this copies already ships
 * (`Notice.vue:111`); a second accepted spelling would be the divergence D27
 * exists to prevent.
 */
const READ_ERROR_ROUTE = `(async () => {
  const root = document.getElementById('__nuxt')
  const router = root && root.__vue_app__ && root.__vue_app__.config.globalProperties.$router
  if (!router) return { pushed: false }

  try { await router.push(${JSON.stringify(ERROR_ROUTE)}) } catch (e) { /* Nuxt answers an unmatched route with showError */ }

  /*
    The push resolves on navigation; the error component mounts on a later
    render. Poll for it rather than waiting a fixed number of frames —
    \`requestAnimationFrame\` does not fire on a page the browser considers
    hidden, and a probe that hangs there would time the whole harness out
    instead of failing. Measured while verifying gh#224 in a hidden pane: a
    two-frame wait never resolved.

    The loop is bounded and its exit is not the element's presence alone: on a
    build where the fix is missing the block still mounts, without the role, and
    the read below is what says so. The extra tick after it is the settle.
  */
  const deadline = Date.now() + 3000
  while (Date.now() < deadline && !document.querySelector('main .bf-empty-state')) {
    await new Promise(ok => setTimeout(ok, 50))
  }
  await new Promise(ok => setTimeout(ok, 50))

  const main = document.querySelector('main')
  if (!main) return { pushed: true, path: location.pathname, main: false }

  const state = main.querySelector('.bf-empty-state')
  return {
    pushed: true,
    path: location.pathname,
    main: true,
    regions: main.querySelectorAll('[role="status"]').length,
    liveRegions: main.querySelectorAll('[aria-live]').length,
    hasState: !!state,
    stateRole: state ? state.getAttribute('role') : null,
    h1s: Array.from(document.querySelectorAll('h1')).map(el => (el.textContent || '').trim().slice(0, 80))
  }
})()`

type ErrorRouteRead = {
  pushed: boolean
  path?: string
  main?: boolean
  regions?: number
  liveRegions?: number
  hasState?: boolean
  stateRole?: string | null
  h1s?: string[]
}

/** `<[a-z…]` open tag whose attribute run names the block's own class. */
const EMPTY_STATE_TAG = /<[a-z][\w-]*[^>]*\bbf-empty-state\b[^>]*>/gi

/**
 * Anchored on whitespace-or-tag-start rather than `\b`, for the reason
 * `LIST_ROLE_IS_LIST` and `IMG_ALT_ATTR` both give: `\brole` matches inside
 * `data-role=`, and a `data-role="status"` would then satisfy an ARIA
 * requirement it has nothing to do with.
 */
const ROLE_STATUS_ATTR = /(?:^|\s)role\s*=\s*(?:"\s*status\s*"|'\s*status\s*'|status(?=[\s/>]|$))/i

/**
 * The client-only error shell. Excluded from the static half rather than
 * silently passing it: it renders nothing today, and if a later Nuxt version
 * server-renders it, its `role="status"` is the *correct* one and must not be
 * read as an offender.
 */
const ERROR_PAGE = '404.html'

/** `/wireframes/**` and `/docs/**`, excluded on DoD-A4's exact terms. */
const EMPTY_STATE_SKIP = ['wireframes/', 'docs/']

const emptyStateStaticRows = (): Row[] => {
  if (!existsSync(publicDir)) {
    return [{
      label: 'gh#224 — prerendered output present',
      ok: false,
      detail: `expected ${publicDir} · actual missing — run \`npx nuxt generate\` first`
    }]
  }

  const pages = prerenderedHtmlFiles(publicDir)
    .map(file => file.slice(publicDir.length + 1))
    .filter(rel => rel !== ERROR_PAGE)
    .filter(rel => !EMPTY_STATE_SKIP.some(prefix => rel.startsWith(prefix)))

  const offenders: string[] = []
  let states = 0

  for (const rel of pages) {
    const raw = readFileSync(join(publicDir, rel), 'utf8')
    /* `/g`, so `lastIndex` has to be reset per file — `listRoleRows`' note. */
    EMPTY_STATE_TAG.lastIndex = 0
    for (const tag of raw.match(EMPTY_STATE_TAG) ?? []) {
      states++
      if (ROLE_STATUS_ATTR.test(tag)) offenders.push(`${rel} — ${tag.slice(0, 72)}`)
    }
  }

  const scope = `${pages.length} pages, excluding ${ERROR_PAGE}`
    + ` and ${EMPTY_STATE_SKIP.join(' and ')}`

  return [{
    label: `gh#224 — no prerendered empty state announces (${states} inspected, ${scope})`,
    ok: offenders.length === 0,
    detail: offenders.length === 0
      ? `expected 0 with role="status" · actual 0 of ${states}`
        + (states === 0
          ? ' — no bf route prerenders an empty state today, so this row is holding the'
            + ' default open for the first one that does rather than reporting a fix'
          : '')
      : `expected 0 with role="status" · actual ${offenders.length} of ${states}: `
        + `${offenders.slice(0, 5).join(' , ')}${offenders.length > 5 ? ' , …' : ''}`
        + ' — content present at first paint is not a live region: role="status" is an'
        + ' implicit aria-live, and one that never updates is noise in the accessibility'
        + ' tree. `announced` defaults to false for exactly that case (gh#224, D29)'
  }]
}

const emptyStateStatusRows = async (cdp: Cdp, origin: string): Promise<Row[]> => {
  const rows: Row[] = []

  const { targetId } = await cdp.send<{ targetId: string }>('Target.createTarget', { url: 'about:blank' })
  const { sessionId } = await cdp.send<{ sessionId: string }>('Target.attachToTarget', { targetId, flatten: true })

  let read: ErrorRouteRead | undefined
  try {
    /* `watching`, cleared in the `finally`, for the reason the per-route loop
       sets it: with it `undefined` the client attributes every event from every
       target to nobody in particular, and this probe would file the 404 page's
       console output into the shared `consoleErrors` the routes above are
       judged on. Nothing reads them after this point today; that is a fact
       about the current call order, not a property worth relying on. */
    cdp.exceptions = []
    cdp.consoleErrors = []
    cdp.watching = sessionId
    await cdp.send('Runtime.enable', {}, sessionId)
    await cdp.send('Page.enable', {}, sessionId)
    await cdp.send('Page.navigate', { url: `${origin}/` }, sessionId)

    /* Wait for `/` to hydrate before touching its router — the same condition,
       read the same way, as the per-route loop above. */
    const deadline = Date.now() + timeoutMs
    let hydrated = false
    while (Date.now() < deadline) {
      await sleep(150)
      try {
        const evaluated = await cdp.send<{ result: { value?: PageRead } }>(
          'Runtime.evaluate',
          { expression: READ_PAGE, returnByValue: true },
          sessionId
        )
        if (evaluated.result?.value?.hydrated === true) { hydrated = true; break }
      } catch {
        /* navigation swaps the execution context; keep polling */
      }
    }

    if (!hydrated) {
      /* The static half reads files and needs no browser, so it still runs and
         still reports — a group that answers one question is worth more than
         one that abandons both. */
      return [{
        label: `gh#224 — / hydrated, so ${ERROR_ROUTE} can be reached through the router`,
        ok: false,
        detail: `expected #__nuxt.__vue_app__ within ${timeoutMs}ms · actual absent`
          + ' — without a running app there is no client-side navigation to judge'
      }, ...emptyStateStaticRows()]
    }

    const evaluated = await cdp.send<{ result: { value?: ErrorRouteRead } }>(
      'Runtime.evaluate',
      { expression: READ_ERROR_ROUTE, returnByValue: true, awaitPromise: true },
      sessionId
    )
    read = evaluated.result?.value
  } finally {
    await cdp.send('Target.closeTarget', { targetId }).catch(() => {})
    /* After the close, so anything the dying target flushes still counts. */
    cdp.watching = undefined
  }

  if (read === undefined || read.pushed !== true) {
    return [{
      label: `gh#224 — the app's router accepted a push to ${ERROR_ROUTE}`,
      ok: false,
      detail: 'expected $router on #__nuxt.__vue_app__ · actual unreachable'
        + ' — the probe could not perform a client-side navigation, so the announcement'
        + ' is untested rather than absent'
    }, ...emptyStateStaticRows()]
  }

  rows.push({
    label: `gh#224 — a client-side navigation lands on ${ERROR_ROUTE} with a <main>`,
    ok: read.main === true && read.path === ERROR_ROUTE,
    detail: read.main === true && read.path === ERROR_ROUTE
      ? `expected ${ERROR_ROUTE} in the bf-default layout · actual it is`
      : `expected ${ERROR_ROUTE} with one <main> · actual path ${JSON.stringify(read.path ?? null)},`
        + ` main ${read.main === true ? 'present' : 'absent'} — the rows below judge what`
        + ' is inside that <main>, so they cannot be trusted without it'
  })

  const regions = read.regions ?? 0
  rows.push({
    label: `gh#224 — ${ERROR_ROUTE} exposes exactly one role="status" in <main>`,
    ok: regions === 1,
    detail: regions === 1
      ? `expected 1 · actual 1 (plus ${read.liveRegions ?? 0} [aria-live] element(s))`
      : `expected exactly 1 · actual ${regions} — 0 means a client-side navigation into an`
        + ' error swaps the page body in silence, which is the gh#224 defect; more than 1'
        + ' means two regions announce the same arrival over each other'
  })

  rows.push({
    label: `gh#224 — the region is the bfEmptyState root, not a neighbouring node`,
    ok: read.hasState === true && read.stateRole === 'status',
    detail: read.hasState === true && read.stateRole === 'status'
      ? 'expected .bf-empty-state[role="status"] · actual present'
      : `expected .bf-empty-state[role="status"] · actual ${read.hasState === true
        ? `role=${JSON.stringify(read.stateRole)}`
        : 'no .bf-empty-state in <main>'} — pass \`announced\` on <bfEmptyState> rather`
        + ' than putting a role somewhere else in the page (gh#224, the idiom at'
        + ' Notice.vue:111)'
  })

  /* The heading is already correct and this row is here to keep it that way:
     the fix is an attribute, and a fix that also reworded the page or changed
     its rank would be a different change wearing this one's number. */
  const h1s = read.h1s ?? []
  rows.push({
    label: `gh#224 — ${ERROR_ROUTE} still renders one <h1>, "Page not found"`,
    ok: h1s.length === 1 && h1s[0] === 'Page not found',
    detail: h1s.length === 1 && h1s[0] === 'Page not found'
      ? 'expected 1 · actual 1'
      : `expected exactly one <h1> reading "Page not found" · actual ${h1s.length}:`
        + ` ${h1s.map(t => JSON.stringify(t)).join(', ') || '—'}`
  })

  rows.push(...emptyStateStaticRows())

  return rows
}

/* ------------------------------------------------------------------ *
 * DoD-A6 — "Load more" never drops focus to <body> (a11y epic, gh#225)
 * ------------------------------------------------------------------ */
/**
 * The measured defect: on `/insights`, the fourth "Load more" click takes
 * `remaining` to `0`, `hasMore` goes false, `LoadMore.vue`'s `v-if` unmounts
 * the button the user is standing on, and `document.activeElement` becomes
 * `document.body`. The next Tab restarts at the top of the document. WCAG
 * 2.4.3. `:disabled="loading"` was the same mechanism spelled differently — a
 * native `disabled` on the focused element blurs it too.
 *
 * This group walks the real control to exhaustion and asserts focus survives
 * every step, that the walk was not vacuous, and that the announcement the fix
 * had to preserve still reads at the end.
 *
 * ## Real input, not `el.click()` and not `el.focus()`
 *
 * The clicks are `Input.dispatchMouseEvent` press/release pairs at the
 * button's own viewport coordinates. That matters twice over: `el.click()`
 * dispatches an event without any of the focus behaviour a real press has, so
 * a probe using it would have to `.focus()` the button by hand and would then
 * be asserting something about its own bookkeeping rather than about the
 * browser; and BRIEF §5 rules programmatic focus out as a measurement of focus
 * anywhere in this epic. Chrome focuses a `<button>` on mousedown, so the walk
 * establishes focus exactly the way a user does — and one row below asserts
 * that it did, so a browser that stops doing so reports *that* rather than
 * failing the focus-retention row for the wrong reason.
 *
 * ## What it does not assert
 *
 * That a screen reader speaks the count. There is no assistive technology on
 * this runner (a11y BRIEF §0.2); what is measured is the DOM condition —
 * region present, not `display: none`, text correct. The announcement itself is
 * the manual AT pass in BRIEF §8.
 *
 * It also does not judge the zero-results case. `bfLoadMore` sits inside
 * `<template v-if="filtered.length">` in `insights/index.vue`, so filtering to
 * nothing unmounts the live region wholesale — real, and **#233's**, not this
 * gate's.
 */
const LOAD_MORE_ROUTE = '/insights'

/**
 * `/insights` needs four clicks at 24 a page for 98 rows. The cap is a
 * runaway guard, not an expectation: a page-size change moves the real number
 * and the rows below assert *exhaustion was reached*, not that it took four.
 */
const LOAD_MORE_MAX_CLICKS = 12

/** `Showing 98 of 98 items` — the exact sentence `bfLoadMore` composes. */
const SHOWING_TEXT = /^Showing (\d+) of (\d+) items$/

/**
 * One round trip: where the button is, what state it is in, and where focus is.
 *
 * `scrollIntoView` is a write, in a function otherwise named for reading, and
 * it is deliberate — the coordinates handed to `Input.dispatchMouseEvent` have
 * to be the ones the button occupies *now*, and reading a rect in one
 * evaluation and scrolling in another leaves a window in which the page moves
 * between them. `behavior` is left at its default, which scrolls synchronously,
 * so the `getBoundingClientRect` on the next line is already the settled one.
 */
const READ_LOAD_MORE = `(() => {
  const button = document.querySelector('.bf-load-more__button')
  const status = document.querySelector('.bf-load-more__status')
  const active = document.activeElement

  let rect = null
  if (button) {
    button.scrollIntoView({ block: 'center', inline: 'center' })
    const box = button.getBoundingClientRect()
    rect = { x: box.x, y: box.y, width: box.width, height: box.height }
  }

  return {
    button: !!button,
    ariaDisabled: button ? button.getAttribute('aria-disabled') : null,
    nativeDisabled: button ? button.hasAttribute('disabled') : false,
    describedBy: button ? button.getAttribute('aria-describedby') : null,
    rect,
    status: !!status,
    statusId: status ? status.id : null,
    statusRole: status ? status.getAttribute('role') : null,
    statusLive: status ? status.getAttribute('aria-live') : null,
    statusText: status ? (status.textContent || '').trim() : null,
    statusDisplay: status ? getComputedStyle(status).display : null,
    activeIsBody: active === document.body,
    activeIsButton: !!button && active === button,
    activeTag: active ? active.tagName : null,
    activeClass: active && typeof active.className === 'string' ? active.className.trim().slice(0, 80) : null
  }
})()`

type LoadMoreRead = {
  button: boolean
  ariaDisabled: string | null
  nativeDisabled: boolean
  describedBy: string | null
  rect: { x: number, y: number, width: number, height: number } | null
  status: boolean
  statusId: string | null
  statusRole: string | null
  statusLive: string | null
  statusText: string | null
  statusDisplay: string | null
  activeIsBody: boolean
  activeIsButton: boolean
  activeTag: string | null
  activeClass: string | null
}

/** Where focus is, in one printable phrase. */
const describeFocus = (read: LoadMoreRead): string => {
  if (read.activeIsButton) return 'the load-more button'
  if (read.activeIsBody) return '<body> — DROPPED'
  const tag = (read.activeTag ?? '?').toLowerCase()
  const first = (read.activeClass ?? '').split(/\s+/).filter(Boolean)[0]
  return first === undefined ? `<${tag}>` : `${tag}.${first}`
}

const loadMoreFocusRows = async (cdp: Cdp, origin: string): Promise<Row[]> => {
  const { targetId } = await cdp.send<{ targetId: string }>('Target.createTarget', { url: 'about:blank' })
  const { sessionId } = await cdp.send<{ sessionId: string }>('Target.attachToTarget', { targetId, flatten: true })

  const steps: string[] = []
  const dropped: number[] = []
  const shownCounts: number[] = []
  let clicks = 0
  let hydrated = false
  let initial: LoadMoreRead | undefined
  let read: LoadMoreRead | undefined
  let focusedAfterFirstClick: boolean | undefined
  let firstClickFocus: string | undefined
  let stalled: string | undefined

  try {
    /* Cleared and restored for the reason gh#224's probe gives: with
       `watching` unset the client files every target's console output into the
       shared arrays the per-route rows are judged on. */
    cdp.exceptions = []
    cdp.consoleErrors = []
    cdp.watching = sessionId
    await cdp.send('Runtime.enable', {}, sessionId)
    await cdp.send('Page.enable', {}, sessionId)
    await cdp.send(
      'Emulation.setDeviceMetricsOverride',
      { width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: false },
      sessionId
    )
    await cdp.send('Page.navigate', { url: `${origin}${LOAD_MORE_ROUTE}` }, sessionId)

    const deadline = Date.now() + timeoutMs
    while (Date.now() < deadline) {
      await sleep(150)
      try {
        const evaluated = await cdp.send<{ result: { value?: PageRead } }>(
          'Runtime.evaluate',
          { expression: READ_PAGE, returnByValue: true },
          sessionId
        )
        if (evaluated.result?.value?.hydrated === true) { hydrated = true; break }
      } catch {
        /* navigation swaps the execution context; keep polling */
      }
    }

    if (hydrated) {
      const look = async (): Promise<LoadMoreRead | undefined> => {
        const evaluated = await cdp.send<{ result: { value?: LoadMoreRead } }>(
          'Runtime.evaluate',
          { expression: READ_LOAD_MORE, returnByValue: true },
          sessionId
        )
        return evaluated.result?.value
      }

      initial = await look()
      read = initial

      while (
        read !== undefined
        && read.button
        && read.ariaDisabled !== 'true'
        && !read.nativeDisabled
        && clicks < LOAD_MORE_MAX_CLICKS
      ) {
        const rect = read.rect
        if (
          rect === null
          || rect.width === 0
          || rect.height === 0
          || rect.y < 0
          || rect.y + rect.height > viewport.height
        ) {
          /* Loud rather than silent: a press dispatched at coordinates the
             button does not occupy hits the page instead, focus goes nowhere
             near the control, and the focus rows below would then be reporting
             a probe bug as a product defect. */
          stalled = `after ${clicks} click(s) the button's rect is ${JSON.stringify(rect)},`
            + ` which is not inside the ${viewport.width}x${viewport.height} viewport — nothing to press`
          break
        }

        const x = Math.round(rect.x + rect.width / 2)
        const y = Math.round(rect.y + rect.height / 2)
        await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 }, sessionId)
        await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 }, sessionId)
        clicks += 1

        /* One tick for Vue's re-render plus a settle, the same shape of wait
           `READ_ERROR_ROUTE` uses and for the same reason: `requestAnimationFrame`
           does not fire on a target the browser considers hidden. */
        await sleep(250)
        read = await look()
        if (read === undefined) {
          stalled = `the page stopped answering after click ${clicks}`
          break
        }

        if (clicks === 1) {
          focusedAfterFirstClick = read.activeIsButton
          firstClickFocus = describeFocus(read)
        }
        if (read.activeIsBody) dropped.push(clicks)
        const showing = read.statusText === null ? null : SHOWING_TEXT.exec(read.statusText)
        if (showing) shownCounts.push(Number(showing[1]))
        steps.push(`${clicks}: focus ${describeFocus(read)}, status ${JSON.stringify(read.statusText)}`)
      }
    }
  } finally {
    await cdp.send('Target.closeTarget', { targetId }).catch(() => {})
    /* After the close, so anything the dying target flushes still counts. */
    cdp.watching = undefined
  }

  const walk = steps.length === 0 ? '—' : steps.join(' · ')

  if (!hydrated || initial === undefined) {
    return [{
      label: `gh#225 — ${LOAD_MORE_ROUTE} hydrated, so its "Load more" can be walked`,
      ok: false,
      detail: `expected #__nuxt.__vue_app__ within ${timeoutMs}ms · actual absent`
        + ' — without a running app there is no pagination to drive, and DoD-A6 is'
        + ' untested rather than passing'
    }]
  }

  const rows: Row[] = []

  rows.push({
    label: `gh#225 — ${LOAD_MORE_ROUTE} renders a live "Load more" to walk`,
    ok: initial.button && initial.ariaDisabled !== 'true' && !initial.nativeDisabled,
    detail: initial.button && initial.ariaDisabled !== 'true' && !initial.nativeDisabled
      ? 'expected .bf-load-more__button, interactive · actual present'
      : `expected an interactive .bf-load-more__button on first paint · actual ${initial.button
        ? `present but aria-disabled=${JSON.stringify(initial.ariaDisabled)}, disabled=${initial.nativeDisabled}`
        : 'no button at all'} — every row below would pass without doing anything, so this one`
        + ' is what stops the group going green on a feed that never paginates'
  })

  const exhausted = stalled === undefined && clicks >= 2 && read !== undefined && read.ariaDisabled === 'true'
  rows.push({
    label: `gh#225 — the walk reached exhaustion (${clicks} real click(s), ≤ ${LOAD_MORE_MAX_CLICKS})`,
    ok: exhausted,
    detail: exhausted
      ? `expected ≥ 2 clicks ending aria-disabled · actual ${clicks}, counts ${shownCounts.join(' → ') || '—'}`
      : `expected ≥ 2 clicks ending on aria-disabled="true" · actual ${clicks} click(s)`
        + `${stalled === undefined ? '' : `, stalled: ${stalled}`}`
        + ` — walk: ${walk}`
  })

  rows.push({
    label: 'gh#225 — a real mouse press put focus on the button (probe sanity, not the defect)',
    ok: focusedAfterFirstClick === true,
    detail: focusedAfterFirstClick === true
      ? 'expected document.activeElement === the button after click 1 · actual it is'
      : `expected the press to focus the button · actual focus after click 1 was on`
        + ` ${firstClickFocus ?? 'nothing readable — no click landed'} — this browser does not`
        + ' focus a <button> on mousedown, so the rows below are measuring the probe rather'
        + ' than the page. Not the gh#225 defect'
  })

  /* The DoD-A6 row itself. */
  rows.push({
    label: `gh#225 — DoD-A6: focus never reached <body> across ${clicks} click(s)`,
    ok: dropped.length === 0 && clicks > 0,
    detail: dropped.length === 0 && clicks > 0
      ? `expected document.activeElement !== document.body at every step · actual it never was — ${walk}`
      : clicks === 0
        ? 'expected at least one click to judge · actual none was performed'
        : `expected document.activeElement !== document.body at every step · actual <body> after click(s)`
          + ` ${dropped.join(', ')} — ${walk}. Removing the focused control (a v-if, or a native`
          + ' `disabled`) leaves the browser nowhere to put focus; keep it mounted and use'
          + ' aria-disabled with a guarded handler (gh#225)'
  })

  const finalFocusOk = read !== undefined && read.activeIsButton
  rows.push({
    label: 'gh#225 — after the last click focus is still on the button, not merely off <body>',
    ok: finalFocusOk,
    detail: finalFocusOk
      ? 'expected document.activeElement === .bf-load-more__button · actual it is'
      : `expected focus to stay put · actual ${read === undefined ? 'unreadable' : describeFocus(read)}`
        + ' — "not <body>" is the floor, not the goal: focus that survives by landing somewhere'
        + ' else is still a focus jump the user did not ask for'
  })

  const inertOk = read !== undefined && read.button && read.ariaDisabled === 'true' && !read.nativeDisabled
  rows.push({
    label: 'gh#225 — the exhausted button is mounted, aria-disabled, and not natively disabled',
    ok: inertOk,
    detail: inertOk
      ? 'expected [aria-disabled="true"] without [disabled] · actual exactly that'
      : `expected the button present with aria-disabled="true" and no native disabled · actual ${read === undefined
        ? 'unreadable'
        : read.button
          ? `aria-disabled=${JSON.stringify(read.ariaDisabled)}, disabled=${read.nativeDisabled}`
          : 'unmounted'} — a native disabled blurs the focused element exactly as an unmount does,`
        + ' so it is not a fix for this defect but a second spelling of it'
  })

  const showing = read?.statusText == null ? null : SHOWING_TEXT.exec(read.statusText)
  const announcementOk = read !== undefined
    && read.status
    && read.statusRole === 'status'
    && read.statusDisplay !== 'none'
    && showing !== null
    && showing[1] === showing[2]
  rows.push({
    label: 'gh#225 — the final announcement survives the fix, mounted and not display:none',
    ok: announcementOk,
    detail: announcementOk && showing !== null
      ? `expected role="status" reading "Showing N of N items" · actual ${JSON.stringify(read?.statusText)}`
        + ` (aria-live=${JSON.stringify(read?.statusLive)}, display ${read?.statusDisplay})`
      : `expected a mounted, non-display:none role="status" reading "Showing N of N items" · actual`
        + ` present=${read?.status ?? false}, role=${JSON.stringify(read?.statusRole ?? null)},`
        + ` display=${JSON.stringify(read?.statusDisplay ?? null)}, text=${JSON.stringify(read?.statusText ?? null)}`
        + ' — the region outliving the button is the whole reason the wrapper carries'
        + ' `v-if="hasMore || announcement"` (D29); this row is what stops gh#225 regressing it'
  })

  const describedOk = read !== undefined
    && read.describedBy !== null
    && read.describedBy === read.statusId
    && read.statusId !== null
    && read.statusId !== ''
  rows.push({
    label: 'gh#225 — the inert button says why, via aria-describedby → the status region',
    ok: describedOk,
    detail: describedOk
      ? `expected aria-describedby to resolve to the status region · actual ${JSON.stringify(read?.describedBy)}`
      : `expected aria-describedby === the status region's id · actual describedby`
        + ` ${JSON.stringify(read?.describedBy ?? null)}, status id ${JSON.stringify(read?.statusId ?? null)}`
        + ' — a control left in the tab order announcing only "unavailable" tells the reader'
        + ' nothing about why; the sentence explaining it is already on the page'
  })

  return rows
}

/* ------------------------------------------------------------------ *
 * D29 — the result-count region is a mounted, exposed live region (gh#226)
 * ------------------------------------------------------------------ */
/**
 * `bfResultCount` is the count line lifted out of `bfSearchShell` (gh#226).
 * The one property it exists to hold is that the `role="status"` element is in
 * the DOM — and in the accessibility tree — in every state, so that the first
 * count is a *mutation observed inside* a region that was already there rather
 * than a region arriving with its message pre-loaded, which announces nothing.
 *
 * ## What this group asserts, and where
 *
 * `/search?q=democracy` — the state this row owns. The region must be the sole
 * `[data-bf-search-shell="count"]` on the page, must be the atom (`.bf-result-
 * count`) while still carrying the shell's own class hook, must be exposed
 * (not `display: none`, not `visibility: hidden`, no `hidden` attribute), must
 * carry `role="status"` and **neither** `aria-live` **nor** `aria-atomic`, and
 * must read the sentence the shell read before the extraction — with the noun
 * agreeing with the number, which is the pluralisation that moved into the
 * atom.
 *
 * The `aria-live`/`aria-atomic` rows are not pedantry. `role="status"` already
 * implies both, and an extraction is exactly the moment someone adds them
 * "for safety" — after which the two can drift apart silently. `bfLoadMore`
 * writes all three deliberately and says why in its own comment; that is a
 * different, visually-hidden region and a different call.
 *
 * ## What it does not assert, and why that is not a hole
 *
 * `/search` **idle** is read too, but only for the half this row owns: the
 * region is still mounted and still carries `role="status"`. Its computed
 * `display` is *printed, not judged*. It is `none` today because
 * `pages/search.vue`'s `@layer overrides` rule says so, deliberately and with
 * the trade-off written out at the rule — and removing that override is
 * **#233**, which also wires `:count="null"` so the idle region is empty rather
 * than reading "0 results". Failing that here would be a gate that cannot pass
 * on the branch that adds it (a11y BRIEF §5). The printed value is the
 * before-measurement #233 inherits.
 *
 * It asserts nothing about what a screen reader says. There is no assistive
 * technology on this runner (a11y BRIEF §0.2); the announcement itself is the
 * manual pass in §8.
 */
const RESULT_COUNT_QUERY = 'democracy'
const RESULT_COUNT_ROUTE = `/search?q=${RESULT_COUNT_QUERY}`
const RESULT_COUNT_IDLE_ROUTE = '/search'

/**
 * The sentence `bfSearchShell` composed before gh#226, and must still.
 *
 * The query is escaped into the pattern rather than interpolated raw: it is a
 * constant today and a word, but a later probe query containing `.`, `?` or `+`
 * would otherwise widen this assertion silently instead of failing loudly,
 * which is the one failure mode a gate must not have.
 */
const COUNT_SENTENCE = new RegExp(
  `^(\\d+) (results?) for “${RESULT_COUNT_QUERY.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}”, ranked by relevance$`
)

/**
 * The count region as the browser sees it.
 *
 * `getComputedStyle` rather than a look at the style attribute: the rule that
 * hides this element on idle `/search` is a page-scoped `@layer overrides`
 * rule addressing a `data-` hook, which no attribute read would ever find.
 *
 * `role`, `aria-live` and `aria-atomic` are read as literal attributes rather
 * than through their IDL reflections — the attribute is what the markup has to
 * carry, and the reflections are not in every engine this script may be pointed
 * at (the same call `READ_PAGE`'s list gate makes).
 */
const READ_RESULT_COUNT = `(() => {
  const nodes = Array.from(document.querySelectorAll('[data-bf-search-shell="count"]'))
  const el = nodes[0] || null
  const style = el ? getComputedStyle(el) : null
  return {
    matches: nodes.length,
    tag: el ? el.tagName.toLowerCase() : null,
    isAtom: el ? el.classList.contains('bf-result-count') : false,
    keepsShellHook: el ? el.classList.contains('bf-search-shell__count') : false,
    role: el ? el.getAttribute('role') : null,
    ariaLive: el ? el.getAttribute('aria-live') : null,
    ariaAtomic: el ? el.getAttribute('aria-atomic') : null,
    hiddenAttr: el ? el.hasAttribute('hidden') : false,
    display: style ? style.display : null,
    visibility: style ? style.visibility : null,
    text: el ? (el.textContent || '').replace(/\\s+/g, ' ').trim() : null
  }
})()`

type ResultCountRead = {
  matches: number
  tag: string | null
  isAtom: boolean
  keepsShellHook: boolean
  role: string | null
  ariaLive: string | null
  ariaAtomic: string | null
  hiddenAttr: boolean
  display: string | null
  visibility: string | null
  text: string | null
}

const resultCountRows = async (cdp: Cdp, origin: string): Promise<Row[]> => {
  const { targetId } = await cdp.send<{ targetId: string }>('Target.createTarget', { url: 'about:blank' })
  const { sessionId } = await cdp.send<{ sessionId: string }>('Target.attachToTarget', { targetId, flatten: true })

  let queried: ResultCountRead | undefined
  let idle: ResultCountRead | undefined
  let reached: string | undefined

  try {
    /* Cleared and restored for the reason gh#224's probe gives: with
       `watching` unset the client files every target's console output into the
       shared arrays the per-route rows are judged on. */
    cdp.exceptions = []
    cdp.consoleErrors = []
    cdp.watching = sessionId
    await cdp.send('Runtime.enable', {}, sessionId)
    await cdp.send('Page.enable', {}, sessionId)
    await cdp.send(
      'Emulation.setDeviceMetricsOverride',
      { width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: false },
      sessionId
    )

    /**
     * Navigate, wait for hydration, read the region.
     *
     * A full `Page.navigate` for the idle route rather than a router push:
     * `?q=` → no query is exactly the transition a bookmarked search and a
     * back-navigation make, and it re-runs the page's own setup, which is what
     * decides `data-bf-search`.
     */
    const visit = async (route: string): Promise<ResultCountRead | undefined> => {
      await cdp.send('Page.navigate', { url: `${origin}${route}` }, sessionId)

      const deadline = Date.now() + timeoutMs
      let hydrated = false
      while (Date.now() < deadline) {
        await sleep(150)
        try {
          const evaluated = await cdp.send<{ result: { value?: PageRead } }>(
            'Runtime.evaluate',
            { expression: READ_PAGE, returnByValue: true },
            sessionId
          )
          if (evaluated.result?.value?.hydrated === true) { hydrated = true; break }
        } catch {
          /* navigation swaps the execution context; keep polling */
        }
      }
      if (!hydrated) {
        reached = route
        return undefined
      }

      /* One settle after hydration: the ranking is a computed over the payload
         and lands in the same tick, but the region's text is what is being
         judged and a read racing the first patch would report the SSR string. */
      await sleep(250)
      const evaluated = await cdp.send<{ result: { value?: ResultCountRead } }>(
        'Runtime.evaluate',
        { expression: READ_RESULT_COUNT, returnByValue: true },
        sessionId
      )
      return evaluated.result?.value
    }

    queried = await visit(RESULT_COUNT_ROUTE)
    if (queried !== undefined) idle = await visit(RESULT_COUNT_IDLE_ROUTE)
  } finally {
    await cdp.send('Target.closeTarget', { targetId }).catch(() => {})
    /* After the close, so anything the dying target flushes still counts. */
    cdp.watching = undefined
  }

  if (queried === undefined || idle === undefined) {
    return [{
      label: `gh#226 — ${reached ?? RESULT_COUNT_ROUTE} hydrated, so its count region can be read`,
      ok: false,
      detail: `expected #__nuxt.__vue_app__ within ${timeoutMs}ms · actual absent`
        + ' — without a running app there is no live region to judge, so this group is'
        + ' untested rather than green'
    }]
  }

  const rows: Row[] = []

  rows.push({
    label: `gh#226 — ${RESULT_COUNT_ROUTE} exposes exactly one count region`,
    ok: queried.matches === 1,
    detail: queried.matches === 1
      ? 'expected 1 [data-bf-search-shell="count"] · actual 1'
      : `expected exactly 1 [data-bf-search-shell="count"] · actual ${queried.matches}`
        + ' — 0 means the extraction dropped the hook pages.search.vue addresses by name;'
        + ' more than 1 means two regions announce the same count over each other'
  })

  const isTheAtom = queried.tag === 'p' && queried.isAtom && queried.keepsShellHook
  rows.push({
    label: 'gh#226 — the region is bfResultCount and still carries bfSearchShell\'s class',
    ok: isTheAtom,
    detail: isTheAtom
      ? 'expected p.bf-result-count.bf-search-shell__count · actual it is'
      : `expected p.bf-result-count.bf-search-shell__count · actual <${queried.tag ?? '—'}>,`
        + ` .bf-result-count ${queried.isAtom ? 'yes' : 'no'},`
        + ` .bf-search-shell__count ${queried.keepsShellHook ? 'yes' : 'no'}`
        + ' — $attrs must fall through to the atom\'s single root so both hooks survive'
  })

  const exposed = queried.display !== 'none' && queried.visibility !== 'hidden' && !queried.hiddenAttr
  rows.push({
    label: 'gh#226 — D29: the queried region is in the accessibility tree, not display:none',
    ok: exposed,
    detail: exposed
      ? `expected display ≠ none · actual display ${queried.display}, visibility ${queried.visibility},`
        + ' no [hidden]'
      : `expected an exposed region · actual display ${queried.display},`
        + ` visibility ${queried.visibility}, [hidden] ${queried.hiddenAttr ? 'present' : 'absent'}`
        + ' — each of those removes the live region from the tree, which is the defect D29 forbids'
  })

  const roleAlone = queried.role === 'status' && queried.ariaLive === null && queried.ariaAtomic === null
  rows.push({
    label: 'gh#226 — role="status" alone, with no aria-live and no aria-atomic beside it',
    ok: roleAlone,
    detail: roleAlone
      ? 'expected role="status", no aria-live, no aria-atomic · actual exactly that'
      : `expected role="status" alone · actual role ${JSON.stringify(queried.role)},`
        + ` aria-live ${JSON.stringify(queried.ariaLive)}, aria-atomic ${JSON.stringify(queried.ariaAtomic)}`
        + ' — the role implies both; stating them alongside it creates two things that can drift'
  })

  const sentence = COUNT_SENTENCE.exec(queried.text ?? '')
  const counted = sentence === null ? Number.NaN : Number(sentence[1])
  const agrees = sentence !== null && sentence[2] === (counted === 1 ? 'result' : 'results')
  rows.push({
    label: 'gh#226 — the extracted sentence is unchanged, and the noun agrees with the number',
    ok: sentence !== null && agrees,
    detail: sentence !== null && agrees
      ? `expected /${COUNT_SENTENCE.source}/ · actual ${JSON.stringify(queried.text)}`
      : `expected /${COUNT_SENTENCE.source}/ · actual ${JSON.stringify(queried.text)}`
        + ' — the extraction must carry the count, the pluralisation, the query clause and'
        + ' the caller\'s suffix across character-for-character'
  })

  /* Non-vacuity, the same shape as gh#225's "the walk found a button": a query
     that matched nothing would still render a well-formed "0 results for …",
     and every row above would pass while testing a page with no results on it. */
  rows.push({
    label: `gh#226 — non-vacuity: “${RESULT_COUNT_QUERY}” matched something to count`,
    ok: Number.isFinite(counted) && counted > 0,
    detail: Number.isFinite(counted) && counted > 0
      ? `expected > 0 · actual ${counted}`
      : `expected > 0 · actual ${Number.isFinite(counted) ? counted : 'unreadable'}`
        + ' — the rows above would all pass against an empty result set, so this one'
        + ' fails the group rather than let the probe go quietly vacuous'
  })

  const idleMounted = idle.matches === 1 && idle.role === 'status' && idle.isAtom
  rows.push({
    label: `gh#226 — ${RESULT_COUNT_IDLE_ROUTE} idle still MOUNTS the region with role="status"`,
    ok: idleMounted,
    detail: idleMounted
      ? 'expected the region present in the DOM while idle · actual present, role="status"'
      : `expected 1 mounted p.bf-result-count[role=status] · actual ${idle.matches} match(es),`
        + ` role ${JSON.stringify(idle.role)}, .bf-result-count ${idle.isAtom ? 'yes' : 'no'}`
        + ' — a v-if here is the one thing this component exists to prevent (D29)'
  })

  /* Reported, never failed — see the header. The override is pages/search.vue's
     and removing it is #233's row, not this one's. */
  rows.push({
    label: `gh#226 — idle computed display is “${idle.display}” (reported for #233, not judged here)`,
    ok: true,
    detail: idle.display === 'none'
      ? 'display: none while idle — pages/search.vue\'s @layer overrides rule, which takes the'
        + ' region out of the accessibility tree so the FIRST count may not be announced.'
        + ' #233 removes it and passes :count="null" so the idle region is empty instead'
      : `display: ${idle.display} — the page-level override is gone, so #233 has landed;`
        + ' promote this row to a failure if it ever reads none again'
  })

  return rows
}

/* ------------------------------------------------------------------ *
 * The search landmark and its form (a11y epic, gh#227)
 * ------------------------------------------------------------------ */
/**
 * `/search` had no search landmark and no `<form>` at all. Measured before the
 * fix: `document.querySelectorAll('[role=search],search').length === 0` and
 * `document.querySelectorAll('form').length === 0` — so a screen-reader user
 * could not jump to the search region, and Enter in the query field did
 * nothing, because an input with no form owner has no implicit submission.
 *
 * ## What this group asserts
 *
 * Structure, read once from the hydrated page:
 *
 * 1. Exactly **one** `[role="search"], search` element. One, not "at least
 *    one": the top bar's search entry is an ordinary `<a href="/search">`, and
 *    a second region would make "jump to search" ambiguous rather than useful.
 * 2. That element is `bfSearchShell`'s root — `<search>`, `role="search"`,
 *    `.bf-search-shell`. Both halves, because the element alone is invisible to
 *    an engine whose tag table predates it and the role alone throws away the
 *    native semantics.
 * 3. Exactly one `<form>`, and no `<form>` inside another.
 * 4. The search input's **form owner** is that form — `input.form === theForm`,
 *    not `form.contains(input)`. Form ownership is the property implicit
 *    submission is defined against, and a `form=` attribute can move it
 *    somewhere the containment test would still be happy with.
 * 5. The visible label survives: a real `<label for>` pointing at the input,
 *    carrying the caller's text, computed `display` not `none`. This is the
 *    half of the row most easily lost by "tidying" the field into a
 *    placeholder or an `aria-label`, and the audit measured it as already
 *    correct — so it is a regression guard, not a fix.
 * 6. Exactly one `[type="submit"]` control inside the form.
 *
 * Behaviour, driven with **real input events** — never `el.click()`, never a
 * programmatic `.focus()` (a11y BRIEF §5):
 *
 * 7. **Live filtering still works.** A real mouse press focuses the field,
 *    `Input.insertText` types into it, no Enter is pressed, and `?q=` appears
 *    in the URL once the debounce window has closed. gh#227 is additive; a
 *    form that replaced the live filtering would be a regression this row
 *    catches.
 * 8. **A real Enter keypress submits, and nothing reloads.** A marker set on
 *    `window` before the keypress must survive it — a full document navigation
 *    would clear it — the form must have fired exactly **one** `submit` event,
 *    that event's default must have been **prevented**, and the URL must carry
 *    the text that was typed.
 * 9. **Focus survives the submit** (DoD-A6, on the one transition this row
 *    adds): `document.activeElement` is still the query input. `onSubmit`
 *    touches focus not at all, and this is the row that keeps it that way — a
 *    blur on submit, or a re-render that replaced the control, would drop the
 *    reader who just pressed Enter onto `<body>`.
 * 10. Non-vacuity: the probe actually focused the input. Without it, rows 7–9
 *    would pass green against a page the probe never touched.
 *
 * It asserts nothing about what a screen reader announces for the landmark.
 * There is no assistive technology on this runner (a11y BRIEF §0.2); that is
 * the manual pass in §8.
 */
const SEARCH_LANDMARK_ROUTE = '/search'
/** The label `pages/search.vue:420` passes, which must stay a visible one. */
const SEARCH_LABEL = 'Search insights, projects and people'
/** Typed live-filter term, then the word Enter has to carry into the URL. */
const SEARCH_TYPED = 'democracy'
const SEARCH_SUBMITTED = 'democracy now'

/**
 * The structural read. Attributes rather than IDL reflections, the same call
 * `READ_PAGE`'s list gate and gh#226's count read both make.
 */
const READ_SEARCH_STRUCTURE = `(() => {
  const landmarks = Array.from(document.querySelectorAll('[role="search"], search'))
  const root = landmarks[0] || null
  const forms = Array.from(document.querySelectorAll('form'))
  const form = forms[0] || null
  const input = document.querySelector('.bf-search-shell input[type="search"]')
  const label = input && input.id
    ? document.querySelector('label[for="' + CSS.escape(input.id) + '"]')
    : null
  const labelStyle = label ? getComputedStyle(label) : null
  return {
    landmarks: landmarks.length,
    rootTag: root ? root.tagName.toLowerCase() : null,
    rootRole: root ? root.getAttribute('role') : null,
    rootIsShell: root ? root.classList.contains('bf-search-shell') : false,
    forms: forms.length,
    nestedForms: forms.filter(f => f.parentElement && f.parentElement.closest('form')).length,
    hasInput: !!input,
    inputOwnedByForm: !!(input && form && input.form === form),
    inputInsideLandmark: !!(input && root && root.contains(input)),
    labelText: label ? (label.textContent || '').replace(/\\s+/g, ' ').trim() : null,
    labelDisplay: labelStyle ? labelStyle.display : null,
    labelVisibility: labelStyle ? labelStyle.visibility : null,
    submits: form ? form.querySelectorAll('[type="submit"]').length : 0,
    inputRect: input ? (r => ({ x: r.x, y: r.y, width: r.width, height: r.height }))(input.getBoundingClientRect()) : null
  }
})()`

type SearchStructureRead = {
  landmarks: number
  rootTag: string | null
  rootRole: string | null
  rootIsShell: boolean
  forms: number
  nestedForms: number
  hasInput: boolean
  inputOwnedByForm: boolean
  inputInsideLandmark: boolean
  labelText: string | null
  labelDisplay: string | null
  labelVisibility: string | null
  submits: number
  inputRect: { x: number, y: number, width: number, height: number } | null
}

/**
 * Instrumentation, installed **before** the Enter keypress.
 *
 * The `submit` listener is a capture-phase one so it runs whether or not Vue's
 * bubble-phase handler stops propagation; `defaultPrevented` is read one macro
 * task later, by which time the whole dispatch — Vue's handler and its
 * `.prevent` modifier included — has finished.
 *
 * `window.__gh227Marker` is the reload detector. A full document navigation
 * builds a new `window`, so the marker is simply gone; a router `replace` — the
 * transition `pages/search.vue` actually performs — leaves it in place.
 */
const ARM_SEARCH_SUBMIT = `(() => {
  const form = document.querySelector('form')
  if (!form) return false
  window.__gh227Marker = 'alive'
  window.__gh227Submits = 0
  window.__gh227Prevented = null
  form.addEventListener('submit', event => {
    window.__gh227Submits += 1
    setTimeout(() => { window.__gh227Prevented = event.defaultPrevented }, 0)
  }, true)
  return true
})()`

const READ_SEARCH_SUBMIT = `(() => {
  const input = document.querySelector('.bf-search-shell input[type="search"]')
  return {
    marker: window.__gh227Marker || null,
    submits: typeof window.__gh227Submits === 'number' ? window.__gh227Submits : null,
    prevented: window.__gh227Prevented,
    search: location.search,
    value: input ? input.value : null,
    activeIsInput: !!input && document.activeElement === input,
    activeIsBody: document.activeElement === document.body,
    active: document.activeElement
      ? document.activeElement.tagName.toLowerCase()
        + (document.activeElement.id === '' ? '' : '#' + document.activeElement.id)
      : null
  }
})()`

type SearchSubmitRead = {
  marker: string | null
  submits: number | null
  prevented: boolean | null
  search: string
  value: string | null
  activeIsInput: boolean
  activeIsBody: boolean
  active: string | null
}

const searchLandmarkRows = async (cdp: Cdp, origin: string): Promise<Row[]> => {
  const { targetId } = await cdp.send<{ targetId: string }>('Target.createTarget', { url: 'about:blank' })
  const { sessionId } = await cdp.send<{ sessionId: string }>('Target.attachToTarget', { targetId, flatten: true })

  let structure: SearchStructureRead | undefined
  let focused = false
  let afterTyping: SearchSubmitRead | undefined
  let afterEnter: SearchSubmitRead | undefined
  let armed = false
  let note: string | undefined

  try {
    /* Cleared and restored for gh#224's reason: with `watching` unset the
       client files every target's console output into the shared arrays the
       per-route rows are judged on. */
    cdp.exceptions = []
    cdp.consoleErrors = []
    cdp.watching = sessionId
    await cdp.send('Runtime.enable', {}, sessionId)
    await cdp.send('Page.enable', {}, sessionId)
    await cdp.send(
      'Emulation.setDeviceMetricsOverride',
      { width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: false },
      sessionId
    )
    await cdp.send('Page.navigate', { url: `${origin}${SEARCH_LANDMARK_ROUTE}` }, sessionId)

    const deadline = Date.now() + timeoutMs
    let hydrated = false
    while (Date.now() < deadline) {
      await sleep(150)
      try {
        const evaluated = await cdp.send<{ result: { value?: PageRead } }>(
          'Runtime.evaluate',
          { expression: READ_PAGE, returnByValue: true },
          sessionId
        )
        if (evaluated.result?.value?.hydrated === true) { hydrated = true; break }
      } catch {
        /* navigation swaps the execution context; keep polling */
      }
    }

    if (hydrated) {
      await sleep(250)
      const read = await cdp.send<{ result: { value?: SearchStructureRead } }>(
        'Runtime.evaluate',
        { expression: READ_SEARCH_STRUCTURE, returnByValue: true },
        sessionId
      )
      structure = read.result?.value

      const rect = structure?.inputRect ?? null
      if (
        rect !== null
        && rect.width > 0
        && rect.height > 0
        && rect.y >= 0
        && rect.y + rect.height <= viewport.height
      ) {
        /* A real press, not `.focus()` — a11y BRIEF §5. */
        const x = Math.round(rect.x + rect.width / 2)
        const y = Math.round(rect.y + rect.height / 2)
        await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 }, sessionId)
        await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 }, sessionId)

        const active = await cdp.send<{ result: { value?: boolean } }>(
          'Runtime.evaluate',
          { expression: `document.activeElement === document.querySelector('.bf-search-shell input[type="search"]')`, returnByValue: true },
          sessionId
        )
        focused = active.result?.value === true

        if (focused) {
          /* Typing only. No Enter — this half is the live filtering, which the
             form must not have replaced. One settle past the 250ms debounce. */
          await cdp.send('Input.insertText', { text: SEARCH_TYPED }, sessionId)
          await sleep(900)
          afterTyping = (await cdp.send<{ result: { value?: SearchSubmitRead } }>(
            'Runtime.evaluate',
            { expression: READ_SEARCH_SUBMIT, returnByValue: true },
            sessionId
          )).result?.value

          /* Now the submit half. Armed after the live-filter navigation so the
             marker is set on the window the keypress will be judged against. */
          armed = (await cdp.send<{ result: { value?: boolean } }>(
            'Runtime.evaluate',
            { expression: ARM_SEARCH_SUBMIT, returnByValue: true },
            sessionId
          )).result?.value === true

          await cdp.send('Input.insertText', { text: ' now' }, sessionId)
          await cdp.send('Input.dispatchKeyEvent', {
            type: 'rawKeyDown', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13, key: 'Enter', code: 'Enter'
          }, sessionId)
          await cdp.send('Input.dispatchKeyEvent', {
            type: 'char', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13, key: 'Enter', code: 'Enter', text: '\r', unmodifiedText: '\r'
          }, sessionId)
          await cdp.send('Input.dispatchKeyEvent', {
            type: 'keyUp', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13, key: 'Enter', code: 'Enter'
          }, sessionId)

          await sleep(900)
          afterEnter = (await cdp.send<{ result: { value?: SearchSubmitRead } }>(
            'Runtime.evaluate',
            { expression: READ_SEARCH_SUBMIT, returnByValue: true },
            sessionId
          )).result?.value
        }
      } else {
        note = `the query input's rect is ${JSON.stringify(rect)},`
          + ` which is not inside the ${viewport.width}x${viewport.height} viewport — nothing to press`
      }
    }

    if (!hydrated) note = `expected #__nuxt.__vue_app__ within ${timeoutMs}ms · actual absent`
  } finally {
    await cdp.send('Target.closeTarget', { targetId }).catch(() => {})
    /* After the close, so anything the dying target flushes still counts. */
    cdp.watching = undefined
  }

  if (structure === undefined) {
    return [{
      label: `gh#227 — ${SEARCH_LANDMARK_ROUTE} hydrated, so its landmark and form can be read`,
      ok: false,
      detail: `${note ?? 'the page did not answer'}`
        + ' — without a running app there is no landmark to judge, so this group is'
        + ' untested rather than green'
    }]
  }

  const rows: Row[] = []

  rows.push({
    label: `gh#227 — ${SEARCH_LANDMARK_ROUTE} exposes exactly one search landmark`,
    ok: structure.landmarks === 1,
    detail: structure.landmarks === 1
      ? 'expected 1 [role="search"], search · actual 1'
      : `expected exactly 1 [role="search"], search · actual ${structure.landmarks}`
        + ' — 0 is the defect gh#227 fixes; more than 1 makes "jump to search" ambiguous,'
        + ' and the top bar\'s search entry is a plain <a href="/search"> that must not become one'
  })

  const rootOk = structure.rootTag === 'search' && structure.rootRole === 'search' && structure.rootIsShell
  rows.push({
    label: 'gh#227 — the landmark is bfSearchShell\'s root: <search role="search">.bf-search-shell',
    ok: rootOk,
    detail: rootOk
      ? 'expected <search role="search" class="bf-search-shell"> · actual it is'
      : `expected <search role="search"> carrying .bf-search-shell · actual <${structure.rootTag ?? '—'}>,`
        + ` role ${JSON.stringify(structure.rootRole)}, .bf-search-shell ${structure.rootIsShell ? 'yes' : 'no'}`
        + ' — the element alone is invisible to an engine whose tag table predates it, and'
        + ' the role alone throws the native semantics away; gh#227 writes both'
  })

  const formsOk = structure.forms === 1 && structure.nestedForms === 0
  rows.push({
    label: 'gh#227 — exactly one <form> on the page, and none nested inside another',
    ok: formsOk,
    detail: formsOk
      ? 'expected 1 form, 0 nested · actual 1, 0'
      : `expected 1 form and 0 nested · actual ${structure.forms} form(s),`
        + ` ${structure.nestedForms} nested — a nested form is dropped by the HTML parser,`
        + ' which silently takes the inner control\'s owner away again'
  })

  const ownershipOk = structure.hasInput && structure.inputOwnedByForm && structure.inputInsideLandmark
  rows.push({
    label: 'gh#227 — the query input\'s form OWNER is that form, and it sits inside the landmark',
    ok: ownershipOk,
    detail: ownershipOk
      ? 'expected input.form === the form · actual it is, and the landmark contains it'
      : `expected input.form === the page's form · actual input ${structure.hasInput ? 'present' : 'absent'},`
        + ` owned ${structure.inputOwnedByForm ? 'yes' : 'no'},`
        + ` inside the landmark ${structure.inputInsideLandmark ? 'yes' : 'no'}`
        + ' — ownership, not containment, is what implicit submission is defined against'
  })

  const labelVisible = structure.labelText === SEARCH_LABEL
    && structure.labelDisplay !== 'none'
    && structure.labelVisibility !== 'hidden'
  rows.push({
    label: `gh#227 — the input keeps its VISIBLE <label for>: “${SEARCH_LABEL}”`,
    ok: labelVisible,
    detail: labelVisible
      ? `expected a rendered label[for] reading ${JSON.stringify(SEARCH_LABEL)} · actual exactly that`
      : `expected a rendered label[for] reading ${JSON.stringify(SEARCH_LABEL)} · actual`
        + ` ${JSON.stringify(structure.labelText)}, display ${structure.labelDisplay},`
        + ` visibility ${structure.labelVisibility}`
        + ' — the audit measured this as already correct, so this row is the regression guard:'
        + ' a placeholder or an aria-label is not a replacement for it'
  })

  rows.push({
    label: 'gh#227 — the form carries exactly one submit control',
    ok: structure.submits === 1,
    detail: structure.submits === 1
      ? 'expected 1 [type="submit"] inside the form · actual 1'
      : `expected exactly 1 [type="submit"] inside the form · actual ${structure.submits}`
        + ' — 0 leaves Enter\'s result to the implicit-submission fallback alone, which no'
        + ' markup states; more than 1 makes the default button a question of DOM order'
  })

  /* Non-vacuity first, so a failure here explains the two behaviour rows
     below rather than letting them read as product defects. */
  rows.push({
    label: 'gh#227 — non-vacuity: a real mouse press focused the query input',
    ok: focused,
    detail: focused
      ? 'expected document.activeElement === the input after a real press · actual it is'
      : `expected a real press to focus the input · actual it did not`
        + `${note === undefined ? '' : ` (${note})`}`
        + ' — the two behaviour rows below would otherwise pass against a field nothing typed into'
  })

  const typedSearch = afterTyping?.search ?? ''
  const liveOk = focused && /(?:^|[?&])q=/.test(typedSearch) && decodeURIComponent(typedSearch).includes(SEARCH_TYPED)
  rows.push({
    label: `gh#227 — live filtering survives the form: typing “${SEARCH_TYPED}” alone writes ?q=`,
    ok: liveOk,
    detail: liveOk
      ? `expected ?q=${SEARCH_TYPED} after the debounce, with no Enter · actual ${JSON.stringify(typedSearch)}`
      : `expected ?q=${SEARCH_TYPED} after the debounce, with no Enter pressed · actual`
        + ` ${JSON.stringify(typedSearch)} — gh#227 is additive; a form that replaced the`
        + ' debounced @update:query would be the regression this row exists for'
  })

  const enterSearch = afterEnter?.search ?? ''
  const enterOk = armed
    && afterEnter !== undefined
    && afterEnter.marker === 'alive'
    && afterEnter.submits === 1
    && afterEnter.prevented === true
    && decodeURIComponent(enterSearch.replace(/\+/g, ' ')).includes(SEARCH_SUBMITTED)
  rows.push({
    label: 'gh#227 — a real Enter keypress submits once, is prevented, and reloads nothing',
    ok: enterOk,
    detail: enterOk
      ? `expected 1 prevented submit, the window marker alive and ?q=${SEARCH_SUBMITTED}`
        + ` · actual exactly that — ${JSON.stringify(enterSearch)}`
      : `expected the form armed, 1 submit event, defaultPrevented true, window.__gh227Marker`
        + ` still "alive" and ?q=${SEARCH_SUBMITTED} · actual armed ${armed},`
        + ` submits ${JSON.stringify(afterEnter?.submits ?? null)},`
        + ` prevented ${JSON.stringify(afterEnter?.prevented ?? null)},`
        + ` marker ${JSON.stringify(afterEnter?.marker ?? null)},`
        + ` search ${JSON.stringify(enterSearch)}`
        + ' — a lost marker means the document navigated, which is exactly what @submit.prevent'
        + ' is there to stop'
  })

  /* DoD-A6, on the one transition gh#227 adds. Submitting re-renders the
     results band under the field; a handler that blurred, or a re-render that
     replaced the input, would leave the reader who just pressed Enter standing
     on <body>. `onSubmit` deliberately touches focus not at all, and this row
     is what keeps it that way. */
  const focusKept = afterEnter !== undefined && afterEnter.activeIsInput && !afterEnter.activeIsBody
  rows.push({
    label: 'gh#227 — DoD-A6: after Enter, focus is still in the query field, not on <body>',
    ok: focusKept,
    detail: focusKept
      ? 'expected document.activeElement === the query input after submit · actual it is'
      : `expected focus still in the query input after Enter · actual`
        + ` ${JSON.stringify(afterEnter?.active ?? null)}`
        + ' — onSubmit must not blur, and the re-render under it must not replace the control'
  })

  return rows
}

/* ------------------------------------------------------------------ *
 * Composite-widget roles + the two-way disclosure (a11y epic, gh#228)
 * ------------------------------------------------------------------ */
/**
 * Two independent halves, one group. See the header section of the same name
 * for the defect each was measured against and for why the accordion's wiring
 * is asserted from source while its behaviour is asserted with real keys.
 */
const FILTER_BAR_ROUTE = '/insights'
const ACCORDION_ROUTE = '/archive'

/**
 * The roles that own a roving tabindex, per ARIA APG. A chip at `tabindex=-1`
 * is only defensible under one of these; under anything else — `group`
 * included — it is simply out of the tab order.
 */
const COMPOSITE_ROLES = new Set([
  'toolbar', 'radiogroup', 'listbox', 'grid', 'menubar', 'menu', 'tablist', 'tree', 'treegrid'
])

type ChipRead = {
  key: string | null
  tabIndex: number
  hasTabIndexAttr: boolean
  ariaPressed: string | null
  tag: string
  disabled: boolean
}

type FilterBarRead = {
  bars: Array<{
    role: string | null
    ariaLabel: string | null
    labelledBy: string | null
    labelledByText: string | null
    chips: ChipRead[]
  }>
}

const READ_FILTER_BARS = `(() => {
  const bars = Array.from(document.querySelectorAll('.bf-filter-bar')).map(bar => {
    const ids = (bar.getAttribute('aria-labelledby') || '').trim()
    const labelledByText = ids === ''
      ? null
      : ids.split(/\\s+/)
          .map(id => { const el = document.getElementById(id); return el ? (el.textContent || '').trim() : '' })
          .join(' ')
          .trim()
    return {
      role: bar.getAttribute('role'),
      ariaLabel: bar.getAttribute('aria-label'),
      labelledBy: ids === '' ? null : ids,
      labelledByText: labelledByText === '' ? null : labelledByText,
      chips: Array.from(bar.querySelectorAll('[data-filter-key]')).map(chip => ({
        key: chip.getAttribute('data-filter-key'),
        tabIndex: chip.tabIndex,
        hasTabIndexAttr: chip.hasAttribute('tabindex'),
        ariaPressed: chip.getAttribute('aria-pressed'),
        tag: chip.tagName.toLowerCase(),
        disabled: !!chip.disabled
      }))
    }
  })
  return { bars: bars }
})()`

/**
 * A `focusin` recorder. Installed once per navigation, before the first Tab, so
 * the walk below reads what focus actually visited rather than sampling
 * `document.activeElement` between every press.
 *
 * `focusin` rather than `focus`: it bubbles, so one listener on the document
 * sees every element, and it fires for the same elements a `focus` handler
 * would. Nothing here calls `.focus()` — the recorder only observes.
 */
const ARM_FOCUS_RECORDER = `(() => {
  window.__gh228Focus = []
  if (!window.__gh228Armed) {
    window.__gh228Armed = true
    document.addEventListener('focusin', event => {
      const el = event.target
      if (!el || !el.tagName) return
      window.__gh228Focus.push({
        key: el.getAttribute ? el.getAttribute('data-filter-key') : null,
        summary: !!(el.classList && el.classList.contains('bf-accordion__summary')),
        tag: el.tagName.toLowerCase()
      })
    })
  }
  return true
})()`

const READ_FOCUS_RECORDER = `(() => (window.__gh228Focus || []))()`

type FocusHit = { key: string | null, summary: boolean, tag: string }

type AccordionRead = {
  count: number
  open: boolean[]
  labels: string[]
  activeIsSummary: boolean
  activeSummaryIndex: number
}

const READ_ACCORDIONS = `(() => {
  const all = Array.from(document.querySelectorAll('details.bf-accordion'))
  const active = document.activeElement
  return {
    count: all.length,
    open: all.map(el => el.open),
    labels: all.map(el => {
      const s = el.querySelector('.bf-accordion__summary')
      return s ? (s.textContent || '').trim() : ''
    }),
    activeIsSummary: !!(active && active.classList && active.classList.contains('bf-accordion__summary')),
    activeSummaryIndex: all.findIndex(el => el.querySelector('.bf-accordion__summary') === active)
  }
})()`

/**
 * One real key press.
 *
 * `rawKeyDown` + `keyUp` for the keys whose default action Chrome performs on
 * keydown (Tab, the arrows). **Enter needs the `char` event in between** —
 * measured while building this gate: `rawKeyDown`/`keyUp` alone leaves a
 * focused `<summary>` untoggled, because summary activation hangs off the
 * character event, not the raw one. That is the same three-event sequence
 * gh#227's Enter uses to submit the search form.
 */
const pressKey = async (
  cdp: Cdp,
  sessionId: string,
  key: 'Tab' | 'Enter' | 'ArrowRight',
  count = 1,
  /** CDP modifier bitmask. 8 is Shift — i.e. `Shift`+`Tab`, focus backwards. */
  modifiers = 0
): Promise<void> => {
  const code = key === 'Tab' ? 9 : key === 'Enter' ? 13 : 39
  for (let i = 0; i < count; i += 1) {
    await cdp.send('Input.dispatchKeyEvent', {
      type: 'rawKeyDown', windowsVirtualKeyCode: code, nativeVirtualKeyCode: code, key, code: key, modifiers
    }, sessionId)
    if (key === 'Enter') {
      await cdp.send('Input.dispatchKeyEvent', {
        type: 'char', windowsVirtualKeyCode: code, nativeVirtualKeyCode: code, key, code: key, modifiers,
        text: '\r', unmodifiedText: '\r'
      }, sessionId)
    }
    await cdp.send('Input.dispatchKeyEvent', {
      type: 'keyUp', windowsVirtualKeyCode: code, nativeVirtualKeyCode: code, key, code: key, modifiers
    }, sessionId)
  }
}

/** Navigate an attached target and wait for the Vue app to hydrate. */
const openHydrated = async (cdp: Cdp, sessionId: string, url: string): Promise<boolean> => {
  await cdp.send('Runtime.enable', {}, sessionId)
  await cdp.send('Page.enable', {}, sessionId)
  await cdp.send(
    'Emulation.setDeviceMetricsOverride',
    { width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: false },
    sessionId
  )
  await cdp.send('Page.navigate', { url }, sessionId)

  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    await sleep(150)
    try {
      const evaluated = await cdp.send<{ result: { value?: PageRead } }>(
        'Runtime.evaluate',
        { expression: READ_PAGE, returnByValue: true },
        sessionId
      )
      if (evaluated.result?.value?.hydrated === true) return true
    } catch {
      /* navigation swaps the execution context; keep polling */
    }
  }
  return false
}

const evaluate = async <T>(cdp: Cdp, sessionId: string, expression: string): Promise<T | undefined> =>
  (await cdp.send<{ result: { value?: T } }>(
    'Runtime.evaluate',
    { expression, returnByValue: true },
    sessionId
  )).result?.value

/* ---- the accordion's wiring, read from source ---- */
const accordionWiringRows = (): Row[] => {
  const rows: Row[] = []
  const component = join(appRoot, 'src/components/bf/Accordion.vue')
  const consumer = join(appRoot, 'src/pages/archive.vue')

  for (const file of [component, consumer]) {
    if (existsSync(file)) continue
    return [{
      label: 'gh#228 — the accordion source files are where this gate expects them',
      ok: false,
      detail: `expected ${file.slice(appRoot.length + 1)} · actual missing`
    }]
  }

  /* Comments stripped first: both files argue about the pattern in prose and
     quote the bindings verbatim, so a raw scan would read the explanation as
     the implementation — the `decorativeGlyphRows` lesson. */
  const strip = (raw: string): string =>
    raw.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/<!--[\s\S]*?-->/g, ' ')

  const accordion = strip(readFileSync(component, 'utf8'))
  const archive = strip(readFileSync(consumer, 'utf8'))

  const declaresEmit = /defineEmits<\{[\s\S]*?['"]update:open['"]\s*:/.test(accordion)
  rows.push({
    label: 'gh#228 — bfAccordion declares an `update:open` emit',
    ok: declaresEmit,
    detail: declaresEmit
      ? 'expected defineEmits<{ \'update:open\': [value: boolean] }> · actual present'
      : 'expected a declared `update:open` emit · actual absent — without it `:open` is a'
        + ' one-way binding and no consumer can hold the reader\'s disclosure state (WCAG 3.2.2)'
  })

  const listensToggle = /<details[^>]*@toggle=/.test(accordion)
  rows.push({
    label: 'gh#228 — the emit is driven by the native `toggle` event on the <details>',
    ok: listensToggle,
    detail: listensToggle
      ? 'expected @toggle on <details> · actual present'
      : 'expected `@toggle` on the <details> itself · actual absent — the browser owns the'
        + ' state (D30, native first), so the only correct trigger is the event it fires'
  })

  const noForcedOpen = !/\.open\s*=(?!=)/.test(accordion)
  rows.push({
    label: 'gh#228 — bfAccordion never writes `.open` back, so it cannot fight the native toggle',
    ok: noForcedOpen,
    detail: noForcedOpen
      ? 'expected no assignment to `.open` in the component · actual none'
      : 'expected the component to report the toggle, not perform it · actual it assigns `.open`'
        + ' — that is a controlled disclosure, which D30 declines to build'
  })

  const consumerBinds = /<bfAccordion[\s\S]*?@update:open=/.test(archive)
    || /<bfAccordion[\s\S]*?v-model:open=/.test(archive)
  rows.push({
    label: `gh#228 — ${ACCORDION_ROUTE}'s call site binds the event`,
    ok: consumerBinds,
    detail: consumerBinds
      ? 'expected @update:open (or v-model:open) on <bfAccordion> · actual present'
      : 'expected archive.vue to bind @update:open or v-model:open · actual neither —'
        + ' an emit nobody listens to leaves the eleven year groups exactly as they were'
  })

  return rows
}

const compositeWidgetRows = async (cdp: Cdp, origin: string): Promise<Row[]> => {
  const rows: Row[] = accordionWiringRows()

  const { targetId } = await cdp.send<{ targetId: string }>('Target.createTarget', { url: 'about:blank' })
  const { sessionId } = await cdp.send<{ sessionId: string }>('Target.attachToTarget', { targetId, flatten: true })

  let filterBars: FilterBarRead | undefined
  let tabbed: FocusHit[] = []
  let arrowMoved: string | null = null
  let arrowFrom: string | null = null
  let accordionAfterFirst: AccordionRead | undefined
  let accordionAfterSecond: AccordionRead | undefined
  let accordionAfterThird: AccordionRead | undefined
  let reachedFirstSummary = false
  let note: string | undefined

  try {
    /* Cleared and restored for gh#224's reason: with `watching` unset the
       client files every target's console output into the shared arrays the
       per-route rows are judged on. */
    cdp.exceptions = []
    cdp.consoleErrors = []
    cdp.watching = sessionId

    /* ---- half 1: the facet rows on /insights ---- */
    if (!(await openHydrated(cdp, sessionId, `${origin}${FILTER_BAR_ROUTE}`))) {
      note = `expected ${FILTER_BAR_ROUTE} to hydrate within ${timeoutMs}ms · actual it did not`
    } else {
      await sleep(250)
      filterBars = await evaluate<FilterBarRead>(cdp, sessionId, READ_FILTER_BARS)

      await evaluate<boolean>(cdp, sessionId, ARM_FOCUS_RECORDER)

      /* Real Tab presses, in batches, stopping as soon as every chip has been
         reached. No `.focus()` anywhere (a11y BRIEF §5). */
      const wanted = new Set(
        (filterBars?.bars ?? []).flatMap(bar => bar.chips.map(chip => chip.key)).filter((k): k is string => k !== null)
      )
      for (let batch = 0; batch < 9; batch += 1) {
        await pressKey(cdp, sessionId, 'Tab', 20)
        await sleep(60)
        tabbed = (await evaluate<FocusHit[]>(cdp, sessionId, READ_FOCUS_RECORDER)) ?? []
        const seen = new Set(tabbed.map(hit => hit.key).filter((k): k is string => k !== null))
        if ([...wanted].every(key => seen.has(key))) break
      }

      /* Arrows, on a fresh load: the batched walk above deliberately overshoots
         the facet region, so it cannot leave focus on a chip to press from.
         This second pass Tabs one press at a time until a chip has focus, then
         presses ArrowRight once. Still no `.focus()` and no `.click()`. */
      if (await openHydrated(cdp, sessionId, `${origin}${FILTER_BAR_ROUTE}`)) {
        await sleep(250)
        const activeChip = `(() => { const a = document.activeElement; return a && a.getAttribute ? a.getAttribute('data-filter-key') : null })()`
        for (let press = 0; press < 60 && arrowFrom === null; press += 1) {
          await pressKey(cdp, sessionId, 'Tab')
          await sleep(25)
          arrowFrom = (await evaluate<string | null>(cdp, sessionId, activeChip)) ?? null
        }
        if (arrowFrom !== null) {
          await pressKey(cdp, sessionId, 'ArrowRight')
          await sleep(80)
          arrowMoved = (await evaluate<string | null>(cdp, sessionId, activeChip)) ?? null
        }
      }
    }

    /* ---- half 2: the disclosure on /archive ---- */
    if (!(await openHydrated(cdp, sessionId, `${origin}${ACCORDION_ROUTE}`))) {
      note = `${note === undefined ? '' : `${note}; `}`
        + `expected ${ACCORDION_ROUTE} to hydrate within ${timeoutMs}ms · actual it did not`
    } else {
      await sleep(250)
      await evaluate<boolean>(cdp, sessionId, ARM_FOCUS_RECORDER)

      /* Tab to the first <summary>, one press at a time so the walk stops on it
         rather than inside the open band's 27 links. */
      for (let press = 0; press < 40 && !reachedFirstSummary; press += 1) {
        await pressKey(cdp, sessionId, 'Tab')
        await sleep(30)
        const read = await evaluate<AccordionRead>(cdp, sessionId, READ_ACCORDIONS)
        if (read?.activeIsSummary === true && read.activeSummaryIndex === 0) reachedFirstSummary = true
      }

      if (reachedFirstSummary) {
        /* 1 — Enter closes the band that was open on load. */
        await pressKey(cdp, sessionId, 'Enter')
        await sleep(120)
        accordionAfterFirst = await evaluate<AccordionRead>(cdp, sessionId, READ_ACCORDIONS)

        /* 2 — one Tab now reaches the *second* summary, because the closed band
           took its rows out of the tab order (native <details>, D30). Enter
           opens it. */
        await pressKey(cdp, sessionId, 'Tab')
        await sleep(60)
        await pressKey(cdp, sessionId, 'Enter')
        await sleep(120)
        accordionAfterSecond = await evaluate<AccordionRead>(cdp, sessionId, READ_ACCORDIONS)

        /* 3 — back to the first summary and re-open it. `Shift`+`Tab`, not
           `Tab`: forwards from summary 2 now leads *into* the band just opened,
           where the next Enter would follow a card link and take the page under
           test away — measured while building this gate, and the reason for the
           non-vacuity row below. Backwards is one stop, because the first band
           is closed and its rows are out of the tab order.

           Once `open` is two-way this third toggle is a real parent state
           change, so the whole v-for re-renders under the band opened at step 2;
           it must come through that unchanged. */
        await pressKey(cdp, sessionId, 'Tab', 1, 8)
        await sleep(60)
        await pressKey(cdp, sessionId, 'Enter')
        await sleep(150)
        accordionAfterThird = await evaluate<AccordionRead>(cdp, sessionId, READ_ACCORDIONS)
      }
    }
  } finally {
    await cdp.send('Target.closeTarget', { targetId }).catch(() => {})
    /* After the close, so anything the dying target flushes still counts. */
    cdp.watching = undefined
  }

  /* ---- rows: the facet rows ---- */
  if (filterBars === undefined) {
    rows.push({
      label: `gh#228 — ${FILTER_BAR_ROUTE} hydrated, so its facet rows can be read`,
      ok: false,
      detail: `${note ?? 'the page did not answer'} — without a running app there is no`
        + ' role or tab order to judge, so this half is untested rather than green'
    })
  } else {
    const bars = filterBars.bars
    const chips = bars.flatMap(bar => bar.chips)

    rows.push({
      label: `gh#228 — ${FILTER_BAR_ROUTE} renders the facet rows this gate was measured against`,
      ok: bars.length >= 2 && chips.length >= 7,
      detail: bars.length >= 2 && chips.length >= 7
        ? `expected >= 2 .bf-filter-bar and >= 7 chips · actual ${bars.length} and ${chips.length}`
        : `expected >= 2 .bf-filter-bar and >= 7 chips · actual ${bars.length} and ${chips.length}`
          + ' — a vacuous pass is not a pass; every row below is judged on these elements'
    })

    const untabbable = chips.filter(chip => chip.tabIndex < 0)
    rows.push({
      label: 'gh#228 — every filter chip is in the tab order',
      ok: chips.length > 0 && untabbable.length === 0,
      detail: chips.length > 0 && untabbable.length === 0
        ? `expected 0 chips at tabindex < 0 · actual 0 of ${chips.length}`
        : `expected 0 chips at tabindex < 0 · actual ${untabbable.length} of ${chips.length}`
          + ` (${untabbable.map(c => c.key).join(', ')}) — a roving tabindex takes them out of`
          + ' the tab order, and gh#228 removed it rather than naming it role="toolbar"'
    })

    /* The coherence rule, which is the one that stays true whichever of D30's
       two exits a future change takes. */
    const incoherent = bars.filter(bar =>
      bar.chips.some(chip => chip.tabIndex < 0)
      && !COMPOSITE_ROLES.has((bar.role ?? '').toLowerCase())
    )
    rows.push({
      label: 'gh#228 — a roving tabindex only under a role that owns one',
      ok: incoherent.length === 0,
      detail: incoherent.length === 0
        ? `expected 0 bars with tabindex=-1 chips under a non-composite role · actual 0 of ${bars.length}`
        : `expected 0 · actual ${incoherent.length} of ${bars.length}`
          + ` — role ${JSON.stringify(incoherent[0]?.role ?? null)} declares no roving-tabindex`
          + ' contract, so the chips are simply unreachable by Tab. Either drop the roving'
          + ` tabindex or use one of: ${[...COMPOSITE_ROLES].join(', ')}`
    })

    const named = bars.filter(bar => (bar.labelledByText ?? bar.ariaLabel ?? '').trim() !== '')
    const names = bars.map(bar => (bar.labelledByText ?? bar.ariaLabel ?? '').trim())
    const distinct = new Set(names.filter(n => n !== ''))
    const labelledByBars = bars.filter(bar => (bar.labelledByText ?? '').trim() !== '')
    rows.push({
      label: `gh#228 — both facet rows on ${FILTER_BAR_ROUTE} keep their visible captions as their name`,
      ok: named.length === bars.length && distinct.size === bars.length && labelledByBars.length === bars.length,
      detail: named.length === bars.length && distinct.size === bars.length && labelledByBars.length === bars.length
        ? `expected ${bars.length} distinct names, all via aria-labelledby · actual ${JSON.stringify(names)}`
        : `expected every bar named through aria-labelledby, all names distinct · actual ${JSON.stringify(names)},`
          + ` ${labelledByBars.length} of ${bars.length} via aria-labelledby — insights/index.vue points`
          + ' each bar at a visible "Format:" / "Program:" caption, which outranks the component\'s'
          + ' generic aria-label; losing it makes two rows announce as the same group'
    })

    const unpressed = chips.filter(chip => chip.ariaPressed === null)
    rows.push({
      label: 'gh#228 — every filter chip still carries aria-pressed',
      ok: chips.length > 0 && unpressed.length === 0,
      detail: chips.length > 0 && unpressed.length === 0
        ? `expected 0 chips without aria-pressed · actual 0 of ${chips.length}`
        : `expected 0 · actual ${unpressed.length} of ${chips.length} — aria-pressed is the only`
          + ' thing that says a chip is a toggle rather than a link, and Chip.vue binds it after $attrs'
    })

    const seenKeys = new Set(tabbed.map(hit => hit.key).filter((k): k is string => k !== null))
    const missed = chips.map(c => c.key).filter((k): k is string => k !== null).filter(k => !seenKeys.has(k))
    rows.push({
      label: `gh#228 — a real Tab walk of ${FILTER_BAR_ROUTE} reaches every filter chip`,
      ok: chips.length > 0 && missed.length === 0,
      detail: chips.length > 0 && missed.length === 0
        ? `expected all ${chips.length} chips focused by real Tab presses · actual all of them,`
          + ` in order [${tabbed.filter(h => h.key !== null).map(h => h.key).join(', ')}]`
        : `expected all ${chips.length} chips · actual ${chips.length - missed.length}`
          + ` — never focused: ${missed.join(', ')}. Real Input.dispatchKeyEvent presses, never .focus()`
          + ' (a11y BRIEF §5)'
    })

    const arrowOk = arrowFrom !== null && arrowMoved !== null && arrowMoved !== arrowFrom
    rows.push({
      label: 'gh#228 — a real ArrowRight still moves focus between chips',
      ok: arrowOk,
      detail: arrowOk
        ? `expected focus to move · actual ${arrowFrom} → ${arrowMoved}`
        : `expected a chip focused, then ArrowRight to move focus · actual from ${JSON.stringify(arrowFrom)}`
          + ` to ${JSON.stringify(arrowMoved)} — dropping the roving tabindex must not drop the arrow`
          + ' handler with it; both mechanisms are meant to reach every chip'
    })
  }

  /* ---- rows: the disclosure ---- */
  if (accordionAfterThird === undefined) {
    rows.push({
      label: `gh#228 — ${ACCORDION_ROUTE}'s first <summary> is reachable by real Tab presses`,
      ok: false,
      detail: reachedFirstSummary
        ? 'expected three real Enter presses to be readable · actual the page stopped answering'
        : `expected a real Tab walk to land on the first .bf-accordion__summary within 40 presses`
          + ` · actual it did not${note === undefined ? '' : ` (${note})`}`
    })
  } else {
    const first = accordionAfterFirst
    const second = accordionAfterSecond
    const third = accordionAfterThird

    /* Non-vacuity, and the failure mode this gate hit while it was being built:
       an Enter that does not activate the summary leaves focus to wander into
       the open band's links, where the next Enter follows one and the whole
       page under test is gone. Zero accordions is that, not a pass. */
    const stayedPut = third.count > 2 && (second?.count ?? 0) > 2 && (first?.count ?? 0) > 2
    rows.push({
      label: `gh#228 — ${ACCORDION_ROUTE} is still the page under test after three real Enter presses`,
      ok: stayedPut,
      detail: stayedPut
        ? `expected > 2 details.bf-accordion throughout · actual ${third.count}`
        : `expected > 2 details.bf-accordion after each press · actual`
          + ` ${first?.count ?? 0}, ${second?.count ?? 0}, ${third.count}`
          + ' — 0 means Enter activated something else and navigated away, so the three rows'
          + ' below are judged on a page that is not this one'
    })

    const closedOk = first !== undefined && first.open[0] === false
    rows.push({
      label: `gh#228 — a real Enter on ${ACCORDION_ROUTE}'s first <summary> closes its band`,
      ok: closedOk,
      detail: closedOk
        ? 'expected details[0].open false after Enter · actual false'
        : `expected details[0].open false · actual ${JSON.stringify(first?.open[0] ?? null)}`
          + ' — native <details> activation on Enter is the browser\'s, and nothing this epic'
          + ' added may take it away'
    })

    const openedOk = second !== undefined && second.open[1] === true && second.open[0] === false
    rows.push({
      label: `gh#228 — Tab then a real Enter opens the second band, and the first stays closed`,
      ok: openedOk,
      detail: openedOk
        ? 'expected [false, true, …] · actual [false, true, …]'
        : `expected details[0].open false and details[1].open true · actual`
          + ` ${JSON.stringify(second?.open.slice(0, 3) ?? null)} — one Tab reaches the second`
          + ' summary only because the closed first band took its rows out of the tab order'
    })

    const survivesOk = third.open[0] === true && third.open[1] === true
    rows.push({
      label: 'gh#228 — a third toggle re-renders the parent and the band opened before it stays open',
      ok: survivesOk,
      detail: survivesOk
        ? 'expected [true, true] after Shift+Tab back to the first summary and a third real Enter'
          + ' · actual [true, true]'
        : `expected details[0].open true and details[1].open true · actual`
          + ` ${JSON.stringify(third.open.slice(0, 2))}`
          + ' — once `open` is two-way the third toggle is a genuine parent state change, so the'
          + ' whole v-for re-renders under the band opened at step 2. A disclosure that snaps'
          + ' shut under a reader who did not ask for it is WCAG 3.2.2 (On Input)'
    })
  }

  return rows
}

/* ------------------------------------------------------------------ *
 * DoD-3 — every §7 route reachable from the menus
 * ------------------------------------------------------------------ */
/**
 * The reachability gate, evaluated once against the links `/` actually rendered
 * (`bfNav` + `bfFooter`, both fed the same `menus.json` by `bf-default`).
 *
 * A detail route is satisfied by its **list** page being in the menus rather
 * than by the detail URL appearing there: `/insights/:slug` is reached from
 * `/insights`, which is how a detail route is meant to be reached, and a menu
 * naming 371 slugs would not be a menu. The list pages themselves are opened
 * by this same run, so "reachable from the list" is not taken on trust — a
 * grid that rendered no cards would fail the list route's own h1/console rows
 * and, one layer up, the redirect-target check in
 * `verify-legacy-redirects.ts --targets`.
 */
const NAV_REQUIRED = (): string[] => [
  '/',
  ...collectionSlugs('programs').map(slug => `/${slug}`),
  '/insights',
  '/projects',
  '/about',
  '/search',
  '/archive'
]

const reachabilityRows = (homeLinks: PageLink[], origin: string): Row[] => {
  /* Path only: `/insights?format=video` links `/insights`, and a fragment
     (`/about#board`) links `/about`. `origin` is the static server's, passed in
     rather than inferred from the first link — the first anchor on `/` happens
     to be the skip link today, but a page whose first anchor is external would
     have made every route look like an orphan. */
  const reached = new Set<string>()
  for (const { resolved } of homeLinks) {
    try {
      const url = new URL(resolved)
      if (url.origin !== origin) continue
      reached.add(url.pathname.replace(/(.)\/$/, '$1'))
    } catch {
      /* a mailto:, tel: or malformed href is not a site route */
    }
  }

  return NAV_REQUIRED().map(route => ({
    label: `DoD-3 — ${route} is linked from bfNav or bfFooter`,
    ok: reached.has(route),
    detail: reached.has(route)
      ? 'expected a link on / · actual present'
      : 'expected a link on / · actual absent — the route is an orphan'
  }))
}

/* ------------------------------------------------------------------ *
 * Run
 * ------------------------------------------------------------------ */
type Result = { slug: string, rows: Row[], failing: Row[], note?: string }

const results: Result[] = []
const placeholders = new Map<string, string[]>()
let chrome: { child: ChildProcess, wsUrl: string, profile: string } | undefined
let cdp: Cdp | undefined

/**
 * How long to keep listening after a route reports hydration.
 *
 * Vue logs `Hydration completed but contains mismatches.` from
 * `logMismatchError()` at the moment the mismatching node is hydrated — and
 * this app's root is an async `<Suspense>` (the `bf-default` layout `await`s
 * `useBfSite()`), so `hydrate()` returns, `__vue_app__` is assigned, and the
 * layout's own subtree hydrates *after* that. Breaking out of the poll the
 * instant `__vue_app__` appears would therefore stop listening one tick before
 * the message this gate exists to catch.
 *
 * Deliberately generous. The failure mode of a value that is too small is a
 * silent false green, which is the one outcome a gate must not have.
 */
const SETTLE_MS = 1_500

/*
 * Wrapped in a function rather than run at the top level: `package.json` has no
 * `"type": "module"`, so `tsx` transforms these scripts to CJS and top-level
 * `await` is a build error.
 */
const run = async (): Promise<void> => {
  try {
    const port = await listen()
    const origin = `http://127.0.0.1:${port}`
    const executable = findChrome()
    chrome = await launchChrome(executable)
    cdp = await Cdp.connect(chrome.wsUrl)

    console.log(`check-routes — ${routes.length} route${routes.length === 1 ? '' : 's'} from ${publicDir}`)
    console.log(`  server  ${origin}`)
    console.log(`  chrome  ${executable}`)
    console.log(`  viewport ${viewport.width}x${viewport.height}\n`)

    let homeLinks: PageLink[] | undefined

    for (const route of routes) {
      const url = `${origin}${route}`
      const { targetId } = await cdp.send<{ targetId: string }>('Target.createTarget', { url: 'about:blank' })
      const { sessionId } = await cdp.send<{ sessionId: string }>('Target.attachToTarget', { targetId, flatten: true })

      let page: PageRead | undefined
      let note: string | undefined

      try {
        cdp.exceptions = []
        cdp.consoleErrors = []
        cdp.watching = sessionId
        await cdp.send('Runtime.enable', {}, sessionId)
        await cdp.send('Log.enable', {}, sessionId)
        await cdp.send('Page.enable', {}, sessionId)
        await cdp.send(
          'Emulation.setDeviceMetricsOverride',
          { width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: false },
          sessionId
        )
        await cdp.send('Page.navigate', { url }, sessionId)

        const deadline = Date.now() + timeoutMs
        while (Date.now() < deadline) {
          await sleep(150)
          try {
            const evaluated = await cdp.send<{ result: { value?: PageRead } }>(
              'Runtime.evaluate',
              { expression: READ_PAGE, returnByValue: true },
              sessionId
            )
            if (evaluated.result?.value?.hydrated === true) {
              page = evaluated.result.value
              break
            }
          } catch {
            /* navigation swaps the execution context; keep polling */
          }
        }

        if (page === undefined) {
          note = `never hydrated within ${timeoutMs}ms`
            + (cdp.exceptions.length > 0 ? ` — page exception: ${cdp.exceptions[cdp.exceptions.length - 1]}` : '')
        } else {
          /* Keep listening past the mount — see SETTLE_MS — then re-read, so
             anything the settled DOM changed is what gets asserted. */
          await sleep(SETTLE_MS)
          try {
            const settled = await cdp.send<{ result: { value?: PageRead } }>(
              'Runtime.evaluate',
              { expression: READ_PAGE, returnByValue: true },
              sessionId
            )
            if (settled.result?.value) page = settled.result.value
          } catch {
            /* keep the pre-settle read; it is still a hydrated one */
          }
        }
      } finally {
        await cdp.send('Target.closeTarget', { targetId }).catch(() => {})
        /* After the close, so anything the dying target flushes still counts. */
        cdp.watching = undefined
      }

      const rows: Row[] = [{
        label: 'hydrated',
        ok: page !== undefined,
        detail: page !== undefined
          ? 'expected #__nuxt.__vue_app__ · actual present'
          : 'expected #__nuxt.__vue_app__ · actual absent'
      }]

      if (page !== undefined) {
        if (route === '/') homeLinks = page.links

        rows.push({
          label: 'exactly one <h1>',
          ok: page.h1s.length === 1,
          detail: `expected 1 · actual ${page.h1s.length}`
            + (page.h1s.length === 0 ? '' : ` — ${page.h1s.map(t => JSON.stringify(t)).join(', ')}`)
        })

        /*
         * DoD-A4 (gh#220) — the computed half. The offender strings come back
         * already formatted from the page, because only the document can say
         * how many children a list has or what its computed marker resolved
         * to; Node would be guessing at both.
         */
        rows.push({
          label: `DoD-A4 — every marker-less list carries role="list" (${page.lists.markerless} of ${page.lists.total} lists have list-style-type: none)`,
          ok: page.lists.offenders.length === 0,
          detail: page.lists.offenders.length === 0
            ? `expected 0 without role="list" · actual 0 of ${page.lists.markerless}`
            : `expected 0 without role="list" · actual ${page.lists.offenders.length} of ${page.lists.markerless}: `
              + `${page.lists.offenders.slice(0, 5).join(' , ')}${page.lists.offenders.length > 5 ? ' , …' : ''}`
              + ' — WebKit drops the implicit list role from a list whose marker the author'
              + ' removed; restate role="list" (gh#220, the idiom at nav/Dropdown.vue:109)'
        })

        if (!page.width) {
          /* A zero-width layout viewport collapses the nav and would fail
             reachability on a build that is fine. Say so rather than blaming
             the page. */
          note = `the page reported a ${page.width}px viewport — check --viewport`
        }

        const found = placeholderHrefs(page.links)
        if (found.length > 0) placeholders.set(route, found)
      }

      /*
       * The `/_ipx/` gate (gh#203) — on the generated HTML, not the DOM.
       * Placed before the console rows so a route that is broken in both ways
       * reports the cause above the symptom.
       */
      const html = prerenderedHtml(route)
      if (html === undefined) {
        rows.push({
          label: 'every /_ipx/ URL in the generated HTML has a file behind it',
          ok: false,
          detail: `expected a prerendered file for ${route} · actual none under .output/public`
        })
      } else {
        const dangling = danglingIpx(html)
        rows.push({
          label: 'every /_ipx/ URL in the generated HTML has a file behind it',
          ok: dangling.length === 0,
          detail: dangling.length === 0
            ? 'expected 0 dangling · actual 0'
            : `expected 0 dangling · actual ${dangling.length}: ${dangling.slice(0, 3).join(' , ')}`
              + ' — ipx is a server and this deploy is static, so these return the SPA fallback'
              + ' as 200 text/plain; render absolute URLs as a plain <img> (gh#203)'
        })
      }

      if (cdp.consoleErrors.length === 0) {
        rows.push({ label: 'console clean', ok: true, detail: 'no error-level console output' })
      } else {
        for (const text of cdp.consoleErrors) {
          rows.push({ label: 'console error', ok: false, detail: text })
        }
      }

      const failing = rows.filter(r => !r.ok)
      const ok = failing.length === 0 && note === undefined

      results.push({ slug: route, rows, failing, note })

      const headline = `${ok ? 'PASS' : 'FAIL'}  ${route.padEnd(44)} ${rows.length - failing.length}/${rows.length} rows`
      console.log(ok ? `  ✓ ${headline}` : `  ✗ ${headline}`)
      if (note) console.log(`      ${note}`)
      for (const row of failing) console.log(`      ✗ ${row.label} — ${row.detail}`)
      if (verbose) for (const row of rows.filter(r => r.ok)) console.log(`      · ${row.label}`)
    }

    /* ---------------------------------------------------------------- *
     * The whole-build gates
     * ---------------------------------------------------------------- */
    if (only === undefined) {
      console.log('\nbuild gates\n')

      const layerRows = cascadeLayerRows()
      const layerFailing = layerRows.filter(r => !r.ok)
      results.push({ slug: 'cascade layers', rows: layerRows, failing: layerFailing })
      console.log(
        `${layerFailing.length === 0 ? '  ✓ PASS' : '  ✗ FAIL'}  `
        + `${'cascade layers'.padEnd(44)} ${layerRows.length - layerFailing.length}/${layerRows.length} rows`
      )
      for (const row of layerFailing) console.log(`      ✗ ${row.label} — ${row.detail}`)
      if (verbose) for (const row of layerRows.filter(r => r.ok)) console.log(`      · ${row.label}`)

      const langGate = langRows()
      const langFailing = langGate.filter(r => !r.ok)
      results.push({ slug: 'lang on <html> (DoD-A9)', rows: langGate, failing: langFailing })
      console.log(
        `${langFailing.length === 0 ? '  ✓ PASS' : '  ✗ FAIL'}  `
        + `${'lang on <html> (DoD-A9)'.padEnd(44)} ${langGate.length - langFailing.length}/${langGate.length} rows`
      )
      for (const row of langFailing) console.log(`      ✗ ${row.label} — ${row.detail}`)
      if (verbose) for (const row of langGate.filter(r => r.ok)) console.log(`      · ${row.label}`)

      const motionGate = reducedMotionRows()
      const motionFailing = motionGate.filter(r => !r.ok)
      results.push({ slug: 'reduced motion (DoD-A8)', rows: motionGate, failing: motionFailing })
      console.log(
        `${motionFailing.length === 0 ? '  ✓ PASS' : '  ✗ FAIL'}  `
        + `${'reduced motion (DoD-A8)'.padEnd(44)} ${motionGate.length - motionFailing.length}/${motionGate.length} rows`
      )
      for (const row of motionFailing) console.log(`      ✗ ${row.label} — ${row.detail}`)
      if (verbose) for (const row of motionGate.filter(r => r.ok)) console.log(`      · ${row.label}`)

      const listGate = listRoleRows()
      const listFailing = listGate.filter(r => !r.ok)
      results.push({ slug: 'lists are lists (DoD-A4)', rows: listGate, failing: listFailing })
      console.log(
        `${listFailing.length === 0 ? '  ✓ PASS' : '  ✗ FAIL'}  `
        + `${'lists are lists (DoD-A4)'.padEnd(44)} ${listGate.length - listFailing.length}/${listGate.length} rows`
      )
      for (const row of listFailing) console.log(`      ✗ ${row.label} — ${row.detail}`)
      if (verbose) for (const row of listGate.filter(r => r.ok)) console.log(`      · ${row.label}`)

      const altGate = imageAltRows()
      const altFailing = altGate.filter(r => !r.ok)
      results.push({ slug: 'images state an alt (DoD-A3)', rows: altGate, failing: altFailing })
      console.log(
        `${altFailing.length === 0 ? '  ✓ PASS' : '  ✗ FAIL'}  `
        + `${'images state an alt (DoD-A3)'.padEnd(44)} ${altGate.length - altFailing.length}/${altGate.length} rows`
      )
      for (const row of altFailing) console.log(`      ✗ ${row.label} — ${row.detail}`)
      if (verbose) for (const row of altGate.filter(r => r.ok)) console.log(`      · ${row.label}`)

      const hiddenGate = visuallyHiddenRows()
      const hiddenFailing = hiddenGate.filter(r => !r.ok)
      results.push({ slug: 'visually-hidden utility (DoD-A7)', rows: hiddenGate, failing: hiddenFailing })
      console.log(
        `${hiddenFailing.length === 0 ? '  ✓ PASS' : '  ✗ FAIL'}  `
        + `${'visually-hidden utility (DoD-A7)'.padEnd(44)} ${hiddenGate.length - hiddenFailing.length}/${hiddenGate.length} rows`
      )
      for (const row of hiddenFailing) console.log(`      ✗ ${row.label} — ${row.detail}`)
      if (verbose) for (const row of hiddenGate.filter(r => r.ok)) console.log(`      · ${row.label}`)

      const glyphGate = decorativeGlyphRows()
      const glyphFailing = glyphGate.filter(r => !r.ok)
      results.push({ slug: 'decorative glyphs (gh#221)', rows: glyphGate, failing: glyphFailing })
      console.log(
        `${glyphFailing.length === 0 ? '  ✓ PASS' : '  ✗ FAIL'}  `
        + `${'decorative glyphs (gh#221)'.padEnd(44)} ${glyphGate.length - glyphFailing.length}/${glyphGate.length} rows`
      )
      for (const row of glyphFailing) console.log(`      ✗ ${row.label} — ${row.detail}`)
      if (verbose) for (const row of glyphGate.filter(r => r.ok)) console.log(`      · ${row.label}`)

      const emptyStateGate = await emptyStateStatusRows(cdp, origin)
      const emptyStateFailing = emptyStateGate.filter(r => !r.ok)
      results.push({ slug: 'empty-state announcement (gh#224)', rows: emptyStateGate, failing: emptyStateFailing })
      console.log(
        `${emptyStateFailing.length === 0 ? '  ✓ PASS' : '  ✗ FAIL'}  `
        + `${'empty-state announcement (gh#224)'.padEnd(44)} ${emptyStateGate.length - emptyStateFailing.length}/${emptyStateGate.length} rows`
      )
      for (const row of emptyStateFailing) console.log(`      ✗ ${row.label} — ${row.detail}`)
      if (verbose) for (const row of emptyStateGate.filter(r => r.ok)) console.log(`      · ${row.label}`)

      const loadMoreGate = await loadMoreFocusRows(cdp, origin)
      const loadMoreFailing = loadMoreGate.filter(r => !r.ok)
      results.push({ slug: 'load-more focus (DoD-A6)', rows: loadMoreGate, failing: loadMoreFailing })
      console.log(
        `${loadMoreFailing.length === 0 ? '  ✓ PASS' : '  ✗ FAIL'}  `
        + `${'load-more focus (DoD-A6)'.padEnd(44)} ${loadMoreGate.length - loadMoreFailing.length}/${loadMoreGate.length} rows`
      )
      for (const row of loadMoreFailing) console.log(`      ✗ ${row.label} — ${row.detail}`)
      if (verbose) for (const row of loadMoreGate.filter(r => r.ok)) console.log(`      · ${row.label}`)

      const resultCountGate = await resultCountRows(cdp, origin)
      const resultCountFailing = resultCountGate.filter(r => !r.ok)
      results.push({ slug: 'result-count region (gh#226)', rows: resultCountGate, failing: resultCountFailing })
      console.log(
        `${resultCountFailing.length === 0 ? '  ✓ PASS' : '  ✗ FAIL'}  `
        + `${'result-count region (gh#226)'.padEnd(44)} ${resultCountGate.length - resultCountFailing.length}/${resultCountGate.length} rows`
      )
      for (const row of resultCountFailing) console.log(`      ✗ ${row.label} — ${row.detail}`)
      if (verbose) for (const row of resultCountGate.filter(r => r.ok)) console.log(`      · ${row.label}`)

      const searchLandmarkGate = await searchLandmarkRows(cdp, origin)
      const searchLandmarkFailing = searchLandmarkGate.filter(r => !r.ok)
      results.push({ slug: 'search landmark + form (gh#227)', rows: searchLandmarkGate, failing: searchLandmarkFailing })
      console.log(
        `${searchLandmarkFailing.length === 0 ? '  ✓ PASS' : '  ✗ FAIL'}  `
        + `${'search landmark + form (gh#227)'.padEnd(44)} ${searchLandmarkGate.length - searchLandmarkFailing.length}/${searchLandmarkGate.length} rows`
      )
      for (const row of searchLandmarkFailing) console.log(`      ✗ ${row.label} — ${row.detail}`)
      if (verbose) for (const row of searchLandmarkGate.filter(r => r.ok)) console.log(`      · ${row.label}`)

      const compositeGate = await compositeWidgetRows(cdp, origin)
      const compositeFailing = compositeGate.filter(r => !r.ok)
      results.push({ slug: 'composite roles + disclosure (gh#228)', rows: compositeGate, failing: compositeFailing })
      console.log(
        `${compositeFailing.length === 0 ? '  ✓ PASS' : '  ✗ FAIL'}  `
        + `${'composite roles + disclosure (gh#228)'.padEnd(44)} ${compositeGate.length - compositeFailing.length}/${compositeGate.length} rows`
      )
      for (const row of compositeFailing) console.log(`      ✗ ${row.label} — ${row.detail}`)
      if (verbose) for (const row of compositeGate.filter(r => r.ok)) console.log(`      · ${row.label}`)

      const navRows = homeLinks === undefined
        ? [{ label: 'DoD-3 — the home page rendered', ok: false, detail: 'expected / to hydrate · actual it did not, so reachability cannot be judged' }]
        : reachabilityRows(homeLinks, origin)
      const navFailing = navRows.filter(r => !r.ok)
      results.push({ slug: 'nav reachability (DoD-3)', rows: navRows, failing: navFailing })
      console.log(
        `${navFailing.length === 0 ? '  ✓ PASS' : '  ✗ FAIL'}  `
        + `${'nav reachability (DoD-3)'.padEnd(44)} ${navRows.length - navFailing.length}/${navRows.length} rows`
      )
      for (const row of navFailing) console.log(`      ✗ ${row.label} — ${row.detail}`)
      if (verbose) for (const row of navRows.filter(r => r.ok)) console.log(`      · ${row.label}`)
    }
  } catch (error) {
    console.error(`\ncheck-routes could not run: ${(error as Error).message}`)
    process.exitCode = 1
  } finally {
    cdp?.close()
    chrome?.child.kill('SIGKILL')
    if (chrome) await rm(chrome.profile, { recursive: true, force: true }).catch(() => {})
    await new Promise<void>(ok => server.close(() => ok()))
  }
}

/* ------------------------------------------------------------------ *
 * Report
 * ------------------------------------------------------------------ */
const report = (): void => {
  if (process.exitCode === 1) process.exit(1)

  /*
   * Placeholder anchors, listed before the verdict and outside it. They are
   * #160 / #82 — real URLs the client still owes — and this harness's job is to
   * make sure nobody forgets them, not to block a merge on somebody else's
   * decision.
   */
  if (placeholders.size > 0) {
    const distinct = new Set([...placeholders.values()].flat())
    console.log(`\nplaceholder hrefs — ${distinct.size} distinct, on ${placeholders.size} route(s). NOT a failure (#160, #82 — waiting on the client):`)
    for (const [route, hrefs] of [...placeholders].sort()) {
      console.log(`  ${route}  ${hrefs.join('  ')}`)
    }
  }

  const broken = results.filter(r => r.failing.length > 0 || r.note !== undefined || r.rows.length === 0)
  const total = results.length

  if (broken.length === 0) {
    console.log(`\nPASS — ${total} check group${total === 1 ? '' : 's'}, ${results.reduce((n, r) => n + r.rows.length, 0)} rows, 0 failures`)
    process.exit(0)
  }

  console.error(`\nFAIL — ${broken.length} of ${total} check group${total === 1 ? '' : 's'} failed:`)
  for (const r of broken) {
    console.error(`  ${r.slug}${r.note ? ` — ${r.note}` : ''}`)
    for (const row of r.failing) console.error(`    row: ${row.label} — ${row.detail}`)
  }
  process.exit(1)
}

void run().then(report)
