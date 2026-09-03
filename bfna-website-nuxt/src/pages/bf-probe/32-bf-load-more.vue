<script setup lang="ts">
/**
 * Probe — issue 32 / gh#41: `bfLoadMore`.
 *
 * Dev-only route, never linked from nav. Kept in place for later issues to
 * regression-check against; only the final cutover issue removes `bf-probe/`.
 *
 * ## Why this probe drives a real feed
 *
 * `bfLoadMore` is the one component in this phase whose entire claim is about
 * something it deliberately does **not** do: it owns no pagination state. A
 * probe that hands it two literal numbers and clicks the button would prove the
 * emit fires and nothing else — it would pass identically on a component that
 * had quietly grown its own `visible` ref, which is exactly the defect the spec
 * is written to prevent.
 *
 * So the `feed` case below is a real one: `useBfInsights().active` sliced by a
 * ref this **page** owns, incremented in the `@load` handler exactly as
 * `pages/wireframes/insights/index.vue:30-32` does today (`visible += 24`, here
 * `+= 3` over a 9-item pool so the terminal state is two clicks away). The
 * probe queries; the component does not, and may not (BRIEF D8). The rendered
 * item count, the announcement text and the button's disappearance are then all
 * consequences of the *caller's* state, which is the contract.
 *
 * ## What it proves
 *
 *  1. **One click, one `load`.** Counted on the page. Two clicks on the feed
 *     control produce exactly two emissions — not one, not three.
 *  2. **The caller owns the slice.** The rendered list grows 3 → 6 → 9 because
 *     this page's ref moved; the component holds nothing.
 *  3. **The announcement tracks the caller's counts.** `Showing 3 of 9 items`
 *     → `Showing 6 of 9 items` → `Showing 9 of 9 items`, read from the live
 *     region's own `textContent` at each step.
 *  4. **The terminal state.** At `hasMore=false` the button is gone from the
 *     DOM — not hidden, gone — and the wrapper occupies **zero height**.
 *  5. **…and the announcement survives it.** The live region is still in the
 *     document, still carrying the final count. A region removed in the same
 *     tick as its last update announces nothing, which would silence the load
 *     that matters most; this is the spec-reading recorded in Decisions and it
 *     is asserted here rather than taken on trust.
 *  6. **No counts ⇒ literally nothing.** The `bare` case (`hasMore=false`, no
 *     `visibleCount`/`totalCount`) renders no element at all — the spec's "not
 *     even an empty wrapper", verbatim.
 *  7. **The live region is clipped, not hidden.** `display: none` and
 *     `visibility: hidden` both remove an element from the accessibility tree
 *     and would silence it; the computed style must be neither, the box must
 *     measure ≤1px, and `role`/`aria-live`/`aria-atomic` must all be present.
 *  8. **`loading` really disables.** A `<button disabled>`, and a click on it
 *     emits nothing.
 *  9. **A trusted `Enter` emits too.** The harness presses a real key on the
 *     focused lab button (`data-probe-keys`, `docs/decisions/probe-harness.md`
 *     Decision 4). A scripted `.click()` would pass on a control that had lost
 *     its native activation path.
 * 10. **`label` defaults to `Load more`** and is overridden when passed.
 * 11. `.bf-load-more` rules are inside `@layer components` in the live CSSOM,
 *     the component emits no inline `style`, `$attrs` reaches the root, and no
 *     `bf-*` rule on the page uses `:not()` with a complex selector (D-20.5).
 *
 * Opened by hand, the page waits: press <kbd>Enter</kbd>.
 *
 * The vitest harness on `dev` is broken and pre-existing (residual #86), so
 * acceptance is this page under `npx tsx scripts/check-probes.ts --only 32`,
 * per the gh#20–#40 precedent and the #109 harness decision. Recorded in the
 * spec's Decisions section.
 */
import { useBfInsights } from '~/composables/data/useBfInsights'

defineOptions({ name: 'BfProbe32BfLoadMore' })

definePageMeta({ layout: 'bf-probe' })

useHead({
  title: 'bf-probe 32 — bfLoadMore'
})

