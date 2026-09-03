<script setup lang="ts">
/**
 * Probe — issue 45 / gh#54: `bfProse`.
 *
 * Dev-only route, never linked from nav. Kept in place for later issues to
 * regression-check against; only the final cutover issue removes `bf-probe/`.
 *
 * ## The six bodies, and why each is on the page
 *
 * | case | body | what it settles |
 * |---|---|---|
 * | `markdown` | `##`, `###`, `- `, `* `, paragraphs, every inline mark | the markdown-lite path, and the mark stripper |
 * | `legacy` | Directus-era HTML with a rank-1 heading, `<br>`, `<strong>`, `<a>`, `&amp;`, `&nbsp;` | the legacy **strip** path, the entity decode, and the rank-1 case by construction |
 * | `empty` | `''` | that an absent body renders **nothing** (#186) |
 * | `nullish` | `null` | the same, from the other nullish value |
 * | `long` | a real 476-character excerpt, `measure="narrow"` | the cap, measured |
 * | `uncapped` | the same excerpt, `measure="full"` | the reference width to measure it against |
 *
 * Every one of them is mounted inside its own `bfSection`, because the cap
 * under test is the **caller's** and a probe that applied it itself would be
 * measuring its own markup.
 *
 * ## The legacy path is a strip, not a translation
 *
 * This is the single most misread thing about the ported parser, so the probe
 * states it rather than glossing it: the legacy pre-pass turns block *closers*
 * into newlines and then deletes **every** tag. A legacy `<h2>` therefore
 * arrives at the line loop as bare text with no marker, and the loop — which
 * only knows `##`, `###` and `- `/`* ` — makes it a paragraph. So a legacy body
 * renders as a run of paragraphs, one per former block, and its `<li>`s become
 * paragraphs too. That is `wfProse`'s behaviour today, it is what "port
 * verbatim" means, and the rows below assert it by value instead of asserting a
 * structure the parser never produced. (It is also why the constraint this
 * issue is named for holds so cheaply: the rank-1 *element* is deleted by the
 * strip before anything downstream could re-emit it.)
 *
 * ## What it proves
 *
 *  1. **The markdown-lite path parses to the frozen `wfProse` block sequence**
 *     — `h2,p,ul,p,ul,h3,p` — with the two list runs grouped and separated by
 *     the paragraph between them.
 *  2. **Every inline mark is stripped**: `**bold**`, `*italic*`, `` `code` ``
 *     and `[label](url)` all reduce to their text, the URL dropped. Asserted on
 *     rendered `textContent`, so a mark that survived as markup fails here
 *     rather than passing the eye.
 *  3. **The legacy path flattens to eight paragraphs**, and its entities are
 *     decoded — `&amp;` to `&`, `&nbsp;` to a plain U+0020 and not U+00A0 (the
 *     ported replacer writes `' '`). The nbsp row reads the **raw**
 *     `textContent`, because collapsing whitespace first would hide exactly the
 *     character it is looking for.
 *  4. **No rank-1 heading is emitted, by either path**, and the whole document
 *     holds exactly **one** — this page's own title. The generated HTML is
 *     checked the same way by the acceptance command, counting *occurrences*
 *     with `grep -o … | wc -l` rather than lines with `grep -c` (D-37.5: one
 *     minified line makes `grep -c` report 1 for any number of headings).
 *  5. **Neither nullish body renders anything** — no `[body copy]`
 *     placeholder, no empty `<p>`, just the childless `.stack` root. That is
 *     residual #186, decided in gh#61 for every template at once: 97 of the 354
 *     `bfInsights` rows and 3 `bfProjects` rows store a null body, and the
 *     placeholder ported from `wfProse` was reaching readers on all of them.
 *     The frozen `wfProse` keeps its own placeholder (D2); the two renderers
 *     differ here on purpose.
 *  6. **The line length is capped, and capped at 60ch** — measured three ways
 *     that must agree: the band's resolved `max-inline-size` equals a live
 *     `60ch` ruler laid inside the same band, the prose fills that box exactly,
 *     and the same excerpt in a `measure="full"` band is strictly wider.
 *  7. **The component sets no `data-measure`** on its root or below it, so the
 *     cap can only have come from the caller.
 *  8. `$attrs` reaches the root and merges with its class, the component emits
 *     no inline `style`, **no rule anywhere selects `bf-prose`** (the honest
 *     form of "it ships no stylesheet" — a `<style scoped>` added later shows
 *     up here), and no `bf-*` rule on the page uses `:not()` with a complex
 *     selector (D-20.5).
 *
 * The vitest harness on `dev` is broken and pre-existing (residual #86), so
 * acceptance is this page under `npx tsx scripts/check-probes.ts --only 45`,
 * per the gh#20–#53 precedent and the #109 harness decision. Recorded in the
 * spec's Decisions section.
 */
