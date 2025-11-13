<template>
  <div>
    <div class="wrapper">
      <div class="cards-section cards-section--updates">
        <LegacyMoleculesCard
          v-for="(publication, index) in publicationsItems"
          :key="index"
          :card="formatPublicationAsCard(publication)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePublications } from '~/composables/data/usePublications'
import LegacyMoleculesCard from '~/components/legacy/molecules/Card.vue'

definePageMeta({
  layout: 'legacy-base',
})

const { data: publicationsData } = usePublications()

const publicationsItems = computed(() => {
  return publicationsData.value?.items || []
})

const formatPublicationAsCard = (publication: any) => {
  return {
    theme: publication.theme,
    heading: publication.heading,
    subheading: publication.subheading,
    excerpt: publication.excerpt,
    date: publication.by_line || publication.default_published,
    button: publication.button,
    by_line: publication.by_line,
  }
}

useHead({
  title: 'Publications | Bertelsmann Foundation',
})
</script>

