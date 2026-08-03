<template>
  <div v-if="project" class="stack" data-gap="xl">
    <!-- GGS project template zone 1: overview -->
    <section class="wf-slot" data-label="Project overview">
      <div class="center | stack" data-gap="s" style="padding-block: var(--space-l);">
        <nav aria-label="Breadcrumb">
          <NuxtLink to="/wireframes">Home</NuxtLink> /
          <NuxtLink to="/wireframes/projects"><span>Projects</span></NuxtLink>
        </nav>
        <div class="cluster" data-gap="xs">
          <span class="wf-chip">Project</span>
          <span v-if="kindLabel(project.kind)" class="wf-chip">{{ kindLabel(project.kind) }}</span>
          <span v-if="project.program" class="wf-chip">{{ project.program }}</span>
          <span v-if="project.pending" class="wf-chip">Copy pending {{ project.pending }}</span>
        </div>
        <h1>{{ project.heading }}</h1>
        <img v-if="project.image" :src="project.image" :alt="project.heading" style="aspect-ratio: 21/9; width: 100%; object-fit: cover;">
        <div v-else class="wf-media" style="--wf-ratio: 21/9;" />
        <!-- Overview: dataset description (Irene Jul 29 docx), falls back to CMS excerpt -->
        <p v-for="para in overview" :key="para.slice(0, 20)" data-measure="normal">{{ para }}</p>
      </div>
    </section>

    <!-- Microsite CTA (thin-page pattern, Q4 resolved: page + external CTA) -->
    <section v-if="project.external_url" class="wf-slot" data-label="Microsite CTA">
      <div class="center | stack" data-gap="s">
        <h2>Explore the full project</h2>
        <p v-if="project.microsite_cta" data-measure="normal">{{ project.microsite_cta }}</p>
        <p><a :href="project.external_url" class="wf-button" data-variant="primary" data-external>Visit {{ project.heading }}</a></p>
      </div>
    </section>

    <!-- GGS project template zone 2: participation path -->
    <section class="wf-slot" data-label="Participation path">
      <div class="center | stack" data-gap="s">
        <h2>{{ participation.title }}</h2>
        <div class="cluster" data-gap="s">
          <a v-for="cta in participation.ctas" :key="cta" href="#" class="wf-button" :data-variant="cta === participation.ctas[0] ? 'primary' : undefined">{{ cta }}</a>
        </div>
      </div>
    </section>

    <!-- Cohort/year pages nested under this project (parent_project, real data) -->
    <section v-if="cohorts.length" class="wf-slot" data-label="Outcomes / alumni">
      <div class="center | stack" data-gap="m">
        <h2>The Fellows</h2>
        <p data-measure="narrow">{{ cohorts.length }} cohort pages nested under this project.</p>
        <div class="cluster" data-gap="xs">
          <a v-for="c in cohorts" :key="c.slug" href="#" class="wf-chip">{{ c.heading }}</a>
        </div>
      </div>
    </section>

    <!-- GGS project template zone: related content (real M2M via programs field) -->
    <section class="wf-slot" data-label="Related insights">
      <div class="center | stack" data-gap="m">
        <h2>From {{ project.heading }}</h2>
        <div v-if="related.length" class="grid" data-min-width="m" data-gap="m">
          <article v-for="i in related.slice(0, 6)" :key="i.slug" class="wf-card">
            <div class="cluster" data-gap="xs">
              <span class="wf-chip">{{ formatLabel(i.format) }}</span>
            </div>
            <h3><NuxtLink :to="`/wireframes/insights/${i.slug}`">{{ i.heading }}</NuxtLink></h3>
            <time>{{ monthYear(i.publish_date) }}</time>
          </article>
        </div>
      </div>
    </section>
  </div>

  <div v-else class="center | stack" style="padding-block: var(--space-xl);">
    <h1>Unknown project</h1>
    <p><NuxtLink to="/wireframes/projects">All projects</NuxtLink></p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'wireframe' })

const route = useRoute()
const { projectBySlug, projectChildren, insightsForProject, formatLabel, kindLabel, monthYear, plain, paragraphs } = useWfContent()

const project = projectBySlug(route.params.slug as string)

const overview = project
  ? (project.description ? paragraphs(project.description) : [plain(project.excerpt)].filter(Boolean))
  : []

// Copy drafts live as feedback comments; wireframe shows title + CTAs only
const participation = project?.slug === 'the-bertelsmann-foundation-fellowship'
  ? { title: 'Become a Fellow', ctas: ['Apply for the next cohort', 'Nominate a candidate'] }
  : project?.external_url
    ? { title: 'Use the platform', ctas: [`Open ${project.heading}`, 'Subscribe for updates'] }
    : { title: 'Follow this project', ctas: ['Subscribe for updates', 'Read the latest'] }

const cohorts = project ? projectChildren(project.slug) : []
const related = project ? insightsForProject(project.slug) : []
</script>
