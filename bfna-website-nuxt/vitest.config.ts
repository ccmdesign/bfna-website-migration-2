import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    dir: 'src/tests',
    globals: true,
    environmentOptions: {
      nuxt: {
        // jsdom is already a dependency; the nuxt environment defaults to happy-dom
        domEnvironment: 'jsdom'
      }
    }
  },
  nuxt: {
    rootDir: './src'
  }
})
