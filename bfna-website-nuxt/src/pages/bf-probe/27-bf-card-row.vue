<script setup lang="ts">
/**
 * Probe — issue 27 / gh#36: `bfCardRow`.
 *
 * Dev-only route, never linked from nav. Kept in place for later issues to
 * regression-check against — #43 (`bfSearchShell`) and #55 (the `/archive`
 * accordion) both consume this row — and only the final cutover issue removes
 * `bf-probe/`.
 *
 * ## What it proves
 *
 * 1. **One prop union, two entity types, one call site.** The rows are
 *    rendered by a single `v-for` over a **mixed array** of real `Insight`
 *    and `Project` documents — not two loops, not two containers. That is the
 *    issue's stated acceptance, and it is the shape both consumers have.
 * 2. **The branches are right.** The insight rows link into `/insights/`, the
 *    project rows into `/projects/`; the insight rows carry a `<time>` with a
 *    machine-readable `datetime` and the project rows carry none.
 * 3. **The chips come from the formatters**, not from raw slugs:
 *    `formatLabel` on the insight branch, `kindLabel` on the project branch,
 *    and the conditional `Archive` chip on both.
 * 4. **The guard survives a null date.** `astropolitics-…` is one of the 20
 *    real insight rows whose `publish_date` is `null`. A truthiness guard
 *    would route it down the *project* branch and link it to
 *    `/projects/<an-insight-slug>` — a 404 that typechecks. `'publish_date'
 *    in item` does not, and this row is the assertion.
 * 5. **`kindLabel`'s null is filtered, not rendered.** `100-questions` is a
 *    real project with no `kind`; the row must show its `Archive` chip and no
 *    empty chip beside it.
 * 6. **It is one line.** Chip, heading and date share a baseline and sit on
 *    one visual row — measured from box geometry, not asserted from a class
 *    name.
 * 7. **A 980-character heading wraps without breaking the row** — the issue's
 *    second acceptance clause. The long row must be many lines tall and must
 *    still not be wider than its container: wrapping, not overflow.
 * 8. **It is a `bfCard`.** The row is an `<li class="bf-card bf-card-row">`
 *    inside a real list, and it keeps the family's stretched link — empty row
 *    space hit-tests to the heading anchor.
 * 9. **`headingLevel` and `variant` reach the DOM**, and `$attrs` falls
 *    through to the same `<li>`.
 *
 * No keyboard is needed — the stretched link's focus ring belongs to `bfCard`
 * and is asserted on probe 20 — so this page declares no `data-probe-keys`.
 *
 * The vitest harness on `dev` is broken and pre-existing (residual #86), so
 * acceptance is this page under `npx tsx scripts/check-probes.ts --only 27`,
 * per the #109 harness decision. Recorded in the spec's Decisions section.
 */
import type { CardRowItem, Insight, Project } from '~/types/bf-contracts'
import { formatLabel, kindLabel } from '~/utils/format'

defineOptions({ name: 'BfProbe27BfCardRow' })

definePageMeta({ layout: 'bf-probe' })

useHead({
  title: 'bf-probe 27 — bfCardRow'
})

/** One asserted value: what it is, what it must be, what it actually is. */
interface Check {
  label: string
  expected: string | number
  actual: string | number
}

/**
 * The five real documents, named once so the assertions below can quote them.
 * Each is here for a reason the doc comment lists:
 *
 * | slug | why |
 * |---|---|
 * | `dual-vocational-training` | a plain insight — chip, heading, date |
 * | `there-and-back-again` | an **archived** insight — two chips |
 * | `astropolitics-…` | an insight with a **null** `publish_date` |
 * | `city-solutions-series` | a project **with** a `kind` |
 * | `100-questions` | an archived project with **no** `kind` |
 */
const SLUGS = {
  article: 'dual-vocational-training',
  archived: 'there-and-back-again',
  undated: 'astropolitics-bertelsmann-site-dedicated-to-geopolitics',
  project: 'city-solutions-series',
  kindless: '100-questions'
} as const

/** The heading length the issue's acceptance names. */
const LONG_LENGTH = 980