/** One asserted value: what it is, what it must be, what it actually is. */
interface Check {
  label: string
  expected: string | number
  actual: string | number
}

/*
 * A real feed, not a fixture. `active` is the 98 non-archived insights, newest
 * first — the same list `pages/wireframes/insights/index.vue` paginates. Nine
 * of them is enough to reach the terminal state in two clicks while keeping the
 * probe's DOM small; the pagination arithmetic is identical at any pool size.
 */
const { active } = await useBfInsights()
const POOL = active.slice(0, 9)
const STEP = 3

/**
 * The pagination state — **here, on the page**, exactly as the wireframe holds
 * it. `bfLoadMore` never sees this ref; it sees the three numbers derived from
 * it below.
 */
const visible = ref(STEP)

const shown = computed(() => POOL.slice(0, visible.value))
const hasMore = computed(() => visible.value < POOL.length)

/** Emission counter — the "once per click" row reads this. */
const loads = ref(0)

const onLoad = () => {
  loads.value += 1
  visible.value = Math.min(visible.value + STEP, POOL.length)
}

/** The `loading` case's own emission counter; must stay at zero. */
const loadingCaseEmits = ref(0)

/** The keyboard lab's counter; a trusted Enter must move it to 1. */
const labEmits = ref(0)

/**
 * Whether the keyboard sequence has been requested. Bound to
 * `data-probe-keys`, so the attribute exists only after this component has
 * mounted and focused the lab's button — the handshake, not a race.
 */
const armed = ref(false)

const seen = reactive({
  enterTrusted: false,
  /** What the harness's key was actually delivered to. */
  focusedAtEnter: '',
  /** Set when the safety net fired instead of the key — a real failure. */
  timedOut: false
})

/** A short, stable description of an element, for the "what got focused" row. */
const describe = (el: Element | null): string => {
  if (!el || el === document.body) return 'body'
  const cls = el.classList.length > 0 ? `.${el.classList[0]}` : ''
  return `${el.tagName.toLowerCase()}${cls}`
}

/**
 * Walk every reachable stylesheet — `@import`ed ones included, since
 * `/css/styles.css` is nothing but a list of imports — for a style rule whose
 * selector matches and whose ancestry includes a `@layer components` block.
 * Cross-origin sheets throw on `cssRules`; they are skipped, not failed. Same
 * helper as probes 14–31.
 */
const layeredRule = (match: (selector: string) => boolean): CSSStyleRule | null => {
  const LAYER_BLOCK = globalThis.CSSLayerBlockRule
  if (!LAYER_BLOCK) return null

  const walk = (rules: CSSRuleList, insideComponents: boolean): CSSStyleRule | null => {
    for (const rule of Array.from(rules)) {
      const nowInside =
        insideComponents
        || (rule instanceof LAYER_BLOCK && (rule as CSSLayerBlockRule).name === 'components')

      if (nowInside && rule instanceof CSSStyleRule && match(rule.selectorText)) {
        return rule
      }

      if (rule instanceof CSSImportRule) {
        try {
          const imported = rule.styleSheet?.cssRules
          const hit = imported ? walk(imported, nowInside) : null
          if (hit) return hit
        } catch {
          // Cross-origin import target — unreadable, not a failure.
        }
        continue
      }

      const nested = (rule as CSSGroupingRule).cssRules
      const hit = nested ? walk(nested, nowInside) : null
      if (hit) return hit
    }
    return null
  }

  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const hit = walk(sheet.cssRules, false)
      if (hit) return hit
    } catch {
      // Cross-origin sheet.
    }
  }
  return null
}

/**
 * Every `.bf-*` selector on the page that uses `:not()` with anything but a
 * simple selector list (D-20.5). `postcss-preset-env` mis-lowers those and
 * silently breaks the rule, so the ban is checked against the **emitted** CSS
 * rather than against the source it was written in.
 */
