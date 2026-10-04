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

describe('useExternalImage - isExternalImage (BF-62: Directus host now treated as internal)', () => {
  it('treats the Directus asset host as internal (renders <NuxtImg> for blur fix)', () => {
    // BF-62: Directus URLs now use <NuxtImg> so @nuxt/image can apply
    // the BF-51 blur fix (quality: 90, responsive srcset)
    expect(isExternalImage('https://bfna.simplyas.com/assets/abc')).toBe(false)
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
