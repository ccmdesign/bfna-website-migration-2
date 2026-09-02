<template>
  <NuxtLayout name="wireframe">
    <template #hero>
      <!-- GGS hub template zone 1: intro framing the issue (dataset copy, Irene Jul 29) -->
      <wf-page-header
        v-if="area" label="Hub intro"
        :crumbs="[{ label: 'Home', to: '/wireframes' }, { label: 'Programs' }]"
        :heading="area.name" :tagline="paragraphs(area.intro)"
      >
        <!-- Button copy per Irene (Aug 5): "Explore our work" -->
        <div><NuxtLink to="#projects" class="wf-button" data-variant="primary">Explore our work</NuxtLink></div>
      </wf-page-header>
    </template>

    <template v-if="area">
      <!-- GGS hub template zone 2: related projects (active, on-site projects only —
           podcasts + external products are pruned out via gridProjectsByProgram) -->
      <wf-section id="projects" label="Projects in this area" heading="Projects">
        <wf-grid-projects :projects="projects" />
      </wf-section>

      <!-- The Transponder product band moved to the homepage (between Projects
           and Insights) — see pages/wireframes/index.vue. -->

      <!-- GGS hub template zone 3: recent insights (active tier only).
           Hidden on Future Leadership per Irene (Aug 5 widget thread, answered
           by Claudio Sep 1: "Remove Insights from the Future Leadership page"). -->
      <wf-section v-if="showInsights" label="Recent insights" heading="Insights">
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
const { programBySlug, programs, gridProjectsByProgram, activeByProgram, archivedCountByProgram, projectBySlug, paragraphs } = useWfContent()

const area = programBySlug(route.params.area as string)
const projects = area ? gridProjectsByProgram(area.name) : []
// Democracy hub: insights limited to 2026 releases (Irene, Aug 5 widget feedback —
// scoped to this hub only; other programs keep the full active tier)
const insights = area
  ? activeByProgram(area.name).filter(i => area.slug !== 'democracy' || (i.publish_date ?? '').startsWith('2026'))
  : []
// Future Leadership carries no Insights band (Irene Aug 5 → Claudio Sep 1)
const showInsights = area?.slug !== 'future-leadership'
const archivedCount = area ? archivedCountByProgram(area.name) : 0
const otherAreas = area ? programs().filter(a => a.slug !== area.slug) : []

const programName = (slug: string) => projectBySlug(slug)?.heading ?? slug
</script>
