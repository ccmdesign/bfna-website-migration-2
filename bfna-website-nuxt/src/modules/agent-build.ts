import { execSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineNuxtModule } from '@nuxt/kit'

const moduleDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(moduleDir, '../..')

export default defineNuxtModule({
  meta: { name: 'bfna-agent-build' },
  setup(_options, nuxt) {
    nuxt.hooks.hook('build:before', () => {
      execSync('npx tsx scripts/write-netlify-headers.ts', {
        cwd: projectRoot,
        stdio: 'inherit'
      })
    })

    nuxt.hooks.hook('close', () => {
      execSync('npx tsx scripts/generate-agent-assets.ts', {
        cwd: projectRoot,
        stdio: 'inherit'
      })
      execSync('npx tsx scripts/patch-404-html.ts', {
        cwd: projectRoot,
        stdio: 'inherit'
      })
    })
  }
})
