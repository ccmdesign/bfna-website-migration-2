<script setup lang="ts">
/**
 * Probe 40 — `bfCtaSection` (issue 40, gh#49).
 *
 * Five cases. Three of them are the **real** call-site shapes lifted out of
 * `pages/wireframes/projects/[slug].vue` — the Microsite CTA band, and the
 * Participation path band as it appears on the microsite template and on the
 * full template — rendered from fixtures alone, which is the spec's headline
 * acceptance. The fourth is a mixed list that exercises the internal-`to`
 * branch and a `primary` override, neither of which the three real shapes
 * reach. The fifth is heading-only: no message, no actions.
 *
 * The load-bearing row is the negative one. D2 killed the email-capture
 * variant, so this page asserts that the rendered document contains no
 * `<form>` element and no `type="email"` input — read off the live DOM *and*
 * off the serialised HTML, which is what the prerendered file the spec greps
 * actually contains.
 *
 * ### On the spec's own `grep -Lq` lines (D-37.5)
 *
 * The spec's acceptance block writes `grep -Lq "form" src/…/CtaSection.vue`.
 * `-L` prints the names of files *without* a match and exits 0 whenever the
 * file is readable, so that command passes whether or not the word is present:
 * it cannot fail, in either direction. The runner substituted correct-polarity
 * `grep -c` assertions at the shell and these runtime rows in the browser.
 * Recorded in the spec's Decisions.
 */
import type { Cta } from '~/types/bf-contracts'

defineOptions({ name: 'BfProbe40BfCtaSection' })
definePageMeta({ layout: 'bf-probe' })

useHead({
  title: 'bf-probe 40 — bfCtaSection'
})

interface Check {
  label: string
  expected: string | number
  actual: string | number
}

interface ProbeCase {
  key: string
  label: string
  note: string
}

const CASES: ProbeCase[] = [
  {
    key: 'microsite',
    label: 'Microsite CTA',
    note: 'real call site 1 — heading + message + one external CTA (`href` + `external`)'
  },
  {
    key: 'participation-microsite',
    label: 'Participation path',
    note: 'real call site 2 — heading + three label-only CTAs, no message'
  },
  {
    key: 'participation-full',
    label: 'Participation path',
    note: 'real call site 3 — the same shape on the full template, two label-only CTAs'
  },
  {
    key: 'mixed',
    label: 'Mixed actions',
    note: 'internal `to` + external `href` + a `primary` override on the third entry'
  },
  {
    key: 'bare',
    label: 'Heading only',
    note: 'no message and no ctas — neither the <p> nor the .cluster renders'
  }
]

/**
 * `projects/[slug].vue` passes `:message="project.microsite_cta ?? undefined"`.
 * This is one of those strings, shortened; its only job here is to be prose
 * long enough for the measure cap to bite.
 */
const MICROSITE_MESSAGE
  = 'The Innovation and Policy Network runs its own site, where the cohort '
    + 'directory, the working papers and the application calendar live in full.'

const HEADINGS: Record<string, string> = {
  'microsite': 'Explore the full project',
  'participation-microsite': 'How to take part',
  'participation-full': 'How to take part',
  'mixed': 'Work with us',
  'bare': 'Nothing to do here'
}

const EXTERNAL_URL = 'https://www.innovation-policy-network.org/'

/** Real call site 1: `[{ label: \`Visit ${project.heading}\`, href, external: true }]`. */
const MICROSITE_CTAS: Cta[] = [
  { label: 'Visit Innovation & Policy Network', href: EXTERNAL_URL, external: true }
]

/**
 * Real call sites 2 and 3: `participation.ctas.map(label => ({ label }))` —
 * label only, neither `to` nor `href`. See `CtaSection.vue` for why those
 * resolve to `<button>` here rather than to the wf source's `<a href="#">`.
 */
const PARTICIPATION_MICROSITE_CTAS: Cta[] = [
  'Apply to the 2026 cohort',
  'Nominate a fellow',
  'Read the selection criteria'
].map(label => ({ label }))

const PARTICIPATION_FULL_CTAS: Cta[] = [
  'Join the next convening',
  'Subscribe to the project brief'
].map(label => ({ label }))

/**
 * The two branches the real three do not reach: an internal route, and an
 * override that promotes an entry other than the first.
 */
