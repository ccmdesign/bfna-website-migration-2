// https://nuxt.com/docs/api/configuration/nuxt-config
import { readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineNuxtConfig } from 'nuxt/config'

const currentDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(currentDir, '..')

const dsRootDir = resolve(currentDir, 'components/ds')

let dsComponentDirs: string[] = []

try {
  const dsEntries = readdirSync(dsRootDir, { withFileTypes: true })
  const hasRootComponents = dsEntries.some(entry => entry.isFile() && entry.name.endsWith('.vue'))
  const subdirPaths = dsEntries
    .filter(entry => entry.isDirectory())
    .map(entry => resolve(dsRootDir, entry.name))

  dsComponentDirs = [
    ...(hasRootComponents ? [dsRootDir] : []),
    ...subdirPaths
  ]
} catch {
  dsComponentDirs = [dsRootDir]
}

export default defineNuxtConfig({
  rootDir: projectRoot,
  srcDir: currentDir,
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: [
    '@nuxt/content',
    '@nuxt/eslint',
    '@vueuse/nuxt',
    '@nuxt/image'
  ],
  runtimeConfig: {
    public: {
    }
  },
  app: {
    head: {
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1" },],
      link: [
        // google icons
        { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" },
      ],
      script: [],
    }
  },
  css: [
    // New Nuxt CSS - COMMENTED OUT for Phase 3 to use legacy CSS only
    // '~/public/css/styles.css',
    // Legacy CSS loaded via layout instead of here to ensure proper loading order
    // '~/public/css-legacy/global.css',
    // '~/public/css-legacy/fixes.css',
    // '~/public/css-legacy/v2updates.css'
  ],
  postcss: {
    plugins: {
      'postcss-import': {},
      'postcss-preset-env': {
        stage: 1,
        features: {
          'nesting-rules': true
        }
      }
    }
  },
  build: {
    transpile: ['vue-carousel'],
  },
  vite: {
  },
  plugins: [

  ],
  ssr: true,
  experimental: {
    clientFallback: true
  },
  components: [
    ...dsComponentDirs.map(path => ({
      path,
      pathPrefix: false,
      prefix: 'ccm'
    })),
    {
      path: resolve(currentDir, 'components/content'),
      pathPrefix: false
    },
    {
      path: resolve(currentDir, 'components/docs'),
      pathPrefix: false
    },
    {
      path: resolve(currentDir, 'components/templates'),
      pathPrefix: false
    },
    {
      path: resolve(currentDir, 'components/legacy'),
      pathPrefix: false
    }
  ],
  routeRules: {
    '/democracy': { redirect: '/workstreams/democracy' },
    '/politics-society': { redirect: '/workstreams/politics-society' },
    '/future-leadership': { redirect: '/workstreams/future-leadership' },
    '/digital-world': { redirect: '/workstreams/digital-world' },
  },
})
