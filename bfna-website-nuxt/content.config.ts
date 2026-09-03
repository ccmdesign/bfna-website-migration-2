import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineContentConfig, defineCollection } from '@nuxt/content'
import { z } from 'zod'

const rootDir = dirname(fileURLToPath(import.meta.url))
const contentDir = resolve(rootDir, 'content')

/*
 * ---------------------------------------------------------------------------
 * `bf*` entity schemas (design-system epic, issue 09 / gh#18)
 * ---------------------------------------------------------------------------
 * The six schemas below are the entity contracts for every `bf-*` component,
 * composable and page. They are exported so `src/types/bf-contracts.ts` can
 * re-export the `z.infer` types from a single place — components import the
 * types from `~/types/bf-contracts`, never from here.
 *
 * They describe exactly what `scripts/normalise-wireframe-data.ts` writes into
 * `content/bf/**` (its `InsightDoc` / `ProjectDoc` / `ProgramDoc` /
 * `PersonDoc` / `PageDoc` / `AnnouncementDoc` interfaces), not the draft field
 * list in the spec: `.nullable()` marks a field the normaliser emits as
 * `T | null`, `.optional()` marks one it may omit entirely.
 *
 * NO BOOLEAN IS NULLABLE (gh#140, promoted residual #139). `@nuxt/content`
 * stores a nullable boolean column in a shape its own `.where(f, '=', true)`
 * predicate does not match, so a `z.boolean().nullable()` flag makes that
 * query return zero rows with no error — which is how
 * `.where('external_only', '=', true)` missed the Transponder row it plainly
 * carried. Every boolean below is therefore a bare `z.boolean()`, and the
 * normaliser's `boolFlag()` guarantees a real `true`/`false` for each one;
 * `npx tsx scripts/normalise-wireframe-data.ts --check` asserts it on the
 * emitted files. Adding a flag here means adding it to that script's
 * `BOOLEAN_FIELDS` table too.
 *
 * The 14 collections above are untouched — these six are appended.
 */

/**
 * A page's provenance pointer into the legacy Directus records. Emitted as an
 * object (not the string the spec drafted) — see issue 08's Decisions; only
 * `source` is ever populated in the current snapshot.
 */
export const bfPageLegacySchema = z.object({
  source: z.string().nullable(),
  type: z.string().nullable(),
  workstream: z.string().nullable(),
  id: z.number().nullable()
})

/**
 * The same provenance pointer for an **insight** or a **project** (gh#151 /
 * BF-218 F2). Deliberately a second schema rather than a widened
 * `bfPageLegacySchema` (D-151.3): the two are one idea over different value
 * domains, and reshaping the page schema would change `bfPages`'s contract for
 * no consumer.
 *
 * Two differences from the page shape, both forced by the snapshot:
 *
 *  - `product_type` exists on insight and project rows and on no page row;
 *  - `id` is a `string` for the contentful-sourced rows
 *    (`3iyspbN51C1BpqS1H9RuxJ`) and a `number` for the directus-sourced ones,
 *    so it is a union here where `bfPages` — whose every row carries `null` —
 *    can stay a `number`.
 *
 * Nullable as a whole: `bfna-documentaries` is the one project with no legacy
 * record at all (D-151.4). Every insight carries one.
 */
export const bfEntityLegacySchema = z.object({
  source: z.string().nullable(),
  type: z.string().nullable(),
  workstream: z.string().nullable(),
  product_type: z.string().nullable(),
  id: z.union([z.string(), z.number()]).nullable()
})

/**
 * A former slug of a project, kept so issue #57 can build the cutover redirect
 * map. Seven projects carry exactly one each — a renamed Directus record whose
 * old URL still has to resolve.
 */
export const bfProjectAkaSchema = z.object({
  slug: z.string(),
  heading: z.string().nullable(),
  legacy: bfEntityLegacySchema.nullable()
})

/**
 * One insight. 371 documents: the 354 `items` rows plus the 8 `featured` and
 * 9 `retired_news` highlight records, which are separate Directus rows with no
 * slug overlap and are flattened onto boolean fields here (issue 07 Decisions).
 * `featured` / `retired_news` are computed by the normaliser; `archived` /
 * `evergreen` pass through from the source, where 20 rows carry neither value —
 * `boolFlag()` resolves those to `false` (gh#140), since `archived: null` and
 * `archived: false` mean the same thing to every consumer. None is nullable.
 */
