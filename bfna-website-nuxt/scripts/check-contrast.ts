#!/usr/bin/env node

/**
 * Contrast Gate — gh#250
 *
 * #249 retired the ds-epic BRIEF's "add no colour" rule and replaced it with
 * "add no colour that **fails its measured floor**". This script is the thing
 * that measures. Before it, there was no contrast function and no colour
 * utility anywhere in the repository: every ratio in the codebase
 * (`src/components/Button.vue:61`, `docs/ds-epic/issues/41-bf-notice.md:141`)
 * was a hand-written comment that nothing recomputed, so a palette edit could
 * not be caught.
 *
 * Modelled on `scripts/validate-tokens.ts` — same regex-parse-then-assert
 * shape, same reporting style, same exit-code discipline.
 *
 * WHAT IT DOES
 *   Parses the token files, resolves the `--hsl-*` / `--color-*` var graph
 *   down to concrete sRGB, and asserts every declared pair in PAIRS clears its
 *   WCAG floor.
 *
 * IT FAILS TODAY, ON PURPOSE
 *   Two shipped primitives do not clear AA against white: red `#D0495B` at
 *   4.39 and amber `#EEAC49` at 1.98. The gate surfaces that rather than
 *   hiding it. gh#251 fixes the palette; until it lands those two pairs sit in
 *   KNOWN_FAILURES and CI runs with `--allow-known` so the fix is not blocked
 *   by the gate that asked for it. See
 *   `docs/decisions/gh250-contrast-gate-known-failures.md`.
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
 * Usage:
 *   npx tsx scripts/check-contrast.ts                  # strict — non-zero today
 *   npx tsx scripts/check-contrast.ts --allow-known    # CI — known failures excused
 *   npx tsx scripts/check-contrast.ts --self-check     # prove the gate can bite
 *   npx tsx scripts/check-contrast.ts --tokens-dir <d> # point at another css/ root
 *
 * Exit codes: 0 clean · 1 contrast findings · 2 fatal (parse/resolve/self-check)
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

/**
 * HSL → sRGB, rounded to 8-bit.
 *
 * The rounding is deliberate and load-bearing, not incidental: a browser
 * paints 8-bit channels, so the ratio a user actually experiences is the ratio
 * of the rounded colour. Amber is the case that proves it — unrounded it
 * measures 1.9748 and rounded 1.9751, either side of the 1.98 the issue
 * records. Measure what ships.
 */
