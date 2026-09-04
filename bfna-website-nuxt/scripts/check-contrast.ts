#!/usr/bin/env node

/**
 * Contrast Gate — gh#250
 *
 * #249 retired the ds-epic BRIEF's "add no colour" rule and replaced it with
 * "add no colour that **fails its measured floor**". This script is the thing
 * that measures. Before it, there was no contrast function and no colour
 * utility anywhere in the repository: every ratio in the codebase
 * (`src/components/bf/Button.vue:61`, `docs/ds-epic/issues/41-bf-notice.md:141`)
 * was a hand-written comment that nothing recomputed.
 *
 * Modelled on `scripts/validate-tokens.ts` — same regex-parse-then-assert
 * shape, same reporting style, same exit-code discipline.
 *
 * WHAT IT DOES
 *   Parses the token files, resolves the `--hsl-*` / `--color-*` var graph
 *   down to concrete sRGB, and asserts every declared pair in PAIRS clears its
 *   WCAG floor.
 *
 * IT STILL FAILS ON ONE PAIR, ON PURPOSE
 *   Two shipped primitives did not clear AA against white: red `#D0495B` at
 *   4.39 and amber `#EEAC49` at 1.98. gh#251 repaired red (a one-point
 *   lightness nudge to `#CF4457`, 4.55) and deleted its row. Amber was left
 *   alone deliberately — the repair is a repaint of the whole amber ladder,
 *   not a nudge — so one KNOWN_FAILURES row remains and CI keeps running with
 *   `--allow-known`. Everything gh#251 introduced clears its floor. See
 *   `docs/decisions/gh250-contrast-gate-known-failures.md` and
 *   `docs/decisions/gh251-programme-colour-tokens.md`.
 *
 * NO COLOUR LIBRARY
 *   sRGB → relative luminance → WCAG ratio is written inline below. It is
 *   about twenty lines and adding a dependency to a build gate to avoid them
 *   would be a poor trade.
 *
 * NO OKLCH
 *   `hsl()` only, per the brief. Any `oklch()` / `lab()` / `lch()` value in the
 *   token files is a hard resolve error, not a silently skipped token.
 *
 * THE BIAS THROUGHOUT IS FAIL-LOUD
 *   Every ambiguity resolves to an error rather than a pass. A gate's worst
 *   defect is a false green, so: a translucent colour is an error rather than
 *   being measured as opaque, a pair may only be excused as "not yet defined"
 *   for a token it names itself, a programme-scoped token that resolved from
 *   `:root` is an error rather than being reported under the programme's
 *   label, and an unknown argument is an error rather than a default.
 *
 * Usage:
 *   npx tsx scripts/check-contrast.ts                  # strict — non-zero today
 *   npx tsx scripts/check-contrast.ts --allow-known    # CI — known failures excused
 *   npx tsx scripts/check-contrast.ts --self-check     # prove the gate can bite
 *   npx tsx scripts/check-contrast.ts --tokens-dir <d> # point at another css/ root
 *
 * Exit codes:
 *   0  every declared pair clears its floor (known failures excused, if asked)
 *   1  contrast findings
 *   2  fatal — parse, resolve, stale allowlist, bad arguments, or a failed
 *      self-check. The gate could not be trusted to answer.
 */

import fs from 'fs'
import os from 'os'
import path from 'path'

/* ------------------------------------------------------------------ *
 * Colour maths. sRGB in, WCAG 2.x ratio out. No dependency.
 * ------------------------------------------------------------------ */

/** 8-bit sRGB channels plus a 0-1 alpha. */
interface Rgba {
  r: number
  g: number
  b: number
  a: number
}

function clamp01(n: number): number {
  return n < 0 ? 0 : n > 1 ? 1 : n
}

/**
 * HSL → sRGB, rounded to 8-bit. The `f(n)` formulation is css-color-4's own
 * reference algorithm; the piecewise sector form differs from it by ±1/255 on
 * a handful of hues where a channel lands exactly on .5, and this gate should
 * not disagree with the browser about the colour it is judging.
 *
 * The rounding is deliberate and load-bearing, not incidental: a browser
 * paints 8-bit channels, so the ratio a user actually experiences is the ratio
 * of the rounded colour. Amber is the case that proves it — unrounded it
 * measures 1.9736 and rounded 1.9751, either side of the 1.98 this gate
 * records. Measure what ships.
 */
function hslToRgba(h: number, s: number, l: number, a: number): Rgba {
  const hue = ((h % 360) + 360) % 360
  const chroma = s * Math.min(l, 1 - l)
  const f = (n: number): number => {
    const k = (n + hue / 30) % 12
    return l - chroma * Math.max(-1, Math.min(k - 3, 9 - k, 1))
  }
  return {
    r: Math.round(f(0) * 255),
    g: Math.round(f(8) * 255),
    b: Math.round(f(4) * 255),
    a
  }
}

