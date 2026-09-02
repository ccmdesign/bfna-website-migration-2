<template>
  <NuxtLayout name="wireframe">
    <template #hero>
      <!-- GGS: standardized structure — same things in the same places, on every insight -->
      <wf-page-header v-if="insight" label="Insight header" :crumbs="crumbs" :chips="chips" :heading="insight.heading">
        <p v-if="insight.subheading"><strong>{{ insight.subheading }}</strong></p>
        <p class="cluster" data-gap="s">
          <span v-if="insight.authors?.length">By {{ insight.authors.join(', ') }}</span>
          <span v-else>By [author]</span>
          <time>{{ monthYear(insight.publish_date) }}</time>
        </p>
      </wf-page-header>
    </template>

    <template v-if="insight">
      <!-- Archive banner (GGS: archived stays live + indexed, but labeled) -->
      <wf-section v-if="insight.archived" label="Archive banner" layout="plain">
        <p class="wf-note">{{ bannerText }} <a href="#">See recent work on {{ insight.program }}</a></p>
      </wf-section>

      <!-- Body: excerpt dek + media + full Directus content via the prose renderer -->
      <wf-section label="Body" measure="narrow">
        <p><em>{{ plain(insight.excerpt) }}</em></p>
        <wf-media :src="insight.image" :alt="insight.heading ?? ''" ratio="16/9" />
        <wf-prose :content="insight.content" />
        <p v-if="insight.download"><a :href="'#'" class="wf-button">Download the report (PDF)</a></p>
      </wf-section>

      <!-- GGS: machine-readable relationships + onward journey -->
      <wf-section label="Related insights" :heading="`More on ${insight.program}`">
        <wf-grid-insights :insights="related" />
      </wf-section>
    </template>

    <div v-else class="center | stack" style="padding-block: var(--space-xl);">
      <h1>Insight not found in content.json</h1>
      <p><NuxtLink to="/wireframes">Back to wireframe home</NuxtLink></p>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const route = useRoute()
const { bySlug, activeByProgram, projectBySlug, pageBySlug, formatLabel, monthYear, plain } = useWfContent()

const insight = bySlug(route.params.slug as string)
const related = insight?.program
  ? activeByProgram(insight.program).filter(i => i.slug !== insight.slug).slice(0, 3)
  : []

const projectName = (slug: string) => projectBySlug(slug)?.heading ?? slug

const crumbs = [
  { label: 'Home', to: '/wireframes' },
  { label: 'Insights', to: '/wireframes/insights' }
]
const chips = insight
  ? [formatLabel(insight.format), insight.program,
     ...(insight.projects ?? []).map(projectName),
     insight.archived ? 'Archive' : null]
  : []

// Banner microcopy from the dataset (`archive-banner` row); {date} = publish date
const bannerText = (pageBySlug('archive-banner')?.description ?? 'From our archive: published {date}.')
  .replace('{date}', monthYear(insight?.publish_date ?? null))
</script>
