import { describe, it, expect } from 'vitest'
import { useExternalImage } from '../../composables/useExternalImage'

const { isExternalImage, isPng } = useExternalImage()

describe('useExternalImage - isPng (BF-60 PNG passthrough)', () => {
  it('returns true for a plain .png URL', () => {
    expect(isPng('https://bfna.simplyas.com/assets/abc.png')).toBe(true)
  })

  it('is case-insensitive (.PNG)', () => {
    expect(isPng('https://bfna.simplyas.com/assets/abc.PNG')).toBe(true)
  })

  it('tolerates a query string after the extension', () => {
    expect(isPng('https://bfna.simplyas.com/assets/abc.png?width=800')).toBe(true)
  })

  it('tolerates a fragment after the extension', () => {
    expect(isPng('https://bfna.simplyas.com/assets/abc.png#frag')).toBe(true)
  })

  it('returns false for a .jpg URL (still gets webp)', () => {
    expect(isPng('https://bfna.simplyas.com/assets/abc.jpg')).toBe(false)
  })

  it('returns false for a param-less raw Directus asset URL (no extension)', () => {
    expect(isPng('https://bfna.simplyas.com/assets/0a1b2c3d-uuid')).toBe(false)
  })

  it('returns false for undefined / empty', () => {
    expect(isPng(undefined)).toBe(false)
    expect(isPng('')).toBe(false)
  })

  it('does not match "png" appearing mid-path (not the extension)', () => {
    expect(isPng('https://bfna.simplyas.com/png-assets/abc.jpg')).toBe(false)
  })
})

describe('useExternalImage - isExternalImage (Q2: Directus host is treated external)', () => {
  it('treats the Directus asset host as external (renders plain <img>, not <NuxtImg>)', () => {
    // This is load-bearing for BF-60 Q2: product Directus URLs take the
    // raw <img> fallback branch, so @nuxt/image never processes them.
    expect(isExternalImage('https://bfna.simplyas.com/assets/abc')).toBe(true)
  })

  it('treats the site netlify host as internal', () => {
    expect(isExternalImage('https://bfna-site-v2.netlify.app/img/x.jpg')).toBe(false)
  })

  it('treats relative URLs as internal', () => {
    expect(isExternalImage('/img/x.jpg')).toBe(false)
  })

  it('returns false for empty input', () => {
    expect(isExternalImage(undefined)).toBe(false)
  })
})
