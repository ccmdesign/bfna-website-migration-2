#!/usr/bin/env node
/**
 * Typecheck gate — gh#236.
 *
 * The tree has a large pre-existing typecheck debt (90 diagnostics at the commit
 * that added this file), all of it outside `bf-*` scope, and site-epic #83 owns
 * paying it down. So the gate cannot assert `exit 0`; it asserts **no new
 * errors** against a committed baseline.
 *
 * The baseline is a *set of signatures*, not a single integer. An integer goes
 * green when one error is fixed and a different one is introduced in the same
 * commit, which is exactly the regression this gate exists to catch. A signature
 * is `<file>\t<TS-code>\t<count>`: the line and column are deliberately dropped,
 * because every edit above an existing error would otherwise churn the baseline
 * and teach people to regenerate it without reading it.
 *
 * Fails when a `(file, code)` pair is absent from the baseline, or occurs more
 * times than the baseline allows — and prints the offending diagnostics verbatim
 * so the failure names the new errors. Occurring *fewer* times passes, with a
 * note to refresh the file; a gate that fails on somebody having fixed something
 * is a gate people learn to skip.
 *
 *   node .github/typecheck-gate.mjs           # check against the baseline
 *   node .github/typecheck-gate.mjs --write   # regenerate the baseline
 *
 * `npm run typecheck` is `nuxt typecheck && npm run typecheck:scripts`. The `&&`
 * means the second half never runs while the first half exits non-zero, so this
 * script runs both halves itself and merges their diagnostics.
 */

import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const appRoot = join(repoRoot, 'bfna-website-nuxt')
const baselineFile = join(repoRoot, '.github', 'typecheck-baseline.txt')
const write = process.argv.includes('--write')

/* ------------------------------------------------------------------ *
 * Run both halves
 * ------------------------------------------------------------------ */
const passes = [
  { name: 'nuxt typecheck', argv: ['nuxt', 'typecheck'], bin: 'npx' },
  { name: 'typecheck:scripts', argv: ['run', 'typecheck:scripts'], bin: 'npm' }
]

let output = ''
/** @type {{ name: string, status: number, text: string }[]} */
const results = []
for (const pass of passes) {
  console.log(`\n── ${pass.name} ─────────────────────────────`)
  const run = spawnSync(pass.bin, pass.argv, {
    cwd: appRoot,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' }
  })
  if (run.error) {
    console.error(`could not run \`${pass.bin} ${pass.argv.join(' ')}\`: ${run.error.message}`)
    process.exit(1)
  }
  const text = `${run.stdout ?? ''}${run.stderr ?? ''}`
  process.stdout.write(text)
  output += `${text}\n`
  results.push({ name: pass.name, status: run.status ?? 1, text })
}

/* ------------------------------------------------------------------ *
 * Parse
 * ------------------------------------------------------------------ */
/**
 * `src/foo.vue(12,3): error TS2339: …` — the normal shape.
 * `error TS2688: …` — a project-level diagnostic with no file, filed under
 * the pseudo-file `<project>` so it still carries a signature.
 */
const WITH_FILE = /^(\S.*?)\((\d+),(\d+)\):\s+error\s+(TS\d+):/
const NO_FILE = /^\s*error\s+(TS\d+):/

/** @type {{ file: string, code: string, line: string }[]} */
const diagnostics = []
for (const raw of output.split('\n')) {
  const line = raw.replace(/\r$/, '')
  const withFile = WITH_FILE.exec(line)
  if (withFile) {
    diagnostics.push({ file: withFile[1], code: withFile[4], line })
    continue
  }
  const noFile = NO_FILE.exec(line)
  if (noFile) diagnostics.push({ file: '<project>', code: noFile[1], line })
}

/** @type {Map<string, { count: number, lines: string[] }>} */
const observed = new Map()
for (const d of diagnostics) {
  const key = `${d.file}\t${d.code}`
  const hit = observed.get(key) ?? { count: 0, lines: [] }
  hit.count += 1
  hit.lines.push(d.line)
  observed.set(key, hit)
}

const total = diagnostics.length

/*
 * A compiler that dies without emitting diagnostics — OOM, a missing binary, a
 * broken vue-tsc plugin — would otherwise sail through: nothing is observed, so
 * nothing exceeds the baseline, so the gate goes green on a typecheck that never
 * happened. A non-zero exit with no parseable diagnostic is a crash, not a pass.
 */