const MIXED_CTAS: Cta[] = [
  { label: 'Browse the insights', to: '/insights' },
  { label: 'Read the annual report', href: EXTERNAL_URL, external: true },
  { label: 'Contact the team', to: '/about', primary: true }
]

const CTAS: Record<string, Cta[]> = {
  'microsite': MICROSITE_CTAS,
  'participation-microsite': PARTICIPATION_MICROSITE_CTAS,
  'participation-full': PARTICIPATION_FULL_CTAS,
  'mixed': MIXED_CTAS,
  'bare': []
}

/**
 * Prop names that must never reach the DOM as attributes. `bfCtaSection` mounts
 * `bfSection` as its single root and `bfSection` filters `$attrs` to an
 * allow-list, so any of these appearing on the `<section>` means the filter
 * regressed — or that a prop of this component leaked through it.
 */
const PROP_ATTRIBUTE_SPELLINGS = [
  'label', 'heading', 'message', 'ctas',
  'gap', 'padded', 'layout', 'measure', 'fullwidth', 'full-width', 'variant'
]

/*
  The three literals the D2 rows hunt for, assembled rather than written out.
  Written out they would appear in this file's compiled JS — harmless — but the
  temptation is then to write them into a row label too, which really would
  plant them in the rendered HTML the next row reads.
*/
const FORM_OPEN = `<${'form'}`
const EMAIL_ATTR_DQ = `type="${'email'}"`
const EMAIL_ATTR_SQ = `type='${'email'}'`

/** D-20.5: every `:not()` in a `bf-*` rule whose argument is a complex selector. */
const complexNotSelectors = (): string[] => {
  const found: string[] = []

  const walk = (rules: CSSRuleList) => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule && rule.selectorText.includes('.bf-')) {
        for (const m of rule.selectorText.matchAll(/:not\(([^()]*)\)/g)) {
          const inner = (m[1] ?? '').trim()
          if (/[\s>+~]/.test(inner)) found.push(rule.selectorText)
        }
      }
      if (rule instanceof CSSImportRule) {
        try {
          if (rule.styleSheet) walk(rule.styleSheet.cssRules)
        } catch {
          // Cross-origin import target — unreadable, not a failure.
        }
        continue
      }
      const nested = (rule as CSSGroupingRule).cssRules
      if (nested) walk(nested)
    }
  }

  for (const sheet of Array.from(document.styleSheets)) {
    try {
      walk(sheet.cssRules)
    } catch {
      // Cross-origin sheet.
    }
  }

  return found
}

/**
 * Every rule anywhere in the loaded CSS that selects on `bf-cta-section`.
 *
 * Expected to be **none**: the component ships no `<style>` block at all, which
 * is the strongest available statement of the spec's "no new CSS variables
 * beyond `bfSection`'s and `bfButton`'s existing hooks".
 */
const ctaSectionRules = (): string[] => {
  const found: string[] = []

  const walk = (rules: CSSRuleList) => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule && rule.selectorText.includes('bf-cta-section')) {
        found.push(rule.selectorText)
      }
      if (rule instanceof CSSImportRule) {
        try {
          if (rule.styleSheet) walk(rule.styleSheet.cssRules)
        } catch {
          // Cross-origin import target.
        }
        continue
      }
      const nested = (rule as CSSGroupingRule).cssRules
      if (nested) walk(nested)
    }
  }

  for (const sheet of Array.from(document.styleSheets)) {
    try {
      walk(sheet.cssRules)
    } catch {
      // Cross-origin sheet.
    }
  }

  return found
}

interface Snapshot {
  key: string
  found: boolean
  rootTag: string
  rootClasses: string
  dataLabel: string
  inlineStyle: boolean
  innerClasses: string
  innerGap: string
  h2Count: number
  h2Text: string
  messageCount: number
  messageText: string
  messageMeasure: string
  clusterCount: number
  clusterClasses: string
  clusterGapAttr: string
  clusterGapPx: number
  buttonCount: number
  buttonLabels: string
  variants: string
  elements: string
  tags: string
  hrefs: string
  externals: string
  order: string
  leakedAttrs: string
}

const snaps = reactive<Snapshot[]>([])
const checks = ref<Check[]>([])

const rootFor = (key: string): HTMLElement | null =>
  document.querySelector<HTMLElement>(`.bf-cta-section[data-probe-case="${key}"]`)

const kindOf = (el: Element): string => {
  if (el.matches('h2')) return 'h2'
  if (el.matches('p.bf-cta-section__message')) return 'message'
  if (el.matches('.bf-cta-section__actions')) return 'actions'
  return 'other'
}

