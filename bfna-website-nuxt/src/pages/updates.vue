<template>
  <div>
    <LegacyMoleculesHero
      :hero="{
        heading: 'Updates',
        subheading: 'Here you\'ll find all our work in one place, from short articles to long reports, infographics, expert interviews, animated videos, and full-length documentaries.',
      }"
      theme="updates"
    />

    <div class="tabs">
      <ul class="tabs__list">
        <li class="tabs__label">
          <a class="tabs__item" href="#publications">publications</a>
        </li>
        <li class="tabs__label">
          <a class="tabs__item" href="#videos">videos</a>
        </li>
        <li class="tabs__label">
          <a class="tabs__item" href="#infographics">infographics</a>
        </li>
        <li class="tabs__label">
          <a class="tabs__item" href="#podcasts" data-content="podcasts">podcasts</a>
        </li>
      </ul>

      <div class="tabs__bar"></div>

      <section id="publications" class="tabs__panel">
        <UpdatesPageTab
          content-type="publications"
          :items="publicationsItems"
          :show-filters="true"
        />
      </section>

      <section id="videos" class="tabs__panel">
        <UpdatesPageTab
          content-type="videos"
          :items="videosItems"
          :show-filters="true"
        />
      </section>

      <section id="infographics" class="tabs__panel">
        <UpdatesPageTab
          content-type="infographics"
          :items="infographicsItems"
          :show-filters="true"
        />
      </section>

      <section id="podcasts" class="tabs__panel">
        <UpdatesPageTab
          content-type="podcasts"
          :items="podcastsItems"
          :show-filters="false"
        />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePublications } from '~/composables/data/usePublications'
import { useVideos } from '~/composables/data/useVideos'
import { useInfographics } from '~/composables/data/useInfographics'
import { usePodcasts } from '~/composables/data/usePodcasts'
import LegacyMoleculesHero from '~/components/legacy/molecules/Hero.vue'
import UpdatesPageTab from '~/components/templates/UpdatesPageTab.vue'

definePageMeta({
  layout: 'legacy-base',
})

const { data: publicationsData } = usePublications()
const { data: videosData } = useVideos()
const { data: infographicsData } = useInfographics()
const { data: podcastsData } = usePodcasts()

const publicationsItems = computed(() => {
  return publicationsData.value?.items || []
})

const videosItems = computed(() => {
  return videosData.value?.items || []
})

const infographicsItems = computed(() => {
  return infographicsData.value?.items || []
})

const podcastsItems = computed(() => {
  return podcastsData.value?.items || []
})

useHead({
  title: 'Updates | Bertelsmann Foundation',
})
</script>

