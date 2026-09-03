<script setup lang="ts">
/**
 * Probe — issue 30 / gh#39: `bfFilterBar`.
 *
 * Dev-only route, never linked from nav. Kept in place for later issues to
 * regression-check against; only the final cutover issue removes `bf-probe/`.
 *
 * ## What it proves
 *
 * 1. **The group is a group.** `role="group"` with a real accessible name, one
 *    `bfChip[toggle]` per filter, every chip a native `<button type="button">`
 *    carrying `aria-pressed` — and the set of chips reading
 *    `aria-pressed="true"` is *exactly* the set carrying `[data-active]`,
 *    which is what stops the announced state and the painted state drifting.
 * 2. **Multi-select emits the expected array.** § 2 drives a real `v-model`
 *    through a four-step click sequence and asserts the array after each step,
 *    by value. It also asserts the two identity facts the value comparison
 *    cannot see: the array that went in is never the array that comes out, and
 *    the original array object is unchanged afterwards.
 * 3. **The page's vocabulary survives.** A selected key that is not in
 *    `filters` renders no chip and is still there after an unrelated toggle —
 *    the case a tidier "rebuild the array from `filters`" implementation would
 *    silently drop, and the one that actually occurs on a page whose facet
 *    list narrows with the query.
 * 4. **Arrow keys move focus, driven by a real keyboard.** § 1 is dispatched
 *    by the harness through CDP (`data-probe-keys`, gh#28) — Tab in, then
 *    ArrowRight, ArrowDown, ArrowLeft, Home, End — and asserts which chip held
 *    focus at each step, that every event was trusted, that the component
 *    called `preventDefault` on the five keys it consumed, and that it did
 *    **not** call it on Tab. `.focus()` would prove none of that.
 * 5. **One tab stop, and it cannot be lost.** Exactly one chip per bar is
 *    tabbable, across every bar on the page — including one whose `filters`
 *    array is truncated at runtime *after* a now-out-of-range chip had been
 *    focused, which is the state a stored roving index would strand.
 * 6. **No `:style` hack anywhere.** The frozen `search.vue` writes the
 *    selected state as an inline style string, twice. Not one element rendered
 *    by this component — group or chip — carries a `style` attribute.
 * 7. **The gap hook chains through the composition layer**, so `data-gap` from
 *    a consumer is not inert and a direct `--_bf-filter-bar-gap` still wins,
 *    both measured against reference `.cluster` elements rather than pixels.
 *
 * ## Real data, not invented data
 *
 * The three programme facets are the `name` fields of `content/bf/programs/`,
 * keyed by their real slugs; the four format facets are the frozen
 * `pages/wireframes/search.vue`'s own `FORMATS` array, copied by value. Those
 * two bars together are the exact call site this component was written for —
 * the search page's "Refine" section, where the state is currently hand-rolled
 * twice in one file.
 *
 * ## DOM order is load-bearing
 *
 * The keyboard lab is the **first focusable thing on the page**, because § 1's
 * first assertion is about the browser's own sequential focus navigation:
 * Tab must land on the lab's tabbable chip, and it can only do that if nothing
 * focusable precedes it. Every other bar comes after it, no chip is focused
 * before the keys are requested, and the one experiment that *removes* a
 * focused element runs after them — because removing one moves Chrome's
 * sequential focus navigation starting point to where it was, which sent the
 * first Tab into the bars at the foot of the page while this probe was being
 * written. The heading is focused and released just before the handshake to
 * state that starting point rather than rely on it.
 *
 * The vitest harness on `dev` is broken and pre-existing (residual #86), so
 * acceptance is this page under `npx tsx scripts/check-probes.ts --only 30`,
 * per the gh#20–#38 precedent and the #109 harness decision. Recorded in the
 * spec's Decisions section.
 */
import type { Filter } from '~/types/bf-contracts'

defineOptions({ name: 'BfProbe30BfFilterBar' })

definePageMeta({ layout: 'bf-probe' })

useHead({
  title: 'bf-probe 30 — bfFilterBar'
})

/**
 * The four format facets, copied by value from the frozen
 * `pages/wireframes/search.vue:77-82`. Copied, not imported: the wireframe
 * layer is frozen and is a specification, not a dependency (BRIEF D2).
 */