const complexNotSelectors = (): string[] => {
  const found: string[] = []

  const walk = (rules: CSSRuleList) => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule && rule.selectorText.includes('.bf-')) {
        /*
         * Everything inside each `:not(…)`. A simple selector list may contain
         * commas but no combinator and no descendant whitespace — `:not(a, b)`
         * is fine, `:not(h3 a)` and `:not(h3 > a)` are the banned shapes.
         */
        for (const m of rule.selectorText.matchAll(/:not\(([^()]*)\)/g)) {
          const inner = (m[1] ?? '').trim()
          if (/[\s>+~]/.test(inner)) found.push(rule.selectorText)
        }
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

const checks = ref<Check[]>([])

/** What the feed looked like at each step of the click sequence. */
const trace = reactive({
  announcements: [] as string[],
  renderedCounts: [] as number[],
  buttonPresent: [] as boolean[]
})

let finalised = false

/**
 * Everything that clicks, focuses, or removes a focused element runs **here**,
 * after the key sequence — gh#39's rule about the sequential-focus starting
 * point. The feed's terminal click *removes a button*, which would move where a
 * later key is delivered; running it first would report a keyboard failure
 * about a component that is fine.
 */
const finalise = async () => {
  if (finalised) return
  finalised = true

  const slot = (key: string) =>
    document.querySelector<HTMLElement>(`[data-probe-slot="${key}"]`) ?? null

  const root = (key: string) =>
    slot(key)?.querySelector<HTMLElement>('.bf-load-more') ?? null

  const button = (key: string) =>
    slot(key)?.querySelector<HTMLButtonElement>('.bf-load-more button.bf-button') ?? null

  const status = (key: string) =>
    slot(key)?.querySelector<HTMLElement>('.bf-load-more__status') ?? null

  const feedItems = () => document.querySelectorAll('[data-probe-feed] li').length

  /** Snapshot the feed control's three observable facts, right now. */
  const snapshot = () => {
    trace.announcements.push((status('feed')?.textContent ?? 'missing').trim())
    trace.renderedCounts.push(feedItems())
    trace.buttonPresent.push(button('feed') !== null)
  }

  // --- the click sequence, on the real feed --------------------------------
  snapshot() // 3 shown, button there
  button('feed')?.click()
  await nextTick()
  snapshot() // 6 shown, button there
  button('feed')?.click()
  await nextTick()
  snapshot() // 9 shown, button GONE — the terminal state

  // A third click is impossible: there is no button. Assert that rather than
  // assume it — a component that merely hid its button would still be clickable.
  const terminalButton = button('feed')
  const loadsAfterSequence = loads.value

  // --- the disabled case ---------------------------------------------------
  const loadingButton = button('loading')
  loadingButton?.click()
  await nextTick()

  const feedRoot = root('feed')
  const feedStatus = status('feed')
  const statusStyle = feedStatus ? getComputedStyle(feedStatus) : null
  const statusBox = feedStatus?.getBoundingClientRect() ?? null
  const feedBox = feedRoot?.getBoundingClientRect() ?? null

  const badNots = complexNotSelectors()

  const allRoots = Array.from(document.querySelectorAll<HTMLElement>('.bf-load-more'))

  const results: Check[] = [
    // --- 1. one click, one emit -------------------------------------------
    {
      label: 'two clicks on the feed control emitted `load` exactly twice',
      expected: 2,
      actual: loadsAfterSequence
    },
    {
      label: 'the component holds no pagination state — the page ref moved, not it',
      expected: `${STEP} -> ${STEP * 2} -> ${POOL.length}`,
      actual: trace.renderedCounts.join(' -> ')
    },
    {
      label: `the caller's slice grew to the whole ${POOL.length}-item pool`,
      expected: POOL.length,
      actual: visible.value
    },

    // --- 2. the announcement tracks the caller's counts --------------------
    {
      label: 'the live region text tracked visibleCount at every step',
      expected: [STEP, STEP * 2, POOL.length]
        .map(n => `Showing ${n} of ${POOL.length} items`)
        .join(' | '),
      actual: trace.announcements.join(' | ')
    },

    // --- 3. the terminal state --------------------------------------------
    {
      label: 'the button was present, present, then GONE (not hidden — gone)',
      expected: 'true,true,false',
      actual: trace.buttonPresent.join(',')
    },
    {
      label: 'no button remains in the DOM at hasMore=false',
      expected: 'null',
      actual: terminalButton === null ? 'null' : describe(terminalButton)
    },
    {
      label: 'nothing renders a hidden-but-present bf-button on the feed',
      expected: 0,
      actual: slot('feed')?.querySelectorAll('.bf-button').length ?? -1
    },
    {
      label: 'the wrapper occupies ZERO height once the button has gone',
      expected: 0,
      actual: Math.round(feedBox?.height ?? -1)
    },

    // --- 4. …and the announcement survives it -----------------------------
    {
      label: 'the live region is STILL in the document after the last load',
      expected: 'true',
      actual: String(feedStatus !== null && document.contains(feedStatus))
    },
    {
      label: '  …carrying the final count, which is the load that matters most',
      expected: `Showing ${POOL.length} of ${POOL.length} items`,
      actual: (feedStatus?.textContent ?? 'missing').trim()
    },

    // --- 5. no counts => literally nothing ---------------------------------
    {
      label: 'the `bare` case (hasMore=false, no counts) renders NO element at all',
      expected: 'null',
      actual: root('bare') === null ? 'null' : describe(root('bare')),
    },
    {
      label: '  …not even a status span',
      expected: 0,
      actual: slot('bare')?.childElementCount ?? -1
    },

    // --- 6. the live region is clipped, not hidden -------------------------
    {
      label: 'the live region is not display:none (which would silence it)',
      expected: 'not-none',
      actual: statusStyle ? (statusStyle.display === 'none' ? 'none' : 'not-none') : 'missing'
    },
    {
      label: 'the live region is not visibility:hidden either',
      expected: 'not-hidden',
      actual: statusStyle
        ? (statusStyle.visibility === 'hidden' ? 'hidden' : 'not-hidden')
        : 'missing'
    },
    {
      label: 'it is nonetheless invisible — a clipped box of at most 1x1px',
      expected: 'true',
      actual: String(
        statusBox !== null && statusBox.width <= 1.5 && statusBox.height <= 1.5
      )
    },
    {
      label: 'role="status" + aria-live="polite" + aria-atomic="true"',
      expected: 'status|polite|true',
      actual: feedStatus
        ? [
            feedStatus.getAttribute('role'),
            feedStatus.getAttribute('aria-live'),
            feedStatus.getAttribute('aria-atomic')
          ].join('|')
        : 'missing'
    },

    // --- 7. loading really disables ---------------------------------------
    {
      label: '`loading` renders a real <button disabled>, not aria-disabled',
      expected: 'BUTTON|true|false',
      actual: loadingButton
        ? [
            loadingButton.tagName,
            String(loadingButton.disabled),
            String(loadingButton.hasAttribute('aria-disabled'))
          ].join('|')
        : 'missing'
    },
    {
      label: 'clicking the disabled control emitted nothing',
      expected: 0,
      actual: loadingCaseEmits.value
    },

    // --- 8. a trusted Enter emits -----------------------------------------
    {
      label: 'the key was delivered to the lab’s button',
      expected: 'button.bf-button',
      actual: seen.focusedAtEnter || 'nothing was focused'
    },
    {
      label: 'the key sequence completed, rather than timing out',
      expected: 'false',
      actual: String(seen.timedOut)
    },
    {
      label: 'a trusted Enter on the focused button emitted `load` once',
      expected: 1,
      actual: labEmits.value
    },
    {
      label: '  …and that Enter was trusted, not synthesised',
      expected: 'true',
      actual: String(seen.enterTrusted)
    },

    // --- 9. label ----------------------------------------------------------
    {
      label: 'the default label is exactly "Load more"',
      expected: 'Load more',
      actual: (button('default')?.textContent ?? 'missing').trim()
    },
    {
      label: 'a passed `label` wins — the wireframe’s "(N remaining)" shape',
      expected: 'Load more (6 remaining)',
      actual: (button('labelled')?.textContent ?? 'missing').trim()
    },

    // --- 10. structure, layer, attrs --------------------------------------
    {
      label: 'the control is a bfButton, not a hand-rolled <button>',
      expected: 'true',
      actual: String(button('default')?.classList.contains('bf-button') ?? false)
    },
    {
      label: '.bf-load-more rules are inside @layer components in the live CSSOM',
      expected: 'true',
      actual: String(layeredRule(s => /\.bf-load-more(?![\w-])/.test(s)) !== null)
    },
    {
      label: 'the visually-hidden rule is layered too',
      expected: 'true',
      actual: String(layeredRule(s => s.includes('.bf-load-more__status')) !== null)
    },
    {
      label: 'the component contributes no inline style of its own',
      expected: 0,
      actual: allRoots.filter(r => r.getAttribute('style') !== null).length
    },
    {
      label: '$attrs fallthrough reaches the root (data-probe-case)',
      expected: 'default,labelled,loading,feed,lab',
      actual: ['default', 'labelled', 'loading', 'feed', 'lab']
        .map(k => root(k)?.dataset.probeCase ?? '')
        .join(',')
    },
    {
      label: '  …and merges with, rather than replacing, the component’s class',
      expected: 'true',
      actual: String(
        root('default')?.classList.contains('bf-load-more') === true
        && root('default')?.classList.contains('probe__marker') === true
      )
    },
    {
      label: 'no bf-* rule uses :not() with a complex selector (D-20.5)',
      expected: 0,
      actual: badNots.length === 0 ? 0 : badNots.join(' ; ')
    }
  ]

  checks.value = results
}

onMounted(() => {
  const labButton = document.querySelector<HTMLButtonElement>(
    '[data-probe-slot="lab"] button.bf-button'
  )

  document.addEventListener('keydown', event => {
    if (event.key !== 'Enter') return
    seen.enterTrusted ||= event.isTrusted
    if (seen.focusedAtEnter === '') seen.focusedAtEnter = describe(document.activeElement)
  })

  document.addEventListener('keyup', event => {
    if (event.key !== 'Enter') return
    /*
     * A beat for the click the browser synthesises from the key to land, and
     * for the emit it triggers to be counted.
     */
    setTimeout(() => { void finalise() }, 150)
  })

  /*
   * The key goes to whatever has focus, and this probe is asking about one
   * specific button — so it says which. This is the only `.focus()` that runs
   * before the key sequence; every click and every removal is inside
   * `finalise()`, per gh#39.
   */
  labButton?.focus()

  /*
   * Safety net. A probe that stays PENDING reports a timeout and nothing else;
   * a probe that finalises reports *which* row failed. It flags itself in a row
   * of its own so a timeout can never be mistaken for a pass.
   */
  setTimeout(() => {
    if (finalised) return
    seen.timedOut = true
    void finalise()
  }, 6000)

  /*
   * Only now — listeners attached, lab focused — ask for the key. The harness
   * polls for this attribute, so its appearance is the handshake.
   */
  armed.value = true
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
    ? 'PENDING — press Enter (assertions run after the key)'
    : `${state.value === 'pass' ? 'PASS' : 'FAIL'} — ${passed.value}/${checks.value.length} checks`
)
</script>

<template>
  <!--
    Harness contract (docs/decisions/probe-harness.md): the root carries
    `data-probe` + `data-probe-verdict`, and every check row carries
    `data-probe-row` + `data-ok`. `data-probe-keys` is bound rather than
    written, so it appears only after `onMounted`.
  -->
  <main
    class="probe container"
    data-probe="32"
    :data-probe-verdict="state.toUpperCase()"
    :data-probe-keys="armed ? 'Enter' : undefined"
  >
    <h1>Probe 32 — <code>bfLoadMore</code></h1>
    <p class="probe__lede">
      A presentational feed-pagination control. It owns <strong>no</strong>
      pagination state: the feed below keeps its own <code>visible</code> ref
      exactly as <code>pages/wireframes/insights/index.vue</code> does and
      increments it in the <code>@load</code> handler.
    </p>
    <p class="probe__lede">
      The assertions run against a <strong>real</strong> sliced
      <code>useBfInsights().active</code> pool — the probe queries, the
      component may not (BRIEF D8) — and the keyboard row is read from a
      <strong>real key event</strong>: the harness presses <kbd>Enter</kbd> on
      the focused lab button.
    </p>

    <!-- ── the real feed ───────────────────────────────────────────────── -->
    <section class="probe__band" aria-labelledby="feed-heading">
      <div class="center | stack" data-gap="s">
        <h2 id="feed-heading">
          <code>feed</code> — a real sliced <code>bfInsights</code> list
        </h2>
        <p class="probe__note">
          {{ POOL.length }} insights, {{ STEP }} at a time. The page owns
          <code>visible</code>; the component is told only
          <code>hasMore</code>, <code>visibleCount</code> and
          <code>totalCount</code>.
        </p>

        <ul class="stack" data-gap="xs" data-probe-feed>
          <li v-for="item in shown" :key="item.slug">{{ item.heading }}</li>
        </ul>

        <div data-probe-slot="feed">
          <bfLoadMore
            :has-more="hasMore"
            :label="`Load more (${POOL.length - visible} remaining)`"
            :visible-count="visible"
            :total-count="POOL.length"
            data-probe-case="feed"
            @load="onLoad"
          />
        </div>

        <p class="probe__note">
          <code>load</code> emitted <strong>{{ loads }}</strong> times.
        </p>
      </div>
    </section>

    <!-- ── the static cases ────────────────────────────────────────────── -->
    <section class="probe__band" aria-labelledby="cases-heading">
      <div class="center | stack" data-gap="s">
        <h2 id="cases-heading">Static cases</h2>

        <h3 class="probe__band-heading">
          <code>default</code> — no <code>label</code>, no counts
        </h3>
        <div data-probe-slot="default">
          <bfLoadMore
            :has-more="true"
            class="probe__marker"
            data-probe-case="default"
          />
        </div>

        <h3 class="probe__band-heading">
          <code>labelled</code> — the wireframe’s “(N remaining)” label
        </h3>
        <div data-probe-slot="labelled">
          <bfLoadMore
            :has-more="true"
            label="Load more (6 remaining)"
            data-probe-case="labelled"
          />
        </div>

        <h3 class="probe__band-heading">
          <code>loading</code> — a load in flight
        </h3>
        <div data-probe-slot="loading">
          <bfLoadMore
            :has-more="true"
            :loading="true"
            :visible-count="24"
            :total-count="354"
            data-probe-case="loading"
            @load="loadingCaseEmits += 1"
          />
        </div>

        <h3 class="probe__band-heading">
          <code>bare</code> — <code>hasMore=false</code> with no counts
        </h3>
        <p class="probe__note">
          The spec’s “not even an empty wrapper” case: the slot below must be
          empty.
        </p>
        <div data-probe-slot="bare">
          <bfLoadMore :has-more="false" data-probe-case="bare" />
        </div>
      </div>
    </section>

    <!-- ── the keyboard lab ────────────────────────────────────────────── -->
    <section class="probe__band" aria-labelledby="lab-heading">
      <div class="center | stack" data-gap="s">
        <h2 id="lab-heading">Keyboard lab</h2>
        <p class="probe__note">
          Focused on mount. <kbd>Enter</kbd> must emit <code>load</code> — the
          browser’s own activation of a native <code>&lt;button&gt;</code>, not
          a scripted <code>.click()</code>.
        </p>
        <div data-probe-slot="lab">
          <bfLoadMore
            :has-more="true"
            label="Press Enter"
            :visible-count="12"
            :total-count="98"
            data-probe-case="lab"
            @load="labEmits += 1"
          />
        </div>
        <p class="probe__note">
          lab <code>load</code> count: <strong>{{ labEmits }}</strong>
        </p>
      </div>
    </section>

    <p
      class="probe__verdict"
      :data-state="state"
      data-testid="probe-32-verdict"
    >
      {{ verdict }}
    </p>

    <table class="probe__table" data-testid="probe-32-table">
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

.probe__note {
  font-size: 0.875rem;
  max-inline-size: 75ch;
}

.probe__band {
  outline: 1px dashed currentcolor;
  outline-offset: 4px;
  margin-block: var(--space-m, 1.5rem);
  max-inline-size: 60ch;
}

.probe__band-heading {
  font-size: 0.875rem;
  font-weight: 400;
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
