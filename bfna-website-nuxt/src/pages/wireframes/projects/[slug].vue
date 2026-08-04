<template>
  <NuxtLayout name="wireframe">
    <template #hero>
      <!-- Hero headings: shared across both templates; external gets the intro as tagline -->
      <wf-page-header
        v-if="project && project.external_url"
        label="Project overview (external)" :crumbs="crumbs" :chips="chips"
        :heading="project.heading" :tagline="overview"
      />
      <wf-page-header v-else-if="project" label="Project overview" :crumbs="crumbs" :chips="chips" :heading="project.heading">
        <wf-media :src="project.image" :alt="project.heading" ratio="21/9" />
      </wf-page-header>
    </template>

    <!-- EXTERNAL project: compact template — intro + callout guiding users to the
         microsite (thin-page pattern, Q4 resolved: page + external CTA). -->
    <template v-if="project && project.external_url">
      <wf-cta-section
        label="Microsite CTA"
        heading="Explore the full project" :message="project.microsite_cta ?? undefined"
        :ctas="[{ label: `Visit ${project.heading}`, href: project.external_url, external: true }]"
      />

      <!-- GGS project template zone 2: participation path (copy from projects.json) -->
      <wf-cta-section
        label="Participation path" :heading="participation.title"
        :ctas="participation.ctas.map(label => ({ label }))"
      />

      <wf-section label="Related insights" :heading="`From ${project.heading}`">
        <wf-grid-insights v-if="related.length" :insights="related.slice(0, 6)" />
      </wf-section>
    </template>

    <!-- FULL project template: content body + participation + cohorts + related -->
    <template v-else-if="project">
      <!-- Content body: dataset description (Irene Jul 29 docx), falls back to CMS excerpt -->
      <wf-section label="Project body" measure="narrow">
        <wf-prose :content="project.description ?? plain(project.excerpt)" />
      </wf-section>

      <!-- GGS project template zone 2: participation path (copy from projects.json) -->
      <wf-cta-section
        label="Participation path" :heading="participation.title"
        :ctas="participation.ctas.map(label => ({ label }))"
      />

      <!-- Cohort/year pages nested under this project (parent_project, real data) -->
      <wf-section v-if="cohorts.length" label="Outcomes / alumni" heading="The Fellows">
        <p data-measure="narrow">{{ cohorts.length }} cohort pages nested under this project.</p>
        <div class="cluster" data-gap="xs">
          <wf-chip v-for="c in cohorts" :key="c.slug" href="#">{{ c.heading }}</wf-chip>
        </div>
      </wf-section>

      <!-- GGS project template zone: related content (real M2M via programs field) -->
      <wf-section label="Related insights" :heading="`From ${project.heading}`">
        <wf-grid-insights v-if="related.length" :insights="related.slice(0, 6)" />
      </wf-section>
    </template>

    <div v-else class="center | stack" style="padding-block: var(--space-xl);">
      <h1>Unknown project</h1>
      <p><NuxtLink to="/wireframes/projects">All projects</NuxtLink></p>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const route = useRoute()
const { projectBySlug, projectChildren, insightsForProject, kindLabel, plain, paragraphs } = useWfContent()

const project = projectBySlug(route.params.slug as string)

const crumbs = [
  { label: 'Home', to: '/wireframes' },
  { label: 'Projects', to: '/wireframes/projects' }
]
const chips = project
  ? ['Project', kindLabel(project.kind), project.program, project.pending ? `Copy pending ${project.pending}` : null]
  : []

const overview = project
  ? (project.description ? paragraphs(project.description) : [plain(project.excerpt)].filter(Boolean))
  : []

// Participation draft copy lives in projects.json (`participation` field, Aug 3)
const participation = project?.participation
  ?? { title: 'Follow this project', ctas: ['Subscribe for updates', 'Read the latest'] }

const cohorts = project ? projectChildren(project.slug) : []
const related = project ? insightsForProject(project.slug) : []
</script>