const snapshot = (key: string): Snapshot => {
  const root = rootFor(key)
  const inner = root?.firstElementChild as HTMLElement | null
  const messages = Array.from(root?.querySelectorAll<HTMLElement>('p.bf-cta-section__message') ?? [])
  const clusters = Array.from(root?.querySelectorAll<HTMLElement>('.bf-cta-section__actions') ?? [])
  const cluster = clusters[0] ?? null
  const clusterStyle = cluster ? getComputedStyle(cluster) : null
  const buttons = Array.from(root?.querySelectorAll<HTMLElement>('.bf-button') ?? [])
  const h2s = Array.from(root?.querySelectorAll('h2') ?? [])

  return {
    key,
    found: root !== null,
    rootTag: root?.tagName.toLowerCase() ?? 'missing',
    rootClasses: root ? Array.from(root.classList).sort().join(' ') : 'no root',
    dataLabel: root?.getAttribute('data-label') ?? 'absent',
    inlineStyle: root !== null && root.style.cssText.trim() !== '',
    innerClasses: inner ? Array.from(inner.classList).sort().join(' ') : 'no inner box',
    innerGap: inner?.getAttribute('data-gap') ?? 'absent',
    h2Count: h2s.length,
    h2Text: (h2s[0]?.textContent ?? '').trim(),
    messageCount: messages.length,
    messageText: messages.map(p => (p.textContent ?? '').trim().slice(0, 24)).join('|'),
    messageMeasure: messages.map(p => p.getAttribute('data-measure') ?? 'absent').join('|') || 'none',
    clusterCount: clusters.length,
    clusterClasses: cluster ? Array.from(cluster.classList).sort().join(' ') : 'no cluster',
    clusterGapAttr: cluster?.getAttribute('data-gap') ?? 'absent',
    clusterGapPx: clusterStyle ? Number.parseFloat(clusterStyle.columnGap) : -1,
    buttonCount: buttons.length,
    buttonLabels: buttons.map(b => (b.textContent ?? '').trim()).join('|'),
    variants: buttons.map(b => b.getAttribute('data-variant') ?? 'absent').join(','),
    elements: buttons.map(b => b.getAttribute('data-element') ?? 'absent').join(','),
    tags: buttons.map(b => b.tagName.toLowerCase()).join(','),
    hrefs: buttons.map(b => b.getAttribute('href') ?? 'none').join(','),
    externals: buttons.map(b => (b.hasAttribute('data-external') ? 'yes' : 'no')).join(','),
    order: inner ? Array.from(inner.children).map(kindOf).join(',') : 'no inner box',
    leakedAttrs: root
      ? Array.from(root.attributes)
          .map(a => a.name.toLowerCase())
          .filter(n => PROP_ATTRIBUTE_SPELLINGS.includes(n))
          .join(' ')
      : 'missing'
  }
}

const snapFor = (key: string): Snapshot | undefined => snaps.find(s => s.key === key)

/** One reading across all five cases, comma-joined. */
const across = (read: (s: Snapshot) => string | number | boolean): string =>
  CASES.map((c) => {
    const s = snapFor(c.key)
    return s === undefined ? '?' : String(read(s))
  }).join(',')

let walking = false
let reported = false
const seen = reactive({ timedOut: false })

const settle = (): Promise<void> => nextTick()

const finalise = async () => {
  if (walking) return
  walking = true
  await settle()
  for (const c of CASES) snaps.push(snapshot(c.key))
  report()
}

