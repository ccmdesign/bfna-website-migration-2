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
      <!-- GGS hub template zone 2: related projects (active, on-site projects only —
           podcasts + external products are pruned out via gridProjectsByProgram) -->
      <wf-section id="projects" label="Projects in this area" heading="Projects">
        <ul class="grid" data-gap="m" style="grid-template-columns: repeat(2, 1fr);">
          <wf-card-project v-for="p in projects" :key="p.slug" :project="p" />
        </ul>
      </wf-section>

      <!-- Distinct PRODUCT band(s): external-only offerings within the program
           (e.g. The Transponder), rendered separately from the project grid.
           Data-driven via `external_only`; only appears when a program has one. -->
      <wf-section
        v-for="prod in products" :key="prod.slug"
        :label="`Product — ${prod.heading}`" :heading="prod.heading"
      >
        <div class="switcher" data-gap="m">
          <div class="stack" data-gap="s">
            <p v-if="prod.excerpt || prod.description" data-measure="normal">
              {{ productBlurb(prod) }}
            </p>
            <div class="cluster" data-gap="s">
              <a
                v-if="prod.external_url"
                :href="prod.external_url" class="wf-button" data-variant="primary" data-external="true"
              >Visit {{ prod.heading }} ↗</a>
              <!-- external_url pending (Q6): no fabricated link — status note per the
                   wireframe "Copy pending Qx" convention. -->
              <span v-else class="wf-chip">External link pending {{ prod.pending ?? 'Q6' }}</span>
            </div>
          </div>
          <wf-media v-if="prod.image" :src="prod.image" alt="" ratio="3/2" />
        </div>
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
const { programBySlug, programs, gridProjectsByProgram, productsByProgram, activeByProgram, archivedCountByProgram, projectBySlug, paragraphs, plain } = useWfContent()

const area = programBySlug(route.params.area as string)
const projects = area ? gridProjectsByProgram(area.name) : []
const products = area ? productsByProgram(area.name) : []
const insights = area ? activeByProgram(area.name) : []
const archivedCount = area ? archivedCountByProgram(area.name) : 0
const otherAreas = area ? programs().filter(a => a.slug !== area.slug) : []

const programName = (slug: string) => projectBySlug(slug)?.heading ?? slug

// Product blurb: real dataset copy, trimmed to the lead sentence so trailing
// markdown links in the raw excerpt don't leak into the wireframe.
const productBlurb = (p: { excerpt: string | null, description: string | null }) => {
  const t = plain(p.excerpt ?? p.description)
  return t.length > 220 ? t.slice(0, 220).trimEnd() + '…' : t
}
</script>
