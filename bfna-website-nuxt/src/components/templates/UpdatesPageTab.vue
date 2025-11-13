<template>
  <div>
    <LegacyMoleculesSimpleFilters
      v-if="showFilters"
      :filters="filters"
      :content-type="contentType"
      @filter-change="handleFilterChange"
    />
    <div class="wrapper">
      <div class="cards-section cards-section--updates">
        <LegacyMoleculesCard
          v-for="(card, index) in filteredItems"
          :key="index"
          :card="card"
          :class="{ filtered: !card.shouldShow }"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUpdatesFilters } from '~/composables/legacy/useUpdatesFilters'
import LegacyMoleculesCard from '~/components/legacy/molecules/Card.vue'
import LegacyMoleculesSimpleFilters from '~/components/legacy/molecules/SimpleFilters.vue'

const props = defineProps<{
  contentType: 'publications' | 'videos' | 'infographics' | 'podcasts'
  items: any[]
  showFilters?: boolean
}>()

const filters = [
  { label: 'Democracy', value: 'democracy' },
  { label: 'Politics & Society', value: 'politics-society' },
  { label: 'Future Leadership', value: 'future-leadership' },
  { label: 'Digital World', value: 'digital-world' },
]

const updatesFilters = useUpdatesFilters()

const formatAsCard = (item: any) => {
  return {
    theme: item.theme,
    heading: item.heading,
    subheading: item.subheading,
    excerpt: item.excerpt,
    image: item.image,
    video: item.video,
    button: item.button,
    date: item.by_line || item.default_published,
    by_line: item.by_line,
  }
}

const cards = computed(() => {
  return props.items.map(formatAsCard)
})

const filteredItems = computed(() => {
  return cards.value.map((card, index) => ({
    ...card,
    shouldShow: updatesFilters.shouldShowCard(
      card.theme,
      index,
      props.contentType
    ),
  }))
})

const handleFilterChange = () => {
  // Cards will re-render automatically via computed properties
}

watch(
  () => updatesFilters.activeFilters.value,
  () => {
    // Trigger reactivity update when filters change
  },
  { deep: true }
)
</script>

