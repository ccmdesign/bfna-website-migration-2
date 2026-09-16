<!-- Footer gap dial — a live spacing explorer for the footer social row,
     dev-only. Claudio tunes the dash length between the social marks (the
     cluster gap), the mask padding inside each mark, and the glyph size,
     directly on the real page, with no reload.

     Copies `wireframe/wfTypeDial.vue`'s interaction pattern (floating pill →
     panel, sliders with readouts, localStorage, Copy CSS, Teleport to body,
     Esc closes) onto the three public hooks `Footer.vue`'s `<style>` exposes
     for exactly this: `--bf-footer-social-gap`, `--bf-footer-social-pad`,
     `--bf-footer-social-size`. Unset, those hooks are no-ops — the footer's
     fluid `--space-*` behaviour, at every container width, is unchanged
     until this panel writes to one.

     Client-only (touches document/localStorage) — mount inside <ClientOnly>,
     and only in dev: `bf-default.vue` gates it with `v-if="import.meta.dev"`. -->
<script setup lang="ts">
interface DialState {
  /** Cluster gap between marks, in px — the dash length. */
  gap: number
  /** Mask padding inside each mark, in px. */
  pad: number
  /** Glyph size of a social mark, in px. */
  size: number
}

/**
 * Nominal desktop values of the three tokens this dial overrides —
 * `--space-l` (40px), `--space-s` (20px) and `--_bf-footer-icon-size`
 * (1.25rem = 20px) at their desktop-end clamp() value. Not measured at
 * mount: like `wfTypeDial`'s `DEFAULTS`, these are the dial's own resting
 * position, not a live read of the fluid token — the token itself keeps
 * doing its fluid thing until a slider is actually moved.
 */
const DEFAULTS: DialState = {
  gap: 40,
  pad: 20,
  size: 20
}

const STORAGE_KEY = 'bfna-footer-gap-dial'

const open = ref(false)
const copied = ref(false)
const state = reactive<DialState>({ ...DEFAULTS })

/* ---- Nearest --space-* token, resolved at runtime -------------------- */

/**
 * Every base step on the fluid space ramp (`tokens/primitive-spacing.css`) —
 * the "One-up"/"Custom pairs" are excluded, so a 40px readout says `--space-l`
 * rather than a two-name pair nobody dials to on purpose.
 */
const SPACE_TOKENS = ['3xs', '2xs', 'xs', 's', 'm', 'l', 'xl', '2xl', '3xl']

/**
 * A hidden probe element, created once and reused. A `--space-*` token is a
 * `clamp(..., ...vw, ...)` expression — `getComputedStyle(root).getPropertyValue`
 * on a custom property returns that text verbatim (the computed value of a
 * custom property is *not* further resolved), so the only way to get its
 * resolved px at the current viewport is to hand it to a real layout
 * property on a real element and measure that.
 */
let probeEl: HTMLDivElement | null = null
function probe(): HTMLDivElement {
  if (probeEl) return probeEl
  const el = document.createElement('div')
  el.style.position = 'absolute'
  el.style.visibility = 'hidden'
  el.style.pointerEvents = 'none'
  el.style.height = '0'
  el.style.overflow = 'hidden'
  document.body.appendChild(el)
  probeEl = el
  return el
}

function tokenPx(name: string): number {
  const el = probe()
  el.style.width = `var(--space-${name})`
  return parseFloat(getComputedStyle(el).width)
}

function nearestToken(px: number): { name: string, px: number } {
  let best = { name: SPACE_TOKENS[0]!, px: tokenPx(SPACE_TOKENS[0]!) }
  for (const name of SPACE_TOKENS) {
    const candidate = tokenPx(name)
    if (Math.abs(candidate - px) < Math.abs(best.px - px)) best = { name, px: candidate }
  }
  return best
}

// Bumped on resize so the two computeds below re-run: the token ramp is
// fluid, so the nearest name at 40px can change between a wide and a narrow
// viewport even though the slider itself hasn't moved.
const viewportTick = ref(0)
function onResize(): void { viewportTick.value++ }

