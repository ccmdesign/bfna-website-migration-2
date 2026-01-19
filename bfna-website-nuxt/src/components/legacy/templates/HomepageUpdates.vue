<template>
  <div class="tabs">
    <ul class="tabs__list">
      <li class="tabs__label">
        <a class="tabs__item" href="#home-publications" data-content="publications"
          >publications</a
        >
      </li>
      <li class="tabs__label">
        <a class="tabs__item" href="#home-videos" data-content="videos">videos</a>
      </li>
      <li class="tabs__label">
        <a class="tabs__item" href="#home-infographics" data-content="infographics"
          >infographics</a
        >
      </li>
      <li class="tabs__label">
        <a class="tabs__item" href="#home-podcasts" data-content="podcasts"
          >podcasts</a
        >
      </li>
    </ul>

    <div class="tabs__bar"></div>

    <section id="home-publications" class="tabs__panel">
      <div class="wrapper">
        <div class="cards-section cards-section--updates">
          <LegacyMoleculesCard
            v-for="(card, index) in publicationsCards"
            :key="index"
            :card="card"
          />
        </div>
      </div>
    </section>

    <section id="home-videos" class="tabs__panel">
      <div class="wrapper">
        <div class="cards-section cards-section--updates">
          <LegacyMoleculesCard
            v-for="(card, index) in videosCards"
            :key="index"
            :card="card"
          />
        </div>
      </div>
    </section>

    <section id="home-infographics" class="tabs__panel">
      <div class="wrapper">
        <div class="cards-section cards-section--updates">
          <LegacyMoleculesCard
            v-for="(card, index) in infographicsCards"
            :key="index"
            :card="card"
          />
        </div>
      </div>
    </section>

    <section id="home-podcasts" class="tabs__panel">
      <div class="wrapper">
        <div class="cards-section cards-section--updates">
          <LegacyMoleculesCard
            v-for="(card, index) in podcastsCards"
            :key="index"
            :card="card"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useTabs } from '~/composables/legacy/useTabs'
import LegacyMoleculesCard from '~/components/legacy/molecules/Card.vue'

const props = defineProps<{
  publications?: any
  videos?: any
  infographics?: any
  podcasts?: any
}>()

const tabs = useTabs()

const publicationsCards = computed(() => {
  return props.publications || []
})

const videosCards = computed(() => {
  return props.videos || []
})

const infographicsCards = computed(() => {
  return props.infographics || []
})

const podcastsCards = computed(() => {
  return props.podcasts || []
})

onMounted(() => {
  tabs.initializeTabs()
})
</script>

