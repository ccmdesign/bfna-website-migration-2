<template>
  <div class="stack" data-gap="xl">
    <section class="wf-slot" data-label="Insights feed">
      <div class="center | stack" data-gap="s" style="padding-block: var(--space-l);">
        <nav aria-label="Breadcrumb"><NuxtLink to="/wireframes">Home</NuxtLink></nav>
        <h1>{{ feedPage?.heading ?? 'Insights' }}</h1>
        <p v-if="feedPage?.description" data-measure="normal">{{ feedPage.description }}</p>
      </div>
    </section>

    <!-- Filters: real, driven by query params -->
    <section class="wf-slot" data-label="Filters">
      <div class="center | stack" data-gap="s">
        <div class="cluster" data-gap="xs">
          <span>Format:</span>
          <NuxtLink v-for="f in FORMATS" :key="f.key" :to="linkWith({ format: f.key })" class="wf-chip" :style="query.format === f.key ? 'background:#222;color:#fff' : ''">{{ f.label }}</NuxtLink>
        </div>
        <div class="cluster" data-gap="xs">
          <span>Focus area:</span>
          <NuxtLink v-for="a in programs()" :key="a.slug" :to="linkWith({ area: a.slug })" class="wf-chip" :style="query.area === a.slug ? 'background:#222;color:#fff' : ''">{{ a.name }}</NuxtLink>
        </div>
        <div class="cluster" data-gap="xs">
          <NuxtLink :to="linkWith({ archive: query.archive ? undefined : '1' })" class="wf-button">{{ query.archive ? 'Hide' : 'Include' }} archived ({{ archived.length }})</NuxtLink>
          <NuxtLink v-if="query.format || query.area || query.archive" to="/wireframes/insights" class="wf-button">Clear filters</NuxtLink>
        </div>
      </div>
    </section>

    <!-- Results -->
    <section class="wf-slot" data-label="Results">
      <div class="center | stack" data-gap="m">
        <p><strong>{{ filtered.length }}</strong> items<span v-if="query.archive"> (including archive)</span></p>
        <div class="grid" data-min-width="m" data-gap="m">
          <article v-for="i in filtered.slice(0, visible)" :key="i.slug" class="wf-card">
            <div class="cluster" data-gap="xs">
              <span class="wf-chip">{{ formatLabel(i.format) }}</span>
              <span v-if="i.archived" class="wf-chip">Archive</span>
            </div>
            <h3><NuxtLink :to="`/wireframes/insights/${i.slug}`">{{ i.heading }}</NuxtLink></h3>
            <time>{{ monthYear(i.publish_date) }}</time>
          </article>
        </div>
        <p v-if="filtered.length > visible">
          <button class="wf-button" @click="visible += 24">Load more ({{ filtered.length - visible }} remaining)</button>
        </p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'wireframe' })

const route = useRoute()
const { active, archived, programs, programBySlug, pageBySlug, formatLabel, monthYear } = useWfContent()
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
