<script setup lang="ts">
/**
 * Probe — issue 17 / gh#26: `bfMedia`.
 *
 * Dev-only route, never linked from nav. Kept in place for later issues to
 * regression-check against; only the final cutover issue removes `bf-probe/`.
 *
 * ## What it proves
 *
 * 1. The issue's own acceptance — **1/1, 3/2 and 16/9 in both the real-image
 *    and the placeholder branch**, six boxes, laid out in three equal-width
 *    columns so the two branches at one ratio are directly comparable.
 * 2. **No cumulative layout shift**, made machine-readable. CLS on this
 *    component means one thing: is the box reserved at the declared ratio
 *    before, during and after the bitmap arrives? So each box's *measured*
 *    `width / height` is asserted against its declared ratio, and the real and
 *    placeholder boxes at one ratio are asserted to measure the same height.
 *    A box whose ratio was not reserved fails both. (A `naturalWidth` check is
 *    deliberately **not** written: `nuxt generate` emits an `/_ipx/…` URL with
 *    no server behind it, so the bitmap legitimately 404s in the harness —
 *    which is precisely the case the reserved box has to survive.)
 * 3. **No inline `aspect-ratio` anywhere.** This is the regression the issue
 *    exists to prevent: `wfMedia.vue:11` wrote the ratio into an inline
 *    `style` string, which no consumer rule can outrank, so the full-width
 *    Transponder card could not be re-proportioned.
 * 4. **The override contract, both halves.** A component that always writes
 *    `--_bf-media-ratio` inline is no more overridable than one that writes
 *    `aspect-ratio` inline, so `bfMedia` emits the property only when a
 *    `ratio` prop was passed. Two rows check the two paths: a consumer **CSS
 *    rule** re-proportions a default-ratio instance, and a consumer **inline
 *    `style`** through `$attrs` re-proportions an instance that does pass a
 *    `ratio`.
 * 5. `.bf-media` rules are inside `@layer components` in the live CSSOM.
 * 6. The real branch ships `loading="lazy"` and a non-empty `alt`; the
 *    placeholder branch is `aria-hidden` and painted by the two semantic
 *    tokens, with no colour literal.
 * 7. **Which branch a `src` takes** (gh#203, P1). An absolute URL renders a
 *    plain `<img>` carrying that URL *verbatim* — no `/_ipx/` rewrite, because
 *    `ipx` is a server and this site deploys statically — while a local path
 *    still goes through `NuxtImg`. Both halves are asserted: the second one is
 *    what fails if someone "fixes" the first by deleting the module branch.
 *

 * The vitest harness on `dev` is broken and pre-existing (residual #86), so
 * acceptance is this page under `npx tsx scripts/check-probes.ts --only 17`,
 * per the gh#20–#23 precedent and the #109 harness decision. Recorded in the
 * spec's Decisions section.
 */
defineOptions({ name: 'BfProbe17BfMedia' })

definePageMeta({ layout: 'bf-probe' })

useHead({
  title: 'bf-probe 17 — bfMedia'
})

/**
 * A real file from `src/public/images/`, so the image branch points at
 * something that exists in the checkout rather than a data URI that would
 * bypass the module under test.
 */
const SAMPLE_SRC = '/images/hero/democracy.jpg'
const SAMPLE_ALT = 'Delegates seated around a conference table during a panel discussion.'

/**
 * The gh#203 regression fixture — an **absolute** URL on the real asset host.
 *
 * Never fetched by this probe (see the `naturalWidth` note above: the harness
 * runs offline against `.output/public`). What is asserted is the *string the
 * component put in the attribute*, which is the whole of the bug: `bfMedia`
 * used to hand every `src` to `NuxtImg`, `@nuxt/image` fell back to the `ipx`
 * provider because `nuxt.config.ts` leaves `image.provider` undefined, and the
 * static deploy — which has no `ipx` server — served `200 text/plain` for
 * every `/_ipx/…` URL. Every photo on `/` and `/about` was broken.
 */
