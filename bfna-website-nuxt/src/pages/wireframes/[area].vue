<template>
  <div v-if="area" class="stack" data-gap="xl">
    <!-- GGS hub template zone 1: intro framing the issue -->
    <section class="wf-slot" data-label="Hub intro">
      <div class="center | stack" data-gap="s" style="padding-block: var(--space-l);">
        <nav aria-label="Breadcrumb"><NuxtLink to="/wireframes">Home</NuxtLink> / <span>Programs</span></nav>
        <h1>{{ area.name }}</h1>
        <!-- Intro from the consolidated dataset (Irene Jul 29 docx) -->
        <p v-for="p in paragraphs(area.intro)" :key="p.slice(0, 20)" data-measure="normal">{{ p }}</p>
        <div><NuxtLink to="#projects" class="wf-button" data-variant="primary">See how to get involved</NuxtLink></div>
      </div>
    </section>

    <!-- GGS hub template zone 2: related projects -->
    <section id="projects" class="wf-slot" data-label="Projects in this area">
      <div class="center | stack" data-gap="m">
        <h2>Projects</h2>
        <div class="grid" data-gap="m" style="grid-template-columns: repeat(2, 1fr);">
          <article v-for="p in projects" :key="p.slug" class="wf-card">
            <div v-if="kindLabel(p.kind) || p.external_url" class="cluster" data-gap="xs">
              <span v-if="kindLabel(p.kind)" class="wf-chip">{{ kindLabel(p.kind) }}</span>
              <span v-if="p.external_url" class="wf-chip">External platform</span>
            </div>
            <h3>{{ p.heading }}</h3>
            <p v-if="excerptFor(p)">{{ excerptFor(p) }}</p>
            <NuxtLink :to="`/wireframes/projects/${p.slug}`" class="wf-button">Explore {{ p.heading }}</NuxtLink>
          </article>
        </div>
      </div>
    </section>

    <!-- GGS hub template zone 3: recent insights (active tier only) -->
    <section class="wf-slot" data-label="Recent insights">
      <div class="center | stack" data-gap="m">
        <h2>Insights</h2>
        <div class="grid" data-min-width="m" data-gap="m">
          <article v-for="i in insights.slice(0, 9)" :key="i.slug" class="wf-card">
            <div class="cluster" data-gap="xs">
              <span class="wf-chip">{{ formatLabel(i.format) }}</span>
              <span v-for="ps in i.projects" :key="ps" class="wf-chip">{{ programName(ps) }}</span>
            </div>
            <h3><NuxtLink :to="`/wireframes/insights/${i.slug}`">{{ i.heading }}</NuxtLink></h3>
            <time>{{ monthYear(i.publish_date) }}</time>
          </article>
        </div>
        <div class="cluster" data-gap="s">
          <NuxtLink :to="`/wireframes/insights?area=${area.slug}`" class="wf-button">All {{ area.name }} insights ({{ insights.length }})</NuxtLink>
          <NuxtLink :to="`/wireframes/insights?area=${area.slug}&archive=1`" class="wf-button">Include archived ({{ archivedCount }}) →</NuxtLink>
        </div>
      </div>
    </section>

    <!-- Cross-navigation: keep topic explorers moving (GGS journey) -->
    <section class="wf-slot" data-label="Other programs">
      <div class="center | cluster" data-gap="m">
        <span>Also explore:</span>
        <NuxtLink v-for="o in otherAreas" :key="o.slug" :to="`/wireframes/${o.slug}`">{{ o.name }}</NuxtLink>
      </div>
    </section>
  </div>

  <div v-else class="center | stack" style="padding-block: var(--space-xl);">
    <h1>Unknown program</h1>
    <p><NuxtLink to="/wireframes">Back to wireframe home</NuxtLink></p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'wireframe' })

const route = useRoute()
const { programBySlug, programs, projectsByProgram, activeByProgram, archivedCountByProgram, projectBySlug, formatLabel, kindLabel, monthYear, plain, paragraphs } = useWfContent()

const area = programBySlug(route.params.area as string)
const projects = area ? projectsByProgram(area.name) : []
const insights = area ? activeByProgram(area.name) : []
const archivedCount = area ? archivedCountByProgram(area.name) : 0
const otherAreas = area ? programs().filter(a => a.slug !== area.slug) : []

const programName = (slug: string) => projectBySlug(slug)?.heading ?? slug

const excerptFor = (p: { excerpt: string | null, description: string | null }) => {
  const t = plain(p.excerpt ?? p.description)
  return t.length > 140 ? t.slice(0, 140).trimEnd() + '…' : t
}
</script>
