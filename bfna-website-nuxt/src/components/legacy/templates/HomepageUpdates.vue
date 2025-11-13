<template>
  <div class="tabs">
    <ul class="tabs__list">
      <li class="tabs__label">
        <a class="tabs__item" href="#publications" data-content="publications"
          >publications</a
        >
      </li>
      <li class="tabs__label">
        <a class="tabs__item" href="#videos" data-content="videos">videos</a>
      </li>
      <li class="tabs__label">
        <a class="tabs__item" href="#infographics" data-content="infographics"
          >infographics</a
        >
      </li>
      <li class="tabs__label">
        <a class="tabs__item" href="#podcasts" data-content="podcasts"
          >podcasts</a
        >
      </li>
    </ul>

    <div class="tabs__bar"></div>

    <section id="publications" class="tabs__panel">
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

    <section id="videos" class="tabs__panel">
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

    <section id="infographics" class="tabs__panel">
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

    <section id="podcasts" class="tabs__panel">
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
import LegacyMoleculesCard from '~/components/legacy/molecules/Card.vue'

const props = defineProps<{
  publications?: any
  videos?: any
  infographics?: any
  podcasts?: any
}>()

const publicationsCards = computed(() => {
  return props.publications?.homePageUpdates || []
})

const videosCards = computed(() => {
  return props.videos?.homePageUpdates || []
})

const infographicsCards = computed(() => {
  return props.infographics?.homePageUpdates || []
})

const podcastsCards = computed(() => {
  return props.podcasts?.homePageUpdates || []
})
</script>

