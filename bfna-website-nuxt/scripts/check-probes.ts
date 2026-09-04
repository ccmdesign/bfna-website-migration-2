/**
 * Probe harness — issue 15b / gh#109 (promoted residual #106).
 *
 *   npx nuxt generate
 *   npx tsx scripts/check-probes.ts            # every probe
 *   npx tsx scripts/check-probes.ts --only 16  # one probe
 *
 * ## Why this exists
 *
 * Every `bf-*` probe runs its load-bearing assertions in `onMounted` — measured
 * box metrics, resolved token colours, keyboard focusability, live-CSSOM
 * cascade-layer membership, `$attrs` merge order — and paints the result into
 * the page. The `verify-bf-*.ts` companions read the **prerendered** HTML,
 * where the verdict is `pending` by design, and exit `0` whatever the runtime
 * checks would say. So the interesting half of every issue's acceptance only
 * ran when a human opened the page (residual #106). This script runs it.
 *
 * ## The DOM convention it enforces
 *
 * Documented in `docs/decisions/probe-harness.md`; in short, every probe page
 * carries:
 *
 *   - on its root element: `data-probe="<nn>"` and
 *     `data-probe-verdict="PASS" | "FAIL" | "PENDING"`;
 *   - on each check row: `data-probe-row="<label>"` and `data-ok="true|false"`.
 *
 * Optionally (gh#28) a probe's root also carries
 * `data-probe-keys="Tab,Enter"` — a comma-separated sequence this harness
 * dispatches as **trusted** key events once the attribute appears, which is
 * after hydration because the probe binds it reactively. That is how probe 19
 * asserts that the first real Tab from a fresh document lands on the skip link
 * and that a real Enter moves focus to the target: neither question can be
 * answered by a programmatic `.focus()`, which asks an easier one. Opt-in and
 * additive — a probe that declares nothing is driven exactly as before.
 *
 * The verdict is anchored on the **root**, not on a `data-testid` or a class,
 * because probe 16 renders a second verdict cell (its keyboard lab) and a
 * class-shaped selector would be ambiguous. `PENDING` is a real third state,
 * kept for the reason probes 14–16 already keep it: the prerendered HTML has
 * run no assertions, and baking `FAIL` into it would read as a regression to
 * the next issue that greps the file.
 *
 * ## The console gate (gh#200, from residual #199)
 *
 * Every page this harness opens — probe or smoke route — must reach the end of
 * its budget with an **empty console at `error` level**. One console error is
 * one failing row, quoted verbatim.
 *
 * The gate exists because #199 was a hydration mismatch on the shared shell
 * that nobody could see except by opening a page by hand:
 * `Hydration completed but contains mismatches.` is a `console.error` and
 * nothing else — it fails no build, breaks no assertion, and the page it ruins
 * still looks right. Vue discards the server markup for the mismatching subtree
 * and re-renders it, so the cost is real and entirely invisible to a harness
 * that reads only verdict rows.
 *
 * Two channels, and neither is redundant:
 *
 *   - `Runtime.consoleAPICalled` (`type: 'error' | 'assert'`) — everything the
 *     page itself says, which is where Vue's hydration message lands;
 *   - `Log.entryAdded` (`entry.level === 'error'`) — everything the *browser*
 *     says, which is where a 404 on a `/_nuxt/*.js` chunk lands, and the page
 *     never hears about that one.
 *
 * **Known limit, stated rather than discovered later.** Vue hydrates a
 * `createStaticVNode` subtree by advancing the node pointer without comparing
 * its content, so a mismatch confined to compiler-hoisted static markup emits
 * nothing on any channel. Verified while building this gate: patching a static
 * text node in a prerendered page produced silence, patching the adjacent
 * dynamic one produced the message above. The gate catches every mismatch that
 * reaches a dynamic node, which is every mismatch #199 was about.
 *
 * ## Smoke routes (gh#200)
 *
 * Probe pages exercise one component each against sample data. They cannot
 * catch a defect in the *shell* — #199 was on `bf-default`, visible on every
 * real route and on none of the probes, because a probe page composes
 * `bf-probe`, not `bf-default`.
 *
 * So a full run also opens the real site: `/`, `/insights`, `/about`,
 * `/archive`, `/projects`, `/search`, one insight detail and one project
 * detail. They carry no verdict convention and assert nothing about layout —
 * the contract is only *"this page hydrates and says nothing"*, which is
 * exactly the contract #199 broke.
 *
 * The two detail slugs are **derived from `.output/public`** — first
 * alphabetical child directory holding an `index.html` — for the same reason
 * the probe list is read from the pages directory: a hard-coded slug rots the
 * first time content moves, and it rots silently, as a 404 that the gate would
 * then dutifully report as a console error on a build that is fine.
 *
 * A page is "hydrated" when `document.readyState === 'complete'` **and**
 * `document.getElementById('__nuxt').__vue_app__` exists. The second half is
 * load-bearing: a page whose entry chunk 404s stays as static prerendered HTML,
 * looks perfect, and passes a console-only check by having nothing to say.
 *
 * ## The `/_ipx/` gate (gh#203)
 *
 * Every `/_ipx/…` URL in a smoke route's **prerendered HTML** — `src` and
 * `srcset` both — must have an actual file behind it in `.output/public`.
 *
 * `@nuxt/image` falls back to the `ipx` provider whenever
 * `NUXT_IMAGE_PROVIDER` is unset, and `ipx` is a runtime image server this
 * static deploy does not have. For a **local** source that is harmless: the
 * prerenderer transforms the file and writes the result to disk, so the URL
 * resolves. For a **remote** one it cannot — nothing is written, the URL
 * returns `200 text/plain` from the SPA fallback, and the photo is simply
 * broken. Every image on `/` and `/about` shipped that way (P1, gh#203) past a
 * harness watching only hydration and the console.
 *
 * So the rule is existence, not absence. Banning the substring would ban the
 * image module itself; requiring a file distinguishes the two cases exactly,
 * and also catches a URL that quietly stops being emitted at build time for
 * some future reason a substring ban would wave through.
 *
 * Disk rather than DOM on purpose: the artifact is what Netlify serves, the
 * check then survives a page whose bundle never loads, and it cannot be masked
 * by Vue re-rendering the subtree after hydration.
 *
 * ## Exit contract
 *
 * `0` only when every probe reported `PASS` with zero failing rows, every smoke
 * route hydrated, no smoke route's HTML carries a dangling `/_ipx/` URL, and no
 * page logged a console error. A probe still `PENDING`
 * when the timeout expires is a **failure**, not a skip: a verification that
 * quietly downgrades itself to "PASS (1 skipped)" is exactly how a broken
 * component ships green (`verify-bf-*.ts`'s contract, kept).
 *
 * ## Driver
 *
 * Raw Chrome DevTools Protocol over Node's built-in global `WebSocket`, with no
 * new dependency. Playwright and Puppeteer are absent from `package.json`, and
 * `jsdom` — which is present — has no layout engine, so `getComputedStyle`
 * returns declared values and every box-metric check would read `0px`. The
 * executable is resolved from `$CHROME_PATH`, then the local `ms-playwright`
 * cache, then Chrome / Chromium / Edge. Rationale in the decision record.
 *
 * ## Flags
 *
 *   --only <nn|slug>   run a single probe (`--only 16`, `--only 16-bf-chip`)
 *   --only smoke       run the real-route smoke set alone, no probes
 *   --timeout <ms>     per-probe budget for reaching a non-PENDING verdict
 *   --port <n>         pin the static server port (default: a free one)
 *   --viewport <WxH>   layout viewport (default 1280x1024)
 *   --ignore-console   regex; console text matching it is not a failure
 *   --verbose          print every row, not just the failing ones
 */