defineOptions({ name: 'BfProbe45BfProse' })

definePageMeta({ layout: 'bf-probe' })

useHead({
  title: 'bf-probe 45 — bfProse'
})

/** One asserted value: what it is, what it must be, what it actually is. */
interface Check {
  label: string
  expected: string | number
  actual: string | number
}

/**
 * The markdown-lite body. Real BFNA copy, not lorem (BRIEF §5 rule 10).
 *
 * **One line per block, deliberately.** The parser splits on `/\n+/`, so a
 * soft-wrapped paragraph would become two paragraphs — true of the frozen
 * source and not a defect, but a fixture that tripped over it would be
 * measuring the fixture's line breaks rather than the parser's rules.
 */
const MARKDOWN = [
  '## Why transatlantic cooperation still matters',
  '',
  'The **Bertelsmann Foundation North America** works on the questions that outlast an election cycle.',
  '',
  '- Democracy and its institutions',
  '- Transatlantic relations and global challenges',
  '',
  'Each programme runs its own projects, with its own partners.',
  '',
  '* Future leadership',
  '',
  '### How the work is published',
  '',
  'Read the [full report](https://www.bfna.org/research) for the *complete* methodology, or call the `bfInsights` collection directly.'
].join('\n')

/**
 * The legacy-HTML body — the shape the Directus-era fields actually hold.
 *
 * The rank-1 heading is deliberate and is the point of this fixture: it is the
 * only way to prove "no rank-1 heading escapes" against the path that could
 * produce one, rather than to assert it about a body that never had one.
 * `&amp;` and `&nbsp;` are both present, and `<strong>` and `<a>` are nested
 * inside a paragraph so the strip is exercised below the block level too.
 */
const LEGACY = [
  '<h1>Democracy &amp; its institutions</h1>',
  '<p>A programme of the <strong>Bertelsmann&nbsp;Foundation</strong>, ',
  'published at <a href="https://www.bfna.org">bfna.org</a>.</p>',
  '<h2>Recent work</h2>',
  '<ul><li>Digital policy &amp; platform governance</li>',
  '<li>Election integrity</li></ul>',
  '<h3>Contact</h3>',
  '<p>Write to the team.<br>We answer every note.</p>'
].join('')

/**
 * A real excerpt in the middle of the range the brief names (100–980 chars), so
 * the measured cap is read off a paragraph that actually reaches it rather than
 * off a short line that would fit under any measure.
 */
const LONG = 'The Bertelsmann Foundation North America is a private, non-partisan '
  + 'operating foundation working to strengthen the transatlantic relationship. '
  + 'Through research, analysis, forums and creative content it engages '
  + 'policymakers, business leaders and the wider public on the questions the '
  + 'United States and Europe face together: the governance of digital platforms, '
  + 'the integrity of elections, the energy transition, and the shape of the next '
  + 'generation of transatlantic leadership.'

/** The tag sequence the frozen `wfProse` produces for `MARKDOWN`, written out. */
const MARKDOWN_TAGS = 'h2,p,ul,p,ul,h3,p'

/**
 * …and for `LEGACY`: eight paragraphs, because the strip deletes every tag
 * before the line loop runs. See the header note.
 */
const LEGACY_TAGS = 'p,p,p,p,p,p,p,p'

/** The bands on the page, keyed by `data-probe-case`. */
const CASES = [
  { key: 'markdown', note: 'markdown-lite body, narrow band' },
  { key: 'legacy', note: 'legacy-HTML body opening with a rank-1 heading, narrow band' },
  { key: 'empty', note: 'content="" — renders nothing (#186)' },
  { key: 'nullish', note: ':content="null" — the same, from null' },
  { key: 'long', note: 'real excerpt, measure="narrow" — the measured cap' },
  { key: 'uncapped', note: 'the same excerpt, measure="full" — the reference width' }
] as const

