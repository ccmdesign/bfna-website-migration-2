<template>
  <div>
    <LegacyMoleculesHero
      v-if="homepageData?.hero"
      :hero="homepageData.hero"
      theme="default"
    />

    <div>
      <div v-if="newsData && newsData.length > 0" class="highlight-section">
        <h2>Highlights</h2>
        <div class="highlight-wrapper">
          <div class="wrapper">
            <div class="cards-section cards-section--updates">
              <LegacyMoleculesHighlightCard
                v-for="(newItem, index) in newsData"
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
import { useNews } from '~/composables/data/useNews'
import { usePublications } from '~/composables/data/usePublications'
import { useVideos } from '~/composables/data/useVideos'
import { useInfographics } from '~/composables/data/useInfographics'
import { usePodcasts } from '~/composables/data/usePodcasts'
import { useWorkstreams } from '~/composables/data/useWorkstreams'
import LegacyMoleculesHero from '~/components/legacy/molecules/Hero.vue'
import LegacyMoleculesHighlightCard from '~/components/legacy/molecules/HighlightCard.vue'
import LegacyMoleculesSplitSection from '~/components/legacy/molecules/SplitSection.vue'
import LegacyTemplatesHomepageUpdates from '~/components/legacy/templates/HomepageUpdates.vue'
import LegacyMoleculesDocCard from '~/components/legacy/molecules/DocCard.vue'

definePageMeta({
  layout: 'legacy-base',
})

const { data: newsData } = useNews()
const { data: publicationsData } = usePublications()
const { data: videosData } = useVideos()
const { data: infographicsData } = useInfographics()
const { data: podcastsData } = usePodcasts()
const { data: workstreamsData } = useWorkstreams()

// Homepage data structure - needs to be constructed from available data
const homepageData = computed(() => {
  return {
    hero: {
      heading: 'Transatlantic Perspectives on Global Challenges',
      subheading: 'We bring together experts, policymakers, and citizens to explore the most pressing issues facing the transatlantic community.',
      subheadingend: '',
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

// Docs data - placeholder for now, needs to be extracted from data
const docsData = computed(() => {
  // TODO: Extract docs data from publications or separate source
  return []
})
</script>
