<template>
  <div>
    <div class="wrapper">
      <div class="cards-section cards-section--updates">
        <LegacyMoleculesCard
          v-for="(video, index) in videos"
          :key="index"
          :card="formatVideoAsCard(video)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVideos } from '~/composables/data/useVideos'
import LegacyMoleculesCard from '~/components/legacy/molecules/Card.vue'

definePageMeta({
  layout: 'legacy-base',
})

const { data: videosData } = useVideos()

const videos = computed(() => {
  return videosData.value?.items || []
})

const formatVideoAsCard = (video: any) => {
  return {
    theme: video.theme,
    heading: video.heading,
    subheading: video.subheading,
    excerpt: video.excerpt,
    video: {
      thumbnail: video.video?.thumbnail,
    },
    button: video.button,
  }
}

useHead({
  title: 'Videos | Bertelsmann Foundation',
})
</script>