/**
 * Every `.bf-*` selector on the page that uses `:not()` with anything but a
 * simple selector list (D-20.5). Checked against the **emitted** CSS rather
 * than the source it was written in, because the defect is in the emitting.
 */
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
 * Every rule anywhere in the loaded CSS that selects `bf-prose`, with the layer
 * it was found in.
 *
 * The component ships no stylesheet, so the honest assertion is that this list
 * is **empty** — not that its members are correctly layered.
 */
const proseRules = (): { selector: string, layer: string }[] => {
  const LAYER_BLOCK = globalThis.CSSLayerBlockRule
  const found: { selector: string, layer: string }[] = []

  const walk = (rules: CSSRuleList, layer: string) => {
    for (const rule of Array.from(rules)) {
      const nowLayer
        = LAYER_BLOCK && rule instanceof LAYER_BLOCK
          ? ((rule as CSSLayerBlockRule).name || '(anonymous)')
          : layer

      if (rule instanceof CSSStyleRule && rule.selectorText.includes('bf-prose')) {
        found.push({ selector: rule.selectorText, layer: nowLayer })
      }

      if (rule instanceof CSSImportRule) {
        try {
          if (rule.styleSheet) walk(rule.styleSheet.cssRules, nowLayer)
        } catch {
          // Cross-origin import target.
        }
        continue
      }

      const nested = (rule as CSSGroupingRule).cssRules
      if (nested) walk(nested, nowLayer)
    }
  }

  for (const sheet of Array.from(document.styleSheets)) {
    try {
      walk(sheet.cssRules, 'unlayered')
    } catch {
      // Cross-origin sheet.
    }
  }
  return found
}

/**
 * One tick — a re-render, and nothing else to wait for.
 *
 * Deliberately not `requestAnimationFrame`: rAF is throttled to a near stop in
 * a backgrounded or embedded browser view, and a walk that awaits a frame that
 * never arrives leaves the verdict `PENDING` for ever (probe 33's note, and the
 * zero-width-viewport case in `docs/decisions/probe-harness.md`).
 */
const settle = (): Promise<void> => nextTick()

const proseOf = (key: string): HTMLElement | null =>
  document.querySelector<HTMLElement>(`.bf-prose[data-probe-case="${key}"]`)

/**
 * The block-level children of one prose root, as a comma-joined tag sequence.
 */
const tagsOf = (key: string): string =>
  Array.from(proseOf(key)?.children ?? [])
    .map(el => el.tagName.toLowerCase())
    .join(',')

/**
 * The rendered text, one block per space.
 *
 * Joined per child rather than read off the root's own `textContent`, which
 * concatenates adjacent blocks with no separator and would run the last two
 * paragraphs of the legacy fixture into one word.
 */
const textOf = (key: string): string =>
  Array.from(proseOf(key)?.children ?? [])
    .map(el => (el.textContent ?? '').replace(/\s+/g, ' ').trim())
    .join(' ')

/** Every `<li>`, grouped by the `<ul>` it belongs to. */
const listsOf = (key: string): string =>
  Array.from(proseOf(key)?.querySelectorAll('ul') ?? [])
    .map(ul => Array.from(ul.querySelectorAll('li')).map(li => (li.textContent ?? '').trim()).join(' + '))
    .join(' | ')

interface Snapshot {
  key: string
  found: boolean
  rootTag: string
  rootClasses: string
  dataGap: string
  inlineStyle: boolean
  tags: string
  text: string
  rawText: string
  lists: string
  rankOneCount: number
  headings: string
  measureAttrs: number
  width: number
}

const snaps = reactive<Snapshot[]>([])
const checks = ref<Check[]>([])

const snapshot = (key: string): Snapshot => {
  const root = proseOf(key)

  return {
    key,
    found: root !== null,
    rootTag: root?.tagName.toLowerCase() ?? 'missing',
    /*
      `|` is a real class token in this codebase's CUBE dialect — it separates
      the block from the composition primitive — and it is filtered out here so
      the row reads as the two names it is about.
    */
    rootClasses: root
      ? Array.from(root.classList).filter(c => c !== '|').sort().join(' ')
      : 'no root',
    dataGap: root?.getAttribute('data-gap') ?? 'absent',
    inlineStyle: root !== null && root.style.cssText.trim() !== '',
    tags: tagsOf(key),
    text: textOf(key),
    rawText: root?.textContent ?? '',
    lists: listsOf(key),
    rankOneCount: root?.querySelectorAll('h1').length ?? -1,
    headings: Array.from(root?.querySelectorAll('h2,h3,h4,h5,h6') ?? [])
      .map(el => `${el.tagName.toLowerCase()}:${(el.textContent ?? '').trim()}`)
      .join(' | '),
    /*
      The attribute the component must never set — counted on the root *and*
      everywhere below it, so a measure smuggled onto an inner element is caught
      too. The band's own `.center` is an ancestor, not a descendant, so it sits
      correctly outside this count.
    */
    measureAttrs: (root?.hasAttribute('data-measure') ? 1 : 0)
      + (root?.querySelectorAll('[data-measure]').length ?? 0),
    width: Math.round(root?.getBoundingClientRect().width ?? -1)
  }
}

