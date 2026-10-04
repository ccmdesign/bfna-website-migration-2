import { describe, expect, it } from 'vitest'
import { BFNA_CONTACT_EMAIL, BFNA_POSTAL_ADDRESS, organizationJsonLd } from '~/utils/json-ld'

describe('organizationJsonLd', () => {
  it('includes postal address and contact email from site facts', () => {
    const schema = organizationJsonLd('https://www.bfna.org') as {
      address: typeof BFNA_POSTAL_ADDRESS
      contactPoint: { email: string }
      logo: string
    }
    expect(schema.address.streetAddress).toBe(BFNA_POSTAL_ADDRESS.streetAddress)
    expect(schema.address.addressLocality).toBe('Washington')
    expect(schema.contactPoint.email).toBe(BFNA_CONTACT_EMAIL)
    expect(schema.logo).toMatch(/^https:\/\/www\.bfna\.org\//)
  })
})
