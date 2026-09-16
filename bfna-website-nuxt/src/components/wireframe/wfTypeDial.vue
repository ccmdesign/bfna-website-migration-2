<!-- Type dial — a live typography explorer for the wireframe pages only.
     Front 2 (UX/IA) tool: Claudio picks font pairings and dials the scale on
     the real wireframe, with no reload and no rebuild. It writes the
     --wf-* custom properties declared in public/css/wireframe.css straight
     onto the `.wireframe` root, so nothing here can leak into production.

     Client-only (touches document/localStorage) — mount inside <ClientOnly>.
     Dependency-free by design: no font loader, no npm package. Google
     stylesheets are injected as plain <link> elements and deduped in a Map. -->
<script setup lang="ts">
/* ---- Curated families ------------------------------------------------
   `axis` is the css2 `wght` fragment for that family. Ranges are only used
   where the family really is variable on Google Fonts; static families get
   a discrete list or nothing. If a stylesheet 404s anyway, loadFamily()
   retries once without the axis, so a wrong row here degrades to 400-only
   rather than to no font at all. */
type Family = { name: string, axis: string, serif?: boolean }

const FAMILIES: Family[] = [
  { name: 'system-ui', axis: '' },
  { name: 'Archivo', axis: '100..900' },
  { name: 'Bitter', axis: '100..900', serif: true },
  { name: 'Crimson Pro', axis: '200..900', serif: true },
  { name: 'DM Sans', axis: '100..1000' },
  { name: 'DM Serif Display', axis: '', serif: true },
  { name: 'EB Garamond', axis: '400..800', serif: true },
  { name: 'Figtree', axis: '300..900' },
  { name: 'Fraunces', axis: '100..900', serif: true },
  { name: 'IBM Plex Sans', axis: '100;200;300;400;500;600;700' },
  { name: 'Instrument Serif', axis: '', serif: true },
  { name: 'Inter', axis: '100..900' },
  { name: 'Karla', axis: '200..800' },
  { name: 'Libre Franklin', axis: '100..900' },
  { name: 'Literata', axis: '200..900', serif: true },
  { name: 'Lora', axis: '400..700', serif: true },
  { name: 'Manrope', axis: '200..800' },
  { name: 'Merriweather', axis: '300;400;700;900', serif: true },
  { name: 'Newsreader', axis: '200..800', serif: true },
  { name: 'Outfit', axis: '100..900' },
  { name: 'Playfair Display', axis: '400..900', serif: true },
  { name: 'Plus Jakarta Sans', axis: '200..800' },
  { name: 'Public Sans', axis: '100..900' },
  { name: 'Roboto Slab', axis: '100..900', serif: true },
  { name: 'Rubik', axis: '300..900' },
  { name: 'Sora', axis: '100..800' },
  { name: 'Source Sans 3', axis: '200..900' },
  { name: 'Source Serif 4', axis: '200..900', serif: true },
  { name: 'Space Grotesk', axis: '300..700' },
  { name: 'Work Sans', axis: '100..900' },
  { name: 'Zilla Slab', axis: '300;400;500;600;700', serif: true }
]

const byName = new Map(FAMILIES.map(f => [f.name, f]))

/** CSS value for a family, with the right generic fallback. */
function stack(name: string): string {
  if (name === 'system-ui') return 'system-ui, sans-serif'
  const f = byName.get(name)
  return `"${name}", ${f?.serif ? 'serif' : 'sans-serif'}`
}

/* ---- State ----------------------------------------------------------- */

interface DialState {
  preset: string
  display: string
  body: string
  ui: string
  weightDisplay: number
  weightBody: number
  sizeBase: number
  scale: number
  leadingBody: number
  leadingDisplay: number
  trackingDisplay: number
  trackingUi: number
  upperUi: boolean
}

interface Preset {
  id: string
  label: string
  display: string
  body: string
  ui: string
  weightDisplay: number
  trackingDisplay: number
}

