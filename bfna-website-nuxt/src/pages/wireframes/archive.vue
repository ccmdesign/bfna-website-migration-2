<template>
  <div class="stack" data-gap="xl">
    <wf-section label="Archive index" gap="s" padded>
      <nav aria-label="Breadcrumb"><NuxtLink to="/wireframes">Home</NuxtLink> / <NuxtLink to="/wireframes/insights">Insights</NuxtLink></nav>
      <h1>{{ indexPage?.heading ?? 'Archive' }}</h1>
      <p v-if="indexPage?.description" data-measure="normal">{{ indexPage.description }}</p>
      <p data-measure="narrow">{{ archived.length }} pieces of past work, {{ years[years.length - 1]?.year }}–{{ years[0]?.year }}.</p>
    </wf-section>

    <wf-section label="By year">
      <details v-for="y in years" :key="y.year" :open="y === years[0]">
        <summary><strong>{{ y.year }}</strong> ({{ y.items.length }})</summary>
        <ul class="stack" data-gap="xs" style="padding-block: var(--space-s); list-style: none;">
          <li v-for="i in y.items" :key="i.slug" class="cluster" data-gap="xs">
            <span class="wf-chip">{{ formatLabel(i.format) }}</span>
            <NuxtLink :to="`/wireframes/insights/${i.slug}`">{{ i.heading }}</NuxtLink>
            <time>{{ monthYear(i.publish_date) }}</time>
          </li>
        </ul>
      </details>
    </wf-section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'wireframe' })

const { archived, pageBySlug, formatLabel, monthYear } = useWfContent()
const indexPage = pageBySlug('archive')

const byYear = new Map<string, typeof archived>()
for (const i of archived) {
  const y = i.publish_date?.slice(0, 4) ?? 'Undated'
  if (!byYear.has(y)) byYear.set(y, [])
  byYear.get(y)!.push(i)
}
const years = [...byYear.entries()]
  .map(([year, items]) => ({ year, items }))
  .sort((a, b) => b.year.localeCompare(a.year))
</script>