export const bfInsightSchema = z.object({
  slug: z.string(),
  heading: z.string().nullable(),
  subheading: z.string().nullable(),
  excerpt: z.string().nullable(),
  content: z.string().nullable(),
  image: z.string().nullable(),
  video_url: z.string().nullable(),
  download: z.string().nullable(),
  external_url: z.string().nullable(),
  publish_date: z.string().nullable(),
  format: z.string().nullable(),
  program: z.string().nullable(),
  authors: z.array(z.string()),
  projects: z.array(z.string()),
  archived: z.boolean(),
  evergreen: z.boolean(),
  featured: z.boolean(),
  retired_news: z.boolean(),
  // gh#151 / BF-218. `legacy` is the old-URL provenance issue #57's redirect
  // map has no other source for; it is present on all 371 rows but stays
  // `.nullable()` so a future snapshot row without one is a null, not a build
  // break. `duplicate_of` and `slug_note` are the migration signals the
  // original issue-09 field list dropped: `duplicate_of` appears on exactly the
  // two documents whose slug this normaliser had to disambiguate and holds the
  // un-suffixed slug they collided with (D-151.1); `slug_note` is free text the
  // snapshot carries on two already-suffixed rows. Both `.optional()` — the
  // other 369 documents omit the key entirely rather than storing a null.
  legacy: bfEntityLegacySchema.nullable(),
  duplicate_of: z.string().optional(),
  slug_note: z.string().optional()
})

/**
 * One project. `featured` / `nav` / `grid_eligible` / `grid_order` are derived
 * by the normaliser from the wireframe composable's own predicates. `archived`
 * / `exclude_from_grid` / `external_only` come from the source, where most rows
 * simply omit them; `boolFlag()` resolves those to `false` (gh#140) so that
 * `.where('external_only', '=', true)` finds the one product row that has it.
 * `pending` is present on only two documents, hence `.optional()`.
 */
export const bfProjectSchema = z.object({
  slug: z.string(),
  heading: z.string(),
  excerpt: z.string().nullable(),
  description: z.string().nullable(),
  kind: z.string().nullable(),
  program: z.string().nullable(),
  external_url: z.string().nullable(),
  image: z.string().nullable(),
  parent_project: z.string().nullable(),
  archived: z.boolean(),
  exclude_from_grid: z.boolean(),
  external_only: z.boolean(),
  featured: z.boolean(),
  nav: z.boolean(),
  grid_eligible: z.boolean(),
  grid_order: z.number(),
  microsite_cta: z.string().nullable(),
  participation: z
    .object({
      title: z.string(),
      ctas: z.array(z.string())
    })
    .nullable(),
  podcast: z
    .object({
      title: z.string(),
      host: z.string().nullable(),
      source_note: z.string().nullable(),
      episodes: z.array(
        z.object({
          title: z.string(),
          description: z.string().nullable()
        })
      )
    })
    .nullable(),
  pending: z.string().optional(),
  // gh#151 / BF-218. `legacy` is `null` on exactly one row
  // (`bfna-documentaries`, D-151.4) and populated on the other 37. `aka` holds
  // a project's former slugs — 7 rows carry one each — and is `.optional()`
  // because the remaining 31 omit the key rather than storing an empty array.
  legacy: bfEntityLegacySchema.nullable(),
  aka: z.array(bfProjectAkaSchema).optional()
})

/**
 * One program. `tagline` is required: the normaliser derives it as the first
 * sentence of `intro` for all three programs (issues 07 / 09 / 25 Decisions).
 */
export const bfProgramSchema = z.object({
  slug: z.string(),
  name: z.string(),
  tagline: z.string(),
  intro: z.string().nullable(),
  image: z.string().nullable()
})

/**
 * One person. `board` is the stored result of the wireframe composable's board
 * predicate (raw flag OR /board/i on the job title) and resolves 4 of the 13
 * documents; the Team list stays a composable-side filter (issue 08 Decisions).
 */
export const bfPersonSchema = z.object({
  slug: z.string(),
  name: z.string(),
  job_title: z.string().nullable(),
  bio: z.string().nullable(),
  email: z.string().nullable(),
  linkedin: z.string().nullable(),
  twitter: z.string().nullable(),
  image: z.string().nullable(),
  board: z.boolean()
})