const report = () => {
  if (reported) return
  reported = true

  const micro = snapFor('microsite')
  const partA = snapFor('participation-microsite')
  const partB = snapFor('participation-full')
  const mixed = snapFor('mixed')
  const bare = snapFor('bare')

  const measureRef = document.querySelector<HTMLElement>('[data-probe-ref-measure]')
  const expectedMeasure = measureRef ? getComputedStyle(measureRef).maxInlineSize : 'no reference'
  const messageEl = document.querySelector<HTMLElement>(
    '.bf-cta-section[data-probe-case="microsite"] p.bf-cta-section__message'
  )

  /*
    The D2 deletion, read two ways. The live DOM answers "did anything render
    one"; the serialised HTML is the same string the spec greps out of
    `.output/public/bf-probe/40-bf-cta-section/index.html`, so a case the DOM
    query somehow missed still fails here.
  */
  const html = document.documentElement.outerHTML
  const liveEmailish = document.querySelectorAll('form, input[type="email"]').length

  /* The external marker, read as the affordance rather than as the attribute. */
  const externalAnchor = document.querySelector<HTMLElement>(
    '.bf-cta-section[data-probe-case="microsite"] a.bf-button[data-external]'
  )
  const markerContent = externalAnchor
    ? getComputedStyle(externalAnchor, '::after').content
    : 'no external anchor'

  const internalAnchor = document.querySelector<HTMLAnchorElement>(
    '.bf-cta-section[data-probe-case="mixed"] a.bf-button[data-element="link"]'
  )

  const badNots = complexNotSelectors()
  const ownRules = ctaSectionRules()

  checks.value = [
    // --- 0. did the walk actually run? -------------------------------------
    {
      label: 'the walk completed, rather than being rescued by the timeout',
      expected: 'false',
      actual: String(seen.timedOut)
    },
    {
      label: '  …reading every one of the five cases',
      expected: CASES.length,
      actual: snaps.length
    },
    {
      label: 'every case mounted a band',
      expected: CASES.map(() => true).join(','),
      actual: across(s => s.found)
    },

    // --- 1. the D2 deletion — the spec’s headline acceptance ----------------
    {
      /*
        No angle bracket and no quoted attribute in any of these three rows'
        strings, on purpose: a row's label is rendered into the page, so writing
        the very literal the row hunts for would plant it in the HTML the next
        row reads. `report()` snapshots `outerHTML` before assigning
        `checks.value`, so it would not actually fail — but a check that depends
        on that ordering is one refactor away from lying.
      */
      label: 'NO email-capture markup anywhere in the live DOM (D2)',
      expected: 0,
      actual: liveEmailish
    },
    {
      label: '  …nor in the serialised HTML the spec greps',
      expected: 'clean|clean',
      actual: [
        html.includes(FORM_OPEN) ? 'HAS-A-CAPTURE-ELEMENT' : 'clean',
        html.includes(EMAIL_ATTR_DQ) || html.includes(EMAIL_ATTR_SQ)
          ? 'HAS-AN-EMAIL-INPUT'
          : 'clean'
      ].join('|')
    },
    {
      label: '  …and no band renders a submit control of any kind',
      expected: 0,
      actual: document.querySelectorAll('.bf-cta-section [type="submit"]').length
    },

    // --- 2. the bfSection composition --------------------------------------
    {
      label: 'the root is bfSection’s <section>, carrying both class names',
      expected: CASES.map(() => ['bf-cta-section', 'bf-section'].sort().join(' '))
        .map(c => `section|${c}`).join(','),
      actual: across(s => `${s.rootTag}|${s.rootClasses}`)
    },
    {
      label: '  …unpadded, and with no inline style — `padded` is not passed',
      expected: 'false,false,false,false,false',
      actual: across(s => s.inlineStyle)
    },
    {
      label: '`label` reaches the root as data-label, default included',
      expected: [
        'Microsite CTA', 'Participation path', 'Participation path',
        'Mixed actions', 'CTA'
      ].join(','),
      actual: across(s => s.dataLabel)
    },
    {
      label: 'the inner box is bfSection’s `center | stack`',
      expected: CASES.map(() => ['center', '|', 'stack'].sort().join(' ')).join(','),
      actual: across(s => s.innerClasses)
    },
    {
      label: '  …at gap="s", which is what wfCtaSection passes',
      expected: 's,s,s,s,s',
      actual: across(s => s.innerGap)
    },
    {
      label: '`heading` renders exactly one <h2> per band, verbatim',
      expected: CASES.map(c => `1|${HEADINGS[c.key]}`).join(','),
      actual: across(s => `${s.h2Count}|${s.h2Text}`)
    },
    {
      label: 'no prop name leaks onto the DOM as an attribute',
      expected: ',,,,',
      actual: across(s => s.leakedAttrs)
    },

    // --- 3. the message paragraph ------------------------------------------
    {
      label: 'one <p> when `message` is given, none when it is not',
      expected: '1,0,0,1,0',
      actual: across(s => s.messageCount)
    },
    {
      label: '  …carrying the message verbatim',
      expected: MICROSITE_MESSAGE.slice(0, 24),
      actual: micro?.messageText ?? 'missing'
    },
    {
      label: '  …with data-measure="normal"',
      expected: 'normal',
      actual: micro?.messageMeasure ?? 'missing'
    },
    {
      label: '  …and that really caps the line length, at a bare reference’s value',
      expected: expectedMeasure,
      actual: messageEl ? getComputedStyle(messageEl).maxInlineSize : 'missing'
    },

    // --- 4. the actions row -------------------------------------------------
    {
      label: 'a `.cluster` renders only when there are ctas',
      expected: '1,1,1,1,0',
      actual: across(s => s.clusterCount)
    },
    {
      label: '  …as `.cluster`, with data-gap="s" — wfCtaSection’s row',
      expected: ['bf-cta-section__actions', 'cluster'].sort().join(' '),
      actual: micro?.clusterClasses ?? 'missing'
    },
    {
      label: '  …the gap attribute on all four rows that render',
      expected: 's,s,s,s',
      actual: [
        micro?.clusterGapAttr, partA?.clusterGapAttr,
        partB?.clusterGapAttr, mixed?.clusterGapAttr
      ].join(',')
    },
    {
      label: '  …resolved by @layer composition to a real gap',
      expected: 'true,true,true,true',
      actual: [
        (micro?.clusterGapPx ?? 0) > 0, (partA?.clusterGapPx ?? 0) > 0,
        (partB?.clusterGapPx ?? 0) > 0, (mixed?.clusterGapPx ?? 0) > 0
      ].join(',')
    },
    {
      label: 'one bfButton per cta entry, in order',
      expected: CASES.map(c => (CTAS[c.key] ?? []).length).join(','),
      actual: across(s => s.buttonCount)
    },
    {
      label: '  …labelled from the entries',
      expected: CASES.map(c => (CTAS[c.key] ?? []).map(x => x.label).join('|')).join(','),
      actual: across(s => s.buttonLabels)
    },

    // --- 5. which one is primary -------------------------------------------
    {
      label: 'the FIRST cta is primary, the rest default',
      expected: 'primary / primary,default,default / primary,default',
      actual: [micro?.variants, partA?.variants, partB?.variants].join(' / ')
    },
    {
      label: '  …unless an entry overrides it — mixed promotes its third',
      expected: 'primary,default,primary',
      actual: mixed?.variants ?? 'missing'
    },

    // --- 6. which element each cta resolves to ------------------------------
    {
      label: '`href` + `external` → an <a>, and it carries [data-external]',
      expected: 'a|anchor|yes',
      actual: [micro?.tags, micro?.elements, micro?.externals].join('|')
    },
    {
      label: '  …and the ↗ affordance really paints, from a[data-external]::after',
      expected: 'true',
      actual: String(markerContent.includes('↗'))
    },
    {
      label: '`to` → a NuxtLink-backed <a href="/…">, not a <button>',
      expected: 'a|link|/insights',
      actual: internalAnchor
        ? [
            internalAnchor.tagName.toLowerCase(),
            internalAnchor.getAttribute('data-element'),
            internalAnchor.getAttribute('href')
          ].join('|')
        : 'no internal anchor'
    },
    {
      label: '  …and the mixed band’s three entries resolve link / anchor / link',
      expected: 'a,a,a|link,anchor,link|/insights,' + EXTERNAL_URL + ',/about',
      actual: [mixed?.tags, mixed?.elements, mixed?.hrefs].join('|')
    },
    {
      label: 'a label-only cta resolves to <button>, never <a href="#"> (see the source note)',
      expected: 'button,button,button|button,button|no,no,no',
      actual: [partA?.tags, partB?.tags, partA?.externals].join('|')
    },
    {
      label: '  …and [data-external] appears on anchors only, never on a button',
      expected: 0,
      actual: document.querySelectorAll('.bf-cta-section button[data-external]').length
    },

    // --- 7. render order ----------------------------------------------------
    {
      label: 'render order is h2 → message → actions',
      expected: [
        'h2,message,actions',
        'h2,actions',
        'h2,actions',
        'h2,message,actions',
        'h2'
      ].join(' / '),
      actual: CASES.map(c => snapFor(c.key)?.order ?? 'missing').join(' / ')
    },
    {
      label: 'the heading-only band renders neither a <p> nor a row',
      expected: '0|0',
      actual: `${bare?.messageCount ?? -1}|${bare?.clusterCount ?? -1}`
    },

    // --- 8. styling: none of its own ---------------------------------------
    {
      label: 'the component ships no stylesheet — no rule anywhere selects bf-cta-section',
      expected: 0,
      actual: ownRules.length === 0 ? 0 : ownRules.join(' ; ')
    },
    {
      label: 'no bf-* rule uses :not() with a complex selector (D-20.5)',
      expected: 0,
      actual: badNots.length === 0 ? 0 : badNots.join(' ; ')
    }
  ]
}

