<script setup lang="ts">
/**
 * Probe — issue 12 / gh#21: `useBfProjects` + `useBfPrograms`.
 *
 * Dev-only route, never linked from nav. Kept in place for later issues to
 * regression-check against (only the final cutover issue removes `bf-probe/`).
 *
 * This is a **parity test**, not a restatement of the implementation: every
 * expected value below was computed offline from
 * `src/assets/wireframe-data/projects.json` / `programs.json` through
 * `useWfContent`'s own predicates (`inProjectGrid`, `gridSort` + `GRID_ORDER`,
 * `FEATURED_SLUGS`, `NAV_SLUGS`, the `heading`-desc child comparator), then
 * hard-coded here. If the composables ever stop agreeing with the wireframe
 * composable they are porting, this page renders FAIL.
 *
 * What it proves:
 *
 *  1. The issue's own acceptance — `gridProjectsByProgram` returns the
 *     client-ordered set for each of the 3 programs, asserted as the **full
 *     slug sequence**, not a count.
 *  2. `projectChildren` is `heading` descending (newest cohort first).
 *  3. The top-level / children split matches `topProjects` / `projectsAll`.
 *  4. The curated `navProjects` / `featuredProjects` orders survive the move
 *     from array-lookup to stored-flag + ordering key.
 *  5. `useBfPrograms` returns all 3 programs with the normaliser's `tagline`.
 *
 * (The vitest harness on `dev` is broken and pre-existing — residual #86 — so
 * acceptance is this page, rendered by `npx nuxt generate` against the real
 * content database. Recorded in the spec's Decisions, per gh#20's precedent.)
 */
import type { Program, Project } from '~/types/bf-contracts'
import { useBfProjects } from '~/composables/data/useBfProjects'
import { useBfPrograms } from '~/composables/data/useBfPrograms'

defineOptions({ name: 'BfProbe12ComposablesProjectsPrograms' })

definePageMeta({ layout: false })

