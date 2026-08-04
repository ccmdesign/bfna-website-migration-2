<template>
  <NuxtLayout name="wireframe">
    <template #hero>
      <!-- GGS hub template zone 1: intro framing the issue (dataset copy, Irene Jul 29) -->
      <wf-page-header
        v-if="area" label="Hub intro"
        :crumbs="[{ label: 'Home', to: '/wireframes' }, { label: 'Programs' }]"
        :heading="area.name" :tagline="paragraphs(area.intro)"
      >
        <div><NuxtLink to="#projects" class="wf-button" data-variant="primary">See how to get involved</NuxtLink></div>
      </wf-page-header>
    </template>

    <template v-if="area">
      <!-- GGS hub template zone 2: related projects -->
      <wf-section id="projects" label="Projects in this area" heading="Projects">
        <ul class="grid" data-gap="m" style="grid-template-columns: repeat(2, 1fr);">
          <wf-card-project v-for="p in projects" :key="p.slug" :project="p" />
        </ul>
      </wf-section>

      <!-- GGS hub template zone 3: recent insights (active tier only) -->
      <wf-section label="Recent insights" heading="Insights">
        <wf-grid-insights :insights="insights.slice(0, 9)" :extra-chips="i => i.projects?.map(programName)" />
        <div class="cluster" data-gap="s">
          <NuxtLink :to="`/wireframes/insights?area=${area.slug}`" class="wf-button">All {{ area.name }} insights ({{ insights.length }})</NuxtLink>
          <NuxtLink :to="`/wireframes/insights?area=${area.slug}&archive=1`" class="wf-button">Include archived ({{ archivedCount }}) →</NuxtLink>
        </div>
      </wf-section>

      <!-- Cross-navigation: keep topic explorers moving (GGS journey) -->
      <wf-section label="Other programs" layout="cluster">
        <span>Also explore:</span>
        <NuxtLink v-for="o in otherAreas" :key="o.slug" :to="`/wireframes/${o.slug}`">{{ o.name }}</NuxtLink>
      </wf-section>
    </template>

    <div v-else class="center | stack" style="padding-block: var(--space-xl);">
      <h1>Unknown program</h1>
      <p><NuxtLink to="/wireframes">Back to wireframe home</NuxtLink></p>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const route = useRoute()
const { programBySlug, programs, projectsByProgram, activeByProgram, archivedCountByProgram, projectBySlug, paragraphs } = useWfContent()

const area = programBySlug(route.params.area as string)
const projects = area ? projectsByProgram(area.name) : []
const insights = area ? activeByProgram(area.name) : []
const archivedCount = area ? archivedCountByProgram(area.name) : 0
const otherAreas = area ? programs().filter(a => a.slug !== area.slug) : []

const programName = (slug: string) => projectBySlug(slug)?.heading ?? slug
</script>