import { spawn, type ChildProcess } from 'node:child_process'
import { createReadStream, existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { createServer, type Server } from 'node:http'
import { homedir, tmpdir } from 'node:os'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const probeDir = join(appRoot, 'src/pages/bf-probe')
const publicDir = join(appRoot, '.output/public')

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
 * default window. Probe assertions measure real boxes — probe 16 compares the
 * rendered height of all five chip modes, probe 03 derives an expected grid
 * track count from the container width — so the viewport is an input to the
 * verdict, not a cosmetic detail. Left to chance it is a source of verdicts
 * that differ between machines; a zero-size viewport (which some embedded
 * browser panes report) fails several probes on a perfectly good build.
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

/* ------------------------------------------------------------------ *
 * Which probes
 * ------------------------------------------------------------------ */
/**
 * Does this invocation include the real-route smoke set?
 *
 * A probe-scoped `--only` skips it, so the epic's per-issue acceptance
 * (`--only <nn>`) keeps its current cost. Declared here rather than beside the
 * routes because the guards below need it.
 */
const runSmoke = only === undefined || only === 'smoke'

/**
 * A missing probe directory is fatal only when there is nothing else to run.
 *
 * Issue #68 deletes `src/pages/bf-probe/` at cutover, and gh#200 is sequenced
 * *before* the cutover issues precisely so the shell has a console gate while
 * they land. A harness that refused to start without probe pages would stop
 * existing at the commit that most needs it, so the smoke set outlives the
 * directory it never depended on.
 */
if (!existsSync(probeDir) && !runSmoke) {
  console.error(`No probe pages at ${probeDir}. Nothing to check.`)
  process.exit(1)
}

/**
 * Routes come from the pages directory, never from a hard-coded list — a probe
 * added by a later issue is picked up without editing this file, which is the
 * whole point of a harness (#115's "hard-coded totals" complaint, applied here
 * before it can be made).
 */
const allProbes = existsSync(probeDir)
  ? readdirSync(probeDir)
    .filter(f => f.endsWith('.vue'))
    .map(f => f.replace(/\.vue$/, ''))
    .sort()
  : []

const probes = only === undefined
  ? allProbes
  : only === 'smoke'
    ? []
    : allProbes.filter(slug => slug === only || slug.startsWith(`${only}-`))

/* Only a `--only` that named something can match nothing; a full run with no
   probe pages left (post-#68) is the smoke set on its own, not an error. */
if (probes.length === 0 && only !== undefined && only !== 'smoke') {
  console.error(`--only ${only} matched no probe. Available: ${allProbes.join(', ')}, smoke`)
  process.exit(2)
}

if (!existsSync(publicDir)) {
  console.error(`No prerendered output at ${publicDir}.\nRun \`npx nuxt generate\` first (not \`npm run generate\` — that one needs Directus secrets).`)
  process.exit(1)
}

/* ------------------------------------------------------------------ *
 * The smoke set — real routes, not probes (gh#200)
 * ------------------------------------------------------------------ */
/**
 * The first alphabetical child of `<dir>` in the prerendered output that is a
 * real page. Sorted, so two runs on the same build pick the same route and a
 * failure is reproducible from its own output; `index.html` rather than mere
 * directory existence, because `insights/` also holds `_payload.json` files and
 * a `_nuxt`-style sibling would otherwise be "the first detail page".
 */
const firstPageUnder = (dir: string): string | undefined => {
  const root = join(publicDir, dir)
  if (!existsSync(root)) return undefined
  return readdirSync(root)
    .sort()
    .find(name => existsSync(join(root, name, 'index.html')))
}

/**
 * `/` plus every list template plus one of each detail template — the eight
 * routes gh#200's acceptance names. Deliberately small: this is a smoke set,
 * not a crawl, and its whole job is to put the **shell** under the same
 * console gate the probes are under. A detail route that has not been
 * prerendered is dropped rather than requested, so the harness reports a
 * missing page as a missing page and not as a 404 on a build that is fine.
 */
const smokeRoutes = ((): string[] => {
  const insight = firstPageUnder('insights')
  const project = firstPageUnder('projects')
  return [
    '/',
    '/insights',
    '/about',
    '/archive',
    '/projects',
    '/search',
    ...(insight === undefined ? [] : [`/insights/${insight}`]),
    ...(project === undefined ? [] : [`/projects/${project}`])
  ]
})()

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
  const profile = await mkdtemp(join(tmpdir(), 'bf-probe-chrome-'))
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
   * Page-level exceptions, so a probe that dies on load says why. Cleared
   * between probes — a note quoting the *previous* page's exception is worse
   * than no note at all.
   */
  exceptions: string[] = []

  /**
   * Console-level errors from the page under test (gh#200). Cleared between
   * pages for the same reason `exceptions` is: a failure quoting the
   * *previous* page's console is worse than no quote at all.
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
   * opened next. Pages are visited sequentially and both buffers are cleared
   * per page, so that window is narrow — but a gate whose entire value is
   * quoting the right page's console should not have that shape at all.
   * `undefined` means "listening to nothing", which is the honest state
   * between pages.
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
 * Runs inside the probe page. Deliberately dependency-free and defensive: a
 * probe that has not been made to conform yet must be reported as such rather
 * than crash the harness.
 */
const READ_VERDICT = `(() => {
  const loaded = document.readyState === 'complete'
  const root = document.querySelector('[data-probe-verdict]')
  if (!root) {
    /*
      Ready only once the document finished loading. The first poll can land on
      about:blank before Page.navigate has committed, and reporting a
      conforming probe as MISSING because of that would be a flake, not a
      verdict. Every probe root ships in the prerendered HTML, so once the
      document is complete a missing root is conclusive.
    */
    return { conforms: false, ready: loaded, verdict: 'MISSING', probe: null, keys: null, rows: [] }
  }
  const verdict = (root.getAttribute('data-probe-verdict') || '').toUpperCase()
  const rows = Array.from(document.querySelectorAll('[data-probe-row]')).map(el => {
    const cells = el.cells ? Array.from(el.cells).map(c => (c.textContent || '').trim()) : []
    return {
      label: el.getAttribute('data-probe-row') || '(unlabelled row)',
      ok: el.getAttribute('data-ok') === 'true',
      detail: cells.length >= 3
        ? 'expected ' + cells[1] + ' · actual ' + cells[2]
        : (el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 160)
    }
  })
  return {
    conforms: true,
    ready: verdict !== 'PENDING' && verdict !== '',
    verdict,
    probe: root.getAttribute('data-probe'),
    /*
      The keyboard handshake (gh#28). A probe that needs *real* key events — not
      a programmatic \`.focus()\` — asks for them by naming them here, and binds
      the attribute reactively so it appears only once the page has hydrated and
      its listeners are attached. Absent on every other probe, and absent from
      the prerendered HTML, so this is also the "you may drive me now" signal.
    */
    keys: root.getAttribute('data-probe-keys'),
    width: window.innerWidth,
    rows
  }
})()`

/**
 * The CDP payload for one named key.
 *
 * Only the keys a probe actually asks for are listed; an unknown name is
 * rejected loudly rather than silently dispatched as nothing, because a
 * keyboard assertion that quietly pressed no key would pass or fail for the
 * wrong reason. `windowsVirtualKeyCode` is what Chrome's input pipeline reads
 * on every platform — the name is historical.
 */
const KEYS: Record<string, { key: string, code: string, vk: number, text?: string }> = {
  Tab: { key: 'Tab', code: 'Tab', vk: 9 },
  Enter: { key: 'Enter', code: 'Enter', vk: 13, text: '\r' },
  Escape: { key: 'Escape', code: 'Escape', vk: 27 },
  Space: { key: ' ', code: 'Space', vk: 32, text: ' ' },

  /*
   * Added for probe 30 (`bfFilterBar`, gh#39), whose whole contract is that
   * arrow keys move focus **within** a group that has one tab stop. `.focus()`
   * would prove nothing about that: it is the component's own key handler and
   * its `preventDefault` that are under test, and both run only on real input.
   *
   * No `text` on any of them — they are not character keys, so the `char`
   * stage of the dispatch triple is correctly skipped. Home and End are
   * included because the component implements them; a probe that drove only
   * the arrows would leave two branches of one `switch` unexercised.
   */
  ArrowLeft: { key: 'ArrowLeft', code: 'ArrowLeft', vk: 37 },
  ArrowUp: { key: 'ArrowUp', code: 'ArrowUp', vk: 38 },
  ArrowRight: { key: 'ArrowRight', code: 'ArrowRight', vk: 39 },
  ArrowDown: { key: 'ArrowDown', code: 'ArrowDown', vk: 40 },
  Home: { key: 'Home', code: 'Home', vk: 36 },
  End: { key: 'End', code: 'End', vk: 35 }
}

/** The two-digit number a probe route starts with, e.g. `16-bf-chip` -> `16`. */
const numberOf = (slug: string): string => slug.split('-')[0] ?? ''

type Row = { label: string, ok: boolean, detail: string }
type Verdict = { conforms: boolean, ready: boolean, verdict: string, probe: string | null, keys?: string | null, width?: number, rows: Row[] }

const sleep = (ms: number) => new Promise(ok => setTimeout(ok, ms))

/**
 * Send a probe's declared key sequence as trusted input (gh#28).
 *
 * `data-probe-keys="Tab,Enter"` becomes a real Tab followed by a real Enter,
 * dispatched into the renderer through `Input.dispatchKeyEvent`. Two details
 * are load-bearing:
 *
 * 1. **`Emulation.setFocusEmulationEnabled`.** A headless page is not the
 *    focused window, and an unfocused document does not run sequential focus
 *    navigation — Tab would do nothing and the probe would fail a correct
 *    component. Enabled per target, only when keys were asked for.
 * 2. **`rawKeyDown` + optional `char` + `keyUp`.** That is the triple Chrome's
 *    own front-end sends; `keyDown` alone omits the character stage that
 *    Enter's default action on a link is derived from.
 *
 * An unrecognised key name throws rather than being skipped: a keyboard
 * assertion that quietly pressed nothing would report the wrong reason for its
 * verdict, which is the failure this whole harness exists to prevent.
 */
const dispatchKeys = async (cdp: Cdp, sessionId: string, sequence: string, slug: string): Promise<void> => {
  const names = sequence.split(',').map(s => s.trim()).filter(Boolean)
  if (names.length === 0) return

  await cdp.send('Emulation.setFocusEmulationEnabled', { enabled: true }, sessionId)

  for (const name of names) {
    const k = KEYS[name]
    if (!k) {
      throw new Error(
        `${slug} asked for the key "${name}", which check-probes does not know.`
        + ` Known keys: ${Object.keys(KEYS).join(', ')}`
      )
    }

    const base = {
      key: k.key,
      code: k.code,
      windowsVirtualKeyCode: k.vk,
      nativeVirtualKeyCode: k.vk
    }

    await cdp.send('Input.dispatchKeyEvent', { ...base, type: 'rawKeyDown' }, sessionId)
    if (k.text !== undefined) {
      await cdp.send('Input.dispatchKeyEvent', { ...base, type: 'char', text: k.text }, sessionId)
    }
    await cdp.send('Input.dispatchKeyEvent', { ...base, type: 'keyUp' }, sessionId)

    /* A frame's worth of breathing room, so a focus handler runs before the
       next key lands on whatever it focused. */
    await sleep(60)
  }
}

/* ------------------------------------------------------------------ *
 * The smoke reader (gh#200)
 * ------------------------------------------------------------------ */
/**
 * Has this real route hydrated?
 *
 * `readyState` alone is not enough and `__vue_app__` alone is not enough. Vue
 * sets `__vue_app__` on the mount container the moment the root `hydrate()`
 * call returns, and a prerendered page whose entry chunk 404s never gets that
 * far — it just sits there as static HTML, looking perfect and saying nothing,
 * which is precisely how it would pass a console-only check.
 */
const SMOKE_READY = `(() => {
  const root = document.getElementById('__nuxt')
  return document.readyState === 'complete' && !!(root && root.__vue_app__)
})()`

/**
 * How long to keep listening after a smoke route reports hydration.
 *
 * Vue logs `Hydration completed but contains mismatches.` from
 * `logMismatchError()` at the moment the mismatching node is hydrated — and
 * this app's root is an async `<Suspense>` (the `bf-default` layout `await`s
 * `useBfSite()`), so `hydrate()` returns, `__vue_app__` is assigned, and the
 * layout's own subtree hydrates *after* that. Breaking out of the poll the
 * instant `__vue_app__` appears would therefore stop listening one tick before
 * the message this gate exists to catch.
 *
 * Probes need no equivalent: their verdict is painted in `onMounted`, which
 * runs after their subtree has hydrated, so a probe that reports a verdict has
 * already emitted whatever it was going to emit.
 *
 * Deliberately generous. The failure mode of a value that is too small is a
 * silent false green, which is the one outcome a gate must not have; the cost
 * of one that is too large is a few seconds on a run that already loads 46
 * pages.
 */
const SMOKE_SETTLE_MS = 1_500

/**
 * The `/_ipx/` gate (gh#203).
 *
 * `nuxt.config.ts` leaves `image.provider` undefined unless
 * `NUXT_IMAGE_PROVIDER` is set, so `@nuxt/image` falls back to the **`ipx`**
 * provider and rewrites image URLs — remote ones included — into
 * `/_ipx/q_90/https:/host/…`. `ipx` is a runtime image *server*. This site
 * deploys as static `nuxt generate` output, so nothing answers those URLs: the
 * SPA fallback returns `200 text/plain` and every affected photo renders
 * broken. That is exactly what happened on the bf-dev preview, on `/` and
 * `/about`, and nothing in this harness noticed.
 *
 * Read off **disk**, from the prerendered HTML, rather than out of the live
 * DOM. The artifact in `.output/public` is what Netlify serves; a DOM check
 * runs after hydration, when Vue has already re-rendered the tree, and would
 * be answering a different question. It is also the only form of the check
 * that survives a page whose client bundle never loads.
 *
 * Scoped to the smoke routes, i.e. real pages. `bf-probe/17-bf-media`
 * deliberately renders one local image through `NuxtImg` — proving the module
 * branch is still live — so its output legitimately contains `/_ipx/`, and the
 * frozen `wireframes/` tree is out of scope by D2.
 */
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
 * The `/_ipx/` URLs in `html` that no file in `.output/public` answers.
 *
 * **Not** "any `/_ipx/` URL at all", which is the check this gate first
 * reached for and which is wrong. `@nuxt/image` *does* transform local
 * `src/public/` images at prerender time and write the result to disk —
 * `.output/public/_ipx/q_90/images/hero/stiftung.jpg` is a real 1600×774 JPEG
 * — so a local image routed through the module works perfectly on a static
 * host and banning its URL would ban the module itself.
 *
 * What has no file behind it is a URL `ipx` could only have produced at
 * *runtime*: a remote source (`/_ipx/q_90/https:/bfna.simplyas.com/assets/…`),
 * which the prerenderer cannot fetch and therefore never writes. Those are the
 * gh#203 breakage, and existence on disk separates them from the working case
 * exactly.
 *
 * It is also the stronger rule. A future `/_ipx/` URL that silently stops
 * being emitted at build time — a new modifier, a route that stops being
 * prerendered — fails here too, and a substring ban would not have noticed.
 */
const danglingIpx = (html: string): string[] => {
  const seen = new Set<string>()
  for (const url of html.match(IPX_REFERENCES) ?? []) {
    if (resolveFile(url) === undefined) seen.add(url)
  }
  return [...seen]
}

/* ------------------------------------------------------------------ *
 * Run
 * ------------------------------------------------------------------ */
type Result = { slug: string, verdict: string, rows: Row[], failing: Row[], note?: string }

const results: Result[] = []
let chrome: { child: ChildProcess, wsUrl: string, profile: string } | undefined
let cdp: Cdp | undefined

/*
 * Wrapped in a function rather than run at the top level: `package.json` has no
 * `"type": "module"`, so `tsx` transforms these scripts to CJS and top-level
 * `await` is a build error. Every other `scripts/*.ts` here is synchronous and
 * never met the constraint.
 */
const run = async (): Promise<void> => {
  try {
    const port = await listen()
    const origin = `http://127.0.0.1:${port}`
    const executable = findChrome()
    chrome = await launchChrome(executable)
    cdp = await Cdp.connect(chrome.wsUrl)

    console.log(
      `check-probes — ${probes.length} probe${probes.length === 1 ? '' : 's'}`
      + (runSmoke ? ` + ${smokeRoutes.length} smoke route${smokeRoutes.length === 1 ? '' : 's'}` : '')
      + ` from ${publicDir}`
    )
    console.log(`  server  ${origin}`)
    console.log(`  chrome  ${executable}`)
    console.log(`  viewport ${viewport.width}x${viewport.height}\n`)

    for (const slug of probes) {
      const url = `${origin}/bf-probe/${slug}`
      const { targetId } = await cdp.send<{ targetId: string }>('Target.createTarget', { url: 'about:blank' })
      const { sessionId } = await cdp.send<{ sessionId: string }>('Target.attachToTarget', { targetId, flatten: true })

      let verdict: Verdict = { conforms: false, ready: false, verdict: 'PENDING', probe: null, rows: [] }

      let note: string | undefined

      /* One keyboard sequence per page load, at most. */
      let keysSent = false
      let keys: string | null = null

      try {
        cdp.exceptions = []
        cdp.consoleErrors = []
        cdp.watching = sessionId
        await cdp.send('Runtime.enable', {}, sessionId)
        /* The console gate's browser-side channel (gh#200). */
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
            const evaluated = await cdp.send<{ result: { value?: Verdict } }>(
              'Runtime.evaluate',
              { expression: READ_VERDICT, returnByValue: true },
              sessionId
            )
            if (evaluated.result?.value) {
              verdict = evaluated.result.value

              /*
               * The keyboard handshake (gh#28). Some assertions cannot be made
               * from inside the page at all: whether the first Tab from a fresh
               * document lands on the skip link is a question about the
               * browser's sequential focus navigation, and a programmatic
               * `.focus()` answers a different, easier question. A probe that
               * needs the real thing publishes `data-probe-keys` on its root —
               * bound reactively, so its appearance also means "hydrated, my
               * listeners are attached" — and these are **trusted** events:
               * real focus navigation, real default actions.
               *
               * Opt-in and additive. A probe that declares nothing is driven
               * exactly as before.
               */
              if (!keysSent && verdict.keys) keys = verdict.keys

              if (verdict.ready) break
            }
          } catch {
            /* navigation swaps the execution context; keep polling */
          }

          /*
           * Dispatched **outside** the poll's `try`, on purpose: that `catch`
           * exists to swallow the execution-context error a navigation raises,
           * and swallowing an unknown-key error along with it would turn a
           * typo in `data-probe-keys` into a mystery timeout.
           */
          if (keys && !keysSent) {
            keysSent = true
            await dispatchKeys(cdp, sessionId, keys, slug)
          }
        }

        if (!verdict.conforms) {
          note = 'page has no [data-probe-verdict] root — probe does not follow the harness convention'
        } else if (verdict.probe !== numberOf(slug)) {
          /* A copy-pasted probe that kept the number it was copied from would
             name the wrong page in every failure message it ever produces. */
          note = `root says data-probe="${verdict.probe}" but the route is ${slug}`
        } else if (!verdict.ready) {
          note = `verdict still PENDING after ${timeoutMs}ms`
            + (cdp.exceptions.length > 0 ? ` — page exception: ${cdp.exceptions[cdp.exceptions.length - 1]}` : '')
        } else if (verdict.rows.length === 0) {
          note = 'verdict reported but no [data-probe-row] rows were found'
        } else if (!verdict.width) {
          /* A zero-width layout viewport fails every measured box on a build
             that is fine. Say so rather than blaming the component. */
          note = `the page reported a ${verdict.width}px viewport — measurements are meaningless; check --viewport`
        }
      } finally {
        await cdp.send('Target.closeTarget', { targetId }).catch(() => {})
        /* After the close, so anything the dying target flushes still counts. */
        cdp.watching = undefined
      }

      /*
       * The console gate (gh#200), applied to probes as well as to smoke
       * routes. Appended as rows rather than folded into `note`, because
       * `note` holds one string and a page can have several distinct errors —
       * and because a row is what the report already knows how to quote.
       */
      for (const text of cdp.consoleErrors) {
        verdict.rows.push({ label: 'console error', ok: false, detail: text })
      }

      const failing = verdict.rows.filter(r => !r.ok)
      const passed = verdict.rows.length - failing.length
      const ok = verdict.verdict === 'PASS' && failing.length === 0 && verdict.rows.length > 0 && note === undefined

      results.push({ slug, verdict: verdict.verdict, rows: verdict.rows, failing, note })

      const headline = `${ok ? 'PASS' : 'FAIL'}  ${slug.padEnd(34)} ${passed}/${verdict.rows.length} rows`
      console.log(ok ? `  ✓ ${headline}` : `  ✗ ${headline}`)
      if (note) console.log(`      ${note}`)
      for (const row of failing) console.log(`      ✗ ${row.label} — ${row.detail}`)
      if (verbose) for (const row of verdict.rows.filter(r => r.ok)) console.log(`      · ${row.label}`)
    }

    /* ---------------------------------------------------------------- *
     * The smoke set — real routes on the real shell (gh#200)
     * ---------------------------------------------------------------- */
    if (runSmoke) {
      console.log(`\nsmoke — ${smokeRoutes.length} real route${smokeRoutes.length === 1 ? '' : 's'} on the site shell\n`)

      for (const route of smokeRoutes) {
        const url = `${origin}${route}`
        const { targetId } = await cdp.send<{ targetId: string }>('Target.createTarget', { url: 'about:blank' })
        const { sessionId } = await cdp.send<{ sessionId: string }>('Target.attachToTarget', { targetId, flatten: true })

        let hydrated = false
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
              const evaluated = await cdp.send<{ result: { value?: boolean } }>(
                'Runtime.evaluate',
                { expression: SMOKE_READY, returnByValue: true },
                sessionId
              )
              if (evaluated.result?.value === true) {
                hydrated = true
                break
              }
            } catch {
              /* navigation swaps the execution context; keep polling */
            }
          }

          if (hydrated) {
            /* Keep listening past the mount — see SMOKE_SETTLE_MS. */
            await sleep(SMOKE_SETTLE_MS)
          } else {
            note = `never hydrated within ${timeoutMs}ms`
              + (cdp.exceptions.length > 0 ? ` — page exception: ${cdp.exceptions[cdp.exceptions.length - 1]}` : '')
          }
        } finally {
          await cdp.send('Target.closeTarget', { targetId }).catch(() => {})
          cdp.watching = undefined
        }

        const rows: Row[] = [{
          label: 'hydrated',
          ok: hydrated,
          detail: hydrated
            ? 'expected #__nuxt.__vue_app__ · actual present'
            : 'expected #__nuxt.__vue_app__ · actual absent'
        }]

        /*
         * The `/_ipx/` gate (gh#203) — on the generated HTML, not the DOM.
         * Placed before the console rows so a route that is broken in both
         * ways reports the cause above the symptom.
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

        results.push({ slug: `smoke ${route}`, verdict: ok ? 'PASS' : 'FAIL', rows, failing, note })

        const headline = `${ok ? 'PASS' : 'FAIL'}  ${`smoke ${route}`.padEnd(34)} ${rows.length - failing.length}/${rows.length} rows`
        console.log(ok ? `  ✓ ${headline}` : `  ✗ ${headline}`)
        if (note) console.log(`      ${note}`)
        for (const row of failing) console.log(`      ✗ ${row.label} — ${row.detail}`)
        if (verbose) for (const row of rows.filter(r => r.ok)) console.log(`      · ${row.label}`)
      }
    }
  } catch (error) {
    console.error(`\ncheck-probes could not run: ${(error as Error).message}`)
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

  const broken = results.filter(r => r.verdict !== 'PASS' || r.failing.length > 0 || r.note !== undefined || r.rows.length === 0)

  /* "page" rather than "probe": since gh#200 the list also holds smoke routes. */
  const total = results.length

  if (broken.length === 0) {
    console.log(`\nPASS — ${total} page${total === 1 ? '' : 's'}, ${results.reduce((n, r) => n + r.rows.length, 0)} rows, 0 failures`)
    process.exit(0)
  }

  console.error(`\nFAIL — ${broken.length} of ${total} page${total === 1 ? '' : 's'} failed:`)
  for (const r of broken) {
    console.error(`  ${r.slug} (${r.verdict})${r.note ? ` — ${r.note}` : ''}`)
    for (const row of r.failing) console.error(`    row: ${row.label} — ${row.detail}`)
  }
  process.exit(1)
}

void run().then(report)