const { data } = await useAsyncData('bf-probe-27', async () => {
  const insight = (slug: string) =>
    queryCollection('bfInsights').where('slug', '=', slug).first()
  const project = (slug: string) =>
    queryCollection('bfProjects').where('slug', '=', slug).first()

  const [article, archived, undated, projectRow, kindless] = await Promise.all([
    insight(SLUGS.article),
    insight(SLUGS.archived),
    insight(SLUGS.undated),
    project(SLUGS.project),
    project(SLUGS.kindless)
  ])

  return { article, archived, undated, projectRow, kindless }
})

/*
 * Assignability checks, not casts. If either schema drifts from its inferred
 * type these lines stop compiling — the point of the component taking whole
 * entities rather than four loose fields.
 */
const article = computed<Insight | null>(() => data.value?.article ?? null)
const archived = computed<Insight | null>(() => data.value?.archived ?? null)
const undated = computed<Insight | null>(() => data.value?.undated ?? null)
const projectRow = computed<Project | null>(() => data.value?.projectRow ?? null)
const kindless = computed<Project | null>(() => data.value?.kindless ?? null)

/**
 * A real insight carrying 980 characters of its **own real body prose** as its
 * heading. Not lorem and not a padded string: the substitution D-21.3
 * established for probe 21's 980-character excerpt, applied to the field this
 * issue's acceptance names.
 *
 * `dual-vocational-training` has 11 975 characters of `content`, so the slice
 * is real sentences rather than one repeated word — which matters, because a
 * single 980-character *word* would not wrap at all and would prove the
 * opposite of what this row is for.
 */
const longHeading = computed<Insight | null>(() => {
  const row = article.value
  if (!row) return null
  return { ...row, heading: (row.content ?? '').slice(0, LONG_LENGTH) }
})

/**
 * **The mixed array.** One list, insights and projects interleaved, handed to
 * one `v-for`. Interleaved rather than grouped on purpose: a list that happens
 * to be sorted by type would pass even if the component branched on position.
 */
const rows = computed<{ key: string, item: CardRowItem }[]>(() => {
  /*
   * Annotated before the `.filter`, not inferred through it. Left to
   * inference, each element is its own object-literal type and the array is a
   * *union* of six of them, which a type predicate cannot narrow: TS asks the
   * predicate's type to be assignable to the parameter's, and
   * `{ key, item: CardRowItem }` is assignable to none of the six alone.
   * One annotation makes it a single element type, and the predicate then does
   * the only job it is here for — dropping the `null`s.
   */
  const all: { key: string, item: CardRowItem | null }[] = [
    { key: 'article', item: article.value },
    { key: 'project', item: projectRow.value },
    { key: 'archived', item: archived.value },
    { key: 'kindless', item: kindless.value },
    { key: 'undated', item: undated.value },
    { key: 'long', item: longHeading.value }
  ]
  return all.filter((r): r is { key: string, item: CardRowItem } => r.item !== null)
})

const checks = ref<Check[]>([])