const PRESETS: Preset[] = [
  { id: 'system', label: 'Tokens (current)', display: 'system-ui', body: 'system-ui', ui: 'system-ui', weightDisplay: 700, trackingDisplay: 0 },
  { id: 'bitter', label: 'Bitter + Libre Franklin', display: 'Bitter', body: 'Libre Franklin', ui: 'Libre Franklin', weightDisplay: 700, trackingDisplay: -0.01 },
  { id: 'newsreader', label: 'Newsreader + IBM Plex Sans', display: 'Newsreader', body: 'IBM Plex Sans', ui: 'IBM Plex Sans', weightDisplay: 600, trackingDisplay: -0.01 },
  { id: 'literata', label: 'Literata + Public Sans', display: 'Literata', body: 'Public Sans', ui: 'Public Sans', weightDisplay: 600, trackingDisplay: -0.01 },
  { id: 'fraunces', label: 'Fraunces + Inter', display: 'Fraunces', body: 'Inter', ui: 'Inter', weightDisplay: 600, trackingDisplay: -0.015 },
  { id: 'archivo', label: 'Archivo + Source Sans 3', display: 'Archivo', body: 'Source Sans 3', ui: 'Archivo', weightDisplay: 700, trackingDisplay: -0.02 },
  { id: 'playfair', label: 'Playfair Display + Work Sans', display: 'Playfair Display', body: 'Work Sans', ui: 'Work Sans', weightDisplay: 700, trackingDisplay: -0.01 },
  { id: 'grotesk', label: 'Space Grotesk + Inter', display: 'Space Grotesk', body: 'Inter', ui: 'Space Grotesk', weightDisplay: 700, trackingDisplay: -0.02 }
]

const DEFAULTS: DialState = {
  preset: 'system',
  display: 'system-ui',
  body: 'system-ui',
  ui: 'system-ui',
  weightDisplay: 700,
  weightBody: 400,
  sizeBase: 16,
  scale: 1.2,
  leadingBody: 1.5,
  leadingDisplay: 1.1,
  trackingDisplay: 0,
  trackingUi: 0,
  upperUi: false
}

const STORAGE_KEY = 'bfna-wf-type-dial'

const open = ref(false)
const copied = ref(false)
const state = reactive<DialState>({ ...DEFAULTS })

/* ---- Derived --------------------------------------------------------- */

/** Named musical intervals for the modular scale readout. */
const RATIO_NAMES: [number, string][] = [
  [1.125, 'major second'],
  [1.2, 'minor third'],
  [1.25, 'major third'],
  [1.333, 'perfect fourth'],
  [1.414, 'augmented fourth'],
  [1.5, 'perfect fifth']
]

const scaleName = computed(() => {
  let best = RATIO_NAMES[0]!
  for (const r of RATIO_NAMES) {
    if (Math.abs(r[0] - state.scale) < Math.abs(best[0] - state.scale)) best = r
  }
  return Math.abs(best[0] - state.scale) < 0.012 ? best[1] : `${best[1]}-ish`
})

/** The exact block written onto `.wireframe` — also what "Copy CSS" yields. */
const cssText = computed(() => [
  '.wireframe {',
  `  --wf-font-display: ${stack(state.display)};`,
  `  --wf-font-body: ${stack(state.body)};`,
  `  --wf-font-ui: ${stack(state.ui)};`,
  `  --wf-weight-display: ${state.weightDisplay};`,
  `  --wf-weight-body: ${state.weightBody};`,
  `  --wf-size-base: ${state.sizeBase}px;`,
  `  --wf-scale: ${state.scale};`,
  `  --wf-leading-body: ${state.leadingBody};`,
  `  --wf-leading-display: ${state.leadingDisplay};`,
  `  --wf-tracking-display: ${state.trackingDisplay}em;`,
  `  --wf-tracking-ui: ${state.trackingUi}em;`,
  `  --wf-ui-transform: ${state.upperUi ? 'uppercase' : 'none'};`,
  '}'
].join('\n'))

/* ---- Font loading ---------------------------------------------------- */

const loaded = new Map<string, HTMLLinkElement>()

function href(f: Family, withAxis: boolean): string {
  const fam = f.name.replace(/ /g, '+')
  const axis = withAxis && f.axis ? `:wght@${f.axis}` : ''
  return `https://fonts.googleapis.com/css2?family=${fam}${axis}&display=swap`
}

