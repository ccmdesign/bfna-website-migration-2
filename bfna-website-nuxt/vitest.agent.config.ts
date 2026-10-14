import { defineConfig } from 'vitest/config'

/**
 * Pure tests that do not need the Nuxt Vitest environment.
 * `vitest.config.ts` merges Nuxt's Vite config, and that merge currently
 * crashes Vitest's Rolldown pipeline (`Missing field moduleType`) before any
 * test is collected. These tests import no Vue and no Nuxt.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/agent-readiness/**/*.test.ts'],
  },
})