/** sRGB transfer function, WCAG 2.x form. */
function channelToLinear(v8: number): number {
  const c = v8 / 255
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

function relativeLuminance(c: Rgba): number {
  return (
    0.2126 * channelToLinear(c.r) +
    0.7152 * channelToLinear(c.g) +
    0.0722 * channelToLinear(c.b)
  )
}

/**
 * WCAG 2.x contrast ratio. Both arguments must be opaque — alpha is not a
 * factor in the formula, and silently measuring a translucent colour as if it
 * were solid is the single easiest way for this gate to report a false green.
 * `evaluate()` refuses translucent operands before reaching here.
 */
function contrastRatio(a: Rgba, b: Rgba): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/** Source-over composite of a translucent colour onto a ground. */
function compositeOver(top: Rgba, bottom: Rgba): Rgba {
  const a = top.a + bottom.a * (1 - top.a)
  if (a === 0) return { r: 0, g: 0, b: 0, a: 0 }
  const mix = (t: number, u: number): number =>
    Math.round((t * top.a + u * bottom.a * (1 - top.a)) / a)
  return {
    r: mix(top.r, bottom.r),
    g: mix(top.g, bottom.g),
    b: mix(top.b, bottom.b),
    a
  }
}

function toHex(c: Rgba): string {
  const h = (n: number): string =>
    Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0').toUpperCase()
  return `#${h(c.r)}${h(c.g)}${h(c.b)}`
}

/* ------------------------------------------------------------------ *
 * Value parsing
 * ------------------------------------------------------------------ */

class ResolveError extends Error {}

class MissingTokenError extends Error {
  constructor(public readonly token: string) {
    super(`undefined token: ${token}`)
  }
}

/** Split on `sep`, ignoring separators nested inside parentheses. */
function splitTopLevel(input: string, sep: string): string[] {
  const out: string[] = []
  let depth = 0
  let buf = ''
  for (const ch of input) {
    if (ch === '(') depth++
    else if (ch === ')') depth = Math.max(0, depth - 1)
    if (ch === sep && depth === 0) {
      out.push(buf.trim())
      buf = ''
    } else {
      buf += ch
    }
  }
  out.push(buf.trim())
  return out
}

/** Index of the `)` matching the `(` at `open`, or -1. */
function matchParen(s: string, open: number): number {
  let depth = 0
  for (let i = open; i < s.length; i++) {
    const ch = s[i]
    if (ch === '(') depth++
    else if (ch === ')') {
      depth--
      if (depth === 0) return i
    }
  }
  return -1
}

function parsePercent(raw: string, what: string): number {
  const m = raw.trim().match(/^([\d.]+)%$/)
  if (!m || m[1] === undefined) {
    throw new ResolveError(`expected a percentage for ${what}, got "${raw}"`)
  }
  return parseFloat(m[1]) / 100
}

function parseAlpha(raw: string): number {
  const t = raw.trim()
  if (t.endsWith('%')) return clamp01(parsePercent(t, 'alpha'))
  const n = Number(t)
  if (!Number.isFinite(n)) throw new ResolveError(`expected an alpha value, got "${raw}"`)
  return clamp01(n)
}

function parseHue(raw: string): number {
  const n = Number(raw.trim().replace(/deg$/, ''))
  if (!Number.isFinite(n)) throw new ResolveError(`expected a hue, got "${raw}"`)
  return n
}

const NAMED: Readonly<Record<string, Rgba>> = {
  white: { r: 255, g: 255, b: 255, a: 1 },
  black: { r: 0, g: 0, b: 0, a: 1 },
  transparent: { r: 0, g: 0, b: 0, a: 0 }
}

const FORBIDDEN_SPACES = ['oklch', 'oklab', 'lab', 'lch', 'color(']

/**
 * Parse a fully var()-expanded CSS colour value.
 *
 * Handles `#rgb` / `#rrggbb` / `#rrggbbaa`, `hsl()` / `hsla()` (comma or space
 * separated, with or without alpha), `rgb()` / `rgba()`, `color-mix(in srgb,
 * …)`, and the `white` / `black` / `transparent` keywords. Everything else —
 * including the other CSS named colours and `currentColor` — is an error, on
 * the principle that a gate should not guess.
 */
function parseColor(raw: string): Rgba {
  const value = raw.trim()
  const lower = value.toLowerCase()

  for (const banned of FORBIDDEN_SPACES) {
    if (lower.startsWith(banned)) {
      throw new ResolveError(
        `"${value}" uses ${banned.replace('(', '')} — the brief forbids it; hsl() only`
      )
    }
  }

  // `Object.hasOwn`, not `NAMED[lower]`: a token whose value is the literal
  // string `constructor` would otherwise pick up `Object` and spread to NaN.
  if (Object.hasOwn(NAMED, lower)) return { ...(NAMED[lower] as Rgba) }

  if (value.startsWith('#')) return parseHex(value)

  const fn = value.match(/^([a-z-]+)\(([\s\S]*)\)$/i)
  if (!fn || fn[1] === undefined || fn[2] === undefined) {
    if (/^[\d.]+\s*,\s*[\d.]+%\s*,\s*[\d.]+%$/.test(value)) {
      throw new ResolveError(
        `"${value}" is a bare HSL channel triplet, not a colour — it must be wrapped as hsl(...)`
      )
    }
    throw new ResolveError(`unrecognised colour value: "${value}"`)
  }

  const name = fn[1].toLowerCase()
  const inner = fn[2]

  if (name === 'hsl' || name === 'hsla') return parseHslFn(inner)
  if (name === 'rgb' || name === 'rgba') return parseRgbFn(inner)
  if (name === 'color-mix') return parseColorMix(inner)

  throw new ResolveError(`unsupported colour function: ${name}()`)
}

function parseHex(value: string): Rgba {
  const hex = value.slice(1)
  if (!/^[0-9a-f]+$/i.test(hex)) throw new ResolveError(`malformed hex colour: "${value}"`)
  const expand = (s: string): number => parseInt(s.length === 1 ? s + s : s, 16)
  if (hex.length === 3 || hex.length === 4) {
    return {
      r: expand(hex[0] as string),
      g: expand(hex[1] as string),
      b: expand(hex[2] as string),
      a: hex.length === 4 ? expand(hex[3] as string) / 255 : 1
    }
  }
  if (hex.length === 6 || hex.length === 8) {
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
      a: hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1
    }
  }
  throw new ResolveError(`malformed hex colour: "${value}"`)
}