/**
 * One static page. All 19 source fields are carried, `copy_source` and
 * `legacy` included — that full passthrough is what closes the audit's
 * "needs a real schema, 17 fields available" gap (01 §D/§F).
 */
export const bfPageSchema = z.object({
  slug: z.string(),
  heading: z.string().nullable(),
  subheading: z.string().nullable(),
  excerpt: z.string().nullable(),
  description: z.string().nullable(),
  authors: z.array(z.string()),
  image: z.string().nullable(),
  video_url: z.string().nullable(),
  download: z.string().nullable(),
  external_url: z.string().nullable(),
  publish_date: z.string().nullable(),
  bucket: z.string().nullable(),
  format: z.string().nullable(),
  kind: z.string().nullable(),
  program: z.string().nullable(),
  archived: z.boolean(),
  evergreen: z.boolean(),
  copy_source: z.string().nullable(),
  legacy: bfPageLegacySchema.nullable()
})

/**
 * The site-wide announcement. Exactly one document is emitted — the source is a
 * singleton object, not an array — so this schema describes that document, not
 * an array wrapper. `workstream` is a Directus M2O id, hence a number.
 * The `status === 'published'` gate stays in the composable (issue 13).
 */
export const bfAnnouncementSchema = z.object({
  status: z.string().nullable(),
  url: z.string().nullable(),
  message: z.string().nullable(),
  heading: z.string().nullable(),
  excerpt: z.string().nullable(),
  workstream: z.number().nullable()
})

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
        by: z.string().optional(),
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
        theme: z.string().optional(),
        isPodcast: z.boolean().default(false),
        isProduct: z.boolean().default(true),
        heading: z.string(),
        subheading: z.string().optional(),
        description: z.string().optional(),
        excerpt: z.string(),
        content: z.string().optional(),
        publishDate: z.string().optional(),
        date: z.string().optional(),
        coverImage: z.string().optional(),
        image: z.object({
          url: z.string().optional()
        }).optional(),
        slug: z.string().regex(/^[a-z0-9_-]+$/i), // URL-safe slug validation
        button: z
          .object({
            url: z.string().optional(),
            label: z.string().optional()
          })
          .optional(),
        buttonLabel: z.string().optional(),
        byLine: z.string().optional(),
        order: z.number().optional(),
        type: z.string().optional(),
        workstream: z.object({
          heading: z.string(),
          slug: z.string().regex(/^[a-z0-9_-]+$/i), // URL-safe slug validation
          excerpt: z.string().optional(),
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
        people: z.array(z.any()).optional(),
        videoUrl: z.string().optional(),
        websiteUrl: z.string().optional(),
        infographic: z.string().optional(),
        personSectionHeading: z.string().optional(),
        personSectionDescription: z.string().optional(),
        productSectionHeading: z.string().optional(),
        productSectionDescription: z.string().optional(),
        report: z.string().optional(),
        embedCode: z.string().optional(),
        breadcrumbs: z.array(z.any()).optional()
      })
    }),
    bfInsights: defineCollection({
      type: 'data',
      source: {
        include: 'bf/insights/*.json',
        cwd: contentDir
      },
      schema: bfInsightSchema
    }),
    bfProjects: defineCollection({
      type: 'data',
      source: {
        include: 'bf/projects/*.json',
        cwd: contentDir
      },
      schema: bfProjectSchema
    }),
    bfPrograms: defineCollection({
      type: 'data',
      source: {
        include: 'bf/programs/*.json',
        cwd: contentDir
      },
      schema: bfProgramSchema
    }),
    bfPeople: defineCollection({
      type: 'data',
      source: {
        include: 'bf/people/*.json',
        cwd: contentDir
      },
      schema: bfPersonSchema
    }),
    bfPages: defineCollection({
      type: 'data',
      source: {
        include: 'bf/pages/*.json',
        cwd: contentDir
      },
      schema: bfPageSchema
    }),
    bfAnnouncements: defineCollection({
      type: 'data',
      source: {
        include: 'bf/announcements/*.json',
        cwd: contentDir
      },
      schema: bfAnnouncementSchema
    })
  }
})
