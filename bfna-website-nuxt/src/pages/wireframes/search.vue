<template>
  <NuxtLayout name="wireframe">
    <template #hero>
      <wf-page-header label="Search" heading="Search">
        <div class="cluster" data-gap="s">
          <input v-model="q" type="search" placeholder="Search insights, projects, people…" aria-label="Search" style="min-width: 20rem;">
        </div>
      </wf-page-header>
    </template>

    <wf-section v-if="q.length > 1" label="Results">
      <p><strong>{{ results.length }}</strong> results for “{{ q }}”</p>
      <div class="stack" data-gap="s">
        <article v-for="r in results.slice(0, 20)" :key="r.slug" class="cluster" data-gap="xs">
          <wf-chip>{{ r.chip }}</wf-chip>
          <wf-chip v-if="r.archived">Archive</wf-chip>
          <NuxtLink :to="r.to">{{ r.heading }}</NuxtLink>
          <time v-if="r.date">{{ r.date }}</time>
        </article>
      </div>
    </wf-section>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const { items, projects, people, formatLabel, monthYear } = useWfContent()
const q = ref('')

// Cross-type pool from the consolidated dataset: insights + projects + people
const pool = [
  ...items.map(i => ({
    slug: `i-${i.slug}`, heading: i.heading, haystack: `${i.heading} ${i.excerpt}`,
    chip: formatLabel(i.format), archived: !!i.archived, to: `/wireframes/insights/${i.slug}`, date: monthYear(i.publish_date)
  })),
  ...projects().map(p => ({
    slug: `p-${p.slug}`, heading: p.heading, haystack: `${p.heading} ${p.excerpt} ${p.description}`,
    chip: 'Project', archived: false, to: `/wireframes/projects/${p.slug}`, date: ''
  })),
  ...people().map(p => ({
    slug: `pe-${p.slug}`, heading: p.name, haystack: `${p.name} ${p.job_title}`,
    chip: 'Person', archived: false, to: '/wireframes/about#team', date: ''
  }))
]

const results = computed(() => {
  const needle = q.value.toLowerCase()
  return pool.filter(r => r.haystack.toLowerCase().includes(needle))
})
</script>
