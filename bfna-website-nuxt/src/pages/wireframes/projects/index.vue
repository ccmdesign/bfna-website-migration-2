<template>
  <NuxtLayout name="wireframe">
    <template #hero>
      <wf-page-header
        label="Projects index" :crumbs="[{ label: 'Home', to: '/wireframes' }]"
        :heading="indexPage?.heading ?? 'All Projects'" :tagline="indexPage?.description"
      />
    </template>

    <wf-section v-for="a in programs()" :key="a.slug" :label="a.name">
      <h2><NuxtLink :to="`/wireframes/${a.slug}`">{{ a.name }}</NuxtLink></h2>
      <!-- Same filter AND same 2-col grid as the program pages (shared component). -->
      <wf-grid-projects :projects="gridProjectsByProgram(a.name)" :excerpt-length="120" />
    </wf-section>

    <!-- Legacy items whose new program is unresolved (Q3) — kept visible -->
    <wf-section v-if="retag.length" label="Pending re-tag (Q3)" heading="Pending re-tag">
      <wf-grid-projects :projects="retag" :excerpt-length="120" />
    </wf-section>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const { programs, gridProjectsByProgram, projectsPendingRetag, pageBySlug } = useWfContent()
const indexPage = pageBySlug('projects')

const retag = projectsPendingRetag()
</script>
