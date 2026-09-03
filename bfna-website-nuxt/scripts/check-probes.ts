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
 * ## Exit contract
 *
 * `0` only when every probe reported `PASS` with zero failing rows. A probe
 * still `PENDING` when the timeout expires is a **failure**, not a skip: a
 * verification that quietly downgrades itself to "PASS (1 skipped)" is exactly
 * how a broken component ships green (`verify-bf-*.ts`'s contract, kept).
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
 *   --timeout <ms>     per-probe budget for reaching a non-PENDING verdict
 *   --port <n>         pin the static server port (default: a free one)
 *   --viewport <WxH>   layout viewport (default 1280x1024)
 *   --verbose          print every row, not just the failing ones
 */
import { spawn, type ChildProcess } from 'node:child_process'
import { createReadStream, existsSync, readdirSync, statSync } from 'node:fs'
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
if (!existsSync(probeDir)) {
  console.error(`No probe pages at ${probeDir}. Nothing to check.`)
  process.exit(1)
}

/**
 * Routes come from the pages directory, never from a hard-coded list — a probe
 * added by a later issue is picked up without editing this file, which is the
 * whole point of a harness (#115's "hard-coded totals" complaint, applied here
 * before it can be made).
 */
const allProbes = readdirSync(probeDir)
  .filter(f => f.endsWith('.vue'))
  .map(f => f.replace(/\.vue$/, ''))
  .sort()

const probes = only === undefined
  ? allProbes
  : allProbes.filter(slug => slug === only || slug.startsWith(`${only}-`))

if (probes.length === 0) {
  console.error(`--only ${only} matched no probe. Available: ${allProbes.join(', ')}`)
  process.exit(2)
}

if (!existsSync(publicDir)) {
  console.error(`No prerendered output at ${publicDir}.\nRun \`npx nuxt generate\` first (not \`npm run generate\` — that one needs Directus secrets).`)
  process.exit(1)
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

  private constructor(socket: WebSocket) {
    this.socket = socket
    this.socket.addEventListener('message', event => {
      const message = JSON.parse(String((event as MessageEvent).data)) as {
        id?: number
        result?: unknown
        error?: { message: string }
        method?: string
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
      if (message.method === 'Runtime.exceptionThrown') {
        const details = (message.params?.exceptionDetails ?? {}) as { text?: string, exception?: { description?: string } }
        this.exceptions.push(details.exception?.description ?? details.text ?? 'unknown exception')
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

    console.log(`check-probes — ${probes.length} probe${probes.length === 1 ? '' : 's'} from ${publicDir}`)
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

  if (broken.length === 0) {
    console.log(`\nPASS — ${results.length} probe${results.length === 1 ? '' : 's'}, ${results.reduce((n, r) => n + r.rows.length, 0)} rows, 0 failures`)
    process.exit(0)
  }

  console.error(`\nFAIL — ${broken.length} of ${results.length} probe${results.length === 1 ? '' : 's'} failed:`)
  for (const r of broken) {
    console.error(`  ${r.slug} (${r.verdict})${r.note ? ` — ${r.note}` : ''}`)
    for (const row of r.failing) console.error(`    row: ${row.label} — ${row.detail}`)
  }
  process.exit(1)
}

void run().then(report)
