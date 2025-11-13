import { describe, it, expect } from 'vitest'
import { resolve } from 'node:path'
import config from '../../nuxt.config'

describe('nuxt configuration', () => {
  it('uses srcDir rooted at src/', () => {
    expect(config.srcDir).toBe(resolve(process.cwd(), 'src'))
  })
})
