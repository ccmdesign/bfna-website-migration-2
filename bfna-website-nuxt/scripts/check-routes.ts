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
 * reset stylesheet carries the reduced-motion floor; and when no marker-less
 * `ul`/`ol` is missing its `role="list"`, per route and across the build.
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

/** The `/_ipx/` URLs in `html` that no file in `.output/public` answers. */
const danglingIpx = (html: string): string[] => {
  const seen = new Set<string>()
  for (const url of html.match(IPX_REFERENCES) ?? []) {
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

      const hiddenGate = visuallyHiddenRows()
      const hiddenFailing = hiddenGate.filter(r => !r.ok)
      results.push({ slug: 'visually-hidden utility (DoD-A7)', rows: hiddenGate, failing: hiddenFailing })
      console.log(
        `${hiddenFailing.length === 0 ? '  ✓ PASS' : '  ✗ FAIL'}  `
        + `${'visually-hidden utility (DoD-A7)'.padEnd(44)} ${hiddenGate.length - hiddenFailing.length}/${hiddenGate.length} rows`
      )
      for (const row of hiddenFailing) console.log(`      ✗ ${row.label} — ${row.detail}`)
      if (verbose) for (const row of hiddenGate.filter(r => r.ok)) console.log(`      · ${row.label}`)

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