function loadFamily(name: string): void {
  if (name === 'system-ui' || loaded.has(name)) return
  const f = byName.get(name)
  if (!f) return
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.dataset.wfFont = name
  link.href = href(f, true)
  // A wrong `axis` row returns 400 from the css2 API; retry once bare so the
  // family still arrives (regular weight only) instead of silently missing.
  link.addEventListener('error', () => {
    if (link.href !== href(f, false)) link.href = href(f, false)
  }, { once: true })
  document.head.appendChild(link)
  loaded.set(name, link)
}

function loadCurrent(): void {
  for (const n of [state.display, state.body, state.ui]) loadFamily(n)
}

/* ---- Apply / persist ------------------------------------------------- */

function rootEl(): HTMLElement {
  return (document.querySelector('.wireframe') as HTMLElement | null) ?? document.documentElement
}

function apply(): void {
  const el = rootEl()
  el.style.setProperty('--wf-font-display', stack(state.display))
  el.style.setProperty('--wf-font-body', stack(state.body))
  el.style.setProperty('--wf-font-ui', stack(state.ui))
  el.style.setProperty('--wf-weight-display', String(state.weightDisplay))
  el.style.setProperty('--wf-weight-body', String(state.weightBody))
  el.style.setProperty('--wf-size-base', `${state.sizeBase}px`)
  el.style.setProperty('--wf-scale', String(state.scale))
  el.style.setProperty('--wf-leading-body', String(state.leadingBody))
  el.style.setProperty('--wf-leading-display', String(state.leadingDisplay))
  el.style.setProperty('--wf-tracking-display', `${state.trackingDisplay}em`)
  el.style.setProperty('--wf-tracking-ui', `${state.trackingUi}em`)
  el.style.setProperty('--wf-ui-transform', state.upperUi ? 'uppercase' : 'none')
}

function persist(): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch { /* private mode */ }
}

/** @returns true when a previous session's choice was found and loaded. */
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

function selectPreset(p: Preset): void {
  state.preset = p.id
  state.display = p.display
  state.body = p.body
  state.ui = p.ui
  state.weightDisplay = p.weightDisplay
  state.trackingDisplay = p.trackingDisplay
}

/** Any manual family choice detaches from the named pairing. */
function onFamilyChange(): void {
  state.preset = 'custom'
}