const FORMATS: Filter[] = [
  { key: 'article', label: 'Articles' },
  { key: 'report', label: 'Reports' },
  { key: 'video', label: 'Videos' },
  { key: 'infographic', label: 'Infographics' }
]

/** The three real programmes — `slug` and `name` from `content/bf/programs/`. */
const PROGRAMS: Filter[] = [
  { key: 'democracy', label: 'Democracy' },
  {
    key: 'transatlantic-relations-global-challenges',
    label: 'Transatlantic Relations & Global Challenges'
  },
  { key: 'future-leadership', label: 'Future Leadership' }
]

/* --- the bars ----------------------------------------------------------- */

/** § 1 — the keyboard lab. Never clicked; only driven by real key events. */
const keyboardModel = ref<string[]>([])

/** § 3 — the two facets of the search page's "Refine" section, side by side. */
const programModel = ref<string[]>(['democracy'])
const formatModel = ref<string[]>([])

/** § 2 — the recorded `v-model` round trip. */
const roundTripModel = ref<string[]>([])

/**
 * § 4 — a page vocabulary wider than the rendered facets. `podcast` is a real
 * `format` value in the snapshot and is deliberately absent from `filters`.
 */
const vocabularyModel = ref<string[]>(['article', 'podcast'])
const vocabularyFilters: Filter[] = [FORMATS[0]!, FORMATS[1]!]

/** § 5 — a `filters` array that shrinks at runtime, under a focused chip. */
const dynamicFilters = ref<Filter[]>([...FORMATS])
const dynamicModel = ref<string[]>([])

/** § 6 — three instances measured against two reference clusters. */
const gapModel = ref<string[]>([])

/* --- what the keyboard did ---------------------------------------------- */

/** The key sequence the harness is asked to send, in order. */
const KEY_SEQUENCE = ['Tab', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'Home', 'End'] as const

/**
 * The chip each key must leave focused, by `filter.key`. The first entry is
 * Tab's — sequential navigation entering the group at its single tab stop.
 */
const EXPECTED_FOCUS = ['article', 'report', 'video', 'report', 'article', 'infographic']

/** Published only once every listener is attached — the gh#28 handshake. */
const armed = ref(false)

const seenKeys = reactive<{
  order: string[]
  untrusted: number
  prevented: string[]
  notPrevented: string[]
}>({ order: [], untrusted: 0, prevented: [], notPrevented: [] })

/** Every element focus landed on inside the lab, in order, by `filter.key`. */
const focusOrder: string[] = []

/* --- what the clicks did ------------------------------------------------- */

interface Step {
  label: string
  expected: string
  actual: string
}

const roundTrip: Step[] = []
const identity = reactive({
  sameArrayReturned: 'unrun',
  originalMutated: 'unrun',
  vocabularyKept: 'unrun',
  clampTabbable: 'unrun',
  clampIndex: 'unrun'
})

/* --- assertions ---------------------------------------------------------- */

interface Check {
  label: string
  expected: string | number
  actual: string | number
}

const checks = ref<Check[]>([])

const barOf = (name: string) => document.querySelector<HTMLElement>(`[data-probe-bar="${name}"]`)

const chipsOf = (name: string): HTMLElement[] =>
  Array.from(barOf(name)?.querySelectorAll<HTMLElement>('[data-filter-key]') ?? [])

const keysOf = (name: string): string[] =>
  chipsOf(name).map(c => c.getAttribute('data-filter-key') ?? '?')

/** The chips of a bar that are in the natural tab order. */
const tabbableOf = (name: string): string[] =>
  chipsOf(name)
    .filter(c => c.getAttribute('tabindex') === '0')
    .map(c => c.getAttribute('data-filter-key') ?? '?')

const ALL_BARS = ['keyboard', 'program', 'format', 'round-trip', 'vocabulary', 'dynamic']

/**
 * Walk every reachable stylesheet — `@import`ed ones included, since
 * `/css/styles.css` is nothing but a list of imports — for a `.bf-filter-bar`
 * style rule whose ancestry includes a `@layer components` block. Cross-origin
 * sheets throw on `cssRules`; they are skipped, not failed, so the Google
 * Fonts link does not sink the check. Matched as a whole class token, so a
 * renamed rule cannot keep this green. (Same helper as probes 14–18 and 28–29.)
 */
