<template>
  <article class="article">
    <div class="wrapper">
      <LegacyMoleculesBreadcrumb
        v-if="video?.breadcrumbs"
        :breadcrumbs="video.breadcrumbs"
      />

      <header>
        <h1 v-if="video?.heading">{{ video.heading }}</h1>
        <h2 v-if="video?.subheading">{{ video.subheading }}</h2>
        <p v-if="video?.by_line" class="article__by-line">
          {{ video.by_line }}
        </p>
      </header>

      <div v-if="video?.video?.url" class="video-section wrapper">
        <figure class="video-section__frame">
          <iframe
            class="iframe-video"
            :src="video.video.url"
            frameborder="0"
            allowfullscreen
          ></iframe>
        </figure>
      </div>

      <div
        v-if="video?.content"
        class="article__content"
        v-html="video.content"
      ></div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { useVideos } from '~/composables/data/useVideos'
import LegacyMoleculesBreadcrumb from '~/components/legacy/molecules/Breadcrumb.vue'

definePageMeta({
  layout: 'legacy-base',
})

const route = useRoute()
const { data: videosData } = useVideos()

const video = computed(() => {
  if (!videosData.value?.items) return null
  const slug = route.params.slug as string
  return videosData.value.items.find(
    (v: any) => v.button?.url?.replace(/^\//, '').replace(/\/$/, '') === slug
  )
})

useHead({
  title: computed(() => {
    if (!video.value) return 'Video | Bertelsmann Foundation'
    return `${video.value.heading} | Bertelsmann Foundation`
  }),
  meta: [
    {
      name: 'description',
      content: computed(() => video.value?.excerpt || ''),
    },
  ],
})
</script>