const gapToken = computed(() => { void viewportTick.value; return nearestToken(state.gap) })
const padToken = computed(() => { void viewportTick.value; return nearestToken(state.pad) })

/* ---- Output ------------------------------------------------------------ */

/** The exact block "Copy CSS" yields — pastable as-is, no JS required. */
const cssText = computed(() => [
  '.bf-footer__social {',
  `  --bf-footer-social-gap: ${state.gap}px; /* ≈ --space-${gapToken.value.name} */`,
  '}',
  '.bf-footer__social-link {',
  `  --bf-footer-social-pad: ${state.pad}px; /* ≈ --space-${padToken.value.name} */`,
  `  --bf-footer-social-size: ${state.size}px;`,
  '}'
].join('\n'))

/* ---- Apply / persist ---------------------------------------------------- */

const PROPS = ['--bf-footer-social-gap', '--bf-footer-social-pad', '--bf-footer-social-size'] as const

function rootEl(): HTMLElement {
  return (document.querySelector('.bf-footer') as HTMLElement | null) ?? document.documentElement
}

// Only true once this dial has actually written to the footer — guards the
// route-change re-apply below so an untouched dial never forces a fixed px
// value over the fluid default on a page a user only opened once.
let everApplied = false

function apply(): void {
  const el = rootEl()
  el.style.setProperty('--bf-footer-social-gap', `${state.gap}px`)
  el.style.setProperty('--bf-footer-social-pad', `${state.pad}px`)
  el.style.setProperty('--bf-footer-social-size', `${state.size}px`)
  everApplied = true
}

function persist(): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch { /* private mode */ }
}

/** @returns true when a previous session's dial position was found and loaded. */
function restore(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return false
    const saved = JSON.parse(raw) as Record<string, unknown>
    const target = state as unknown as Record<string, unknown>
    for (const k of Object.keys(DEFAULTS)) {
      if (saved[k] !== undefined && typeof saved[k] === typeof target[k]) target[k] = saved[k]
    }
    return true
  } catch { /* corrupt or unavailable — keep defaults */ }
  return false
}

function reset(): void {
  // Mute the watcher for this tick, or its apply()/persist() would
  // immediately write the block back and undo the removal below.
  booted = false
  Object.assign(state, DEFAULTS)
  const el = rootEl()
  for (const p of PROPS) el.style.removeProperty(p)
  everApplied = false
  try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
  void nextTick(() => { booted = true })
}

async function copyCss(): Promise<void> {
  try {
    await navigator.clipboard.writeText(cssText.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 1500)
  } catch { /* clipboard blocked — the <pre> is selectable */ }
}

function onKey(e: KeyboardEvent): void {
  if (e.key === 'Escape' && open.value) open.value = false
}

/* ---- Lifecycle ----------------------------------------------------------- */

let booted = false

watch(state, () => {
  if (!booted) return
  apply()
  persist()
}, { deep: true })