function fnArgs(inner: string): string[] {
  return inner
    .replace(/\//g, ',')
    .split(/[,\s]+/)
    .map(p => p.trim())
    .filter(Boolean)
}

function parseHslFn(inner: string): Rgba {
  const parts = fnArgs(inner)
  if (parts.length < 3) throw new ResolveError(`hsl() needs 3 channels, got "${inner}"`)
  return hslToRgba(
    parseHue(parts[0] as string),
    parsePercent(parts[1] as string, 'saturation'),
    parsePercent(parts[2] as string, 'lightness'),
    parts.length > 3 ? parseAlpha(parts[3] as string) : 1
  )
}

function parseRgbFn(inner: string): Rgba {
  const parts = fnArgs(inner)
  if (parts.length < 3) throw new ResolveError(`rgb() needs 3 channels, got "${inner}"`)
  const chan = (s: string): number =>
    s.endsWith('%') ? Math.round(parsePercent(s, 'channel') * 255) : Math.round(Number(s))
  return {
    r: chan(parts[0] as string),
    g: chan(parts[1] as string),
    b: chan(parts[2] as string),
    a: parts.length > 3 ? parseAlpha(parts[3] as string) : 1
  }
}

/**
 * `color-mix(in srgb, A p%, B q%)`.
 *
 * The `srgb` space interpolates in gamma-encoded sRGB — a straight channel
 * lerp, premultiplied by alpha, per css-color-5. Percentages that sum to less
 * than 100% also *reduce the result's alpha* by that sum, which is the part
 * that is easy to miss; every mix in the token files sums to 100%, but a
 * future one that does not would otherwise be over-reported as opaque.
 */
function parseColorMix(inner: string): Rgba {
  const parts = splitTopLevel(inner, ',')
  const space = (parts[0] ?? '').trim().toLowerCase()
  if (space !== 'in srgb') {
    throw new ResolveError(`color-mix(${space}) is unsupported — only "in srgb"`)
  }
  if (parts.length !== 3) {
    throw new ResolveError(`color-mix() needs exactly two colours, got ${parts.length - 1}`)
  }

  const left = splitColorAndPercent(parts[1] as string)
  const right = splitColorAndPercent(parts[2] as string)

  let p = left.pct
  let q = right.pct
  if (p === null && q === null) {
    p = 0.5
    q = 0.5
  } else if (p === null) p = Math.max(0, 1 - (q as number))
  else if (q === null) q = Math.max(0, 1 - p)

  const total = p + q
  if (total <= 0) throw new ResolveError(`color-mix() percentages sum to zero: "${inner}"`)
  p /= total
  q /= total

  const ca = parseColor(left.color)
  const cb = parseColor(right.color)

  const mixedAlpha = p * ca.a + q * cb.a
  if (mixedAlpha === 0) return { r: 0, g: 0, b: 0, a: 0 }
  const mix = (x: number, y: number): number =>
    Math.round(((p * ca.a * (x / 255) + q * cb.a * (y / 255)) / mixedAlpha) * 255)

  return {
    r: mix(ca.r, cb.r),
    g: mix(ca.g, cb.g),
    b: mix(ca.b, cb.b),
    a: clamp01(mixedAlpha * Math.min(1, total))
  }
}

function splitColorAndPercent(s: string): { color: string; pct: number | null } {
  const m = s.trim().match(/^([\s\S]*?)\s+([\d.]+)%$/)
  if (m && m[1] !== undefined && m[2] !== undefined) {
    return { color: m[1].trim(), pct: parseFloat(m[2]) / 100 }
  }
  return { color: s.trim(), pct: null }
}

/* ------------------------------------------------------------------ *
 * Token sheet — scope-aware parse + resolve
 * ------------------------------------------------------------------ */

const TOKEN_FILES = [
  'tokens/primitive-colors.css',
  'tokens/primitive-colors-shades-and-tints.css',
  'tokens/semantic-colors.css',
  'tokens/semantic-colors-shades-and-tints.css'
] as const

interface Declaration {
  value: string
  file: string
  line: number
}

interface Hit {
  decl: Declaration
  /** The scope key the declaration was found under. */
  selector: string
}

const ROOT_KEY = ':root'

/**
 * Normalise a selector to a stable lookup key.
 *
 * Attribute values are re-quoted to one form, because `[data-program='x']` and
 * `[data-program="x"]` are the same selector to a browser and were two
 * different map keys here — and a key that misses falls through the scope
 * chain to `:root`, which is exactly the silent wrong answer this class exists
 * to prevent.
 */
function normaliseSelector(raw: string): string {
  const s = raw.replace(/\s+/g, ' ').trim()
  if (s === '') return ROOT_KEY
  return s.replace(
    /\[\s*([\w-]+)\s*([~|^$*]?=)\s*(?:"([^"]*)"|'([^']*)'|([^\]\s]+))\s*\]/g,
    (_match: string, attr: string, op: string, dq?: string, sq?: string, bare?: string): string =>
      `[${attr}${op}"${dq ?? sq ?? bare ?? ''}"]`
  )
}

/**
 * Declarations indexed by selector, not flattened into one map.
 *
 * `validate-tokens.ts` flattens, which is fine for its checks and wrong for
 * this one: gh#251 declares `--hsl-program` four times over — once inside each
 * `[data-program="…"]` block plus a `:root` default — and a flat map keeps
 * whichever came last, so the gate would silently measure one programme's
 * colour and report it as all three.
 *
 * KNOWN LIMITATION: this is a brace-walker, not a CSS tokenizer. A `;` or a
 * brace inside a quoted string or a `url()` will corrupt the declaration it
 * sits in, and an unterminated `/*` swallows the rest of the file. Neither
 * shape occurs in a colour token sheet, and both fail loudly rather than
 * silently, so a real parser is not worth the dependency here.
 */
class TokenSheet {
  private readonly scopes = new Map<string, Map<string, Declaration>>()
  readonly parsedFiles: string[] = []

  constructor(private readonly cssDir: string) {}

  load(): void {
    for (const rel of TOKEN_FILES) {
      const filePath = path.join(this.cssDir, rel)
      if (!fs.existsSync(filePath)) {
        throw new ResolveError(`token file not found: ${filePath}`)
      }
      this.parse(fs.readFileSync(filePath, 'utf-8'), rel)
      this.parsedFiles.push(rel)
    }
  }

  get tokenCount(): number {
    const names = new Set<string>()
    for (const scope of this.scopes.values()) for (const n of scope.keys()) names.add(n)
    return names.size
  }

  /**
   * Brace-walk the sheet, remembering the selector each declaration sits under.
   * Comments are blanked rather than removed so reported line numbers stay true.
   */
  private parse(source: string, file: string): void {
    const css = source.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '))
    const stack: string[] = []
    let buf = ''
    let line = 1
    let declLine = 1

    for (const ch of css) {
      if (ch === '\n') line++
      if (ch === '{') {
        stack.push(buf.trim())
        buf = ''
        declLine = line
      } else if (ch === '}') {
        // A final declaration with no trailing `;` is legal CSS and a common
        // formatter output. Record it before popping, or it is silently lost.
        this.record(buf.trim(), stack, file, declLine)
        stack.pop()
        buf = ''
        declLine = line
      } else if (ch === ';') {
        this.record(buf.trim(), stack, file, declLine)
        buf = ''
        declLine = line
      } else {
        if (buf.trim() === '') declLine = line
        buf += ch
      }
    }
  }

  private record(decl: string, stack: string[], file: string, line: number): void {
    if (!decl.startsWith('--')) return
    const colon = decl.indexOf(':')
    if (colon === -1) return

    const name = decl.slice(0, colon).trim()
    const value = decl.slice(colon + 1).trim()

    // Conditional at-rules key apart from the unconditional cascade. `@media
    // (prefers-contrast: more) { :root { --color-link: … } }` must not
    // overwrite the `:root` value every screen actually sees.
    const conditional = stack.filter(frame => frame.startsWith('@') && !/^@layer\b/.test(frame))
    const prefix = conditional.length > 0 ? `${conditional.join(' ')} ‖ ` : ''

    const innermost = stack[stack.length - 1] ?? ROOT_KEY
    const selectorText = innermost.startsWith('@') ? ROOT_KEY : innermost

    // `:root, [data-program]` declares into both scopes. Split at the top level
    // so a comma inside `:is()` / `:where()` / `:not()` does not shear the
    // selector into two keys that match nothing.
    for (const part of splitTopLevel(selectorText, ',')) {
      const key = prefix + normaliseSelector(part)
      let scope = this.scopes.get(key)
      if (!scope) {
        scope = new Map<string, Declaration>()
        this.scopes.set(key, scope)
      }
      scope.set(name, { value, file, line })
    }
  }

  lookup(name: string, chain: readonly string[]): Hit | undefined {
    for (const selector of chain) {
      const decl = this.scopes.get(selector)?.get(name)
      if (decl) return { decl, selector }
    }
    return undefined
  }

  /**
   * Replace every `var()` with the text it resolves to, recursively.
   *
   * Scans for the balanced closing paren rather than regex-matching, so a
   * fallback that is itself a function — `var(--a, var(--b))`, the obvious way
   * to write a programme fallback chain — resolves instead of erroring.
   */
  private expand(value: string, chain: readonly string[], trail: readonly string[]): string {
    if (trail.length > 64) {
      throw new ResolveError(`var() nesting too deep: ${trail.join(' → ')}`)
    }

    let out = ''
    let i = 0
    while (i < value.length) {
      const at = value.indexOf('var(', i)
      if (at === -1) {
        out += value.slice(i)
        break
      }
      out += value.slice(i, at)

      const close = matchParen(value, at + 3)
      if (close === -1) throw new ResolveError(`unbalanced var() in "${value}"`)

      const args = splitTopLevel(value.slice(at + 4, close), ',')
      const name = (args[0] ?? '').trim()
      const fallback = args.length > 1 ? args.slice(1).join(',').trim() : undefined

      if (!/^--[\w-]+$/.test(name)) {
        throw new ResolveError(`malformed var() reference "${name}" in "${value}"`)
      }
      if (trail.includes(name)) {
        throw new ResolveError(`circular var() reference: ${[...trail, name].join(' → ')}`)
      }

      const hit = this.lookup(name, chain)
      if (hit) out += this.expand(hit.decl.value, chain, [...trail, name])
      else if (fallback !== undefined) out += this.expand(fallback, chain, trail)
      else throw new MissingTokenError(name)

      i = close + 1
    }
    return out
  }

  resolve(name: string, chain: readonly string[]): Rgba {
    const hit = this.lookup(name, chain)
    if (!hit) throw new MissingTokenError(name)
    try {
      return parseColor(this.expand(hit.decl.value, chain, [name]))
    } catch (error) {
      if (error instanceof MissingTokenError) throw error
      const message = error instanceof Error ? error.message : String(error)
      throw new ResolveError(`${name} (${hit.decl.file}:${hit.decl.line}): ${message}`)
    }
  }
}

/* ------------------------------------------------------------------ *
 * The pairs under assertion
 * ------------------------------------------------------------------ */

type ColorRef =
  | { kind: 'token'; name: string }
  | { kind: 'literal'; value: string }
  | { kind: 'over'; top: ColorRef; under: ColorRef }

interface Pair {
  id: string
  label: string
  fg: ColorRef
  bg: ColorRef
  floor: number
  /** Scope chain, most specific first. */
  scope: readonly string[]
  /**
   * Tokens that must resolve from a scope other than `:root`. Without this a
   * missing `[data-program="…"]` block falls through to the `:root` default
   * and one programme's colour is reported under another's label — the exact
   * failure the scope-aware parser exists to prevent.
   *
   * Name the token that actually VARIES per programme, not merely one declared
   * inside some non-`:root` rule. gh#251 declares `--color-program*` once, in
   * a shared `:root, [data-program]` rule, and varies the hue through
   * `--hsl-program*` inside each slug block. Listing only `--color-program*`
   * therefore always resolved from `[data-program]` and passed whether or not
   * the slug block existed at all: renaming `[data-program="democracy"]` to
   * `democrasy` still exited 0, printing the neutral navy default under
   * democracy's label. Both halves are listed now, so the check tests the
   * thing it claims to.
   */
  requireScoped?: readonly string[]
  /** Issue that introduces the tokens this pair needs, when they do not exist yet. */
  pendingFrom?: string
  note?: string
}

const ROOT: readonly string[] = [ROOT_KEY]

/**
 * Programme slugs, from `content/bf/programs/*.json`, with the primitive each
 * is assigned by the wave-1 plan's mapping table.
 */
const PROGRAMS: ReadonlyArray<{ slug: string; primitive: string; hue: string }> = [
  { slug: 'democracy', primitive: '--color-green', hue: 'teal' },
  { slug: 'future-leadership', primitive: '--color-red', hue: 'red' },
  { slug: 'transatlantic-relations-global-challenges', primitive: '--color-yellow', hue: 'amber' }
]

const WHITE: ColorRef = { kind: 'literal', value: '#FFFFFF' }

function programScope(slug: string): readonly string[] {
  return [
    normaliseSelector(`[data-program="${slug}"]`),
    normaliseSelector('[data-program]'),
    ROOT_KEY
  ]
}

/** Every token a pair names directly, including through an `over` composite. */
function ownTokens(ref: ColorRef, into: string[] = []): string[] {
  if (ref.kind === 'token') into.push(ref.name)
  else if (ref.kind === 'over') {
    ownTokens(ref.top, into)
    ownTokens(ref.under, into)
  }
  return into
}

function buildPairs(): Pair[] {
  const pairs: Pair[] = [
    {
      id: 'text-on-page',
      label: '--color-text on --color-surface-page',
      fg: { kind: 'token', name: '--color-text' },
      bg: { kind: 'token', name: '--color-surface-page' },
      floor: 4.5,
      scope: ROOT
    },
    {
      id: 'text-inverse-on-surface-inverse',
      label: '--color-text-inverse on --color-surface-inverse',
      fg: { kind: 'token', name: '--color-text-inverse' },
      bg: { kind: 'token', name: '--color-surface-inverse' },
      floor: 4.5,
      scope: ROOT
    },
    {
      id: 'link-on-page',
      label: '--color-link on --color-surface-page',
      fg: { kind: 'token', name: '--color-link' },
      bg: { kind: 'token', name: '--color-surface-page' },
      floor: 4.5,
      scope: ROOT
    }
  ]

  // The chip case, measured against the primitives the programmes are keyed
  // to. These are live today and are the acceptance baseline: 5.03 / 4.39 / 1.98.
  for (const program of PROGRAMS) {
    pairs.push({
      id: `white-on-${program.hue}`,
      label: `white on ${program.primitive} (${program.hue} — chip fill, ${program.slug})`,
      fg: WHITE,
      bg: { kind: 'token', name: program.primitive },
      floor: 4.5,
      scope: ROOT
    })
  }

  // gh#251 tokens. Reported as pending until they exist; live the moment they do.
  for (const program of PROGRAMS) {
    const scope = programScope(program.slug)
    pairs.push({
      id: `program-on-light--${program.slug}`,
      label: `--color-program-on-light on --color-surface-page [${program.slug}]`,
      fg: { kind: 'token', name: '--color-program-on-light' },
      bg: { kind: 'token', name: '--color-surface-page' },
      floor: 4.5,
      scope,
      requireScoped: ['--color-program-on-light', '--hsl-program-on-light'],
      pendingFrom: '#251'
    })
    pairs.push({
      id: `program-on-dark--${program.slug}`,
      label: `--color-program-on-dark on --color-surface-inverse [${program.slug}]`,
      fg: { kind: 'token', name: '--color-program-on-dark' },
      bg: { kind: 'token', name: '--color-surface-inverse' },
      floor: 4.5,
      scope,
      requireScoped: ['--color-program-on-dark', '--hsl-program-on-dark'],
      /*
        The ground moved in gh#253, and the reason is arithmetic rather than
        preference.

        This pair used to read `over(--color-scrim, --color-surface-page)` and
        wait on a token the hero phase would supply. The hero phase supplied
        it — `--color-scrim` is `hsl(var(--hsl-navy), 0.70)` — and the pair
        still could not pass, because over that ground the highest ratio ANY
        colour can reach is 4.840 and pure white is what reaches it. These
        three measure 1.92 / 1.64 / 1.87 there. Red is worse than unlucky: it
        needs a ground of relative luminance <= 0.0291 to clear 4.5, and navy
        at full opacity is 0.04004 — so over a navy scrim it fails at every
        alpha for any photograph no darker than navy itself, which is the
        worst case this pair's ground models and the only one that can be
        asserted about an image nobody has uploaded yet. No amount of tuning
        fixes that.

        What the pair was asserting, then, was programme colour as text over
        media — which is exactly what gh#253 measured and forbade. The scrim
        ground is not left unmeasured: `white-on-scrim` and
        `white-on-scrim-panel` below measure it, at the one foreground the
        architecture ever puts there.

        `--color-surface-inverse` is the ground this tier is named for and the
        one `semantic-colors.css` has always recorded its ratios against
        (7.96 / 6.79 / 7.73) with nothing checking them.

        This is **not literally** what residual #264 asked for, and the
        difference is worth stating where a future reader will hit it: #264
        asked for a *fourth* pair per programme against
        `--color-surface-inverse` and for the scrim-composited pairs to stay
        pending for this phase. This phase is the one that discovered the
        scrim-composited pair is unsatisfiable, so it is re-pointed rather
        than joined by a sibling that would report red forever. #264's on-dark
        half is closed by that. Its other two items are deliberately still
        open: the `:root` neutral programme default, which no pair declares,
        and the observation that `pendingFrom` has no expiry rule.
      */
      note: 'the tier\'s real ground; the scrim-composited form is unsatisfiable (see gh#253)'
    })
    pairs.push({
      id: `white-on-program--${program.slug}`,
      label: `white on --color-program [${program.slug}] (chip)`,
      fg: WHITE,
      bg: { kind: 'token', name: '--color-program' },
      floor: 4.5,
      scope,
      requireScoped: ['--color-program', '--hsl-program'],
      pendingFrom: '#251'
    })
  }

  /*
    The two scrim modes, live since gh#253. Both measure the worst case a
    photograph can present — a blown-out white frame, which is BFNA's house
    style — so a pass here is a pass over any image the site can ship.

    This is the pair that decided the alpha: 0.60 gives 3.692 and 0.65 gives
    4.245, both fails, and 0.70 is the first value that clears 4.5.
  */
  pairs.push({
    id: 'white-on-scrim',
    label: 'white on --color-scrim over a blown-out white photograph',
    fg: WHITE,
    bg: {
      kind: 'over',
      top: { kind: 'token', name: '--color-scrim' },
      under: WHITE
    },
    floor: 4.5,
    scope: ROOT,
    note: 'worst-case ground: BFNA house style is bright imagery'
  })

  pairs.push({
    id: 'white-on-scrim-panel',
    label: 'white on --color-scrim-panel over a blown-out white photograph',
    fg: WHITE,
    bg: {
      kind: 'over',
      top: { kind: 'token', name: '--color-scrim-panel' },
      under: WHITE
    },
    floor: 4.5,
    scope: ROOT,
    note: 'data-scrim="panel" — the near-opaque column behind the copy'
  })

  return pairs
}

/* ------------------------------------------------------------------ *
 * Known failures — the ratchet
 * ------------------------------------------------------------------ */

interface KnownFailure {
  pairId: string
  issue: string
  why: string
}

/**
 * Pairs that fail today, are known to, and are already owned by an issue.
 *
 * `--allow-known` excuses these from the exit code so gh#251 — the PR that
 * fixes them — is not blocked by the gate that asked for the fix. It is a
 * ratchet, not an escape hatch: an entry whose pair now PASSES is itself an
 * error, so gh#251 cannot repair amber without deleting its row here, and
 * cannot delete a row without repairing the colour.
 *
 * Nothing may be added to this list without an issue that removes it.
 *
 * gh#251 MUST update SHIPPED_BASELINE below in the same commit — the
 * self-check locks the resolver against those exact values, so a palette
 * repair that leaves them stale fails the self-check rather than the gate.
 */
const KNOWN_FAILURES: readonly KnownFailure[] = [
  {
    pairId: 'white-on-amber',
    // Not #251. That issue decided against the repair; this one owns it, and
    // the list's rule is that every entry names the issue that REMOVES it.
    issue: '#263',
    why:
      'amber #EEAC49 measures 1.98 on white — the worst pair in the palette. ' +
      'gh#251 deliberately did NOT repair it. The only lightness that clears ' +
      'white is 36, 83%, 35% (#A3680F, a dark ochre), and moving the primitive ' +
      'there repaints --color-tertiary, --color-warning, the whole amber ' +
      'ladder, the utility classes and bf/Notice.vue:52-60, whose block comment ' +
      'records a measurement it would silently invalidate. The programme axis ' +
      'carries that deep amber itself instead, as --color-program for ' +
      'transatlantic-relations-global-challenges, so the chip clears 4.5 ' +
      'without the primitive moving. Repairing --hsl-yellow is token-hygiene ' +
      'work with its own blast radius — see ' +
      'docs/decisions/gh251-programme-colour-tokens.md §3. Removal is owned by #263.'
  }
]

/**
 * The palette as it stands, asserted by `--self-check`.
 *
 * This is a resolver lock, not a policy: it ties HSL→sRGB, `var()` following
 * and 8-bit rounding together so any one of them drifting is caught. It
 * describes what ships today and must be updated by whichever change moves
 * these colours — gh#251, for red and amber.
 */
const SHIPPED_BASELINE: ReadonlyArray<{ id: string; hex: string; ratio: number }> = [
  { id: 'white-on-teal', hex: '#027A8D', ratio: 5.03 },
  // gh#251 moved --hsl-red from 352, 59%, 55% to 54%: #D0495B / 4.39 → #CF4457 / 4.55.
  { id: 'white-on-red', hex: '#CF4457', ratio: 4.55 },
  // Amber is unchanged and still fails — see its KNOWN_FAILURES row.
  { id: 'white-on-amber', hex: '#EEAC49', ratio: 1.98 }
]

/* ------------------------------------------------------------------ *
 * The run
 * ------------------------------------------------------------------ */

type Verdict = 'pass' | 'fail' | 'known-fail' | 'pending' | 'error'

interface Result {
  pair: Pair
  verdict: Verdict
  ratio?: number
  fgHex?: string
  bgHex?: string
  /** Set whenever the pair appears in KNOWN_FAILURES, in either mode. */
  knownIssue?: string
  detail?: string
}

interface RunReport {
  results: Result[]
  errors: string[]
  tokenCount: number
  fileCount: number
}

function fmt(n: number): string {
  return n.toFixed(2)
}

class ContrastGate {
  private readonly sheet: TokenSheet

  constructor(cssDir: string) {
    this.sheet = new TokenSheet(cssDir)
  }

  run(allowKnown: boolean): RunReport {
    const errors: string[] = []
    this.sheet.load()

    const results: Result[] = []
    for (const pair of buildPairs()) {
      results.push(this.evaluate(pair, errors, allowKnown))
    }

    return {
      results,
      errors,
      tokenCount: this.sheet.tokenCount,
      fileCount: this.sheet.parsedFiles.length
    }
  }

  private resolveRef(ref: ColorRef, scope: readonly string[]): Rgba {
    if (ref.kind === 'literal') return parseColor(ref.value)
    if (ref.kind === 'token') return this.sheet.resolve(ref.name, scope)
    return compositeOver(this.resolveRef(ref.top, scope), this.resolveRef(ref.under, scope))
  }

  private evaluate(pair: Pair, errors: string[], allowKnown: boolean): Result {
    const known = KNOWN_FAILURES.find(k => k.pairId === pair.id)
    const fail = (message: string): Result => {
      errors.push(`${pair.id}: ${message}`)
      return { pair, verdict: 'error', detail: message, knownIssue: known?.issue }
    }

    let fg: Rgba
    let bg: Rgba
    try {
      fg = this.resolveRef(pair.fg, pair.scope)
      bg = this.resolveRef(pair.bg, pair.scope)
    } catch (error) {
      if (error instanceof MissingTokenError) {
        // A pair may only be excused for a token it names ITSELF. Excusing any
        // miss anywhere in the var chain turns a typo inside a token that DOES
        // exist into a cheerful "not yet defined" and a green run.
        const named = [...ownTokens(pair.fg), ...ownTokens(pair.bg)]
        if (pair.pendingFrom && named.includes(error.token)) {
          return {
            pair,
            verdict: 'pending',
            detail: `${error.token} not yet defined — lands in ${pair.pendingFrom}`,
            knownIssue: known?.issue
          }
        }
        if (pair.pendingFrom) {
          return fail(
            `${error.token} is undefined, reached through ${named.join(' / ')}. ` +
              `A pair is only excused as "not yet defined" for a token it names directly.`
          )
        }
        return fail(`${error.message} (this token is expected to exist today)`)
      }
      return fail(error instanceof Error ? error.message : String(error))
    }

    // A translucent operand has no defined contrast ratio. Measuring it as
    // opaque scores `transparent` text at 21:1 — the worst false green
    // available. Declare it as `{ kind: 'over' }` against a real ground.
    for (const [role, colour] of [
      ['foreground', fg],
      ['background', bg]
    ] as const) {
      if (colour.a !== 1) {
        return fail(
          `${role} resolves to alpha ${colour.a} — a translucent colour has no ` +
            `contrast ratio on its own. Declare it as a composite over a ground.`
        )
      }
    }

    for (const name of pair.requireScoped ?? []) {
      const hit = this.sheet.lookup(name, pair.scope)
      if (!hit || hit.selector === ROOT_KEY) {
        return fail(
          `${name} resolved from ${hit?.selector ?? 'nowhere'} rather than a scope in ` +
            `[${pair.scope.slice(0, -1).join(', ')}]. This pair would report the ` +
            `default colour under a scoped label.`
        )
      }
    }

    const ratio = contrastRatio(fg, bg)
    let verdict: Verdict
    if (ratio >= pair.floor) verdict = 'pass'
    else if (known && allowKnown) verdict = 'known-fail'
    else verdict = 'fail'

    return {
      pair,
      verdict,
      ratio,
      fgHex: toHex(fg),
      bgHex: toHex(bg),
      knownIssue: known?.issue
    }
  }
}

/* ------------------------------------------------------------------ *
 * Reporting
 * ------------------------------------------------------------------ */

function report(run: RunReport, allowKnown: boolean, quiet = false): number {
  const say = (line: string): void => {
    if (!quiet) console.log(line)
  }

  say(`✅ Parsed ${run.tokenCount} tokens from ${run.fileCount} files\n`)
  say('🎨 Measuring declared pairs against their WCAG floors...\n')

  const live = run.results.filter(r => r.verdict !== 'pending' && r.verdict !== 'error')
  const pending = run.results.filter(r => r.verdict === 'pending')
  const failures = live.filter(r => r.verdict === 'fail')
  const excused = live.filter(r => r.verdict === 'known-fail')
  const knownBelowFloor = live.filter(r => r.verdict !== 'pass' && r.knownIssue !== undefined)

  for (const r of live) {
    const ratio = `${fmt(r.ratio as number)}:1`.padStart(8)
    const floor = `(floor ${fmt(r.pair.floor)})`
    const swatch = `${r.fgHex} on ${r.bgHex}`
    const owner = r.knownIssue !== undefined ? `  [${r.knownIssue}]` : ''
    if (r.verdict === 'pass') {
      say(`  ✅ PASS       ${ratio} ${floor}  ${swatch}  ${r.pair.label}`)
    } else if (r.verdict === 'known-fail') {
      say(`  🟡 KNOWN FAIL ${ratio} ${floor}  ${swatch}  ${r.pair.label}${owner}`)
    } else {
      say(`  ❌ FAIL       ${ratio} ${floor}  ${swatch}  ${r.pair.label}${owner}`)
    }
    if (r.pair.note) say(`               ↳ ${r.pair.note}`)
  }

  if (pending.length > 0) {
    say('\n⏳ Not yet defined — these go live when their tokens land:')
    for (const r of pending) {
      say(`  ·  ${r.pair.label}`)
      say(`     ${r.detail}`)
    }
  }

  // The ratchet: an excused failure that now passes must be un-excused.
  const stale: string[] = []
  for (const known of KNOWN_FAILURES) {
    const match = run.results.find(r => r.pair.id === known.pairId)
    if (!match) {
      stale.push(
        `KNOWN_FAILURES names "${known.pairId}", which is not a pair in this gate. ` +
          `Remove the entry or fix the id.`
      )
    } else if (match.verdict === 'pass') {
      stale.push(
        `"${known.pairId}" now passes at ${fmt(match.ratio as number)}:1. ` +
          `Delete its KNOWN_FAILURES entry (${known.issue}) — an excused pair that ` +
          `passes silently re-excuses the next regression.`
      )
    }
  }

  say('\n' + '='.repeat(60))
  say('📊 Contrast Gate Summary')
  say('='.repeat(60))
  say(`Pairs measured:     ${live.length}`)
  say(`Passing:            ${live.filter(r => r.verdict === 'pass').length}`)
  say(`Failing:            ${failures.length}`)
  say(`Known failing:      ${knownBelowFloor.length}${allowKnown ? ` (${excused.length} excused by --allow-known)` : ''}`)
  say(`Pending definition: ${pending.length}`)
  say(`Resolve errors:     ${run.errors.length}`)

  if (knownBelowFloor.length > 0) {
    say('\n🟡 Known failures — shipped colour that does not clear AA:')
    for (const r of knownBelowFloor) {
      const known = KNOWN_FAILURES.find(k => k.pairId === r.pair.id)
      say(`  - ${r.pair.label} — ${fmt(r.ratio as number)}:1 [${r.knownIssue ?? '?'}]`)
      if (known) say(`    ${known.why}`)
    }
  }

  if (failures.length > 0) {
    say('\n❌ Failures:')
    for (const r of failures) {
      say(`  - ${r.pair.label} — ${fmt(r.ratio as number)}:1, needs ${fmt(r.pair.floor)}:1`)
    }
  }

  if (stale.length > 0) {
    say('\n❌ Stale allowlist entries:')
    for (const s of stale) say(`  - ${s}`)
  }

  if (run.errors.length > 0) {
    say('\n❌ Resolve errors:')
    for (const e of run.errors) say(`  - ${e}`)
  }

  const fatal = stale.length + run.errors.length
  const total = fatal + failures.length

  if (total === 0) {
    if (excused.length > 0) {
      say('\n🟡 Gate green with known failures excused. They are still real.')
    } else {
      say('\n✅ Every declared pair clears its floor.')
    }
    return 0
  }

  say(`\n❌ Contrast gate failed: ${total} finding(s).`)
  if (fatal === 0 && failures.length === knownBelowFloor.length && knownBelowFloor.length > 0) {
    say(
      '   These are the known, owned failures. CI runs with --allow-known so\n' +
        '   the fix is not blocked by the gate that asked for it — see\n' +
        '   docs/decisions/gh250-contrast-gate-known-failures.md.'
    )
  }
  return fatal > 0 ? 2 : 1
}

/* ------------------------------------------------------------------ *
 * Self-check — proof the gate can bite
 * ------------------------------------------------------------------ */

interface Assertion {
  name: string
  ok: boolean
  detail: string
}

/**
 * Four things have to hold, and only the third is about this palette:
 *
 *  1. The maths matches published WCAG reference values, so a broken luminance
 *     formula is caught independently of any token.
 *  2. The resolver reproduces SHIPPED_BASELINE exactly. This locks hsl→rgb,
 *     var() following and 8-bit rounding together — any one of them drifting
 *     moves these numbers.
 *  3. Editing a token below its floor makes the gate report a failure. A gate
 *     that cannot fail is not a gate.
 *  4. `report()`'s EXIT CODE, not just the evaluator's verdicts, responds to
 *     all of the above. An evaluator that finds a failure and an exit code
 *     that ignores it is still a green CI run.
 */
function selfCheck(cssDir: string): number {
  console.log('🧪 Contrast gate self-check\n')
  const assertions: Assertion[] = []

  const near = (actual: number, expected: number, tol: number): boolean =>
    Math.abs(actual - expected) <= tol

  // 1 — reference maths.
  const black = parseColor('#000000')
  const white = parseColor('#FFFFFF')
  const grey = parseColor('#777777')
  assertions.push({
    name: 'maths: #000 on #FFF is 21.00:1',
    ok: near(contrastRatio(black, white), 21, 0.005),
    detail: `${fmt(contrastRatio(black, white))}:1`
  })
  assertions.push({
    name: 'maths: #FFF on #FFF is 1.00:1',
    ok: near(contrastRatio(white, white), 1, 0.005),
    detail: `${fmt(contrastRatio(white, white))}:1`
  })
  assertions.push({
    name: 'maths: #777777 on #FFF is 4.48:1',
    ok: near(contrastRatio(grey, white), 4.48, 0.005),
    detail: `${fmt(contrastRatio(grey, white))}:1`
  })
  assertions.push({
    name: 'maths: ratio is symmetric',
    ok: near(contrastRatio(grey, white), contrastRatio(white, grey), 1e-12),
    detail: 'fg/bg order does not change the ratio'
  })

  // 2 — SHIPPED_BASELINE, resolved from the real token graph.
  const strictRun = new ContrastGate(cssDir).run(false)
  for (const expected of SHIPPED_BASELINE) {
    const actual = strictRun.results.find(r => r.pair.id === expected.id)
    const okHex = actual?.bgHex === expected.hex
    const okRatio = actual?.ratio !== undefined && fmt(actual.ratio) === fmt(expected.ratio)
    assertions.push({
      name: `baseline: ${expected.id} resolves to ${expected.hex} at ${fmt(expected.ratio)}:1`,
      ok: okHex && okRatio,
      detail:
        okHex && okRatio
          ? `${actual?.bgHex} at ${fmt(actual?.ratio as number)}:1`
          : `got ${actual?.bgHex ?? 'unresolved'} at ${actual?.ratio !== undefined ? fmt(actual.ratio) : '—'}:1 — ` +
            `if a palette change moved this deliberately, update SHIPPED_BASELINE`
    })
  }
  assertions.push({
    name: 'baseline: the token graph resolves with no errors',
    ok: strictRun.errors.length === 0,
    detail: `${strictRun.errors.length} resolve error(s)`
  })

  // 4a — exit codes on the real palette, stated relative to the allowlist so a
  // palette repair does not have to edit this assertion.
  const strictExit = report(strictRun, false, true)
  const ciExit = report(new ContrastGate(cssDir).run(true), true, true)
  const expectedStrict = KNOWN_FAILURES.length > 0 ? 1 : 0
  assertions.push({
    name: `exit code: strict run returns ${expectedStrict} (${KNOWN_FAILURES.length} allowlisted pair(s))`,
    ok: strictExit === expectedStrict,
    detail: `strict exit ${strictExit}`
  })
  assertions.push({
    name: 'exit code: --allow-known run returns 0',
    ok: ciExit === 0,
    detail: `ci exit ${ciExit}`
  })

  // 3 + 4b — mutate a token below its floor and confirm the gate notices, and
  // that the EXIT CODE notices too, in both modes.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'check-contrast-selfcheck-'))
  try {
    fs.cpSync(path.join(cssDir, 'tokens'), path.join(tmp, 'tokens'), { recursive: true })
    const mutatedFile = path.join(tmp, 'tokens', 'primitive-colors.css')
    const before = fs.readFileSync(mutatedFile, 'utf-8')
    // `--color-text` resolves through `--hsl-base` → `--hsl-black`. Lift the
    // black to near-white and `--color-text` on `--color-surface-page` collapses.
    const after = before.replace('--hsl-black: 0, 0%, 3%;', '--hsl-black: 0, 0%, 92%;')
    if (after === before) {
      assertions.push({
        name: 'mutation: --hsl-black could be rewritten',
        ok: false,
        detail: 'the anchor string was not found in primitive-colors.css — update the self-check'
      })
    } else {
      fs.writeFileSync(mutatedFile, after, 'utf-8')
      const mutatedStrict = new ContrastGate(tmp).run(false)
      const target = mutatedStrict.results.find(r => r.pair.id === 'text-on-page')
      assertions.push({
        name: 'mutation: text-on-page fails once --hsl-black is lifted to 92% lightness',
        ok: target?.verdict === 'fail',
        detail: `verdict "${target?.verdict ?? 'missing'}" at ${target?.ratio !== undefined ? fmt(target.ratio) : '—'}:1`
      })
      const mutatedStrictExit = report(mutatedStrict, false, true)
      const mutatedCiExit = report(new ContrastGate(tmp).run(true), true, true)
      assertions.push({
        name: 'mutation: the strict exit code is non-zero',
        ok: mutatedStrictExit !== 0,
        detail: `exit ${mutatedStrictExit}`
      })
      assertions.push({
        name: 'mutation: --allow-known does NOT excuse the new failure',
        ok: mutatedCiExit !== 0,
        detail: `exit ${mutatedCiExit} — a new failure is a hard failure, not a known one`
      })
    }

    // The ratchet, end to end: repair an allowlisted colour and the stale entry
    // must be fatal even under --allow-known.
    const ratchetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'check-contrast-ratchet-'))
    try {
      fs.cpSync(path.join(cssDir, 'tokens'), path.join(ratchetDir, 'tokens'), { recursive: true })
      const primitives = path.join(ratchetDir, 'tokens', 'primitive-colors.css')
      const src = fs.readFileSync(primitives, 'utf-8')
      // One anchor per allowlisted primitive, and only those: red's row went
      // with gh#251's repair, so mutating red here would prove nothing and
      // would leave a non-matching literal propping up the `repaired === src`
      // guard for the anchor that does matter.
      const repaired = src.replace('--hsl-yellow: 36, 83%, 61%;', '--hsl-yellow: 36, 83%, 30%;')
      if (repaired === src) {
        assertions.push({
          name: 'ratchet: the allowlisted primitive could be repaired',
          ok: false,
          detail: 'anchor string not found in primitive-colors.css — update the self-check'
        })
      } else {
        fs.writeFileSync(primitives, repaired, 'utf-8')
        const ratchetExit = report(new ContrastGate(ratchetDir).run(true), true, true)
        assertions.push({
          name: 'ratchet: repairing an allowlisted colour is fatal until its entry is deleted',
          ok: ratchetExit === 2,
          detail: `exit ${ratchetExit} under --allow-known`
        })
      }
    } finally {
      fs.rmSync(ratchetDir, { recursive: true, force: true })
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }

  for (const a of assertions) {
    console.log(`  ${a.ok ? '✅' : '❌'} ${a.name}`)
    console.log(`     ${a.detail}`)
  }

  const failed = assertions.filter(a => !a.ok)
  console.log('\n' + '='.repeat(60))
  console.log(`Self-check: ${assertions.length - failed.length}/${assertions.length} assertions passed`)
  console.log('='.repeat(60))

  if (failed.length > 0) {
    console.log('\n❌ The gate does not behave as claimed. Do not trust its verdicts.')
    return 2
  }
  console.log('\n✅ The gate measures correctly and fails when it should.')
  return 0
}

