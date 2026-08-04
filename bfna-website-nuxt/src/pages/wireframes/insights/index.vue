<template>
  <NuxtLayout name="wireframe">
    <template #hero>
      <wf-page-header
        label="Insights feed" :crumbs="[{ label: 'Home', to: '/wireframes' }]"
        :heading="feedPage?.heading ?? 'Insights'" :tagline="feedPage?.description"
      />
    </template>

    <!-- Filters: real, driven by query params -->
    <wf-section label="Filters" gap="s">
      <div class="cluster" data-gap="xs">
        <span>Format:</span>
        <wf-chip v-for="f in FORMATS" :key="f.key" :to="linkWith({ format: f.key })" :active="query.format === f.key">{{ f.label }}</wf-chip>
      </div>
      <div class="cluster" data-gap="xs">
        <span>Focus area:</span>
        <wf-chip v-for="a in programs()" :key="a.slug" :to="linkWith({ area: a.slug })" :active="query.area === a.slug">{{ a.name }}</wf-chip>
      </div>
      <div class="cluster" data-gap="xs">
        <NuxtLink :to="linkWith({ archive: query.archive ? undefined : '1' })" class="wf-button">{{ query.archive ? 'Hide' : 'Include' }} archived ({{ archived.length }})</NuxtLink>
        <NuxtLink v-if="query.format || query.area || query.archive" to="/wireframes/insights" class="wf-button">Clear filters</NuxtLink>
      </div>
    </wf-section>

    <!-- Results -->
    <wf-section label="Results">
      <p><strong>{{ filtered.length }}</strong> items<span v-if="query.archive"> (including archive)</span></p>
      <wf-grid-insights :insights="filtered.slice(0, visible)" />
      <p v-if="filtered.length > visible">
        <button class="wf-button" @click="visible += 24">Load more ({{ filtered.length - visible }} remaining)</button>
      </p>
    </wf-section>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const route = useRoute()
const { active, archived, programs, programBySlug, pageBySlug } = useWfContent()
const feedPage = pageBySlug('insights')

const FORMATS = [
  { key: 'article', label: 'Articles' },
  { key: 'report', label: 'Reports' },
  { key: 'video', label: 'Videos' },
  { key: 'infographic', label: 'Infographics' }
]

const query = computed(() => route.query as Record<string, string | undefined>)
const visible = ref(24)

// Toggle behavior: clicking an active filter clears it
const linkWith = (patch: Record<string, string | undefined>) => {
  const cur = query.value
  const q: Record<string, string> = {}
  for (const [k, v] of Object.entries({ ...cur, ...patch })) {
    if (v && !(k in patch && cur[k] === patch[k])) q[k] = v
  }
  return { path: '/wireframes/insights', query: q }
}

const filtered = computed(() => {
  const q = query.value
  const pool = q.archive ? [...active, ...archived] : active
  const areaName = q.area ? programBySlug(q.area)?.name : undefined
  return pool.filter(i =>
    (!q.format || (i.format ?? 'article').split('|')[0] === q.format || (q.format === 'article' && (i.format ?? '').includes('article'))) &&
    (!areaName || i.program === areaName)
  )
})
</script>
