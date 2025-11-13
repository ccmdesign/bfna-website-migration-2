<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import type { Component, PropType } from 'vue'
import type { ComponentDoc } from '~/utils/parseComponentDocs'
import { resolvePathTokens } from '~/utils/docsPathTokens'

interface CodeSource {
  label: string
  path: string
}

interface ResolvedCodeSource extends CodeSource {
  code: string | null
  error?: string
  resolvedPath?: string
}

type TabId = 'demo' | 'usage' | 'guidance' | 'code'

interface TabItem {
  id: TabId
  label: string
  badge?: string | null
}

const props = defineProps({
  componentId: {
    type: String,
    required: true
  },
  demoPath: {
    type: String,
    required: true
  },
  docsJson: {
    type: String,
    required: true
  },
  guidanceHtml: {
    type: String,
    default: ''
  },
  codeSources: {
    type: Array as PropType<CodeSource[]>,
    default: () => []
  }
})

const nuxtApp = useNuxtApp()
const fetchJson = nuxtApp.$fetch as <Result>(input: string) => Promise<Result>

const componentSlug = computed(() =>
  props.componentId
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase()
)

function fileNameFromPath(input: string): string {
  if (!input) return ''
  const [withoutQuery = ''] = input.split('?')
  const [withoutHash = ''] = withoutQuery.split('#')
  const segments = withoutHash.split('/')
  return segments.pop() || ''
}

function ensureExtension(fileName: string, extension: string): string {
  if (!fileName) return ''
  if (fileName.includes('.')) return fileName
  return `${fileName}${extension}`
}

const demoFileName = computed(() => {
  const fileName = fileNameFromPath(props.demoPath)
  const fallback = `${componentSlug.value}-demo`
  return ensureExtension(fileName || fallback, '.vue')
})

const guidanceFileName = computed(() => {
  const fileName = fileNameFromPath(props.guidanceHtml)
  return ensureExtension(fileName || componentSlug.value, '.html')
})

const docsJsonUrl = computed(() => {
  const raw = props.docsJson?.trim()
  if (raw) {
    let resolved = resolvePathTokens(raw, 'public')
    resolved = resolved.endsWith('.json') ? resolved : `${resolved}.json`
    return resolved
  }
  return `/component-docs/${props.componentId}.json`
})

const demoModules = import.meta.glob('./demos/**/*.vue')
const guidanceModules = import.meta.glob('./demos/_docs/*.html', { as: 'raw' })
const dsSourceModules = import.meta.glob('../ds/**/*.vue', { as: 'raw' })
const demoSourceModulesRaw = import.meta.glob('./demos/**/*.vue', { as: 'raw' })
const codeSourceModules = { ...dsSourceModules, ...demoSourceModulesRaw }

function normalizeKey(value: string): string {
  return value.replace(/\\/g, '/')
}

function findModuleByFileName<T>(modules: Record<string, () => Promise<T>>, fileName: string) {
  if (!fileName) return null
  const normalizedFile = normalizeKey(fileName)
  for (const [key, loader] of Object.entries(modules)) {
    if (normalizeKey(key).endsWith(normalizedFile)) {
      return loader
    }
  }
  return null
}

const { data: docsData, pending: docsPending, error: docsError } = useAsyncData<ComponentDoc | null>(
  () => `docs-tabs-${props.componentId}`,
  async () => {
    if (!docsJsonUrl.value) return null
    try {
      return await fetchJson<ComponentDoc>(docsJsonUrl.value)
    } catch (error) {
      if (import.meta.dev) {
        console.warn(`[DocsTabs] Failed to load docs JSON for ${props.componentId} (${docsJsonUrl.value})`, error)
      }
      throw error
    }
  },
  {
    watch: [docsJsonUrl]
  }
)

const demoLoadError = ref<string | null>(null)
const demoWarned = ref(false)

const DemoComponent = computed(() => {
  demoLoadError.value = null
  const moduleLoader = findModuleByFileName(demoModules, demoFileName.value)
  if (!moduleLoader) {
    if (import.meta.dev && !demoWarned.value) {
      console.warn(`[DocsTabs] Demo module not found for ${props.componentId} (${demoFileName.value})`)
      demoWarned.value = true
    }
    return null
  }

  demoWarned.value = false

  return defineAsyncComponent({
    loader: async () => {
      try {
        const mod = await moduleLoader()
        const component = (mod as { default?: Component }).default || (mod as Component)
        if (!component) {
          throw new Error('Demo module did not export a component')
        }
        return component
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        demoLoadError.value = message
        if (import.meta.dev) {
          console.warn(`[DocsTabs] Failed to load demo for ${props.componentId}: ${message}`)
        }
        throw error
      }
    },
    suspensible: false
  })
})