function hslToRgba(h: number, s: number, l: number, a: number): Rgba {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const hp = ((((h % 360) + 360) % 360)) / 60
  const x = c * (1 - Math.abs((hp % 2) - 1))
  const m = l - c / 2

  let base: readonly [number, number, number]
  if (hp < 1) base = [c, x, 0]
  else if (hp < 2) base = [x, c, 0]
  else if (hp < 3) base = [0, c, x]
  else if (hp < 4) base = [0, x, c]
  else if (hp < 5) base = [x, 0, c]
  else base = [c, 0, x]

  return {
    r: Math.round((base[0] + m) * 255),
    g: Math.round((base[1] + m) * 255),
    b: Math.round((base[2] + m) * 255),
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

function contrastRatio(a: Rgba, b: Rgba): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/** Source-over composite of a translucent colour onto an opaque ground. */
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
    else if (ch === ')') depth--
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

function parsePercent(raw: string, what: string): number {
  const m = raw.trim().match(/^([\d.]+)%$/)
  if (!m || m[1] === undefined) throw new ResolveError(`expected a percentage for ${what}, got "${raw}"`)
  return parseFloat(m[1]) / 100
}

function parseAlpha(raw: string): number {
  const t = raw.trim()
  if (t.endsWith('%')) return parsePercent(t, 'alpha')
  const n = Number(t)
  if (!Number.isFinite(n)) throw new ResolveError(`expected an alpha value, got "${raw}"`)
  return Math.max(0, Math.min(1, n))
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
 * …)`, and the `white` / `black` / `transparent` keywords.
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

  const named = NAMED[lower]
  if (named) return { ...named }

  if (value.startsWith('#')) return parseHex(value)

  const fn = value.match(/^([a-z-]+)\((.*)\)$/is)
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
 * lerp, premultiplied by alpha, per css-color-5. Every mix in the token files
 * is opaque, but the premultiply is what makes it correct if one stops being
 * so.
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
  } else if (p === null) p = 1 - (q as number)
  else if (q === null) q = 1 - p

  const total = p + q
  if (total <= 0) throw new ResolveError(`color-mix() percentages sum to zero: "${inner}"`)
  p /= total
  q /= total

  const ca = parseColor(left.color)
  const cb = parseColor(right.color)

  const a = p * ca.a + q * cb.a
  if (a === 0) return { r: 0, g: 0, b: 0, a: 0 }
  const mix = (x: number, y: number): number =>
    Math.round((p * ca.a * (x / 255) + q * cb.a * (y / 255)) / a * 255)

  return { r: mix(ca.r, cb.r), g: mix(ca.g, cb.g), b: mix(ca.b, cb.b), a }
}

function splitColorAndPercent(s: string): { color: string; pct: number | null } {
  const m = s.trim().match(/^(.*?)\s+([\d.]+)%$/)
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

/**
 * Declarations indexed by selector, not flattened into one map.
 *
 * `validate-tokens.ts` flattens, which is fine for its checks and wrong for
 * this one: gh#251 declares `--hsl-program` four times over — once inside each
 * `[data-program="…"]` block plus a `:root` default — and a flat map keeps
 * whichever came last, so the gate would silently measure one programme's
 * colour and report it as all three.
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
    const selector = stack[stack.length - 1] ?? ':root'

    // `:root, [data-program]` declares into both scopes.
    for (const part of selector.split(',').map(s => s.replace(/\s+/g, ' ').trim())) {
      const key = part === '' || part.startsWith('@') ? ':root' : part
      let scope = this.scopes.get(key)
      if (!scope) {
        scope = new Map<string, Declaration>()
        this.scopes.set(key, scope)
      }
      scope.set(name, { value, file, line })
    }
  }

  lookup(name: string, chain: readonly string[]): Declaration | undefined {
    for (const selector of chain) {
      const hit = this.scopes.get(selector)?.get(name)
      if (hit) return hit
    }
    return undefined
  }

  /** Replace every `var(--x)` with the text it resolves to, recursively. */
  private expand(value: string, chain: readonly string[], trail: readonly string[]): string {
    const VAR = /var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*))?\)/
    let out = value
    let guard = 0

    while (VAR.test(out)) {
      if (++guard > 128) {
        throw new ResolveError(`var() expansion did not terminate for "${value}"`)
      }
      out = out.replace(VAR, (_match: string, rawName: string, fallback?: string): string => {
        if (trail.includes(rawName)) {
          throw new ResolveError(`circular var() reference: ${[...trail, rawName].join(' → ')}`)
        }
        const decl = this.lookup(rawName, chain)
        if (!decl) {
          if (fallback !== undefined) return fallback.trim()
          throw new MissingTokenError(rawName)
        }
        return this.expand(decl.value, chain, [...trail, rawName])
      })
    }
    return out
  }

  resolve(name: string, chain: readonly string[]): Rgba {
    const decl = this.lookup(name, chain)
    if (!decl) throw new MissingTokenError(name)
    return parseColor(this.expand(decl.value, chain, [name]))
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
  /** Issue that introduces the tokens this pair needs, when they do not exist yet. */
  pendingFrom?: string
  note?: string
}

const ROOT: readonly string[] = [':root']

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
  return [`[data-program="${slug}"]`, '[data-program]', ':root']
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
      pendingFrom: '#251'
    })
    pairs.push({
      id: `program-on-dark--${program.slug}`,
      label: `--color-program-on-dark on the scrim ground [${program.slug}]`,
      fg: { kind: 'token', name: '--color-program-on-dark' },
      bg: {
        kind: 'over',
        top: { kind: 'token', name: '--color-scrim' },
        under: { kind: 'token', name: '--color-surface-page' }
      },
      floor: 4.5,
      scope,
      pendingFrom: '#251'
    })
    pairs.push({
      id: `white-on-program--${program.slug}`,
      label: `white on --color-program [${program.slug}] (chip)`,
      fg: WHITE,
      bg: { kind: 'token', name: '--color-program' },
      floor: 4.5,
      scope,
      pendingFrom: '#251'
    })
  }

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
    pendingFrom: 'the hero + scrim phase',
    note: 'worst-case ground: BFNA house style is bright imagery'
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
 */
const KNOWN_FAILURES: readonly KnownFailure[] = [
  {
    pairId: 'white-on-red',
    issue: '#251',
    why: 'red #D0495B measures 4.39 on white; gh#251 moves it to 352, 59%, 54%'
  },
  {
    pairId: 'white-on-amber',
    issue: '#251',
    why:
      'amber #EEAC49 measures 1.98 on white — the worst pair in the palette. ' +
      'gh#251 introduces --color-program-on-light at 36, 83%, 35%; the chip ' +
      'itself must use dark text on an amber tint, not white on amber.'
  }
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

  constructor(private readonly cssDir: string) {
    this.sheet = new TokenSheet(cssDir)
  }

  run(): RunReport {
    const errors: string[] = []
    this.sheet.load()

    const results: Result[] = []
    for (const pair of buildPairs()) {
      results.push(this.evaluate(pair, errors))
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

  private evaluate(pair: Pair, errors: string[]): Result {
    let fg: Rgba
    let bg: Rgba
    try {
      fg = this.resolveRef(pair.fg, pair.scope)
      bg = this.resolveRef(pair.bg, pair.scope)
    } catch (error) {
      if (error instanceof MissingTokenError) {
        if (pair.pendingFrom) {
          return {
            pair,
            verdict: 'pending',
            detail: `${error.token} not yet defined — lands in ${pair.pendingFrom}`
          }
        }
        errors.push(`${pair.id}: ${error.message} (this token is expected to exist today)`)
        return { pair, verdict: 'error', detail: error.message }
      }
      const message = error instanceof Error ? error.message : String(error)
      errors.push(`${pair.id}: ${message}`)
      return { pair, verdict: 'error', detail: message }
    }

    const ratio = contrastRatio(fg, bg)
    const known = KNOWN_FAILURES.find(k => k.pairId === pair.id)
    let verdict: Verdict
    if (ratio >= pair.floor) verdict = 'pass'
    else verdict = known ? 'known-fail' : 'fail'

    return { pair, verdict, ratio, fgHex: toHex(fg), bgHex: toHex(bg) }
  }
}

/* ------------------------------------------------------------------ *
 * Reporting
 * ------------------------------------------------------------------ */

function report(run: RunReport, allowKnown: boolean): number {
  console.log(`✅ Parsed ${run.tokenCount} tokens from ${run.fileCount} files\n`)
  console.log('🎨 Measuring declared pairs against their WCAG floors...\n')

  const live = run.results.filter(r => r.verdict !== 'pending' && r.verdict !== 'error')
  const pending = run.results.filter(r => r.verdict === 'pending')
  const failures = live.filter(r => r.verdict === 'fail')
  const knownFailures = live.filter(r => r.verdict === 'known-fail')

  for (const r of live) {
    const ratio = `${fmt(r.ratio as number)}:1`.padStart(8)
    const floor = `(floor ${fmt(r.pair.floor)})`
    const swatch = `${r.fgHex} on ${r.bgHex}`
    if (r.verdict === 'pass') {
      console.log(`  ✅ PASS       ${ratio} ${floor}  ${swatch}  ${r.pair.label}`)
    } else if (r.verdict === 'known-fail') {
      const known = KNOWN_FAILURES.find(k => k.pairId === r.pair.id)
      console.log(
        `  🟡 KNOWN FAIL ${ratio} ${floor}  ${swatch}  ${r.pair.label}  [${known?.issue ?? '?'}]`
      )
    } else {
      console.log(`  ❌ FAIL       ${ratio} ${floor}  ${swatch}  ${r.pair.label}`)
    }
    if (r.pair.note) console.log(`               ↳ ${r.pair.note}`)
  }

  if (pending.length > 0) {
    console.log('\n⏳ Not yet defined — these go live when their tokens land:')
    for (const r of pending) {
      console.log(`  ·  ${r.pair.label}`)
      console.log(`     ${r.detail}`)
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

  console.log('\n' + '='.repeat(72))
  console.log('📊 Contrast Gate Summary')
  console.log('='.repeat(72))
  console.log(`Pairs measured:     ${live.length}`)
  console.log(`Passing:            ${live.filter(r => r.verdict === 'pass').length}`)
  console.log(`Failing:            ${failures.length}`)
  console.log(`Known failing:      ${knownFailures.length}${allowKnown ? ' (excused by --allow-known)' : ''}`)
  console.log(`Pending definition: ${pending.length}`)
  console.log(`Resolve errors:     ${run.errors.length}`)

  if (knownFailures.length > 0) {
    console.log('\n🟡 Known failures — shipped colour that does not clear AA:')
    for (const r of knownFailures) {
      const known = KNOWN_FAILURES.find(k => k.pairId === r.pair.id)
      console.log(`  - ${r.pair.label} — ${fmt(r.ratio as number)}:1 [${known?.issue ?? '?'}]`)
      if (known) console.log(`    ${known.why}`)
    }
  }

  if (failures.length > 0) {
    console.log('\n❌ Failures:')
    for (const r of failures) {
      console.log(
        `  - ${r.pair.label} — ${fmt(r.ratio as number)}:1, needs ${fmt(r.pair.floor)}:1`
      )
    }
  }

  if (stale.length > 0) {
    console.log('\n❌ Stale allowlist entries:')
    for (const s of stale) console.log(`  - ${s}`)
  }

  if (run.errors.length > 0) {
    console.log('\n❌ Resolve errors:')
    for (const e of run.errors) console.log(`  - ${e}`)
  }

  const hard = failures.length + stale.length + run.errors.length
  const total = hard + (allowKnown ? 0 : knownFailures.length)

  if (total === 0) {
    if (knownFailures.length > 0) {
      console.log('\n🟡 Gate green with known failures excused. They are still real.')
    } else {
      console.log('\n✅ Every declared pair clears its floor.')
    }
    return 0
  }

  console.log(`\n❌ Contrast gate failed: ${total} finding(s).`)
  if (!allowKnown && knownFailures.length > 0 && failures.length + stale.length === 0) {
    console.log(
      '   These are the known, owned failures. CI runs with --allow-known so\n' +
        '   the fix is not blocked by the gate that asked for it — see\n' +
        '   docs/decisions/gh250-contrast-gate-known-failures.md.'
    )
  }
  return run.errors.length > 0 || stale.length > 0 ? 2 : 1
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
 * Three things have to hold, and only the third is about this palette:
 *
 *  1. The maths matches published WCAG reference values, so a broken luminance
 *     formula is caught independently of any token.
 *  2. The resolver reproduces the baseline the issue records exactly. This
 *     locks hsl→rgb, var() following and 8-bit rounding together — any one of
 *     them drifting moves these numbers.
 *  3. Editing a token below its floor makes the gate report a failure. A gate
 *     that cannot fail is not a gate.
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

  // 2 — the baseline the issue records, resolved from the real token graph.
  const baseline: ReadonlyArray<{ id: string; hex: string; ratio: number }> = [
    { id: 'white-on-teal', hex: '#027A8D', ratio: 5.03 },
    { id: 'white-on-red', hex: '#D0495B', ratio: 4.39 },
    { id: 'white-on-amber', hex: '#EEAC49', ratio: 1.98 }
  ]
  const live = new ContrastGate(cssDir).run()
  for (const expected of baseline) {
    const actual = live.results.find(r => r.pair.id === expected.id)
    const okHex = actual?.bgHex === expected.hex
    const okRatio = actual?.ratio !== undefined && fmt(actual.ratio) === fmt(expected.ratio)
    assertions.push({
      name: `baseline: ${expected.id} resolves to ${expected.hex} at ${fmt(expected.ratio)}:1`,
      ok: okHex && okRatio,
      detail: `${actual?.bgHex ?? 'unresolved'} at ${actual?.ratio !== undefined ? fmt(actual.ratio) : '—'}:1`
    })
  }
  assertions.push({
    name: 'baseline: the strict run is non-zero today',
    ok:
      live.results.some(r => r.verdict === 'known-fail' || r.verdict === 'fail') &&
      live.errors.length === 0,
    detail: `${live.results.filter(r => r.verdict === 'known-fail' || r.verdict === 'fail').length} failing pair(s), ${live.errors.length} resolve error(s)`
  })

  // 3 — mutate a token below its floor and confirm the gate notices.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'check-contrast-selfcheck-'))
  try {
    fs.cpSync(path.join(cssDir, 'tokens'), path.join(tmp, 'tokens'), { recursive: true })
    const mutated = path.join(tmp, 'tokens', 'primitive-colors.css')
    const before = fs.readFileSync(mutated, 'utf-8')
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
      fs.writeFileSync(mutated, after, 'utf-8')
      const mutatedRun = new ContrastGate(tmp).run()
      const target = mutatedRun.results.find(r => r.pair.id === 'text-on-page')
      assertions.push({
        name: 'mutation: text-on-page fails once --hsl-black is lifted to 92% lightness',
        ok: target?.verdict === 'fail',
        detail: `verdict "${target?.verdict ?? 'missing'}" at ${target?.ratio !== undefined ? fmt(target.ratio) : '—'}:1`
      })
      assertions.push({
        name: 'mutation: the mutated palette is not excused by the allowlist',
        ok: mutatedRun.results.some(r => r.verdict === 'fail'),
        detail: 'a new failure is a hard failure, not a known one'
      })
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }

  for (const a of assertions) {
    console.log(`  ${a.ok ? '✅' : '❌'} ${a.name}`)
    console.log(`     ${a.detail}`)
  }

  const failed = assertions.filter(a => !a.ok)
  console.log('\n' + '='.repeat(72))
  console.log(`Self-check: ${assertions.length - failed.length}/${assertions.length} assertions passed`)
  console.log('='.repeat(72))

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

function main(): void {
  const args = process.argv.slice(2)
  const allowKnown = args.includes('--allow-known')
  const wantsSelfCheck = args.includes('--self-check')

  const dirFlag = args.indexOf('--tokens-dir')
  const cssDir =
    dirFlag !== -1 && args[dirFlag + 1] !== undefined
      ? path.resolve(args[dirFlag + 1] as string)
      : path.join(process.cwd(), 'src', 'public', 'css')

  if (wantsSelfCheck) {
    process.exit(selfCheck(cssDir))
  }

  console.log('🔍 Checking colour contrast against WCAG floors...\n')
  console.log(`   tokens: ${cssDir}`)
  console.log(`   mode:   ${allowKnown ? '--allow-known (CI)' : 'strict'}\n`)

  process.exit(report(new ContrastGate(cssDir).run(), allowKnown))
}

try {
  main()
} catch (error) {
  console.error('Fatal error:', error instanceof Error ? error.message : String(error))
  process.exit(2)
}
