import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineContentConfig, defineCollection } from '@nuxt/content'
import { z } from 'zod'

const rootDir = dirname(fileURLToPath(import.meta.url))
const contentDir = resolve(rootDir, 'content')

export default defineContentConfig({
  collections: {
    blog: defineCollection({
      type: 'page',
      source: {
        include: 'blog/*.md',
        cwd: contentDir
      },
      schema: z.object({
        published: z.boolean().default(true)
      })
    }),
    casestudies: defineCollection({
      type: 'page',
      source: {
        include: 'case-studies/*.md',
        cwd: contentDir
      },
      schema: z.object({
        published: z.boolean().default(true)
      })
    }),
    services: defineCollection({
      type: 'page',
      source: {
        include: 'services/*.md',
        cwd: contentDir
      },
      schema: z.object({
        // Adding a basic schema for services as well
        status: z.string().optional()
      })
    }),
    docs: defineCollection({
      type: 'page',
      source: {
        include: 'docs/**/*.md',
        // Component API docs are generated from src/components/ds/*.vue
        exclude: ['docs/components/**/*.md'],
        cwd: contentDir
      },
      schema: z.object({
        published: z.boolean().default(true),
        title: z.string().optional(),
        description: z.string().optional(),
        hero: z
          .object({
            brow: z.string().optional(),
            title: z.string().optional(),
            tagline: z.string().optional(),
            backgroundColor: z.string().optional(),
            size: z.string().optional(),
            hideTopbar: z.boolean().optional()
          })
          .optional(),
        order: z.number().optional(),
        tags: z.array(z.string()).optional(),
        status: z.enum(['To Do', 'Draft', 'MVP', 'Ready']).optional(),
        priority: z.enum(['High', 'Normal', 'Low']).optional(),
        category: z.string().optional(),
        hasComponent: z.boolean().default(false),
        hasDocs: z.boolean().default(false),
        hasDemo: z.boolean().default(false)
      })
    }),
    componentDocs: defineCollection({
      type: 'page',
      source: {
        include: 'docs/components/*.md',
        cwd: contentDir
      },
      schema: z.object({
        layout: z.string().optional(),
        title: z.string(),
        description: z.string().optional(),
        status: z.string().optional(),
        hero: z
          .object({
            brow: z.string().optional(),
            title: z.string().optional(),
            tagline: z.string().optional(),
            backgroundColor: z.string().optional(),
            size: z.string().optional(),
            hideTopbar: z.boolean().optional()
          })
          .optional(),
        promptId: z.string().optional(),
        promptVersion: z.string().optional(),
        promptRunId: z.string().optional(),
        lastPromptRun: z.string().optional(),
        componentId: z.string().optional(),
        componentVersion: z.string().optional(),
        demoComponent: z.string().optional(),
        demoPath: z.string().optional(),
        docsJson: z.string().optional(),
        legacySource: z.union([z.string(), z.array(z.string())]).optional(),
        dataHash: z.string().optional(),
        guidanceHtml: z.string().optional(),
        codeSources: z
          .array(
            z.object({
              label: z.string(),
              path: z.string()
            })
          )
          .optional()
      })
    }),
    workstreams: defineCollection({
      type: 'data',
      source: {
        include: 'workstreams/*.json',
        cwd: contentDir
      },
      schema: z.object({
        theme: z.string().optional(),
        heading: z.string(),
        excerpt: z.string(),
        image: z.string().optional(),
        team: z.array(z.any()).optional(),
        boardOfDirectors: z.array(z.any()).optional(),
        products: z.array(z.any()).optional(),
        superProducts: z.array(z.any()).optional(),
        slug: z.string().regex(/^[a-z0-9_-]+$/i), // URL-safe slug validation,
        combinedSlug: z.string().regex(/^[a-z0-9_-]+$/i), // URL-safe slug validation,
        button: z
          .object({
            url: z.string().optional(),
            label: z.string().optional()
          })
          .optional()
      })
    }),
    highlights: defineCollection({
      type: 'data',
      source: {
        include: 'highlights/*.json',
        cwd: contentDir
      },
      schema: z.object({
        highlightId: z.number().optional(),
        theme: z.string().optional(),
        heading: z.string(),
        excerpt: z.string(),
        image: z.string().optional(),
        slug: z.string().regex(/^[a-z0-9_-]+$/i), // URL-safe slug validation,
        url: z.string().optional(),
        buttonLabel: z.string().optional()
      })
    }),
    announcements: defineCollection({
      type: 'data',
      source: {
        include: 'announcements/*.json',
        cwd: contentDir
      },
      schema: z.object({
        theme: z.string().optional(),
        slug: z.string().regex(/^[a-z0-9_-]+$/i), // URL-safe slug validation,
        url: z.string().optional(),
        message: z.string(),
        heading: z.string(),
        excerpt: z.string().optional(),
        workstream: z
          .object({
            heading: z.string(),
            slug: z.string().regex(/^[a-z0-9_-]+$/i), // URL-safe slug validation,
            excerpt: z.string(),
            image: z.string().optional()
          })
          .optional()
      })
    }),
    publications: defineCollection({
      type: 'data',
      source: {
        include: 'publications/*.json',
        cwd: contentDir
      },
      schema: z.object({
        publicationId: z.number().optional(),
        byLine: z.string().optional(),
        theme: z.string().optional(),
        heading: z.string(),
        subheading: z.string().optional(),
        excerpt: z.string(),
        content: z.string().optional(),
        publishDate: z.string().optional(),
        date: z.string().optional(),
        image: z.string().optional(),
        slug: z.string().regex(/^[a-z0-9_-]+$/i), // URL-safe slug validation,
        url: z.string().optional(),
        buttonLabel: z.string().optional(),
        workstream: z.object({
          heading: z.string(),
          slug: z.string().regex(/^[a-z0-9_-]+$/i), // URL-safe slug validation,
          excerpt: z.string(),
          image: z.string().optional()
        }).optional(),
        downloadMedia: z.string().optional(),
        internalAuthors: z.array(
          z.object({
            name: z.string(),
            jobTitle: z.string().optional(),
            image: z.string().optional(),
            email: z.string().optional(),
            bio: z.string().optional(),
            linkedin: z.string().optional(),
            twitter: z.string().optional()
          })
        ).optional(),
        externalAuthors: z.array(z.any()).optional(),
        externalCollaborators: z.array(z.string()).optional(),
        originalPublication: z.string().optional(),
        originalPublicationName: z.string().optional(),
        originalPublicationUrl: z.string().optional(),
        originalPublicationDate: z.string().optional(),
        breadcrumbs: z.array(z.any()).optional()

      })
    }),
    videos: defineCollection({
      type: 'data',
      source: {
        include: 'videos/*.json',
        cwd: contentDir
      },
      schema: z.object({
        videoId: z.number().optional(),
        theme: z.string().optional(),
        heading: z.string(),
        excerpt: z.string(),
        content: z.string().optional(),
        subheading: z.string().optional(),
        slug: z.string().regex(/^[a-z0-9_-]+$/i), // URL-safe slug validation,
        videoUrl: z.string().optional(),
        button: z
          .object({
            url: z.string().optional(),
            label: z.string().optional()
          })
          .optional(),
        byLine: z.string().optional(),
        publishDate: z.string().optional(),
        date: z.string().optional(),
        workstream: z.object({
          heading: z.string(),
          slug: z.string().regex(/^[a-z0-9_-]+$/i), // URL-safe slug validation,
          excerpt: z.string(),
          image: z.string().optional()
        }).optional(),
        internalAuthors: z.array(
          z.object({
            name: z.string(),
            jobTitle: z.string().optional(),
            image: z.string().optional(),
            email: z.string().optional(),
            bio: z.string().optional(),
            linkedin: z.string().optional(),
            twitter: z.string().optional()
          })
        ).optional(),
        externalAuthors: z.array(z.any()).optional(),
        externalCollaborators: z.array(z.string()).optional(),
        author: z.string().optional(),
        video: z.object({
          thumbnail: z.string().optional()
        }).optional(),
        breadcrumbs: z.array(z.any()).optional()

      })
    }),
    infographics: defineCollection({
      type: 'data',
      source: {
        include: 'infographics/*.json',
        cwd: contentDir
      },
      schema: z.object({
        infographicId: z.number().optional(),
        theme: z.string().optional(),
        heading: z.string(),
        excerpt: z.string(),
        content: z.string().optional(),
        subheading: z.string().optional(),
        slug: z.string().regex(/^[a-z0-9_-]+$/i), // URL-safe slug validation,
        button: z
          .object({
            url: z.string().optional(),
            label: z.string().optional()
          })
          .optional(),
        byLine: z.string().optional(),
        publishDate: z.string().optional(),
        date: z.string().optional(),
        workstream: z.object({
          heading: z.string(),
          slug: z.string().regex(/^[a-z0-9_-]+$/i), // URL-safe slug validation,
          excerpt: z.string(),
          image: z.string().optional()
        }).optional(),
        internalAuthors: z.array(
          z.object({
            name: z.string(),
            jobTitle: z.string().optional(),
            image: z.string().optional(),
            email: z.string().optional(),
            bio: z.string().optional(),
            linkedin: z.string().optional(),
            twitter: z.string().optional()
          })
        ).optional(),
        externalAuthors: z.array(z.any()).optional(),
        externalCollaborators: z.array(z.string()).optional(),
        author: z.string().optional(),
        breadcrumbs: z.array(z.any()).optional()
      })
    }),
    products: defineCollection({
      type: 'data',
      source: {
        include: 'products/*.json',
        cwd: contentDir
      },
      schema: z.object({
        theme: z.string().optional(),
        isPodcast: z.boolean().default(false),
        isProduct: z.boolean().default(true),
        heading: z.string(),
        excerpt: z.string(),
        content: z.string().optional(),
        subheading: z.string().optional(),
        coverImage: z.string().optional(),
        image: z.object({
          url: z.string().optional()
        }).optional(),
        slug: z.string().regex(/^[a-z0-9_-]+$/i), // URL-safe slug validation,
        button: z
          .object({
            url: z.string().optional(),
            label: z.string().optional()
          })
          .optional(),
        byLine: z.string().optional(),
        publishDate: z.string().optional(),
        date: z.string().optional(),
        workstream: z.object({
          heading: z.string(),
          slug: z.string().regex(/^[a-z0-9_-]+$/i), // URL-safe slug validation,
          excerpt: z.string(),
          image: z.string().optional()
        }).optional(),
        internalAuthors: z.array(
          z.object({
            name: z.string(),
            jobTitle: z.string().optional(),
            image: z.string().optional(),
            email: z.string().optional(),
            bio: z.string().optional(),
            linkedin: z.string().optional(),
            twitter: z.string().optional()
          })
        ).optional(),
        externalAuthors: z.array(z.any()).optional(),
        externalCollaborators: z.array(z.string()).optional(),
        author: z.string().optional(),
        breadcrumbs: z.array(z.any()).optional()
      })
    }),
    docs: defineCollection({
      type: 'data',
      source: {
        include: 'docs/*.json',
        cwd: contentDir
      },
      schema: z.object({
        docId: z.number().optional(),
        heading: z.string(),
        order: z.number().optional(),
        workstream: z.string().optional(),
        theme: z.string().optional(),
        subheading: z.string().optional(),
        by: z.string().optional(),
        description: z.string().optional(),
        backgroundImage: z.string().optional(),
        slug: z.string().regex(/^[a-z0-9_-]+$/i), // URL-safe slug validation,
        button: z
          .object({
            url: z.string().optional(),
            label: z.string().optional()
          })
          .optional(),
        tags: z.array(z.string()).optional(),
        videoInfo: z.object({}).optional(),
        source: z.string().optional(),
        objectType: z.string().optional()
      })
    }),
    people: defineCollection({
      type: 'data',
      source: {
        include: 'people/*.json',
        cwd: contentDir
      },
      schema: z.object({
        personId: z.number().optional(),
        name: z.string(),
        jobTitle: z.string(),
        image: z.string().optional(),
        email: z.string().optional(),
        bio: z.string().optional(),
        linkedin: z.string().optional(),
        twitter: z.string().optional(),
        slug: z.string().regex(/^[a-z0-9_-]+$/i), // URL-safe slug validation,
      })
    }),
    super_products: defineCollection({
      type: 'data',
      source: {
        include: 'super_products/*.json',
        cwd: contentDir
      },
      schema: z.object({
        superProductId: z.number().optional(),
        isSuperProduct: z.boolean().default(true),
        heading: z.string(),
        subheading: z.string().optional(),
        description: z.string().optional(),
        excerpt: z.string(),
        videoUrl: z.string().optional(),
        websiteUrl: z.string().optional(),
        productSectionHeading: z.string().optional(),
        productSectionDescription: z.string().optional(),
        buttonLabel: z.string().optional(),
        button: z
          .object({
            url: z.string().optional(),
            label: z.string().optional()
          })
          .optional(),
        order: z.number().optional(),
        workstream: z.object({
          heading: z.string(),
          slug: z.string().regex(/^[a-z0-9_-]+$/i), // URL-safe slug validation,
        }),
        theme: z.string().optional(),
        subheading: z.string().optional(),
        by: z.string().optional(),
        description: z.string().optional(),
        coverImage: z.string().optional(),
        image: z.object({
          url: z.string().optional()
        }).optional(),
        report: z.string().optional(),
        slug: z.string().regex(/^[a-z0-9_-]+$/i), // URL-safe slug validation,
        products: z.array(z.any()).optional(),
        breadcrumbs: z.array(z.any()).optional()
      })
    }),
    products: defineCollection({
      type: 'data',
      source: {
        include: 'products/*.json',
        cwd: contentDir
      },
      schema: z.object({
        productId: z.number().optional(),
        heading: z.string(),
        publishDate: z.string().optional(),
        date: z.string().optional(),
        subheading: z.string().optional(),
        description: z.string().optional(),
        excerpt: z.string(),
        people: z.array(z.any()).optional(),
        videoUrl: z.string().optional(),
        websiteUrl: z.string().optional(),
        infographic: z.string().optional(),
        personSectionHeading: z.string().optional(),
        personSectionDescription: z.string().optional(),
        productSectionHeading: z.string().optional(),
        productSectionDescription: z.string().optional(),
        buttonLabel: z.string().optional(),
        order: z.number().optional(),
        type: z.string().optional(),
        workstream: z.object({
          heading: z.string(),
          slug: z.string().regex(/^[a-z0-9_-]+$/i), // URL-safe slug validation,
        }),
        theme: z.string().optional(),
        subheading: z.string().optional(),
        byLine: z.string().optional(),
        coverImage: z.string().optional(),
        image: z.object({
          url: z.string().optional()
        }).optional(),
        report: z.string().optional(),
        slug: z.string().regex(/^[a-z0-9_-]+$/i), // URL-safe slug validation,
        embedCode: z.string().optional(),
        breadcrumbs: z.array(z.any()).optional()
      })
    }),
  }
})
