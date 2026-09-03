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
 *  6. (gh#151, BF-218 F1+F2) `bfInsights.slug` is UNIQUE — 371 documents,
 *     371 distinct slugs — and the two documents whose slug the normaliser had
 *     to disambiguate carry `duplicate_of` pointing at the slug they collided
 *     with. Before this, 371 documents shared 369 slugs, `bySlug()` returned
 *     whichever row came back first, and `/wireframes/archive` rendered 255
 *     hrefs for 256 archived items. The same rows also now carry `legacy`, the
 *     old-URL provenance issue #57's redirect map is built from: present on
 *     371/371 insights and 37/38 projects — `bfna-documentaries` is the single
 *     project with `"legacy": null` in the snapshot, pinned by its own row so
 *     that a *second* project losing its provenance still fails this probe
 *     (D-151.4).
 *
 *  5. (gh#140, promoted residual #139) Every boolean flag is a real
 *     `true`/`false`, so a `.where(flag, '=', true|false)` predicate pushed
 *     into the query matches the rows it should. This used to be false: while
 *     `archived` / `exclude_from_grid` / `external_only` were
 *     `z.boolean().nullable()`, `.where('external_only', '=', true)` returned
 *     ZERO rows against a database that plainly held
 *     `transponder-magazine.json` with `"external_only": true` — an empty
 *     section and no error. The six rows at the end of the table are that
 *     repro, kept as a regression guard; the `= false` halves are the other
 *     side of it, since a null column matches neither `true` nor `false`.
 *
 * The typed locals below (`Insight`, `Page`, `Announcement`, `PageLegacyRef`
 * from `~/types/bf-contracts`) are real assignability checks, not casts: if a
 * schema and its exported entity type drift apart, `nuxt typecheck` fails
 * here instead of in a component.
 */
import type {
  Announcement,
  EntityLegacyRef,
  Insight,
  Page,
  PageLegacyRef
} from '~/types/bf-contracts'

defineOptions({ name: 'BfProbe09DataCollections' })

definePageMeta({ layout: 'bf-probe' })

useHead({
  title: 'bf-probe 09 — bf* collections + zod schemas'
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

  // gh#140 — the boolean-flag predicates, run in the QUERY rather than filtered in
  // JS afterwards. `external_only = true` is the exact #139 repro; the `= false`
  // counts are its complement and would BOTH under-report if the column were
  // nullable again, because SQL `= false` does not match `NULL` either.
  const externalOnly = await queryCollection('bfProjects')
    .where('external_only', '=', true)
    .all()
  const excludedFromGrid = await queryCollection('bfProjects')
    .where('exclude_from_grid', '=', true)
    .count()
  const projectsActive = await queryCollection('bfProjects')
    .where('archived', '=', false)
    .count()
  const insightsActive = await queryCollection('bfInsights')
    .where('archived', '=', false)
    .count()
  const pagesEvergreen = await queryCollection('bfPages')
    .where('evergreen', '=', true)
    .count()

  // gh#151 / BF-218 F1+F2. Read whole rows rather than counting: `slug` uniqueness
  // is a property of the SET, and `.count()` cannot see a duplicate.
  const allInsights = await queryCollection('bfInsights').all()
  const allProjects = await queryCollection('bfProjects').all()
  const distinctInsightSlugs = new Set(allInsights.map(i => i.slug)).size
  const insightsWithLegacySource = allInsights.filter(i => i.legacy?.source).length
  const projectsWithLegacySource = allProjects.filter(p => p.legacy?.source).length
  const projectsWithoutLegacy = allProjects.filter(p => !p.legacy).map(p => p.slug)
  // Assignability check, not a cast — the widened `id` union has to survive the
  // SQLite round trip as the type `content.config.ts` declares.
  const insightLegacy: EntityLegacyRef | null = allInsights[0]?.legacy ?? null

  // The two disambiguated documents, looked up by their NEW slug. That the lookup
  // resolves at all is half the F1 fix; that it carries `duplicate_of` is the other.
  const renamed = ['uncivil-war-2', 'graphic-images-autocrats-and-the-use-of-power-2']
  const renamedDocs = renamed.map(slug => allInsights.find(i => i.slug === slug))
  const renamedResolve = renamedDocs.filter(d => d !== undefined).length
  const renamedDuplicateOf = renamedDocs
    .map(d => d?.duplicate_of ?? 'MISSING')
    .join(', ')
  const projectsWithAka = allProjects.filter(p => (p.aka?.length ?? 0) > 0).length

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
      { label: 'bfProjects.podcast.episodes is an array', expected: 'true', actual: String(Array.isArray(withPodcast?.podcast?.episodes)) },
      { label: "bfProjects — .where('external_only','=',true) returns rows (gh#140)", expected: 1, actual: externalOnly.length },
      { label: "bfProjects — that row is the Transponder (#139 repro)", expected: 'transponder-magazine', actual: externalOnly[0]?.slug ?? 'NO ROWS' },
      { label: "bfProjects — .where('exclude_from_grid','=',true)", expected: 2, actual: excludedFromGrid },
      { label: "bfProjects — .where('archived','=',false)", expected: 21, actual: projectsActive },
      { label: "bfInsights — .where('archived','=',false)", expected: 115, actual: insightsActive },
      { label: "bfPages — .where('evergreen','=',true)", expected: 7, actual: pagesEvergreen },

      // --- gh#151 / BF-218 F1: slug is unique ------------------------------
      { label: 'bfInsights — slug count === distinct slug count (gh#151 F1)', expected: 371, actual: distinctInsightSlugs },
      { label: 'bfInsights — the two disambiguated slugs resolve', expected: 2, actual: renamedResolve },
      { label: '  …and both carry duplicate_of', expected: 'uncivil-war, graphic-images-autocrats-and-the-use-of-power', actual: renamedDuplicateOf },
      { label: 'bfProjects — slug count === distinct slug count', expected: 38, actual: new Set(allProjects.map(p => p.slug)).size },

      // --- gh#151 / BF-218 F2: legacy + aka survive the normaliser ---------
      { label: 'bfInsights — rows with legacy.source (gh#151 F2)', expected: 371, actual: insightsWithLegacySource },
      { label: 'bfInsights.legacy is an object', expected: 'object', actual: insightLegacy === null ? 'null' : typeof insightLegacy },
      { label: 'bfProjects — rows with legacy.source', expected: 37, actual: projectsWithLegacySource },
      { label: '  …the one exception (D-151.4)', expected: 'bfna-documentaries', actual: projectsWithoutLegacy.join(', ') || 'NONE' },
      { label: 'bfProjects — rows carrying aka', expected: 7, actual: projectsWithAka },
      { label: 'bfProjects.aka[].legacy round-trips as an object', expected: 'object', actual: typeof allProjects.find(p => p.aka?.length)?.aka?.[0]?.legacy }
    ] satisfies Check[]
  }
})

const checks = computed<Check[]>(() => data.value?.checks ?? [])
const passed = computed(() => checks.value.filter(c => String(c.actual) === String(c.expected)).length)
const allPass = computed(() => checks.value.length > 0 && passed.value === checks.value.length)
</script>

<template>
  <!--
    Harness contract (docs/decisions/probe-harness.md): the root carries
    `data-probe` + `data-probe-verdict`, and every check row carries
    `data-probe-row` + `data-ok`, so `scripts/check-probes.ts` can fail the
    build on a red probe instead of relying on someone opening the page.
  -->
  <main
    class="probe container"
    data-probe="09"
    :data-probe-verdict="checks.length === 0 ? 'PENDING' : allPass ? 'PASS' : 'FAIL'"
  >
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
          :data-probe-row="c.label"
          :data-ok="String(c.actual) === String(c.expected) ? 'true' : 'false'"
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
