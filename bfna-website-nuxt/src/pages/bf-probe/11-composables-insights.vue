<script setup lang="ts">
/**
 * Probe — issue 11 / gh#20: `useBfInsights`.
 *
 * Dev-only route, never linked from nav. Kept in place for later issues to
 * regression-check against (only the final cutover issue removes `bf-probe/`).
 *
 * This is a **parity test**, not a restatement of the implementation: every
 * expected number below was computed offline from
 * `src/assets/wireframe-data/insights.json` through `useWfContent`'s own
 * predicates, then hard-coded here. If `useBfInsights` ever stops agreeing
 * with the wireframe composable it is porting, this page renders FAIL.
 *
 * What it proves:
 *
 *  1. The 371/354 split is handled — `items` is the 354 body documents, not
 *     all 371, so `active.length + archived.length === 354` (the issue's own
 *     acceptance number) and `highlights()` is the 8 `featured` highlight
 *     records that live alongside them.
 *  2. Sort parity — `active` and `archived` are `publish_date` descending,
 *     asserted by first slug rather than by count alone.
 *  3. `bySlug` resolves a known real slug to a defined item.
 *  4. The filtered accessors reproduce the wireframe numbers for a real
 *     program name and a real project slug.
 *
 * (The vitest harness on `dev` is broken and pre-existing — residual #86 —
 * so acceptance is this page, rendered by `npx nuxt generate` against the
 * real content database. Recorded in the spec's Decisions.)
 */
import type { Insight } from '~/types/bf-contracts'
import { useBfInsights } from '~/composables/data/useBfInsights'

defineOptions({ name: 'BfProbe11ComposablesInsights' })

definePageMeta({ layout: false })

useHead({
  title: 'bf-probe 11 — useBfInsights',
  // `layout: false` bypasses the only layout that sets these, so set them here:
  // `lang` for WCAG 3.1.1, `noindex` because probes are dev-only scaffolding.
  htmlAttrs: { lang: 'en' },
  meta: [{ name: 'robots', content: 'noindex' }],
  link: [{ rel: 'stylesheet', href: '/css/styles.css' }]
})

/** One asserted value: what it is, what it must be, what it actually is. */
interface Check {
  label: string
  expected: number | string
  actual: number | string
}

const {
  items,
  active,
  archived,
  bySlug,
  activeByProgram,
  archivedCountByProgram,
  highlights,
  insightsForProject
} = await useBfInsights()

// Assignability check, not a cast: if the composable and the exported entity
// type drift apart, `nuxt typecheck` fails here rather than in a page.
const known: Insight | undefined = bySlug('how-german-elections-work')

const checks: Check[] = [
  // --- the acceptance number from the issue -------------------------------
  { label: 'active.length + archived.length', expected: 354, actual: active.length + archived.length },
  { label: 'items.length (354 body items, not all 371)', expected: 354, actual: items.length },
  { label: 'active.length (non-archived)', expected: 98, actual: active.length },
  { label: 'archived.length', expected: 256, actual: archived.length },

  // --- bySlug resolves a known real slug ----------------------------------
  { label: "bySlug('how-german-elections-work') is defined", expected: 'true', actual: String(known !== undefined) },
  { label: '  …and carries that slug', expected: 'how-german-elections-work', actual: known?.slug ?? 'undefined' },
  { label: "bySlug('not-a-real-slug') is undefined", expected: 'true', actual: String(bySlug('not-a-real-slug') === undefined) },

  // --- sort parity with useWfContent --------------------------------------
  // Asserted on `publish_date`, which is what the comparator orders by. The
  // head *slug* is only pinned where the top date is held by one row:
  // `2026-07-21` is unique in `active`, but two archived rows tie at
  // `2023-07-20`, and a tie resolves to input order — snapshot order in the
  // wireframe, file-stem order here. Pinning that slug would assert an
  // ordinal the documents do not carry (see the spec's Decisions).
  { label: 'active[0].publish_date — newest first', expected: '2026-07-21', actual: active[0]?.publish_date ?? 'undefined' },
  { label: 'active[0].slug (unique at that date)', expected: 'the-nuclear-option', actual: active[0]?.slug ?? 'undefined' },
  { label: 'active is monotonically descending', expected: 'true', actual: String(active.every((i, n) => n === 0 || (active[n - 1]!.publish_date ?? '') >= (i.publish_date ?? ''))) },
  { label: 'archived[0].publish_date — newest first', expected: '2023-07-20', actual: archived[0]?.publish_date ?? 'undefined' },
  { label: 'archived[0] is one of the two rows tied there', expected: 'true', actual: String(['there-and-back-again', 'the-21st-century-space-race-geopolitical-competition-or-cooperation-4'].includes(archived[0]?.slug ?? '')) },
  { label: 'archived is monotonically descending', expected: 'true', actual: String(archived.every((i, n) => n === 0 || (archived[n - 1]!.publish_date ?? '') >= (i.publish_date ?? ''))) },

  // --- the curated featured strip -----------------------------------------
  { label: 'highlights().length', expected: 8, actual: highlights().length },
  { label: 'highlights() are all featured', expected: 'true', actual: String(highlights().every(i => i.featured)) },
  { label: 'highlights() are outside items', expected: 0, actual: highlights().filter(h => items.some(i => i.slug === h.slug)).length },
  { label: 'highlights()[0]', expected: 'latest-issue-transponder-the-future', actual: highlights()[0]?.slug ?? 'undefined' },

  // --- filtered accessors, against real wireframe numbers -----------------
  { label: "activeByProgram('Democracy')", expected: 13, actual: activeByProgram('Democracy').length },
  { label: "archivedCountByProgram('Democracy')", expected: 60, actual: archivedCountByProgram('Democracy') },
  { label: "insightsForProject('election-analysis')", expected: 3, actual: insightsForProject('election-analysis').length },
  { label: "insightsForProject('not-a-real-project')", expected: 0, actual: insightsForProject('not-a-real-project').length }
]

const passed = computed(() => checks.filter(c => String(c.actual) === String(c.expected)).length)
const allPass = computed(() => checks.length > 0 && passed.value === checks.length)
</script>

<template>
  <main class="probe container">
    <h1>Probe 11 — <code>useBfInsights</code></h1>
    <p class="probe__lede">
      The insight surface of <code>useWfContent</code>, read back out of the
      <code>bfInsights</code> collection. Every expected value was computed
      offline from the wireframe snapshot through the wireframe composable's
      own predicates, so a passing row is parity with the wireframe, not
      agreement with the implementation.
    </p>

    <p
      class="probe__verdict"
      :data-state="allPass ? 'pass' : 'fail'"
      data-testid="probe-11-verdict"
    >
      {{ allPass ? 'PASS' : 'FAIL' }} — {{ passed }}/{{ checks.length }} checks
    </p>

    <table class="probe__table" data-testid="probe-11-table">
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
