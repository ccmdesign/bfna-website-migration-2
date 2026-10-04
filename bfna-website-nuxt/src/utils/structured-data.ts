import { absoluteAssetUrl, canonicalUrl } from './site-url'

export const BFNA_NAME = 'Bertelsmann Foundation North America'

export const organizationJsonLd = (origin: string) => ({
  '@context': 'https://schema.org', '@type': 'Organization',
  '@id': `${canonicalUrl(origin, '/')}#organization`, name: BFNA_NAME,
  url: canonicalUrl(origin, '/'),
  description: 'The Bertelsmann Foundation North America is an independent, nonpartisan think tank dedicated to strengthening the transatlantic partnership and advancing dialogue on the global challenges shaping our future.',
  logo: absoluteAssetUrl(origin, '/images/bfna-og.jpg'), email: 'info@bfna.org', telephone: '+1-202-384-1980',
  address: { '@type': 'PostalAddress', streetAddress: '1108 16th St, NW', addressLocality: 'Washington', addressRegion: 'DC', postalCode: '20036', addressCountry: 'US' },
  sameAs: ['https://www.linkedin.com/company/bertelsmann-foundation-north-america-inc.', 'https://www.instagram.com/bertelsmannfoundation/', 'https://www.facebook.com/BertelsmannFoundation/', 'https://www.youtube.com/channel/UCZZdgI5F7KjUCW0fCKUOAAg', 'https://vimeo.com/bfna'],
  contactPoint: { '@type': 'ContactPoint', contactType: 'general inquiries', email: 'info@bfna.org', telephone: '+1-202-384-1980' },
})

export const websiteJsonLd = (origin: string) => ({
  '@context': 'https://schema.org', '@type': 'WebSite', '@id': `${canonicalUrl(origin, '/')}#website`,
  url: canonicalUrl(origin, '/'), name: BFNA_NAME, publisher: { '@id': `${canonicalUrl(origin, '/')}#organization` }, inLanguage: 'en-US',
})

interface ArticleInput { path: string; headline: string; description: string; image?: string; publishDate?: string; authors?: string[] }

export const articleJsonLd = (origin: string, input: ArticleInput) => ({
  '@context': 'https://schema.org', '@type': 'Article', headline: input.headline, description: input.description,
  image: absoluteAssetUrl(origin, input.image), ...(input.publishDate ? { datePublished: input.publishDate } : {}),
  ...(input.authors?.length ? { author: input.authors.map(name => ({ '@type': 'Person', name })) } : {}),
  publisher: { '@id': `${canonicalUrl(origin, '/')}#organization` }, mainEntityOfPage: canonicalUrl(origin, input.path), inLanguage: 'en-US',
})
