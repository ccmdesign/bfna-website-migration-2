import { absoluteUrl, siteUrlFromEnv } from '~/utils/site-url'

/** Postal address shown on /about (contact section on deployed preview). */
export const BFNA_POSTAL_ADDRESS = {
  streetAddress: '1108 16th Street NW, Floor 1',
  addressLocality: 'Washington',
  addressRegion: 'DC',
  postalCode: '20036',
  addressCountry: 'US'
} as const

export const BFNA_CONTACT_EMAIL = 'info@bfna.org'

/** Social profile URLs from `bfFooter` (exclude placeholder Bluesky). */
export const BFNA_SAME_AS: string[] = [
  'https://www.linkedin.com/company/bertelsmann-foundation-north-america-inc.',
  'https://www.instagram.com/bertelsmannfoundation/',
  'https://www.facebook.com/BertelsmannFoundation/',
  'https://www.youtube.com/channel/UCZZdgI5F7KjUCW0fCKUOAAg',
  'https://vimeo.com/bertelsmannfoundation'
]

const SITE_NAME = 'Bertelsmann Foundation North America'

const DEFAULT_DESCRIPTION =
  'Independent, nonpartisan think tank strengthening the transatlantic partnership through research, policy dialogue, and multimedia storytelling.'

export function organizationJsonLd(origin = siteUrlFromEnv()) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: origin,
    logo: absoluteUrl('/images/hero/homepage.jpg', origin),
    description: DEFAULT_DESCRIPTION,
    sameAs: BFNA_SAME_AS,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: BFNA_CONTACT_EMAIL,
      areaServed: 'US',
      availableLanguage: ['English']
    },
    address: {
      '@type': 'PostalAddress',
      ...BFNA_POSTAL_ADDRESS
    }
  }
}

export function webSiteJsonLd(origin = siteUrlFromEnv()) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: origin,
    description: DEFAULT_DESCRIPTION,
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: origin
    }
  }
}

export function articleJsonLd(input: {
  headline: string
  description?: string | null
  url: string
  datePublished?: string | null
  authorNames?: string[]
  image?: string | null
}, origin = siteUrlFromEnv()) {
  const authors =
    input.authorNames && input.authorNames.length > 0
      ? input.authorNames.map(name => ({ '@type': 'Person', name }))
      : [{ '@type': 'Organization', name: SITE_NAME }]

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.headline,
    description: input.description || undefined,
    url: absoluteUrl(input.url, origin),
    datePublished: input.datePublished || undefined,
    author: authors,
    image: input.image ? absoluteUrl(input.image, origin) : absoluteUrl('/images/hero/homepage.jpg', origin),
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl('/images/hero/homepage.jpg', origin)
      }
    }
  }
}
