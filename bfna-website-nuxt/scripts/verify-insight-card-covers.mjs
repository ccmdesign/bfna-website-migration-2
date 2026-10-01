/** Exercise cover precedence in an isolated fixture, without touching Nuxt or CMS. */
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const app = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const fixture = mkdtempSync(join(tmpdir(), 'bfna-insight-covers-'))
const mapPath = 'src/assets/content-overrides/insight-card-covers.json'
const snapshotPath = 'src/assets/wireframe-data/insights.json'
const read = path => JSON.parse(readFileSync(path, 'utf8'))
const write = (path, value) => writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`)
const output = () => Object.fromEntries(readdirSync(join(fixture, 'content/bf/insights')).map(name => [
  name, readFileSync(join(fixture, 'content/bf/insights', name), 'utf8')
]))
const run = () => spawnSync(process.execPath, [
  '--import', import.meta.resolve('tsx'), join(fixture, 'scripts/normalise-wireframe-data.ts')
], { encoding: 'utf8' })
const normalize = () => {
  const result = run()
  assert.equal(result.status, 0, result.stderr || result.stdout)
  return output()
}

try {
  mkdirSync(join(fixture, 'scripts'), { recursive: true })
  cpSync(join(app, 'scripts/normalise-wireframe-data.ts'), join(fixture, 'scripts/normalise-wireframe-data.ts'))
  cpSync(join(app, 'src/assets/wireframe-data'), join(fixture, 'src/assets/wireframe-data'), { recursive: true })
  cpSync(join(app, 'src/assets/content-overrides'), join(fixture, 'src/assets/content-overrides'), { recursive: true })
  const originalSnapshot = readFileSync(join(fixture, snapshotPath), 'utf8')
  const covers = read(join(app, mapPath))
  write(join(fixture, mapPath), {})
  const baseline = normalize()
  write(join(fixture, mapPath), covers)
  const linked = normalize()
  assert.deepEqual(Object.keys(linked), Object.keys(baseline))
  let count = 0
  for (const [name, json] of Object.entries(baseline)) {
    const before = JSON.parse(json)
    const after = JSON.parse(linked[name])
    const cover = covers[before.slug]
    const expected = cover?.source_image === before.image ? { ...before, card_cover: cover.card_cover } : before
    assert.deepEqual(after, expected, `${name}: only the reviewed cover may change`)
    if (cover?.source_image === before.image) count++
    assert.equal(readFileSync(join(app, 'content/bf/insights', name), 'utf8'), linked[name], `${name}: generated output stale`)
  }
  assert.deepEqual(normalize(), linked, 'normalization must be byte-idempotent')
  assert.equal(readFileSync(join(fixture, snapshotPath), 'utf8'), originalSnapshot, 'snapshots must remain read-only')

  const snapshot = JSON.parse(originalSnapshot)
  const slug = Object.keys(covers).find(slug => snapshot.items.some(item => item.slug === slug))
  assert.ok(slug, 'at least one real post has a cover')
  const target = snapshot.items.find(item => item.slug === slug)
  const originalImage = target.image
  target.image = 'https://example.com/revised-source-image.png'
  write(join(fixture, snapshotPath), snapshot)
  assert.equal(JSON.parse(normalize()[`${slug}.json`]).card_cover, undefined, 'changed source invalidates derivative')
  target.image = originalImage
  for (const upstream of ['https://example.com/editor-selected-cover.png', null]) {
    target.card_cover = upstream
    write(join(fixture, snapshotPath), snapshot)
    assert.equal(JSON.parse(normalize()[`${slug}.json`]).card_cover, upstream, 'explicit upstream cover wins, including null')
  }
  delete target.card_cover
  writeFileSync(join(fixture, snapshotPath), originalSnapshot)
  const valid = normalize()
  for (const invalid of [null, [], 12, { ...covers, [slug]: { source_image: originalImage, card_cover: '' } }]) {
    write(join(fixture, mapPath), invalid)
    const result = run()
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /insight-card-covers.json/)
    assert.deepEqual(output(), valid, 'invalid input cannot partially replace generated output')
  }
  write(join(fixture, mapPath), { ...covers, 'unknown-cover-target': covers[slug] })
  const result = run()
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /unknown insight slug unknown-cover-target/)
  assert.deepEqual(output(), valid)
  console.log(`Insight card cover verification passed: ${count} linked records; original images/content preserved; upstream precedence, source drift, invalid input and idempotence checked.`)
} finally {
  rmSync(fixture, { recursive: true, force: true })
}