const snapFor = (key: string): Snapshot | undefined => snaps.find(s => s.key === key)

/** What the document-wide, geometric and cascade observations found. */
const seen = reactive({
  timedOut: false,
  documentRankOne: -1,
  capResolved: -1,
  bandContent: -1,
  rulerWidth: -1,
  attrsOnRoot: 'not run'
})

let walking = false
let reported = false

const finalise = async () => {
  if (walking) return
  walking = true
  await settle()

  for (const c of CASES) snaps.push(snapshot(c.key))

  seen.documentRankOne = document.querySelectorAll('h1').length

  /*
    The narrow band's own inner `.center` — the element the cap is declared on.
    Read from the DOM rather than recomputed, and paired with a live `60ch`
    ruler measured *inside the same box*, so the row states "capped at 60ch"
    rather than "capped at some number of pixels".
  */
  const narrowCenter = proseOf('long')?.closest('.center') as HTMLElement | null
  if (narrowCenter) {
    const cs = getComputedStyle(narrowCenter)
    seen.capResolved = Math.round(Number.parseFloat(cs.maxInlineSize))
    seen.bandContent = Math.round(Number.parseFloat(cs.width))

    const ruler = document.createElement('div')
    ruler.style.cssText = 'position:absolute;visibility:hidden;inline-size:60ch'
    narrowCenter.append(ruler)
    seen.rulerWidth = Math.round(ruler.getBoundingClientRect().width)
    ruler.remove()
  }

  /* `$attrs` reaching the root: `data-probe-case` is itself the evidence. */
  const md = proseOf('markdown')
  seen.attrsOnRoot = md
    ? `${md.getAttribute('data-probe-case')}|${md.classList.contains('stack')}`
    : 'missing'

  report()
}

