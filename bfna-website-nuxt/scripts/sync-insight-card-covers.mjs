/** Read Directus cover links into the supplemental map; never mutate the CMS. */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const app = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const base = 'https://bfna.simplyas.com'
const mapPath = join(app, 'src/assets/content-overrides/insight-card-covers.json')
const previous = JSON.parse(readFileSync(mapPath, 'utf8'))
const posts = readdirSync(join(app, 'content/bf/insights')).map(name =>
  JSON.parse(readFileSync(join(app, 'content/bf/insights', name), 'utf8'))
).filter(post => !post.retired_news && post.image && post.legacy)
if (!process.env.DIRECTUS_TOKEN) throw new Error('Inject DIRECTUS_TOKEN with 1Password op run; do not write a token into this script or an env file.')
if (process.argv.slice(2).some(arg => arg !== '--write')) throw new Error('Usage: node scripts/sync-insight-card-covers.mjs [--write]')

const collections = {}
for (const collection of ['products', 'infographics']) {
  const sourceField = collection === 'products' ? 'cover_image' : 'image'
  const query = new URLSearchParams({ fields: `id,${sourceField},card_cover`, limit: '-1' })
  const response = await fetch(`${base}/items/${collection}?${query}`, {
    headers: { Authorization: `Bearer ${process.env.DIRECTUS_TOKEN}` }
  })
  if (!response.ok) throw new Error(`Directus ${collection} read failed: HTTP ${response.status}`)
  const { data } = await response.json()
  if (!Array.isArray(data)) throw new Error(`Directus ${collection} returned invalid data`)
  collections[collection] = new Map(data.map(item => [String(item.id), item]))
}

const next = {}
const drift = []
for (const post of posts) {
  const { source, type, id } = post.legacy
  if (source !== 'directus') {
    // Contentful-only Authors shares reviewed artwork but has no Directus item.
    if (previous[post.slug]?.source_image === post.image) next[post.slug] = previous[post.slug]
    continue
  }
  if (!(type in collections)) continue
  const current = collections[type].get(String(id))
  if (!current) { drift.push(`${post.slug}: missing ${type}/${id}`); continue }
  const sourceId = current[type === 'products' ? 'cover_image' : 'image']
  if (post.image !== `${base}/assets/${sourceId}`) {
    drift.push(`${post.slug}: source image changed; review the migration snapshot first`)
    continue
  }
  if (current.card_cover) next[post.slug] = {
    source_image: post.image,
    card_cover: `${base}/assets/${current.card_cover}`
  }
}
const changes = [...new Set([...Object.keys(previous), ...Object.keys(next)])].filter(slug =>
  JSON.stringify(previous[slug]) !== JSON.stringify(next[slug])
)
console.log(JSON.stringify({ mode: process.argv.includes('--write') ? 'write' : 'preview', covers: Object.keys(next).length, changes, drift }, null, 2))
if (drift.length) throw new Error('Source identity drift prevents updating the map; review the reported records.')
if (process.argv.includes('--write')) {
  writeFileSync(mapPath, `${JSON.stringify(Object.fromEntries(Object.entries(next).sort(([a], [b]) => a.localeCompare(b))), null, 2)}\n`)
  console.log('Cover map updated. Stop the dev server before npm run data:normalise, then run node scripts/verify-insight-card-covers.mjs.')
}