const layeredFilterBarRuleFound = (): boolean => {
  const LAYER_BLOCK = globalThis.CSSLayerBlockRule
  if (!LAYER_BLOCK) return false

  const selector = /\.bf-filter-bar(?![\w-])/

  const walk = (rules: CSSRuleList, insideComponents: boolean): boolean => {
    for (const rule of Array.from(rules)) {
      const nowInside =
        insideComponents
        || (rule instanceof LAYER_BLOCK && (rule as CSSLayerBlockRule).name === 'components')

      if (nowInside && rule instanceof CSSStyleRule && selector.test(rule.selectorText)) {
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

const gapOf = (e: Element | null) => (e ? getComputedStyle(e).columnGap : 'missing')

const finalise = async () => {
  /*
   * The keyboard is finished, so freeze what it did before anything below can
   * add to it: the clamp experiment two lines down focuses a chip, which would
   * otherwise append a seventh entry to a list that is asserted by value.
   */
  const focusEntry = focusOrder[0] ?? 'nothing focused'
  const focusPath = focusOrder.join(',')

  /* ---------------------------------------------------------------------
   * § 5 — the clamp. Focus the LAST chip of the dynamic bar, then throw two
   * of its filters away. A stored roving index would now point at a chip that
   * does not exist and the group would have no tab stop at all.
   *
   * Deliberately run *after* the keyboard section rather than before it.
   * Removing the focused element from the document moves Chrome's sequential
   * focus navigation starting point to where that element was, so running this
   * first made the harness's Tab enter the *gap* bars near the bottom of the
   * page instead of the lab at the top — a real browser behaviour that had
   * nothing to say about this component. Nothing is focused before the keys
   * arrive now, and § 1's own `focus`/`blur` on the heading pins the starting
   * point above the lab besides.
   * ------------------------------------------------------------------- */
  chipsOf('dynamic')[3]?.focus()
  await nextTick()
  dynamicFilters.value = [FORMATS[0]!, FORMATS[1]!]
  await nextTick()
  identity.clampTabbable = String(tabbableOf('dynamic').length)
  identity.clampIndex = tabbableOf('dynamic').join(',')

  const allChips = Array.from(document.querySelectorAll<HTMLElement>('.bf-filter-bar [data-filter-key]'))
  const allBars = Array.from(document.querySelectorAll<HTMLElement>('.bf-filter-bar'))

  const pressed = allChips.filter(c => c.getAttribute('aria-pressed') === 'true')
  const active = allChips.filter(c => c.hasAttribute('data-active'))

  const refXs = document.querySelector('[data-probe-ref="cluster-xs"]')
  const refL = document.querySelector('[data-probe-ref="cluster-l"]')
  const gapDefault = document.querySelector('[data-probe-gap="default"] .bf-filter-bar')
  const gapAttr = document.querySelector('[data-probe-gap="attr"] .bf-filter-bar')
  const gapVar = document.querySelector('[data-probe-gap="var"] .bf-filter-bar')

  const results: Check[] = [
    /* --- 1. group semantics --------------------------------------------- */
    {
      label: 'every bar is a <div role="group">',
      expected: `${ALL_BARS.length + 3}|DIV`,
      actual: `${allBars.filter(b => b.getAttribute('role') === 'group').length}|${
        new Set(allBars.map(b => b.tagName)).size === 1 ? allBars[0]?.tagName : 'MIXED'
      }`
    },
    {
      label: 'every bar carries a non-empty accessible name',
      expected: allBars.length,
      actual: allBars.filter(b => (b.getAttribute('aria-label') ?? '').trim().length > 0).length
    },
    {
      label: 'the two search facets are named apart, not both "Filters"',
      expected: 'Program|Format',
      actual: `${barOf('program')?.getAttribute('aria-label') ?? 'missing'}|${
        barOf('format')?.getAttribute('aria-label') ?? 'missing'}`
    },
    {
      label: 'the default label is the generic "Filters"',
      expected: 'Filters',
      actual: barOf('round-trip')?.getAttribute('aria-label') ?? 'missing'
    },
    {
      label: 'no bar claims role="radiogroup" or role="toolbar"',
      expected: 0,
      actual: allBars.filter(b => ['radiogroup', 'toolbar'].includes(b.getAttribute('role') ?? '')).length
    },
    {
      label: '$attrs fallthrough reaches the group (data-probe-bar)',
      expected: ALL_BARS.join(','),
      actual: ALL_BARS.map(n => (barOf(n) ? n : `MISSING:${n}`)).join(',')
    },

    /* --- 2. one chip per filter, and it is a real toggle button ---------- */
    {
      label: 'the programme bar renders the three real programme slugs, in order',
      expected: PROGRAMS.map(f => f.key).join(','),
      actual: keysOf('program').join(',')
    },
    {
      label: 'the format bar renders the four frozen FORMATS keys, in order',
      expected: FORMATS.map(f => f.key).join(','),
      actual: keysOf('format').join(',')
    },
    {
      label: 'every chip is a <button type="button">',
      expected: `${allChips.length}|${allChips.length}`,
      actual: `${allChips.filter(c => c.tagName === 'BUTTON').length}|${
        allChips.filter(c => c.getAttribute('type') === 'button').length}`
    },
    {
      label: 'every chip took bfChip’s toggle branch',
      expected: allChips.length,
      actual: allChips.filter(c => c.dataset.element === 'toggle').length
    },
    {
      label: 'every chip carries aria-pressed (present, even when false)',
      expected: allChips.length,
      actual: allChips.filter(c => c.getAttribute('aria-pressed') !== null).length
    },
    {
      label: 'aria-pressed="true" is exactly the set carrying [data-active]',
      expected: pressed.map(c => c.dataset.filterKey).sort().join(','),
      actual: active.map(c => c.dataset.filterKey).sort().join(',')
    },
    {
      label: 'a selected key with no filter entry renders no chip',
      expected: 'article,report',
      actual: keysOf('vocabulary').join(',')
    },

    /* --- 3. the v-model round trip --------------------------------------- */
    ...roundTrip.map(s => ({ label: `round trip — ${s.label}`, expected: s.expected, actual: s.actual })),
    {
      label: 'the emitted array is never the array that was passed in',
      expected: 'true',
      actual: identity.sameArrayReturned
    },
    {
      label: 'the original array object is unchanged after four toggles',
      expected: 'true',
      actual: identity.originalMutated
    },
    {
      label: 'a selected key absent from filters survives an unrelated toggle',
      expected: 'article,podcast,report',
      actual: identity.vocabularyKept
    },

    /* --- 4. roving tabindex ---------------------------------------------- */
    ...ALL_BARS.map(name => ({
      label: `bar "${name}" has exactly one tabbable chip`,
      expected: 1,
      actual: tabbableOf(name).length
    })),
    {
      label: 'the tab stop defaults to the first SELECTED chip, not the first chip',
      expected: 'democracy',
      actual: tabbableOf('program').join(',')
    },
    {
      label: 'with nothing selected it defaults to the first chip',
      expected: 'article',
      actual: tabbableOf('format').join(',')
    },
    {
      label: 'truncating filters under a focused chip still leaves one tab stop',
      expected: '1',
      actual: identity.clampTabbable
    },
    {
      label: '  …clamped to the last surviving chip, not lost',
      expected: 'report',
      actual: identity.clampIndex
    },

    /* --- 5. the keyboard, driven by real CDP input ----------------------- */
    {
      label: `the harness sent all ${KEY_SEQUENCE.length} keys`,
      expected: KEY_SEQUENCE.join(','),
      actual: seenKeys.order.join(',')
    },
    {
      label: 'every key event was trusted (real input, not a synthetic event)',
      expected: 0,
      actual: seenKeys.untrusted
    },
    {
      label: 'Tab entered the group at its single tab stop',
      expected: EXPECTED_FOCUS[0] as string,
      actual: focusEntry
    },
    {
      label: 'arrow / Home / End moved focus to the expected chip at each step',
      expected: EXPECTED_FOCUS.join(','),
      actual: focusPath
    },
    {
      label: 'the component consumed (preventDefault) the five keys it handles',
      expected: 'ArrowRight,ArrowDown,ArrowLeft,Home,End',
      actual: seenKeys.prevented.join(',')
    },
    {
      label: '  …and did NOT consume Tab',
      expected: 'Tab',
      actual: seenKeys.notPrevented.join(',')
    },
    {
      label: 'the keyboard never changed the selection — arrows move, they do not toggle',
      expected: 0,
      actual: keyboardModel.value.length
    },
    {
      /*
        The sequence deliberately ends on End rather than Home, so the tab stop
        it leaves behind — the last chip — is NOT the one the bar would have
        defaulted to. A row that expected `article` here would stay green on a
        component whose roving index never moved at all.
      */
      label: 'the tab stop followed the keyboard, and is not the default one',
      expected: 'infographic',
      actual: tabbableOf('keyboard').join(',')
    },

    /* --- 6. no inline style anywhere ------------------------------------- */
    {
      label: 'no group carries a style attribute (the wf :style hack is gone)',
      expected: 0,
      actual: allBars.filter(b => b.getAttribute('style') !== null).length
    },
    {
      label: 'no chip carries a style attribute either',
      expected: 0,
      actual: allChips.filter(c => c.getAttribute('style') !== null).length
    },
    {
      label: 'the selected chips resolve a different background from the unselected ones',
      expected: 'true',
      actual: String(
        pressed.length > 0
        && new Set(allChips.map(c => getComputedStyle(c).backgroundColor)).size === 2
      )
    },

    /* --- 7. styling discipline ------------------------------------------- */
    {
      label: '.bf-filter-bar rules are inside @layer components in the live CSSOM',
      expected: 'true',
      actual: String(layeredFilterBarRuleFound())
    },
    {
      label: 'every bar is a .cluster (layout comes from the composition layer)',
      expected: allBars.length,
      actual: allBars.filter(b => b.classList.contains('cluster')).length
    },
    {
      label: 'default gap resolves to the same value as .cluster[data-gap="xs"]',
      expected: gapOf(refXs),
      actual: gapOf(gapDefault)
    },
    {
      label: 'data-gap="l" from a consumer is NOT inert — it reaches the gap',
      expected: gapOf(refL),
      actual: gapOf(gapAttr)
    },
    {
      label: '  …and it actually changed something (xs ≠ l)',
      expected: 'true',
      actual: String(gapOf(refXs) !== gapOf(refL) && gapOf(gapDefault) !== gapOf(gapAttr))
    },
    {
      label: 'a consumer rule setting --_bf-filter-bar-gap overrides data-gap="l"',
      expected: gapOf(refXs),
      actual: gapOf(gapVar)
    }
  ]

  checks.value = results
}

onMounted(async () => {
  /* ---------------------------------------------------------------------
   * § 2 — the v-model round trip, driven by real clicks.
   *
   * `HTMLElement.click()` dispatches activation without moving focus, so none
   * of this disturbs § 1's Tab assertion; the scripted focus in § 5 below does,
   * and is blurred before the keys are requested.
   * ------------------------------------------------------------------- */
  const original = roundTripModel.value
  const rt = chipsOf('round-trip')

  const step = async (index: number, label: string, expected: string) => {
    rt[index]?.click()
    await nextTick()
    roundTrip.push({ label, expected, actual: roundTripModel.value.join(',') })
  }

  await step(0, 'select Democracy', 'democracy')
  await step(2, 'add Future Leadership', 'democracy,future-leadership')
  await step(0, 'deselect Democracy', 'future-leadership')
  await step(1, 'add Transatlantic', 'future-leadership,transatlantic-relations-global-challenges')

  roundTrip.push({
    label: 'aria-pressed after the sequence',
    expected: 'false,true,true',
    actual: chipsOf('round-trip').map(c => c.getAttribute('aria-pressed')).join(',')
  })

  identity.sameArrayReturned = String(roundTripModel.value !== original)
  identity.originalMutated = String(original.length === 0)

  /* --- § 4 — the page's own vocabulary survives a toggle ---------------- */
  chipsOf('vocabulary')[1]?.click()
  await nextTick()
  identity.vocabularyKept = vocabularyModel.value.join(',')

  /* ---------------------------------------------------------------------
   * § 1 — the real keyboard.
   *
   * Pin where Tab starts. A page with nothing focused begins sequential
   * navigation at the top of the document, which is what this section needs —
   * but "nothing focused" is not the same as "nothing has ever been focused":
   * Chrome keeps a *sequential focus navigation starting point*, and both a
   * blur and the removal of a focused element move it to wherever that element
   * was. Focusing the heading and letting it go states the starting point out
   * loud, above the lab, instead of depending on nothing above having ever
   * taken focus. (The clamp experiment, which removes a focused chip near the
   * bottom of the page, now runs *after* the keys for the same reason.)
   * ------------------------------------------------------------------- */
  const heading = document.querySelector<HTMLElement>('.probe > h1')
  heading?.focus()
  heading?.blur()
  await nextTick()

  const lab = barOf('keyboard')

  /*
   * `focusin` rather than `focus`: it bubbles, so one listener sees every
   * landing — including a Tab that reached something *other* than the lab,
   * which is the failure this section exists to catch. Entries outside the lab
   * are recorded by name so the row reads as a wrong destination rather than
   * as a missing one.
   */
  document.addEventListener('focusin', event => {
    const target = event.target as HTMLElement | null
    if (target === null) return
    if (lab?.contains(target)) {
      focusOrder.push(target.getAttribute('data-filter-key') ?? '?')
    } else {
      focusOrder.push(`OUTSIDE:${target.tagName.toLowerCase()}`)
    }
  })

  /*
   * Bound on `document`, in the bubble phase, so the component's own handler
   * on the chip has already run: `defaultPrevented` here is the answer to
   * "did the component consume this key", which is the assertion that
   * separates a working roving group from one that merely happens to focus
   * the right thing while the page also scrolls.
   */
  document.addEventListener('keydown', event => {
    seenKeys.order.push(event.key)
    if (!event.isTrusted) seenKeys.untrusted += 1
    if (event.defaultPrevented) seenKeys.prevented.push(event.key)
    else seenKeys.notPrevented.push(event.key)

    if (seenKeys.order.length === KEY_SEQUENCE.length) {
      /* A beat, so the last focus move lands before anything is read. */
      setTimeout(() => { void finalise() }, 120)
    }
  })

  /*
   * Only now — with every listener attached and every scripted experiment
   * finished — ask for the keys. The harness polls for this attribute, so its
   * appearance is the handshake; publishing it unconditionally in the template
   * would race the listeners above.
   */
  armed.value = true
})

const passed = computed(() =>
  checks.value.filter(c => String(c.actual) === String(c.expected)).length
)

/**
 * Three states, not two. The assertions need a keyboard, so before one arrives
 * the honest answer is `pending` — the prerendered HTML has run nothing, and
 * baking `FAIL` into it would read as a regression to the next issue that greps
 * the file. The harness treats a probe still PENDING at timeout as a failure,
 * never a skip.
 */
const state = computed<'pending' | 'pass' | 'fail'>(() => {
  if (checks.value.length === 0) return 'pending'
  return passed.value === checks.value.length ? 'pass' : 'fail'
})

const verdict = computed(() =>
  state.value === 'pending'
    ? 'PENDING — Tab into the first bar, then press → ↓ ← Home End (the harness does this for you)'
    : `${state.value === 'pass' ? 'PASS' : 'FAIL'} — ${passed.value}/${checks.value.length} checks`
)
</script>

<template>
  <!--
    Harness contract (docs/decisions/probe-harness.md): the root carries
    `data-probe` + `data-probe-verdict`, and every check row carries
    `data-probe-row` + `data-ok`, so `scripts/check-probes.ts` fails the build
    on a red probe instead of relying on someone opening the page.

    `data-probe-keys` is bound rather than written, so it appears only after
    `onMounted` has attached the listeners and finished the scripted
    experiments — the gh#28 handshake. The arrow keys and Home/End are new to
    the harness's `KEYS` map; this probe is what added them.
  -->
  <main
    class="probe container"
    data-probe="30"
    :data-probe-verdict="state.toUpperCase()"
    :data-probe-keys="armed ? 'Tab,ArrowRight,ArrowDown,ArrowLeft,Home,End' : undefined"
  >
    <!--
      `tabindex="-1"` so the script can focus and release the heading before the
      keys arrive, which pins Chrome's sequential focus navigation starting
      point above the lab. Programmatically focusable only — it is not in the
      tab order, so § 1's first Tab still lands on a chip.
    -->
    <h1 tabindex="-1">Probe 30 — <code>bfFilterBar</code></h1>
    <p class="probe__lede">
      A multi-select facet row: one <code>bfChip[toggle]</code> per filter,
      wrapped in a named <code>role="group"</code>, with one tab stop for the
      whole group and arrow keys inside it. The component owns the group and the
      focus; every pixel of a chip belongs to <code>bfChip</code>.
    </p>
    <p class="probe__lede">
      The frozen <code>search.vue</code> writes the selected state as the inline
      string <code>background:#222;color:#fff</code> — once for the programme
      facet and again, verbatim, for the format facet — and
      <code>insights/index.vue</code> writes a third, link-based mechanism for
      the same idea. Nothing below carries a <code>style</code> attribute.
    </p>

    <!--
      § 1 FIRST IN THE DOM, and deliberately so: the first assertion is that
      Tab lands here, which is only meaningful if nothing focusable precedes
      it. Do not add a link, a button or a tabbable element above this section.
    -->
    <section class="probe__keyboard" aria-labelledby="keyboard-heading">
      <h2 id="keyboard-heading">§ 1 — the keyboard, for real</h2>
      <p class="probe__lede">
        Driven by trusted CDP input, not by <code>.focus()</code>:
        <kbd>Tab</kbd> into the group, then <kbd>→</kbd> <kbd>↓</kbd>
        <kbd>←</kbd> <kbd>Home</kbd> <kbd>End</kbd>. Focus must visit
        <code>{{ EXPECTED_FOCUS.join(' → ') }}</code>, the five movement keys
        must be consumed, <kbd>Tab</kbd> must not be, and the selection must not
        change — arrows move, they do not toggle.
      </p>
      <bfFilterBar
        v-model="keyboardModel"
        :filters="FORMATS"
        label="Format (keyboard lab)"
        data-probe-bar="keyboard"
      />
    </section>

    <section class="probe__roundtrip" aria-labelledby="roundtrip-heading">
      <h2 id="roundtrip-heading">§ 2 — the <code>v-model</code> round trip</h2>
      <p class="probe__lede">
        Four scripted clicks through a real <code>v-model</code>, asserted by
        value after every step — plus the two things a value comparison cannot
        see: the array emitted is never the array passed in, and the original
        array object is untouched afterwards.
      </p>
      <bfFilterBar
        v-model="roundTripModel"
        :filters="PROGRAMS"
        data-probe-bar="round-trip"
      />
      <p class="probe__note">
        Selection now: <code>[{{ roundTripModel.join(', ') }}]</code>
      </p>
    </section>

    <section class="probe__facets" aria-labelledby="facets-heading">
      <h2 id="facets-heading">§ 3 — the real call site</h2>
      <p class="probe__lede">
        The search page's "Refine" section, as it will be built: two named
        groups, real programme names from <code>content/bf/programs/</code> and
        the frozen <code>FORMATS</code> array. Both bars are live — click them.
      </p>

      <p class="probe__label">Program:</p>
      <bfFilterBar
        v-model="programModel"
        :filters="PROGRAMS"
        label="Program"
        data-probe-bar="program"
      />
      <p class="probe__note"><code>[{{ programModel.join(', ') }}]</code></p>

      <p class="probe__label">Format:</p>
      <bfFilterBar
        v-model="formatModel"
        :filters="FORMATS"
        label="Format"
        data-probe-bar="format"
      />
      <p class="probe__note"><code>[{{ formatModel.join(', ') }}]</code></p>
    </section>

    <section class="probe__vocabulary" aria-labelledby="vocabulary-heading">
      <h2 id="vocabulary-heading">§ 4 — the page owns the vocabulary</h2>
      <p class="probe__lede">
        Two chips, but three selected keys: <code>podcast</code> is a real
        format in the snapshot and is not in this bar's <code>filters</code>. It
        renders nothing and it must still be there after an unrelated toggle —
        the case a "rebuild the array from <code>filters</code>" implementation
        drops silently.
      </p>
      <bfFilterBar
        v-model="vocabularyModel"
        :filters="vocabularyFilters"
        label="Format (partial list)"
        data-probe-bar="vocabulary"
      />
      <p class="probe__note"><code>[{{ vocabularyModel.join(', ') }}]</code></p>
    </section>

    <section class="probe__dynamic" aria-labelledby="dynamic-heading">
      <h2 id="dynamic-heading">§ 5 — <code>filters</code> that shrink</h2>
      <p class="probe__lede">
        The fourth chip is focused, then two filters are thrown away. A stored
        roving index would now point past the end of the array and the group
        would have no tab stop at all; a derived one clamps to the last
        surviving chip.
      </p>
      <bfFilterBar
        v-model="dynamicModel"
        :filters="dynamicFilters"
        label="Format (truncated at runtime)"
        data-probe-bar="dynamic"
      />
    </section>

    <section class="probe__gaps" aria-labelledby="gaps-heading">
      <h2 id="gaps-heading">§ 6 — the gap hook, and why it chains</h2>
      <p class="probe__lede">
        <code>--_bf-filter-bar-gap</code> reads <code>--_cluster-space</code> as
        its default instead of replacing it. A flat declaration would have
        worked and would have been a trap: <code>@layer components</code>
        outranks <code>@layer composition</code>, so the component's own rule
        would beat <code>.cluster[data-gap]</code> and silently make the
        documented composition API inert here. The three instances below are
        measured against the two reference clusters, never against pixels.
      </p>

      <div data-probe-gap="default">
        <bfFilterBar v-model="gapModel" :filters="vocabularyFilters" label="Gap — default" />
      </div>
      <div data-probe-gap="attr">
        <bfFilterBar v-model="gapModel" :filters="vocabularyFilters" label="Gap — data-gap=l" data-gap="l" />
      </div>
      <div class="probe__gap-var" data-probe-gap="var">
        <bfFilterBar v-model="gapModel" :filters="vocabularyFilters" label="Gap — var override" data-gap="l" />
      </div>

      <!--
        The references. Plain composition-layer clusters, so the expected gap is
        whatever the design system actually resolves `xs` and `l` to on this
        page — never a number typed into this file.
      -->
      <p class="cluster" data-gap="xs" data-probe-ref="cluster-xs"><span>xs</span><span>reference</span></p>
      <p class="cluster" data-gap="l" data-probe-ref="cluster-l"><span>l</span><span>reference</span></p>
    </section>

    <p
      class="probe__verdict"
      :data-state="state"
      data-testid="probe-30-verdict"
    >
      {{ verdict }}
    </p>

    <table class="probe__table" data-testid="probe-30-table">
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

  No `:not()` here or anywhere in this file — D-20.5 (gh#29).
*/

.probe {
  padding-block: var(--space-l, 2rem);
  min-block-size: 100dvh;
}

.probe__lede {
  max-inline-size: 75ch;
}

.probe__label {
  font-weight: 700;
  margin-block-end: var(--space-3xs, 0.25rem);
}

.probe__note {
  font-size: 0.875rem;
  margin-block: var(--space-3xs, 0.25rem) var(--space-s, 1rem);
}

/*
  The consumer override, written the way a real consumer would write it: inside
  `@layer components`, where it beats the component's own default on
  specificity rather than by escaping the layer system. It is applied to an
  instance that ALSO carries `data-gap="l"`, so the row it feeds proves the
  precedence between the two routes rather than merely that one of them works.
*/
@layer components {
  .probe__gap-var .bf-filter-bar {
    --_bf-filter-bar-gap: var(--space-xs);
  }
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
  margin-block-end: var(--space-m, 1.5rem);
}

.probe__table th,
.probe__table td {
  border-block-end: 1px solid currentcolor;
  padding: 0.25rem 0.75rem 0.25rem 0;
  text-align: start;
  vertical-align: top;
}

.probe__table tr[data-state='fail'] {
  color: var(--color-error);
}
</style>
