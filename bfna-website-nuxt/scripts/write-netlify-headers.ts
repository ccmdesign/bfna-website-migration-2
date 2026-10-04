import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const outPath = resolve(projectRoot, 'public', '_headers')

const context = (process.env.CONTEXT || process.env.NETLIFY_CONTEXT || '').toLowerCase()
const isProduction = context === 'production'

if (isProduction) {
  writeFileSync(outPath, '')
  console.log('write-netlify-headers: production — no noindex _headers')
} else {
  const contents = `/*
  X-Robots-Tag: noindex, nofollow
`
  writeFileSync(outPath, contents)
  console.log(`write-netlify-headers: wrote noindex _headers for context="${context || 'local'}"`)
}
