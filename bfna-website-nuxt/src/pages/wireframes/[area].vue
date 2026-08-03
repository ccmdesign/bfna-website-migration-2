<template>
  <div v-if="area" class="stack" data-gap="xl">
    <!-- GGS hub template zone 1: intro framing the issue -->
    <wf-section label="Hub intro" gap="s" padded>
      <nav aria-label="Breadcrumb"><NuxtLink to="/wireframes">Home</NuxtLink> / <span>Programs</span></nav>
      <h1>{{ area.name }}</h1>
      <!-- Intro from the consolidated dataset (Irene Jul 29 docx) -->
      <p v-for="p in paragraphs(area.intro)" :key="p.slice(0, 20)" data-measure="normal">{{ p }}</p>
      <div><NuxtLink to="#projects" class="wf-button" data-variant="primary">See how to get involved</NuxtLink></div>
    </wf-section>

    <!-- GGS hub template zone 2: related projects -->
    <wf-section id="projects" label="Projects in this area" heading="Projects">
      <div class="grid" data-gap="m" style="grid-template-columns: repeat(2, 1fr);">
        <wf-card-project v-for="p in projects" :key="p.slug" :project="p" />
      </div>
    </wf-section>

    <!-- GGS hub template zone 3: recent insights (active tier only) -->
    <wf-section label="Recent insights" heading="Insights">
      <div class="grid" data-min-width="m" data-gap="m">
        <wf-card-insight
          v-for="i in insights.slice(0, 9)" :key="i.slug" :insight="i"
          :extra-chips="i.projects?.map(programName)"
        />
      </div>
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
  </div>

  <div v-else class="center | stack" style="padding-block: var(--space-xl);">
    <h1>Unknown program</h1>
    <p><NuxtLink to="/wireframes">Back to wireframe home</NuxtLink></p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'wireframe' })

const route = useRoute()
const { programBySlug, programs, projectsByProgram, activeByProgram, archivedCountByProgram, projectBySlug, paragraphs } = useWfContent()

const area = programBySlug(route.params.area as string)
const projects = area ? projectsByProgram(area.name) : []
const insights = area ? activeByProgram(area.name) : []
const archivedCount = area ? archivedCountByProgram(area.name) : 0
const otherAreas = area ? programs().filter(a => a.slug !== area.slug) : []

const programName = (slug: string) => projectBySlug(slug)?.heading ?? slug
</script>
