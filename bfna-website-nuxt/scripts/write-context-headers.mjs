import { rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const headersFile = resolve(process.cwd(), 'public/_headers')
if (process.env.CONTEXT && process.env.CONTEXT !== 'production') {
  writeFileSync(headersFile, '/*\n  X-Robots-Tag: noindex, nofollow\n', 'utf8')
  console.log(`wrote non-production noindex headers for ${process.env.CONTEXT}`)
} else {
  rmSync(headersFile, { force: true })
}
