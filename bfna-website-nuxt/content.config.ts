import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineContentConfig, defineCollection } from '@nuxt/content'
import { z } from 'zod'

const rootDir = dirname(fileURLToPath(import.meta.url))
const contentDir = resolve(rootDir, 'src/content')

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
        heading: z.string(),
        description: z.string(),
        theme: z.string(),
        slug: z.string().regex(/^[a-z0-9_-]+$/i), // URL-safe slug validation
        button: z
          .object({
            url: z.string(),
            label: z.string()
          })
          .optional(),
        image: z
          .object({
            url: z.string(),
            title: z.string().optional()
          })
          .optional(),
        hero: z
          .object({
            webp: z.string().optional(),
            fallback: z.string().optional(),
            width: z.number().int().positive(),
            height: z.number().int().positive(),
            theme: z.string().optional()
          })
          .optional(),
        products_list: z.array(z.any()).optional(),
        updates_list: z.array(z.any()).optional(),
        navigation_order: z.number().int().optional(),
        visible: z.boolean().optional()
      })
    })
  }
})