/* ------------------------------------------------------------------ *
 * Entry point
 * ------------------------------------------------------------------ */

const FLAGS = new Set(['--allow-known', '--self-check', '--tokens-dir'])

function main(): number {
  const args = process.argv.slice(2)

  let cssDir = path.join(process.cwd(), 'src', 'public', 'css')
  let allowKnown = false
  let wantsSelfCheck = false

  for (let i = 0; i < args.length; i++) {
    const arg = args[i] as string
    if (arg === '--allow-known') allowKnown = true
    else if (arg === '--self-check') wantsSelfCheck = true
    else if (arg === '--tokens-dir') {
      const next = args[i + 1]
      if (next === undefined || next.startsWith('--')) {
        console.error('--tokens-dir needs a directory argument')
        return 2
      }
      cssDir = path.resolve(next)
      i++
    } else {
      console.error(`Unknown argument: ${arg}`)
      console.error(`Expected one of: ${[...FLAGS].join(', ')}`)
      return 2
    }
  }

  if (wantsSelfCheck) return selfCheck(cssDir)

  console.log('🔍 Checking colour contrast against WCAG floors...\n')
  console.log(`   tokens: ${cssDir}`)
  console.log(`   mode:   ${allowKnown ? '--allow-known (CI)' : 'strict'}\n`)

  return report(new ContrastGate(cssDir).run(allowKnown), allowKnown)
}

try {
  // `process.exitCode`, not `process.exit()`: stdout is async on a pipe, which
  // is what Actions gives it, and an immediate exit can truncate the summary
  // this gate exists to print.
  process.exitCode = main()
} catch (error) {
  console.error('Fatal error:', error)
  process.exitCode = 2
}