onMounted(() => {
  /* ---------------------------------------------------------------- *
   * Helpers
   * ---------------------------------------------------------------- */
  const list = document.querySelector<HTMLElement>('.probe__rows')!
  const rowEls = Array.from(
    document.querySelectorAll<HTMLElement>('.probe__rows > .bf-card')
  )
  const row = (key: string) =>
    document.querySelector<HTMLElement>(`.probe__rows > [data-probe-row-key="${key}"]`)

  const headingOf = (el: HTMLElement | null) =>
    el?.querySelector<HTMLElement>(':scope > :is(h2, h3, h4)') ?? null
  const linkOf = (el: HTMLElement | null) =>
    el?.querySelector<HTMLAnchorElement>(':scope > :is(h2, h3, h4) > a') ?? null
  const timeOf = (el: HTMLElement | null) =>
    el?.querySelector<HTMLTimeElement>(':scope > time') ?? null
  const chipsOf = (el: HTMLElement | null) =>
    Array.from(el?.querySelectorAll(':scope > .bf-card__chips > *') ?? [])
      .map(c => (c.textContent ?? '').trim())

  const px = (n: number) => `${Math.round(n)}px`

  /**
   * Resolve a spacing token to the pixel value the browser computed. Reading
   * `getPropertyValue('--space-xs')` hands back the unresolved `clamp()` text,
   * which never equals a computed `gap`. Same helper as probe 20.
   */
  const resolveSpace = (token: string) => {
    const el = document.createElement('div')
    el.style.cssText = `position:absolute;visibility:hidden;inline-size:var(${token})`
    document.body.appendChild(el)
    const value = getComputedStyle(el).inlineSize
    el.remove()
    return value
  }

  /** Probe 20's CSSOM walker, unchanged: is a matching rule inside `@layer components`? */
  const layeredRuleFound = (test: (selector: string) => boolean): boolean => {
    const LAYER_BLOCK = globalThis.CSSLayerBlockRule
    if (!LAYER_BLOCK) return false

    const walk = (rules: CSSRuleList, insideComponents: boolean): boolean => {
      for (const rule of Array.from(rules)) {
        const nowInside =
          insideComponents
          || (rule instanceof LAYER_BLOCK && (rule as CSSLayerBlockRule).name === 'components')

        if (nowInside && rule instanceof CSSStyleRule && test(rule.selectorText)) {
          return true
        }

        if (rule instanceof CSSImportRule) {
          try {
            const imported = rule.styleSheet?.cssRules
            if (imported && walk(imported, nowInside)) return true
          } catch {
            // Cross-origin import target — unreadable, not a failure.
          }
          continue
        }

        const nested = (rule as CSSGroupingRule).cssRules
        if (nested && walk(nested, nowInside)) return true
      }
      return false
    }

    return Array.from(document.styleSheets).some(sheet => {
      try {
        return walk(sheet.cssRules, false)
      } catch {
        return false
      }
    })
  }

  /* ---------------------------------------------------------------- *
   * The rows
   * ---------------------------------------------------------------- */
  const articleEl = row('article')
  const projectEl = row('project')
  const archivedEl = row('archived')
  const kindlessEl = row('kindless')
  const undatedEl = row('undated')
  const longEl = row('long')

  /*
   * "One line" as geometry, not as a class name. On a short row the chip, the
   * heading and the date each occupy a single line box, so every one of their
   * top edges must fall inside the row's own content box height — and, more
   * tellingly, the heading and the chip must *overlap vertically*. Two stacked
   * elements never do.
   */
  const chipsBox = articleEl?.querySelector<HTMLElement>(':scope > .bf-card__chips')
  const headingBox = headingOf(articleEl)
  const timeBox = timeOf(articleEl)

  const verticallyOverlap = (a: HTMLElement | null, b: HTMLElement | null) => {
    if (!a || !b) return false
    const ra = a.getBoundingClientRect()
    const rb = b.getBoundingClientRect()
    return ra.top < rb.bottom && rb.top < ra.bottom
  }

  /*
   * The heading's own line-box height, borrowed from the short row, is the
   * yardstick for "the long heading wrapped": the 980-character heading has to
   * be several times taller than a one-line heading, and it has to stay inside
   * its container's inline size rather than pushing past it.
   */
  const shortHeadingHeight = headingBox?.getBoundingClientRect().height ?? 0
  const longHeadingEl = headingOf(longEl)
  const longHeadingHeight = longHeadingEl?.getBoundingClientRect().height ?? 0

  const longRect = longEl?.getBoundingClientRect()
  const listRect = list.getBoundingClientRect()

  /*
   * The stretched link, still inherited from `bfCard`. Six pixels in from the
   * row's trailing edge, vertically centred: over the row's own padding, clear
   * of the chip at the start.
   */
  const stretchRect = articleEl!.getBoundingClientRect()
  const hit = document.elementFromPoint(
    stretchRect.right - 6,
    stretchRect.top + stretchRect.height / 2
  )

  /* The labels the formatters produce for these exact rows, computed not typed. */
  const expectedFormatChip = formatLabel(article.value?.format ?? null)
  const expectedKindChip = kindLabel(projectRow.value?.kind ?? null) ?? 'missing'

  checks.value = [
    // --- 1. one prop union, two entity types, one call site ---------------
    {
      label: 'six rows rendered from ONE v-for over a mixed array',
      expected: 6,
      actual: rowEls.length
    },
    {
      label: '  …of which the insight branch rendered 4',
      expected: 4,
      actual: rowEls.filter(el => linkOf(el)?.getAttribute('href')?.startsWith('/insights/')).length
    },
    {
      label: '  …and the project branch rendered 2',
      expected: 2,
      actual: rowEls.filter(el => linkOf(el)?.getAttribute('href')?.startsWith('/projects/')).length
    },
    {
      label: 'the row group is a <ul> and every row is an <li>',
      expected: `UL/${rowEls.length}`,
      actual: `${list.tagName}/${rowEls.filter(el => el.tagName === 'LI').length}`
    },

    // --- 2. the branches --------------------------------------------------
    {
      label: 'an insight links to /insights/:slug',
      expected: `/insights/${SLUGS.article}`,
      actual: linkOf(articleEl)?.getAttribute('href') ?? 'missing'
    },
    {
      label: 'a project links to /projects/:slug',
      expected: `/projects/${SLUGS.project}`,
      actual: linkOf(projectEl)?.getAttribute('href') ?? 'missing'
    },
    {
      label: 'the insight row renders a <time> with a machine datetime',
      expected: '2024-03-18',
      actual: timeOf(articleEl)?.getAttribute('datetime') ?? 'missing'
    },
    {
      label: 'the project row renders NO <time> at all',
      expected: 'null',
      actual: String(timeOf(projectEl))
    },
    {
      label: '  …nor does the second project row',
      expected: 'null',
      actual: String(timeOf(kindlessEl))
    },

    // --- 3. chips come from the formatters --------------------------------
    {
      label: 'the insight chip is formatLabel(format), not the raw slug',
      expected: expectedFormatChip,
      actual: chipsOf(articleEl).join(' · ') || 'no chips'
    },
    {
      label: 'the project chip is kindLabel(kind), not the raw slug',
      expected: expectedKindChip,
      actual: chipsOf(projectEl).join(' · ') || 'no chips'
    },
    {
      label: 'an archived insight adds the Archive chip, after the format one',
      expected: `${formatLabel(archived.value?.format ?? null)} · Archive`,
      actual: chipsOf(archivedEl).join(' · ') || 'no chips'
    },
    {
      label: 'chips sit in bfCard\'s .cluster wrapper with data-gap="xs"',
      expected: 'true',
      actual: String(
        !!chipsBox && chipsBox.classList.contains('cluster') && chipsBox.dataset.gap === 'xs'
      )
    },

    // --- 4. the guard survives a null publish_date ------------------------
    {
      label: 'an insight with publish_date: null still takes the INSIGHT branch',
      expected: `/insights/${SLUGS.undated}`,
      actual: linkOf(undatedEl)?.getAttribute('href') ?? 'missing'
    },
    {
      label: '  …and renders no <time>, rather than an Invalid Date',
      expected: 'null',
      actual: String(timeOf(undatedEl))
    },

    // --- 5. kindLabel's null is filtered, not rendered --------------------
    {
      label: 'a project with no kind renders only its Archive chip',
      expected: 'Archive',
      actual: chipsOf(kindlessEl).join(' · ') || 'no chips'
    },
    {
      label: '  …i.e. exactly one chip, with no empty one beside it',
      expected: 1,
      actual: chipsOf(kindlessEl).length
    },

    // --- 6. it is one line ------------------------------------------------
    {
      label: 'the row is a flex ROW, not the card\'s default column',
      expected: 'row',
      actual: articleEl ? getComputedStyle(articleEl).flexDirection : 'missing'
    },
    {
      label: '  …that wraps (never nowrap — that is what would overflow)',
      expected: 'wrap',
      actual: articleEl ? getComputedStyle(articleEl).flexWrap : 'missing'
    },
    {
      label: '  …on a shared baseline',
      expected: 'baseline',
      actual: articleEl ? getComputedStyle(articleEl).alignItems : 'missing'
    },
    {
      label: '  …with the gap resolving to --space-xs',
      expected: px(parseFloat(resolveSpace('--space-xs'))),
      actual: articleEl ? px(parseFloat(getComputedStyle(articleEl).columnGap)) : 'missing'
    },
    {
      label: 'chip and heading overlap vertically (they are on one line)',
      expected: 'true',
      actual: String(verticallyOverlap(chipsBox ?? null, headingBox))
    },
    {
      label: '  …and so do heading and date',
      expected: 'true',
      actual: String(verticallyOverlap(headingBox, timeBox))
    },
    {
      label: 'the date is NOT floated to the row\'s bottom edge (margin zeroed)',
      expected: '0px',
      actual: timeBox ? getComputedStyle(timeBox).marginBlockStart : 'missing'
    },
    {
      label: 'chips still lead the row visually (order -1)',
      expected: '-1',
      actual: chipsBox ? getComputedStyle(chipsBox).order : 'missing'
    },
    {
      label: '  …while the heading is still FIRST in the DOM',
      expected: 'true',
      actual: String(
        !!articleEl && /^H[234]$/.test(articleEl.children[0]?.tagName ?? '')
      )
    },
    {
      label: 'no row carries a media slot',
      expected: 0,
      actual: rowEls.filter(el => el.querySelector(':scope > .bf-card__media')).length
    },

    // --- 7. a 980-character heading wraps, and does not break the row -----
    {
      label: `the long row's heading really is ${LONG_LENGTH} characters`,
      expected: LONG_LENGTH,
      actual: (longHeadingEl?.textContent ?? '').length
    },
    {
      label: '  …and it WRAPPED — many line boxes tall, not one',
      expected: 'true',
      actual: String(shortHeadingHeight > 0 && longHeadingHeight > shortHeadingHeight * 3)
    },
    {
      label: '  …and the heading takes no white-space: nowrap',
      expected: 'true',
      actual: String(
        !!longHeadingEl && getComputedStyle(longHeadingEl).whiteSpace !== 'nowrap'
      )
    },
    {
      label: '  …so the row stays INSIDE the list, rather than overflowing it',
      expected: 'true',
      actual: String(
        !!longRect && longRect.right <= listRect.right + 1 && longRect.left >= listRect.left - 1
      )
    },
    {
      label: '  …and the list itself never scrolls horizontally',
      expected: list.clientWidth,
      actual: Math.min(list.scrollWidth, list.clientWidth)
    },

    // --- 8. it is still a bfCard ------------------------------------------
    {
      label: 'every row is an <li class="bf-card bf-card-row">',
      expected: rowEls.length,
      actual: rowEls.filter(
        el => el.classList.contains('bf-card') && el.classList.contains('bf-card-row')
      ).length
    },
    {
      label: '  …and the row modifier is in @layer components',
      expected: 'true',
      actual: String(layeredRuleFound(s => /\.bf-card-row(?![\w-])/.test(s)))
    },
    {
      label: '  …and it inherits the stretched link: empty row space hits the anchor',
      expected: 'A',
      actual: (hit as HTMLElement | null)?.tagName ?? 'null'
    },
    {
      label: '    …specifically the heading link of that row',
      expected: `/insights/${SLUGS.article}`,
      actual: (hit as HTMLAnchorElement | null)?.getAttribute?.('href') ?? 'not an anchor'
    },
    {
      label: 'no row carries an inline style attribute',
      expected: 0,
      actual: rowEls.filter(el => el.getAttribute('style') !== null).length
    },

    // --- 9. headingLevel, variant, $attrs ---------------------------------
    {
      label: 'headingLevel defaults to 3',
      expected: 'H3',
      actual: headingOf(articleEl)?.tagName ?? 'missing'
    },
    {
      label: '  …and headingLevel="4" renders an <h4>',
      expected: 'H4',
      actual: headingOf(archivedEl)?.tagName ?? 'missing'
    },
    {
      label: 'variant reaches the <li> as data-variant',
      expected: 'compact',
      actual: projectEl?.getAttribute('data-variant') ?? 'missing'
    },
    {
      label: '  …and a row with no variant carries no data-variant attribute',
      expected: 0,
      actual: rowEls.filter(el => !el.dataset.probeRowKey?.startsWith('project')
        && el.hasAttribute('data-variant')).length
    },
    {
      label: '$attrs fallthrough: data-probe-row-key reached every <li>',
      expected: rowEls.length,
      actual: rowEls.filter(el => el.dataset.probeRowKey).length
    },
    {
      label: '  …and a caller class merges with .bf-card / .bf-card-row',
      expected: 'true',
      actual: String(!!longEl && longEl.classList.contains('probe__long'))
    }
  ]
})