const report = () => {
  if (reported) return
  reported = true

  const markdown = snapFor('markdown')
  const legacy = snapFor('legacy')
  const empty = snapFor('empty')
  const nullish = snapFor('nullish')
  const long = snapFor('long')
  const uncapped = snapFor('uncapped')

  const badNots = complexNotSelectors()
  const rules = proseRules()

  const across = (read: (s: Snapshot) => string | number | boolean): string =>
    CASES.map((c) => {
      const s = snapFor(c.key)
      return s === undefined ? '?' : String(read(s))
    }).join(',')

  checks.value = [
    // --- 0. the walk itself -------------------------------------------------
    {
      label: 'the assertion walk completed (did not time out)',
      expected: 'false',
      actual: String(seen.timedOut)
    },
    {
      label: 'all six bands mounted a .bf-prose root',
      expected: 'true,true,true,true,true,true',
      actual: across(s => s.found)
    },

    // --- 1. root shape, ported element for element --------------------------
    {
      label: 'the root is a <div> in every band',
      expected: 'div,div,div,div,div,div',
      actual: across(s => s.rootTag)
    },
    {
      label: '  …carrying both class tokens, the wireframe’s .stack included',
      expected: Array(6).fill('bf-prose stack').join(','),
      actual: across(s => s.rootClasses)
    },
    {
      label: '  …and the wireframe’s own data-gap="s"',
      expected: 's,s,s,s,s,s',
      actual: across(s => s.dataGap)
    },
    {
      label: 'the component emits no inline style of its own',
      expected: 'false,false,false,false,false,false',
      actual: across(s => s.inlineStyle)
    },

    // --- 2. the markdown-lite path -----------------------------------------
    {
      label: 'the markdown-lite body parses to the frozen wfProse block sequence',
      expected: MARKDOWN_TAGS,
      actual: markdown?.tags ?? 'missing'
    },
    {
      label: '  …consecutive markers group into one list; a paragraph opens a second',
      expected: 'Democracy and its institutions + Transatlantic relations and global challenges'
        + ' | Future leadership',
      actual: markdown?.lists ?? 'missing'
    },
    {
      label: '  …the bold mark is stripped to its text',
      expected: 'true',
      actual: String(
        (markdown?.text ?? '').includes('The Bertelsmann Foundation North America works')
        && !(markdown?.text ?? '').includes('**')
      )
    },
    {
      label: '  …the link keeps its label and drops its URL',
      expected: 'true',
      actual: String(
        (markdown?.text ?? '').includes('Read the full report for the complete methodology')
        && !(markdown?.text ?? '').includes('bfna.org/research')
        && !(markdown?.text ?? '').includes('](')
      )
    },
    {
      label: '  …the italic and code marks are stripped too',
      expected: 'true',
      actual: String(
        (markdown?.text ?? '').includes('call the bfInsights collection directly')
        && !(markdown?.text ?? '').includes('`')
        && !(markdown?.text ?? '').includes('*')
      )
    },
    {
      label: '  …and the two heading ranks are 2 then 3, in that order',
      expected: 'h2:Why transatlantic cooperation still matters'
        + ' | h3:How the work is published',
      actual: markdown?.headings ?? 'missing'
    },

    // --- 3. the legacy-HTML strip path -------------------------------------
    {
      label: 'the legacy-HTML body flattens to one paragraph per former block',
      expected: LEGACY_TAGS,
      actual: legacy?.tags ?? 'missing'
    },
    {
      label: '  …so it emits no heading and no list at all — the strip deletes every tag',
      expected: '|',
      actual: legacy ? `${legacy.headings}|${legacy.lists}` : 'missing'
    },
    {
      label: '  …&amp; is decoded to a literal ampersand',
      expected: 'true',
      actual: String(
        (legacy?.text ?? '').includes('Democracy & its institutions')
        && (legacy?.text ?? '').includes('Digital policy & platform governance')
        && !(legacy?.text ?? '').includes('&amp;')
      )
    },
    {
      label: '  …&nbsp; is decoded to a plain U+0020, read off the raw text',
      expected: 'true',
      actual: String(
        (legacy?.rawText ?? '').includes('Bertelsmann Foundation,')
        && !(legacy?.rawText ?? '').includes('\u00A0')
        && !(legacy?.rawText ?? '').includes('&nbsp;')
      )
    },
    {
      label: '  …nested <strong> and <a> are stripped, their text kept',
      expected: 'true',
      actual: String(
        (legacy?.text ?? '').includes('published at bfna.org.')
        && !(legacy?.text ?? '').includes('<')
        && !(legacy?.text ?? '').includes('https://')
      )
    },
    {
      label: '  …and <br> breaks a block, so the closing paragraph splits in two',
      expected: 'Write to the team. We answer every note.',
      actual: (legacy?.text ?? 'missing').slice(-40)
    },

    // --- 4. the rank-1 constraint ------------------------------------------
    {
      label: 'no prose root contains a rank-1 heading, the legacy fixture’s included',
      expected: '0,0,0,0,0,0',
      actual: across(s => s.rankOneCount)
    },
    {
      label: '  …the legacy body’s rank-1 heading survives as a paragraph, text intact',
      expected: 'true',
      actual: String(
        (legacy?.tags ?? '').startsWith('p,')
        && (legacy?.text ?? '').startsWith('Democracy & its institutions')
      )
    },
    {
      label: 'the whole document holds exactly one rank-1 heading — this page’s title',
      expected: 1,
      actual: seen.documentRankOne
    },

    // --- 5. the empty-content case: nothing is rendered ---------------------
    {
      label: 'an empty string renders nothing — no [body copy], no empty <p>',
      expected: 'root present, 0 children, no text',
      actual: empty
        ? `root ${empty.found ? 'present' : 'missing'}, ${empty.tags === '' ? 0 : empty.tags.split(',').length} children, ${empty.text === '' ? 'no text' : `text “${empty.text}”`}`
        : 'missing'
    },
    {
      label: '  …and so does an explicit null',
      expected: 'root present, 0 children, no text',
      actual: nullish
        ? `root ${nullish.found ? 'present' : 'missing'}, ${nullish.tags === '' ? 0 : nullish.tags.split(',').length} children, ${nullish.text === '' ? 'no text' : `text “${nullish.text}”`}`
        : 'missing'
    },

    // --- 6. the measure, measured ------------------------------------------
    {
      label: 'the narrow band resolves its cap to a live 60ch, measured in the band',
      expected: 'true',
      actual: String(
        seen.rulerWidth > 0
        && seen.capResolved > 0
        && Math.abs(seen.capResolved - seen.rulerWidth) <= 1
      )
    },
    {
      label: '  …and the prose fills that box exactly, so the cap is what sets its width',
      expected: 'true',
      actual: long
        ? String(long.width > 0 && Math.abs(long.width - seen.bandContent) <= 1)
        : 'missing'
    },
    {
      label: 'the same excerpt in a measure="full" band is strictly wider',
      expected: 'true',
      actual: long && uncapped
        ? String(uncapped.width > long.width)
        : 'missing'
    },
    {
      label: 'the component sets no data-measure anywhere, on the root or below it',
      expected: '0,0,0,0,0,0',
      actual: across(s => s.measureAttrs)
    },

    // --- 7. cascade + attrs hygiene ----------------------------------------
    {
      label: '$attrs reaches the root and merges with its class',
      expected: 'markdown|true',
      actual: seen.attrsOnRoot
    },
    {
      label: 'the component ships no stylesheet — no rule anywhere selects bf-prose',
      expected: 0,
      actual: rules.length === 0 ? 0 : rules.map(r => `${r.selector} @${r.layer}`).join(' ; ')
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
    data-probe="45"
    :data-probe-verdict="state.toUpperCase()"
  >
    <h1 class="probe__title">
      Probe 45 — <code>bfProse</code>
    </h1>
    <p class="probe__lede">
      Six bodies through one renderer. The first two are the two source formats
      the component exists to reconcile — markdown-lite and the Directus-era
      HTML — and the second of them opens with a rank-one heading on purpose, so
      the claim <em>“no rank-one heading escapes”</em> is proved against the path
      that could produce one rather than asserted about a body that never had
      one. The next two are the empty and null bodies, which since #186 render
      nothing at all. The last two are the same
      excerpt inside a <code>narrow</code> band and a <code>full</code> one, so
      the line cap is <em>measured</em> against a reference on the same page
      rather than read off an attribute.
    </p>

    <section class="probe__gallery" aria-labelledby="cases-heading">
      <h2 id="cases-heading">The six bands</h2>

      <!-- 1 — the markdown-lite path -->
      <bfSection label="Body" measure="narrow">
        <bfProse :content="MARKDOWN" data-probe-case="markdown" />
      </bfSection>

      <!-- 2 — the legacy-HTML strip path, rank-one heading included -->
      <bfSection label="Body" measure="narrow">
        <bfProse :content="LEGACY" data-probe-case="legacy" />
      </bfSection>

      <!-- 3 — an empty string -->
      <bfSection label="Body" measure="narrow">
        <bfProse content="" data-probe-case="empty" />
      </bfSection>

      <!-- 4 — an explicit null -->
      <bfSection label="Body" measure="narrow">
        <bfProse :content="null" data-probe-case="nullish" />
      </bfSection>

      <!--
        5 and 6 — the same excerpt, capped and uncapped.

        `measure="full"` resolves `--_center-measure: 100%`, so the reference
        band is as wide as the page gives it and the capped band must be
        strictly narrower. Both are real `bfSection`s: comparing against a bare
        `<div>` would compare two padding models rather than two measures.
      -->
      <bfSection label="Body" measure="narrow">
        <bfProse :content="LONG" data-probe-case="long" />
      </bfSection>

      <bfSection label="Body" measure="full">
        <bfProse :content="LONG" data-probe-case="uncapped" />
      </bfSection>
    </section>

    <section class="probe__report" aria-labelledby="report-heading">
      <h2 id="report-heading">Report</h2>

      <p
        class="probe__verdict"
        :data-state="state"
        data-testid="probe-45-verdict"
      >
        {{ verdict }}
      </p>

      <table class="probe__table" data-testid="probe-45-table">
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

.probe__lede {
  max-inline-size: 75ch;
}

/*
  Framed as `.bf-section`, not `.bf-prose`: the report walks the live CSSOM for
  every rule that selects the component's own block class and requires that list
  to be empty — the honest form of "it ships no stylesheet". A scoped rule here
  naming `.bf-prose` would be found by that walk and read as the component
  having grown one.
*/
.probe__gallery > .bf-section {
  outline: 1px dashed currentcolor;
  outline-offset: -1px;
}
</style>