useHead({
  title: 'bf-probe 12 — useBfProjects / useBfPrograms',
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

/**
 * gh#91 — a list member hands back a **copy**: mutating what one call returned
 * cannot change what the next call returns.
 *
 * `b !== a` proves a new array came back; `b[0] === a.at(-1)` proves the second
 * call still starts at the element the first one did, i.e. the `.reverse()`
 * landed on the caller's copy and not on shared state.
 */
const isCopySafe = <T>(read: () => T[]) => {
  const a = read()
  if (a.length < 2) return false
  a.reverse()
  const b = read()
  return b !== a && b[0] === a.at(-1)
}

const {
  projects,
  projectsByProgram,
  gridProjectsByProgram,
  productsByProgram,
  allProducts,
  projectsPendingRetag,
  projectBySlug,
  projectChildren,
  navProjects,
  featuredProjects
} = await useBfProjects()

const { programs, programBySlug } = await useBfPrograms()

/** Program display **names** — what every `*ByProgram` member takes. */
const DEMOCRACY = 'Democracy'
const FUTURE_LEADERSHIP = 'Future Leadership'
const TRGC = 'Transatlantic Relations & Global Challenges'

const slugs = (list: Project[]) => list.map(p => p.slug).join(',')

// Assignability checks, not casts: if a composable and the exported entity
// types drift apart, `nuxt typecheck` fails here rather than in a page.
const known: Project | undefined = projectBySlug('how-to-fix-democracy')
const child: Project | undefined = projectBySlug('class-of-2026')
const program: Program | undefined = programBySlug('democracy')

const trgcGrid = gridProjectsByProgram(TRGC)

const checks: Check[] = [
  // --- the acceptance: gridProjectsByProgram, full sequence ---------------
  // Democracy and Future Leadership are the two programs the client placed
  // (Irene, Aug 5). Their whole order comes from the stored `grid_order`.
  {
    label: `gridProjectsByProgram('${DEMOCRACY}')`,
    expected: 'graphic-images,city-solutions-series,how-to-fix-democracy,election-analysis',
    actual: slugs(gridProjectsByProgram(DEMOCRACY))
  },
  {
    label: `gridProjectsByProgram('${FUTURE_LEADERSHIP}')`,
    expected: 'the-bertelsmann-foundation-fellowship,summer-enrichment-series,leadership-in-action',
    actual: slugs(gridProjectsByProgram(FUTURE_LEADERSHIP))
  },
  // TR&GC is the unlisted third program: the client placed no order for it, so
  // `gridSort` returned the wireframe's list untouched — i.e. snapshot order.
  // Since gh#89 the normaliser materialises that as a real ordinal
  // (`1_000_000 + <snapshot index>`) instead of a `MAX_SAFE_INTEGER` sentinel
  // that tied, so this row asserts the **full ordered sequence** rather than the
  // sorted set it used to. The expected value below is `useWfContent`'s own
  // `gridProjectsByProgram(TRGC)` output, computed offline from
  // `src/assets/wireframe-data/projects.json` — snapshot indices 16, 17, 18, 33,
  // 34, 35. If the fallback ordinal ever stops carrying snapshot order across
  // the move to per-file documents, this renders FAIL.
  {
    label: `gridProjectsByProgram('${TRGC}') — full order`,
    expected: 'transatlantic-periscope,range,transatlantic-barometer,astropolitics,indo-pacific-nexus,critical-minerals',
    actual: slugs(trgcGrid)
  },
  {
    label: '  …carried by fallback ordinals, strictly ascending (gh#89)',
    expected: 'true',
    actual: String(
      trgcGrid.every(p => p.grid_order >= 1_000_000 && p.grid_order < Number.MAX_SAFE_INTEGER)
      && trgcGrid.every((p, n) => n === 0 || trgcGrid[n - 1]!.grid_order < p.grid_order)
    )
  },
  {
    // The point of gh#89: nothing that reaches a grid still carries the
    // sentinel. Scoped to the 18 top-level projects because that is the set
    // every list member reads — cohort/year children never reach a grid.
    label: '  …and no top-level project keeps the MAX_SAFE_INTEGER sentinel',
    expected: 0,
    actual: projects().filter(p => p.grid_order === Number.MAX_SAFE_INTEGER).length
  },
  {
    label: 'grid rows are all grid_eligible',
    expected: 'true',
    actual: String([DEMOCRACY, FUTURE_LEADERSHIP, TRGC].every(p => gridProjectsByProgram(p).every(x => x.grid_eligible)))
  },
  {
    label: 'gridProjectsByProgram(unknown program)',
    expected: 0,
    actual: gridProjectsByProgram('Not A Program').length
  },

  // --- the acceptance: projectChildren, heading descending ----------------
  {
    label: "projectChildren('the-bertelsmann-foundation-fellowship').length",
    expected: 14,
    actual: projectChildren('the-bertelsmann-foundation-fellowship').length
  },
  {
    label: '  …headings descending',
    expected: 'true',
    actual: String(projectChildren('the-bertelsmann-foundation-fellowship')
      .every((p, n, a) => n === 0 || (a[n - 1]!.heading ?? '') >= (p.heading ?? '')))
  },
  {
    label: '  …newest cohort first',
    expected: 'Class of 2026',
    actual: projectChildren('the-bertelsmann-foundation-fellowship')[0]?.heading ?? 'undefined'
  },
  {
    label: "projectChildren('summer-enrichment-series') headings",
    expected: '2025 - Astropolitics|2024|2023|2022',
    actual: projectChildren('summer-enrichment-series').map(p => p.heading).join('|')
  },
  {
    label: "projectChildren('graphic-images') — a leaf project",
    expected: 0,
    actual: projectChildren('graphic-images').length
  },

  // --- the top-level / children split -------------------------------------
  { label: 'projects().length (top-level only)', expected: 18, actual: projects().length },
  {
    label: '  …none carries a parent_project',
    expected: 'true',
    actual: String(projects().every(p => !p.parent_project))
  },
  { label: `projectsByProgram('${DEMOCRACY}')`, expected: 4, actual: projectsByProgram(DEMOCRACY).length },
  { label: `projectsByProgram('${FUTURE_LEADERSHIP}')`, expected: 3, actual: projectsByProgram(FUTURE_LEADERSHIP).length },
  { label: `projectsByProgram('${TRGC}')`, expected: 10, actual: projectsByProgram(TRGC).length },

  // --- projectBySlug reaches children, the lists do not -------------------
  { label: "projectBySlug('how-to-fix-democracy') is defined", expected: 'true', actual: String(known !== undefined) },
  { label: "projectBySlug('class-of-2026') — a child — is defined", expected: 'true', actual: String(child !== undefined) },
  { label: '  …and its parent is the Fellowship', expected: 'the-bertelsmann-foundation-fellowship', actual: child?.parent_project ?? 'undefined' },
  { label: "projectBySlug('not-a-real-slug') is undefined", expected: 'true', actual: String(projectBySlug('not-a-real-slug') === undefined) },

  // --- the curated lists, order included ----------------------------------
  {
    label: 'featuredProjects() — FEATURED_SLUGS order',
    expected: 'transatlantic-barometer,transatlantic-periscope,how-to-fix-democracy,the-bertelsmann-foundation-fellowship',
    actual: slugs(featuredProjects())
  },
  {
    label: '  …selected by the stored flag, not the array',
    expected: 'true',
    actual: String(featuredProjects().every(p => p.featured))
  },
  {
    label: 'navProjects() — NAV_SLUGS order',
    expected: 'transatlantic-barometer,transatlantic-periscope,range,how-to-fix-democracy,the-bertelsmann-foundation-fellowship',
    actual: slugs(navProjects())
  },
  {
    label: '  …selected by the stored flag, not the array',
    expected: 'true',
    actual: String(navProjects().every(p => p.nav))
  },

  // --- products and the RE-TAG bucket -------------------------------------
  { label: 'allProducts()', expected: 'transponder-magazine', actual: slugs(allProducts()) },
  { label: `productsByProgram('${TRGC}')`, expected: 'transponder-magazine', actual: slugs(productsByProgram(TRGC)) },
  { label: `productsByProgram('${DEMOCRACY}')`, expected: 0, actual: productsByProgram(DEMOCRACY).length },
  // Empty today: 100 Questions is the only RE-TAG row and it is archived.
  { label: 'projectsPendingRetag()', expected: 0, actual: projectsPendingRetag().length },

  // --- the normaliser's `pending` chip survives ---------------------------
  { label: "projectBySlug('transponder-magazine').pending", expected: 'Q6', actual: projectBySlug('transponder-magazine')?.pending ?? 'undefined' },
  { label: "projectBySlug('bfna-documentaries').pending", expected: 'Q7', actual: projectBySlug('bfna-documentaries')?.pending ?? 'undefined' },

  // --- useBfPrograms ------------------------------------------------------
  { label: 'programs().length', expected: 3, actual: programs().length },
  {
    label: 'programs() slugs',
    expected: 'democracy,future-leadership,transatlantic-relations-global-challenges',
    actual: programs().map(p => p.slug).sort().join(',')
  },
  { label: "programBySlug('democracy').name", expected: 'Democracy', actual: program?.name ?? 'undefined' },
  {
    label: '  …carries the normaliser-derived tagline',
    expected: 'true',
    actual: String((program?.tagline ?? '').startsWith('Democracies around the world are facing profound challenges'))
  },
  {
    label: 'every program has a non-empty tagline',
    expected: 'true',
    actual: String(programs().every(p => p.tagline.length > 0))
  },
  { label: "programBySlug('not-a-program') is undefined", expected: 'true', actual: String(programBySlug('not-a-program') === undefined) },

  // --- gh#91: the unfiltered members hand back copies ----------------------
  {
    label: 'projects() / programs() survive a caller reversing them (gh#91)',
    expected: 'true',
    actual: String(isCopySafe(projects) && isCopySafe(programs))
  }
]

const passed = computed(() => checks.filter(c => String(c.actual) === String(c.expected)).length)
const allPass = computed(() => checks.length > 0 && passed.value === checks.length)
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
    data-probe="12"
    :data-probe-verdict="checks.length === 0 ? 'PENDING' : allPass ? 'PASS' : 'FAIL'"
  >
    <h1>Probe 12 — <code>useBfProjects</code> / <code>useBfPrograms</code></h1>
    <p class="probe__lede">
      The project and program surface of <code>useWfContent</code>, read back
      out of the <code>bfProjects</code> and <code>bfPrograms</code>
      collections. Every expected value was computed offline from the wireframe
      snapshots through the wireframe composable's own predicates, so a passing
      row is parity with the wireframe, not agreement with the implementation.
    </p>

    <p
      class="probe__verdict"
      :data-state="allPass ? 'pass' : 'fail'"
      data-testid="probe-12-verdict"
    >
      {{ allPass ? 'PASS' : 'FAIL' }} — {{ passed }}/{{ checks.length }} checks
    </p>

    <table class="probe__table" data-testid="probe-12-table">
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
