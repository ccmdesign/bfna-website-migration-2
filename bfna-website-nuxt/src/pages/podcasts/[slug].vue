<template>
  <article class="article">
    <div class="wrapper">
      <LegacyMoleculesBreadcrumb
        v-if="podcast?.breadcrumbs"
        :breadcrumbs="podcast.breadcrumbs"
      />

      <header>
        <h1 v-if="podcast?.heading">{{ podcast.heading }}</h1>
        <h2 v-if="podcast?.subheading">{{ podcast.subheading }}</h2>
      </header>

      <div
        v-if="podcast?.excerpt"
        class="article__content"
        v-html="podcast.excerpt"
      ></div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { usePodcasts } from '~/composables/data/usePodcasts'
import LegacyMoleculesBreadcrumb from '~/components/legacy/molecules/Breadcrumb.vue'

definePageMeta({
  layout: 'legacy-base',
})

const route = useRoute()
const { data: podcastsData } = usePodcasts()

const podcast = computed(() => {
  if (!podcastsData.value?.items) return null
  const slug = route.params.slug as string
  return podcastsData.value.items.find(
    (p: any) => p.button?.url?.replace(/^\//, '').replace(/\/$/, '') === slug
  )
})

useHead({
  title: computed(() => {
    if (!podcast.value) return 'Podcast | Bertelsmann Foundation'
    return `${podcast.value.heading} | Bertelsmann Foundation`
  }),
  meta: [
    {
      name: 'description',
      content: computed(() => podcast.value?.excerpt || ''),
    },
  ],
})
</script>

