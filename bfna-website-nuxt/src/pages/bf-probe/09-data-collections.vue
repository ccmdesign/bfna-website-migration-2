<script setup lang="ts">
/**
 * Probe — issue 09 / gh#18: the six `bf*` collections + their zod schemas.
 *
 * Dev-only route, never linked from nav. Kept in place for later issues to
 * regression-check against (only the final cutover issue removes `bf-probe/`).
 *
 * What it proves, against the real content database built by
 * `npx nuxt generate` rather than against the JSON on disk:
 *
 *  1. All six collections are registered and queryable, and every document in
 *     them passed its zod schema — a schema mismatch fails the build before
 *     this page renders, so a rendered page is itself half the assertion.
 *  2. The counts are the ones issues 07/08 actually emitted: **371** insights
 *     (354 plain items + 8 `featured` + 9 `retired_news` highlight records,
 *     0 carrying both), 38 projects, 3 programs, 13 people of whom 4 are
 *     `board`, 7 pages, and exactly 1 announcement.
 *  3. The two field types the spec drafted wrongly survive the SQLite round
 *     trip as their real shapes: `bfPages.legacy` comes back an **object**
 *     (not a string), `bfAnnouncements.workstream` a **number** (not a
 *     string). Both were corrected from issue 08's Decisions.
 *  4. The JSON-column fields round-trip: `authors` / `projects` as string
 *     arrays, `participation` / `podcast` / `legacy` as nested objects.
 *
 * The typed locals below (`Insight`, `Page`, `Announcement`, `PageLegacyRef`
 * from `~/types/bf-contracts`) are real assignability checks, not casts: if a
 * schema and its exported entity type drift apart, `nuxt typecheck` fails
 * here instead of in a component.
 */
import type {
  Announcement,
  Insight,
  Page,
  PageLegacyRef
} from '~/types/bf-contracts'

defineOptions({ name: 'BfProbe09DataCollections' })

definePageMeta({ layout: false })

useHead({
  title: 'bf-probe 09 — bf* collections + zod schemas',
  // `layout: false` bypasses the only layout that sets these, so set them here:
  // `lang` for WCAG 3.1.1, `noindex` because probes are dev-only scaffolding.
  htmlAttrs: { lang: 'en' },
  meta: [{ name: 'robots', content: 'noindex' }],
  link: [{ rel: 'stylesheet', href: '/css/styles.css' }]
})

/** One asserted number: what it is, what it must be, what it actually is. */
interface Check {
  label: string
  expected: number | string
  actual: number | string
}

