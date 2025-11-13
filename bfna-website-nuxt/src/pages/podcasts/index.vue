<template>
  <div>
    <div class="wrapper">
      <div class="cards-section cards-section--updates">
        <LegacyMoleculesCard
          v-for="(podcast, index) in podcasts"
          :key="index"
          :card="formatPodcastAsCard(podcast)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePodcasts } from '~/composables/data/usePodcasts'
import LegacyMoleculesCard from '~/components/legacy/molecules/Card.vue'

definePageMeta({
  layout: 'legacy-base',
})

const { data: podcastsData } = usePodcasts()

const podcasts = computed(() => {
  return podcastsData.value?.items || []
})

const formatPodcastAsCard = (podcast: any) => {
  return {
    theme: podcast.theme,
    heading: podcast.heading,
    subheading: podcast.subheading,
    excerpt: podcast.excerpt,
    button: podcast.button,
  }
}

useHead({
  title: 'Podcasts | Bertelsmann Foundation',
})
</script>