onMounted(() => {
  const hadSaved = restore()
  if (hadSaved) apply()
  booted = true
  window.addEventListener('keydown', onKey)
  window.addEventListener('resize', onResize)

  // The footer remounts per layout render — its DOM node (and any inline
  // custom properties JS wrote on it) does not survive a route change.
  // Re-apply the dial's current position onto the new node, but only if it
  // was ever actually set (see `everApplied`).
  const router = useRouter()
  router.afterEach(() => {
    void nextTick(() => { if (everApplied) apply() })
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('resize', onResize)
  probeEl?.remove()
})
</script>

<template>
  <!-- Teleported to <body> on purpose, matching wfTypeDial: keeps this
       fixed-position panel pinned to the viewport regardless of what
       stacking/containing-block context its mount point sits in. apply()
       still targets `.bf-footer` explicitly, so the dial keeps working. -->
  <Teleport to="body">
    <div class="fg-dial">
      <button
        type="button"
        class="fg-dial__toggle"
        :aria-expanded="open"
        aria-controls="fg-dial-panel"
        title="Footer social-row gap dial"
        @click="open = !open"
      >Gap</button>

      <div v-show="open" id="fg-dial-panel" class="fg-dial__panel" role="dialog" aria-label="Footer gap dial">
        <div class="fg-dial__head">
          <strong>FOOTER GAP</strong>
          <button type="button" class="fg-dial__x" aria-label="Close" @click="open = false">×</button>
        </div>

        <section class="fg-dial__sec">
          <label class="fg-dial__dial">
            <span>Dash length (gap) <b>{{ state.gap }}px &#8776; --space-{{ gapToken.name }}</b></span>
            <input v-model.number="state.gap" type="range" min="0" max="96" step="2">
          </label>

          <label class="fg-dial__dial">
            <span>Icon mask padding <b>{{ state.pad }}px &#8776; --space-{{ padToken.name }}</b></span>
            <input v-model.number="state.pad" type="range" min="0" max="48" step="1">
          </label>

          <label class="fg-dial__dial">
            <span>Icon size <b>{{ state.size }}px</b></span>
            <input v-model.number="state.size" type="range" min="12" max="32" step="1">
          </label>
        </section>

        <section class="fg-dial__sec">
          <h2>Output</h2>
          <pre class="fg-dial__out" tabindex="0" aria-label="Generated CSS custom properties">{{ cssText }}</pre>
          <div class="fg-dial__actions">
            <button type="button" @click="copyCss">{{ copied ? 'Copied' : 'Copy CSS' }}</button>
            <button type="button" @click="reset">Reset</button>
          </div>
        </section>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* Dev-tool chrome, deliberately its own thing: greys only, monospace,
   matching wfTypeDial's lo-fi palette so the two dials read as one family. */
.fg-dial {
  font-family: monospace;
  font-size: 12px;
  line-height: 1.4;
  letter-spacing: normal;
  text-transform: none;
  color: #222;
}

.fg-dial__toggle {
  position: fixed;
  left: 16px;
  bottom: 16px;
  z-index: 2147483000;
  padding: 9px 14px;
  border: 2px solid #222;
  border-radius: 999px;
  background: #fff;
  color: #222;
  font: inherit;
  font-size: 13px;
  letter-spacing: 0.04em;
  cursor: pointer;
}

.fg-dial__toggle:hover {
  background: #222;
  color: #fff;
}

.fg-dial__panel {
  position: fixed;
  left: 16px;
  bottom: 64px;
  z-index: 2147483000;
  width: 300px;
  max-height: 80vh;
  overflow-y: auto;
  padding: 10px 12px 14px;
  border: 2px solid #222;
  background: #fff;
  box-shadow: 0 4px 16px rgb(0 0 0 / 25%);
}

.fg-dial__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: -10px;
  margin: -10px -12px 8px;
  padding: 8px 12px;
  background: #fff;
  border-bottom: 1px solid #ccc;
  letter-spacing: 0.08em;
}

.fg-dial__x {
  border: none;
  background: none;
  font: inherit;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  color: #666;
}

.fg-dial__sec {
  margin-block-start: 12px;
}

.fg-dial__sec h2 {
  margin: 0 0 6px;
  font: inherit;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #666;
  border-bottom: 1px solid #eee;
  padding-bottom: 3px;
}

.fg-dial__dial {
  display: block;
  margin-bottom: 9px;
}

.fg-dial__dial span {
  display: block;
  color: #555;
}

.fg-dial__dial b {
  color: #222;
}

.fg-dial__dial input[type="range"] {
  width: 100%;
  accent-color: #222;
}

.fg-dial__out {
  margin: 0;
  padding: 8px;
  max-height: 140px;
  overflow: auto;
  border: 1px solid #ddd;
  background: #f6f6f6;
  font: inherit;
  font-size: 11px;
  white-space: pre;
  user-select: all;
}

.fg-dial__actions {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

.fg-dial__actions button {
  flex: 1;
  padding: 5px;
  border: 1px solid #222;
  background: #fff;
  color: #222;
  font: inherit;
  cursor: pointer;
}

.fg-dial__actions button:hover {
  background: #222;
  color: #fff;
}

@media (max-width: 420px) {
  .fg-dial__panel {
    width: calc(100vw - 32px);
  }
}
</style>
