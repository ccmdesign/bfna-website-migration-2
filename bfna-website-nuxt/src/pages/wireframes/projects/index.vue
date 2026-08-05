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
      <ul class="grid" data-min-width="s" data-gap="m">
        <!-- Same filter as the program pages (Aug 4 mapping): active on-site
             projects only — podcasts, external products, archived rows drop out. -->
        <wf-card-project v-for="p in gridProjectsByProgram(a.name)" :key="p.slug" :project="p" :excerpt-length="120" />
      </ul>
    </wf-section>

    <!-- Legacy items whose new program is unresolved (Q3) — kept visible -->
    <wf-section v-if="retag.length" label="Pending re-tag (Q3)" heading="Pending re-tag">
      <ul class="grid" data-min-width="s" data-gap="m">
        <wf-card-project v-for="p in retag" :key="p.slug" :project="p" :excerpt-length="120" />
      </ul>
    </wf-section>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const { programs, gridProjectsByProgram, projectsPendingRetag, pageBySlug } = useWfContent()
const indexPage = pageBySlug('projects')

const retag = projectsPendingRetag()
</script>
