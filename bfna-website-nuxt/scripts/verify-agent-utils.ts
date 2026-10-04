import assert from 'node:assert/strict'
import { prefersMarkdown } from '../src/utils/accept.ts'
import { organizationJsonLd } from '../src/utils/json-ld.ts'
import { isSitemapExcluded } from '../src/utils/agent-sitemap.ts'

assert.equal(prefersMarkdown('text/markdown'), true)
assert.equal(prefersMarkdown('text/markdown;q=0, text/html'), false)
assert.equal(isSitemapExcluded('/docs/foo'), true)

const org = organizationJsonLd('https://www.bfna.org') as { address: { addressLocality: string } }
assert.equal(org.address.addressLocality, 'Washington')

console.log('verify-agent-utils: ok')
