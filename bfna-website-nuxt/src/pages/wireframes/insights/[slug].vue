<template>
  <div v-if="insight" class="stack" data-gap="xl">
    <!-- GGS: standardized structure — same things in the same places, on every insight -->
    <wf-section label="Insight header" gap="s" padded>
      <nav aria-label="Breadcrumb">
        <NuxtLink to="/wireframes">Home</NuxtLink> /
        <NuxtLink to="/wireframes/insights">Insights</NuxtLink>
      </nav>
      <div class="cluster" data-gap="xs">
        <span class="wf-chip">{{ formatLabel(insight.format) }}</span>
        <span v-if="insight.program" class="wf-chip">{{ insight.program }}</span>
        <span v-for="ps in insight.projects" :key="ps" class="wf-chip">{{ programName(ps) }}</span>
        <span v-if="insight.archived" class="wf-chip">Archive</span>
      </div>
      <h1>{{ insight.heading }}</h1>
      <p v-if="insight.subheading"><strong>{{ insight.subheading }}</strong></p>
      <p class="cluster" data-gap="s">
        <span v-if="insight.authors?.length">By {{ insight.authors.join(', ') }}</span>
        <span v-else>By [author]</span>
        <time>{{ monthYear(insight.publish_date) }}</time>
      </p>
    </wf-section>

    <!-- Archive banner (GGS: archived stays live + indexed, but labeled) -->
    <wf-section v-if="insight.archived" label="Archive banner" layout="plain">
      <p class="wf-note">{{ bannerText }} <a href="#">See recent work on {{ insight.program }}</a></p>
    </wf-section>

    <!-- Body -->
    <wf-section label="Body" measure="narrow">
      <p><em>{{ plain(insight.excerpt) }}</em></p>
      <wf-media :src="insight.image" :alt="insight.heading ?? ''" ratio="16/9" />
      <!-- Real body from the consolidated dataset when present -->
      <p v-for="para in bodyParas" :key="para.slice(0, 24)">{{ para }}</p>
      <p v-if="insight.download"><a :href="'#'" class="wf-button">Download the report (PDF)</a></p>
    </wf-section>

    <!-- GGS: machine-readable relationships + onward journey -->
    <wf-section label="Related insights" :heading="`More on ${insight.program}`">
      <div class="grid" data-min-width="m" data-gap="m">
        <wf-card-insight v-for="i in related" :key="i.slug" :insight="i" />
      </div>
    </wf-section>

    <!-- Conversion slot -->
    <wf-section label="Subscribe CTA" layout="cluster" gap="s">
      <span>Subscribe to receive our updates &amp; newsletters</span>
      <NuxtLink to="/wireframes/#subscribe" class="wf-button" data-variant="primary">Subscribe</NuxtLink>
    </wf-section>
  </div>

  <div v-else class="center | stack" style="padding-block: var(--space-xl);">
    <h1>Insight not found in content.json</h1>
    <p><NuxtLink to="/wireframes">Back to wireframe home</NuxtLink></p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'wireframe' })

const route = useRoute()
const { bySlug, activeByProgram, projectBySlug, pageBySlug, formatLabel, monthYear, plain } = useWfContent()

const insight = bySlug(route.params.slug as string)
const related = insight?.program
  ? activeByProgram(insight.program).filter(i => i.slug !== insight.slug).slice(0, 3)
  : []

const programName = (slug: string) => projectBySlug(slug)?.heading ?? slug

// Banner microcopy from the dataset (`archive-banner` row); {date} = publish date
const bannerText = (pageBySlug('archive-banner')?.description ?? 'From our archive: published {date}.')
  .replace('{date}', monthYear(insight?.publish_date ?? null))

// First paragraphs of the real markdown body; slot marker when body is absent
const bodyParas = (() => {
  const body = plain(insight?.content).replace(/^#+ /gm, '')
  if (!body) return ['[body copy]']
  const paras = body.split(/\n+/).filter(p => p.trim().length > 40)
  return paras.slice(0, 4).concat(paras.length > 4 ? ['[… full article body renders here]'] : [])
})()
</script>