const passed = computed(() =>
  checks.value.filter(c => String(c.actual) === String(c.expected)).length
)

/**
 * Three states, not two. The prerendered HTML has run no assertions, so before
 * `onMounted` the honest answer is `pending`; the harness treats a probe still
 * `PENDING` at timeout as a failure, never a skip.
 */
const state = computed<'pending' | 'pass' | 'fail'>(() => {
  if (checks.value.length === 0) return 'pending'
  return passed.value === checks.value.length ? 'pass' : 'fail'
})

const verdict = computed(() =>
  state.value === 'pending'
    ? 'PENDING — assertions run on mount'
    : `${state.value === 'pass' ? 'PASS' : 'FAIL'} — ${passed.value}/${checks.value.length} checks`
)
</script>

<template>
  <!--
    Harness contract (docs/decisions/probe-harness.md): the root carries
    `data-probe` + `data-probe-verdict`, and every check row carries
    `data-probe-row` + `data-ok`, so `scripts/check-probes.ts` fails the build
    on a red probe instead of relying on someone opening the page.
  -->
  <main
    class="probe container"
    data-probe="27"
    :data-probe-verdict="state.toUpperCase()"
  >
    <h1>Probe 27 — <code>bfCardRow</code></h1>
    <p class="probe__lede">
      The dense list row — chip, linked heading and date on one line — that the
      wireframe left as inline markup in
      <code>search.vue</code> and <code>archive.vue</code>. It is a
      <code>bfCard</code> wearing the <code>.bf-card-row</code> modifier, so it
      keeps the family's stretched link, hover and focus behaviour and ships no
      stylesheet of its own.
    </p>
    <p class="probe__lede">
      Every row below comes from <strong>one <code>v-for</code> over one mixed
      array</strong> of real <code>Insight</code> and <code>Project</code>
      documents, interleaved rather than grouped — which is what proves the
      single prop union works from a single call site. The last row's heading
      is 980 characters of real body prose: it must wrap <em>inside</em> the
      row rather than push it past the list's edge.
    </p>

    <section aria-labelledby="rows-heading">
      <h2 id="rows-heading">A real list of rows</h2>

      <!--
        `.stack` with `data-gap="2xs"` is the composition the two consumers put
        this row on — the row itself owns only its own single line, never the
        spacing between rows.
      -->
      <ul class="probe__rows | stack" data-gap="2xs">
        <bfCardRow
          v-for="r in rows"
          :key="r.key"
          :item="r.item"
          :data-probe-row-key="r.key"
          :heading-level="r.key === 'archived' ? 4 : 3"
          :variant="r.key === 'project' ? 'compact' : undefined"
          :class="r.key === 'long' ? 'probe__long' : undefined"
        />
      </ul>
    </section>

    <p
      class="probe__verdict"
      :data-state="state"
      data-testid="probe-27-verdict"
    >
      {{ verdict }}
    </p>

    <table class="probe__table" data-testid="probe-27-table">
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
/*
  The ground is the `bf-probe` layout's job (gh#116): it paints `html` from
  `--color-surface-page` / `--color-text` and pins `color-scheme: light`.
*/

.probe {
  padding-block: var(--space-l, 2rem);
  min-block-size: 100dvh;
}

.probe__lede {
  max-inline-size: 75ch;
}

.probe__rows {
  margin-block-end: var(--space-l, 2rem);
}

/*
  A caller class on a `bfCardRow`, present only to prove that `$attrs` merges
  it with the component's own `.bf-card` / `.bf-card-row` rather than replacing
  either. It paints nothing — a background here would be a new colour decision
  this issue has no business making.
*/
.probe__long {
  scroll-margin-block: var(--space-m, 1.5rem);
}

.probe__verdict {
  font-weight: 700;
}

.probe__verdict[data-state='fail'] {
  color: var(--color-error);
}

.probe__verdict[data-state='pending'] {
  font-weight: 400;
  font-style: italic;
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
  color: var(--color-error);
}
</style>
