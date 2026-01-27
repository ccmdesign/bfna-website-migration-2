<template>
  <div>
    <LegacyMoleculesHero
      v-if="homepageData?.hero"
      :hero="homepageData.hero"
      theme="default"
    />

    <div>
      <div v-if="highlightsData && highlightsData.length > 0" class="highlight-section">
        <h2>Highlights</h2>
        <div class="highlight-wrapper">
          <div class="wrapper">
            <div class="cards-section cards-section--updates">
              <LegacyMoleculesHighlightCard
                v-for="(newItem, index) in highlightsData"
                :key="index"
                :new-item="newItem"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div>
      <h2 class="thematicareas-title">Thematic Areas</h2>
      <LegacyMoleculesSplitSection
        v-if="workstreamsData?.democracy"
        :workstream="workstreamsData.democracy"
      />
      <LegacyMoleculesSplitSection
        v-if="workstreamsData?.['politics-society']"
        :workstream="workstreamsData['politics-society']"
      />
      <LegacyMoleculesSplitSection
        v-if="workstreamsData?.['future-leadership']"
        :workstream="workstreamsData['future-leadership']"
      />
      <LegacyMoleculesSplitSection
        v-if="workstreamsData?.['digital-world']"
        :workstream="workstreamsData['digital-world']"
      />
    </div>
    
    <div>
      <h2 class="updates-title">Updates</h2>
      <div class="updates-wrapper">
        <LegacyTemplatesHomepageUpdates
          :publications="publicationsData"
          :videos="videosData"
          :infographics="infographicsData"
          :podcasts="podcastsData"
        />
      </div>

      <div class="homepage-updates-button-section">
        <div style="width: max-content; margin: auto;">
          <a href="/updates" class="button more-updates--button">More Updates</a>
        </div>
      </div>
    </div>
    <div>
      <div v-if="docsData && docsData.length > 0">
        <h2 class="updates-title">BFNA Docs Highlights</h2>
        <div class="wrapper">
          <div class="docs-wrapper cards-section cards-section--updates">
            <LegacyMoleculesDocCard
              v-for="(card, index) in docsData"
              :key="index"
              :card="card"
            />
          </div>
        </div>
      </div>
      <div class="homepage-docs-button-section">
        <div style="width: max-content; margin: auto;">
          <a
            target="_blank"
            href="https://bfnadocs.org/"
            class="button more-docs--button"
            >More Docs</a
          >
        </div>
      </div>
    </div>

    <input id="cookie-trigger" type="checkbox" />
    <div class="floating-message">
      <div class="wrapper">
        <div class="floating-message__content">
          <p>
            We use cookies to ensure you get the best experience on our
            website.
            <a class="link" href="/privacy-policy">More information</a>
          </p>
          <label for="cookie-trigger"
            ><i class="material-icons">close</i></label
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useHighlights } from '~/composables/data/useHighlights'
import { useWorkstreams } from '~/composables/data/useWorkstreams'
import { useHomePublications } from '~/composables/data/useHomePublications'
import { useHomeVideos } from '~/composables/data/useHomeVideos'
import { useHomeInfographics } from '~/composables/data/useHomeInfographics'
import { useHomePodcasts } from '~/composables/data/useHomePodcasts'
import { useHomeDocs } from '~/composables/data/useHomeDocs'
import LegacyMoleculesHero from '~/components/legacy/molecules/Hero.vue'
import LegacyMoleculesHighlightCard from '~/components/legacy/molecules/HighlightCard.vue'
import LegacyMoleculesSplitSection from '~/components/legacy/molecules/SplitSection.vue'
import LegacyTemplatesHomepageUpdates from '~/components/legacy/templates/HomepageUpdates.vue'
import LegacyMoleculesDocCard from '~/components/legacy/molecules/DocCard.vue'

definePageMeta({
  layout: 'legacy-base',
})

const highlightsData = await useHighlights()
const { data: workstreamsData } = useWorkstreams()
const publicationsData = useHomePublications()
const videosData = useHomeVideos()
const infographicsData = useHomeInfographics()
const podcastsData = useHomePodcasts()
const docsData = useHomeDocs()

// Homepage data structure - needs to be constructed from available data
const homepageData = computed(() => {
  return {
    hero: {
      heading: 'Transatlantic Perspectives on Global Challenges',
      subheading: 'Engaging both sides of the Atlantic with ',
      subheadingend: 'stories, resources, and ideas.',
    },
  }
})

// Set page meta for layout
useHead({
  title: 'Bertelsmann Foundation | Transatlantic Perspectives on Global Challenges',
  meta: [
    {
      property: 'og:image',
      content: '/images/bfna-og.jpg',
    },
    {
      name: 'description',
      content: homepageData.value.hero.subheading,
    },
  ],
})

</script>
