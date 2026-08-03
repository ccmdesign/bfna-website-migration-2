<template>
  <div class="stack" data-gap="xl">
    <wf-section label="Projects index" gap="s" padded>
      <nav aria-label="Breadcrumb"><NuxtLink to="/wireframes">Home</NuxtLink></nav>
      <h1>{{ indexPage?.heading ?? 'All Projects' }}</h1>
      <p v-if="indexPage?.description" data-measure="normal">{{ indexPage.description }}</p>
    </wf-section>

    <wf-section v-for="a in programs()" :key="a.slug" :label="a.name">
      <h2><NuxtLink :to="`/wireframes/${a.slug}`">{{ a.name }}</NuxtLink></h2>
      <div class="grid" data-min-width="s" data-gap="m">
        <wf-card-project v-for="p in projectsByProgram(a.name)" :key="p.slug" :project="p" :excerpt-length="120" />
      </div>
    </wf-section>

    <!-- Legacy items whose new program is unresolved (Q3) — kept visible -->
    <wf-section v-if="retag.length" label="Pending re-tag (Q3)" heading="Pending re-tag">
      <div class="grid" data-min-width="s" data-gap="m">
        <wf-card-project v-for="p in retag" :key="p.slug" :project="p" :excerpt-length="120" />
      </div>
    </wf-section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'wireframe' })

const { programs, projectsByProgram, projectsPendingRetag, pageBySlug } = useWfContent()
const indexPage = pageBySlug('projects')

const retag = projectsPendingRetag()
</script>