function reset(): void {
  // Mute the watcher for this tick, or its apply()/persist() would immediately
  // write the block back and undo the removal below.
  booted = false
  Object.assign(state, DEFAULTS)
  // Drop the inline block entirely so the stylesheet defaults take over —
  // a true reset, not "defaults written inline" (chips go back to monospace).
  const el = rootEl()
  for (const p of [
    '--wf-font-display', '--wf-font-body', '--wf-font-ui',
    '--wf-weight-display', '--wf-weight-body', '--wf-size-base', '--wf-scale',
    '--wf-leading-body', '--wf-leading-display',
    '--wf-tracking-display', '--wf-tracking-ui', '--wf-ui-transform'
  ]) el.style.removeProperty(p)
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

/* ---- Lifecycle ------------------------------------------------------- */

let booted = false

watch(state, () => {
  if (!booted) return
  loadCurrent()
  apply()
  persist()
}, { deep: true })

onMounted(() => {
  // Only write the inline block when the reviewer actually chose something.
  // An untouched wireframe keeps the stylesheet defaults byte for byte —
  // which matters for the two vars with per-site fallbacks (chips stay
  // monospace until a pairing is picked).
  const hadSaved = restore()
  const paint = () => { if (hadSaved) apply(); booted = true }
  if (hadSaved) {
    loadCurrent()
    // Let the restored families land before painting, so the page doesn't
    // flash system-ui first. Anything slower just swaps in (display=swap).
    if (document.fonts?.ready) void document.fonts.ready.then(paint).catch(paint)
    else paint()
  }
  else paint()
  window.addEventListener('keydown', onKey)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
})
</script>

<template>
  <!-- Teleported to <body> on purpose: `.wireframe` sets `filter: grayscale(1)`,
       which makes it the containing block for position:fixed descendants — the
       pill would otherwise pin to the bottom of the ~9000px page instead of the
       viewport (same reason the feedback widget appends itself to body).
       apply() still targets `.wireframe` explicitly, so the dial keeps working. -->
  <Teleport to="body">
    <div class="wf-dial">
      <button
        type="button"
        class="wf-dial__toggle"
        :aria-expanded="open"
        aria-controls="wf-dial-panel"
        title="Typography dial"
        @click="open = !open"
      >Aa</button>

      <div v-show="open" id="wf-dial-panel" class="wf-dial__panel" role="dialog" aria-label="Typography dial">
        <div class="wf-dial__head">
          <strong>TYPE DIAL</strong>
          <button type="button" class="wf-dial__x" aria-label="Close" @click="open = false">×</button>
        </div>

        <!-- a. Pairings -->
        <section class="wf-dial__sec">
          <h2>Pairings</h2>
          <label v-for="p in PRESETS" :key="p.id" class="wf-dial__radio">
            <input
              type="radio"
              name="wf-dial-preset"
              :value="p.id"
              :checked="state.preset === p.id"
              @change="selectPreset(p)"
            >
            <span>{{ p.label }}</span>
          </label>
          <p v-if="state.preset === 'custom'" class="wf-dial__hint">Custom pairing</p>
        </section>

        <!-- b. Custom -->
        <section class="wf-dial__sec">
          <h2>Custom</h2>
          <label class="wf-dial__row">
            <span>Display</span>
            <select v-model="state.display" @change="onFamilyChange">
              <option v-for="f in FAMILIES" :key="f.name" :value="f.name">{{ f.name }}</option>
            </select>
          </label>
          <label class="wf-dial__row">
            <span>Body</span>
            <select v-model="state.body" @change="onFamilyChange">
              <option v-for="f in FAMILIES" :key="f.name" :value="f.name">{{ f.name }}</option>
            </select>
          </label>
          <label class="wf-dial__row">
            <span>UI</span>
            <select v-model="state.ui" @change="onFamilyChange">
              <option v-for="f in FAMILIES" :key="f.name" :value="f.name">{{ f.name }}</option>
            </select>
          </label>
        </section>

        <!-- c. Dials -->
        <section class="wf-dial__sec">
          <h2>Dials</h2>

          <label class="wf-dial__dial">
            <span>Base size <b>{{ state.sizeBase }}px</b></span>
            <input v-model.number="state.sizeBase" type="range" min="14" max="20" step="1">
          </label>

          <label class="wf-dial__dial">
            <span>Scale <b>{{ state.scale.toFixed(3) }} · {{ scaleName }}</b></span>
            <input v-model.number="state.scale" type="range" min="1.125" max="1.5" step="0.005">
          </label>

          <label class="wf-dial__dial">
            <span>Display weight <b>{{ state.weightDisplay }}</b></span>
            <input v-model.number="state.weightDisplay" type="range" min="300" max="900" step="100">
          </label>

          <label class="wf-dial__dial">
            <span>Body weight <b>{{ state.weightBody }}</b></span>
            <input v-model.number="state.weightBody" type="range" min="300" max="700" step="100">
          </label>

          <label class="wf-dial__dial">
            <span>Body leading <b>{{ state.leadingBody.toFixed(2) }}</b></span>
            <input v-model.number="state.leadingBody" type="range" min="1.3" max="1.8" step="0.01">
          </label>

          <label class="wf-dial__dial">
            <span>Display leading <b>{{ state.leadingDisplay.toFixed(2) }}</b></span>
            <input v-model.number="state.leadingDisplay" type="range" min="0.95" max="1.3" step="0.01">
          </label>

          <label class="wf-dial__dial">
            <span>Display tracking <b>{{ state.trackingDisplay.toFixed(3) }}em</b></span>
            <input v-model.number="state.trackingDisplay" type="range" min="-0.05" max="0.05" step="0.005">
          </label>

          <label class="wf-dial__dial">
            <span>UI tracking <b>{{ state.trackingUi.toFixed(3) }}em</b></span>
            <input v-model.number="state.trackingUi" type="range" min="0" max="0.1" step="0.005">
          </label>

          <label class="wf-dial__check">
            <input v-model="state.upperUi" type="checkbox">
            <span>Uppercase UI labels</span>
          </label>
        </section>

        <!-- d. Output -->
        <section class="wf-dial__sec">
          <h2>Output</h2>
          <pre class="wf-dial__out" tabindex="0" aria-label="Generated CSS custom properties">{{ cssText }}</pre>
          <div class="wf-dial__actions">
            <button type="button" @click="copyCss">{{ copied ? 'Copied' : 'Copy CSS' }}</button>
            <button type="button" @click="reset">Reset</button>
          </div>
        </section>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* Dev-tool chrome, deliberately outside wireframe.css: this panel is not
   part of the wireframe skin and must not inherit the dial's own variables.
   Greys only, to match the lo-fi palette. */
.wf-dial {
  font-family: monospace;
  font-size: 12px;
  line-height: 1.4;
  letter-spacing: normal;
  text-transform: none;
  color: #222;
}

.wf-dial__toggle {
  position: fixed;
  left: 16px;
  bottom: 16px;
  z-index: 2147483000;
  width: 40px;
  height: 40px;
  border: 2px solid #222;
  border-radius: 999px;
  background: #fff;
  color: #222;
  font: inherit;
  font-size: 15px;
  cursor: pointer;
}

.wf-dial__toggle:hover {
  background: #222;
  color: #fff;
}

.wf-dial__panel {
  position: fixed;
  left: 16px;
  bottom: 64px;
  z-index: 2147483000;
  width: 320px;
  max-height: 80vh;
  overflow-y: auto;
  padding: 10px 12px 14px;
  border: 2px solid #222;
  background: #fff;
  box-shadow: 0 4px 16px rgb(0 0 0 / 25%);
}

.wf-dial__head {
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

.wf-dial__x {
  border: none;
  background: none;
  font: inherit;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  color: #666;
}

.wf-dial__sec {
  margin-block-start: 12px;
}

.wf-dial__sec h2 {
  margin: 0 0 6px;
  font: inherit;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #666;
  border-bottom: 1px solid #eee;
  padding-bottom: 3px;
}

.wf-dial__radio {
  display: flex;
  gap: 6px;
  align-items: baseline;
  padding: 2px 0;
  cursor: pointer;
}

/* `font: inherit` guards every text node the wireframe's own type wiring
   would otherwise capture — the panel must never restyle itself. */
.wf-dial__hint {
  margin: 4px 0 0;
  font: inherit;
  color: #666;
}

.wf-dial__row {
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: 6px;
  align-items: center;
  margin-bottom: 5px;
}

.wf-dial__row select {
  font: inherit;
  padding: 2px;
  border: 1px solid #999;
  background: #fff;
  color: #222;
  width: 100%;
}

.wf-dial__dial {
  display: block;
  margin-bottom: 7px;
}

.wf-dial__dial span {
  display: block;
  color: #555;
}

.wf-dial__dial b {
  color: #222;
}

.wf-dial__dial input[type="range"] {
  width: 100%;
  accent-color: #222;
}

.wf-dial__check {
  display: flex;
  gap: 6px;
  align-items: center;
  cursor: pointer;
}

.wf-dial__out {
  margin: 0;
  padding: 8px;
  max-height: 180px;
  overflow: auto;
  border: 1px solid #ddd;
  background: #f6f6f6;
  font: inherit;
  font-size: 11px;
  white-space: pre;
  user-select: all;
}

.wf-dial__actions {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

.wf-dial__actions button {
  flex: 1;
  padding: 5px;
  border: 1px solid #222;
  background: #fff;
  color: #222;
  font: inherit;
  cursor: pointer;
}

.wf-dial__actions button:hover {
  background: #222;
  color: #fff;
}

@media (max-width: 420px) {
  .wf-dial__panel {
    width: calc(100vw - 32px);
  }
}
</style>