for (const r of results) {
  const parsed = diagnostics.filter(d => r.text.includes(d.line)).length
  if (r.status !== 0 && parsed === 0) {
    console.error(
      `\nFAIL — \`${r.name}\` exited ${r.status} without emitting a single parseable`
      + ' diagnostic. That is a crashed typecheck, not a clean one. See its output above.'
    )
    process.exit(1)
  }
}
const serialise = () =>
  [...observed.keys()]
    .sort()
    .map(k => `${k}\t${observed.get(k).count}`)
    .join('\n')

console.log(`\n── gate ─────────────────────────────────────`)
console.log(`observed ${total} diagnostic(s) across ${observed.size} (file, code) signature(s)`)
console.log('\nobserved signatures:')
console.log(serialise().split('\n').map(l => `  ${l}`).join('\n'))

/* ------------------------------------------------------------------ *
 * Write mode
 * ------------------------------------------------------------------ */
if (write) {
  const header = [
    '# Typecheck baseline — gh#236. Regenerate with `node .github/typecheck-gate.mjs --write`.',
    '#',
    '# One row per <file><TAB><TS-code><TAB><count>, from `nuxt typecheck` and',
    '# `npm run typecheck:scripts` merged. This is a debt ledger, not a target:',
    '# site-epic #83 pays it down, and every row it removes should be removed',
    '# here too. Rows are never to be ADDED to make a red run green — a new row',
    '# is a new type error, which is the thing the gate exists to stop.',
    `#`,
    `# total at time of writing: ${total}`,
    ''
  ].join('\n')
  writeFileSync(baselineFile, `${header}${serialise()}\n`)
  console.log(`\nwrote ${baselineFile} (${observed.size} signatures, ${total} diagnostics)`)
  process.exit(0)
}

/* ------------------------------------------------------------------ *
 * Compare
 * ------------------------------------------------------------------ */
if (!existsSync(baselineFile)) {
  console.error(`\nFAIL — no baseline at ${baselineFile}. Generate it with \`node .github/typecheck-gate.mjs --write\`.`)
  process.exit(1)
}

/** @type {Map<string, number>} */
const baseline = new Map()
let baselineTotal = 0
for (const raw of readFileSync(baselineFile, 'utf8').split('\n')) {
  const line = raw.trim()
  if (line === '' || line.startsWith('#')) continue
  const parts = raw.split('\t')
  if (parts.length < 3) continue
  const count = Number(parts[2].trim())
  if (!Number.isFinite(count)) continue
  baseline.set(`${parts[0]}\t${parts[1]}`, count)
  baselineTotal += count
}

const newErrors = []
for (const [key, hit] of observed) {
  const allowed = baseline.get(key) ?? 0
  if (hit.count > allowed) newErrors.push({ key, allowed, ...hit })
}

const fixed = []
for (const [key, allowed] of baseline) {
  const seen = observed.get(key)?.count ?? 0
  if (seen < allowed) fixed.push({ key, allowed, seen })
}

console.log(`baseline ${baselineTotal} diagnostic(s) across ${baseline.size} signature(s)`)

if (fixed.length > 0) {
  console.log(`\n${fixed.length} baseline signature(s) now report fewer errors — not a failure:`)
  for (const f of fixed) {
    const [file, code] = f.key.split('\t')
    console.log(`  ${file}  ${code}  ${f.allowed} → ${f.seen}`)
  }
  console.log('  Refresh with `node .github/typecheck-gate.mjs --write` so the ledger keeps shrinking.')
}

if (newErrors.length === 0) {
  console.log(`\nPASS — no new type errors. ${total} pre-existing diagnostic(s) remain (site-epic #83).`)
  process.exit(0)
}

console.error(`\nFAIL — ${newErrors.length} (file, code) signature(s) exceed the baseline. These errors are NEW:\n`)
for (const n of newErrors) {
  const [file, code] = n.key.split('\t')
  console.error(`  ${file}  ${code}  — baseline allows ${n.allowed}, saw ${n.count}:`)
  for (const l of n.lines.slice(0, n.count - n.allowed || 1)) console.error(`      ${l}`)
  console.error('')
}
console.error('Fix them. Do NOT add rows to .github/typecheck-baseline.txt to make this pass —')
console.error('the baseline is the pre-existing debt site-epic #83 owns, and it only shrinks.')
process.exit(1)