const guidanceHtml = ref<string | null>(null)
const guidancePending = ref(true)
const guidanceError = ref<string | null>(null)
const guidanceWarned = ref(false)

watch(
  guidanceFileName,
  async file => {
    guidancePending.value = true
    guidanceError.value = null
    const loader = findModuleByFileName(guidanceModules, file)
    if (!loader) {
      guidanceHtml.value = null
      guidancePending.value = false
      if (import.meta.dev && !guidanceWarned.value) {
        console.warn(`[DocsTabs] Guidance fragment not found for ${props.componentId} (${file})`)
        guidanceWarned.value = true
      }
      return
    }

    guidanceWarned.value = false

    try {
      const html = await loader()
      guidanceHtml.value = html
    } catch (error) {
      guidanceError.value = error instanceof Error ? error.message : String(error)
      guidanceHtml.value = null
    } finally {
      guidancePending.value = false
    }
  },
  { immediate: true }
)

const manualSourceEntries = ref<ResolvedCodeSource[]>([])
let manualSourceLoadId = 0

watch(
  () => props.codeSources,
  async sources => {
    manualSourceLoadId += 1
    const currentId = manualSourceLoadId

    if (!sources || sources.length === 0) {
      manualSourceEntries.value = []
      return
    }

    const results = await Promise.all(
      sources.map(async source => {
        const fileName = ensureExtension(fileNameFromPath(source.path), '.vue')
        const loader = findModuleByFileName(codeSourceModules, fileName)

        const resolvedPath = resolvePathTokens(source.path, 'import')

        if (!loader) {
          if (import.meta.dev) {
            console.warn(`[DocsTabs] Code source not found for ${props.componentId}: ${source.path}`)
          }
          return {
            ...source,
            resolvedPath,
            code: null,
            error: 'Source not found'
          }
        }

        try {
          const code = await loader()
          return {
            ...source,
            resolvedPath,
            code
          }
        } catch (error) {
          return {
            ...source,
            resolvedPath,
            code: null,
            error: error instanceof Error ? error.message : String(error)
          }
        }
      })
    )

    if (manualSourceLoadId !== currentId) {
      return
    }

    manualSourceEntries.value = results
  },
  { immediate: true, deep: true }
)

const generatedSnippets = computed(() => docsData.value?.codeSnippets ?? [])
const manualSourcesWithCode = computed(() => manualSourceEntries.value.filter(entry => !!entry.code))
const propCount = computed(() => docsData.value?.props?.length ?? 0)
const showCodeTab = computed(() => generatedSnippets.value.length > 0 || props.codeSources.length > 0)
const codeBadgeCount = computed(() => {
  const manualCount = manualSourcesWithCode.value.length
  return generatedSnippets.value.length + manualCount
})

const tabs = computed<TabItem[]>(() => {
  const items: TabItem[] = [
    { id: 'demo', label: 'Demo' },
    { id: 'usage', label: 'Usage', badge: propCount.value ? String(propCount.value) : null }
  ]

  if (guidanceHtml.value || guidancePending.value || guidanceError.value) {
    items.push({ id: 'guidance', label: 'Guidance' })
  }

  if (showCodeTab.value) {
    items.push({ id: 'code', label: 'Code', badge: codeBadgeCount.value ? String(codeBadgeCount.value) : null })
  }

  return items
})

const activeIndex = ref(0)

watch(
  tabs,
  items => {
    if (!items.length) {
      activeIndex.value = 0
      return
    }

    if (activeIndex.value >= items.length) {
      activeIndex.value = 0
    }
  },
  { immediate: true }
)

const activeTabId = computed(() => tabs.value[activeIndex.value]?.id)

function selectTab(index: number) {
  activeIndex.value = index
}

function isActive(tabId: TabId) {
  return activeTabId.value === tabId
}