const ABSOLUTE_SRC = 'https://bfna.simplyas.com/assets/2e1d0b1a-0000-4000-8000-000000000000'
const ABSOLUTE_ALT = 'A remote photograph served straight from the asset host.'

/**
 * The three ratios the acceptance criterion names.
 *
 * `16/9` deliberately passes **no** `ratio` prop: it renders on the
 * component's CSS default, so the default is exercised at runtime rather than
 * only asserted as a string in the source — and it is that instance a
 * consumer stylesheet is able to override.
 */
const ratios = [
  { key: '1/1', prop: '1/1', value: 1 / 1, note: 'explicit ratio prop' },
  { key: '3/2', prop: '3/2', value: 3 / 2, note: 'explicit ratio prop' },
  { key: '16/9', prop: undefined, value: 16 / 9, note: 'no prop — the component default' }
] as const

/** One asserted value: what it is, what it must be, what it actually is. */
interface Check {
  label: string
  expected: string | number
  actual: string | number
}

const checks = ref<Check[]>([])

onMounted(() => {
  const all = Array.from(document.querySelectorAll<HTMLElement>('.probe .bf-media'))
  const gallery = Array.from(
    document.querySelectorAll<HTMLElement>('.probe__gallery .bf-media')
  )
  const images = gallery.filter(el => el.tagName === 'IMG')
  const placeholders = gallery.filter(el => el.tagName !== 'IMG')

  const byRatio = (list: HTMLElement[], key: string) =>
    list.find(el => el.dataset.probeRatio === key)

  /** Measured ratio of a box, rounded to 3dp so a sub-pixel width cannot decide a verdict. */
  const measured = (el: HTMLElement | null | undefined) => {
    if (!el) return 0
    const r = el.getBoundingClientRect()
    return r.height > 0 ? Math.round((r.width / r.height) * 1000) / 1000 : 0
  }

  /** `true` when the measured ratio is within 1% of the declared one. */
  const ratioHolds = (el: HTMLElement | null | undefined, expected: number) => {
    const m = measured(el)
    return m > 0 && Math.abs(m - expected) / expected < 0.01
  }

  const height = (el: HTMLElement | null | undefined) =>
    el ? Math.round(el.getBoundingClientRect().height) : 0

  /**
   * `getPropertyValue('--color-light')` hands back the *unresolved* token text,
   * which never equals a computed colour. Paint the token onto a throwaway
   * element and read what the browser resolved instead. (Same helper as probes
   * 14–16.)
   */
  const resolveToken = (token: string) => {
    const el = document.createElement('span')
    el.style.cssText = `position:absolute;visibility:hidden;color:var(${token})`
    document.body.appendChild(el)
    const value = getComputedStyle(el).color
    el.remove()
    return value
  }

  /**
   * Walk every reachable stylesheet — `@import`ed ones included, since
   * `/css/styles.css` is nothing but a list of imports — for a `.bf-media`
   * style rule whose ancestry includes a `@layer components` block.
   * Cross-origin sheets throw on `cssRules`; they are skipped, not failed, so
   * the Google Fonts link does not sink the check.
   *
   * Matched as a whole class token, so a future `.bf-media-box` cannot keep
   * this green after the real rule was renamed away.
   */
  const layeredBfMediaRuleFound = (): boolean => {
    const LAYER_BLOCK = globalThis.CSSLayerBlockRule
    if (!LAYER_BLOCK) return false

    const selector = /\.bf-media(?![\w-])/

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

  const cssOverride = document.querySelector<HTMLElement>('[data-probe-override="css"] .bf-media')
  const styleOverride = document.querySelector<HTMLElement>('[data-probe-override="style"] .bf-media')
  const defaultInstance = byRatio(images, '16/9')

  /*
   * The gh#203 provider-branch instances. Queried out of their own section so
   * the six-box count above stays exactly six.
   */
  const absoluteEl = document.querySelector<HTMLElement>('[data-probe-provider="absolute"] .bf-media')
  const relativeEl = document.querySelector<HTMLElement>('[data-probe-provider="relative"] .bf-media')

  /**
   * The *attribute*, not the `.src` IDL property. `el.src` resolves against
   * the document base URL, so a relative attribute would come back absolute
   * and an `/_ipx/…` rewrite would come back as `http://127.0.0.1:PORT/_ipx/…`
   * — still a fail, but a fail whose message names the harness's own port
   * instead of the bug. The attribute is the literal string the component
   * emitted, which is what the deployed HTML carries.
   */
  const srcAttr = (el: HTMLElement | null) => el?.getAttribute('src') ?? 'missing'

  const results: Check[] = [
    // --- 1. both branches × three ratios actually rendered -----------------
    { label: 'boxes rendered in the gallery (2 branches × 3 ratios)', expected: 6, actual: gallery.length },
    { label: '  …3 are the real-image branch (<img> from NuxtImg)', expected: 3, actual: images.length },
    { label: '  …3 are the placeholder branch', expected: 3, actual: placeholders.length },

    // --- 2. the box is reserved at the declared ratio: the CLS check -------
    ...ratios.flatMap(r => ([
      {
        label: `real ${r.key} measures ${r.key}`,
        expected: 'true',
        actual: String(ratioHolds(byRatio(images, r.key), r.value))
      },
      {
        label: `placeholder ${r.key} measures ${r.key}`,
        expected: 'true',
        actual: String(ratioHolds(byRatio(placeholders, r.key), r.value))
      },
      {
        label: `  …and the two ${r.key} boxes reserve the same height`,
        expected: height(byRatio(placeholders, r.key)),
        actual: height(byRatio(images, r.key))
      }
    ])),
    {
      label: 'every box has a non-zero reserved height',
      expected: 0,
      actual: all.filter(el => el.getBoundingClientRect().height === 0).length
    },

    // --- 3. no inline aspect-ratio anywhere (the wfMedia defect) ----------
    {
      label: 'no box carries an inline `aspect-ratio` (wfMedia.vue:11 removed)',
      expected: 0,
      actual: all.filter(el => el.style.aspectRatio !== '').length
    },
    {
      label: 'no box carries an inline `object-fit` either',
      expected: 0,
      actual: all.filter(el => el.style.objectFit !== '').length
    },
    {
      label: 'the ratio is applied through --_bf-media-ratio',
      expected: 6,
      actual: gallery.filter(el =>
        getComputedStyle(el).getPropertyValue('--_bf-media-ratio').trim() !== ''
      ).length
    },

    // --- 4. the override contract, both halves ----------------------------
    {
      label: 'an instance with no `ratio` prop emits no inline custom property',
      expected: '',
      actual: defaultInstance
        ? defaultInstance.style.getPropertyValue('--_bf-media-ratio').trim()
        : 'missing'
    },
    {
      label: '  …so a consumer CSS rule re-proportions it (16/9 → 4/3)',
      expected: 'true',
      actual: String(ratioHolds(cssOverride, 4 / 3))
    },
    {
      label: 'an instance with a `ratio` prop emits the property inline',
      expected: '1/1',
      actual: byRatio(images, '1/1')?.style.getPropertyValue('--_bf-media-ratio').trim() ?? 'missing'
    },
    {
      label: '  …and a consumer inline `style` through $attrs still beats it (16/9 → 4/3)',
      expected: 'true',
      actual: String(ratioHolds(styleOverride, 4 / 3))
    },

    // --- 5. cascade layer -------------------------------------------------
    {
      label: '.bf-media rules are inside @layer components in the live CSSOM',
      expected: 'true',
      actual: String(layeredBfMediaRuleFound())
    },

    // --- 6. the image branch ----------------------------------------------
    {
      label: 'every real image is lazy-loaded',
      expected: 3,
      actual: images.filter(el => el.getAttribute('loading') === 'lazy').length
    },
    {
      label: '  …and decoded async',
      expected: 3,
      actual: images.filter(el => el.getAttribute('decoding') === 'async').length
    },
    {
      label: '  …and carries the alt text it was given',
      expected: 3,
      actual: images.filter(el => el.getAttribute('alt') === SAMPLE_ALT).length
    },
    {
      label: '  …and covers its box (object-fit from the stylesheet)',
      expected: 3,
      actual: images.filter(el => getComputedStyle(el).objectFit === 'cover').length
    },
    {
      label: '$attrs fallthrough reaches the rendered element (data-probe-ratio)',
      expected: '1/1,3/2,16/9',
      actual: images.map(el => el.dataset.probeRatio ?? '').join(',')
    },

    // --- 7. the placeholder branch ----------------------------------------
    {
      label: 'every placeholder is hidden from the a11y tree',
      expected: 3,
      actual: placeholders.filter(el => el.getAttribute('aria-hidden') === 'true').length
    },
    {
      label: 'placeholder ground is --color-light',
      expected: resolveToken('--color-light'),
      actual: placeholders[0] ? getComputedStyle(placeholders[0]).backgroundColor : 'missing'
    },
    {
      label: 'placeholder border is --color-base-super-light',
      expected: resolveToken('--color-base-super-light'),
      actual: placeholders[0] ? getComputedStyle(placeholders[0]).borderTopColor : 'missing'
    },
    {
      label: '  …and the two are not the same paint (the crosshatch is visible)',
      expected: 'true',
      actual: String(resolveToken('--color-light') !== resolveToken('--color-base-super-light'))
    },

    // --- 8. the provider branch (gh#203) ----------------------------------
    {
      label: 'an absolute src renders a plain <img>, never a <picture>/<source> wrapper',
      expected: 'IMG',
      actual: absoluteEl?.tagName ?? 'missing'
    },
    {
      label: '  …with the URL verbatim — no /_ipx/ rewrite (gh#203)',
      expected: ABSOLUTE_SRC,
      actual: srcAttr(absoluteEl)
    },
    {
      label: '  …and it still carries the shared .bf-media class',
      expected: 'true',
      actual: String(absoluteEl?.classList.contains('bf-media') === true)
    },
    {
      label: '  …lazy, async and alt, exactly like the NuxtImg branch',
      expected: 'lazy|async|' + ABSOLUTE_ALT,
      actual: absoluteEl
        ? [
            absoluteEl.getAttribute('loading'),
            absoluteEl.getAttribute('decoding'),
            absoluteEl.getAttribute('alt')
          ].join('|')
        : 'missing'
    },
    {
      label: '  …and the ratio hook still reaches it (ratio="1/1")',
      expected: '1/1',
      actual: absoluteEl?.style.getPropertyValue('--_bf-media-ratio').trim() ?? 'missing'
    },
    {
      label: '  …so its box measures 1/1 like any other',
      expected: 'true',
      actual: String(ratioHolds(absoluteEl, 1))
    },
    {
      /*
       * The other half of the contract. Deleting the NuxtImg branch outright
       * would satisfy every row above; this one fails if it happens, because a
       * local asset that never reaches the module is a silent loss of every
       * `srcset` on the site.
       */
      label: 'a relative src still goes through NuxtImg (src rewritten, not verbatim)',
      expected: 'true',
      actual: String(relativeEl !== null && srcAttr(relativeEl) !== SAMPLE_SRC)
    },
    {
      /*
       * Restating the verbatim row as a substring test, on purpose. The row
       * above fails on *any* difference and prints two long URLs; this one
       * names the actual defect in its own label, so a future reader of a red
       * run sees `/_ipx/` rather than having to diff two strings by eye.
       */
      label: '  …and the absolute src contains no /_ipx/ segment at all',
      expected: 'false',
      actual: String(srcAttr(absoluteEl).includes('/_ipx/'))
    }
  ]

  checks.value = results
})

const passed = computed(() =>
  checks.value.filter(c => String(c.actual) === String(c.expected)).length
)

/**
 * Three states, not two. The assertions run in `onMounted`, so during prerender
 * `checks` is empty — and a two-state verdict would bake `data-state="fail"`
 * into the static HTML for a component that is fine. `pending` says what is
 * actually true of the prerendered page: nothing has run yet. The harness
 * treats a probe still PENDING at timeout as a failure, never a skip.
 */
const state = computed<'pending' | 'pass' | 'fail'>(() => {
  if (checks.value.length === 0) return 'pending'
  return passed.value === checks.value.length ? 'pass' : 'fail'
})

const verdict = computed(() =>
  state.value === 'pending'
    ? 'PENDING — assertions run on mount; open this page in a browser'
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
    data-probe="17"
    :data-probe-verdict="state.toUpperCase()"
  >
    <h1>Probe 17 — <code>bfMedia</code></h1>
    <p class="probe__lede">
      An image slot with a placeholder box, one ratio hook for both branches.
      Each column below is the same width, so the real image and the
      placeholder at one ratio can be compared directly — they must reserve
      the same box. The <code>16/9</code> column passes <em>no</em>
      <code>ratio</code> prop: it renders on the component's CSS default, which
      is what keeps it overridable from a consumer stylesheet.
    </p>

    <section class="probe__gallery" aria-labelledby="gallery-heading">
      <h2 id="gallery-heading">Three ratios, both branches</h2>

      <div class="probe__columns">
        <div v-for="r in ratios" :key="r.key" class="probe__column">
          <h3><code>{{ r.key }}</code></h3>
          <p class="probe__note">{{ r.note }}</p>

          <figure class="probe__box">
            <bfMedia
              :src="SAMPLE_SRC"
              :alt="SAMPLE_ALT"
              :ratio="r.prop"
              :data-probe-ratio="r.key"
            />
            <figcaption>real image</figcaption>
          </figure>

          <figure class="probe__box">
            <bfMedia
              :ratio="r.prop"
              :data-probe-ratio="r.key"
            />
            <figcaption>placeholder — no <code>src</code></figcaption>
          </figure>
        </div>
      </div>
    </section>

    <!--
      A class of its own, not a second `.probe__gallery`: the assertions above
      count the boxes inside `.probe__gallery` and expect exactly the six the
      acceptance criterion names, so the override instances must not be swept
      into that set.
    -->
    <section class="probe__overrides" aria-labelledby="override-heading">
      <h2 id="override-heading">Overriding the ratio from outside</h2>
      <p class="probe__lede">
        The reason this component exists. <code>wfMedia.vue</code> wrote
        <code>aspect-ratio</code> into an inline <code>style</code> string,
        which no consumer rule can outrank at any specificity — the full-width
        Transponder card wanted a different ratio for its wide slot and had no
        way to ask for one. Both escape hatches are exercised here; both boxes
        must measure <code>4/3</code>.
      </p>

      <div class="probe__columns">
        <div class="probe__column" data-probe-override="css">
          <h3>Consumer CSS rule</h3>
          <p class="probe__note">
            No <code>ratio</code> prop, so nothing is inline and the consumer's
            own <code>@layer components</code> rule wins on specificity.
          </p>
          <figure class="probe__box probe__box--override-css">
            <bfMedia :src="SAMPLE_SRC" :alt="SAMPLE_ALT" />
            <figcaption><code>--_bf-media-ratio: 4 / 3</code> from a class</figcaption>
          </figure>
        </div>

        <div class="probe__column" data-probe-override="style">
          <h3>Consumer inline <code>style</code></h3>
          <p class="probe__note">
            <code>ratio="16/9"</code> <em>is</em> passed, so the component emits
            the property inline — and the caller's own <code>style</code>,
            merged after it through <code>$attrs</code>, still wins.
          </p>
          <figure class="probe__box">
            <bfMedia
              :src="SAMPLE_SRC"
              :alt="SAMPLE_ALT"
              ratio="16/9"
              :style="{ '--_bf-media-ratio': '4 / 3' }"
            />
            <figcaption><code>--_bf-media-ratio: 4 / 3</code> from <code>$attrs</code></figcaption>
          </figure>
        </div>
      </div>
    </section>

    <!--
      gh#203. Its own section and its own class, so the six-box count in
      `.probe__gallery` is untouched.
    -->
    <section class="probe__providers" aria-labelledby="providers-heading">
      <h2 id="providers-heading">Which branch a <code>src</code> takes</h2>
      <p class="probe__lede">
        The P1 this section exists for. <code>bfMedia</code> shipped sending
        <em>every</em> <code>src</code> through <code>NuxtImg</code>;
        <code>image.provider</code> is undefined in
        <code>nuxt.config.ts</code> unless <code>NUXT_IMAGE_PROVIDER</code> is
        set, so <code>@nuxt/image</code> fell back to <code>ipx</code> and
        rewrote remote photos to <code>/_ipx/q_90/https:/…</code>.
        <code>ipx</code> is a <em>server</em>; this site deploys as static
        <code>nuxt generate</code> output, so those URLs returned
        <code>200 text/plain</code> from the SPA fallback and every photo on
        <code>/</code> and <code>/about</code> was broken. An absolute URL now
        renders a plain <code>&lt;img&gt;</code> verbatim; a local path still
        goes through the module, because optimising those is what the module
        is for.
      </p>

      <div class="probe__columns">
        <div class="probe__column" data-probe-provider="absolute">
          <h3>Absolute <code>src</code></h3>
          <p class="probe__note">
            <code>https://bfna.simplyas.com/…</code> — plain
            <code>&lt;img&gt;</code>, URL untouched. The bitmap is not fetched
            in the harness; the assertion is on the emitted attribute.
          </p>
          <figure class="probe__box">
            <bfMedia :src="ABSOLUTE_SRC" :alt="ABSOLUTE_ALT" ratio="1/1" />
            <figcaption>no <code>/_ipx/</code> prefix</figcaption>
          </figure>
        </div>

        <div class="probe__column" data-probe-provider="relative">
          <h3>Relative <code>src</code></h3>
          <p class="probe__note">
            <code>/images/hero/democracy.jpg</code> — still
            <code>NuxtImg</code>, so the emitted <code>src</code> differs from
            the input. Deleting that branch would pass every row above and
            silently drop every <code>srcset</code> on the site.
          </p>
          <figure class="probe__box">
            <bfMedia :src="SAMPLE_SRC" :alt="SAMPLE_ALT" ratio="1/1" />
            <figcaption>rewritten by the provider</figcaption>
          </figure>
        </div>
      </div>
    </section>

    <p
      class="probe__verdict"
      :data-state="state"
      data-testid="probe-17-verdict"
    >
      {{ verdict }}
    </p>

    <table class="probe__table" data-testid="probe-17-table">
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

.probe__columns {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: var(--space-m, 1.5rem);
  margin-block-end: var(--space-m, 1.5rem);
}

/*
  A fixed, equal inline size for every column. The ratio assertions compare the
  real and placeholder box at one ratio, so the two must be given identical
  room — a flexible column would make an equal-height check a check on flexbox.
*/
.probe__column {
  inline-size: 18rem;
  flex: 0 0 auto;
}

.probe__note {
  font-size: 0.875rem;
  max-inline-size: 30ch;
}

.probe__box {
  margin: 0 0 var(--space-s, 1rem);
}

.probe__box figcaption {
  margin-block-start: var(--space-2xs, 0.25rem);
  font-size: 0.875rem;
}

/*
  The consumer-stylesheet override, written the way a real consumer would write
  it: inside `@layer components`, where it beats the component's own
  `.bf-media` default on specificity rather than by escaping the layer system.
  An unlayered rule would win too, but it would prove the wrong thing — that
  unlayered CSS outranks layers, not that the component is overridable.
*/
@layer components {
  .probe__box--override-css .bf-media {
    --_bf-media-ratio: 4 / 3;
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
