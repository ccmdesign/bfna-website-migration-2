// TODO(owner): street address, postal code, and phone are not in v2 content.
// The contact band still renders the Directus placeholder, which is not an address.
// Bluesky in the footer is #bluesky-profile-url and is omitted from sameAs.
// Legal name on the production privacy page is "Bertelsmann Foundation (North America), Inc.";
// v2 copy does not use the Inc. form. Confirm before adding it.

import { useBfInsights } from '~/composables/data/useBfInsights'
import { useBfPages } from '~/composables/data/useBfPages'
import { useBfPrograms } from '~/composables/data/useBfPrograms'
import { useBfProjects } from '~/composables/data/useBfProjects'
import { PRIVACY_META_DESCRIPTION } from '~/constants/privacy-page'
import { lastmod } from '../../server/utils/agent-content-helpers'

const SITE_NAME = 'Bertelsmann Foundation North America'

const SAME_AS = [
  'https://www.linkedin.com/company/bertelsmann-foundation-north-america-inc.',
  'https://www.instagram.com/bertelsmannfoundation/',
  'https://www.facebook.com/BertelsmannFoundation/',
  'https://www.youtube.com/channel/UCZZdgI5F7KjUCW0fCKUOAAg',
  'https://vimeo.com/bfna'
]

function canonicalPath(path: string): string {
  if (!path || path === '/') return '/'
  const withoutQuery = path.split('?')[0] ?? path
  if (withoutQuery.length > 1 && withoutQuery.endsWith('/')) {
    return withoutQuery.slice(0, -1)
  }
  return withoutQuery
}

function firstParagraph(text: string | null | undefined): string {
  if (!text) return ''
  const parts = text.split(/\n\n+/).map(p => p.trim()).filter(Boolean)
  return parts[0] ?? text.trim()
}

function httpsImage(url: string | null | undefined): string | undefined {
  if (typeof url === 'string' && url.startsWith('https://')) return url
  return undefined
}

export default defineNuxtPlugin(async () => {
  const route = useRoute()
  const error = useError()
  const siteUrl = (import.meta.env.NUXT_PUBLIC_SITE_URL || 'https://www.bfna.org').replace(/\/$/, '')

  const path = canonicalPath(route.path)

  if (error.value) return
  if (path === '/docs' || path.startsWith('/docs/') || path.startsWith('/wireframes')) return

  const { homePage, pageBySlug } = await useBfPages()
  const { bySlug: insightBySlug } = await useBfInsights()
  const { programBySlug } = await useBfPrograms()
  const { projectBySlug } = await useBfProjects()

  let heading: string | undefined
  let description = ''
  let image: string | undefined

  if (path === '/') {
    const home = homePage()
    description = home?.excerpt ?? home?.description ?? ''
    image = httpsImage(home?.image ?? null)
  } else if (path === '/privacy') {
    heading = 'Privacy'
    description = PRIVACY_META_DESCRIPTION
  } else if (path === '/about' || path === '/archive' || path === '/insights' || path === '/projects') {
    const slug = path.slice(1)
    const page = pageBySlug(slug)
    heading = page?.heading ?? undefined
    description = page?.excerpt ?? firstParagraph(page?.description ?? '')
    image = httpsImage(page?.image ?? null)
  } else if (path.startsWith('/insights/')) {
    const slug = path.slice('/insights/'.length)
    const insight = insightBySlug(slug)
    heading = insight?.heading ?? undefined
    description = insight?.excerpt ?? firstParagraph(insight?.content ?? '')
    image = httpsImage(insight?.image ?? null)
  } else if (path.startsWith('/projects/')) {
    const slug = path.slice('/projects/'.length)
    const project = projectBySlug(slug)
    heading = project?.heading ?? undefined
    description = project?.excerpt ?? ''
    image = httpsImage(project?.image ?? null)
  } else {
    const slug = path.slice(1)
    const program = programBySlug(slug)
    heading = program?.name ?? undefined
    description = program?.tagline ?? ''
    image = httpsImage(program?.image ?? null)
  }

  const canonical = `${siteUrl}${path === '/' ? '/' : path}`
  const ogType = /^\/insights\/[^/]+$/.test(path) ? 'article' : 'website'
  const ogTitle = heading?.trim() ? heading : SITE_NAME
  const ogImage = image ?? `${siteUrl}/logo.svg`

  useSeoMeta({
    description,
    ogDescription: description,
    ogTitle,
    ogType,
    ogUrl: canonical,
    ogImage
  })

  useHead({
    link: [{ rel: 'canonical', href: canonical }]
  })

  const scripts: Array<{ type: 'application/ld+json', key: string, innerHTML: string }> = []

  if (path === '/') {
    const home = homePage()
    const orgGraph = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          name: SITE_NAME,
          url: siteUrl,
          logo: `${siteUrl}/logo.svg`,
          description: home?.excerpt ?? '',
          email: 'info@bfna.org',
          sameAs: SAME_AS,
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'Washington',
            addressRegion: 'DC',
            addressCountry: 'US'
          },
          contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'general inquiries',
            email: 'info@bfna.org'
          }
        },
        {
          '@type': 'WebSite',
          name: SITE_NAME,
          url: siteUrl
        }
      ]
    }
    scripts.push({
      type: 'application/ld+json',
      key: 'bf-jsonld-org',
      innerHTML: JSON.stringify(orgGraph)
    })
  }

  if (path.startsWith('/insights/')) {
    const slug = path.slice('/insights/'.length)
    const insight = insightBySlug(slug)
    if (insight?.heading) {
      const article: Record<string, unknown> = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: insight.heading,
        url: canonical,
        description
      }
      const published = lastmod(insight.publish_date)
      if (published) article.datePublished = published
      const authors = (insight.authors ?? []).filter(Boolean)
      if (authors.length > 0) {
        article.author = authors.map(name => ({ '@type': 'Person', name }))
      }
      const articleImage = httpsImage(insight.image ?? null)
      if (articleImage) article.image = articleImage
      scripts.push({
        type: 'application/ld+json',
        key: 'bf-jsonld-article',
        innerHTML: JSON.stringify(article)
      })
    }
  }

  if (scripts.length > 0) {
    useHead({ script: scripts })
  }
})