onMounted(() => {
  void finalise()
  setTimeout(() => {
    if (reported) return
    seen.timedOut = true
    report()
  }, 6000)
})

const passed = computed(() =>
  checks.value.filter(c => String(c.actual) === String(c.expected)).length
)

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
  <main
    class="probe"
    data-probe="40"
    :data-probe-verdict="state.toUpperCase()"
  >
    <h1 class="probe__title">
      Probe 40 — <code>bfCtaSection</code>
    </h1>
    <p class="probe__lede">
      Five bands. Three are the real call-site shapes from
      <code>pages/wireframes/projects/[slug].vue</code> — the Microsite CTA and
      the Participation path on both templates — rendered from fixtures alone.
      The fourth mixes an internal route, an external URL and a
      <code>primary</code> override; the fifth is heading-only. The load-bearing
      row is the negative one: D2 killed the email-capture variant, so nothing
      on this page may be a <code>&lt;form&gt;</code> or an email input.
    </p>

    <!--
      The measure reference is a `<p>`, not a `<div>`: `data-measure` resolves to
      a `ch` value, which is font-relative, so the reference has to share the
      message paragraph's font — `base/typography.css` gives `p` its own
      `font-size` and weight that a bare `<div>` would not inherit. Probe 38's
      note, same trap.
    -->
    <p data-measure="normal" data-probe-ref-measure aria-hidden="true" />

    <section class="probe__gallery" aria-labelledby="cases-heading">
      <h2 id="cases-heading">The five bands</h2>

      <!-- 1 — real call site: Microsite CTA -->
      <bfCtaSection
        label="Microsite CTA"
        :heading="HEADINGS['microsite']"
        :message="MICROSITE_MESSAGE"
        :ctas="CTAS['microsite']"
        data-probe-case="microsite"
      />

      <!-- 2 — real call site: Participation path, microsite template -->
      <bfCtaSection
        label="Participation path"
        :heading="HEADINGS['participation-microsite']"
        :ctas="CTAS['participation-microsite']"
        data-probe-case="participation-microsite"
      />

      <!-- 3 — real call site: Participation path, full template -->
      <bfCtaSection
        label="Participation path"
        :heading="HEADINGS['participation-full']"
        :ctas="CTAS['participation-full']"
        data-probe-case="participation-full"
      />

      <!-- 4 — internal route, external URL, and a primary override -->
      <bfCtaSection
        label="Mixed actions"
        :heading="HEADINGS['mixed']"
        :message="MICROSITE_MESSAGE"
        :ctas="CTAS['mixed']"
        data-probe-case="mixed"
      />

      <!-- 5 — heading only: no `label` either, so the default lands -->
      <bfCtaSection
        :heading="HEADINGS['bare']"
        data-probe-case="bare"
      />
    </section>

    <section class="probe__report" aria-labelledby="report-heading">
      <h2 id="report-heading">Report</h2>
      <p
        class="probe__verdict"
        :data-state="state"
        data-testid="probe-40-verdict"
      >
        {{ verdict }}
      </p>

      <table class="probe__table" data-testid="probe-40-table">
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

      <ul class="probe__legend">
        <li v-for="c in CASES" :key="c.key">
          <code>{{ c.key }}</code> — {{ c.note }}
        </li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
.probe {
  padding-block: var(--space-l, 2rem);
  min-block-size: 100dvh;
  overflow-x: clip;
}

.probe__title {
  font-size: var(--size-3, 1.75rem);
  font-weight: 700;
}

/*
  Selected as `.bf-section` rather than `.bf-cta-section`: the report asserts
  that **no rule anywhere** selects `bf-cta-section`, and a scoped rule here
  would be found by that walker and read as the component having grown a
  stylesheet. The roots carry both class names, so this frames the same five
  elements without touching the name under test.
*/
.probe__gallery > .bf-section {
  outline: 1px dashed currentcolor;
  outline-offset: -1px;
}

.probe__lede {
  max-inline-size: 75ch;
}
</style>
