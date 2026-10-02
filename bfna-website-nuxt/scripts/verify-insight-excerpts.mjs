/**
 * Exercise the real normalizer in an isolated fixture. No CMS, Nuxt cache or live
 * source files are changed. Run: node scripts/verify-insight-excerpts.mjs
 */
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const fixture = mkdtempSync(join(tmpdir(), 'bfna-insight-excerpts-'))
const overridesPath = 'src/assets/content-overrides/insight-excerpts.json'
const snapshotsPath = 'src/assets/wireframe-data'
const overrides = JSON.parse(readFileSync(join(appRoot, overridesPath), 'utf8'))
const readJson = path => JSON.parse(readFileSync(path, 'utf8'))
const writeJson = (path, value) => writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`)

const tree = (root, dir = root) => Object.fromEntries(
  readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name)
    return entry.isDirectory()
      ? Object.entries(tree(root, path))
      : [[relative(root, path), readFileSync(path, 'utf8')]]
  })
)

const generated = root => ({
  ...tree(join(root, 'content/bf')),
  ...Object.fromEntries(['menus.json', 'footer-menus.json'].map(file => [
    file, readFileSync(join(root, 'src/assets/bf-data', file), 'utf8')
  ]))
})

const run = () => spawnSync(process.execPath, [
  '--import', import.meta.resolve('tsx'), join(fixture, 'scripts/normalise-wireframe-data.ts')
], { encoding: 'utf8' })

const normalize = () => {
  const result = run()
  assert.equal(result.status, 0, result.stderr || result.stdout)
  return generated(fixture)
}

try {
  mkdirSync(join(fixture, 'scripts'), { recursive: true })
  mkdirSync(join(fixture, 'src/assets/content-overrides'), { recursive: true })
  cpSync(join(appRoot, 'scripts/normalise-wireframe-data.ts'), join(fixture, 'scripts/normalise-wireframe-data.ts'))
  cpSync(join(appRoot, snapshotsPath), join(fixture, snapshotsPath), { recursive: true })
  cpSync(join(appRoot, 'src/assets/content-overrides/insight-card-covers.json'),
    join(fixture, 'src/assets/content-overrides/insight-card-covers.json'))
  cpSync(join(appRoot, 'src/assets/content-overrides/project-images.json'),
    join(fixture, 'src/assets/content-overrides/project-images.json'))
  const originalSnapshots = tree(join(fixture, snapshotsPath))

  writeJson(join(fixture, overridesPath), {})
  const baseline = normalize()
  writeJson(join(fixture, overridesPath), overrides)
  const filled = normalize()
  assert.deepEqual(Object.keys(filled).sort(), Object.keys(baseline).sort())

  let added = 0
  let revised = 0
  for (const [path, value] of Object.entries(baseline)) {
    if (!path.startsWith('insights/')) {
      assert.equal(filled[path], value, `${path}: unrelated output changed`)
      continue
    }
    const source = JSON.parse(value)
    const authored = overrides[source.slug]
    const expectedExcerpt = typeof authored === 'string'
      ? source.excerpt ?? authored
      : authored && source.excerpt === authored.original ? authored.text : source.excerpt
    assert.deepEqual(JSON.parse(filled[path]), { ...source, excerpt: expectedExcerpt }, path)
    if (!source.excerpt && expectedExcerpt) added++
    if (source.excerpt && source.excerpt !== expectedExcerpt) revised++
  }
  assert.deepEqual(tree(join(fixture, snapshotsPath)), originalSnapshots, 'snapshots must remain read-only')
  assert.deepEqual(normalize(), filled, 'normalization must be byte-idempotent')

  // Simulate a later source update: authored copy must never replace CMS copy.
  const snapshotFile = join(fixture, snapshotsPath, 'insights.json')
  const snapshot = readJson(snapshotFile)
  const targetSlug = Object.keys(overrides).find(slug => snapshot.items.some(item => item.slug === slug))
  assert.ok(targetSlug, 'at least one excerpt must target a snapshot item')
  snapshot.items.find(item => item.slug === targetSlug).excerpt = '<p>Future source excerpt wins.</p>'
  writeJson(snapshotFile, snapshot)
  const withSource = normalize()
  assert.equal(JSON.parse(withSource[`insights/${targetSlug}.json`]).excerpt, 'Future source excerpt wins.')

  // Revisions apply only to the reviewed wording, never to newer CMS copy.
  const revisedSlugs = Object.keys(overrides).filter(slug => typeof overrides[slug] === 'object')
  for (const slug of revisedSlugs) {
    snapshot.items.find(item => item.slug === slug).excerpt = '<p>Updated CMS summary.</p>'
  }
  writeJson(snapshotFile, snapshot)
  const withRevisions = normalize()
  for (const slug of revisedSlugs) {
    assert.equal(JSON.parse(withRevisions[`insights/${slug}.json`]).excerpt, 'Updated CMS summary.')
  }

  // Reject typos before deleting or partially replacing generated content.
  writeJson(join(fixture, overridesPath), { ...overrides, 'unknown-insight-for-validation': 'Unknown post.' })
  let result = run()
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /unknown insight slug unknown-insight-for-validation/)
  assert.deepEqual(generated(fixture), withRevisions)

  // Homepage highlights share the collection but are not Insight post targets.
  const highlightSlug = snapshot.featured.find(item => !snapshot.items.some(post => post.slug === item.slug))?.slug
  assert.ok(highlightSlug)
  writeJson(join(fixture, overridesPath), { ...overrides, [highlightSlug]: 'Not an Insight post.' })
  result = run()
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /unknown insight slug/)

  for (const invalid of ['', '   ', '<p>Markup is not excerpt text.</p>', 42,
    { original: 'Known copy', text: '' }, { original: '<p>HTML</p>', text: 'Plain copy' }]) {
    writeJson(join(fixture, overridesPath), { ...overrides, [targetSlug]: invalid })
    result = run()
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /must contain nonempty plain text/)
  }

  // The checked-in output must match the successful fixture from the real inputs.
  assert.deepEqual(generated(appRoot), filled, 'run npm run data:normalise to refresh output')
  console.log(`Insight excerpt verification passed: ${added} filled, ${revised} reviewed revisions; other source excerpts and unrelated output preserved; future CMS precedence, unknown slugs, highlights, invalid copy and idempotence checked.`)
} finally {
  rmSync(fixture, { recursive: true, force: true })
}