const componentTitle = computed(() => docsData.value?.displayName || props.componentId)
const componentDescription = computed(() => docsData.value?.description || '')
const componentCategory = computed(() => docsData.value?.tags?.category || '')
const componentStandards = computed(() => docsData.value?.tags?.standards || '')

function inferLanguage(path: string): string {
  if (!path) return 'vue'
  if (path.endsWith('.ts')) return 'ts'
  if (path.endsWith('.js')) return 'js'
  if (path.endsWith('.md')) return 'markdown'
  return 'vue'
}
</script>

<template>
  <div class="docs-tabs | stack" data-space="l">
    <div class="docs-tabs__summary | stack" data-space="2xs">
      <div class="docs-tabs__headline | cluster" data-space="2xs">
        <h2 class="docs-tabs__title">{{ componentTitle }}</h2>
        <div class="docs-tabs__chips | cluster" data-space="3xs">
          <ccmChip size="xs" variant="outlined" color="neutral">
            {{ props.componentId }}
          </ccmChip>
          <ccmChip v-if="componentCategory" size="xs" color="primary" variant="filled">
            {{ componentCategory }}
          </ccmChip>
          <ccmChip v-if="componentStandards" size="xs" color="success" variant="filled">
            {{ componentStandards }}
          </ccmChip>
        </div>
      </div>
      <p v-if="componentDescription" class="docs-tabs__description">
        {{ componentDescription }}
      </p>
    </div>

    <ccmTabs
      v-if="tabs.length"
      :default-tab="activeIndex"
      aria-label="Component documentation tabs"
      @change="selectTab"
    >
      <template #navigation>
        <ul class="docs-tabs__navigation">
          <li
            v-for="(tab, index) in tabs"
            :key="tab.id"
            class="docs-tabs__nav-item"
            role="tab"
            :aria-selected="activeIndex === index"
            :tabindex="activeIndex === index ? 0 : -1"
          >
            <ccmButton
              size="s"
              :variant="activeIndex === index ? 'primary' : 'ghost'"
              @click="selectTab(index)"
            >
              <span>{{ tab.label }}</span>
              <span v-if="tab.badge" class="docs-tabs__badge">{{ tab.badge }}</span>
            </ccmButton>
          </li>
        </ul>
      </template>

      <template #content>
        <section
          v-for="(tab, index) in tabs"
          :key="`${tab.id}-panel`"
          role="tabpanel"
          class="docs-tabs__panel"
          :hidden="activeIndex !== index"
        >
          <div v-if="tab.id === 'demo'" class="docs-tabs__panel-body">
            <ClientOnly>
              <template #fallback>
                <div class="docs-tabs__state">Loading demo…</div>
              </template>
              <component
                v-if="DemoComponent"
                :is="DemoComponent"
                class="docs-tabs__demo"
              />
              <div v-else class="docs-tabs__state docs-tabs__state--warning">
                <p v-if="demoLoadError">Demo failed to load: {{ demoLoadError }}</p>
                <p v-else>Demo not available for {{ props.componentId }}.</p>
              </div>
            </ClientOnly>
          </div>

          <div v-else-if="tab.id === 'usage'" class="docs-tabs__panel-body">
            <div v-if="docsPending" class="docs-tabs__state">Loading usage data…</div>
            <div v-else-if="docsError" class="docs-tabs__state docs-tabs__state--error">
              Failed to load usage data ({{ docsError.message || docsError.toString() }})
            </div>
            <div v-else-if="propCount === 0" class="docs-tabs__state docs-tabs__state--muted">
              No props documented for this component yet.
            </div>
            <DocsPropsTable v-else :props="docsData?.props || []" />
          </div>

          <div v-else-if="tab.id === 'guidance'" class="docs-tabs__panel-body">
            <div v-if="guidancePending" class="docs-tabs__state">Loading guidance…</div>
            <div v-else-if="guidanceError" class="docs-tabs__state docs-tabs__state--error">
              Failed to load guidance fragment: {{ guidanceError }}
            </div>
            <div v-else-if="!guidanceHtml" class="docs-tabs__state docs-tabs__state--muted">
              Guidance fragment not available yet.
            </div>
            <div v-else class="docs-tabs__guidance">
              <!-- eslint-disable-next-line vue/no-v-html -->
              <div v-html="guidanceHtml" />
            </div>
          </div>

          <div v-else-if="tab.id === 'code'" class="docs-tabs__panel-body">
            <div
              v-if="generatedSnippets.length === 0 && manualSourcesWithCode.length === 0"
              class="docs-tabs__state docs-tabs__state--muted"
            >
              No code snippets available yet.
            </div>

            <div
              v-for="snippet in generatedSnippets"
              :key="snippet.id"
              class="docs-tabs__code-block | stack"
              data-space="2xs"
            >
              <h3 class="docs-tabs__code-title">{{ snippet.label }}</h3>
              <p v-if="snippet.description" class="docs-tabs__code-description">{{ snippet.description }}</p>
              <DocsCodeBlock
                :code="snippet.code"
                :language="snippet.language || 'vue'"
                :title="snippet.label"
              />
            </div>

            <div
              v-for="source in manualSourceEntries"
              :key="source.path"
              class="docs-tabs__code-block | stack"
              data-space="2xs"
            >
              <div class="docs-tabs__code-header | cluster" data-space="3xs">
                <h3 class="docs-tabs__code-title">{{ source.label }}</h3>
                <code class="docs-tabs__code-path">{{ source.resolvedPath || source.path }}</code>
              </div>
              <DocsCodeBlock
                v-if="source.code"
                :code="source.code"
                :language="inferLanguage(source.resolvedPath || source.path)"
                :title="source.label"
              />
              <div v-else class="docs-tabs__state docs-tabs__state--warning">
                {{ source.error || 'Source content unavailable' }}
              </div>
            </div>
          </div>
        </section>
      </template>
    </ccmTabs>

    <div v-else class="docs-tabs__state docs-tabs__state--error">
      Tabs unavailable. Ensure component metadata is configured correctly.
    </div>
  </div>