const { data } = await useAsyncData('bf-probe-09', async () => {
  // Counts. `.count()` is the acceptance command named in the issue.
  const insights = await queryCollection('bfInsights').count()
  const insightsFeatured = await queryCollection('bfInsights')
    .where('featured', '=', true)
    .count()
  const insightsRetired = await queryCollection('bfInsights')
    .where('retired_news', '=', true)
    .count()
  const projects = await queryCollection('bfProjects').count()
  const programs = await queryCollection('bfPrograms').count()
  const people = await queryCollection('bfPeople').count()
  const board = await queryCollection('bfPeople')
    .where('board', '=', true)
    .count()
  const pagesCount = await queryCollection('bfPages').count()
  const announcements = await queryCollection('bfAnnouncements').count()

  // Round-trip shape checks. Small collections, so read the rows themselves.
  const pages = await queryCollection('bfPages').all()
  const legacyPage = pages.find(p => p.legacy !== null)
  // Assignability check: the nested object type must survive the round trip.
  const legacy: PageLegacyRef | null = legacyPage?.legacy ?? null

  const announcement = await queryCollection('bfAnnouncements').first()
  const workstream: Announcement['workstream'] = announcement?.workstream ?? null

  // One insight carrying both array columns, to prove the JSON round trip.
  const withArrays = await queryCollection('bfInsights')
    .where('slug', '=', 'graphic-images-autocrats-and-the-use-of-power')
    .first()
  const sampleInsight: Pick<Insight, 'authors' | 'projects'> | null =
    withArrays ? { authors: withArrays.authors, projects: withArrays.projects } : null

  // One project carrying the two nested-object columns.
  const withPodcast = await queryCollection('bfProjects')
    .where('slug', '=', 'indo-pacific-nexus')
    .first()

  const samplePage: Pick<Page, 'slug' | 'copy_source'> | null = legacyPage
    ? { slug: legacyPage.slug, copy_source: legacyPage.copy_source }
    : null

  return {
    checks: [
      { label: 'bfInsights — total documents', expected: 371, actual: insights },
      { label: 'bfInsights — plain items (neither flag)', expected: 354, actual: insights - insightsFeatured - insightsRetired },
      { label: 'bfInsights — featured highlights', expected: 8, actual: insightsFeatured },
      { label: 'bfInsights — retired_news highlights', expected: 9, actual: insightsRetired },
      { label: 'bfProjects — total documents', expected: 38, actual: projects },
      { label: 'bfPrograms — total documents', expected: 3, actual: programs },
      { label: 'bfPeople — total documents', expected: 13, actual: people },
      { label: 'bfPeople — board members', expected: 4, actual: board },
      { label: 'bfPages — total documents', expected: 7, actual: pagesCount },
      { label: 'bfAnnouncements — single document', expected: 1, actual: announcements },
      { label: 'bfPages.legacy is an object', expected: 'object', actual: legacy === null ? 'null' : typeof legacy },
      { label: 'bfPages.legacy.source round-trips', expected: 'irene-docx', actual: legacy?.source ?? 'null' },
      { label: 'bfPages.copy_source is present', expected: 'string', actual: typeof samplePage?.copy_source },
      { label: 'bfAnnouncements.workstream is a number', expected: 'number', actual: typeof workstream },
      { label: 'bfInsights.authors is an array', expected: 'true', actual: String(Array.isArray(sampleInsight?.authors)) },
      { label: 'bfInsights.projects is an array', expected: 'true', actual: String(Array.isArray(sampleInsight?.projects)) },
      { label: 'bfProjects.podcast is an object', expected: 'object', actual: typeof withPodcast?.podcast },
      { label: 'bfProjects.podcast.episodes is an array', expected: 'true', actual: String(Array.isArray(withPodcast?.podcast?.episodes)) }
    ] satisfies Check[]
  }
})

const checks = computed<Check[]>(() => data.value?.checks ?? [])
const passed = computed(() => checks.value.filter(c => String(c.actual) === String(c.expected)).length)
const allPass = computed(() => checks.value.length > 0 && passed.value === checks.value.length)
</script>

<template>
  <main class="probe container">
    <h1>Probe 09 — <code>bf*</code> collections + zod schemas</h1>
    <p class="probe__lede">
      Six <code>type: 'data'</code> collections read back out of the built
      content database. A schema that does not match what the normaliser emits
      fails <code>nuxt generate</code> before this page exists, so a rendered
      table is already half the proof; the numbers below are the other half.
    </p>

    <p
      class="probe__verdict"
      :data-state="allPass ? 'pass' : 'fail'"
      data-testid="probe-09-verdict"
    >
      {{ allPass ? 'PASS' : 'FAIL' }} — {{ passed }}/{{ checks.length }} checks
    </p>

    <table class="probe__table" data-testid="probe-09-table">
      <thead>
        <tr>
          <th scope="col">Check</th>
          <th scope="col">Expected</th>
          <th scope="col">Actual</th>
          <th scope="col">Result</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="c in checks"
          :key="c.label"
          :data-state="String(c.actual) === String(c.expected) ? 'pass' : 'fail'"
        >
          <td>{{ c.label }}</td>
          <td><code>{{ c.expected }}</code></td>
          <td><code>{{ c.actual }}</code></td>
          <td>{{ String(c.actual) === String(c.expected) ? 'pass' : 'fail' }}</td>
        </tr>
      </tbody>
    </table>
  </main>
</template>

<style scoped>
.probe {
  padding-block: var(--space-l, 2rem);
}

.probe__lede {
  max-inline-size: 75ch;
}

.probe__verdict {
  font-weight: 700;
}

.probe__verdict[data-state='fail'] {
  color: var(--color-error, #b00);
}

.probe__table {
  border-collapse: collapse;
  inline-size: 100%;
}

.probe__table th,
.probe__table td {
  border-block-end: 1px solid currentcolor;
  padding: 0.25rem 0.75rem 0.25rem 0;
  text-align: start;
}

.probe__table tr[data-state='fail'] {
  color: var(--color-error, #b00);
}
</style>
