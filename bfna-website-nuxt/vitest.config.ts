import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    dir: 'src/tests',
    globals: true
  },
  nuxt: {
    rootDir: './src'
  }
})