</template>

<style scoped>
.docs-tabs {
  display: grid;
  gap: var(--space-l);
}

.docs-tabs__summary {
  display: grid;
  gap: var(--space-2xs);
}

.docs-tabs__headline {
  align-items: baseline;
  flex-wrap: wrap;
}

.docs-tabs__title {
  margin: 0;
  font-size: var(--size-2);
  font-weight: var(--font-weight-semibold);
}

.docs-tabs__chips {
  flex-wrap: wrap;
}

.docs-tabs__description {
  margin: 0;
  color: var(--color-secondary);
  font-size: var(--size-0);
}

.docs-tabs__navigation {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.docs-tabs__nav-item {
  display: flex;
}

.docs-tabs__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: var(--space-3xs);
  padding: 0 var(--space-3xs);
  background-color: var(--color-secondary);
  color: var(--color-white);
  border-radius: var(--radius-pill);
  font-size: var(--size--2);
  line-height: 1;
}

.docs-tabs__panel {
  display: block;
}

.docs-tabs__panel-body {
  display: grid;
  gap: var(--space-m);
}

.docs-tabs__demo {
  display: block;
}

.docs-tabs__guidance {
  display: grid;
  gap: var(--space-s);
}

.docs-tabs__state {
  padding: var(--space-m);
  border-radius: var(--radius-m);
  background-color: var(--color-base-tint-05);
  color: var(--color-secondary);
  font-size: var(--size--1);
}

.docs-tabs__state--warning {
  background-color: var(--color-warning-tint-20);
  color: var(--color-warning);
}

.docs-tabs__state--error {
  background-color: var(--color-fail-tint-20);
  color: var(--color-fail);
}

.docs-tabs__state--muted {
  background-color: var(--color-base-tint-05);
  color: var(--color-base);
}

.docs-tabs__code-block {
  display: grid;
  gap: var(--space-2xs);
}

.docs-tabs__code-header {
  align-items: baseline;
  justify-content: space-between;
}

.docs-tabs__code-title {
  margin: 0;
  font-size: var(--size-0);
  font-weight: var(--font-weight-semibold);
}

.docs-tabs__code-description {
  margin: 0;
  color: var(--color-secondary);
  font-size: var(--size--1);
}

.docs-tabs__code-path {
  font-family: var(--font-family-mono);
  font-size: var(--size--2);
  color: var(--color-secondary);
}

@media (max-width: 768px) {
  .docs-tabs__headline {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2xs);
  }

  .docs-tabs__navigation {
    gap: var(--space-2xs);
  }
}
</style>

